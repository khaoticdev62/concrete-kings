/**
 * Concrete Kings: The Block Chronicles
 * The Block Remembers — canon ledger, block legends, callbacks.
 *
 * Adapted from CARD RPG.md sections 16, 17, 28, 42, 53 and 62-63. See
 * docs/superpowers/specs/2026-08-09-block-remembers-canon-design.md for what was
 * adapted and what was deliberately left out.
 *
 * The problem this solves: the game forgets every card the instant a round ends. A
 * crowned card awards a point and vanishes. Nothing accumulates, nothing recurs, and
 * nothing a player did in round three is ever referenced in round ten — which is the
 * one thing the PRD calls the whole product (section 73).
 *
 * Prefixed globals, because in the browser these files load as classic <script> tags
 * sharing one scope; a bare `const STOPWORDS` would collide with another module and
 * stop this file parsing, which node's per-module scope hides entirely.
 *
 * DETERMINISM IS A HARD REQUIREMENT (PRD section 64). Nothing here calls Math.random.
 * Motifs, tiers and callbacks are pure functions of the crowned-card history, so two
 * clients replaying the same rounds derive the same ledger. The game has an online
 * mode; a ledger that differs per client is a desync that would surface as players
 * seeing different endings.
 */

/**
 * Words that carry no motif weight.
 *
 * Deliberately short. An aggressive stoplist strips exactly the vivid nouns that make
 * a block legend — "pigeon", "cooler", "mixtape" — so this removes grammar and the
 * handful of filler nouns the card database leans on, and nothing else.
 */
const CANON_STOPWORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'your', 'youre', 'been', 'have', 'has',
  'was', 'were', 'they', 'them', 'their', 'there', 'then', 'than', 'what', 'when',
  'who', 'whose', 'will', 'would', 'could', 'should', 'about', 'into', 'onto', 'over',
  'just', 'only', 'even', 'ever', 'never', 'always', 'still', 'some', 'every', 'each',
  'more', 'most', 'much', 'many', 'very', 'also', 'like', 'here', 'because', 'while',
  'after', 'before', 'again', 'both', 'nobody', 'somebody', 'anybody', 'everybody',
  'something', 'nothing', 'anything', 'everything', 'gonna', 'wanna', 'aint', 'dont',
  'didnt', 'cant', 'wont', 'isnt', 'arent', 'thats', 'whos', 'lets', 'yall'
]);

/**
 * Mentions needed for each tier.
 *
 * Low on purpose. A session ends at 7 points, so perhaps 12-20 rounds — the PRD's
 * raccoon reaching a faction at seven mentions assumes a 40-round campaign. At these
 * thresholds a motif can plausibly complete its arc inside one sitting, which is the
 * only way a player ever sees the payoff.
 */
const CANON_TIERS = [
  { at: 9, tier: 'INSTITUTION', label: 'runs things around here' },
  { at: 5, tier: 'LEGEND', label: 'is a block legend now' },
  { at: 3, tier: 'KNOWN', label: 'is known on the block' }
];

/**
 * Weight given to the head noun of a card, versus 1 for every other word in it.
 *
 * Without this every word accumulated equally and the block's legends came out as
 * adjectives: three plays of "an extremely confident pigeon" promoted `extremely`,
 * `confident` and `pigeon` identically, ties broke alphabetically, and the ending line
 * read "The block runs on CONFIDENT now." Nonsense, and it would have shipped.
 *
 * English noun phrases put the head last — "an extremely confident pigeon", "a
 * suspiciously wet briefcase", "unpaid parking tickets" — so the final significant word
 * is the thing the card is actually about. Weighting it double makes it outrun its own
 * modifiers without ever excluding them: a card that mentions the pigeon in passing
 * still counts towards the pigeon.
 *
 * The tier thresholds above are scaled to match, so the head noun of a card still
 * reaches LEGEND on its third crowning.
 */
const CANON_HEAD_WEIGHT = 2;

/** REP paid for playing into an established legend. The callback payoff. */
const CANON_CALLBACK_REP = 2;

/**
 * Card-text tag lexicon.
 *
 * The cards are 1137 lines of plain strings generated from the card database, with no
 * metadata (PRD sections 8 and 45 assume there is some). Hand-tagging them would drift
 * from the generator the next time it runs, so tags are inferred from the text instead.
 *
 * Only the four axes the game already tracks — anything else would be a stat nobody
 * displays. A card matching nothing is untagged and scores on humour alone, which is
 * the honest default: most white cards are jokes, not crimes.
 */
