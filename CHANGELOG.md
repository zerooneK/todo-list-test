# Changelog

## [Unreleased]

### Added
- The checks now run on their own, in `.github/workflows/checks.yml`: on every
  push to `main`, on every pull request, and once a week. They previously ran
  only when someone remembered, and the cost of that was concrete — a missing
  tab icon sat unnoticed since the first commit, and a deploy went stale with
  nothing to say so. The weekly run is the one that earns its keep over time:
  the app depends on React, Vite and jsdom through a lockfile, and something
  upstream can move while the code sits untouched. Nothing in a run reaches the
  network, so it cannot fail because the published site is having a bad day
- A README that describes this project rather than the Vite template it started
  from, with the check badge at the top. The repo is public, so that badge is
  the first evidence a visitor sees that any of this is verified
- The Node version is pinned in `.nvmrc`, and `engines` states the same floor.
  It is `>=22.22.2`, which is measured rather than chosen: vite allows Node
  20.19, vitest allows 22, and **jsdom 30 requires 22.22.2**, so jsdom is what
  sets it. The development machine is on exactly that version


### Changed
- The look was calm to the point of being faint, which is not the same thing.
  Measured, rather than eyeballed: 13 of the 19 font sizes were the same 13px
  — the title included — so nothing led the eye, and the card and its row
  dividers sat at 1.04:1 and 1.18:1, below the threshold of perceptible, so
  the card had no edge and the rows had no separation. Every rule below keeps
  the calm look: still no gradients, no shadows, no motion
  - **Warm paper instead of cold grey.** Every neutral carries the same warm
    hue, so the greys read as paper rather than as a form
  - **Contrast chosen, not guessed.** Text 11.95:1, quiet 5.95:1, faint 4.57:1
    against the card, all passing AA; dividers brought up to 1.43:1, faint but
    visible; the card now reads as a card
  - **A real type scale**, four steps with a clear jump. The title went from
    13px — the same size as a label — to 24px, in the serif face, so the page
    has a subject
  - The interface stays a sans; only the title is a serif. A book sets its
    title in one voice and its body in another, and that split is what makes
    this read as a page rather than as a form
  - One warm clay accent, reserved for the thing being acted on or the state
    you are in. It previously meant four unrelated things
  - `--color-accent` is the one colour that survived; `danger` is warmed to
    match, and both look at the focus ring and pass 3:1 comfortably

### Fixed
- `index.html` has pointed at `/favicon.svg` since the beginning, but the file
  was never created, so every page load on the published site asked for
  something that was not there: a 404 and a console error on every visit, and a
  blank tab icon. Found by driving the published URL and watching every
  response. The icon is now a filled clay rounded square with a paper check,
  legible at 16px, so the tab reads as the app rather than as a blank page

### Fixed
- `AGENTS.md` and the focus-ring comment in `App.css` both claimed the ring was
  "keyboard-only, so a mouse user never sees it". That was never true, in two
  ways: the add-task input is focused on load, and a text field matches
  `:focus-visible` whenever it is focused, however it was reached — browsers do
  that on purpose so you can see where typing will go. Confirmed by driving the
  real built app: `document.activeElement` is the input and it matches
  `:focus-visible` on first paint. The behaviour is right and is unchanged; the
  description was wrong, and it is now written down accurately so nobody
  "fixes" it by taking the indicator off the one control everybody types into

### Fixed
- The app fetched Poppins from Google's CDN with an `@import`, so every visit
  made a request to a third party. `AGENTS.md` claimed that "only the app's own
  assets are served", which was not true while that line was there. Typefaces
  now come from the device: no third-party request, nothing to fail offline,
  and the first paint is never a font swap

