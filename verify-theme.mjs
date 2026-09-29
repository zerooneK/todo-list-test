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

// The ring that shows a keyboard user where they are.
//
// Every control in the app says "press me" by changing colour on hover, so a
// person using a keyboard had no way to tell which control they were on. The
// ring is keyboard-only, so it costs a mouse user nothing.
//
// It is checked here, against the real built CSS, because jsdom does not
// evaluate a stylesheet and would happily pass on a rule that no browser ever
// applies. These read the rule rather than trusting it.
export function checkFocusRing(css, check) {
  // The build minifies, so this arrives as `:where(button,input,[tabindex])`.
  const ring = css.match(/:where\(([^)]*)\):focus-visible\s*\{([^}]*)\}/)

  check('a keyboard focus ring exists in the built stylesheet', !!ring)

  if (ring) {
    const covered = ring[1]
    const rule = ring[2]

    // Which elements the ring reaches is the substance of the change, so each
    // kind of control is pinned by name. A ring that quietly stops covering
    // checkboxes, or the text inputs, is invisible in a diff.
    for (const element of ['button', 'input']) {
      check(`the focus ring covers every ${element}`,
        new RegExp(`(?:^|,)${element}(?:,|\\$)`).test(covered))
    }

    check('the focus ring is drawn, not left to the browser default',
      /outline\s*:\s*\d+px\s+solid/.test(rule))
    check('the focus ring is held off the control so it stays visible',
      /outline-offset\s*:\s*[1-9]/.test(rule))
    // The accent colour is defined by both looks, so the ring follows whichever
    // one is active without a colour of its own.
    check('the focus ring uses a colour both looks define',
      /var\(\s*--color-accent\s*\)/.test(rule))
  }

  // Anything that erases an outline erases the ring with it. `outline: 0` and
  // `outline-width: 0` are the same act as `outline: none`, and a build will
  // happily emit either.
  // The app has no rule that needs an outline removed, so any is a mistake: the
  // only outline in the stylesheet should be the ring. This catches `outline: 0`
  // and `outline-width: 0` as well as `outline: none`.
  const erases = css.match(/outline(?:-width)?\s*:\s*(?:none|0)\b/g) || []
  check('no control turns its focus outline off', erases.length === 0)

  // A ring that moved or faded would be motion. Transitions and animations are
  // already ruled out for the whole stylesheet by the calm-look check; only
  // `transform` needs saying here, since nothing else in the app uses one.
  check('the focus ring adds no motion',
    !/focus-visible[^{]*\{[^}]*transform/.test(css))

  // The visually hidden file input is taken out of the tab order in the markup
  // (tabIndex={-1}), not here: it is 1px across, so a ring drawn round it would
  // be invisible, and tabbing to a control that shows nothing is worse than not
  // tabbing to it. The visible Restore button proxies it and carries focus.
  // Driven as behaviour in the app checks; asserted here only that the input is
  // still visually hidden, which is what makes the tab stop wrong.
  const hiddenInput = css.match(/#restore-input\s*\{([^}]*)\}/)
  check('the file input is still hidden behind the Restore button',
    !!hiddenInput && /clip\s*:/.test(hiddenInput[1]))
}
