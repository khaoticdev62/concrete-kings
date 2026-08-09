# Concrete Kings — Agent Handoff

Last updated 2026-08-09. Read this before touching the codebase. It exists to
stop you rediscovering the same traps: several bugs here fail **silently** and
some are invisible to the test suite by construction.

---

## 0. The two rules that would have saved the most time

**Commit as soon as something works.** Another agent has been committing to this
working tree, and `git checkout`/`reset` from a concurrent session has destroyed
uncommitted work here repeatedly — a full day of map work once, and most of an
edit to this very file. `git reflog` and `git log` are the recovery path; your own
recollection is not. If a change is green, commit it before starting the next one.
Prefer applying an edit and committing it in **one** command.

**Mutation-test every test that reads source text.** Delete the thing the test
claims to check and confirm it fails. Three tests written here passed against
source with the feature *removed* — see trap 2.10. If you have not watched a test
fail, you do not know what it tests.

---

## 1. Run and verify

```bash
npm install                  # one dependency: ws
npm test                     # syntax smoke check + node --test over test/**
node server/server.js        # serves index.html + WS relay on port 3001
```

Open `http://localhost:3001`. **Port is 3001, not 3000.**

Current state: **363 tests across 58 files, all passing. Zero console errors on
load** — check the browser console, not just the suite; see trap 2.5.

Always run `npm test` and not just `node --test` — the npm script also
syntax-checks `index.html`'s inline `<script>`, `cards.js` and `server/server.js`,
which catches parse errors the test runner never sees.

---

## 2. Eleven traps that will cost you hours

### 2.1 You cannot measure layout with `documentElement.scrollHeight`

`body` and `.wrap` are `height:100vh; overflow:hidden`, so
`document.documentElement.scrollHeight` **always reports the viewport height**
and every screen looks like a perfect fit. This produced a wrong conclusion once
already.

Measure the `.screen` element instead:

```js
const s = document.getElementById('game');
const overflows = s.scrollHeight > s.clientHeight + 2;   // ~595px frame at 720p
```

Screens scroll internally via `.screen { overflow-y:auto }`, so overflowing
content is *below the fold*, never unreachable.

### 2.2 A CSS class referenced in markup but defined nowhere fails silently

`game-bottom-grid` shipped referenced-once, defined-never. It fell back to
`display:block`, stacked two columns that should have been side by side, and
accounted for 312px of a 1386px overflow — with no error anywhere.

`test/card-table-layout.test.js` now asserts every class used in the `#game`
markup resolves to a rule. **If you add a class, add its rule**, or add it to
that test's `ALLOWED_UNDEFINED` set with a reason.

### 2.3 JS referencing element ids that do not exist in the markup

**The worst bug class in this codebase.** A full scan found **15** such ids, and
they had silently broken three entire features:

- **Deck Builder was completely unusable** — `setDeckBuilderTab` begins
  `if (!colPanel || !shopPanel) return;` and bailed before `renderCollectionGrid`
  ever ran. Empty grid, deck count 0, SAVE disabled. No deck could be built.
  The Receipt Dust cosmetics shop was unreachable for the same reason.
- **The LEXICON menu button did nothing** — `renderSetupGlossary` bails at
  `if (!box) return;`. Ten AAVE terms, a search engine and the CSS all existed
  with nowhere to render.
- **The Receipt system had no UI** despite being fully implemented and tested.
- **SHOW FPS COUNTER did nothing** — it wrote to an overlay that did not exist.

Every call site guarded correctly with `if (!el) return;`. That is good
defensive code, and precisely why the failure is invisible.

All 15 are fixed and **`test/dead-references.test.js` now scans every
`getElementById` call against the markup** and fails naming any that are dead.
Run `npm test` and this class cannot come back. If you legitimately create an
element at runtime, add it to that test's `RUNTIME_CREATED` set with a reason.

### 2.4 Node's module scope hides browser-only collisions

`node --test` gives each file its own scope via `require`. In the browser these
same files load as classic `<script>` tags sharing **one global scope**. Three
top-down modules each declared a top-level `const WORLD`; 183 tests passed while
the renderer failed to parse in the browser.

Engine files therefore use file-prefixed locals (`CTRL_WORLD`, `RND_WORLD`).
Scan before adding a module:

