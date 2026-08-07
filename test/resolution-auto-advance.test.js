const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeDocument() {
  const elements = {};
  const makeEl = () => ({
    textContent: '',
    innerHTML: '',
    style: {},
    classList: { contains() { return false; }, add() {}, remove() {} },
    setAttribute() {},
    appendChild() {},
    querySelectorAll() { return []; },
    getContext() {
      return { imageSmoothingEnabled: false, fillRect() {}, clearRect() {}, fillText() {}, drawImage() {} };
    }
  });

  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl();
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
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(); }
  };
}

test('Resolution auto-advance: starts a timer that auto-advances after 5 seconds', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const { app } = loadGameModule();
    global.document = fakeDocument();

    let callCount = 0;
    const originalNextRound = app.nextRound.bind(app);
    app.nextRound = () => { callCount++; };

    app.startResolutionAutoAdvance();
    assert.equal(app.resolutionTimerHandle, null, 'timer handle is not exposed synchronously');

    mock.timers.tick(5000);
    assert.equal(callCount, 1, 'should auto-advance once after 5 seconds');
    app.nextRound = originalNextRound;
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});

test('Resolution auto-advance: does not fire if nextRound already ran', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const { app } = loadGameModule();
    global.document = fakeDocument();

    let callCount = 0;
    app.nextRound = () => {
      callCount++;
      app.resolutionTimerHandle = null;
    };

    app.startResolutionAutoAdvance();
    app.nextRound();
    mock.timers.tick(5000);
    assert.equal(callCount, 1, 'auto-advance must not fire after manual resolution');
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});

test('Resolution auto-advance: invokes the current roundResult button action on timer expiry', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const { app } = loadGameModule();
    const doc = fakeDocument();
    global.document = doc;

    let ended = false;
    const originalEnd = app.endNarrativeGame.bind(app);
    app.endNarrativeGame = () => { ended = true; };

    app.startResolutionAutoAdvance();
    const btn = doc.querySelector('#roundResult button');
    if (btn && btn.setAttribute) btn.setAttribute('onclick', 'app.endNarrativeGame()');

    mock.timers.tick(5000);
    assert.equal(ended, true, 'should invoke the button action when it is the ending action');
    app.endNarrativeGame = originalEnd;
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});
