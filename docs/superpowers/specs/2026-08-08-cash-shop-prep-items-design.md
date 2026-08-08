# CASH Shop — Mini-Game Prep Items — Design Spec

Date: 2026-08-08
Status: Approved for planning

## Context

The Main Menu has a `SHOP` button (`index.html:544`) wired to `onclick="app.showBoosterShop()"` — a method that does not exist anywhere in the codebase, confirmed both by `grep` (zero definitions, one call site) and live: clicking it throws `TypeError: app.showBoosterShop is not a function`. `git log -S"showBoosterShop()"` shows it has never been implemented; it is not a regression, it is a stub left over from an earlier pass.

There is already a working shop in the game — the Deck Builder's Shop tab (`setDeckBuilderTab('shop')`, `renderShopGrid()`/`buyCardBack()`, `index.html:2588-2733`) — which sells cardback cosmetics for "Receipt Dust," a currency earned by grinding unwanted cards (`grindCardToDust`) and persisted via `localStorage['ck-dust-balance']`. Repointing the dead button at that existing screen was considered and rejected: the request is for CASH (the RPG stat, `player.stats.streetCred`) to have real spending power, distinct from the cosmetic dust economy.

CASH is **not persistent**. It lives on `app.game.players[i].stats.streetCred`, initialized from the chosen origin's `startingStats.streetCred` at the start of each new game/journey, and fluctuates during play (mini-game stakes, `negotiation.js`'s BRIBE tactic, round win/loss deltas, narrative `cashDelta` results). It is never written to `localStorage` and does not survive a new game starting. This rules out putting a CASH-spending shop on the Main Menu, which is shown before any game exists — there is no wallet to read yet. The shop must live inside an active game.

Investigation of the five existing mini-games (`src/pixel_engine/mini-games/games/*.js`) found each already reads a `difficulty`-driven set of tuning values in its `init(params)` — `dc`, `alertnessRate`, `goodWidth`/`perfectWidth`, `tolerance`, `resistance` — set once at construction and never touched again except by that mini-game's own internal logic. `MiniGameManager.start(gameId, params)` (`src/pixel_engine/mini-games/mini-game-manager.js:41`) is the single call site that constructs every mini-game and calls `activeGame.init(params)`, for both the free-play catalog (`launchCatalogMinigame`, `index.html:2154`, no `app.game` required) and the stakes-bearing sandbox/campaign launches (`startJourneySandbox` → `startXSandbox()` methods, `index.html:2485-2491` plus per-game methods around lines 4800-4924, all of which create or reuse `app.game.players[...]` with live `stats.streetCred`).

## Design

### 1. Data model

No new persistence. Alongside the existing `stats: {streetCred, reputation}` field set on every player object (`Game.addPlayer` and the narrative-mode player-object literals in `index.html`), add:

```js
prepItems: { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 }
```

Same lifetime as `stats.streetCred` — reset to zero on every new game, exactly like CASH itself. This is a deliberate choice: a prep-item inventory that outlived the wallet that paid for it would be an inconsistency, not a feature.

### 2. Entry point

A `SHOP` button is added to the existing "RPG STAT HUD" panel in the `#game` screen (`index.html:1011-1019`), next to the live `CASH` readout (`#hudCred`). Clicking it opens a new `shopModal`, following the exact structural convention of `journeyModal`/`accessModal`/`reviewModal` (fixed-position overlay, `.panel` box, a close button). This is the only screen where a CASH balance is genuinely live and player-visible via `#hudCred`.

The Main Menu's `showBoosterShop()` becomes a real, small function: it opens a short-lived info modal ("The Shop opens once you're on a run — start a Journey to earn CASH and spend it there") with one button that routes into character creation (`app.showCharacterCreation()`), rather than throwing. This satisfies "no dead UI" without inventing a wallet that doesn't exist yet.

The Deck Builder's existing Shop tab is untouched — it remains the dust/cosmetics shop, unrelated to this feature.

### 3. Item catalog

Five items, one per mini-game, each costing 30 CASH, each stackable up to 3 owned-and-unconsumed at a time (a per-item cap enforced at purchase — the BUY button disables past 3 owned for that item). Each item is consumed automatically the next time its mini-game is played, applying one real, mechanical bonus:

