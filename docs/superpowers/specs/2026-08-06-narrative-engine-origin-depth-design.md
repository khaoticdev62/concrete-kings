# Narrative Engine Origin Depth — Design Spec

## Context

`src/pixel_engine/story-engine.js` implements `NarrativeStoryEngine`, the state
machine behind the "Noir Prototype" / Solo Campaign mode ("The Dropoff", 5
beats, ending at Marcus's warehouse). It is wired into `index.html` via
`app.startNoirPrototype()` and covered by `test/story-engine.test.js` (5
passing tests).

The flow is Cards-Against-Humanity style: the human player is always the
judge (`judgeIndex = 0`). Three bots (`O.G. Big Dave` / BARBER, `Stoop Homie`
/ LOCAL_LEGEND, `Bodega Clerk` / CORNER_MERCHANT) each submit one white card
per beat from `NARRATIVE_WHITE_DECK`. The human picks the winning submission;
`applyWinnerCard(cardText)` looks up that card's `category` (one of `street`,
`family`, `church`, `food`, `humor`), applies the beat's `tagConsequences` for
that category to `heat`/`trust`, and advances to the next beat. At beat 5 it
resolves one of three endings (`trap`/`exit`/`hustle`) purely from `heat`/
`trust` thresholds.

Separately, `CHARACTER_ORIGINS` (defined in
`src/pixel_engine/block-map-navigation.js`) defines 8 origins (Barber, Street
Scholar, Local Legend, Corner Merchant, Community Organizer, Underground DJ,
Block Architect, Hustle Veteran). Today these are purely cosmetic — sprite
palette data (hair/skin/outfit colors) — and have no effect on
`NarrativeStoryEngine`. The human already selects one of these 8 via
`characterOriginSelect` in the setup screen and it's stored as
`this.game.players[0].origin`, but the story engine never reads it.

This spec deepens `NarrativeStoryEngine` to make origin selection matter
mechanically, without changing the story content, the 5 tag categories, or
retiring/replacing the engine. It explicitly does **not** revive the older
`CLAUDE_CODE_PROMPT.md` spec (different story, Uncle Ray/Marquez/Jada,
per-NPC trust) — that document is superseded and out of scope.

## Goals

1. The human's chosen origin passively favors one tag category for the rest
   of the playthrough.
2. A one-use special ability lets the human reject one bot's submission and
   force a resubmission before judging.
3. A secrets system rewards picking specific "insider" cards as winners,
   unlocking a 4th ending.

## Non-goals

- No changes to `NARRATIVE_BEATS` story text, beat count, or the 5 tag
  categories.
- No changes to bot AI selection logic (`evaluateCardSynergy`) beyond what's
  needed to resubmit a card after a Force Redo.
- No per-NPC trust, no multiple simultaneous abilities, no UI rework of the
  character-select screen (it already lets the human pick from all 8
  origins).
- Bot origins (Barber/Local Legend/Corner Merchant) do not get their own
  bonuses — only the human judge's origin matters, per the approved design.

## Design

### 1. Origin → favored tag table

New export in `story-engine.js`:

```js
const ORIGIN_TAG_AFFINITY = {
  BARBER: 'family',
  STREET_SCHOLAR: 'church',
  LOCAL_LEGEND: 'street',
  CORNER_MERCHANT: 'food',
  COMMUNITY_ORGANIZER: 'family',
  UNDERGROUND_DJ: 'humor',
  BLOCK_ARCHITECT: 'church',
  HUSTLE_VETERAN: 'street',
};
```

`NarrativeStoryEngine` gains an `origin` field, set via `reset(originKey)`
(default `null` → no bonus, preserving old test behavior that calls
`reset()` with no args).

In `applyWinnerCard`, after computing the base `consequence` for the winning
card's category:

- If `this.origin` is set and `ORIGIN_TAG_AFFINITY[this.origin] === category`:
  - `trust` gets `+1` in addition to the card's own `trust` delta.
  - The `heat` delta applied is `Math.min(consequence.heat, consequence.heat - 1)`
    when `consequence.heat > 0` (i.e. positive heat gains are reduced by 1,
    floor 0 same as today); heat deltas that are already `0` or negative are
    unaffected.
- This bonus is silent in the return value's `consequenceText` (no separate
  copy needed) but the applied deltas already reflect it, so the UI's
  `narrativeHeat`/`narrativeTrust` readouts show the bonus automatically.

### 2. Special ability: Force Redo

New engine state: `specialAbilityUsed = false` (reset in `reset()`).

New method:

```js
forceRedo(playerIndex, newCardText) {
  if (this.specialAbilityUsed) return false;
  const submission = this.pendingSubmissions?.find(s => s.playerIndex === playerIndex);
  if (!submission) return false;
  submission.card = newCardText;
  this.specialAbilityUsed = true;
  return true;
}
```

Rather than have the engine own submission state (currently owned by
`this.game.submissions` in `index.html`), the simplest integration is to keep
submissions in `app` (as today) and add the ability check/flag to the engine,
with `app` doing the actual card swap:

- `app` UI: on the judging screen, add a "Force Redo" button next to each
  submitted card, visible only if `!this.storyEngine.specialAbilityUsed`.
