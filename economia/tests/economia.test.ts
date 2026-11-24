import { expect, test } from 'claude-code/testing'

const BASE = { surfaces: [], outputStyle: null, traits: [] } as const

test('registra os subagentes baratos', async ($, on) => {
  const specs: { name: string; model?: string }[] = []
  on('agent.register', (_, e) => (specs.push(e), { value: { agent: `economia:${e.name}` } }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(specs.map(s => `${s.name}:${s.model}`)).toEqual(['leitor:haiku', 'executor:sonnet'])
})

test('manda delegar só quando a conversa está num modelo caro', async ($, on) => {
  on('prompt.compose', () => ({ sections: [{ id: 'base', text: 'x', scope: 'session' }] }))
  const opus = await $.prompt.compose({ ...BASE, model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5', tools: ['Agent', 'Read'] })
  expect(opus.sections.map(s => s.id)).toContain('economia:modo')
  const sonnet = await $.prompt.compose({ ...BASE, model: 'claude-sonnet-5-5', promptModel: 'claude-sonnet-5-5', tools: ['Agent'] })
  expect(sonnet.sections.map(s => s.id)).not.toContain('economia:modo')
  const noAgent = await $.prompt.compose({ ...BASE, model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5', tools: ['Read'] })
  expect(noAgent.sections.map(s => s.id)).not.toContain('economia:modo')
})

test('pesquisa sem modelo escolhido vai para o Haiku; o resto fica como está', async ($, on) => {
  const seen: (string | undefined)[] = []
  on('tool.call', (_, e) => (seen.push('model' in e ? (e.model as string | undefined) : 'none'), { result: {} }))
  await $.tool.call({ tool: 'Agent', description: 'Procurar usos de fetch', prompt: 'Ache onde fetch é chamado', subagent_type: 'Explore' })
  await $.tool.call({ tool: 'Agent', description: 'Refatorar o login', prompt: 'Reescreva o fluxo de login', subagent_type: 'general-purpose' })
  await $.tool.call({ tool: 'Agent', description: 'Procurar bugs', prompt: 'leia tudo', subagent_type: 'Explore', model: 'opus' })
  // 'none' = o mod não mexeu no modelo
  expect(seen).toEqual(['haiku', 'none', 'opus'])
})

test('/economia off desliga o desvio', async ($, on) => {
  const seen: (string | undefined)[] = []
  on('tool.call', (_, e) => (seen.push('model' in e ? (e.model as string | undefined) : 'none'), { result: {} }))
  const r = await $.command.run({ command: 'economia', args: 'off', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
  expect(r.text).toContain('desligado')
  await $.tool.call({ tool: 'Agent', description: 'Procurar usos', prompt: 'ache', subagent_type: 'Explore' })
  expect(seen).toEqual(['none'])
})
