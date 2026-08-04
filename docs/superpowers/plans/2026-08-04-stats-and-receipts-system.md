# Stats and Receipts System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Street Cred/Community/Wisdom/Reputation stat system and the Receipt story-thread mechanic to the existing CAH-style game logic in `index.html`, with no UI wiring (spec explicitly defers that).

**Architecture:** A new `ReceiptSystem` object lives alongside the existing `Deck`/`Game` classes inside `index.html`'s single inline `<script>` block (no new files, no build step, no module system change). `Game.addPlayer` gains `stats`/`receipts` fields, `Game.nextBlack()` consults `ReceiptSystem.maybeTriggerReceipt` before drawing a normal black card, and `app.chooseWinner()` calls `ReceiptSystem.resolveTrigger` then `ReceiptSystem.awardWin` after its existing `winner.points++`. A new Node-based test harness (`test/helpers/load-app.js`) extracts and evaluates the testable portion of `index.html`'s inline script in a `vm` context, so the pure game-logic pieces can be unit tested with Node's built-in test runner without a browser.

**Tech Stack:** Vanilla JS (no framework, no bundler), Node.js built-in `node:test` + `node:assert/strict` + `vm` for testing (no new npm dependencies).

## Global Constraints

- No new npm dependencies — `package.json` currently depends only on `ws`; test tooling must use Node's built-in `node:test`/`node:assert`/`vm` modules only (Node 18+ required for `node:test`; this environment runs Node v22.21.0, confirmed).
- No new files outside `test/` — all production code changes stay inside `index.html`'s existing single inline `<script>` block (per the approved spec's Option B: a small in-file `ReceiptSystem`, not a separate module).
- `npm test`'s existing smoke check (regex-extracts `index.html`'s `<script>` and `server/server.js`, parses both with `new Function`) must keep passing unmodified in behavior — only extend `package.json`'s `test` script to also run the new Node test suite, don't replace the smoke check.
- No UI/rendering changes — `app`'s DOM-touching methods are not unit tested in this plan (per spec, UI wiring is out of scope); the one production change inside `app` (`chooseWinner`) is a small, mechanical two-line addition verified via the smoke parse check plus a manual browser QA pass, not new automated DOM tests.
- Exact numbers, field names, and call order are fixed by the spec (`docs/superpowers/specs/2026-08-04-stats-and-receipts-system-design.md`) and must match verbatim: `+1` reputation on any win, `+2` additional reputation (stacking) plus O.G. `+1` on receipt resolve, `-1` to all four stats on receipt fail, 5-receipt active cap, 35% trigger chance, `resolveTrigger` called **before** `awardWin` in `chooseWinner`.

---

## Task 1: Test harness — load `index.html`'s game logic in Node

**Files:**
- Create: `test/helpers/load-app.js`
- Create: `test/game-loader.smoke.test.js`
- Modify: `package.json` (scripts.test)

**Interfaces:**
- Produces: `loadGameModule()` — reads `index.html`, extracts the inline `<script>` content up to (not including) the DOM-wiring boundary marker `document.getElementById('blackCard')`, evaluates it in a fresh `vm` context that shares the outer realm's `Math` object (so `Math.random` can be mocked from tests), and returns `{ Deck, Game, ReceiptSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS }`. Every later task's tests call this function directly — no other task creates a competing loader.

This task validates the harness against **existing, already-working** behavior (`Deck`/`Game` as they are today) — there's no new feature yet, so unlike later tasks this doesn't follow strict red→green; the "fail" step below fails because the harness file doesn't exist yet, not because of a logic bug.

- [ ] **Step 1: Write the loader**

Create `test/helpers/load-app.js`:

```js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const INDEX_HTML = path.join(__dirname, '..', '..', 'index.html');
const BOUNDARY = "document.getElementById('blackCard')";

function loadGameModule() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error('index.html: could not find inline <script> block');
  const script = match[1];
  const boundaryIndex = script.indexOf(BOUNDARY);
  if (boundaryIndex === -1) {
    throw new Error(`index.html: could not find test boundary marker "${BOUNDARY}"`);
  }
  const testable = script.slice(0, boundaryIndex);
  const context = { console, Math };
  vm.createContext(context);
  const wrapped = `${testable}\n({ Deck, Game, ReceiptSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS });`;
  return vm.runInContext(wrapped, context);
}

module.exports = { loadGameModule };
```

- [ ] **Step 2: Write a smoke test against existing behavior**

