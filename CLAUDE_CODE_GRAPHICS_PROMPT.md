# Concrete Kings — Maximum Fidelity Pixel Art Upgrade Prompt for Claude Code

## OBJECTIVE
Upgrade all game graphics, rendering fidelity, and pixel art assets to the highest possible quality within the existing browser canvas architecture. Preserve the strict 4-frame animation budget. Do not change game design, story, or UI flow. Focus 100% on visual fidelity, asset quality, and rendering correctness.

---

## RESEARCH FINDINGS TO APPLY

### 1. Native Resolution & Scaling
- Current baseline: 1280x720 native canvas with integer scaling
- Use nearest-neighbor filtering exclusively: `image-rendering: pixelated` on canvas + CSS
- Avoid bicubic/bilinear filtering at all costs
- Render to an offscreen native-resolution buffer, then upscale once to display canvas
- Subpixel rendering is the enemy: all coordinates must be integers

### 2. Color & Palette Discipline
- Use the existing 64-color master palette as the canonical source of truth
- Add a 65th “highlight white” only for specular highlights; no other ad-hoc colors
- Dithering: use only ordered 2x2 or 4x4 dithering for gradients; never random dither
- Shadows: shift palette index down by 1-2 stops; never add black on top
- Highlights: shift palette index up by 1-2 stops; never add white on top
- Gradients: maximum 3-stop gradients on large shapes; 2-stop on small shapes

### 3. Sprite & Asset Standards
- All character sprites: 64x64 native pixels, centered on 32x32 collision box
- All props: power-of-two dimensions where possible
- All tiles: 128x128 or 64x64 native, with 1px transparent padding to avoid bleed
- Shadows: draw shadow sprites as separate 1-bit masks; never use canvas shadowBlur
- Outlines: 1px inner or outer outline only on characters; no outlines on tiles

### 4. Animation Budget (NON-NEGOTIABLE)
- Maximum 4 frames per animation cycle: 0, 1, 2, 3
- Hold key poses for 2-3 display frames; animate on 2s/4s timing
- Idle: 4-frame breathing cycle with 1px vertical bob only
- Walk: 4-frame cycle with 4px stride, 2px bob
- No animation may exceed 4 unique frame definitions

### 5. Canvas Rendering Performance
- Pre-render all static tiles to an offscreen canvas once per beat
- Use `drawImage` for all sprite blits; avoid path-based drawing for sprites
- Batch all same-colored fillRect calls together to minimize state changes
- Never use `shadowBlur`, `shadowColor`, or `globalAlpha` during gameplay
- Use `desynchronized: true` on display canvas context
- Use `willReadFrequently: false` on all contexts

### 6. Parallax & Depth
- 3-layer parallax: background (0.2x), midground (0.5x), foreground (1.0x)
- Background layer: skyline, moon, distant buildings — no detail smaller than 4px
- Midground layer: buildings, streetlamps, bodega sign — detail down to 2px
- Foreground layer: characters, props, UI — detail down to 1px
- Each layer scrolls at integer multiples only; no fractional parallax

### 7. Lighting & Effects
- Use a pre-generated lightmap canvas; do not compute per-pixel lighting at runtime
- Neon flicker: modulate alpha between 0.7-1.0 on 4-frame cycle; never change color
- Rain: 16 drops max, drawn as 1x4 vertical lines with 1px gap; no splashes
- Steam: 3 plumes max, each 8x8 circle with 50% alpha; no per-pixel fog
- Heat haze: skip entirely; too expensive for canvas 2D

### 8. Text Readability
- All game text: minimum 5px monospace at native resolution
- Scale text by integer multiplier only: 5, 10, 15, 20, 25, 30...
- Text shadows: 1px offset, same color as text but darker shade; no blur
- Never use `measureText` in the render loop; pre-measure during setup

---

## SECTION 1: PIXEL ENGINE UPGRADE

### 1.1 File: src/pixel_engine/pixel-engine.js
**Modify the `PixelCanvasEngine` class:**

