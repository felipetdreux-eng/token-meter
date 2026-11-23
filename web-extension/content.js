// Roda dentro do claude.ai: lê seus limites e a conversa aberta e entrega ao painel.
// Usa a sua própria sessão (cookies) e só fala com claude.ai.
;(function () {
  let orgId = null
  let lastUrl = ''
  let timer = null
  let busy = false

  async function getJson(path) {
    const r = await fetch(path, { credentials: 'include', headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error(`${path.split('?')[0]} respondeu ${r.status}`)
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
    const state = { updatedAt: Date.now(), limits: [], conversation: null, error: null }
    try {
      orgId = orgId ?? (await getOrgId())
      if (!orgId) throw new Error('não achei sua organização no claude.ai')
      try {
        state.limits = TM.parseUsage(await getJson(`/api/organizations/${orgId}/usage`))
      } catch (e) {
        state.error = `Limites indisponíveis (${e.message})`
      }
      const id = TM.conversationIdFromUrl(location.pathname)
      if (id) {
        const conv = await getJson(`/api/organizations/${orgId}/chat_conversations/${id}?tree=False&rendering_mode=messages&render_all_tools=true`)
        const est = TM.estimateConversation(conv)
        const kind = TM.classify(est.lastHuman)
        state.conversation = {
          id,
          name: conv?.name ?? '',
          tokens: est.tokens,
          messages: est.messages,
          model: est.model,
          window: TM.contextWindow(est.model),
          badge: est.lastHuman ? TM.advise(kind, est.model) : null,
        }
      }
    } catch (e) {
      state.error = e.message
      orgId = null
    } finally {
      busy = false
    }
    try {
      await chrome.storage.local.set({ tm: state })
    } catch {
      // a extensão foi recarregada; esta aba precisa de F5
    }
  }

  const soon = (ms = 3000) => {
    clearTimeout(timer)
    timer = setTimeout(refresh, ms)
  }

  // Trocou de conversa
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      soon(800)
    }
  }, 1000)
  // Mensagem nova: espera a resposta parar de chegar (3s sem mudanças) e atualiza
  new MutationObserver(() => soon(3000)).observe(document.body, { childList: true, subtree: true, characterData: true })
  // E de tempos em tempos, para os limites
  setInterval(refresh, 60000)
  // O painel pode pedir atualização
  chrome.runtime.onMessage.addListener(msg => {
    if (msg === 'tm-refresh') refresh()
  })
  refresh()
})()
