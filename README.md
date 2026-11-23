# token-meter

Um favorito (bookmarklet) para o claude.ai que abre um painel flutuante com:

- **Selo de modelo**: ✓ verde quando o modelo combina com a sua última mensagem; ✗ vermelho com o modelo sugerido quando não combina (classificação por palavras-chave).
- **Anéis** de contexto da conversa, limite de 5 horas e limite da semana, com o tempo até resetar.
- **Avisos** quando o contexto ou um limite passa de 60% / 80–85%.

Não instala nada: funciona mesmo quando extensões estão bloqueadas.

## Instalar

1. Abra `bookmarklet/instalar-token-meter.html` no Chrome do computador.
2. Mostre a barra de favoritos (`Ctrl+Shift+B`) e arraste o botão **Token Meter** até ela. Ou use **Copiar código** e crie um favorito com o código no campo URL.

## Usar

No claude.ai, clique no favorito para abrir o painel; clique de novo (ou no ×) para fechar. Depois de recarregar a página, clique outra vez.

Os limites vêm de endereços internos do claude.ai, que podem mudar sem aviso. Tokens e contexto são estimativas pelo texto da conversa (sem o prompt de sistema). Tudo roda no seu navegador e só conversa com o claude.ai.

## Código

`bookmarklet/lib.js` (leitura dos dados e selo) + `bookmarklet/overlay.js` (painel). `bookmarklet/build.sh` gera o favorito.
