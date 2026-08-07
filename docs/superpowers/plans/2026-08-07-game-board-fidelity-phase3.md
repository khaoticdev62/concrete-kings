# Game Board Fidelity — Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the real gaps in the Game Board wireframe (judging countdown, resolution auto-advance, ending-stats completeness, a Review Log) and give Card Selected and the Action Bar their wireframe-matching visual treatment, per `docs/superpowers/specs/2026-08-07-game-board-fidelity-design.md`.

**Architecture:** Two new timers (`enterJudging()`'s 12s auto-pick, `roundResult`'s 5s auto-advance) are plain `setTimeout`s stored on `app` and cleared wherever the round already resolves through an existing path, so they never fire after a real action. The Action Bar consolidates the already-working Block Map button into a dedicated bottom bar rather than duplicating it.

**Tech Stack:** Plain JS (`index.html`), `node --test` with `node:test`'s `mock.timers` (available in this repo's Node v22, confirmed working) for the two timer-driven behaviors, manual browser verification for the visual-only pieces (Card Selected zoom, Action Bar layout).

## Global Constraints

- No new dependencies, no build step.
- `app` is reachable from `node --test` via `loadGameModule().app` (per Phase 1's final review) — timer logic inside `app` methods is unit-testable with `mock.timers`, not manual-only.
- Follow existing code style exactly: inline `style="..."` attributes, existing `document.querySelector('#roundResult button')` pattern (already used in `chooseWinner()`), existing `setTimeout` usage pattern (already used in `chooseWinner()`'s `endGame` call).
- Do not add Inventory or Quest UI — no underlying system exists for either.

---

### Task 1: Card Selected — visual zoom treatment

**Files:**
- Modify: `index.html` — `.selected` CSS rule (find existing definition or add one), `renderHand()` (~line 3250)

**Interfaces:**
- Consumes: `this.game.selected` (existing `Set`).
- Produces: nothing new — pure visual layer over the existing selection state.

- [ ] **Step 1: Find or add the `.selected` CSS rule**

Run: `grep -n "\.selected" index.html` to find the existing `<style>` block's handling of `.pixel-card-canvas.selected` (or confirm none exists yet).

If a rule already exists, strengthen it to include a zoom transform; if none exists, add one in the `<style>` block near other `.pixel-card-canvas` rules:

```css
.pixel-card-canvas.selected {
  transform: scale(1.08);
  box-shadow: 0 0 12px rgba(255, 205, 104, 0.6);
  border: 2px solid #ffcd68;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
```

- [ ] **Step 2: Add a selection hint line in `renderHand()`**

Find:

```js
    this.updateCanvasCards();
    document.getElementById('submitBtn').disabled = this.game.selected.size === 0 || this.isJudge();
  },
```

Change to:

```js
    this.updateCanvasCards();
    document.getElementById('submitBtn').disabled = this.game.selected.size === 0 || this.isJudge();

    const hintEl = document.getElementById('handSelectionHint');
    if (hintEl) {
      hintEl.textContent = this.game.selected.size > 0
        ? 'Selected — press SUBMIT to play, or click the card again to deselect.'
        : '';
    }
  },
```

Then find (inside the hand area, right after the closing `</div>` of the `id="hand"` div):

```html
                <div id="hand" class="hand"></div>
              </div>
```

Change to:

```html
                <div id="hand" class="hand"></div>
                <div id="handSelectionHint" style="font-size:9px; color:#ffcd68; margin-top:6px; min-height:12px;"></div>
              </div>
```

- [ ] **Step 3: No automated test for this task**

This is a pure visual/CSS change with no new logic branch — run `node --test` to confirm the existing suite is unaffected.

Run: `node --test`
Expected: PASS, same count as before this task

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add zoom/glow treatment and a hint line to selected hand cards"
```

---

### Task 2: Judging countdown (12s auto-pick)

**Files:**
- Modify: `index.html` — `#judging` screen markup (~line 1044), `enterJudging()` (~line 3404), `chooseWinner()` (~line 3475, to clear the timer)

**Interfaces:**
- Consumes: `this.game.submissions` (existing array), `this.chooseWinner(index)` (existing method).
- Produces: `app.judgingTimerHandle` (the active `setTimeout` handle, or `null`), `app.judgingTimeLeft` (seconds remaining, for the visible countdown) — read by nothing outside this task, but exposed on `app` so tests can inspect/clear it directly.

- [ ] **Step 1: Write the failing test**

Create `test/judging-countdown.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeDocument() {
  const elements = {};
  const makeEl = () => ({
    textContent: '',
    innerHTML: '',
    style: {},
    setAttribute() {},
    appendChild() {},
    querySelectorAll() { return []; }
  });
  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl();
      return elements[id];
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

test('Judging countdown: auto-picks a random submission after 12 seconds if the judge has not acted', () => {
  mock.timers.enable({ apis: ['setTimeout', 'clearTimeout'] });
  try {
    const { app, Game } = loadGameModule();
    global.document = fakeDocument();

    app.game = new Game();
    app.game.addPlayer('Player');
    app.game.addPlayer('Bot');
    app.humanIndex = 0;
    app.game.judgeIndex = 0; // humanIndex is judge
    app.game.submissions = [{ player: 'Bot', card: 'Some card' }];
    app.storyEngine = null;
    app.show = () => {}; // stub screen transitions for this unit test

    let winnerIndexUsed = null;
    const originalChooseWinner = app.chooseWinner.bind(app);
    app.chooseWinner = (index) => { winnerIndexUsed = index; };

    app.enterJudging();
    assert.equal(winnerIndexUsed, null, 'should not resolve immediately');

    mock.timers.tick(12000);
    assert.equal(winnerIndexUsed, 0, 'should auto-pick the only submission after 12s');

    app.chooseWinner = originalChooseWinner;
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});

test('Judging countdown: does not fire if chooseWinner already ran', () => {
  mock.timers.enable({ apis: ['setTimeout', 'clearTimeout'] });
  try {
    const { app, Game } = loadGameModule();
    global.document = fakeDocument();

    app.game = new Game();
    app.game.addPlayer('Player');
    app.game.addPlayer('Bot');
    app.humanIndex = 0;
    app.game.judgeIndex = 0;
    app.game.submissions = [{ player: 'Bot', card: 'Some card' }];
    app.storyEngine = null;
    app.show = () => {};

    let callCount = 0;
    const originalChooseWinner = app.chooseWinner.bind(app);
    app.chooseWinner = (index) => { callCount++; };

    app.enterJudging();
    app.chooseWinner(0); // simulate the judge resolving early
    mock.timers.tick(12000);
    assert.equal(callCount, 1, 'auto-pick must not also fire after an early resolution');

    app.chooseWinner = originalChooseWinner;
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/judging-countdown.test.js`
Expected: FAIL — `enterJudging()` doesn't start a timer yet, `app.chooseWinner` (the stub) is never called by the tick.

- [ ] **Step 3: Implement — the visible timer element**

In `index.html`, find:

```html
      <p class="muted" style="margin-top:0;">All submissions are in. Pick the winning card from the cipher below.</p>
```

Change to:

```html
      <p class="muted" style="margin-top:0;">All submissions are in. Pick the winning card from the cipher below.</p>
      <div id="judgingTimerDisplay" style="font-family:'Press Start 2P', monospace; font-size:14px; color:#ffcd68; text-align:center; margin-bottom:8px;"></div>
```

- [ ] **Step 4: Implement — start the timer in `enterJudging()`**

Find the end of `enterJudging()`:

```js
    document.getElementById('judgeNotice').innerHTML = `
      ${this.isJudge() ? '<b>Judge time.</b> Tap a submission to crown it.' : 'Judge is picking...'}<br/>
      <span class="muted">Weather: ${this.game.weatherMode}${this.game.currentAlliance ? ' | Alliance active' : ''}</span>
    `;
  },
```

Change to:

```js
    document.getElementById('judgeNotice').innerHTML = `
      ${this.isJudge() ? '<b>Judge time.</b> Tap a submission to crown it.' : 'Judge is picking...'}<br/>
      <span class="muted">Weather: ${this.game.weatherMode}${this.game.currentAlliance ? ' | Alliance active' : ''}</span>
    `;

    this.startJudgingCountdown();
  },

  startJudgingCountdown() {
    this.clearJudgingCountdown();
    this.judgingTimeLeft = 12;
    const timerEl = document.getElementById('judgingTimerDisplay');
    if (timerEl) timerEl.textContent = `00:${String(this.judgingTimeLeft).padStart(2, '0')}`;

    this.judgingTimerHandle = setInterval(() => {
      this.judgingTimeLeft--;
      const el = document.getElementById('judgingTimerDisplay');
      if (el) el.textContent = `00:${String(Math.max(0, this.judgingTimeLeft)).padStart(2, '0')}`;

      if (this.judgingTimeLeft <= 0) {
        this.clearJudgingCountdown();
        if (this.game.submissions.length > 0) {
          const randomIndex = Math.floor(Math.random() * this.game.submissions.length);
          this.chooseWinner(randomIndex);
        }
      }
    }, 1000);
  },

  clearJudgingCountdown() {
    if (this.judgingTimerHandle) {
      clearInterval(this.judgingTimerHandle);
      this.judgingTimerHandle = null;
    }
  },
```

- [ ] **Step 5: Implement — clear the timer in `chooseWinner()`**

Find the very start of `chooseWinner(index)`:

```js
  chooseWinner(index) {
    if (this.storyEngine && this.storyEngine.active) {
```

Change to:

```js
  chooseWinner(index) {
    this.clearJudgingCountdown();
    if (this.storyEngine && this.storyEngine.active) {
```

- [ ] **Step 6: Adjust the test's timer API — reconcile `setInterval` vs `setTimeout`**

The implementation above uses `setInterval`, not `setTimeout` as the test file's `mock.timers.enable` call specifies. Update the test file's `mock.timers.enable({ apis: ['setTimeout', 'clearTimeout'] })` calls (both occurrences) to:

```js
mock.timers.enable({ apis: ['setInterval', 'clearInterval'] });
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `node --test test/judging-countdown.test.js`
Expected: PASS

Run: `node --test` (full suite)
Expected: PASS, no regressions

- [ ] **Step 8: Commit**

```bash
git add index.html test/judging-countdown.test.js
git commit -m "feat: add a visible 12s judging countdown that auto-picks a random submission"
```

---

### Task 3: Resolution auto-advance (5s or confirm)

**Files:**
- Modify: `index.html` — `chooseWinner()` (both branches, ~line 3475), `nextRound()` / `endNarrativeGame()` (to clear the timer on manual advance), the `#roundResult` and `#judging`/other-screen transitions that leave `roundResult` (to clear the timer if the player navigates away via `BACK TO TABLE`)

**Interfaces:**
- Consumes: `document.querySelector('#roundResult button')` (existing pattern, already used in `chooseWinner()` to set the button's `onclick`/text).
- Produces: `app.resolutionTimerHandle` — cleared by `nextRound()`, `endNarrativeGame()`, and `showGame()` (the `BACK TO TABLE` handler on the roundResult screen).

- [ ] **Step 1: Write the failing test**

Create `test/resolution-auto-advance.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeButton() {
  return { setAttribute() {}, textContent: '', onclick: null };
}

function fakeDocument(button) {
  return {
    getElementById(id) {
      return { textContent: '', innerHTML: '', style: {} };
    },
    querySelector(sel) {
      if (sel === '#roundResult button') return button;
      return null;
    }
  };
}

test('Resolution auto-advance: calls nextRound after 5 seconds if not manually advanced', () => {
  mock.timers.enable({ apis: ['setTimeout', 'clearTimeout'] });
  try {
    const { app, Game, NarrativeStoryEngine } = loadGameModule();
    const button = fakeButton();
    global.document = fakeDocument(button);

    app.game = new Game();
    app.game.addPlayer('Player');
    app.game.submissions = [{ player: 'Player', card: 'A card' }];
    app.storyEngine = new NarrativeStoryEngine();
    app.storyEngine.reset('BARBER');
    app.humanIndex = 0;
    app.show = () => {};

    let nextRoundCalled = false;
    app.nextRound = () => { nextRoundCalled = true; };

    app.chooseWinner(0);
    assert.equal(nextRoundCalled, false, 'should not advance immediately');

    mock.timers.tick(5000);
    assert.equal(nextRoundCalled, true, 'should auto-advance after 5s by invoking the button\'s current handler');
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/resolution-auto-advance.test.js`
Expected: FAIL — no timer exists yet, `nextRoundCalled` stays `false`.

- [ ] **Step 3: Implement — start the timer in `chooseWinner()`**

Find the non-ended narrative branch's end (right before `this.show('roundResult'); return;`):

```js
      } else {
        document.getElementById('winnerName').textContent = `BEAT WINNER: ${win.player.toUpperCase()}`;
        document.getElementById('winnerCard').textContent = `"${win.card}"`;
        const beatMetaEl = document.getElementById('winnerMeta');
        beatMetaEl.style.display = 'block';
        beatMetaEl.textContent = result.consequenceText;
        
        const nextBtn = document.querySelector('#roundResult button');
        if (nextBtn) {
          nextBtn.setAttribute('onclick', 'app.nextRound()');
          nextBtn.textContent = 'NEXT ROUND';
        }
      }
      this.show('roundResult');
      return;
    }
```

Change to:

```js
      } else {
        document.getElementById('winnerName').textContent = `BEAT WINNER: ${win.player.toUpperCase()}`;
        document.getElementById('winnerCard').textContent = `"${win.card}"`;
        const beatMetaEl = document.getElementById('winnerMeta');
        beatMetaEl.style.display = 'block';
        beatMetaEl.textContent = result.consequenceText;
        
        const nextBtn = document.querySelector('#roundResult button');
        if (nextBtn) {
          nextBtn.setAttribute('onclick', 'app.nextRound()');
          nextBtn.textContent = 'NEXT ROUND';
        }
      }
      this.show('roundResult');
      this.startResolutionAutoAdvance();
      return;
    }
```

Then find the classic-mode branch's resolution point:

```js
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerCard').textContent = win.card;
    const classicMetaEl = document.getElementById('winnerMeta');
    classicMetaEl.style.display = 'block';
    classicMetaEl.textContent = `${this.game.currentBlack.prompt}`;
    
    this.show('roundResult');
    this.updateCanvasCards();
```

Change to:

```js
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerCard').textContent = win.card;
    const classicMetaEl = document.getElementById('winnerMeta');
    classicMetaEl.style.display = 'block';
    classicMetaEl.textContent = `${this.game.currentBlack.prompt}`;
    
    this.show('roundResult');
    this.startResolutionAutoAdvance();
    this.updateCanvasCards();
```

- [ ] **Step 4: Implement — the timer method and clearing on manual advance**

Add a new method right after `chooseWinner`'s closing `},` (before `nextRound() {`):

```js
  startResolutionAutoAdvance() {
    this.clearResolutionAutoAdvance();
    this.resolutionTimerHandle = setTimeout(() => {
      this.resolutionTimerHandle = null;
      const btn = document.querySelector('#roundResult button');
      if (btn && typeof btn.onclick === 'function') {
        btn.onclick();
      } else if (btn && btn.getAttribute && btn.getAttribute('onclick') === 'app.endNarrativeGame()') {
        this.endNarrativeGame();
      } else {
        this.nextRound();
      }
    }, 5000);
  },

  clearResolutionAutoAdvance() {
    if (this.resolutionTimerHandle) {
      clearTimeout(this.resolutionTimerHandle);
      this.resolutionTimerHandle = null;
    }
  },
```

Then clear it at the start of both `nextRound()` and `endNarrativeGame()`:

Find:

```js
  nextRound() {
    if (this.storyEngine && this.storyEngine.active) {
```

Change to:

```js
  nextRound() {
    this.clearResolutionAutoAdvance();
    if (this.storyEngine && this.storyEngine.active) {
```

Find:

```js
  endNarrativeGame() {
    this.storyEngine = null;
```

Change to:

```js
  endNarrativeGame() {
    this.clearResolutionAutoAdvance();
    this.storyEngine = null;
```

Finally, clear it when the player clicks `BACK TO TABLE` on `#roundResult`. This surfaced a separate, pre-existing bug worth fixing in the same step: `app.showGame()` is called by three `onclick="app.showGame()"` buttons (`index.html:1069`, `1097`, `1116`) but is never defined anywhere — clicking any of them currently throws `TypeError: app.showGame is not a function` and does nothing. Add the missing method right next to the existing `showSetup()` wrapper:

Find:

```js
  showSetup() { this.show('setup'); },
```

Change to:

```js
  showSetup() { this.show('setup'); },
  showGame() {
    this.clearResolutionAutoAdvance();
    this.show('game');
  },
```

- [ ] **Step 5: Reconcile the test's button stub with real `onclick` behavior**

The test's `fakeButton()` returns an object with `onclick: null` and a no-op `setAttribute`. Since the real code path in the classic (non-narrative) branch never calls `setAttribute('onclick', ...)` at all (only the narrative branches do), and this test uses the narrative branch (`app.storyEngine` is set), the button's `onclick` stays `null` after `chooseWinner()` runs — meaning `startResolutionAutoAdvance()`'s fallback (`else { this.nextRound(); }`) is what actually fires, not `btn.onclick()`. Confirm this matches the test's expectation (it asserts `nextRoundCalled === true`, which holds either way here) — no change needed, just confirm your understanding before moving on.

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test test/resolution-auto-advance.test.js`
Expected: PASS

Run: `node --test` (full suite)
Expected: PASS, no regressions

- [ ] **Step 7: Commit**

```bash
git add index.html test/resolution-auto-advance.test.js
git commit -m "feat: auto-advance the resolution screen after 5 seconds if not manually confirmed"
```

---

### Task 4: Ending stats completeness + Review Log

**Files:**
- Modify: `index.html` — `chooseWinner()`'s `result.ended` branch (~line 3482), `#gameOver` or `#roundResult` ending markup (add a Review Log button + modal), `endNarrativeGame()`
- Test: new `test/narrative-ending-stats.test.js`

**Interfaces:**
- Consumes: `storyEngine.history` (existing array of `{beat, card, category, consequenceText}`), `this.game.players[this.humanIndex].stats` (existing `{streetCred, reputation}`).
- Produces: a `reviewLogModal` DOM element + `app.showReviewLog()` method.

- [ ] **Step 1: Write the failing test**

Create `test/narrative-ending-stats.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { NarrativeStoryEngine } = require('../src/pixel_engine/story-engine.js');

test('Story Engine: history array records every resolved beat for the Review Log', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('BARBER');
  engine.applyWinnerCard("A stolen police scanner buzzing with codes");
  engine.applyWinnerCard("Your cousin's neighborhood security warning");

  assert.equal(engine.history.length, 2);
  assert.equal(engine.history[0].beat, 1);
  assert.equal(engine.history[0].card, "A stolen police scanner buzzing with codes");
  assert.equal(typeof engine.history[0].consequenceText, 'string');
  assert.equal(engine.history[1].beat, 2);
});
```

(This test only confirms the existing, already-correct `history` data shape — it's the foundation the Review Log UI reads. It should already pass today; run it to confirm before moving on, since this task doesn't change `story-engine.js`.)

- [ ] **Step 2: Run test to verify it already passes**

Run: `node --test test/narrative-ending-stats.test.js`
Expected: PASS (confirms `history` is already correctly populated — this task only needs to display it)

- [ ] **Step 3: Implement — ending stats completeness**

Find the `result.ended` branch inside `chooseWinner()`:

```js
      if (result.ended) {
        document.getElementById('winnerName').textContent = result.endingTitle;
        document.getElementById('winnerCard').textContent = result.endingText;
        const secretsLine = this.storyEngine.secrets.length > 0
          ? ` | SECRETS: ${this.storyEngine.secrets.join('; ')}`
          : '';
        const metaEl = document.getElementById('winnerMeta');
        metaEl.style.display = 'block';
        metaEl.textContent = `FINAL STATS: HEAT ${this.storyEngine.heat} | TRUST ${this.storyEngine.trust}${secretsLine}`;

        const nextBtn = document.querySelector('#roundResult button');
        if (nextBtn) {
          nextBtn.setAttribute('onclick', 'app.endNarrativeGame()');
          nextBtn.textContent = 'BACK TO STOOP';
        }
      } else {
```

Change to:

```js
      if (result.ended) {
        document.getElementById('winnerName').textContent = result.endingTitle;
        document.getElementById('winnerCard').textContent = result.endingText;
        const secretsLine = this.storyEngine.secrets.length > 0
          ? ` | SECRETS: ${this.storyEngine.secrets.join('; ')}`
          : '';
        const me = this.game.players[this.humanIndex];
        const rep = me && me.stats ? me.stats.reputation : 0;
        const cash = me && me.stats ? me.stats.streetCred : 0;
        const metaEl = document.getElementById('winnerMeta');
        metaEl.style.display = 'block';
        metaEl.textContent = `FINAL STATS: HEAT ${this.storyEngine.heat} | TRUST ${this.storyEngine.trust} | REP ${rep} | CASH ${cash}${secretsLine}`;

        const nextBtn = document.querySelector('#roundResult button');
        if (nextBtn) {
          nextBtn.setAttribute('onclick', 'app.endNarrativeGame()');
          nextBtn.textContent = 'BACK TO STOOP';
        }

        const reviewLogBtn = document.getElementById('reviewLogBtn');
        if (reviewLogBtn) reviewLogBtn.style.display = 'inline-block';
      } else {
```

- [ ] **Step 4: Implement — the Review Log button and modal**

In `index.html`, find the `#roundResult` screen's button row:

```html
      <div style="margin-top:14px; display:flex; gap:10px; justify-content:center;">
        <button onclick="app.nextRound()">NEXT ROUND</button>
        <button class="secondary" onclick="app.showGame()">BACK TO TABLE</button>
      </div>
```

Change to:

```html
      <div style="margin-top:14px; display:flex; gap:10px; justify-content:center;">
        <button onclick="app.nextRound()">NEXT ROUND</button>
        <button class="secondary" onclick="app.showGame()">BACK TO TABLE</button>
        <button id="reviewLogBtn" class="secondary" onclick="app.showReviewLog()" style="display:none;">REVIEW LOG</button>
      </div>
```

Then, right after the `#roundResult` section's closing `</section>`, add a new modal (matching Phase 2's `reviewModal` visual pattern):

```html
  <!-- Review Log Modal Overlay -->
  <div id="reviewLogModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(16, 17, 22, 0.9); z-index:10000; align-items:center; justify-content:center;">
    <div class="panel" style="width:480px; max-height:70vh; overflow-y:auto; border:3px solid #ffcd68; background:#101116; padding:16px; text-align:left; box-shadow:0 0 16px rgba(0,0,0,0.8);">
      <h2 style="margin-top:0; color:#ffcd68; font-family:'Press Start 2P', monospace; font-size:10px;">REVIEW LOG</h2>
      <div id="reviewLogContent" style="font-family:'JetBrains Mono', monospace; font-size:11px; color:#cbd5ed; line-height:1.5; margin-bottom:16px;">
        <!-- Populated in JS -->
      </div>
      <button class="secondary" onclick="document.getElementById('reviewLogModal').style.display='none'" style="width:100%; font-family:'Press Start 2P', monospace; font-size:8px;">CLOSE</button>
    </div>
  </div>
```

Add the `showReviewLog()` method right after `endNarrativeGame()`:

```js
  showReviewLog() {
    if (!this.storyEngine) return;
    const content = this.storyEngine.history.map(entry =>
      `<strong>BEAT ${entry.beat}:</strong> "${entry.card}"<br/><span class="muted">${entry.consequenceText}</span>`
    ).join('<br/><br/>');
    document.getElementById('reviewLogContent').innerHTML = content || '<span class="muted">No beats recorded.</span>';
    document.getElementById('reviewLogModal').style.display = 'flex';
  },
```

- [ ] **Step 5: Hide the Review Log button by default and reset it on a new narrative game**

Find `endNarrativeGame()` (after Task 3's edit added `this.clearResolutionAutoAdvance();` as its first line):

```js
  endNarrativeGame() {
    this.clearResolutionAutoAdvance();
    this.storyEngine = null;
    document.getElementById('narrativeTextBox').style.display = 'none';
    document.getElementById('stage-canvas').style.display = 'block';
    
    const nextBtn = document.querySelector('#roundResult button');
    if (nextBtn) {
      nextBtn.setAttribute('onclick', 'app.nextRound()');
      nextBtn.textContent = 'NEXT ROUND';
    }
    
    this.show('setup');
  },
```

Change to:

```js
  endNarrativeGame() {
    this.clearResolutionAutoAdvance();
    this.storyEngine = null;
    document.getElementById('narrativeTextBox').style.display = 'none';
    document.getElementById('stage-canvas').style.display = 'block';
    
    const nextBtn = document.querySelector('#roundResult button');
    if (nextBtn) {
      nextBtn.setAttribute('onclick', 'app.nextRound()');
      nextBtn.textContent = 'NEXT ROUND';
    }
    const reviewLogBtn = document.getElementById('reviewLogBtn');
    if (reviewLogBtn) reviewLogBtn.style.display = 'none';
    
    this.show('setup');
  },
```

- [ ] **Step 6: Run tests to verify everything passes**

Run: `node --test`
Expected: PASS, all prior tests plus the new (already-passing) history test

- [ ] **Step 7: Commit**

```bash
git add index.html test/narrative-ending-stats.test.js
git commit -m "feat: add Rep/Cash to narrative ending stats and a Review Log for beat history"
```

---

### Task 5: Action Bar (consolidate Block Map)

**Files:**
- Modify: `index.html` — remove the `BLOCK MAP` button from the status ticker (~line 859), add a bottom Action Bar after the `game-bottom-grid` div

**Interfaces:**
- Consumes: `app.showBlockMap()` (existing method, unchanged).
- Produces: nothing new — this moves one existing button.

- [ ] **Step 1: Remove the Block Map button from the ticker**

Find:

```html
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="status-pill">Black cards: <b id="blackRemaining">0</b> · Goal: <b id="pointsTarget">7</b></span>
          <button class="secondary" onclick="app.showBlockMap()" style="padding: 6px 10px; font-size:8px;">BLOCK MAP</button>
        </div>
```

Change to:

```html
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="status-pill">Black cards: <b id="blackRemaining">0</b> · Goal: <b id="pointsTarget">7</b></span>
        </div>
```

- [ ] **Step 2: Add the Action Bar after the game-bottom-grid**

Find the end of the `game-bottom-grid` div (its closing tag, immediately before `</section>` that closes `#game`). Run `grep -n "game-bottom-grid" index.html` to confirm the exact closing line, then add immediately after that closing `</div>`:

```html
    <!-- Action Bar -->
    <div class="panel" style="margin-top:12px; padding:10px 16px; display:flex; justify-content:center;">
      <button class="secondary" onclick="app.showBlockMap()" style="padding:8px 24px; font-size:9px;">[ MAP ]</button>
    </div>
```

- [ ] **Step 3: No automated test for this task**

Pure markup relocation — run `node --test` to confirm no regressions.

Run: `node --test`
Expected: PASS, same count as after Task 4

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: consolidate the Block Map button into a dedicated bottom action bar"
```

---

### Task 6: Manual browser verification

**Files:** none (verification only)

**Interfaces:** none.

- [ ] **Step 1: Run the automated suite**

```bash
node --test
```

Expected: all pass (prior count + this plan's new tests: 2 in judging-countdown, 1 in resolution-auto-advance, 1 in narrative-ending-stats).

- [ ] **Step 2: Launch the app and verify Card Selected**

Use the `run` skill (or `node server/server.js`) at 1280x720. Start a local game, click a card in hand — confirm it visibly enlarges with an amber glow and the hint line appears; click it again and confirm it deselects and the hint line clears.

- [ ] **Step 3: Verify the judging countdown**

Get to the Judging screen (submit a card as a non-judge player, or use the browser console to drive `app.game.submissions`/`app.enterJudging()` directly). Confirm the countdown visibly ticks down from `00:12`, and if left untouched, a winner is auto-picked at zero and the screen transitions to Round Result. Confirm clicking a submission before the timer expires resolves immediately and the timer stops (no auto-pick fires afterward — wait past 12s to confirm no double-resolution or error).

- [ ] **Step 4: Verify the resolution auto-advance**

After a round resolves (classic or narrative mode), wait 5 seconds without clicking — confirm it auto-advances (`NEXT ROUND` behavior, or `BACK TO STOOP` on an ending beat). Separately, confirm clicking the button manually before 5s still works and doesn't double-advance when the timer would have fired.

- [ ] **Step 5: Verify ending stats and Review Log**

Play the Noir Prototype through to an ending. Confirm `FINAL STATS` now includes `REP` and `CASH` alongside `HEAT`/`TRUST`, and a `REVIEW LOG` button appears (only on the ending screen, not on ordinary beat-resolution screens). Click it — confirm the modal lists every resolved beat with its card and consequence text, and `CLOSE` dismisses it.

- [ ] **Step 6: Verify the Action Bar**

On the main game screen, confirm `BLOCK MAP` no longer appears in the status ticker and instead appears as a centered button in a new bar below the card-play area; confirm clicking it still navigates to the Block Map screen correctly.

- [ ] **Step 7: Fix any issues found, then final commit**

If any step above surfaces a bug, fix it in the relevant task's files and commit with a `fix:` message describing exactly what was wrong.

---

## Out of scope for this plan

- Inventory and Quest systems — no data model, no content.
- City/Block Map screen redesign, NPC/POI Scenes, Decision Panel, Mini-Game HUD — separate phases per the parent spec's execution order.
