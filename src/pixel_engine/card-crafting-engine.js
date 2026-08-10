/**
 * Concrete Kings: The Block Chronicles
 * Card Crafting & Disenchanting System (Checklist Section 7.4 & Priority Matrix #3)
 *
 * Manages Receipt Dust balance, crafting missing cards, disenchanting extra cards,
 * and mass disenchanting duplicate cards (>2 copies).
 */

const CRAFTING_RATES = {
  COMMON: { craft: 40, disenchant: 5 },
  RARE: { craft: 100, disenchant: 20 },
  EPIC: { craft: 400, disenchant: 100 },
  LEGENDARY: { craft: 1600, disenchant: 400 }
};

class CardCraftingEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.dustBalance = this.loadDustBalance();
  }

  loadDustBalance() {
    if (!this.storage) return 100;
    try {
      const val = parseInt(this.storage.getItem('ck-dust-balance') || '100', 10);
      return isNaN(val) ? 100 : val;
    } catch (e) {
      return 100;
    }
  }

  saveDustBalance() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-dust-balance', this.dustBalance.toString());
    } catch (e) {}
  }

  getCraftCost(rarity = 'COMMON') {
    const key = (rarity || 'COMMON').toUpperCase();
    return CRAFTING_RATES[key] ? CRAFTING_RATES[key].craft : 40;
  }

  getDisenchantValue(rarity = 'COMMON') {
    const key = (rarity || 'COMMON').toUpperCase();
    return CRAFTING_RATES[key] ? CRAFTING_RATES[key].disenchant : 5;
  }

  addDust(amount) {
    if (typeof amount !== 'number' || amount <= 0) return this.dustBalance;
    this.dustBalance += amount;
    this.saveDustBalance();
    return this.dustBalance;
  }

  craftCard(cardId, rarity = 'COMMON', collection = []) {
    const cost = this.getCraftCost(rarity);
    if (this.dustBalance < cost) {
      return { success: false, reason: `Insufficient Receipt Dust (${this.dustBalance} / ${cost}).` };
    }

    this.dustBalance -= cost;
    this.saveDustBalance();
    collection.push(cardId);

    return {
      success: true,
      cardId,
      cost,
      remainingDust: this.dustBalance,
      updatedCollection: collection
    };
  }

  disenchantCard(cardId, rarity = 'COMMON', collection = []) {
    const idx = collection.indexOf(cardId);
    if (idx === -1) {
      return { success: false, reason: `Card '${cardId}' not owned in collection.` };
    }

    const val = this.getDisenchantValue(rarity);
    collection.splice(idx, 1);
    this.dustBalance += val;
    this.saveDustBalance();

    return {
      success: true,
      cardId,
      dustEarned: val,
      newDustBalance: this.dustBalance,
      updatedCollection: collection
    };
  }

  massDisenchantDuplicates(collection = [], rarityMap = {}) {
    const counts = {};
    const toRemove = [];
    let totalDust = 0;

    collection.forEach(cardId => {
      counts[cardId] = (counts[cardId] || 0) + 1;
      if (counts[cardId] > 2) {
        toRemove.push(cardId);
        const rarity = rarityMap[cardId] || 'COMMON';
        totalDust += this.getDisenchantValue(rarity);
      }
    });

    toRemove.forEach(cardId => {
      const idx = collection.indexOf(cardId);
      if (idx !== -1) collection.splice(idx, 1);
    });

    this.dustBalance += totalDust;
    this.saveDustBalance();

    return {
      disenchantedCount: toRemove.length,
      totalDustEarned: totalDust,
      newDustBalance: this.dustBalance,
      updatedCollection: collection
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CardCraftingEngine, CRAFTING_RATES };
}
if (typeof window !== 'undefined') {
  window.CardCraftingEngine = CardCraftingEngine;
  window.CRAFTING_RATES = CRAFTING_RATES;
}
