# Card Database Content Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shipped game's 14 Black / 48 White inline card arrays with the full deduplicated 577/539-card database, merged with the originals, loaded from a new `cards.js` file instead of inlined in `index.html`.

**Architecture:** A one-time generator script (`scripts/generate-cards.js`) reads `CONCRETE-KINGS-CARD-DATABASE.md` and the current `index.html`, merges and deduplicates both card pools, and writes `cards.js` (plain `const BLACK_CARDS = [...]` / `const WHITE_CARDS = [...]`). `index.html` then loads `cards.js` via a `<script src="cards.js">` tag instead of declaring those arrays inline. The Node test harness (`test/helpers/load-app.js`) is updated in the same task to load `cards.js` into its `vm` context, since removing the inline declarations and updating the test harness are not independently mergeable — either one alone breaks the test suite.

**Tech Stack:** Plain Node.js (no dependencies beyond what's already in `package.json`), `node:test` for the existing test suite, no build step or bundler (matches this project's existing architecture).

## Global Constraints

- No server-side changes. `server/server.js` already statically serves the whole repo root, so `cards.js` is reachable with zero server changes.
- No `fetch`/JSON loading — `cards.js` is a plain synchronous `<script src>` include, consistent with this project having no build step.
- Existing 14 Black / 48 White cards (currently inline in `index.html`) must be preserved, merged into the final pool — not dropped.
- Full card pool ships as-is (no curation/trimming) per the approved design.
- Dedup method for the merge: exact-text match, then fuzzy word-overlap (Jaccard similarity ≥ 0.72 on stopword-stripped word sets) — same method already used to build `CONCRETE-KINGS-CARD-DATABASE.md` this session.
- `DICE_EFFECTS` (in `index.html`) and everything below it (Game class, ReceiptSystem, RECEIPT_POOL, app controller) is untouched by this work.

---

## Task 1: Card data generator

**Files:**
- Create: `scripts/generate-cards.js`
- Create (generated output, committed to repo — this project has no build step, so `cards.js` is checked in like any other source file): `cards.js`

**Interfaces:**
- Consumes: `CONCRETE-KINGS-CARD-DATABASE.md` (read-only), `index.html`'s current inline `BLACK_CARDS`/`WHITE_CARDS` arrays (read-only — this task does not modify `index.html`)
- Produces: `cards.js`, defining `const BLACK_CARDS = [...]` and `const WHITE_CARDS = [...]` in global scope. Task 2 consumes these via a `<script src="cards.js">` tag; Task 2 also has the test harness load this same file's contents into its `vm` context.

- [ ] **Step 1: Write the generator script**

Create `scripts/generate-cards.js`:

```js
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'CONCRETE-KINGS-CARD-DATABASE.md');
const INDEX_PATH = path.join(ROOT, 'index.html');
const OUT_PATH = path.join(ROOT, 'cards.js');

function readSection(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  if (start === -1) throw new Error(`Section not found: ${startHeading}`);
  const end = text.indexOf(endHeading, start + startHeading.length);
  if (end === -1) throw new Error(`End heading not found: ${endHeading}`);
  return text.slice(start, end);
}

function extractCardLines(section) {
  const lines = section.split('\n');
  const cards = [];
  for (const line of lines) {
    const m = line.match(/^\d+\.\s+(.+)$/);
    if (m) cards.push(m[1].trim());
  }
  return cards;
}

function stripEffectSuffix(text) {
  // White cards in the database end with " — *Effect: ...*"; the shipped
  // CAH game has no stat system to consume it.
  return text.replace(/\s+—\s+\*Effect:.*\*\s*$/, '').trim();
}

function ensureTrailingBlank(text) {
  return /____\s*$/.test(text) ? text : `${text} ____`;
}

function norm(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+$/g, '')
    .trim();
}

const STOPWORDS = new Set(['a', 'an', 'the', 'that', 'who', 'which', 'you', 'your', 'was', 'is', 'be', 'been', 'to', 'and', 'at']);

function wordSet(text) {
  return new Set(
    norm(text)
      .split(/[^a-z0-9]+/)
      .filter(w => w && !STOPWORDS.has(w))
  );
}

function jaccard(a, b) {
  const inter = [...a].filter(w => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function dedupe(items) {
  const seen = new Set();
  const kept = [];
  for (const text of items) {
    const key = norm(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(text);
  }
  return kept;
}

function fuzzyDedupe(items, threshold = 0.72) {
  const kept = [];
  const keptWords = [];
  for (const text of items) {
    const ws = wordSet(text);
    let isDup = false;
    for (const kw of keptWords) {
      if (jaccard(ws, kw) >= threshold) {
        isDup = true;
        break;
      }
    }
    if (!isDup) {
      kept.push(text);
      keptWords.push(ws);
    }
  }
  return kept;
}

function extractExistingArray(indexHtmlSource, constName) {
  const re = new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\n\\];`);
  const m = indexHtmlSource.match(re);
  if (!m) throw new Error(`Could not find ${constName} in index.html`);
  const body = m[1];
  const items = [];
  const itemRe = /"((?:[^"\\]|\\.)*)"/g;
  let im;
  while ((im = itemRe.exec(body))) {
    items.push(im[1].replace(/\\"/g, '"'));
  }
  return items;
}

function toJsArrayLiteral(items) {
  const lines = items.map(s => `  ${JSON.stringify(s)}`);
  return `[\n${lines.join(',\n')}\n]`;
}

function main() {
  const db = fs.readFileSync(DB_PATH, 'utf8');
  const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');

  const blackSection = readSection(db, '## Black Scenario Cards', '## White Response Cards');
  const whiteSection = readSection(db, '## White Response Cards', '## Receipt Chains');

  const blackFromDb = extractCardLines(blackSection).map(ensureTrailingBlank);
  const whiteFromDb = extractCardLines(whiteSection).map(stripEffectSuffix);

  const existingBlack = extractExistingArray(indexHtml, 'BLACK_CARDS');
  const existingWhite = extractExistingArray(indexHtml, 'WHITE_CARDS');

  const mergedBlack = fuzzyDedupe(dedupe([...existingBlack, ...blackFromDb]));
  const mergedWhite = fuzzyDedupe(dedupe([...existingWhite, ...whiteFromDb]));

  const output = `// Generated by scripts/generate-cards.js from CONCRETE-KINGS-CARD-DATABASE.md
// Do not hand-edit — re-run the generator instead:
//   node scripts/generate-cards.js
const BLACK_CARDS = ${toJsArrayLiteral(mergedBlack)};

const WHITE_CARDS = ${toJsArrayLiteral(mergedWhite)};
`;

  fs.writeFileSync(OUT_PATH, output);
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`BLACK_CARDS: ${mergedBlack.length}`);
  console.log(`WHITE_CARDS: ${mergedWhite.length}`);
}

