/**
 * Concrete Kings: The Block Chronicles
 * Top-down district layouts. Pure data — no canvas, no DOM.
 *
 * Colours are restricted to the master palette
 * (assets/palettes/concrete_kings.json, generated from pixel-engine.js) so the
 * eight districts read as one world. Per-city intent follows the profiles in
 * CITY_ART_PROMPTS.md.
 */

const WORLD = { width: 2400, height: 1300 };
const VIEWPORT = { width: 960, height: 520 };

const POI_IDS = ['BARBER_SHOP', 'BODEGA', 'SHOP_DEAL', 'CHESS_PARK', 'LOCKED_DOOR'];

const SHADOW = 'rgba(0,0,0,0.45)';

/**
 * Every colour below is a verbatim entry from concrete_kings.json.
 *
 * Two constraints shape these, and a validation test enforces both:
 *  1. Large fills (ground, asphalt, roofA/B/C) stay dark — relative luminance
 *     under 120 — per the prompt pack's "dark dominant" rule. Bright hues are
 *     confined to `lane`, `zebra` and `accent`, which are thin marks and
 *     highlights, never area fills.
 *  2. Foliage uses the `green` ramp. It previously used the dark teal-green ramp,
 *     because the 64-colour palette contained no greens at all and the rule was
 *     "do not invent greens" — but that rule was a workaround for a gap in the
 *     palette, and the gap has been filled. Teal foliage was also the reason parks
 *     read as slabs: `grass` and `tree` were set to the SAME colour in every
 *     district, so a canopy had zero contrast against the grass it stood on. Grass
 *     is now two to three ramp steps below the canopy.
 */

// Harlem — brick, sodium amber, fire escapes, stoop culture
const PAL_HARLEM = {
  ground:'#101116', asphalt:'#22252E', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#474D5E', walkHi:'#565E70', roofA:'#7A1D1C', roofADk:'#4D1414',
  roofB:'#6B341D', roofBDk:'#3B1C11', roofC:'#393E4D', roofCDk:'#2D313D',
  face:'#181920', accent:'#FFCD68', tree:'#5E7F51', treeDk:'#4C6843',
  grass:'#2B3C29', shadow:SHADOW
};

// Detroit — post-industrial, corrugated metal, half-empty lots
const PAL_DETROIT = {
  ground:'#08080A', asphalt:'#181920', lane:'#9C5C1D', zebra:'#A0AAC2',
  walk:'#393E4D', walkHi:'#474D5E', roofA:'#AA2724', roofADk:'#7A1D1C',
  roofB:'#565E70', roofBDk:'#393E4D', roofC:'#3B1C11', roofCDk:'#26120B',
  face:'#101116', accent:'#F0AB43', tree:'#4C6843', treeDk:'#3B5136',
  grass:'#2B3C29', shadow:SHADOW
};

// Chicago — limestone, cold lake light, el-track steel.
// Cyan is an accent only; roofs are lake blue, steel and dark brick.
const PAL_CHICAGO = {
  ground:'#0A1526', asphalt:'#22252E', lane:'#C9822B', zebra:'#E2E8F7',
  walk:'#474D5E', walkHi:'#666E82', roofA:'#1C375C', roofADk:'#11233F',
  roofB:'#565E70', roofBDk:'#393E4D', roofC:'#4D1414', roofCDk:'#2B0D0D',
  face:'#11233F', accent:'#6FE8D8', tree:'#5E7F51', treeDk:'#4C6843',
  grass:'#2B3C29', shadow:SHADOW
};

// Miami — muted stucco and terrazzo. The Art Deco neon lives in `accent`
// only: signage, car bodies, the active POI outline. Hot pink and cyan roof
// fills would break the pack's "dark dominant, neon sparingly" rule outright.
const PAL_MIAMI = {
  ground:'#11233F', asphalt:'#2D313D', lane:'#B6C0D8', zebra:'#E2E8F7',
  walk:'#666E82', walkHi:'#8B95AB', roofA:'#7A1D1C', roofADk:'#4D1414',
  roofB:'#1C375C', roofBDk:'#11233F', roofC:'#6B341D', roofCDk:'#3B1C11',
  face:'#0A1526', accent:'#6FE8D8', tree:'#4C6843', treeDk:'#3B5136',
  grass:'#2B3C29', shadow:SHADOW
};

// Baltimore — formstone, marble steps, harbour blue
const PAL_BALTIMORE = {
  ground:'#0A1526', asphalt:'#22252E', lane:'#C9822B', zebra:'#E2E8F7',
  walk:'#666E82', walkHi:'#8B95AB', roofA:'#6B341D', roofADk:'#3B1C11',
  roofB:'#274F80', roofBDk:'#1C375C', roofC:'#565E70', roofCDk:'#393E4D',
  face:'#181920', accent:'#F0AB43', tree:'#5E7F51', treeDk:'#4C6843',
  grass:'#2B3C29', shadow:SHADOW
};

