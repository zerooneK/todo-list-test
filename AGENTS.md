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
- `src/App.css` — all styling (Poppins font via `@import`)
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