```bash
node -e "const fs=require('fs');const o={};for(const f of fs.readdirSync('src/pixel_engine').filter(f=>f.endsWith('.js'))){for(const m of fs.readFileSync('src/pixel_engine/'+f,'utf8').matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_\\\$][\w\\\$]*)/gm)){(o[m[1]]??=new Set()).add(f)}}for(const[n,s]of Object.entries(o))if(s.size>1)console.log('COLLISION',n,[...s].join(','))"
```

**Always load a change in a real browser.** Green tests are not sufficient here.

### 2.5 Green tests do not mean it looks right

Three times a change passed every test and looked wrong: the top-down city
rendered as flat colour slabs with a 160px strip of bare ground; the NPC backdrop
was effectively invisible behind panels covering 85% of the screen; and street
furniture drew as hair-thin squiggles and pixel noise. All three were only caught
by screenshotting and looking.

Take a screenshot at 1280x720 and actually look at it. For anything small, crop
and magnify — `magick shot.png -crop WxH+X+Y +repage -filter point -resize 300%
out.png`. At display scale the broken lamps looked like plausible clutter; at 3x
they were obviously wrong.

**A metric you invent to check a fix can measure the wrong thing and hide it.**
The `shop_deal` prop had a white halo. A check counting light *semi-transparent*
pixels reported it fixed — but the "fix" had binarised alpha, so the halo was now
fully *opaque* and simply no longer matched the check. Rewriting it to count light
opaque pixels then flagged the chess table's checkerboard and the barber pole's
white stripes as halo and made both worse. No threshold separates halo from art
when the art contains near-white paint. Composite on dark and look:

```bash
magick assets/props/web/shop_deal.png -background "#101116" -flatten \
  -filter point -resize 250% /tmp/check.png
```

### 2.6 A sprite can be the right size, right format, and still unusable

The canvas runs with `imageSmoothingEnabled = false`, so the browser downscales
by point sampling. A 96x96 generator canvas drawn at 18x30 loses ~80% of its
pixels and the sampling grid can miss a thin lamp post entirely. Generators also
centre a small subject on a large canvas, which shrinks the visible art further.

Run new props through `scripts/process-props.sh`, which trims the padding and
pre-scales to the renderer's `FURNITURE_DISPLAY` sizes so the draw is 1:1.

Two related failures, both now guarded by `test/manifest-integrity.test.js`:

- **Opaque backgrounds.** Background removal that only strips near-black leaves a
  white or teal border, and the prop draws as a solid box. Edge flood-fill
  (`-fill none -draw "color x,y floodfill"`) clears it while preserving interior
  colour; plain `-fuzz` at any useful threshold floods the whole sprite.
- **Size drift** between the PNG on disk and the size the renderer draws it at.

Neither dimensions, file size, nor resolution catch either one.

### 2.7 Anything cached on the first frame is cached before assets exist

`AssetRegistry.preload()` is async and the map renders immediately, so the first
frame runs against an empty registry. Ground decal placement is computed once
and cached — and caching the empty result it produced on frame one kept decals
off the map permanently, because the sprites resolved a moment later and nothing
ever recomputed. Every test passed; the browser showed nothing.

The first fix was to treat an empty pool as "not ready yet" and skip caching it.
That works, but the better fix was to remove the dependency: `decalPlan` now
computes positions and kinds from geometry alone and never touches the registry,
resolving art only at draw time. The race cannot exist rather than being guarded
against.

**If you cache anything derived from the registry, prefer the same move** — make
the cached thing registry-independent. `test/topdown-city-renderer.test.js` covers
it with a registry that starts empty and resolves later, asserting the plan is
identical before and after.

### 2.8 A sprite at x=0,y=0 is not necessarily the whole image

Sprite packs are strips: `city_harlem_tiles.png` is three 32px decals side by
side, so its first slice is legitimately at `0,0` with `w:32` on a 96px file. An
earlier version of `test/manifest-integrity.test.js` asserted that any sprite at
the origin must match its file's full dimensions, and the manifest was
"corrected" to `w:96` to satisfy it — which squashed all three decals into one
draw.

The rule now only applies when a source has exactly one sprite. When adding an
atlas, declare explicit `x`/`w` per slice and check the count.

---

## 3. Architecture

