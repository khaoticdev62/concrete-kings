const test = require('node:test');
const assert = require('node:assert/strict');
const { CardCraftingEngine, CRAFTING_RATES } = require('../src/pixel_engine/card-crafting-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('CardCraftingEngine: crafts cards using dust and disenchants extra cards', () => {
  const storage = mockStorage({ 'ck-dust-balance': '200' });
  const crafting = new CardCraftingEngine({ storage });

  const collection = ['c1', 'c2'];
  const craftRes = crafting.craftCard('c3', 'RARE', collection);

  assert.equal(craftRes.success, true);
  assert.equal(craftRes.remainingDust, 100);
  assert.equal(collection.includes('c3'), true);

  const disenchantRes = crafting.disenchantCard('c3', 'RARE', collection);
  assert.equal(disenchantRes.success, true);
  assert.equal(disenchantRes.newDustBalance, 120);
  assert.equal(collection.includes('c3'), false);
});

test('CardCraftingEngine: mass disenchants duplicate cards (>2 copies)', () => {
  const storage = mockStorage({ 'ck-dust-balance': '0' });
  const crafting = new CardCraftingEngine({ storage });

  // Collection has 4 copies of 'c1' (2 duplicates) and 3 copies of 'c2' (1 duplicate)
  const collection = ['c1', 'c1', 'c1', 'c1', 'c2', 'c2', 'c2'];
  const rarityMap = { c1: 'COMMON', c2: 'RARE' };

  const massRes = crafting.massDisenchantDuplicates(collection, rarityMap);
  assert.equal(massRes.disenchantedCount, 3);
  assert.equal(massRes.totalDustEarned, 5 + 5 + 20); // 2 COMMON (10) + 1 RARE (20) = 30
  assert.equal(collection.length, 4);
});
