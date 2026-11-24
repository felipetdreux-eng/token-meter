import { expect, test } from 'claude-code/testing'
import type { CommandInfo } from 'claude-code'

import { suggest } from '../hooks/catalog'

const PANE = {
  plugin: 'economia', component: 'Pane', requestId: 'economia-skills',
  props: { title: 'Skills', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 80 }, view: {} },
} as const

const COMMANDS: CommandInfo[] = [
  { name: 'clear', description: 'Clear conversation', source: 'builtin' },
  { name: 'economia', description: 'x', source: 'plugin', plugin: 'economia' },
  { name: 'caveman:caveman', description: 'caveman talk', source: 'plugin', plugin: 'caveman' },
  { name: 'instagram-br:ig-reel-br', description: 'reel', source: 'plugin', plugin: 'instagram-br' },
  { name: 'anthropic-skills:tutor-matematica-recuperacao', description: 'tutor', source: 'user' },
  { name: 'design', description: 'Make a visual design', source: 'builtin' },
  { name: 'minhas-skills', description: 'o próprio painel', source: 'plugin', plugin: 'economia' },
  { name: 'batch', description: 'Run a large change in parallel', source: 'builtin' },
  { name: 'minha-skill-nova', description: 'Uma skill que o catálogo não conhece', source: 'user' },
]

type Body = Extract<Parameters<typeof test>[1], (...a: never[]) => unknown>
const setup = (on: Parameters<Body>[1]) => {
  const filled: string[] = []
  const toasts: string[] = []
  on('command.list', () => ({ value: COMMANDS }))
  on('prompt.fill', (_, e) => (filled.push(e.text), { isFilled: true }))
  on('clock.now', () => ({ value: 1_700_000_000_000 }))
  on('ui.toast', (_, e) => (toasts.push(JSON.stringify(e)), { value: undefined }))
  on('skill.prompt', (_, e) => ({ text: e.text }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  return { filled, toasts }
}

test('sugestões casam palavras inteiras, sem falsos positivos', async () => {
  const names = COMMANDS.map(c => c.name)
  expect(suggest('quero um roteiro de reel sobre clínicas', names).map(s => s.name)).toEqual(['instagram-br:ig-reel-br'])
  expect(suggest('me ajuda na prova de matemática da recuperação', names)[0]?.name).toBe('anthropic-skills:tutor-matematica-recuperacao')
  expect(suggest('o prompt do admin', ['code-review', 'instagram-br:ig-dm-br'])).toEqual([])
  expect(suggest('revisa esse PR', ['code-review']).map(s => s.name)).toEqual(['code-review'])
  expect(suggest('', names)).toEqual([])
})

test('painel em blocos: só skills reais, cada uma com descrição; comandos embutidos fora', async ($, on) => {
  setup(on)
  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const all = JSON.stringify(await ui.drawn())
    expect(all).not.toContain('/clear')
    expect(await ui.find({ type: 'Text', text: /7 instaladas · 0 usadas/ })).toBeTruthy()
    for (const block of ['Economia de tokens (2)', 'Instagram e conteúdo (1)', 'Design e visual (1)', 'Estudos (1)', 'Outras (2)']) {
      expect(await ui.find({ type: 'Button', text: new RegExp(block.replace(/[()]/g, '\\$&')) })).toBeTruthy()
    }
    // Economia vem aberto: descrições em português
    expect(await ui.find({ type: 'Text', text: /menos tokens gastos/ })).toBeTruthy()
    // Abrir "Outras": skill desconhecida mostra a descrição oficial
    await ui.press({ key: 'block:outras' })
    expect(await ui.find({ type: 'Text', text: 'Uma skill que o catálogo não conhece' })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: 'Run a large change in parallel' })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: '/minhas-skills' })).toBeFalsy()
    await ui.press({ key: 'block:outras' })
    await ui.unmount()
  }
})

test('skill usada fica verde, conta, e o botão "Em uso" filtra', async ($, on) => {
  setup(on)
  await $.skill.prompt({ skill: 'caveman:caveman', text: 'x', frontmatter: {}, source: 'plugin' })
  await $.skill.prompt({ skill: 'caveman:caveman', text: 'x', frontmatter: {}, source: 'plugin' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /1 usadas/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: 'usada 2x nesta sessão' })).toBeTruthy()
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn).toMatch(/"color":"success"[^}]*\},"children":\["●"\]/)
  await ui.press({ key: 'filter:used' })
  expect(await ui.find({ type: 'Text', text: '/caveman:caveman' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: '/economia' })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /ig-reel-br/ })).toBeFalsy()
  expect(await ui.find({ type: 'Button', text: /Instagram/ })).toBeFalsy()
  await ui.press({ key: 'filter:all' })
  expect(JSON.stringify(await ui.drawn())).toContain('Instagram e conteúdo')
  await ui.unmount()
})

test('"Usar" coloca o comando da skill na caixa de mensagem', async ($, on) => {
  const { filled, toasts } = setup(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'use:caveman:caveman' })
  expect(filled).toEqual(['/caveman:caveman '])
  expect(toasts.join(' ')).toContain('escreva o pedido')
  await ui.unmount()
})

test('sugestões aparecem para a última mensagem, com botão Usar', async ($, on) => {
  const { filled } = setup(on)
  const before = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await before.find({ type: 'Text', text: /Mande uma mensagem/ })).toBeTruthy()
  await before.unmount()
  await $.prompt.submit({ text: 'faz um roteiro de reel pra minha clínica', wait: false, origin: { kind: 'composer' } })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'combina com: reel, roteiro' })).toBeTruthy()
  await ui.press({ key: 'use:tip:instagram-br:ig-reel-br' })
  expect(filled).toEqual(['/instagram-br:ig-reel-br '])
  await ui.unmount()
})

test('empate nas sugestões prefere a versão em português', async () => {
  expect(suggest('humanizar a legenda', ['instagram-agent:ig-human', 'instagram-br:ig-human-br'])[0]?.name).toBe('instagram-br:ig-human-br')
})