```javascript
class PixelCanvasEngine {
  constructor(displayCanvas, options = {}) {
    this.displayCanvas = displayCanvas;
    this.displayCtx = displayCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });

    // Enforce nearest-neighbor scaling at the canvas element level
    this.displayCanvas.style.imageRendering = "pixelated";

    this.highDetail = !!options.highDetail;
    this.nativeWidth = options.nativeWidth || (this.highDetail ? 1280 : 320);
    this.nativeHeight = options.nativeHeight || (this.highDetail ? 720 : 180);
    this.activeCity = options.cityTheme || "Harlem";

    // Offscreen native buffer — all drawing happens here first
    this.nativeCanvas = document.createElement("canvas");
    this.nativeCanvas.width = this.nativeWidth;
    this.nativeCanvas.height = this.nativeHeight;
    this.nativeCtx = this.nativeCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    this.nativeCtx.imageSmoothingEnabled = false;

    // Layer caches for static content
    this.bgLayer = document.createElement("canvas");
    this.bgLayer.width = this.nativeWidth;
    this.bgLayer.height = this.nativeHeight;
    this.bgCtx = this.bgLayer.getContext("2d", {
      alpha: false,
      willReadFrequently: false
    });
    this.bgCtx.imageSmoothingEnabled = false;

    this.mgLayer = document.createElement("canvas");
    this.mgLayer.width = this.nativeWidth;
    this.mgLayer.height = this.nativeHeight;
    this.mgCtx = this.mgLayer.getContext("2d", {
      alpha: false,
      willReadFrequently: false
    });
    this.mgCtx.imageSmoothingEnabled = false;

    this.fgLayer = document.createElement("canvas");
    this.fgLayer.width = this.nativeWidth;
    this.fgLayer.height = this.nativeHeight;
    this.fgCtx = this.fgLayer.getContext("2d", {
      alpha: false,
      willReadFrequently: false
    });
    this.fgCtx.imageSmoothingEnabled = false;

    this.setupSmoothing(this.displayCtx);
    this.currentScaleInfo = null;
    this.animationFrameCount = 4;
    this.needsBgRedraw = true;
    this.parallaxOffset = { x: 0, y: 0 };
  }

  setupSmoothing(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
  }

  resize() {
    const info = calculateIntegerScale(
      this.displayCanvas.clientWidth,
      this.displayCanvas.clientHeight,
      this.nativeWidth,
      this.nativeHeight
    );
    this.currentScaleInfo = info;
    this.displayCanvas.width = info.renderWidth;
    this.displayCanvas.height = info.renderHeight;
  }

  present() {
    const { renderWidth, renderHeight, marginX, marginY } = this.currentScaleInfo || calculateIntegerScale(
      this.displayCanvas.clientWidth,
      this.displayCanvas.clientHeight,
      this.nativeWidth,
      this.nativeHeight
    );

    this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
    this.displayCtx.drawImage(
      this.nativeCanvas,
      0, 0, this.nativeWidth, this.nativeHeight,
      marginX, marginY, renderWidth, renderHeight
    );
  }

  clearNative(color) {
    this.nativeCtx.fillStyle = color;
    this.nativeCtx.fillRect(0, 0, this.nativeWidth, this.nativeHeight);
  }

  // Layer-aware drawing
  drawBackground(drawFn) {
    if (this.needsBgRedraw) {
      drawFn(this.bgCtx, this.nativeWidth, this.nativeHeight);
      this.needsBgRedraw = false;
    }
    this.nativeCtx.drawImage(this.bgLayer, 0, 0);
  }

  drawMidground(drawFn) {
    drawFn(this.mgCtx, this.nativeWidth, this.nativeHeight);
    this.nativeCtx.drawImage(this.mgLayer, 0, 0);
  }

  drawForeground(drawFn) {
    drawFn(this.fgCtx, this.nativeWidth, this.nativeHeight);
    this.nativeCtx.drawImage(this.fgLayer, 0, 0);
  }

  // Parallax scrolling with integer offsets only
  setParallax(offsetX, offsetY) {
    this.parallaxOffset.x = Math.floor(offsetX);
    this.parallaxOffset.y = Math.floor(offsetY);
  }

  // Sprite blit with integer snapping
  drawSprite(spriteCanvas, x, y) {
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    this.nativeCtx.drawImage(spriteCanvas, sx, sy);
  }

  // Pixel-perfect rectangle
  fillRect(x, y, w, h, color) {
    this.nativeCtx.fillStyle = color;
    this.nativeCtx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  // Pixel-perfect text
  fillText(text, x, y, color, fontPx = 10) {
    this.nativeCtx.fillStyle = color;
    this.nativeCtx.font = `bold ${Math.floor(fontPx)}px monospace`;
    this.nativeCtx.textAlign = "center";
    this.nativeCtx.textBaseline = "middle";
    this.nativeCtx.fillText(text, Math.floor(x), Math.floor(y));
  }

  // Invalidate background layer when city changes
  invalidateBackground() {
    this.needsBgRedraw = true;
  }
}
```

