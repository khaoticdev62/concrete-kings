const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DISTRICTS, WORLD, VIEWPORT, POI_IDS,
  getDistrict, districtKeys, CITY_TO_DISTRICT
} = require('../src/pixel_engine/topdown-city-data.js');

const PALETTE_KEYS = ['ground','asphalt','lane','zebra','walk','walkHi',
  'roofA','roofADk','roofB','roofBDk','roofC','roofCDk','face','accent',
  'tree','treeDk','grass','shadow'];

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

test('District data: all eight districts exist and are keyed consistently', () => {
  assert.equal(districtKeys().length, 8);
  districtKeys().forEach(k => {
    assert.ok(DISTRICTS[k], `${k} must exist`);
    assert.equal(DISTRICTS[k].id, k, `${k}.id must match its key`);
  });
});

test('District data: every city in the heat table maps to a district', () => {
  ['Harlem','Detroit','Chicago','Miami','Baltimore','Atlanta','Oakland','NOLA'].forEach(city => {
    const key = CITY_TO_DISTRICT[city];
    assert.ok(key, `${city} must map to a district key`);
    assert.ok(DISTRICTS[key], `${city} maps to missing district ${key}`);
  });
});

test('District data: palettes are complete and use uppercase hex', () => {
  districtKeys().forEach(k => {
    const p = DISTRICTS[k].palette;
    PALETTE_KEYS.forEach(pk => {
      assert.ok(p[pk], `${k}.palette.${pk} missing`);
    });
    Object.entries(p).forEach(([pk, val]) => {
      if (pk === 'shadow') {
        assert.match(val, /^rgba\(/, `${k}.palette.shadow must be rgba`);
      } else {
        assert.match(val, /^#[0-9A-F]{6}$/, `${k}.palette.${pk} must be uppercase hex, got ${val}`);
      }
    });
  });
});

test('District data: every colour is a verbatim master-palette entry', () => {
  // The master palette is the shared gamut. Inventing colours is how eight
  // districts stop looking like one world.
  const fs = require('fs');
  const path = require('path');
  const master = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'palettes', 'concrete_kings.json'), 'utf8'));
  const allowed = new Set(Object.values(master.groups).flat().map(c => c.toUpperCase()));

  districtKeys().forEach(k => {
    Object.entries(DISTRICTS[k].palette).forEach(([pk, val]) => {
      if (pk === 'shadow') return;
      assert.ok(allowed.has(val.toUpperCase()),
        `${k}.palette.${pk} = ${val} is not in concrete_kings.json`);
    });
  });
});

test('District data: large fills stay dark, per the noir discipline rule', () => {
  // Prompt pack: dark dominant, neon accents sparingly. Bright hues belong in
  // lane/zebra/accent (thin marks), never in area fills like roofs or ground.
  const luminance = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const AREA_FILLS = ['ground', 'asphalt', 'roofA', 'roofB', 'roofC'];

  districtKeys().forEach(k => {
    AREA_FILLS.forEach(pk => {
      const val = DISTRICTS[k].palette[pk];
      assert.ok(luminance(val) < 120,
        `${k}.palette.${pk} = ${val} is too bright (${Math.round(luminance(val))}) for a large fill`);
    });
  });
});

test('District data: every district has roads, sidewalks, and at least one solid parcel', () => {
  districtKeys().forEach(k => {
    const d = DISTRICTS[k];
    assert.ok(d.roads.length >= 2, `${k} needs at least 2 road bands`);
    assert.ok(d.sidewalks.length >= 1, `${k} needs sidewalks`);
    assert.ok(d.parcels.some(p => p.solid), `${k} needs at least one solid parcel`);
    d.roads.forEach(r => assert.ok(r.dir === 'h' || r.dir === 'v', `${k} road dir must be h or v`));
  });
});

