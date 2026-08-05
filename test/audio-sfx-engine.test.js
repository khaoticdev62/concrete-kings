const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ChiptuneAudioEngine
} = require('../src/pixel_engine/audio-sfx-engine.js');

test('Chiptune Audio Engine: Audio engine initializes cleanly with volume & mute controls', () => {
  const audio = new ChiptuneAudioEngine();
  assert.equal(audio.isMuted, false);
  assert.equal(audio.masterVolume, 0.3);

  audio.setMuted(true);
  assert.equal(audio.isMuted, true);

  audio.setVolume(0.8);
  assert.equal(audio.masterVolume, 0.8);
});

test('Chiptune Audio Engine: Sound triggers execute without throwing in headless mode', () => {
  const audio = new ChiptuneAudioEngine();
  assert.doesNotThrow(() => {
    audio.playCardFlip();
    audio.playGoldShimmer();
    audio.playDiceRoll();
    audio.playSodiumHum();
    audio.playVictoryFanfare();
  });
});

test('Chiptune Audio Engine: BGM start and stop execute cleanly without throwing', () => {
  const audio = new ChiptuneAudioEngine();
  assert.doesNotThrow(() => {
    audio.startBGM('Harlem');
    assert.equal(audio.isPlayingBGM, true);
    audio.stopBGM();
    assert.equal(audio.isPlayingBGM, false);
  });
});