### 1.2 Required Changes to calculateIntegerScale
Ensure the function in `pixel-engine.js` returns integer scale only:

```javascript
function calculateIntegerScale(viewportWidth, viewportHeight, nativeW = NATIVE_WIDTH, nativeH = NATIVE_HEIGHT) {
  const scaleX = Math.floor(viewportWidth / nativeW);
  const scaleY = Math.floor(viewportHeight / nativeH);
  const scale = Math.max(1, Math.min(scaleX, scaleY));

  const renderWidth = nativeW * scale;
  const renderHeight = nativeH * scale;
  const marginX = Math.floor((viewportWidth - renderWidth) / 2);
  const marginY = Math.floor((viewportHeight - renderHeight) / 2);

  return { scale, renderWidth, renderHeight, marginX, marginY };
}
```

---

## SECTION 2: ASSET GENERATION SPECIFICATION

### 2.1 Asset Inventory
Create or upgrade every asset in `public/assets/` with these exact specs:

#### Characters (8 origins × 4 angles × 4 frames = 128 sprites)
- **Base sprite**: 64x64 native pixels
- **Angles**: front, back, left, right
- **Frames per angle**: 4-frame idle cycle
- **Format**: PNG with transparency, indexed color preferred
- **Naming**: `{origin}_{angle}_{frame}.png` (e.g., `barber_front_0.png`)
- **Collision box**: 32x32 centered on sprite

#### Tiles (8 cities × 12 tile types = 96 tiles)
- **Base tile**: 128x128 native pixels
- **Types**: ground, sidewalk, building_front, building_side, bodega_sign, barbershop_sign, stoop, window_lit, window_dark, door, fire_escape, streetlamp
- **Format**: PNG with transparency
- **Naming**: `{city}_{type}.png`

#### Props (24 props)
- **Size**: 32x32, 64x64, or 128x128 depending on prop
- **Types**: package, phone, chair, mirror, clippers, dice, card_deck, receipt, coffee_cup, radio, etc.
- **Format**: PNG with transparency
- **Naming**: `prop_{name}.png`

#### UI Elements
- **Cards**: 160x240 native pixels, 4-frame shimmer animation
- **Buttons**: 128x32 native pixels, 2-frame hover state
- **Icons**: 32x32 native pixels, no animation
- **Portraits**: 64x64 native pixels, 1 static frame per origin

### 2.2 Sprite Sheet Standard
For production, pack sprites into atlas sheets:
- **Character atlas**: 512x512 pixels, 8x8 grid = 64 sprites per sheet
- **Tile atlas**: 1024x1024 pixels, 8x8 grid = 64 tiles per sheet
- **Prop atlas**: 256x256 pixels, 8x8 grid = 64 props per sheet
- Include a JSON manifest with frame coordinates