const CANON_TAG_LEXICON = {
  heat: ['police', 'cop', 'cops', 'warrant', 'cuffs', 'snitch', 'snitching', 'evidence',
    'arrest', 'arrested', 'jail', 'precinct', 'siren', 'sirens', 'detective', 'raid',
    'stolen', 'steal', 'stealing', 'gun', 'strapped', 'bolo', 'ticket', 'tickets'],
  cash: ['rent', 'money', 'cash', 'bag', 'hustle', 'hustling', 'work', 'paid', 'pay',
    'dollar', 'dollars', 'check', 'wage', 'bills', 'bill', 'broke', 'loan', 'debt'],
  trust: ['mama', 'grandma', 'auntie', 'uncle', 'cousin', 'family', 'church', 'choir',
    'block', 'neighbor', 'neighbour', 'stoop', 'cookout', 'barbershop', 'bodega'],
  disrespect: ['snitch', 'snake', 'clown', 'busted', 'exposed', 'lying', 'lied', 'fake',
    'cheap', 'weak', 'embarrassing', 'played']
};

/** Stat deltas per inferred tag. Small: a round should nudge, not swing. */
const CANON_TAG_EFFECTS = {
  heat: { heat: 1 },
  cash: { cash: 1 },
  trust: { trust: 1 },
  disrespect: { reputation: -1 }
};

