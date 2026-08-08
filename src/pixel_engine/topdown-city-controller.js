/**
 * Concrete Kings: The Block Chronicles
 * Top-down city controller — movement, collision, camera, POI proximity.
 *
 * Holds no canvas reference. The renderer reads this controller's state;
 * this controller never draws.
 */

let dataModule;
if (typeof require !== 'undefined') {
  dataModule = require('./topdown-city-data.js');
} else {
  dataModule = {
    WORLD: window.TOPDOWN_WORLD,
    VIEWPORT: window.TOPDOWN_VIEWPORT,
    getDistrict: window.getTopDownDistrict
  };
}

const { WORLD, VIEWPORT, getDistrict } = dataModule;

const PLAYER_BOX = { w: 16, h: 10 };
const POI_RADIUS = 52;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function boxHitsRect(bx, by, bw, bh, r) {
  return bx < r.x + r.w && bx + bw > r.x && by < r.y + r.h && by + bh > r.y;
}

class TopDownCityController {
  constructor(options = {}) {
    this.districtKey = options.districtKey || 'HARLEM';
    this.district = getDistrict(this.districtKey) || getDistrict('HARLEM');

    this.speed = 4;
    this.facing = 'RIGHT';
    this.isMoving = false;
    this.animFrame = 0;
    this.animTick = 0;
    this.activePoi = null;
    this.keys = {};
    this.camera = { x: 0, y: 0 };

    this.spawn();

    if (options.attachInput !== false) this.setupInputListeners();
  }

  /** Place the player on the avenue centre, nudging along it until walkable. */
  spawn() {
    const avenue = this.district.roads.find(r => r.dir === 'h') || { y: WORLD.height / 2, h: 100 };
    const y = avenue.y + avenue.h / 2;
    let x = WORLD.width / 2;
    for (let i = 0; i < 200 && this.collidesAt(x, y); i++) x -= 16;
    this.x = clamp(x, 0, WORLD.width);
    this.y = clamp(y, 0, WORLD.height);
    this.updateCamera();
  }

  setDistrict(districtKey) {
    const next = getDistrict(districtKey);
    if (!next) return false;
    this.districtKey = districtKey;
    this.district = next;
    this.activePoi = null;
    this.spawn();
    return true;
  }

  setupInputListeners() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
  }

  collidesAt(x, y) {
    const bx = x - PLAYER_BOX.w / 2;
    const by = y - PLAYER_BOX.h / 2;
    for (const p of this.district.parcels) {
      if (!p.solid) continue;
      if (boxHitsRect(bx, by, PLAYER_BOX.w, PLAYER_BOX.h, p)) return true;
    }
    return false;
  }

  update() {
    let dx = 0;
    let dy = 0;

    if (this.keys['arrowleft'] || this.keys['a']) { dx -= this.speed; this.facing = 'LEFT'; }
    if (this.keys['arrowright'] || this.keys['d']) { dx += this.speed; this.facing = 'RIGHT'; }
    if (this.keys['arrowup'] || this.keys['w']) { dy -= this.speed; }
    if (this.keys['arrowdown'] || this.keys['s']) { dy += this.speed; }

    this.isMoving = (dx !== 0 || dy !== 0);

    // Resolve per-axis so the player slides along walls instead of sticking.
    if (dx !== 0) {
      const nx = clamp(this.x + dx, 0, WORLD.width);
      if (!this.collidesAt(nx, this.y)) this.x = nx;
    }
    if (dy !== 0) {
      const ny = clamp(this.y + dy, 0, WORLD.height);
      if (!this.collidesAt(this.x, ny)) this.y = ny;
    }

    this.animTick++;
    if (this.animTick % 10 === 0) this.animFrame = (this.animFrame + 1) % 4;

    this.updateCamera();
    this.checkPois();
  }

  updateCamera() {
    this.camera.x = Math.round(clamp(this.x - VIEWPORT.width / 2, 0, WORLD.width - VIEWPORT.width));
    this.camera.y = Math.round(clamp(this.y - VIEWPORT.height / 2, 0, WORLD.height - VIEWPORT.height));
  }

  checkPois() {
    let best = null;
    let bestDist = Infinity;
    for (const poi of this.district.pois) {
      const d = Math.hypot(this.x - poi.x, this.y - poi.y);
      if (d <= POI_RADIUS && d < bestDist) { best = poi; bestDist = d; }
    }
    this.activePoi = best;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopDownCityController, PLAYER_BOX, POI_RADIUS };
}
if (typeof window !== 'undefined') {
  window.TopDownCityController = TopDownCityController;
  window.TOPDOWN_PLAYER_BOX = PLAYER_BOX;
  window.TOPDOWN_POI_RADIUS = POI_RADIUS;
}