| Mini-game | Item name | Effect | Applied in |
|---|---|---|---|
| Street Dice | Loaded Dice | `dc` −3 | `street-dice.js` `init()` |
| Bodega Run | Rubber Soles | `alertnessRate` −30 | `bodega-run.js` `init()` |
| Haircut Challenge | Steady Hand | `goodWidth` +0.06, `perfectWidth` +0.03 | `haircut-challenge.js` `init()` |
| Lockpicking | Master Pick | `tolerance` +6 | `lockpicking.js` `init()` |
| Negotiation | Insider Info | `resistance`/`maxResistance` −20 | `negotiation.js` `init()` |

Bonuses are applied **after** each file's existing difficulty-based defaults, as one additive line per file — they adjust the difficulty-selected baseline, they do not replace it.

### 4. Wiring — the consumption hook

One hook, in `MiniGameManager.start(gameId, params)`, immediately before `this.activeGame.init(params)`:

```js
if (typeof app !== 'undefined' && app.game) {
  const me = app.game.players[app.humanIndex];
  if (me && me.prepItems && me.prepItems[gameId] > 0) {
    me.prepItems[gameId] -= 1;
    params = { ...params, prepItemBonus: true };
  }
}
```

Each mini-game's `init(params)` reads `params.prepItemBonus` and applies its one line from the table above. This keeps the bonus logic colocated with the difficulty logic it modifies, rather than centralizing five different field names in the manager.

This hook is a no-op whenever `app.game` doesn't exist (the Mini-Game Catalog's free-play entry point) or the player owns no prep item for that game — both existing entry points keep their exact current behavior. No new state is required to distinguish "shop item bought" from "shop item unavailable here": the same `prepItems` object is simply absent-or-zero in every case that isn't a live, stakes-bearing run.

### 5. Shop UI behavior

`shopModal` lists the five items, each showing name, one-line description of its effect, cost, current owned count (0-3), and a BUY button. BUY is disabled when CASH is insufficient or the item is already at the 3-owned cap. Buying deducts CASH from `app.game.players[app.humanIndex].stats.streetCred`, increments the matching `prepItems[gameId]`, updates `#hudCred`, and re-renders the modal's owned counts in place (same re-render-in-place pattern as `renderShopGrid()`'s dust shop). The modal also shows the current CASH balance at the top, read live from the same player object.

## Testing

- Unit tests (new `test/cash-shop.test.js`, following the `loadGameModule()` VM-sandbox pattern used by other suites): buying an item deducts the correct CASH and increments `prepItems`; buying is blocked below cost; buying is blocked at the 3-owned cap; the modal's owned/cost/afford state reflects `stats.streetCred` and `prepItems` correctly.
- Extend `test/mini-game-system.test.js`: for each of the five games, construct with `params.prepItemBonus = true` and assert the specific field changes by its exact delta (e.g., `dc` is 3 lower than the same difficulty without the flag); construct without the flag and assert unchanged behavior (regression guard against the bonus leaking into free play).
- New test for `MiniGameManager.start()`: with a player holding `prepItems.street_dice = 1`, `start('street_dice', {})` decrements it to 0 and passes `prepItemBonus: true` into `init()`; with `app.game` unset, `start()` behaves identically to before this change (no `prepItemBonus`, no throw).
- The Shop modal's live DOM (button disabled states, HUD CASH refresh after purchase) is UI-only and gets manual browser verification, matching the pattern used for the character-creation wizard's DOM interactions — `node --test` cannot exercise real click/disabled-attribute behavior in the VM sandbox.

## Out of scope

- Any change to the Deck Builder's existing dust/cardback shop.
- A persistent, cross-game CASH wallet or any new `localStorage` key — CASH keeps its current reset-per-game lifetime.
- Applying prep-item bonuses to campaign/story-triggered mini-game launches beyond what `MiniGameManager.start()` already uniformly covers — no separate code path is added for narrative triggers; they get the same hook everyone else does, for free.
- New items beyond the five listed, or non-mini-game shop content (e.g., attribute training) — a separate idea considered and explicitly not chosen for this pass.
