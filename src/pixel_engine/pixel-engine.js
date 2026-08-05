/**
 * Concrete Kings: The Block Chronicles
 * Pixel Engine - HTML5 320x180 Native Canvas & Palette Swap Engine
 * Version: 1.0.0
 */

const NATIVE_WIDTH = 320;
const NATIVE_HEIGHT = 180;

const MASTER_PALETTE_64 = {
  blacks_grays: [
    "#08080A", "#101116", "#181920", "#22252E", "#2D313D", "#393E4D", "#474D5E", "#565E70",
    "#666E82", "#788196", "#8B95AB", "#A0AAC2", "#B6C0D8", "#CBD5ED", "#E2E8F7", "#F4F7FF"
  ],
  warm_tones: [
    "#2B0D0D", "#4D1414", "#7A1D1C", "#AA2724", "#D9382E", "#F25438", "#FF7A45", "#FFA059",
    "#FFC475", "#FFE299", "#6E3E14", "#9C5C1D", "#C9822B", "#F0AB43", "#FFCD68", "#FFF0AA"
  ],
  cool_tones: [
    "#0A1526", "#11233F", "#1C375C", "#274F80", "#366BA6", "#488BD9", "#5EAAFF", "#85C4FF",
    "#0D2926", "#174540", "#246961", "#339488", "#47C2B3", "#6FE8D8", "#2A1138", "#521C6E"
  ],
  skin_tones: [
    "#140A07", "#26120B", "#3B1C11", "#522717", "#6B341D", "#854224", "#A1522C", "#BE6436",
    "#D97843", "#EB8E52", "#F7A768", "#FFC085", "#FFD6A8", "#3D2218", "#5C3222", "#7D442C"
  ]
};

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
 * PixelCanvasEngine manages native 320x180 resolution rendering to HTML5 display canvas.
 */
class PixelCanvasEngine {
  constructor(displayCanvas, options = {}) {
    this.displayCanvas = displayCanvas;
    this.displayCtx = displayCanvas.getContext("2d", { alpha: false, desynchronized: true });
    
    this.nativeWidth = options.nativeWidth || NATIVE_WIDTH;
    this.nativeHeight = options.nativeHeight || NATIVE_HEIGHT;
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

    // Blit virtual 320x180 canvas scaled with crisp nearest-neighbor
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NATIVE_WIDTH,
    NATIVE_HEIGHT,
    MASTER_PALETTE_64,
    CITY_THEME_OVERRIDES,
    calculateIntegerScale,
    PixelCanvasEngine,
    SpriteRenderer
  };
}
