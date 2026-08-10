const test = require('node:test');
const assert = require('node:assert/strict');
const { CardHolofoilEngine, HOLOFOIL_RARITY_STYLES, HUD_FRAME_PRESETS } = require('../src/pixel_engine/card-holofoil-engine.js');

test('CardHolofoilEngine: maps card rarities to distinct holofoil styles', () => {
  const engine = new CardHolofoilEngine();

  const common = engine.getStyleForRarity('COMMON');
  assert.equal(common.name, 'MATTE_STREET');
  assert.equal(common.hasShimmer, false);

  const rare = engine.getStyleForRarity('RARE');
  assert.equal(rare.name, 'SILVER_FOIL');
  assert.equal(rare.hasShimmer, true);

  const epic = engine.getStyleForRarity('EPIC');
  assert.equal(epic.name, 'GOLD_FOIL');
  assert.equal(epic.hasShimmer, true);

  const legendary = engine.getStyleForRarity('LEGENDARY');
  assert.equal(legendary.name, 'HOLO_FLAME');
  assert.equal(legendary.particles, true);
});

test('CardHolofoilEngine: manages HUD theme presets cleanly', () => {
  const engine = new CardHolofoilEngine();
  assert.equal(engine.activeHudTheme, 'STANDARD_STREET');

  const setOk = engine.setHudTheme('NEON_CITY');
  assert.equal(setOk, true);
  assert.equal(engine.activeHudTheme, 'NEON_CITY');

  const theme = engine.getHudTheme('NEON_CITY');
  assert.equal(theme.borderColor, '#06b6d4');

  const invalidSet = engine.setHudTheme('UNKNOWN_THEME');
  assert.equal(invalidSet, false);
});

test('CardHolofoilEngine: canvas holofoil renderer runs without errors', () => {
  const engine = new CardHolofoilEngine();

  let drawCalls = [];
  const mockCtx = {
    save() { drawCalls.push('save'); },
    restore() { drawCalls.push('restore'); },
    createLinearGradient() {
      return { addColorStop() {} };
    },
    fillRect() { drawCalls.push('fillRect'); }
  };

  engine.renderCanvasHolofoil(mockCtx, 160, 240, 'LEGENDARY', 1000);
  assert.equal(drawCalls.includes('save'), true);
  assert.equal(drawCalls.includes('fillRect'), true);
  assert.equal(drawCalls.includes('restore'), true);
});
