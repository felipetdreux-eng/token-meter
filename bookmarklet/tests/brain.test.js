const test = require('node:test')
const assert = require('node:assert')
require('../brain.js')
const { TMBrain } = globalThis

// Pasta falsa no formato da File System Access API (entries() + getFile()).
const fakeDir = (n, name = 'cofre') => ({
  name,
  kind: 'directory',
  async *entries() {
    for (let i = 0; i < n; i++) {
      yield [`n${i}.md`, { kind: 'file', getFile: async () => ({ lastModified: 0, text: async () => '- [ ] tarefa' }) }]
    }
  },
})

test('scan: exatamente 6000 notas não conta como cortado', async () => {
  const r = await TMBrain.scan(fakeDir(6000))
  assert.strictEqual(r.notes, 6000)
  assert.strictEqual(r.truncated, false)
})

test('scan: mais de 6000 notas para em 6000 e avisa', async () => {
  const r = await TMBrain.scan(fakeDir(6001))
  assert.strictEqual(r.notes, 6000)
  assert.strictEqual(r.truncated, true)
})

test('summarize: tarefas abertas e feitas', () => {
  const r = TMBrain.summarize([{ name: 'a.md', path: '', mtime: 1, text: '- [ ] um\r\n* [x] dois\n- [X] três\n#tag e #tag' }])
  assert.strictEqual(r.tasksOpen, 1)
  assert.strictEqual(r.tasks[0].text, 'um')
  assert.strictEqual(r.tasksDone, 2)
  assert.deepStrictEqual(r.tags, [['tag', 2]])
})
