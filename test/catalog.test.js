const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Mini-Game Catalog: screen transitions and mock launches function', () => {
  const { app } = loadGameModule();
  
  let activeScreen = '';
  app.show = (id) => { activeScreen = id; };
  
  app.showMinigameCatalog();
  assert.equal(activeScreen, 'minigameCatalog', 'should transit to minigameCatalog screen');

  let launchedGame = '';
  app.miniGameManager = {
    start(id, opts) {
      launchedGame = id;
    }
  };

  app.launchCatalogMinigame('lockpicking');
  assert.equal(launchedGame, 'lockpicking', 'should launch lockpicking challenge');
});
