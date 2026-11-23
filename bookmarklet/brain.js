// Cérebro: lê uma pasta de notas .md (cofre do Obsidian ou parecido) que você escolhe.
// A pasta escolhida fica lembrada neste navegador; nada sai do seu computador.
;(function (root) {
  const DB = 'token-meter', STORE = 'kv'
  const idb = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  async function kv(key, value) {
    const db = await idb()
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, value === undefined ? 'readonly' : 'readwrite')
      const st = tx.objectStore(STORE)
      const r = value === undefined ? st.get(key) : st.put(value, key)
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
  }

  const SKIP = new Set(['.obsidian', '.trash', '.git', 'node_modules', '.logseq'])
  const MAX_FILES = 6000

  async function* walk(dir, path = '') {
    for await (const [name, h] of dir.entries()) {
      if (SKIP.has(name) || name.startsWith('.')) continue
      if (h.kind === 'directory') yield* walk(h, path ? `${path}/${name}` : name)
      else if (name.toLowerCase().endsWith('.md')) yield { h, path, name }
    }
  }

  /** Resumo do cofre: notas, palavras, pastas, recentes, tarefas abertas, tags. */
  function summarize(files) {
    const folders = new Map(), tags = new Map(), tasks = []
    let words = 0, done = 0
    for (const f of files) {
      const top = f.path.split('/')[0] || '(raiz)'
      folders.set(top, (folders.get(top) || 0) + 1)
      words += (f.text.match(/\S+/g) || []).length
      for (const m of f.text.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu)) tags.set(m[1], (tags.get(m[1]) || 0) + 1)
      for (const m of f.text.matchAll(/^\s*[-*] \[( |x|X)\] (.+)$/gm)) {
        if (m[1] === ' ') tasks.push({ text: m[2].trim(), note: f.name.replace(/\.md$/i, ''), mtime: f.mtime })
        else done++
      }
    }
    const recent = files.slice().sort((a, b) => b.mtime - a.mtime).slice(0, 8).map(f => ({ name: f.name.replace(/\.md$/i, ''), path: f.path, mtime: f.mtime }))
    tasks.sort((a, b) => b.mtime - a.mtime)
    const week = Date.now() - 7 * 864e5
    return {
      notes: files.length,
      words,
      editedThisWeek: files.filter(f => f.mtime >= week).length,
      folders: [...folders].sort((a, b) => b[1] - a[1]).slice(0, 6),
      tags: [...tags].sort((a, b) => b[1] - a[1]).slice(0, 10),
      tasksOpen: tasks.length,
      tasksDone: done,
      tasks: tasks.slice(0, 8),
      recent,
    }
  }

  async function scan(dir) {
    const files = []
    for await (const f of walk(dir)) {
      if (files.length >= MAX_FILES) break
      const file = await f.h.getFile()
      files.push({ name: f.name, path: f.path, mtime: file.lastModified, text: await file.text() })
    }
    return { ...summarize(files), vault: dir.name, scannedAt: Date.now(), truncated: files.length >= MAX_FILES }
  }

  async function pick() {
    if (!('showDirectoryPicker' in window)) throw new Error('Este navegador não deixa escolher pastas (use o Chrome no computador).')
    const dir = await window.showDirectoryPicker({ id: 'token-meter-vault', mode: 'read' })
    await kv('vault', dir).catch(() => {}) // sem lembrar, funciona até recarregar a página
    return dir
  }

  /** Pasta lembrada, se ainda tiver permissão; `ask` pede de novo (precisa de um clique). */
  async function remembered(ask) {
    const dir = await kv('vault').catch(() => null)
    if (!dir) return { dir: null, needs: 'pick' }
    let p = await dir.queryPermission({ mode: 'read' })
    if (p !== 'granted' && ask) p = await dir.requestPermission({ mode: 'read' })
    return p === 'granted' ? { dir, needs: null } : { dir, needs: 'permission' }
  }

  root.TMBrain = { pick, remembered, scan, summarize }
})(typeof self !== 'undefined' ? self : globalThis)
