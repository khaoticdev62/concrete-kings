# UI Wireframe Fidelity — Design Spec

Date: 2026-08-07
Status: Approved for planning

## Context

`CONCRETE_KINGS_MEGA_PROMPT.txt` and seven `UI_WIREFRAME_*.txt` files specify exact panel
layouts, HUD contents, and interaction maps for the game's screens. The mega prompt is
actually four independent subsystems (UI fidelity, remaining mini-games, pixel art asset
generation, city art asset generation). This spec covers only the first: **UI wireframe
fidelity** across all seven wireframe screens.

Two decisions were made during brainstorming that constrain this spec:

1. **Origins**: the wireframes describe 4 origins (Barber/Hustler/Mechanic/Student). The
   shipped game has 8 origins (`src/pixel_engine/block-map-navigation.js`
   `CHARACTER_ORIGINS`) with flavor lines and stat bonuses added in a recent commit. We
   keep all 8 shipped origins — the wireframe's origin *structure* (grid select, attribute
   bars, secret, review/confirm/randomize) is what gets built, not its specific origin list.
2. **City Map and NPC/POI Scenes are new screens**, not restyles. Nothing matching their
   wireframes exists today, so this spec includes building them, scoped to reuse existing
   engine state rather than inventing new systems.

## Current State (audit findings)

- `index.html` uses one `<section class="screen">` per state (`setup`, `game`, `judging`,
  `roundResult`, `blockMap`, `gameOver`) — this already implements the wireframes' state
  machine at a coarse level; we keep this architecture.
- Character creation (`#setup`) is a single `<select>` of 8 classes with a sprite preview.
  No attribute bars, no secret picker, no appearance customization, no review/randomize.
- `story-engine.js` tracks `heat` and `trust`. There is no `day` counter and no `cash` stat.
  `player.stats` currently has only `streetCred` and `reputation` (per
  `test/mini-game-system.test.js` mocks).
- Abilities are a single hardcoded flag (`specialAbilityUsed`, "Force Redo"), not a list.
- Secrets exist (`storyEngine.secrets`, "The Insider" ending) but there is no secrets/flags
  viewer screen.
- `block-map-navigation.js`'s `BlockMapController` is a walkable side-view stage with
  proximity hotspots (`hotspots` array with x/y/width/prompt) — this is the in-scene
  movement layer, not the wireframe's tile-grid overworld map. The separate `#blockMap`
  section is a card-grid list of travel destinations (`locationList`), also not a
  tile-grid map with legend/fog/fast-travel/quest-filter.
- There is no dedicated NPC/POI scene screen. NPC dialogue is a single overlay
  (`#narrativeTextBox`) with a beat title and body text — no portrait panel, no
  Talk/Quest/Trade/Leave interaction buttons, no per-NPC state indicator.
- `mini-game-manager.js`'s `drawHUD()` already renders a top/bottom bar close to the
  wireframe's mini-game HUD, but with generic label/value pairs instead of
  name/heat/rep, and there is no mini-game catalog/selection screen.

## Design

### 1. Shared model and HUD additions

- Add `day` to `StoryEngine` (increments once per resolved beat/round). Default `1`.
- Add `cash` to the player stats model alongside `streetCred`/`reputation`. Mini-game
  result payloads already define `cashDelta` — this wires that value to a persisted stat
  instead of being dropped.
- Replace the single `specialAbilityUsed` boolean with an `abilities` list on the story
  engine: `{ id, label, cooldownBeats, currentCooldown }`. "Force Redo" becomes the first
  registered ability; the model supports more being added later without a rewrite.
- Add `renderTopHUD(container, { title, location, day, heat })` to `pixel-engine.js` — one
  function, reused by every screen's header instead of five different hand-rolled headers.

### 2. Character Creation (`#setup`)

Two-column layout, no in-game HUD (matches wireframe rule):
- Left: origin grid — 8 clickable cards (replacing the `<select>`), each showing name,
  flavor line, and attribute bars for STR/WIT/SOUL/CASH. Since only `streetCred`/
  `reputation` exist per origin today, STR/WIT/CASH bars are derived/extended from each
  origin's existing `startingStats` — no origin's balance changes, this only adds the
  missing three attributes so the bar row is complete for all 8.
- Right: appearance pickers (hair/fit/prop — cosmetic, feeds the existing sprite preview
  canvas, no gameplay effect per wireframe rule) + secret dropdown (existing secrets pool).
- Bottom bar: **Review** (read-only summary overlay of all picks), **Confirm** (validates
  origin + all appearance fields + secret selected before enabling), **Randomize**
  (rerolls origin + appearance within existing bounds).

### 3. Main Game Screen + Game Board (same wireframe, four states)

These two wireframe files describe the identical screen at different states, so they are
one implementation unit spanning the existing `game`/`judging`/`roundResult` sections plus
a new "Card Selected" state:
- **Default**: shared top HUD, story panel, state panel (Trust/Heat/Rep/Cash — the two new
  stats get wired into the existing `hudCred`/`hudRep` display area), card play area,
  action bar (Play/Inventory/Map/Quests).
