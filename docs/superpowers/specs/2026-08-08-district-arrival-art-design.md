# District Arrival Art — Design

**Status:** awaiting review. Nothing is wired yet.
**Goal:** show one establishing scene when the player first travels to a district,
so arriving somewhere new is an event rather than an instant silent swap.

The point of this document is the **mapping table**. Veto any image and I will
re-pick before writing code.

---

## 1. Why this is cheap

The assets already exist and are already prepared. All 24 files in
`assets/scenes/web/` run 112-236KB — comfortably inside the 400KB per-source
ceiling that `test/manifest-integrity.test.js` enforces. 21 are 960x536 and 3 are
960x524, both effectively the aspect of the map viewport (960x520). No slicing,
no rescaling, no background removal.

The lookup pattern also already exists: `NPC_SCENE_BACKDROPS` +
`resolveNpcBackdrop(npcId, city)` in `index.html` does the same job for NPC
scenes, including returning `null` to mean "draw nothing".

---

## 2. What the images actually are

**Filenames are unreliable and were not trusted.** Every one of the 24 was
opened and judged on content. Three are actively misleading:

| File | Filename implies | Actually shows |
|---|---|---|
| `corner-bodega-night` | a corner bodega | a **French Quarter corner bar** with a wrought-iron balcony, gas lamp and cobbles |
| `nola-balcony-interior` | a NOLA balcony interior | a **rowhouse street with stoops and steps**, cardinal on a windowsill |
| `midtown-liquor-barber-wall` | a liquor/barber wall | a **vacant lot** with chain-link, boarded barber, "MIDTOWN STRONG / RESIST" graffiti |

Two are unusable as-is, for the same reason Miami's tile atlas was rejected —
**text baked into the image**:

- `ambition-theatre-el-track` — the marquee reads "Now Pressing: layered history /
  transit-driven urgency". That is prompt text rendered as set dressing.
- `tropicana-hotel-miami` — the hotel name is duplicated and garbled: "The The
  Tropicana Hotel" above "The Tropicana Hotel".

Two more need slicing before any use and are out of scope here:
`alley-variations-4panel`, `jukebox-doors-4panel`.

---

## 3. The constraint that shapes the mapping

**All 9 currently tracked scenes are already consumed by `NPC_SCENE_BACKDROPS`.**
The 15 untracked files are the free pool.

Two of the strongest district matches are locked inside NPC mappings that suit
them poorly, so this design proposes **two reassignments that improve both
systems** rather than duplicating images:

| Change | From | To | Why it is an improvement, not a shuffle |
|---|---|---|---|
| `ray` / Harlem | `midtown-liquor-barber-wall` | `barber-shop-neon-alley` | Ray is a barber. The current image is a boarded-up **liquor** wall reading "MIDTOWN"; the replacement is literally a barber shop with a barber pole. Frees the only vacant-lot image for Detroit Lot. |
| `chen` / default | `corner-bodega-night` | `deli-grocer-storefront` | Chen is a grocer. The current image is a French Quarter **bar**; the replacement is a "DELI GROCERY" storefront. Frees the only wrought-iron balcony for NOLA Balcony. |

If you would rather not touch the NPC mappings, say so — Detroit and NOLA then
either reuse an NPC image across both screens (harmless, different moments) or
go without art.

---

## 4. The mapping — this is the part to veto

District names are architectural (`Stoop`, `Lot`, `Greystone`, `Cut`, `Steps`,
`Porch`, `Corner`, `Balcony`), so each pick is matched to the *name* as well as
the city.

