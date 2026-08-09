const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CARD_TYPES,
  CARD_CATEGORIES,
  classifyCardCategory,
  CardVisualRenderer
} = require('../src/pixel_engine/card-visual-system.js');

test('Card Visual System: Card categories are properly categorized into 8 distinct groups', () => {
  const categoryKeys = Object.keys(CARD_CATEGORIES);
  assert.equal(categoryKeys.length, 8);
  assert.ok(CARD_CATEGORIES.BLOCK_LOYALTY);
  assert.ok(CARD_CATEGORIES.STREET_COMMERCE);
  assert.ok(CARD_CATEGORIES.URBAN_WISDOM);
  assert.ok(CARD_CATEGORIES.UNDERGROUND_POWER);
  assert.ok(CARD_CATEGORIES.SYSTEMIC_PRESSURE);
  assert.ok(CARD_CATEGORIES.GENTRIFICATION);
  assert.ok(CARD_CATEGORIES.INSTITUTIONAL_TRAP);
  assert.ok(CARD_CATEGORIES.CORPORATE_GREED);
});

test('Card Visual System: classifyCardCategory correctly classifies Black & White cards based on text keywords', () => {
  const blackStudio = classifyCardCategory("____ is the real reason the studio closed early", CARD_TYPES.BLACK);
  assert.equal(blackStudio.id, 'UNDERGROUND_POWER');

  const blackBarber = classifyCardCategory("The barber really said ____", CARD_TYPES.BLACK);
  assert.equal(blackBarber.id, 'STREET_COMMERCE');

  const whiteSiren = classifyCardCategory("a cop who knows your middle name", CARD_TYPES.WHITE);
  assert.equal(whiteSiren.id, 'SYSTEMIC_PRESSURE');

  const whiteCondo = classifyCardCategory("a luxury condo construction crane", CARD_TYPES.WHITE);
  assert.equal(whiteCondo.id, 'GENTRIFICATION');
});

test('Card Visual System: CardVisualRenderer adheres to strict 4-frame shimmer animation budget (0, 1, 2, 3)', () => {
  const renderer = new CardVisualRenderer();
  assert.equal(renderer.shimmerFrame, 0);

  assert.equal(renderer.advanceShimmerFrame(), 1);
  assert.equal(renderer.advanceShimmerFrame(), 2);
  assert.equal(renderer.advanceShimmerFrame(), 3);
  assert.equal(renderer.advanceShimmerFrame(), 0, 'Frame 4 cycles back to 0');
});

test('Card Visuals: text wrapping is memoised, so measureText is not re-run every render', () => {
  // renderCardText re-wraps on every draw, and the shimmer loop redraws cards
  // continuously. measureText forces a text-metrics computation per word per
  // frame, which is the most expensive thing on the card path.
  let measureCalls = 0;
  const ctx = {
    fillStyle: '', font: '', textAlign: '', strokeStyle: '', lineWidth: 1,
    fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, fill() {}, stroke() {}, save() {}, restore() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(s) { measureCalls++; return { width: s.length * 6 }; }
  };

  const renderer = new CardVisualRenderer({ width: 160, height: 240 });
  const text = 'the landlord said the rent is due and the heat is still off';
  const category = { type: CARD_TYPES.BLACK, accent: '#F25438', label: 'TEST' };

  renderer.renderCardText(ctx, text, category);
  const afterFirst = measureCalls;
  assert.ok(afterFirst > 0, 'the first wrap must actually measure');

  for (let i = 0; i < 5; i++) renderer.renderCardText(ctx, text, category);
  assert.equal(measureCalls, afterFirst,
    `repeat renders must hit the cache, but measureText ran ${measureCalls - afterFirst} more times`);
});

test('Card Visuals: the wrap cache is keyed on width, so a differently sized card re-wraps', () => {
  // Keying on text alone would hand a narrow card the line breaks computed for a
  // wide one, silently overflowing it.
  let measureCalls = 0;
  const makeCtx = () => ({
    fillStyle: '', font: '', textAlign: '', strokeStyle: '', lineWidth: 1,
    fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, fill() {}, stroke() {}, save() {}, restore() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(s) { measureCalls++; return { width: s.length * 6 }; }
  });
  const text = 'a completely different string for this width keying test';
  const category = { type: CARD_TYPES.WHITE, accent: '#FFCD68', label: 'TEST' };

  new CardVisualRenderer({ width: 160, height: 240 }).renderCardText(makeCtx(), text, category);
  const afterWide = measureCalls;
  new CardVisualRenderer({ width: 96, height: 240 }).renderCardText(makeCtx(), text, category);
  assert.ok(measureCalls > afterWide, "a new width must recompute rather than reuse another width's wrap");
});
