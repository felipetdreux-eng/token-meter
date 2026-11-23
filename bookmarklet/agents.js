// Agentes: sessões do Claude Code e tarefas agendadas, lidas com a sua sessão do claude.ai.
// Os endereços não são documentados; o painel tenta alguns e mostra o que respondeu.
;(function (root) {
  const SESSION_PATHS = ['/v1/code/sessions?limit=20', '/v1/sessions?beta=true&limit=20', '/api/code/sessions?limit=20']
  const TRIGGER_PATHS = ['/v1/code/triggers?limit=30', '/api/code/triggers?limit=30']

  async function tryPaths(paths, orgId) {
    const tried = []
    for (const p of paths) {
      for (const headers of [{}, { 'anthropic-version': '2023-06-01', 'x-organization-uuid': orgId }]) {
        try {
          const r = await fetch(p, { credentials: 'include', headers: { accept: 'application/json', ...headers } })
          tried.push(`${p.split('?')[0]}${Object.keys(headers).length ? ' (+org)' : ''}: ${r.status}`)
          if (r.ok) {
            const ct = r.headers.get('content-type') || ''
            if (!ct.includes('json')) continue
            return { json: await r.json(), tried }
          }
        } catch (e) {
          tried.push(`${p.split('?')[0]}: ${e.message}`)
        }
      }
    }
    return { json: null, tried }
  }

  const list = j => (Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : Array.isArray(j?.sessions) ? j.sessions : Array.isArray(j?.triggers) ? j.triggers : [])

  function sessionState(s) {
    const b = String(s.status_bucket || s.session_status || s.status || '').toUpperCase()
    if (b.includes('WORKING') || b.includes('RUNNING')) return { key: 'working', label: 'trabalhando' }
    if (b.includes('BLOCKED') || b.includes('REQUIRES') || b.includes('WAIT')) return { key: 'blocked', label: 'esperando você' }
    if (b.includes('FAILED') || b.includes('ERROR')) return { key: 'failed', label: 'falhou' }
    if (b.includes('REVIEW')) return { key: 'review', label: 'pronto p/ revisar' }
    return { key: 'done', label: 'parado' }
  }

  function parseSessions(j) {
    return list(j).map(s => ({
      id: s.id,
      title: s.title || s.name || 'Sessão sem título',
      state: sessionState(s),
      updatedAt: s.updated_at || s.created_at || null,
      note: s.post_turn_summary?.needs_action || s.post_turn_summary?.recent_action || '',
    }))
  }

  function parseTriggers(j) {
    return list(j).map(t => ({
      id: t.id,
      name: t.name || 'Tarefa',
      enabled: t.enabled !== false,
      nextRunAt: t.next_run_at || t.run_once_at || null,
      lastStatus: t.last_run?.status || null,
      lastAt: t.last_run?.fired_at || t.last_fired_at || null,
      lastSession: t.last_run?.session_id || null,
    }))
  }

  root.TMAgents = { tryPaths, parseSessions, parseTriggers, SESSION_PATHS, TRIGGER_PATHS }
})(typeof self !== 'undefined' ? self : globalThis)
