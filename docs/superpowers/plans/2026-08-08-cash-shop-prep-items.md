# CASH Shop — Mini-Game Prep Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead Main Menu `showBoosterShop()` stub with a real in-game Shop that spends live CASH (`player.stats.streetCred`) on one-time mechanical bonuses for the five sandbox mini-games.

**Architecture:** A `prepItems` counter map is added to every player object, mirroring the lifetime of `stats.streetCred` (resets each new game, never persisted). A single hook in `MiniGameManager.start()` consumes one owned item and flags `params.prepItemBonus = true`; each mini-game's own `init()` applies its fixed, already-real gameplay lever (never a decorative one) when that flag is set. A new `shopModal` in the `#game` screen's RPG Stat HUD panel lets the player spend CASH to buy items. The Main Menu's dead button becomes a real, small "come back once you're playing" redirect instead of throwing.

**Tech Stack:** Plain inline JS in `index.html` (no framework), the existing `MiniGameManager`/`MiniGame` classes in `src/pixel_engine/mini-games/`, `node --test` via the existing VM-sandbox harness (`test/helpers/load-app.js`) and the existing `MockCanvas`-based harness in `test/mini-game-system.test.js`.

## Global Constraints

- CASH (`player.stats.streetCred`) stays exactly as it is today: no new `localStorage` key, no cross-game persistence. `prepItems` must share that same reset-per-game lifetime — it lives on the player object, not in `localStorage`.
- Every prep-item bonus must modify a field the target mini-game's own win/loss logic actually reads. Confirmed real levers only: `witModifier` (`street-dice.js`, added into `rollSum`, compared against `opponentRollSum`), `alertnessRate` (`bodega-run.js`, drives `this.alertness`, loss at `>= 100`), `goodWidth`/`perfectWidth` (`haircut-challenge.js`, compared against cursor distance for PERFECT/GOOD/MISS), `tolerance` (`lockpicking.js`, compared as `diff <= this.tolerance`), `resistance`/`maxResistance` (`negotiation.js`, win at `<= 0`). **Never** wire a bonus to `street-dice.js`'s `dc` field — it is set from `params.dc` but never compared against anything in `finishRoll()`; it is decorative only.
- Each item costs 30 CASH and caps at 3 owned-and-unconsumed per game (enforced at purchase time, not at consumption time).
- The five `gameId` keys, used verbatim everywhere (player object, `MiniGameManager` registry, `SHOP_ITEMS`): `street_dice`, `bodega_run`, `haircut_challenge`, `lockpicking`, `negotiation`.
- Follow the existing codebase's test convention exactly: `test/helpers/load-app.js`'s `loadGameModule()` for anything touching `index.html`'s `app`/`Game`; the `MockCanvas`/`MockCanvasContext` classes already defined at the top of `test/mini-game-system.test.js` for anything touching the mini-game classes directly.

---

### Task 1: `prepItems` data model on every player object

**Files:**
- Modify: `index.html:1631-1639` (`Game.addPlayer`)
- Modify: `index.html:4519-4523` (online `msg.type === 'joined'` player mapping)
- Modify: `index.html:4546-4550` (online `msg.type === 'room_players'` player mapping)
- Test: `test/cash-shop.test.js` (new file)

**Interfaces:**
- Produces: every player object (from `Game.addPlayer(name)` and the two online-mode mapping sites) has `player.prepItems = { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 }`.

- [ ] **Step 1: Write the failing test**

Create `test/cash-shop.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeDocument() {
  const elements = {};
  const makeEl = (id) => ({
    id,
    textContent: '',
    innerHTML: '',
    style: {},
    _classes: new Set(),
    classList: {
      contains(name) { return elements[id]._classes.has(name); },
      add(name) { elements[id]._classes.add(name); },
      remove(name) { elements[id]._classes.delete(name); }
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    appendChild() {}
  });
  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl(id);
      return elements[id];
    },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
}

const PREP_ITEM_DEFAULTS = { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 };

test('CASH Shop: Game.addPlayer gives every player a zeroed prepItems map', () => {
  global.document = fakeDocument();
  try {
    const { Game } = loadGameModule();
    const game = new Game();
    game.addPlayer('Test');
    assert.deepEqual(game.players[0].prepItems, PREP_ITEM_DEFAULTS);
  } finally {
    delete global.document;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/cash-shop.test.js`
Expected: FAIL — `game.players[0].prepItems` is `undefined`, `assert.deepEqual` reports a mismatch against `PREP_ITEM_DEFAULTS`.

- [ ] **Step 3: Implement the minimal change**

In `index.html`, change the `addPlayer` method (currently lines 1631-1639) from:

```js
  addPlayer(name) {
    if (this.players.length >= 12) throw new Error('Max 12 players');
    this.players.push({
      name, hand: [], points: 0,
      stats: { streetCred: 0, reputation: 0 },
      attributes: { str: 0, wit: 0, soul: 0 },
      receipts: []
    });
  }
```

to:

```js
  addPlayer(name) {
    if (this.players.length >= 12) throw new Error('Max 12 players');
    this.players.push({
      name, hand: [], points: 0,
      stats: { streetCred: 0, reputation: 0 },
      attributes: { str: 0, wit: 0, soul: 0 },
      receipts: [],
      prepItems: { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 }
    });
  }
```

