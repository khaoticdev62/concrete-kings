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

test('Card Visual System: renderCardText memoizes word-wrap so repeated renders of the same text skip measureText', () => {
  const renderer = new CardVisualRenderer();
  let measureCalls = 0;
  const mockCtx = {
    fillStyle: '', font: '', textAlign: '', lineWidth: 0, strokeStyle: '',
    fillRect() {}, fillText() {}, strokeRect() {},
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
    moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
    measureText(str) { measureCalls++; return { width: str.length * 6 }; }
  };
  const category = CARD_CATEGORIES.BLOCK_LOYALTY;
  const text = 'A recurring caption that should only be measured once';

  renderer.renderCard(mockCtx, text, category, false);
  const firstPassCalls = measureCalls;
  assert.ok(firstPassCalls > 0, 'first render must measure text at least once');

  renderer.renderCard(mockCtx, text, category, false);
  assert.equal(measureCalls, firstPassCalls, 'second render of identical text must not call measureText again');
});
