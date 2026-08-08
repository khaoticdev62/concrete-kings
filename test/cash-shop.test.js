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

test('Modals: every full-screen modal lives outside .screen sections and the dev-console <details>', () => {
  // Regression guard for a bug class, not one modal. shopModal was first placed
  // inside the #game screen's DEVELOPER_CONSOLE.LOG <details>, and accessModal
  // shipped that way for real: a closed <details> renders no descendants, so the
  // modal computed display:block yet measured 0x0 and was unreachable. A modal
  // nested in a .screen section is likewise dead on every other screen.
  const fs = require('fs');
  const path = require('path');
  // Strip HTML comments first: prose mentioning tag names would otherwise be
  // counted as real markup.
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '');

  const modalIds = ['shopModal', 'shopUnavailableModal', 'accessModal'];

  for (const id of modalIds) {
    const modalIndex = html.indexOf(`id="${id}"`);
    assert.ok(modalIndex > -1, `${id} must exist in index.html`);

    const before = html.slice(0, modalIndex);
    const openDetails = (before.match(/<details/g) || []).length;
    const closeDetails = (before.match(/<\/details>/g) || []).length;
    assert.equal(openDetails, closeDetails, `${id} must not be nested inside a <details> element`);

    const openSections = (before.match(/<section/g) || []).length;
    const closeSections = (before.match(/<\/section>/g) || []).length;
    assert.equal(openSections, closeSections, `${id} must not be nested inside a .screen <section>`);
  }
});

test('Stylesheet: the inline <style> block has balanced braces', () => {
  // A single missing "}" after .retro-chat-log silently swallowed every
  // accessibility rule that followed. With CSS nesting, the browser reparented
  // them under .retro-chat-log instead of erroring, so high-contrast, all text
  // scaling, and reduced motion applied to nothing while looking correct in
  // source. 16 rules were lost this way.
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, 'index.html must have an inline <style> block');

  // Drop comments and quoted strings so braces inside them are not counted.
  const css = match[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");

  const open = (css.match(/\{/g) || []).length;
  const close = (css.match(/\}/g) || []).length;
  assert.equal(open, close, `unbalanced braces in the inline <style> block: ${open} "{" vs ${close} "}"`);
});

test('Stylesheet: accessibility rules are top-level, not nested inside another rule', () => {
  // Complements the brace-balance check: proves these specific selectors sit at
  // nesting depth 0, where they can actually match <body>.
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');

  const required = ['body.high-contrast', 'body.text-scale-125', 'body.text-scale-150', 'body.text-scale-175', 'body.reduced-motion'];

  for (const selector of required) {
    const idx = css.indexOf(selector);
    assert.ok(idx > -1, `${selector} must exist in the stylesheet`);
    const before = css.slice(0, idx);
    const depth = (before.match(/\{/g) || []).length - (before.match(/\}/g) || []).length;
    assert.equal(depth, 0, `${selector} must be a top-level rule, but sits at nesting depth ${depth}`);
  }
});

test('Accessibility modal: every control has a label associated by id', () => {
  // The panel's checkboxes were bare <span> text with no for/id association,
  // so screen readers could not announce them and clicking the text did nothing.
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  const start = html.indexOf('id="accessModal"');
  const end = html.indexOf('</div>', html.indexOf('SAVE &amp; CLOSE'));
  const modalHtml = html.slice(start, end);

  const controlIds = ['accessColorblind', 'accessTextScale', 'accessHighContrast', 'accessReducedMotion', 'accessShowFps'];
  const unlabeled = controlIds.filter(id => !modalHtml.includes(`for="${id}"`));
  assert.deepEqual(unlabeled, [], `accessibility controls missing an associated <label for>: ${unlabeled.join(', ')}`);
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

test('CASH Shop: the Main Menu showBoosterShop() no longer throws, and opens an explainer instead', () => {
  global.document = fakeDocument();
  try {
    const { app } = loadGameModule();

    assert.doesNotThrow(() => app.showBoosterShop());

    const modal = global.document.getElementById('shopUnavailableModal');
    assert.equal(modal.style.display, 'flex');
  } finally {
    delete global.document;
  }
});

test('CASH Shop: closeShopUnavailableModal hides the explainer', () => {
  global.document = fakeDocument();
  try {
    const { app } = loadGameModule();

    app.showBoosterShop();
    app.closeShopUnavailableModal();

    const modal = global.document.getElementById('shopUnavailableModal');
    assert.equal(modal.style.display, 'none');
  } finally {
    delete global.document;
  }
});

test('CASH Shop: every Main Menu onclick handler resolves to a real app method', () => {
  // The SHOP button shipped for months calling a method that never existed.
  // This catches the next such stub at test time instead of on a user's click.
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  const menuStart = html.indexOf('id="mainMenuView"');
  assert.ok(menuStart > -1, 'mainMenuView must exist');
  const menuEnd = html.indexOf('id="characterCreationView"', menuStart);
  const menuHtml = html.slice(menuStart, menuEnd);

  const handlers = [...menuHtml.matchAll(/onclick="app\.([A-Za-z0-9_]+)\(/g)].map(m => m[1]);
  assert.ok(handlers.length > 0, 'the Main Menu must have onclick handlers to check');

  global.document = fakeDocument();
  try {
    const { app } = loadGameModule();
    const missing = handlers.filter(name => typeof app[name] !== 'function');
    assert.deepEqual(missing, [], `Main Menu buttons call undefined app methods: ${missing.join(', ')}`);
  } finally {
    delete global.document;
  }
});
