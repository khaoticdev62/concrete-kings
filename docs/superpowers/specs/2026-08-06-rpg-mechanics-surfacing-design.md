# RPG Mechanics Surfacing & Pruning — Design Spec

## Context

`docs/superpowers/specs/2026-08-04-stats-and-receipts-system-design.md` already
specified and shipped a 4-stat player model (`streetCred`, `community`,
`wisdom`, `reputation`) plus `ReceiptSystem`, `AllianceSystem`, and
`CornerHustleBetting` into the core game (`index.html`'s `Deck`/`Game`/`app`
classes — the classic offline pass-and-play and online CAH loop, not the
separate Solo Campaign `NarrativeStoryEngine`). `docs/CLAUDE.md`'s claim that
"none of that narrative RPG layer exists in code yet" is stale — it's real,
tested code (75/75 tests passing, 6 dedicated Receipt test files, dedicated
Alliance/Betting/O.G.-power test files).

The problem isn't that these systems don't exist — it's that they're built in
a way that reads as convoluted:

- **Veto** (`Game.triggerVeto`, `index.html:1262-1267`), **Double-Down**
  (`Game.triggerDoubleDown`, `index.html:1269-1273`), **betting**
  (`CornerHustleBetting.placeBet`/`resolveBets`, `index.html:1378-1405`), and
  **alliance proposals** (`AllianceSystem.proposeAlliance`,
  `index.html:1338-1344`) are all only reachable by expanding a collapsed
  `<details class="panel dev-bar">` "DEVELOPER_CONSOLE.LOG" element
  (`index.html:822-915`) — framed as developer tooling, not real play
  actions, with no in-fiction prompt during the normal round flow.
- Of the 4 stats, only `streetCred` is ever *read* to gate or multiply
  anything (the bet-cost check in `placeBet`, `index.html:1383-1384`).
  `community` and `wisdom` are write-only: incremented by two Block Map
  hotspots (`index.html:2588-2594`) and docked on a failed Receipt
  (`index.html:1312-1313`), but never read anywhere.
- The "RPG STAT HUD" panel (`index.html:791-798`,
  `hudCred`/`hudComm`/`hudWisd`/`hudRep`) is dead markup — nothing ever
  writes to it after page load, so it permanently reads `0`.
- Character Origins (`CHARACTER_ORIGINS`,
  `src/pixel_engine/block-map-navigation.js:7-80`) are still purely
  cosmetic (hair/skin/outfit colors only) — no stat bonus exists despite
  `docs/DESIGN.md:38` claiming origins have "hidden stat bonuses."
- Weather (`game.weatherMode`, default `'CLEAR'`, `index.html:1180`) has real
  mechanical hooks (RAIN softens dice rolls, `index.html:1233`;
  NEON_FLICKER/POLICE_SIRENS multiply bet cost/payout and alliance/receipt
  reputation swings) but is presented as a manual dev-console dropdown
  (`#weatherSelect`, `index.html:827-833`) rather than the ambient effect its
  own mechanics imply.

This spec **amends** the 2026-08-04 spec's data model (pruning 2 of its 4
stats) and surfaces the systems it introduced into real play, rather than
building anything new from scratch. It does not touch `NarrativeStoryEngine`
(the separate Solo Campaign mode) or Campaign mode's dead
`targetReputation`-per-act gating — both are explicitly out of scope, the
latter deferred to a follow-up spec.

## Goals

1. Prune `player.stats` from 4 fields to 2 (`streetCred`, `reputation`),
   removing the two fields nothing ever reads.
2. Wire the RPG Stat HUD to actually display live `streetCred`/`reputation`.
3. Move Veto and Double-Down out of the dev console into real, judge-only
   buttons shown during the judge's turn.
4. Move betting out of the dev console into a real HIGH/LOW prompt shown
   whenever a dice black card appears, fixing the existing bug where the UI
   always bets "high" regardless of input.
5. Move alliance proposals out of the dev console into a real player-picker
   dropdown shown during the submission phase.
6. Make weather shift automatically each round instead of via manual
   dev-console control.
