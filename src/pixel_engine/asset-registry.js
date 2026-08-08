/**
 * Concrete Kings: The Block Chronicles
 * Asset Registry — manifest-driven sprite lookup with procedural fallback.
 *
 * Every consumer must treat a null from get() as "draw it procedurally".
 * A missing asset is never fatal: the map has to render with zero art present.
 *
 * Conventions come from RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md — 16x16 native
 * tiles, 32x32 for buildings and props, and sprite keys built from that pack's
 * category vocabulary (ground/road/building/furniture/flora/decal/prop/icon).
 */

function defaultLoadImage(path) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

class AssetRegistry {
  constructor(options = {}) {
    this.loadImage = options.loadImage || defaultLoadImage;
    this.tileSize = 16;
    this.sources = {};              // name -> path
    this.sprites = new Map();       // key -> { source, x, y, w, h }
    this.images = new Map();        // name -> image
    this.unavailable = new Set();   // source names that failed to load
    this.diagnostics = [];
  }

  loadManifest(manifest) {
    this.sprites.clear();
    this.images.clear();
    this.unavailable.clear();
    this.sources = {};

    if (!manifest || typeof manifest !== 'object') {
      this.diagnostics.push('manifest: not an object');
      return false;
    }
    if (!manifest.sources || typeof manifest.sources !== 'object' || Array.isArray(manifest.sources)) {
      this.diagnostics.push('manifest: missing or invalid "sources"');
      return false;
    }
    if (!manifest.sprites || typeof manifest.sprites !== 'object' || Array.isArray(manifest.sprites)) {
      this.diagnostics.push('manifest: missing or invalid "sprites"');
      return false;
    }

    if (typeof manifest.tileSize === 'number' && manifest.tileSize > 0) {
      this.tileSize = manifest.tileSize;
    }
    this.sources = { ...manifest.sources };

    Object.entries(manifest.sprites).forEach(([key, def]) => {
      if (!def || typeof def !== 'object') {
        this.diagnostics.push(`sprite "${key}": invalid definition`);
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(this.sources, def.source)) {
        this.diagnostics.push(`sprite "${key}": undeclared source "${def.source}"`);
        return;
      }
      this.sprites.set(key, {
        source: def.source,
        x: def.x | 0, y: def.y | 0,
        w: def.w | 0, h: def.h | 0
      });
    });

    return true;
  }

  async preload() {
    const names = Object.keys(this.sources);
    for (const name of names) {
      const img = await this.loadImage(this.sources[name]);
      if (img) {
        this.images.set(name, img);
      } else {
        this.unavailable.add(name);
        this.diagnostics.push(`source "${name}" unavailable: ${this.sources[name]}`);
      }
    }
  }

  get(key) {
    const def = this.sprites.get(key);
    if (!def) return null;
    if (this.unavailable.has(def.source)) return null;
    const image = this.images.get(def.source);
    if (!image) return null;
    return { image, x: def.x, y: def.y, w: def.w, h: def.h };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AssetRegistry };
}
if (typeof window !== 'undefined') {
  window.AssetRegistry = AssetRegistry;
}
