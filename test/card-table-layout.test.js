const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadGameModule } = require('./helpers/load-app.js');

function indexHtml() {
  return fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
}

function inlineCss() {
  return indexHtml().match(/<style>([\s\S]*?)<\/style>/)[1];
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

test('Card table: game-bottom-grid has a real CSS rule', () => {
  // This class shipped referenced-but-undefined, silently falling back to
  // display:block and stacking the two columns. That was 312px of the overflow.
  // A class used in markup with no rule anywhere fails without any error.
  const css = inlineCss();
  const m = css.match(/\.game-bottom-grid\s*\{([^}]*)\}/);
  assert.ok(m, '.game-bottom-grid must be defined in the stylesheet');

  const body = m[1];
  assert.match(body, /display:\s*grid/, 'must be a grid');
  assert.match(body, /grid-template-columns:/, 'must declare column tracks');
});

test('Card table: every class used in the game screen markup is defined somewhere', () => {
  // Generalises the bug above: catch the next referenced-but-undefined class.
  const html = indexHtml();
  const css = inlineCss();
  const extraCss = fs.existsSync(path.join(__dirname, '..', 'src', 'pixel_engine', 'pixel-engine.css'))
    ? fs.readFileSync(path.join(__dirname, '..', 'src', 'pixel_engine', 'pixel-engine.css'), 'utf8')
    : '';
  const allCss = css + extraCss;

  const start = html.indexOf('<section id="game"');
  const end = html.indexOf('<section id="judging"');
  const section = html.slice(start, end);

  const used = new Set();
  for (const m of section.matchAll(/class="([^"]+)"/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach(c => used.add(c));
  }

  // Classes styled only from JS or intentionally structural.
  const ALLOWED_UNDEFINED = new Set(['screen', 'active']);

  const undefinedClasses = [...used].filter(c =>
    !ALLOWED_UNDEFINED.has(c) && !allCss.includes('.' + c));

  assert.deepEqual(undefinedClasses, [],
    `classes used in #game markup with no CSS rule: ${undefinedClasses.join(', ')}`);
});

test('Card table: the narrative panel no longer hard-codes a 300px height', () => {
  const html = indexHtml();
  const start = html.indexOf('<section id="game"');
  const end = html.indexOf('<section id="judging"');
  const section = html.slice(start, end);
  assert.equal(/height:\s*300px/.test(section), false,
    'the 300px narrative panel was 300 of the 1386px overflow');
});

test('Card table: the right rail has a chat tab folded into the tab system', () => {
  const html = indexHtml();
  assert.ok(html.includes('rightTabChat'), 'a chat tab panel must exist');
  assert.ok(html.includes('tabChatBtn'), 'a chat tab button must exist');
  assert.ok(html.includes("switchRightTab('chat')"), 'the chat tab must be reachable');
});

test('Card table: switchRightTab shows exactly one panel at a time', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  try {
    const { app } = loadGameModule();
    const panels = ['rightTabScoreboard', 'rightTabReceipts', 'rightTabChat'];

    ['scoreboard', 'receipts', 'chat'].forEach(tab => {
      app.switchRightTab(tab);
      const shown = panels.filter(p => global.document.getElementById(p).style.display !== 'none');
      assert.equal(shown.length, 1, `exactly one panel visible for "${tab}", saw ${shown.length}`);
    });
  } finally {
    delete global.document; delete global.window;
  }
});

test('Card table: the stage panel is hidden by default', () => {
  // It hosts only the mini-game canvas; its other occupant #narrativeTextBox is
  // never shown anywhere in the codebase. Left visible it was a 116px empty
  // frame on the card table.
  const html = indexHtml();
  const m = html.match(/id="stagePanel"[^>]*style="([^"]*)"/);
  assert.ok(m, 'stagePanel must exist with an inline style');
  assert.match(m[1], /display:\s*none/, 'must start hidden');
});

test('Card table: syncStagePanel follows miniGameActive in both directions', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  try {
    const { app } = loadGameModule();
    const panel = global.document.getElementById('stagePanel');

    app.miniGameActive = false;
    app.syncStagePanel();
    assert.equal(panel.style.display, 'none', 'hidden with no mini-game running');

    app.miniGameActive = true;
    app.syncStagePanel();
    assert.equal(panel.style.display, 'flex', 'shown so the mini-game canvas has a home');

    app.miniGameActive = false;
    app.syncStagePanel();
    assert.equal(panel.style.display, 'none', 'hidden again once the mini-game ends');
  } finally {
    delete global.document; delete global.window;
  }
});

test('Card table: narrativeTextBox is only ever hidden, so nothing depends on showing it', () => {
  // Guards the assumption syncStagePanel rests on. If someone later makes the
  // narrative box visible, the stage panel must stop keying off miniGameActive
  // alone or the story text will be invisible.
  const html = indexHtml();
  const shows = [...html.matchAll(/narrativeTextBox'\)\.style\.display\s*=\s*'([^']*)'/g)]
    .map(m => m[1])
    .filter(v => v !== 'none');
  assert.deepEqual(shows, [],
    'narrativeTextBox is now shown somewhere — syncStagePanel needs to account for it');
});

test('Card table: [ MAP ] is in the action row, not its own panel', () => {
  const html = indexHtml();
  const start = html.indexOf('<section id="game"');
  const end = html.indexOf('<section id="judging"');
  const section = html.slice(start, end);

  const mapIdx = section.indexOf('[ MAP ]');
  assert.ok(mapIdx > -1, 'the map button must still exist');

  // It should share a container with the submit/pass controls rather than
  // sitting in a panel of its own, which cost 59px.
  const submitIdx = section.indexOf('SUBMIT SELECTION');
  assert.ok(submitIdx > -1, 'submit button must exist');
  assert.ok(Math.abs(mapIdx - submitIdx) < 1200,
    'the map button should live near the submit/pass controls, not in a separate panel');
});
