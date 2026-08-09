/**
 * Concrete Kings: The Block Chronicles
 * Pixel Engine - HTML5 1280x720 Native Canvas & Palette Swap Engine
 * Version: 1.1.0
 */

const NATIVE_WIDTH = 1280;
const NATIVE_HEIGHT = 720;

/**
 * The master palette, authored as tone ramps.
 *
 * WHY THIS REPLACED THE 64-COLOUR PALETTE
 *
 * The old palette was 64 colours in four hue *groups*, and the groups held several
 * unrelated ramps end to end. Measured in CIELAB, the perceptual step between
 * neighbouring entries was wildly uneven:
 *
 *   greys   16 steps   dE  3.8 - 8.4     <- the only usable ramp
 *   reds    10 steps   dE  9.8 - 19.9
 *   browns   6 steps   dE 14.7 - 25.3
 *   blues    8 steps   dE 10.1 - 17.7
 *   teals    6 steps   dE 12.9 - 17.3
 *   violets  2 steps   dE 27.4
 *
 * Every shading technique in this codebase — paletteShift(+/-1) for a highlight or
 * shade, ordered dither between neighbours, grain one step off the base tone —
 * assumes a small even step. That assumption only ever held for the greys, and the
 * consequences were visible and were each individually chased as if they were bugs
 * in the renderer:
 *
 *  - Roof grain went to red confetti, because one step up from Harlem's #7A1D1C
 *    brick was #AA2724, a dE of 19: a hue change, not a shade. The grain density
 *    had to be dropped to 0.05 to hide it.
 *  - Parapet highlights at +2 landed on #D9382E, near signal red, and read as a
 *    selection box drawn round every roof.
 *  - paletteShift(#7A1D1C, -2) and -3 both clamped to #2B0D0D, because the ramp had
 *    only three steps below brick. Wall and wall-shadow came out identical and unlit
 *    windows were invisible against the wall they sat in.
 *  - Parks were flat teal slabs. Six teal tones existed for all vegetation, and the
 *    palette contained no greens at all.
 *  - Park paths had no earth tone to use, so they were derived from the pavement
 *    grey; the first attempt reached for a roof colour and painted blood-red paths
 *    across NOLA's courtyard.
 *
 * So the palette is now nine ramps, ~100 colours, every step between dE 3.8 and
 * 11.8 — the greys' own density, extended to every hue. All 64 original colours are
 * still present and at their original positions: the new entries are Lab midpoints
 * inserted only where a step exceeded dE 12. Nothing that referenced a hex before
 * has moved, and test/pixel-engine.test.js pins all 64 explicitly so none can be
 * dropped by a future edit.
 *
 * Ramps are authored rather than derived. The previous version recovered them by
 * splitting groups wherever luminance dropped, which worked but meant the shading
 * behaviour of every colour depended on an inferred boundary — and it could not
 * express a ramp like `green` that has no natural group to hide in.
 */
const PALETTE_RAMPS = {
  // Concrete, asphalt, sky and every neutral. 16 steps, dE 3.8-8.4.
  greys: ["#08080A", "#101116", "#181920", "#22252E", "#2D313D", "#393E4D", "#474D5E",
    "#565E70", "#666E82", "#788196", "#8B95AB", "#A0AAC2", "#B6C0D8", "#CBD5ED",
    "#E2E8F7", "#F4F7FF"],
  // Brick, tail lights, painted metal. 18 steps, dE 7.4-10.3.
  brick: ["#2B0D0D", "#3C1111", "#4D1414", "#631918", "#7A1D1C", "#922220", "#AA2724",
    "#C12F29", "#D9382E", "#F25438", "#F9683E", "#FF7A45", "#FF8E4F", "#FFA059",
    "#FFB267", "#FFC475", "#FFD387", "#FFE299"],
  // Sodium light, worn earth, unpaved ground. 12 steps, dE 7.3-9.6.
  earth: ["#6E3E14", "#854D18", "#9C5C1D", "#B26F24", "#C9822B", "#DC9637", "#F0AB43",
    "#F8BC56", "#FFCD68", "#FFD97E", "#FFE494", "#FFF0AA"],
  // Night sky, glass, cold signage. 12 steps, dE 6.0-11.8.
  azure: ["#0A1526", "#11233F", "#1C375C", "#21436E", "#274F80", "#2E5D93", "#366BA6",
    "#3F7BBF", "#488BD9", "#5EAAFF", "#73B7FF", "#85C4FF"],
  // Verdigris, cold accents, moonlit foliage. 11 steps, dE 6.3-8.7.
  teal: ["#0D2926", "#123733", "#174540", "#1D5750", "#246961", "#2B7E74", "#339488",
    "#3DAB9D", "#47C2B3", "#5BD5C5", "#6FE8D8"],
  // Vegetation. NEW: the palette had no greens, which is the whole reason every
  // park rendered as a teal slab and why "do not invent greens" had to be a rule.
  // Desaturated on purpose — this is a night palette, not a meadow. 9 steps, dE ~10.
  green: ["#0B1610", "#1C281D", "#2B3C29", "#3B5136", "#4C6843", "#5E7F51", "#70965F",
    "#82AF6D", "#95C87C"],
  // Neon and bruise. 4 steps, dE 8.9-9.5.
  violet: ["#2A1138", "#371549", "#44195B", "#521C6E"],
  // Skin, mid to light. 14 steps, dE 7.0-11.8.
  skin: ["#140A07", "#26120B", "#3B1C11", "#522717", "#6B341D", "#854224", "#A1522C",
    "#BE6436", "#D97843", "#EB8E52", "#F7A768", "#FFC085", "#FFCB96", "#FFD6A8"],
  // Skin in shadow, kept as its own ramp so shading a shadowed tone stays shadowed.
  // 5 steps, dE 6.1-6.5.
  skinShade: ["#3D2218", "#4C2A1D", "#5C3222", "#6C3B27", "#7D442C"]
};

