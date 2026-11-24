// Testes das funções puras de lib.js. Rodar: node --test bookmarklet/tests/
const test = require('node:test')
const assert = require('node:assert')
require('../lib.js')
const { TM } = globalThis

test('prettyModel: nomes com versão menor', () => {
  assert.strictEqual(TM.prettyModel('claude-opus-5-5'), 'Opus 5.5')
  assert.strictEqual(TM.prettyModel('claude-sonnet-4-5-20250929'), 'Sonnet 4.5')
})

test('prettyModel: IDs com data não viram versão', () => {
  assert.strictEqual(TM.prettyModel('claude-opus-4-20250514'), 'Opus 4')
  assert.strictEqual(TM.prettyModel('claude-sonnet-4-20250514'), 'Sonnet 4')
})

test('classify: "ok" e "sim" só contam como palavra inteira', () => {
  // "token" contém "ok" e "assim" contém "sim": não são pedidos simples.
  const t = 'me explica como o token é contado no contexto assim que a conversa cresce'
  assert.ok(t.length >= 50)
  assert.strictEqual(TM.classify(t), 'normal')
  assert.strictEqual(TM.classify('ok, pode seguir com o próximo passo do que combinamos ontem à noite'), 'simples')
  assert.strictEqual(TM.classify('sim, pode seguir com o próximo passo do que combinamos ontem à noite'), 'simples')
})
