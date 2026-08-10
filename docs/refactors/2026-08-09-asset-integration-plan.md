# Concrete Kings — Asset Integration Plan

## Primary Pack
**GandalfHardcore — FREE 32x32 Modern City**
- URL: https://gandalfhardcore.itch.io/free-pixel-art-sidescroller-asset-pack-32x32-city
- Contains: 32x32 floors/walls/asphalt, building facades with windows/doors, shop tiles, traffic props, 3 background layers
- License: free for commercial/non-commercial use; no resale/redistribution
- Manual download required

## Complementary Packs
- **Free Pixel Art Street Backgrounds** — 4 seamless 1920x1080 street backdrops
  https://free-game-assets.itch.io/free-pixel-art-street-backgrounds
- **Free Cyberpunk Scrolling City Backgrounds** — 8 seamless city/industrial backgrounds
  https://free-game-assets.itch.io/free-scrolling-city-backgrounds-pixel-art
- **Free Pixel Art 32x32 Detective Mystery Pack** — noir props
  https://kabukidanshi.itch.io/pixel-art-32x32-detective-mystery-pack

## Manual Download Steps
1. Visit the GandalfHardcore city pack page
2. Click Download Now / name-your-own-price
3. Extract the zip to a temp folder
4. Copy the contents into this repo:
   - `public/assets/city-tiles/` — tiles and props
   - `public/assets/city-backgrounds/` — background layers
5. Run the palette validation script (to be created)
6. Update `src/pixel_engine/topdown-city-renderer.js` to reference the new assets

## Repo Structure After Integration
```
public/assets/
├ city-tiles/
│ ├ floors/
│ ├ walls/
│ ├ props/
│ └ shop-tiles/
├ city-backgrounds/
│ ├ layer1/
│ ├ layer2/
│ └ layer3/
├ cyberpunk-noir/
│ └ void-tiles.png  # small prop reference only
└ ui-mockups/
  └ reference-baseline.png
```

## Palette Compliance
- This repo uses `MASTER_PALETTE_64` in `src/pixel_engine/pixel-engine.js`
- All imported assets must be validated against this palette
- Colors outside the palette must be mapped to the nearest allowed color
- Validation script to be added under `scripts/validate-palette.js`

## Next Implementation Steps
1. Create palette validation script
2. Add city asset registry entries
3. Update top-down renderer to use new tiles
4. Update tests for asset loading
