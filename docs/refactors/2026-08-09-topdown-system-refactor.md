# Concrete Kings — Top-Down System Refactor Prompt

## Goal
Refactor the existing top-down system into a modular, state-authoritative
architecture inspired by proven top-down template patterns, while preserving
Concrete Kings' current noir pixel-art rules, 4-frame animation budget,
integer scaling, and deterministic palette discipline.

This prompt is scoped to:
- `src/pixel_engine/topdown-city-renderer.js`
- `src/pixel_engine/topdown-city-controller.js`
- `src/pixel_engine/topdown-city-data.js`
- `src/pixel_engine/block-map-navigation.js`
- `src/pixel_engine/lightmap.js`
- `src/pixel_engine/asset-registry.js`
- `index.html` top-down/map wiring
- related tests under `test/`

## Transferable Patterns From Tutorials

From the top-down template:
- modular systems with one responsibility per module
- state-driven UI refresh, not DOM-driven state
- explicit input abstraction for keyboard + controller
- one collision resolver instead of ad hoc checks
- centralized camera follow with world-edge clamping
- proximity trigger + single `interact()` entry for NPCs/shops/POIs
- deterministic save/load schema for position, inventory, quests, flags
- asset-first rendering with procedural fallback

From the indie formula video:
- story beats and gameplay should be deterministic bridges, not freestyle
- small gameplay loops should feed larger narrative state cleanly
- world state must be felt in gameplay systems, not just flavor text

## Concrete Kings Constraints (Do Not Break)
- 1280x720 native canvas baseline with integer scaling
- strict 4-frame animation budget
- strict palette discipline from `pixel-engine.js`
- no flat-black shading; all shading via `paletteShift`
- existing tests must remain green under `npm test`
- no new runtime dependencies
- no build step

## Required Architecture Changes

### 1. Authoritative World State
Create one runtime state object that owns:
- district, tile position, facing direction
- heat, trust map, flags, receipts
- active POI, queued mini-game, act/beat index
- inventory/shop stock if applicable
- camera target and bounds

Everything reads from this object. Nothing mutates hidden local copies.

### 2. Input Normalization
Replace direct key checks with a tiny input map:
- keyboard arrows/WASD
- controller stick + dpad
- one `getMoveVector()` result consumed by movement
- one `getInteract()` result consumed by interaction

This keeps movement code identical across platforms and removes scattered listeners.

### 3. Movement + Collision
Use one movement resolver per tick:
- read input vector
- attempt X then Y separately
- check district parcel collision
- clamp to world bounds
- emit one movement event for camera/renderer/audio

Do not duplicate collision math in renderer or controller.

### 4. Animation State Machine
Keep the 4-frame budget, but make it explicit:
- states: idle, walk, interact, mini-game feedback
- one transition hook per state change
- renderer and controller both read the same state object
- no hidden per-file frame counters

### 5. Camera
One camera service:
- follows authoritative position
- lerp or fixed step, not magic per-frame offsets
- world-edge clamping using district bounds
- no camera logic in renderer draw loops

### 6. Proximity + Interaction
Replace scattered hotspot checks with:
- one proximity test per tick against current POI list
- single `interact()` entry point
- POI types: NPC, shop, quest board, vehicle, landmark
- interaction result mutates authoritative state, then UI refreshes

### 7. Asset Registry Integration
Keep asset-first with procedural fallback:
- registry returns null for missing assets
- renderer never throws on missing asset
- one manifest maps sprite keys to source files and display sizes
- tilemaps and props share the same registry pattern

### 8. Tilemap Layering
Match tutorial layering discipline:
- ground
- collision/walls
- props/flora
- walk-behind decor
- player
- weather/HUD overlays

Concrete Kings already has this intent; make it explicit in one layer-order constant.

### 9. Mini-Game Bridge
Mini-games must read/write only authoritative state:
- mini-game queue lives in state
- start mutates state to `miniGameActive`
- end resolves rewards/flags/heat/trust back into state
- UI observes state changes, mini-game never touches DOM directly

### 10. Scenario Compiler Integration
Use the existing structured scenario compiler as the narrative bridge:
- card submission -> `simulation.tick(cardText)`
- beat resolution updates state deterministically
- act breaks and endings are derived from state, not freestyle text
- no LLM call at runtime

### 11. Save/Load Schema
Persist only:
- scenario id
- current beat/act index
- district, position, facing
- heat, trust map, flags, receipts
- inventory/shop stock
- completed side quests
- mini-game state if active

Never persist camera transient state.

## Acceptance Criteria
- `npm test` passes
- no TODO/FIXME/placeholder/no-op/coming soon markers in touched files
- one module owns movement, one owns collision, one owns camera, one owns interaction
- top-down frame draw order matches explicit layer-order constant
- asset registry missing keys degrade to procedural drawing
- controller and keyboard yield identical movement behavior
- mini-game start/end flow mutates only authoritative state
- scenario compiler remains the only card-to-gameplay bridge

## Implementation Order
1. authoritative state schema + snapshot/restore
2. input normalization
3. movement/collision consolidation
4. camera service
5. proximity/interaction unification
6. animation state machine alignment
7. renderer layer-order enforcement
8. mini-game state bridge
9. save/load wiring
10. cleanup dead code and verify tests
