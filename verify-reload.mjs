// Tasks must survive closing and reopening the page, and a backup taken in the
// published build must be restorable. Drives the real production bundle twice,
// against one browser's storage, so the two page loads are the same browser.
import {
  browserStorage, button, click, createReporter, openApp, pause,
  pressEnter, readBuild, typeInto,
} from './verify-harness.mjs'

const build = readBuild()
const { check, report } = createReporter()

// One storage shared between the two visits, standing in for one browser.
const storage = browserStorage()

const first = await openApp(build, { storage })
const input1 = first.doc.querySelector('#task-input')
typeInto(first.window, input1, 'Survives a reload')
pressEnter(first.window, input1)
await pause()
check('task added in first visit', first.doc.body.textContent.includes('Survives a reload'))

// Close the page and open a new one, keeping the same browser storage.
first.window.close()
const second = await openApp(build, { storage })
check('task survived closing and reopening the page', second.doc.body.textContent.includes('Survives a reload'))

// A backup taken in the published build must contain the task.
const w = second.window
let captured = null
w.URL.createObjectURL = blob => { captured = blob; return 'blob:x' }
w.URL.revokeObjectURL = () => {}
click(w, button(second.doc, 'Download my tasks'))
await pause()
check('download produced a backup file', !!captured)
if (captured) {
  const body = await captured.text()
  check('backup contains the task', body.includes('Survives a reload'))
  check('backup is readable JSON', (() => { try { JSON.parse(body); return true } catch { return false } })())
}

// Empty the list, by the name on the remove button.
click(w, button(second.doc, '×'))
await pause()
check('list emptied', !second.doc.body.textContent.includes('Survives a reload'))

// Restore, through the visible button a person presses, then confirm.
const restoreBtn = button(second.doc, 'Restore from a backup')
check('restore offers a visible button', !!restoreBtn)
const fileInput = second.doc.querySelector('#restore-input')
const file = new w.File(
  [JSON.stringify({ app: 'tasks', version: 1, tasks: [{ id: 1, text: 'Recovered from backup', completed: false }] })],
  'tasks-2026-01-01.json',
  { type: 'application/json' }
)
Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })
fileInput.dispatchEvent(new w.Event('change', { bubbles: true }))
await pause(120)

const confirm = button(second.doc, 'Replace my list')
check('restore asks before replacing the list', !!confirm)
if (confirm) {
  click(w, confirm)
  await pause()
  check('restore brought the task back', second.doc.body.textContent.includes('Recovered from backup'))
}

// jsdom cannot follow a blob: URL, which is exactly what a download link is.
// Real browsers download via the `download` attribute without navigating, so
// that one message is a limitation of the test rig, not the app.
const realErrors = [...first.errors, ...second.errors]
  .filter(e => !/Not implemented: navigation to another Document/.test(e))
check('no console errors', realErrors.length === 0)
if (realErrors.length) console.log('errors seen:', realErrors)

process.exit(report('(published build, across a page reload)') ? 1 : 0)