### Fixed
- The overdue-backup reminder appeared on the page and nothing else
  (GitHub issue #16). It had no live region, so it only reached whoever
  happened to be looking at that part of the screen at that moment. That
  defeated its purpose: it is the warning that the only copy of the task list
  is getting old
  - It is now a `role="status"` region, the same as the private-window notice
    and the undo offer. The wording, the seven-day interval, and the way a
    dismissal is remembered are all unchanged
  - The region stays in the page and fills rather than being inserted with its
    first words, which is the form screen readers commonly miss
  - An empty live region is collapsed out of sight rather than removed with
    `display: none`, because a removed node is not in the accessibility tree,
    so there would be nothing listening when the words arrived. The same flaw
    in the undo offer's region is fixed alongside it

### Fixed
- The undo offer said only "Removed", which described none of the cases it
  actually covered (GitHub issue #15). A sweep of fourteen read exactly like a
  removal of one, and removing a second task silently ended the first one's undo
  with no indication it had happened. That is the same kind of quiet loss the
  backup system exists to prevent, sitting inside the app
  - The offer now states what it is holding: "1 task removed", "3 tasks removed"
  - When a removal displaces an earlier one, it says so plainly: "2 earlier
    tasks can no longer be undone". Wording stays factual and does not scold
  - The loss is counted as a running total, so three removals in a row report the
    two tasks that are genuinely unrecoverable rather than the one that was most
    recently replaced
  - The one-removal-at-a-time rule and the five-second timer are unchanged
  - The offer's live region is now always in the page, filling rather than
    arriving. A region inserted together with its first words is commonly missed
    by screen readers; this also means a second message is announced as a change
    rather than a new arrival
  - The offer wraps rather than pushing the Undo button off a narrow screen

### Added
- A shared focus ring, so the app can be used without a mouse (GitHub issue
  #14). Every control signalled that it was pressable the same way — its colour
  changed on hover — which left anyone using the keyboard with no way to tell
  which control they were on. The one focus style in the whole stylesheet
  belonged to the add-task input
  - The ring is drawn for keyboard focus only, so a person using a mouse never
    sees it and the resting page is unchanged
  - It uses `--color-accent`, a colour both looks already define, so it needs no
    colour of its own and follows the light and dark look on its own. Measured
    against both backgrounds it clears 3:1 in both looks; that is prose, not a
    check, because nothing in the app checks can see colour
  - It lives in one place, and `:where` keeps its specificity at zero so it
    cannot outrank a control's own styling and no per-control rule was touched
  - The add-task input's own focus treatment was replaced by the shared ring
    rather than kept alongside it, and two `outline: none` rules that would
    have erased it are gone
  - The visually hidden file input behind the Restore button is now
    `tabIndex={-1}`. It is 1px across, so a ring drawn round it would be
    invisible, and tabbing to a control that shows nothing is worse than not
    tabbing to it at all. The visible Restore button proxies it
  - Checks now tab through the app and reach every control, including the undo
    offer after a removal, the restore confirmation once a file is chosen, and
    the backup reminder. jsdom ignores `:focus-visible` in computed styles, so
    what the ring looks like is checked against the real built CSS — including
    that it still covers buttons *and* inputs, which a loosened selector would
    otherwise drop silently — and what a keyboard person can reach is checked by
    driving the app
- Renaming a task is now a visible pencil at the end of every row
  (GitHub issue #13). It was a double-click on the text, which nothing on
  screen advertised: no pointer, no hover, no label, and no keyboard route at
  all. The owner had never once used the feature, because there was no way to
  know it existed
  - Because it is a real button rather than a decorated span, it is reachable
    by keyboard and named out loud for assistive technology at no extra cost
  - The double-click is removed rather than kept as a second, invisible route.
    One obvious way to do a thing beats two where one is hidden
  - The pencil steps aside while an edit is open, so a stray click cannot
    commit or cancel the edit under the person's cursor

### Changed
- The remove control is now the loudest thing in a task row rather than the
  faintest (GitHub issue #13). Each row carries two controls, so their visual
  weight has to say which one destroys the task. The pencil rests in
  `--color-text-faint` and darkens to `--color-text-quiet` on hover; the remove
  control sits at `--color-text` and turns `--color-danger` on hover, so it
  outweighs the pencil even with the pointer resting on the pencil. Everything
  clears 3:1 against its background in either look. This weighting is a
  stylesheet fact and is deliberately not asserted in the checks, which cannot
  see colour
- The app is published at **https://todo-app-react-zeta-nine.vercel.app**
  (GitHub issue #12). Deployed from `main` to Vercel, with the repository kept
  as the single source of the code
- Checks for the built app (`npm run verify:dist`), because the production
  bundle is what people actually run and `npm test` only covers development:
  - `verify-dist.mjs` drives the real production bundle as a person would, and
    confirms the calm style survives the build: no motion, no gradients, no
    console errors
  - `verify-reload.mjs` opens the built app twice against the same storage to
    prove tasks survive closing and reopening the page, and that a backup taken
    in the built app can be restored
- A warning in a private or incognito window (GitHub issue #11) — the app's
  worst failure mode is silent loss of real tasks, so it is surfaced instead of
  being left for the person to discover
  - Where the browser refuses to store anything, a calm notice says plainly
    that tasks will not be saved here and are lost when the window is closed,
    and points at using an ordinary window or downloading a backup
  - It never blocks the app; tasks can still be added, ticked and backed up
  - No notice appears in an ordinary window, and no notice appears when
    detection is simply not possible, so there are no false alarms
  - Matching the calm style: a quiet bordered line in shared colours, not a red
    alert, and nothing moves or animates

### Changed
- The clear-done offer is now not rendered when there is nothing to sweep,
  instead of being rendered and hidden with a stylesheet. A hidden button is
  still in the page, still focusable and still pressable for anyone the
  stylesheet does not reach — a screen reader, or a browser the CSS has not
  loaded for yet. Whether the offer exists is now a fact about the task list
  rather than a styling detail
- `verify-dist.mjs` and `verify-reload.mjs` no longer keep separate copies of
  the same jsdom setup, React input plumbing and pass/fail reporting. They share
  `verify-harness.mjs`, so the two checks cannot drift into driving the app
  differently
- The published-build checks no longer assert on CSS class names. They find
  buttons and tasks the way a person does — by the name on them. This was the
  last place the checks reached past the seam
- A line of dead code in `verify-reload.mjs` that looked up the "Restore from a
  backup" button and then discarded it is now a real check, so that button is
  genuinely exercised
- `storage.js` is tidied so its names say what they return. `readNumber` and
  `writeNumber` are now `readText` and `writeText`, because a stored value
  arrives as a string and deciding what it means is the caller's business
  (`readStamp` remains the only place that treats a stored value as a number)
- `writeJson` no longer returns a boolean that nothing read. A refused write is
  not something the app reacts to, so there is nothing to branch on
- No behaviour change: the same keys, the same values, the same never-throw
  guarantee. The private-window checks break storage directly and were not
  affected

### Added
- A check for the look the page paints before the app runs, in
  `verify-theme.mjs`. The pre-paint script in `index.html` decides the theme
  before the bundle loads, so it cannot import from the app, and nothing was
  checking it: a broken script would have shown a flash of the wrong look and
  every other check would still pass. The pre-paint script and the real app are
  now driven separately and required to agree for every combination of a stored
  choice and the device's own setting
- The stylesheet's own device fallback is now checked against the built CSS. It
  is the only thing that applies the dark look if the pre-paint script is
  blocked, so losing it would leave someone who never chose a theme looking at
  the wrong page
- `src/views.js`, which owns what a view is: its label, which tasks it shows,
  and what it says when it shows nothing. Adding a view is now one edit in one
  file rather than three edits across two
- Each view button now says whether it is the view showing, via `aria-pressed`.
  Previously the only record of the selected view was a CSS class, which is
  visible to nobody using a screen reader
- The check that the current view survives a theme switch now asks what a person
  can perceive — that the Done button reads as pressed — instead of reading a
  stylesheet. This was the one place the checks reached past the seam

### Fixed
- Two tasks could be added in the same millisecond and become one task. The
  task's id was `Date.now()`, and the app finds a task by comparing ids, so
  two tasks sharing a value are one task: ticking one marked every twin done,
  and removing one removed them all. Reproduced before fixing — three tasks
  added in one millisecond, ticking the first marked all three done
- Restoring a backup could bring the same problem back. Restored tasks were
  given ids by array position, so a file whose ids were not numbers fell back
  to positions 0, 1, 2 — and restoring then adding produced duplicate ids, with
  no clock pinning needed to hit it
- A backup file with missing or repeated ids is now handled, rather than
  trusted. Ids are re-minted on the way in
- `src/taskIdentity.js` now owns what names a task. Ids are minted there and
  nowhere else, using `crypto.randomUUID` with a `getRandomValues` fallback for
  when the app is opened outside a secure context, such as over plain http
- Existing saved tasks need no migration: they are re-identified on load, so
  older numeric ids keep working
- The app could crash outright when the browser refused storage. A private
  window that rejects writes threw `QuotaExceededError` through the render and
  the app stopped working entirely, with an empty screen and no way to recover
  what had been typed
- All storage access now goes through `src/storage.js`, where every read and
  write is wrapped and falls back rather than throwing. Corrupt saved data is
  also survived instead of breaking the first render
- Fast task entry and safe editing, now covered by checks (GitHub issue #10).
  The behaviour itself was already correct, so this is a testing and
  accessibility ticket rather than a redesign:
  - Pressing Enter adds the task and leaves the input focused and empty, so a
    run of tasks can be typed with Enter alone; the Add button still works
  - Empty and whitespace-only input create no task, and words are trimmed
  - An edit stays transient: reloading mid-edit leaves the saved words
    untouched rather than keeping a half-typed value
  - The edit input gained an accessible name (`Edit <task>`), which also makes
    it addressable by tests; previously it was indistinguishable from the
    add-task box once emptied
- The gentle weekly backup hint (GitHub issue #9) — so the backup habit survives
  without nagging
  - One quiet line appears once it has been seven days or more since the last
    download, and for a first-time user who has never backed up at all
  - It can be dismissed with "Remind me later", and the dismissal is
    remembered, so returning to the app stays calm
  - Downloading a backup clears it straight away
  - It is derived from a timestamp rather than counted, so an app left unused
    for a long time shows exactly one line instead of piling up
  - It never blocks the app; tasks can still be added and worked on as normal
- Download and restore a backup (GitHub issue #8) — the real safety net for
  tasks held in the browser
  - "Download my tasks" saves the whole list to the computer as a dated file,
    `tasks-YYYY-MM-DD.json`
  - The file is indented JSON holding the words themselves, readable in any
    text editor long after the app is gone
  - "Restore from a backup" reads such a file back, and the whole list comes
    back with each task still marked done as it was
  - Restoring **never happens silently**: it first states plainly that it will
    replace the current list and that the current list cannot be recovered,
    and the person must confirm
  - Saying no keeps the current list untouched
  - A file that is unreadable, or is not a task backup, is refused with a
    clear message and changes nothing
  - Neither downloading nor restoring disturbs the current view or theme
- Checks for backup and restore, including a full round trip: download the
  list, empty it, and restore it back with done states intact
- The clear-done sweep is now undoable (GitHub issue #7)
  - The same brief Undo offer appears after the sweep as after a single removal
  - One Undo brings back every swept task, each in its original place and still
    marked as done
  - Open tasks are untouched by both the sweep and its undo
- The undo hold is now a list, so a single removal and a whole sweep share the
  same offer and the same restore
- The task checkbox now names the task it ticks, so it is clear what it controls
- Checks for the sweep: it leaves open tasks alone, the offer appears, every
  task comes back in order and still done, the offer expires, a sweep replaces
  a single-removal offer rather than stacking, and the offer is spent after use
- Undo for a single task removal (GitHub issue #6)
  - A small quiet "Removed — Undo" offer appears straight after, and clears
    itself after a few seconds
  - Undo puts the task back exactly as it was, in its original place and with
    its done state intact
  - Only one offer exists at a time: a second removal replaces the first
  - The offer never returns once used or expired
- The remove button now names the task it removes, so it is clear what will go
- Checks for the Undo offer: it is absent when nothing was removed, appears
  after a removal, restores position and done state, expires on its own, is
  used up for good, and is replaced rather than stacked
- A dark version of the calm look, with one small toggle to switch between the
  two (GitHub issue #5)
  - The choice is remembered, so the app opens in the look last chosen
  - With no choice made, the app follows the device's own light or dark setting
  - The look is set before the page paints, so it never flashes the wrong theme
  - The dark look reuses the same shared values as the light one, so the two
    stay in step
  - Text contrast was checked in both looks and meets the readability target
- Checks for the theme: the toggle exists, both looks apply, the choice is
  remembered, the device is followed by default, and switching leaves the task
  list and current view undisturbed

### Changed
- The calm look, light version (GitHub issue #4)
  - Muted, soft colours replace the pink and purple; the shiny gradient add
    button is now a plain, quiet one
  - The large decorative heading is replaced by a small quiet "tasks" label
  - Nothing moves: transitions, animations, and hover lifts are gone
  - Spacing is more generous, and the layout stays readable on a narrow screen
  - The empty list shows one short calm line instead of an instruction
  - Colours and spacing are now shared values in `src/index.css`, so the dark
    version can reuse the same names
- Renamed todos to tasks throughout, using the glossary in `CONTEXT.md`
  (GitHub issue #3)
  - On screen: heading, placeholder, view buttons, empty states, footer count,
    and the clear button all use the new wording
  - The three views are now **All**, **Open**, and **Done**, and mean what they
    say
  - Internally: `todos`/`currentFilter` became `tasks`/`currentView`, the
    components were renamed, and the CSS names follow
- The task list is now saved under the key `tasks`. The old key `todos` is read
  as a fallback and is never deleted, so an existing task list survives the
  change instead of disappearing

### Added
- Checks for the three views, for a task list saved under the old name still
  appearing, for that list not being duplicated, and for the old saved data
  being left readable
- Test safety net (GitHub issue #2)
  - `npm test` and `npm run test:watch` scripts
  - Vitest with a jsdom browser-like environment
  - Testing Library for driving the app as the person uses it
  - First checks: typing a task shows it; ticking a task shows it as done
- `css: true` and automatic JSX in the Vite config so tests resolve the real
  component tree and stylesheet
- Implementation tickets for the redesign published to GitHub as issues #2-#12
  (spec in #1), each tagged `ready-for-agent` and listing its own blockers
- Triage labels created on the tracker: `needs-triage`, `needs-info`,
  `ready-for-agent`, `ready-for-human`
- `CONTEXT.md` glossary fixing the app's language: **task**, **task list**, **open task**, **done task**, **view**

### Changed
- Settled design direction for the redesign (see below)

### Design decisions
- Improve the existing app rather than rebuild it
- Single user, no accounts or logins
- Deploy to Vercel, reachable from any device
- Call the things on the list "tasks", not "todos"
- Minimal visual design with both dark and light themes
- Done tasks stay visible, struck through, until deleted or cleared
- Keep the "clear done" button — deliberate sweep-up, no auto-expiry
- A task holds only its words: no due date, priority, note, or grouping
- Use the app through its Vercel web address from one main browser — no
  third-party storage service, no login
- Daily automatic backup file on this computer, plus a "download my tasks" button
- Small dark/light toggle that remembers the choice
- Empty list shows one short, calm line
- Weekly quiet hint to download a backup when it has been 7+ days
- After any deletion, a brief self-disappearing Undo offer
- Input box stays focused so tasks can be typed back-to-back with Enter
- No large heading; a small quiet "tasks" label at the top

### Skills setup
- Configured Matt Pocock's engineering skills for this repo (`/setup-matt-pocock-skills`)
  - `docs/agents/issue-tracker.md` — GitHub Issues via the `gh` CLI
  - `docs/agents/triage-labels.md` — default five-role label vocabulary
  - `docs/agents/domain.md` — single-context domain doc layout
  - `## Agent skills` section added to `AGENTS.md`
- Installed all 38 skills from `mattpocock/skills` via the `skills` CLI
  - Source copies live in `.agents/skills/` (shared by all agents)
  - `agent/skills/` and `.claude/skills/` provide tool-specific paths
  - `skills-lock.json` records source paths and hashes for each skill
- Included `setup-matt-pocock-skills` for first-time skill setup and issue-tracker config

## [1.0.0] - 2026-07-31

### Added
- React app scaffolded with Vite
- Add new todos via input field + Enter or "Add" button
- Mark todos as complete with checkbox (strikethrough style)
- Delete individual todos
- Double-click to edit todo text inline
- Filter todos: All / Active / Completed
- Clear all completed todos
- Persistent storage via localStorage
- Item count showing remaining active todos
- Poppins font via Google Fonts `@import`
- Premium gradient styling on Add button
- Responsive design
