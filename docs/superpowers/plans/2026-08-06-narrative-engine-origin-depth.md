# Narrative Engine Origin Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the human player's chosen origin, a one-use "Force Redo" ability, and a secrets system meaningfully affect the Solo Campaign / Noir Prototype narrative engine.

**Architecture:** All new state and rules logic live in `NarrativeStoryEngine` (`src/pixel_engine/story-engine.js`), which stays a plain, DOM-free class fully covered by `test/story-engine.test.js`. `index.html`'s inline `app` object is updated only to pass the chosen origin into the engine, add a "Force Redo" button to the judging screen, and surface secrets on the ending readout — no new game rules live in `index.html`.

**Tech Stack:** Vanilla JS (no framework), Node's built-in test runner (`node --test`), the existing `NarrativeStoryEngine` class and `NARRATIVE_WHITE_DECK`/`NARRATIVE_BEATS`/`ENDINGS` data structures.

## Global Constraints

- Do not change `NARRATIVE_BEATS` story text/titles, the beat count (5), or
  the 5 tag categories (`street`/`family`/`church`/`food`/`humor`).
- Do not add per-NPC trust or otherwise change `trust`/`heat` from single
  numbers.
- Only the human judge's origin affects consequences — bot origins
  (Barber/Local Legend/Corner Merchant on the 3 AI players) never get a
  bonus.
- Do not resurrect or reference the `CLAUDE_CODE_PROMPT.md` spec (Uncle
  Ray/Marquez/Jada story) — it is retired and out of scope.
- The 5 existing tests in `test/story-engine.test.js` must continue to pass
  unmodified — `reset()` must still work with zero arguments.
- No new files — all changes go into `src/pixel_engine/story-engine.js`,
  `index.html`, and `test/story-engine.test.js`.

---

### Task 1: Origin passive bonus

**Files:**
- Modify: `src/pixel_engine/story-engine.js`
- Test: `test/story-engine.test.js`

**Interfaces:**
- Consumes: existing `NARRATIVE_BEATS[beat].tagConsequences[category]` shape
  `{ heat, trust, text }` (unchanged).
- Produces: `ORIGIN_TAG_AFFINITY` (plain object, origin key → tag string),
  exported alongside the existing exports. `NarrativeStoryEngine.reset(originKey = null)`
  (new optional parameter, backward compatible with the existing
  zero-argument calls). `engine.origin` (string or `null`) — read by Task 4's
  UI wiring but not required by it.

- [ ] **Step 1: Write the failing tests**

Add to `test/story-engine.test.js` (after the existing 5 tests, same file,
same `require` line already imports `NarrativeStoryEngine`, `NARRATIVE_BEATS`,
`ENDINGS` — add `ORIGIN_TAG_AFFINITY` to that destructure):

```js
test('Story Engine: exposes an origin-to-tag affinity table for all 8 origins', () => {
  assert.deepEqual(ORIGIN_TAG_AFFINITY, {
    BARBER: 'family',
    STREET_SCHOLAR: 'church',
    LOCAL_LEGEND: 'street',
    CORNER_MERCHANT: 'food',
    COMMUNITY_ORGANIZER: 'family',
    UNDERGROUND_DJ: 'humor',
    BLOCK_ARCHITECT: 'church',
    HUSTLE_VETERAN: 'street',
  });
});

test('Story Engine: reset() with no origin keeps existing zero-arg behavior', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  assert.equal(engine.origin, null);
});

test('Story Engine: origin bonus reduces heat and boosts trust when winning tag matches affinity', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('LOCAL_LEGEND'); // ORIGIN_TAG_AFFINITY.LOCAL_LEGEND === 'street'
  // Beat 1 street card base consequence: heat +1, trust +0
  const result = engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  assert.equal(engine.heat, 0, 'bonus should reduce the +1 base heat down to 0');
  assert.equal(engine.trust, 1, 'bonus should add +1 on top of the +0 base trust');
  assert.equal(result.ended, false);
});

test('Story Engine: origin bonus does not apply when winning tag does not match affinity', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('BARBER'); // ORIGIN_TAG_AFFINITY.BARBER === 'family'
  // Beat 1 street card base consequence: heat +1, trust +0 (BARBER favors family, not street)
  const result = engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  assert.equal(engine.heat, 1, 'no bonus: heat should equal the base +1');
  assert.equal(engine.trust, 0, 'no bonus: trust should equal the base +0');
  assert.equal(result.ended, false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/story-engine.test.js`
