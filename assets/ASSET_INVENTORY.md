# Generated Asset Inventory

Sorted 2026-08-08 from `assets/archive/` (50 raw Gemini outputs, now empty).
Three exact duplicates were deleted; 47 files were sorted and renamed by subject.

Nothing here is wired into the game yet. `assets/manifest.json` declares the
eight city sources with an **empty** `sprites` map, so the top-down map renders
fully procedurally and no asset here can break it.

---

## `scenes/` — 24 files. Ready to use, wrong projection for the map.

Street-level 3/4 pixel-art scenes, ~2752-2816 x 1536. This is the strongest
work in the batch: on-palette, atmospheric, genuinely good. `chicago-el-track-hotdog`
and `barber-shop-interior` are the standouts.

**They cannot feed the top-down city map.** Fixed 3/4 perspective, non-tiling,
one scene per image. Where they fit instead:

- **NPC/POI scene backdrops.** The `npcPoiScene` screen currently shows a 96x96
  canvas portrait against a flat panel. These would transform it, and the
  subjects already line up with the five POIs: `barber-shop-interior` and
  `barber-shop-neon-alley` for Ray, `corner-bodega-night` / `deli-grocer-storefront`
  / `elsol-bodega-*` for Mr. Chen, `bar-hotel-corner-steam` for the alley gate.
- **District arrival art.** One establishing shot per district on travel:
  `chicago-el-track-hotdog` (Chicago), `tropicana-hotel-miami` and
  `art-deco-hotel-neon` (Miami), `nola-swing-bar-door` and `nola-balcony-interior`
  (NOLA), `rowhouse-street` (Baltimore), `sunset-palms-*` (LA/Miami strip).

Two are multi-panel sheets needing slicing before use: `alley-variations-4panel`,
`jukebox-doors-4panel`.

## `topdown-recolor/` — 12 files. **Investigated and closed. Wrong projection.**

This section previously said "right subjects, wrong palette" and recommended a
palette swap as the cheap fix. That was investigated properly and it is wrong on
both counts. Do not spend time here.

**Colour is not the blocker.** The master palette *contains* violet — `#2A1138`
and `#521C6E` in `cool_tones` — so remapping these assets to
`concrete_kings_64.json` legitimately keeps them purple. It was tested: the lamp
comes out just as violet after `-remap`. There is no out-of-gamut colour to
correct. (These are also 2048x2048 with 6,600-72,900 unique colours, so a
`SpriteRenderer` index swap was never going to apply to them anyway — that needs a
small indexed set.)

**Projection is the blocker, and it is fatal for 9 of the 12.** The map is
strictly top-down — roofs seen from directly overhead. These are not:

| Asset | Projection | Verdict |
|---|---|---|
| `iso-building-antennas` | isometric | unusable |
| `iso-building-fire-escape` | isometric | unusable |
| `iso-courtyard-building` | isometric | unusable |
| `iso-garage-shop` | isometric | unusable — the nicest of the batch, and still unusable |
| `iso-pallet-stack` | isometric | unusable |
| `furniture-street-lamp` | side-on | unusable, same failure as the generated lamp prop |
| `flora-weed-cluster` | side-on blades | unusable |
| `prop-car` | 3/4 front | unusable, same failure as the generated car prop |
| `icon-house` | flat front elevation | a UI icon, not map art |
| `road-lane-markings` | **top-down** | correct, but the renderer already draws lane markings |
| `road-street-segment` | **top-down** | correct, but the renderer already draws roads |
| `road-wet-puddles-rain` | **top-down** | correct, but weather is a separate composite pass |

So the three usable ones are redundant with procedural geometry that already looks
better, and the other nine cannot be fixed by any amount of recolouring. This is
the same lesson as the generated lamp and car props: **projection is not
correctable in post, colour is.** Screen new generations for viewing angle first.

## `decals/` — 4 files. Usable as-is.

`cassette-block-tag-graffiti`, `grit-graffiti-tag`, `tire-marks`,
`drain-green-burst`. Overlay decals; the pack's layer 3. The two graffiti tags
are on-brief and good.

## `ui-mockups/` — 5 files. Not assets.

`grit-screenshake-demo` (an annotated diagram of a ghosting after-effect),
`hazard-rating-grit-plate`, and three near-identical `midtown-grit-danger-sign-*`
variants. These are HUD/UI explorations, not game art. Keep for reference; do
not import as sprites.

## `unusable/` — 2 files.

`neon-abstract-pattern`, `neon-platform-unclear`. No recognisable subject.

---

## Why the tile generations drifted

The eight `assets/*_raw.png` city files (still at `assets/` root, 2048x2048) and
most of `topdown-recolor/` share one failure: a violet + neon-green palette that
appears nowhere in `concrete_kings_64.json`. Worth checking before the next batch:

- **Palette placeholders may not have been substituted.** The templates in
  `RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md` read `Palette: [3 hex codes from
  district profile]`. Sent literally, the model invents a palette — and a
  generic "retro pixel" default is exactly neon-on-dark. Paste the real hex
  values from `CITY_ART_PROMPTS.md`.
- **"Background: solid black for tile extraction" fought the brief.** Several
  outputs are mostly black with neon markings, which reads as compliance with
  the background instruction rather than as a city.
- **The atlas instruction did not take.** `miami_raw.png` is a single AC unit
  framed like a picture, not a tile grid. 2048x2048 for what should be 16x16
  tiles means no tile grid and no gutter, so nothing is sliceable.
