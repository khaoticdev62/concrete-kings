# RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md
# Concrete Kings — High-Detail Retro Pixel Top-Down Walkable Map Asset Prompt Pack
# Version: 1.0
# Target: Google Gemini Pro image generation for top-down tilesets and map assets.

## How to Use This Pack
1. Pick a district/city from the research guide.
2. Choose a tile category from section 2.
3. Use the matching prompt template in section 3.
4. Run generation in Gemini Pro with the “Gemini Pro recipe” in section 5.
5. Validate with section 7 before importing to tilemap.

---

## 1. Visual Target

This pack targets high-detail retro pixel top-down map assets that read as noir urban environments. The look is:
- Top-down / 3/4 hybrid view.
- Walkable ground plane defined by value, not outline.
- Modular tile design with clean edges for tilemap assembly.
- Readable at native tile size and at 4x upscale.
- Noir palette: dark dominant, neon accents, minimal brights.

---

## 2. Tile Categories

### 2.1 Ground Plane
- Asphalt, concrete, sidewalk, brick, terrazzo, dirt, alley.
- Must tile seamlessly on all four edges.
- Must support walk/no-walk distinction through value alone.

### 2.2 Roads and Connections
- Lane markings, crosswalks, curb cuts, parking stalls, bus lanes.
- Must connect cleanly to ground tiles.
- Must show traffic direction or district density through markings.

### 2.3 Buildings and Blocks
- Low-rise, mid-rise, high-rise footprints; setbacks, courtyards, rooftops.
- Roof details: AC units, water tanks, neon signs, antenna arrays.
- Entry types: stoop, garage, lobby, fire escape ladder.

### 2.4 Street Furniture
- Street lamps, bollards, fire hydrants, bus shelters, trash cans, benches.
- Must be single-tile or 2-tile sprites for memory budget.

### 2.5 Flora and Weather Layers
- Tree canopy, palm fronds, kudzu mat, puddle, rain puddle reflection.
- Weather layer must not block walkability read.

### 2.6 Decals and Overlays
- Graffiti, posters, stickers, tire marks, oil stains, chalk outlines.
- Overlay tiles must not obscure gameplay-critical ground value.

### 2.7 Props and Interaction Points
- Car, truck, motorcycle, cart, newspaper box, phone booth, dumpster.
- Props should be 1-2 tiles max and clearly pushable/interactable by silhouette.

### 2.8 Mini-Map and Icons
- District icon, poi marker, quest marker, fast travel marker.
- Must read at quarter resolution on minimap.

---

## 3. Prompt Templates by Tile Category

### 3.1 Ground Plane Template
Subject: top-down [material] tile, [district] noir style.
View: straight down, high detail, pixel art.
Tile size: 16x16 pixels native.
Palette: [3 hex codes from district profile].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling, clean tiling edges.
Noise: [optional texture such as cracks, stains, tire marks].
Readability: walkable area must be clearly darker or lighter than non-walkable area.

### 3.2 Roads and Connections Template
Subject: top-down [road type] tile, [district] noir style.
View: straight down, high detail, pixel art.
Tile size: 16x16 pixels native.
Palette: [3 hex codes from district profile].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling.
Details: lane markings, crosswalk stripes, curb, parking stall.
Readability: road must read as distinct from sidewalk.

### 3.3 Buildings and Blocks Template
Subject: top-down [building type] footprint, [district] noir style.
View: high angle, 3/4 top-down, pixel art.
Tile size: 16x16 or 32x32 pixels native.
Palette: [3 hex codes from district profile].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling.
Details: roof access, setback line, courtyard shadow, rooftop unit.
Readability: building footprint must read as solid obstacle.

### 3.4 Street Furniture Template
Subject: top-down [object] tile, [district] noir style.
View: straight down, high detail, pixel art.
Tile size: 8x8 or 16x16 pixels native.
Palette: [2 hex codes from district profile, 1 highlight].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling.
Readability: object must be readable at minimap scale.

### 3.5 Flora and Weather Template
Subject: top-down [flora or weather effect], [district] noir style.
View: straight down, high detail, pixel art.
Tile size: 16x16 or 32x32 pixels native.
Palette: [2 hex codes from district profile, 1 weather color].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling.
Readability: must not block gameplay-critical ground read.

### 3.6 Decals and Overlays Template
Subject: top-down [decal type], [district] noir style.
View: straight down, high detail, pixel art.
Tile size: 16x16 pixels native.
Palette: [1 dominant color, 1 highlight].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling.
Readability: must be legible at native tile size.

