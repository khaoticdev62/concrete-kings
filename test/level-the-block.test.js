const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

/**
 * Structural validation for THE BLOCK.
 *
 * Pure data checks against the shipped level definition — no browser, no engine.
 * They exist because the level's structural bugs were all invisible to every
 * other kind of testing: the suite was green, the map rendered, no console
 * error fired, and the Precinct still had zero roads leading to it.
 *
 * Each test below caught a real bug when it was first written. See
 * docs/LEVEL-DESIGN-THE-BLOCK.md section 16 for what each one found.
 */

const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'assets/generated/level-the-block.json');
const JS_PATH = path.join(ROOT, 'assets/generated/level-the-block.js');

const level = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

const locIds = new Set(level.locations.map(l => l.id));
const scnIds = new Set(level.scenarios.map(s => s.id));
const charIds = new Set(level.characters.map(c => c.id));
const districtIds = new Set(level.districts.map(d => d.id));
const factionIds = new Set(level.factions.map(f => f.id));
const TIME_BLOCKS = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'LATE_NIGHT'];

/** Undirected adjacency. `filter` narrows which routes count as usable. */
function adjacency(filter = () => true) {
  const adj = {};
  locIds.forEach(id => { adj[id] = new Set(); });
  level.routes.filter(filter).forEach(r => {
    if (adj[r.origin]) adj[r.origin].add(r.destination);
    if (adj[r.destination]) adj[r.destination].add(r.origin);
  });
  return adj;
}

