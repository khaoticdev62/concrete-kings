const test = require('node:test');
const assert = require('node:assert/strict');
const { AudioHapticsEngine, AUDIO_EVENTS, AUDIO_HAPTIC_PATTERNS } = require('../src/pixel_engine/audio-haptics-engine.js');

test('AudioHapticsEngine: configures audio events and haptic vibration patterns', () => {
  const engine = new AudioHapticsEngine();
  assert.equal(AUDIO_EVENTS.FOCUS.freq, 440);
  assert.equal(AUDIO_EVENTS.SELECT.freq, 587);
  assert.equal(AUDIO_EVENTS.SUBMIT.freq, 880);
  assert.equal(AUDIO_HAPTIC_PATTERNS.CARD_LOCKED[0], 50);
});

test('AudioHapticsEngine: manages volume controls and haptic toggles cleanly', () => {
  const engine = new AudioHapticsEngine({ masterVolume: 0.5, sfxVolume: 0.7, enableHaptics: true });
  assert.equal(engine.masterVolume, 0.5);
  assert.equal(engine.sfxVolume, 0.7);

  engine.setVolume(1.0, 0.9);
  assert.equal(engine.sfxVolume, 1.0);
  assert.equal(engine.masterVolume, 0.9);

  engine.toggleHaptics(false);
  assert.equal(engine.enableHaptics, false);
});
