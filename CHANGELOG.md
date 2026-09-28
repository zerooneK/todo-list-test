# Changelog

## [Unreleased]

### Added
- `CONTEXT.md` glossary fixing the app's language: **task**, **task list**, **open task**, **done task**, **view**

### Changed
- Settled design direction for the redesign (see below)

### Design decisions
- Improve the existing app rather than rebuild it
- Single user, no accounts or logins
- Deploy to Vercel, reachable from any device
- Call the things on the list "tasks", not "todos"
- Minimal visual design with both dark and light themes

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