| District | Scene | What it shows | Confidence |
|---|---|---|---|
| **Harlem Stoop** | `bodega-corner-night` | "4AM BODEGA" on a brownstone corner, street lamps, night | **Strong** |
| **Detroit Lot** | `midtown-liquor-barber-wall` *(needs swap in §3)* | Vacant lot, chain-link, boarded storefront, "RESIST" graffiti | **Strong** — the only decay/lot image, and the district is literally a lot |
| **Chicago Greystone** | `chicago-el-platform` | Elevated track underpass, "LAKEFRONT" sign, warm night | **Strong** — the L is unmistakably Chicago |
| **Miami Cut** | `art-deco-hotel-neon` | "ART DECO HOTEL" neon, palm, wet street, night | **Strong** — and night-time, unlike `art-deco-crowd-day` |
| **Baltimore Steps** | `nola-balcony-interior` | Rowhouse street, stoops and **steps**, blue evening | **Good** — matches "Steps" exactly despite the filename |
| **Atlanta Porch** | *(none)* | — | **Gap. Needs one generation.** |
| **Oakland Corner** | `elsol-bodega-street-truck` | "EL SOL BODEGA", food truck, overpass, "AMBITION WORKS GARAGE" | **Adequate** — West-coast industrial corner; weakest of the eight |
| **NOLA Balcony** | `corner-bodega-night` *(needs swap in §3)* | French Quarter corner, **wrought-iron balcony**, gas lamp, cobbles | **Strong** — the literal match for "Balcony" |

**Atlanta gets no splash rather than a wrong-city image.** This follows the
standard already applied to the generated lamp, the car prop and Miami's tile
atlas: wrong art is worse than none. It needs one generation — a Southern porch,
night, on palette. Everything else works today.

**Alternates**, if you veto a primary: Chicago → `chicago-el-track-hotdog`
(bluer, brighter); Miami → `sunset-palms-tacos-strip`; Harlem →
`deli-grocer-storefront`. Unused after this: the three `sunset-*` boulevard
scenes (no LA district exists), the two 4-panel sheets, and the two text-artifact
images.

---

## 5. Behaviour

**Trigger.** In `travelToDistrict(districtKey)`, after `setDistrict` succeeds.

**Once per district per run.** Tracked in a `Set` on `app`, cleared on new game.
Every arrival would make it a loading screen; first arrival makes it discovery.

**Presentation.** Absolutely positioned inside the existing map viewport frame,
covering the canvas — the same container the removed `arrivalSplash` used. This
matters: the block map currently measures exactly 595px in a 595px frame at
1280x720, and an overlay inside the frame cannot change that. It carries the
district name and a dismiss hint.

**Dismissal.** Click, `Enter`, `Space` or `Escape`. **No auto-timeout** — a timed
splash either rushes a reader or delays a player who has seen it. Dismissal
returns focus to the map so WASD keeps working.

**Fallback.** No mapping, or the image has not decoded yet, means no splash and
travel proceeds immediately. Travel must never block on a network read, and
Atlanta must feel deliberate rather than broken.

**Accessibility.** `role="dialog"` with an accessible name from the district
title; focus moves to the splash on open and back to the map on close; the image
gets real `alt` text describing the scene, not the filename; the fade respects
`prefers-reduced-motion` by resolving instantly.

---

## 6. Where it lives

- `DISTRICT_ARRIVAL_SCENES` — a plain `{ DISTRICT_KEY: 'scene-name' }` map beside
  `NPC_SCENE_BACKDROPS`, keyed by district key rather than city, since arrival is
  per district.
- `resolveDistrictArrival(districtKey)` — returns a path or `null`, mirroring
  `resolveNpcBackdrop`.
- `showDistrictArrival` / `dismissDistrictArrival` on `app`.
- Markup: one overlay inside the map viewport frame in `index.html`.
- The 15 untracked scenes get committed as part of this — **2.6MB across 15
  files**, measured. Small against a 312MB `.git`, but it is still art landing in
  git while the repo-weight decision is open.

## 7. Tests

- Every value in `DISTRICT_ARRIVAL_SCENES` resolves to a file that exists, and
  every file is under the 400KB web ceiling.
- No scene is used by both `DISTRICT_ARRIVAL_SCENES` and `NPC_SCENE_BACKDROPS`
  (this is what would silently reintroduce the double-booking in §3).
- `resolveDistrictArrival` returns `null` for Atlanta and for an unknown key.
- The splash shows once per district and not on the second arrival.
- Dismissal restores focus to the map.
- The block map still measures no taller than its frame with the splash open.

---

## 8. Open question for you

Only one, and it is §3: **may I reassign Ray's Harlem and Chen's default NPC
backdrops?** Both are improvements on their own merits, and they unlock the two
strongest district matches. Without them, Detroit and NOLA either share an image
across two screens or go without.
