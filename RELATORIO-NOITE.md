# Relatório da noite: revisão (24/11/2026)

Branch: `noite/2026-11-24-revisao` (criada a partir de `main`). Nada foi mesclado, e nenhum PR foi aberto.

## Estado inicial
- O favorito (`bookmarklet/`) não tinha nenhum teste. O build (`bash bookmarklet/build.sh`) passava e era reproduzível: o `bundle.min.js`, o `bookmarklet.txt` e o `instalar-token-meter.html` gerados de novo saíram idênticos aos do repositório.
- O mod `economia`: `claude plugin test economia` deu 4 de 4 passando. `claude plugin validate economia` passou com um aviso: "gating hook without .catch: tool.call{tool=Agent}".

## Bugs corrigidos (cada um tem teste que falhava antes da correção)
- `bcafb33`: o nome do modelo saía como "Opus 4.20250514" para IDs com data (`claude-opus-4-20250514`). Agora sai "Opus 4".
- `e7a45ce`: o selo achava que "ok" e "sim" estavam em "token" e "assim", e classificava como simples pedidos que não são (e sugeria trocar para um modelo menor). Agora essas duas palavras só contam se aparecerem inteiras.
- `4f713ac`: o tempo até o reset aparecia como "reseta em 2h60". Agora mostra "3h00".
- `e42f1aa`: quando o fundo do `body` é transparente (`rgba(0,0,0,0)`), o painel lia a cor como preta e abria no tema escuro. Agora ele olha o `<html>` e, se também for transparente, segue a preferência do sistema.
- `875b4f4`: o Cérebro mostrava "só as primeiras 6.000 notas" mesmo quando o cofre tinha exatamente 6.000 notas.
- `06d26ce`: favorito regerado com as correções. Testei no Chromium com o claude.ai simulado (sem nenhuma requisição real), sem erros: aparecem "Opus 4", "reseta em 3h00" e o tema claro.

Também adicionei testes em `bookmarklet/tests/`, que usam só o `node:test` e não precisam de nenhuma dependência.

## Possíveis bugs que não corrigi (dependem de decisão sua ou do formato real da API)
- `lib.js` `pct()`: valores entre 0 e 1 são multiplicados por 100. Se a API mandar na escala 0–100, um uso de 0,5% aparece como 50%. Se mandar na escala 0–1, um uso de 100% (valor 1) aparece como 1%. É preciso confirmar qual escala o endpoint `/usage` usa de verdade.
- `lib.js` `estimateConversation`: usa `m.files ?? m.files_v2`. Se `files` vier como `[]` e `files_v2` vier preenchido, as imagens e PDFs não entram na conta.
- `economia` `READ_ONLY`: um pedido como "find and fix the bug" (ou "investigar…") mandado a um agente `general-purpose` é desviado para o Haiku, mesmo que o agente vá editar código. A heurística é por palavra-chave, e decidir isso é com você.
- `economia` `tool.call`: o validador avisa que, se a leitura ou gravação do estado falhar, a chamada do Agent quebra junto. Não consegui provocar essa falha num teste, então não mexi.
- Problemas menores de exibição: `fmt(999950)` mostra "1000.0k". O `short()` do mod não reconhece "mythos". Tags só com números (`#123`) contam como tag. Tarefas em lista numerada (`1. [ ]`) não são contadas.

## Riscos de segurança
- Não achei nenhuma injeção de HTML: tudo o que vem da API e das notas passa por `esc()`, e os links são relativos (`/code/<id>`).
- Privacidade: o resumo do cofre (texto das tarefas, nomes das notas e das pastas) fica guardado em `localStorage` (`tm-brain`) **no domínio claude.ai**, onde os scripts do próprio claude.ai conseguem ler. O README diz que "nada sai do seu computador". Hoje isso é verdade, mas depende do claude.ai não ler esses dados. Decidir se isso é aceitável é com você.
- O painel lê vários endereços internos e não documentados do claude.ai com a sua sessão. Ele só faz requisições para o próprio domínio (confirmei no teste de fumaça).

## O que pulei
- Não chamei o claude.ai de verdade (é serviço de produção). O teste do painel foi feito só com respostas simuladas.

## Como conferir
```bash
git checkout noite/2026-11-24-revisao
node --test 'bookmarklet/tests/*.test.js'   # 9 testes do favorito
claude plugin test economia                 # 4 testes do mod
claude plugin validate economia
bash bookmarklet/build.sh && git status     # build: não deve deixar diferença
git log --oneline main..HEAD
```

## Revisão (code-review medium + security-review do diff contra `main`)
- Nenhuma das 5 correções foi revertida. As duas revisões confirmaram que os bugs são reais e que nenhuma correção causa regressão. Os 9 testes do favorito passam, e o build continua reproduzível.
- Segurança: nenhuma vulnerabilidade nova. A `RegExp` nova é montada só de uma lista fixa, e os textos exibidos continuam passando por `esc()`.
- Efeito colateral aceito de `e7a45ce`: "okay", "oks" e "okk" deixaram de contar como pedido simples. É um detalhe da heurística, e você decide se quer de volta.
- Bugs antigos, achados na revisão e não corrigidos:
  - "debug" conta também como "bug" e pesa em dobro.
  - "compar" casa com "compartilha", e "lista" casa com "especialista".
  - "só" no fim da mensagem não conta, porque a palavra-chave é "só " com espaço.
  - `claude-3-5-sonnet-20241022` aparece como "Sonnet 20241022".
  - Quando falta menos de 30 s para o reset, aparece "reseta em 0h00".
  - Fundo quase transparente (por exemplo alfa 0,05) ainda conta como cor sólida.
- O comentário no topo de `lib.test.js` mandava rodar `node --test bookmarklet/tests/`, que falha no Node 22. Corrigi para usar o glob.