Expected: FAIL — `ORIGIN_TAG_AFFINITY is not defined` (or `undefined` from
the destructure) and `engine.origin` is `undefined` instead of `null`.

- [ ] **Step 3: Implement**

In `src/pixel_engine/story-engine.js`, add the affinity table right after
the `ENDINGS` object (before the `NarrativeStoryEngine` class):

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

Update the constructor to initialize the new field:

```js
  constructor() {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = false;
    this.history = [];
    this.origin = null;
  }
```

Update `reset()` to accept an optional origin key:

```js
  reset(originKey = null) {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = true;
    this.history = [];
    this.origin = originKey;
  }
```

Update `applyWinnerCard` to apply the bonus before clamping heat/trust
(replace the two lines that compute `this.heat`/`this.trust`):

```js
    const consequence = currentBeatData.tagConsequences[category] || { heat: 0, trust: 0, text: "Nothing happens." };
    const originBonus = this.origin && ORIGIN_TAG_AFFINITY[this.origin] === category;
    let heatDelta = consequence.heat;
    let trustDelta = consequence.trust;
    if (originBonus) {
      if (heatDelta > 0) heatDelta -= 1;
      trustDelta += 1;
    }
    this.heat = Math.max(0, this.heat + heatDelta);
    this.trust = Math.max(0, this.trust + trustDelta);
```

Add `ORIGIN_TAG_AFFINITY` to both export blocks at the bottom of the file:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NarrativeStoryEngine,
    NARRATIVE_BEATS,
    NARRATIVE_WHITE_DECK,
    ENDINGS,
    ORIGIN_TAG_AFFINITY
  };
}

if (typeof window !== 'undefined') {
  window.NarrativeStoryEngine = NarrativeStoryEngine;
  window.NARRATIVE_BEATS = NARRATIVE_BEATS;
  window.NARRATIVE_WHITE_DECK = NARRATIVE_WHITE_DECK;
  window.ENDINGS = ENDINGS;
  window.ORIGIN_TAG_AFFINITY = ORIGIN_TAG_AFFINITY;
}
```

Update the test file's require line to pull in the new export:

```js
const { NarrativeStoryEngine, NARRATIVE_BEATS, ENDINGS, ORIGIN_TAG_AFFINITY } = require('../src/pixel_engine/story-engine.js');
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/story-engine.test.js`
Expected: PASS — all 9 tests (5 original + 4 new) green.

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/story-engine.js test/story-engine.test.js
git commit -m "feat: add origin passive bonus to narrative story engine"
```

---

### Task 2: Force Redo ability tracking

**Files:**
- Modify: `src/pixel_engine/story-engine.js`
- Test: `test/story-engine.test.js`

**Interfaces:**
- Consumes: `this.specialAbilityUsed` (new field, set in `reset()`).
- Produces: `engine.markAbilityUsed()` — returns `true` and flips
  `specialAbilityUsed` to `true` on first call, returns `false` (no state
  change) on every call after. Task 4's UI calls this directly; the engine
  does not touch submissions/hands — that stays in `index.html`.

- [ ] **Step 1: Write the failing test**

Add to `test/story-engine.test.js`:

```js
test('Story Engine: markAbilityUsed succeeds once then reports already used', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  assert.equal(engine.specialAbilityUsed, false);
  assert.equal(engine.markAbilityUsed(), true);
  assert.equal(engine.specialAbilityUsed, true);
  assert.equal(engine.markAbilityUsed(), false, 'second call must fail, ability already used');
  assert.equal(engine.specialAbilityUsed, true, 'state must stay used after the failed second call');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/story-engine.test.js`
Expected: FAIL — `engine.markAbilityUsed is not a function`.

- [ ] **Step 3: Implement**

Add `this.specialAbilityUsed = false;` to both the constructor and `reset()`
in `src/pixel_engine/story-engine.js`:

```js
  constructor() {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = false;
    this.history = [];
    this.origin = null;
    this.specialAbilityUsed = false;
  }

  reset(originKey = null) {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = true;
    this.history = [];
    this.origin = originKey;
    this.specialAbilityUsed = false;
  }
```

Add the new method anywhere inside the class, e.g. right after `reset()`:

```js
  markAbilityUsed() {
    if (this.specialAbilityUsed) return false;
    this.specialAbilityUsed = true;
    return true;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/story-engine.test.js`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/story-engine.js test/story-engine.test.js
git commit -m "feat: add one-use special ability tracking to narrative story engine"
```

---

### Task 3: Secrets system and The Insider ending

**Files:**
- Modify: `src/pixel_engine/story-engine.js`
- Test: `test/story-engine.test.js`

**Interfaces:**
- Consumes: `NARRATIVE_WHITE_DECK` entries (existing shape
  `{ text, category }`, extended with an optional `secret: true` flag on 5
  entries plus 1 new food-category entry).
- Produces: `engine.secrets` (array of strings, the `text` of each
  secret-flagged card won so far, deduplicated). `ENDINGS.insider`
  (`{ title: "THE INSIDER", text: string }`). Ending resolution in
  `applyWinnerCard` now checks `secrets.length >= 2` before the existing
  heat/trust checks.

- [ ] **Step 1: Write the failing tests**

Add to `test/story-engine.test.js`:

```js
test('Story Engine: winning a secret-flagged card records it without duplicates', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  engine.applyWinnerCard("A stolen police scanner buzzing with codes");
  assert.deepEqual(engine.secrets, ["A stolen police scanner buzzing with codes"]);
  engine.applyWinnerCard("A stolen police scanner buzzing with codes");
  assert.deepEqual(engine.secrets, ["A stolen police scanner buzzing with codes"], 'duplicate secret must not be recorded twice');
});

