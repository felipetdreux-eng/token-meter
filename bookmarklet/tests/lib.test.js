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
