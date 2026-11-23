import { expect, test } from 'claude-code/testing'
import { advise, classify } from '../hooks/advisor'

test('classifica pedidos', async () => {
  expect(classify('o que é um hook?')).toBe('simples')
  expect(classify('valeu')).toBe('simples')
  expect(classify('refatora o módulo de pagamentos e investiga por que os testes de integração quebraram')).toBe('complexa')
  expect(classify('adiciona um botão de logout no header da página de configurações')).toBe('normal')
})

test('aprova o certo e sugere modelo e esforço no errado', async () => {
  expect(advise('normal', 'claude-opus-5-5', 'medium', 0).isOk).toBe(true)
  const s = advise('simples', 'claude-fable-5-2', 'high', 0)
  expect(s.isOk).toBe(false)
  expect(s.recommend).toBe('Sonnet 5.5 · low')
  expect(s.action).toBe('/model sonnet e esforço low')
  expect(advise('complexa', 'claude-haiku-5-5', undefined, 0).recommend).toBe('Opus 5.5 · high')
  expect(advise('complexa', 'claude-opus-5-5', 'low', 0).action).toBe('Mude o esforço para high em /model')
  expect(advise('simples', 'claude-fable-5-2', 'high', 200_000).text).toContain('perde o cache')
})
