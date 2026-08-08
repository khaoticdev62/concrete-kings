/**
 * Concrete Kings: The Block Chronicles
 * Top-down district layouts. Pure data — no canvas, no DOM.
 *
 * Colours are restricted to the 64-entry master palette
 * (assets/palettes/concrete_kings_64.json) so the eight districts read as
 * one world. Per-city intent follows the profiles in CITY_ART_PROMPTS.md.
 */

const WORLD = { width: 2400, height: 1300 };
const VIEWPORT = { width: 960, height: 520 };

const POI_IDS = ['BARBER_SHOP', 'BODEGA', 'SHOP_DEAL', 'CHESS_PARK', 'LOCKED_DOOR'];

const SHADOW = 'rgba(0,0,0,0.45)';

/**
 * Every colour below is a verbatim entry from concrete_kings_64.json.
 *
 * Two constraints shape these, and a validation test enforces both:
 *  1. Large fills (ground, asphalt, roofA/B/C) stay dark — relative luminance
 *     under 120 — per the prompt pack's "dark dominant" rule. Bright hues are
 *     confined to `lane`, `zebra` and `accent`, which are thin marks and
 *     highlights, never area fills.
 *  2. The master palette contains no true greens. Foliage therefore uses the
 *     dark teal-green ramp hiding in cool_tones (#0D2926 / #174540 / #246961),
 *     which reads correctly as noir vegetation. Do not invent greens.
 */

