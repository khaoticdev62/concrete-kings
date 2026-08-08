const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeDocument() {
  const elements = {};
  let roundResultButton = null;
  const makeEl = () => ({
    textContent: '',
    innerHTML: '',
    style: {},
    classList: { contains() { return false; }, add() {}, remove() {} },
    _attrs: {},
    setAttribute(name, value) { this._attrs[name] = value; },
    getAttribute(name) { return this._attrs[name]; },
    appendChild() {},
    querySelector() { return null; },
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
        if (!roundResultButton) {
          roundResultButton = makeEl();
          roundResultButton.onclick = null;
        }
        return roundResultButton;
      }
      return null;
    },
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(); }
  };
}

test('Resolution auto-advance: starts a timer that auto-advances after 5 seconds', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    const { app } = loadGameModule();
    global.document = fakeDocument();

    let callCount = 0;
    const originalNextRound = app.nextRound.bind(app);
    app.nextRound = () => { callCount++; };

    app.startResolutionAutoAdvance();
    assert.notEqual(app.resolutionTimerHandle, null, 'timer handle should be set synchronously while the countdown is active');

    mock.timers.tick(5000);
    assert.equal(callCount, 1, 'should auto-advance once after 5 seconds');
    app.nextRound = originalNextRound;
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});

test('Resolution auto-advance: does not fire if nextRound already ran', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    const { app } = loadGameModule();
    global.document = fakeDocument();

    let callCount = 0;
    app.nextRound = () => {
      callCount++;
      app.clearResolutionAutoAdvance();
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
  mock.timers.enable({ apis: ['setInterval'] });
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

test('Resolution auto-advance: never arms on a narrative ending, so it cannot race the Review Log', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    const { app, Game, NarrativeStoryEngine } = loadGameModule();
    global.document = fakeDocument();

    app.game = new Game();
    app.game.addPlayer('Player');
    app.humanIndex = 0;
    app.storyEngine = new NarrativeStoryEngine();
    app.storyEngine.reset('BARBER');
    app.storyEngine.beat = 5; // this resolution ends the campaign
    app.game.submissions = [{ player: 'Player', card: 'A stolen police scanner buzzing with codes' }];

    app.chooseWinner(0);

    assert.equal(app.resolutionTimerHandle, null, 'no auto-advance timer should be armed on the ending screen');

    mock.timers.tick(10000); // well past 5s - nothing should happen if the timer was never armed
    assert.equal(app.resolutionTimerHandle, null, 'still no timer after time passes');
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});