- Clicking it for bot player `p`:
  1. Calls `this.storyEngine.markAbilityUsed()` (new method, sets
     `specialAbilityUsed = true`, returns `false` if already used — guards
     double-clicks).
  2. Removes the rejected card from `this.game.submissions` for that player.
  3. Re-runs the same selection logic `runNarrativeBotTurns` already uses
     (`evaluateCardSynergy` over the bot's current hand, excluding the
     rejected card) to pick and push a new submission for that one bot.
  4. Re-renders the judging screen with the replacement card in place.
- The button disappears for the rest of the playthrough once used (checked
  via `this.storyEngine.specialAbilityUsed`).

This keeps the engine's role limited to tracking whether the ability is
still available (testable in isolation) while `app` keeps owning card/hand
mutation, consistent with how `runNarrativeBotTurns` already works.

### 3. Secrets → "The Insider" ending

5 cards in `NARRATIVE_WHITE_DECK` (one per category) get a new
`secret: true` flag — the ones already reading as gained leverage/insider
knowledge:

- street: `"A stolen police scanner buzzing with codes"`
- family: `"Your cousin's neighborhood security warning"`
- church: `"Sunday service program signed by the pastor"`
- food: `"A bodega ledger with names you shouldn't know"` — a new card added
  to the food section of `NARRATIVE_WHITE_DECK`, since none of the 4
  existing food cards read as insider knowledge.
- humor: `"An uncle claiming he used to run with the Panthers"`

`NarrativeStoryEngine` gains a `secrets` array (reset to `[]`). In
`applyWinnerCard`, when the matched card has `secret: true`, push its text
into `this.secrets` (dedup via `includes` check) before computing the
ending.

Ending resolution in `applyWinnerCard`'s beat-5 branch changes from:

```js
let endingKey = "hustle";
if (this.heat >= 3) endingKey = "trap";
else if (this.trust >= 3) endingKey = "exit";
```

to:

```js
let endingKey = "hustle";
if (this.secrets.length >= 2) endingKey = "insider";
else if (this.heat >= 3) endingKey = "trap";
else if (this.trust >= 3) endingKey = "exit";
```

New entry in `ENDINGS`:

```js
insider: {
  title: "THE INSIDER",
  text: "You never picked a side. Street, family, church, corner store — you just kept your ears open and your mouth shut. When the dust settles on 125th, you walk away without the package and without a scratch. What you've got is better than cash: you know where every body on this block is buried. Marcus doesn't own you. You own his secrets."
}
```

The insider check runs first, so collecting 2+ secrets always wins out over
the heat/trust-driven endings, matching "the best outcome to chase
deliberately" from the approved design.

### 4. UI changes (`index.html`)

- `startNoirPrototype()`: pass the human's chosen origin into the engine —
  `this.storyEngine.reset(originKey)` instead of `this.storyEngine.reset()`.
- Judging screen: add the "Force Redo" button per bot submission (see §2).
- `renderNarrativeBeat()`: no changes needed — heat/trust readouts already
  reflect origin-bonus-adjusted values automatically.
- Ending screen / `endNarrativeGame()`: display `this.storyEngine.secrets`
  (if any) alongside the existing heat/trust final stats line, so a player
  who unlocks "The Insider" (or gets close) can see what they found.

### 5. Testing

Extend `test/story-engine.test.js`:

- Origin bonus: reset with an origin whose affinity matches a beat's
  winning-card category; assert trust is 1 higher and heat 1 lower than the
  same scenario with no origin.
- Origin mismatch: reset with an origin whose affinity does NOT match;
  assert deltas equal the no-origin baseline (no accidental bonus leakage).
- `markAbilityUsed()`: first call returns `true`/succeeds, second call
  returns `false` (already used).
- Secrets accumulation: apply two different secret-flagged cards across two
  beats, assert `secrets.length === 2` and no duplicate entries if the same
  secret card wins twice.
- Insider ending: drive `secrets.length >= 2` by beat 5 with heat/trust
  values that would otherwise resolve to `trap` or `exit`; assert
  `endingKey === 'insider'` wins anyway.
- Existing 5 tests must continue passing unmodified (backward-compatible
  `reset()` with no args, existing trap/exit endings still reachable when
  secrets < 2).

## Error handling / edge cases

- `reset(originKey)` with an unrecognized key: `ORIGIN_TAG_AFFINITY[key]` is
  `undefined`, so the bonus check (`affinity === category`) is simply always
  false — no crash, silently no bonus. No validation needed beyond that.
- `markAbilityUsed()` called when already used: returns `false`, UI simply
  doesn't re-show the button (guarded by `specialAbilityUsed` check before
  render), so this path is defensive rather than reachable in normal play.
- Heat bonus never pushes heat negative — reuses the existing
  `Math.max(0, ...)` clamp already in `applyWinnerCard`.
- Secrets dedup prevents a repeated secret card from inflating the count
  past what earning it once should count for reaching the 2-secret
  threshold in a single beat's resolution.

## Files touched

- `src/pixel_engine/story-engine.js` — `ORIGIN_TAG_AFFINITY`, `origin` field,
  `secrets` field, `specialAbilityUsed` field, `markAbilityUsed()`, updated
  `reset()` signature, updated `applyWinnerCard()` bonus/secret/ending logic,
  one new food-category secret card, `secret: true` flags on 5 cards, new
  `insider` ending.
- `index.html` — pass origin into `reset()`, Force Redo button + handler on
  judging screen, secrets display on ending/final-stats readout.
- `test/story-engine.test.js` — new tests per §5.
