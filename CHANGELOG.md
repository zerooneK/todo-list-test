# Changelog

## [Unreleased]

### Added
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

### Fixed
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
