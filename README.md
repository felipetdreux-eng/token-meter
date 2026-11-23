# token-meter

Mod do Claude Code que mostra o uso de tokens em tempo real e diz se o modelo e o esforço combinam com a tarefa.

- **Painel "Tokens & Modelos"**: anéis de contexto e dos limites de uso (5 horas e semana), custo estimado, tokens gerados e acerto do cache. Em "Detalhes", os totais por modelo e a última requisição.
- **Selo de modelo**: ✓ verde quando o modelo e o esforço combinam com o pedido; ✗ vermelho com o modelo e o esforço sugeridos quando não combinam. A classificação do pedido é uma heurística por palavras-chave.
- **Widget na barra lateral** do app desktop e entrada na status line.
- **Guia** dos modelos (Fable 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5) e dos níveis de esforço.
- Comandos: `/tokens` e `/guia-modelos`.

O custo mostrado é a estimativa do `/cost`, não a fatura.

## Instalar

No prompt de uma sessão do Claude Code:

```
/plugin install token-meter --marketplace felipetdreux-eng/token-meter
```

Num shell:

```bash
claude plugin install token-meter --marketplace felipetdreux-eng/token-meter
```

No app desktop, onde `/plugin` não roda: clique em + ao lado da caixa de mensagem, depois Plugins, Add marketplace com `felipetdreux-eng/token-meter`, e Add plugin.