// Atlanta — red clay, porch wood, humid canopy
const PAL_ATLANTA = {
  ground:'#140A07', asphalt:'#26120B', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#522717', walkHi:'#6B341D', roofA:'#AA2724', roofADk:'#7A1D1C',
  roofB:'#854224', roofBDk:'#522717', roofC:'#393E4D', roofCDk:'#2D313D',
  face:'#140A07', accent:'#FFCD68', tree:'#5E7F51', treeDk:'#4C6843',
  grass:'#2B3C29', shadow:SHADOW
};

// Oakland — bay fog grey, mural colour, shipping steel
const PAL_OAKLAND = {
  ground:'#101116', asphalt:'#2D313D', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#565E70', walkHi:'#788196', roofA:'#174540', roofADk:'#0D2926',
  roofB:'#274F80', roofBDk:'#1C375C', roofC:'#AA2724', roofCDk:'#7A1D1C',
  face:'#181920', accent:'#F0AB43', tree:'#5E7F51', treeDk:'#4C6843',
  grass:'#2B3C29', shadow:SHADOW
};

// NOLA — cast iron, gas lamp, cypress and slate
const PAL_NOLA = {
  ground:'#140A07', asphalt:'#22252E', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#6B341D', walkHi:'#854224', roofA:'#174540', roofADk:'#0D2926',
  roofB:'#7A1D1C', roofBDk:'#4D1414', roofC:'#6E3E14', roofCDk:'#2B0D0D',
  face:'#26120B', accent:'#FFCD68', tree:'#5E7F51', treeDk:'#4C6843',
  grass:'#2B3C29', shadow:SHADOW
};

/**
 * Every district shares this street skeleton: one horizontal avenue and one
 * vertical street. Districts differ by parcels, decoration and POI placement,
 * which is what makes them read as different places.
 */
const AVENUE_Y = 600;
const AVENUE_H = 116;
const STREET_X = 1120;
const STREET_W = 104;

/**
 * Pavement depth on each frontage.
 *
 * These were 20px, and the tree, lamp and dumpster lines were placed OUTSIDE
 * them — trees at y=566 and y=752 against a pavement of 580..600 and 716..736.
 * So every district carried an unarticulated verge: a 60-90px band of bare
 * `ground` between the back of the pavement and the building line, holding the
 * street furniture and rendering as a featureless black gutter running the whole
 * width of the map. It was the largest single reason the map read as flat, and no
 * amount of shading fixes it, because there was nothing there to shade.
 *
 * The pavement now extends back to include those lines. A real street seen from
 * above is a wide footway with a tree row on it and then the building frontage —
 * so the trees stand on pavement, and the blocks come out to meet it.
 */
const PAVE_AVENUE = 60;   // covers the y=566 and y=752 tree lines
const PAVE_STREET = 44;   // covers the x=1110 and x=1234 POI anchors

/**
 * Narrowest alley a player can actually walk down.
 *
 * PLAYER_BOX is 16x10 and movement is axis-separated, so a vertical slot needs
 * more than 16px to pass sideways and a horizontal one more than 10px to pass
 * through. Anything tighter is scenery pretending to be a route, and any POI
 * behind it is unreachable — test/map-layout.test.js flood-fills the map to prove
 * that cannot happen.
 */
const MIN_ALLEY = 20;

function streetSkeleton() {
  return {
    roads: [
      { x: 0, y: AVENUE_Y, w: WORLD.width, h: AVENUE_H, dir: 'h' },
      { x: STREET_X, y: 0, w: STREET_W, h: WORLD.height, dir: 'v' }
    ],
    sidewalks: [
      { x: 0, y: AVENUE_Y - PAVE_AVENUE, w: WORLD.width, h: PAVE_AVENUE },
      { x: 0, y: AVENUE_Y + AVENUE_H, w: WORLD.width, h: PAVE_AVENUE },
      { x: STREET_X - PAVE_STREET, y: 0, w: PAVE_STREET, h: WORLD.height },
      { x: STREET_X + STREET_W, y: 0, w: PAVE_STREET, h: WORLD.height }
    ]
  };
}

/**
 * The four buildable blocks, as exact rectangles running from the back of the
 * pavement to the edge of the world.
 *
 * Districts used to hand-place parcels inside these with ad-hoc margins — 60px on
 * the left, 90px at the top, whatever fell out at the bottom — and every one of
 * those margins rendered as bare ground. Parcels are now fitted to these bounds
 * (see fitToQuadrants) so the margins cannot exist.
 */
const QUAD_TOP = AVENUE_Y - PAVE_AVENUE;
const QUAD_BOTTOM = AVENUE_Y + AVENUE_H + PAVE_AVENUE;
const QUAD_LEFT = STREET_X - PAVE_STREET;
const QUAD_RIGHT = STREET_X + STREET_W + PAVE_STREET;

const QUADRANTS = [
  { id: 'NW', x: 0, y: 0, w: QUAD_LEFT, h: QUAD_TOP },
  { id: 'NE', x: QUAD_RIGHT, y: 0, w: WORLD.width - QUAD_RIGHT, h: QUAD_TOP },
  { id: 'SW', x: 0, y: QUAD_BOTTOM, w: QUAD_LEFT, h: WORLD.height - QUAD_BOTTOM },
  { id: 'SE', x: QUAD_RIGHT, y: QUAD_BOTTOM, w: WORLD.width - QUAD_RIGHT, h: WORLD.height - QUAD_BOTTOM }
];

