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

- `src/App.jsx` — root component: owns `todos` + `currentFilter` state, passes props down
- `src/App.css` — all styling (Poppins font via `@import`)
- `src/components/` — stateless components: TodoInput, Filters, TodoList, TodoItem, TodoFooter
- `src/test/` — test setup plus the checks; see the testing seam note below
- `src/main.jsx` — entry point (do not edit)

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

- Each todo: `{ id: number, text: string, completed: boolean }`
- Editing uses local `useState` in TodoItem — blur/Enter commits, Escape cancels
- Filter values: `'all'`, `'active'`, `'completed'`
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
