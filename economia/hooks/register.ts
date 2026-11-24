import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Stats } from '../types'

// Como o desvio funciona:
// 1. Registra dois subagentes baratos: "leitor" (Haiku) e "executor" (Sonnet).
// 2. Diz ao modelo da conversa, no prompt de sistema, para mandar o trabalho mecânico para eles.
// 3. Quando o modelo chama o Agent para pesquisa ou leitura sem escolher modelo, troca para o Haiku.
// Não troca o modelo da conversa principal no meio da tarefa: isso jogaria fora o cache
// (o cache é por modelo) e o raciocínio guardado, e costuma sair mais caro.

const EMPTY: Stats = { delegated: 0, rerouted: 0, cheapTokens: {}, mainModel: '' }
const stats = atom({ plugin: 'economia', key: 'stats' } as const, EMPTY, { shape: 'stats-1' })
const isOn = atom({ plugin: 'economia', key: 'isOn' } as const, true)

const LEITOR = 'economia:leitor'
const EXECUTOR = 'economia:executor'

const tier = (model: string): number => {
  const m = model.toLowerCase()
  if (m.includes('haiku')) return 0
  if (m.includes('sonnet')) return 1
  if (m.includes('opus')) return 2
  if (m.includes('fable') || m.includes('mythos')) return 3
  return -1
}
const fmt = (n: number): string => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)
const short = (model: string): string => {
  const m = /(haiku|sonnet|opus|fable)/i.exec(model)
  return m && m[1] ? m[1].toLowerCase() : model
}

const SECTION = `# Modo economia (mod "economia")
Você roda num modelo caro. Trabalho mecânico e autocontido vai para subagentes mais baratos, pela ferramenta Agent:
- subagent_type "${LEITOR}" (Haiku): procurar no código, ler muitos arquivos, pesquisar na web, resumir documentos ou logs, listar onde algo é usado.
- subagent_type "${EXECUTOR}" (Sonnet): edições mecânicas já decididas (renomear, formatar, aplicar o mesmo ajuste em vários arquivos, escrever boilerplate), rodar comandos ou testes e relatar o resultado.
Fique com você: decidir, desenhar a solução, achar a causa de um bug, qualquer coisa de segurança, a revisão final e a conversa com o usuário.
Regras: delegue só o que levaria 3 ou mais chamadas de ferramenta (menos que isso, o custo de abrir um subagente não compensa). Escreva um prompt completo, com caminhos e critérios, porque o subagente não vê esta conversa. Confira o que ele devolveu antes de usar. Não diga ao usuário que delegou a menos que ele pergunte.`

const LEITOR_PROMPT = `Você é um subagente de leitura e pesquisa, chamado por outro modelo para poupar custo.
Faça exatamente o que o pedido diz: procure, leia, pesquise e resuma. Não edite arquivos.
Responda com um relatório curto e factual: o que achou, com caminhos de arquivo e números de linha (arquivo:linha) ou URLs, e o que não achou.
Cite trechos curtos quando forem a prova. Não invente: se não tiver certeza, diga.`

const EXECUTOR_PROMPT = `Você é um subagente executor, chamado por outro modelo para poupar custo.
Faça a tarefa mecânica descrita, exatamente como pedida, sem redesenhar nada nem ampliar o escopo.
Se o pedido for ambíguo ou exigir uma decisão de design, pare e devolva a pergunta em vez de chutar.
Ao terminar, relate em poucas linhas: o que mudou (arquivos), comandos rodados e a saída relevante (falhas incluídas, sem esconder).`