/** Which block a point belongs to, by which side of each road it falls on. */
function quadrantOf(x, y) {
  const id = (y < AVENUE_Y ? 'N' : 'S') + (x < STREET_X ? 'W' : 'E');
  return QUADRANTS.find(q => q.id === id);
}

/**
 * Promotes every gap left between a block's parcels into an explicit alley.
 *
 * The gaps were always meant to be alleys — Baltimore's own comment calls them
 * "alley communal space" — but nothing declared them, so they fell through to the
 * bare `ground` fill and read as holes in the map rather than as service lanes
 * behind the buildings. Detecting them from the parcels instead of listing them
 * by hand means a district cannot gain a void by having its numbers adjusted.
 *
 * Rectangles are found greedily on a 2px grid: take the first uncovered cell,
 * run right while uncovered, then extend down while that whole run stays
 * uncovered. An L-shaped gap comes out as two rectangles, which is fine — they
 * abut, and an alley is drawn as a flat surface.
 */
function alleysIn(parcels, quad) {
  // The grid is the parcels' own edge coordinates, not a fixed pixel step.
  //
  // A fixed step has to round each parcel edge onto it, and an edge landing between
  // two grid lines then over- or under-reports coverage, leaving 1px slivers of bare
  // ground running the length of every block — 18,000px of them in Baltimore at a
  // 2px step. Dropping to a 1px grid is exact but rasterises 2.3 million cells per
  // district and cost 183ms at module load. Splitting on the edges themselves is
  // exact for the same reason a 1px grid is — no parcel boundary can fall inside a
  // cell, so every cell is wholly covered or wholly empty — while producing about
  // fifty columns instead of eleven hundred.
  const xs = [quad.x, quad.x + quad.w];
  const ys = [quad.y, quad.y + quad.h];
  parcels.forEach(p => {
    xs.push(p.x, p.x + p.w);
    ys.push(p.y, p.y + p.h);
  });
  const axis = (vals, lo, hi) => [...new Set(vals)]
    .filter(v => v >= lo && v <= hi)
    .sort((a, b) => a - b);
  const gx = axis(xs, quad.x, quad.x + quad.w);
  const gy = axis(ys, quad.y, quad.y + quad.h);

  const cols = gx.length - 1;
  const rows = gy.length - 1;
  if (cols < 1 || rows < 1) return [];
  const ix = new Map(gx.map((v, i) => [v, i]));
  const iy = new Map(gy.map((v, i) => [v, i]));
  const filled = new Uint8Array(cols * rows);

  parcels.forEach(p => {
    const c0 = ix.get(p.x);
    const c1 = ix.get(p.x + p.w);
    const r0 = iy.get(p.y);
    const r1 = iy.get(p.y + p.h);
    if (c0 === undefined || c1 === undefined || r0 === undefined || r1 === undefined) return;
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) filled[r * cols + c] = 1;
  });

  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (filled[r * cols + c]) continue;
      let cEnd = c;
      while (cEnd < cols && !filled[r * cols + cEnd]) cEnd++;
      let rEnd = r + 1;
      for (; rEnd < rows; rEnd++) {
        let clear = true;
        for (let cc = c; cc < cEnd && clear; cc++) if (filled[rEnd * cols + cc]) clear = false;
        if (!clear) break;
      }
      for (let rr = r; rr < rEnd; rr++) {
        for (let cc = c; cc < cEnd; cc++) filled[rr * cols + cc] = 1;
      }
      out.push({
        x: gx[c], y: gy[r], w: gx[cEnd] - gx[c], h: gy[rEnd] - gy[r],
        kind: 'alley', roof: 'asphalt', solid: false
      });
      c = cEnd - 1;
    }
  }
  return out;
}

/**
 * Fits each block's hand-authored parcels to its exact bounds, then fills what is
 * left with alleys.
 *
 * The transform is a single affine map from the parcels' own bounding box onto the
 * block, applied per block. That is deliberately chosen over rewriting the
 * districts as generated recipes: every district's character lives in the relative
 * proportions of its parcels — Harlem's narrow brownstone runs, Detroit's vast
 * lots, Baltimore's rowhouse strips — and an affine map preserves all of it exactly
 * while removing the margins. Gaps scale with everything else, so an authored
 * 40px alley stays an alley.
 *
 * Decor and POIs inside the original bounding box move with it. Anything outside —
 * the tree and lamp lines, which sit on the pavement — is left where it is, which
 * is why the pavement had to grow to include them first.
 */
