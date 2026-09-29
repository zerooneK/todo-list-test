// A private or incognito window discards its saved data when it closes, so
// tasks added there are silently lost. Detection differs by browser: some
// refuse to write at all, some cannot be told apart from an ordinary window.
// These helpers never throw, so a storage failure can never stop the app.
export const STORAGE = {
  // Writing works, so tasks will survive in this window.
  AVAILABLE: 'available',
  // Writing is refused, which is what a private window usually does.
  PRIVATE: 'private',
  // No way to tell, so the app carries on quietly.
  UNKNOWN: 'unknown',
}

const PROBE_KEY = '__tasks_storage_probe__'

export function detectStorage() {
  try {
    const store = window.localStorage
    if (!store) return STORAGE.UNKNOWN
    store.setItem(PROBE_KEY, '1')
    store.removeItem(PROBE_KEY)
    return STORAGE.AVAILABLE
  } catch {
    // Refused or full. Either way, tasks cannot be relied on here.
    return STORAGE.PRIVATE
  }
}

export function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// Best-effort. A browser that refuses to store anything carries on without
// remembering, which is what the private-window notice is for; there is
// nothing to act on here, so nothing is returned.
export function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignored on purpose.
  }
}

// A stored string, exactly as it was written. Both a plain string and a
// timestamp arrive as strings here; deciding what a value means belongs to
// whoever stored it, not to this module.
export function readText(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeText(key, value) {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Nothing to do: the app still works, it just will not remember this.
  }
}
