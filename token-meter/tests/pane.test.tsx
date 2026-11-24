import { expect, test } from 'claude-code/testing'

const props = { isFocused: false, bodyColumns: 60, scroll: { offset: 0, bodyRows: 60 }, view: {} }
const PANE = { plugin: 'token-meter', component: 'Pane', requestId: 'token-meter', props: { ...props, title: 'Tokens & Modelos', placement: 'dock' } } as const
const RAIL = { plugin: 'token-meter', component: 'Pane', requestId: 'token-meter-rail', props: { ...props, title: 'Tokens', placement: 'widget', anchoredEdges: [] } } as const

import type { SessionMeasureInput } from 'claude-code'

const MEASURE: SessionMeasureInput = {
  context: { tokens: 85000, window: 1000000, percent: 8.5 },
  rateLimits: [{ kind: 'five_hour', percentUsed: 42 }, { kind: 'seven_day', percentUsed: 71 }],
  cost: { usd: 0.42 },
  changed: ['context', 'cost', 'rateLimits'],
}

test('painel: contexto, custo, limites e troca para o guia', async ($, on) => {
  const opened: string[] = []
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('ui.open', (_, e) => (opened.push(e.id), { value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('session.surfaces', () => ({ value: ['desktop'] }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.session.measure(MEASURE)
  expect(opened).toContain('token-meter-rail')

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /85\.0k de/ }))?.text).toContain('1.00M')
    expect(await ui.find({ type: 'Text', text: '$0.420' })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: '71%' })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /⚠ 71/ })).toBeFalsy()
    expect(await ui.find({ type: 'Text', text: /Limite de Semana em 71%/ })).toBeTruthy()
    await ui.press({ key: 'tab-guia' })
    expect(await ui.find({ type: 'Text', text: 'OPUS 5.5 · PADRÃO' })).toBeTruthy()
    await ui.press({ key: 'tab-uso' })
    await ui.unmount()
  }
})

test('widget da barra lateral mostra o resumo', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('ui.status', () => ({ value: undefined }))
  await $.session.measure(MEASURE)
  const ui = await $.ui.mount({ ...RAIL, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'CUSTO' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: '$0.420' })).toBeTruthy()
  await ui.unmount()
})

test('no desktop os medidores são gráficos; no terminal, barras', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('ui.status', () => ({ value: undefined }))
  await $.session.measure(MEASURE)
  const desk = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(JSON.stringify(await desk.drawn())).toContain('"type":"Svg"')
  await desk.unmount()
  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const drawn = JSON.stringify(await term.drawn())
  expect(drawn).not.toContain('"type":"Svg"')
  expect(drawn).toContain('"Contexto"')
  expect(drawn).toContain('"Limite Semana"')
  expect(drawn).not.toContain('requisição')
  await term.unmount()
})

const stepUsage = (model: string) =>
  async function* (_: unknown, e: { turnId: string; index: number }) {
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn' as const, usage: { model, input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } }
  }

test('modelo errado: x vermelho com modelo e esforço sugeridos; dispensar some', async ($, on) => {
  const toasts: string[] = []
  on('ui.toast', (_, e) => (toasts.push(JSON.stringify(e)), { value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('turn.step', stepUsage('claude-fable-5-2'))
  await $.prompt.submit({ text: 'o que é um hook?', wait: false, origin: { kind: 'composer' } })
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'claude-fable-5-2', effort: 'high', messageCount: 1 })) { /* drena */ }
  expect(toasts.join(' ')).toContain('Sonnet 5.5 · low')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: '✗' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: 'Sonnet 5.5 · low' })).toBeTruthy()
  await ui.press({ key: 'dismiss' })
  expect(await ui.find({ type: 'Text', text: '✗' })).toBeFalsy()
  await ui.unmount()
})

test('modelo certo: check verde', async ($, on) => {
  on('ui.toast', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('turn.step', stepUsage('claude-opus-5-5'))
  await $.prompt.submit({ text: 'adiciona um botão de logout no header da página de configurações', wait: false, origin: { kind: 'composer' } })
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'claude-opus-5-5', effort: 'medium', messageCount: 1 })) { /* drena */ }
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const check = await ui.drawn()
  expect(JSON.stringify(check)).toMatch(/"color":"success"[^}]*\},"children":\["✓"\]/)
  expect(await ui.find({ type: 'Text', text: 'Opus 5.5 · medium' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Cache acertando/ })).toBeFalsy()
  await ui.unmount()
})

test('sem emoji no aviso de limite, e anéis sem largura fixa', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('ui.status', () => ({ value: undefined }))
  await $.session.measure(MEASURE)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn).not.toMatch(/[⚠⛔💡]/)
  expect(drawn).not.toContain('minWidth')
  expect(drawn).toContain('"width":"33%"')
  await ui.unmount()
})
