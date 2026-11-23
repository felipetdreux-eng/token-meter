// Funções puras: leem as respostas do claude.ai e calculam o que o painel mostra.
// Os endereços e campos são internos do claude.ai (não documentados): podem mudar sem aviso.
;(function (root) {
  const CONV_RE = /\/chat\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

  function conversationIdFromUrl(url) {
    const m = CONV_RE.exec(url || '')
    return m ? m[1] : null
  }

  // A API às vezes dá 0–1, às vezes 0–100.
  function pct(v) {
    if (typeof v !== 'number' || !isFinite(v)) return null
    return v > 0 && v < 1 ? v * 100 : v
  }

  function parseUsage(json) {
    const out = []
    if (!json || typeof json !== 'object') return out
    if (Array.isArray(json.limits) && json.limits.length) {
      for (const l of json.limits) {
        const p = pct(l.percent ?? l.utilization)
        if (p === null) continue
        const name =
          l.kind === 'session' ? '5 horas'
          : l.kind === 'weekly_all' ? 'Semana'
          : l.kind === 'weekly_scoped' ? `Semana · ${l.scope?.model?.display_name ?? 'modelo'}`
          : String(l.kind)
        out.push({ name, percent: p, resetsAt: l.resets_at ?? null })
      }
      return out
    }
    const legacy = [['five_hour', '5 horas'], ['seven_day', 'Semana'], ['seven_day_opus', 'Semana · Opus'], ['seven_day_sonnet', 'Semana · Sonnet']]
    for (const [key, name] of legacy) {
      const v = json[key]
      const p = pct(v?.utilization)
      if (p !== null) out.push({ name, percent: p, resetsAt: v.resets_at ?? null })
    }
    return out
  }

  const CHARS_PER_TOKEN = 3.5

  function blockText(b) {
    if (!b || typeof b !== 'object') return ''
    if (b.type === 'thinking') return '' // o raciocínio de turnos antigos não fica no contexto
    let s = ''
    if (typeof b.text === 'string') s += b.text
    if (b.input !== undefined) s += JSON.stringify(b.input)
    if (typeof b.content === 'string') s += b.content
    else if (Array.isArray(b.content)) s += b.content.map(blockText).join('')
    return s
  }

  /** Estimativa de tokens da conversa visível (texto, anexos, arquivos). Não inclui o prompt de sistema. */
  function estimateConversation(conv) {
    const msgs = Array.isArray(conv?.chat_messages) ? conv.chat_messages : []
    let chars = 0
    let fileTokens = 0
    let lastHuman = ''
    for (const m of msgs) {
      let text = ''
      if (Array.isArray(m.content)) text = m.content.map(blockText).join('')
      else if (typeof m.text === 'string') text = m.text
      chars += text.length
      for (const a of m.attachments ?? []) chars += (a.extracted_content ?? '').length
      for (const f of m.files ?? m.files_v2 ?? []) {
        if (f.file_kind === 'image') {
          const w = f.preview_asset?.image_width ?? 1000
          const h = f.preview_asset?.image_height ?? 1000
          fileTokens += Math.min(1600, Math.ceil((w * h) / 750))
        } else if (f.file_kind === 'document') {
          fileTokens += f.document_asset?.token_count ?? 1570 * (f.document_asset?.page_count ?? 1)
        }
      }
      if (m.sender === 'human') lastHuman = text
    }
    return { tokens: Math.round(chars / CHARS_PER_TOKEN) + fileTokens, messages: msgs.length, lastHuman, model: conv?.model ?? null }
  }

  // Janela de contexto do claude.ai por modelo (aproximada).
  function contextWindow(model) {
    const m = String(model || '').toLowerCase()
    if (/fable|mythos/.test(m)) return 500000
    if (/(opus|sonnet|haiku)-5/.test(m)) return 1000000
    if (/4-[678]/.test(m)) return 500000
    return 200000
  }

  function prettyModel(model) {
    const m = /(haiku|sonnet|opus|fable|mythos)-(\d+)(?:-(\d+))?/i.exec(model || '')
    if (!m) return model || 'modelo padrão'
    return `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}${m[3] ? '.' + m[3] : ''}`
  }

  const COMPLEX = ['refator', 'arquitet', 'debug', 'bug', 'não funciona', 'nao funciona', 'quebrou', 'por que', 'investig', 'migr', 'implement', 'otimiz', 'performance', 'seguran', 'planej', 'plano', 'integra', 'deploy', 'banco de dados', 'estratégia', 'estrategia', 'analis', 'compar', 'contrato', 'do zero', 'sistema', 'design', 'refactor', 'architecture']
  const SIMPLE = ['o que é', 'o que significa', 'qual é', 'qual o', 'traduz', 'renomei', 'ortografia', 'formata', 'resum', 'rápido', 'rapido', 'só ', 'apenas', 'lista', 'obrigado', 'valeu', 'beleza', 'ok', 'sim', 'continua']

  function classify(text) {
    const t = String(text || '').toLowerCase()
    const complex = COMPLEX.filter(k => t.includes(k)).length
    const simple = SIMPLE.filter(k => t.includes(k)).length
    if (t.length > 700 || t.includes('```') || complex >= 2 || (complex >= 1 && t.length > 80)) return 'complexa'
    if (complex === 0 && (t.length < 50 || simple >= 1)) return 'simples'
    return 'normal'
  }

  function tier(model) {
    const m = String(model || '').toLowerCase()
    if (m.includes('haiku')) return 0
    if (m.includes('sonnet')) return 1
    if (m.includes('opus')) return 2
    if (m.includes('fable') || m.includes('mythos')) return 3
    return -1
  }

  /** Selo do modelo para a tarefa: { isOk, kind, current, recommend, why }. */
  function advise(kind, model) {
    const t = tier(model)
    const current = prettyModel(model)
    const ok = { isOk: true, kind, current, recommend: current, why: `Certo para tarefa ${kind}.` }
    if (t < 0) return { ...ok, why: 'Modelo não identificado.' }
    if (kind === 'simples' && t >= 2) return { isOk: false, kind, current, recommend: 'Sonnet 5.5', why: `Tarefa simples no ${current}: gasta mais do seu limite sem ganho.` }
    if (kind === 'normal' && t === 0) return { isOk: false, kind, current, recommend: 'Sonnet 5.5', why: 'O Haiku pode não dar conta desta tarefa.' }
    if (kind === 'normal' && t === 3) return { isOk: false, kind, current, recommend: 'Opus 5.5', why: 'Fable para tarefa comum: consome muito limite sem ganho claro.' }
    if (kind === 'complexa' && t <= 1) return { isOk: false, kind, current, recommend: 'Opus 5.5', why: `Tarefa complexa no ${current}: pouco para isso.` }
    return ok
  }

  root.TM = { conversationIdFromUrl, parseUsage, estimateConversation, contextWindow, prettyModel, classify, advise }
})(typeof self !== 'undefined' ? self : globalThis)
