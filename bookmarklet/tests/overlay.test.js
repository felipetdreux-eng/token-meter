// overlay.js mexe no DOM do claude.ai; aqui só testamos as funções auxiliares puras,
// tiradas do código-fonte pelo nome (const nome = ... até o fim do bloco).
const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const src = fs.readFileSync(__dirname + '/../overlay.js', 'utf8')

function helper(name, globals = {}) {
  const m = new RegExp(`\\n  const ${name} = [\\s\\S]*?\\n  }\\n`).exec(src)
  assert.ok(m, `não achei ${name} em overlay.js`)
  return new Function(...Object.keys(globals), `${m[0]}; return ${name}`)(...Object.values(globals))
}

test('resetText: minutos nunca chegam a 60', () => {
  const resetText = helper('resetText')
  const iso = new Date(Date.now() + 2 * 3.6e6 + 59.9 * 6e4).toISOString()
  assert.strictEqual(resetText(iso), 'reseta em 3h00')
  const iso2 = new Date(Date.now() + 23 * 3.6e6 + 59.9 * 6e4).toISOString()
  assert.strictEqual(resetText(iso2), 'reseta em 1d 0h')
})

test('resetText: casos normais', () => {
  const resetText = helper('resetText')
  assert.strictEqual(resetText(new Date(Date.now() + 90.2 * 6e4).toISOString()), 'reseta em 1h30')
  assert.strictEqual(resetText(new Date(Date.now() + 50 * 3.6e6 + 6e4).toISOString()), 'reseta em 2d 2h')
  assert.strictEqual(resetText(new Date(Date.now() - 1000).toISOString()), '')
  assert.strictEqual(resetText(null), '')
})
