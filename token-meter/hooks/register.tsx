import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren } from 'claude-code'

import type { LastStep, Measure, ModelTotals, Suggestion, Tab, TaskKind } from '../types'
import { advise, classify } from './advisor'
import { ring, tone } from './charts'

const PANE = 'token-meter'
const RAIL = 'token-meter-rail'
const TITLE = 'Tokens & Modelos'

const totals = atom({ plugin: 'token-meter', key: 'totals' } as const, [], { shape: 'totals-1' })
const last = atom({ plugin: 'token-meter', key: 'last' } as const, null, { shape: 'last-1' })
const measure = atom({ plugin: 'token-meter', key: 'measure' } as const, null, { shape: 'measure-1' })
const tab = atom({ plugin: 'token-meter', key: 'tab' } as const, 'uso' as Tab)
const showDetails = atom({ plugin: 'token-meter', key: 'showDetails' } as const, false)
const taskKind = atom({ plugin: 'token-meter', key: 'taskKind' } as const, 'normal' as TaskKind)
const suggestion = atom({ plugin: 'token-meter', key: 'suggestion' } as const, null, { shape: 'suggestion-2' })

const fmt = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`

const usd = (n: number | null): string => (n === null ? '—' : `$${n.toFixed(n < 1 ? 3 : 2)}`)


// Tabela cacheada da referência da API (2026-11-03). Preços da API por 1M tokens.
// No plano de assinatura do Claude você não paga por token: aí o que importa é o limite de uso.
const MODELS: { name: string; id: string; price: string; use: string; avoid: string }[] = [
  {
    name: 'Fable 5.2',
    id: 'claude-fable-5-2',
    price: '$8 in / $40 out',
    use: 'O mais capaz. Arquitetura difícil, bug cabeludo, tarefa longa e autônoma onde errar custa caro.',
    avoid: 'Coisa rotineira: queima limite/dinheiro ~2x o Opus e é mais lento.',
  },
  {
    name: 'Opus 5.5',
    id: 'claude-opus-5-5',
    price: '$4 in / $20 out',
    use: 'Padrão para trabalho sério: código multi-arquivo, refatoração, planejamento, análise.',
    avoid: 'Perguntas rápidas e tarefas mecânicas em massa.',
  },
  {
    name: 'Sonnet 5.5',
    id: 'claude-sonnet-5-5',
    price: '$2 in / $10 out',
    use: 'Dia a dia: features pequenas/médias, edição, revisão, chat técnico. Metade do preço do Opus.',
    avoid: 'Problema que já falhou uma vez no Sonnet: suba de modelo em vez de insistir.',
  },
  {
    name: 'Haiku 5.5',
    id: 'claude-haiku-5-5',
    price: '$0.10 in / $0.50 out (até 100k de prompt; acima: $0.50 / $2.50)',
    use: 'Volume e velocidade: classificar, extrair, resumir, subagentes de leitura.',
    avoid: 'Raciocínio de várias etapas ou decisão de design.',
  },
]

const EFFORTS: { level: string; when: string }[] = [
  { level: 'low', when: 'Chat, perguntas factuais, subagentes, edições triviais. Menos tool calls, respostas secas.' },
  { level: 'medium', when: 'Padrão do Opus 5.5 e do Haiku 5.5. Bom para código agêntico rotineiro.' },
  { level: 'high', when: 'Padrão do Sonnet 5.5. Mínimo para trabalho sensível a inteligência; ponto doce de custo x qualidade.' },
  { level: 'xhigh', when: 'Código difícil e tarefas longas. No Fable 5.2, só se você MEDIU ganho sobre high.' },
  { level: 'max', when: 'Quando acertar importa mais que tempo e tokens. Raramente compensa.' },
]

const RULES: string[] = [
  'Antes de trocar de modelo, tente o mesmo modelo com esforço maior (ou menor): costuma bastar.',
  'Meça custo por tarefa concluída, não por requisição: barato que precisa de 3 tentativas sai caro.',
  'Trocar de modelo no meio da conversa perde o cache: a próxima requisição paga o contexto inteiro.',
  'Cache read alto no painel = bom. Se ficar perto de zero, algo está invalidando o cache.',
  'Contexto acima de ~80%: rode /compact ou comece outra sessão antes que a qualidade caia.',
  'O custo mostrado é estimativa do /cost, não a fatura.',
]

// Paleta nativa: 'claude' é o acento; warning/error só quando há o que avisar, sempre com ícone e texto.
const level = (pct: number, warn: number, bad: number): 'claude' | 'warning' | 'error' =>
  pct >= bad ? 'error' : pct >= warn ? 'warning' : 'claude'
const dots = (i: number, n = 5): string => '●'.repeat(i + 1) + '○'.repeat(n - i - 1)

const shortModel = (id: string): string =>
  id.replace(/^claude-/, '').replace(/-(\d+)-(\d+)$/, ' $1.$2').replace(/-(\d+)$/, ' $1')
const limitName = (kind: string): string =>
  kind === 'five_hour' ? '5 horas' : kind === 'seven_day' ? 'Semana' : kind === 'spend_limit' ? 'Gasto' : kind

type Sum = { input: number; output: number; cacheRead: number; cacheWrite: number; requests: number }
const summarize = (all: readonly ModelTotals[]): Sum =>
  all.reduce(
    (a, t) => ({ input: a.input + t.input, output: a.output + t.output, cacheRead: a.cacheRead + t.cacheRead, cacheWrite: a.cacheWrite + t.cacheWrite, requests: a.requests + t.requests }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, requests: 0 },
  )
const cacheHit = (s: Sum): number | null => {
  const all = s.input + s.cacheRead + s.cacheWrite
  return all > 0 ? Math.round((s.cacheRead / all) * 100) : null
}
const statusLine = (m: Measure | null, s: Sum): string => {
  const ctx = m?.contextPercent != null ? `ctx ${Math.round(m.contextPercent)}% · ` : ''
  return `${ctx}out ${fmt(s.output)} · ${usd(m?.costUsd ?? null)}`
}

/** Uma frase que resume a situação: o que ler primeiro. */
const verdict = (m: Measure | null, hit: number | null, volume = 0): { icon: string; text: string; color: 'claude' | 'warning' | 'error' } => {
  const pct = m?.contextPercent ?? null
  const worst = m?.limits.slice().sort((a, b) => b.percentUsed - a.percentUsed)[0]
  if (pct !== null && pct >= 80) return { icon: '⛔', text: `Contexto em ${Math.round(pct)}%: rode /compact ou abra outra sessão`, color: 'error' }
  if (worst && worst.percentUsed >= 85) return { icon: '⛔', text: `Limite de ${limitName(worst.kind)} em ${Math.round(worst.percentUsed)}%: troque para um modelo menor`, color: 'error' }
  if (pct !== null && pct >= 60) return { icon: '⚠', text: `Contexto em ${Math.round(pct)}%: vá pensando em compactar`, color: 'warning' }
  if (worst && worst.percentUsed >= 60) return { icon: '⚠', text: `Limite de ${limitName(worst.kind)} em ${Math.round(worst.percentUsed)}%`, color: 'warning' }
  // Só depois de volume suficiente: as primeiras requisições sempre escrevem o cache.
  if (hit !== null && volume > 50_000 && hit < 40) return { icon: '⚠', text: `Cache acertando só ${hit}%: algo está invalidando o cache`, color: 'warning' }
  return { icon: '✓', text: 'Tudo tranquilo', color: 'claude' }
}

// Sugestão atual; antes do primeiro pedido classificado, avalia a última requisição.
async function currentTip($: EngineInterface): Promise<Suggestion | null> {
  const tip = await read($, suggestion)
  if (tip) return tip
  const lastStep = await read($, last)
  if (!lastStep || lastStep.isSubagent) return null
  const m = await read($, measure)
  return advise(await read($, taskKind), lastStep.model, lastStep.effort === 'padrão' ? undefined : lastStep.effort, m?.contextTokens ?? 0)
}

const RAIL_TITLE = 'Tokens'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'tokens', description: 'Abre o painel de uso de tokens' })
    await $.command.register({ name: 'guia-modelos', description: 'Abre o guia de modelos e esforço' })
    void $.ui.open({ id: PANE, title: TITLE })
    const surfaces = await $.session.surfaces()
    if (surfaces.includes('desktop')) void $.ui.open({ id: RAIL, title: RAIL_TITLE, placement: 'widget' })
    return next(e)
  })

  on('session.attach', { surface: 'desktop' }, async ($, e, next) => {
    void $.ui.open({ id: RAIL, title: RAIL_TITLE, placement: 'widget' })
    return next(e)
  })

  on('command.run', { command: 'tokens' }, async $ => {
    await update($, tab, () => 'uso' as Tab)
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: 'Painel de tokens aberto.' }
  })

  on('command.run', { command: 'guia-modelos' }, async $ => {
    await update($, tab, () => 'guia' as Tab)
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: 'Guia de modelos aberto.' }
  })

  // Classifica cada pedido digitado (comandos e mensagens internas ficam de fora).
  on('prompt.submit', async ($, e, next) => {
    if (!e.command && !e.isMeta && e.text.trim().length > 0) {
      await update($, taskKind, () => classify(e.text))
      await update($, suggestion, () => null)
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    // Primeira requisição do turno na conversa principal: o modelo e o esforço de verdade.
    if (e.index === 0 && e.agentId === undefined) {
      const kind = await read($, taskKind)
      const m = await read($, measure)
      const tip = advise(kind, e.model, e.effort, m?.contextTokens ?? 0)
      const before = await read($, suggestion)
      await update($, suggestion, () => tip)
      if (!tip.isOk && tip.text !== before?.text) $.ui.toast(`✗ ${tip.text} Sugestão: ${tip.recommend} (${tip.action})`)
    }
    const r = yield* next(e)
    const u = r.usage
    if (u) {
      const step: LastStep = {
        model: u.model,
        effort: e.effort === undefined ? 'padrão' : String(e.effort),
        input: u.input_tokens,
        output: u.output_tokens,
        cacheRead: u.cache_read_input_tokens,
        cacheWrite: u.cache_creation_input_tokens,
        isSubagent: e.agentId !== undefined,
      }
      await update($, last, () => step)
      await update($, totals, list => {
        const found = list.find(t => t.model === u.model)
        const base: ModelTotals = found ?? { model: u.model, requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
        const sum1: ModelTotals = {
          model: u.model,
          requests: base.requests + 1,
          input: base.input + step.input,
          output: base.output + step.output,
          cacheRead: base.cacheRead + step.cacheRead,
          cacheWrite: base.cacheWrite + step.cacheWrite,
        }
        return found ? list.map(t => (t.model === u.model ? sum1 : t)) : [...list, sum1]
      })
      $.ui.status(statusLine(await read($, measure), summarize(await read($, totals))))
    }
    return r
  })

  on('session.measure', async ($, e, next) => {
    const m: Measure = {
      contextTokens: e.context.tokens ?? null,
      contextWindow: e.context.window,
      contextPercent: e.context.percent ?? null,
      costUsd: e.cost?.usd ?? null,
      limits: e.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt ?? null })),
    }
    await update($, measure, () => m)
    $.ui.status(statusLine(m, summarize(await read($, totals))))
    return next(e)
  })

  // ---------- Widget da barra lateral ----------
  on('ui.render', { component: 'Pane', requestId: RAIL }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text, Progress } = els
    const Svg = e.surface !== 'terminal' && 'Svg' in els ? els.Svg : undefined
    const m = await read($, measure)
    const tip = await currentTip($)
    const pct = m?.contextPercent ?? null
    const worst = m?.limits.slice().sort((a, b) => b.percentUsed - a.percentUsed)[0]
    const sumW = summarize(await read($, totals))
    const v = verdict(m, cacheHit(sumW), sumW.input + sumW.cacheRead + sumW.cacheWrite)

    return (
      <Box flexDirection="column" gap={1} padding={1}>
        <Box flexDirection="row" gap={1} alignItems="center">
          {Svg && pct !== null ? <Svg source={ring(pct, tone(pct, 60, 80), 56, 7)} alt={`Contexto ${Math.round(pct)}%`} width={56} height={56} /> : null}
          <Box flexDirection="column" flexGrow={1}>
            <Text size="caption" color="subtle">CONTEXTO</Text>
            <Text size="heading" weight="bold" tabular>{pct === null ? '—' : `${Math.round(pct)}%`}</Text>
          </Box>
          <Box flexDirection="column" alignItems="flex-end">
            <Text size="caption" color="subtle">CUSTO</Text>
            <Text size="heading" weight="bold" tabular>{usd(m?.costUsd ?? null)}</Text>
          </Box>
        </Box>
        {!Svg && pct !== null && <Progress label="Contexto" value={pct} max={100} color={level(pct, 60, 80)} />}
        {worst && (
          <Progress label={`Limite ${limitName(worst.kind)}`} value={worst.percentUsed} max={100} valueText={`${Math.round(worst.percentUsed)}%`} color={level(worst.percentUsed, 60, 85)} />
        )}
        {tip && !tip.isDismissed && (tip.isOk ? (
          <Text size="caption" color="success">✓ {tip.current}</Text>
        ) : (
          <Text size="caption" color="error">✗ use {tip.recommend}</Text>
        ))}
        {v.icon !== '✓' && <Text size="caption" weight="semibold" color={v.color}>{v.text}</Text>}
      </Box>
    )
  })

  // ---------- Painel principal ----------
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text, Button, Progress } = els
    const Svg = e.surface !== 'terminal' && 'Svg' in els ? els.Svg : undefined
    const current = await read($, tab)

    const Card = (title: string, children: RenderChildren, accent?: string) => (
      <Box flexDirection="column" borderStyle="round" borderColor={accent === 'warning' || accent === 'error' ? accent : 'promptBorder'} paddingX={1} gap={0}>
        <Text size="footnote" weight="semibold" color={accent ?? 'subtle'}>{title.toUpperCase()}</Text>
        {children}
      </Box>
    )
    const Row = (k: string, val: string) => (
      <Box flexDirection="row" justifyContent="space-between">
        <Text color="subtle">{k}</Text>
        <Text tabular bold>{val}</Text>
      </Box>
    )
    const tabs = (
      <Box flexDirection="row" gap={1}>
        <Button key="tab-uso" label={current === 'uso' ? '● Uso' : '○ Uso'} onPress={() => update($, tab, () => 'uso' as Tab)} />
        <Button key="tab-guia" label={current === 'guia' ? '● Guia' : '○ Guia'} onPress={() => update($, tab, () => 'guia' as Tab)} />
      </Box>
    )

    if (current === 'guia') {
      return (
        <Box flexDirection="column" gap={1}>
          {tabs}
          <Text size="heading" weight="bold">Qual modelo usar</Text>
          {MODELS.map((m, i) =>
            Card(
              i === 1 ? `${m.name} · padrão` : m.name,
              <Box flexDirection="column">
                <Text size="caption" color="subtle" mono>{m.id} · {m.price}</Text>
                <Text>✔ {m.use}</Text>
                <Text color="subtle">✘ {m.avoid}</Text>
              </Box>,
              i === 1 ? 'claude' : undefined,
            ),
          )}
          <Text size="heading" weight="bold">Níveis de esforço</Text>
          {Card(
            'low → max',
            <Box flexDirection="column">
              {EFFORTS.map((x, i) => (
                <Box flexDirection="row" gap={1}>
                  <Box width={6}><Text mono color="claude">{dots(i)}</Text></Box>
                  <Box width={7}><Text bold mono>{x.level}</Text></Box>
                  <Box flexShrink={1}><Text>{x.when}</Text></Box>
                </Box>
              ))}
            </Box>,
          )}
          <Text size="heading" weight="bold">Regras práticas</Text>
          {Card(
            'antes de gastar',
            <Box flexDirection="column">
              {RULES.map(r => (
                <Text><Text color="claude">• </Text>{r}</Text>
              ))}
            </Box>,
            'claude',
          )}
          <Text size="caption" color="subtle">Preços conferidos em platform.claude.com/docs/en/about-claude/pricing em 2026-11-23. Batch API: 50% off.</Text>
        </Box>
      )
    }

    const all = await read($, totals)
    const lastStep = await read($, last)
    const m = await read($, measure)
    const details = await read($, showDetails)
    const tip = await currentTip($)
    const s = summarize(all)
    const hit = cacheHit(s)
    const pct = m?.contextPercent ?? null
    const v = verdict(m, hit, s.input + s.cacheRead + s.cacheWrite)
    const SIZE = 112
    const isNarrow = (e.props.bodyColumns ?? 40) < 30

    const gauges: { label: string; pct: number | null; warn: number; bad: number; sub: string }[] = [
      { label: 'Contexto', pct, warn: 60, bad: 80, sub: m ? `${fmt(m.contextTokens ?? 0)} de ${fmt(m.contextWindow)}` : 'aguardando' },
      ...(m?.limits ?? []).map(l => ({ label: `Limite ${limitName(l.kind)}`, pct: l.percentUsed, warn: 60, bad: 85, sub: l.resetsAt ? `reseta ${l.resetsAt}` : 'limite de uso' })),
    ]

    return (
      <Box flexDirection="column" gap={1}>
        {tabs}

        {/* Selo do modelo: ✓ verde se combina com a tarefa, ✗ vermelho com a sugestão se não. */}
        {tip?.isDismissed ? null : tip ? (
          tip.isOk ? (
            <Box flexDirection="row" gap={1} alignItems="center">
              <Text weight="bold" color="success">✓</Text>
              <Text weight="semibold">{tip.current}</Text>
              <Text size="caption" color="subtle">certo para tarefa {tip.kind}</Text>
            </Box>
          ) : (
            <Box flexDirection="column" borderStyle="round" borderColor="error" paddingX={1}>
              <Box flexDirection="row" gap={1} alignItems="center">
                <Text size="caption" weight="bold" color="error">✗</Text>
                <Text size="caption" color="subtle">{tip.current}</Text>
                <Text size="caption" color="subtle">→</Text>
                <Text weight="bold">{tip.recommend}</Text>
              </Box>
              <Text size="caption">{tip.text}</Text>
              <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text size="caption" mono color="claude">{tip.action}</Text>
                <Button key="dismiss" label="Dispensar" onPress={() => update($, suggestion, () => ({ ...tip, isDismissed: true }))} />
              </Box>
            </Box>
          )
        ) : (
          <Text size="caption" color="subtle">O selo de modelo aparece depois da sua próxima mensagem.</Text>
        )}

        {v.icon !== '✓' && (
          <Box borderStyle="round" borderColor={v.color} paddingX={1}>
            <Text weight="semibold" color={v.color}>{v.text}</Text>
          </Box>
        )}

        <Box flexDirection={isNarrow ? 'column' : 'row'} gap={1} width="100%" overflow="hidden">
          {gauges.map(g => (
            <Box flexDirection="column" alignItems="center" width={isNarrow ? '100%' : `${Math.floor(100 / gauges.length)}%`} flexShrink={1} paddingX={1} overflow="hidden">
              {Svg && g.pct !== null ? (
                <Svg source={ring(g.pct, tone(g.pct, g.warn, g.bad), SIZE, 12)} alt={`${g.label} ${Math.round(g.pct)}%`} />
              ) : null}
              <Text size="title" weight="bold" tabular>{g.pct === null ? '—' : `${Math.round(g.pct)}%`}</Text>
              <Text size="footnote" weight="semibold">{g.label}</Text>
              <Text size="caption" color="subtle">{g.sub}</Text>
              {!Svg && g.pct !== null && <Progress label={g.label} value={g.pct} max={100} color={level(g.pct, g.warn, g.bad)} />}
            </Box>
          ))}
        </Box>

        <Box flexDirection="row" justifyContent="space-evenly">
          <Box flexDirection="column" alignItems="center">
            <Text size="heading" weight="bold" tabular>{usd(m?.costUsd ?? null)}</Text>
            <Text size="caption" color="subtle">custo estimado</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text size="heading" weight="bold" tabular>{fmt(s.output)}</Text>
            <Text size="caption" color="subtle">tokens gerados</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text size="heading" weight="bold" tabular>{hit === null ? '—' : `${hit}%`}</Text>
            <Text size="caption" color="subtle">acerto do cache</Text>
          </Box>
        </Box>

        <Button key="details" label={details ? 'Detalhes ▾' : 'Detalhes ▸'} onPress={() => update($, showDetails, x => !x)} />
        {details &&
          Card(
            'Tokens da sessão',
            <Box flexDirection="column">
              {Row('Requisições', String(s.requests))}
              {Row('Entrada nova', fmt(s.input))}
              {Row('Cache lido', fmt(s.cacheRead))}
              {Row('Cache escrito', fmt(s.cacheWrite))}
              {Row('Saída', fmt(s.output))}
            </Box>,
          )}
        {details && all.length > 0 &&
          Card('Por modelo', <Box flexDirection="column">{all.map(t => Row(shortModel(t.model), `${t.requests} req · ↓${fmt(t.output)}`))}</Box>)}
        {details && lastStep &&
          Card(
            lastStep.isSubagent ? 'Última requisição · subagente' : 'Última requisição',
            <Box flexDirection="column">
              {Row('Modelo', shortModel(lastStep.model))}
              {Row('Esforço', lastStep.effort)}
              {Row('Entrada / Saída', `${fmt(lastStep.input + lastStep.cacheRead + lastStep.cacheWrite)} / ${fmt(lastStep.output)}`)}
            </Box>,
          )}
      </Box>
    )
  })
}
