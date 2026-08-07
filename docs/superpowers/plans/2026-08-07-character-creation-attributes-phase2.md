# Character Creation & Attribute System — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reintroduce STR/WIT/SOUL as real, mechanically-consumed player attributes (CASH continues to mean `streetCred`, per Phase 1), and rebuild the Character Creation screen's origin picker as a visual grid showing them, per `docs/superpowers/specs/2026-08-07-character-creation-attributes-design.md`.

**Architecture:** `attributes: {str, wit, soul}` lands on `CHARACTER_ORIGINS` (data), `player.attributes` (per-player instance), and `MiniGameState` (read by mini-games) — structurally separate from `player.stats`, which stays exactly `{streetCred, reputation}`. The Character Creation screen's `<select id="characterOriginSelect">` stays in the DOM as a hidden backing field (13+ existing call sites read its `.value`); a new visual card grid sits on top and writes to it instead of replacing it.

**Tech Stack:** Plain JS (`index.html`, `src/pixel_engine/block-map-navigation.js`, `src/pixel_engine/mini-games/**`), `node --test` for all data-model and mini-game-mechanics changes, manual browser verification for the DOM-only card-grid interaction.

## Global Constraints

- No new dependencies, no build step.
- `player.stats` stays exactly `{ streetCred, reputation }` — the new attributes live on a separate `player.attributes` object, never merged into `stats`.
- `app` (including `show`, `renderGame`, `updateStatHud`, `updateTopHud`) IS reachable from `node --test` via `loadGameModule().app` (corrected in Phase 1's final review — the DOM-only card-grid task still gets manual verification because it's user-click-driven, not because it's unreachable).
- Follow existing code style exactly: inline `style="..."` attributes, `'Press Start 2P', monospace` for labels/headers, existing `document.getElementById(...)` null-guard pattern, existing defensive `|| 0` / truthiness-guard style seen in `negotiation.js`/`mini-game-state.js`.
- Appearance customization (hair/fit/prop) and pre-selected secrets from the wireframe are explicitly out of scope for this phase — the sprite renderer (`pixel-engine.js`) has no per-origin style variants to select between (hair/outfit color is fixed per origin), and the game's secrets system reveals secrets through play, not pre-selection. Adding UI for either would be non-functional decoration. See "Out of scope" below.

---

### Task 1: Add STR/WIT/SOUL to `CHARACTER_ORIGINS`

**Files:**
- Modify: `src/pixel_engine/block-map-navigation.js` (all 8 entries in `CHARACTER_ORIGINS`)
- Test: `test/block-map-navigation.test.js` (extend existing file)

**Interfaces:**
- Consumes: nothing new.
- Produces: `CHARACTER_ORIGINS[key].attributes` (`{str, wit, soul}`, numbers) — Task 3 reads this to apply the human player's attribute bonus; Task 6 reads it to render attribute bars.

- [ ] **Step 1: Write the failing test**

Append to `test/block-map-navigation.test.js`:

```js
test('Block Map Navigation: every origin has STR/WIT/SOUL attributes', () => {
  const expectedAttributes = {
    BARBER: { str: 4, wit: 7, soul: 7 },
    STREET_SCHOLAR: { str: 3, wit: 8, soul: 4 },
    LOCAL_LEGEND: { str: 6, wit: 3, soul: 8 },
    CORNER_MERCHANT: { str: 4, wit: 7, soul: 5 },
    COMMUNITY_ORGANIZER: { str: 3, wit: 6, soul: 8 },
    UNDERGROUND_DJ: { str: 4, wit: 5, soul: 6 },
    BLOCK_ARCHITECT: { str: 7, wit: 6, soul: 3 },
    HUSTLE_VETERAN: { str: 8, wit: 4, soul: 5 }
  };
  for (const [key, attrs] of Object.entries(expectedAttributes)) {
    const origin = CHARACTER_ORIGINS[key];
    assert.ok(origin, `expected origin ${key} to exist`);
    assert.deepEqual(origin.attributes, attrs, `expected ${key} attributes to match design spec`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/block-map-navigation.test.js`
Expected: FAIL — `origin.attributes` is `undefined`.

- [ ] **Step 3: Implement**

In `src/pixel_engine/block-map-navigation.js`, add an `attributes` field to each of the 8 origins, immediately after each entry's `startingStats` line. For example, `BARBER`:

```js
  BARBER: {
    id: 'BARBER',
    name: 'Master Barber',
    hairColor: '#3d2218',  // Hair Charcoal (#3D2218)
    skinColor: '#26120b',  // Rich Ebony (#26120B)
    outfitColor: '#d9382e',// Street Flame Hoodie (#D9382E)
    apronColor: '#f4f7ff', // Crisp White Apron
    pantsColor: '#274f80', // Slate Denim (#274F80)
    flavor: "Everybody's business runs through your chair. You hear it first, you know it best.",
    startingStats: { streetCred: 0, reputation: 2 },
    attributes: { str: 4, wit: 7, soul: 7 }
  },
```

Apply the same pattern (add `attributes: { ... }` right after `startingStats: { ... }`, keeping the trailing comma consistent with the object's existing structure) to all 8 entries using this table:

| Origin | str | wit | soul |
|---|---:|---:|---:|
| BARBER | 4 | 7 | 7 |
| STREET_SCHOLAR | 3 | 8 | 4 |
| LOCAL_LEGEND | 6 | 3 | 8 |
| CORNER_MERCHANT | 4 | 7 | 5 |
| COMMUNITY_ORGANIZER | 3 | 6 | 8 |
| UNDERGROUND_DJ | 4 | 5 | 6 |
| BLOCK_ARCHITECT | 7 | 6 | 3 |
| HUSTLE_VETERAN | 8 | 4 | 5 |

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/block-map-navigation.test.js`
Expected: PASS (both the new test and the existing "every origin has a flavor line and a starting stat bonus" test, unaffected)

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/block-map-navigation.js test/block-map-navigation.test.js
git commit -m "feat: add STR/WIT/SOUL attributes to all 8 character origins"
```

---

### Task 2: Add `wit`/`soul`/`str` to `MiniGameState`

**Files:**
- Modify: `src/pixel_engine/mini-games/mini-game-state.js` (constructor + `loadFromEngine`)
- Test: `test/mini-game-system.test.js` (extend existing "Mini-Game State: correct loading from storyEngine and player stats" test)

**Interfaces:**
- Consumes: `player.attributes` (produced by Task 3 — this task only reads it defensively via `player.attributes?.wit` etc., so it can land before or after Task 3 without breaking; write it assuming Task 3 exists).
- Produces: `MiniGameState.wit` / `.soul` / `.str` (numbers, default `0`) — Task 4 (`street-dice.js`) and Task 5 (`negotiation.js`, `lockpicking.js`) read these.

- [ ] **Step 1: Write the failing test**

In `test/mini-game-system.test.js`, find the existing test:

```js
test('Mini-Game State: correct loading from storyEngine and player stats', () => {
  const state = new MiniGameState();
  
  const mockStoryEngine = {
    heat: 3,
    trust: 4,
    secrets: ['secret_stash']
  };

  const mockPlayer = {
    stats: {
      streetCred: 100,
      reputation: 5
    }
  };

  state.loadFromEngine(mockStoryEngine, mockPlayer);

  assert.equal(state.heat, 3);
  assert.equal(state.trust['general'], 4);
  assert.deepEqual(state.secrets, ['secret_stash']);
  assert.equal(state.cash, 100);
  assert.equal(state.reputation, 5);
});
```

Change to:

```js
test('Mini-Game State: correct loading from storyEngine and player stats', () => {
  const state = new MiniGameState();

  assert.equal(state.wit, 0);
  assert.equal(state.soul, 0);
  assert.equal(state.str, 0);

  const mockStoryEngine = {
    heat: 3,
    trust: 4,
    secrets: ['secret_stash']
  };

  const mockPlayer = {
    stats: {
      streetCred: 100,
      reputation: 5
    },
    attributes: {
      str: 6,
      wit: 8,
      soul: 3
    }
  };

  state.loadFromEngine(mockStoryEngine, mockPlayer);

  assert.equal(state.heat, 3);
  assert.equal(state.trust['general'], 4);
  assert.deepEqual(state.secrets, ['secret_stash']);
  assert.equal(state.cash, 100);
  assert.equal(state.reputation, 5);
  assert.equal(state.wit, 8);
  assert.equal(state.soul, 3);
  assert.equal(state.str, 6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/mini-game-system.test.js`
Expected: FAIL — `state.wit` is `undefined`, first new assertion fails.

- [ ] **Step 3: Implement**

In `src/pixel_engine/mini-games/mini-game-state.js`, find the `MiniGameState` constructor:

```js
class MiniGameState {
  constructor() {
    this.heat = 0;
    this.trust = {};
    this.cash = 0;
    this.reputation = 0;
    this.secrets = [];
    this.inventory = [];
    this.history = [];
  }
```

Change to:

```js
class MiniGameState {
  constructor() {
    this.heat = 0;
    this.trust = {};
    this.cash = 0;
    this.reputation = 0;
    this.wit = 0;
    this.soul = 0;
    this.str = 0;
    this.secrets = [];
    this.inventory = [];
    this.history = [];
  }
```

Then find `loadFromEngine`:

```js
  loadFromEngine(storyEngine, player) {
    if (storyEngine) {
      this.heat = storyEngine.heat || 0;
      this.secrets = [...(storyEngine.secrets || [])];
      // Sync flat storyEngine trust
      this.trust['general'] = storyEngine.trust || 0;
    }
    if (player && player.stats) {
      this.cash = player.stats.streetCred || 0;
      this.reputation = player.stats.reputation || 0;
    }
```

Change to:

```js
  loadFromEngine(storyEngine, player) {
    if (storyEngine) {
      this.heat = storyEngine.heat || 0;
      this.secrets = [...(storyEngine.secrets || [])];
      // Sync flat storyEngine trust
      this.trust['general'] = storyEngine.trust || 0;
    }
    if (player && player.stats) {
      this.cash = player.stats.streetCred || 0;
      this.reputation = player.stats.reputation || 0;
    }
    if (player && player.attributes) {
      this.wit = player.attributes.wit || 0;
      this.soul = player.attributes.soul || 0;
      this.str = player.attributes.str || 0;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/mini-game-system.test.js`
Expected: PASS (all tests in the file — this is a large shared file, confirm the full file's test count is unchanged aside from the one modified test)

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/mini-games/mini-game-state.js test/mini-game-system.test.js
git commit -m "feat: load wit/soul/str attributes into MiniGameState from player.attributes"
```

---

### Task 3: Add `player.attributes` and apply origin attribute bonuses

**Files:**
- Modify: `index.html` — `Game.addPlayer` (~line 1212), two online-mode inline player-construction sites (~lines 3705-3709, 3731-3735), and all 8 existing `startingStats` bonus-application sites (~lines 2151-2152, 3714-3715, 3741-3742, 3992-3993, 4022-4023, 4052-4053, 4082-4083, 4112-4113)
- Test: new `test/origin-attributes.test.js`

**Interfaces:**
- Consumes: `CHARACTER_ORIGINS[key].attributes` (Task 1).
- Produces: `player.attributes` (`{str, wit, soul}`, default `{0,0,0}`, bonus-adjusted for the human player at every origin-selection entry point) — Task 2's `loadFromEngine` reads this via the `player` argument.

- [ ] **Step 1: Write the failing test**

Create `test/origin-attributes.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Game.addPlayer gives every player a default attributes object', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  assert.deepEqual(game.players[0].attributes, { str: 0, wit: 0, soul: 0 });
});

test('startLocalGame applies the selected origin\'s attribute bonus to the human player', () => {
  const { Game, CHARACTER_ORIGINS } = loadGameModule();
  // Simulate exactly what startLocalGame() does after reading the origin select:
  // this test exercises the same addPlayer + bonus-application pattern directly,
  // since startLocalGame() itself is DOM-driven (reads document.getElementById).
  const game = new Game();
  game.addPlayer('Player');
  const origin = CHARACTER_ORIGINS.HUSTLE_VETERAN;
  game.players[0].attributes.str += origin.attributes.str;
  game.players[0].attributes.wit += origin.attributes.wit;
  game.players[0].attributes.soul += origin.attributes.soul;
  assert.deepEqual(game.players[0].attributes, { str: 8, wit: 4, soul: 5 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/origin-attributes.test.js`
Expected: FAIL — `game.players[0].attributes` is `undefined`.

- [ ] **Step 3: Implement — `Game.addPlayer`**

In `index.html`, find:

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

Change to:

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

- [ ] **Step 4: Implement — the two online-mode inline player-construction sites**

In `index.html`, this exact line appears twice, at two different WebSocket message handlers (`msg.type === 'joined'` and `msg.type === 'room_players'`). Use `replace_all` since both occurrences need the identical change:

Find (appears twice):

```js
        stats: { streetCred: 0, reputation: 0 }, receipts: [],
```

Change to (both occurrences):

```js
        stats: { streetCred: 0, reputation: 0 }, attributes: { str: 0, wit: 0, soul: 0 }, receipts: [],
```

- [ ] **Step 5: Implement — the 6 identical `players[0]` bonus-application sites**

Six sites (in `startLocalGame()` and 5 sandbox-starter functions) share this exact 2-line text. First confirm there are exactly 6 occurrences:

Run: `grep -c "this.game.players\[0\].stats.reputation += origin.startingStats.reputation;" index.html`
Expected: `6`

If the count is not 6, stop and report — do not proceed with `replace_all` on an unexpected count. If it is 6, use `replace_all` to change all 6:

Find:

```js
    this.game.players[0].stats.streetCred += origin.startingStats.streetCred;
    this.game.players[0].stats.reputation += origin.startingStats.reputation;
```

Change to:

```js
    this.game.players[0].stats.streetCred += origin.startingStats.streetCred;
    this.game.players[0].stats.reputation += origin.startingStats.reputation;
    this.game.players[0].attributes.str += origin.attributes.str;
    this.game.players[0].attributes.wit += origin.attributes.wit;
    this.game.players[0].attributes.soul += origin.attributes.soul;
```

- [ ] **Step 6: Implement — the 2 online-mode `players[this.humanIndex]` bonus-application sites**

These two sites have different indentation from each other and from Step 5's sites, so handle them individually (not with `replace_all`).

Site A — inside the `msg.type === 'joined'` handler. Find:

```js
        this.game.players[this.humanIndex].stats.streetCred += origin.startingStats.streetCred;
        this.game.players[this.humanIndex].stats.reputation += origin.startingStats.reputation;
```

Change to:

```js
        this.game.players[this.humanIndex].stats.streetCred += origin.startingStats.streetCred;
        this.game.players[this.humanIndex].stats.reputation += origin.startingStats.reputation;
        this.game.players[this.humanIndex].attributes.str += origin.attributes.str;
        this.game.players[this.humanIndex].attributes.wit += origin.attributes.wit;
        this.game.players[this.humanIndex].attributes.soul += origin.attributes.soul;
```

Site B — inside the `msg.type === 'room_players'` handler. Find:

```js
      this.game.players[this.humanIndex].stats.streetCred += origin.startingStats.streetCred;
      this.game.players[this.humanIndex].stats.reputation += origin.startingStats.reputation;
```

Change to:

```js
      this.game.players[this.humanIndex].stats.streetCred += origin.startingStats.streetCred;
      this.game.players[this.humanIndex].stats.reputation += origin.startingStats.reputation;
      this.game.players[this.humanIndex].attributes.str += origin.attributes.str;
      this.game.players[this.humanIndex].attributes.wit += origin.attributes.wit;
      this.game.players[this.humanIndex].attributes.soul += origin.attributes.soul;
```

(Note the difference from Site A: 6-space indentation here vs. 8-space at Site A — copy each site's own indentation exactly, don't normalize them.)

- [ ] **Step 7: Run test to verify it passes**

Run: `node --test test/origin-attributes.test.js`
Expected: PASS

Run: `node --test` (full suite)
Expected: all tests pass, including every existing test that touches `player.stats` or `addPlayer` — confirm none assert an exact player-object shape that would break from adding the new `attributes` field (the recent stat-pruning tests assert `player.stats` shape specifically, not the whole player object, so they should be unaffected — verify this by reading their output, not by assumption).

- [ ] **Step 8: Commit**

```bash
git add index.html test/origin-attributes.test.js
git commit -m "feat: add player.attributes and apply origin STR/WIT/SOUL bonuses at all 8 entry points"
```

---

### Task 4: Migrate `street-dice.js` from a local WIT map to the shared attribute

**Files:**
- Modify: `src/pixel_engine/mini-games/games/street-dice.js`
- Test: `test/mini-game-system.test.js` (modify the existing "Street Dice: WIT modifier mapping and win/loss verification rules" test)

**Interfaces:**
- Consumes: `MiniGameState.wit` (Task 2).
- Produces: nothing new — this removes duplicated logic in favor of the shared source.

- [ ] **Step 1: Update the existing test first (TDD: make it assert the new behavior, watch it fail against old code)**

In `test/mini-game-system.test.js`, find:

```js
test('Street Dice: WIT modifier mapping and win/loss verification rules', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  
  // Verify Barber WIT modifiers load correctly
  state.origin = 'BARBER';
  const game = new StreetDice(null, canvas, ctx, state);
  game.init({ stake: 50, dc: 12 });

  assert.equal(game.witModifier, 7); // Barber has WIT 7
  assert.equal(game.stake, 50);
  assert.equal(game.dc, 12);

  // Verify Scholar WIT modifiers load correctly
  state.origin = 'STREET_SCHOLAR';
  const game2 = new StreetDice(null, canvas, ctx, state);
  game2.init({});
  assert.equal(game2.witModifier, 8); // Scholar has WIT 8
```

Change to:

```js
test('Street Dice: WIT modifier mapping and win/loss verification rules', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  
  // Verify WIT modifier loads from the shared MiniGameState attribute
  state.wit = 7; // e.g. Barber's WIT
  const game = new StreetDice(null, canvas, ctx, state);
  game.init({ stake: 50, dc: 12 });

  assert.equal(game.witModifier, 7);
  assert.equal(game.stake, 50);
  assert.equal(game.dc, 12);

  // Verify a different WIT value loads correctly
  state.wit = 8; // e.g. Street Scholar's WIT
  const game2 = new StreetDice(null, canvas, ctx, state);
  game2.init({});
  assert.equal(game2.witModifier, 8);
```

Leave the rest of the test (from `// Verify Roll win/loss criteria` onward) unchanged — it directly overrides `game.witModifier` and doesn't depend on the origin/wit source.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/mini-game-system.test.js`
Expected: FAIL — `game.witModifier` is still `5` (the constructor default), since `state.wit = 7` isn't read by the old code yet.

- [ ] **Step 3: Implement**

In `src/pixel_engine/mini-games/games/street-dice.js`, find:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.dc = params.dc || 12;

    // Retrieve WIT stat from player origin if available
    const originKey = (this.gameState && this.gameState.origin) || '';
    const witMap = {
      'BARBER': 7,
      'STREET_SCHOLAR': 8,
      'LOCAL_LEGEND': 3,
      'CORNER_MERCHANT': 7,
      'COMMUNITY_ORGANIZER': 6,
      'UNDERGROUND_DJ': 5,
      'BLOCK_ARCHITECT': 6,
      'HUSTLE_VETERAN': 4
    };
    
    if (witMap[originKey]) {
      this.witModifier = witMap[originKey];
    }
  }
```

Change to:

```js
  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.dc = params.dc || 12;

    // Retrieve WIT stat from the shared player attribute system
    if (this.gameState && this.gameState.wit) {
      this.witModifier = this.gameState.wit;
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/mini-game-system.test.js`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/mini-games/games/street-dice.js test/mini-game-system.test.js
git commit -m "refactor: read WIT from shared MiniGameState instead of a local per-origin map"
```

---

### Task 5: Wire SOUL into Negotiation and STR into Lockpicking

**Files:**
- Modify: `src/pixel_engine/mini-games/games/negotiation.js`, `src/pixel_engine/mini-games/games/lockpicking.js`
- Test: `test/mini-game-system.test.js` (add two new tests; verify existing tests still pass unchanged)

**Interfaces:**
- Consumes: `MiniGameState.soul`, `MiniGameState.str` (Task 2).
- Produces: nothing new — these are the mechanical consumers Task 2's data feeds.

- [ ] **Step 1: Write the failing tests**

In `test/mini-game-system.test.js`, add two new tests. Place the first right after the existing "Negotiation: weakness matching damage, stat bonuses, and rounds advancement" test:

```js
test('Negotiation: SOUL attribute adds to the CHARM argument bonus alongside reputation', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');

  const state = new MiniGameState();
  state.reputation = 6;
  state.soul = 4;

  const game = new Negotiation(null, canvas, ctx, state);
  game.start();

  // Option 1 type: CHARM, damage: 25.
  // Check bonus: (reputation + soul) * 1.5 = (6 + 4) * 1.5 = 15.
  // Total base damage: 40.
  // Weakness is LOGIC, so non-matching: 40 * 0.6 = 24.
  // Resistance becomes 100 - 24 = 76
  game.selectedOptionIdx = 1;
  game.executeArgument();
  assert.equal(game.resistance, 76);
});
```

Place the second right after the existing "Lockpicking: setup, difficulty parameters mapping and pick navigation" test:

```js
test('Lockpicking: STR attribute widens the pin-alignment tolerance', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');

  const state = new MiniGameState();
  state.str = 8;

  const game = new Lockpicking(null, canvas, ctx, state);
  game.init({ difficulty: 'hard' }); // base tolerance 10
  assert.equal(game.tolerance, 14); // 10 + floor(8/2) = 14

  const stateNoStr = new MiniGameState();
  const gameNoStr = new Lockpicking(null, canvas, ctx, stateNoStr);
  gameNoStr.init({ difficulty: 'hard' });
  assert.equal(gameNoStr.tolerance, 10); // str defaults to 0, no change
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/mini-game-system.test.js`
Expected: FAIL — the negotiation test computes resistance as 80 (old formula, no soul), not 76; the lockpicking test finds `tolerance` still `10`, not `14`.

- [ ] **Step 3: Implement — Negotiation SOUL**

In `src/pixel_engine/mini-games/games/negotiation.js`, find:

```js
    // Check stat modifiers
    let checkBonus = 0;
    if (this.gameState) {
      if (opt.type === 'LOGIC' && this.gameState.wit) {
        checkBonus = Math.floor(this.gameState.wit * 2.5);
      } else if (opt.type === 'CHARM' && this.gameState.reputation) {
        checkBonus = Math.floor(this.gameState.reputation * 1.5);
      }
    }
```

Change to:

```js
    // Check stat modifiers
    let checkBonus = 0;
    if (this.gameState) {
      if (opt.type === 'LOGIC' && this.gameState.wit) {
        checkBonus = Math.floor(this.gameState.wit * 2.5);
      } else if (opt.type === 'CHARM' && this.gameState.reputation) {
        checkBonus = Math.floor((this.gameState.reputation + this.gameState.soul) * 1.5);
      }
    }
```

- [ ] **Step 4: Implement — Lockpicking STR**

In `src/pixel_engine/mini-games/games/lockpicking.js`, find:

```js
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
    
    this.setupPins();
  }
```

Change to:

```js
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

    // A steadier hand from raw strength widens the pin-alignment margin
    if (this.gameState && this.gameState.str) {
      this.tolerance += Math.floor(this.gameState.str / 2);
    }

    this.setupPins();
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/mini-game-system.test.js`
Expected: PASS (all tests in the file, including the unmodified existing Negotiation and Lockpicking tests — confirm they still pass unchanged, since `soul`/`str` default to `0` via Task 2's constructor change, reproducing prior behavior exactly when unset)

- [ ] **Step 6: Commit**

```bash
git add src/pixel_engine/mini-games/games/negotiation.js src/pixel_engine/mini-games/games/lockpicking.js test/mini-game-system.test.js
git commit -m "feat: wire SOUL into Negotiation's CHARM bonus and STR into Lockpicking's tolerance"
```

---

### Task 6: Character Creation screen — visual origin grid with attribute bars

**Files:**
- Modify: `index.html` — `#setup` screen markup (~lines 500-527), plus a new `app.selectOriginCard(originKey)` method and a new `app.renderOriginGrid()` call from `app.init()`

**Interfaces:**
- Consumes: `CHARACTER_ORIGINS` (already global), the existing hidden `<select id="characterOriginSelect">` and its existing `onchange`-driven `renderCharacterPreview()`.
- Produces: a visual card grid; `app.selectOriginCard(originKey)` (sets the hidden select's value, dispatches its `change` event, and re-renders the grid's active-card highlight) and `app.renderOriginGrid()` (initial render, called once from `init()`).

- [ ] **Step 1: Hide the select, add the grid container and a Randomize button**

In `index.html`, find:

```html
        <div style="margin-bottom:12px;">
          <label style="font-weight:600; display:block; margin-bottom:4px; font-size:10px; font-family:'Press Start 2P', monospace;">CHARACTER CLASS</label>
          <select id="characterOriginSelect" style="width:100%;">
            <option value="BARBER">MASTER BARBER (Apron + Scissors)</option>
            <option value="STREET_SCHOLAR">STREET SCHOLAR (Book + Hoodie)</option>
            <option value="LOCAL_LEGEND">LOCAL LEGEND (Leather Jacket)</option>
            <option value="CORNER_MERCHANT">CORNER MERCHANT (Utility Vest)</option>
            <option value="COMMUNITY_ORGANIZER">COMMUNITY ORGANIZER (Denim Jacket)</option>
            <option value="UNDERGROUND_DJ">UNDERGROUND DJ (Varsity Violet)</option>
            <option value="BLOCK_ARCHITECT">BLOCK ARCHITECT (High-Vis Gold)</option>
            <option value="HUSTLE_VETERAN">HUSTLE VETERAN (Green Tracksuit)</option>
          </select>
          <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
            <canvas id="setup-character-preview" width="32" height="32" style="width:64px; height:64px; border:3px solid #474d5e; background:#101116; image-rendering:pixelated;"></canvas>
            <span class="muted" style="line-height:1.3;">Each class has a distinct 16-bit avatar layout. Watch them bob in the preview!</span>
          </div>
        </div>
```

Change to:

```html
        <div style="margin-bottom:12px;">
          <label style="font-weight:600; display:block; margin-bottom:4px; font-size:10px; font-family:'Press Start 2P', monospace;">CHARACTER CLASS</label>
          <select id="characterOriginSelect" style="display:none;">
            <option value="BARBER">MASTER BARBER (Apron + Scissors)</option>
            <option value="STREET_SCHOLAR">STREET SCHOLAR (Book + Hoodie)</option>
            <option value="LOCAL_LEGEND">LOCAL LEGEND (Leather Jacket)</option>
            <option value="CORNER_MERCHANT">CORNER MERCHANT (Utility Vest)</option>
            <option value="COMMUNITY_ORGANIZER">COMMUNITY ORGANIZER (Denim Jacket)</option>
            <option value="UNDERGROUND_DJ">UNDERGROUND DJ (Varsity Violet)</option>
            <option value="BLOCK_ARCHITECT">BLOCK ARCHITECT (High-Vis Gold)</option>
            <option value="HUSTLE_VETERAN">HUSTLE VETERAN (Green Tracksuit)</option>
          </select>
          <div id="originGrid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; margin-bottom:8px;"></div>
          <button class="secondary" style="width:100%; font-size:9px; margin-bottom:8px;" onclick="app.randomizeOrigin()">🎲 RANDOMIZE</button>
          <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
            <canvas id="setup-character-preview" width="32" height="32" style="width:64px; height:64px; border:3px solid #474d5e; background:#101116; image-rendering:pixelated;"></canvas>
            <span class="muted" style="line-height:1.3;">Each class has a distinct 16-bit avatar layout. Watch them bob in the preview!</span>
          </div>
        </div>
```

- [ ] **Step 2: Add `renderOriginGrid()` and `selectOriginCard()` methods**

In `index.html`, find `renderCharacterPreview()`:

```js
  renderCharacterPreview() {
```

Immediately before it, insert two new methods:

```js
  renderOriginGrid() {
    const grid = document.getElementById('originGrid');
    if (!grid) return;
    const select = document.getElementById('characterOriginSelect');
    const activeKey = select ? select.value : null;

    grid.innerHTML = Object.keys(CHARACTER_ORIGINS).map(key => {
      const origin = CHARACTER_ORIGINS[key];
      const isActive = key === activeKey;
      const bar = (value) => {
        const filled = Math.max(0, Math.min(10, value));
        return '='.repeat(filled) + ' '.repeat(10 - filled);
      };
      return `
        <div onclick="app.selectOriginCard('${key}')" style="cursor:pointer; padding:8px; border:2px solid ${isActive ? '#ffcd68' : '#474d5e'}; background:${isActive ? '#1c1a12' : '#101116'};">
          <div style="font-family:'Press Start 2P', monospace; font-size:9px; color:${isActive ? '#ffcd68' : '#cbd5ed'}; margin-bottom:4px;">${origin.name.toUpperCase()}</div>
          <div style="font-size:9px; color:#8b95ab; margin-bottom:6px; line-height:1.3;">${origin.flavor}</div>
          <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#85c4ff;">STR [${bar(origin.attributes.str)}] ${origin.attributes.str}</div>
          <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#85c4ff;">WIT [${bar(origin.attributes.wit)}] ${origin.attributes.wit}</div>
          <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#85c4ff;">SOUL[${bar(origin.attributes.soul)}] ${origin.attributes.soul}</div>
          <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#ffcd68;">CASH[${bar(origin.startingStats.streetCred)}] ${origin.startingStats.streetCred}</div>
        </div>
      `;
    }).join('');
  },

  selectOriginCard(originKey) {
    const select = document.getElementById('characterOriginSelect');
    if (!select) return;
    select.value = originKey;
    select.dispatchEvent(new Event('change'));
    this.renderOriginGrid();
  },

  randomizeOrigin() {
    const keys = Object.keys(CHARACTER_ORIGINS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    this.selectOriginCard(randomKey);
  },

  renderCharacterPreview() {
```

- [ ] **Step 3: Call `renderOriginGrid()` once at startup**

Find (inside `init()`, right after the line added in Phase 1's mini-game wiring commit):

```js
    this.renderSetupCampaignActs();
    this.renderSetupGlossary();
    this.renderCharacterPreview();
```

Change to:

```js
    this.renderSetupCampaignActs();
    this.renderSetupGlossary();
    this.renderCharacterPreview();
    this.renderOriginGrid();
```

- [ ] **Step 4: No automated test for this task**

This is DOM/click-driven UI with no automated test, per the plan's Global Constraints — manual verification happens in Task 7. Run `node --test` now anyway to confirm the existing suite (all prior tasks' tests plus the pre-existing suite) is untouched by this markup/JS change:

Run: `node --test`
Expected: PASS, same test count as after Task 5 (this task adds zero new tests)

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: replace origin dropdown with a visual card grid showing STR/WIT/SOUL/CASH bars"
```

---

### Task 7: Manual browser verification

**Files:** none (verification only)

**Interfaces:** none.

- [ ] **Step 1: Run the automated suite**

```bash
node --test
```

Expected: all pass (prior suite count + Tasks 1, 2, 3, 4, 5's new/modified tests).

- [ ] **Step 2: Launch the app**

Use the `run` skill (or `node server/server.js`, then open `http://localhost:3001`) at 1280x720.

- [ ] **Step 3: Verify the origin grid renders and selection works**

On the Setup screen, confirm: 8 cards render with name, flavor, and 4 attribute bars each; clicking a card highlights it (amber border) and updates the character preview canvas (same visual update the old dropdown triggered); clicking Randomize selects a different card and updates the preview.

- [ ] **Step 4: Verify every existing origin-consuming flow still works**

Each of these reads `characterOriginSelect.value` — confirm none are broken by the select being hidden rather than removed:
- Click a card, then "PLAY LOCAL" — confirm the game starts and the state panel's CASH/REP reflect the selected origin's `startingStats` bonus (per Phase 1's state panel).
- From Setup, click each of the 5 mini-game sandbox buttons (Street Dice, Bodega Run, Haircut Challenge, Lockpicking, Negotiation) — confirm each launches without a console error.
- Click "PLAY NOIR PROTOTYPE" — confirm it starts without a console error.
- Open the online lobby flow (host a room) — confirm the origin selection still carries through to `msg.type === 'joined'`/`'room_players'` handling without a console error.

- [ ] **Step 5: Verify STR/WIT/SOUL actually change mini-game behavior**

Select the Hustle Veteran card (STR 8, WIT 4, SOUL 5) and launch the Street Dice sandbox — via the browser console, confirm `app.miniGameManager.activeGame.witModifier` equals `4` (Hustle Veteran's WIT), not the old hardcoded value. Select Street Scholar (WIT 8) instead, relaunch, and confirm `witModifier` is `8`.

- [ ] **Step 6: Fix any issues found, then final commit**

If any step above surfaces a bug, fix it in the relevant task's files and commit with a `fix:` message describing exactly what was wrong.

---

## Out of scope for this plan

- Appearance customization (hair/fit/prop dropdowns) — the sprite renderer has no per-origin style variants to select between; this needs new rendering work that belongs to the pixel-art-asset-generation project, not this UI-fidelity pass.
- Pre-selected secrets at character creation — the game's secrets system reveals secrets through play (winning a tagged card), not pre-selection; adding a dropdown with no matching mechanic would be non-functional decoration.
- Game Board, Decision Panel, City Map, NPC/POI Scenes, Mini-Game HUD — separate phases per the parent spec's execution order.
- Haircut Challenge and Bodega Run mechanical changes — no stat tie in the source catalog for either.
