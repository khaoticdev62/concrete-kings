const test = require('node:test');
const assert = require('node:assert/strict');
const { CinematicCameraEngine, CAMERA_SHOT_TYPES, PLAYBACK_MODES } = require('../src/pixel_engine/cinematic-camera-engine.js');
const { LayeredInspectorEngine } = require('../src/pixel_engine/layered-inspector-engine.js');

test('CinematicCameraEngine: transitions camera shots and applies playback modes cleanly', () => {
  const cam = new CinematicCameraEngine();
  assert.equal(cam.playbackMode, 'AUTO');

  const shotRes = cam.cutToShot('DIALOGUE', { x: 100, y: 50 });
  assert.equal(shotRes.shotType, 'DIALOGUE');
  assert.equal(shotRes.targetZoom, 1.4);

  const frame1 = cam.update(200);
  assert.equal(typeof frame1.zoom, 'number');
  assert.equal(typeof frame1.panX, 'number');

  cam.setPlaybackMode('FAST_FORWARD_2X');
  assert.equal(cam.playbackMode, 'FAST_FORWARD_2X');
});

test('LayeredInspectorEngine: provides 5 inspector levels and quest thread details', () => {
  const inspector = new LayeredInspectorEngine();
  const dummyChar = {
    name: 'Marcus',
    title: 'The Straight Man',
    hp: 85,
    reputation: 60,
    stats: { wit: 14, str: 12, soul: 8, heat: 2 },
    traits: ['Tactician', 'Loyal'],
    history: ['Defended barbershop'],
    mechanics: { tagAffinity: 'church' }
  };

  const l1 = inspector.inspectCharacter(dummyChar);
  assert.equal(l1.name, 'Marcus');
  assert.equal(l1.level, 1);

  const l2 = inspector.setLayer(2);
  assert.equal(l2.stats.wit, 14);

  const l5 = inspector.setLayer(5);
  assert.equal(l5.mechanics.tagAffinity, 'church');

  const threads = inspector.getQuestThreads();
  assert.equal(threads.length >= 4, true);

  const details = inspector.getQuestThreadDetails('MAYORS_REVENGE');
  assert.equal(details.title, "THE MAYOR'S REVENGE");
  assert.equal(details.whoIsInvolved.includes('Marcus'), true);
});