function fitToQuadrants(district) {
  const added = [];

  QUADRANTS.forEach(quad => {
    const own = district.parcels.filter(p => quadrantOf(p.x + p.w / 2, p.y + p.h / 2) === quad);
    if (!own.length) return;

    const bx0 = Math.min(...own.map(p => p.x));
    const bx1 = Math.max(...own.map(p => p.x + p.w));
    const by0 = Math.min(...own.map(p => p.y));
    const by1 = Math.max(...own.map(p => p.y + p.h));
    const sx = quad.w / (bx1 - bx0);
    const sy = quad.h / (by1 - by0);
    // Both edges of a parcel go through the same map before the width is taken, so
    // parcels that were exactly adjacent stay exactly adjacent and rounding cannot
    // open a 1px seam that would then be promoted to an alley.
    const mapX = (v) => Math.round(quad.x + (v - bx0) * sx);
    const mapY = (v) => Math.round(quad.y + (v - by0) * sy);

    own.forEach(p => {
      const x0 = mapX(p.x);
      const y0 = mapY(p.y);
      p.w = mapX(p.x + p.w) - x0;
      p.h = mapY(p.y + p.h) - y0;
      p.x = x0;
      p.y = y0;
    });

    const inside = (o) => o.x >= bx0 && o.x <= bx1 && o.y >= by0 && o.y <= by1;
    district.decor.forEach(o => { if (inside(o)) { o.x = mapX(o.x); o.y = mapY(o.y); } });
    district.pois.forEach(o => { if (inside(o)) { o.x = mapX(o.x); o.y = mapY(o.y); } });

    added.push(...alleysIn(own, quad));
  });

  // Alleys go in front of the buildings so drawParcel lays their surface down
  // before the neighbouring walls' ambient occlusion falls across it.
  district.parcels.unshift(...added);
  return district;
}

/** Evenly spaced street trees along a horizontal line. */
function treeRow(startX, y, count, gap) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ type: 'tree', x: startX + i * gap, y });
  return out;
}

/** A filled grove, used where a district has a real park. */
function grove(x, y, cols, rows, gap) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ type: 'tree', x: x + c * gap, y: y + r * gap });
    }
  }
  return out;
}


/**
 * Street furniture along a sidewalk lane. Density and mix are the main levers
 * for district character now that all eight share one street skeleton —
 * Chicago is lamp-heavy under the L, Detroit sparse with dumpsters in its empty
 * lots, Atlanta and NOLA lean on canopy instead.
 */
function furnitureRow(type, startX, y, count, gap) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ type, x: startX + i * gap, y });
  return out;
}

/** Alternating run, for busy commercial sidewalks. */
function furnitureMix(startX, y, count, gap, kinds) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ type: kinds[i % kinds.length], x: startX + i * gap, y });
  }
  return out;
}

const SK = streetSkeleton();