test('Story Engine: 2+ secrets unlock The Insider ending even with high heat', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();

  // Beats 1-2: earn two distinct secrets
  engine.applyWinnerCard("A stolen police scanner buzzing with codes"); // street secret
  engine.applyWinnerCard("Your cousin's neighborhood security warning"); // family secret

  // Beats 3-5: pile on heat via street cards, which alone would trigger The Trap ending
  engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  const result = engine.applyWinnerCard("A Glock 19 with the serial scratched off");

  assert.equal(engine.secrets.length, 2);
  assert.equal(result.ended, true);
  assert.equal(result.endingTitle, "THE INSIDER");
  assert.ok(result.endingText.includes("secrets"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/story-engine.test.js`
Expected: FAIL — `engine.secrets` is `undefined`, and the second test's
`result.endingTitle` is `"THE TRAP"` instead of `"THE INSIDER"`.

- [ ] **Step 3: Implement**

In `src/pixel_engine/story-engine.js`, flag the 5 secret cards and add the
1 new food-category secret card inside `NARRATIVE_WHITE_DECK` (only the
listed lines change; every other entry in the array stays as-is):

```js
const NARRATIVE_WHITE_DECK = [
  { text: "A Glock 19 with the serial scratched off", category: "street" },
  { text: "A brick of unregistered burner phones", category: "street" },
  { text: "Wad of dirty cash wrapped in rubber bands", category: "street" },
  { text: "Graffiti tags freshly painted on the bodega gate", category: "street" },
  { text: "A stolen police scanner buzzing with codes", category: "street", secret: true },

  { text: "Grandma's secret sweet potato pie recipe", category: "family" },
  { text: "A warm hug from Mama Gloria", category: "family" },
  { text: "Collard greens seasoned with smoked ham hock", category: "family" },
  { text: "An old family photo inside a cracked frame", category: "family" },
  { text: "Your cousin's neighborhood security warning", category: "family", secret: true },

  { text: "A blessed prayer oil bottle from the usher board", category: "church" },
  { text: "Sunday service program signed by the pastor", category: "church", secret: true },
  { text: "The choir robe embroidered deacon patch", category: "church" },
  { text: "A booming gospel hymn sung from the heart", category: "church" },
  { text: "A collection plate filled with loose quarters", category: "church" },

  { text: "A bag of hot fries and a blue drink", category: "food" },
  { text: "Uncooked chopped cheese ingredients", category: "food" },
  { text: "A greasy bag of corner chicken wings", category: "food" },
  { text: "Ice-cold sweet tea brewed in a gallon milk jug", category: "food" },
  { text: "A bodega ledger with names you shouldn't know", category: "food", secret: true },

  { text: "A TikTok dancer doing the hustle on 125th", category: "humor" },
  { text: "A master barber doing a line-up with a dull blade", category: "humor" },
  { text: "A loud stoop conversation about absolutely nothing", category: "humor" },
  { text: "An uncle claiming he used to run with the Panthers", category: "humor", secret: true }
];
```

Add the `insider` ending to `ENDINGS` (alongside `trap`/`exit`/`hustle`):

```js
const ENDINGS = {
  trap: {
    title: "THE TRAP",
    text: "The alley lights flash red and blue. Marcus is tackled, and before you can drop the package, handcuffs click cold around your wrists. Too much Heat. You are dragged into the precinct cruiser as 125th Street watches in silence. A street noir tragedy."
  },
  exit: {
    title: "THE EXIT",
    text: "Marcus nods, grabs the package, and pushes you through a secret floor grate just as the police breech. You crawl into the subway lines and emerge under the morning sun with your cut of the money. High Trust. You made it out clean. You exited the cycle."
  },
  hustle: {
    title: "THE HUSTLE",
    text: "In the chaos, the package is dropped, and you scramble out of the warehouse side vent. Marcus vanishes. The cops find nothing. By tomorrow morning, you are right back on the stoop, counting small bills, planning the next run. Balanced stats. The grind goes on."
  },
  insider: {
    title: "THE INSIDER",
    text: "You never picked a side. Street, family, church, corner store — you just kept your ears open and your mouth shut. When the dust settles on 125th, you walk away without the package and without a scratch. What you've got is better than cash: you know where every body on this block is buried. Marcus doesn't own you. You own his secrets."
  }
};
```

Add `this.secrets = [];` to both the constructor and `reset()`:

```js
  constructor() {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = false;
    this.history = [];
    this.origin = null;
    this.specialAbilityUsed = false;
    this.secrets = [];
  }

  reset(originKey = null) {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = true;
    this.history = [];
    this.origin = originKey;
    this.specialAbilityUsed = false;
    this.secrets = [];
  }
```

In `applyWinnerCard`, record the secret right after the heat/trust
assignment, and check secrets first in the beat-5 ending branch:

```js
    if (matchedCard && matchedCard.secret && !this.secrets.includes(matchedCard.text)) {
      this.secrets.push(matchedCard.text);
    }

    this.history.push({
      beat: this.beat,
      card: cardText,
      category,
      consequenceText: consequence.text
    });

    if (this.beat >= 5) {
      let endingKey = "hustle";
      if (this.secrets.length >= 2) endingKey = "insider";
      else if (this.heat >= 3) endingKey = "trap";
      else if (this.trust >= 3) endingKey = "exit";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/story-engine.test.js`
Expected: PASS — all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/story-engine.js test/story-engine.test.js
git commit -m "feat: add secrets system and The Insider ending to narrative story engine"
```

---

### Task 4: Wire origin, Force Redo, and secrets into the UI

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `NarrativeStoryEngine.reset(originKey)` (Task 1),
  `engine.markAbilityUsed()` / `engine.specialAbilityUsed` (Task 2),
  `engine.secrets` (Task 3) — all already implemented and tested.
- Produces: no new interfaces for other tasks to consume; this is the final,
  UI-facing task.

This task edits `index.html`'s inline `app` object only. There is no
DOM-level automated test harness in this repo (`test/helpers/load-app.js`
loads the script into a Node `vm` context with no `document` global — see
`test/campaign-mode.test.js`, which only calls DOM-free methods like
`evaluateCardSynergy`). Verification here is manual, matching how prior
`index.html` UI wiring in this repo has always been verified.

- [ ] **Step 1: Pass the chosen origin into the engine**

In `index.html`, find `startNoirPrototype()` (currently begins around line
3651). Move the `originKey` lookup above the engine reset and pass it in:

Before:
```js
  startNoirPrototype() {
    this.storyEngine = new NarrativeStoryEngine();
    this.storyEngine.reset();
    
    this.game = new Game();
    this.game.mode = MODE.OFFLINE;
    this.game.isCampaign = false;
    this.game.pointsToWin = 99;
    
    const myName = document.getElementById('hostName').value.trim() || 'Player';
    this.game.players = [];
    this.game.addPlayer(myName);
    this.game.addPlayer("O.G. Big Dave (Master Barber)");
    this.game.addPlayer("Stoop Homie");
    this.game.addPlayer("Bodega Clerk");
    
    const originKey = document.getElementById('characterOriginSelect').value;
    this.game.players[0].origin = originKey;
```

After:
```js
  startNoirPrototype() {
    const originKey = document.getElementById('characterOriginSelect').value;
    this.storyEngine = new NarrativeStoryEngine();
    this.storyEngine.reset(originKey);
    
    this.game = new Game();
    this.game.mode = MODE.OFFLINE;
    this.game.isCampaign = false;
    this.game.pointsToWin = 99;
    
    const myName = document.getElementById('hostName').value.trim() || 'Player';
    this.game.players = [];
    this.game.addPlayer(myName);
    this.game.addPlayer("O.G. Big Dave (Master Barber)");
    this.game.addPlayer("Stoop Homie");
    this.game.addPlayer("Bodega Clerk");
    
    this.game.players[0].origin = originKey;
```

(The 3 lines assigning bot origins right after stay unchanged.)

- [ ] **Step 2: Add the Force Redo button to the judging screen**

Find `enterJudging()` (currently around line 2912):

Before:
```js
  enterJudging() {
    this.show('judging');
    const subEl = document.getElementById('submissions');
    subEl.innerHTML = '';
    this.game.submissions.forEach((s, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 240;
      canvas.className = 'pixel-card-canvas';
      canvas.onclick = () => {
        if (this.isJudge()) this.chooseWinner(i);
      };
      subEl.appendChild(canvas);
    });
    
    this.updateCanvasCards();
    
    document.getElementById('judgeNotice').innerHTML = `
      ${this.isJudge() ? '<b>Judge time.</b> Tap a submission to crown it.' : 'Judge is picking...'}<br/>
      <span class="muted">Weather: ${this.game.weatherMode}${this.game.currentAlliance ? ' | Alliance active' : ''}</span>
    `;
  },
```

After:
```js
  enterJudging() {
    this.show('judging');
    const subEl = document.getElementById('submissions');
    subEl.innerHTML = '';
    const canRedo = !!(this.storyEngine && this.storyEngine.active && !this.storyEngine.specialAbilityUsed);
    this.game.submissions.forEach((s, i) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '4px';

      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 240;
      canvas.className = 'pixel-card-canvas';
      canvas.onclick = () => {
        if (this.isJudge()) this.chooseWinner(i);
      };
      wrapper.appendChild(canvas);

      if (canRedo) {
        const redoBtn = document.createElement('button');
        redoBtn.className = 'secondary';
        redoBtn.textContent = 'Force Redo';
        redoBtn.style.fontSize = '9px';
        redoBtn.onclick = (evt) => {
          evt.stopPropagation();
          this.forceRedoSubmission(i);
        };
        wrapper.appendChild(redoBtn);
      }

      subEl.appendChild(wrapper);
    });
    
    this.updateCanvasCards();
    
    document.getElementById('judgeNotice').innerHTML = `
      ${this.isJudge() ? '<b>Judge time.</b> Tap a submission to crown it.' : 'Judge is picking...'}<br/>
      <span class="muted">Weather: ${this.game.weatherMode}${this.game.currentAlliance ? ' | Alliance active' : ''}</span>
    `;
  },

  forceRedoSubmission(index) {
    if (!this.storyEngine || !this.storyEngine.markAbilityUsed()) return;
    const sub = this.game.submissions[index];
    if (!sub) return;
    const player = this.game.players.find(p => p.name === sub.player);
    if (!player) return;

    const promptText = this.game.currentBlack ? this.game.currentBlack.prompt : '';
    let bestIdx = 0;
    let bestScore = -999;
    player.hand.forEach((card, cIdx) => {
      const score = this.evaluateCardSynergy(player.name, card, promptText);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = cIdx;
      }
    });

    const newCard = player.hand[bestIdx];
    player.hand.splice(bestIdx, 1);
    this.game.refillHand(player);
    sub.card = newCard;

    this.enterJudging();
  },
```

This keeps `updateCanvasCards()` working unmodified: it selects submission
canvases with `submissionsEl.querySelectorAll('canvas')`, which still finds
them in document order regardless of the new wrapper `<div>`.

- [ ] **Step 3: Show secrets on the ending readout**

Find the `ended` branch inside `chooseWinner(index)` (currently around line
2942):

Before:
```js
      if (result.ended) {
        document.getElementById('winnerName').textContent = result.endingTitle;
        document.getElementById('winnerCard').textContent = result.endingText;
        document.getElementById('winnerMeta').textContent = `FINAL STATS: HEAT ${this.storyEngine.heat} | TRUST ${this.storyEngine.trust}`;
        
        const nextBtn = document.querySelector('#roundResult button');
        if (nextBtn) {
          nextBtn.setAttribute('onclick', 'app.endNarrativeGame()');
          nextBtn.textContent = 'BACK TO STOOP';
        }
      } else {
```

After:
```js
      if (result.ended) {
        document.getElementById('winnerName').textContent = result.endingTitle;
        document.getElementById('winnerCard').textContent = result.endingText;
        const secretsLine = this.storyEngine.secrets.length > 0
          ? ` | SECRETS: ${this.storyEngine.secrets.join('; ')}`
          : '';
        document.getElementById('winnerMeta').textContent = `FINAL STATS: HEAT ${this.storyEngine.heat} | TRUST ${this.storyEngine.trust}${secretsLine}`;
        
        const nextBtn = document.querySelector('#roundResult button');
        if (nextBtn) {
          nextBtn.setAttribute('onclick', 'app.endNarrativeGame()');
          nextBtn.textContent = 'BACK TO STOOP';
        }
      } else {
```

- [ ] **Step 4: Run the existing automated checks**

Run: `npm test`
Expected: PASS — the syntax check (`client JS OK`, `cards JS OK`,
`server JS OK`, `server file present`) and all `node --test` suites
(including the 12 `story-engine.test.js` tests from Tasks 1-3) stay green.
This confirms the `index.html` edits didn't break parseability or any
existing test, even though the new UI behavior itself needs manual
verification (Step 5).

- [ ] **Step 5: Manually verify in the browser**

The Solo Campaign / Noir Prototype mode runs fully offline
(`this.game.mode = MODE.OFFLINE` in `startNoirPrototype()`), so no server is
needed — open `index.html` directly in a browser (double-click it, or
`start index.html` from the repo root on Windows) and:

1. Start a Solo Campaign / Noir Prototype game, selecting an origin whose
   affinity is `street` (e.g. `LOCAL_LEGEND`).
2. On the first judging screen, confirm a small "Force Redo" button appears
   under each of the 3 submitted cards.
3. Click "Force Redo" under one submission; confirm that card is replaced
   with a different one and the button disappears from *all* submissions
   (ability is single-use per playthrough, not per-beat).
4. Pick a street-tagged card as the winner; confirm the heat readout in the
   narrative text box increases by 1 less than it would without the bonus
   (compare against the `tagConsequences` value in
   `src/pixel_engine/story-engine.js` for that beat/category).
5. Play through all 5 beats picking the "insider" secret-flagged card
   (`"A stolen police scanner buzzing with codes"`, `"Your cousin's
   neighborhood security warning"`, `"Sunday service program signed by the
   pastor"`, `"A bodega ledger with names you shouldn't know"`, or `"An
   uncle claiming he used to run with the Panthers"`) as the winner at least
   twice; confirm the ending screen shows "THE INSIDER" and the final stats
   line lists the secrets collected.
6. Confirm no console errors appear in the browser dev tools during the full
   playthrough.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: wire origin bonus, Force Redo ability, and secrets into narrative UI"
```