test('District data: nothing extends outside world bounds', () => {
  districtKeys().forEach(k => {
    const d = DISTRICTS[k];
    [...d.roads, ...d.sidewalks, ...d.parcels].forEach(r => {
      assert.ok(r.x >= 0 && r.y >= 0, `${k}: rect starts off-world at ${r.x},${r.y}`);
      assert.ok(r.x + r.w <= WORLD.width, `${k}: rect exceeds world width`);
      assert.ok(r.y + r.h <= WORLD.height, `${k}: rect exceeds world height`);
    });
    d.pois.forEach(p => {
      assert.ok(p.x >= 0 && p.x <= WORLD.width, `${k}: POI ${p.id} off-world x`);
      assert.ok(p.y >= 0 && p.y <= WORLD.height, `${k}: POI ${p.id} off-world y`);
    });
  });
});

test('District data: every district has exactly the five canonical POIs', () => {
  districtKeys().forEach(k => {
    const ids = DISTRICTS[k].pois.map(p => p.id);
    assert.equal(ids.length, 5, `${k} must have exactly 5 POIs`);
    assert.deepEqual([...ids].sort(), [...POI_IDS].sort(), `${k} POI ids must match the canonical set`);
  });
});

test('District data: no POI is stranded inside a solid parcel', () => {
  districtKeys().forEach(k => {
    const d = DISTRICTS[k];
    d.pois.forEach(poi => {
      const box = { x: poi.x - 8, y: poi.y - 5, w: 16, h: 10 };
      d.parcels.filter(p => p.solid).forEach(p => {
        assert.equal(rectsOverlap(box, p), false,
          `${k}: POI ${poi.id} at ${poi.x},${poi.y} is inside a solid parcel — unreachable`);
      });
    });
  });
});

test('District data: districts are structurally distinct, not copies', () => {
  // Eight districts with identical parcel layouts would defeat the whole point.
  const signatures = districtKeys().map(k => JSON.stringify(DISTRICTS[k].parcels));
  const unique = new Set(signatures);
  assert.equal(unique.size, 8, 'each district must have its own parcel layout');

  const poiSignatures = new Set(districtKeys().map(k => JSON.stringify(DISTRICTS[k].pois)));
  assert.equal(poiSignatures.size, 8, 'each district must place its POIs differently');
});

test('District data: decor types are all ones the renderer knows how to draw', () => {
  // A typo'd type silently draws nothing, because the renderer filters by type.
  const DRAWABLE = new Set(['tree', 'car', 'lamp', 'booth', 'dumpster']);
  districtKeys().forEach(k => {
    const unknown = [...new Set(DISTRICTS[k].decor.map(d => d.type))]
      .filter(t => !DRAWABLE.has(t));
    assert.deepEqual(unknown, [], `${k} has decor types the renderer ignores: ${unknown.join(', ')}`);
  });
});

test('District data: every district has street furniture, and the mix differs', () => {
  // Furniture density and mix is the main district-character lever, since all
  // eight districts share one street skeleton.
  const FURNITURE = new Set(['lamp', 'booth', 'dumpster']);
  const signatures = new Set();

  districtKeys().forEach(k => {
    const furn = DISTRICTS[k].decor.filter(d => FURNITURE.has(d.type));
    assert.ok(furn.length >= 5, `${k} needs street furniture, found ${furn.length}`);

    const counts = {};
    furn.forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1; });
    signatures.add(JSON.stringify(counts));
  });

  assert.ok(signatures.size >= 6,
    `districts should not share one furniture profile; only ${signatures.size} distinct of 8`);
});

test('District data: no decor sits inside a solid parcel', () => {
  // A lamp inside a building reads as a bug and cannot be walked past.
  districtKeys().forEach(k => {
    const d = DISTRICTS[k];
    const solids = d.parcels.filter(p => p.solid);
    d.decor.forEach(item => {
      solids.forEach(p => {
        const inside = item.x > p.x && item.x < p.x + p.w && item.y > p.y && item.y < p.y + p.h;
        assert.equal(inside, false,
          `${k}: ${item.type} at ${item.x},${item.y} is inside a solid parcel`);
      });
    });
  });
});

test('District data: world is 2.5x the viewport so the camera has somewhere to go', () => {
  assert.equal(WORLD.width, VIEWPORT.width * 2.5);
  assert.equal(WORLD.height, VIEWPORT.height * 2.5);
});

test('District data: getDistrict returns null for an unknown key', () => {
  assert.equal(getDistrict('ATLANTIS'), null);
  assert.equal(getDistrict('HARLEM').city, 'Harlem');
});