### 2.3 Art Direction Rules
- **Line weight**: 1px for all outlines; never 2px unless it's a shadow
- **Color count**: maximum 16 colors per sprite; use palette swaps for variants
- **Shading**: 3-value shading system (shadow, base, highlight) only
- **Readability**: characters must be readable at 1x scale (native resolution)
- **Consistency**: all characters share same head size (16x16), same leg length (20px), same arm proportion

---

## SECTION 3: BACKGROUND & ENVIRONMENT UPGRADE

### 3.1 Parallax Background System
Upgrade `drawProceduralBackground` in `index.html` to use 3-layer parallax:

```javascript
function drawParallaxBackground(ctx, city, frame, scrollX) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // Clear all layers
  ctx.clearRect(0, 0, W, H);

  // LAYER 1: Sky (0.0x parallax) — drawn once, cached
  drawSkyLayer(ctx, city, W, H);

  // LAYER 2: Far buildings (0.2x parallax)
  const farOffset = Math.floor(scrollX * 0.2);
  drawBuildingLayer(ctx, city, W, H, farOffset, "far");

  // LAYER 3: Near buildings (0.5x parallax)
  const midOffset = Math.floor(scrollX * 0.5);
  drawBuildingLayer(ctx, city, W, H, midOffset, "near");

  // LAYER 4: Street level (1.0x parallax) — characters/props
  drawStreetLayer(ctx, city, W, H, frame);
}
```

### 3.2 Building Generation Rules
For each city, generate buildings with these properties:
- **Harlem**: Brownstone facades, fire escapes, 3-4 story heights
- **Chicago**: Brick high-rises, steel grid windows, alley shadows
- **Miami**: Art deco, pastel colors, neon signs, palm tree silhouettes
- **Detroit**: Industrial brick, boarded windows, chain link fences
- **NOLA**: Iron balconies, shutters, French Quarter lamps
- **Baltimore**: Row houses, painted ladies, marble steps
- **Atlanta**: Modern glass mixed with brick, highway overpass
- **Oakland**: Victorians, murals, community art

Each building must have:
- 2-3 window patterns (lit, dark, broken)
- 1 door at street level
- Optional sign or awning
- 1px shadow line on right side for depth

