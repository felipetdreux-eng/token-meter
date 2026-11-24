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

  /** Nomes (curtos) das skills que a conversa usou: o Claude lê o SKILL.md de cada uma que usa. */
  function usedIn(conv) {
    const used = new Map()
    const raw = JSON.stringify(conv?.chat_messages ?? [])
    for (const m of raw.matchAll(/skills\/(?:[^"\\\s]*\/)?([a-z0-9][a-z0-9-]*)\/SKILL\.md/gi)) {
      const n = m[1].toLowerCase()
      used.set(n, (used.get(n) || 0) + 1)
    }
    return used
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

  root.TMSkills = { webList, usedIn, usedCount, insert, useText, short, CODE_ONLY }
})(typeof self !== 'undefined' ? self : globalThis)
