# Agents

React todo app built with Vite.

## Run dev server

```bash
npm run dev
```

## Build for production

```bash
npm run build
```

## Published address

- **https://todo-app-react-zeta-nine.vercel.app**
- Deployed from `main` on Vercel; the repository stays the single source of
  the code
- No analytics, tracking or third-party scripts are in the app or added by
  Vercel. Only the app's own assets are served
- **Use an ordinary window, never a private one.** A private window throws its
  data away on close, so tasks added there are lost. The app warns when the
  browser refuses to save, but some browsers give no signal until the tab is
  closed, so the warning is a safety net rather than a guarantee
- Redeploy with `vercel deploy --prod`. Git auto-deploy on push is *not* wired
  up: `vercel git connect` needs the GitHub App installed on the repository, so
  it has to be done by hand in the Vercel and GitHub settings
- Tasks live in one browser on one device. Clearing that browser's data
  destroys them, which is what the download button exists to protect against

## Checking the published build

`npm test` covers behaviour in development. The built bundle is verified
separately, because that is what people actually run:

```bash
npm run verify:dist
```

- `verify-dist.mjs` drives the real production bundle in jsdom as a person
  would: add with Enter, tick, remove with Undo, switch theme, and confirms
  the calm style holds (no motion, no gradients) with no console errors
- `verify-theme.mjs` covers what jsdom cannot reach. It runs the pre-paint
  script alone, then the real app, and requires them to agree for every
  combination of stored choice and device, so a future edit to either side
  fails instead of silently reintroducing the flash. It also reads the real
  built CSS for the stylesheet facts a browser would apply and jsdom would not
  resolve: the device fallback, and the keyboard focus ring
- `verify-reload.mjs` opens the built app twice against the same storage to
  prove tasks survive a page reload, and that a backup taken in the built app
  is restorable
- `verify-harness.mjs` is the one way to drive the published app: it opens the
  built page, stubs the browser, and reports pass or fail. Both scripts use it,
  so the two cannot drift into checking the app differently. Nothing in any of
  them asserts on a CSS class name; they find things by the name a person sees
- The bundle served by Vercel was confirmed byte-identical (same sha256) to the
  one these checks drive, so what is verified is what is published

## Run dev server

## Structure

- `src/App.jsx` — root component: owns `tasks` + `currentView` state, passes props down
- `src/index.css` — shared design values (colours, spacing, type) as CSS
  variables; the single source of truth for both looks
- `src/App.css` — all styling, reading the shared values (Poppins font via
  `@import`)
- `src/components/` — stateless components: TaskInput, Filters, TaskList, TaskItem, TaskFooter
- `src/test/` — test setup plus the checks; see the testing seam note below
- `src/main.jsx` — entry point (do not edit)

## Saved data

- Saved under the key `tasks` in `localStorage`
- The older key `todos` is still read as a fallback and is never deleted, so a
  task list saved before the rename survives
- All storage access goes through `src/storage.js`, which never throws. A
  browser that refuses to store anything cannot take the app down

## Language

The app uses the glossary in `CONTEXT.md` throughout: task, task list, open
task, done task, view, clear done. The old "todo" wording is retired.

## The calm look

- Muted, soft colours; no gradients, no decorative shadows
- Nothing moves: no transitions, no animations, no transforms
- Generous spacing, and it stays readable on a narrow screen
- Colours and spacing live as CSS variables in `src/index.css`; the dark
  version overrides the same names rather than adding new ones
- The empty list shows one short calm line

## Theme

- One small toggle switches between the light and dark looks; the button
  reads "Light" or "Dark" and names the look it will switch **to**
- The choice is stored under the key `theme` and restored on the next visit
- With no stored choice, the app follows the device's own light/dark setting
- `index.html` runs a small script before first paint to set the look, so the
  app never flashes the wrong theme on load
- The rule "a stored choice wins, otherwise the device decides" necessarily
  exists in more than one place: the pre-paint script cannot import from a
  bundle that has not loaded. What is pinned is that the copies agree, over
  every combination of stored choice and device, by driving the real built page
- The `@media (prefers-color-scheme: dark)` rule in `index.css` is not a third
  copy. It is the only thing that applies the dark look if the pre-paint script
  is blocked or throws, so it is checked against the built CSS rather than
  assumed. Neither is the focus ring, which is the one style in the app that is
  about the keyboard rather than the mouse: it is drawn for keyboard focus only,
  in a colour both looks already define, and is checked against the built CSS
  because jsdom ignores `:focus-visible` in computed styles
