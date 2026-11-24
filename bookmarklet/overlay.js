// Token Meter em favorito: painel flutuante no claude.ai com Uso, Agentes e Cérebro.
// Clicar no favorito de novo fecha o painel.
;(function () {
  if (window.__tokenMeter) { window.__tokenMeter.destroy(); return }
  if (!/(^|\.)claude\.ai$/.test(location.hostname)) { alert('Abra o claude.ai e clique no favorito de novo.'); return }
  const { TM, TMAgents, TMBrain, TMSkills, TMCatalog } = window

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
  .wrap { --bg:#faf9f5; --card:#fff; --text:#141413; --muted:#73726c; --line:#e8e6dc; --accent:#d97757; --track:#d977572a; --ok:#2f7d4f; --warn:#966c1e; --err:#ab2b3f; --info:#3b6fb6;
    position: fixed; top: 72px; right: 16px; z-index: 2147483000; width: 320px; max-height: calc(100vh - 96px); display:flex; flex-direction:column;
    background: var(--bg); color: var(--text); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 8px 30px #0002;
    font: 13px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .wrap.dark { --bg:#262624; --card:#30302e; --text:#faf9f5; --muted:#a6a39a; --line:#3d3d3a; --track:#d977572e; --ok:#5bbf7f; --warn:#ffc107; --err:#ff6b80; --info:#7aa7e8; box-shadow: 0 8px 30px #0006; }
  .wrap.min { width: auto; }
  .wrap.popped { position: static; width: auto; max-height: none; height: 100vh; border-radius: 0; border: none; box-shadow: none; }
  .act { margin: 0 12px 8px; border-radius: 10px; padding: 8px 10px; border: 1px solid var(--warn); display:flex; flex-direction:column; gap:6px; }
  .act .msg { font-size: 12px; font-weight: 600; color: var(--warn); }
  .act .btns { display:flex; gap:6px; }
  .act button { flex: 1; height: 30px; }
  .act.calm { border-color: var(--line); padding: 6px 10px; }
  .wrap.min main, .wrap.min footer, .wrap.min nav { display: none; }
  header { display:flex; align-items:center; gap:6px; padding:10px 12px 6px; }
  .brand { font-size:11px; font-weight:600; letter-spacing:.08em; color:var(--accent); flex:1; }
  .pill { font-weight:700; font-variant-numeric: tabular-nums; }
  button { background:none; border:1px solid var(--line); color:var(--text); border-radius:8px; height:26px; min-width:26px; cursor:pointer; font: 12px system-ui; padding:0 8px; }
  button:hover { border-color: var(--accent); }
  button.primary { background: var(--accent); border-color: var(--accent); color:#fff; font-weight:600; height:32px; width:100%; }
  nav { display:flex; gap:4px; padding: 0 12px 8px; }
  nav button { flex:1; border-radius: 999px; }
  button.on, nav button.on { background: var(--accent); border-color: var(--accent); color:#fff; font-weight:600; }
  main { padding: 0 12px 12px; display:flex; flex-direction:column; gap:10px; overflow:auto; }
  .muted { color: var(--muted); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:10px 12px; }
  .title { font-size:10px; font-weight:600; letter-spacing:.06em; color:var(--muted); text-transform:uppercase; margin-bottom:6px; }
  .badge { display:flex; align-items:center; gap:6px; flex-wrap: wrap; }
  .ok .mark { color: var(--ok); font-weight:700; }
  .bad { border-color: var(--err); }
  .bad .mark { color: var(--err); font-weight:700; font-size: 12px; }
  .why { font-size:11px; color:var(--muted); width:100%; }
  .alert { border-radius:10px; padding:6px 10px; font-weight:600; font-size:12px; border:1px solid; }
  .alert.warn { color:var(--warn); border-color:var(--warn); } .alert.err { color:var(--err); border-color:var(--err); }
  .rings { display:grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap:8px; }
  .gauge { display:flex; flex-direction:column; align-items:center; text-align:center; min-width:0; }
  .gauge svg { width:100%; max-width:84px; height:auto; }
  .num { font-size:18px; font-weight:700; font-variant-numeric: tabular-nums; }
  .label { font-size:11px; font-weight:600; } .sub { font-size:10px; color:var(--muted); }
  .stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); text-align:center; gap:4px; }
  .stats .num { font-size:15px; }
  .row { display:flex; align-items:flex-start; gap:8px; padding:6px 0; border-top:1px solid var(--line); }
  .row:first-of-type { border-top:none; }
  .dot { width:8px; height:8px; border-radius:50%; margin-top:5px; flex:none; background: var(--muted); }
  .dot.working { background: var(--info); box-shadow: 0 0 0 3px #3b6fb633; }
  .dot.blocked { background: var(--warn); } .dot.failed { background: var(--err); } .dot.review, .dot.okrun { background: var(--ok); }
  .grow { flex:1; min-width:0; }
  .ttl { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; color:var(--text); }
  a.ttl:hover { color: var(--accent); }
  .meta { font-size:11px; color:var(--muted); }
  .bar { height:6px; border-radius:99px; background: var(--track); overflow:hidden; margin-top:3px; }
  .bar > i { display:block; height:100%; background: var(--accent); border-radius:99px; }
  .chips { display:flex; flex-wrap:wrap; gap:4px; }
  .chip { font-size:11px; border:1px solid var(--line); border-radius:999px; padding:1px 8px; color: var(--muted); }
  .chip b { color: var(--text); }
  .blk { width:100%; text-align:left; height:auto; padding:6px 10px; font-weight:600; }
  .use { flex:none; }
  .green { color: var(--ok); } .gray { color: var(--line); }
  .note { font-size:11px; color: var(--ok); font-weight:600; }
  .tried { font: 10px ui-monospace, monospace; color: var(--muted); white-space: pre-wrap; }
  footer { display:flex; justify-content:space-between; padding: 8px 12px; border-top:1px solid var(--line); font-size:11px; }
  a { color: var(--accent); text-decoration:none; }
  </style>
  <div class="wrap">
    <header><span class="brand">TOKEN METER</span><span class="pill" id="pill"></span>
      <button id="pop" title="Abrir em janela própria (fica visível em outras abas)">⧉</button><button id="r" title="Atualizar">↻</button><button id="m" title="Minimizar">–</button><button id="x" title="Fechar">×</button></header>
    <div id="act"></div>
    <nav><button data-tab="uso">Uso</button><button data-tab="skills">Skills</button><button data-tab="agentes">Agentes</button><button data-tab="cerebro">Cérebro</button></nav>
    <main id="app"><p class="muted">Carregando…</p></main>
    <footer><span id="upd" class="muted"></span><a id="flink" href="/settings/usage">Settings › Usage</a></footer>
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
  const ago = t => {
    if (!t) return ''
    const s = Math.round((Date.now() - new Date(t).getTime()) / 1000)
    if (!isFinite(s)) return ''
    return s < 60 ? 'agora' : s < 3600 ? `há ${Math.round(s / 60)} min` : s < 86400 ? `há ${Math.round(s / 3600)} h` : `há ${Math.round(s / 86400)} d`
  }
  const until = t => {
    const ms = new Date(t).getTime() - Date.now()
    if (!t || !isFinite(ms)) return ''
    if (ms <= 0) return 'agora'
    const d = new Date(t), today = new Date()
    const hh = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const days = Math.round((new Date(d.toDateString()) - new Date(today.toDateString())) / 864e5)
    return days === 0 ? `hoje ${hh}` : days === 1 ? `amanhã ${hh}` : `${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })} ${hh}`
  }
  const resetText = iso => {
    const ms = new Date(iso).getTime() - Date.now()
    if (!iso || !isFinite(ms) || ms <= 0) return ''
    const h = Math.floor(ms / 3.6e6), m = Math.round((ms % 3.6e6) / 6e4)
    return h >= 24 ? `reseta em ${Math.floor(h / 24)}d ${h % 24}h` : `reseta em ${h}h${String(m).padStart(2, '0')}`
  }

  let tab = localStorage.getItem('tm-tab') || 'uso'
  let usage = null, agents = null, brain = null, brainNeeds = 'pick', brainBusy = false, brainErr = null
  try { brain = JSON.parse(localStorage.getItem('tm-brain') || 'null') } catch {}
  let orgId = null, lastUrl = location.href, timer = null, busy = false, agentsBusy = false

  // ---------- Uso ----------
  function viewUso() {
    if (!usage) return '<p class="muted">Carregando…</p>'
    const conv = usage.conversation
    const g = []
    if (conv) g.push({ label: 'Contexto', p: (conv.tokens / conv.window) * 100, w: 60, b: 80, sub: `~${fmt(conv.tokens)} de ${fmt(conv.window)}` })
    for (const l of usage.limits) g.push({ label: l.name, p: l.percent, w: 60, b: 85, sub: resetText(l.resetsAt) })
    const ctx = g.find(x => x.label === 'Contexto')
    const worst = g.filter(x => x.label !== 'Contexto').sort((a, b) => b.p - a.p)[0]
    let alert = ''
    if (ctx && ctx.p >= 80) alert = `<div class="alert err">Contexto em ~${Math.round(ctx.p)}%: comece uma conversa nova</div>`
    else if (worst && worst.p >= 85) alert = `<div class="alert err">Limite de ${esc(worst.label)} em ${Math.round(worst.p)}%: use um modelo menor</div>`
    else if (ctx && ctx.p >= 60) alert = `<div class="alert warn">Contexto em ~${Math.round(ctx.p)}%</div>`
    else if (worst && worst.p >= 60) alert = `<div class="alert warn">Limite de ${esc(worst.label)} em ${Math.round(worst.p)}%</div>`
    const b = conv?.badge
    const badge = b && b.isOk === null
      ? `<div class="card badge"><span class="mark muted">?</span><span class="muted">${esc(b.why)} Escolha o modelo no seletor da conversa e mande outra mensagem.</span></div>`
      : b
      ? b.isOk
        ? `<div class="card badge ok"><span class="mark">✓</span><strong>${esc(b.current)}</strong><span class="muted">certo para tarefa ${esc(b.kind)}</span></div>`
        : `<div class="card badge bad"><span class="mark">✗</span><span class="muted">${esc(b.current)} →</span><strong>${esc(b.recommend)}</strong><span class="why">${esc(b.why)} Troque no seletor de modelo.</span></div>`
      : conv ? '' : '<div class="card muted">Abra uma conversa para ver o contexto e o selo de modelo.</div>'
    const rings = g.length ? `<div class="rings">${g.map(x => `<div class="gauge">${ring(x.p, tone(x.p, x.w, x.b))}<div class="num">${Math.round(x.p)}%</div><div class="label">${esc(x.label)}</div><div class="sub">${esc(x.sub)}</div></div>`).join('')}</div>` : ''
    const stats = conv ? `<div class="card stats"><div><div class="num">~${fmt(conv.tokens)}</div><div class="sub">tokens</div></div><div><div class="num">${conv.messages}</div><div class="sub">mensagens</div></div><div><div class="num">${esc(TM.prettyModel(conv.model))}</div><div class="sub">modelo</div></div></div>` : ''
    const err = usage.error ? `<div class="alert warn">${esc(usage.error)}</div>` : ''
    return badge + alert + rings + stats + err
  }

  // ---------- Skills ----------
  let usedOnly = false, skillNote = '', showDiag = false
  const diagText = conv => {
    const d = conv?.diag
    if (!d) return 'Nenhuma conversa aberta.'
    return [`mensagens: ${d.messages}`, `ferramentas: ${d.tools.length ? d.tools.map(([n, c]) => `${n} x${c}`).join(', ') : 'nenhuma'}`,
      `caminhos de skills: ${d.paths.length ? '\n  ' + d.paths.join('\n  ') : 'nenhum'}`, `detectadas: ${Object.keys(conv.skillsUsed || {}).join(', ') || 'nenhuma'}`].join('\n')
  }
  let openBlocks = (() => { try { return JSON.parse(localStorage.getItem('tm-open') || '["conteudo"]') } catch { return ['conteudo'] } })()
  function viewSkills() {
    const conv = usage?.conversation
    const usedMap = new Map(Object.entries(conv?.skillsUsed ?? {}))
    const names = TMSkills.webList()
    const count = n => TMSkills.usedCount(usedMap, n)
    const usedN = names.filter(n => count(n) > 0).length
    const tips = conv?.lastHuman ? TMCatalog.suggest(conv.lastHuman, names) : []
    const row = (n, why) => {
      const e = TMCatalog.lookup(n), c = count(n)
      return `<div class="row"><span class="dot ${c ? 'okrun' : ''}"></span><div class="grow"><span class="ttl">${esc(TMSkills.short(n))}</span>
        <div class="meta" style="white-space:normal">${esc(e?.what ?? '')}</div>
        ${why ? `<div class="meta" style="color:var(--accent)">combina com: ${esc(why)}</div>` : ''}
        ${c ? `<div class="meta green">usada nesta conversa</div>` : ''}</div>
        <button class="use" data-use="${esc(n)}">Usar</button></div>`
    }
    const visible = usedOnly ? names.filter(n => count(n) > 0) : names
    const blocks = TMCatalog.BLOCKS.map(b => ({ ...b, items: visible.filter(n => (TMCatalog.lookup(n)?.block ?? 'outras') === b.id) })).filter(b => b.items.length)
    return `
      <div class="chips"><span class="chip"><b>${names.length}</b> skills</span><span class="chip"><b>${usedN}</b> usadas nesta conversa</span></div>
      <div style="display:flex;gap:4px"><button data-filter="all" class="${usedOnly ? '' : 'on'}" style="flex:1">Todas</button><button data-filter="used" class="${usedOnly ? 'on' : ''}" style="flex:1">${usedOnly ? '● ' : ''}Em uso (${usedN})</button></div>
      ${skillNote ? `<div class="note">${esc(skillNote)}</div>` : ''}
      <div class="card" style="border-color:var(--accent)"><div class="title" style="color:var(--accent)">Sugestões para sua última mensagem</div>
        ${tips.length ? tips.map(t => row(t.name, t.hits.join(', '))).join('') : `<p class="muted" style="margin:0">${conv?.lastHuman ? 'Nenhuma skill combina com a última mensagem.' : 'Abra uma conversa e mande uma mensagem: aqui aparecem as skills que combinam.'}</p>`}</div>
      ${usedOnly && !usedN ? '<p class="muted">Nenhuma skill usada nesta conversa ainda.</p>' : ''}
      ${blocks.map(b => {
        const isOpen = usedOnly || openBlocks.includes(b.id)
        const u = b.items.filter(n => count(n) > 0).length
        return `<div><button class="blk" data-block="${b.id}">${isOpen ? '▾' : '▸'} ${esc(b.title)} (${b.items.length})${u ? ` · <span class="green">${u} em uso</span>` : ''}</button>
          ${isOpen ? `<div class="card" style="margin-top:6px">${b.items.map(n => row(n)).join('')}</div>` : ''}</div>`
      }).join('')}
      <p class="meta">Verde = o Claude usou nesta conversa. "Usar" escreve o pedido na caixa de mensagem; você completa e envia.</p>
      <button data-diag style="width:100%">${showDiag ? 'Esconder diagnóstico' : 'Diagnóstico (se o verde não aparecer)'}</button>
      ${showDiag ? `<div class="card"><div class="title">O que esta conversa tem</div><div class="tried">${esc(diagText(conv))}</div><p class="meta" style="margin:6px 0 0">Mande um print disto se uma skill usada não ficar verde.</p></div>` : ''}`
  }
  function wireSkills() {
    for (const b of root.querySelectorAll('[data-use]')) b.onclick = async () => {
      const text = TMSkills.useText(b.dataset.use)
      if (TMSkills.insert(text)) skillNote = 'Escrevi na caixa de mensagem: complete o pedido e envie.'
      else { try { await navigator.clipboard.writeText(text) } catch {} skillNote = 'Não achei a caixa de mensagem: copiei o texto, cole lá.' }
      render(); setTimeout(() => { skillNote = ''; if (tab === 'skills') render() }, 6000)
    }
    for (const b of root.querySelectorAll('[data-block]')) b.onclick = () => {
      const id = b.dataset.block
      openBlocks = openBlocks.includes(id) ? openBlocks.filter(x => x !== id) : [...openBlocks, id]
      localStorage.setItem('tm-open', JSON.stringify(openBlocks)); render()
    }
    for (const b of root.querySelectorAll('[data-filter]')) b.onclick = () => { usedOnly = b.dataset.filter === 'used'; render() }
    const d = root.querySelector('[data-diag]')
    if (d) d.onclick = () => { showDiag = !showDiag; render() }
  }

  // ---------- Agentes ----------
  function viewAgentes() {
    if (!agents) return '<p class="muted">Procurando seus agentes…</p>'
    const { chats, sessions, triggers } = agents
    let html = ''
    if (chats) {
      const live = chats.filter(c => c.live)
      const recent = chats.filter(c => !c.live && c.recent)
      html += `<div class="card"><div class="title">Chats trabalhando agora · ${live.length}</div>${live.length
        ? live.map(c => `<div class="row"><span class="dot working"></span><div class="grow"><a class="ttl" href="/chat/${esc(c.id)}">${esc(c.name)}</a><div class="meta">respondendo${c.model ? ' · ' + esc(TM.prettyModel(c.model)) : ''}</div></div></div>`).join('')
        : '<p class="muted" style="margin:0">Nenhum chat respondendo agora.</p>'}
        ${recent.length ? `<div class="title" style="margin-top:8px">Mexidos nos últimos 15 min</div>${recent.slice(0, 6).map(c => `<div class="row"><span class="dot okrun"></span><div class="grow"><a class="ttl" href="/chat/${esc(c.id)}">${esc(c.name)}</a><div class="meta">${esc(ago(c.updatedAt))}</div></div></div>`).join('')}` : ''}</div>`
    } else {
      html += '<div class="alert warn">Não consegui ler a lista de chats do claude.ai.</div>'
    }
    if (!sessions && !triggers) {
      return html + '<p class="meta">Sessões do Claude Code: não dá para ler daqui. Veja em <a href="/code" target="_blank">claude.ai/code</a>.</p>'
    }
    if (sessions) {
      const count = k => sessions.filter(s => s.state.key === k).length
      html += `<div class="chips"><span class="chip"><b>${count('working')}</b> trabalhando</span><span class="chip"><b>${count('blocked')}</b> esperando você</span><span class="chip"><b>${count('failed')}</b> falharam</span><span class="chip"><b>${triggers ? triggers.filter(t => t.enabled).length : '—'}</b> agendadas</span></div>`
      const order = { working: 0, blocked: 1, failed: 2, review: 3, done: 4 }
      const list = sessions.slice().sort((a, b) => order[a.state.key] - order[b.state.key] || new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10)
      html += `<div class="card"><div class="title">Sessões</div>${list.map(s => `<div class="row"><span class="dot ${s.state.key}"></span><div class="grow"><a class="ttl" href="/code/${esc(s.id)}" target="_blank">${esc(s.title)}</a><div class="meta">${esc(s.state.label)} · ${esc(ago(s.updatedAt))}</div>${s.note ? `<div class="meta">${esc(s.note.slice(0, 120))}</div>` : ''}</div></div>`).join('') || '<p class="muted">Nenhuma sessão.</p>'}</div>`
    }
    if (triggers) {
      const list = triggers.slice().sort((a, b) => (b.enabled - a.enabled) || new Date(a.nextRunAt) - new Date(b.nextRunAt))
      html += `<div class="card"><div class="title">Tarefas agendadas</div>${list.map(t => {
        const last = t.lastStatus ? (/SUCC/i.test(t.lastStatus) ? 'okrun' : /FAIL/i.test(t.lastStatus) ? 'failed' : '') : ''
        const lastTxt = t.lastStatus ? `última ${/SUCC/i.test(t.lastStatus) ? 'deu certo' : /FAIL/i.test(t.lastStatus) ? 'falhou' : t.lastStatus.toLowerCase()} ${ago(t.lastAt)}` : t.lastAt ? `rodou ${ago(t.lastAt)}` : 'ainda não rodou'
        return `<div class="row"><span class="dot ${t.enabled ? last : ''}"></span><div class="grow"><span class="ttl ${t.enabled ? '' : 'muted'}">${esc(t.name)}</span><div class="meta">${t.enabled ? `próxima: ${esc(until(t.nextRunAt) || '—')}` : 'pausada'} · ${esc(lastTxt)}</div></div></div>`
      }).join('') || '<p class="muted">Nenhuma tarefa agendada.</p>'}</div>`
    }
    return html
  }

  // ---------- Cérebro ----------
  function viewCerebro() {
    let head = ''
    if (brainNeeds === 'pick') head = `<div class="card"><div class="title">Segundo cérebro</div><p class="muted" style="margin:0 0 8px">Escolha a pasta do seu cofre (Obsidian ou outra pasta de notas .md). Ela fica lembrada neste navegador; nada sai do seu computador.</p><button class="primary" id="pick">Escolher pasta do cofre</button></div>`
    else if (brainNeeds === 'permission') head = `<button class="primary" id="grant">Liberar leitura do cofre${brain ? ` "${esc(brain.vault)}"` : ''}</button>`
    if (brainErr) head += `<div class="alert warn">${esc(brainErr)}</div>`
    if (brainBusy) head += '<p class="muted">Lendo suas notas…</p>'
    if (!brain) return head
    const b = brain
    const taskPct = b.tasksOpen + b.tasksDone ? Math.round((b.tasksDone / (b.tasksOpen + b.tasksDone)) * 100) : 0
    const maxF = Math.max(1, ...b.folders.map(f => f[1]))
    return head + `
      <div class="card stats">
        <div><div class="num">${fmt(b.notes)}</div><div class="sub">notas</div></div>
        <div><div class="num">${fmt(b.words)}</div><div class="sub">palavras</div></div>
        <div><div class="num">${b.editedThisWeek}</div><div class="sub">editadas 7d</div></div>
        <div><div class="num">${b.tasksOpen}</div><div class="sub">tarefas abertas</div></div>
      </div>
      <div class="card"><div class="title">Tarefas · ${taskPct}% feitas</div><div class="bar"><i style="width:${taskPct}%"></i></div>
        ${b.tasks.map(t => `<div class="row"><span class="dot"></span><div class="grow"><span class="ttl" style="white-space:normal">${esc(t.text.slice(0, 140))}</span><div class="meta">${esc(t.note)}</div></div></div>`).join('') || '<p class="muted">Nenhuma tarefa aberta.</p>'}</div>
      <div class="card"><div class="title">Mexidas por último</div>${b.recent.map(r => `<div class="row"><span class="dot okrun"></span><div class="grow"><span class="ttl">${esc(r.name)}</span><div class="meta">${esc(r.path || 'raiz')} · ${esc(ago(r.mtime))}</div></div></div>`).join('')}</div>
      <div class="card"><div class="title">Áreas</div>${b.folders.map(([f, n]) => `<div style="margin:4px 0"><div class="meta" style="display:flex;justify-content:space-between"><span>${esc(f)}</span><span>${n}</span></div><div class="bar"><i style="width:${(n / maxF) * 100}%"></i></div></div>`).join('')}</div>
      ${b.tags.length ? `<div class="card"><div class="title">Tags mais usadas</div><div class="chips">${b.tags.map(([t, n]) => `<span class="chip">#${esc(t)} <b>${n}</b></span>`).join('')}</div></div>` : ''}
      <p class="meta">Cofre "${esc(b.vault)}" lido ${esc(ago(b.scannedAt))}${b.truncated ? ' (só as primeiras 6.000 notas)' : ''}.</p>`
  }

  function render() {
    wrap.classList.toggle('dark', isDark())
    for (const b of root.querySelectorAll('nav button')) b.classList.toggle('on', b.dataset.tab === tab)
    $('#app').innerHTML = tab === 'uso' ? viewUso() : tab === 'skills' ? viewSkills() : tab === 'agentes' ? viewAgentes() : viewCerebro()
    if (tab === 'skills') wireSkills()
    $('#flink').textContent = tab === 'agentes' ? 'claude.ai/code' : 'Settings › Usage'
    $('#flink').setAttribute('href', tab === 'agentes' ? '/code' : '/settings/usage')
    const pick = $('#pick'), grant = $('#grant')
    if (pick) pick.onclick = async () => { try { const dir = await TMBrain.pick(); brainNeeds = null; await scanBrain(dir) } catch (e) { if (e.name !== 'AbortError') { brainErr = e.message; render() } } }
    if (grant) grant.onclick = async () => { const r = await TMBrain.remembered(true); brainNeeds = r.needs; if (r.dir && !r.needs) await scanBrain(r.dir); else render() }
    const worst = usage?.limits?.slice().sort((a, b) => b.percent - a.percent)[0]
    $('#pill').textContent = wrap.classList.contains('min') && worst ? `${Math.round(worst.percent)}%` : ''
    $('#pill').style.color = worst ? tone(worst.percent, 60, 85) : ''
    upd()
  }
  function upd() {
    const t = tab === 'uso' || tab === 'skills' ? usage?.updatedAt : tab === 'agentes' ? agents?.updatedAt : brain?.scannedAt
    $('#upd').textContent = t ? `atualizado ${ago(t)}` : ''
  }

  // Plano B: o nome do modelo escrito no botão de modelo da página.
  function modelFromPage() {
    const sel = ['[data-testid="model-selector-dropdown"]', 'button[data-testid*="model"]', 'button[aria-label*="model" i]', 'button[aria-haspopup="menu"]']
    for (const q of sel) {
      for (const el of document.querySelectorAll(q)) {
        const t = (el.innerText || el.getAttribute('aria-label') || '').trim()
        if (/haiku|sonnet|opus|fable|mythos/i.test(t)) return t
      }
    }
    return null
  }
  // Este chat está gerando resposta agora? (botão de parar visível)
  const isStreamingHere = () => !!document.querySelector('button[aria-label*="Stop" i], button[aria-label*="Parar" i], [data-testid="stop-button"]')

  // ---------- Continuar / Permitir ----------
  // Procura na página do claude.ai: botão de permissão (ex.: "Allow once"), botão "Continue",
  // e se o Claude está respondendo. O painel mostra o botão certo e clica por você.
  const pageButtons = () => [...document.querySelectorAll('button')].filter(b => !host.contains(b) && b.getClientRects().length > 0)
  const labelOf = b => (b.innerText || b.getAttribute('aria-label') || '').trim()
  function scanPage() {
    const btns = pageButtons()
    const permits = btns.filter(b => /^(allow|permitir|approve|aprovar)( once| uma vez| for this chat| neste chat| para este chat)?$/i.test(labelOf(b)))
    const once = permits.find(b => /once|uma vez/i.test(labelOf(b))) || permits.find(b => !/always|sempre/i.test(labelOf(b))) || null
    const cont = btns.find(b => /^(continue|continuar)$/i.test(labelOf(b))) || null
    return { permit: once, permitLabel: once ? labelOf(once) : '', cont, streaming: isStreamingHere(), inChat: !!TM.conversationIdFromUrl(location.pathname) }
  }
  let lastAct = ''
  function renderAct(force) {
    const st = scanPage()
    const key = `${!!st.permit}|${st.permitLabel}|${!!st.cont}|${st.streaming}|${st.inChat}`
    if (key === lastAct && !force) return
    lastAct = key
    const el = $('#act')
    if (st.permit) el.innerHTML = `<div class="act"><span class="msg">O Claude parou e pediu permissão ("${esc(st.permitLabel)}").</span><div class="btns"><button id="doPermit" class="on">Permitir</button></div></div>`
    else if (st.cont) el.innerHTML = `<div class="act"><span class="msg">A resposta parou no meio.</span><div class="btns"><button id="doCont" class="on">Continuar</button></div></div>`
    else if (st.inChat && !st.streaming) el.innerHTML = `<div class="act calm"><div class="btns"><button id="doSay" title="Manda &quot;continue&quot; na conversa">▶ Mandar continuar</button></div></div>`
    else el.innerHTML = ''
    const p = $('#doPermit'), c = $('#doCont'), say = $('#doSay')
    if (p) p.onclick = () => { scanPage().permit?.click(); setTimeout(() => renderAct(true), 800) }
    if (c) c.onclick = () => { scanPage().cont?.click(); setTimeout(() => renderAct(true), 800) }
    if (say) say.onclick = () => sendText('continue')
  }
  function sendText(text) {
    if (!TMSkills.insert(text)) { skillNote = 'Não achei a caixa de mensagem.'; render(); return }
    setTimeout(() => {
      const send = pageButtons().find(b => /send|enviar/i.test(b.getAttribute('aria-label') || '') && !b.disabled)
      if (send) send.click()
      else {
        const box = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea')
        box?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }))
      }
      setTimeout(() => renderAct(true), 800)
    }, 150)
  }

  // ---------- Janela própria ----------
  let popWin = null
  async function popOut() {
    if (popWin) { popWin.close(); return }
    let w = null
    try {
      if (window.documentPictureInPicture) w = await window.documentPictureInPicture.requestWindow({ width: 360, height: 820 })
    } catch {}
    if (!w) w = window.open('', 'token-meter', 'width=380,height=860')
    if (!w) { skillNote = 'O Chrome bloqueou a janela: libere pop-ups do claude.ai.'; render(); return }
    if (!w.document.body) { w.document.write('<!doctype html><title>Token Meter</title><body style="margin:0"></body>'); w.document.close() }
    w.document.title = 'Token Meter'
    w.document.body.style.margin = '0'
    w.document.body.appendChild(host)
    wrap.classList.add('popped'); $('#pop').textContent = '⤓'; $('#pop').title = 'Voltar o painel para a página'
    popWin = w
    w.addEventListener('pagehide', () => {
      popWin = null
      if (window.__tokenMeter) { document.body.appendChild(host); wrap.classList.remove('popped'); $('#pop').textContent = '⧉'; $('#pop').title = 'Abrir em janela própria (fica visível em outras abas)' }
    })
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
  async function refreshUsage() {
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
        if (!est.model) est.model = modelFromPage()
        next.conversation = { tokens: est.tokens, messages: est.messages, model: est.model, window: TM.contextWindow(est.model), badge: est.lastHuman ? TM.advise(TM.classify(est.lastHuman), est.model) : null,
          lastHuman: est.lastHuman, skillsUsed: Object.fromEntries(TMSkills.usedIn(conv, TMSkills.webList())), diag: TMSkills.diagnose(conv) }
      }
    } catch (e) { next.error = e.message; orgId = null }
    busy = false
    usage = next
    render()
  }
  async function refreshAgents() {
    if (agentsBusy) return
    agentsBusy = true
    try {
      orgId = orgId ?? (await getOrgId())
      let chats = null
      try {
        const list = await getJson(`/api/organizations/${orgId}/chat_conversations?limit=30`)
        const arr = Array.isArray(list) ? list : Array.isArray(list?.data) ? list.data : []
        const here = TM.conversationIdFromUrl(location.pathname)
        chats = arr.map(c => {
          const age = (Date.now() - new Date(c.updated_at || c.created_at).getTime()) / 1000
          const live = (c.uuid === here && isStreamingHere()) || age < 120
          return { id: c.uuid, name: c.name || 'Chat sem título', model: c.model || null, updatedAt: c.updated_at || c.created_at, live, recent: age < 900 }
        })
      } catch {}
      const s = await TMAgents.tryPaths(TMAgents.SESSION_PATHS, orgId)
      const t = await TMAgents.tryPaths(TMAgents.TRIGGER_PATHS, orgId)
      agents = { updatedAt: Date.now(), chats, sessions: s.json ? TMAgents.parseSessions(s.json) : null, triggers: t.json ? TMAgents.parseTriggers(t.json) : null, tried: [...s.tried, ...t.tried] }
    } catch (e) {
      agents = { updatedAt: Date.now(), chats: null, sessions: null, triggers: null, tried: [e.message] }
    }
    agentsBusy = false
    if (tab === 'agentes') render()
  }
  async function scanBrain(dir) {
    brainBusy = true; brainErr = null; render()
    try {
      brain = await TMBrain.scan(dir)
      localStorage.setItem('tm-brain', JSON.stringify(brain))
    } catch (e) { brainErr = `Não consegui ler o cofre (${e.message})` }
    brainBusy = false
    render()
  }
  async function refreshBrain() {
    const r = await TMBrain.remembered(false).catch(() => ({ dir: null, needs: 'pick' }))
    brainNeeds = r.needs
    if (r.dir && !r.needs) await scanBrain(r.dir)
    else if (tab === 'cerebro') render()
  }
  const refreshAll = () => { refreshUsage(); refreshAgents(); if (tab === 'cerebro') refreshBrain() }
  const soon = ms => { clearTimeout(timer); timer = setTimeout(refreshUsage, ms) }

  const ivs = [
    setInterval(() => renderAct(false), 2000),
    setInterval(() => { if (location.href !== lastUrl) { lastUrl = location.href; soon(800) } }, 1000),
    setInterval(refreshUsage, 60000),
    setInterval(refreshAgents, 90000),
    setInterval(() => { if (!brainNeeds) refreshBrain() }, 300000),
    setInterval(upd, 5000),
  ]
  const mo = new MutationObserver(muts => { if (muts.some(m => !host.contains(m.target))) soon(3000) })
  mo.observe(document.body, { childList: true, subtree: true, characterData: true })

  for (const b of root.querySelectorAll('nav button')) b.onclick = () => { tab = b.dataset.tab; localStorage.setItem('tm-tab', tab); render(); if (tab === 'cerebro') refreshBrain(); if (tab === 'agentes' && !agents) refreshAgents() }
  $('#r').onclick = refreshAll
  $('#pop').onclick = popOut
  $('#m').onclick = () => { wrap.classList.toggle('min'); $('#m').textContent = wrap.classList.contains('min') ? '+' : '–'; render() }
  $('#x').onclick = () => window.__tokenMeter.destroy()

  window.__tokenMeter = { destroy() { ivs.forEach(clearInterval); clearTimeout(timer); mo.disconnect(); host.remove(); delete window.__tokenMeter; if (popWin) popWin.close() } }
  render()
  renderAct(true)
  refreshUsage()
  refreshAgents()
  refreshBrain()
})()