// Harlem — brick, sodium amber, fire escapes, stoop culture
const PAL_HARLEM = {
  ground:'#101116', asphalt:'#22252E', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#474D5E', walkHi:'#565E70', roofA:'#7A1D1C', roofADk:'#4D1414',
  roofB:'#6B341D', roofBDk:'#3B1C11', roofC:'#393E4D', roofCDk:'#2D313D',
  face:'#181920', accent:'#FFCD68', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Detroit — post-industrial, corrugated metal, half-empty lots
const PAL_DETROIT = {
  ground:'#08080A', asphalt:'#181920', lane:'#9C5C1D', zebra:'#A0AAC2',
  walk:'#393E4D', walkHi:'#474D5E', roofA:'#AA2724', roofADk:'#7A1D1C',
  roofB:'#565E70', roofBDk:'#393E4D', roofC:'#3B1C11', roofCDk:'#26120B',
  face:'#101116', accent:'#F0AB43', tree:'#174540', treeDk:'#0D2926',
  grass:'#174540', shadow:SHADOW
};

// Chicago — limestone, cold lake light, el-track steel.
// Cyan is an accent only; roofs are lake blue, steel and dark brick.
const PAL_CHICAGO = {
  ground:'#0A1526', asphalt:'#22252E', lane:'#C9822B', zebra:'#E2E8F7',
  walk:'#474D5E', walkHi:'#666E82', roofA:'#1C375C', roofADk:'#11233F',
  roofB:'#565E70', roofBDk:'#393E4D', roofC:'#4D1414', roofCDk:'#2B0D0D',
  face:'#11233F', accent:'#6FE8D8', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Miami — muted stucco and terrazzo. The Art Deco neon lives in `accent`
// only: signage, car bodies, the active POI outline. Hot pink and cyan roof
// fills would break the pack's "dark dominant, neon sparingly" rule outright.
const PAL_MIAMI = {
  ground:'#11233F', asphalt:'#2D313D', lane:'#B6C0D8', zebra:'#E2E8F7',
  walk:'#666E82', walkHi:'#8B95AB', roofA:'#7A1D1C', roofADk:'#4D1414',
  roofB:'#1C375C', roofBDk:'#11233F', roofC:'#6B341D', roofCDk:'#3B1C11',
  face:'#0A1526', accent:'#6FE8D8', tree:'#174540', treeDk:'#0D2926',
  grass:'#174540', shadow:SHADOW
};

// Baltimore — formstone, marble steps, harbour blue
const PAL_BALTIMORE = {
  ground:'#0A1526', asphalt:'#22252E', lane:'#C9822B', zebra:'#E2E8F7',
  walk:'#666E82', walkHi:'#8B95AB', roofA:'#6B341D', roofADk:'#3B1C11',
  roofB:'#274F80', roofBDk:'#1C375C', roofC:'#565E70', roofCDk:'#393E4D',
  face:'#181920', accent:'#F0AB43', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Atlanta — red clay, porch wood, humid canopy
const PAL_ATLANTA = {
  ground:'#140A07', asphalt:'#26120B', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#522717', walkHi:'#6B341D', roofA:'#AA2724', roofADk:'#7A1D1C',
  roofB:'#854224', roofBDk:'#522717', roofC:'#393E4D', roofCDk:'#2D313D',
  face:'#140A07', accent:'#FFCD68', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Oakland — bay fog grey, mural colour, shipping steel
const PAL_OAKLAND = {
  ground:'#101116', asphalt:'#2D313D', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#565E70', walkHi:'#788196', roofA:'#174540', roofADk:'#0D2926',
  roofB:'#274F80', roofBDk:'#1C375C', roofC:'#AA2724', roofCDk:'#7A1D1C',
  face:'#181920', accent:'#F0AB43', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// NOLA — cast iron, gas lamp, cypress and slate
const PAL_NOLA = {
  ground:'#140A07', asphalt:'#22252E', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#6B341D', walkHi:'#854224', roofA:'#174540', roofADk:'#0D2926',
  roofB:'#7A1D1C', roofBDk:'#4D1414', roofC:'#6E3E14', roofCDk:'#2B0D0D',
  face:'#26120B', accent:'#FFCD68', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

/**
 * Every district shares this street skeleton: one horizontal avenue and one
 * vertical street. Districts differ by parcels, decoration and POI placement,
 * which is what makes them read as different places.
 *
 * The skeleton leaves four buildable quadrants:
 *   NW x 40..1080  y 60..560     NE x 1280..2360 y 60..560
 *   SW x 40..1080  y 770..1260   SE x 1280..2360 y 770..1260
 *
 * The sidewalk lanes at y=590 / y=726 and x=1110 / x=1234 are always clear of
 * parcels, so they are the safe places to anchor POIs.
 */
const AVENUE_Y = 600;
const AVENUE_H = 116;
const STREET_X = 1120;
const STREET_W = 104;

function streetSkeleton() {
  return {
    roads: [
      { x: 0, y: AVENUE_Y, w: WORLD.width, h: AVENUE_H, dir: 'h' },
      { x: STREET_X, y: 0, w: STREET_W, h: WORLD.height, dir: 'v' }
    ],
    sidewalks: [
      { x: 0, y: AVENUE_Y - 20, w: WORLD.width, h: 20 },
      { x: 0, y: AVENUE_Y + AVENUE_H, w: WORLD.width, h: 20 },
      { x: STREET_X - 20, y: 0, w: 20, h: WORLD.height },
      { x: STREET_X + STREET_W, y: 0, w: 20, h: WORLD.height }
    ]
  };
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
      { x: 690, y: 90, w: 250, h: 190, kind: 'building', roof: 'roofC', solid: true },
      { x: 690, y: 300, w: 250, h: 190, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 90, w: 420, h: 270, kind: 'court', roof: 'roofA', solid: false },
      { x: 1740, y: 90, w: 220, h: 270, kind: 'building', roof: 'roofB', solid: true },
      { x: 1990, y: 90, w: 350, h: 180, kind: 'building', roof: 'roofC', solid: true },
      { x: 1990, y: 300, w: 350, h: 190, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 390, w: 670, h: 100, kind: 'building', roof: 'roofC', solid: true },
      { x: 60, y: 810, w: 260, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 340, y: 810, w: 210, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 570, y: 810, w: 170, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 760, y: 810, w: 180, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 1040, w: 430, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 510, y: 1040, w: 220, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 750, y: 1040, w: 190, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 810, w: 390, h: 300, kind: 'park', roof: 'grass', solid: false },
      { x: 1700, y: 810, w: 260, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1980, y: 810, w: 360, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 1700, y: 1040, w: 260, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 1980, y: 1040, w: 360, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 1140, w: 390, h: 100, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
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
      { x: 60, y: 320, w: 880, h: 240, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 400, y: 90, w: 180, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 620, y: 90, w: 320, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 90, w: 240, h: 470, kind: 'building', roof: 'roofB', solid: true },
      { x: 1570, y: 90, w: 790, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1570, y: 330, w: 380, h: 230, kind: 'building', roof: 'roofA', solid: true },
      { x: 1990, y: 330, w: 370, h: 230, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 800, w: 880, h: 220, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 1060, w: 400, h: 190, kind: 'building', roof: 'roofC', solid: true },
      { x: 500, y: 1060, w: 440, h: 190, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 800, w: 480, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1810, y: 800, w: 550, h: 200, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 1040, w: 1070, h: 210, kind: 'building', roof: 'roofB', solid: true }
    ],
    decor: [
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
      { x: 790, y: 60, w: 150, h: 300, kind: 'building', roof: 'roofA', solid: true },
      { x: 790, y: 390, w: 150, h: 170, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 60, w: 200, h: 500, kind: 'building', roof: 'roofB', solid: true },
      { x: 1520, y: 60, w: 200, h: 500, kind: 'building', roof: 'roofA', solid: true },
      { x: 1750, y: 60, w: 300, h: 240, kind: 'building', roof: 'roofC', solid: true },
      { x: 1750, y: 330, w: 300, h: 230, kind: 'building', roof: 'roofB', solid: true },
      { x: 2080, y: 60, w: 280, h: 500, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 780, w: 200, h: 470, kind: 'building', roof: 'roofB', solid: true },
      { x: 290, y: 780, w: 320, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 290, y: 1030, w: 320, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 640, y: 780, w: 300, h: 470, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 780, w: 260, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 1580, y: 780, w: 300, h: 220, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1910, y: 780, w: 450, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 1030, w: 1070, h: 220, kind: 'building', roof: 'roofB', solid: true }
    ],
    decor: [
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
      { x: 700, y: 90, w: 240, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 320, w: 160, h: 240, kind: 'building', roof: 'roofC', solid: true },
      { x: 240, y: 320, w: 400, h: 240, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 660, y: 320, w: 280, h: 240, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 1460, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 1630, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1800, y: 90, w: 150, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 1970, y: 90, w: 390, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 320, w: 1070, h: 240, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 790, w: 170, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 250, y: 790, w: 170, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 440, y: 790, w: 170, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 630, y: 790, w: 310, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 1040, w: 880, h: 210, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 790, w: 200, h: 460, kind: 'building', roof: 'roofA', solid: true },
      { x: 1510, y: 790, w: 500, h: 460, kind: 'park', roof: 'grass', solid: false },
      { x: 2030, y: 790, w: 330, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 2030, y: 1040, w: 330, h: 210, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
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
      { x: 60, y: 80, w: 880, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 230, w: 880, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 380, w: 880, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 80, w: 1070, h: 110, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 230, w: 500, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 1830, y: 230, w: 530, h: 110, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 380, w: 1070, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 790, w: 880, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 940, w: 400, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 500, y: 940, w: 440, h: 110, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 1090, w: 880, h: 110, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 790, w: 1070, h: 110, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 940, w: 1070, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 1090, w: 620, h: 110, kind: 'building', roof: 'roofC', solid: true },
      { x: 1950, y: 1090, w: 410, h: 110, kind: 'park', roof: 'grass', solid: false }
    ],
    decor: [
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
      { x: 620, y: 90, w: 320, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 620, y: 340, w: 320, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 90, w: 250, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 1570, y: 90, w: 250, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1850, y: 90, w: 510, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 340, w: 530, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1850, y: 340, w: 510, h: 220, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 790, w: 280, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 370, y: 790, w: 280, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 680, y: 790, w: 260, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 60, y: 1040, w: 880, h: 210, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 790, w: 300, h: 220, kind: 'building', roof: 'roofB', solid: true },
      { x: 1620, y: 790, w: 300, h: 220, kind: 'building', roof: 'roofA', solid: true },
      { x: 1950, y: 790, w: 410, h: 220, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 1040, w: 620, h: 210, kind: 'park', roof: 'grass', solid: false },
      { x: 1940, y: 1040, w: 420, h: 210, kind: 'building', roof: 'roofB', solid: true }
    ],
    decor: [
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
      { x: 60, y: 90, w: 880, h: 140, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 270, w: 420, h: 290, kind: 'building', roof: 'roofB', solid: true },
      { x: 520, y: 270, w: 420, h: 290, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 90, w: 1070, h: 140, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 270, w: 340, h: 290, kind: 'building', roof: 'roofA', solid: true },
      { x: 1670, y: 270, w: 340, h: 290, kind: 'building', roof: 'roofB', solid: true },
      { x: 2050, y: 270, w: 310, h: 290, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 60, y: 790, w: 420, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 520, y: 790, w: 420, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 1020, w: 880, h: 230, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 790, w: 1070, h: 150, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 970, w: 500, h: 280, kind: 'park', roof: 'grass', solid: false },
      { x: 1830, y: 970, w: 530, h: 280, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
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
      { x: 60, y: 90, w: 880, h: 100, kind: 'building', roof: 'roofB', solid: true },
      { x: 60, y: 200, w: 140, h: 250, kind: 'building', roof: 'roofA', solid: true },
      { x: 800, y: 200, w: 140, h: 250, kind: 'building', roof: 'roofA', solid: true },
      { x: 210, y: 200, w: 580, h: 250, kind: 'park', roof: 'grass', solid: false },
      { x: 60, y: 460, w: 880, h: 100, kind: 'building', roof: 'roofC', solid: true },
      { x: 1290, y: 90, w: 1070, h: 100, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 200, w: 160, h: 250, kind: 'building', roof: 'roofB', solid: true },
      { x: 2200, y: 200, w: 160, h: 250, kind: 'building', roof: 'roofB', solid: true },
      { x: 1460, y: 200, w: 730, h: 250, kind: 'lot', roof: 'asphalt', solid: false },
      { x: 1290, y: 460, w: 1070, h: 100, kind: 'building', roof: 'roofC', solid: true },
      { x: 60, y: 790, w: 880, h: 100, kind: 'building', roof: 'roofA', solid: true },
      { x: 60, y: 900, w: 150, h: 240, kind: 'building', roof: 'roofC', solid: true },
      { x: 790, y: 900, w: 150, h: 240, kind: 'building', roof: 'roofC', solid: true },
      { x: 220, y: 900, w: 560, h: 240, kind: 'park', roof: 'grass', solid: false },
      { x: 60, y: 1150, w: 880, h: 100, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 790, w: 1070, h: 110, kind: 'building', roof: 'roofB', solid: true },
      { x: 1290, y: 910, w: 520, h: 340, kind: 'building', roof: 'roofA', solid: true },
      { x: 1830, y: 910, w: 530, h: 340, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
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
  module.exports = { DISTRICTS, WORLD, VIEWPORT, POI_IDS, getDistrict, districtKeys, CITY_TO_DISTRICT };
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