// Pedidos de agente que são leitura/pesquisa: vão para o Haiku quando ninguém escolheu modelo.
const READ_ONLY = /\b(procur|busc|achar|ache|encontr|list|ler|leia|lê|resum|pesquis|search|find|look|locat|grep|read|summar|explor|investig)/i

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.agent.register({
      name: 'leitor',
      description: 'Barato (Haiku). Para procurar no código, ler muitos arquivos, pesquisar na web e resumir. Não edita nada.',
      prompt: LEITOR_PROMPT,
      model: 'haiku',
      effort: 'low',
      disallowedTools: ['Edit', 'Write', 'NotebookEdit', 'Agent'],
    })
    await $.agent.register({
      name: 'executor',
      description: 'Barato (Sonnet). Para edições mecânicas já decididas, boilerplate e rodar comandos ou testes.',
      prompt: EXECUTOR_PROMPT,
      model: 'sonnet',
      effort: 'medium',
      disallowedTools: ['Agent'],
    })
    await $.command.register({ name: 'economia', description: 'Mostra o que foi desviado para modelos baratos; /economia on ou off liga e desliga' })
    return next(e)
  })

  // Instrui o modelo caro a delegar (só quando ele tem a ferramenta Agent e é mais caro que o Sonnet).
  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    if (!(await read($, isOn)) || !e.tools.includes('Agent') || tier(e.model) < 2) return r
    return { sections: [...r.sections, { id: 'economia:modo', text: SECTION, scope: 'session' as const }] }
  })

  // O modelo chamou um agente de leitura/pesquisa sem escolher modelo: manda para o Haiku.
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (!(await read($, isOn))) return next(e)
    const type = e.subagent_type ?? 'general-purpose'
    const isOurs = type === LEITOR || type === EXECUTOR
    if (isOurs) await update($, stats, s => ({ ...s, delegated: s.delegated + 1 }))
    const isReadJob = (type === 'Explore' || type === 'general-purpose') && READ_ONLY.test(`${e.description} ${e.prompt.slice(0, 300)}`)
    if (e.model === undefined && !isOurs && type !== 'fork' && isReadJob) {
      await update($, stats, s => ({ ...s, rerouted: s.rerouted + 1, delegated: s.delegated + 1 }))
      return next({ ...e, model: 'haiku' })
    }
    return next(e)
  })

  // Conta o trabalho feito por modelos mais baratos que o da conversa.
  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    const model = r.usage?.model ?? e.model
    if (e.agentId === undefined) {
      if ((await read($, stats)).mainModel !== model) await update($, stats, s => ({ ...s, mainModel: model }))
      return r
    }
    const s = await read($, stats)
    if (r.usage && s.mainModel && tier(model) >= 0 && tier(model) < tier(s.mainModel)) {
      const u = r.usage
      const n = u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens
      const key = short(model)
      await update($, stats, x => ({ ...x, cheapTokens: { ...x.cheapTokens, [key]: (x.cheapTokens[key] ?? 0) + n } }))
      const after = await read($, stats)
      const total = Object.values(after.cheapTokens).reduce((a, b) => a + b, 0)
      $.ui.status(`economia: ${after.delegated} desviadas · ${fmt(total)} tokens fora do ${short(after.mainModel)}`)
    }
    return r
  })

  on('command.run', { command: 'economia' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'off' || arg === 'on') {
      await update($, isOn, () => arg === 'on')
      return { text: arg === 'on' ? 'Modo economia ligado: tarefas mecânicas vão para Haiku e Sonnet.' : 'Modo economia desligado: tudo fica no modelo da conversa.' }
    }
    const s = await read($, stats)
    const on1 = await read($, isOn)
    const parts = Object.entries(s.cheapTokens).map(([m, n]) => `${m}: ${fmt(n)} tokens`)
    return {
      text: [
        `Modo economia ${on1 ? 'ligado' : 'desligado'} (conversa no ${short(s.mainModel) || '?'}).`,
        `${s.delegated} tarefas foram para subagentes baratos (${s.rerouted} trocadas automaticamente para o Haiku).`,
        parts.length ? `Trabalho feito fora do modelo caro: ${parts.join(' · ')}.` : 'Nenhum trabalho desviado ainda.',
        'Use /economia off para desligar e /economia on para ligar.',
      ].join('\n'),
    }
  })
}