Then change both online-mode mapping sites. First, the `msg.type === 'joined'` handler (currently lines 4519-4523):

```js
    if (msg.type === 'joined') {
      this.game.players = msg.players.map(p => ({
        name: p.name, hand: [], points: p.points || 0,
        stats: { streetCred: 0, reputation: 0 }, attributes: { str: 0, wit: 0, soul: 0 }, receipts: [],
        ready: !!p.ready
      }));
```

becomes:

```js
    if (msg.type === 'joined') {
      this.game.players = msg.players.map(p => ({
        name: p.name, hand: [], points: p.points || 0,
        stats: { streetCred: 0, reputation: 0 }, attributes: { str: 0, wit: 0, soul: 0 }, receipts: [],
        prepItems: { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 },
        ready: !!p.ready
      }));
```

Second, the `msg.type === 'room_players'` handler (currently lines 4546-4550):

```js
    if (msg.type === 'room_players') {
      this.game.players = msg.players.map(p => ({
        name: p.name, hand: [], points: p.points || 0,
        stats: { streetCred: 0, reputation: 0 }, attributes: { str: 0, wit: 0, soul: 0 }, receipts: [],
        ready: !!p.ready
      }));
```

becomes:

```js
    if (msg.type === 'room_players') {
      this.game.players = msg.players.map(p => ({
        name: p.name, hand: [], points: p.points || 0,
        stats: { streetCred: 0, reputation: 0 }, attributes: { str: 0, wit: 0, soul: 0 }, receipts: [],
        prepItems: { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 },
        ready: !!p.ready
      }));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/cash-shop.test.js`
Expected: PASS

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `node --test "test/**/*.test.js"`
Expected: all tests pass (129 existing + 1 new = 130).

- [ ] **Step 6: Commit**

```bash
git add index.html test/cash-shop.test.js
git commit -m "feat: add prepItems inventory field to every player object"
```

---

### Task 2: Consumption hook in `MiniGameManager.start()`

**Files:**
- Modify: `src/pixel_engine/mini-games/mini-game-manager.js:41-83` (`start` method)
- Test: `test/mini-game-system.test.js` (extend the existing "Mini-Game Manager" test area)

**Interfaces:**
- Consumes: `player.prepItems[gameId]` (Task 1).
- Produces: `MiniGameManager.start(gameId, params)` merges `prepItemBonus: true` into the `params` object passed to `activeGame.init(params)`, and decrements `app.game.players[app.humanIndex].prepItems[gameId]` by 1, whenever that counter is greater than 0. When `app.game` is falsy, or the player has no game, or the counter is 0/undefined, `params` is passed through completely unchanged (no `prepItemBonus` key at all) — later tasks rely on this exact absence, not `prepItemBonus: false`, to mean "no bonus."

- [ ] **Step 1: Write the failing test**

Add to `test/mini-game-system.test.js`, immediately after the existing `test('Mini-Game Manager: registration and game activation lifecycle', ...)` block (which ends at line 287 with `delete global.app;\n});`):

```js
test('Mini-Game Manager: consumes one owned prep item and flags the bonus', () => {
  const canvas = new MockCanvas();
  const manager = new MiniGameManager(canvas);
  manager.registerGame('street_dice', StreetDice);

  global.app = {
    game: {
      players: [{
        stats: { streetCred: 100, reputation: 5 },
        prepItems: { street_dice: 2, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 }
      }]
    },
    humanIndex: 0,
    storyEngine: { heat: 0, trust: 0, secrets: [] }
  };

  manager.start('street_dice', { stake: 30 });

  assert.equal(global.app.game.players[0].prepItems.street_dice, 1, 'one item should be consumed');
  assert.equal(manager.activeGame.stake, 30, 'unrelated params must still pass through');

  manager.stop();
  delete global.app;
});

test('Mini-Game Manager: does not flag a bonus when no prep item is owned', () => {
  const canvas = new MockCanvas();
  const manager = new MiniGameManager(canvas);
  manager.registerGame('street_dice', StreetDice);

  global.app = {
    game: {
      players: [{
        stats: { streetCred: 100, reputation: 5 },
        prepItems: { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 }
      }]
    },
    humanIndex: 0,
    storyEngine: { heat: 0, trust: 0, secrets: [] }
  };

  manager.start('street_dice', {});

  assert.equal(global.app.game.players[0].prepItems.street_dice, 0, 'nothing to consume, stays at 0');
  assert.equal(manager.activeGame.witModifier >= 0, true);

  manager.stop();
  delete global.app;
});

test('Mini-Game Manager: works with no app.game at all (free-play catalog entry point)', () => {
  const canvas = new MockCanvas();
  const manager = new MiniGameManager(canvas);
  manager.registerGame('street_dice', StreetDice);

  const started = manager.start('street_dice', { stake: 10 });

  assert.equal(started, true, 'must not throw or fail when app.game is undefined');
  assert.equal(manager.activeGame.stake, 10);

  manager.stop();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/mini-game-system.test.js`
