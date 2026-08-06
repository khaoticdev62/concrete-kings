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

test('Weather System: renderNeonFlicker cycles a 4-stage alpha curve baked into fillStyle, never touching globalAlpha', () => {
  const system = new WeatherEffectsSystem(320, 180);
  system.setMode(WEATHER_MODES.NEON_FLICKER);

  const fillStyles = [];
  const ctx = new Proxy({}, {
    set(target, prop, value) {
      if (prop === 'globalAlpha') {
        throw new Error('renderNeonFlicker must not use ctx.globalAlpha during gameplay');
      }
      if (prop === 'fillStyle') fillStyles.push(value);
      target[prop] = value;
      return true;
    },
    get(target, prop) {
      if (prop === 'fillRect') return () => {};
      return target[prop];
    }
  });

  for (let i = 0; i < 4; i++) {
    system.render(ctx);
    system.advanceFrame();
  }

  const alphas = fillStyles.map(s => Number(s.match(/,\s*([\d.]+)\)$/)[1]));
  assert.deepEqual(alphas, [1, 0.7, 1, 0.9]);
});
