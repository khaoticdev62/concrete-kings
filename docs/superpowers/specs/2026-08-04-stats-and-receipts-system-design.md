# Stats and Receipts System — Design Spec

**Date:** 2026-08-04
**Status:** Approved, ready for implementation planning
**Author:** Brainstormed via Claude Code with khaoticdev62

## Context

`DESIGN.md` describes a "narrative RPG" evolution of Concrete Kings' plain CAH-style card game, including four character stats (Street Cred, Community, Wisdom, Reputation) and a "Receipt" system where round winners earn story threads that echo into future rounds. That document is vision/flavor text — it names the systems and gives illustrative examples, but doesn't define exact numbers, data shapes, or how the mechanics hook into the existing game loop in `index.html`.

This spec was scoped down from a larger ask (wiring the "Main Game Screen" wireframe into the app) once it became clear that wireframe depends on Stats and Receipts panels that have no underlying rules yet. Per the project's `CLAUDE.md`, `index.html` currently implements only the plain CAH loop (black card → hand → submit → judge picks winner → score), with none of `DESIGN.md`'s RPG layer built.

**Explicitly out of scope for this spec** (deferred to future work):
- Wiring the Main Game Screen (or any wireframe) UI — this spec is data model + game logic only, no rendering.
- Character Creation screen / Origin Stories (starting stat bonuses from an origin pick).
- The Block Map, Cookout alliances, and Hustle archetypes (DESIGN.md sections 6-8) — separate systems, separate specs.
- Renaming "judge" → "O.G." or "dice" → "Cipher" in the UI/code — that's a copy/terminology concern for the eventual reskin, not this mechanics layer.
- A 0–10 stat display scale/clamp — the wireframe shows stat bars as "x/10," but that's a rendering choice for whenever a stats panel gets built. This spec stores unbounded integers.

## Data Model

Extends the existing player object created in `Game.addPlayer(name)` (currently `{ name, hand: [], points: 0 }`):

```js
{
  name, hand: [], points: 0,
  stats: { streetCred: 0, community: 0, wisdom: 0, reputation: 0 },
  receipts: []  // ReceiptInstance[]
}
```

`ReceiptInstance` shape:

```js
{
  id,              // unique per instance, e.g. `${poolId}-${roundEarned}-${playerName}`
  poolId,          // index/id into RECEIPT_POOL
  earnText,        // flavor text shown when earned, e.g. "You helped your cousin bail out of jail. Now they owe you."
  resolutionPrompt,// black-card-style prompt used when this receipt triggers, e.g. "Your cousin who owes you shows up at the cookout with ____"
  roundEarned,     // game.round value when awarded
  status           // 'active' | 'resolved' | 'failed'
}
```

Resolved and failed receipts are kept in `player.receipts` (not deleted) so a future UI can show history (the wireframe's Active Receipts panel shows both unresolved and resolved rows). Only `status === 'active'` entries count toward the cap and are eligible to trigger.

### RECEIPT_POOL (seed content)

A new array alongside `BLACK_CARDS`/`WHITE_CARDS`. Seeded with DESIGN.md's 5 example receipts. Only 3 of those 5 had a documented resolution prompt (cousin/auntie/landlord); the other 2 (side hustle, best dish) need new resolution prompts written for this spec — marked below as new, not verbatim from DESIGN.md.

```js
const RECEIPT_POOL = [
  {
    id: 'cousin-bail',
    earnText: "You helped your cousin bail out of jail. Now they owe you.",
    resolutionPrompt: "Your cousin who owes you shows up at the cookout with ____"
  },
  {
    id: 'auntie-joke',
    earnText: "You told that joke at the cookout. Auntie still side-eyeing you.",
    resolutionPrompt: "Auntie who's still side-eyeing you says ____"
  },
  {
    id: 'side-hustle',
    earnText: "You invested in that side hustle. It's about to blow up or flop.",
    resolutionPrompt: "Your side hustle investment just ____" // new, not in DESIGN.md
  },
  {
    id: 'landlord-standoff',
    earnText: "You stood up to the landlord. They're watching you now.",
    resolutionPrompt: "The landlord who's watching you just posted ____"
  },
  {
    id: 'best-dish',
    earnText: "You brought the best dish. Everyone expects excellence forever.",
    resolutionPrompt: "Everyone's expecting you to top last time's dish, but you brought ____" // new, not in DESIGN.md
  }
];
```

This pool is intentionally small (5 entries) to start — expanding it is pure content work with no logic changes, left for later.

## Stat Rules

| Event | Effect |
|---|---|
| Any round win (baseline) | Winner: `reputation += 1`, always |
| Winner resolves their own active receipt this round | Winner: additionally `reputation += 2` (stacks with baseline → `+3` total that round); current O.G. also gets `reputation += 1` |
| Round was a receipt-trigger round, but the receipt owner did not win | Receipt owner: `-1` to all four stats (`streetCred`, `community`, `wisdom`, `reputation`) |

Rationale for stacking the baseline +1 with the receipt +2 rather than replacing it: keeps the rule simple (one `awardWin` step always runs; `resolveTrigger` is an independent additive step), and avoids a special case where winning "normally" and winning "via receipt" need different base paths.

The O.G. bonus only fires on a successful resolution — there is no penalty case for the O.G., since (per project decision) there's no defined signal for a judge "losing" in a plain CAH round.

## Receipt Lifecycle

**1. Earning** — Runs *after* Resolving (step 3 below) has already applied for this round, so a receipt that just resolved/failed has already left the `active` pool and freed up a slot. Check `winner.receipts.filter(r => r.status === 'active').length`. If less than 5, draw one `RECEIPT_POOL` entry the winner doesn't already hold `active`, and push a new `active` `ReceiptInstance` with `roundEarned = game.round`. If already at 5 active, skip — no error, no forced resolution, just no new receipt this round. (`RECEIPT_POOL` must stay at 5+ entries for this draw to always have an option — true today since the seed pool below has exactly 5; note this invariant if the pool is ever trimmed.)

**2. Triggering** — In `Game.nextBlack()`, before the existing dice-effect roll:
1. Build the candidate list: all `active` receipts across all players, **excluding** any owned by the current round's O.G. (the O.G. judges, doesn't submit, so they can never win/fail a round).
2. If the candidate list is non-empty, roll 35% (same rate as the existing dice-effect chance in `nextBlack()`).
3. On a hit: pick one random candidate. That round's black card becomes `{ prompt: receipt.resolutionPrompt, hasDice: false }` instead of a normal `blackDeck.draw()`, and `currentBlack.receiptTrigger = { receiptId: receipt.id, ownerName }` is recorded.
4. On a miss (or empty candidate list, or the 65% no-roll case): proceed exactly as today — normal `blackDeck.draw()` plus the existing independent dice-effect roll.