- `ThemeToggle` receives the current theme and an `onToggleTheme` callback
- Every control signals that it is pressable by colour on hover, and nothing
  else moves or outlines. That is a consequence of the calm look, so the one
  signal that is not about the mouse is a shared focus ring:
  `:where(button, input, [tabindex]):focus-visible` gets a 2px `--color-accent`
  outline at 2px offset. Keyboard-only, so a mouse user never sees it
- The ring lives in one place and is never re-declared per control. `:where`
  keeps its specificity at zero so it cannot outrank a control's own styling
- No rule anywhere may set an outline to `none` or `0` on a control: it would
  erase the ring. Checked against the built CSS
- The visually hidden file input is `tabIndex={-1}`, so it is not a tab stop. It
  is 1px across, so a ring drawn round it would be invisible, and landing
  somewhere that shows nothing is worse than not landing there. The visible
  Restore button proxies it and carries the focus
- jsdom ignores `:focus-visible` in computed styles, so the ring's appearance
  is checked in `verify-theme.mjs` against the real built CSS, and what a
  keyboard user can actually reach is checked in the app checks

## Undo

- `App.jsx` holds at most one removal at a time, so a second removal replaces
  the first rather than stacking a second offer
- A held removal is a list, so one removal and the clear-done sweep share the
  same offer and the same restore
- A held removal also carries `displaced`: how many tasks earlier removals were
  holding that can no longer be undone, as a running total. The app holds one
  removal only; it just stops pretending a loss did not happen
- **Never set state from inside a state updater.** `holdRemoval` is called from
  the event handler, not from within the `setTasks` updater. React runs an
  updater more than once under StrictMode, which is how this app ships, and a
  second pass would read the removal the first had just written and report it as
  lost. There are checks that render the app the way `main.jsx` does, in
  StrictMode, precisely to keep this honest
- The removal is cleared by a short timeout (`UNDO_TIMEOUT_MS`), so the offer
  needs no dismissal; the timer is cleared on the next removal
- Undo restores each task to its original position, done state included
- The offer is small and quiet, and deliberately does not animate

## Backup and restore

- `BackupControls` owns the download and the restore; `App.jsx` just supplies
  the current list and a `restoreTasks` callback
- The backup file is indented JSON: `app`, `version`, `exported`, `tasks`
- The file is named `tasks-YYYY-MM-DD.json`, so backups sort and can be told
  apart by date
- A restore never happens on its own. Choosing a file only reads it and states
  the consequence in words; the list is replaced only when the person confirms
- A file that cannot be parsed, or whose tasks are not `{ id, text, completed }`,
  is refused with a message and nothing is changed
- The file input is reset after each choice, so the same file can be re-picked

## The weekly backup hint

- `BackupHint` renders the single quiet line; `App.jsx` decides whether it is
  due
- Due when `lastBackup` is 7+ days old, or when no backup was ever taken
- A dismissal is stored as a timestamp and is **not** stored as a boolean, so
  the hint is derived from a clock rather than counted. An app left unused for
  a year shows exactly one line, not one per missed week
- A dismissal only counts until the next download: someone who acts on the hint
  can be reminded again in a later week
- Downloading a backup clears the hint by resetting `lastBackup`
- Wording stays quiet and factual; no urgency, no shouting

## The private window warning

- `src/storage.js` is the only place that touches `localStorage`. Every read
  and write there is wrapped and returns a fallback instead of throwing, so a
  browser that refuses storage can never take the app down
- Its interface is `readText`, `writeText`, `readJson`, `writeJson`, plus
  `detectStorage` and `STORAGE`. The names say what comes back: a stored string
  is read as a string, and deciding what a string *means* belongs to the caller
  (`readStamp` in App.jsx is the only place that knows a timestamp is a number)
- The writers return nothing on purpose. A refused write is not something the app
  acts on, so there is nothing for a caller to branch on
- It reports one of three states: `available` (tasks will survive), `private`
  (writing is refused, which is what a private window usually does), and
  `unknown` (no way to tell, so the app carries on quietly)
- `PrivateWindowWarning` renders only for `private`. `unknown` is deliberately
  silent: guessing would put a false alarm in front of ordinary users
