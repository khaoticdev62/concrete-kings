# Character Creation & Attribute System — Design Spec

Date: 2026-08-07
Status: Approved for planning

## Context

This is Phase 2 of the UI-wireframe-fidelity effort (`docs/superpowers/specs/2026-08-07-ui-wireframe-fidelity-design.md`), covering the Character Creation wireframe (`UI_WIREFRAME_CHARACTER_CREATION.txt`). Phase 1 (foundation + Main Game Screen HUD) is merged.

The wireframe's Character Creation screen shows four attribute bars per origin — STR/WIT/SOUL/CASH — but the shipped game only tracks `player.stats = {streetCred, reputation}`, having deliberately pruned a 4-stat model in a recent session (`docs/superpowers/specs/2026-08-06-rpg-mechanics-surfacing-design.md`) because two of its four fields were write-only and never read. Displaying new decorative STR/WIT/SOUL bars would repeat that exact mistake unless they have real mechanical effect.

Investigation of the five existing mini-games found:
- `street-dice.js` already has a hardcoded per-origin WIT lookup, duplicated locally rather than read from a shared source.
- `negotiation.js:279` already reads `this.gameState.wit` for a LOGIC-argument bonus — dead code today, since nothing populates `gameState.wit`.
- `negotiation.js:281` reads `this.gameState.reputation` for a CHARM-argument bonus — SOUL has no consumer yet, but CHARM is exactly SOUL's conceptual home per the mega prompt's attribute mapping (SOUL → social/leadership).
- `lockpicking.js` has no stat check at all — a `this.tolerance` (pixel margin for landing a pin) field exists per-difficulty and is a natural STR hook.
- `haircut-challenge.js` and `bodega-run.js` have no stat ties in the mega prompt's own catalog and are left untouched.

This spec covers reintroducing STR/WIT/SOUL as a real, shared attribute system with genuine mechanical consumers, plus the Character Creation screen itself. CASH gets no new field — per Phase 1's decision, the wireframe's "Cash" already means `streetCred`.

## Design

### 1. Attribute data model

Add `attributes: {str, wit, soul}` to each of the 8 entries in `CHARACTER_ORIGINS` (`src/pixel_engine/block-map-navigation.js`), alongside the existing `startingStats`/`flavor` fields:

| Origin | STR | WIT | SOUL |
|---|---:|---:|---:|
| BARBER | 4 | 7 | 7 |
| STREET_SCHOLAR | 3 | 8 | 4 |
| LOCAL_LEGEND | 6 | 3 | 8 |
| CORNER_MERCHANT | 4 | 7 | 5 |
| COMMUNITY_ORGANIZER | 3 | 6 | 8 |
| UNDERGROUND_DJ | 4 | 5 | 6 |
| BLOCK_ARCHITECT | 7 | 6 | 3 |
| HUSTLE_VETERAN | 8 | 4 | 5 |

WIT values are unchanged from `street-dice.js`'s existing hardcoded map (preserves existing tuning). STR/SOUL are new, each origin getting one standout attribute consistent with its flavor line.

`Game.addPlayer` (`index.html`) gains a new `attributes: {str: 0, wit: 0, soul: 0}` default field on the player object — structurally separate from `stats`, which stays exactly `{streetCred, reputation}` per Phase 1's Global Constraints. The human player's origin bonus is applied at the same site(s) `startingStats` bonuses already are (`startLocalGame()` and the equivalent online-mode site, per the same integration note the prior stat-pruning spec left for its own origin-bonus work — the exact online-mode site must be located during planning, not assumed).

### 2. Wiring attributes into real mini-game mechanics