function reachable(from, adj) {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    for (const next of adj[queue.shift()] || []) {
      if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return seen;
}

const isSecret = r => r.role === 'secret' || r.condition === 'SECRET';

// ---------------------------------------------------------------------------
// Generated artifact
// ---------------------------------------------------------------------------

test('level: the generated .js matches the .json it is built from', () => {
  // The JSON is the source; scripts/generate-level.js emits the JS. Before that
  // script existed the two were maintained by hand under a header saying
  // "AUTO-GENERATED ... do not edit by hand", which is how they drift.
  const js = fs.readFileSync(JS_PATH, 'utf8');
  const m = js.match(/window\.MAP_LEVEL\s*=\s*([\s\S]*);\s*$/);
  assert.ok(m, 'level-the-block.js must assign window.MAP_LEVEL');
  assert.equal(
    JSON.stringify(JSON.parse(m[1])),
    JSON.stringify(level),
    'level-the-block.js is stale — run: node scripts/generate-level.js'
  );
});

// ---------------------------------------------------------------------------
// Referential integrity
// ---------------------------------------------------------------------------

test('level: every reference names something that exists', () => {
  const bad = [];
  level.locations.forEach(l => {
    if (!districtIds.has(l.district_id)) bad.push(`location ${l.id} -> district ${l.district_id}`);
    if (l.faction && l.faction !== 'neutral' && !factionIds.has(l.faction)) bad.push(`location ${l.id} -> faction ${l.faction}`);
  });
  level.routes.forEach(r => {
    if (!locIds.has(r.origin)) bad.push(`route ${r.id} -> origin ${r.origin}`);
    if (!locIds.has(r.destination)) bad.push(`route ${r.id} -> destination ${r.destination}`);
  });
  level.scenarios.forEach(s => {
    if (!locIds.has(s.locationId)) bad.push(`scenario ${s.id} -> location ${s.locationId}`);
    (s.participants || []).forEach(p => { if (!charIds.has(p)) bad.push(`scenario ${s.id} -> participant ${p}`); });
  });
  level.characters.forEach(c => {
    if (!locIds.has(c.locationId)) bad.push(`character ${c.id} -> location ${c.locationId}`);
  });
  assert.deepEqual(bad, [], 'dangling references:\n  ' + bad.join('\n  '));
});

test('level: ids are unique within each collection', () => {
  for (const key of ['locations', 'routes', 'characters', 'scenarios', 'rumors', 'districts', 'factions']) {
    const ids = (level[key] || []).map(x => x.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual([...new Set(dupes)], [], `duplicate ${key} ids`);
  }
});

// ---------------------------------------------------------------------------
// QA 1-2 — connectivity
// ---------------------------------------------------------------------------

test('QA1: every location is reachable from the start', () => {
  // Caught: `precinct` had ZERO routes. It holds Officer Reyes and
  // officer_trust, and police_raid's success branch spawns snitch_or_silent
  // requiring officer_01_present — an entire thread behind a location with no
  // roads leading to it.
  const seen = reachable(level.startLocationId, adjacency());
  const stranded = [...locIds].filter(id => !seen.has(id));
  assert.deepEqual(stranded, [], `unreachable from ${level.startLocationId}: ${stranded.join(', ')}`);
});

test('QA1b: every non-secret location is reachable without secret routes', () => {
  // Secret locations are SUPPOSED to need their gates — that is the discovery
  // economy. Everything else must be reachable on open roads, or a player who
  // never finds a rumor is walled out of ordinary content.
  const secretLocs = new Set();
  level.routes.filter(isSecret).forEach(r => { secretLocs.add(r.destination); });
  // A location is only "secret" if EVERY route into it is secret.
  const openAdj = adjacency(r => !isSecret(r));
  const seen = reachable(level.startLocationId, openAdj);
  const walled = [...locIds].filter(id => !seen.has(id) && openAdj[id].size > 0);
  assert.deepEqual(walled, [], `has open routes but is unreachable on them: ${walled.join(', ')}`);

  const expectedSecret = [...locIds].filter(id => !seen.has(id));
  assert.deepEqual(expectedSecret.sort(), ['rooftop', 'stash_spot'],
    'only the two discovery locations may be secret-gated');
});

test('QA2: no location is a dead end', () => {
  // Caught: miami_cut (the climax) degree 1 — reached by one 0.7-danger alley
  // with no way out, which makes the BOSS scenario a trap. Also rec_center and
  // rooftop as degree-1 leaves.
  const adj = adjacency();
  const leaves = [...locIds].filter(id => adj[id].size < 2).map(id => `${id} (${adj[id].size})`);
  assert.deepEqual(leaves, [], `degree < 2: ${leaves.join(', ')}`);
});

// ---------------------------------------------------------------------------
// QA 3-4 — scenario distribution
// ---------------------------------------------------------------------------

test('QA3: every location has at least one scenario', () => {
  // Caught: bmore_steps had zero, despite being named as a TENSION beat in the
  // level's own experience.pacing block. It was 100% travel time.
  const count = {};
  level.scenarios.forEach(s => { count[s.locationId] = (count[s.locationId] || 0) + 1; });
  const empty = [...locIds].filter(id => !count[id]);
  assert.deepEqual(empty, [], `locations with no scenario: ${empty.join(', ')}`);
});

test('QA4: no location clusters more than two scenarios', () => {
  const count = {};
  level.scenarios.forEach(s => { count[s.locationId] = (count[s.locationId] || 0) + 1; });
  const clustered = Object.entries(count).filter(([, n]) => n > 2).map(([id, n]) => `${id} (${n})`);
  assert.deepEqual(clustered, [], `over-clustered: ${clustered.join(', ')}`);
});

// ---------------------------------------------------------------------------
// QA 6 — route roles
// ---------------------------------------------------------------------------

test('QA6: all six route roles are present and populated', () => {
  const roles = new Set(level.routes.map(r => r.role));
  ['primary', 'secondary', 'risky_shortcut', 'secret', 'social', 'emergency_escape']
    .forEach(role => assert.ok(roles.has(role), `no route has role "${role}"`));
});

test('QA6b: route roles are mechanically distinct, not cosmetic', () => {
  // A role that does not differ in danger from the safe default is decoration.
  const byRole = {};
  level.routes.forEach(r => { (byRole[r.role] ||= []).push(r); });
  const avg = role => byRole[role].reduce((a, r) => a + r.danger, 0) / byRole[role].length;
  assert.ok(avg('risky_shortcut') > avg('primary'), 'risky shortcuts must be more dangerous than primary routes');
  assert.ok(avg('secret') < avg('primary'), 'secret routes must be safer than primary routes — they are the payoff for discovery');
  assert.ok(byRole.emergency_escape.every(r => r.cost <= 4), 'an escape route nobody can afford is not an escape route');
});

// ---------------------------------------------------------------------------
// QA 7-8 — NPC routines
// ---------------------------------------------------------------------------

test('QA7: every NPC has a full five-block routine', () => {
  // The player is excluded — they are driven by input, not a routine.
  const bad = [];
  level.characters.filter(c => c.id !== 'player').forEach(c => {
    if (!c.routine) { bad.push(`${c.id}: no routine at all`); return; }
    const missing = TIME_BLOCKS.filter(b => !c.routine[b] || !c.routine[b].location);
    if (missing.length) bad.push(`${c.id}: missing ${missing.join(', ')}`);
  });
  assert.deepEqual(bad, [], 'incomplete routines:\n  ' + bad.join('\n  '));
});

test('QA8: every routine location exists and is route-connected', () => {
  const adj = adjacency();
  const bad = [];
  level.characters.filter(c => c.routine).forEach(c => {
    TIME_BLOCKS.forEach(b => {
      const loc = c.routine[b] && c.routine[b].location;
      if (!loc) return;
      if (!locIds.has(loc)) bad.push(`${c.id} ${b} -> unknown location ${loc}`);
      else if (adj[loc].size === 0) bad.push(`${c.id} ${b} -> ${loc} has no routes`);
    });
  });
  assert.deepEqual(bad, [], 'bad routine targets:\n  ' + bad.join('\n  '));
});

// ---------------------------------------------------------------------------
// QA 16 — soft locks
// ---------------------------------------------------------------------------

test('QA16: no scenario requires an NPC who never visits its location', () => {
  // The highest-value test here. Caught four scenarios that could never fire:
  //   block_fame       needed marcus at chi_grey     — the level's CLIMAX
  //   clique_war       needed ty at miami_cut
  //   train_heist      needed ty at train_yard
  //   snitch_or_silent needed officer_01 at blue_plate (Reyes had no routine)
  //
  // Two were fixed by correcting the routine (Marcus moves to the Greystone at
  // night; Reyes patrols the diner in the afternoon). Two were fixed by
  // dropping the requirement — Ty arriving for the war and the heist is a story
  // summons, not a place he stands. `participants` still lists him.
  const bad = [];
  level.scenarios.forEach(s => {
    (s.requirements || [])
      .filter(r => r.endsWith('_present') && r !== 'player_present')
      .forEach(req => {
        const who = req.replace(/_present$/, '');
        const ch = level.characters.find(c => c.id === who);
        if (!ch) { bad.push(`${s.id} requires unknown character ${who}`); return; }
        const visits = new Set(
          Object.values(ch.routine || {}).map(v => v && v.location).filter(Boolean)
        );
        visits.add(ch.locationId);
        if (!visits.has(s.locationId)) {
          bad.push(`${s.id} needs ${who} at ${s.locationId}, but ${who} is never there`);
        }
      });
  });
  assert.deepEqual(bad, [], 'unreachable scenarios:\n  ' + bad.join('\n  '));
});

// ---------------------------------------------------------------------------
// QA 9-10 — narrative wiring
// ---------------------------------------------------------------------------

test('QA9: every rumor reveal names a real scenario', () => {
  const bad = level.rumors
    .filter(r => r.reveals && !scnIds.has(r.reveals))
    .map(r => `${r.id} -> ${r.reveals}`);
  assert.deepEqual(bad, [], `rumors revealing nothing: ${bad.join(', ')}`);
});

test('QA9b: every rumor child names a real rumor', () => {
  const rumorIds = new Set(level.rumors.map(r => r.id));
  const bad = [];
  level.rumors.forEach(r => (r.children || []).forEach(c => {
    if (!rumorIds.has(c)) bad.push(`${r.id} -> ${c}`);
  }));
  assert.deepEqual(bad, [], `dangling rumor children: ${bad.join(', ')}`);
});

test('QA9c: every hidden scenario has a way to be revealed', () => {
  // A hidden scenario with no rumor pointing at it and no chain containing it
  // is authored content the player can never reach.
  const revealed = new Set(level.rumors.map(r => r.reveals).filter(Boolean));
  const chained = new Set(level.chains.flatMap(c => c.nodes || []));
  const orphans = level.scenarios
    .filter(s => s.hidden && !revealed.has(s.id) && !chained.has(s.id))
    .map(s => s.id);
  assert.deepEqual(orphans, [], `hidden with no reveal path: ${orphans.join(', ')}`);
});

test('QA10: every chain node is a real scenario', () => {
  const bad = [];
  level.chains.forEach(ch => (ch.nodes || []).forEach(n => {
    if (!scnIds.has(n)) bad.push(`${ch.id} -> ${n}`);
  }));
  assert.deepEqual(bad, [], `chains referencing nothing: ${bad.join(', ')}`);
});

// ---------------------------------------------------------------------------
// QA 15, 17 — traversal cost and gate cycles
// ---------------------------------------------------------------------------

test('QA15: the climax is reachable within the travel budget', () => {
  // Dijkstra on travel_time. If reaching the Cut costs more than 4, the
  // expiring scenarios there can never be met in time.
  const dist = {};
  locIds.forEach(id => { dist[id] = Infinity; });
  dist[level.startLocationId] = 0;
  const queue = [level.startLocationId];
  while (queue.length) {
    const cur = queue.shift();
    level.routes.forEach(r => {
      for (const [a, b] of [[r.origin, r.destination], [r.destination, r.origin]]) {
        if (a !== cur) continue;
        const next = dist[cur] + (r.travel_time || 1);
        if (next < dist[b]) { dist[b] = next; queue.push(b); }
      }
    });
  }
  assert.ok(dist.miami_cut <= 4, `stoop -> miami_cut costs ${dist.miami_cut}, budget is 4`);
  assert.ok(dist.chi_grey <= 5, `stoop -> chi_grey costs ${dist.chi_grey}, budget is 5`);
});

test('QA17: no route is gated behind a scenario that route is needed to reach', () => {
  // A hard lock: route R needs scenario S resolved, and S sits at a location
  // only R reaches. Nothing in the level may form that cycle.
  const openAdj = adjacency(r => !isSecret(r));
  const openSeen = reachable(level.startLocationId, openAdj);
  const bad = [];
  level.routes.filter(isSecret).forEach(r => {
    const gateScenarios = level.scenarios.filter(s => s.locationId === r.destination);
    const destOnlyViaThis = level.routes.filter(
      o => o.id !== r.id && (o.origin === r.destination || o.destination === r.destination)
    ).length === 0;
    if (destOnlyViaThis && gateScenarios.length && !openSeen.has(r.destination)) {
      bad.push(`${r.id}: ${r.destination} holds ${gateScenarios.map(s => s.id).join('/')} and only this route reaches it`);
    }
  });
  assert.deepEqual(bad, [], 'gate cycles:\n  ' + bad.join('\n  '));
});

// ---------------------------------------------------------------------------
// Design conformance — the level file must match the design document
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// QA 11 — environmental storytelling and consequences
// ---------------------------------------------------------------------------

const MARK_TYPES = new Set([
  'burn_marks', 'broken_windows', 'police_tape', 'graffiti',
  'missing_sign', 'damaged_vehicle', 'new_guards', 'faction_marking'
]);

test('QA11: every POI names a real location and a real mark type', () => {
  // POI `type` is not free text — it must be one of DM_WORLD_MARKS, or
  // world.addWorldMark rejects it and the POI silently never renders.
  const bad = [];
  (level.pois || []).forEach(p => {
    if (!locIds.has(p.locationId)) bad.push(`${p.id} -> unknown location ${p.locationId}`);
    if (!MARK_TYPES.has(p.type)) bad.push(`${p.id} -> "${p.type}" is not a DM_WORLD_MARKS value`);
    if (!p.meaning) bad.push(`${p.id} has no meaning — a POI without a story is decoration`);
  });
  assert.deepEqual(bad, [], 'bad POIs:\n  ' + bad.join('\n  '));
});

test('QA11b: every conditional POI names a scenario branch that exists', () => {
  // Conditions are "<scenarioId>:<outcome>". A typo here means the POI is
  // authored, loaded, and can never turn on.
  const bad = [];
  (level.pois || []).filter(p => p.condition).forEach(p => {
    const [scn, outcome] = String(p.condition).split(':');
    if (!scnIds.has(scn)) bad.push(`${p.id} -> unknown scenario ${scn}`);
    if (!['success', 'fail'].includes(outcome)) bad.push(`${p.id} -> unknown outcome "${outcome}"`);
    const entry = (level.consequence_matrix || {})[scn];
    if (entry && !entry[outcome]) bad.push(`${p.id} -> ${scn} has no "${outcome}" branch`);
  });
  assert.deepEqual(bad, [], 'unreachable POI conditions:\n  ' + bad.join('\n  '));
});

test('QA11c: every location the player can reach carries at least one POI', () => {
  // The "block remembers" pillar. A location with nothing to look at cannot
  // show the player anything about what they did there.
  const byLoc = {};
  (level.pois || []).forEach(p => { byLoc[p.locationId] = (byLoc[p.locationId] || 0) + 1; });
  const bare = [...locIds].filter(id => !byLoc[id]);
  assert.deepEqual(bare, [], `locations with no environmental storytelling: ${bare.join(', ')}`);
});

test('QA11d: every consequence effect points at something real', () => {
  const bad = [];
  const eventIds = new Set((level.events || []).map(e => e.id));
  Object.entries(level.consequence_matrix || {}).forEach(([scnId, branches]) => {
    if (!scnIds.has(scnId)) bad.push(`matrix key ${scnId} is not a scenario`);
    Object.entries(branches).forEach(([outcome, effects]) => {
      (effects || []).forEach((e, i) => {
        const at = `${scnId}.${outcome}[${i}]`;
        if (e.locationState && !locIds.has(e.locationState.locationId)) bad.push(`${at} -> location ${e.locationState.locationId}`);
        if (e.worldMark) {
          if (!locIds.has(e.worldMark.locationId)) bad.push(`${at} -> location ${e.worldMark.locationId}`);
          if (!MARK_TYPES.has(e.worldMark.mark)) bad.push(`${at} -> mark "${e.worldMark.mark}"`);
        }
        if (e.factionControl) {
          if (!locIds.has(e.factionControl.locationId)) bad.push(`${at} -> location ${e.factionControl.locationId}`);
          if (!factionIds.has(e.factionControl.factionId)) bad.push(`${at} -> faction ${e.factionControl.factionId}`);
        }
        if (e.relationship) {
          if (!charIds.has(e.relationship.from)) bad.push(`${at} -> character ${e.relationship.from}`);
          if (!charIds.has(e.relationship.to)) bad.push(`${at} -> character ${e.relationship.to}`);
        }
        if (e.newScenario && !locIds.has(e.newScenario.locationId)) bad.push(`${at} -> location ${e.newScenario.locationId}`);
        if (e.triggerEvent && !eventIds.has(e.triggerEvent)) bad.push(`${at} -> event ${e.triggerEvent}`);
      });
    });
  });
  assert.deepEqual(bad, [], 'dangling consequences:\n  ' + bad.join('\n  '));
});

test('QA11e: every major scenario has authored consequences for both outcomes', () => {
  // The design's rule is that a decision the player cannot walk past was not
  // designed. A scenario with no matrix entry produces no visible change.
  const MAJOR = [
    'corner_hustle', 'community_block', 'studio_session', 'block_fame',
    'police_raid', 'the_steps_watch', 'officer_trust', 'clique_war', 'train_heist'
  ];
  const missing = MAJOR.filter(id => {
    const e = (level.consequence_matrix || {})[id];
    return !e || !Array.isArray(e.success) || !Array.isArray(e.fail) || !e.success.length || !e.fail.length;
  });
  assert.deepEqual(missing, [], `no success/fail consequences authored: ${missing.join(', ')}`);
});

test('QA11f: every permanent consequence is visible somewhere', () => {
  // Design pillar 1. A consequence that only moves a number is not shipped —
  // each fail branch of a territory scenario must leave a mark the player can
  // walk past.
  const bad = [];
  ['clique_war', 'the_steps_watch', 'train_heist'].forEach(id => {
    const fail = ((level.consequence_matrix || {})[id] || {}).fail || [];
    if (!fail.some(e => e.worldMark)) bad.push(`${id}.fail leaves no visible mark`);
  });
  assert.deepEqual(bad, [], bad.join('\n  '));
});

test('design: districts match the west-to-east danger gradient', () => {
  // The level's single readable idea. If a location sits in the wrong district
  // the gradient stops being legible, which is the one thing the player is
  // meant to learn without being told.
  const expected = {
    stoop: 'harlem', rec_center: 'harlem', stash_spot: 'harlem', rooftop: 'harlem',
    blue_plate: 'downtown', corner_store: 'downtown', precinct: 'downtown',
    detroit_lot: 'detroit', chi_grey: 'detroit',
    bmore_steps: 'east_side', miami_cut: 'east_side',
    train_yard: 'industrial'
  };
  const wrong = level.locations
    .filter(l => expected[l.id] && l.district_id !== expected[l.id])
    .map(l => `${l.id}: ${l.district_id} should be ${expected[l.id]}`);
  assert.deepEqual(wrong, [], 'district drift:\n  ' + wrong.join('\n  '));
});

test('design: the map layout matches the blockout, west to east', () => {
  // The design's single readable idea is a west-to-east gradient. It only
  // exists if the coordinates say so.
  //
  // This caught the level and the design disagreeing outright: bmore_steps was
  // authored at x=360, west of the Blue Plate, while the design puts it in
  // east_side as the threshold to the Cut; and train_yard sat at y=560 on a
  // 540-tall canvas.
  const x = id => level.locations.find(l => l.id === id).coordinates.x;
  const order = [
    ['stoop', 'corner_store'], ['corner_store', 'blue_plate'],
    ['blue_plate', 'detroit_lot'], ['detroit_lot', 'bmore_steps'],
    ['bmore_steps', 'miami_cut']
  ];
  const wrong = order
    .filter(([w, e]) => x(w) >= x(e))
    .map(([w, e]) => `${w} (x=${x(w)}) must be west of ${e} (x=${x(e)})`);
  assert.deepEqual(wrong, [], 'gradient broken:\n  ' + wrong.join('\n  '));

  // The payoff spur is north of the tension it pays off.
  const y = id => level.locations.find(l => l.id === id).coordinates.y;
  assert.ok(y('chi_grey') < y('detroit_lot'), 'Chicago Greystone is the northern payoff spur');
  assert.ok(y('train_yard') > y('blue_plate'), 'the Rail Yards escape valve is south');
  assert.ok(y('rooftop') < y('stash_spot'), 'the Rooftop is above the Stash it is reached through');
});

test('design: every location renders inside the canvas at every zoom', () => {
  // Mirrors _locScreen in dynamic-world-map-renderer.js. The renderer used to
  // compute district.x + nx * spread, which put east_side locations at x=1226
  // on a 960px canvas and the Rail Yards at y=723 on a 540px one — authored,
  // loaded, and drawn off the edge of the map.
  const W = 960, H = 540, PAD = 0.06;
  const fit = v => PAD + v * (1 - PAD * 2);
  const bad = [];
  for (const [zoom, scale] of [['CITY', 0.55], ['DISTRICT', 0.82], ['STREET', 1.0]]) {
    level.locations.forEach(l => {
      const nx = l.coordinates.x / 960, ny = l.coordinates.y / 540;
      const sx = (0.5 + (fit(nx) - 0.5) * scale) * W;
      const sy = (0.5 + (fit(ny) - 0.5) * scale) * H;
      if (sx < 0 || sx > W || sy < 0 || sy > H) {
        bad.push(`${l.id} at ${zoom}: (${Math.round(sx)}, ${Math.round(sy)})`);
      }
    });
  }
  assert.deepEqual(bad, [], 'off-canvas:\n  ' + bad.join('\n  '));
});

test('design: coordinates are authored in level space, not normalized', () => {
  // A location carrying loc.x / loc.y (0..1) instead of coordinates (0..960)
  // silently takes a different branch in _locScreen. Keep one convention.
  const bad = level.locations
    .filter(l => typeof l.x === 'number' || typeof l.y === 'number' ||
                 !l.coordinates || typeof l.coordinates.x !== 'number')
    .map(l => l.id);
  assert.deepEqual(bad, [], `mixed coordinate conventions: ${bad.join(', ')}`);
});

test('design: danger rises from west to east', () => {
  const band = { harlem: 0, downtown: 1, detroit: 2, industrial: 2, east_side: 3 };
  const districtOf = id => (level.locations.find(l => l.id === id) || {}).district_id;
  const bad = [];
  level.routes.filter(r => !isSecret(r) && r.role !== 'emergency_escape').forEach(r => {
    const a = band[districtOf(r.origin)], b = band[districtOf(r.destination)];
    if (a === undefined || b === undefined) return;
    // A route that ends further east must not be safer than 0.2.
    if (b > a && r.danger < 0.2) bad.push(`${r.id} goes east at danger ${r.danger}`);
  });
  assert.deepEqual(bad, [], 'routes that break the gradient:\n  ' + bad.join('\n  '));
});
