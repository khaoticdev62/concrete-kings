const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DISTRICTS, districtKeys, WORLD, QUADRANTS, quadrantOf, MIN_ALLEY,
  PAVE_AVENUE, PAVE_STREET, AVENUE_Y, AVENUE_H, STREET_X, STREET_W
} = require('../src/pixel_engine/topdown-city-data.js');
const { TopDownCityController, PLAYER_BOX, POI_RADIUS } =
  require('../src/pixel_engine/topdown-city-controller.js');

/**
 * Level design invariants.
 *
 * Districts used to hand-place parcels inside each block with ad-hoc margins — 60px
 * on the left, 90px at the top, whatever fell out at the bottom — and every one of
 * those margins rendered as bare `ground`: a featureless black band running the
 * width of the map with the street trees standing in it. These tests hold the map to
 * the layout that replaced it: pavements deep enough to hold the furniture, blocks
 * fitted to exact bounds, and every leftover gap declared as an alley you can walk
 * down.
 */

const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

test('Layout: pavements are deep enough to hold the furniture standing on them', () => {
  // The tree lines live at y=566 and y=752 and the POI anchors at x=1110 and x=1234.
  // With 20px pavements those all sat in bare ground behind the kerb, which is the
  // defect this whole layout pass exists to fix — so assert the containment rather
  // than just the depth number.
  const bands = DISTRICTS.HARLEM.sidewalks;
  const holds = (x, y) => bands.some(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);

  assert.ok(holds(400, 566), 'the north tree line must stand on pavement');
  assert.ok(holds(400, 586), 'the north lamp line must stand on pavement');
  assert.ok(holds(400, 742), 'the south lamp line must stand on pavement');
  assert.ok(holds(400, 752), 'the south tree line must stand on pavement');
  assert.ok(holds(1110, 300), 'the west street POI anchor must be on pavement');
  assert.ok(holds(1234, 300), 'the east street POI anchor must be on pavement');
  assert.ok(PAVE_AVENUE >= 44 && PAVE_STREET >= 40, 'pavements must stay walkably deep');
});

test('Layout: no parcel overlaps another, in any district', () => {
  districtKeys().forEach(key => {
    const ps = DISTRICTS[key].parcels;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        assert.equal(overlap(ps[i], ps[j]), 0,
          `${key}: ${ps[i].kind}@${ps[i].x},${ps[i].y} overlaps ` +
          `${ps[j].kind}@${ps[j].x},${ps[j].y}`);
      }
    }
  });
});

test('Layout: no parcel encroaches on the roads or the pavement', () => {
  const road = { x: 0, y: AVENUE_Y, w: WORLD.width, h: AVENUE_H };
  const street = { x: STREET_X, y: 0, w: STREET_W, h: WORLD.height };
  districtKeys().forEach(key => {
    DISTRICTS[key].parcels.forEach(p => {
      assert.equal(overlap(p, road), 0, `${key}: ${p.kind}@${p.x},${p.y} sits in the avenue`);
      assert.equal(overlap(p, street), 0, `${key}: ${p.kind}@${p.x},${p.y} sits in the street`);
      DISTRICTS[key].sidewalks.forEach(s => {
        assert.equal(overlap(p, s), 0, `${key}: ${p.kind}@${p.x},${p.y} sits on the pavement`);
      });
    });
  });
});

test('Layout: every block is filled edge to edge — not one pixel of bare ground', () => {
  // The headline invariant. Measured exactly, at 1px, because the whole failure mode
  // was slivers and margins that a coarse check waves through.
  districtKeys().forEach(key => {
    const parcels = DISTRICTS[key].parcels;
    QUADRANTS.forEach(q => {
      const cover = new Uint8Array(q.w * q.h);
      parcels.forEach(p => {
        for (let y = Math.max(0, p.y - q.y); y < Math.min(q.h, p.y + p.h - q.y); y++) {
          for (let x = Math.max(0, p.x - q.x); x < Math.min(q.w, p.x + p.w - q.x); x++) {
            cover[y * q.w + x] = 1;
          }
        }
      });
      let bare = 0;
      for (let i = 0; i < cover.length; i++) if (!cover[i]) bare++;
      assert.equal(bare, 0, `${key} block ${q.id}: ${bare}px of bare ground left over`);
    });
  });
});