**`index.html` (~6900 lines)** holds all client code in one inline `<script>`:

- `Deck` — shuffle/draw with reshuffle
- `Game` — pure rules and state (players, hands, judging, scoring). No DOM.
- `app` — the controller: screen transitions via `.screen.active`, rendering,
  offline and online flows. Everything player-facing hangs off `app`.

**`src/pixel_engine/*.js`** are plain `<script>`-loaded modules, each also
exporting via `module.exports` for tests:

| File | Role |
|---|---|
| `animation-system.js` | `Animator`. **Must load first** — others resolve it at parse time |
| `canon-engine.js` | The block ledger: motifs, legends, callbacks, chronicle |
| `scenario-engine.js` | Scenario slots, resolution, outcome tiers, scene beats |
| `lightmap.js` | Pooled lamp light. Must load **before** the renderer |
| `player-progression.js` | XP, levels, daily quests |
| `asset-registry.js` | Manifest sprite lookup, **null means draw procedurally** |
| `topdown-city-data.js` | 8 district layouts, pure data |
| `topdown-city-renderer.js` | Draws the city; asset-first, procedural fallback |
| `topdown-city-controller.js` | Movement, per-axis collision, camera, POI proximity |
| `block-map-navigation.js` | **Retained only** for its 5 hotspot definitions |
| `pixel-engine.js` | Canvas engine + `SpriteRenderer` with palette swapping |
| `weather-effects-system.js` | Rain/sirens/neon, composites onto the map canvas |
| `first-miles-campaign.js` | Solo campaign content, own internal state |
| `mini-games/` | 5 mini-games + manager/loop/input/UI |

**Load order matters and is tested.** `animation-system.js` must precede everything
that destructures `Animator`; `lightmap.js` must precede `topdown-city-renderer.js`,
which resolves `window.TopDownLightmap` while parsing.
`test/global-collisions.test.js` asserts both, and that no two `<script>`-loaded
files declare the same top-level name — including via destructuring, which is how a
browser-fatal `Animator` collision once shipped with a fully green suite.

**Online multiplayer is not authoritative.** Each browser runs its own `Game`;
the server only relays. O.G. powers, betting and alliances are hidden in online
mode because they would mutate only the clicking browser's state.

---

## 4. Screens and their state

`app.show(id)` toggles `.screen.active`. All screens fit 595px at 1280x720 —
**verified with populated content**, including judging with 8 submissions, round
result, and game over with full standings.

| Screen | Notes |
|---|---|
| `setup` | Main menu + 4-step character creation wizard |
| `game` | The card table. Fits 595px at 8 players |
| `judging` / `roundResult` / `gameOver` | Reuse the frame; measured, fine |
| `blockMap` | Top-down walkable city, 8 districts. Fits exactly, no scroll |
| `npcPoiScene` | NPC scenes with generated art backdrops |
| `scenario` | **RUN IT** — complete a scenario, watch it happen, live with it |
| `chronicle` | **THE RECORD** — what the block remembers. Reachable from the menu |
| `minigameCatalog`, `deckBuilder`, `lobby`, `campaign*` | Measured, fine |

**Top-level modals** (`shopModal`, `shopUnavailableModal`, `accessModal`) must
live outside every `.screen` and outside the dev-console `<details>`. A closed
`<details>` renders no descendants, so a modal inside it computes
`display:block` yet measures 0x0. `accessModal` shipped that way and every
accessibility setting was unreachable. `test/cash-shop.test.js` guards placement.

---

## 5. Assets

`assets/ASSET_INVENTORY.md` is the authority. Summary:

| Path | State |
|---|---|
| `scenes/` (24) | Excellent 3/4 street-level art. **Cannot tile** — fixed perspective |
| `scenes/web/` (25) | 960px PNG8 web copies, ~150KB. **These** are what the game loads |
| `topdown-recolor/` (12) | Right shapes, wrong palette. Recolourable via `SpriteRenderer` |
| `props/web/` (5) | POI prop sprites, transparent PNG32, 80KB total. **Wired and drawing** |
| `decals/` (4) | Usable |
| `ui-mockups/` (5) | HUD explorations, **not** game art |
| `*_raw.png` (8) | Failed tile generations, neon on black. Not sliceable |
| `palettes/concrete_kings.json` | The real deal. Canonical gamut |

