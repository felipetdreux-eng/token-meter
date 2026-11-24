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

export type SkillUse = { count: number; last: number }

declare module 'claude-code' {
  interface PluginState {
    economia: {
      stats: Shaped<Stats>
      isOn: boolean
      /** Skills usadas nesta sessão (nome → vezes e quando). */
      skillUse: Shaped<Record<string, SkillUse>>
      /** Última mensagem do usuário, para sugerir skills. */
      lastPrompt: string
      /** Botão "Em uso": mostra só as skills já usadas. */
      isUsedOnly: boolean
      /** Blocos abertos no painel. */
      openBlocks: Shaped<string[]>
    }
  }
}
