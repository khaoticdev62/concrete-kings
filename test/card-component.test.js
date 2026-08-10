const test = require('node:test');
const assert = require('node:assert/strict');
const { renderCardHtml, CK_CARD_CATEGORIES, CK_CARD_RARITIES } = require('../src/pixel_engine/card-component.js');

test('CardComponent: renders card HTML with category, rarity, recommendation tag, and canon glow', () => {
  const card = {
    id: 'c1',
    title: 'The Suspicious Pigeon',
    description: 'A pigeon that knows too much.',
    category: 'CHAOS',
    rarity: 'EPIC',
    tags: ['CHAOS +4', 'ABSURDITY +5']
  };

  const recommendation = { label: 'CHAOTIC', color: '#ff7fbf' };
  const html = renderCardHtml(card, { state: 'FOCUSED', recommendation });

  assert.equal(html.includes('The Suspicious Pigeon'), true);
  assert.equal(html.includes('CHAOS'), true);
  assert.equal(html.includes('EPIC'), true);
  assert.equal(html.includes('CHAOTIC'), true);
  assert.equal(html.includes('card-state-focused'), true);
});

test('CardComponent: renders Canon Card with gold border glow and CANON badge', () => {
  const card = {
    id: 'canon1',
    title: 'The Mayor\'s Betrayal',
    description: 'Permanent canon event card.',
    isCanon: true
  };

  const html = renderCardHtml(card);
  assert.equal(html.includes('ck-card-canon'), true);
  assert.equal(html.includes('CANON'), true);
});
