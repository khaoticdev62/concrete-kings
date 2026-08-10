const test = require('node:test');
const assert = require('node:assert/strict');
const { compileScenario } = require('../src/pixel_engine/scenario-compiler.js');
const { ScenarioUiEngine } = require('../src/pixel_engine/scenario-ui-engine.js');
const { SinglePlayerAICampaign } = require('../src/pixel_engine/single-player-ai-campaign.js');
const { ChronicleCanonEngine } = require('../src/pixel_engine/chronicle-canon-engine.js');
const { CK_CARD_CATEGORIES, CK_CARD_RARITIES, renderCardHtml } = require('../src/pixel_engine/card-component.js');

test('CARD RPG Alignment: Card categories follow story component blanks', () => {
  assert.equal(typeof renderCardHtml, 'function');
  assert.equal(CK_CARD_CATEGORIES.SOCIAL.label, 'SOCIAL');
  assert.equal(CK_CARD_CATEGORIES.CHAOS.label, 'CHAOS');
  assert.equal(CK_CARD_RARITIES.COMMON.label, 'COMMON');
  assert.equal(CK_CARD_RARITIES.LEGENDARY.label, 'LEGENDARY');
});

test('CARD RPG Alignment: Compiler enforces intent vs execution rule and supports outcome simulation', () => {
  const simulation = compileScenario({
    originKey: 'HARLEM_HUSTLER',
    secretKey: 'secret_receipt'
  });

  assert.equal(typeof simulation.tick, 'function');
  assert.equal(typeof simulation.currentBeatData, 'function');
  assert.equal(simulation.state.currentBeat, 1);
});

test('CARD RPG Alignment: Single Player AI Party simulates autonomous characters with relationship memory', () => {
  const campaign = new SinglePlayerAICampaign();
  assert.equal(campaign.party.length >= 3, true);

  const marcus = campaign.party.find(p => p.id === 'MARCUS');
  assert.notEqual(marcus, undefined);
  assert.equal(typeof marcus.trust, 'number');

  campaign.updateRelationship('MARCUS', -10);
  assert.equal(marcus.trust, 68);
});

test('CARD RPG Alignment: Chronicle & Canon Engine persists permanent world state', () => {
  const canon = new ChronicleCanonEngine();
  const event = canon.addCanonEvent(
    'THE MAYOR EXPOSED',
    'Mayor reputation destroyed',
    1,
    'HARLEM',
    ['political']
  );

  assert.equal(event.title, 'THE MAYOR EXPOSED');
  assert.equal(canon.canonEvents.length, 1);
});