- **Card Selected** (new): card zoom view with option highlights and hint text, replacing
  the current instant-submit flow with an explicit confirm/cancel step.
- **Judging**: visible countdown timer (12s auto-randomize) — audited whether the timeout
  logic already exists server/client-side; if only the mechanic exists without a visible
  timer, add the timer panel.
- **Resolution**: existing stat-delta display, confirmed/added 5-second-or-confirm hold.
- **Ending**: existing `gameOver` screen gets the wireframe's final-stats panel (Trust/
  Heat/Rep/Cash/Secrets/Flags) and New Game/Review Log actions.

### 4. Decision Panel / Narrative

`#narrativeTextBox` becomes the Decision Panel:
- Beat title (amber, uppercase, left-aligned), narrative body (110-char soft wrap, white,
  1.5 line spacing) — mostly styling changes to existing markup.
- Up to 4 tagged choices; locked choices (missing item/secret requirement) render greyed
  with a tooltip, and confirming a locked choice plays the existing fail sound instead of
  doing nothing.
- New bottom utility bar: **Use Ability** (opens new ability-menu overlay listing the
  `abilities` array with cooldowns), **View Secret** (new secrets/flags overlay listing
  `storyEngine.secrets` and active flags), **Open Map** (opens the City Map, section 5, as
  an overlay without leaving the narrative state).

### 5. City/Block Map (new screen)

A tile-grid overworld view, separate from the existing walkable in-scene stage:
- Grid built from the existing hotspot coordinates in `block-map-navigation.js`, mapped to
  32x32 tile positions per the wireframe's grid rule.
- Legend: `@` player, NPC letters, `*`/`?`/`!` quest symbols, `#` fog for unvisited tiles.
- Fast-travel overlay: reuses the existing `#blockMap` `locationList` data, gated by the
  wireframe's rule (only unlocked once a tile's heat is cleared).
- Quest-filter overlay: toggles Active/Hidden/Urgent/All using existing quest flag data.
- The existing walkable stage stays as the in-scene movement view; this new grid is the
  strategic map reached via Action Bar → MAP or Decision Panel → Open Map.

### 6. NPC/POI Scene (new screen)

New screen template, populated per-hotspot:
- Left: NPC portrait (using existing character DNA — Ray, Jada, Marquez, etc.), name,
  state indicator (friendly/neutral/hostile/scared/busy — new field per NPC, default
  friendly), trust value.
- Right: interaction buttons — Talk (advances dialogue beat), Quest (shows quest stages),
  Trade (existing item/cash exchange if present, else stubbed), Leave. Greyed + tooltip
  when a requirement is missing, matching the Decision Panel's locked-choice pattern.
- Bottom: quest-log mini-panel (current active quest for this NPC) + Leave/Use Item/Open
  Quests bar.
- Exterior scene variant (street/stoop/alley/park) uses the same template with a scene-view
  panel instead of a portrait, per wireframe.

### 7. Mini-Game HUD

Smallest gap:
- `drawHUD()` top bar becomes name/heat/rep specifically (currently generic label/value
  pairs) to match the wireframe exactly.
- New selection screen: lists registered mini-games from `MiniGameManager.registry` with
  trigger location and difficulty (derived from each game's existing DC/difficulty config),
  Confirm starts immediately, Back returns to the previous screen.
- Completion screen: confirm existing Continue/Retry bar matches wireframe (retry gated by
  quest-linked-or-paid rule, already implied by mini-game result payload's `cashDelta`).

## Testing

- Extend `test/mini-game-system.test.js`'s pattern (mock canvas/DOM) with new tests for:
  `renderTopHUD`, the ability list model, the secrets overlay data, and the mini-game
  selection screen's registry listing.
- No automated test framework covers `index.html` DOM/CSS directly today — layout fidelity
  for each screen is verified manually in-browser (via the `run` skill) at 1280x720 native
  resolution plus at least two responsive breakpoints, per screen, before marking that
  screen's implementation step done.

## Execution order

Per the mega prompt's own specified order:
1. Main Game Screen (+ shared HUD/model additions from section 1)
2. Character Creation
3. Game Board (Card Selected state + remaining state polish)
4. Decision Panel
5. City/Block Map (new screen)
6. NPC/POI Scenes (new screen)
7. Mini-Game HUD

Each step is implemented and manually verified in-browser before moving to the next,
consistent with one-sprint-item-at-a-time execution.

## Out of scope

- Remaining 6 mini-games (Alley Chase, Barber Challenge, Burner Phone Hack, Gossip
  Network, Crafting, King of the Block) — separate project.
- Pixel art asset generation (character/card/cinematic) — separate project, uses SpriteCook.
- City art asset generation (tilesets, facades, parallax, 6-city appendix) — separate
  project, uses SpriteCook.