Expected: the first two new tests FAIL — `global.app.game.players[0].prepItems.street_dice` stays at its starting value (2, not decremented to 1) because `start()` does not yet read or mutate `prepItems`. The third test passes already (today's code already tolerates a missing `app`/`app.game` via the existing `typeof app !== 'undefined'` guard), which is fine — it locks in that guarantee before the change.

- [ ] **Step 3: Implement the minimal change**

In `src/pixel_engine/mini-games/mini-game-manager.js`, the `start` method currently reads:

```js
  start(gameId, params = {}) {
    if (!this.registry[gameId]) {
      console.warn(`MiniGameManager: Game '${gameId}' is not registered.`);
      return false;
    }

    // Stop any running loop
    this.stop();

    this.gameState = new MiniGameStateClass();
    // Copy active variables from narrative engine and human player
    if (typeof app !== 'undefined') {
      const me = app.game ? app.game.players[app.humanIndex] : null;
      this.gameState.loadFromEngine(app.storyEngine, me);
    }

    const GameClass = this.registry[gameId];
    this.activeGame = new GameClass(this, this.canvas, this.ui.virtualCtx, this.gameState);
    this.activeGame.init(params);
```

Change it to:

```js
  start(gameId, params = {}) {
    if (!this.registry[gameId]) {
      console.warn(`MiniGameManager: Game '${gameId}' is not registered.`);
      return false;
    }

    // Stop any running loop
    this.stop();

    this.gameState = new MiniGameStateClass();
    // Copy active variables from narrative engine and human player
    let me = null;
    if (typeof app !== 'undefined') {
      me = app.game ? app.game.players[app.humanIndex] : null;
      this.gameState.loadFromEngine(app.storyEngine, me);
    }

    // Consume one owned prep item for this specific mini-game, if any
    if (me && me.prepItems && me.prepItems[gameId] > 0) {
      me.prepItems[gameId] -= 1;
      params = { ...params, prepItemBonus: true };
    }

    const GameClass = this.registry[gameId];
    this.activeGame = new GameClass(this, this.canvas, this.ui.virtualCtx, this.gameState);
    this.activeGame.init(params);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/mini-game-system.test.js`
Expected: PASS (all tests in the file, including the three new ones).

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `node --test "test/**/*.test.js"`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pixel_engine/mini-games/mini-game-manager.js test/mini-game-system.test.js
git commit -m "feat: consume one owned prep item per mini-game launch"
```

---

### Task 3: Wire `prepItemBonus` into the five mini-games' real gameplay levers

**Files:**
- Modify: `src/pixel_engine/mini-games/games/street-dice.js:46-53` (`init`)
- Modify: `src/pixel_engine/mini-games/games/bodega-run.js:89-104` (`init`)
- Modify: `src/pixel_engine/mini-games/games/haircut-challenge.js:66-84` (`init`)
- Modify: `src/pixel_engine/mini-games/games/lockpicking.js:73-95` (`init`)
- Modify: `src/pixel_engine/mini-games/games/negotiation.js:83-101` (`init`)
- Test: `test/mini-game-system.test.js` (extend)

**Interfaces:**
- Consumes: `params.prepItemBonus` (Task 2).
- Produces: when `params.prepItemBonus` is `true`, each mini-game applies exactly one additive bonus, after its own difficulty-based defaults:
  - `StreetDice`: `this.witModifier += 3`
  - `BodegaRun`: `this.alertnessRate -= 30`
  - `HaircutChallenge`: `this.goodWidth += 0.06; this.perfectWidth += 0.03;`
  - `Lockpicking`: `this.tolerance += 6`
  - `Negotiation`: `this.resistance -= 20; this.maxResistance -= 20;`
  When `params.prepItemBonus` is absent or falsy, behavior is byte-for-byte identical to today.

- [ ] **Step 1: Write the failing tests**

Add to `test/mini-game-system.test.js`, after the existing `test('Street Dice: WIT modifier mapping and win/loss verification rules', ...)` block:

```js
test('Street Dice: prep item bonus adds +3 to witModifier, only when flagged', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  state.wit = 7;

  const withBonus = new StreetDice(null, canvas, ctx, state);
  withBonus.init({ prepItemBonus: true });
  assert.equal(withBonus.witModifier, 10, 'base WIT (7) + prep item bonus (3)');

  const withoutBonus = new StreetDice(null, canvas, ctx, state);
  withoutBonus.init({});
  assert.equal(withoutBonus.witModifier, 7, 'unchanged when no bonus is flagged');
});
```

Add to `test/mini-game-system.test.js`, in the `'Bodega Run'` test section (near the other `BodegaRun` construction tests):

```js
test('Bodega Run: prep item bonus reduces alertnessRate by 30, only when flagged', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();

  const withBonus = new BodegaRun(null, canvas, ctx, state);
  withBonus.init({ difficulty: 'medium', prepItemBonus: true });
  assert.equal(withBonus.alertnessRate, 50, 'base medium (80) - prep item bonus (30)');

  const withoutBonus = new BodegaRun(null, canvas, ctx, state);
  withoutBonus.init({ difficulty: 'medium' });
  assert.equal(withoutBonus.alertnessRate, 80, 'unchanged when no bonus is flagged');
});
```

Add to `test/mini-game-system.test.js`, in the `'HaircutChallenge'` test section:

```js
test('Haircut Challenge: prep item bonus widens GOOD/PERFECT zones, only when flagged', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();

  const withBonus = new HaircutChallenge(null, canvas, ctx, state);
  withBonus.init({ difficulty: 'medium', prepItemBonus: true });
  assert.ok(Math.abs(withBonus.goodWidth - 0.36) < 1e-9, 'base medium goodWidth (0.3) + 0.06');
  assert.ok(Math.abs(withBonus.perfectWidth - 0.11) < 1e-9, 'base medium perfectWidth (0.08) + 0.03');

  const withoutBonus = new HaircutChallenge(null, canvas, ctx, state);
  withoutBonus.init({ difficulty: 'medium' });
  assert.equal(withoutBonus.goodWidth, 0.3, 'unchanged when no bonus is flagged');
  assert.equal(withoutBonus.perfectWidth, 0.08, 'unchanged when no bonus is flagged');
});
```

Add to `test/mini-game-system.test.js`, in the `'Lockpicking'` test section:

```js
test('Lockpicking: prep item bonus adds 6px tolerance, only when flagged', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();

  const withBonus = new Lockpicking(null, canvas, ctx, state);
  withBonus.init({ difficulty: 'hard', prepItemBonus: true });
  assert.equal(withBonus.tolerance, 16, 'base hard tolerance (10) + prep item bonus (6), STR bonus is 0 here');

  const withoutBonus = new Lockpicking(null, canvas, ctx, state);
  withoutBonus.init({ difficulty: 'hard' });
  assert.equal(withoutBonus.tolerance, 10, 'unchanged when no bonus is flagged');
});
```

Add to `test/mini-game-system.test.js`, in the `'Negotiation'` test section:

```js
test('Negotiation: prep item bonus reduces resistance and maxResistance by 20, only when flagged', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();

  const withBonus = new Negotiation(null, canvas, ctx, state);
  withBonus.init({ difficulty: 'medium', prepItemBonus: true });
  assert.equal(withBonus.resistance, 80, 'base medium resistance (100) - prep item bonus (20)');
  assert.equal(withBonus.maxResistance, 80);

  const withoutBonus = new Negotiation(null, canvas, ctx, state);
  withoutBonus.init({ difficulty: 'medium' });
  assert.equal(withoutBonus.resistance, 100, 'unchanged when no bonus is flagged');
  assert.equal(withoutBonus.maxResistance, 100);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/mini-game-system.test.js`
Expected: the five new "with bonus" assertions FAIL (values equal the unmodified base, since no code reads `prepItemBonus` yet). The "without bonus" assertions already pass.

- [ ] **Step 3: Implement the minimal change in each file**

`street-dice.js` — change:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.dc = params.dc || 12;

    // Retrieve WIT stat from player origin if available
    this.witModifier = (this.gameState && this.gameState.wit) || 0;
  }
```

to:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.dc = params.dc || 12;

    // Retrieve WIT stat from player origin if available
    this.witModifier = (this.gameState && this.gameState.wit) || 0;

    if (params.prepItemBonus) this.witModifier += 3;
  }
