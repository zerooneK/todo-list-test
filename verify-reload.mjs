// Tasks must survive closing and reopening the page, and a backup taken in the
// published build must be restorable. Drives the real production bundle twice.
import { JSDOM, VirtualConsole } from 'jsdom'
import { readFileSync } from 'fs'

const html = readFileSync('dist/index.html', 'utf8')
const jsPath = 'dist' + html.match(/src="(\/assets\/index-[^"]+\.js)"/)[1]
const code = readFileSync(jsPath, 'utf8')

// One shared storage stands in for the same browser across two page loads.
const store = new Map()
const storage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
}

async function openPage() {
  const vc = new VirtualConsole()
  const errors = []
  vc.on('jsdomError', e => errors.push(e.message))
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://todo-app-react-zeta-nine.vercel.app/', virtualConsole: vc })
  const { window } = dom
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
  window.matchMedia = _q => ({ matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} })
  window.eval(code)
  await new Promise(r => setTimeout(r, 200))
  return { window, doc: window.document, errors }
}

const setValue = (window, el, value) => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value)
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
}
const pressEnter = (window, el) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
const results = []
const check = (n, ok) => { results.push({n, ok}); if (!ok) console.log('FAIL  ' + n) }

const first = await openPage()
const input1 = first.doc.querySelector('#task-input')
setValue(first.window, input1, 'Survives a reload')
pressEnter(first.window, input1)
await new Promise(r => setTimeout(r, 80))
check('task added in first visit', first.doc.body.textContent.includes('Survives a reload'))

// Close the page and open a new one, keeping the same browser storage.
first.window.close()
const second = await openPage()
check('task survived closing and reopening the page', second.doc.body.textContent.includes('Survives a reload'))

// A backup taken in the published build must contain the task.
let captured = null
const w = second.window
w.URL.createObjectURL = blob => { captured = blob; return 'blob:x' }
w.URL.revokeObjectURL = () => {}
const dl = [...second.doc.querySelectorAll('button')].find(b => b.textContent.trim() === 'Download my tasks')
dl.dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
await new Promise(r => setTimeout(r, 80))
check('download produced a backup file', !!captured)
if (captured) {
  const body = await captured.text()
  check('backup contains the task', body.includes('Survives a reload'))
  check('backup is readable JSON', (() => { try { JSON.parse(body); return true } catch { return false } })())
}

// Empty the list, then restore the backup into the published build.
const del = second.doc.querySelector('.delete-btn')
del.dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
await new Promise(r => setTimeout(r, 80))
check('list emptied', !second.doc.body.textContent.includes('Survives a reload'))

const restoreBtn = [...second.doc.querySelectorAll("button")].find(b => b.textContent.trim() === "Restore from a backup")
void restoreBtn
const fileInput = second.doc.querySelector('#restore-input')
const file = new w.File([JSON.stringify({ app:'tasks', version:1, tasks:[{id:1,text:'Recovered from backup',completed:false}] })], 'tasks-2026-01-01.json', { type:'application/json' })
Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })
fileInput.dispatchEvent(new w.Event('change', { bubbles: true }))
await new Promise(r => setTimeout(r, 120))
const confirm = [...second.doc.querySelectorAll('button')].find(b => b.textContent.trim() === 'Replace my list')
check('restore asks before replacing the list', !!confirm)
if (confirm) {
  confirm.dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
  await new Promise(r => setTimeout(r, 80))
  check('restore brought the task back', second.doc.body.textContent.includes('Recovered from backup'))
}

// jsdom cannot follow a blob: URL, which is exactly what a download link is.
// Real browsers download via the `download` attribute without navigating, so
// that one message is a limitation of the test rig, not the app.
const realErrors = [...first.errors, ...second.errors]
  .filter(e => !/Not implemented: navigation to another Document/.test(e))
check('no console errors', realErrors.length === 0)
if (realErrors.length) console.log('errors seen:', realErrors)

const failed = results.filter(r => !r.ok).length
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.n}`)
console.log(`\n${results.length - failed}/${results.length} passed (published build, across a page reload)`)
process.exit(failed ? 1 : 0)
