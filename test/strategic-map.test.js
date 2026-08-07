const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Strategic Map: fast-travel availability is correctly gated by location heat', () => {
  const { app } = loadGameModule();
  
  // Set up mock heat levels
  app.locationHeat = {
    'Harlem': 0,
    'Detroit': 3,
    'Chicago': 0
  };
  
  // Harlem has 0 heat -> should be clear
  assert.equal(app.isLocationFastTravelable('Harlem'), true, '0 heat should unlock fast travel');
  
  // Detroit has 3 heat -> should be locked
  assert.equal(app.isLocationFastTravelable('Detroit'), false, 'positive heat should lock fast travel');
});

test('Strategic Map: quest filter controls map symbol visibility states', () => {
  const { app } = loadGameModule();
  
  app.activeQuestFilter = 'ACTIVE';
  assert.equal(app.shouldRenderQuestSymbol('*'), true, 'active filter should render *');
  assert.equal(app.shouldRenderQuestSymbol('!'), false, 'active filter should hide !');
  
  app.activeQuestFilter = 'ALL';
  assert.equal(app.shouldRenderQuestSymbol('?'), true, 'all filter should render ?');
  assert.equal(app.shouldRenderQuestSymbol('!'), true, 'all filter should render !');
});
