# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Concrete Kings is a Cards-Against-Humanity-style party game with Black-culture-focused, AAVE-voiced content. There is a large gap between what's **built** and what's **designed**:

- **Built (working code):** `index.html` + `server/server.js` — a single-file client and a small Node WebSocket relay implementing a straightforward CAH clone (black-card prompt, white-card hand, judge picks a winner, first to N points wins). Offline pass-and-play mode is fully self-contained in the browser; online mode uses the WS server for room join/leave/broadcast, but game logic (dealing, judging, scoring) still runs client-side per browser — the server only relays messages and tracks player names/points, it does not referee gameplay.
- **Designed but not implemented:** the root-level `*.md` files (`DESIGN.md`, `GAME-MECHANICS-E2E.md`, `GAME-MECHANICS-ADVANCED.md`, `DESIGN-CARD-ANIMATION.md`, `CLAUDE-AAVE-MASTER-PROMPT.md`, `CLAUDE-DESIGN-PROMPT.md`, `CONTENT-*-EXPANDED.md`) describe a much more ambitious "narrative RPG" vision — persistent characters, stats, Receipts, a Block Map, Cookout Alliances, an AAVE-first voice system, and a planned Godot port. None of that layer exists in code yet. `wireframes/*.html` are standalone, unwired HTML mockups of that aspirational UI (character creation, judge phase with O.G. powers, block map, cookout alliance, game over) — they are not connected to `index.html` and use a different visual/mechanical model than the shipped game.

When asked to "implement the design" or "add feature X from the docs," check first whether it's describing the RPG vision docs (net-new work, needs scoping) or the shipped CAH game (`index.html`/`server.js`, incremental change). Don't assume the docs reflect current app state.

## Commands

```bash
npm install        # installs the one runtime dependency: ws
npm test           # sanity-checks index.html's inline <script> and server/server.js both parse as valid JS
node server/server.js   # run the server (serves index.html statically + WS relay), default port 3001, override with PORT env var
```

There is no build step, bundler, or transpiler — `index.html` is plain HTML/CSS/JS served as-is, and `server/server.js` is plain CommonJS Node with no external deps besides `ws`. There is no lint config and no test framework beyond the smoke-test `npm test` script.

To run locally: `node server/server.js`, then open `http://localhost:3001`.

## Architecture (index.html)

Everything client-side lives inline in `index.html`'s single `<script>` block:

- `Deck` — generic shuffle/draw-with-reshuffle over an array (used for both black and white card decks).
- `Game` — pure game state and rules: players, hands, current black card, dice-effect prompt mutation, judge rotation, submissions, scoring. No DOM references.
- `app` — the UI/controller layer: owns the single `Game` instance, drives screen transitions (`.screen.active` toggling between `setup` / `lobby` / `game` / `judging` / `roundResult` / `gameOver`), renders hand/scoreboard/submissions into the DOM, and handles both offline and online flows.

**Offline mode:** single `Game` instance shared by all "players," pass-and-play — `app.humanIndex` tracks whose turn it is and `showPassDevice()` prompts "pass the device."

**Online mode:** each browser still runs its own local `Game` instance (players/hands/deck state are NOT synced or authoritative on the server). The `WebSocket` connection (see message types below) is used to relay room membership and human-readable event text between clients; card game state itself does not currently flow through it end-to-end. Treat this as the biggest architectural gap if extending multiplayer — a faithful synced online mode would need the server (or one client) to own canonical `Game` state.

Card content (`BLACK_CARDS`, `WHITE_CARDS`, `DICE_EFFECTS`) is inlined as JS arrays in the same script block — this is the actual in-game card pool, distinct from and much smaller than the card lists proposed in the root `CONTENT-*.md` docs.

## Architecture (server/server.js)

Plain `http` server that static-file-serves the repo root (path-traversal-guarded via `path.resolve`/`startsWith` check) plus a `ws` `WebSocketServer` attached to the same HTTP server. Room state lives in an in-memory `Map` (`rooms`) keyed by room code — no persistence, so all rooms/scores are lost on restart. WS message protocol (`msg.type`): `join`, `leave`, `start`, `black`, `roll`, `submission`, `judge_phase`, `winner` — each is broadcast to other clients in the same room via `broadcast()`. There's no auth, no room-code collision handling beyond last-writer-wins, and no validation that a sender is actually the judge/host before honoring privileged message types (`start`, `winner`) — treat this as untrusted-input surface if hardening multiplayer.