main();
```

- [ ] **Step 2: Run the generator**

Run: `node scripts/generate-cards.js`
Expected output:
```
Wrote <repo>/cards.js
BLACK_CARDS: <a number between 570 and 595>
WHITE_CARDS: <a number between 570 and 600>
```

- [ ] **Step 3: Verify the output is valid and duplicate-free**

Run:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('cards.js', 'utf8');
new Function(src); // throws on syntax error
const ctx = {};
new Function('exports', src + '\nexports.BLACK_CARDS = BLACK_CARDS; exports.WHITE_CARDS = WHITE_CARDS;')(ctx);
console.log('BLACK_CARDS length:', ctx.BLACK_CARDS.length);
console.log('WHITE_CARDS length:', ctx.WHITE_CARDS.length);
console.log('BLACK_CARDS unique:', new Set(ctx.BLACK_CARDS).size === ctx.BLACK_CARDS.length);
console.log('WHITE_CARDS unique:', new Set(ctx.WHITE_CARDS).size === ctx.WHITE_CARDS.length);
console.log('BLACK_CARDS all end in blank:', ctx.BLACK_CARDS.every(c => /____\s*$|____/.test(c)));
"
```
Expected: both `unique` lines print `true`, both length numbers match Step 2's output, no thrown error.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-cards.js cards.js
git commit -m "feat: generate cards.js from the master card database"
```

---

## Task 2: Wire cards.js into index.html and the test harness

**Files:**
- Modify: `index.html:205-207` (add script tag), `index.html:212-283` (remove inline `BLACK_CARDS`/`WHITE_CARDS` declarations)
- Modify: `test/helpers/load-app.js`

**Interfaces:**
- Consumes: `cards.js` (Task 1) — global `BLACK_CARDS`/`WHITE_CARDS`
- Produces: `index.html` no longer declares `BLACK_CARDS`/`WHITE_CARDS` itself; `Game`'s constructor (unchanged — still does `new Deck(BLACK_CARDS)` / `new Deck(WHITE_CARDS)`) now resolves those names from the global scope `cards.js` populates, both in-browser and in the Node test harness.

This task's two file changes must land together: removing the inline arrays without also fixing the test harness leaves `test/helpers/load-app.js` throwing `BLACK_CARDS is not defined` (it evaluates the inline script standalone in a `vm` context); fixing the harness first without removing the inline arrays causes a duplicate-`const` `SyntaxError` instead. Neither half is independently green.

- [ ] **Step 1: Add the `<script src="cards.js">` tag**

In `index.html`, find:
```html
</div>

<script>
```
Replace with:
```html
</div>

