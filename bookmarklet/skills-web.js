// Skills no claude.ai: a lista (do catálogo do mod economia), quais a conversa usou, e o botão Usar.
;(function (root) {
  const C = root.TMCatalog
  // Estas só existem no Claude Code; no claude.ai não aparecem.
  const CODE_ONLY = new Set(['economia', 'claude-api', 'loop', 'session-start-hook', 'code-review', 'simplify', 'run', 'plugin-authoring',
    'update-config', 'fewer-permission-prompts', 'design', 'design-sync', 'whiteboard', 'slides', 'verify', 'debug', 'batch',
    'run-skill-generator', 'dataviz', 'anthropic-skills:built-in-browser', 'anthropic-skills:computer-use'])

  const short = name => name.split(':').pop()

  /** As skills do catálogo que fazem sentido no claude.ai. */
  function webList() {
    return Object.keys(C.CATALOG).filter(n => !CODE_ONLY.has(n))
  }

  // Pastas que guardam skills mas não são o nome delas.
  const CONTAINERS = new Set(['public', 'user', 'private', 'examples', 'anthropic', 'skills', 'mnt', 'custom'])
  const SKILL_TOOLS = /^(skill|use_skill|load_skill|read_skill|invoke_skill)$/i

  function walkBlocks(conv, fn) {
    for (const m of conv?.chat_messages ?? []) for (const b of Array.isArray(m.content) ? m.content : []) fn(b)
  }

  /** Nomes (curtos) das skills que a conversa usou, de três jeitos:
   *  1) caminho de arquivo dentro de uma pasta skills/ (o Claude lê o SKILL.md da skill);
   *  2) ferramenta de skill chamada com o nome dela;
   *  3) o nome de uma skill conhecida aparecendo num caminho ou entrada de ferramenta. */
  function usedIn(conv, known = []) {
    const used = new Map()
    const add = n => { n = String(n || '').toLowerCase().split(':').pop(); if (n && !CONTAINERS.has(n)) used.set(n, (used.get(n) || 0) + 1) }
    walkBlocks(conv, b => {
      if (b.type !== 'tool_use' && b.type !== 'tool_result' && b.type !== 'server_tool_use') return
      const raw = JSON.stringify(b)
      for (const m of raw.matchAll(/skills\/((?:[a-z0-9_-]+\/){1,3})/gi)) {
        const segs = m[1].split('/').filter(Boolean).filter(x => !CONTAINERS.has(x.toLowerCase()))
        if (segs[0]) add(segs[0])
      }
      if (b.type === 'tool_use' && SKILL_TOOLS.test(b.name || '')) {
        const i = b.input || {}
        add(i.skill || i.name || i.skill_name || i.command)
      }
      if (b.type === 'tool_use') for (const k of known) if (raw.toLowerCase().includes('/' + short(k).toLowerCase() + '/')) add(k)
    })
    return used
  }

  /** Para o diagnóstico: quais ferramentas a conversa usou e quantas vezes, e os caminhos de skills vistos. */
  function diagnose(conv) {
    const tools = new Map(), paths = new Set()
    walkBlocks(conv, b => {
      if (b.type === 'tool_use' || b.type === 'server_tool_use') tools.set(b.name || '?', (tools.get(b.name || '?') || 0) + 1)
      for (const m of JSON.stringify(b).matchAll(/[\w./-]*skills\/[\w./-]+/gi)) paths.add(m[0].slice(0, 90))
    })
    return { tools: [...tools], paths: [...paths].slice(0, 8), messages: (conv?.chat_messages ?? []).length }
  }

  const usedCount = (used, name) => used.get(short(name).toLowerCase()) || 0

  /** Escreve na caixa de mensagem do claude.ai. Devolve false se não achou a caixa. */
  function insert(text) {
    const box = document.querySelector('div[contenteditable="true"].ProseMirror') || document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea')
    if (!box) return false
    box.focus()
    if (box.tagName === 'TEXTAREA') {
      const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
      set.call(box, text)
      box.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    }
    const sel = window.getSelection()
    sel.removeAllRanges()
    const r = document.createRange()
    r.selectNodeContents(box)
    sel.addRange(r)
    return document.execCommand('insertText', false, text)
  }

  const useText = name => `Use a skill "${short(name)}" para: `

  root.TMSkills = { webList, usedIn, usedCount, insert, useText, short, CODE_ONLY, diagnose }
})(typeof self !== 'undefined' ? self : globalThis)
