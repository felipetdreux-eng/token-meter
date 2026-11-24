export type ModelTotals = {
  model: string
  requests: number
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}
export type LastStep = {
  model: string
  effort: string
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  isSubagent: boolean
}
export type Measure = {
  contextTokens: number | null
  contextWindow: number
  contextPercent: number | null
  costUsd: number | null
  limits: { kind: string; percentUsed: number; resetsAt: string | null }[]
}
export type Tab = 'uso' | 'guia'
export type TaskKind = 'simples' | 'normal' | 'complexa'
export type Suggestion = { kind: TaskKind; isOk: boolean; current: string; recommend: string; text: string; action: string; isDismissed?: boolean }

declare module 'claude-code' {
  interface PluginState {
    'token-meter': {
      totals: Shaped<ModelTotals[]>
      last: Shaped<LastStep | null>
      measure: Shaped<Measure | null>
      tab: Tab
      showDetails: boolean
      taskKind: TaskKind
      suggestion: Shaped<Suggestion | null>
    }
  }
}