/** Every palette colour, flat. */
const MASTER_PALETTE = Object.values(PALETTE_RAMPS).flat();

const CITY_THEME_OVERRIDES = {
  Detroit:   { "7a1d1c": "4d1414", "474d5e": "2d313d" },
  Chicago:   { "7a1d1c": "565e70", "393e4d": "181920" },
  Miami:     { "7a1d1c": "6fe8d8", "474d5e": "f25438" },
  Baltimore: { "7a1d1c": "ffcd68", "6e3e14": "101116" },
  Atlanta:   { "7a1d1c": "aa2724", "246961": "174540" },
  Harlem:    { "7a1d1c": "6b341d", "8b95ab": "c9822b" },
  Oakland:   { "7a1d1c": "339488", "181920": "ff7a45" },
  NOLA:      { "7a1d1c": "d97843", "666e82": "246961" }
};

/**
 * Shifts a hex colour `steps` positions along its tone ramp.
 *
 * Negative steps darken (shadow), positive lighten (highlight). Clamps at the
 * ramp's ends rather than wrapping or crossing into another hue, and returns the
 * input untouched if it is not a palette colour — so a caller can shade
 * unconditionally without first checking.
 *
 * This is how shading stays inside the palette. test/pixel-engine.test.js pins the
 * exact colour count and every ramp's contents, so shadows and highlights cannot be
 * produced by darkening a hex value arithmetically.
 */
function paletteShift(hex, steps) {
  const normalized = String(hex).toUpperCase();
  for (const ramp of Object.values(PALETTE_RAMPS)) {
    const index = ramp.indexOf(normalized);
    if (index !== -1) {
      const clamped = Math.max(0, Math.min(ramp.length - 1, index + steps));
      return ramp[clamped];
    }
  }
  return hex;
}

/**
 * Floors a coordinate. Fractional canvas coordinates are what turn crisp pixel
 * art into a blurred half-pixel smear, and `imageSmoothingEnabled = false` does
 * not save you — it only governs image scaling, not path and rect geometry.
 */
function snapToPixel(value) {
  return Math.floor(value);
}

/**
 * Calculates strict integer scaling factors and letterboxing margins.
 */
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

/**
 * PixelCanvasEngine manages native 1280x720 resolution rendering to HTML5 display canvas.
 */
class PixelCanvasEngine {
  constructor(displayCanvas, options = {}) {
    this.displayCanvas = displayCanvas;
    this.displayCtx = displayCanvas.getContext("2d", { alpha: false, desynchronized: true });
    
    this.highDetail = !!options.highDetail;
    this.nativeWidth = options.nativeWidth || (this.highDetail ? 1280 : NATIVE_WIDTH);
    this.nativeHeight = options.nativeHeight || (this.highDetail ? 720 : NATIVE_HEIGHT);
    this.activeCity = options.cityTheme || "Harlem";
    
    // Virtual native canvas for pixel rendering
    this.virtualCanvas = document.createElement("canvas");
    this.virtualCanvas.width = this.nativeWidth;
    this.virtualCanvas.height = this.nativeHeight;
    this.virtualCtx = this.virtualCanvas.getContext("2d", { alpha: false });

    this.setupSmoothing(this.displayCtx);
    this.setupSmoothing(this.virtualCtx);
    
    this.currentScaleInfo = null;
    this.animationFrameCount = 4; // Strict 4-frame budget
    this.currentAnimFrame = 0;
    
    this.resize();
  }

