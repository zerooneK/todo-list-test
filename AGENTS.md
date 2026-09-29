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
- `ThemeToggle` receives the current theme and an `onToggleTheme` callback

## Testing

- Run checks with `npm test` (add `--watch` via `npm run test:watch`)
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

- Each task: `{ id: number, text: string, completed: boolean }`
- Editing uses local `useState` in TaskItem — blur/Enter commits, Escape cancels
- View values: `'all'`, `'open'`, `'done'`
- CSS class `.hidden` toggles visibility; `.completed` toggles strikethrough

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
