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

test('Weather System: neon flicker runs a 4-stage alpha curve baked into fillStyle', () => {
  // Two states (on/off) reads as a fault rather than a flicker. The curve is
  // [1, 0.7, 1, 0.9] across the strict 4-frame budget, and the alpha has to live
  // in the rgba() string: globalAlpha is global state and leaks into every
  // subsequent draw if anything returns early between set and reset.
  const system = new WeatherEffectsSystem(320, 180);
  system.setMode(WEATHER_MODES.NEON_FLICKER);

  const fillStyles = [];
  const ctx = {
    set globalAlpha(v) {
      throw new Error('neon flicker must not touch ctx.globalAlpha during gameplay');
    },
    get globalAlpha() { return 1; },
    set fillStyle(v) { fillStyles.push(v); },
    get fillStyle() { return fillStyles[fillStyles.length - 1]; },
    fillRect() {}, beginPath() {}, arc() {}, ellipse() {}, fill() {}, stroke() {},
    save() {}, restore() {}
  };

  for (let i = 0; i < 4; i++) {
    system.render(ctx);
    system.advanceFrame();
  }

  const alphas = fillStyles
    .filter(s => typeof s === 'string' && s.startsWith('rgba('))
    .map(s => Number(s.match(/,\s*([\d.]+)\)$/)[1]));
  assert.deepEqual(alphas, [1, 0.7, 1, 0.9]);
});

test('Weather System: the flicker curve stays within the 4-frame budget', () => {
  // Advancing past frame 3 must wrap, not run a fifth value.
  const system = new WeatherEffectsSystem(320, 180);
  system.setMode(WEATHER_MODES.NEON_FLICKER);
  const seen = [];
  const ctx = {
    set fillStyle(v) { seen.push(v); }, get fillStyle() { return ''; },
    fillRect() {}, beginPath() {}, arc() {}, ellipse() {}, fill() {}, stroke() {},
    save() {}, restore() {}
  };
  for (let i = 0; i < 8; i++) { system.render(ctx); system.advanceFrame(); }
  const alphas = seen.filter(s => s.startsWith('rgba(')).map(s => Number(s.match(/,\s*([\d.]+)\)$/)[1]));
  assert.deepEqual(alphas.slice(0, 4), alphas.slice(4, 8), 'the curve must repeat every 4 frames');
});