  setupSmoothing(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
  }

  setCityTheme(cityName) {
    if (CITY_THEME_OVERRIDES[cityName]) {
      this.activeCity = cityName;
    }
  }

  resize() {
    const parent = this.displayCanvas.parentElement || document.body;
    const vpW = parent.clientWidth || window.innerWidth;
    const vpH = parent.clientHeight || window.innerHeight;

    const scaleInfo = calculateIntegerScale(vpW, vpH, this.nativeWidth, this.nativeHeight);
    this.currentScaleInfo = scaleInfo;

    this.displayCanvas.width = vpW;
    this.displayCanvas.height = vpH;

    this.setupSmoothing(this.displayCtx);
  }

  clearNative(colorHex = "#08080a") {
    this.virtualCtx.fillStyle = colorHex;
    this.virtualCtx.fillRect(0, 0, this.nativeWidth, this.nativeHeight);
  }

  present() {
    const { renderWidth, renderHeight, marginX, marginY } = this.currentScaleInfo;
    
    // Clear outer letterbox background
    this.displayCtx.fillStyle = "#08080a";
    this.displayCtx.fillRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);

    // Blit virtual canvas scaled with crisp nearest-neighbor
    this.displayCtx.drawImage(
      this.virtualCanvas,
      0, 0, this.nativeWidth, this.nativeHeight,
      marginX, marginY, renderWidth, renderHeight
    );
  }
}

/**
 * SpriteRenderer handles sprite atlas slicing and real-time palette swapping.
 */
class SpriteRenderer {
  constructor(atlasImage) {
    this.atlas = atlasImage;
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.offscreenCanvas.getContext("2d");
  }

  drawFrame(targetCtx, sx, sy, sw, sh, dx, dy) {
    targetCtx.drawImage(
      this.atlas,
      sx, sy, sw, sh,
      Math.floor(dx), Math.floor(dy), sw, sh
    );
  }

  drawFrameWithPaletteSwap(targetCtx, sx, sy, sw, sh, dx, dy, colorMap) {
    if (!colorMap || Object.keys(colorMap).length === 0) {
      return this.drawFrame(targetCtx, sx, sy, sw, sh, dx, dy);
    }

    this.offscreenCanvas.width = sw;
    this.offscreenCanvas.height = sh;
    this.offscreenCtx.imageSmoothingEnabled = false;

    this.offscreenCtx.clearRect(0, 0, sw, sh);
    this.offscreenCtx.drawImage(this.atlas, sx, sy, sw, sh, 0, 0, sw, sh);

    const imgData = this.offscreenCtx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;

      const rHex = data[i].toString(16).padStart(2, '0');
      const gHex = data[i + 1].toString(16).padStart(2, '0');
      const bHex = data[i + 2].toString(16).padStart(2, '0');
      const hex = (rHex + gHex + bHex).toLowerCase();

      if (colorMap[hex]) {
        const targetHex = colorMap[hex];
        data[i]     = parseInt(targetHex.substring(0, 2), 16);
        data[i + 1] = parseInt(targetHex.substring(2, 4), 16);
        data[i + 2] = parseInt(targetHex.substring(4, 6), 16);
      }
    }