**Rules:**

- Never load a raw (5-14MB) in the browser. Downscale:
  `magick in.png -resize 960x -strip -colors 160 out.png` → ~150KB.
  PNG8 beats JPEG here; JPEG artifacts show badly on pixel art.
- **The palette is 101 colours in 9 named ramps**, authored in `pixel-engine.js` and
  exported to `assets/palettes/concrete_kings.json` by
  `scripts/generate-palette-json.js`. **The code is the authority; the JSON is
  generated** — a test asserts they match, because they had already drifted once.
- **There is a `green` ramp now.** The old "do not invent greens" rule existed only
  because the 64-colour palette had none, and it is why every park rendered as a
  teal slab. Foliage uses `green`; `teal` is for verdigris and cold accents.
- **Every adjacent pair in a ramp is within CIELAB dE 12**, and a test enforces it.
  This is not cosmetic: `paletteShift(colour, ±1)` is used for grain, dither
  partners and highlights, so a large step reads as a change of *hue* rather than
  shade. One step off brick used to be dE 19, which made roofs look like red
  confetti and parapets like signal-red selection boxes. All 64 original colours
  survive at their original ramp positions and a test pins them individually.
- Large fills (ground, asphalt, roofs) must stay under luminance 120. Bright hues
  belong in `lane`, `zebra` and `accent` only. Tested.
- Large fills (ground, asphalt, roofs) must stay under luminance 120. Bright hues
  belong in `lane`, `zebra` and `accent` only. Tested.
- `assets/manifest.json` declares the 8 city sources plus 5 POI props. City
  tiles have no sprite keys yet so terrain stays procedural; the POI props are
  live. `test/manifest-integrity.test.js` verifies every source exists, is under
  400KB, and that declared sprite sizes match the real PNG header.
- **Never point the manifest at a raw asset.** JPEG has no transparency (a raw
  prop draws as a black box) and the raws are 0.4-14MB. Process first:
  `magick in.jpg -fuzz 6% -transparent black -trim +repage -resize 96x96 -strip PNG32:out.png`
- POI prop lookups are district-agnostic (`prop_poi_<id>`) because the same five
  POIs appear in all eight districts. Every other element prefixes the district. Keys use the prompt pack's vocabulary:
  `ground_* road_* building_* furniture_* flora_* decal_* prop_* icon_*`.

**Why the tile generations failed** (avoid repeating): palette placeholders like
`[3 hex codes from district profile]` appear to have been sent literally, so the
model invented a neon default; "solid black background for tile extraction"
outcompeted the city brief; and 2048x2048 with no tile grid or gutter is not
sliceable. The `scenes/` prompts are the pattern that worked.

---

## 6. Testing conventions

- **`test/helpers/load-app.js`** runs `index.html`'s inline script in a VM
  sandbox and returns `{ Game, app, ... }`. To use a new top-level function in a
  test, **add it to that file's export list** or it will be undefined.
- Cross-realm gotcha: objects built inside the VM carry that realm's
  `Object.prototype`, so `assert/strict`'s `deepEqual` rejects them on identity.
  Spread into a local literal first: `assert.deepEqual({ ...obj }, expected)`.
- **Always `try/finally` around `MiniGameManager.start()`.** It leaves a live
  `setTimeout` render loop; an assertion throwing before `stop()` hangs the whole
  runner indefinitely. This has happened.
- Mini-game timer tests must mock `setInterval`, not `setTimeout` — production
  uses `setInterval`, and mocking the wrong one leaks a real timer that hangs.
- Layout and rendering are **browser-verified**, not unit-tested. Static guards
  (class defined, id present, file size) live in node; measurement does not.

---

## 7. Deliberate design rules

**No fake UI.** Controls without a real backing mechanic get removed, not built.
Applied repeatedly: the quest filter (3 hardcoded glyphs, no quest model) and fog
of war (no explored/visited tracking) were **deleted** rather than ported to the
new map. `showBoosterShop` was a dead button; it now explains that the shop opens
on a run. Prep items only modify fields a mini-game's win logic actually reads —
never `street-dice.js`'s `dc`, which is set from params and compared against
nothing.

**Asset-first, procedural fallback.** Every drawn element checks the registry and
falls back. A missing asset must never break a screen.

