/**
 * Concrete Kings: The Block Chronicles
 * Pre-Rendered Lightmap System (streetlamp glow + neon pools, composited once per beat)
 * Version: 1.0.0
 */

// NOTE: these coordinates are authored in true native 1280x720 space. The
// background art drawn via hdRect()/hdScaleX()/hdScaleY() in index.html
// currently renders 1:1 into only the top-left 320x180 corner of that space
// — a pre-existing, out-of-scope scale bug affecting roughly 35 hdRect call
// sites, not something introduced by this module. Until that bug is fixed,
// these light pools sit over background art that isn't actually positioned
// there on screen. Do not re-author these positions to visually match the
// current (buggy) 320x180 rendering — they are correct for the intended
// native-resolution background, and matching them to the bug would lock it in.
const STREETLAMP_POSITIONS = {
  Harlem:    [{ x: 160, y: 520 }, { x: 1120, y: 520 }],
  Chicago:   [{ x: 140, y: 500 }, { x: 900, y: 500 }, { x: 1150, y: 500 }],
  Miami:     [{ x: 180, y: 540 }, { x: 1100, y: 540 }],
  Detroit:   [{ x: 150, y: 510 }, { x: 1130, y: 510 }],
  NOLA:      [{ x: 170, y: 530 }, { x: 1110, y: 530 }],
  Baltimore: [{ x: 160, y: 515 }, { x: 1120, y: 515 }],
  Atlanta:   [{ x: 155, y: 505 }, { x: 1125, y: 505 }],
  Oakland:   [{ x: 165, y: 525 }, { x: 1115, y: 525 }]
};

const NEON_SIGN_POSITIONS = {
  Harlem:    [{ x: 640, y: 360, color: 'rgba(255, 122, 69, 1)' }],
  Chicago:   [{ x: 640, y: 340, color: 'rgba(94, 170, 255, 1)' }],
  Miami:     [{ x: 640, y: 320, color: 'rgba(111, 232, 216, 1)' }],
  Detroit:   [{ x: 640, y: 360, color: 'rgba(217, 56, 46, 1)' }],
  NOLA:      [{ x: 640, y: 350, color: 'rgba(240, 171, 67, 1)' }],
  Baltimore: [{ x: 640, y: 355, color: 'rgba(255, 205, 104, 1)' }],
  Atlanta:   [{ x: 640, y: 345, color: 'rgba(170, 39, 36, 1)' }],
  Oakland:   [{ x: 640, y: 365, color: 'rgba(51, 148, 136, 1)' }]
};

function getStreetlampPositions(city) {
  return STREETLAMP_POSITIONS[city] || STREETLAMP_POSITIONS.Harlem;
}

function getNeonSignPositions(city) {
  return NEON_SIGN_POSITIONS[city] || NEON_SIGN_POSITIONS.Harlem;
}

function renderLightmap(ctx, W, H, city, heat) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, W, H);

  getStreetlampPositions(city).forEach(lamp => {
    const gradient = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 128);
    gradient.addColorStop(0, "rgba(255, 196, 117, 0.4)");
    gradient.addColorStop(1, "rgba(255, 196, 117, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(lamp.x - 128, lamp.y - 128, 256, 256);
  });

  getNeonSignPositions(city).forEach(sign => {
    const gradient = ctx.createRadialGradient(sign.x, sign.y, 0, sign.x, sign.y, 64);
    gradient.addColorStop(0, sign.color.replace("1)", "0.3)"));
    gradient.addColorStop(1, sign.color.replace("1)", "0)"));
    ctx.fillStyle = gradient;
    ctx.fillRect(sign.x - 64, sign.y - 64, 128, 128);
  });

  if (heat >= 7) {
    ctx.fillStyle = "rgba(255, 122, 69, 0.05)";
    ctx.fillRect(0, 0, W, H);
  }
}

function applyLightmap(nativeCtx, lightmapCanvas) {
  nativeCtx.globalCompositeOperation = "multiply";
  nativeCtx.drawImage(lightmapCanvas, 0, 0);
  nativeCtx.globalCompositeOperation = "source-over";
}

function generateLightmapCanvas(W, H, city, heat) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  ctx.imageSmoothingEnabled = false;
  renderLightmap(ctx, W, H, city, heat);
  return canvas;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStreetlampPositions,
    getNeonSignPositions,
    renderLightmap,
    applyLightmap,
    generateLightmapCanvas
  };
}

if (typeof window !== 'undefined') {
  window.getStreetlampPositions = getStreetlampPositions;
  window.getNeonSignPositions = getNeonSignPositions;
  window.renderLightmap = renderLightmap;
  window.applyLightmap = applyLightmap;
  window.generateLightmapCanvas = generateLightmapCanvas;
}