7. Give each of the 8 existing Origins a flavor line and a small starting
   `streetCred`/`reputation` bonus.

## Non-goals

- Campaign mode's `targetReputation`-per-act gating (deferred to a follow-up
  spec) — this spec does not change `CampaignModeEngine` or
  `src/pixel_engine/campaign-mode.js`.
- `NarrativeStoryEngine` / Solo Campaign mode (`src/pixel_engine/story-engine.js`)
  is untouched — its own origin/secrets/ability systems from the prior
  session's work are separate and unaffected.
- No new mechanics beyond what's listed above — this is a surfacing and
  pruning pass, not new game design. In particular: no O.G. "assign a
  Receipt" power, no "Cookout Summit" multi-winner judging, no
  reputation-weighted judge rotation — `docs/DESIGN.md`'s fuller O.G. vision
  stays undesigned/deferred.
- The dev-console `<details>` panel itself is not removed — Veto/Double-Down/
  Bet/Alliance controls move OUT of it into real play UI, but the panel can
  stay as an actual debug tool (e.g. still useful for the weather dropdown,
  which becomes dev-only per Goal 6).

## Design

### 1. Stat model: prune to 2 fields

`Game.addPlayer` (`index.html:1189`) changes:
```js
stats: { streetCred: 0, reputation: 0 }
```
Same change at the two online-room player construction sites
(`index.html:3513`, `3533`) and in `loadGame`'s restore logic
(`index.html:4030-4035`, drop the `streetCred`/`community`/`wisdom` fallback
reads down to just `streetCred`/`reputation`).

`ReceiptSystem.resolveTrigger`'s failed-receipt penalty
(`index.html:1310-1314`) drops the `community`/`wisdom` decrements:
```js
receipt.status = 'failed';
owner.stats.streetCred -= 1;
owner.stats.reputation -= 1;
```

The two Block Map hotspot handlers (`index.html:2588-2594`) are repurposed
rather than deleted, so the existing interactive Block Map locations keep a
reward:
```js
} else if (spot.id === 'BODEGA') {
  alert('🏪 You bought a chopped cheese from the corner Bodega. Street Cred +1.');
  const me = this.game.players[this.humanIndex];
  if (me) me.stats.streetCred++;
} else if (spot.id === 'CHESS_PARK') {
  alert('♟️ You played chess and learned from a neighborhood elder. Reputation +1.');
  const me = this.game.players[this.humanIndex];
  if (me) me.stats.reputation++;
}
```
(Exact `spot.id` values and surrounding structure confirmed from the current
handler — only the alert copy and stat field change.)

### 2. RPG Stat HUD: wire it live, drop the dead tiles

Markup (`index.html:791-798`) drops the `COMM`/`WISD` `hud-item` divs, keeping
only:
```html
<div class="hud-item"><span class="hud-label">CRED:</span> <span id="hudCred" class="hud-val">0</span></div>
<div class="hud-item"><span class="hud-label">REP:</span> <span id="hudRep" class="hud-val">0</span></div>
```

A new small update, called from wherever the game screen re-renders each
round (`renderGame()`), sets both spans from the human player's stats:
```js
updateStatHud() {
  const me = this.game.players[this.humanIndex];
  const credEl = document.getElementById('hudCred');
  const repEl = document.getElementById('hudRep');
  if (credEl) credEl.textContent = me ? me.stats.streetCred : 0;
  if (repEl) repEl.textContent = me ? me.stats.reputation : 0;
}
```
Called once at the end of `renderGame()`, guarded the same way other
render-time DOM lookups in that function already are (elements may not exist
on every screen — the existing pattern throughout `index.html` is a bare
`document.getElementById(...)` null check, matched here).

### 3. Veto & Double-Down: judge-only buttons in the play UI

Both `Game.triggerVeto()` and `Game.triggerDoubleDown()` keep their exact
current internal logic (one-shot flags, `vetoUsed` never resets,
`doubleDownActive` consumed by the next `chooseWinner` call) — only their
UI entry point changes.