<script src="cards.js"></script>
<script>
```

- [ ] **Step 2: Remove the inline `BLACK_CARDS`/`WHITE_CARDS` declarations**

In `index.html`, find (this is the entire current block from the `MODE` constant through the start of `DICE_EFFECTS`):
```js
const MODE = { OFFLINE:'Offline', ONLINE:'Online' };

const BLACK_CARDS = [
  "____ is the real reason the club closed early.",
  "____: now with 100% more ____.",
  "When life gives you ____, make ____.",
  "The new street legend says ____ beats ____.",
  "____ ruined Thanksgiving before the food was even served.",
  "____ is the only acceptable excuse for being late to the cookout.",
  "____ and ____. Name a better duo. I’ll wait.",
  "The barber really said ‘____’ and meant it.",
  "____ got kicked out of the family reunion for ____.",
  "____ is why the neighbors called the cops.",
  "____ went viral for all the wrong reasons.",
  "____ is technically a felony in 12 cities.",
  "____ is my love language.",
  "____ plus ____ equals a block party shutdown.",
  "____: the home-cooked ghetto secret to ____."
];

const WHITE_CARDS = [
  "unpaid parking tickets",
  "a bolo in the backseat",
  "texting at the stoplight",
  "the grandma who still cooks like it’s 1999",
  "a mixtape nobody asked for",
  "one uncle who brings his own cooler",
  "a server that only accepts Apple Pay",
  "the cousin who owes everybody money",
  "asking ‘you got a light?’ in 2026",
  "a blunt shaped like a baby bottle",
  "designer sweatpants at a gas station",
  "the club promoter with zero followers",
  "an argument over who makes the best mac & cheese",
  "a frozen pizza at 2AM",
  "a side door DJ set with no permit",
  "a TikTok that started the whole beef",
  "a blocked-off cul-de-sac",
  "a cop who knows your middle name",
  "a tailgate turned neighborhood meeting",
  "an auntie who drinks you under the table",
  "a 15-minute phone call about potato salad",
  "a bodega cat with a restraining order",
  "a drone footage war crime",
  "an engagement ring from the vending machine",
  "a house with 17 cousins in it",
  "a snow cone truck at a funeral",
  "a baby with a debit card",
  "a parking spot named after an ex",
  "a TikTok dance at a candlelight vigil",
  "a rent-to-own fridge full of nothing",
  "a rapper named after a brand of detergent",
  "a house party that got towed",
  "a brisket that was paid for in Venmo requests",
  "a Bluetooth speaker that only plays 90s R&B",
  "a porch light left on for a ghost",
  "a counterfeit birkin from the gas station",
  "a street light that knows your secrets",
  "a cousin with a food truck permit",
  "a side hustle in crypto and nail polish",
  "a step show at a family reunion",
  "a mattress in the back of an Uber",
  "a karaoke machine with only Jill Scott songs",
  "a buttered roll at 5 in the morning",
  "a porch swing that’s seen too much",
  "a used car with a fresh coat of paint",
  "a doorknob that only opens from the inside",
  "a home-cooked plate with no utensils",
  "a stray dog with better fits than you",
  "a dice roll that changed the whole plan"
];