Create `test/game-loader.smoke.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app');

test('Deck.draw cycles through every item before reshuffling', () => {
  const { Deck } = loadGameModule();
  const deck = new Deck([1, 2, 3]);
  const drawn = [deck.draw(), deck.draw(), deck.draw()];
  assert.deepEqual(drawn.slice().sort(), [1, 2, 3]);
});

test('Game.addPlayer adds a player with an empty hand and zero points', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  assert.equal(game.players.length, 1);
  assert.equal(game.players[0].name, 'Alice');
  assert.deepEqual(game.players[0].hand, []);
  assert.equal(game.players[0].points, 0);
});
```

- [ ] **Step 3: Run it, expect failure (harness doesn't exist as a working module yet — this only holds if Step 1/2 were done out of order; if both steps above are already saved, skip to Step 4)**

Run: `node --test test/game-loader.smoke.test.js`
Expected: both tests currently **reference `ReceiptSystem`/`RECEIPT_POOL`, which don't exist in `index.html` yet** — the loader itself will throw `ReferenceError: ReceiptSystem is not defined` when evaluating the wrapped completion expression, so both tests fail with that error.

- [ ] **Step 4: Temporarily relax the loader's exports to unblock this task only**

This task is scoped to proving the harness works against *today's* `index.html` (before Tasks 2+ add `ReceiptSystem`/`RECEIPT_POOL`). Edit the wrapped completion expression in `test/helpers/load-app.js` Step 1 to only reference symbols that exist today:

```js
  const wrapped = `${testable}\n({ Deck, Game, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS });`;
```

(Task 2 will restore the full symbol list once `ReceiptSystem`/`RECEIPT_POOL` exist — see Task 2 Step 1.)

- [ ] **Step 5: Run again, verify pass**

Run: `node --test test/game-loader.smoke.test.js`
Expected: `# pass 2`, `# fail 0`

- [ ] **Step 6: Wire the new test suite into `npm test`**

In `package.json`, change:
```json
    "test": "node -e \"const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const m=html.match(/<script>([\\s\\S]*)<\\/script>/);if(!m){console.error('NO SCRIPT');process.exit(1)}try{new Function(m[1]);console.log('client JS OK')}catch(e){console.error('CLIENT JS ERROR',e.message);process.exit(1)}const server=fs.readFileSync('server/server.js','utf8');try{new Function(server);console.log('server JS OK')}catch(e){console.error('SERVER JS ERROR',e.message);process.exit(1)}try{require('fs').accessSync('server/server.js');console.log('server file present')}catch(e){console.error('SERVER FILE MISSING');process.exit(1)}\""
```
to (append ` && node --test test/` at the end, keep everything else byte-for-byte identical):
```json
    "test": "node -e \"const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const m=html.match(/<script>([\\s\\S]*)<\\/script>/);if(!m){console.error('NO SCRIPT');process.exit(1)}try{new Function(m[1]);console.log('client JS OK')}catch(e){console.error('CLIENT JS ERROR',e.message);process.exit(1)}const server=fs.readFileSync('server/server.js','utf8');try{new Function(server);console.log('server JS OK')}catch(e){console.error('SERVER JS ERROR',e.message);process.exit(1)}try{require('fs').accessSync('server/server.js');console.log('server file present')}catch(e){console.error('SERVER FILE MISSING');process.exit(1)}\" && node --test test/"
```

- [ ] **Step 7: Run the full suite, verify pass**

Run: `npm test`
Expected: `client JS OK`, `server JS OK`, `server file present`, then `node --test` output showing `# pass 2`, `# fail 0`.

- [ ] **Step 8: Commit**

```bash
git add test/helpers/load-app.js test/game-loader.smoke.test.js package.json
git commit -m "test: add Node test harness for index.html's inline game logic"
```

---

## Task 2: Data model — `RECEIPT_POOL` content + player `stats`/`receipts` init

**Files:**
- Modify: `index.html` (add `RECEIPT_POOL` array after `DICE_EFFECTS`, line ~291; extend `Game.addPlayer`, lines 324-327)
- Modify: `test/helpers/load-app.js` (restore full symbol export list from Task 1 Step 4)
- Create: `test/receipt-pool-and-player-model.test.js`

**Interfaces:**
- Consumes: `loadGameModule()` from Task 1.
- Produces: `RECEIPT_POOL` — array of exactly 5 `{ id: string, earnText: string, resolutionPrompt: string }` entries, each `resolutionPrompt` containing a `____` blank. `Game.addPlayer(name)` — each pushed player now has `stats: { streetCred: 0, community: 0, wisdom: 0, reputation: 0 }` and `receipts: []` in addition to the existing `name`/`hand`/`points` fields. Later tasks rely on both of these exact shapes.

- [ ] **Step 1: Restore the loader's full export list**

In `test/helpers/load-app.js`, change the wrapped completion expression back to:
```js
  const wrapped = `${testable}\n({ Deck, Game, ReceiptSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS });`;
```

- [ ] **Step 2: Write the failing test**

Create `test/receipt-pool-and-player-model.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app');

test('RECEIPT_POOL has 5 seed entries with id/earnText/resolutionPrompt', () => {
  const { RECEIPT_POOL } = loadGameModule();
  assert.equal(RECEIPT_POOL.length, 5);
  for (const entry of RECEIPT_POOL) {
    assert.equal(typeof entry.id, 'string');
    assert.equal(typeof entry.earnText, 'string');
    assert.equal(typeof entry.resolutionPrompt, 'string');
    assert.ok(entry.resolutionPrompt.includes('____'), `resolutionPrompt for ${entry.id} should contain a blank`);
  }
  const ids = RECEIPT_POOL.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'RECEIPT_POOL ids must be unique');
});

test('Game.addPlayer initializes stats at zero and an empty receipts list', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  assert.deepEqual(game.players[0].stats, { streetCred: 0, community: 0, wisdom: 0, reputation: 0 });
  assert.deepEqual(game.players[0].receipts, []);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/receipt-pool-and-player-model.test.js`
Expected: FAIL — `ReferenceError: ReceiptSystem is not defined` (thrown by the loader since `ReceiptSystem` doesn't exist in `index.html` yet; this also blocks the `RECEIPT_POOL`/`addPlayer` assertions from running).

- [ ] **Step 4: Add `RECEIPT_POOL` to `index.html`**

In `index.html`, immediately after the `DICE_EFFECTS` array closes (after line 291, before `class Deck {` on line 293), insert:

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
    resolutionPrompt: "Your side hustle investment just ____"
  },
  {
    id: 'landlord-standoff',
    earnText: "You stood up to the landlord. They're watching you now.",
    resolutionPrompt: "The landlord who's watching you just posted ____"
  },
  {
    id: 'best-dish',
    earnText: "You brought the best dish. Everyone expects excellence forever.",
    resolutionPrompt: "Everyone's expecting you to top last time's dish, but you brought ____"
  }
];
```

- [ ] **Step 5: Add a placeholder `ReceiptSystem` so the loader can resolve it (full implementation lands in Tasks 3-4)**

Immediately after the `Game` class closes (after its final `}` — currently line 375 — and before the `/* ===========================\n   UI / STATE\n   =========================== */` comment), insert:

```js

