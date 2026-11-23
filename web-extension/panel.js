const fmt = n => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n))
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const tone = (p, warn, bad) => (p >= bad ? 'var(--err)' : p >= warn ? 'var(--warn)' : 'var(--accent)')

function ring(p, color) {
  const size = 112, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, p))
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
    ${v > 0 ? `<circle cx="56" cy="56" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${((v / 100) * c).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 56 56)"/>` : ''}
  </svg>`
}

function resetText(iso) {
  if (!iso) return ''
  const ms = new Date(iso).getTime() - Date.now()
  if (!isFinite(ms) || ms <= 0) return ''
  const h = Math.floor(ms / 3.6e6), m = Math.round((ms % 3.6e6) / 6e4)
  return h >= 24 ? `reseta em ${Math.floor(h / 24)}d ${h % 24}h` : `reseta em ${h}h${String(m).padStart(2, '0')}`
}

function render(state) {
  const app = document.getElementById('app')
  if (!state) {
    app.innerHTML = '<p class="muted">Abra o claude.ai numa aba para começar.</p>'
    return
  }
  const conv = state.conversation
  const gauges = []
  if (conv) {
    const p = (conv.tokens / conv.window) * 100
    gauges.push({ label: 'Contexto', p, warn: 60, bad: 80, sub: `~${fmt(conv.tokens)} de ${fmt(conv.window)}` })
  }
  for (const l of state.limits ?? []) gauges.push({ label: l.name, p: l.percent, warn: 60, bad: 85, sub: resetText(l.resetsAt) })

  // Frase de alerta: só aparece quando há algo a fazer.
  let alert = ''
  const ctx = gauges.find(g => g.label === 'Contexto')
  const worst = gauges.filter(g => g.label !== 'Contexto').sort((a, b) => b.p - a.p)[0]
  if (ctx && ctx.p >= 80) alert = `<div class="alert err">Contexto em ~${Math.round(ctx.p)}%: comece uma conversa nova</div>`
  else if (worst && worst.p >= 85) alert = `<div class="alert err">Limite de ${esc(worst.label)} em ${Math.round(worst.p)}%: use um modelo menor</div>`
  else if (ctx && ctx.p >= 60) alert = `<div class="alert warn">Contexto em ~${Math.round(ctx.p)}%: vá pensando em abrir outra conversa</div>`
  else if (worst && worst.p >= 60) alert = `<div class="alert warn">Limite de ${esc(worst.label)} em ${Math.round(worst.p)}%</div>`

  let badge = ''
  const b = conv?.badge
  if (b && b.isOk) {
    badge = `<div class="card badge ok"><span class="mark">✓</span><strong>${esc(b.current)}</strong><span class="why">certo para tarefa ${esc(b.kind)}</span></div>`
  } else if (b) {
    badge = `<div class="card badge bad">
      <div class="row"><span class="mark">✗</span><span class="muted">${esc(b.current)}</span><span class="muted">→</span><strong>${esc(b.recommend)}</strong></div>
      <div class="why">${esc(b.why)} Troque no seletor de modelo da conversa.</div>
    </div>`
  } else if (!conv) {
    badge = '<div class="card muted">Abra uma conversa para ver o contexto e o selo de modelo.</div>'
  }

  const rings = gauges.length
    ? `<div class="rings">${gauges
        .map(g => `<div class="gauge">${ring(g.p, tone(g.p, g.warn, g.bad))}<div class="num">${Math.round(g.p)}%</div><div class="label">${esc(g.label)}</div><div class="sub">${esc(g.sub)}</div></div>`)
        .join('')}</div>`
    : ''

  const stats = conv
    ? `<div class="card stats">
        <div><div class="num">~${fmt(conv.tokens)}</div><div class="sub">tokens na conversa</div></div>
        <div><div class="num">${conv.messages}</div><div class="sub">mensagens</div></div>
        <div><div class="num">${esc(TM.prettyModel(conv.model))}</div><div class="sub">modelo</div></div>
      </div>`
    : ''

  const error = state.error ? `<div class="alert warn">${esc(state.error)}</div>` : ''
  app.innerHTML = `${badge}${alert}${rings}${stats}${error}
    <p class="note">Contexto e tokens são estimativas pelo texto da conversa (sem o prompt de sistema). Os limites vêm do próprio claude.ai.</p>`
}

function updatedLabel(state) {
  const el = document.getElementById('updated')
  if (!state?.updatedAt) return (el.textContent = '')
  const s = Math.round((Date.now() - state.updatedAt) / 1000)
  el.textContent = s < 5 ? 'atualizado agora' : s < 60 ? `atualizado há ${s}s` : `atualizado há ${Math.round(s / 60)} min`
}

let current = null
async function load() {
  const { tm } = await chrome.storage.local.get('tm')
  current = tm ?? null
  render(current)
  updatedLabel(current)
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tm) {
    current = changes.tm.newValue
    render(current)
    updatedLabel(current)
  }
})
setInterval(() => updatedLabel(current), 5000)
document.getElementById('refresh').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ url: 'https://claude.ai/*' })
  for (const t of tabs) chrome.tabs.sendMessage(t.id, 'tm-refresh').catch(() => {})
})
load()