- **What did work:** every landscape scene in `scenes/`. Those prompts produced
  on-palette, coherent art. If tiles keep drifting, the scene prompts are the
  proven pattern to copy structure from.

## `assets/*_raw.png` (root, 8 files)

`harlem_raw` through `oakland_raw`, 2048x2048, all eight genuinely different.
Same palette failure as above; `harlem_raw` is abstract parking-stall striping,
`miami_raw` is a single framed AC unit. Not sliceable as tilesets. Left in place
pending regeneration rather than sorted, since they are the current working set.

## `*_tileset_raw.jpg` — 4x4 city tile atlases. Use them as decals, not tiles.

Two exist so far, `harlem` and `detroit`, and unlike the earlier `*_raw.png`
generations these worked: 1024x1024, four rows of four 256px cells, on-palette
and coherent. Run them through `scripts/slice-tilesets.sh`.

Row by row, what each is good for:

| Row | Content | Verdict |
|---|---|---|
| 0 | Surface textures — asphalt, concrete, brick, gravel, dirt | Not usable as a tiled ground fill (see below) |
| 1 | Road markings — zebra, centre line, dashes, parking box | Redundant; the renderer draws these procedurally and crisply |
| 2 | **Detail — drains, manholes, vents, litter, oil slicks** | **In use as ground decals** |
| 3 | Building facades | Side-on, so unusable on a top-down map |

**Do not pattern-fill the ground with row 0.** It was tried. These cells are
individually illustrated, each with a dark border and one dominant motif, so
repeating one stamps the same crack star across the whole map in an obvious
grid. A 64px tile made it worse, because the motif became more legible. The row-0
cells were also tried as occasional surface patches and cut: Harlem's is a
two-tone wall/floor boundary and Detroit's a bright orange square, and both read
as a pasted tile. Detroit's asphalt cell additionally has a dashed lane line
baked into it, which tiles lane markings across every road.

The flat procedural surfaces read cleaner than any of this. Row 2 is where these
generations are genuinely strong, so that is what ships.

Two things the slicer handles that are easy to miss. Each decal carries its own
field colour baked in, so it draws as a square patch with the object on top —
the slicer measures that field and tones the tile to the district's `walk`
colour, matching both luminance and hue. Matching luminance alone still left
warm-grey squares sitting on cool blue-grey pavement.

Decals are drawn at the width of the sidewalk they sit on, not a fixed size:
sidewalk bands are 20px, so a 32px decal cannot fit inside one at all.

Five districts still have no atlas. They draw the decal vocabulary procedurally
instead — a drawn manhole, grate, litter scatter and stain in the district's own
palette — so no block reads as unfinished next to a neighbour full of detail. A
district that has *any* art uses only that art and skips the slots it has no
sprite for: a photographic drain beside a hand-drawn one looks like a bug, not
like variety.

So generating an atlas for a district is an upgrade, never a prerequisite.
`DECAL_KEYS` in `topdown-city-renderer.js` is the vocabulary to fill.

## `props/web/` — street furniture. Two of four are the wrong projection.

Run every new prop through `scripts/process-props.sh`. It trims the transparent
padding the generator leaves around a small subject, pre-scales to the exact size
the renderer draws it (`FURNITURE_DISPLAY` in `topdown-city-renderer.js`), and
thresholds alpha to binary. Skipping it is how lamps first shipped looking like
hair-thin squiggles: the canvas runs with `imageSmoothingEnabled = false`, so a
96x96 source drawn at 18x30 is point-sampled and the grid misses a thin post.

| File | Status |
|---|---|
| `phone_booth_prop.png` | **In use.** Reads as a lit booth at 14x26. |
| `dumpster_prop.png` | **In use.** Reads as a bin at 24x22. |
| `street_lamp_prop.png` | **Not declared in the manifest.** Side-on lamp post with a ground light pool — a side view fights the top-down projection. Renderer draws a procedural warm light pool instead. |
| `car_prop.png` | **Not declared in the manifest.** Front-on view of a vehicle, so it read as a gold picture frame lying on the asphalt. Renderer draws a procedural top-down car instead. |

Do not re-add the two undeclared sprites to `assets/manifest.json` without
regenerating the art from directly overhead. A wrong-perspective sprite looks
worse than the procedural shape it replaces. Both `drawCar` and `drawFurniture`
keep their asset branch, so correct art needs only the manifest entry.

The five POI props (`bodega_storefront`, `barbershop_pole`, `chess_table`,
`locked_door`, `shop_deal`) are correct and in use.

`shop_deal` took three passes to get clean and is worth knowing about:

1. It shipped with a fully **opaque white background**, because `-transparent
   black` does not clear a white border. It drew as a solid box.
   `test/manifest-integrity.test.js` now guards corner alpha.
2. A 14% corner flood-fill cleared the solid white but left the **anti-aliased
   grey ring**, which read as a white outline round the building on dark asphalt.
3. Raising the fuzz did nothing, because a flood-fill seeded on an
   already-transparent corner matches only transparent pixels. The background has
   to be flattened back to white first so the fill has a real seed colour.

`scripts/process-props.sh` does step 3, for `shop_deal` only. The other four POI
props are clean and must not be put through it — see the warning in the script
about why no pixel metric decides membership of that list.