test('Layout: every alley is wide enough for the player to walk down', () => {
  // PLAYER_BOX is 16x10 and movement is axis-separated, so an alley narrower than
  // the box in both axes is scenery pretending to be a route. NOLA's courtyards were
  // reached through 10px slots and could not be entered at all.
  districtKeys().forEach(key => {
    DISTRICTS[key].parcels.filter(p => p.kind === 'alley').forEach(a => {
      const passable = a.w > PLAYER_BOX.w || a.h > PLAYER_BOX.h;
      assert.ok(passable,
        `${key}: alley ${a.w}x${a.h}@${a.x},${a.y} is impassable to a ` +
        `${PLAYER_BOX.w}x${PLAYER_BOX.h} player`);
      assert.ok(Math.max(a.w, a.h) >= MIN_ALLEY,
        `${key}: alley ${a.w}x${a.h}@${a.x},${a.y} is below the ${MIN_ALLEY}px minimum`);
    });
  });
});

test('Layout: every alley stays inside its own block', () => {
  districtKeys().forEach(key => {
    DISTRICTS[key].parcels.filter(p => p.kind === 'alley').forEach(a => {
      const q = quadrantOf(a.x + a.w / 2, a.y + a.h / 2);
      assert.ok(a.x >= q.x && a.y >= q.y && a.x + a.w <= q.x + q.w && a.y + a.h <= q.y + q.h,
        `${key}: alley ${a.w}x${a.h}@${a.x},${a.y} escapes block ${q.id}`);
    });
  });
});

test('Layout: every open parcel has frontage — a lot you cannot drive into is scenery', () => {
  // A lot, park or court must share a real edge with something walkable: a road, a
  // pavement, an alley, or the world boundary. This is what "proper lot placement"
  // means mechanically — otherwise it is a decorative rectangle walled in by
  // buildings.
  const MIN_FRONTAGE = 20;
  districtKeys().forEach(key => {
    const d = DISTRICTS[key];
    const walkable = [
      ...d.roads, ...d.sidewalks,
      ...d.parcels.filter(p => p.kind === 'alley')
    ];
    d.parcels.filter(p => ['lot', 'park', 'court'].includes(p.kind)).forEach(p => {
      // Touching the world edge counts: the block continues off-map.
      const onEdge = p.x === 0 || p.y === 0
        || p.x + p.w === WORLD.width || p.y + p.h === WORLD.height;
      // Shared edge length with any walkable rect, testing a 1px-grown copy so
      // abutting rectangles register as touching rather than as zero overlap.
      const grown = { x: p.x - 1, y: p.y - 1, w: p.w + 2, h: p.h + 2 };
      const contact = walkable.reduce((best, wr) => {
        const ox = Math.max(0, Math.min(grown.x + grown.w, wr.x + wr.w) - Math.max(grown.x, wr.x));
        const oy = Math.max(0, Math.min(grown.y + grown.h, wr.y + wr.h) - Math.max(grown.y, wr.y));
        // A genuine shared edge is long in one axis and only the 1px growth in the
        // other; a corner touch is 1x1 and must not count.
        if (ox <= 2 && oy <= 2) return best;
        return Math.max(best, Math.max(ox, oy));
      }, 0);
      assert.ok(onEdge || contact >= MIN_FRONTAGE,
        `${key}: ${p.kind}@${p.x},${p.y} (${p.w}x${p.h}) has ${contact}px of frontage`);
    });
  });
});

/**
 * Walkability flood fill.
 *
 * The only honest way to prove the layout is playable. Rasterises the map at the
 * player's own collision box, floods from the spawn point, and reports which cells
 * can be stood in. Everything below that needs "can the player get there?" answered
 * uses this rather than reasoning about rectangles.
 */
