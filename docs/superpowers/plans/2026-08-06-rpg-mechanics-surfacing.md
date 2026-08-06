# RPG Mechanics Surfacing & Pruning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prune the core game's dead player-stat fields, wire the dead Stat HUD, and move Veto/Double-Down/Betting/Alliance/Weather out of a dev-console-only panel into real, in-fiction play mechanics — with origin-based starting stat bonuses — without inventing any new game systems.

**Architecture:** All changes live in `index.html`'s existing `Game`/`app`/`ReceiptSystem`/`AllianceSystem`/`CornerHustleBetting` classes (already fully implemented and tested) plus `CHARACTER_ORIGINS` in `src/pixel_engine/block-map-navigation.js`. No new classes, no new files, no new dependencies. Each task either prunes existing state, wires existing-but-dead UI, or relocates an existing dev-console control into the main play surface — the underlying mechanics (`Game.triggerVeto`, `Game.triggerDoubleDown`, `CornerHustleBetting.placeBet`, `AllianceSystem.proposeAlliance`) keep their exact current logic.

**Tech Stack:** Plain CommonJS/`window` dual-export JS (no build step), HTML5 Canvas2D for card rendering (unaffected by this plan), Node's built-in `node --test` runner via `test/helpers/load-app.js` (extracts and evals the real inline `<script>` from `index.html` in a Node `vm` context with no `document`/`window`/`alert` globals — so any `app.*` method that touches the DOM is untestable there and gets manual browser verification instead, matching this repo's existing convention).

## Global Constraints

- No new game mechanics beyond what's listed in this plan's 8 tasks — this is a surfacing and pruning pass, not new game design. No O.G. "assign a Receipt" power, no "Cookout Summit," no reputation-weighted judge rotation.
- `NarrativeStoryEngine` / Solo Campaign mode (`src/pixel_engine/story-engine.js`) is untouched by this plan.
- Campaign mode's `targetReputation`-per-act gating is explicitly out of scope (deferred to a follow-up).
- The dev-console `<details class="panel dev-bar">` panel (`index.html:822-915`) is not removed — only its Veto/Double-Down/Bet/Alliance controls move into the main play UI. The weather `<select>` dropdown stays in the dev console as a genuine debug tool.
- `npm test` currently passes **75/75** (`node --test test/**/*.test.js` plus a syntax check of `index.html`/`cards.js`/`server/server.js`). This must stay green after every task.
- `Game`, `ReceiptSystem`, `AllianceSystem`, and `CornerHustleBetting` methods must stay DOM-free (no `document`/`alert` calls) — only `app.*` methods touch the DOM, matching the existing separation in this file.
- No new npm dependencies. No jsdom/node-canvas. Every new/changed file keeps the existing dual `module.exports`/`window.X` export pattern where applicable.

---

### Task 1: Prune player stats from 4 fields to 2

**Files:**
- Modify: `index.html` — `Game.addPlayer` (`:1185-1192`), two online-room player constructions (`:3511-3515`, `:3531-3535`), `saveGame` (`:3989-4016`), `loadGame` (`:4017-4047`), `ReceiptSystem.resolveTrigger` (`:1297-1316`)
- Test: `test/receipt-pool-and-player-model.test.js`, `test/receipt-system-resolve-trigger.test.js`, `test/save-load-and-blockmap.test.js`

**Interfaces:**
- Produces: `player.stats` is now `{ streetCred: number, reputation: number }` everywhere a player object is created or restored — every later task in this plan assumes this exact 2-key shape.

- [ ] **Step 1: Update the failing tests**

In `test/receipt-pool-and-player-model.test.js`, change line 22:
```js
test('Game.addPlayer initializes stats at zero and an empty receipts list', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  assert.deepEqual(game.players[0].stats, { streetCred: 0, reputation: 0 });
  assert.deepEqual(game.players[0].receipts, []);
});
```

In `test/receipt-system-resolve-trigger.test.js`, change the three `deepEqual` assertions:
```js
test('resolveTrigger is a no-op when the round had no receipt trigger', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.judgeIndex = 0;
  game.currentBlack = { raw: 'x', prompt: 'x', hasDice: false, effect: null };
  const winner = game.players[1];
  ReceiptSystem.resolveTrigger(game, winner);
  assert.deepEqual(winner.stats, { streetCred: 0, reputation: 0 });
});
```
```js
test('resolveTrigger fails the receipt and penalizes the owner when someone else wins', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeTriggeredGame(Game);
  const owner = game.players[1];
  const other = game.players[2];
  const judge = game.players[0];
  ReceiptSystem.resolveTrigger(game, other);
  assert.equal(owner.receipts[0].status, 'failed');
  assert.deepEqual(owner.stats, { streetCred: -1, reputation: -1 });
  assert.equal(judge.stats.reputation, 0);
  assert.deepEqual(other.stats, { streetCred: 0, reputation: 0 });
});
```
(The middle test, `'resolveTrigger resolves the receipt and rewards owner + O.G. when the owner wins'`, only asserts individual `.stats.reputation` fields, not a `deepEqual` on the whole object — it needs no change.)