const ReceiptSystem = {};
```

- [ ] **Step 6: Extend `Game.addPlayer`**

In `index.html`, replace:
```js
  addPlayer(name) {
    if (this.players.length >= 12) throw new Error('Max 12 players');
    this.players.push({ name, hand: [], points: 0 });
  }
```
with:
```js
  addPlayer(name) {
    if (this.players.length >= 12) throw new Error('Max 12 players');
    this.players.push({
      name, hand: [], points: 0,
      stats: { streetCred: 0, community: 0, wisdom: 0, reputation: 0 },
      receipts: []
    });
  }
```

- [ ] **Step 7: Run test to verify it passes**

Run: `node --test test/receipt-pool-and-player-model.test.js`
Expected: `# pass 2`, `# fail 0`

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: all smoke checks plus all `node --test` tests pass (4 tests total across both test files so far).

- [ ] **Step 9: Commit**

```bash
git add index.html test/helpers/load-app.js test/receipt-pool-and-player-model.test.js
git commit -m "feat: add RECEIPT_POOL and player stats/receipts data model"
```

---

## Task 3: `ReceiptSystem.awardWin` — baseline reputation + receipt earning

**Files:**
- Modify: `index.html` (replace the `ReceiptSystem` placeholder from Task 2 Step 5)
- Create: `test/receipt-system-award-win.test.js`

**Interfaces:**
- Consumes: `RECEIPT_POOL`, `Game` from Task 2.
- Produces: `ReceiptSystem.awardWin(game, winner)` — mutates `winner.stats.reputation += 1` always; if `winner`'s active-receipt count is below 5, also pushes one new `{ id, poolId, earnText, resolutionPrompt, roundEarned, status: 'active' }` onto `winner.receipts`, preferring a `RECEIPT_POOL` entry the winner doesn't already hold active. Task 7's integration test and the final `app.chooseWinner` wiring call this function by this exact name/signature.

- [ ] **Step 1: Write the failing tests**

