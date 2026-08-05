const test = require('node:test');
const assert = require('node:assert/strict');
const {
  WEATHER_MODES,
  WeatherEffectsSystem
} = require('../src/pixel_engine/weather-effects-system.js');

test('Weather System: Weather modes are defined for CLEAR, RAIN, STEAM_VENT, POLICE_SIRENS, NEON_FLICKER', () => {
  assert.equal(WEATHER_MODES.CLEAR, 'CLEAR');
  assert.equal(WEATHER_MODES.RAIN, 'RAIN');
  assert.equal(WEATHER_MODES.STEAM_VENT, 'STEAM_VENT');
  assert.equal(WEATHER_MODES.POLICE_SIRENS, 'POLICE_SIRENS');
  assert.equal(WEATHER_MODES.NEON_FLICKER, 'NEON_FLICKER');
});

test('Weather System: WeatherEffectsSystem respects strict 4-frame animation budget (0, 1, 2, 3)', () => {
  const weather = new WeatherEffectsSystem(320, 180);
  assert.equal(weather.frameIndex, 0);

  weather.advanceFrame();
  assert.equal(weather.frameIndex, 1);

  weather.advanceFrame();
  assert.equal(weather.frameIndex, 2);

  weather.advanceFrame();
  assert.equal(weather.frameIndex, 3);

  weather.advanceFrame();
  assert.equal(weather.frameIndex, 0, 'Frame index wraps around back to 0');
});

test('Weather System: Mode switching updates activeMode cleanly', () => {
  const weather = new WeatherEffectsSystem(320, 180);
  weather.setMode(WEATHER_MODES.POLICE_SIRENS);
  assert.equal(weather.activeMode, 'POLICE_SIRENS');
});
