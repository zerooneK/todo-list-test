// One harness behind the two scripts that drive the published app.
//
// Both scripts used to open the built page, stub the browser, and work out
// pass or fail separately. That meant the two could disagree about how the app
// is used, which is exactly the drift a check exists to prevent. This is the
// shared way of doing it, so there is one place to change.
import { JSDOM, VirtualConsole } from 'jsdom'
import { readFileSync } from 'fs'

const PUBLISHED = 'https://todo-app-react-zeta-nine.vercel.app/'

// A no-op matchMedia, since jsdom has no device setting to consult.
export function matchMediaStub(matchesDark = false) {
  return q => ({
    matches: q.includes('dark') && matchesDark,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  })
}

// The built page, exactly as the browser receives it.
export function readBuild() {
  const html = readFileSync('dist/index.html', 'utf8')
  const jsPath = 'dist' + html.match(/src="(\/assets\/index-[^"]+\.js)"/)[1]
  const cssPath = 'dist' + html.match(/href="(\/assets\/index-[^"]+\.css)"/)[1]
  return {
    html,
    code: readFileSync(jsPath, 'utf8'),
    css: readFileSync(cssPath, 'utf8'),
  }
}

// Open the built app in jsdom. Each call is a separate page load, so
// `storage` is how a caller carries one browser across two visits.
//
// The stylesheet is deliberately not injected here, even though readBuild
// returns it. It was measured rather than assumed: inject it and jsdom parses
// the sheet and reports no errors, but a computed style then comes back as the
// literal text `var(--font-size-title)` — not a length, and not the browser
// default it replaced, so it is assertable as neither. The sheet is also not
// read here because a selector jsdom cannot parse would surface as an error and
// fail the "no console errors" check for a reason that is not the app's fault.
//
// So: do not assert on computed styles through this function. Read the built
// CSS, the way checkFocusRing does. What a person can see is checked by
// text, role and checked state, which is what the app checks rely on anyway.
export async function openApp({ html, code }, { storage, deviceDark = false } = {}) {
  const virtualConsole = new VirtualConsole()
  const errors = []
  virtualConsole.on('jsdomError', e => errors.push(e.message))
  virtualConsole.on('error', (...a) => errors.push(String(a)))

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: PUBLISHED,
    virtualConsole,
  })
  const { window } = dom
  window.matchMedia = matchMediaStub(deviceDark)
  if (storage) {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
  }
  window.eval(code)
  await new Promise(r => setTimeout(r, 250))
  return { window, doc: window.document, errors }
}

// A browser's storage, shared between page loads. Each instance is its own
// "browser", so a caller can show a list surviving a reload.
export function browserStorage() {
  const items = new Map()
  return {
    getItem: k => (items.has(k) ? items.get(k) : null),
    setItem: (k, v) => items.set(k, String(v)),
    removeItem: k => items.delete(k),
    clear: () => items.clear(),
  }
}

// React tracks an input's value on the DOM node, so a controlled input has to
// be set through its own setter for React to notice. The same goes for a
// checkbox's checked state.
export function typeInto(window, input, text) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, text)
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

export function pressEnter(window, element) {
  element.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
}

export function click(window, element) {
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
}

export function toggleCheckbox(window, box) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set
  setter.call(box, true)
  box.dispatchEvent(new window.Event('change', { bubbles: true }))
}

// Finding things the way a person does — by the name on the button — rather
// than by a class name in a stylesheet.
export function button(doc, name) {
  return [...doc.querySelectorAll('button')]
    .find(b => b.textContent.trim() === name
      || (b.getAttribute('aria-label') || '').toLowerCase().includes(name.toLowerCase()))
}

export function pause(ms = 50) {
  return new Promise(r => setTimeout(r, ms))
}

// Pass or fail, counted and reported once at the end.
export function createReporter() {
  const results = []
  const check = (name, ok) => {
    results.push({ name, ok })
    if (!ok) console.log(`FAIL  ${name}`)
  }
  const report = (heading) => {
    const failed = results.filter(r => !r.ok).length
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`)
    console.log(`\n${results.length - failed}/${results.length} passed ${heading}`)
    return failed
  }
  return { check, report, results }
}