### 3.7 Props and Interaction Points Template
Subject: top-down [prop], [district] noir style.
View: high angle, 3/4 top-down, pixel art.
Tile size: 16x16 or 32x32 pixels native.
Palette: [2 hex codes from district profile, 1 highlight].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling.
Readability: prop silhouette must suggest interaction without text.

### 3.8 Mini-Map and Icons Template
Subject: top-down [icon type] minimap icon, noir style.
View: straight down, high detail, pixel art.
Tile size: 8x8 or 16x16 pixels native.
Palette: [1 dominant color, 1 highlight].
Style: retro pixel art, no anti-aliasing, nearest-filter scaling.
Readability: must read at quarter resolution.

---

## 4. City-Specific Top-Down Map Tile Prompts

Use these to generate full district tilesets grounded in real city visuals.

### 4.1 Detroit — Midtown Alley Tileset
Ground tiles:
- Cracked concrete, oil-stained asphalt, half-lot prairie grass, brick sidewalk patch.
Road tiles:
- Lane markings on wide avenue, alley mouth, parking-lot stall grid, shoulder rumble strip.
Building tiles:
- Industrial brick block, boarded storefront footprint, security grille entry, half-lot void.
Furniture tiles:
- Street light pole, dumpster, fire hydrant, security camera pole, chain-link fence gate.
Flora tiles:
- Tall grass cluster, weed line through crack, alley tree stump.
Decal tiles:
- Hand-painted sign, boarded window, grille graffiti, tire burn mark.
Prop tiles:
- Old sedan, van, shopping cart, propane tank, pallet stack.
Icon tiles:
- District icon, poi marker, quest marker, safe zone marker.

### 4.2 Miami — Ocean Drive Strip Tileset
Ground tiles:
- Pastel terrazzo sidewalk, wet asphalt, palm-shadow stripe, street drain.
Road tiles:
- Parking stall line, crosswalk, bus lane, hotel porte-cochère drop zone.
Building tiles:
- Art Deco hotel footprint, pastel stucco block, palm courtyard, neon marquee roof.
Furniture tiles:
- Art Deco street lamp, palm planter, hotel awning pole, bike rack.
Flora tiles:
- Palm frond cluster, tropical shrub, palm-shadow stripe, moss patch.
Decal tiles:
- Neon hotel sign decal, geometric border decal, steam vent decal, tourist flyer.
Prop tiles:
- Classic car, motorcycle, scooter, luggage cart, beach cruiser.
Icon tiles:
- District icon, poi marker, quest marker, nightlife marker.

### 4.3 New Orleans — French Quarter Corner Tileset
Ground tiles:
- Flagstone sidewalk, brick alley, streetcar track, wet cobble.
Road tiles:
- Single-lane street, carriage lane, streetcar slot, parking notch.
Building tiles:
- French Quarter townhouse footprint, iron balcony footprint, courtyard well, bar storefront.
Furniture tiles:
- Gas lamp post, iron balcony railing, carriage stop, fountain edge.
Flora tiles:
- Live oak canopy patch, hanging plant basket, oak leaf scatter, moss on stone.
Decal tiles:
- Beads on ground, jazz poster, second-line chalk mark, bar neon sign decal.
Prop tiles:
- Horse cart, saxophone case, jukebox delivery dolly, Mardi Gras float segment.
Icon tiles:
- District icon, poi marker, quest marker, jazz marker.

### 4.4 Houston — Underpass Strip Tileset
Ground tiles:
- Stained concrete pad, highway shoulder, bodega sidewalk, freeway pillar shadow.
Road tiles:
- Freeway lane, on-ramp merge, underpass lane, sound wall edge.
Building tiles:
- Strip mall footprint, bodega box, billboard pylon, parking garage ramp.
Furniture tiles:
- Freeway light pole, bodega awning post, taco truck trailer hookup, guardrail.
Flora tiles:
- Bayou reed cluster, kudzu mat, palm pot, drainage ditch grass.
Decal tiles:
- Sound wall graffiti, taco truck menu sticker, water stain decal, neon bodega sign.
Prop tiles:
- Taco truck trailer, sedan, pickup, shopping cart, portable AC unit.
Icon tiles:
- District icon, poi marker, quest marker, fuel marker.