Receipt triggers and Cipher dice effects are mutually exclusive per round: if a receipt triggers, the dice-effect roll for that round is skipped entirely (the receipt is that round's "twist").

**3. Resolving** — In `app.chooseWinner()` (where `winner.points++` already happens), after the existing scoring:
- If `game.currentBlack.receiptTrigger` is not set: nothing further happens (business as usual, just the baseline `reputation += 1`).
- If it is set and `winner.name === receiptTrigger.ownerName`: apply the resolve branch (owner already is the winner) — mark that receipt `status = 'resolved'`, apply the O.G. bonus.
- If it is set and the winner is someone else: the receipt owner (looked up by `ownerName`) gets the fail branch — mark that receipt `status = 'failed'`, apply `-1` to all four of their stats.

Either way, the receipt leaves the `active` pool for good (`resolved` or `failed`) — it does not re-trigger.

## Architecture

Per the chosen approach, new logic lives in a `ReceiptSystem` object added to the same inline `<script>` block in `index.html`, near the existing `Deck`/`Game` classes — no new files, no build step, `npm test`'s regex-based smoke check (which extracts and parses `index.html`'s single `<script>` block) is unaffected.

```js
const ReceiptSystem = {
  maybeTriggerReceipt(game) { /* implements Triggering step above; returns a receiptTrigger object or null */ },
  awardWin(game, winner) { /* baseline +1 reputation, then earning step */ },
  resolveTrigger(game, winner) { /* implements Resolving step above, no-op if no active trigger */ }
};
```

Integration points (all additive, no existing behavior changed):
- `Game.addPlayer(name)` — initialize `stats` and `receipts` on new players.
- `Game.nextBlack()` — call `ReceiptSystem.maybeTriggerReceipt(this)` first; only fall through to the existing `blackDeck.draw()` + dice-effect logic if it returns null.
- `app.chooseWinner(index)` — after the existing `winner.points++`, call `ReceiptSystem.resolveTrigger(this.game, winner)` **then** `ReceiptSystem.awardWin(this.game, winner)`. Resolving first means if this round's win frees up a receipt slot (owner hits the 5-cap resolving/failing one), that slot is available immediately for the earning step in the same round, rather than lagging a round behind.

`ReceiptSystem`'s functions take `game`/`winner` and mutate the passed-in player/game state directly (matching the existing `Game` class's own style — `submit()`, `advanceJudge()`, etc. all mutate in place rather than returning new state), rather than being purely functional. This keeps the calling code at the integration points simple and consistent with the rest of the file.

## Edge Cases

- **All active players at the 5-receipt cap:** game proceeds normally, no new receipts awarded until some resolve/fail and free up a slot.
- **No eligible (non-O.G.-owned) active receipts exist:** the 35% roll never has anything to hit; a normal black card is drawn every round until someone holds an eligible receipt.
- **3-player minimum game:** receipt trigger candidates may be sparse or empty most of the game — this is fine, the mechanic is opportunistic, not required for the game to function.
- **Receipt owner leaves mid-game:** out of scope — the existing codebase has no player-leave handling in offline mode at all (online mode's leave handling is server-side room bookkeeping only, per `server/server.js`); this spec doesn't add any new leave handling.
- **Game Over:** unaffected. Win condition remains `winner.points >= game.pointsToWin` exactly as today; stats/receipts are not part of the end-game check.

## Testing Plan

Since there's no existing test framework beyond the `npm test` parse-smoke-check, tests for this feature should be added as part of implementation (framework choice is an implementation-planning decision, not this spec). At minimum, cover:
- `ReceiptSystem.awardWin` applies baseline `+1 reputation` on every win.
- Earning a receipt respects the 5-active cap (6th win while at cap awards nothing new).
- `ReceiptSystem.maybeTriggerReceipt` never selects a receipt owned by the current O.G.
- Resolve branch: correct player gets `+2` additional reputation (on top of baseline `+1`), O.G. gets `+1`, receipt status becomes `resolved`.
- Fail branch: receipt owner (not the round's winner) takes `-1` to all four stats, receipt status becomes `failed`.
- A receipt that has resolved or failed is never re-triggered.