function reachable(districtKey) {
  const STEP = 8;
  const c = new TopDownCityController({ districtKey, attachInput: false });
  const cols = Math.ceil(WORLD.width / STEP);
  const rows = Math.ceil(WORLD.height / STEP);
  const seen = new Uint8Array(cols * rows);

  const free = (cx, cy) => !c.collidesAt(cx * STEP + STEP / 2, cy * STEP + STEP / 2);
  const start = [Math.floor(c.x / STEP), Math.floor(c.y / STEP)];
  assert.ok(free(start[0], start[1]), `${districtKey}: the player spawns inside a wall`);

  const queue = [start];
  seen[start[1] * cols + start[0]] = 1;
  while (queue.length) {
    const [cx, cy] = queue.pop();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;
      const i = ny * cols + nx;
      if (seen[i] || !free(nx, ny)) return;
      seen[i] = 1;
      queue.push([nx, ny]);
    });
  }
  return {
    controller: c,
    canStand: (x, y) => {
      const i = Math.floor(y / STEP) * cols + Math.floor(x / STEP);
      return !!seen[i];
    },
    count: seen.reduce((s, v) => s + v, 0),
    cells: cols * rows
  };
}

test('Layout: every POI in every district can actually be walked up to', () => {
  // A POI activates within POI_RADIUS, so it is enough to reach somewhere near it —
  // but it must be genuinely connected to the street network, not sealed inside a
  // courtyard or behind a slot narrower than the player.
  districtKeys().forEach(key => {
    const map = reachable(key);
    DISTRICTS[key].pois.forEach(poi => {
      const near = [[0, 0], [POI_RADIUS - 12, 0], [-(POI_RADIUS - 12), 0],
        [0, POI_RADIUS - 12], [0, -(POI_RADIUS - 12)]];
      const ok = near.some(([dx, dy]) => {
        const x = poi.x + dx;
        const y = poi.y + dy;
        return x >= 0 && y >= 0 && x < WORLD.width && y < WORLD.height && map.canStand(x, y);
      });
      assert.ok(ok, `${key}: ${poi.id}@${poi.x},${poi.y} is unreachable from the spawn point`);
    });
  });
});

test('Layout: the walkable network is generous — alleys are open, not sealed off', () => {
  // Guards against the opposite failure to bare ground: filling every block solid
  // and leaving only the two roads. If this collapses towards the road area alone,
  // the alleys have stopped connecting.
  const roadArea = WORLD.width * (AVENUE_H + 2 * PAVE_AVENUE)
    + WORLD.height * (STREET_W + 2 * PAVE_STREET);
  districtKeys().forEach(key => {
    const map = reachable(key);
    const walkArea = (map.count / map.cells) * WORLD.width * WORLD.height;
    assert.ok(walkArea > roadArea * 1.1,
      `${key}: only ${Math.round(walkArea)}px walkable against ${Math.round(roadArea)}px of ` +
      `road — the alleys and open parcels are not connected`);
  });
});

test('Layout: street furniture and trees never stand on a roof', () => {
  // Decor is placed in absolute coordinates and the blocks moved underneath it, so
  // this is the check that the layout pass carried the interior decor with its block.
  districtKeys().forEach(key => {
    const d = DISTRICTS[key];
    const solid = d.parcels.filter(p => p.solid);
    d.decor.forEach(item => {
      const inside = solid.find(p => item.x >= p.x && item.x <= p.x + p.w
        && item.y >= p.y && item.y <= p.y + p.h);
      assert.ok(!inside,
        `${key}: ${item.type}@${item.x},${item.y} stands on the roof of ` +
        `${inside && inside.kind}@${inside && inside.x},${inside && inside.y}`);
    });
  });
});

test('Layout: blocks reach the world edge, so the city does not end in a void', () => {
  // Each block must touch all four of its own bounds. A short edge is exactly the
  // margin that used to render as bare ground.
  districtKeys().forEach(key => {
    const parcels = DISTRICTS[key].parcels;
    QUADRANTS.forEach(q => {
      const own = parcels.filter(p => quadrantOf(p.x + p.w / 2, p.y + p.h / 2) === q);
      assert.ok(own.length, `${key} block ${q.id} must be built on`);
      assert.equal(Math.min(...own.map(p => p.x)), q.x, `${key} ${q.id}: left edge`);
      assert.equal(Math.min(...own.map(p => p.y)), q.y, `${key} ${q.id}: top edge`);
      assert.equal(Math.max(...own.map(p => p.x + p.w)), q.x + q.w, `${key} ${q.id}: right edge`);
      assert.equal(Math.max(...own.map(p => p.y + p.h)), q.y + q.h, `${key} ${q.id}: bottom edge`);
    });
  });
});
