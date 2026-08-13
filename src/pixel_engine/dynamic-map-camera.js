/**
 * Concrete Kings: Dynamic Narrative Map — Camera
 *
 * PRD §11 / §12. Supports pan, zoom, focus, smooth interpolation,
 * node targeting, automatic framing. Movement uses lerp, not teleport,
 * except when accessibility "instant" is set.
 *
 * Deterministic: camera state is plain data; update() advances it by dt.
 */

const DM_ZOOM_LEVELS = Object.freeze({
  REGION: 0.55,
  DISTRICT: 1.0,
  LOCATION: 1.6
});
const DM_ZOOM_ORDER = ['REGION', 'DISTRICT', 'LOCATION'];

class DMCamera {
  constructor(options = {}) {
    this.x = options.x || 480;      // world-space center x
    this.y = options.y || 270;      // world-space center y
    this.zoom = options.zoom || DM_ZOOM_LEVELS.DISTRICT;
    this.targetX = this.x;
    this.targetY = this.y;
    this.targetZoom = this.zoom;
    this.instant = false;            // accessibility: snap instead of lerp
    this.lerp = options.lerp || 0.18;
    this.minZoom = 0.35;
    this.maxZoom = 2.2;
    this.bounds = options.bounds || { x: 0, y: 0, w: 960, h: 540 };
  }

  // PRD §11: pan by a screen-space delta (in world units before zoom)
  pan(dx, dy) {
    this.targetX += dx / this.zoom;
    this.targetY += dy / this.zoom;
    this._clamp();
  }

  // PRD §11: zoom by a factor; keep focus point stable
  zoomBy(factor, focusX, focusY) {
    const prev = this.zoom;
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom * factor));
    if (typeof focusX === 'number') {
      // adjust target so the focus point stays put under cursor
      const ratio = prev / this.targetZoom;
      this.targetX = focusX - (focusX - this.targetX) * ratio;
      this.targetY = focusY - (focusY - this.targetY) * ratio;
    }
    this._clamp();
  }

  setZoomLevel(level) {
    if (DM_ZOOM_LEVELS[level] != null) this.targetZoom = DM_ZOOM_LEVELS[level];
  }

  zoomIn() { this.zoomBy(1.2); }
  zoomOut() { this.zoomBy(1 / 1.2); }

  nextZoomLevel(dir) {
    const i = DM_ZOOM_ORDER.indexOf(this._levelFromZoom());
    const ni = Math.max(0, Math.min(DM_ZOOM_ORDER.length - 1, i + (dir > 0 ? 1 : -1)));
    this.setZoomLevel(DM_ZOOM_ORDER[ni]);
  }

  _levelFromZoom() {
    let best = 'DISTRICT', bestD = Infinity;
    for (const k of DM_ZOOM_ORDER) {
      const d = Math.abs(DM_ZOOM_LEVELS[k] - this.zoom);
      if (d < bestD) { bestD = d; best = k; }
    }
    return best;
  }

  // PRD §11: focus / automatic framing on a world point
  focus(x, y) {
    this.targetX = x;
    this.targetY = y;
    this._clamp();
  }

  focusOnLocation(loc) {
    if (!loc) return;
    const c = loc.coordinates || { x: 480, y: 270 };
    this.focus(c.x, c.y);
  }

  _clamp() {
    const b = this.bounds;
    this.targetX = Math.max(b.x, Math.min(b.x + b.w, this.targetX));
    this.targetY = Math.max(b.y, Math.min(b.y + b.h, this.targetY));
  }

  // Advance toward target. dt in ms (used for frame-rate independence).
  update(dt = 16) {
    if (this.instant) {
      this.x = this.targetX; this.y = this.targetY; this.zoom = this.targetZoom;
      return;
    }
    const t = 1 - Math.pow(1 - this.lerp, dt / 16);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;
    this.zoom += (this.targetZoom - this.zoom) * t;
  }

  // Convert world -> screen given canvas size
  worldToScreen(wx, wy, cw, ch) {
    return {
      x: (wx - this.x) * this.zoom + cw / 2,
      y: (wy - this.y) * this.zoom + ch / 2
    };
  }

  // Convert screen -> world
  screenToWorld(sx, sy, cw, ch) {
    return {
      x: (sx - cw / 2) / this.zoom + this.x,
      y: (sy - ch / 2) / this.zoom + this.y
    };
  }

  snapshot() {
    return { x: this.x, y: this.y, zoom: this.zoom, targetX: this.targetX, targetY: this.targetY, targetZoom: this.targetZoom };
  }

  restore(s) {
    if (!s) return;
    this.x = s.x; this.y = s.y; this.zoom = s.zoom;
    this.targetX = s.targetX; this.targetY = s.targetY; this.targetZoom = s.targetZoom;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DMCamera, DM_ZOOM_LEVELS, DM_ZOOM_ORDER };
}
if (typeof window !== 'undefined') {
  window.DMCamera = DMCamera;
  window.DM_ZOOM_LEVELS = DM_ZOOM_LEVELS;
  window.DM_ZOOM_ORDER = DM_ZOOM_ORDER;
}
