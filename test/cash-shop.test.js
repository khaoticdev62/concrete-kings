const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeDocument() {
  const elements = {};
  const makeEl = (id) => ({
    id,
    textContent: '',
    innerHTML: '',
    style: {},
    _classes: new Set(),
    classList: {
      contains(name) { return elements[id]._classes.has(name); },
      add(name) { elements[id]._classes.add(name); },
      remove(name) { elements[id]._classes.delete(name); }
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    appendChild() {}
  });
  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl(id);
      return elements[id];
    },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
}

const PREP_ITEM_DEFAULTS = { street_dice: 0, bodega_run: 0, haircut_challenge: 0, lockpicking: 0, negotiation: 0 };

test('CASH Shop: Game.addPlayer gives every player a zeroed prepItems map', () => {
  global.document = fakeDocument();
  try {
    const { Game } = loadGameModule();
    const game = new Game();
    game.addPlayer('Test');
    // Spread into a Node-realm literal: objects built inside the VM sandbox carry
    // that realm's Object.prototype, which assert/strict rejects on identity alone.
    assert.deepEqual({ ...game.players[0].prepItems }, PREP_ITEM_DEFAULTS);
  } finally {
    delete global.document;
  }
});

test('CASH Shop: buyPrepItem deducts CASH and increments the matching prepItems counter', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 100;

    const result = app.buyPrepItem('street_dice');

    assert.equal(result, true);
    assert.equal(app.game.players[0].stats.streetCred, 70, '100 - 30 cost');
    assert.equal(app.game.players[0].prepItems.street_dice, 1);
  } finally {
    delete global.document;
  }
});

test('CASH Shop: buyPrepItem refuses a purchase without enough CASH', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 10;

    const result = app.buyPrepItem('street_dice');

    assert.equal(result, false);
    assert.equal(app.game.players[0].stats.streetCred, 10, 'CASH must be untouched on a refused purchase');
    assert.equal(app.game.players[0].prepItems.street_dice, 0);
  } finally {
    delete global.document;
  }
});

test('CASH Shop: buyPrepItem refuses a purchase at the owned-item cap', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 1000;
    app.game.players[0].prepItems.street_dice = 3;

    const result = app.buyPrepItem('street_dice');

    assert.equal(result, false);
    assert.equal(app.game.players[0].stats.streetCred, 1000, 'CASH must be untouched on a refused purchase');
    assert.equal(app.game.players[0].prepItems.street_dice, 3, 'must not exceed the cap');
  } finally {
    delete global.document;
  }
});