### 4.5 Baltimore — Rowhouse Alley Tileset
Ground tiles:
- Formstone sidewalk, brick alley, marble step pad, alley communal table pad.
Road tiles:
- Alley mouth, street parking notch, crosswalk, loading zone.
Building tiles:
- Formstone rowhouse footprint, marble stoop, alley market stall, painted screen window.
Furniture tiles:
- Porch lamp, white marble step, fire escape ladder drop, alley table.
Flora tiles:
- Window box flower, alley weed, vine on fence, potted tomato.
Decal tiles:
- Painted screen pattern, door paint mark, neighborhood tag, cheesesteak wrapper.
Prop tiles:
- Bicycle, milk crate, folding chair, trash can, shopping cart.
Icon tiles:
- District icon, poi marker, quest marker, community marker.

### 4.6 Chicago — El-Track Block Tileset
Ground tiles:
- Concrete L platform, wet asphalt, brick alley, riverwalk plank.
Road tiles:
- L track slot, street parking notch, bus stop zone, alley loading zone.
Building tiles:
- Limestone facade block, theater marquee footprint, alley garage, hot dog stand hut.
Furniture tiles:
- El light pole, heat-lamp pole, bike rack, newspaper box, fire escape drop.
Flora tiles:
- Alley weed cluster, planter box, dead flower patch, snow drift in winter.
Decal tiles:
- Theater marquee decal, neon sign decal, chalked parking mark, el shadow decal.
Prop tiles:
- Hot dog cart, sedan, el bench segment, newspaper stand, bike.
Icon tiles:
- District icon, poi marker, quest marker, transit marker.

### 4.7 New York — Bodega Block Tileset
Ground tiles:
- Sidewalk slab, asphalt lane, subway grate tile, manhole steam patch.
Road tiles:
- Parking lane, bike lane, bus stop zone, crosswalk.
Building tiles:
- Bodega storefront footprint, fire escape landing, brownstone stoop, stacked sign wall.
Furniture tiles:
- Fire escape ladder, subway stair, bodega awning pole, newsstand.
Flora tiles:
- Tree pit, weed through grate, planter box, leaf litter.
Decal tiles:
- Stacked sign decal, poster layer, sticker layer, steam vent decal.
Prop tiles:
- Hot cart, scooter, mailbox, trash bag, folding table.
Icon tiles:
- District icon, poi marker, quest marker, subway marker.

### 4.8 Los Angeles — Boulevard Strip Tileset
Ground tiles:
- Stucco sidewalk, asphalt boulevard, palm-shadow stripe, mural wall pad.
Road tiles:
- Driveway cut, parking stall, bus lane, freeway shoulder.
Building tiles:
- Strip mall footprint, motel block, mural wall footprint, drive-in speaker post.
Furniture tiles:
- Neon motel sign post, palm planter, bus shelter, billboard base.
Flora tiles:
- Palm frond cluster, bougainvillea hedge, desert shrub, weed line.
Decal tiles:
- Mural eye decal, neon script decal, sticker bomb decal, tire mark decal.
Prop tiles:
- Classic sedan, lowrider bike, taco stand trailer, surfboard rack.
Icon tiles:
- District icon, poi marker, quest marker, drive marker.

---

## 5. Gemini Pro Generation Recipe

Use this exact prompt shape for best results. Gemini Pro responds well to structured subject-view-style-details prompts.

### 5.1 Base Prompt Formula
Subject: [tile subject from section 3].
View: [straight down / high angle 3/4 top-down].
Format: single tile, seamless edges, [tile size] native pixels.
Style: high-detail retro pixel art, noir urban [district/city], nearest-filter scaling, no anti-aliasing.
Palette: [3-4 hex codes].
Details: [2-4 must-have details].
Background: solid black for tile extraction.
Negative: realistic photo, 3D render, blurry, watermark, text, people, animals, extra objects outside tile bounds.

### 5.2 Batch Prompt Template
Generate a top-down noir urban tileset for [district].
Tiles needed: [list from section 4].
Style: high-detail retro pixel art, [city] visual signature, nearest-filter scaling, no anti-aliasing.
Palette: [3-5 hex codes].
Tile size: 16x16 native, some 32x32 for buildings/props.
Output: flat tiles on black background, no drop shadows between tiles.
Negative: realistic photo, 3D render, blurry, watermark, text, people, animals.