In `test/save-load-and-blockmap.test.js`, remove the `community`/`wisdom` lines from both state-building object literals (lines 24-25 and 61-62) and from the restore-side `stats` object literal (lines 82-83):
```js
players: game.players.map(p => ({
  name: p.name,
  points: p.points,
  hand: p.hand.slice(),
  streetCred: p.stats.streetCred,
  reputation: p.stats.reputation,
  receipts: p.receipts.slice()
})),
```
(apply the same 2-field trim to both occurrences of this shape) and:
```js
restored.players = state.players.map(p => ({
  name: p.name,
  points: p.points,
  hand: p.hand.slice(),
  stats: {
    streetCred: p.streetCred || 0,
    reputation: p.reputation || 0
  },
  receipts: p.receipts.slice()
}));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/receipt-pool-and-player-model.test.js test/receipt-system-resolve-trigger.test.js test/save-load-and-blockmap.test.js`
Expected: FAIL — `deepEqual` mismatches because `Game.addPlayer` still produces the 4-field shape.

- [ ] **Step 3: Prune the implementation**

In `index.html`, change `Game.addPlayer` (currently `:1189`):
```js
addPlayer(name) {
  if (this.players.length >= 12) throw new Error('Max 12 players');
  this.players.push({
    name, hand: [], points: 0,
    stats: { streetCred: 0, reputation: 0 },
    receipts: []
  });
}
```

Change both online-room player constructions (currently `:3511-3515` and `:3531-3535`, identical shape in both):
```js
this.game.players = msg.players.map(p => ({
  name: p.name, hand: [], points: p.points || 0,
  stats: { streetCred: 0, reputation: 0 }, receipts: [],
  ready: !!p.ready
}));
```

Change `saveGame`'s player serialization (currently `:3995-4004`):
```js
players: this.game.players.map(p => ({
  name: p.name,
  points: p.points,
  hand: p.hand,
  streetCred: p.stats?.streetCred,
  reputation: p.stats?.reputation,
  receipts: p.receipts
})),
```

Change `loadGame`'s restore logic (currently `:4026-4037`):
```js
this.game.players = (state.players || []).map(p => ({
  name: p.name,
  points: p.points || 0,
  hand: p.hand || [],
  stats: {
    streetCred: p.streetCred || 0,
    reputation: p.reputation || 0
  },
  receipts: p.receipts || []
}));
```

Change `ReceiptSystem.resolveTrigger`'s failed-receipt penalty (currently `:1310-1314`):
```js
receipt.status = 'failed';
owner.stats.streetCred -= 1;
owner.stats.reputation -= 1;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/receipt-pool-and-player-model.test.js test/receipt-system-resolve-trigger.test.js test/save-load-and-blockmap.test.js`
Expected: PASS — all assertions match the 2-field shape.

Run: `npm test`
Expected: PASS — 75/75 (no other test references `.stats.community`/`.stats.wisdom`; this was verified project-wide during planning).

- [ ] **Step 5: Commit**

```bash
git add index.html test/receipt-pool-and-player-model.test.js test/receipt-system-resolve-trigger.test.js test/save-load-and-blockmap.test.js
git commit -m "refactor: prune player.stats from 4 fields to streetCred+reputation"
```

---

### Task 2: Repurpose Block Map hotspots onto the surviving stats

**Files:**
- Modify: `index.html` — `triggerHotspot` (`:2581-2597`)

**Interfaces:**
- Consumes: `player.stats.streetCred`/`.reputation` (Task 1).
- Produces: no new interfaces — this is a self-contained UI-glue change (`triggerHotspot` is only reachable via a Block Map click, not called from `Game`/`ReceiptSystem`/etc.), so it has no automated test — matches this repo's existing convention that DOM-triggered `app.*` handlers are manually verified.

- [ ] **Step 1: Make the change**

In `index.html`, change the `BODEGA` and `CHESS_PARK` branches of `triggerHotspot` (currently `:2587-2594`; the `BARBER_SHOP` branch above them, `:2583-2586`, is untouched):
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

- [ ] **Step 2: Verify no syntax regression**

