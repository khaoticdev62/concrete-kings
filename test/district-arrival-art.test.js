const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SCENE_DIR = path.join(ROOT, 'assets', 'scenes', 'web');

/**
 * Both maps are plain object literals in index.html. Parsing them out of the
 * source rather than booting the app keeps these tests fast and means a typo in
 * the markup cannot be masked by a stub.
 */
function parseSceneMap(constName) {
  // Brace-walked rather than regex-matched. A regex for this is fragile twice
  // over: NPC_SCENE_BACKDROPS is nested so a lazy match stops at the wrong
  // brace, and index.html is CRLF so patterns anchored on \n silently miss. An
  // earlier version of this file used a regex, matched nothing, and every
  // assertion below passed against an empty string — the test was vacuous while
  // reporting green.
  const decl = `const ${constName} = {`;
  const start = html.indexOf(decl);
  assert.notEqual(start, -1, `${constName} must exist in index.html`);

  let depth = 0;
  const open = start + decl.length - 1;
  for (let i = open; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) {
        const body = html.slice(open + 1, i);
        assert.ok(body.trim().length > 0, `${constName} must not be empty`);
        return body;
      }
    }
  }
  throw new Error(`${constName} has no closing brace`);
}

function sceneNamesIn(body) {
  // Values are quoted scene basenames; keys are bare identifiers, so only the
  // quoted strings are collected.
  return [...body.matchAll(/'([a-z0-9-]+)'/g)].map(x => x[1]);
}

const ARRIVAL_BODY = parseSceneMap('DISTRICT_ARRIVAL_SCENES');
const NPC_BODY = parseSceneMap('NPC_SCENE_BACKDROPS');

test('Arrival art: every mapped scene exists on disk', () => {
  const missing = sceneNamesIn(ARRIVAL_BODY)
    .filter(n => !fs.existsSync(path.join(SCENE_DIR, `${n}.png`)));
  assert.deepEqual(missing, [],
    `arrival scenes with no file, which would show a broken image: ${missing.join(', ')}`);
});

test('Arrival art: every mapped scene is under the 400KB web ceiling', () => {
  // Same ceiling test/manifest-integrity.test.js enforces for sprite sources.
  // A full-size original here would be a multi-megabyte read on travel.
  const tooBig = sceneNamesIn(ARRIVAL_BODY)
    .map(n => ({ n, kb: fs.statSync(path.join(SCENE_DIR, `${n}.png`)).size / 1024 }))
    .filter(s => s.kb > 400)
    .map(s => `${s.n} (${Math.round(s.kb)}KB)`);
  assert.deepEqual(tooBig, [], `oversized arrival scenes: ${tooBig.join(', ')}`);
});

test('Arrival art: no scene is used by both the arrival map and an NPC backdrop', () => {
  // Two of the strongest district matches were freed by reassigning NPC
  // backdrops rather than duplicating the images. Without this test the next
  // edit silently double-books one across two screens and the reassignment is
  // quietly undone.
  const arrival = new Set(sceneNamesIn(ARRIVAL_BODY));
  const shared = sceneNamesIn(NPC_BODY).filter(n => arrival.has(n));
  assert.deepEqual([...new Set(shared)], [],
    `scenes double-booked between arrival art and NPC backdrops: ${shared.join(', ')}`);
});

test('Arrival art: districts with no scene resolve to null rather than a wrong city', () => {
  // Atlanta has no Southern porch art. It must have no entry at all, because a
  // stand-in from another city is worse than no splash.
  assert.ok(!/ATLANTA/.test(ARRIVAL_BODY),
    'ATLANTA must stay unmapped until porch art exists');
  assert.match(html, /function resolveDistrictArrival\(districtKey\) \{\s*return DISTRICT_ARRIVAL_SCENES\[districtKey\] \|\| null;/,
    'the resolver must return null for an unmapped district');
});

test('Arrival art: every district key in the map is a real district', () => {
  const { districtKeys } = require('../src/pixel_engine/topdown-city-data.js');
  const valid = new Set(districtKeys());
  const keys = [...ARRIVAL_BODY.matchAll(/^\s*([A-Z]+):/gm)].map(x => x[1]);
  assert.ok(keys.length > 0, 'the map must have entries');
  const unknown = keys.filter(k => !valid.has(k));
  assert.deepEqual(unknown, [],
    `arrival entries keyed to non-existent districts, which can never fire: ${unknown.join(', ')}`);
});

test('Arrival art: the splash lives inside the map viewport frame', () => {
  // The block map measures exactly 595px in a 595px frame at 720p. An overlay
  // placed as a sibling of the frame rather than inside it adds height and
  // pushes the exit buttons out of reach — the same failure the canvas
  // max-height comment in index.html describes.
  const frame = html.match(/<div class="crt-screen"[^>]*>[\s\S]*?<\/div>\s*<div id="mapPromptLine"/);
  assert.ok(frame, 'the map viewport frame must be findable');
  assert.match(frame[0], /id="districtArrival"/,
    'districtArrival must be inside the crt-screen frame, not a sibling of it');
  assert.match(frame[0], /position:relative/,
    'the frame needs position:relative or the absolute overlay escapes it');
});

test('Arrival art: the splash is a real dialog and the canvas can take focus back', () => {
  const overlay = html.match(/<div id="districtArrival"[^>]*>/)[0];
  assert.match(overlay, /role="dialog"/);
  assert.match(overlay, /aria-modal="true"/);
  assert.match(overlay, /aria-labelledby="districtArrivalTitle"/,
    'the dialog needs an accessible name, and the district title is it');
  assert.match(overlay, /tabindex="-1"/, 'focus is moved here programmatically');

  // dismissDistrictArrival() calls canvas.focus(). Without tabindex that is a
  // no-op and the player loses keyboard control of the map after one splash.
  assert.match(html, /<canvas id="topDownMapCanvas" tabindex="0"/,
    'the map canvas must be focusable for focus to return to it');
});

test('Arrival art: key handling is capture-phase, or the player walks behind the splash', () => {
  // TopDownCityController binds keydown on window in the bubble phase. A
  // bubble-phase handler here would run after it.
  const handler = html.match(/window\.addEventListener\('keydown',[\s\S]*?\}, true\);/);
  assert.ok(handler, 'the arrival key handler must be registered with capture = true');
  assert.match(handler[0], /districtArrivalOpen/);
  assert.match(handler[0], /stopPropagation/,
    'movement keys must be stopped from reaching the controller');
  ['Enter', 'Escape'].forEach(k => {
    assert.ok(handler[0].includes(`'${k}'`), `${k} must dismiss the splash`);
  });
});

test('Arrival art: reduced motion cancels the fade', () => {
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{\s*#districtArrival\.active \{ animation: none; \}/,
    'the fade must resolve instantly under prefers-reduced-motion');
});

test('Arrival art: the starting district is pre-marked, so the map does not open on a splash', () => {
  const init = html.match(/initTopDownCity\(\) \{[\s\S]*?\n  \},/);
  assert.ok(init, 'initTopDownCity must be findable');
  assert.match(init[0], /arrivedDistricts.*\n?.*add\(startKey\)|add\(startKey\)/,
    'the starting district must be recorded as already arrived');
});