### 3.3 Street Elements
- **Sidewalk**: 80px tall, concrete gray (#474d5e base, #565e70 highlight)
- **Road**: 160px tall, asphalt (#101116 base, #181920 highlight)
- **Lane markings**: 80px dash, 80px gap, #ffcd68
- **Streetlamps**: 8px pole, 16x16 lamp head, warm glow gradient
- **Bodega sign**: 128x32, neon red #ff7a45, 4-frame flicker cycle
- **Trash cans**: 32x32, dark gray, 1px highlight on left
- **Fire hydrant**: 16x16, red #d9382e, 2px highlight

---

## SECTION 4: CHARACTER ART UPGRADE

### 4.1 Character Construction System
Each character sprite is built from layers:
1. **Base body**: 64x64, skin tone fill, no detail
2. **Clothing**: 64x64, outfit color, 1px shadow on fold lines
3. **Head**: 16x16 centered at (24, 8), skin tone
4. **Hair**: 16x8 at (24, 4), hair color, 1px highlight streak
5. **Eyes**: 2x2 at (28, 12) and (34, 12), white with 1px pupil
6. **Mouth**: 4x1 at (30, 18), dark shade
7. **Accessories**: apron, hat, chain, etc. as separate layer

### 4.2 Origin-Specific Details
- **Barber**: White apron over hoodie, clippers in right hand
- **Scholar**: Hoodie with book logo, glasses (2x2 frames at eyes)
- **Legend**: Gold chain, leather jacket, bandana
- **Merchant**: Utility vest, name tag, clipboard

### 4.3 Animation Details
- **Idle**: 4-frame cycle, 1px vertical bob on frames 1 and 3
- **Talk**: 4-frame cycle, mouth opens/closes, head tilt 1px left/right
- **Walk**: 4-frame cycle, 4px horizontal stride, 2px vertical bob
- **Point**: 4-frame cycle, right arm extends 8px forward on frame 2

---

## SECTION 5: CARD ART UPGRADE

### 5.1 Card Base Design
- **Canvas**: 160x240 native pixels
- **Border**: 4px outer border in card frame color, 2px inner border in highlight color
- **Background**: gradient from top (#181920) to bottom (#101116), 3-stop
- **Text area**: top 80px reserved for title, bottom 160px for flavor text
- **Frame ornament**: 8px corner brackets on all 4 corners

### 5.2 Black Card Design
- **Background**: dark with red accent (#7a1d1c to #4d1414 gradient)
- **Title**: 12px bold, #ffcd68, centered, 1px shadow
- **Flavor text**: 8px regular, #f4f7ff, left-aligned, 2px margin
- **Beat indicator**: 16px "BEAT 01" top-right, #8b95ab
- **Stakes text**: 7px italic, #ffc475, bottom 20px

### 5.3 White Card Design
- **Background**: dark with city accent color gradient
- **Text**: 9px bold, #f4f7ff, centered, word-wrapped to 140px width
- **Tag badge**: 8px colored badge bottom-right showing primary tag
- **Origin icon**: 16x16 origin icon bottom-left

### 5.4 Card Shimmer Animation (4-Frame Budget)
```javascript
function drawCardShimmer(ctx, cardCanvas, frame) {
  const shimmerX = (frame / 4) * cardCanvas.width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.fillRect(shimmerX, 0, cardCanvas.width / 4, cardCanvas.height);
}
```

---

## SECTION 6: LIGHTING & ATMOSPHERE

### 6.1 Lightmap System
Pre-render a lightmap canvas once per beat:

```javascript
function generateLightmap(ctx, W, H, city, heat) {
  const lightmap = document.createElement("canvas");
  lightmap.width = W;
  lightmap.height = H;
  const lCtx = lightmap.getContext("2d");

  // Base ambient light
  lCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
  lCtx.fillRect(0, 0, W, H);

  // Streetlamp pools (warm)
  const lamps = getStreetlampPositions(city);
  for (const lamp of lamps) {
    const gradient = lCtx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 128);
    gradient.addColorStop(0, "rgba(255, 196, 117, 0.4)");
    gradient.addColorStop(1, "rgba(255, 196, 117, 0)");
    lCtx.fillStyle = gradient;
    lCtx.fillRect(lamp.x - 128, lamp.y - 128, 256, 256);
  }

  // Neon signs (colored)
  const signs = getNeonSignPositions(city);
  for (const sign of signs) {
    const gradient = lCtx.createRadialGradient(sign.x, sign.y, 0, sign.x, sign.y, 64);
    gradient.addColorStop(0, sign.color.replace("1)", "0.3)"));
    gradient.addColorStop(1, sign.color.replace("1)", "0)"));
    lCtx.fillStyle = gradient;
    lCtx.fillRect(sign.x - 64, sign.y - 64, 128, 128);
  }

  // Heat distortion overlay (high heat only)
  if (heat >= 7) {
    lCtx.fillStyle = "rgba(255, 122, 69, 0.05)";
    lCtx.fillRect(0, 0, W, H);
  }

  return lightmap;
}
```

### 6.2 Composite Pipeline
Final composite order:
1. Background layer
2. Parallax midground
3. Lightmap multiply
4. Foreground layer
5. UI overlay

```javascript
function compositeFrame(engine, lightmap) {
  const ctx = engine.nativeCtx;
  const W = engine.nativeWidth;
  const H = engine.nativeHeight;

  // Draw cached layers
  ctx.drawImage(engine.bgLayer, 0, 0);
  ctx.drawImage(engine.mgLayer, 0, 0);

  // Apply lightmap
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(lightmap, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  // Draw foreground
  ctx.drawImage(engine.fgLayer, 0, 0);

  // Draw UI on top
  ctx.drawImage(engine.uiLayer, 0, 0);
}
```

---

## SECTION 7: PARTICLE & EFFECT UPGRADE

### 7.1 Particle System Rules
- Maximum 64 particles active at any time
- All particles: 1x1, 2x2, or 4x4 pixels only
- No per-particle gradients; solid colors from palette only
- Particle lifetime: 60-120 frames (1-2 seconds at 60fps)
- Update and draw all particles in a single loop

### 7.2 Rain System
```javascript
class RainSystem {
  constructor(W, H) {
    this.drops = [];
    this.maxDrops = 16;
    this.W = W;
    this.H = H;
    this.init();
  }

  init() {
    for (let i = 0; i < this.maxDrops; i++) {
      this.drops.push({
        x: Math.floor(Math.random() * this.W),
        y: Math.floor(Math.random() * this.H),
        speed: 4 + Math.floor(Math.random() * 4),
        length: 4 + Math.floor(Math.random() * 4)
      });
    }
  }

  advance(frame) {
    for (const drop of this.drops) {
      drop.y += drop.speed;
      if (drop.y > this.H) {
        drop.y = -drop.length;
        drop.x = Math.floor(Math.random() * this.W);
      }
    }
  }

  draw(ctx, frame) {
    ctx.fillStyle = "#85c4ff";
    for (const drop of this.drops) {
      ctx.fillRect(drop.x, drop.y, 1, drop.length);
    }
  }
}
```

### 7.3 Neon Flicker System
```javascript
class NeonFlicker {
  constructor() {
    this.frame = 0;
    this.alpha = 1.0;
  }

  advance() {
    this.frame = (this.frame + 1) % 4;
    // 4-frame flicker cycle: 100%, 70%, 100%, 90%
    const alphas = [1.0, 0.7, 1.0, 0.9];
    this.alpha = alphas[this.frame];
  }

  draw(ctx, x, y, w, h, color) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1.0;
  }
}
```

---

## SECTION 8: UI & TEXT UPGRADE

### 8.1 Typography Rules
- **Headers**: 'Press Start 2P', sizes: 20, 16, 12, 10, 8
- **Body**: 'VT323', sizes: 20, 16, 14, 12, 10
- **Data**: monospace, sizes: 12, 10, 8
- **Minimum readable size**: 8px at native resolution
- **Line height**: 1.4 for body, 1.2 for headers
- **Text shadow**: 1px offset, no blur, darker shade of text color

### 8.2 UI Panel Design
- **Panel background**: #101116 with 2px #474d5e border
- **Panel header**: 4px #c9822b top border, 8px padding
- **Button**: 3px border, 2px box-shadow, 2px pressed offset
- **Selected state**: 4px #f0ab43 outline, no shadow
- **Hover state**: translateY(-2px), shadow increases by 1px

### 8.3 Meter Design
- **Trust meter**: horizontal bar, 120x8 native, filled from center
  - Positive: #6fe8d8 (cyan)
  - Negative: #d9382e (red)
  - Neutral: #474d5e (gray)
- **Heat meter**: horizontal bar, 120x8 native, fill left-to-right
  - 0-3: #6fe8d8 (cool)
  - 4-6: #ffc475 (warm)
  - 7-9: #ff7a45 (hot)
  - 10: #d9382e (critical)
- **Reputation badge**: 64x16 native, centered text, colored background

---

## SECTION 9: IMPLEMENTATION ORDER

### Phase 1: Core Rendering Upgrade (2 hours)
1. Update `pixel-engine.js` with offscreen buffer system
2. Update `calculateIntegerScale` to enforce integer scaling
3. Add layer caching (bg, mg, fg)
4. Add `imageSmoothingEnabled = false` everywhere
5. Verify: `npm test` passes

### Phase 2: Asset Pipeline (2 hours)
1. Create `src/pixel_engine/asset-loader.js`
2. Implement sprite sheet parser with JSON manifest
3. Implement texture atlas with frame coordinates
4. Add `loadSprite(name)` and `loadTile(name)` functions
5. Verify: all existing assets load without errors

### Phase 3: Background System (1.5 hours)
1. Rewrite `drawProceduralBackground` with 3-layer parallax
2. Add city-specific building generators
3. Add street-level props
4. Add lightmap generation
5. Add composite pipeline
6. Verify: backgrounds render correctly in all 8 cities

### Phase 4: Character Sprites (1.5 hours)
1. Generate or upgrade all 32 character sprites (8 origins × 4 angles)
2. Add 4-frame idle animation to each
3. Implement sprite blitting with integer snapping
4. Add character shadows
5. Verify: all characters render correctly, animate smoothly

### Phase 5: Card Art (1 hour)
1. Upgrade card rendering in `card-visual-system.js`
2. Add 4-frame shimmer animation
3. Add beat indicator, stakes text, tag badges
4. Verify: cards render at 160x240 with correct styling

### Phase 6: Effects & Polish (1 hour)
1. Upgrade rain system to 16 drops, 1x4 lines
2. Upgrade neon flicker to 4-frame cycle
3. Add steam vents (3 plumes, 8x8, 50% alpha)
4. Add streetlamp glow gradients
5. Verify: all effects run at 60fps

### Phase 7: Final Verification (30 mins)
1. Run `npm test` — must pass 62/62
2. Open `pixel-art-demo.html` — verify all systems render
3. Open `index.html` — verify game screen renders
4. Check console for errors
5. Verify integer scaling at multiple window sizes
6. Verify nearest-neighbor scaling (no blur)

---

## SECTION 10: CRITICAL RULES

### DO:
- Use integer coordinates for all drawing operations
- Use `imageSmoothingEnabled = false` on every canvas context
- Cache static content to offscreen canvases
- Batch same-color draw calls
- Use `drawImage` for all sprite blitting
- Limit particles to 64 max
- Use 4-frame animation cycles only
- Pre-measure text; never call `measureText` in render loop
- Use `requestAnimationFrame` for all animation

### DO NOT:
- Use `shadowBlur`, `shadowColor`, or `globalAlpha` during gameplay
- Use fractional coordinates
- Use canvas gradients for per-pixel lighting
- Use `fillText` for more than 20 text elements per frame
- Use `beginPath`/`arc`/`fill` for circular shapes; use sprites instead
- Use `createLinearGradient` for more than 3 objects per frame
- Use `save()`/`restore()` inside render loops
- Use `getImageData`/`putImageData` during gameplay
- Use CSS transforms on game canvas; use canvas scaling only

---

## SECTION 11: FILE MANIFEST

### Files to Modify
1. `src/pixel_engine/pixel-engine.js` — offscreen buffers, layer caching, integer snapping
2. `src/pixel_engine/card-visual-system.js` — card art upgrade, shimmer animation
3. `index.html` — parallax background, lightmap composite, effects
4. `pixel-art-demo.html` — demonstrate all upgraded systems

### Files to Create
1. `src/pixel_engine/asset-loader.js` — sprite sheet/texture atlas loader
2. `src/pixel_engine/particle-system.js` — rain, steam, neon flicker
3. `src/pixel_engine/lightmap.js` — pre-rendered lighting system
4. `public/assets/sprites/manifest.json` — sprite sheet coordinates
5. `public/assets/tiles/manifest.json` — tile atlas coordinates

### Files to Ignore
- `src/pixel_engine/weather-effects-system.js`
- `src/pixel_engine/block-map-navigation.js`
- `server/server.js`
- All story/narrative files

---

## SECTION 12: VERIFICATION CHECKLIST

### Automated
- [ ] `npm test` passes 62/62
- [ ] HTML syntax check passes
- [ ] `node -e "require('./src/pixel_engine/pixel-engine.js')"` loads without error
- [ ] `node -e "require('./src/pixel_engine/asset-loader.js')"` loads without error

### Visual
- [ ] All rendering uses nearest-neighbor scaling (no blur)
- [ ] All coordinates are integer values
- [ ] Parallax scrolls smoothly at 3 depths
- [ ] Characters animate with 4-frame idle cycle
- [ ] Cards shimmer with 4-frame animation
- [ ] Rain draws as 1x4 lines, 16 drops max
- [ ] Neon signs flicker on 4-frame cycle
- [ ] Text is readable at native resolution
- [ ] Colors match master palette exactly
- [ ] No `shadowBlur` or `globalAlpha` artifacts
- [ ] No subpixel rendering or anti-aliasing

### Performance
- [ ] Game runs at 60fps on target hardware
- [ ] No frame drops during beat transitions
- [ ] Memory usage stable over 10-minute playtest
- [ ] No console warnings or errors

---

## SECTION 13: ASSET CREATION GUIDELINES

### If Generating Assets Programmatically
Use the existing procedural generation in `card-visual-system.js` as a base, but upgrade:
- Add 2x detail density to all procedural shapes
- Add 1px outlines to all characters
- Add 3-value shading to all props
- Add 2-frame animation to all animated props

### If Creating Assets Manually
Provide exact pixel grids for:
- Character base: 64x64 grid
- Tile: 128x128 grid
- Card: 160x240 grid
- UI button: 128x32 grid

### Asset Naming Convention
```
characters/{origin}/{origin}_{angle}_{frame}.png
tiles/{city}/{city}_{type}.png
props/{name}.png
ui/card_black.png
ui/card_white.png
ui/button_primary.png
ui/button_secondary.png
icons/{origin}.png
```

---

## SECTION 14: RENDERING PIPELINE DIAGRAM

```
Input State
    ↓
Background Layer (cached, redraw only on city change)
    ↓
Midground Layer (parallax 0.5x, redraw on scroll)
    ↓
Lightmap Multiply (pre-rendered per beat)
    ↓
Foreground Layer (characters, props, 1.0x)
    ↓
Particle Layer (rain, steam, effects)
    ↓
UI Layer (cards, meters, text)
    ↓
Offscreen Native Canvas (1280x720)
    ↓
Integer Scale to Display Canvas
    ↓
Browser Display
```

---

## SECTION 15: SUCCESS CRITERIA

This upgrade is complete when:
1. Every pixel is crisp and intentional — no blur, no anti-aliasing
2. All assets match the 64-color palette exactly
3. All animations use exactly 4 frames
4. All rendering uses integer coordinates
5. All text is readable at native resolution
6. Parallax creates convincing depth
7. Lighting enhances mood without hurting performance
8. The game runs at 60fps with all systems active
9. `npm test` passes 62/62
10. The visual fidelity matches or exceeds modern pixel art standards

---

## EXECUTION NOTES

1. Work in strict order: Section 1 → 2 → 3 → 4 → 5 → 6 → 7
2. Do not skip ahead to assets before the renderer supports them
3. Do not change game logic, story, or UI flow
4. Verify `npm test` after each phase
5. If a phase breaks tests, fix before proceeding
6. All new code must follow existing project style: CommonJS, no build step, plain JS

---

## APPENDIX: QUICK REFERENCE

### Canvas Context Setup (Copy-Paste)
```javascript
const ctx = canvas.getContext("2d", {
  alpha: false,
  desynchronized: true,
  willReadFrequently: false
});
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
```

### CSS for Pixel-Perfect Display
```css
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  display: block;
  margin: 0 auto;
}
```

### Integer Snapping Helper
```javascript
function snapToPixel(value) {
  return Math.floor(value) + 0.5; // 0.5 for 1px lines
}
```

### Color Palette Validation
```javascript
function isValidPaletteColor(hex) {
  return MASTER_PALETTE_64.blacks_grays.includes(hex) ||
         MASTER_PALETTE_64.warm_tones.includes(hex) ||
         MASTER_PALETTE_64.cool_tones.includes(hex) ||
         MASTER_PALETTE_64.skin_tones.includes(hex);
}
```

---

END OF SPECIFICATION
Execute in order. Verify each phase. Deliver maximum fidelity pixel art upgrade.