**Districts differ by palette, layout and vocabulary — not by content.** All 8
share the same 5 POIs because inventing per-district POIs without mechanics would
be fake UI.

---

## 8. Where things stand

**Done:** top-down walkable city map (8 districts, collision, camera, travel with
heat gating), CASH shop with mini-game prep items, character-creation wizard,
NPC scene backdrops, card table fitting 720p, accessibility panel restored.

**Open, in rough value order:**

1. ~~**`topdown-recolor/` palette swap**~~ — **investigated and closed. Do not
   spend time here.** The claim was 12 correctly-shaped assets one recolour away.
   Both halves are wrong. Colour is not the blocker: the master palette *contains*
   violet (`#2A1138`, `#521C6E`), so remapping to it legitimately keeps the purple.
   The real blocker is projection — 9 of the 12 cannot sit on a top-down map at
   all. Five `iso-*` are isometric, `furniture-street-lamp` and
   `flora-weed-cluster` are side-on, `prop-car` is a 3/4 front view, and
   `icon-house` is a UI icon. Only the three `road-*` are top-down, and the
   renderer already draws roads and lane markings procedurally and crisply.
   See `assets/ASSET_INVENTORY.md`.
2. **District arrival art** — 15 unused `scenes/` images; show one on travel.
3. **Collapse duplicate wireframes** — `UI_WIREFRAME_GAME_BOARD.txt` and
   `UI_WIREFRAME_MAIN_GAME_SCREEN.txt` describe the same four states.
4. **Repo weight** — `.git` is ~305MB+; a single asset commit moved 379MB and
   took ~12 minutes to push. Decide on downscale-only-in-git or LFS **before**
   the next art batch.
5. **An entire unreachable narrative UI subtree, not just one dead div.**
   Investigated: `#narrativeTextBox` is 41 lines of markup that is never shown,
   and everything inside it is unreachable with it —

   - `#abilityMenuOverlay` / `#abilitiesList` and `#secretOverlay` /
     `#secretsList`, opened only by `[ USE ABILITY ]` and `[ VIEW SECRET ]`
     buttons that are *themselves inside the hidden box*. Hidden buttons opening
     hidden overlays: the same bug class as trap 2.3, and as a modal nested in a
     closed `<details>`.
   - `app.renderNarrativeBeat()`, which writes beat title, prose, heat, trust and
     the player's choice buttons into it. It is still called on a live path
     (`renderGame` → beat advance), so narrative beats are being composed into a
     container nobody can see.
   - `app.showAbilityMenu()` and `app.showSecretOverlay()`, reachable from nowhere
     else.

   **It is superseded, which is why nothing broke.** `FirstMilesCampaign` renders
   the visible campaign UI into a separate current set of ids —
   `campaignBeatTitle`, `campaignBeatNarrative`, `campaignBeatPrompt`,
   `campaignChoiceBar`. The `narrativeTextBox` path is the older
   `NarrativeStoryEngine` display layer left behind.

   **Not removed, deliberately.** `storyEngine` has 41 references across
   `index.html`, so this is a subsystem decision rather than a delete: does story
   mode come back on this path, or is `FirstMilesCampaign` now the only one? That
   is a product call. It also sits in the exact area being actively refactored,
   so ripping it out now risks a conflict. Decide the direction first, then either
   wire the box in or remove the subtree, `renderNarrativeBeat`, both overlay
   openers and the two `display='none'` lines together.

   `syncStagePanel()` assumes the box stays hidden and a test in
   `test/card-table-layout.test.js` guards that assumption — both will need
   updating if it is ever shown.

The 15 dead element references are fixed; Deck Builder, the dust shop, the
Lexicon and the FPS counter all work now. See section 2.3.

**Known approximation:** T-Bone's NPC backdrop is an outdoor street scene because
no chess-park art exists. Recorded in the mapping comment.

---

## 9. Conventions

- Commit messages explain **why**, including what was tried and rejected.
- `docs/superpowers/specs/` holds design specs; read the relevant one before
  changing a system.
- Windows: use the Bash tool with POSIX syntax, or PowerShell with PowerShell
  syntax — mixing them fails noisily. `taskkill //F //PID <pid>` (double slash).
- Verify a fix by removing it and confirming the test fails, then restoring. Done
  throughout; it is how several vacuous tests were caught.