```

`bodega-run.js` — change:

```js
  init(params) {
    super.init(params);
    this.difficulty = params.difficulty || 'medium';
    
    // Adjust timing and alertness rate based on difficulty
    if (this.difficulty === 'easy') {
      this.clerkSweepTime = 2000;
      this.alertnessRate = 50;
    } else if (this.difficulty === 'hard') {
      this.clerkSweepTime = 1000;
      this.alertnessRate = 120;
    } else {
      this.clerkSweepTime = 1500;
      this.alertnessRate = 80;
    }
  }
```

to:

```js
  init(params) {
    super.init(params);
    this.difficulty = params.difficulty || 'medium';
    
    // Adjust timing and alertness rate based on difficulty
    if (this.difficulty === 'easy') {
      this.clerkSweepTime = 2000;
      this.alertnessRate = 50;
    } else if (this.difficulty === 'hard') {
      this.clerkSweepTime = 1000;
      this.alertnessRate = 120;
    } else {
      this.clerkSweepTime = 1500;
      this.alertnessRate = 80;
    }

    if (params.prepItemBonus) this.alertnessRate -= 30;
  }
```

`haircut-challenge.js` — change:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'medium';

    // Adjust indicator speed based on difficulty level
    if (this.difficulty === 'easy') {
      this.cursorSpeed = 0.4;
      this.goodWidth = 0.4;
      this.perfectWidth = 0.12;
    } else if (this.difficulty === 'hard') {
      this.cursorSpeed = 0.7;
      this.goodWidth = 0.25;
      this.perfectWidth = 0.06;
    } else {
      this.cursorSpeed = 0.5;
      this.goodWidth = 0.3;
      this.perfectWidth = 0.08;
    }
  }
```

to:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'medium';

    // Adjust indicator speed based on difficulty level
    if (this.difficulty === 'easy') {
      this.cursorSpeed = 0.4;
      this.goodWidth = 0.4;
      this.perfectWidth = 0.12;
    } else if (this.difficulty === 'hard') {
      this.cursorSpeed = 0.7;
      this.goodWidth = 0.25;
      this.perfectWidth = 0.06;
    } else {
      this.cursorSpeed = 0.5;
      this.goodWidth = 0.3;
      this.perfectWidth = 0.08;
    }

    if (params.prepItemBonus) {
      this.goodWidth += 0.06;
      this.perfectWidth += 0.03;
    }
  }