const DISTRICTS = {
  // Dense brownstone rows, a ball court NE, a park SE. Busy, tree-lined.
  HARLEM: {
    id: 'HARLEM', city: 'Harlem', name: 'Harlem Stoop', palette: PAL_HARLEM,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      { x: 60, y: 90, w: 210, h: 400, kind: 'building', roof: 'roofA', solid: true },
      { x: 290, y: 90, w: 190, h: 400, kind: 'building', roof: 'roofB', solid: true },
      { x: 500, y: 90, w: 160, h: 250, kind: 'building', roof: 'roofC', solid: true },
      { x: 500, y: 360, w: 160, h: 130, kind: 'building', roof: 'roofA', solid: true },
      { x: 690, y: 90, w: 390, h: 190, kind: 'building', roof: 'roofC', solid: true },
      { x: 690, y: 300, w: 390, h: 190, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 90, w: 420, h: 270, kind: 'court', roof: 'roofA', solid: false },
      { x: 1740, y: 90, w: 220, h: 270, kind: 'building', roof: 'roofB', solid: true },
      { x: 1990, y: 90, w: 350, h: 180, kind: 'building', roof: 'roofC', solid: true },
      { x: 1990, y: 300, w: 350, h: 190, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 390, w: 670, h: 100, kind: 'building', roof: 'roofC', solid: true },
      { x: 60, y: 810, w: 260, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 340, y: 810, w: 210, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 570, y: 810, w: 170, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 760, y: 810, w: 320, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 1040, w: 430, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 510, y: 1040, w: 220, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 750, y: 1040, w: 330, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 810, w: 390, h: 300, kind: 'park', roof: 'grass', solid: false },
      { x: 1700, y: 810, w: 260, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1980, y: 810, w: 360, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 1700, y: 1040, w: 260, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 1980, y: 1040, w: 360, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 1140, w: 390, h: 100, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
      ...furnitureMix(120, 586, 8, 132, ['lamp','booth','lamp','dumpster']),
      ...furnitureMix(1340, 586, 7, 140, ['lamp','dumpster','lamp']),
      ...furnitureRow('lamp', 160, 742, 7, 148),
      ...treeRow(90, 566, 11, 96), ...treeRow(1310, 566, 11, 96),
      ...treeRow(90, 752, 11, 96), ...treeRow(1310, 752, 11, 96),
      ...grove(1330, 850, 4, 3, 90),
      { type: 'car', x: 180, y: 620, dir: 'h' }, { type: 'car', x: 520, y: 620, dir: 'h' },
      { type: 'car', x: 1480, y: 620, dir: 'h' }, { type: 'car', x: 760, y: 676, dir: 'h' },
      { type: 'car', x: 1860, y: 676, dir: 'h' }, { type: 'car', x: 1148, y: 240, dir: 'v' },
      { type: 'car', x: 1180, y: 940, dir: 'v' }, { type: 'car', x: 1148, y: 1180, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 170, y: 590 },
      { id: 'BODEGA', x: 1480, y: 726 },
      { id: 'SHOP_DEAL', x: 2100, y: 726 },
      { id: 'CHESS_PARK', x: 1480, y: 960 },
      { id: 'LOCKED_DOOR', x: 820, y: 400 }
    ]
  },

  // Half-empty blocks: few buildings, vast lots, sparse trees, almost no traffic.
  DETROIT: {
    id: 'DETROIT', city: 'Detroit', name: 'Detroit Lot', palette: PAL_DETROIT,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      { x: 60, y: 90, w: 300, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 320, w: 1020, h: 240, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 400, y: 90, w: 180, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 620, y: 90, w: 460, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 90, w: 240, h: 470, kind: 'building', roof: 'roofB', solid: true },
      { x: 1570, y: 90, w: 790, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1570, y: 330, w: 380, h: 230, kind: 'building', roof: 'roofA', solid: true },
      { x: 1990, y: 330, w: 370, h: 230, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 800, w: 1020, h: 220, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 1060, w: 400, h: 190, kind: 'building', roof: 'roofC', solid: true },
      { x: 500, y: 1060, w: 580, h: 190, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 800, w: 480, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1810, y: 800, w: 550, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 1040, w: 1070, h: 210, kind: 'building', roof: 'roofB', solid: true }
    ],
    decor: [
      ...furnitureRow('dumpster', 200, 500, 4, 260),
      ...furnitureRow('lamp', 180, 586, 4, 300),
      ...furnitureRow('dumpster', 300, 980, 3, 300),
      ...treeRow(120, 566, 5, 220), ...treeRow(1340, 566, 5, 220),
      ...treeRow(120, 752, 4, 260),
      { type: 'car', x: 300, y: 640, dir: 'h' },
      { type: 'car', x: 1700, y: 676, dir: 'h' },
      { type: 'car', x: 1148, y: 900, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 1900, y: 590 },
      { id: 'BODEGA', x: 300, y: 726 },
      { id: 'SHOP_DEAL', x: 700, y: 440 },
      { id: 'CHESS_PARK', x: 1110, y: 300 },
      { id: 'LOCKED_DOOR', x: 2100, y: 440 }
    ]
  },

  // Tall deep limestone parcels, an el-track slot, heavy traffic.
  CHICAGO: {
    id: 'CHICAGO', city: 'Chicago', name: 'Chicago Greystone', palette: PAL_CHICAGO,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      { x: 60, y: 60, w: 240, h: 500, kind: 'building', roof: 'roofA', solid: true },
      { x: 330, y: 60, w: 240, h: 500, kind: 'building', roof: 'roofB', solid: true },
      { x: 600, y: 60, w: 160, h: 500, kind: 'building', roof: 'roofC', solid: true },
      { x: 790, y: 60, w: 290, h: 300, kind: 'building', roof: 'roofA', solid: true },
      { x: 790, y: 390, w: 290, h: 170, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 60, w: 200, h: 500, kind: 'building', roof: 'roofB', solid: true },
      { x: 1520, y: 60, w: 200, h: 500, kind: 'building', roof: 'roofA', solid: true },
      { x: 1750, y: 60, w: 300, h: 240, kind: 'building', roof: 'roofC', solid: true },
      { x: 1750, y: 330, w: 300, h: 230, kind: 'building', roof: 'roofB', solid: true },
      { x: 2080, y: 60, w: 280, h: 500, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 780, w: 200, h: 470, kind: 'building', roof: 'roofB', solid: true },
      { x: 290, y: 780, w: 320, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 290, y: 1030, w: 320, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 640, y: 780, w: 440, h: 470, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 780, w: 260, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 1580, y: 780, w: 300, h: 220, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1910, y: 780, w: 450, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 1030, w: 1070, h: 220, kind: 'building', roof: 'roofB', solid: true }
    ],
    decor: [
      ...furnitureRow('lamp', 100, 586, 10, 104),
      ...furnitureRow('lamp', 1320, 586, 10, 108),
      ...furnitureMix(140, 742, 8, 128, ['lamp','booth']),
      ...furnitureMix(1360, 742, 8, 128, ['lamp','dumpster']),
      ...treeRow(100, 566, 9, 110), ...treeRow(1320, 566, 9, 118),
      ...treeRow(100, 752, 8, 118), ...treeRow(1320, 752, 8, 130),
      { type: 'car', x: 120, y: 618, dir: 'h' }, { type: 'car', x: 380, y: 618, dir: 'h' },
      { type: 'car', x: 640, y: 618, dir: 'h' }, { type: 'car', x: 1420, y: 618, dir: 'h' },
      { type: 'car', x: 1720, y: 618, dir: 'h' }, { type: 'car', x: 2020, y: 618, dir: 'h' },
      { type: 'car', x: 300, y: 678, dir: 'h' }, { type: 'car', x: 900, y: 678, dir: 'h' },
      { type: 'car', x: 1600, y: 678, dir: 'h' }, { type: 'car', x: 1148, y: 160, dir: 'v' },
      { type: 'car', x: 1180, y: 420, dir: 'v' }, { type: 'car', x: 1148, y: 860, dir: 'v' },
      { type: 'car', x: 1180, y: 1120, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 860, y: 470 },
      { id: 'BODEGA', x: 1730, y: 890 },
      { id: 'SHOP_DEAL', x: 1110, y: 700 },
      { id: 'CHESS_PARK', x: 400, y: 590 },
      { id: 'LOCKED_DOOR', x: 2200, y: 726 }
    ]
  },

  // Many small hotel footprints, palm rows, a courtyard SE. Busy strip.
  MIAMI: {
    id: 'MIAMI', city: 'Miami', name: 'Miami Cut', palette: PAL_MIAMI,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      { x: 60, y: 90, w: 140, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 220, y: 90, w: 140, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 380, y: 90, w: 140, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 540, y: 90, w: 140, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 700, y: 90, w: 380, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 320, w: 160, h: 240, kind: 'building', roof: 'roofC', solid: true },
      { x: 240, y: 320, w: 400, h: 240, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 660, y: 320, w: 420, h: 240, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 1460, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 1630, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1800, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 1970, y: 90, w: 390, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 320, w: 1070, h: 240, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 790, w: 170, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 250, y: 790, w: 170, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 440, y: 790, w: 170, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 630, y: 790, w: 450, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 1040, w: 1020, h: 210, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 790, w: 200, h: 460, kind: 'building', roof: 'roofA', solid: true },
      { x: 1510, y: 790, w: 500, h: 460, kind: 'park', roof: 'grass', solid: false },
      { x: 2030, y: 790, w: 330, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 2030, y: 1040, w: 330, h: 210, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
      ...furnitureMix(110, 586, 11, 96, ['lamp','booth']),
      ...furnitureMix(1310, 586, 11, 96, ['lamp','lamp','booth']),
      ...furnitureRow('lamp', 150, 742, 9, 116),
      ...treeRow(80, 566, 15, 72), ...treeRow(1300, 566, 15, 72),
      ...treeRow(80, 752, 15, 72), ...treeRow(1300, 752, 15, 72),
      ...grove(1550, 840, 5, 4, 84),
      { type: 'car', x: 140, y: 618, dir: 'h' }, { type: 'car', x: 420, y: 618, dir: 'h' },
      { type: 'car', x: 700, y: 618, dir: 'h' }, { type: 'car', x: 1400, y: 618, dir: 'h' },
      { type: 'car', x: 1680, y: 618, dir: 'h' }, { type: 'car', x: 1960, y: 618, dir: 'h' },
      { type: 'car', x: 260, y: 678, dir: 'h' }, { type: 'car', x: 820, y: 678, dir: 'h' },
      { type: 'car', x: 1520, y: 678, dir: 'h' }, { type: 'car', x: 2080, y: 678, dir: 'h' },
      { type: 'car', x: 1148, y: 300, dir: 'v' }, { type: 'car', x: 1180, y: 1000, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 440, y: 440 },
      { id: 'BODEGA', x: 1760, y: 1000 },
      { id: 'SHOP_DEAL', x: 900, y: 590 },
      { id: 'CHESS_PARK', x: 1234, y: 400 },
      { id: 'LOCKED_DOOR', x: 2200, y: 726 }
    ]
  },

  // Long narrow rowhouse strips with alley communal space between them.
  BALTIMORE: {
    id: 'BALTIMORE', city: 'Baltimore', name: 'Baltimore Steps', palette: PAL_BALTIMORE,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      { x: 60, y: 80, w: 1020, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 230, w: 1020, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 380, w: 1020, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 80, w: 1070, h: 110, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 230, w: 500, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 1830, y: 230, w: 530, h: 110, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 380, w: 1070, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 790, w: 1020, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 940, w: 400, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 500, y: 940, w: 580, h: 110, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 1090, w: 1020, h: 110, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 790, w: 1070, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 940, w: 1070, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 1090, w: 620, h: 110, kind: 'building', roof: 'roofC', solid: true },
      { x: 1950, y: 1090, w: 410, h: 110, kind: 'park', roof: 'grass', solid: false }
    ],
    decor: [
      ...furnitureRow('dumpster', 520, 995, 3, 140),
      ...furnitureMix(140, 586, 7, 150, ['lamp','booth']),
      ...furnitureRow('lamp', 1360, 742, 7, 150),
      ...treeRow(100, 566, 8, 120), ...treeRow(1320, 566, 8, 130),
      ...treeRow(100, 752, 8, 120), ...treeRow(1320, 752, 8, 130),
      ...grove(1990, 1120, 4, 1, 96),
      { type: 'car', x: 200, y: 620, dir: 'h' }, { type: 'car', x: 620, y: 620, dir: 'h' },
      { type: 'car', x: 1500, y: 620, dir: 'h' }, { type: 'car', x: 1900, y: 620, dir: 'h' },
      { type: 'car', x: 400, y: 676, dir: 'h' }, { type: 'car', x: 1700, y: 676, dir: 'h' },
      { type: 'car', x: 1148, y: 400, dir: 'v' }, { type: 'car', x: 1180, y: 1000, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 700, y: 995 },
      { id: 'BODEGA', x: 2090, y: 285 },
      { id: 'SHOP_DEAL', x: 1110, y: 900 },
      { id: 'CHESS_PARK', x: 2150, y: 1145 },
      { id: 'LOCKED_DOOR', x: 300, y: 590 }
    ]
  },

  // Low-rise with a dominant park NW and heavy canopy everywhere.
  ATLANTA: {
    id: 'ATLANTA', city: 'Atlanta', name: 'Atlanta Porch', palette: PAL_ATLANTA,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      { x: 60, y: 90, w: 520, h: 470, kind: 'park', roof: 'grass', solid: false },
      { x: 620, y: 90, w: 460, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 620, y: 340, w: 460, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 90, w: 250, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 1570, y: 90, w: 250, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1850, y: 90, w: 510, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 340, w: 530, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1850, y: 340, w: 510, h: 220, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 790, w: 280, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 370, y: 790, w: 280, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 680, y: 790, w: 400, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 60, y: 1040, w: 1020, h: 210, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 790, w: 300, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1620, y: 790, w: 300, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 1950, y: 790, w: 410, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 1040, w: 620, h: 210, kind: 'park', roof: 'grass', solid: false },
      { x: 1940, y: 1040, w: 420, h: 210, kind: 'building', roof: 'roofB', solid: true }
    ],
    decor: [
      ...furnitureRow('lamp', 200, 586, 5, 220),
      ...furnitureRow('lamp', 1400, 742, 5, 220),
      ...furnitureRow('dumpster', 1900, 450, 2, 200),
      ...treeRow(80, 566, 15, 72), ...treeRow(1300, 566, 15, 72),
      ...treeRow(80, 752, 15, 72), ...treeRow(1300, 752, 15, 72),
      ...grove(100, 130, 6, 5, 88), ...grove(1330, 1080, 6, 2, 96),
      { type: 'car', x: 260, y: 620, dir: 'h' }, { type: 'car', x: 760, y: 620, dir: 'h' },
      { type: 'car', x: 1560, y: 620, dir: 'h' }, { type: 'car', x: 520, y: 676, dir: 'h' },
      { type: 'car', x: 1900, y: 676, dir: 'h' }, { type: 'car', x: 1148, y: 500, dir: 'v' },
      { type: 'car', x: 1180, y: 880, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 300, y: 320 },
      { id: 'BODEGA', x: 2100, y: 450 },
      { id: 'SHOP_DEAL', x: 1600, y: 1140 },
      { id: 'CHESS_PARK', x: 420, y: 200 },
      { id: 'LOCKED_DOOR', x: 1110, y: 1100 }
    ]
  },

  // Long low industrial sheds and container rows, mural walls, medium density.
  OAKLAND: {
    id: 'OAKLAND', city: 'Oakland', name: 'Oakland Corner', palette: PAL_OAKLAND,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      { x: 60, y: 90, w: 1020, h: 140, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 270, w: 420, h: 290, kind: 'building', roof: 'roofB', solid: true },
      { x: 520, y: 270, w: 560, h: 290, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 90, w: 1070, h: 140, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 270, w: 340, h: 290, kind: 'building', roof: 'roofA', solid: true },
      { x: 1670, y: 270, w: 340, h: 290, kind: 'building', roof: 'roofB', solid: true },
      { x: 2050, y: 270, w: 310, h: 290, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 790, w: 420, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 520, y: 790, w: 560, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 1020, w: 1020, h: 230, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 790, w: 1070, h: 150, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 970, w: 500, h: 280, kind: 'park', roof: 'grass', solid: false },
      { x: 1830, y: 970, w: 530, h: 280, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
      ...furnitureRow('dumpster', 560, 420, 4, 130),
      ...furnitureMix(130, 586, 9, 116, ['lamp','dumpster']),
      ...furnitureRow('lamp', 1350, 742, 8, 128),
      ...treeRow(110, 566, 10, 100), ...treeRow(1330, 566, 10, 112),
      ...treeRow(110, 752, 9, 112), ...treeRow(1330, 752, 9, 118),
      ...grove(1330, 1010, 5, 3, 92),
      { type: 'car', x: 220, y: 620, dir: 'h' }, { type: 'car', x: 660, y: 620, dir: 'h' },
      { type: 'car', x: 1460, y: 620, dir: 'h' }, { type: 'car', x: 1980, y: 620, dir: 'h' },
      { type: 'car', x: 440, y: 676, dir: 'h' }, { type: 'car', x: 1740, y: 676, dir: 'h' },
      { type: 'car', x: 1148, y: 340, dir: 'v' }, { type: 'car', x: 1180, y: 1140, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 730, y: 420 },
      { id: 'BODEGA', x: 2200, y: 420 },
      { id: 'SHOP_DEAL', x: 1500, y: 1100 },
      { id: 'CHESS_PARK', x: 1110, y: 500 },
      { id: 'LOCKED_DOOR', x: 500, y: 726 }
    ]
  },

  // Courtyard blocks — buildings wrapped around interior wells. Dense canopy.
  NOLA: {
    id: 'NOLA', city: 'NOLA', name: 'NOLA Balcony', palette: PAL_NOLA,
    roads: SK.roads, sidewalks: SK.sidewalks,
    parcels: [
      // Courtyard openings are 30px, not the 10px they were. A 10px slot is
      // narrower than the 16x10 player box in one axis and exactly equal in the
      // other, so the courtyard — and the POI standing in it — could not be walked
      // into at all. The alley fill turns these gaps into real service lanes.
      { x: 60, y: 90, w: 1020, h: 90, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 210, w: 120, h: 230, kind: 'building', roof: 'roofA', solid: true },
      { x: 810, y: 210, w: 270, h: 230, kind: 'building', roof: 'roofA', solid: true },
      { x: 210, y: 210, w: 570, h: 230, kind: 'park', roof: 'grass', solid: false },
      { x: 60, y: 470, w: 1020, h: 90, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 90, w: 1070, h: 90, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 210, w: 150, h: 230, kind: 'building', roof: 'roofB', solid: true },
      { x: 2200, y: 210, w: 160, h: 230, kind: 'building', roof: 'roofB', solid: true },
      { x: 1470, y: 210, w: 700, h: 230, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 470, w: 1070, h: 90, kind: 'building', roof: 'roofC', solid: true },
      { x: 60, y: 790, w: 1020, h: 90, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 910, w: 120, h: 230, kind: 'building', roof: 'roofC', solid: true },
      { x: 810, y: 910, w: 270, h: 230, kind: 'building', roof: 'roofC', solid: true },
      { x: 210, y: 910, w: 570, h: 230, kind: 'park', roof: 'grass', solid: false },
      { x: 60, y: 1170, w: 1020, h: 80, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 790, w: 1070, h: 90, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 910, w: 510, h: 340, kind: 'building', roof: 'roofA', solid: true },
      { x: 1830, y: 910, w: 530, h: 340, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
      ...furnitureRow('lamp', 130, 586, 8, 130),
      ...furnitureRow('lamp', 1340, 586, 8, 130),
      ...furnitureMix(180, 742, 6, 160, ['booth','lamp']),
      ...treeRow(80, 566, 15, 72), ...treeRow(1300, 566, 15, 72),
      ...treeRow(80, 752, 15, 72), ...treeRow(1300, 752, 15, 72),
      ...grove(240, 230, 6, 3, 92), ...grove(250, 930, 6, 3, 88),
      { type: 'car', x: 180, y: 620, dir: 'h' }, { type: 'car', x: 600, y: 620, dir: 'h' },
      { type: 'car', x: 1440, y: 620, dir: 'h' }, { type: 'car', x: 1880, y: 620, dir: 'h' },
      { type: 'car', x: 380, y: 676, dir: 'h' }, { type: 'car', x: 1660, y: 676, dir: 'h' },
      { type: 'car', x: 1148, y: 260, dir: 'v' }, { type: 'car', x: 1180, y: 1040, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 500, y: 320 },
      { id: 'BODEGA', x: 1800, y: 320 },
      { id: 'SHOP_DEAL', x: 500, y: 1020 },
      { id: 'CHESS_PARK', x: 1110, y: 640 },
      { id: 'LOCKED_DOOR', x: 1234, y: 1000 }
    ]
  }
};

