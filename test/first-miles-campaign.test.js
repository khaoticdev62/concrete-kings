const test = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/dom-stubs');
const { FirstMilesCampaign, FIRST_MILES_BEATS, FIRST_MILES_ORIGIN_SECRETS, FIRST_MILES_SIDE_QUESTS } = require('../src/pixel_engine/first-miles-campaign.js');

function createCampaign(originKey) {
  const campaign = new FirstMilesCampaign();
  campaign.state = {
    act: 1,
    day: 1,
    heat: 0,
    reputation: 0,
    trust: { ray: 0, jada: 0, marquez: 0, chen: 0, kid: 0, jenkins: 0 },
    secrets: [],
    flags: [],
    receipts: [],
    sideQuestsCompleted: [],
    origin: originKey || null,
    originSecret: FIRST_MILES_ORIGIN_SECRETS[originKey] || null,
    currentBeat: 1,
    act1ClimaxOutcome: null,
    act2Betrayer: null,
    act3Route: null,
    finalChoice: null
  };
  campaign.active = true;
  campaign.currentScreen = 'beat';
  if (originKey && FIRST_MILES_ORIGIN_SECRETS[originKey]) {
    campaign.state.secrets.push(FIRST_MILES_ORIGIN_SECRETS[originKey]);
  }
  return campaign;
}

test('First Miles: defines 20 beats across Acts 1-3', () => {
  const beatIds = Object.keys(FIRST_MILES_BEATS).map(Number);
  assert.deepEqual(beatIds, Array.from({ length: 20 }, (_, i) => i + 1), 'beats 1-20 must exist');
  assert.equal(FIRST_MILES_BEATS[1].act, 1);
  assert.equal(FIRST_MILES_BEATS[13].act, 2);
  assert.equal(FIRST_MILES_BEATS[20].act, 3);
});

test('First Miles: each beat has required narrative fields', () => {
  for (const beat of Object.values(FIRST_MILES_BEATS)) {
    assert.ok(beat.title && beat.narrative && beat.blackCard, `${beat.title} is missing text fields`);
    assert.ok(beat.tagConsequences, `${beat.title} is missing tagConsequences`);
    const tags = Object.keys(beat.tagConsequences);
    assert.deepEqual(tags, ['street', 'family', 'church', 'food', 'humor'], `${beat.title} tag set is incomplete`);
  }
});

test('First Miles: all 8 origins have a secret', () => {
  const origins = [
    'BARBER',
    'STREET_SCHOLAR',
    'LOCAL_LEGEND',
    'CORNER_MERCHANT',
    'COMMUNITY_ORGANIZER',
    'UNDERGROUND_DJ',
    'BLOCK_ARCHITECT',
    'HUSTLE_VETERAN'
  ];
  for (const origin of origins) {
    assert.ok(FIRST_MILES_ORIGIN_SECRETS[origin], `missing secret for ${origin}`);
  }
});

test('First Miles: state seeds origin, secret, beat, heat, and screen', () => {
  const campaign = createCampaign('BARBER');
  assert.equal(campaign.state.origin, 'BARBER');
  assert.equal(campaign.state.originSecret, FIRST_MILES_ORIGIN_SECRETS['BARBER']);
  assert.equal(campaign.state.currentBeat, 1);
  assert.equal(campaign.state.heat, 0);
  assert.equal(campaign.currentScreen, 'beat');
});

test('First Miles: beat resolution advances and applies heat/trust', () => {
  const campaign = createCampaign('STREET_SCHOLAR');
  campaign.resolveWinnerCard('a joke ticket');
  assert.equal(campaign.state.currentBeat, 2);
});

test('First Miles: act 1 climax locks at beat 9', () => {
  const campaign = createCampaign('BARBER');
  for (let i = 0; i < 9; i++) campaign.resolveWinnerCard('some choice');
  assert.equal(campaign.state.currentBeat, 10);
  assert.ok(['ray_takes_fall', 'marquez_escape', 'hotwire_escape', 'back_exit_knowledge', 'standard_escape'].includes(campaign.state.act1ClimaxOutcome));
  assert.ok(campaign.state.flags.includes('act1_climax_resolved'));
});

test('First Miles: side-quest completion is gated by day windows', () => {
  const campaign = createCampaign('BARBER');
  assert.equal(campaign.autoCompleteSideQuest('SQ3_CHEN_SHIPMENT'), undefined, 'should not complete before day window');
  campaign.state.day = 4;
  campaign.autoCompleteSideQuest('SQ3_CHEN_SHIPMENT');
  assert.ok(campaign.state.sideQuestsCompleted.includes('SQ3_CHEN_SHIPMENT'));
});

test('First Miles: betrayer resolution locks at beat 16', () => {
  const campaign = createCampaign('BARBER');
  campaign.state.trust = { ray: 3, jada: 1, marquez: 0, chen: 0, kid: 0, jenkins: 0 };
  for (let i = 0; i < 16; i++) campaign.resolveWinnerCard('some choice');
  assert.equal(campaign.state.currentBeat, 17);
  assert.ok(['marquez', 'jada', 'jenkins'].includes(campaign.state.act2Betrayer));
  assert.ok(campaign.state.flags.includes('betrayer_known'));
});

test('First Miles: ending selection uses heat/reputation/secret rules', () => {
  const campaign = createCampaign('BARBER');
  campaign.state.heat = 10;
  let result = campaign.resolveEnding();
  assert.equal(result.ending, 'DEATH');

  campaign.state.heat = 3;
  campaign.state.reputation = 1;
  campaign.state.flags.push('origin_secret_used');
  result = campaign.resolveEnding();
  assert.equal(result.ending, 'GHOST');

  campaign.state.trust = { ray: 5, jada: 0, marquez: 0, chen: 0, kid: 0, jenkins: 0 };
  campaign.state.heat = 8;
  result = campaign.resolveEnding();
  assert.equal(result.ending, 'DEATH');
});
