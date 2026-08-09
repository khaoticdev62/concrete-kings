/**
 * Concrete Kings: The Block Chronicles
 * Top-down lightmap — pooled lamp light on the street surface.
 *
 * RETARGETED FROM THE ORIGINAL PLAN. The graphics fidelity plan specified a
 * lightmap over the side-on parallax background, plus parallax layer caching.
 * That background no longer exists: the top-down city map replaced it and
 * drawProceduralBackground was removed as dead code. Parallax depth is
 * meaningless looking straight down, so only the lighting carried over, aimed at
 * topdown-city-renderer.js instead.
 *
 * Seen from above a lamp is not a post, it is a pool of light on the pavement.
 * Light positions come from the district's existing `lamp` decor, so the
 * per-district furniture density set in topdown-city-data.js becomes a lighting
 * rhythm for free: Chicago's dense lamp rows read as a lit street, Detroit's
 * sparse ones as an unlit one.
 *
 * Constraints this file honours, from the plan's global constraints:
 *  - no globalAlpha: alpha is baked into the rgba() gradient stops
 *  - no shadowBlur/shadowColor
 *  - integer coordinates only
 *  - no new palette colours; the glow colour is passed in from the district palette
 *  - no new dependencies, and works in Node without a canvas
 */

/**
 * Edge length of the cached glow sprite. One sprite is rendered per colour and
 * then blitted scaled to each light's radius — a radial gradient per lamp per
 * frame is the expensive way to do this, and there can be a dozen on screen.
 */
const LIGHT_SPRITE_SIZE = 64;

/** Light footprints in world pixels. A lamp pool is wider than it is tall. */
const LAMP_RADIUS_X = 30;
const LAMP_RADIUS_Y = 22;

class TopDownLightmap {
  /**
   * @param {object} options
   * @param {Function} [options.createCanvas] returns an object with width/height
   *   and getContext('2d'). Injected so the draw path is testable in Node, where
   *   there is no document. Without it, and without a document, the lightmap
   *   simply draws nothing.
   */
  constructor(options = {}) {
    this.createCanvas = options.createCanvas
      || (typeof document !== 'undefined' ? () => document.createElement('canvas') : null);
    this.spriteCache = new Map();
    this.stats = { lightsDrawn: 0 };
  }

  /**
   * Light sources for a district, in world coordinates.
   *
   * Pure and static so it can be tested without any canvas at all. Reads the
   * same `lamp` decor the renderer draws furniture from, so lights can never
   * drift out of step with the visible lamps.
   */
  static sources(district, palette) {
    if (!district || !Array.isArray(district.decor)) return [];
    const colour = (palette && palette.accent) || '#FFCD68';
    return district.decor
      .filter(item => item.type === 'lamp')
      .map(item => ({
        x: Math.floor(item.x),
        y: Math.floor(item.y),
        rx: LAMP_RADIUS_X,
        ry: LAMP_RADIUS_Y,
        colour
      }));
  }

  /**
   * Cached radial glow for one colour, as an off-screen canvas.
   *
   * The gradient stops carry their own alpha so the caller never touches
   * globalAlpha. Returns null when no canvas factory is available, which is the
   * normal case in Node and makes render() a no-op rather than a crash.
   */
  sprite(colour) {
    if (this.spriteCache.has(colour)) return this.spriteCache.get(colour);
    if (!this.createCanvas) {
      this.spriteCache.set(colour, null);
      return null;
    }

    const canvas = this.createCanvas();
    canvas.width = LIGHT_SPRITE_SIZE;
    canvas.height = LIGHT_SPRITE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.spriteCache.set(colour, null);
      return null;
    }

    const half = LIGHT_SPRITE_SIZE / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    const rgb = TopDownLightmap.toRgb(colour);
    // Deliberately weak. A light pool reads as light because it is subtle; at
    // high alpha it reads as a painted yellow circle on the road.
    grad.addColorStop(0, `rgba(${rgb},0.30)`);
    grad.addColorStop(0.45, `rgba(${rgb},0.13)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LIGHT_SPRITE_SIZE, LIGHT_SPRITE_SIZE);

    this.spriteCache.set(colour, canvas);
    return canvas;
  }

  /** '#FFCD68' -> '255,205,104'. Falls back to the amber accent on bad input. */
  static toRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
    if (!m) return '255,205,104';
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  /**
   * Composites the district's light pools onto the surface.
   *
   * Called after roads, sidewalks and decals but before anything standing on the
   * street, so furniture and the player sit in the light rather than under it.
   * Culled to the camera, because a district has up to twenty lamps and at most a
   * third are ever on screen.
   *
   * `lighten` composite mode makes overlapping pools brighten rather than stack
   * flatly, which is what stops a row of lamps looking like a row of decals.
   */
  render(ctx, district, palette, camera, viewport) {
    this.stats.lightsDrawn = 0;
    const sources = TopDownLightmap.sources(district, palette);
    if (!sources.length) return 0;

    const cam = camera || { x: 0, y: 0 };
    const view = viewport || { width: 960, height: 520 };
    const previous = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighten';

    for (const light of sources) {
      const w = light.rx * 2;
      const h = light.ry * 2;
      const left = light.x - light.rx;
      const top = light.y - light.ry;
      // Cull against the camera, with the light's own size as the margin.
      if (left > cam.x + view.width || left + w < cam.x) continue;
      if (top > cam.y + view.height || top + h < cam.y) continue;

      const sprite = this.sprite(light.colour);
      if (!sprite) break;   // no canvas support: nothing will draw, so stop early
      ctx.drawImage(sprite, 0, 0, LIGHT_SPRITE_SIZE, LIGHT_SPRITE_SIZE,
        Math.floor(left), Math.floor(top), Math.floor(w), Math.floor(h));
      this.stats.lightsDrawn++;
    }

    ctx.globalCompositeOperation = previous;
    return this.stats.lightsDrawn;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopDownLightmap, LIGHT_SPRITE_SIZE, LAMP_RADIUS_X, LAMP_RADIUS_Y };
}
if (typeof window !== 'undefined') {
  window.TopDownLightmap = TopDownLightmap;
}
