const test = require('node:test');
const assert = require('node:assert/strict');

// Import and expose Top-down map globals for the sandboxed VM context
const { AssetRegistry } = require('../src/pixel_engine/asset-registry.js');
const { DISTRICTS, getDistrict, districtKeys, CITY_TO_DISTRICT } = require('../src/pixel_engine/topdown-city-data.js');
const { TopDownCityController } = require('../src/pixel_engine/topdown-city-controller.js');
const { TopDownCityRenderer, TOPDOWN_POI_LABELS } = require('../src/pixel_engine/topdown-city-renderer.js');

global.AssetRegistry = AssetRegistry;
global.TopDownCityController = TopDownCityController;
global.TopDownCityRenderer = TopDownCityRenderer;
global.getTopDownDistrict = getDistrict;
global.districtKeys = districtKeys;
global.CITY_TO_DISTRICT = CITY_TO_DISTRICT;
global.TOPDOWN_POI_LABELS = TOPDOWN_POI_LABELS;

const { loadGameModule } = require('./helpers/load-app.js');

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
    addEventListener(){}, focus(){}
  });
  return {
    getElementById(id) { if (!elements[id]) elements[id] = make(id); return elements[id]; },
    createElement(tag) { return make('created-' + tag); },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

test('Screen: the blockMap markup has the top-down canvas and district rail, and no legacy grid', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="topDownMapCanvas"'), 'top-down canvas must exist');
  assert.ok(html.includes('id="districtRail"'), 'district rail must exist');
  assert.ok(html.includes('id="mapPromptLine"'), 'contextual prompt line must exist');

  assert.equal(html.includes('id="strategicMapCanvas"'), false, 'legacy grid canvas must be gone');
  assert.equal(html.includes('setQuestFilter'), false, 'quest filter must be gone — it had no data model');
  assert.equal(html.includes('app.zoomMap'), false, 'zoom controls must be gone');
  assert.equal(html.includes('Fog / Unexplored'), false, 'fog legend must be gone');
});

test('Screen: travelToDistrict is refused when heat gates the city', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Player1');
    app.humanIndex = 0;
    app.game.players[0].stats = { reputation: 0, streetCred: 0 };
    app.locationHeat = { ...app.locationHeat, Detroit: 3 };
    const before = app.game.activeCity;

    assert.equal(app.travelToDistrict('DETROIT'), false, 'heat 3 must block travel');
    assert.equal(app.game.activeCity, before, 'active city must not change on a refused travel');
  } finally {
    delete global.document; delete global.window; delete global.alert;
  }
});

test('Screen: travelToDistrict succeeds for a clear city and sets the active city', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Player1');
    app.humanIndex = 0;
    app.game.players[0].stats = { reputation: 0, streetCred: 0 };
    app.locationHeat = { ...app.locationHeat, Chicago: 0 };

    assert.equal(app.travelToDistrict('CHICAGO'), true);
    assert.equal(app.game.activeCity, 'Chicago');
  } finally {
    delete global.document; delete global.window; delete global.alert;
  }
});

test('Screen: travelToDistrict rejects an unknown district key', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Player1');
    app.humanIndex = 0;
    app.game.players[0].stats = { reputation: 0, streetCred: 0 };
    assert.equal(app.travelToDistrict('ATLANTIS'), false);
  } finally {
    delete global.document; delete global.window; delete global.alert;
  }
});

test('Screen: every city in the heat table has a district to travel to', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Player1');
    app.humanIndex = 0;
    app.game.players[0].stats = { reputation: 0, streetCred: 0 };
    Object.keys(app.locationHeat).forEach(city => {
      assert.ok(CITY_TO_DISTRICT[city], `${city} in locationHeat has no district mapping`);
    });
  } finally {
    delete global.document; delete global.window;
  }
});