- **WIT**: `street-dice.js` drops its local hardcoded `witMap` (lines ~53-66) and reads `this.gameState.wit` instead — same values, single shared source. `negotiation.js`'s existing LOGIC-argument bonus (`negotiation.js:279-280`) needs no code change — it already reads `gameState.wit`; this just makes that value real for the first time.
- **SOUL**: `negotiation.js`'s CHARM-argument bonus (`negotiation.js:281-282`, currently `Math.floor(this.gameState.reputation * 1.5)`) becomes `Math.floor((this.gameState.reputation + this.gameState.soul) * 1.5)` — additive with the existing reputation bonus, not a replacement.
- **STR**: `lockpicking.js` gains a new hook in `init()`: after `this.tolerance` is set per difficulty, add `this.tolerance += Math.floor((this.gameState.str || 0) / 2)` — higher STR widens the pixel margin for landing a pin on the shear line.
- `MiniGameState.loadFromEngine(storyEngine, player)` (`mini-game-state.js`) gains three new lines populating `this.wit`, `this.soul`, `this.str` from `player.attributes?.{wit,soul,str} || 0`, alongside its existing `this.cash`/`this.reputation` population.
- Haircut Challenge and Bodega Run are unchanged — no stat tie in the mega prompt's own catalog for either, and inventing one would be scope creep beyond what this spec commits to.

### 3. Character Creation screen

The existing `#setup` screen's `<select id="characterOriginSelect">` **stays in the DOM** rather than being removed — it's read via `.value` at 13+ other call sites across online lobby join/host flows, campaign mode, save/load, and the noir-prototype/classic-game starters. Replacing it outright would require auditing and re-wiring all 13+ sites, a much larger and riskier change than this phase's scope. Instead:

- The `<select>` becomes a visually-hidden backing field (the single source of truth every existing call site already reads).
- A new visual grid of 8 clickable origin cards is added above it, each showing the origin's name, flavor line, and STR/WIT/SOUL/CASH bars (CASH bar shows `startingStats.streetCred`, matching the wireframe's own small-number example). Clicking a card sets the hidden select's `value` and dispatches the same `change` event the old manual dropdown interaction already triggers, so `renderCharacterPreview()` and every other existing `onchange`-driven behavior keeps working unmodified.
- Right column: appearance pickers (hair/fit/prop — cosmetic only, per the wireframe's own rule that appearance doesn't affect gameplay stats), feeding the existing preview canvas. A secret dropdown, populated from the existing secrets pool.
- Bottom bar: **Review** (read-only summary overlay of the current picks), **Confirm** (validates an origin, all appearance fields, and a secret are chosen before proceeding — existing "start game" flows are otherwise unchanged), **Randomize** (selects a random origin card — attributes are fixed per origin, not independently rolled, per the wireframe's own "rerolls origin + attributes within bounds" rule, where "within bounds" means picking among the 8 defined origins).

## Testing

- New `node --test` coverage for: each origin's `attributes` object having exactly `{str, wit, soul}` with the table's values; `Game.addPlayer`'s player object having a default `attributes` field; the human player's origin attribute values being applied at character creation (mirroring the existing `startingStats` bonus test pattern); `MiniGameState.loadFromEngine` populating `wit`/`soul`/`str` from `player.attributes`; `street-dice.js`'s roll using `gameState.wit` instead of a local map; `negotiation.js`'s CHARM bonus formula including `gameState.soul`; `lockpicking.js`'s `tolerance` increasing with `gameState.str`.
- The visual origin-grid/card-click wiring and the Review/Confirm/Randomize buttons are DOM-only and get manual browser verification, per the same pattern Phase 1 used — this time correctly noting (per Phase 1's final review) that `app` itself is reachable from `node --test` via `loadGameModule().app`; only the actual DOM click-to-select interaction needs a live browser.

## Out of scope

- Haircut Challenge and Bodega Run mechanical changes — no stat tie in the source catalog, not touched here.
- Any change to `player.stats`'s `{streetCred, reputation}` shape.
- Game Board, Decision Panel, City Map, NPC/POI Scenes, Mini-Game HUD — separate phases per the parent spec's execution order.
