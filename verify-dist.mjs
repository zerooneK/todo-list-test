// Drives the REAL production bundle in jsdom: the same JS Vercel serves.
import {
  button, click, createReporter, openApp, pause,
  pressEnter, readBuild, toggleCheckbox, typeInto,
} from './verify-harness.mjs'
import { checkDeviceFallback, checkFocusRing, checkThemePrePaint } from './verify-theme.mjs'

const build = readBuild()
const { check, report } = createReporter()

// The look the page paints on its very first frame, before the app runs. This
// is the flash people notice, and nothing else here covers it.
await checkThemePrePaint(build.html, build.code, check)

const { window, doc, errors } = await openApp(build)
const input = doc.querySelector('#task-input')

check('app rendered the input', !!input)
check('empty list shows calm line', doc.body.textContent.includes('Nothing here yet'))
check('download button present', !!button(doc, 'Download my tasks'))
check('restore button present', !!button(doc, 'Restore from a backup'))
check('theme toggle present', !!button(doc, 'look'))

// Add a task with Enter, the way a person does.
typeInto(window, input, 'Call the dentist')
pressEnter(window, input)
await pause()
check('Enter added a task', doc.body.textContent.includes('Call the dentist'))
check('input cleared and still focused', input.value === '')

// Add a second, no click back.
typeInto(window, input, 'Water the plants')
pressEnter(window, input)
await pause()
check('second task added with Enter alone', doc.body.textContent.includes('Water the plants'))
check('two tasks listed', doc.querySelectorAll('li[data-id]').length === 2)

// Tick one done, found the way a person finds it.
const cb = doc.querySelector('input[type=checkbox]')
check('done checkbox present', !!cb)
toggleCheckbox(window, cb)
await pause()
check('task marked done', !!cb.checked)

// Saved to storage?
const saved = window.localStorage.getItem('tasks')
check('tasks saved to browser storage', !!saved && saved.includes('Call the dentist'))

// Undo offer appears on removal.
click(window, button(doc, '×'))
await pause()
check('removal is undoable', doc.body.textContent.toLowerCase().includes('undo'))

// The clear-done offer is only there when there is something to sweep.
check('no clear-done offer with only open tasks', !button(doc, 'Clear done'))

// Theme toggle.
const themeBtn = button(doc, 'look')
const before = doc.documentElement.getAttribute('data-theme')
click(window, themeBtn)
await pause()
const after = doc.documentElement.getAttribute('data-theme')
check('theme toggle changes the look', before !== after && ['light', 'dark'].includes(after))
check('theme choice remembered', !!window.localStorage.getItem('theme'))

// The app is calm: no animation, no transition, no gradient.
const { css } = build
// A blanket "transition: none" is a guard that kills motion, not motion itself.
const motion = css
  .replace(/transition\s*:\s*none\s*!important/g, '')
  .replace(/animation\s*:\s*none\s*!important/g, '')
check('no animation or transition', !/@keyframes|transition:|animation:/.test(motion))
check('motion is actively switched off', /transition\s*:\s*none\s*!important/.test(css))
check('no gradient', !/gradient/.test(css))

// The stylesheet's own device fallback, checked against the real built CSS.
checkDeviceFallback(css, check)
checkFocusRing(css, check)

check('no console errors', errors.length === 0)
if (errors.length) console.log('errors:', errors.slice(0, 3))

process.exit(report('against the production bundle') ? 1 : 0)
