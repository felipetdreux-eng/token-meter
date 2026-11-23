// Token Meter em favorito: painel flutuante no claude.ai, sem instalar extensão.
// Clicar no favorito de novo fecha o painel.
;(function () {
  if (window.__tokenMeter) { window.__tokenMeter.destroy(); return }
  if (!/(^|\.)claude\.ai$/.test(location.hostname)) { alert('Abra o claude.ai e clique no favorito de novo.'); return }
  const TM = window.TM

  const host = document.createElement('div')
  host.id = 'token-meter-host'
  const root = host.attachShadow({ mode: 'open' })
  document.body.appendChild(host)

  const isDark = () => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(document.body).backgroundColor || '')
    if (!m) return matchMedia('(prefers-color-scheme: dark)').matches
    return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255 < 0.5
  }

  root.innerHTML = `<style>
  :host { all: initial; }
  .wrap { --bg:#faf9f5; --card:#fff; --text:#141413; --muted:#73726c; --line:#e8e6dc; --accent:#d97757; --track:#d977572a; --ok:#2f7d4f; --warn:#966c1e; --err:#ab2b3f;
    position: fixed; top: 72px; right: 16px; z-index: 2147483000; width: 288px; max-height: calc(100vh - 96px); overflow: auto;
    background: var(--bg); color: var(--text); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 8px 30px #0002;
    font: 13px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .wrap.dark { --bg:#262624; --card:#30302e; --text:#faf9f5; --muted:#a6a39a; --line:#3d3d3a; --track:#d977572e; --ok:#5bbf7f; --warn:#ffc107; --err:#ff6b80; box-shadow: 0 8px 30px #0006; }
  .wrap.min { width: auto; }
  .wrap.min main, .wrap.min footer { display: none; }
  header { display:flex; align-items:center; gap:6px; padding:10px 12px; cursor: default; }
  .brand { font-size:11px; font-weight:600; letter-spacing:.08em; color:var(--accent); flex:1; }
  .pill { font-weight:700; font-variant-numeric: tabular-nums; }
  button { background:none; border:1px solid var(--line); color:var(--text); border-radius:8px; width:26px; height:26px; cursor:pointer; font: 13px system-ui; padding:0; }
  button:hover { border-color: var(--accent); }
  main { padding: 0 12px 12px; display:flex; flex-direction:column; gap:10px; }
  .muted { color: var(--muted); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:10px 12px; }
  .badge { display:flex; align-items:center; gap:6px; flex-wrap: wrap; }
  .ok .mark { color: var(--ok); font-weight:700; }
  .bad { border-color: var(--err); }
  .bad .mark { color: var(--err); font-weight:700; font-size: 12px; }
  .why { font-size:11px; color:var(--muted); width:100%; }
  .alert { border-radius:10px; padding:6px 10px; font-weight:600; font-size:12px; border:1px solid; }
  .alert.warn { color:var(--warn); border-color:var(--warn); } .alert.err { color:var(--err); border-color:var(--err); }
  .rings { display:grid; grid-template-columns: repeat(auto-fit, minmax(76px, 1fr)); gap:8px; }
  .gauge { display:flex; flex-direction:column; align-items:center; text-align:center; min-width:0; }
  .gauge svg { width:100%; max-width:84px; height:auto; }
  .num { font-size:18px; font-weight:700; font-variant-numeric: tabular-nums; }
  .label { font-size:11px; font-weight:600; } .sub { font-size:10px; color:var(--muted); }
  .stats { display:grid; grid-template-columns: repeat(3, 1fr); text-align:center; }
  .stats .num { font-size:14px; }
  footer { display:flex; justify-content:space-between; padding: 8px 12px; border-top:1px solid var(--line); font-size:11px; }
  a { color: var(--accent); text-decoration:none; }
  </style>
  <div class="wrap">
    <header><span class="brand">TOKENS</span><span class="pill" id="pill"></span>
      <button id="r" title="Atualizar">↻</button><button id="m" title="Minimizar">–</button><button id="x" title="Fechar">×</button></header>
    <main id="app"><p class="muted">Carregando…</p></main>
    <footer><span id="upd" class="muted"></span><a href="/settings/usage">Settings › Usage</a></footer>
  </div>`

  const $ = s => root.querySelector(s)
  const wrap = $('.wrap')
  const fmt = n => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n))
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const tone = (p, w, b) => (p >= b ? 'var(--err)' : p >= w ? 'var(--warn)' : 'var(--accent)')
  const ring = (p, color) => {
    const r = 50, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, p))
    return `<svg viewBox="0 0 112 112"><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--track)" stroke-width="12"/>${v > 0 ? `<circle cx="56" cy="56" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${((v / 100) * c).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 56 56)"/>` : ''}</svg>`
  }
  const resetText = iso => {
    const ms = new Date(iso).getTime() - Date.now()
    if (!iso || !isFinite(ms) || ms <= 0) return ''
    const h = Math.floor(ms / 3.6e6), m = Math.round((ms % 3.6e6) / 6e4)
    return h >= 24 ? `reseta em ${Math.floor(h / 24)}d ${h % 24}h` : `reseta em ${h}h${String(m).padStart(2, '0')}`
  }

  let state = null, orgId = null, lastUrl = '', timer = null, busy = false

  function render() {
    wrap.classList.toggle('dark', isDark())
    const app = $('#app')
    if (!state) return
    const conv = state.conversation
    const g = []
    if (conv) g.push({ label: 'Contexto', p: (conv.tokens / conv.window) * 100, w: 60, b: 80, sub: `~${fmt(conv.tokens)} de ${fmt(conv.window)}` })
    for (const l of state.limits) g.push({ label: l.name, p: l.percent, w: 60, b: 85, sub: resetText(l.resetsAt) })
    const ctx = g.find(x => x.label === 'Contexto')
    const worst = g.filter(x => x.label !== 'Contexto').sort((a, b) => b.p - a.p)[0]
    let alert = ''
    if (ctx && ctx.p >= 80) alert = `<div class="alert err">Contexto em ~${Math.round(ctx.p)}%: comece uma conversa nova</div>`
    else if (worst && worst.p >= 85) alert = `<div class="alert err">Limite de ${esc(worst.label)} em ${Math.round(worst.p)}%: use um modelo menor</div>`
    else if (ctx && ctx.p >= 60) alert = `<div class="alert warn">Contexto em ~${Math.round(ctx.p)}%</div>`
    else if (worst && worst.p >= 60) alert = `<div class="alert warn">Limite de ${esc(worst.label)} em ${Math.round(worst.p)}%</div>`
    const b = conv?.badge
    const badge = b
      ? b.isOk
        ? `<div class="card badge ok"><span class="mark">✓</span><strong>${esc(b.current)}</strong><span class="muted">certo para tarefa ${esc(b.kind)}</span></div>`
        : `<div class="card badge bad"><span class="mark">✗</span><span class="muted">${esc(b.current)} →</span><strong>${esc(b.recommend)}</strong><span class="why">${esc(b.why)} Troque no seletor de modelo.</span></div>`
      : conv ? '' : '<div class="card muted">Abra uma conversa para ver o contexto e o selo de modelo.</div>'
    const rings = g.length ? `<div class="rings">${g.map(x => `<div class="gauge">${ring(x.p, tone(x.p, x.w, x.b))}<div class="num">${Math.round(x.p)}%</div><div class="label">${esc(x.label)}</div><div class="sub">${esc(x.sub)}</div></div>`).join('')}</div>` : ''
    const stats = conv ? `<div class="card stats"><div><div class="num">~${fmt(conv.tokens)}</div><div class="sub">tokens</div></div><div><div class="num">${conv.messages}</div><div class="sub">mensagens</div></div><div><div class="num">${esc(TM.prettyModel(conv.model))}</div><div class="sub">modelo</div></div></div>` : ''
    const err = state.error ? `<div class="alert warn">${esc(state.error)}</div>` : ''
    app.innerHTML = badge + alert + rings + stats + err
    const top = worst ? `${Math.round(worst.p)}%` : ctx ? `${Math.round(ctx.p)}%` : ''
    $('#pill').textContent = wrap.classList.contains('min') ? top : ''
    $('#pill').style.color = worst ? tone(worst.p, 60, 85) : ''
    upd()
  }
  function upd() {
    if (!state) return
    const s = Math.round((Date.now() - state.updatedAt) / 1000)
    $('#upd').textContent = s < 5 ? 'atualizado agora' : s < 60 ? `há ${s}s` : `há ${Math.round(s / 60)} min`
  }

  async function getJson(path) {
    const r = await fetch(path, { credentials: 'include', headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error(`${path.split('?')[0].replace(/[0-9a-f-]{36}/g, '…')} respondeu ${r.status}`)
    return r.json()
  }
  async function getOrgId() {
    const c = /(?:^|;\s*)lastActiveOrg=([0-9a-f-]{36})/i.exec(document.cookie)
    if (c) return c[1]
    const list = await getJson('/api/organizations')
    const org = (Array.isArray(list) ? list : []).find(o => (o.capabilities ?? []).includes('chat')) ?? list?.[0]
    return org?.uuid ?? null
  }
  async function refresh() {
    if (busy) return
    busy = true
    const next = { updatedAt: Date.now(), limits: [], conversation: null, error: null }
    try {
      orgId = orgId ?? (await getOrgId())
      if (!orgId) throw new Error('não achei sua organização no claude.ai')
      try { next.limits = TM.parseUsage(await getJson(`/api/organizations/${orgId}/usage`)) } catch (e) { next.error = `Limites indisponíveis (${e.message})` }
      const id = TM.conversationIdFromUrl(location.pathname)
      if (id) {
        const conv = await getJson(`/api/organizations/${orgId}/chat_conversations/${id}?tree=False&rendering_mode=messages&render_all_tools=true`)
        const est = TM.estimateConversation(conv)
        next.conversation = { tokens: est.tokens, messages: est.messages, model: est.model, window: TM.contextWindow(est.model), badge: est.lastHuman ? TM.advise(TM.classify(est.lastHuman), est.model) : null }
      }
    } catch (e) { next.error = e.message; orgId = null }
    busy = false
    state = next
    render()
  }
  const soon = ms => { clearTimeout(timer); timer = setTimeout(refresh, ms) }

  const iv1 = setInterval(() => { if (location.href !== lastUrl) { lastUrl = location.href; soon(800) } }, 1000)
  const iv2 = setInterval(refresh, 60000)
  const iv3 = setInterval(upd, 5000)
  const mo = new MutationObserver(muts => { if (muts.some(m => !host.contains(m.target))) soon(3000) })
  mo.observe(document.body, { childList: true, subtree: true, characterData: true })

  $('#r').onclick = refresh
  $('#m').onclick = () => { wrap.classList.toggle('min'); $('#m').textContent = wrap.classList.contains('min') ? '+' : '–'; render() }
  $('#x').onclick = () => window.__tokenMeter.destroy()

  window.__tokenMeter = {
    destroy() { clearInterval(iv1); clearInterval(iv2); clearInterval(iv3); clearTimeout(timer); mo.disconnect(); host.remove(); delete window.__tokenMeter },
  }
  lastUrl = location.href
  render()
  refresh()
})()
