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
    classList: {
      contains() { return false; },
      add() {},
      remove() {}
    },
    setAttribute() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getContext() {
      return {
        imageSmoothingEnabled: false,
        fillRect() {},
        clearRect() {},
        fillText() {},
        drawImage() {}
      };
    }
  });
  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl();
      return elements[id];
    },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(); }
  };
}

test('Judging countdown: auto-picks a random submission after 12 seconds if the judge has not acted', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    const { app, Game } = loadGameModule();
    global.document = fakeDocument();

    app.game = new Game();
    app.game.addPlayer('Player');
    app.game.addPlayer('Bot');
    app.humanIndex = 0;
    app.game.judgeIndex = 0; // humanIndex is judge
    app.game.submissions = [{ player: 'Bot', card: 'Some card' }];
    app.storyEngine = null;
    app.show = () => {}; // stub screen transitions for this unit test

    let winnerIndexUsed = null;
    app.chooseWinner = (index) => {
      winnerIndexUsed = index;
      app.clearJudgingCountdown();
    };

    app.enterJudging();
    assert.equal(winnerIndexUsed, null, 'should not resolve immediately');

    mock.timers.tick(12000);
    assert.equal(winnerIndexUsed, 0, 'should auto-pick the only submission after 12s');
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});

test('Judging countdown: does not fire if chooseWinner already ran', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    const { app, Game } = loadGameModule();
    global.document = fakeDocument();

    app.game = new Game();
    app.game.addPlayer('Player');
    app.game.addPlayer('Bot');
    app.humanIndex = 0;
    app.game.judgeIndex = 0;
    app.game.submissions = [{ player: 'Bot', card: 'Some card' }];
    app.storyEngine = null;
    app.show = () => {};

    let callCount = 0;
    app.chooseWinner = (index) => {
      callCount++;
      app.clearJudgingCountdown();
    };

    app.enterJudging();
    app.chooseWinner(0); // simulate the judge resolving early
    mock.timers.tick(12000);
    assert.equal(callCount, 1, 'auto-pick must not also fire after an early resolution');
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});

test('Judging countdown: is cleared when the app navigates away from #judging by any route', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    const { app, Game } = loadGameModule();
    global.document = fakeDocument();

    app.game = new Game();
    app.game.addPlayer('Player');
    app.game.addPlayer('Bot');
    app.humanIndex = 0;
    app.game.judgeIndex = 0;
    app.game.submissions = [{ player: 'Bot', card: 'Some card' }];
    app.storyEngine = null;
    app.updateTopHud = () => {};

    let winnerIndexUsed = null;
    const originalChooseWinner = app.chooseWinner.bind(app);
    app.chooseWinner = (index) => { winnerIndexUsed = index; };

    app.enterJudging(); // real show('judging'), arms the countdown
    app.showGame(); // leaves #judging via a route that never calls chooseWinner()

    mock.timers.tick(12000);
    assert.equal(winnerIndexUsed, null, 'auto-pick must not fire after navigating away from #judging');

    app.chooseWinner = originalChooseWinner;
  } finally {
    mock.timers.reset();
    delete global.document;
  }
});
