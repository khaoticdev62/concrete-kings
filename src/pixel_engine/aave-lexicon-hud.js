/**
 * Concrete Kings: The Block Chronicles
 * AAVE Cultural Lexicon & Glossary HUD Engine
 * Version: 1.0.0
 */

const AAVE_LEXICON = [
  { term: 'Cookout', definition: 'The central communal gathering place where food, family, music, and block politics intersect.' },
  { term: 'Receipts', definition: 'Undeniable proof, documentation, or historical debt owed between players on the block.' },
  { term: 'O.G.', definition: 'Original Gangster / Elder Leader. Holds judging authority and veto power over rounds.' },
  { term: 'The Block', definition: 'The spatial neighborhood community and primary setting for all hustle activities.' },
  { term: 'Spades', definition: 'High-stakes trick-taking card game played with intense focus and unwritten rules.' },
  { term: 'Lineup', definition: 'Precision hair edge grooming provided by a master barber.' },
  { term: 'Durag', definition: 'Protective headwear worn to preserve hairstyle waves and braids.' },
  { term: 'Bodega', definition: 'Corner store serving as neighborhood lifeline, bank, and information hub.' },
  { term: 'Street Cred', definition: 'Respect and reputation earned through authentic hustle and community loyalty.' },
  { term: 'Cipher', definition: 'Circle of rappers, beatmakers, or thinkers exchanging rhymed verses or ideas.' }
];

class AAVELexiconHUD {
  constructor() {
    this.lexicon = AAVE_LEXICON;
    this.searchTerm = '';
  }

  getFilteredTerms(query = '') {
    if (!query) return this.lexicon;
    const q = query.toLowerCase();
    return this.lexicon.filter(item => 
      item.term.toLowerCase().includes(q) || 
      item.definition.toLowerCase().includes(q)
    );
  }

  lookupTerm(word) {
    const found = this.lexicon.find(item => item.term.toLowerCase() === word.toLowerCase());
    return found ? found.definition : null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AAVE_LEXICON,
    AAVELexiconHUD
  };
}

if (typeof window !== 'undefined') {
  window.AAVE_LEXICON = AAVE_LEXICON;
  window.AAVELexiconHUD = AAVELexiconHUD;
}
