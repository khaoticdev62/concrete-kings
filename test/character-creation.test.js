const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeDocument() {
  const elements = {};
  const allElements = [];
  const makeEl = (id) => {
    const el = {
      id,
      textContent: '',
      innerHTML: '',
      value: '',
      selectedIndex: 0,
      options: [],
      style: {},
      _classes: new Set(),
      classList: {
        contains(name) { return el._classes.has(name); },
        add(name) { el._classes.add(name); },
        remove(name) { el._classes.delete(name); },
        toggle(name, force) {
          if (typeof force !== 'undefined') {
            if (force) el._classes.add(name); else el._classes.delete(name);
          } else {
            if (el._classes.has(name)) el._classes.delete(name); else el._classes.add(name);
          }
        }
      },
      setAttribute() {},
      appendChild() {},
      querySelectorAll() { return []; },
      querySelector() { return null; },
      getContext() {
        return { imageSmoothingEnabled: false, fillRect() {}, clearRect() {}, fillText() {}, drawImage() {} };
      },
      dispatchEvent() {}
    };
    if (id && /^(hair|fit|prop)-/.test(id)) {
      el._classes.add('appearance-btn');
    }
    allElements.push(el);
    return el;
  };

  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl(id);
      return elements[id];
    },
    querySelector(sel) {
      if (sel === '#roundResult button') {
        const btn = makeEl();
        btn.onclick = null;
        return btn;
      }
      return null;
    },
    querySelectorAll(sel) {
      if (sel.startsWith('.') && sel.length > 1) {
        const className = sel.slice(1);
        return allElements.filter(el => el._classes.has(className));
      }
      return [];
    },
    createElement(tag) { return makeEl(); }
  };
}

test('Character creation: starts at step 1 and step indicator renders', () => {
  global.CHARACTER_ORIGINS = require('../src/pixel_engine/block-map-navigation.js').CHARACTER_ORIGINS;
  const doc = fakeDocument();
  global.document = doc;
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    app.creationStep = 1;
    app.updateCreationStep();
    assert.equal(app.creationStep, 1);
    assert.equal(doc.getElementById('creationStepOrigin').classList.contains('active'), true);
    assert.equal(doc.getElementById('creationStepAppearance').classList.contains('active'), false);
    assert.equal(doc.getElementById('creationStepBackstory').classList.contains('active'), false);
    assert.equal(doc.getElementById('creationStepReview').classList.contains('active'), false);
  } finally {
    delete global.document;
    delete global.window;
    delete global.alert;
  }
});

test('Character creation: next/prev preserves selections', () => {
  const doc = fakeDocument();
  global.document = doc;
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    app.creationStep = 1;
    app.updateCreationStep();
    const originSelect = doc.getElementById('characterOriginSelect');
    originSelect.value = 'BARBER';
    app.nextCreationStep();
    assert.equal(app.creationStep, 2);
    app.nextCreationStep();
    app.nextCreationStep();
    app.nextCreationStep();
    assert.equal(app.creationStep, 4);
    app.prevCreationStep();
    assert.equal(app.creationStep, 3);
    app.prevCreationStep();
    assert.equal(app.creationStep, 2);
    assert.equal(originSelect.value, 'BARBER');
  } finally {
    delete global.document;
    delete global.window;
    delete global.alert;
  }
});

test('Character creation: appearance selection marks tile selected', () => {
  const doc = fakeDocument();
  global.document = doc;
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    app.appearance = { hair: '', fit: '', prop: '' };
    doc.getElementById('hair-fade').classList.add('selected');
    app.selectAppearance('hair', 'waves');
    assert.equal(app.appearance.hair, 'waves');
    assert.equal(doc.getElementById('hair-waves').classList.contains('selected'), true);
    assert.equal(doc.getElementById('hair-fade').classList.contains('selected'), false);
  } finally {
    delete global.document;
    delete global.window;
    delete global.alert;
  }
});

test('Character creation: review dossier populates from current selections', () => {
  const doc = fakeDocument();
  global.document = doc;
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    app.appearance = { hair: 'fade', fit: 'slim', prop: 'chain' };
    const originSelect = doc.getElementById('characterOriginSelect');
    originSelect.value = 'BARBER';
    const secretSelect = doc.getElementById('characterSecretSelect');
    secretSelect.selectedIndex = 1;
    secretSelect.options[1] = { value: 'police_scanner', text: 'Scanner' };
    app.updateReviewDossier();
    const html = doc.getElementById('reviewContent').innerHTML || '';
    assert.ok(html.includes('BACKSTORY SECRET'));
    assert.ok(html.includes('FADE'));
    assert.ok(html.includes('BARBER'));
  } finally {
    delete global.document;
    delete global.window;
    delete global.alert;
  }
});

test('Character creation: review dossier populates via step navigation, not just a direct call', () => {
  const doc = fakeDocument();
  global.document = doc;
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    app.creationStep = 1;
    doc.getElementById('characterOriginSelect').value = 'BARBER';
    doc.getElementById('hostName').value = 'TestHero';

    app.nextCreationStep();
    app.nextCreationStep();
    app.nextCreationStep();

    assert.equal(app.creationStep, 4, 'should land on the review step');
    const html = doc.getElementById('reviewContent').innerHTML || '';
    assert.ok(html.includes('TESTHERO'), 'dossier must be populated by arriving at step 4, not only by a direct updateReviewDossier() call');
    assert.ok(html.includes('BARBER'));
  } finally {
    delete global.document;
    delete global.window;
    delete global.alert;
  }
});

test('Character creation: confirm opens journey modal when valid', () => {
  const doc = fakeDocument();
  global.document = doc;
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    const originSelect = doc.getElementById('characterSecretSelect');
    originSelect.value = 'police_scanner';
    doc.getElementById('characterOriginSelect').value = 'BARBER';
    doc.getElementById('hair-fade').classList.add('selected');
    doc.getElementById('fit-slim').classList.add('selected');
    doc.getElementById('prop-clippers').classList.add('selected');
    app.appearance = { hair: 'fade', fit: 'slim', prop: 'clippers' };
    app.confirmCharacter();
    assert.equal(doc.getElementById('journeyModal').style.display, 'flex');
  } finally {
    delete global.document;
    delete global.window;
    delete global.alert;
  }
});

test('Character creation: randomize fills fields', () => {
  const doc = fakeDocument();
  global.document = doc;
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    const secretSelect = doc.getElementById('characterSecretSelect');
    secretSelect.options = [
      { value: '', text: '[ None ]' },
      { value: 'police_scanner', text: 'Scanner' }
    ];
    secretSelect.selectedIndex = 0;
    app.randomizeCharacter();
    assert.ok(doc.getElementById('characterOriginSelect').value);
    assert.ok(app.appearance.hair);
    assert.ok(app.appearance.fit);
    assert.ok(app.appearance.prop);
    assert.ok(secretSelect.selectedIndex > 0);
  } finally {
    delete global.document;
    delete global.window;
    delete global.alert;
  }
});
