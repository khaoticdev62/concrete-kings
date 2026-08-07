# UI Wireframe Fidelity — Phase 1: Foundation + Main Game Screen HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real `day` counter to both game engines, then build a single persistent top HUD (title/location/day/heat) and a corrected state panel (Trust/Heat/Rep/Cash) that appear consistently across every screen, per `docs/superpowers/specs/2026-08-07-ui-wireframe-fidelity-design.md` section 1 and the Main Game Screen wireframe's default state.

**Architecture:** One persistent HUD strip lives in the page's existing `<header>` (outside the `.screen` sections, since only one `.screen.active` is visible at a time) and is refreshed by a single `app.updateTopHud()` method called from `show()` (on every screen transition) and from `renderGame()`/`renderNarrativeBeat()` (on every mid-screen re-render). The existing "RPG STAT HUD" panel gains two rows (Trust, Heat) and a relabeled third (Cash, backed by the existing `streetCred` stat — no new stat field, per the spec's correction).

**Tech Stack:** Plain JS (`index.html` inline script, `src/pixel_engine/story-engine.js`), `node --test` for the two testable data-model changes, manual browser verification for DOM/HUD wiring (matching this repo's existing test-boundary pattern — see Global Constraints).

## Global Constraints

- No new dependencies, no build step — this is a plain-JS, single-file client (`docs/CLAUDE.md`).
- `player.stats` stays exactly `{ streetCred, reputation }` — do not add a third stat field. `streetCred` already functions as spendable cash; the wireframe's "Cash" HUD label displays it directly.
- `test/helpers/load-app.js` extracts `Game` (and other classes) from `index.html`'s inline script only up to the text boundary `"document.getElementById('blackCard')".addEventListener` — anything defined after that point (all `app` object methods, including `show`, `renderGame`, `updateStatHud`) is **not** reachable from `node --test` and must be verified manually in-browser. Anything defined before that point (`Game` class, `NarrativeStoryEngine` via its own `module.exports`) is unit-testable.
- Follow existing code style exactly: inline `style="..."` attributes (no new CSS classes unless one already exists for the purpose), `'Press Start 2P', monospace` for labels/headers, `document.getElementById(...)` null-guards matching the pattern already used throughout `renderGame()`.

---

### Task 1: Add a real `day` counter to the core `Game` class

**Files:**
- Modify: `index.html:1170` (constructor), `index.html:1267-1270` (`advanceJudge()`)
- Test: `test/game-day-counter.test.js` (new)

**Interfaces:**
- Consumes: nothing new.
- Produces: `Game.day` (number, starts at `1`, increments by 1 every 3rd call to `advanceJudge()`) — Task 3/4 will read `this.game.day`.

- [ ] **Step 1: Write the failing test**

Create `test/game-day-counter.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Game: day starts at 1 and increments every 3rd round', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  assert.equal(game.day, 1);

  game.advanceJudge(); // round 1
  assert.equal(game.day, 1);
  game.advanceJudge(); // round 2
  assert.equal(game.day, 1);
  game.advanceJudge(); // round 3
  assert.equal(game.day, 2);
  game.advanceJudge(); // round 4
  assert.equal(game.day, 2);
  game.advanceJudge(); // round 5
  assert.equal(game.day, 2);
  game.advanceJudge(); // round 6
  assert.equal(game.day, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/game-day-counter.test.js`
Expected: FAIL — `game.day` is `undefined`, first assertion fails.

- [ ] **Step 3: Implement**

In `index.html`, in the `Game` constructor, find:

```js
    this.players = [];
    this.round = 0;
```

Change to:

```js
    this.players = [];
    this.round = 0;
    this.day = 1;
```

Then find `advanceJudge()`:

```js
  advanceJudge() {
    this.judgeIndex++;
    this.round++;
  }
```

Change to:

```js
  advanceJudge() {
    this.judgeIndex++;
    this.round++;
    if (this.round % 3 === 0) this.day++;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/game-day-counter.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.html test/game-day-counter.test.js
git commit -m "feat: add day counter to core Game, incrementing every 3rd round"
```

---

### Task 2: Add a real `day` counter to `NarrativeStoryEngine`

**Files:**
- Modify: `src/pixel_engine/story-engine.js:136-156` (constructor + `reset()`), `story-engine.js:210-216` (`applyWinnerCard()`)
- Test: `test/story-engine.test.js` (extend existing file)

**Interfaces:**
- Consumes: nothing new.
- Produces: `NarrativeStoryEngine.day` (number, starts at `1`, increments by 1 every 2nd beat resolved) — Task 3/4 will read `this.storyEngine.day`.

- [ ] **Step 1: Write the failing test**

Append to `test/story-engine.test.js`:

```js
test('Story Engine: day starts at 1 and increments every 2nd beat', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  assert.equal(engine.day, 1);

  engine.applyWinnerCard("A ridiculous scent cracks a smile"); // beat 1 -> 2
  assert.equal(engine.day, 2);
  engine.applyWinnerCard("Grandma's secret sweet potato pie recipe"); // beat 2 -> 3
  assert.equal(engine.day, 2);
  engine.applyWinnerCard("Grandma's secret sweet potato pie recipe"); // beat 3 -> 4
  assert.equal(engine.day, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/story-engine.test.js`
Expected: FAIL — `engine.day` is `undefined`.

- [ ] **Step 3: Implement**

In `src/pixel_engine/story-engine.js`, in the constructor:

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
```

Change to:

```js
  constructor() {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.day = 1;
    this.active = false;
    this.history = [];
    this.origin = null;
    this.specialAbilityUsed = false;
    this.secrets = [];
  }
```

In `reset()`:

```js
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

Change to:

```js
  reset(originKey = null) {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.day = 1;
    this.active = true;
    this.history = [];
    this.origin = originKey;
    this.specialAbilityUsed = false;
    this.secrets = [];
  }
```

In `applyWinnerCard()`, find:

```js
    } else {
      this.beat++;
      return {
        consequenceText: consequence.text,
        ended: false
      };
    }
```

Change to:

```js
    } else {
      this.beat++;
      if (this.beat % 2 === 0) this.day++;
      return {
        consequenceText: consequence.text,
        ended: false
      };
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/story-engine.test.js`
Expected: PASS (all tests in the file, including the new one)

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/story-engine.js test/story-engine.test.js
git commit -m "feat: add day counter to NarrativeStoryEngine, incrementing every 2nd beat"
```

---

### Task 3: Add a persistent top HUD strip and `updateTopHud()`

**Files:**
- Modify: `index.html:483-492` (header markup), `index.html:1604-1617` (`show()`)

**Interfaces:**
- Consumes: `Game.day` (Task 1), `NarrativeStoryEngine.day`/`.heat`/`.active` (Task 2), `Game.activeCity`.
- Produces: `app.updateTopHud(screenId)` — called by Task 4 from `renderGame()`/`renderNarrativeBeat()`. DOM ids `topHudStrip`, `topHudLocation`, `topHudDay`, `topHudHeat`.

- [ ] **Step 1: Add the HUD strip markup**

In `index.html`, find:

```html
  <header>
    <h1>CONCRETE KINGS</h1>
    <div class="topbar">
      <button id="bgmToggleBtn" class="secondary" onclick="app.toggleBGM()">🎵 Music: OFF</button>
      <button id="sfxToggleBtn" class="secondary" onclick="app.toggleSFX()">🔊 Sound: ON</button>
      <button class="secondary" onclick="app.toggleAccessModal()">♿ Accessibility</button>
      <div class="pill" id="modeBadge">Offline</div>
      <button class="secondary" onclick="app.showSetup()">Menu</button>
    </div>
  </header>
```

Change to:

```html
  <header>
    <h1>CONCRETE KINGS</h1>
    <div class="topbar">
      <button id="bgmToggleBtn" class="secondary" onclick="app.toggleBGM()">🎵 Music: OFF</button>
      <button id="sfxToggleBtn" class="secondary" onclick="app.toggleSFX()">🔊 Sound: ON</button>
      <button class="secondary" onclick="app.toggleAccessModal()">♿ Accessibility</button>
      <div class="pill" id="modeBadge">Offline</div>
      <button class="secondary" onclick="app.showSetup()">Menu</button>
    </div>
    <div id="topHudStrip" style="display:none; justify-content:space-between; align-items:center; gap:16px; margin-top:8px; padding:8px 12px; background:#101116; border:2px solid #2d313d; font-family:'Press Start 2P', monospace; font-size:9px; color:#f4f7ff;">
      <span id="topHudLocation" style="color:#ffcd68;">HARLEM</span>
      <span id="topHudDay">DAY 1</span>
      <span id="topHudHeat" style="color:#f25438;">HEAT: 0/10</span>
    </div>
  </header>
```

- [ ] **Step 2: Add `updateTopHud()` and wire it into `show()`**

Find `show(id)`:

```js
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(id);
    targetScreen.classList.add('active');
    
    const canvasContainer = targetScreen.querySelector('.canvas-mount-point');
```

Change to:

```js
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(id);
    targetScreen.classList.add('active');
    this.updateTopHud(id);
    
    const canvasContainer = targetScreen.querySelector('.canvas-mount-point');
```

Immediately after the closing of `show(id)` (right after `showSetup() { this.show('setup'); },`), add the new method:

```js
  showSetup() { this.show('setup'); },

  updateTopHud(screenId) {
    const strip = document.getElementById('topHudStrip');
    if (!strip) return;
    if (screenId === 'setup' || screenId === 'lobby' || screenId === 'deckBuilder') {
      strip.style.display = 'none';
      return;
    }
    strip.style.display = 'flex';

    const useStory = !!(this.storyEngine && this.storyEngine.active);
    const day = useStory ? this.storyEngine.day : (this.game ? this.game.day : 1);
    const heat = useStory ? this.storyEngine.heat : 0;
    const location = ((this.game && this.game.activeCity) || 'Harlem').toUpperCase();

    const locationEl = document.getElementById('topHudLocation');
    const dayEl = document.getElementById('topHudDay');
    const heatEl = document.getElementById('topHudHeat');
    if (locationEl) locationEl.textContent = location;
    if (dayEl) dayEl.textContent = `DAY ${day}`;
    if (heatEl) heatEl.textContent = `HEAT: ${heat}/10`;
  },
```

- [ ] **Step 3: Manual verification**

No automated test — `show()` and the app object are defined after `test/helpers/load-app.js`'s extraction boundary (see Global Constraints). Verify manually per Task 6's checklist once Task 4 is also done, since `updateTopHud` has no visible caller until then.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add persistent top HUD strip with location/day/heat"
```

---

### Task 4: Refresh the top HUD from `renderGame()` and `renderNarrativeBeat()`

**Files:**
- Modify: `index.html:2847` (inside `renderGame()`), `index.html:4092-4094` (inside `renderNarrativeBeat()`)

**Interfaces:**
- Consumes: `app.updateTopHud(screenId)` (Task 3).
- Produces: nothing new — this is wiring only.

- [ ] **Step 1: Call it from `renderGame()`**

Find:

```js
    this.renderHand();
    this.renderScoreboard();
    this.updateStatHud();
```

Change to:

```js
    this.renderHand();
    this.renderScoreboard();
    this.updateStatHud();
    this.updateTopHud('game');
```

- [ ] **Step 2: Call it from `renderNarrativeBeat()`**

Find:

```js
    document.getElementById('narrativeBeatTitle').textContent = `BEAT ${beat.beat}: ${beat.title.toUpperCase()}`;
    document.getElementById('narrativeText').textContent = beat.narrative;
    document.getElementById('narrativeHeat').textContent = this.storyEngine.heat;
    document.getElementById('narrativeTrust').textContent = this.storyEngine.trust;
  },
```

Change to:

```js
    document.getElementById('narrativeBeatTitle').textContent = `BEAT ${beat.beat}: ${beat.title.toUpperCase()}`;
    document.getElementById('narrativeText').textContent = beat.narrative;
    document.getElementById('narrativeHeat').textContent = this.storyEngine.heat;
    document.getElementById('narrativeTrust').textContent = this.storyEngine.trust;
    this.updateTopHud('game');
  },
```

- [ ] **Step 3: Manual verification**

Deferred to Task 6's full checklist (both this task and Task 3 need a live browser to verify; there is no automated path).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: refresh top HUD on every game and narrative render"
```

---

### Task 5: Correct the state panel to Trust/Heat/Rep/Cash

**Files:**
- Modify: `index.html:810-816` (RPG Stat HUD markup), `index.html:2889-2895` (`updateStatHud()`)

**Interfaces:**
- Consumes: `Game.players[i].stats.{streetCred,reputation}`, `NarrativeStoryEngine.{heat,trust,active}`.
- Produces: nothing new — this is display wiring only.

- [ ] **Step 1: Update the markup**

Find:

```html
        <!-- RPG Stats Panel -->
        <div class="panel">
          <h3 style="margin-top:0; font-family:'Press Start 2P', monospace; font-size:10px; color:#339488;">RPG STAT HUD</h3>
          <div class="rpg-hud-grid">
            <div class="hud-item"><span class="hud-label">CRED:</span> <span id="hudCred" class="hud-val">0</span></div>
            <div class="hud-item"><span class="hud-label">REP:</span> <span id="hudRep" class="hud-val">0</span></div>
          </div>
        </div>
```

Change to:

```html
        <!-- RPG Stats Panel -->
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

(`hudCred`'s element id is unchanged — only its visible label moves from `CRED` to `CASH` — so nothing else that might reference the id breaks.)

- [ ] **Step 2: Update `updateStatHud()`**

Find:

```js
  updateStatHud() {
    const me = this.game.players[this.humanIndex];
    const credEl = document.getElementById('hudCred');
    const repEl = document.getElementById('hudRep');
    if (credEl) credEl.textContent = me ? me.stats.streetCred : 0;
    if (repEl) repEl.textContent = me ? me.stats.reputation : 0;
  },
```

Change to:

```js
  updateStatHud() {
    const me = this.game.players[this.humanIndex];
    const credEl = document.getElementById('hudCred');
    const repEl = document.getElementById('hudRep');
    const trustEl = document.getElementById('hudTrust');
    const heatEl = document.getElementById('hudHeat');
    if (credEl) credEl.textContent = me ? me.stats.streetCred : 0;
    if (repEl) repEl.textContent = me ? me.stats.reputation : 0;
    const useStory = !!(this.storyEngine && this.storyEngine.active);
    if (trustEl) trustEl.textContent = useStory ? this.storyEngine.trust : 0;
    if (heatEl) heatEl.textContent = useStory ? this.storyEngine.heat : 0;
  },
```

- [ ] **Step 3: Manual verification**

Deferred to Task 6's full checklist.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix: correct state panel to show Trust/Heat/Rep/Cash per wireframe"
```

---

### Task 6: Manual browser verification

**Files:** none (verification only)

**Interfaces:** none.

- [ ] **Step 1: Run the automated suite first**

```bash
npm test
node --test
```

Expected: all pass, including the two new day-counter tests from Tasks 1-2.

- [ ] **Step 2: Launch the app**

Use the `run` skill (or `node server/server.js`, then open `http://localhost:3001`) to launch Concrete Kings in a browser at 1280x720.

- [ ] **Step 3: Verify Setup screen has no top HUD**

On load (`#setup` active), confirm `#topHudStrip` is not visible — matches the wireframe's "No in-game HUD during creation" rule (this rule is defined for Character Creation specifically; Setup is this app's equivalent screen).

- [ ] **Step 4: Verify classic (non-narrative) play**

Click "PLAY LOCAL". Confirm:
- The top HUD strip appears showing `HARLEM`, `DAY 1`, `HEAT: 0/10`.
- The state panel shows `TRUST: 0`, `HEAT: 0`, `REP: 0`, `CASH: 0` (or the player's actual starting `streetCred`/`reputation` if an origin bonus applies).
- Advance 3 full rounds (crown a winner 3 times via the offline pass-and-play flow) and confirm the top HUD's `DAY` increments to `2` after the 3rd round.

- [ ] **Step 5: Verify narrative/campaign play**

From Setup, click "PLAY NOIR PROTOTYPE". Confirm:
- The top HUD strip shows `DAY 1` and `HEAT: 0/10` initially.
- The state panel's `TRUST`/`HEAT` values match the narrative overlay's own `narrativeHeat`/`narrativeTrust` values after playing a beat.
- After 2 beats resolve, the top HUD's `DAY` increments to `2`.

- [ ] **Step 6: Verify no other screen breaks**

Navigate to Judging, Round Result, and Block Map screens (via normal play flow / "Menu" button). Confirm no console errors and the top HUD strip's visibility is sensible (visible on Judging/Round Result/Block Map, hidden only on Setup/Lobby/Deck Builder).

- [ ] **Step 7: Fix any issues found, then final commit**

If any step above surfaces a bug, fix it in the relevant task's files and commit with a `fix:` message describing exactly what was wrong (e.g. "fix: topHudStrip not hidden on lobby screen").

---

## Out of scope for this plan

- Card Selected zoom state, visible judging countdown, Ending screen final-stats panel, and the Action Bar (Play/Inventory/Map/Quests) — these belong to the "Game Board" step of the spec's execution order and are deferred to Phase 3's own plan, since Inventory and Quests have no underlying system yet and inventing one would be new feature work, not a fidelity fix.
- Character Creation, Decision Panel, City Map, NPC/POI Scenes, Mini-Game HUD — separate phases per the spec's execution order, each gets its own plan once this phase is verified working.
