const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadGameModule } = require('./helpers/load-app.js');

const WEB_DIR = path.join(__dirname, '..', 'assets', 'scenes', 'web');

/** Pull the backdrop map straight out of index.html's inline script. */
function backdropMap() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const m = html.match(/const NPC_SCENE_BACKDROPS = (\{[\s\S]*?\n\};)/);
  assert.ok(m, 'NPC_SCENE_BACKDROPS must exist in index.html');
  // eslint-disable-next-line no-new-func
  return new Function('return ' + m[1].replace(/;$/, ''))();
}

function fakeDocument() {
  const elements = {};
  const make = (id) => ({
    id, textContent: '', innerHTML: '', value: '', style: {},
    _classes: new Set(),
    classList: {
      contains(n) { return elements[id]._classes.has(n); },
      add(n) { elements[id]._classes.add(n); },
      remove(n) { elements[id]._classes.delete(n); },
      toggle(n, f) { f ? elements[id]._classes.add(n) : elements[id]._classes.delete(n); }
    },
    appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    getContext() { return null; },
    addEventListener() {}
  });
  return {
    getElementById(id) { if (!elements[id]) elements[id] = make(id); return elements[id]; },
    createElement(tag) { return make('created-' + tag); },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

test('NPC backdrop: every npcId that triggerHotspot can reach has a mapping', () => {
  // triggerHotspot is the only caller of enterNpcScene, and it passes exactly
  // these four ids. A missing one means a POI with no backdrop.
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const ids = [...html.matchAll(/enterNpcScene\('([a-z]+)'/g)].map(m => m[1]);
  assert.ok(ids.length >= 4, 'expected the four POI NPC ids');

  const map = backdropMap();
  [...new Set(ids)].forEach(id => {
    assert.ok(map[id], `npcId "${id}" is reachable from a POI but has no backdrop mapping`);
    assert.ok(map[id].default, `npcId "${id}" must have a default backdrop`);
  });
});

test('NPC backdrop: every referenced file exists as a web-sized copy', () => {
  const map = backdropMap();
  const missing = [];
  Object.entries(map).forEach(([npcId, entry]) => {
    Object.entries(entry).forEach(([key, file]) => {
      const p = path.join(WEB_DIR, file + '.png');
      if (!fs.existsSync(p)) missing.push(`${npcId}.${key} -> ${file}.png`);
    });
  });
  assert.deepEqual(missing, [], `backdrop files referenced but not present: ${missing.join(', ')}`);
});

test('NPC backdrop: web copies are small enough to serve to a browser', () => {
  // The originals are 5-14MB. Loading one as a backdrop would be indefensible,
  // so this guards against a raw file being copied in by mistake.
  const files = fs.readdirSync(WEB_DIR).filter(f => f.endsWith('.png'));
  assert.ok(files.length > 0, 'web backdrop directory must not be empty');
  files.forEach(f => {
    const kb = fs.statSync(path.join(WEB_DIR, f)).size / 1024;
    assert.ok(kb < 400, `${f} is ${Math.round(kb)}KB — too large for a backdrop`);
  });
});

test('NPC backdrop: resolveNpcBackdrop prefers a city override over the default', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  try {
    const { resolveNpcBackdrop } = loadGameModule();
    assert.equal(resolveNpcBackdrop('chen', 'Chicago'), 'elsol-bodega-underpass');
    assert.equal(resolveNpcBackdrop('chen', 'Oakland'), 'corner-bodega-night', 'unlisted city falls back to default');
    assert.equal(resolveNpcBackdrop('ray', 'Harlem'), 'midtown-liquor-barber-wall');
    assert.equal(resolveNpcBackdrop('nobody', 'Harlem'), null, 'unknown npc resolves to null, not a guess');
  } finally {
    delete global.document; delete global.window;
  }
});

test('NPC backdrop: an unmapped npc leaves the panel flat rather than half-styled', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  try {
    const { app } = loadGameModule();
    const panel = global.document.getElementById('npcSceneBackdrop');
    panel.classList.add('active');
    panel.style.backgroundImage = 'url("stale.png")';

    app.applyNpcSceneBackdrop('nobody');

    assert.equal(panel.classList.contains('active'), false, 'stale backdrop class must be cleared');
    assert.equal(panel.style.backgroundImage, '', 'stale background image must be cleared');
  } finally {
    delete global.document; delete global.window;
  }
});
