# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read `HANDOFF.md` in the repo root first.** It documents eleven failure modes in this
> codebase that fail *silently*, several of which the test suite cannot catch by
> construction. Its section 0 is two rules that would have saved more time than everything
> else in it. This file describes what the project **is**; HANDOFF.md describes the
> **traps** and where things stand.

## What this is

Concrete Kings: The Block Chronicles — a Cards-Against-Humanity-derived party game with
Black-culture-focused, AAVE-voiced content, built out into a narrative RPG. Plain
HTML/CSS/JS, no build step, plus a small Node WebSocket relay for online play.

The gap between "built" and "designed" that earlier versions of this file warned about has
largely closed on the mechanics side. Built and working:

- **The card table** — black-card prompt, white-card hand, judge crowns a winner, first to
  N points. Offline pass-and-play is self-contained in the browser.
- **RPG layer** — `TRUST / HEAT / REP / CASH`, `str/wit/soul` attributes, origins and a
  4-step character-creation wizard, XP and levels, receipts, Cookout Alliances,
  corner-hustle betting, O.G. Judge veto and double-down.
- **A top-down walkable city** — 8 districts, per-axis collision, camera, travel gated on
  heat, weather, lamp lighting, district arrival art. **Entirely procedural**: there is no
  district terrain art at all, and the renderer's asset branches have never run against
  real terrain sprites. See HANDOFF section 5.
- **Five mini-games** with a shared manager, and a CASH shop selling prep items that
  modify them.
- **A solo campaign** (`first-miles-campaign.js`) with beats, choices, flags and endings.
- **The block ledger** (`canon-engine.js`) — every crowned card is recorded, motifs
  accumulate into block legends, a prompt naming one pays a callback bonus, and THE RECORD
  screen shows what the block remembers. Persists across sessions in its own
  `localStorage` key.
- **Scenario mode** (`scenario-engine.js`) — complete a scenario with four cards
  (WHO/WHAT/HOW/TWIST), watch it play out beat by beat, then live with the consequences.
  Cards are intent; stats are execution; the world state is the consequence.

**Still only designed:** most of `GAME-MECHANICS-ADVANCED.md`, factions,
inventory-from-cards, quest generation, an AI narrator, and a Godot port. `CARD RPG.md` is
a 76-section PRD plus a v2 revision — the v2 core loop is built, the rest is not. Two specs
record exactly what was excluded and why:
`docs/superpowers/specs/2026-08-09-block-remembers-canon-design.md` and the scenario
engine's own header comment.

When asked to "implement the design", check first whether the request describes a vision
doc (net-new, needs scoping) or shipped code (incremental). **The docs do not all reflect
app state** — several describe systems that were investigated and deliberately rejected,
and HANDOFF section 8 records those so they are not re-attempted.

## Commands

```bash
npm install             # one runtime dependency: ws
npm test                # syntax-checks index.html/cards.js/server.js, then node --test over test/**
node server/server.js   # serves the repo statically + WS relay. PORT 3001, not 3000
node scripts/generate-palette-json.js   # regenerate assets/palettes/concrete_kings.json
node scripts/generate-cards.js          # regenerate cards.js from the card database
```

No build step, bundler, transpiler or lint config. Current state: **363 tests across 58
files, all passing**. Always run `npm test` rather than `node --test` — the npm script also
syntax-checks `index.html`'s inline `<script>`, which the test runner never sees.

## Architecture

**`index.html` (~6900 lines)** holds all client code in one inline `<script>`:

- `Deck` — shuffle/draw with reshuffle.
- `Game` — pure rules and state: players, hands, judging, scoring, the block ledger.
  **No DOM references.**
- `app` — the controller. Screen transitions via `.screen.active`, rendering, offline and
  online flows. Everything player-facing hangs off `app`.

**`src/pixel_engine/*.js`** load as classic `<script>` tags **sharing one global scope**,
and also export via `module.exports` for tests. That dual nature is the source of a whole
bug class that node cannot see — HANDOFF trap 2.4. Engine files use file-prefixed locals
(`CTRL_WORLD`, `RND_WORLD`, `SCN_SLOTS`, `CANON_TIERS`) for exactly this reason.

The module table lives in HANDOFF section 3 rather than being duplicated here.

**Online multiplayer is not authoritative.** Each browser runs its own `Game`; the server
only relays. O.G. powers, betting and alliances are hidden in online mode because they
would mutate only the clicking browser's state. A faithful synced mode needs the server or
one client to own canonical `Game` state — still the biggest architectural gap.

The block ledger and the scenario engine are both **deterministic** — no `Math.random` in
either — specifically so they can eventually sync. Two clients replaying the same rounds
must derive the same history, or players see different endings.

## Architecture (server/server.js)

Plain `http` server static-serving the repo root (path-traversal-guarded via
`path.resolve`/`startsWith`) plus a `ws` `WebSocketServer` on the same HTTP server. Room
state is an in-memory `Map` keyed by room code — no persistence, so rooms and scores are
lost on restart. Message types: `join`, `leave`, `start`, `black`, `roll`, `submission`,
`judge_phase`, `winner`, `chat`, `system`.

**Untrusted-input surface:** no auth, no room-code collision handling beyond
last-writer-wins, and no validation that a sender is actually the judge or host before
honouring privileged types (`start`, `winner`). Harden here first if securing multiplayer.

## Content and the palette

`cards.js` is **generated** from `docs/CONCRETE-KINGS-CARD-DATABASE.md` — do not hand-edit;
re-run `scripts/generate-cards.js`. Cards are plain strings with **no metadata**, so
anything needing tags infers them from text (`canonTags` in `canon-engine.js`). Tagging
1137 lines by hand would drift from the generator on its next run.

The palette is **101 colours in 9 named ramps**, authored in `pixel-engine.js`, which is
the authority; `assets/palettes/concrete_kings.json` is generated from it and a test
asserts they match. Shade with `paletteShift(colour, ±n)` — never darken a hex
arithmetically. See HANDOFF section 5 for why ramp step size is load-bearing.