New buttons appear on the main game screen (near the black card display),
visible only when `this.isJudge()` is true and the relevant flag hasn't been
used yet:
```html
<button id="vetoBtn" onclick="app.ogVeto()" style="display:none;">VETO (O.G. POWER)</button>
<button id="doubleDownBtn" onclick="app.ogDoubleDown()" style="display:none;">DOUBLE DOWN (O.G. POWER)</button>
```
`renderGame()` toggles their visibility:
```js
const vetoBtn = document.getElementById('vetoBtn');
if (vetoBtn) vetoBtn.style.display = (this.isJudge() && !this.game.vetoUsed) ? 'inline-block' : 'none';
const ddBtn = document.getElementById('doubleDownBtn');
if (ddBtn) ddBtn.style.display = (this.isJudge() && !this.game.doubleDownActive) ? 'inline-block' : 'none';
```
`app.ogVeto()` and `app.ogDoubleDown()` (`index.html:3947-3960`) are
unchanged — they already call `this.game.triggerVeto()` /
`this.game.triggerDoubleDown()` and re-render; only their buttons' location
moves. The existing dev-console buttons for these two are removed (Veto and
Double-Down fully leave the dev console); the dev-console Bet and Alliance
controls are also removed once their real-play replacements exist (§4, §5).

**New behavior, not in the original spec:** neither function currently
checks who's calling it. Add a judge-only guard directly in `app.ogVeto()`
and `app.ogDoubleDown()` (not in the `Game` methods themselves, to keep
`Game` a pure state/rules class with no UI-role concept):
```js
ogVeto() {
  if (!this.isJudge()) return;
  this.game.triggerVeto();
  this.renderGame();
},
ogDoubleDown() {
  if (!this.isJudge()) return;
  this.game.triggerDoubleDown();
  this.renderGame();
},
```

### 4. Betting: real HIGH/LOW prompt on dice black cards

New UI block on the game screen, shown only when
`this.game.currentBlack?.hasDice` is true and the human hasn't already bet
this round (`!(this.humanIndex's name in this.game.bets)`):
```html
<div id="betPrompt" style="display:none;">
  <span id="betCostLabel"></span>
  <button onclick="app.placeBetFromUI('high')">BET HIGH</button>
  <button onclick="app.placeBetFromUI('low')">BET LOW</button>
</div>
```
`app.placeBetFromUI(pick)` (`index.html:4048-4054`) changes from its current
hardcoded-`'high'`, text-input-reading form to take the real pick as a
parameter:
```js
placeBetFromUI(pick) {
  const me = this.game.players[this.humanIndex];
  if (!me) return;
  const cost = this.game.weatherMode === 'NEON_FLICKER' ? 2 : 1;
  if (!this.game.placeBet(me.name, pick)) {
    alert(`Not enough Street Cred (need ${cost}).`);
    return;
  }
  this.renderGame();
},
```
The old `betInput` text field and its dev-console button
(`index.html:907-908`) are removed — the free-text field was already
functionally dead (its value was read only for a non-empty check, never
actually used to pick high/low). `renderGame()` shows/hides `#betPrompt` and
sets `#betCostLabel`'s text to the current weather-adjusted cost, using the
same `NEON_FLICKER` check already present in `CornerHustleBetting.placeBet`
(`index.html:1382`) — no new cost logic, just displaying the existing one.

### 5. Alliance: real player-picker dropdown

