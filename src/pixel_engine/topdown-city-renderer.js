/**
 * Concrete Kings: The Block Chronicles
 * Top-down city renderer.
 *
 * Every element checks the asset registry first and falls back to a
 * procedural form. The map must look correct with zero assets present, so
 * a null from registry.get() is the normal case, not an error path.
 *
 * Draw order follows RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md section 6.3:
 * ground and roads (0), props and furniture (1), flora and weather (2),
 * decals on buildings (3), roof details (4).
 */

/**
 * Prefixed for the same reason as the controller: as classic <script> tags
 * these files share one global scope, so a bare `const WORLD` here collides
 * with the data module's declaration and stops this file parsing.
 */
let RND_DATA;
if (typeof require !== 'undefined') {
  RND_DATA = require('./topdown-city-data.js');
} else {
  RND_DATA = { WORLD: window.TOPDOWN_WORLD };
}
const RND_WORLD = RND_DATA.WORLD;

const SHADOW_OFFSET = 3;   // one shared offset is what sells the depth
const FACE_HEIGHT = 6;     // visible building front face

const POI_LABELS = {
  BARBER_SHOP: 'BARBER',
  BODEGA: 'BODEGA',
  SHOP_DEAL: 'COUNTER DEAL',
  CHESS_PARK: 'CHESS PARK',
  LOCKED_DOOR: 'ALLEY GATE'
};

class TopDownCityRenderer {
  constructor(options = {}) {
    this.registry = options.registry || null;
    this.stats = { assetDraws: 0, proceduralDraws: 0 };
  }

  spriteKey(districtKey, element) {
    return `${String(districtKey).toLowerCase()}.${element}`;
  }

