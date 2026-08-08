# Top-Down Walkable City Map — Design Spec

Date: 2026-08-08
Status: Approved for planning

## Context

`UI_WIREFRAME_CITY_MAP.txt` specifies the City/Block Map as a 32x32 tile grid rendered with ASCII glyphs: `@` for the player, `R`/`J`/`M`/`K` for NPCs, `*`/`?`/`!` for quests, `#` for fog. The shipped screen implements that faithfully — a 16x13 grid of `#` characters with a six-entry legend beneath it. Verified in-browser at 1280x720.

Three problems, in order of severity:

1. **The rendering fights the content.** The map's real subject is eight named gathering places across eight cities — Harlem Stoop, Detroit Lot, Chicago Greystone, Miami Cut, Baltimore Steps, Atlanta Porch, Oakland Corner, NOLA Balcony (`index.html`, `renderBlockMap`). Those names appear only in the Fast Travel side list, never on the map. The map shows `#`.
2. **It needs a decoder ring.** Six legend entries exist to explain six glyphs. A map that requires a legend to read is not intuitive.
3. **The map is decorative.** Fast travel via the side list is strictly more usable than clicking tiles, so the grid is ornament rather than interface.

Research supports replacing the grid outright rather than restyling it. Node/POI-based maps outperform tile grids specifically when "distance between activities is irrelevant" and the game "prioritizes decision-making over exploration" — which describes discrete fast-travel destinations exactly. Sources: [Why are roguelike map screens like this?](https://cohost.org/mrhands/post/5845224-why-are-roguelike-ma), [Slay the Spire map generation](https://steamcommunity.com/sharedfiles/filedetails/?id=2830078257).

The chosen visual target is a dense top-down pixel-art city (reference supplied by the project owner: a 16-bit-era overhead city block with lane-marked roads, zebra crosswalks, painted parking lots, rooftop mechanical clutter, street trees, traffic, and consistent drop shadows). A canvas proof-of-concept confirmed the reference decomposes into flat rectangles, circles, and one shared shadow offset — the same primitives the existing pixel engine already uses — reaching roughly one third of the reference's density without any external art. The remaining density gap is closed by importing generated assets (see Section 5), not by more procedural code.

## Design

### 1. What replaces what

The top-down walkable district map becomes the single exploration surface in the game.

- The `blockMap` screen's tile grid is replaced by the top-down map.
- The side-on `stage-canvas` block viewport is removed from the `#game` screen.

The second point is deliberate and has a second benefit. At 1280x720 the side-on viewport consumes the entire viewport, pushing the player's hand, the black card, the stat HUD, and the scoreboard below the fold, and truncating the interaction prompt mid-sentence — verified by screenshot. Removing it fixes that as a side effect. Keeping both surfaces was rejected: both would host the same five POIs with different control feels, and the density of the top-down map only earns its cost if the player moves through it.

Three couplings must be preserved through the migration. Each is a silent-breakage risk, not a blocker:

- **Shared canvas.** `stage-canvas` currently renders when `gameActive || mapActive` — one canvas already serves both screens. This is a re-homing, not a delete-and-rebuild.
- **Online multiplayer avatars.** `mapController` broadcasts `{x, y, origin, frame}` so remote players render on the block view via `app.remoteAvatars`. The replacement must broadcast top-down coordinates or this feature dies quietly.
- **Weather compositing.** `weatherSystem` renders rain/sirens/neon into the same canvas. It must composite onto the top-down canvas instead.

### 2. Structure

Four new focused modules. Data, drawing, state, and asset loading are separated so that everything except drawing is unit-testable under `node --test`.

- **`src/pixel_engine/topdown-city-data.js`** — the eight district layouts as pure data. Each district declares: its palette, road bands, sidewalk bands, parcels (`{x, y, w, h, kind, roof, solid}`), decoration anchors (trees, parked cars, parking lots), and the five POI anchor positions. Palettes are authored per district from that city's profile in `CITY_ART_PROMPTS.md` (which supplies the intent — Detroit's sodium-vapour amber, Miami's Art Deco neon), with every colour drawn from the 64-entry master gamut in `assets/palettes/concrete_kings_64.json` so the eight districts stay visually related. Where a profile colour is not in the master palette, the nearest master entry is used and the substitution noted in the data file. Hand-authored per district, not procedurally generated — procedural layout is the main cause of same-feeling districts, and hand-authoring is the only way each city reads as a distinct place.
- **`src/pixel_engine/topdown-city-renderer.js`** — pure drawing. Given district data, a camera, and an asset registry, it paints ground, roads with lane dashes, zebra crosswalks, sidewalks with highlight edges, parcels as roof-plus-visible-face, rooftop clutter, trees, traffic, POI markers, and the player. Every element consults the asset registry first and falls back to its procedural form (Section 5).
- **`src/pixel_engine/topdown-city-controller.js`** — state and input. Two-axis movement, axis-aligned rect collision against parcels marked `solid`, camera-follow clamped to map bounds, POI proximity detection, and district switching subject to the existing heat gate.
- **`src/pixel_engine/asset-registry.js`** — manifest parsing, image preloading, and keyed lookup with graceful fallback. Separate module because it is not map-specific; cards and characters can adopt it later.

### 3. Behaviour

**Map and camera.** Each district's world is 2.5x the viewport in both axes, so camera movement is meaningful. The camera centres on the player and clamps to world bounds, so the view never shows past the edge.

**Movement and collision.** WASD/arrows move the player in two axes at the existing walk speed. Collision tests the player's feet box against every parcel with `solid: true`; roads, sidewalks, parks, and parking lots are walkable. Collision is resolved per-axis so sliding along a wall works rather than sticking.

**POIs.** The same five POIs appear in every district: Ray (Barber), Mr. Chen (Bodega), Mr. Chen (Counter Deal), T-Bone (Chess Park), and the Back Alley Gate. Each is backed by a real `enterNpcScene` call today, so no new content is required. Proximity within the existing threshold shows a prompt; Enter triggers the same handler as now.

Per-district POIs are explicitly **not** introduced. New markers without new mechanics is fake UI. Districts differentiate through palette, layout, and building vocabulary, which is sufficient — the eight researched palettes in `CITY_ART_PROMPTS.md` become visible player-facing variety for the first time.

**District switching.** A district rail lists all eight with heat status. Selecting one is the fast travel action and remains gated by the existing rule that active heat blocks travel. The six-entry legend is deleted; POI and district names render on the map itself.

### 4. Screen layout

The top-down map screen at 1280x720, with no vertical scrolling:

- Top: the existing persistent HUD strip (location, day, heat) — unchanged.
- Left: district rail, eight entries with heat status and lock state.
- Centre: the map viewport canvas, camera-following.
- Bottom: contextual prompt line (the active POI prompt, or movement hint when none is in range) plus Back to Table and Exit to Menu.

The quest filter chips (`ALL`/`ACTIVE`/`HIDDEN`/`URGENT`) are **removed**, not carried over. There is no quest data model in the codebase: the three quest glyphs are hardcoded at fixed grid coordinates in `renderStrategicMap` (cells 4,3 / 16,3 / 16,8) and `shouldRenderQuestSymbol` filters those three literals. The chips are a filter over decoration. Reproducing them on the new map would be fake UI. If a real quest system lands later, the filter returns with data behind it.

Fog of war is removed on the same grounds. The wireframe specifies that fog hides unexplored tiles, but the codebase has no explored/visited tracking of any kind — the `#` glyphs are painted unconditionally. Fog implies discovery the game does not model.

### 5. Asset import

Generated pixel assets must drop in without code changes. The registry is additive: the map renders correctly with zero assets present, and each imported asset upgrades one element.

**Current asset state, stated plainly so the plan does not assume otherwise:** `assets/sprite_packs/` contains eight `city_*_tiles.png` files at 256x256 that are byte-identical to each other (verified by md5) — a four-band material swatch duplicated under eight names. `assets/atlases/master_tiles_atlas.png` is a single 32x32 brick tile repeated 256 times. These are placeholders. `assets/palettes/concrete_kings_64.json` is the exception — a real, tone-grouped 64-colour master palette, used as the district colour gamut per Section 2. Building the import path now means generated art lands without further code work; it will not visibly change anything until differentiated art replaces the placeholders.

**Manifest.** A new `assets/manifest.json`:

```json
{
  "version": 1,
  "tileSize": 32,
  "sources": {
    "harlem_tiles": "assets/sprite_packs/city_harlem_tiles.png"
  },
  "sprites": {
    "harlem.road_h":     { "source": "harlem_tiles", "x": 0,  "y": 0, "w": 32, "h": 32 },
    "harlem.roof_brick": { "source": "harlem_tiles", "x": 32, "y": 0, "w": 32, "h": 32 }
  }
}
```

**Lookup and fallback.** Sprite keys are `<district>.<element>`. The renderer calls `registry.get(key)`, which returns a slice descriptor or `null`. On `null` — key absent, source file missing, or image failed to load — the renderer draws that element procedurally. Consequences:

- A missing or malformed manifest degrades the whole map to fully procedural rendering rather than breaking it.
- A broken image never renders as a broken-image box; the failed source is marked unavailable at load and every key referencing it returns `null`.
- Partial asset coverage is a supported steady state: imported roofs with procedural roads is valid.

Unknown keys and unresolvable sources are recorded on the registry for diagnostics and logged once at load. They are never thrown, because a missing decorative tile must not take down the screen.

### 6. Wireframe document

`UI_WIREFRAME_CITY_MAP.txt` is rewritten to describe this design: the top-down district map, the district rail, walkable movement and collision, the POI set, the asset manifest contract, and per-district palette sourcing. The ASCII glyph grid, the glyph legend, the fog rules, the quest filter, and the zoom controls are removed, because none survive into the new design.

## Testing

Unit tests under `node --test`, following the existing `loadGameModule()` and `MockCanvas` conventions:

- **Data:** all eight districts present; every district has a palette of valid hex colours, at least one road band, at least one solid parcel, and exactly five POI anchors; no POI anchor sits inside a solid parcel; no parcel extends outside world bounds.
- **Controller:** movement into a solid parcel is blocked on that axis while sliding continues on the other; camera clamps at all four world edges; camera centres the player away from edges; POI proximity fires inside the threshold and not outside; district switching is refused when heat gates it and permitted when clear.
- **Asset registry:** a valid manifest resolves keys to slice descriptors; an unknown key returns `null`; a manifest naming a missing source marks that source unavailable and returns `null` for its keys without throwing; a malformed manifest yields an empty registry rather than an exception. Image loading is injected so these run without DOM or network.
- **Migration regression:** no live reference to `stage-canvas` or the removed side-on render path survives; the multiplayer broadcast still emits coordinates on movement.

Rendering fidelity and the feel of movement are verified in-browser with screenshots at 1280x720, plus a check that the map screen does not scroll vertically at that size.

## Out of scope

- The card-table layout rework on the `#game` screen. Removing the side-on viewport reclaims the space; redesigning what fills it is a separate project.
- The Game Board state wireframes, and collapsing the near-duplicate `UI_WIREFRAME_GAME_BOARD.txt` and `UI_WIREFRAME_MAIN_GAME_SCREEN.txt` into one document.
- Generating art assets. This spec builds the import path; producing differentiated per-city tiles is the project owner's parallel work.
- Per-district POIs, quests, or NPCs beyond the existing five.
- Zoom controls. The camera follows the player at a fixed scale; the current screen's zoom buttons are removed rather than reimplemented.
