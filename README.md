# token-meter

Um favorito (bookmarklet) para o claude.ai que abre um painel flutuante com quatro abas (Uso, Skills, Agentes, Cérebro):

- **Selo de modelo**: ✓ verde quando o modelo combina com a sua última mensagem; ✗ vermelho com o modelo sugerido quando não combina (classificação por palavras-chave).
- **Anéis** de contexto da conversa, limite de 5 horas e limite da semana, com o tempo até resetar.
- **Avisos** quando o contexto ou um limite passa de 60% / 80–85%.
- **Skills**: suas skills do claude.ai em blocos, com para que serve, verde nas que o Claude usou na conversa, filtro "Em uso", botão "Usar" (escreve o pedido na caixa de mensagem) e sugestões para a sua última mensagem. O catálogo é o mesmo do mod economia (`economia/hooks/catalog.ts`).
- **Agentes**: suas sessões do Claude Code (trabalhando, esperando você, falharam) e tarefas agendadas (próxima execução, se a última deu certo).
- **Cérebro**: resumo de uma pasta de notas .md (Obsidian ou parecido) que você escolhe: notas, tarefas abertas, o que mexeu por último, áreas e tags. Nada sai do seu computador.

Não instala nada: funciona mesmo quando extensões estão bloqueadas.

## Instalar

1. Abra `bookmarklet/instalar-token-meter.html` no Chrome do computador.
2. Mostre a barra de favoritos (`Ctrl+Shift+B`) e arraste o botão **Token Meter** até ela. Ou use **Copiar código** e crie um favorito com o código no campo URL.

## Usar

No claude.ai, clique no favorito para abrir o painel; clique de novo (ou no ×) para fechar. Depois de recarregar a página, clique outra vez.

Os limites vêm de endereços internos do claude.ai, que podem mudar sem aviso. Tokens e contexto são estimativas pelo texto da conversa (sem o prompt de sistema). Tudo roda no seu navegador e só conversa com o claude.ai.

## Código

`bookmarklet/lib.js` (uso e selo), `skills-web.js`, `agents.js`, `brain.js` e `overlay.js` (painel); `catalog.js` é gerado do catálogo do mod economia. `bookmarklet/build.sh` gera o favorito.

## Mod "economia" para o Claude Code

A pasta `economia/` é um mod do Claude Code que desvia trabalho mecânico (pesquisa, leitura, edições já decididas, rodar testes) para subagentes baratos: `economia:leitor` (Haiku) e `economia:executor` (Sonnet). O modelo da conversa fica com as decisões. `/economia` mostra o que foi desviado; `/economia off` e `/economia on` desligam e ligam.

Também abre o painel **Skills** (ou `/minhas-skills`): suas skills em blocos (economia de tokens, agentes, Instagram, marketing, documentos, código, design...), cada uma com para que serve, ponto verde nas usadas na sessão, filtro "Em uso", botão "Usar" (coloca o comando na caixa de mensagem) e sugestões para a sua última mensagem.

```
/plugin install economia --marketplace felipetdreux-eng/token-meter
```

Num shell:

```bash
claude plugin install economia --marketplace felipetdreux-eng/token-meter
```

## Mod "token-meter" para o Claude Code (app desktop)

A pasta `token-meter/` é um mod com o painel "Tokens & Modelos": anéis de contexto e dos limites de 5 horas e da semana, custo estimado, tokens gerados, acerto do cache, selo ✓/✗ de modelo e esforço para a tarefa, guia dos modelos e um widget na barra lateral do app desktop. Comandos: `/tokens` e `/guia-modelos`.

No app desktop: clique no **+** ao lado da caixa de mensagem, depois **Plugins**, **Add marketplace** com `felipetdreux-eng/token-meter`, e **Add plugin** no "token-meter".

No terminal:

```bash
claude plugin install token-meter --marketplace felipetdreux-eng/token-meter
```