/** Normalises card text to comparable lowercase word tokens. */
function canonTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[‘’']/g, '')      // don't -> dont, so the stoplist catches it
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Motif candidates in a card: significant words of four letters or more.
 *
 * Four rather than three, because three-letter words in this deck are almost entirely
 * grammar ("was", "his", "got") and the ones that are not ("gun", "cop") are already
 * covered by the tag lexicon, where they matter mechanically rather than as a motif.
 */
function canonMotifs(text) {
  const seen = new Set();
  canonTokens(text).forEach(word => {
    if (word.length < 4) return;
    if (CANON_STOPWORDS.has(word)) return;
    if (/^\d+$/.test(word)) return;
    // Adverbs are never the joke. In this deck an -ly word is essentially always one
    // ("extremely", "suspiciously", "accidentally") and it modifies the thing the block
    // would actually remember rather than being it.
    if (/ly$/.test(word)) return;
    seen.add(word);
  });
  return [...seen];
}

/**
 * The word a card is *about* — its last significant token.
 *
 * See CANON_HEAD_WEIGHT for why this exists and what it prevents.
 */
function canonHeadMotif(text) {
  const motifs = canonMotifs(text);
  if (!motifs.length) return null;
  const order = canonTokens(text);
  // canonMotifs returns insertion order, but be explicit rather than relying on it.
  for (let i = order.length - 1; i >= 0; i--) {
    if (motifs.includes(order[i])) return order[i];
  }
  return motifs[motifs.length - 1];
}

/** Tags inferred from a card's text, deduplicated and stable in order. */
function canonTags(text) {
  const words = new Set(canonTokens(text));
  return Object.keys(CANON_TAG_LEXICON)
    .filter(tag => CANON_TAG_LEXICON[tag].some(word => words.has(word)));
}

class BlockLedger {
  constructor(options = {}) {
    /** Every recorded event, in order. The PRD's structured event log (section 62). */
    this.events = [];
    /** motif -> mention count. */
    this.motifs = new Map();
    /** motif -> highest tier already announced, so a promotion fires once. */
    this.announced = new Map();
    /** The motif the current prompt is calling back to, or null. */
    this.activeCallback = null;
    this.day = options.day || 1;
  }

  /**
   * Records a crowned card and returns what the block made of it.
   *
   * The single entry point from the round loop. Returns the consequences rather than
   * applying them: this module has no business reaching into a player object, and a
   * caller that wants to preview an outcome should be able to.
   */
  record(entry) {
    const card = String(entry.card || '');
    const player = entry.player || 'Someone';
    const tags = canonTags(card);
    const motifs = canonMotifs(card);

    const head = canonHeadMotif(card);

    const promotions = [];
    motifs.forEach(motif => {
      const weight = motif === head ? CANON_HEAD_WEIGHT : 1;
      const count = (this.motifs.get(motif) || 0) + weight;
      this.motifs.set(motif, count);
      const tier = BlockLedger.tierFor(count);
      if (!tier) return;
      // Announce a tier once. Without this a motif at 5 mentions re-announces
      // INSTITUTION on every subsequent play and the chronicle fills with repeats.
      if (this.announced.get(motif) === tier.tier) return;
      this.announced.set(motif, tier.tier);
      promotions.push({ motif, count, tier: tier.tier, label: tier.label });
    });

    // Strongest promotion first. Callers show promotions[0] as the headline, and in
    // motif order that was whichever word happened to come first in the card — so a
    // round that made PIGEON a block legend reported "CONFIDENT is known on the block"
    // and buried the thing that actually happened.
    const tierRank = { KNOWN: 1, LEGEND: 2, INSTITUTION: 3 };
    promotions.sort((a, b) => (tierRank[b.tier] - tierRank[a.tier])
      || (b.count - a.count) || a.motif.localeCompare(b.motif));

    // Callback pay-off: the crowned card played into the motif the prompt was already
    // asking about. This is the mechanism that makes a round-three joke pay at round
    // ten, and it is why the REP bonus is separate from the tag effects.
    const calledBack = !!(this.activeCallback && motifs.includes(this.activeCallback.motif));

    const effects = { heat: 0, cash: 0, trust: 0, reputation: 0 };
    tags.forEach(tag => {
      const delta = CANON_TAG_EFFECTS[tag] || {};
      Object.keys(delta).forEach(k => { effects[k] += delta[k]; });
    });
    if (calledBack) effects.reputation += CANON_CALLBACK_REP;

    const event = {
      id: `evt_${String(this.events.length + 1).padStart(4, '0')}`,
      type: calledBack ? 'CALLBACK' : 'CARD_CROWNED',
      day: this.day,
      round: entry.round || this.events.length + 1,
      player,
      card,
      district: entry.district || null,
      tags,
      motifs,
      head,
      promotions,
      effects,
      calledBack
    };
    this.events.push(event);
    this.activeCallback = null;
    return event;
  }

  /** The tier a mention count has reached, or null. Highest match wins. */
  static tierFor(count) {
    return CANON_TIERS.find(t => count >= t.at) || null;
  }

  /** Motifs at or above a tier, strongest first. Ties break alphabetically so the
   *  order is stable across clients rather than dependent on insertion order. */
  legends(minTier = 'LEGEND') {
    const rank = { KNOWN: 1, LEGEND: 2, INSTITUTION: 3 };
    const floor = rank[minTier] || 2;
    return [...this.motifs.entries()]
      .map(([motif, count]) => {
        const tier = BlockLedger.tierFor(count);
        return tier ? { motif, count, tier: tier.tier, label: tier.label } : null;
      })
      .filter(m => m && rank[m.tier] >= floor)
      .sort((a, b) => (b.count - a.count) || a.motif.localeCompare(b.motif));
  }

  /**
   * Looks for a legend the new prompt happens to mention, and arms it.
   *
   * Called when a black card is dealt. Matching on the prompt's own words rather than
   * injecting a motif into it keeps the writing intact — the prompt still reads as
   * written, it just now carries a history the players gave it.
   */
  armCallback(promptText) {
    this.activeCallback = null;
    const words = new Set(canonTokens(promptText));
    const hit = this.legends('LEGEND').find(l => words.has(l.motif));
    if (hit) this.activeCallback = { motif: hit.motif, tier: hit.tier, count: hit.count };
    return this.activeCallback;
  }

  /**
   * The chronicle (PRD section 42), as display-ready lines.
   *
   * One line per event that actually changed something — a crowned card with no tags,
   * no promotion and no callback is just a point scored, and listing it would bury the
   * events that matter under noise. That filter is the whole difference between a
   * chronicle and a log.
   */
  chronicle() {
    return this.events
      .filter(e => e.promotions.length || e.calledBack || e.tags.length)
      .map(e => {
        if (e.promotions.length) {
          const p = e.promotions[0];
          return { round: e.round, kind: p.tier, text: `${p.motif.toUpperCase()} ${p.label}.` };
        }
        if (e.calledBack) {
          return { round: e.round, kind: 'CALLBACK', text: `${e.player} brought it back around.` };
        }
        const tag = e.tags[0].toUpperCase();
        return { round: e.round, kind: tag, text: `${e.player}: "${e.card}"` };
      });
  }

  /**
   * How the block sums you up at the end (PRD section 54: endings come from world
   * state, not XP). Reads the ledger rather than the scoreboard, so the line reflects
   * what happened rather than who won.
   */
  standing() {
    const institutions = this.legends('INSTITUTION');
    if (institutions.length) {
      return `The block runs on ${institutions[0].motif.toUpperCase()} now. That is your fault.`;
    }
    const legends = this.legends('LEGEND');
    if (legends.length) {
      return `They still tell the ${legends[0].motif.toUpperCase()} story around here.`;
    }
    const callbacks = this.events.filter(e => e.calledBack).length;
    if (callbacks) return 'You made the block repeat itself. That counts for something.';
    return 'Nothing stuck. The block moved on without you.';
  }

  /** Serialisable state (PRD section 43: deterministic identifiers, never AI prose). */
  toJSON() {
    return {
      day: this.day,
      events: this.events,
      motifs: [...this.motifs.entries()],
      announced: [...this.announced.entries()]
    };
  }

  static fromJSON(raw) {
    const ledger = new BlockLedger({ day: raw && raw.day });
    if (!raw) return ledger;
    ledger.events = Array.isArray(raw.events) ? raw.events : [];
    ledger.motifs = new Map(Array.isArray(raw.motifs) ? raw.motifs : []);
    ledger.announced = new Map(Array.isArray(raw.announced) ? raw.announced : []);
    return ledger;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BlockLedger, canonMotifs, canonHeadMotif, canonTags, canonTokens,
    CANON_TIERS, CANON_TAG_LEXICON, CANON_TAG_EFFECTS, CANON_CALLBACK_REP,
    CANON_STOPWORDS, CANON_HEAD_WEIGHT
  };
}
if (typeof window !== 'undefined') {
  window.BlockLedger = BlockLedger;
  window.canonMotifs = canonMotifs;
  window.canonHeadMotif = canonHeadMotif;
  window.canonTags = canonTags;
}
