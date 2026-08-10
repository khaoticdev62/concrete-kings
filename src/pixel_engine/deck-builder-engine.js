/**
 * Concrete Kings: The Block Chronicles
 * Deck Builder & Deck Management Engine (Checklist Section 1.2 & Priority Matrix #1)
 *
 * Manages multiple deck slots, deck validation rules (40-60 cards, max 2 copies),
 * deck export/import strings, and random deck generation.
 */

class DeckBuilderEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.maxSlots = options.maxSlots || 10;
    this.decks = this.loadDecks();
  }

  loadDecks() {
    if (!this.storage) return this.getDefaultDecks();
    try {
      const raw = this.storage.getItem('ck-deck-slots');
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : this.getDefaultDecks();
      }
    } catch (e) {}
    return this.getDefaultDecks();
  }

  saveDecks() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-deck-slots', JSON.stringify(this.decks));
    } catch (e) {}
  }

  getDefaultDecks() {
    return [
      {
        id: 'deck_starter_harlem',
        name: 'Harlem Starter Deck',
        cards: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10',
                'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10',
                'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18', 'c19', 'c20',
                'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18', 'c19', 'c20']
      }
    ];
  }

  validateDeck(cards = []) {
    const errors = [];

    if (!Array.isArray(cards)) {
      return { valid: false, errors: ['Invalid card collection provided.'] };
    }

    if (cards.length < 40) {
      errors.push(`Deck requires at least 40 cards (currently ${cards.length}).`);
    } else if (cards.length > 60) {
      errors.push(`Deck cannot exceed 60 cards (currently ${cards.length}).`);
    }

    // Max 2 copies rule
    const counts = {};
    cards.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > 2) {
        if (!errors.includes(`Cannot include more than 2 copies of card '${id}'.`)) {
          errors.push(`Cannot include more than 2 copies of card '${id}'.`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  saveDeckSlot(slotId, name, cards) {
    const validation = this.validateDeck(cards);
    const existingIdx = this.decks.findIndex(d => d.id === slotId);

    const deckData = {
      id: slotId || `deck_${Date.now()}`,
      name: name || 'Custom Deck',
      cards: [...cards],
      isValid: validation.valid
    };

    if (existingIdx >= 0) {
      this.decks[existingIdx] = deckData;
    } else {
      if (this.decks.length >= this.maxSlots) {
        return { success: false, reason: `Maximum deck slots (${this.maxSlots}) reached.` };
      }
      this.decks.push(deckData);
    }

    this.saveDecks();
    return { success: true, deck: deckData, validation };
  }

  deleteDeckSlot(slotId) {
    if (this.decks.length <= 1) {
      return { success: false, reason: 'Must keep at least one deck slot.' };
    }
    this.decks = this.decks.filter(d => d.id !== slotId);
    this.saveDecks();
    return { success: true };
  }

  exportDeckCode(deck) {
    if (!deck || !Array.isArray(deck.cards)) return null;
    const payload = JSON.stringify({ n: deck.name, c: deck.cards });
    try {
      if (typeof btoa !== 'undefined') {
        return `CK1_${btoa(payload)}`;
      } else {
        return `CK1_${Buffer.from(payload).toString('base64')}`;
      }
    } catch (e) {
      return null;
    }
  }

  importDeckCode(code) {
    if (!code || !code.startsWith('CK1_')) return { success: false, reason: 'Invalid deck code format.' };
    const raw = code.replace('CK1_', '');
    try {
      let jsonStr;
      if (typeof atob !== 'undefined') {
        jsonStr = atob(raw);
      } else {
        jsonStr = Buffer.from(raw, 'base64').toString('utf8');
      }
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !Array.isArray(parsed.c)) {
        return { success: false, reason: 'Corrupted deck payload.' };
      }
      return {
        success: true,
        deck: {
          name: parsed.n || 'Imported Deck',
          cards: parsed.c
        },
        validation: this.validateDeck(parsed.c)
      };
    } catch (e) {
      return { success: false, reason: 'Failed to parse deck code.' };
    }
  }

  generateRandomDeck(cardPool = [], deckName = 'Random Street Deck') {
    if (!cardPool || cardPool.length === 0) return null;
    const cards = [];
    const poolCopy = [...cardPool];
    const counts = {};

    while (cards.length < 40) {
      const card = poolCopy[Math.floor(Math.random() * poolCopy.length)];
      const id = typeof card === 'string' ? card : card.id;
      if ((counts[id] || 0) < 2) {
        cards.push(id);
        counts[id] = (counts[id] || 0) + 1;
      }
    }

    return {
      name: deckName,
      cards,
      isValid: true
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DeckBuilderEngine };
}
if (typeof window !== 'undefined') {
  window.DeckBuilderEngine = DeckBuilderEngine;
}