```

`lockpicking.js` — change:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'hard';

    // Scale parameter checks
    if (this.difficulty === 'easy') {
      this.tolerance = 18;
      this.liftSpeed = 90;
      this.durationSeconds = 40;
    } else if (this.difficulty === 'hard') {
      this.tolerance = 10;
      this.liftSpeed = 150;
      this.durationSeconds = 25;
    } else {
      this.tolerance = 14;
      this.liftSpeed = 120;
      this.durationSeconds = 30;
    }
    
    // Apply STR bonus to tolerance
    this.tolerance += Math.floor(((this.gameState && this.gameState.str) || 0) / 2);
```

to:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'hard';

    // Scale parameter checks
    if (this.difficulty === 'easy') {
      this.tolerance = 18;
      this.liftSpeed = 90;
      this.durationSeconds = 40;
    } else if (this.difficulty === 'hard') {
      this.tolerance = 10;
      this.liftSpeed = 150;
      this.durationSeconds = 25;
    } else {
      this.tolerance = 14;
      this.liftSpeed = 120;
      this.durationSeconds = 30;
    }
    
    // Apply STR bonus to tolerance
    this.tolerance += Math.floor(((this.gameState && this.gameState.str) || 0) / 2);

    if (params.prepItemBonus) this.tolerance += 6;
```

(The rest of `init()` below this point is unchanged — only the two lines shown are added.)

`negotiation.js` — change:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'medium';

    if (this.difficulty === 'easy') {
      this.resistance = 80;
      this.maxResistance = 80;
      this.durationSeconds = 50;
    } else if (this.difficulty === 'hard') {
      this.resistance = 120;
      this.maxResistance = 120;
      this.durationSeconds = 30;
    } else {
      this.resistance = 100;
      this.maxResistance = 100;
      this.durationSeconds = 40;
    }
```

to:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'medium';

    if (this.difficulty === 'easy') {
      this.resistance = 80;
      this.maxResistance = 80;
      this.durationSeconds = 50;
    } else if (this.difficulty === 'hard') {
      this.resistance = 120;
      this.maxResistance = 120;
      this.durationSeconds = 30;
    } else {
      this.resistance = 100;
      this.maxResistance = 100;
      this.durationSeconds = 40;
    }

    if (params.prepItemBonus) {
      this.resistance -= 20;
      this.maxResistance -= 20;
    }
```

(The rest of `init()` below this point is unchanged — only the added lines are new.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/mini-game-system.test.js`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `node --test "test/**/*.test.js"`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pixel_engine/mini-games/games/street-dice.js src/pixel_engine/mini-games/games/bodega-run.js src/pixel_engine/mini-games/games/haircut-challenge.js src/pixel_engine/mini-games/games/lockpicking.js src/pixel_engine/mini-games/games/negotiation.js test/mini-game-system.test.js
git commit -m "feat: apply prep item bonus to each mini-game's real difficulty lever"
```

---

### Task 4: Shop item catalog and purchase logic

**Files:**
- Modify: `index.html` (insert `SHOP_ITEMS` constant immediately before `const app = {` at line 2028; insert new methods immediately after `updateStatHud()`, which currently ends at line 3697 with `if (heatEl) heatEl.textContent = useStory ? this.storyEngine.heat : 0;\n  },`)
- Test: `test/cash-shop.test.js` (extend)

**Interfaces:**
- Consumes: `player.prepItems` (Task 1), `player.stats.streetCred` (existing), `app.updateStatHud()` (existing, `index.html:3686-3697`).
- Produces:
  - `SHOP_ITEMS`: a top-level `const` array of `{ gameId, name, desc, cost }`, five entries, in this exact order: `street_dice`, `bodega_run`, `haircut_challenge`, `lockpicking`, `negotiation`. `cost` is `30` for every entry.
  - `app.PREP_ITEM_CAP`: `3`.
  - `app.buyPrepItem(gameId)`: returns `true` on a successful purchase (deducts `cost` from `this.game.players[this.humanIndex].stats.streetCred`, increments `prepItems[gameId]`, calls `this.updateStatHud()`); returns `false` and changes nothing when CASH is insufficient or `prepItems[gameId]` is already at `PREP_ITEM_CAP`.

- [ ] **Step 1: Write the failing test**

Add to `test/cash-shop.test.js`:

```js
test('CASH Shop: buyPrepItem deducts CASH and increments the matching prepItems counter', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 100;

    const result = app.buyPrepItem('street_dice');

    assert.equal(result, true);
    assert.equal(app.game.players[0].stats.streetCred, 70, '100 - 30 cost');
    assert.equal(app.game.players[0].prepItems.street_dice, 1);
  } finally {
    delete global.document;
  }
});

test('CASH Shop: buyPrepItem refuses a purchase without enough CASH', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 10;

    const result = app.buyPrepItem('street_dice');

    assert.equal(result, false);
    assert.equal(app.game.players[0].stats.streetCred, 10, 'CASH must be untouched on a refused purchase');
    assert.equal(app.game.players[0].prepItems.street_dice, 0);
  } finally {
    delete global.document;
  }
});

