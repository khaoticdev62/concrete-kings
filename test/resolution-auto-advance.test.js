const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const { loadGameModule } = require('./helpers/load-app.js');

function fakeButton() {
  return { setAttribute() {}, textContent: '', onclick: null };
}

function fakeDocument(button) {
  const elements = {};
  const makeEl = () => ({
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      contains() { return false; },
      add() {},
      remove() {}
    },
    setAttribute() {},
    appendChild() {},
    querySelectorAll() { return []; }
  });
  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl();
      return elements[id];
    },
    querySelector(sel) {
      if (sel === '#roundResult button') return button;
      return makeEl();
    },
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(); }
  };
}

test('Resolution auto-advance: calls nextRound after 5 seconds if not manually advanced', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    const { app, Game, NarrativeStoryEngine } = loadGameModule();
    const button = fakeButton();
    global.document = fakeDocument(button);

    app.game = new Game();
    app.game.addPlayer('Player');
    app.game.submissions = [{ player: 'Player', card: 'A card' }];
    app.storyEngine = new NarrativeStoryEngine();
    app.storyEngine.reset('BARBER');
    app.humanIndex = 0;
    app.show = () => {};

    let nextRoundCalled = false;
    app.nextRound = () => { nextRoundCalled = true; };

    // Set button onclick manually or simulate chooseWinner writing it
    button.onclick = () => { app.nextRound(); };

    app.chooseWinner(0);
    assert.equal(nextRoundCalled, false, 'should not advance immediately');

    mock.timers.tick(5000);
    assert.equal(nextRoundCalled, true, 'should auto-advance after 5s by invoking the button\'s current handler');
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});
