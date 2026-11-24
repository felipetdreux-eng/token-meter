export type Stats = {
  /** Quantas tarefas foram para subagentes baratos. */
  delegated: number
  /** Quantas chamadas de Agent o mod trocou para um modelo mais barato. */
  rerouted: number
  /** Tokens processados por modelo mais barato que o da conversa, por modelo. */
  cheapTokens: Record<string, number>
  /** Modelo da conversa principal, como a última requisição dela disse. */
  mainModel: string
}

declare module 'claude-code' {
  interface PluginState {
    economia: {
      stats: Shaped<Stats>
      isOn: boolean
    }
  }
}