Create `test/receipt-system-award-win.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app');

function makeWinner(Game) {
  const game = new Game();
  game.addPlayer('Winner');
  game.addPlayer('Other');
  game.round = 1;
  return { game, winner: game.players[0], other: game.players[1] };
}

test('awardWin gives the winner +1 reputation', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const { game, winner, other } = makeWinner(Game);
  ReceiptSystem.awardWin(game, winner);
  assert.equal(winner.stats.reputation, 1);
  assert.equal(other.stats.reputation, 0);
});

test('awardWin grants a new active receipt when under the cap', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const { game, winner } = makeWinner(Game);
  ReceiptSystem.awardWin(game, winner);
  assert.equal(winner.receipts.length, 1);
  assert.equal(winner.receipts[0].status, 'active');
  assert.equal(winner.receipts[0].roundEarned, 1);
  assert.ok(winner.receipts[0].id.length > 0);
});

test('awardWin skips a new receipt once the winner holds 5 active receipts', () => {
  const { Game, ReceiptSystem, RECEIPT_POOL } = loadGameModule();
  const { game, winner } = makeWinner(Game);
  for (let i = 0; i < 5; i++) {
    winner.receipts.push({
      id: `seed-${i}`, poolId: RECEIPT_POOL[i].id,
      earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'active'
    });
  }
  ReceiptSystem.awardWin(game, winner);
  assert.equal(winner.receipts.length, 5, 'no new receipt should be pushed at the cap');
  assert.equal(winner.stats.reputation, 1, 'the baseline reputation reward still applies at the cap');
});

test('awardWin avoids duplicate poolIds while an unheld option exists', () => {
  const { Game, ReceiptSystem, RECEIPT_POOL } = loadGameModule();
  const { game, winner } = makeWinner(Game);
  const heldIds = RECEIPT_POOL.slice(0, 4).map(e => e.id);
  heldIds.forEach((poolId, i) => {
    winner.receipts.push({ id: `seed-${i}`, poolId, earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'active' });
  });
  ReceiptSystem.awardWin(game, winner);
  const newest = winner.receipts[winner.receipts.length - 1];
  assert.equal(newest.poolId, RECEIPT_POOL[4].id);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/receipt-system-award-win.test.js`
Expected: FAIL — `TypeError: ReceiptSystem.awardWin is not a function` (the placeholder `ReceiptSystem` from Task 2 has no methods yet).

- [ ] **Step 3: Implement `awardWin`**

In `index.html`, replace:
```js
const ReceiptSystem = {};
```
with:
```js
const ReceiptSystem = {
  awardWin(game, winner) {
    winner.stats.reputation += 1;
    const activeCount = winner.receipts.filter(r => r.status === 'active').length;
    if (activeCount >= 5) return;
    const held = new Set(winner.receipts.filter(r => r.status === 'active').map(r => r.poolId));
    const options = RECEIPT_POOL.filter(entry => !held.has(entry.id));
    const pool = options.length > 0 ? options : RECEIPT_POOL;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    winner.receipts.push({
      id: `${chosen.id}-${game.round}-${winner.name}`,
      poolId: chosen.id,
      earnText: chosen.earnText,
      resolutionPrompt: chosen.resolutionPrompt,
      roundEarned: game.round,
      status: 'active'
    });
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/receipt-system-award-win.test.js`
Expected: `# pass 4`, `# fail 0`

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass (8 tests total so far).

- [ ] **Step 6: Commit**

```bash
git add index.html test/receipt-system-award-win.test.js
git commit -m "feat: implement ReceiptSystem.awardWin"
```

---

## Task 4: `ReceiptSystem.maybeTriggerReceipt` — candidate selection + chance roll

**Files:**
- Modify: `index.html` (add `maybeTriggerReceipt` to `ReceiptSystem`)
- Create: `test/receipt-system-trigger-selection.test.js`

**Interfaces:**
- Consumes: `Game.getJudge()` (existing, line 359), `game.players[*].receipts`.
- Produces: `ReceiptSystem.maybeTriggerReceipt(game)` — returns `null` if there are no active receipts owned by a non-O.G. player, or on a 65% miss; otherwise returns `{ receiptId, ownerName, resolutionPrompt }` for one randomly chosen eligible active receipt. Does **not** mutate `game.currentBlack` — that's `Game.nextBlack()`'s job (Task 5). Pure selection logic only, so it doesn't call `Math.random()` at all on the "no candidates" path (important for the mutual-exclusivity behavior Task 5 relies on).

- [ ] **Step 1: Write the failing tests**

Create `test/receipt-system-trigger-selection.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app');

function withMockedRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try { fn(); } finally { Math.random = original; }
}

function makeGameWithJudge(Game) {
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.addPlayer('Bob');
  game.judgeIndex = 0; // Judge is the O.G. this round
  game.round = 1;
  return game;
}

test('maybeTriggerReceipt returns null when no player has an active receipt', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  withMockedRandom(0, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});

test('maybeTriggerReceipt ignores an active receipt owned by the current O.G.', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const judge = game.players[0];
  judge.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});

test('maybeTriggerReceipt returns a trigger for an eligible receipt on a hit', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const alice = game.players[1];
  alice.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Alice ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0, () => {
    const trigger = ReceiptSystem.maybeTriggerReceipt(game);
    assert.deepEqual(trigger, { receiptId: 'r1', ownerName: 'Alice', resolutionPrompt: 'Alice ____' });
  });
});

test('maybeTriggerReceipt returns null on a miss even with an eligible receipt', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const alice = game.players[1];
  alice.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Alice ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0.99, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});

test('maybeTriggerReceipt ignores resolved and failed receipts', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const alice = game.players[1];
  alice.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'resolved' });
  alice.receipts.push({ id: 'r2', poolId: 'auntie-joke', earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'failed' });
  withMockedRandom(0, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/receipt-system-trigger-selection.test.js`