// Every district is laid out through the same pass, so none can drift back to
// hand-placed margins. Runs once at module load: the result is static data.
Object.keys(DISTRICTS).forEach(key => fitToQuadrants(DISTRICTS[key]));

const CITY_TO_DISTRICT = {
  'Harlem': 'HARLEM',
  'Detroit': 'DETROIT',
  'Chicago': 'CHICAGO',
  'Miami': 'MIAMI',
  'Baltimore': 'BALTIMORE',
  'Atlanta': 'ATLANTA',
  'Oakland': 'OAKLAND',
  'NOLA': 'NOLA'
};

function districtKeys() {
  return ['HARLEM', 'DETROIT', 'CHICAGO', 'MIAMI', 'BALTIMORE', 'ATLANTA', 'OAKLAND', 'NOLA'];
}

function getDistrict(key) {
  return DISTRICTS[key] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DISTRICTS, WORLD, VIEWPORT, POI_IDS, getDistrict, districtKeys, CITY_TO_DISTRICT,
    QUADRANTS, quadrantOf, MIN_ALLEY, PAVE_AVENUE, PAVE_STREET,
    AVENUE_Y, AVENUE_H, STREET_X, STREET_W
  };
}
if (typeof window !== 'undefined') {
  window.TOPDOWN_DISTRICTS = DISTRICTS;
  window.TOPDOWN_WORLD = WORLD;
  window.TOPDOWN_VIEWPORT = VIEWPORT;
  window.TOPDOWN_POI_IDS = POI_IDS;
  window.getTopDownDistrict = getDistrict;
  window.topDownDistrictKeys = districtKeys;
  window.CITY_TO_DISTRICT = CITY_TO_DISTRICT;
}