  /** Draw a registered sprite if present; return false to draw procedurally. */
  tryAsset(ctx, districtKey, element, x, y, w, h) {
    if (!this.registry) return false;
    const slice = this.registry.get(this.spriteKey(districtKey, element));
    if (!slice) return false;
    ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h, x, y, w, h);
    this.stats.assetDraws++;
    return true;
  }

  fill(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    this.stats.proceduralDraws++;
  }

  render(ctx, controller) {
    this.stats.assetDraws = 0;
    this.stats.proceduralDraws = 0;

    const d = controller.district;
    const p = d.palette;
    const key = controller.districtKey;
    const cam = controller.camera;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // ---- Layer 0: ground ----
    this.fill(ctx, 0, 0, RND_WORLD.width, RND_WORLD.height, p.ground);

    // ---- Layer 0: roads, then lane dashes ----
    d.roads.forEach(r => {
      if (!this.tryAsset(ctx, key, `road_${r.dir}`, r.x, r.y, r.w, r.h)) {
        this.fill(ctx, r.x, r.y, r.w, r.h, p.asphalt);
      }
    });
    d.roads.forEach(r => {
      if (r.dir === 'h') {
        const cy = r.y + r.h / 2 - 2;
        for (let x = r.x + 12; x < r.x + r.w - 24; x += 52) this.fill(ctx, x, cy, 26, 4, p.lane);
      } else {
        const cx = r.x + r.w / 2 - 2;
        for (let y = r.y + 12; y < r.y + r.h - 24; y += 52) this.fill(ctx, cx, y, 4, 26, p.lane);
      }
    });

    // ---- Layer 0: sidewalks with a highlight edge ----
    d.sidewalks.forEach(s => {
      if (!this.tryAsset(ctx, key, 'ground_walk', s.x, s.y, s.w, s.h)) {
        this.fill(ctx, s.x, s.y, s.w, s.h, p.walk);
        this.fill(ctx, s.x, s.y, s.w, 2, p.walkHi);
      }
    });

    // ---- Layer 0: zebra crossings where the avenue meets the street ----
    const avenue = d.roads.find(r => r.dir === 'h');
    const street = d.roads.find(r => r.dir === 'v');
    if (avenue && street) {
      for (let i = 0; i < 6; i++) {
        this.fill(ctx, street.x + 8 + i * 16, avenue.y + 4, 9, 30, p.zebra);
        this.fill(ctx, street.x + 8 + i * 16, avenue.y + avenue.h - 34, 9, 30, p.zebra);
      }
      for (let i = 0; i < 6; i++) {
        this.fill(ctx, street.x - 40, avenue.y + 10 + i * 16, 30, 9, p.zebra);
        this.fill(ctx, street.x + street.w + 10, avenue.y + 10 + i * 16, 30, 9, p.zebra);
      }
    }

    // ---- Parcels: each carries its own roof detail (layer 4) internally ----
    d.parcels.forEach(parcel => this.drawParcel(ctx, key, parcel, p));

    // ---- Layer 1: props and furniture ----
    d.decor.filter(i => i.type === 'car').forEach(item => {
      this.drawCar(ctx, key, item.x, item.y, item.dir, p);
    });

    // ---- Layer 2: flora (weather composites separately, over this canvas) ----
    d.decor.filter(i => i.type === 'tree').forEach(item => {
      this.drawTree(ctx, key, item.x, item.y, p);
    });

    // POIs, then the player on top — never occluded
    d.pois.forEach(poi => {
      const active = controller.activePoi && controller.activePoi.id === poi.id;
      this.drawPoi(ctx, poi, active, p);
    });
    this.drawPlayer(ctx, controller, p);

    ctx.restore();
  }

  drawParcel(ctx, key, parcel, p) {
    const roofCol = p[parcel.roof] || p.roofA;
    const roofDk = p[`${parcel.roof}Dk`] || p.roofADk;

    // Shadow first, always procedural, so depth stays consistent across assets
    this.fill(ctx, parcel.x + SHADOW_OFFSET, parcel.y + SHADOW_OFFSET,
      parcel.w, parcel.h + FACE_HEIGHT, p.shadow);

    if (parcel.kind === 'park' || parcel.kind === 'lot' || parcel.kind === 'court') {
      if (!this.tryAsset(ctx, key, `ground_${parcel.kind}`, parcel.x, parcel.y, parcel.w, parcel.h)) {
        this.fill(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol);

        if (parcel.kind === 'lot') {
          // Painted stalls plus a kerb edge, so a lot never reads as a slab.
          for (let x = parcel.x + 14; x < parcel.x + parcel.w - 8; x += 26) {
            this.fill(ctx, x, parcel.y + 6, 3, parcel.h - 12, p.walkHi);
          }
          this.fill(ctx, parcel.x, parcel.y, parcel.w, 3, p.walk);
          this.fill(ctx, parcel.x, parcel.y + parcel.h - 3, parcel.w, 3, p.walk);
        }

        if (parcel.kind === 'park') {
          // Break the flat fill with darker undergrowth patches and a path.
          for (let gy = parcel.y + 10; gy < parcel.y + parcel.h - 14; gy += 38) {
            for (let gx = parcel.x + 12; gx < parcel.x + parcel.w - 16; gx += 46) {
              const jitter = ((gx + gy) % 3) * 6;
              this.fill(ctx, gx + jitter, gy, 22, 12, p.treeDk);
            }
          }
          const pathY = parcel.y + Math.floor(parcel.h / 2) - 5;
          this.fill(ctx, parcel.x + 4, pathY, parcel.w - 8, 11, p.walk);
          this.fill(ctx, parcel.x + 4, pathY, parcel.w - 8, 2, p.walkHi);
        }

        if (parcel.kind === 'court') {
          // Half-court markings: centre line, circle stand-in, and two keys.
          const midX = parcel.x + parcel.w / 2;
          this.fill(ctx, midX - 2, parcel.y + 6, 4, parcel.h - 12, p.zebra);
          this.fill(ctx, midX - 26, parcel.y + parcel.h / 2 - 26, 52, 4, p.zebra);
          this.fill(ctx, midX - 26, parcel.y + parcel.h / 2 + 22, 52, 4, p.zebra);
          const keyH = Math.min(70, parcel.h - 40);
          this.fill(ctx, parcel.x + 10, parcel.y + (parcel.h - keyH) / 2, 46, 3, p.zebra);
          this.fill(ctx, parcel.x + parcel.w - 56, parcel.y + (parcel.h - keyH) / 2, 46, 3, p.zebra);
          this.fill(ctx, parcel.x + 10, parcel.y + (parcel.h + keyH) / 2, 46, 3, p.zebra);
          this.fill(ctx, parcel.x + parcel.w - 56, parcel.y + (parcel.h + keyH) / 2, 46, 3, p.zebra);
        }
      }
      return;
    }

    // Building: visible front face, then roof, then clutter
    this.fill(ctx, parcel.x, parcel.y + parcel.h, parcel.w, FACE_HEIGHT, p.face);
    if (!this.tryAsset(ctx, key, `building_${parcel.roof}`, parcel.x, parcel.y, parcel.w, parcel.h)) {
      this.fill(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol);
      this.fill(ctx, parcel.x, parcel.y, parcel.w, 3, roofDk);
      this.fill(ctx, parcel.x, parcel.y + parcel.h - 3, parcel.w, 3, roofDk);
    }

    // ---- Layer 4: rooftop clutter ----
    // Spacing is deliberately tight. Density is what makes a top-down city read
    // as inhabited rather than as coloured blocks; sparse clutter looks unfinished.
    const STEP = 46;
    const cols = Math.max(1, Math.floor(parcel.w / STEP));
    const rows = Math.max(1, Math.floor(parcel.h / STEP));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ux = parcel.x + 14 + c * STEP;
        const uy = parcel.y + 14 + r * STEP;
        // Vary the unit by position so rooftops are not a regular lattice.
        const variant = (c + r * 3) % 4;
        if (variant === 3) continue;  // leave gaps

        if (variant === 0) {                                    // AC unit
          if (ux + 20 > parcel.x + parcel.w - 6 || uy + 14 > parcel.y + parcel.h - 6) continue;
          this.fill(ctx, ux, uy, 20, 14, roofDk);
          this.fill(ctx, ux + 3, uy + 3, 14, 5, roofCol);
        } else if (variant === 1) {                              // vent pair
          if (ux + 16 > parcel.x + parcel.w - 6 || uy + 8 > parcel.y + parcel.h - 6) continue;
          this.fill(ctx, ux, uy, 7, 8, roofDk);
          this.fill(ctx, ux + 9, uy, 7, 8, roofDk);
        } else {                                                 // skylight
          if (ux + 18 > parcel.x + parcel.w - 6 || uy + 10 > parcel.y + parcel.h - 6) continue;
          this.fill(ctx, ux, uy, 18, 10, roofDk);
          this.fill(ctx, ux + 2, uy + 2, 14, 6, p.walkHi);
        }
      }
    }

    // Water tank and stair head on anything with real footprint.
    if (parcel.w > 90 && parcel.h > 80) {
      this.fill(ctx, parcel.x + parcel.w - 34, parcel.y + 14, 22, 22, roofDk);
      this.fill(ctx, parcel.x + parcel.w - 30, parcel.y + 18, 14, 14, p.face);
      this.fill(ctx, parcel.x + 12, parcel.y + parcel.h - 30, 26, 18, roofDk);
      this.fill(ctx, parcel.x + 16, parcel.y + parcel.h - 26, 18, 10, p.face);
    }
  }

  drawTree(ctx, key, x, y, p) {
    if (this.tryAsset(ctx, key, 'flora_tree', x - 12, y - 12, 24, 24)) return;
    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.arc(x + SHADOW_OFFSET, y + SHADOW_OFFSET, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.treeDk;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.tree;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    this.stats.proceduralDraws++;
  }

  drawCar(ctx, key, x, y, dir, p) {
    const w = dir === 'v' ? 16 : 30;
    const h = dir === 'v' ? 30 : 16;
    if (this.tryAsset(ctx, key, `prop_car_${dir}`, x, y, w, h)) return;
    this.fill(ctx, x + SHADOW_OFFSET, y + SHADOW_OFFSET, w, h, p.shadow);
    this.fill(ctx, x, y, w, h, p.accent);
    if (dir === 'v') {
      this.fill(ctx, x + 3, y + 5, w - 6, 8, p.face);
      this.fill(ctx, x + 3, y + 19, w - 6, 6, p.face);
    } else {
      this.fill(ctx, x + 5, y + 3, 8, h - 6, p.face);
      this.fill(ctx, x + 19, y + 3, 6, h - 6, p.face);
    }
  }

  drawPoi(ctx, poi, active, p) {
    const col = active ? p.accent : p.walkHi;

    // POI props are shared across all eight districts — the same five POIs
    // appear everywhere — so the lookup is district-agnostic, unlike every
    // other element which prefixes the district.
    const slice = this.registry
      ? this.registry.get('prop_poi_' + poi.id.toLowerCase())
      : null;

    let footprint = 30;

    if (slice) {
      // Anchor the sprite so its base sits on the POI point, the way a real
      // object stands on the ground rather than floating centred on it.
      const w = slice.w;
      const h = slice.h;
      const x = poi.x - w / 2;
      const y = poi.y - h + 10;

      ctx.globalAlpha = 0.4;
      ctx.fillStyle = p.shadow;
      ctx.beginPath();
      ctx.ellipse(poi.x, poi.y + 4, w * 0.42, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h, x, y, w, h);
      this.stats.assetDraws++;

      // Active POIs get an accent underline rather than a box, so the art is
      // never boxed in by UI chrome.
      if (active) this.fill(ctx, poi.x - w / 2, poi.y + 8, w, 3, col);

      footprint = h;
    } else {
      this.fill(ctx, poi.x - footprint / 2 + SHADOW_OFFSET, poi.y - footprint / 2 + SHADOW_OFFSET, footprint, footprint, p.shadow);
      this.fill(ctx, poi.x - footprint / 2, poi.y - footprint / 2, footprint, footprint, p.ground);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(poi.x - footprint / 2), Math.round(poi.y - footprint / 2), footprint, footprint);
    }

    // Name renders on the map — this is what replaces the deleted legend.
    const label = POI_LABELS[poi.id] || poi.id;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 12;
    const labelY = slice ? poi.y + 14 : poi.y + footprint / 2 + 4;
    this.fill(ctx, poi.x - w / 2, labelY, w, 15, p.ground);
    ctx.fillStyle = col;
    ctx.fillText(label, Math.round(poi.x), Math.round(labelY + 11));
    ctx.textAlign = 'left';
  }

  drawPlayer(ctx, controller, p) {
    const x = controller.x;
    const y = controller.y;
    const bob = (controller.animFrame === 1 || controller.animFrame === 3) ? 1 : 0;

    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.ellipse(x, y + 12, 11, 4, 0, 0, Math.PI * 2); ctx.fill();

    this.fill(ctx, x - 7, y - 18 + bob, 14, 9, p.roofADk);   // hair
    this.fill(ctx, x - 5, y - 10 + bob, 10, 6, '#854224');   // face
    this.fill(ctx, x - 8, y - 4 + bob, 16, 12, p.accent);    // jacket
    this.fill(ctx, x - 6, y + 8 + bob, 5, 8, p.face);        // legs
    this.fill(ctx, x + 1, y + 8 + bob, 5, 8, p.face);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopDownCityRenderer, POI_LABELS, SHADOW_OFFSET };
}
if (typeof window !== 'undefined') {
  window.TopDownCityRenderer = TopDownCityRenderer;
  window.TOPDOWN_POI_LABELS = POI_LABELS;
}