Expected: FAIL — `TypeError: ReceiptSystem.maybeTriggerReceipt is not a function`

- [ ] **Step 3: Implement `maybeTriggerReceipt`**

In `index.html`, inside the `ReceiptSystem` object literal, add this method alongside `awardWin` (order within the object doesn't matter; comma-separate the two methods):

```js
const ReceiptSystem = {
  maybeTriggerReceipt(game) {
    const ogName = game.getJudge().name;
    const candidates = [];
    for (const p of game.players) {
      if (p.name === ogName) continue;
      for (const r of p.receipts) {
        if (r.status === 'active') candidates.push({ receipt: r, owner: p });
      }
    }
    if (candidates.length === 0) return null;
    if (Math.random() >= 0.35) return null;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      receiptId: pick.receipt.id,
      ownerName: pick.owner.name,
      resolutionPrompt: pick.receipt.resolutionPrompt
    };
  },

  awardWin(game, winner) {
    winner.stats.reputation += 1;
    const activeCount = winner.receipts.filter(r => r.status === 'active').length;
    if (activeCount >= 5) return;
    const held = new Set(winner.receipts.filter(r => r.status === 'active').map(r => r.poolId));
    const options = RECEIPT_POOL.filter(entry => !held.has(entry.id));
    const pool = options.length > 0 ? options : RECEIPT_POOL;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    winner.receipts.push({
      id: `${chosen.id}-${game.round}-${winner.name}`,
      poolId: chosen.id,
      earnText: chosen.earnText,
      resolutionPrompt: chosen.resolutionPrompt,
      roundEarned: game.round,
      status: 'active'
    });
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/receipt-system-trigger-selection.test.js`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass (13 tests total so far).

- [ ] **Step 6: Commit**

```bash
git add index.html test/receipt-system-trigger-selection.test.js
git commit -m "feat: implement ReceiptSystem.maybeTriggerReceipt"
```

---

## Task 5: Wire `maybeTriggerReceipt` into `Game.nextBlack()`

**Files:**
- Modify: `index.html` (`Game.nextBlack`, lines 340-349)
- Create: `test/game-next-black-receipt-integration.test.js`

**Interfaces:**
- Consumes: `ReceiptSystem.maybeTriggerReceipt` (Task 4).
- Produces: when a receipt triggers, `game.currentBlack` becomes `{ raw, prompt, hasDice: false, effect: null, receiptTrigger: { receiptId, ownerName, resolutionPrompt } }` where `raw === prompt === ` the receipt's `resolutionPrompt`; the existing dice-effect roll and `blackDeck.draw()` are skipped entirely that round. When no receipt triggers, behavior is byte-for-byte identical to today (no `receiptTrigger` key present on `currentBlack`).

- [ ] **Step 1: Write the failing tests**

Create `test/game-next-black-receipt-integration.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app');

function withMockedRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try { fn(); } finally { Math.random = original; }
}

test('nextBlack uses the receipt resolution prompt and skips the dice roll when a receipt triggers', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.judgeIndex = 0;
  game.round = 1;
  game.players[1].receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Alice ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0, () => {
    game.nextBlack();
  });
  assert.equal(game.currentBlack.prompt, 'Alice ____');
  assert.equal(game.currentBlack.raw, 'Alice ____');
  assert.equal(game.currentBlack.hasDice, false);
  assert.deepEqual(game.currentBlack.receiptTrigger, { receiptId: 'r1', ownerName: 'Alice', resolutionPrompt: 'Alice ____' });
});

test('nextBlack draws a normal black card when no receipt triggers', () => {
  const { Game, BLACK_CARDS } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.judgeIndex = 0;
  game.round = 1;
  withMockedRandom(0.99, () => {
    game.nextBlack();
  });
  assert.equal(game.currentBlack.receiptTrigger, undefined);
  assert.ok(BLACK_CARDS.includes(game.currentBlack.raw));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/game-next-black-receipt-integration.test.js`
Expected: FAIL on the first test — `game.currentBlack.receiptTrigger` is `undefined` (not the expected object), since `nextBlack` doesn't consult `ReceiptSystem` yet. Second test passes already (existing behavior unchanged) — that's fine, it's asserting behavior that shouldn't need to change.

- [ ] **Step 3: Wire `maybeTriggerReceipt` into `nextBlack`**

In `index.html`, replace:
```js
  nextBlack() {
    const raw = this.blackDeck.draw();
    const hasDice = Math.random() < 0.35;
    const effect = hasDice ? DICE_EFFECTS[Math.floor(Math.random()*DICE_EFFECTS.length)] : null;
    const prompt = effect ? effect.fx(raw) : raw;
    this.currentBlack = { raw, prompt, hasDice, effect };
    this.diceEffect = effect;
    this.submissions = [];
    this.selected = new Set();
  }
```
with:
```js
  nextBlack() {
    const trigger = ReceiptSystem.maybeTriggerReceipt(this);
    if (trigger) {
      this.currentBlack = {
        raw: trigger.resolutionPrompt, prompt: trigger.resolutionPrompt,
        hasDice: false, effect: null, receiptTrigger: trigger
      };
      this.diceEffect = null;
      this.submissions = [];
      this.selected = new Set();
      return;
    }
    const raw = this.blackDeck.draw();
    const hasDice = Math.random() < 0.35;
    const effect = hasDice ? DICE_EFFECTS[Math.floor(Math.random()*DICE_EFFECTS.length)] : null;
    const prompt = effect ? effect.fx(raw) : raw;
    this.currentBlack = { raw, prompt, hasDice, effect };
    this.diceEffect = effect;
    this.submissions = [];
    this.selected = new Set();
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/game-next-black-receipt-integration.test.js`
Expected: `# pass 2`, `# fail 0`

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass (15 tests total so far).

- [ ] **Step 6: Commit**

```bash
git add index.html test/game-next-black-receipt-integration.test.js
git commit -m "feat: trigger Receipt resolution rounds from Game.nextBlack"
```

---

## Task 6: `ReceiptSystem.resolveTrigger` — resolve/fail branches

**Files:**
- Modify: `index.html` (add `resolveTrigger` to `ReceiptSystem`)
- Create: `test/receipt-system-resolve-trigger.test.js`

**Interfaces:**
- Consumes: `game.currentBlack.receiptTrigger` (Task 5), `game.getJudge()`.
- Produces: `ReceiptSystem.resolveTrigger(game, winner)` — no-op if `game.currentBlack.receiptTrigger` is unset or the referenced receipt/owner can't be found. If `winner.name === receiptTrigger.ownerName`: sets that receipt's `status = 'resolved'`, `winner.stats.reputation += 2`, and `game.getJudge().stats.reputation += 1`. Otherwise: sets the receipt's `status = 'failed'` and decrements all four of the **owner's** (not the winner's) stats by 1.

- [ ] **Step 1: Write the failing tests**

Create `test/receipt-system-resolve-trigger.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app');

function makeTriggeredGame(Game) {
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Owner');
  game.addPlayer('Other');
  game.judgeIndex = 0;
  game.round = 2;
  const owner = game.players[1];
  owner.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Owner ____', roundEarned: 1, status: 'active' });
  game.currentBlack = {
    raw: 'Owner ____', prompt: 'Owner ____', hasDice: false, effect: null,
    receiptTrigger: { receiptId: 'r1', ownerName: 'Owner', resolutionPrompt: 'Owner ____' }
  };
  return game;
}

test('resolveTrigger is a no-op when the round had no receipt trigger', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.judgeIndex = 0;
  game.currentBlack = { raw: 'x', prompt: 'x', hasDice: false, effect: null };
  const winner = game.players[1];
  ReceiptSystem.resolveTrigger(game, winner);
  assert.deepEqual(winner.stats, { streetCred: 0, community: 0, wisdom: 0, reputation: 0 });
});

test('resolveTrigger resolves the receipt and rewards owner + O.G. when the owner wins', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeTriggeredGame(Game);
  const owner = game.players[1];
  const judge = game.players[0];
  ReceiptSystem.resolveTrigger(game, owner);
  assert.equal(owner.receipts[0].status, 'resolved');
  assert.equal(owner.stats.reputation, 2);
  assert.equal(judge.stats.reputation, 1);
});

test('resolveTrigger fails the receipt and penalizes the owner when someone else wins', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeTriggeredGame(Game);
  const owner = game.players[1];
  const other = game.players[2];
  const judge = game.players[0];
  ReceiptSystem.resolveTrigger(game, other);
  assert.equal(owner.receipts[0].status, 'failed');
  assert.deepEqual(owner.stats, { streetCred: -1, community: -1, wisdom: -1, reputation: -1 });
  assert.equal(judge.stats.reputation, 0);
  assert.deepEqual(other.stats, { streetCred: 0, community: 0, wisdom: 0, reputation: 0 });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/receipt-system-resolve-trigger.test.js`
Expected: FAIL — `TypeError: ReceiptSystem.resolveTrigger is not a function`

- [ ] **Step 3: Implement `resolveTrigger`**

In `index.html`, replace the entire `ReceiptSystem` object literal (as left by Task 4) with the full three-method version:

```js
const ReceiptSystem = {
  maybeTriggerReceipt(game) {
    const ogName = game.getJudge().name;
    const candidates = [];
    for (const p of game.players) {
      if (p.name === ogName) continue;
      for (const r of p.receipts) {
        if (r.status === 'active') candidates.push({ receipt: r, owner: p });
      }
    }
    if (candidates.length === 0) return null;
    if (Math.random() >= 0.35) return null;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      receiptId: pick.receipt.id,
      ownerName: pick.owner.name,
      resolutionPrompt: pick.receipt.resolutionPrompt
    };
  },

  resolveTrigger(game, winner) {
    const trigger = game.currentBlack && game.currentBlack.receiptTrigger;
    if (!trigger) return;
    const owner = game.players.find(p => p.name === trigger.ownerName);
    if (!owner) return;
    const receipt = owner.receipts.find(r => r.id === trigger.receiptId && r.status === 'active');
    if (!receipt) return;
    if (winner.name === trigger.ownerName) {
      receipt.status = 'resolved';
      winner.stats.reputation += 2;
      const og = game.getJudge();
      og.stats.reputation += 1;
    } else {
      receipt.status = 'failed';
      owner.stats.streetCred -= 1;
      owner.stats.community -= 1;
      owner.stats.wisdom -= 1;
      owner.stats.reputation -= 1;
    }
  },

  awardWin(game, winner) {
    winner.stats.reputation += 1;
    const activeCount = winner.receipts.filter(r => r.status === 'active').length;
    if (activeCount >= 5) return;
    const held = new Set(winner.receipts.filter(r => r.status === 'active').map(r => r.poolId));
    const options = RECEIPT_POOL.filter(entry => !held.has(entry.id));
    const pool = options.length > 0 ? options : RECEIPT_POOL;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    winner.receipts.push({
      id: `${chosen.id}-${game.round}-${winner.name}`,
      poolId: chosen.id,
      earnText: chosen.earnText,
      resolutionPrompt: chosen.resolutionPrompt,
      roundEarned: game.round,
      status: 'active'
    });
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/receipt-system-resolve-trigger.test.js`
Expected: `# pass 3`, `# fail 0`

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass (18 tests total so far).

- [ ] **Step 6: Commit**

```bash
git add index.html test/receipt-system-resolve-trigger.test.js
git commit -m "feat: implement ReceiptSystem.resolveTrigger"
```

---

## Task 7: Wire `resolveTrigger` + `awardWin` into `app.chooseWinner`

**Files:**
- Modify: `index.html` (`app.chooseWinner`, lines 619-630)
- Create: `test/receipt-round-integration.test.js`

**Interfaces:**
- Consumes: `ReceiptSystem.resolveTrigger`, `ReceiptSystem.awardWin` (Tasks 3 and 6).
- Produces: no new exports — this task locks in the call **order** (`resolveTrigger` before `awardWin`) with a regression test that exercises both functions together the same way `app.chooseWinner` will, then applies the equivalent change to `app.chooseWinner` itself. `app.chooseWinner` is not unit tested directly (it touches `document.getElementById`, out of scope per the spec) — production correctness there is covered by code matching this already-tested sequence, the existing `npm test` smoke parse check, and manual QA in Step 6.

- [ ] **Step 1: Write the failing test**

Create `test/receipt-round-integration.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app');

test('resolving a receipt frees a cap slot for a new receipt in the same round (resolveTrigger before awardWin)', () => {
  const { Game, ReceiptSystem, RECEIPT_POOL } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Owner');
  game.judgeIndex = 0;
  game.round = 2;
  const owner = game.players[1];
  owner.receipts.push({ id: 'r1', poolId: RECEIPT_POOL[0].id, earnText: 'x', resolutionPrompt: 'Owner ____', roundEarned: 1, status: 'active' });
  for (let i = 1; i < 5; i++) {
    owner.receipts.push({
      id: `seed-${i}`, poolId: RECEIPT_POOL[i].id,
      earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 1, status: 'active'
    });
  }
  assert.equal(owner.receipts.filter(r => r.status === 'active').length, 5);
  game.currentBlack = {
    raw: 'Owner ____', prompt: 'Owner ____', hasDice: false, effect: null,
    receiptTrigger: { receiptId: 'r1', ownerName: 'Owner', resolutionPrompt: 'Owner ____' }
  };

  ReceiptSystem.resolveTrigger(game, owner);
  ReceiptSystem.awardWin(game, owner);

  const active = owner.receipts.filter(r => r.status === 'active');
  assert.equal(active.length, 5, 'the resolved slot should have been immediately refilled by the same-round awardWin');
  assert.equal(owner.stats.reputation, 3, 'baseline +1 from awardWin plus +2 from resolving');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/receipt-round-integration.test.js`
Expected: this specific scenario should already pass if Tasks 3-6 were implemented correctly (it's a regression/integration test, not new behavior) — run it now to confirm; if it fails, it means Task 3's `awardWin` cap check isn't reading the post-resolve active count correctly, which must be fixed before continuing (re-check Task 3 Step 3's implementation matches exactly).

Expected result at this point: `# pass 1`, `# fail 0` (this test should already be green — it's here to lock in the ordering as a named regression test, not to drive new implementation).

- [ ] **Step 3: Wire the calls into `app.chooseWinner`**

In `index.html`, replace:
```js
  chooseWinner(index) {
    const win = this.game.submissions[index];
    const winner = this.game.players.find(p => p.name === win.player);
    if (winner) winner.points++;
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerCard').textContent = win.card;
    document.getElementById('winnerMeta').textContent = `${this.game.currentBlack.prompt}`;
    this.show('roundResult');
    if (winner.points >= this.game.pointsToWin) {
      setTimeout(() => this.endGame(winner), 800);
    }
  },
```
with:
```js
  chooseWinner(index) {
    const win = this.game.submissions[index];
    const winner = this.game.players.find(p => p.name === win.player);
    if (winner) {
      winner.points++;
      ReceiptSystem.resolveTrigger(this.game, winner);
      ReceiptSystem.awardWin(this.game, winner);
    }
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerCard').textContent = win.card;
    document.getElementById('winnerMeta').textContent = `${this.game.currentBlack.prompt}`;
    this.show('roundResult');
    if (winner.points >= this.game.pointsToWin) {
      setTimeout(() => this.endGame(winner), 800);
    }
  },
```

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all tests pass (19 tests total). The smoke check's `new Function(m[1])` parse of the full inline script confirms `chooseWinner`'s new code is syntactically valid.

- [ ] **Step 5: Manual browser QA (no automated DOM test exists in this project)**

- [ ] Run `node server/server.js`
- [ ] Open `http://localhost:3001` in a browser
- [ ] Start an offline game with 3 players, play through at least 3 full rounds (submit a card as each non-judge player each round, then pick a winner as judge)
- [ ] Confirm: no errors in the browser console, round results screen still shows winner name/card/prompt correctly, "Next Round" still advances the game, scoreboard still updates
- [ ] Stop the server (Ctrl+C)

- [ ] **Step 6: Commit**

```bash
git add index.html test/receipt-round-integration.test.js
git commit -m "feat: wire ReceiptSystem into app.chooseWinner"
```

---

## Task 8: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite one more time from a clean state**

Run: `npm install && npm test`
Expected: `client JS OK`, `server JS OK`, `server file present`, then `node --test` reporting `# pass 19`, `# fail 0` (across `test/game-loader.smoke.test.js`, `test/receipt-pool-and-player-model.test.js`, `test/receipt-system-award-win.test.js`, `test/receipt-system-trigger-selection.test.js`, `test/game-next-black-receipt-integration.test.js`, `test/receipt-system-resolve-trigger.test.js`, `test/receipt-round-integration.test.js`).

- [ ] **Step 2: Confirm the server still starts cleanly**

Run: `node server/server.js` (then Ctrl+C to stop)
Expected: `Concrete Kings server running at http://localhost:3001` with no errors.

- [ ] **Step 3: Re-read the spec's Testing Plan section and confirm every listed item is covered**

Cross-check against `docs/superpowers/specs/2026-08-04-stats-and-receipts-system-design.md`'s "Testing Plan" list:
- [ ] Baseline `+1 reputation` on every win — `test/receipt-system-award-win.test.js`
- [ ] 5-active-receipt cap respected — `test/receipt-system-award-win.test.js`
- [ ] `maybeTriggerReceipt` never selects an O.G.-owned receipt — `test/receipt-system-trigger-selection.test.js`
- [ ] Resolve branch gives +2 to owner and +1 to O.G., receipt status `resolved` — `test/receipt-system-resolve-trigger.test.js`
- [ ] Fail branch gives -1 all stats to owner (not winner), receipt status `failed` — `test/receipt-system-resolve-trigger.test.js`
- [ ] A resolved/failed receipt never re-triggers — `test/receipt-system-trigger-selection.test.js` ("ignores resolved and failed receipts")

No new tasks needed if all boxes check out.
