# Concrete Kings - Agent Instructions

A browser + Node.js card game with an optional WebSocket multiplayer layer. Main entry is `index.html`; client engine lives under `src/pixel_engine/`; server lives in `server/server.js`.

## Dev environment
- Node.js project, CommonJS, package manager: npm
- Test runner: Node built-in `node:test` via `npm test`
- No build step; no linter configured
- Browser demo: `pixel-art-demo.html`
- Local server: `node server/server.js` -> `http://localhost:3001`
- Windows convenience launcher: `start-server.bat`

## Exact commands
- Run tests: `npm test`
- Start server: `node server/server.js`
- No verified scripts for build, lint, format, or watch

## What `npm test` actually does
1. Parses inline `<script>` from `index.html` plus `cards.js` and `server/server.js`
2. Runs `new Function(...)` syntax checks on each
3. Runs `node --test "test/**/*.test.js"`

## Repo conventions
- Tests are `.test.js` under `test/` using `node:test` + `node:assert/strict`
- Source modules are plain `.js` files under `src/pixel_engine/` and loaded with `require(...)`
- Game logic is split by domain files: audio, weather, block map, cards, campaign, AAVE HUD
- Server is a single-file HTTP + WebSocket app in `server/server.js`

## Pitfalls
- `PORT` env var changes server port; defaults to `3001`
- `/design-system/` routes serve from `public/`; keep HTML cache disabled there
- Test glob is `test/**/*.test.js`; other filenames are ignored by `npm test`
- `index.html` ships large inline JS; `npm test` parses it, so syntax errors there break tests