     this.offscreenCtx.putImageData(imgData, 0, 0);
     targetCtx.drawImage(this.offscreenCanvas, Math.floor(dx), Math.floor(dy));
   }
 }
 
 function drawHighDetailCharacterSprite(ctx, origin, px, py, frame, isLarge, isMoving, labelName) {
   const scale = isLarge ? 4 : 1;
   const yBob = isMoving ? (frame % 2) * (isLarge ? 8 : 2) : (frame === 1 ? (isLarge ? 4 : 1) : 0);
   const legOffset = isMoving ? (frame === 1 ? (isLarge ? 8 : 2) : (frame === 3 ? (isLarge ? -8 : -2) : 0)) : 0;
 
   // 1. Draw Drop Shadow (64-bit ambient shadow)
   ctx.fillStyle = 'rgba(8, 8, 10, 0.35)';
   if (isLarge) {
     ctx.beginPath();
     ctx.ellipse(px + 64, py + 48, 36, 8, 0, 0, Math.PI * 2);
     ctx.fill();
   } else {
     ctx.beginPath();
     ctx.ellipse(px + 16, py + 11, 10, 2.5, 0, 0, Math.PI * 2);
     ctx.fill();
   }
 
   // 2. Head & Facial Details
   ctx.fillStyle = origin.skinColor;
   if (isLarge) {
     ctx.fillRect(px + 48, py - 72 + yBob, 32, 32); // Head base
     
     // Melanin shading shadow (left side & bottom) — palette-index shift, no black overlay
     ctx.fillStyle = paletteShift(origin.skinColor, -2);
     ctx.fillRect(px + 48, py - 72 + yBob, 8, 32);
     ctx.fillRect(px + 48, py - 48 + yBob, 32, 8);
     
     // Cool Shades / Sunglasses
     ctx.fillStyle = '#101116';
     ctx.fillRect(px + 54, py - 64 + yBob, 22, 8); // Glasses base
     ctx.fillStyle = '#f4f7ff';
     ctx.fillRect(px + 56, py - 64 + yBob, 2, 2);  // Highlight left
     ctx.fillRect(px + 68, py - 64 + yBob, 2, 2);  // Highlight right
   } else {
     ctx.fillRect(px + 12, py - 18 + yBob, 8, 8);
     
     // Skin shadow — palette-index shift, no black overlay
     ctx.fillStyle = paletteShift(origin.skinColor, -1);
     ctx.fillRect(px + 12, py - 18 + yBob, 2, 8);
     
     // Simple shades
     ctx.fillStyle = '#101116';
     ctx.fillRect(px + 13, py - 16 + yBob, 6, 2);
   }
 
   // 3. Hair / Dreads / Afro styling
   ctx.fillStyle = origin.hairColor;
   if (isLarge) {
     ctx.fillRect(px + 40, py - 80 + yBob, 48, 16); // Hair base
     
     // 64-bit hairline trim/highlights
     ctx.fillStyle = origin.skinColor;
     ctx.fillRect(px + 44, py - 66 + yBob, 4, 2);  // Sideburn left
     ctx.fillRect(px + 80, py - 66 + yBob, 4, 2);  // Sideburn right
     
     // Add textures for locks or afro
     ctx.fillStyle = '#181920';
     for (let hx = px + 42; hx < px + 88; hx += 8) {
       ctx.fillRect(hx, py - 78 + yBob, 2, 8); // texture strands
     }
   } else {
     ctx.fillRect(px + 10, py - 20 + yBob, 12, 4);
     
     // Tiny sideburn highlight
     ctx.fillStyle = origin.skinColor;
     ctx.fillRect(px + 11, py - 17 + yBob, 1, 1);
   }
 
   // 4. Gold Rope Chain Accent
   ctx.fillStyle = '#f0ab43';
   if (isLarge) {
     ctx.fillRect(px + 56, py - 40 + yBob, 16, 6);
     ctx.fillStyle = '#ffe299'; // Shine
     ctx.fillRect(px + 60, py - 40 + yBob, 4, 2);
     ctx.fillRect(px + 68, py - 38 + yBob, 2, 2);
   } else {
     ctx.fillRect(px + 14, py - 10 + yBob, 4, 2);
     ctx.fillStyle = '#ffe299';
     ctx.fillRect(px + 15, py - 10 + yBob, 1, 1);
   }
 
   // 5. Outfit / Hoodie / Varsity Jacket
   ctx.fillStyle = origin.outfitColor;
   if (isLarge) {
     ctx.fillRect(px + 40, py - 40 + yBob, 48, 40); // Hoodie base
     
     // Jacket borders/cuffs (contrasting black outline)
     ctx.fillStyle = '#101116';
     ctx.fillRect(px + 38, py - 40 + yBob, 2, 40); // left sleeve edge
     ctx.fillRect(px + 88, py - 40 + yBob, 2, 40); // right sleeve edge
     
     // Hoodie draws/strings details
     ctx.fillStyle = '#f4f7ff';
     ctx.fillRect(px + 60, py - 34 + yBob, 2, 10);
     ctx.fillRect(px + 66, py - 34 + yBob, 2, 10);
   } else {
     ctx.fillRect(px + 10, py - 10 + yBob, 12, 10);
   }
 
   // 6. Apron (Barber specific)
   if (origin.apronColor) {
     ctx.fillStyle = origin.apronColor;
     if (isLarge) {
       ctx.fillRect(px + 48, py - 36 + yBob, 32, 36);
       
       // Apron leather straps & pockets
       ctx.fillStyle = '#6e3e14'; // Brown straps
       ctx.fillRect(px + 48, py - 36 + yBob, 32, 4);
       ctx.fillRect(px + 52, py - 32 + yBob, 2, 32);
       ctx.fillRect(px + 74, py - 32 + yBob, 2, 32);
       
       // Scissors pocket detail
       ctx.fillStyle = '#2d313d';
       ctx.fillRect(px + 60, py - 16 + yBob, 8, 8);
       ctx.fillStyle = '#a0aac2'; // Silver scissors loop
       ctx.fillRect(px + 62, py - 20 + yBob, 4, 4);
     } else {
       ctx.fillRect(px + 12, py - 9 + yBob, 8, 9);
       ctx.fillStyle = '#6e3e14';
       ctx.fillRect(px + 12, py - 9 + yBob, 8, 1);
     }
   }
 
   // 7. Pants / Legs
   ctx.fillStyle = origin.pantsColor;
   if (isLarge) {
     ctx.fillRect(px + 44 + legOffset, py, 16, 40);
     ctx.fillRect(px + 68 - legOffset, py, 16, 40);
     
     // Pants shadow wrinkles — palette-index shift, no black overlay
     ctx.fillStyle = paletteShift(origin.pantsColor, -1);
     ctx.fillRect(px + 44 + legOffset, py + 12, 16, 4);
     ctx.fillRect(px + 68 - legOffset, py + 12, 16, 4);
   } else {
     ctx.fillRect(px + 11 + legOffset, py, 4, 10);
     ctx.fillRect(px + 17 - legOffset, py, 4, 10);
   }
 
   // 8. Premium Sneakers
   ctx.fillStyle = '#f4f7ff';
   if (isLarge) {
     ctx.fillRect(px + 36 + legOffset, py + 40, 24, 12);
     ctx.fillRect(px + 68 - legOffset, py + 40, 24, 12);
     
     ctx.fillStyle = origin.outfitColor;
     ctx.fillRect(px + 42 + legOffset, py + 44, 12, 2);
     ctx.fillRect(px + 74 - legOffset, py + 44, 12, 2);
     
     ctx.fillStyle = '#2d313d';
     ctx.fillRect(px + 36 + legOffset, py + 50, 24, 2);
     ctx.fillRect(px + 68 - legOffset, py + 50, 24, 2);
   } else {
     ctx.fillRect(px + 9 + legOffset, py + 10, 6, 3);
     ctx.fillRect(px + 17 - legOffset, py + 10, 6, 3);
     
     ctx.fillStyle = '#2d313d';
     ctx.fillRect(px + 9 + legOffset, py + 12, 6, 1);
     ctx.fillRect(px + 17 - legOffset, py + 12, 6, 1);
   }
 
   // 9. Floating Name Tag
   if (labelName) {
     // #F4F7FF, not #ffffff: pure white is a 65th colour, and the palette's
     // brightest tone is indistinguishable from it at 5-12px.
     ctx.fillStyle = '#F4F7FF';
     ctx.font = isLarge ? 'bold 12px monospace' : '5px monospace';
     ctx.textAlign = 'center';
     ctx.fillText(labelName.toUpperCase(), px + (isLarge ? 64 : 16), py - (isLarge ? 90 : 24));
   }
 }
 
 if (typeof window !== 'undefined') {
   window.drawHighDetailCharacterSprite = drawHighDetailCharacterSprite;
   window.paletteShift = paletteShift;
   window.snapToPixel = snapToPixel;
   window.MASTER_PALETTE = MASTER_PALETTE;
   window.PALETTE_RAMPS = PALETTE_RAMPS;
 }
 
 if (typeof module !== 'undefined' && module.exports) {
   module.exports = {
     NATIVE_WIDTH,
     NATIVE_HEIGHT,
     MASTER_PALETTE,
     CITY_THEME_OVERRIDES,
     calculateIntegerScale,
     paletteShift,
     snapToPixel,
     PALETTE_RAMPS,
     PixelCanvasEngine,
     SpriteRenderer,
     drawHighDetailCharacterSprite
   };
 }
