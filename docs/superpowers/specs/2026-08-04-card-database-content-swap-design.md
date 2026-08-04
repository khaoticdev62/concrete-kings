# Card Database Content Swap — Design Spec

**Date:** 2026-08-04
**Status:** Approved, ready for implementation planning
**Author:** Brainstormed via Claude Code with khaoticdev62

## Context

The shipped game (`index.html`) currently plays a plain CAH loop with a tiny card pool: 14 `BLACK_CARDS`, 48 `WHITE_CARDS`, both inlined as JS array literals in the page's single `<script>` block. Separately, this session produced `CONCRETE-KINGS-CARD-DATABASE.md` — a deduplicated, categorized pool of 577 Black Cards and 539 White Cards (plus Receipts/Ciphers/Origins/Hustles/Locations not in scope here), built for the Griot Modernism RPG ruleset but written in a format directly compatible with the shipped game's plain-text card rendering.

This spec covers only swapping in that larger card pool. It does not touch game logic, rendering, scoring, or online sync — those are all unaffected because the app only ever treats Black/White cards as opaque display strings (`innerHTML = prompt`; white cards shown as parallel play options, never text-substituted into the blank).

**Explicitly out of scope** (deferred to future work):
- Any RPG mechanics (stats, Receipts, Origins, Hustles, Ciphers) — separate sub-project, see the existing `2026-08-04-stats-and-receipts-system-design.md` spec and its worktree implementation.
- Server-side changes — `server.js` already statically serves the whole repo root, so a new static file needs no server changes.
- Wireframe reconciliation — separate sub-project.

## Data Model

No new runtime data shapes. `BLACK_CARDS`/`WHITE_CARDS` remain flat `string[]` arrays, same as today — just larger, and now defined in a separate file instead of inline.

## Architecture

New file `cards.js` at repo root:
```js
const BLACK_CARDS = [ /* ~591 entries */ ];
const WHITE_CARDS = [ /* ~587 entries */ ];
```
Loaded via `<script src="cards.js"></script>` in `index.html`, placed before the existing inline `<script>` block. The inline script's current `const BLACK_CARDS = [...]` / `const WHITE_CARDS = [...]` declarations are deleted (not renamed — `Deck`/`Game` reference the same global names, so no other code changes).

`server.js`: no changes. It already does a path-traversal-guarded static serve of the repo root, so `cards.js` is reachable the moment it exists on disk.

## Generation

One-time script `scripts/generate-cards.js` (kept in the repo for future regeneration, not run by the app):

1. Parse `CONCRETE-KINGS-CARD-DATABASE.md`'s "Black Scenario Cards" and "White Response Cards" sections.
2. For White cards, strip the trailing `— *Effect: ...*` annotation (RPG-only metadata; the shipped game has no stat system to consume it).
3. Fix the 5 known Black cards that lack a trailing blank (append `` ____`` — verified list produced during dedup: confirm exact 5 by re-running the same detection query used earlier in this session before hardcoding).
4. Extract the current 14 Black / 48 White cards from `index.html` verbatim.
5. Merge extracted + database cards per type, deduping with the same method already used to build the database (exact-match then fuzzy word-overlap ≥ 0.72) so the existing cards don't create near-duplicates against the new pool.
6. Write `cards.js` with both final arrays, each entry on its own line for readable diffs.

Expected final counts: ~591 Black, ~587 White (14+577 and 48+539 minus whatever the merge dedup catches).

## Data Flow

Unchanged. `Deck` shuffles/draws over whatever array it's constructed with (`new Deck(BLACK_CARDS)` / `new Deck(WHITE_CARDS)`); `Game` draws from `blackDeck`/`whiteDeck`; the UI renders `currentBlack.prompt` as text and hands as a grid of white-card strings. `DICE_EFFECTS` (the existing 6-effect Mad-Libs mutator) is untouched — it string-manipulates whatever prompt it's given regardless of blank count, so it works unchanged on the new single-blank-heavy pool.

## Error Handling

None new. A missing/failed `cards.js` load would leave `BLACK_CARDS`/`WHITE_CARDS` undefined and the inline script would throw on `new Deck(BLACK_CARDS)` — the same failure mode as any other missing script dependency in this project, which has no existing asset-load error handling to extend.

## Testing

- Extend the existing `npm test` smoke check (currently parses `index.html`'s inline script and `server.js` for valid JS) to also parse `cards.js`.
- Manual verification in-browser: start `node server/server.js`, open `http://localhost:3001`, confirm offline mode deals hands and renders black cards from the larger pool, confirm the dice/Cipher blank-mutation effect still displays correctly, confirm online relay (room join/broadcast) is unaffected.

## Success Criteria

- `cards.js` exists, loads before the inline script, defines both arrays.
- `index.html`'s inline script no longer declares `BLACK_CARDS`/`WHITE_CARDS` itself.
- Final counts are in the ~590/~585 range with no exact-duplicate strings within either array.
- `npm test` passes (including the new `cards.js` syntax check).
- Manual browser QA (offline mode, at least one full round) passes with no console errors.
