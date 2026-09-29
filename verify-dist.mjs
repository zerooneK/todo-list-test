// Drives the REAL production bundle in jsdom: the same JS Vercel serves.
import { JSDOM, VirtualConsole } from 'jsdom'
import { readFileSync } from 'fs'

const html = readFileSync('dist/index.html', 'utf8')
const vc = new VirtualConsole()
const errors = []
vc.on('jsdomError', e => errors.push(e.message))
vc.on('error', (...a) => errors.push(String(a)))

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  url: 'https://todo-app-react-zeta-nine.vercel.app/',
  virtualConsole: vc,
})
const { window } = dom
window.matchMedia = window.matchMedia || (_q => ({ matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }))

// Load the built bundle exactly as the browser would.
const jsPath = 'dist' + html.match(/src="(\/assets\/index-[^"]+\.js)"/)[1]
const code = readFileSync(jsPath, 'utf8')
window.eval(code)
await new Promise(r => setTimeout(r, 300))

const doc = window.document
const $ = sel => doc.querySelector(sel)
const byText = (sel, text) => [...doc.querySelectorAll(sel)].find(e => e.textContent.trim() === text)
const input = $('#task-input')
const results = []
const check = (name, ok) => { results.push({ name, ok }); if (!ok) console.log(`FAIL  ${name}`) }

check('app rendered the input', !!input)
check('empty list shows calm line', doc.body.textContent.includes('Nothing here yet'))
check('download button present', !!byText('button', 'Download my tasks'))
check('restore button present', !!byText('button', 'Restore from a backup'))
const findToggle = () => [...doc.querySelectorAll('button')].find(b => /^Use the (light|dark) look$/.test(b.getAttribute('aria-label') || ''))
check('theme toggle present', !!findToggle())

// React tracks the value on the DOM node, so a controlled input must be
// updated through its own setter for React to notice.
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }))
const setValue = (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(el, value)
  fire(el, 'input')
}

// Add a task with Enter, the way a person does.
setValue(input, 'Call the dentist')
input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
await new Promise(r => setTimeout(r, 50))
check('Enter added a task', doc.body.textContent.includes('Call the dentist'))
check('input cleared and still focused', input.value === '')

// Add a second, no click back.
setValue(input, 'Water the plants')
input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
await new Promise(r => setTimeout(r, 50))
check('second task added with Enter alone', doc.body.textContent.includes('Water the plants'))
check('two tasks listed', doc.querySelectorAll('.task-item').length === 2)

// Tick one done.
const cb = doc.querySelector('input[type=checkbox]')
check('done checkbox present', !!cb)
const cbSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set
cbSetter.call(cb, true)
fire(cb, 'change')
await new Promise(r => setTimeout(r, 50))
check('task marked done', !!$('.task-item .completed') || !!doc.querySelector('input[type=checkbox]:checked'))

// Saved to storage?
const saved = window.localStorage.getItem('tasks')
check('tasks saved to browser storage', !!saved && saved.includes('Call the dentist'))

// Undo offer appears on removal.
const del = doc.querySelector('.delete-btn')
del.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
await new Promise(r => setTimeout(r, 50))
check('removal is undoable', doc.body.textContent.toLowerCase().includes('undo'))

// Theme toggle.
const themeBtn = findToggle()
const before = doc.documentElement.getAttribute('data-theme')
themeBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
await new Promise(r => setTimeout(r, 50))
const after = doc.documentElement.getAttribute('data-theme')
check('theme toggle changes the look', before !== after && ['light','dark'].includes(after))
check('theme choice remembered', !!window.localStorage.getItem('theme'))

// The app is calm: no animation, no transition, no gradient.
const css = readFileSync('dist' + html.match(/href="(\/assets\/index-[^"]+\.css)"/)[1], 'utf8')
// A blanket "transition: none" is a guard that kills motion, not motion itself.
const motion = css
  .replace(/transition\s*:\s*none\s*!important/g, '')
  .replace(/animation\s*:\s*none\s*!important/g, '')
check('no animation or transition', !/@keyframes|transition:|animation:/.test(motion))
check('motion is actively switched off', /transition\s*:\s*none\s*!important/.test(css))
check('no gradient', !/gradient/.test(css))

check('no console errors', errors.length === 0)

let failed = 0
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`) }
if (errors.length) console.log('errors:', errors.slice(0,3))
console.log(`\n${results.length - failed}/${results.length} passed against the production bundle`)
process.exit(failed ? 1 : 0)
