/**
 * Concrete Kings: The Block Chronicles
 * High-detail scale helper for canvas draw calls
 */

const NATIVE_W = 320;
const NATIVE_H = 180;
const HD_W = 1280;
const HD_H = 720;
const HD_RATIO = HD_W / NATIVE_W;

function scaleForCanvas(canvasWidth, canvasHeight) {
  return Math.max(1, Math.floor(Math.min(canvasWidth / HD_W, canvasHeight / HD_H)));
}

function scaleRect(x, y, w, h, canvasWidth, canvasHeight) {
  const s = scaleForCanvas(canvasWidth, canvasHeight);
  return {
    x: Math.floor(x * HD_RATIO * s),
    y: Math.floor(y * HD_RATIO * s),
    w: Math.max(1, Math.floor(w * HD_RATIO * s)),
    h: Math.max(1, Math.floor(h * HD_RATIO * s))
  };
}

function scaleFont(px, canvasWidth, canvasHeight) {
  const s = scaleForCanvas(canvasWidth, canvasHeight);
  return Math.max(1, Math.floor(px * HD_RATIO * s));
}

module.exports = {
  scaleRect,
  scaleFont,
  HD_RATIO,
  scaleForCanvas
};