test('CASH Shop: buyPrepItem refuses a purchase at the owned-item cap', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 1000;
    app.game.players[0].prepItems.street_dice = 3;

    const result = app.buyPrepItem('street_dice');

    assert.equal(result, false);
    assert.equal(app.game.players[0].stats.streetCred, 1000, 'CASH must be untouched on a refused purchase');
    assert.equal(app.game.players[0].prepItems.street_dice, 3, 'must not exceed the cap');
  } finally {
    delete global.document;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/cash-shop.test.js`
Expected: FAIL — `app.buyPrepItem is not a function`.

- [ ] **Step 3: Implement the minimal change**

In `index.html`, insert this immediately before `const app = {` (currently line 2028):

```js
const SHOP_ITEMS = [
  { gameId: 'street_dice', name: 'Loaded Dice', desc: '+3 WIT bonus on your next Street Dice roll.', cost: 30 },
  { gameId: 'bodega_run', name: 'Rubber Soles', desc: 'Alertness builds slower on your next Bodega Run.', cost: 30 },
  { gameId: 'haircut_challenge', name: 'Steady Hand', desc: 'Wider GOOD/PERFECT timing zones on your next Haircut Challenge.', cost: 30 },
  { gameId: 'lockpicking', name: 'Master Pick', desc: '+6px pin alignment tolerance on your next Lockpicking job.', cost: 30 },
  { gameId: 'negotiation', name: 'Insider Info', desc: 'Start your next Negotiation with 20 less resistance to break.', cost: 30 }
];

```

Then, immediately after the `updateStatHud()` method (currently ending at line 3697 with `if (heatEl) heatEl.textContent = useStory ? this.storyEngine.heat : 0;\n  },`), insert this new method:

```js

  PREP_ITEM_CAP: 3,

  buyPrepItem(gameId) {
    const item = SHOP_ITEMS.find(i => i.gameId === gameId);
    if (!item) return false;
    const me = this.game.players[this.humanIndex];
    if (!me) return false;
    if ((me.prepItems[gameId] || 0) >= this.PREP_ITEM_CAP) return false;
    if ((me.stats.streetCred || 0) < item.cost) return false;

    me.stats.streetCred -= item.cost;
    me.prepItems[gameId] = (me.prepItems[gameId] || 0) + 1;
    this.updateStatHud();
    return true;
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/cash-shop.test.js`
Expected: PASS

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `node --test "test/**/*.test.js"`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add index.html test/cash-shop.test.js
git commit -m "feat: add CASH shop item catalog and buyPrepItem purchase logic"
```

---

### Task 5: Shop modal UI in the RPG Stat HUD panel

**Files:**
- Modify: `index.html:1011-1019` (RPG Stat HUD panel markup — add SHOP button)
- Modify: `index.html` (insert `shopModal` markup as a sibling of `accessModal`, which currently starts at line 1054 with `<div id="accessModal" ...`)
- Modify: `index.html` (insert `openShopModal`/`closeShopModal`/`renderShopModal` methods immediately after the `buyPrepItem` method added in Task 4)
- Test: `test/cash-shop.test.js` (extend)

**Interfaces:**
- Consumes: `SHOP_ITEMS`, `app.buyPrepItem(gameId)`, `app.PREP_ITEM_CAP` (Task 4).
- Produces: `app.openShopModal()` (shows `#shopModal`, calls `renderShopModal()`), `app.closeShopModal()` (hides `#shopModal`), `app.renderShopModal()` (rebuilds `#shopItemsList` innerHTML from `SHOP_ITEMS` plus the current player's CASH/`prepItems` state).

- [ ] **Step 1: Write the failing test**

Add to `test/cash-shop.test.js`:

```js
test('CASH Shop: renderShopModal lists every item with live CASH-affordability state', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 20; // below the 30 cost of every item

    app.renderShopModal();

    const html = global.document.getElementById('shopItemsList').innerHTML;
    assert.ok(html.includes('LOADED DICE') || html.includes('Loaded Dice'), 'every item name must render');
    assert.ok(html.includes('RUBBER SOLES') || html.includes('Rubber Soles'));
    assert.ok(html.includes('disabled'), 'BUY buttons must be disabled when CASH is insufficient');
  } finally {
    delete global.document;
  }
});

test('CASH Shop: renderShopModal enables BUY once CASH covers the cost', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 100;

    app.renderShopModal();

    const html = global.document.getElementById('shopItemsList').innerHTML;
    assert.ok(!html.includes('disabled'), 'BUY buttons must be enabled when CASH covers every item');
  } finally {
    delete global.document;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/cash-shop.test.js`
Expected: FAIL — `app.renderShopModal is not a function`.

- [ ] **Step 3: Implement the minimal change**

In `index.html`, change the RPG Stat HUD panel (currently lines 1011-1019):

```html
        <div class="panel">
          <h3 style="margin-top:0; font-family:'Press Start 2P', monospace; font-size:10px; color:#339488;">RPG STAT HUD</h3>
          <div class="rpg-hud-grid">
            <div class="hud-item"><span class="hud-label">TRUST:</span> <span id="hudTrust" class="hud-val">0</span></div>
            <div class="hud-item"><span class="hud-label">HEAT:</span> <span id="hudHeat" class="hud-val">0</span></div>
            <div class="hud-item"><span class="hud-label">REP:</span> <span id="hudRep" class="hud-val">0</span></div>
            <div class="hud-item"><span class="hud-label">CASH:</span> <span id="hudCred" class="hud-val">0</span></div>
          </div>
        </div>
```

to:

```html
        <div class="panel">
          <h3 style="margin-top:0; font-family:'Press Start 2P', monospace; font-size:10px; color:#339488;">RPG STAT HUD</h3>
          <div class="rpg-hud-grid">
            <div class="hud-item"><span class="hud-label">TRUST:</span> <span id="hudTrust" class="hud-val">0</span></div>
            <div class="hud-item"><span class="hud-label">HEAT:</span> <span id="hudHeat" class="hud-val">0</span></div>
            <div class="hud-item"><span class="hud-label">REP:</span> <span id="hudRep" class="hud-val">0</span></div>
            <div class="hud-item"><span class="hud-label">CASH:</span> <span id="hudCred" class="hud-val">0</span></div>
          </div>
          <button class="secondary" style="width:100%; margin-top:8px; font-size:8px;" onclick="app.openShopModal()">SHOP</button>
        </div>
```

Then, in `index.html`, insert this new modal immediately before the `<div id="accessModal" ...` line (currently line 1054):

```html
  <div id="shopModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(16, 17, 22, 0.9); z-index:10000; align-items:center; justify-content:center;">
    <div class="panel" style="width:460px; border:3px solid #ffcd68; background:#101116; padding:16px; text-align:left; box-shadow:0 0 16px rgba(0,0,0,0.8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #2d313d; padding-bottom:6px;">
        <h3 style="margin:0; font-family:'Press Start 2P', monospace; font-size:10px; color:#ffcd68;">STREET SHOP</h3>
        <button class="secondary" onclick="app.closeShopModal()" style="font-size:9px; padding:2px 6px;">X</button>
      </div>
      <p class="muted" style="margin-top:0; font-size:9px;">One-time prep items for your next run at each hustle.</p>
      <div id="shopItemsList" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>
  </div>
```

Then, in `index.html`, insert these three new methods immediately after the `buyPrepItem` method added in Task 4:

```js

  openShopModal() {
    this.renderShopModal();
    const modal = document.getElementById('shopModal');
    if (modal) modal.style.display = 'flex';
    if (this.audioEngine) this.audioEngine.playCardFlip();
  },

  closeShopModal() {
    const modal = document.getElementById('shopModal');
    if (modal) modal.style.display = 'none';
  },

  renderShopModal() {
    const list = document.getElementById('shopItemsList');
    if (!list) return;
    const me = this.game.players[this.humanIndex];
    const cash = me ? (me.stats.streetCred || 0) : 0;

    list.innerHTML = SHOP_ITEMS.map(item => {
      const owned = me && me.prepItems ? (me.prepItems[item.gameId] || 0) : 0;
      const atCap = owned >= this.PREP_ITEM_CAP;
      const canAfford = cash >= item.cost;
      const disabled = atCap || !canAfford;
      return `
        <div style="background:#151821; border:1px solid #2d313d; border-radius:4px; padding:8px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <div style="font-family:'Press Start 2P', monospace; font-size:8px; color:#ffcd68;">${item.name.toUpperCase()}</div>
            <div style="font-size:10px; color:#a0aac2; margin-top:2px;">${item.desc}</div>
            <div style="font-size:9px; color:#6fe8d8; margin-top:2px;">Owned: ${owned}/${this.PREP_ITEM_CAP}</div>
          </div>
          <button onclick="app.buyPrepItem('${item.gameId}'); app.renderShopModal();" ${disabled ? 'disabled' : ''} style="font-size:8px; white-space:nowrap;">BUY $${item.cost}</button>
        </div>
      `;
    }).join('');
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/cash-shop.test.js`
Expected: PASS

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `node --test "test/**/*.test.js"`
Expected: all tests pass.

- [ ] **Step 6: Manual browser verification**

Run `node server/server.js`, open `http://localhost:3001`, and:
- Start a Local game (Play / Create Character → any origin → Play Local).
- In the RPG STAT HUD panel, confirm a `SHOP` button now appears below the CASH readout.
- Click it. Confirm the modal opens showing all five items with their descriptions and current CASH-affordability state.
- Buy an item. Confirm CASH in the modal's context (`#hudCred` in the HUD behind the modal) decreases by 30, and the item's "Owned" count increments in place without closing the modal.
- Buy the same item 2 more times (3 total). Confirm the 4th attempt shows a disabled BUY button.
- Close the modal via the X button. Confirm it closes and the HUD's CASH value reflects the purchases made.
- Confirm the browser console shows zero errors throughout.

- [ ] **Step 7: Commit**

```bash
git add index.html test/cash-shop.test.js
git commit -m "feat: add Street Shop modal UI to the in-game RPG stat HUD"
```

---

### Task 6: Fix the dead Main Menu `showBoosterShop()` button

**Files:**
- Modify: `index.html` (insert `shopUnavailableModal` markup as a sibling of `shopModal`, added in Task 5)
- Modify: `index.html` (insert `showBoosterShop`/`closeShopUnavailableModal` methods immediately after `showLexicon()`, which currently ends at `index.html:2148` with `if (input) input.focus();\n  },`)
- Test: `test/cash-shop.test.js` (extend)

**Interfaces:**
- Consumes: `app.showCharacterCreation()` (existing).
- Produces: `app.showBoosterShop()` — no longer throws; shows `#shopUnavailableModal`. `app.closeShopUnavailableModal()` — hides it.

- [ ] **Step 1: Write the failing test**

Add to `test/cash-shop.test.js`:

```js
test('CASH Shop: the Main Menu showBoosterShop() no longer throws, and opens an explainer instead', () => {
  global.document = fakeDocument();
  try {
    const { app } = loadGameModule();

    assert.doesNotThrow(() => app.showBoosterShop());

    const modal = global.document.getElementById('shopUnavailableModal');
    assert.equal(modal.style.display, 'flex');
  } finally {
    delete global.document;
  }
});

test('CASH Shop: closeShopUnavailableModal hides the explainer', () => {
  global.document = fakeDocument();
  try {
    const { app } = loadGameModule();

    app.showBoosterShop();
    app.closeShopUnavailableModal();

    const modal = global.document.getElementById('shopUnavailableModal');
    assert.equal(modal.style.display, 'none');
  } finally {
    delete global.document;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/cash-shop.test.js`
Expected: FAIL — `app.showBoosterShop is not a function` (it is currently referenced only from the Main Menu button's `onclick`, never defined).

- [ ] **Step 3: Implement the minimal change**

In `index.html`, insert this new modal immediately after the `shopModal` markup added in Task 5 (immediately after its closing `</div>` and before the blank line preceding `accessModal`):

```html
  <div id="shopUnavailableModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(16, 17, 22, 0.9); z-index:10000; align-items:center; justify-content:center;">
    <div class="panel" style="width:360px; border:3px solid #ffcd68; background:#101116; padding:16px; text-align:center; box-shadow:0 0 16px rgba(0,0,0,0.8);">
      <h3 style="margin-top:0; font-family:'Press Start 2P', monospace; font-size:10px; color:#ffcd68;">SHOP LOCKED</h3>
      <p style="font-family:'JetBrains Mono', monospace; font-size:11px; color:#cbd5ed; margin-bottom:16px;">The Shop opens once you're on a run. Start a Journey to earn CASH and spend it there.</p>
      <button onclick="app.closeShopUnavailableModal(); app.showCharacterCreation();" style="width:100%; margin-bottom:8px; font-family:'Press Start 2P', monospace; font-size:8px;">PLAY / CREATE CHARACTER</button>
      <button class="secondary" onclick="app.closeShopUnavailableModal()" style="width:100%; font-family:'Press Start 2P', monospace; font-size:8px;">CLOSE</button>
    </div>
  </div>
```

Then, in `index.html`, change `showLexicon()` (currently ending at line 2148):

```js
  showLexicon() {
    this.showMainMenu();
    const input = document.getElementById('lexiconSearchBox');
    if (input) input.focus();
  },
```

to add the two new methods immediately after it:

```js
  showLexicon() {
    this.showMainMenu();
    const input = document.getElementById('lexiconSearchBox');
    if (input) input.focus();
  },

  showBoosterShop() {
    const modal = document.getElementById('shopUnavailableModal');
    if (modal) modal.style.display = 'flex';
  },

  closeShopUnavailableModal() {
    const modal = document.getElementById('shopUnavailableModal');
    if (modal) modal.style.display = 'none';
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/cash-shop.test.js`
Expected: PASS

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `node --test "test/**/*.test.js"`
Expected: all tests pass.

- [ ] **Step 6: Manual browser verification**

Run `node server/server.js`, open `http://localhost:3001`, and:
- From the Main Menu, click `SHOP`. Confirm it no longer throws and instead shows the "SHOP LOCKED" explainer.
- Click `PLAY / CREATE CHARACTER` inside that modal. Confirm it closes the explainer and opens the character creation wizard.
- Reopen the Main Menu, click `SHOP` again, then click `CLOSE`. Confirm it closes without navigating anywhere.
- Confirm the browser console shows zero errors throughout.

- [ ] **Step 7: Commit**

```bash
git add index.html test/cash-shop.test.js
git commit -m "fix: replace the dead Main Menu showBoosterShop() stub with a real explainer"
```

---

## Self-Review Notes

- **Spec coverage:** Data model (Task 1) ✅, consumption hook (Task 2) ✅, all five mini-game levers (Task 3) ✅, purchase logic and cap (Task 4) ✅, Shop modal UI (Task 5) ✅, Main Menu button fix (Task 6) ✅. The spec's "Out of scope" items (Deck Builder dust shop, persistent wallet, campaign-trigger-specific code paths, additional items) are untouched by every task above, as required.
- **Placeholder scan:** no TBD/TODO; every step has literal code, not a description of code.
- **Type/name consistency:** `gameId` values (`street_dice`, `bodega_run`, `haircut_challenge`, `lockpicking`, `negotiation`) match exactly across Task 1's `prepItems` keys, Task 2's `MiniGameManager` registry keys (pre-existing, unchanged), Task 3's per-file bonuses, and Task 4/5's `SHOP_ITEMS` — verified against each mini-game's own `this.id` field (`street-dice.js`: `'street_dice'`, `bodega-run.js`: `'bodega_run'`, `haircut-challenge.js`: `'haircut_challenge'`, `lockpicking.js`: `'lockpicking'`, `negotiation.js`: `'negotiation'`). `app.PREP_ITEM_CAP` (Task 4) is read identically in `buyPrepItem` and `renderShopModal` (Task 5) — one source of truth, not two magic `3`s.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-08-cash-shop-prep-items.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