New UI block on the game screen, shown during the submission phase when
`!this.game.currentAlliance` and at least one eligible ally exists (i.e. the
player pool minus the human and the current judge is non-empty — in a
2-player game this is always empty, so the prompt simply never shows):
```html
<div id="alliancePrompt" style="display:none;">
  <select id="allianceTargetSelect"></select>
  <button onclick="app.proposeAllianceFromUI()">PROPOSE COOKOUT ALLIANCE</button>
</div>
```
`renderGame()` populates the `<select>` with every player except the human
and the current judge (allying with the judge doesn't make sense — they're
adjudicating, not competing):
```js
const targetSelect = document.getElementById('allianceTargetSelect');
if (targetSelect) {
  const me = this.game.players[this.humanIndex];
  const judge = this.game.players[this.game.judgeIndex % this.game.players.length];
  const eligible = this.game.players.filter(p => p !== me && p !== judge);
  targetSelect.innerHTML = eligible.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
}
```
`app.proposeAllianceFromUI()` (`index.html:4056-4063`) changes from reading a
free-text input to reading the select's value:
```js
proposeAllianceFromUI() {
  const me = this.game.players[this.humanIndex];
  const targetName = document.getElementById('allianceTargetSelect')?.value;
  if (!me || !targetName) return;
  AllianceSystem.proposeAlliance(this.game, me.name, targetName);
  this.renderGame();
},
```
(`AllianceSystem.proposeAlliance(game, proposer, target)` stores `proposer`/
`target` exactly as passed and `resolveRound` later compares them against
`winner.name` — confirmed at `index.html:1338-1349` that these must be name
strings, not player objects, matching the current dev-console call's
argument types.)
The old `allianceInput` text field and dev-console button
(`index.html:911-912`) are removed.

### 6. Weather: automatic per-round shift

`Game.nextBlack()` (`index.html:1205-1225`) gains a weather-shift roll at
the top, before the existing Receipt-trigger check, using the same
`Math.random() < X` pattern already used for dice-effect odds
(`index.html:1218`):
```js
nextBlack() {
  if (Math.random() < 0.2) {
    const modes = Object.values(WEATHER_MODES).filter(m => m !== this.weatherMode);
    this.weatherMode = modes[Math.floor(Math.random() * modes.length)];
  }
  const trigger = ReceiptSystem.maybeTriggerReceipt(this);
  // ... unchanged from here
```
`WEATHER_MODES` (defined in `src/pixel_engine/weather-effects-system.js:7-12`
as a plain object — `{ CLEAR: 'CLEAR', RAIN: 'RAIN', STEAM_VENT: 'STEAM_VENT',
POLICE_SIRENS: 'POLICE_SIRENS', NEON_FLICKER: 'NEON_FLICKER' }`, exported to
`window.WEATHER_MODES` and loaded via `<script src="src/pixel_engine/weather-effects-system.js">`
at `index.html:1018`, before the inline script) is the source — `Object.values`
gives the 5 mode strings, filtering out the current mode guarantees a
visible change on the ~20% of rounds it triggers, rather than a roll that
silently "shifts" to the same mode.

The dev-console `#weatherSelect` dropdown (`index.html:827-833`) and
`app.setWeather()` (`index.html:3961-3972`) are left in place as a genuine
debug tool (per the Non-goals section) — not removed, just no longer
described or treated as a core player-facing mechanic.

### 7. Origin stat bonuses

Each entry in `CHARACTER_ORIGINS`
(`src/pixel_engine/block-map-navigation.js:7-80`) gains two new fields
alongside its existing cosmetic ones — `flavor` (a short line) and
`startingStats` (`{ streetCred, reputation }`):

| Origin | Flavor | streetCred | reputation |
|---|---|---:|---:|
| BARBER | "Everybody's business runs through your chair. You hear it first, you know it best." | 0 | +2 |
| STREET_SCHOLAR | "Books over corners, but you still know every angle the block's got." | +1 | 0 |
| LOCAL_LEGEND | "They wrote songs about you. Reputation walks in the room before you do." | 0 | +2 |
| CORNER_MERCHANT | "Bodega counter's your throne. You see everything, you say nothing — for now." | +2 | 0 |
| COMMUNITY_ORGANIZER | "You rally the block before the block even knows it needs rallying." | 0 | +2 |
| UNDERGROUND_DJ | "You keep the party alive till sunrise. Nobody forgets who kept it moving." | +1 | +1 |
| BLOCK_ARCHITECT | "Still earning your stripes — building trust takes longer than building blueprints." | +1 | -1 |
| HUSTLE_VETERAN | "Old scars, older respect. You've been out here longer than most been alive." | +2 | +1 |

