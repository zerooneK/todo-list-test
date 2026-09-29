// What names a task.
//
// Task ids must be unique: several places compare them to find "this" task, so
// two tasks sharing an id are one task as far as the app is concerned. A
// timestamp is not a safe source, because two tasks can be added in the same
// millisecond, and a restored list carries whatever ids a file happened to
// contain. Ids are minted here and only here, and a list arriving from anywhere
// is re-identified on the way in.

// crypto.randomUUID is the good source, but it exists only in a secure context.
// Opening the app over plain http (a LAN address, say) has no such context, so
// there is a fallback built on getRandomValues, which is not gated. Collision
// odds stay negligible either way.
function fallbackId() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  // Shaped like a v4 UUID so both sources are indistinguishable downstream.
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// A value that cannot repeat.
export function newTaskId() {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()
  return fallbackId()
}

// A new task is open, and named.
export function newTask(text) {
  return { id: newTaskId(), text, completed: false }
}
// Bring in a list of tasks from anywhere — a backup file, saved data, or a
// hand-edited file — and make sure every task it holds is separately
// identifiable. Tasks that arrive with a usable, unique id keep it; anything
// missing or repeated is given a fresh one.
//
// Restoring deliberately does not preserve a file's ids. Nothing outside the
// task list refers to a task, so ids in a backup are an implementation detail
// rather than anything a person can observe, while guaranteeing uniqueness is
// worth a great deal. Old saved tasks from before this change come in the same
// way, which is why they need no migration.
export function asTaskList(tasks) {
  const seen = new Set()
  return tasks.map(task => {
    const id = task.id
    const usable = id !== undefined && id !== null && !seen.has(id)
    if (usable) { seen.add(id); return task }
    return { ...task, id: newTaskId() }
  })
}