const DICE_EFFECTS = [
```
Replace with:
```js
const MODE = { OFFLINE:'Offline', ONLINE:'Online' };

const DICE_EFFECTS = [
```

- [ ] **Step 3: Update the test harness to load `cards.js` into its `vm` context**

In `test/helpers/load-app.js`, find:
```js
const INDEX_HTML = path.join(__dirname, '..', '..', 'index.html');
const BOUNDARY = "document.getElementById('blackCard')";

function loadGameModule() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error('index.html: could not find inline <script> block');
  const script = match[1];

  // Find the boundary: the occurrence of document.getElementById('blackCard')
  // that comes with .addEventListener (the DOM-wiring boundary, not the method call)
  const boundaryIndex = script.indexOf(BOUNDARY + ".addEventListener");
  if (boundaryIndex === -1) {
    throw new Error(`index.html: could not find test boundary marker "${BOUNDARY}.addEventListener"`);
  }
  const testable = script.slice(0, boundaryIndex);
  const context = { console, Math };
  vm.createContext(context);
  const wrapped = `${testable}\n({ Deck, Game, ReceiptSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS });`;
  return vm.runInContext(wrapped, context);
}
```
Replace with:
```js
const INDEX_HTML = path.join(__dirname, '..', '..', 'index.html');
const CARDS_JS = path.join(__dirname, '..', '..', 'cards.js');
const BOUNDARY = "document.getElementById('blackCard')";

function loadGameModule() {
  const cardsScript = fs.readFileSync(CARDS_JS, 'utf8');
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error('index.html: could not find inline <script> block');
  const script = match[1];

  // Find the boundary: the occurrence of document.getElementById('blackCard')
  // that comes with .addEventListener (the DOM-wiring boundary, not the method call)
  const boundaryIndex = script.indexOf(BOUNDARY + ".addEventListener");
  if (boundaryIndex === -1) {
    throw new Error(`index.html: could not find test boundary marker "${BOUNDARY}.addEventListener"`);
  }
  const testable = script.slice(0, boundaryIndex);
  const context = { console, Math };
  vm.createContext(context);
  const wrapped = `${cardsScript}\n${testable}\n({ Deck, Game, ReceiptSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS });`;
  return vm.runInContext(wrapped, context);
}
```

- [ ] **Step 4: Run the full test suite**

Run: `node --test "test/**/*.test.js"`
Expected: all tests pass (same pass count as before this task — this task changes where `BLACK_CARDS`/`WHITE_CARDS` come from, not any test's behavior).

- [ ] **Step 5: Commit**

```bash
git add index.html test/helpers/load-app.js
git commit -m "feat: load cards.js instead of inlining BLACK_CARDS/WHITE_CARDS"
```

---

## Task 3: Extend the npm test smoke check to validate cards.js

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `cards.js` (Task 1)
- Produces: `npm test` now also fails loudly if `cards.js` is missing or has a syntax error, matching the existing checks for `index.html`'s inline script and `server/server.js`.

- [ ] **Step 1: Extend the test script**

In `package.json`, find the `"test"` script value:
```
node -e \"const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const m=html.match(/<script>([\\s\\S]*)<\\/script>/);if(!m){console.error('NO SCRIPT');process.exit(1)}try{new Function(m[1]);console.log('client JS OK')}catch(e){console.error('CLIENT JS ERROR',e.message);process.exit(1)}const server=fs.readFileSync('server/server.js','utf8');try{new Function(server);console.log('server JS OK')}catch(e){console.error('SERVER JS ERROR',e.message);process.exit(1)}try{require('fs').accessSync('server/server.js');console.log('server file present')}catch(e){console.error('SERVER FILE MISSING');process.exit(1)}\" && node --test \"test/**/*.test.js\"
```
Replace with:
```
node -e \"const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const m=html.match(/<script>([\\s\\S]*)<\\/script>/);if(!m){console.error('NO SCRIPT');process.exit(1)}try{new Function(m[1]);console.log('client JS OK')}catch(e){console.error('CLIENT JS ERROR',e.message);process.exit(1)}const cards=fs.readFileSync('cards.js','utf8');try{new Function(cards);console.log('cards JS OK')}catch(e){console.error('CARDS JS ERROR',e.message);process.exit(1)}const server=fs.readFileSync('server/server.js','utf8');try{new Function(server);console.log('server JS OK')}catch(e){console.error('SERVER JS ERROR',e.message);process.exit(1)}try{require('fs').accessSync('server/server.js');console.log('server file present')}catch(e){console.error('SERVER FILE MISSING');process.exit(1)}\" && node --test \"test/**/*.test.js\"
```

- [ ] **Step 2: Run `npm test` and verify the new check appears**

Run: `npm test`
Expected output includes, in order: `client JS OK`, `cards JS OK`, `server JS OK`, `server file present`, followed by the `node --test` results with all tests passing.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "test: validate cards.js syntax in the npm test smoke check"
```

---

## Task 4: Manual browser QA

**Files:** None (verification only).

- [ ] **Step 1: Start the server**

Run: `node server/server.js`
Expected: logs a listening message (default port 3001, or `PORT` env var if set).

- [ ] **Step 2: Open the game and start an offline round**

Open `http://localhost:3001` in a browser. Choose offline/pass-and-play setup, add at least 2 players, start the game.

- [ ] **Step 3: Verify the larger card pool renders correctly**

Confirm: the black card prompt displays as text (no `undefined`, no raw `____` corruption), the hand shows white cards drawn from the new pool, no errors in the browser console (DevTools → Console).

- [ ] **Step 4: Verify the dice/blank-mutation effect still works**

Play enough rounds to trigger a 🎲 dice-effect black card (roughly 1 in 3 draws, per `hasDice = Math.random() < 0.35` in `Game.nextBlack`). Confirm the prompt text visibly changes (extra blank appended, words reordered, etc.) without breaking the display.

- [ ] **Step 5: Verify judging and round results still work**

Submit a white card as each non-judge player, pick a winner as judge, confirm the round result screen shows the correct winner name, card, and prompt, and the game advances to the next round with a new black card.

- [ ] **Step 6: Confirm online relay is unaffected**

Open a second browser tab, create/join the same room in online mode, confirm room membership and round events still broadcast between tabs (this flow doesn't touch card arrays differently than offline, so it should be unaffected — the point of this check is to catch any accidental regression).

- [ ] **Step 7: Stop the server**

`Ctrl+C` in the terminal running `node server/server.js`.

No commit for this task — it's verification only. If any step fails, fix the underlying issue as a new commit and re-run this task's steps from Step 1.