The primary, confirmed integration point is `startLocalGame()`
(`index.html:2038-2061`), where `originKey` is already read and assigned to
`this.game.players[0].origin` (line 2057), right after `addPlayer` has given
that player the flat `{ streetCred: 0, reputation: 0 }` default. Immediately
after that assignment:
```js
const origin = CHARACTER_ORIGINS[originKey] || CHARACTER_ORIGINS.BARBER;
this.game.players[0].stats.streetCred += origin.startingStats.streetCred;
this.game.players[0].stats.reputation += origin.startingStats.reputation;
```
Bot/AI players (`players[1..count-1]`, lines 2058-2061) keep the flat
`{0, 0}` default — origin bonuses are a human-character-creation flourish,
bots are assigned origins purely for cosmetic/dialogue-flavor purposes.

`characterOriginSelect` is also read at several online-mode entry points
(`index.html:3398`, `3418`, `3489`, `3656`, `3667`) to send `originKey` over
the WebSocket connection, but none of those sites directly set
`players[0].stats` the way `startLocalGame()` does — online mode's local
`Game` instance construction needs the equivalent bonus application
wherever it locally adds the human player. The implementation plan must
locate and confirm that exact site (it was not pinned down during this
design pass) rather than assume it mirrors `startLocalGame()` exactly.

## Testing

Following the existing repo pattern (`node --test`, real extracted
`Game`/`ReceiptSystem`/etc. via `test/helpers/load-app.js`, no DOM test
harness for `index.html`'s `app` object):

- `test/receipt-system-resolve-trigger.test.js` and any other test
  asserting a 4-field stat drop on failed-receipt: update to assert only
  `streetCred`/`reputation` drop by 1, and that `community`/`wisdom` are no
  longer present on `player.stats` at all (`assert.equal(player.stats.community, undefined)`).
- New test: `Game.addPlayer` produces exactly `{ streetCred: 0, reputation: 0 }`
  (no extra fields).
- New test: weather-shift roll in `nextBlack()` — seed `Math.random` (the
  existing test suite's pattern for dice-effect-odds tests, if one exists,
  should be followed; otherwise assert only that `weatherMode` is always one
  of `WEATHER_MODES` after many calls, and stays unchanged when the roll
  doesn't hit, via a mocked `Math.random`).
- New test: judge-only guard on `app.ogVeto`/`app.ogDoubleDown` — calling
  either when `!isJudge()` leaves `vetoUsed`/`doubleDownActive` unchanged.
- New test: `placeBetFromUI`-equivalent logic (the underlying
  `CornerHustleBetting.placeBet` call) accepts an explicit `'low'` pick, not
  just `'high'` — regression test for the fixed hardcoding bug.
- New test: origin `startingStats` are applied once to a newly created
  human player and NOT applied to bot players.
- UI wiring (HUD update, button visibility toggling, bet/alliance prompt
  show/hide, dropdown population) gets manual browser verification only,
  matching how the narrative-engine UI wiring task was verified in the prior
  session — no automated DOM test exists for this class of change in this
  repo.

## Files touched

- `index.html` — `Game.addPlayer` and the two online-room player
  constructions (stat pruning), `loadGame` (restore logic), `ReceiptSystem.resolveTrigger`
  (drop 2 penalty lines), the two Block Map hotspot handlers (repurpose),
  the RPG Stat HUD markup + a new `updateStatHud()` call from `renderGame()`,
  new Veto/Double-Down buttons + judge-only guards in `app.ogVeto`/`app.ogDoubleDown`,
  new bet prompt UI + rewritten `app.placeBetFromUI(pick)`, new alliance
  prompt UI + rewritten `app.proposeAllianceFromUI()`, `Game.nextBlack()`
  (weather-shift roll), removal of the now-redundant dev-console Veto/
  Double-Down/Bet/Alliance controls (dev-console weather dropdown stays),
  `startLocalGame()` (origin `startingStats` application, confirmed site),
  plus the analogous online-mode local-player-creation site (exact location
  to be confirmed during planning — see §7).
- `src/pixel_engine/block-map-navigation.js` — `CHARACTER_ORIGINS` gains
  `flavor` and `startingStats` fields on all 8 entries.
- `test/*.js` — updates per the Testing section above (exact files
  identified during planning: grep for `.stats.community`/`.stats.wisdom`
  across `test/` to find every assertion needing a 2-stat update).
