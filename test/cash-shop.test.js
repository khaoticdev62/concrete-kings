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

test('CASH Shop: renderShopModal lists every item with live CASH-affordability state', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 20; // below the 30 cost of every item

    app.renderShopModal();

    const html = global.document.getElementById('shopItemsList').innerHTML;
    assert.ok(html.includes('LOADED DICE'), 'every item name must render');
    assert.ok(html.includes('RUBBER SOLES'));
    assert.ok(html.includes('STEADY HAND'));
    assert.ok(html.includes('MASTER PICK'));
    assert.ok(html.includes('INSIDER INFO'));
    assert.ok(html.includes('disabled'), 'BUY buttons must be disabled when CASH is insufficient');
  } finally {
    delete global.document;
  }
});

test('CASH Shop: renderShopModal enables BUY once CASH covers the cost', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 100;

    app.renderShopModal();

    const html = global.document.getElementById('shopItemsList').innerHTML;
    assert.ok(!html.includes('disabled'), 'BUY buttons must be enabled when CASH covers every item');
  } finally {
    delete global.document;
  }
});

test('CASH Shop: renderShopModal disables a capped item even with plenty of CASH', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;
    app.game.players[0].stats.streetCred = 1000;
    app.game.players[0].prepItems.street_dice = 3;

    app.renderShopModal();

    const html = global.document.getElementById('shopItemsList').innerHTML;
    assert.ok(html.includes('disabled'), 'the capped item must render a disabled BUY button');
    assert.ok(html.includes('3/3'), 'the capped item must show its owned count at the cap');
  } finally {
    delete global.document;
  }
});

test('CASH Shop: shopModal markup lives outside every .screen section and the dev-console <details>', () => {
  // Regression guard: the modal was first placed inside the #game screen's
  // DEVELOPER_CONSOLE.LOG <details>. A closed <details> does not render its
  // descendants at all, so display:flex produced a 0-height invisible modal.
  const fs = require('fs');
  const path = require('path');
  // Strip HTML comments first: prose mentioning tag names would otherwise be
  // counted as real markup.
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '');

  const modalIndex = html.indexOf('id="shopModal"');
  assert.ok(modalIndex > -1, 'shopModal must exist in index.html');

  const before = html.slice(0, modalIndex);
  const openDetails = (before.match(/<details/g) || []).length;
  const closeDetails = (before.match(/<\/details>/g) || []).length;
  assert.equal(openDetails, closeDetails, 'shopModal must not be nested inside a <details> element');

  const openSections = (before.match(/<section/g) || []).length;
  const closeSections = (before.match(/<\/section>/g) || []).length;
  assert.equal(openSections, closeSections, 'shopModal must not be nested inside a .screen <section>');
});

test('CASH Shop: openShopModal shows the modal, closeShopModal hides it', () => {
  global.document = fakeDocument();
  try {
    const { app, Game } = loadGameModule();
    app.game = new Game();
    app.game.addPlayer('Test');
    app.humanIndex = 0;

    app.openShopModal();
    assert.equal(global.document.getElementById('shopModal').style.display, 'flex');

    app.closeShopModal();
    assert.equal(global.document.getElementById('shopModal').style.display, 'none');
  } finally {
    delete global.document;
  }
});
