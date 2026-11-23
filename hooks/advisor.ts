import type { Suggestion, TaskKind } from '../types'

// Heurística local, sem chamar modelo: palavras e tamanho do pedido.
// Erra às vezes; é um empurrão, não uma ordem.
const COMPLEX = [
  'refator', 'arquitet', 'debug', 'bug', 'não funciona', 'nao funciona', 'quebrou', 'por que', 'porque não', 'investig',
  'migr', 'implement', 'otimiz', 'performance', 'seguran', 'planej', 'plano', 'integra', 'deploy', 'banco de dados',
  'todo o projeto', 'vários arquivos', 'varios arquivos', 'sistema', 'criar um app', 'crie um app', 'do zero', 'teste',
  'refactor', 'architecture', 'implement', 'failing', 'race condition', 'memory leak', 'design',
]
const SIMPLE = [
  'o que é', 'o que significa', 'qual é', 'qual o', 'traduz', 'renomei', 'typo', 'ortografia', 'formata', 'resum',
  'rápido', 'rapido', 'só ', 'apenas', 'quanto', 'lista', 'obrigado', 'valeu', 'beleza', 'ok', 'sim', 'pode', 'continua',
]

export const classify = (text: string): TaskKind => {
  const t = text.toLowerCase()
  const complex = COMPLEX.filter(k => t.includes(k)).length
  const simple = SIMPLE.filter(k => t.includes(k)).length
  const hasCode = t.includes('```') || t.split('\n').length > 15
  if (t.length > 700 || hasCode || complex >= 2 || (complex >= 1 && t.length > 80)) return 'complexa'
  if (complex === 0 && (t.length < 50 || simple >= 1)) return 'simples'
  return 'normal'
}

const FAMILY = ['haiku', 'sonnet', 'opus', 'fable', 'mythos'] as const
const tier = (model: string): number => {
  const m = model.toLowerCase()
  const i = FAMILY.findIndex(f => m.includes(f))
  return i === 4 ? 3 : i
}
const RANK: Record<string, number> = { low: 0, medium: 1, high: 2, xhigh: 3, max: 4 }
const defaultEffort = (model: string): string => (/opus|haiku/i.test(model) ? 'medium' : 'high')
const pretty = (model: string): string => {
  const m = /(haiku|sonnet|opus|fable|mythos)-(\d+)(?:-(\d+))?/i.exec(model)
  if (!m || !m[1] || !m[2]) return model
  return `${m[1][0]!.toUpperCase()}${m[1].slice(1)} ${m[2]}${m[3] ? `.${m[3]}` : ''}`
}
const familyName = (model: string): string => {
  const i = tier(model)
  return i < 0 ? model : ['Haiku', 'Sonnet', 'Opus', 'Fable'][i] ?? model
}

// O que recomendar para cada tipo de tarefa.
const RECOMMEND: Record<TaskKind, { model: string; effort: string; cmd: string }> = {
  simples: { model: 'Sonnet 5.5', effort: 'low', cmd: '/model sonnet' },
  normal: { model: 'Opus 5.5', effort: 'medium', cmd: '/model opus' },
  complexa: { model: 'Opus 5.5', effort: 'high', cmd: '/model opus' },
}

/** Sempre responde: isOk true quando modelo e esforço combinam com a tarefa. */
export const advise = (kind: TaskKind, model: string, rawEffort: string | number | undefined, contextTokens: number): Suggestion => {
  const effort = typeof rawEffort === 'string' ? rawEffort : defaultEffort(model)
  const e = RANK[effort] ?? 2
  const t = tier(model)
  const current = `${pretty(model)} · ${effort}`
  const rec = RECOMMEND[kind]
  const recommend = `${rec.model} · ${rec.effort}`
  const cacheNote = contextTokens > 100_000 ? ' Trocar de modelo agora perde o cache desta conversa.' : ''
  const ok = (text: string): Suggestion => ({ kind, isOk: true, current, recommend, text, action: '' })
  const bad = (why: string, action: string): Suggestion => ({ kind, isOk: false, current, recommend, text: why + cacheNote, action })
  const sameModel = familyName(model) === rec.model.split(' ')[0]
  const effortAction = (to: string) => (sameModel ? `Mude o esforço para ${to} em /model` : `${rec.cmd} e esforço ${to}`)

  if (t < 0) return ok('Modelo desconhecido: sem sugestão.')
  if (kind === 'simples') {
    if (t >= 3) return bad(`Tarefa simples no ${familyName(model)}: gasta ~4x mais que o necessário.`, `${rec.cmd} e esforço low`)
    if (e >= 3) return bad(`Tarefa simples com esforço ${effort}: é desperdício.`, effortAction('low'))
    if (t === 2 && e >= 2) return bad('Tarefa simples no Opus com esforço alto: o Sonnet resolve pela metade do preço.', `${rec.cmd} e esforço low`)
  }
  if (kind === 'complexa') {
    if (t === 0) return bad('Tarefa complexa no Haiku: ele erra raciocínio de várias etapas.', `${rec.cmd} e esforço high`)
    if (e === 0) return bad('Tarefa complexa com esforço low: ele vai cortar caminho.', effortAction('high'))
    if (t === 1 && e <= 1) return bad(`Tarefa complexa no Sonnet com esforço ${effort}: pouco para isso.`, `${rec.cmd} e esforço high`)
  }
  if (kind === 'normal') {
    if (t === 0 && e <= 1) return bad('O Haiku pode não dar conta desta tarefa.', '/model sonnet e esforço high')
    if (t >= 3 && e >= 3) return bad(`Fable com esforço ${effort} para tarefa comum: mais caro sem ganho.`, `${rec.cmd} e esforço medium`)
  }
  if (t >= 3 && e === 4 && kind !== 'complexa') return bad('Esforço max raramente compensa fora de problemas muito difíceis.', effortAction('high'))
  return ok(`Certo para tarefa ${kind}.`)
}