- The notice states what will happen *and* what to do instead, and never
  blocks the app
- Detection is a one-time probe on load, not a re-check on every change
- Honest limitation: some browsers give no signal at all until the tab is
  closed, so this warning cannot be relied on in every private window. It is a
  safety net, not a guarantee

## Testing

- Run checks with `npm test` (add `--watch` via `npm run test:watch`)
- Uniqueness is guaranteed by construction, so the committed checks do not pin
  the clock to prove a collision cannot recur: doing so reaches past the seam.
  The reachable case — a backup file carrying repeated or missing ids — is
  covered instead, by uploading such a file and using the app
- **One seam: the app as the person uses it.** Tests render the app, drive it
  with real typing and clicking, and assert only on what is visible.
- Do not test internal helpers, component state, storage keys, or CSS class
  names — those are implementation details that change without the person
  noticing.
- jsdom cannot resolve the stylesheet cascade, so assertions rely on visible
  text, roles, and checked state rather than computed styles.

## State management

- `useState` in `App.jsx` for `todos` array and `currentFilter`
- `useEffect` syncs `todos` to `localStorage` on every change
- Components receive data + callbacks as props — no prop drilling beyond one level

## Key conventions

- Each task: `{ id: string, text: string, completed: boolean }`
- `src/taskIdentity.js` owns what names a task: `newTask`, `newTaskId`, and
  `asTaskList`. Ids must be unique, because the app finds "this" task by
  comparing them; a timestamp was not safe, since two tasks can be added in the
  same millisecond. Ids are minted in that module and nowhere else
- A list arriving from anywhere — a backup file, saved data, a hand-edited file
  — goes through `asTaskList`, which keeps ids that are usable and unique and
  re-mints the rest. That is why old saved tasks need no migration
- `asTaskList` runs on load, so ids are re-minted on each visit. Nothing refers
  to a task outside the task list, so this is invisible
- Editing uses local `useState` in TaskItem — blur/Enter commits, Escape cancels
- Renaming is a visible pencil button at the end of every row, not a
  double-click on the text. A hidden gesture is invisible to everyone and
  unreachable by keyboard; a real button is seen, tabbed to, and named out
  loud for nothing extra. The pencil steps aside while an edit is open
- Each row ends in two controls whose visual weight encodes consequence: the
  pencil is the quiet one (`--color-text-faint`, `--color-text-quiet` on
  hover), the remove control is the loud one (`--color-text`,
  `--color-danger` on hover). The remove control outweighs the pencil even
  with the pointer on the pencil, so the destructive action is never the
  faintest or the quietest thing in the row
- Two tasks may carry the same words, so a control named after a task's text is
  not unique. Checks that need one of several matches reach it by position
  within its row
- An edit is deliberately transient: the in-progress text lives only in
  `TaskItem`'s local state and is never written to storage as it is typed, so
  reloading mid-edit leaves the saved words untouched
- The edit input carries `aria-label={`Edit ${task.text}`}` so it is
  addressable by name; without it the empty add-task input is indistinguishable
- Adding trims and discards whitespace-only input, both for `TaskInput` and for
  a finished edit
- `TaskInput` is never remounted on add, so the input keeps keyboard focus and
  the next task can be typed with Enter alone
- `src/views.js` owns what a view is: its label, which tasks it shows, and what
  it says when it shows nothing. Adding a view is one edit in that file, not
  three
- A view's selected state is `aria-pressed`, which is what a person perceives.
  The `.active` class is derived from it and is only how that reaches the
  stylesheet — it is never the source of truth, and nothing asserts on it
- Known naming debt: the module is `Filters.jsx` and the class `.filters`, but
  the glossary term is **view** (CONTEXT.md lists "filter" under _Avoid_). Left
  alone to keep the change focused; worth a rename when something else in that
  area is touched
- CSS class `.completed` toggles strikethrough
- The clear-done offer is not rendered at all when there is nothing to sweep,
  rather than rendered and hidden. Whether the offer exists is a fact about the
  task list, and a hidden button is still focusable and still pressable for
  anyone the stylesheet does not reach

## Workflow

- **Always commit to git** after every meaningful change (`git add -A && git commit -m "..."`)
- **Always update CHANGELOG.md** before committing — add entry under `## [Unreleased]` with bullet points describing the change

## Agent skills

### Issue tracker

GitHub Issues, operated through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.