Run: `npm test`
Expected: PASS — 75/75 (the syntax-check step parses `index.html`'s inline script; no test exercises `triggerHotspot` directly).

- [ ] **Step 3: Manually verify in the browser**

Open `index.html` directly (Solo/classic offline mode doesn't need the server), start a local game, open the Block Map, click the Bodega hotspot and confirm the alert reads "...Street Cred +1." and the RPG Stat HUD's `CRED` value increases by 1 (this will only be visible once Task 3 wires the HUD live — if doing tasks out of order, confirm via the Block Map's own reputation readout for the Chess Park case, which already works, `index.html:4090-4091`). Click the Chess Park hotspot and confirm "...Reputation +1." and the Block Map's reputation number increases by 1.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: repurpose Block Map hotspot rewards onto streetCred/reputation"
```

---

### Task 3: Wire the RPG Stat HUD live

**Files:**
- Modify: `index.html` — HUD markup (`:791-798`), `renderGame` (`:2688-2756`)

**Interfaces:**
- Consumes: `player.stats.streetCred`/`.reputation` (Task 1).
- Produces: `app.updateStatHud()` — no return value, called once per `renderGame()`. No later task calls this directly, but Tasks 4-6 add their own UI elements inside the same `renderGame()` function, right after this call.

- [ ] **Step 1: Drop the dead HUD tiles**

In `index.html`, change the RPG Stat HUD markup (currently `:791-798`):
```html
<div class="panel">
  <h3 style="margin-top:0; font-family:'Press Start 2P', monospace; font-size:10px; color:#339488;">RPG STAT HUD</h3>
  <div class="rpg-hud-grid">
    <div class="hud-item"><span class="hud-label">CRED:</span> <span id="hudCred" class="hud-val">0</span></div>
    <div class="hud-item"><span class="hud-label">REP:</span> <span id="hudRep" class="hud-val">0</span></div>
  </div>
</div>
```

- [ ] **Step 2: Wire it live**

Add a new method anywhere in the `app` object (e.g. right after `renderGame`, before `renderHand`, currently between `:2756` and `:2758`):
```js
updateStatHud() {
  const me = this.game.players[this.humanIndex];
  const credEl = document.getElementById('hudCred');
  const repEl = document.getElementById('hudRep');
  if (credEl) credEl.textContent = me ? me.stats.streetCred : 0;
  if (repEl) repEl.textContent = me ? me.stats.reputation : 0;
},
```

Call it from the end of `renderGame` (currently `:2754-2756`):
```js
    this.renderHand();
    this.renderScoreboard();
    this.updateStatHud();
  },
```

- [ ] **Step 3: Verify no syntax regression**

Run: `npm test`
Expected: PASS — 75/75. `updateStatHud` touches `document.getElementById`, so it's not unit-testable via `test/helpers/load-app.js`'s DOM-free `vm` context (calling `renderGame()` or `updateStatHud()` there would throw) — this matches the existing convention that DOM-rendering methods get manual verification only.

- [ ] **Step 4: Manually verify in the browser**

Open `index.html`, start a local game. Confirm the RPG Stat HUD shows only two tiles (`CRED`, `REP`), both starting at `0`. Win a round or trigger a Block Map hotspot bonus and confirm the HUD updates to reflect the new value without a page reload.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: wire the RPG Stat HUD to live streetCred/reputation values"
```

---

### Task 4: Surface Veto & Double-Down as judge-only buttons

**Files:**
- Modify: `index.html` — black-card panel markup (`:756-766`), `renderGame` (grows past Task 3's version), `app.ogVeto`/`app.ogDoubleDown` (`:3947-3960`), dev-console markup (`:825-826`)
- Test: `test/og-powers.test.js`

**Interfaces:**
- Consumes: `Game.triggerVeto()`/`Game.triggerDoubleDown()` (unchanged, already implemented and tested), `app.isJudge()` (unchanged, DOM-free — `index.html:2862-2864`).
- Produces: `app.ogVeto()`/`app.ogDoubleDown()` keep their existing names/no-argument signatures; their *behavior* gains a judge-only guard that later tasks don't depend on.

- [ ] **Step 1: Write the failing tests**

Add to `test/og-powers.test.js` (after the existing 2 tests; extend the `require`d `loadGameModule()` destructure per-test as the existing tests already do — no shared import changes needed):
```js
test('O.G. Powers: ogVeto is a no-op for a non-judge player', () => {
  const { Game, app } = loadGameModule();
  app.game = new Game();
  app.game.addPlayer('Judge');
  app.game.addPlayer('Alice');
  app.humanIndex = 1;
  app.game.judgeIndex = 0;
  app.game.currentBlack = { prompt: 'Original Card', hasDice: false };

  app.ogVeto();

  assert.equal(app.game.vetoUsed, false);
  assert.equal(app.game.currentBlack.prompt, 'Original Card');
});

test('O.G. Powers: ogDoubleDown is a no-op for a non-judge player', () => {
  const { Game, app } = loadGameModule();
  app.game = new Game();
  app.game.addPlayer('Judge');
  app.game.addPlayer('Alice');
  app.humanIndex = 1;
  app.game.judgeIndex = 0;

  app.ogDoubleDown();

  assert.equal(app.game.doubleDownActive, false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/og-powers.test.js`
Expected: FAIL — `app.ogVeto()`/`app.ogDoubleDown()` currently have no judge check, so they succeed regardless of `humanIndex`, leaving `vetoUsed`/`doubleDownActive` `true` instead of the expected `false`.

- [ ] **Step 3: Add the judge-only guard**

In `index.html`, change `app.ogVeto()`/`app.ogDoubleDown()` (currently `:3947-3960`):
```js
ogVeto() {
  if (!this.isJudge()) return;
  if (!this.game.triggerVeto()) {
    alert('Veto unavailable or already used.');
  } else {
    this.renderGame();
  }
},
ogDoubleDown() {
  if (!this.isJudge()) return;
  if (!this.game.triggerDoubleDown()) {
    alert('Double-Down already active.');
  } else {
    alert('Double-Down active. Next win = +2 points.');
  }
},
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/og-powers.test.js`
Expected: PASS — both new tests green; the guard returns before `triggerVeto()`/`triggerDoubleDown()`/`renderGame()`/`alert()` ever run, so no DOM/alert call happens in the non-judge path and the test stays DOM-free.

Run: `npm test`
Expected: PASS — 75/75 (the 2 pre-existing `og-powers.test.js` tests call `game.triggerVeto()`/`game.triggerDoubleDown()` directly, not `app.ogVeto()`/`app.ogDoubleDown()`, so they're unaffected by this guard).

- [ ] **Step 5: Move the buttons into the play UI**

In `index.html`, add two buttons to the black-card column, right after the `weatherAlert` div (currently `:765`, inside the `<div style="flex: 0 0 180px; ...">` block that ends at `:766`):
```html
              <div id="weatherAlert" class="weather-alert" style="opacity:0;"></div>
              <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; width:100%;">
                <button id="vetoBtn" onclick="app.ogVeto()" style="display:none; font-size:8px;">VETO (O.G. POWER)</button>
                <button id="doubleDownBtn" onclick="app.ogDoubleDown()" style="display:none; font-size:8px;">DOUBLE DOWN (O.G. POWER)</button>
              </div>
            </div>
```
(Only the new `<div>` block is inserted; the outer `</div>` that was already there at `:766` now closes after it, as shown.)

- [ ] **Step 6: Toggle button visibility from `renderGame`**

Add to the end of `renderGame` (right after Task 3's `this.updateStatHud();` line):
```js
    const vetoBtn = document.getElementById('vetoBtn');
    if (vetoBtn) vetoBtn.style.display = (this.isJudge() && !this.game.vetoUsed) ? 'inline-block' : 'none';
    const ddBtn = document.getElementById('doubleDownBtn');
    if (ddBtn) ddBtn.style.display = (this.isJudge() && !this.game.doubleDownActive) ? 'inline-block' : 'none';
  },
```

- [ ] **Step 7: Remove the dev-console Veto/Double-Down buttons**

In `index.html`, remove these two lines from the dev-console `<div class="dev-row">` (currently `:825-826`):
```html
            <button class="secondary" onclick="app.ogVeto()" style="font-size:8px;">O.G. VETO</button>
            <button class="secondary" onclick="app.ogDoubleDown()" style="font-size:8px;">DOUBLE-DOWN</button>
```
The `<select id="weatherSelect">` on the next line (`:827-833`) stays — it remains a dev-only tool per Global Constraints.

- [ ] **Step 8: Run tests, then manually verify in the browser**

Run: `npm test`
Expected: PASS — 75/75.

Open `index.html`, start a local game with 3+ players. Confirm the VETO and DOUBLE DOWN buttons are visible only when you're the judge, and disappear (a) if you're not the judge this round, and (b) after using either once (each is one-shot per game — `vetoUsed` never resets, matching existing `Game.triggerVeto` behavior). Confirm clicking VETO redraws the black card, and clicking DOUBLE DOWN shows the confirmation alert.

- [ ] **Step 9: Commit**

```bash
git add index.html test/og-powers.test.js
git commit -m "feat: surface Veto and Double-Down as judge-only play buttons"
```

---

### Task 5: Surface betting as a real HIGH/LOW prompt

**Files:**
- Modify: `index.html` — black-card panel markup (grows past Task 4's version), `renderGame` (grows past Task 4's version), `app.placeBetFromUI` (`:4048-4054`), dev-console markup (`:907-908`)

**Interfaces:**
- Consumes: `Game.placeBet(playerName, pick)` (unchanged, already implemented and tested — `index.html:1258-1260`, delegates to `CornerHustleBetting.placeBet`).
- Produces: `app.placeBetFromUI(pick)` — new required `pick` parameter (`'high'`|`'low'`), replacing the old zero-argument, text-input-reading version. No later task calls this.

This task has no new automated test: the underlying `Game.placeBet`/`CornerHustleBetting.placeBet` logic doesn't change at all (already covered by `test/corner-hustle-betting.test.js` and `test/weather-environmental-checks.test.js`), and `app.placeBetFromUI` itself touches `document`/`alert`, which is untestable in `test/helpers/load-app.js`'s DOM-free `vm` context — matching this repo's existing convention for UI-glue methods (e.g. the current `resolveReceiptFromUI`/`setWeather` have no tests either).

- [ ] **Step 1: Rewrite `placeBetFromUI` to take an explicit pick**

In `index.html`, change `app.placeBetFromUI` (currently `:4048-4054`), fixing the existing bug where the UI always bet `'high'` regardless of the (unused) text input:
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

- [ ] **Step 2: Add the real bet prompt to the play UI**

In `index.html`, add a new block to the black-card column, right after the Veto/Double-Down buttons added in Task 4:
```html
              <div id="betPrompt" style="display:none; margin-top:8px; text-align:center;">
                <div id="betCostLabel" style="font-size:8px; color:#a0aac2; margin-bottom:4px;"></div>
                <button onclick="app.placeBetFromUI('high')" style="font-size:8px;">BET HIGH</button>
                <button onclick="app.placeBetFromUI('low')" style="font-size:8px;">BET LOW</button>
              </div>
```

- [ ] **Step 3: Show/hide the prompt and set its cost label from `renderGame`**

Add to the end of `renderGame` (right after Task 4's Veto/Double-Down visibility block):
```js
    const betPrompt = document.getElementById('betPrompt');
    if (betPrompt) {
      const me = this.game.players[this.humanIndex];
      const alreadyBet = me && this.game.bets && Object.prototype.hasOwnProperty.call(this.game.bets, me.name);
      const canBet = !!this.game.currentBlack?.hasDice && !alreadyBet;
      betPrompt.style.display = canBet ? 'block' : 'none';
      if (canBet) {
        const cost = this.game.weatherMode === 'NEON_FLICKER' ? 2 : 1;
        const label = document.getElementById('betCostLabel');
        if (label) label.textContent = `Bet ${cost} Street Cred`;
      }
    }
  },
```

- [ ] **Step 4: Remove the dev-console bet input/button**

In `index.html`, remove this `<div class="dev-row">` block (currently `:906-909`):
```html
          <div class="dev-row">
            <input id="betInput" type="text" placeholder="Bet target name" style="width:120px; display:inline-block; font-size:11px;"/>
            <button class="secondary" onclick="app.placeBetFromUI()" style="font-size:8px;">PLACE BET</button>
          </div>
```

- [ ] **Step 5: Run tests, then manually verify in the browser**

Run: `npm test`
Expected: PASS — 75/75 (unaffected — no test exercises `app.placeBetFromUI` or the removed dev-console input).

Open `index.html`, start a local game, play rounds until a dice black card appears (`hasDice`, ~35% of rounds per `Game.nextBlack`). Confirm the BET HIGH/BET LOW prompt appears with the correct Street Cred cost shown (1 normally, 2 under NEON_FLICKER weather), that clicking either places the bet and the prompt disappears for the rest of that round, and that it doesn't reappear if you've already bet this round.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: surface betting as a real HIGH/LOW prompt, fix hardcoded-high bug"
```

---

### Task 6: Surface alliance proposals with a real player-picker dropdown

**Files:**
- Modify: `index.html` — hand/submission panel markup (`:768-782`), `renderGame` (grows past Task 5's version), `app.proposeAllianceFromUI` (`:4056-4063`), dev-console markup (`:910-913`)

**Interfaces:**
- Consumes: `AllianceSystem.proposeAlliance(game, proposer, target)` (unchanged, already implemented and tested — `index.html:1338-1344`; takes `proposer`/`target` as **name strings**, confirmed against `resolveRound`'s `winner.name === proposer` comparison at `index.html:1349`).
- Produces: `app.proposeAllianceFromUI()` — same zero-argument signature, now reads a `<select>` instead of a text input.

Like Task 5, this task has no new automated test — `AllianceSystem`'s logic is unchanged (already covered by `test/block-alliance-system.test.js`), and the UI glue touches `document`, which is untestable in the DOM-free harness.

- [ ] **Step 1: Rewrite `proposeAllianceFromUI` to read the dropdown**

In `index.html`, change `app.proposeAllianceFromUI` (currently `:4056-4063`):
```js
proposeAllianceFromUI() {
  const me = this.game.players[this.humanIndex];
  const targetName = document.getElementById('allianceTargetSelect')?.value;
  if (!me || !targetName) return;
  AllianceSystem.proposeAlliance(this.game, me.name, targetName);
  this.renderGame();
},
```

- [ ] **Step 2: Add the real alliance-proposal prompt to the play UI**

In `index.html`, add a new block to the hand/submission column, right before the existing `save-bar` submit/pass buttons (currently `:778`, inside the `<div style="flex: 1; ...">` block):
```html
              <div id="alliancePrompt" style="display:none; margin-bottom:8px;">
                <select id="allianceTargetSelect" style="width:auto; display:inline-block; font-size:10px;"></select>
                <button onclick="app.proposeAllianceFromUI()" style="font-size:8px;">PROPOSE COOKOUT ALLIANCE</button>
              </div>
              
              <div class="save-bar" style="margin-top:12px; display:flex; gap:8px;">
```

- [ ] **Step 3: Populate the dropdown and toggle visibility from `renderGame`**

Add to the end of `renderGame` (right after Task 5's bet-prompt block):
```js
    const alliancePrompt = document.getElementById('alliancePrompt');
    if (alliancePrompt) {
      const me = this.game.players[this.humanIndex];
      const judge = this.game.players[this.game.judgeIndex % this.game.players.length];
      const eligible = me ? this.game.players.filter(p => p !== me && p !== judge) : [];
      const showPrompt = !this.game.currentAlliance && eligible.length > 0;
      alliancePrompt.style.display = showPrompt ? 'block' : 'none';
      if (showPrompt) {
        const select = document.getElementById('allianceTargetSelect');
        if (select) {
          select.innerHTML = eligible.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
        }
      }
    }
  },
```

- [ ] **Step 4: Remove the dev-console alliance input/button**

In `index.html`, remove the alliance input/button from this `<div class="dev-row">` (currently `:910-913`) — keep the `RECEIPTS` button (`app.resolveReceiptFromUI`) as-is, only the alliance input and its button are removed:
```html
          <div class="dev-row">
            <input id="allianceInput" type="text" placeholder="Alliance target" style="width:120px; display:inline-block; font-size:11px;"/>
            <button class="secondary" onclick="app.proposeAllianceFromUI()" style="font-size:8px;">ALLIANCE</button>
            <button class="secondary" onclick="app.resolveReceiptFromUI()" style="font-size:8px;">RECEIPTS</button>
          </div>
```
becomes:
```html
          <div class="dev-row">
            <button class="secondary" onclick="app.resolveReceiptFromUI()" style="font-size:8px;">RECEIPTS</button>
          </div>
```

- [ ] **Step 5: Run tests, then manually verify in the browser**

Run: `npm test`
Expected: PASS — 75/75.

Open `index.html`, start a local game with 3+ players. Confirm the "PROPOSE COOKOUT ALLIANCE" prompt shows a dropdown listing every player except you and the current judge, that proposing sets an active alliance (visible in the Receipts tab per existing `renderReceiptsTab`, `index.html:2817-2826`), and that the prompt disappears while an alliance is active, reappearing once it resolves (coop success or betrayal).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: surface alliance proposals with a real player-picker dropdown"
```

---

### Task 7: Automatic per-round weather shift

**Files:**
- Modify: `index.html` — `Game.nextBlack` (`:1205-1225`)
- Test: `test/weather-environmental-checks.test.js`

**Interfaces:**
- Consumes: nothing new — `this.weatherMode` already exists on `Game`.
- Produces: `Game.nextBlack()` keeps its exact existing signature/return (`undefined`, mutates `this.currentBlack`/`this.diceEffect`/`this.submissions`/`this.selected`); it now also probabilistically mutates `this.weatherMode` as a side effect, which Tasks 5's bet-cost label and existing `POLICE_SIRENS`/`NEON_FLICKER` mechanics already react to.

This plan hardcodes the mode list as a literal array rather than referencing the `WEATHER_MODES` object from `src/pixel_engine/weather-effects-system.js`, matching this codebase's existing convention: the dev-console weather `<select>` (`index.html:828-832`) and the existing test `'Weather: mode switching preserves valid mode contract'` (`test/save-load-and-blockmap.test.js:129-138`) both already hardcode the same 5-string list rather than importing `WEATHER_MODES`. `WEATHER_MODES` is also not loaded by `test/helpers/load-app.js` (only `cards.js` and `story-engine.js` are injected into its `vm` context), so referencing it directly would require extending that test harness — hardcoding avoids that entirely and matches precedent.

- [ ] **Step 1: Write the failing tests**

Add to `test/weather-environmental-checks.test.js`:
```js
test('Weather Environmental Checks: nextBlack always shifts to a valid weather mode', () => {
  const { Game } = loadGameModule();
  const validModes = ['CLEAR', 'RAIN', 'STEAM_VENT', 'POLICE_SIRENS', 'NEON_FLICKER'];
  const game = new Game();
  game.addPlayer('Alice');
  game.addPlayer('Bob');

  for (let i = 0; i < 50; i++) {
    game.nextBlack();
    assert.ok(validModes.includes(game.weatherMode), `weatherMode "${game.weatherMode}" must be a valid mode`);
  }
});

test('Weather Environmental Checks: nextBlack never "shifts" to the same weather mode it started with', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  game.addPlayer('Bob');
  game.weatherMode = 'CLEAR';

  let sawAnyShift = false;
  for (let i = 0; i < 50; i++) {
    const before = game.weatherMode;
    game.nextBlack();
    if (game.weatherMode !== before) sawAnyShift = true;
  }
  assert.ok(sawAnyShift, 'expected at least one weather shift across 50 rounds at a 20% chance per round');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/weather-environmental-checks.test.js`
Expected: FAIL — `game.weatherMode` never changes today (`nextBlack` has no weather logic at all), so the second test's `sawAnyShift` stays `false`. (The first test would already pass today since `'CLEAR'` is a valid mode and it never changes — that's expected; it becomes a meaningful regression guard once Step 3 lands.)

- [ ] **Step 3: Implement the weather shift**

In `index.html`, change the top of `Game.nextBlack` (currently `:1205-1206`):
```js
  nextBlack() {
    if (Math.random() < 0.2) {
      const modes = ['CLEAR', 'RAIN', 'STEAM_VENT', 'POLICE_SIRENS', 'NEON_FLICKER'].filter(m => m !== this.weatherMode);
      this.weatherMode = modes[Math.floor(Math.random() * modes.length)];
    }
    const trigger = ReceiptSystem.maybeTriggerReceipt(this);
```
(Everything from `const trigger = ...` onward is unchanged — this only adds the new block before it.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/weather-environmental-checks.test.js`
Expected: PASS — both new tests green (the second test has a `(1 - 0.2)^50 ≈ 0.00001` chance of flaking; acceptable given the existing test suite already uses similar many-iteration probabilistic checks, e.g. `test/corner-hustle-betting.test.js`'s roll-based tests).

Run: `npm test`
Expected: PASS — 75/75 (existing weather tests that set `game.weatherMode` directly and don't call `nextBlack()` afterward, e.g. `test/corner-hustle-betting.test.js`, `test/og-powers.test.js`, are unaffected since they never call `nextBlack()` after setting weather).

- [ ] **Step 5: Manually verify in the browser**

Open `index.html`, start a local game, play several rounds and confirm the weather notice (`index.html:2723-2728`, "Weather: X") occasionally changes on its own between rounds without touching the dev-console dropdown.

- [ ] **Step 6: Commit**

```bash
git add index.html test/weather-environmental-checks.test.js
git commit -m "feat: shift weather automatically each round instead of via manual control"
```

---

### Task 8: Origin stat bonuses

**Files:**
- Modify: `src/pixel_engine/block-map-navigation.js` — `CHARACTER_ORIGINS` (`:7-80`)
- Modify: `index.html` — `startLocalGame` (`:2038-2061`), the `'joined'` WebSocket handler (`:3510-3528`), the `'room_players'` WebSocket handler (`:3530-3548`)
- Test: `test/block-map-navigation.test.js`

**Interfaces:**
- Consumes: `player.stats` (Task 1's 2-field shape).
- Produces: each `CHARACTER_ORIGINS[key]` object gains `flavor: string` and `startingStats: { streetCred: number, reputation: number }`. No later task in this plan consumes these directly, but this is the last task, so nothing else needs to.

- [ ] **Step 1: Write the failing test**

Add to `test/block-map-navigation.test.js` (after the existing "8 Character Origins are defined" test):
```js
test('Block Map Navigation: every origin has a flavor line and a starting stat bonus', () => {
  const expected = {
    BARBER: { streetCred: 0, reputation: 2 },
    STREET_SCHOLAR: { streetCred: 1, reputation: 0 },
    LOCAL_LEGEND: { streetCred: 0, reputation: 2 },
    CORNER_MERCHANT: { streetCred: 2, reputation: 0 },
    COMMUNITY_ORGANIZER: { streetCred: 0, reputation: 2 },
    UNDERGROUND_DJ: { streetCred: 1, reputation: 1 },
    BLOCK_ARCHITECT: { streetCred: 1, reputation: -1 },
    HUSTLE_VETERAN: { streetCred: 2, reputation: 1 }
  };
  for (const [key, bonus] of Object.entries(expected)) {
    const origin = CHARACTER_ORIGINS[key];
    assert.ok(origin, `expected origin ${key} to exist`);
    assert.equal(typeof origin.flavor, 'string');
    assert.ok(origin.flavor.length > 0, `expected ${key} to have non-empty flavor text`);
    assert.deepEqual(origin.startingStats, bonus, `expected ${key} startingStats to match design spec`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/block-map-navigation.test.js`
Expected: FAIL — `origin.flavor` is `undefined`, `origin.startingStats` is `undefined`.

- [ ] **Step 3: Add the fields to `CHARACTER_ORIGINS`**

In `src/pixel_engine/block-map-navigation.js`, add `flavor` and `startingStats` to each of the 8 entries (only these two new fields are added to each object — every existing field, cosmetic values, and the object's overall shape/key order stay exactly as they are today):
```js
const CHARACTER_ORIGINS = {
  BARBER: {
    id: 'BARBER',
    name: 'Master Barber',
    hairColor: '#3d2218',
    skinColor: '#26120b',
    outfitColor: '#d9382e',
    apronColor: '#f4f7ff',
    pantsColor: '#274f80',
    flavor: "Everybody's business runs through your chair. You hear it first, you know it best.",
    startingStats: { streetCred: 0, reputation: 2 }
  },
  STREET_SCHOLAR: {
    id: 'STREET_SCHOLAR',
    name: 'Street Scholar',
    hairColor: '#140a07',
    skinColor: '#522717',
    outfitColor: '#393e4d',
    apronColor: null,
    pantsColor: '#181920',
    flavor: "Books over corners, but you still know every angle the block's got.",
    startingStats: { streetCred: 1, reputation: 0 }
  },
  LOCAL_LEGEND: {
    id: 'LOCAL_LEGEND',
    name: 'Local Legend',
    hairColor: '#3d2218',
    skinColor: '#3b1c11',
    outfitColor: '#6b341d',
    apronColor: null,
    pantsColor: '#101116',
    flavor: "They wrote songs about you. Reputation walks in the room before you do.",
    startingStats: { streetCred: 0, reputation: 2 }
  },
  CORNER_MERCHANT: {
    id: 'CORNER_MERCHANT',
    name: 'Corner Merchant',
    hairColor: '#26120b',
    skinColor: '#be6436',
    outfitColor: '#9c5c1d',
    apronColor: null,
    pantsColor: '#474d5e',
    flavor: "Bodega counter's your throne. You see everything, you say nothing — for now.",
    startingStats: { streetCred: 2, reputation: 0 }
  },
  COMMUNITY_ORGANIZER: {
    id: 'COMMUNITY_ORGANIZER',
    name: 'Community Organizer',
    hairColor: '#140a07',
    skinColor: '#854224',
    outfitColor: '#366ba6',
    apronColor: null,
    pantsColor: '#22252e',
    flavor: "You rally the block before the block even knows it needs rallying.",
    startingStats: { streetCred: 0, reputation: 2 }
  },
  UNDERGROUND_DJ: {
    id: 'UNDERGROUND_DJ',
    name: 'Underground DJ',
    hairColor: '#3d2218',
    skinColor: '#a1522c',
    outfitColor: '#521c6e',
    apronColor: null,
    pantsColor: '#101116',
    flavor: "You keep the party alive till sunrise. Nobody forgets who kept it moving.",
    startingStats: { streetCred: 1, reputation: 1 }
  },
  BLOCK_ARCHITECT: {
    id: 'BLOCK_ARCHITECT',
    name: 'Block Architect',
    hairColor: '#140a07',
    skinColor: '#3b1c11',
    outfitColor: '#ffcd68',
    apronColor: null,
    pantsColor: '#274f80',
    flavor: "Still earning your stripes — building trust takes longer than building blueprints.",
    startingStats: { streetCred: 1, reputation: -1 }
  },
  HUSTLE_VETERAN: {
    id: 'HUSTLE_VETERAN',
    name: 'Hustle Veteran',
    hairColor: '#3d2218',
    skinColor: '#d97843',
    outfitColor: '#174540',
    apronColor: null,
    pantsColor: '#174540',
    flavor: "Old scars, older respect. You've been out here longer than most been alive.",
    startingStats: { streetCred: 2, reputation: 1 }
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/block-map-navigation.test.js`
Expected: PASS.

Run: `npm test`
Expected: PASS — 75/75.

- [ ] **Step 5: Apply the bonus in classic offline mode**

In `index.html`, `startLocalGame()` (currently `:2038-2061`), apply the bonus immediately after `players[0].origin` is set (currently `:2057`):
```js
    this.humanIndex = 0;
    this.game.players[0].origin = originKey;
    const origin = CHARACTER_ORIGINS[originKey] || CHARACTER_ORIGINS.BARBER;
    this.game.players[0].stats.streetCred += origin.startingStats.streetCred;
    this.game.players[0].stats.reputation += origin.startingStats.reputation;
    const origins = Object.keys(CHARACTER_ORIGINS);
    for (let i = 1; i < count; i++) {
      this.game.players[i].origin = origins[i % origins.length];
    }
```
(Bot players, the `for` loop right below, are unaffected — they keep the flat `{0, 0}` default from `Game.addPlayer`.)

- [ ] **Step 6: Apply the bonus in online mode**

In `index.html`, the `'joined'` handler (currently `:3510-3528`) sets `this.humanIndex` at `:3516`. Apply the bonus right after that line:
```js
    if (msg.type === 'joined') {
      this.game.players = msg.players.map(p => ({
        name: p.name, hand: [], points: p.points || 0,
        stats: { streetCred: 0, reputation: 0 }, receipts: [],
        ready: !!p.ready
      }));
      this.humanIndex = this.game.players.findIndex(p => p.name === msg.playerName);
      if (this.humanIndex !== -1) {
        const originKey = document.getElementById('characterOriginSelect').value;
        const origin = CHARACTER_ORIGINS[originKey] || CHARACTER_ORIGINS.BARBER;
        this.game.players[this.humanIndex].stats.streetCred += origin.startingStats.streetCred;
        this.game.players[this.humanIndex].stats.reputation += origin.startingStats.reputation;
      }
      this.game.pointsToWin = msg.pointsToWin || 7;
```

Apply the same pattern to the `'room_players'` handler (currently `:3530-3548`), which sets `this.humanIndex` via a different lookup (falls back to `0` if not found, currently around `:3537-3538`):
```js
    if (msg.type === 'room_players') {
      this.game.players = msg.players.map(p => ({
        name: p.name, hand: [], points: p.points || 0,
        stats: { streetCred: 0, reputation: 0 }, receipts: [],
        ready: !!p.ready
      }));
      const myName = document.getElementById('joinName').value.trim() || document.getElementById('hostName').value.trim() || 'Player';
      this.humanIndex = this.game.players.findIndex(p => p.name === myName);
      if (this.humanIndex === -1) this.humanIndex = 0;
      const originKey = document.getElementById('characterOriginSelect').value;
      const origin = CHARACTER_ORIGINS[originKey] || CHARACTER_ORIGINS.BARBER;
      this.game.players[this.humanIndex].stats.streetCred += origin.startingStats.streetCred;
      this.game.players[this.humanIndex].stats.reputation += origin.startingStats.reputation;
```

- [ ] **Step 7: Run tests, then manually verify in the browser**

Run: `npm test`
Expected: PASS — 75/75 (`startLocalGame`, the `'joined'` handler, and the `'room_players'` handler all touch `document`/WebSocket messages, so none of this step is unit-testable via the DOM-free harness — matches existing convention).

Open `index.html`, start a local game selecting the CORNER_MERCHANT origin (streetCred +2). Confirm the RPG Stat HUD (Task 3) shows `CRED: 2` at game start instead of `0`. Repeat with COMMUNITY_ORGANIZER and confirm `REP: 2` at start.

- [ ] **Step 8: Commit**

```bash
git add src/pixel_engine/block-map-navigation.js index.html test/block-map-navigation.test.js
git commit -m "feat: give each origin a flavor line and starting stat bonus"
```