### 5.3 Style Lock Prompt
Use this at the start of every batch to fix Gemini style drift.
Style lock: high-detail retro pixel art, noir urban top-down tileset, [city/district].
Rules: 16x16 or 32x32 native pixels, nearest-filter scaling, no anti-aliasing, clean tile edges, solid black background, no text, no people, no animals.
Palette: [3-5 hex codes].
Output: tiles only, no UI, no borders, no sample layout.

### 5.4 Negative Prompt Block
Always append this negative block:
Negative: blurry, low quality, distorted, watermark, text, logo, people, animals, realistic photo, 3D render, soft shadows, anti-aliasing, gradients, out-of-tile objects, extra debris beyond tile bounds.

---

## 6. Tileset Assembly Workflow

### 6.1 Atlas Layout
- Use a power-of-2 atlas: 256x256, 512x512, or 1024x1024.
- Place tiles in a grid with 1-pixel gutter to avoid sampler bleed.
- Name tiles by category and index: `d_ground_01.png`, `d_road_03.png`.

### 6.2 Collision and Walkability
- Assign walkability per tile, not per sprite.
- Ground = walk.
- Road = walk with speed modifier.
- Building footprint = no walk.
- Prop = no walk unless explicitly tagged pushable.
- Decal = walk-through if on ground; no walk if on building.

### 6.3 Parallax and Depth
- Ground and roads: layer 0.
- Props and furniture: layer 1.
- Flora and weather: layer 2.
- Decals on buildings: layer 3.
- Roof details: layer 4.

### 6.4 Day/Night and Weather Variants
- Day variant: brighter values, same shape.
- Night variant: darker values, neon accents active.
- Rain variant: add rain pixels and ground reflections on top of night variant.
- Fog variant: reduce value contrast, add 1-pixel haze overlay.

### 6.5 District Transitions
- Border tiles must contain elements from both districts.
- Keep anchor prop/light consistent across border tiles.
- Use neutral ground tile at exact boundary to avoid visual snap.

---

## 7. Review Checklist

Before importing any generated tile:
- [ ] Reads at native tile size on 320x180 canvas.
- [ ] Reads at 4x upscale on 1280x720 canvas.
- [ ] Edges are clean and tileable on all sides.
- [ ] Walkability is clear from value alone.
- [ ] Palette matches district profile.
- [ ] No text, people, or animals.
- [ ] No anti-aliasing or soft shadows.
- [ ] No tile bleed or sampler artifacts.
- [ ] Noir tone preserved: dark dominant, neon accents sparingly used.
- [ ] Minimap icon legible at quarter resolution.

---

## 8. Batch Generation Plan

Use this plan to generate a full district tileset in one day.

### 8.1 Day 1: Style Lock and Ground Plane
- Run style lock prompt.
- Generate 8-12 ground tiles: base concrete, asphalt, sidewalk, brick, alley, dirt, wet patch, stain variant.
- Validate tiling and walkability.

### 8.2 Day 2: Roads and Connections
- Generate 6-10 road tiles: lane, crosswalk, curb, parking, bus lane, shoulder, underpass, track slot.
- Validate connection to ground tiles.

### 8.3 Day 3: Buildings and Blocks
- Generate 8-12 building/prop tiles: low-rise, mid-rise, stoop, garage, marquee, billboard, pylon, courtyard.
- Validate obstacle read.

### 8.4 Day 4: Street Furniture and Flora
- Generate 8-12 furniture/flora tiles: lamp, hydrant, bench, trash can, tree, palm, kudzu mat, planter.
- Validate layer separation.

### 8.5 Day 5: Decals, Props, and Icons
- Generate 8-12 decal/prop/icon tiles: graffiti, poster, sticker, car, cart, crate, district icon, poi marker.
- Validate minimap readability.

### 8.6 Day 6: Variants and Polish
- Generate night/rain/fog variants for 5 high-use tiles.
- Generate border tiles for district transition.
- Final checklist pass.

---

## 9. Integration Points

- `src/pixel_engine/block-map-navigation.js`: tilemap data, collision, walkability.
- `src/pixel_engine/high-detail-scale.js`: tile scaling for 1280x720.
- `index.html`: minimap render, district icons, poi markers.
- `src/pixel_engine/first-miles-campaign.js`: encounter placement tied to tile types.
- `test/`: tile atlas validation, collision tests, palette compliance.

---

## 10. Versioning

- Major: change tile size, projection, or style rules.
- Minor: add city, district, or tile category.
- Patch: prompt clarification, example update, palette tweak.
