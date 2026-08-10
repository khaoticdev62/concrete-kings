const test = require('node:test');
const assert = require('node:assert/strict');
const { DeckBuilderEngine } = require('../src/pixel_engine/deck-builder-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('DeckBuilderEngine: validates 40-60 card count and max 2 copies rule', () => {
  const deckBuilder = new DeckBuilderEngine({ storage: mockStorage() });

  // Too few cards (<40)
  const resTooFew = deckBuilder.validateDeck(['c1', 'c2']);
  assert.equal(resTooFew.valid, false);

  // Valid 40 card deck (20 distinct pairs)
  const validCards = [];
  for (let i = 1; i <= 20; i++) {
    validCards.push(`card_${i}`, `card_${i}`);
  }
  const resValid = deckBuilder.validateDeck(validCards);
  assert.equal(resValid.valid, true);

  // Invalid >2 copies rule
  const invalidCopies = [...validCards];
  invalidCopies.push('card_1');
  const resCopies = deckBuilder.validateDeck(invalidCopies);
  assert.equal(resCopies.valid, false);
});

test('DeckBuilderEngine: supports deck code export and import', () => {
  const deckBuilder = new DeckBuilderEngine({ storage: mockStorage() });
  const deck = { name: 'Harlem Street Deck', cards: ['c1', 'c1', 'c2', 'c2'] };

  const code = deckBuilder.exportDeckCode(deck);
  assert.equal(code.startsWith('CK1_'), true);

  const imported = deckBuilder.importDeckCode(code);
  assert.equal(imported.success, true);
  assert.equal(imported.deck.name, 'Harlem Street Deck');
  assert.equal(imported.deck.cards.length, 4);
});
