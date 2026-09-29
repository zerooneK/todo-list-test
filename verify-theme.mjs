// The look before the first paint.
import { JSDOM } from 'jsdom'
//
// The rule "a stored choice wins, otherwise the device decides" exists twice by
// necessity: once in a small script in index.html that runs before the bundle
// exists, and once in the app. They cannot import from each other, so what can
// be pinned is that they agree — over every combination, not just the ones that
// seemed worth testing. A mismatch means the page paints one look and then
// switches to another, which is the flash this script exists to prevent.
//
// The media query in index.css is not a third copy. It is the fallback that
// applies the dark look if the script is blocked or throws, which is why the
// script is allowed to leave the attribute unset.

const STORED_VALUES = ['light', 'dark', null, 'nonsense', '']

function whatThePagePaints(attribute, devicePrefersDark) {
  // No attribute means the stylesheet's own media query decides.
  return attribute ?? (devicePrefersDark ? 'dark' : 'light')
}

function matchMediaFor(deviceDark) {
  return q => ({
    matches: q.includes('dark') && deviceDark,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  })
}

function seedTheme(window, stored) {
  if (stored === null) window.localStorage.removeItem('theme')
  else window.localStorage.setItem('theme', stored)
}

// What the page paints on its very first frame: the pre-paint script alone,
// with no app at all.
function whatThePagePaintsFirst(html, stored, deviceDark) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x/' })
  const { window } = dom
  window.matchMedia = matchMediaFor(deviceDark)
  seedTheme(window, stored)
  for (const s of [...window.document.querySelectorAll('script')]) {
    if (!s.src) window.eval(s.textContent)
  }
  const painted = whatThePagePaints(
    window.document.documentElement.getAttribute('data-theme'),
    deviceDark
  )
  window.close()
  return painted
}

// What the running app settles on, driving the real built bundle so a change in
// App.jsx is actually seen rather than transcribed.
async function whatTheAppChooses(html, code, stored, deviceDark) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x/' })
  const { window } = dom
  window.matchMedia = matchMediaFor(deviceDark)
  seedTheme(window, stored)
  window.eval(code)
  await new Promise(r => setTimeout(r, 150))
  const chosen = window.document.documentElement.getAttribute('data-theme')
  window.close()
  return chosen
}

export async function checkThemePrePaint(html, code, check) {
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(m => m[1])
    .join('\n')

  check('index.html has a pre-paint script', script.includes('data-theme'))

  for (const stored of STORED_VALUES) {
    for (const deviceDark of [false, true]) {
      const label = `stored=${JSON.stringify(stored)} device=${deviceDark ? 'dark' : 'light'}`

      const painted = whatThePagePaintsFirst(html, stored, deviceDark)
      const chosen = await whatTheAppChooses(html, code, stored, deviceDark)

      check(`the app keeps the look the page painted — ${label}`, painted === chosen)
    }
  }
}

// The stylesheet's own media query is the third mechanism, and the only thing
// that applies the dark look when the pre-paint script is blocked or throws.
// It is checked against the real built CSS rather than assumed, because losing
// it would leave a person with no choice and a dark device looking at a light
// page. jsdom does not evaluate a stylesheet, so this reads the rule itself.
export function checkDeviceFallback(css, check) {
  // The build minifies, so `data-theme='light'` may arrive without its quotes.
  const darkBlock = css.match(/prefers-color-scheme:\s*dark\)\s*\{([\s\S]*?)\}/)

  check('the stylesheet follows the device when nothing is chosen', !!darkBlock)

  if (darkBlock) {
    const block = darkBlock[1]
    check('the device fallback does not override an explicit light choice',
      /:root:not\(\[data-theme=['"]?light['"]?\]\)/.test(block))
    check('the dark look has real values behind the fallback',
      /--color-page:\s*#/.test(block))
  }
}
