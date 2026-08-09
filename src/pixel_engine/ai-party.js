/**
 * Concrete Kings: The Block Chronicles
 * AI party — companions with their own cards, agendas, memories and grudges.
 *
 * Implements CARD RPG SINGLE PLAYER MODE PRD.md (v2.1). The design principle it ends on
 * (section 59) is the one that shapes every decision here:
 *
 *   Not "NPCs pretending to be players". "Players who happen to be AI."
 *
 * Which in practice means section 6 is non-negotiable: companions hold REAL hands and
 * choose from them. Asking a companion "what would you do?" and inventing a card would
 * break the game's own rules, and the player would feel it immediately — the AI would
 * always have exactly the right card.
 *
 * Section 27 is the other structural rule: there are NO separate AI campaign rules. A
 * companion completes a scenario through the same ScenarioRun the human uses, and the
 * winning completion runs through the same resolution and the same block ledger. This
 * module therefore contains no simulation of its own; it only decides what a companion
 * plays, how it votes, and how it feels about you afterwards.
 *
 * Determinism, as everywhere else in this codebase: no Math.random. Companion decisions
 * are seeded from the round, the companion and the scenario, so a campaign replays
 * identically and two clients cannot disagree about what Marcus did.
 *
 * Prefixed globals: these files load as classic <script> tags sharing one scope.
 */

/**
 * The seven archetypes of section 5.
 *
 * Weights are the companion's *personality*, and section 35 is explicit that difficulty
 * must not touch them — difficulty changes how well a companion reads a situation, never
 * who it is. `chaos` and `loyalty` are the two that most visibly drive behaviour.
 */
const AIP_ARCHETYPES = {
  STRAIGHT_MAN: {
    label: 'The Straight Man', blurb: 'Trying to keep everyone alive.',
    chaos: 0.10, risk: 0.20, loyalty: 0.85, greed: 0.25, aggression: 0.20,
    empathy: 0.80, deception: 0.20, competitive: 0.30
  },
  CHAOS_AGENT: {
    label: 'The Chaos Agent', blurb: 'Picks the ridiculous option on purpose.',
    chaos: 0.95, risk: 0.90, loyalty: 0.40, greed: 0.30, aggression: 0.60,
    empathy: 0.35, deception: 0.45, competitive: 0.50
  },
  SCHEMER: {
    label: 'The Schemer', blurb: 'Optimising for themselves, quietly.',
    chaos: 0.35, risk: 0.55, loyalty: 0.20, greed: 0.75, aggression: 0.40,
    empathy: 0.25, deception: 0.90, competitive: 0.85
  },
  LOYALIST: {
    label: 'The Loyalist', blurb: 'Party first, every time.',
    chaos: 0.20, risk: 0.40, loyalty: 0.95, greed: 0.15, aggression: 0.30,
    empathy: 0.90, deception: 0.15, competitive: 0.20
  },
  GREEDY_ONE: {
    label: 'The Greedy One', blurb: 'In it for the bag.',
    chaos: 0.35, risk: 0.65, loyalty: 0.30, greed: 0.95, aggression: 0.45,
    empathy: 0.25, deception: 0.55, competitive: 0.75
  },
  INSTIGATOR: {
    label: 'The Instigator', blurb: 'Enjoys watching it kick off.',
    chaos: 0.70, risk: 0.70, loyalty: 0.35, greed: 0.40, aggression: 0.85,
    empathy: 0.30, deception: 0.60, competitive: 0.70
  },
  WILDCARD: {
    label: 'The Wildcard', blurb: 'Nobody knows. Including them.',
    chaos: 0.75, risk: 0.75, loyalty: 0.50, greed: 0.50, aggression: 0.50,
    empathy: 0.50, deception: 0.50, competitive: 0.50
  }
};

/** Secret objectives (section 10). Public goal is what they say; secret is what they want. */
const AIP_OBJECTIVES = [
  { id: 'RUN_THE_BLOCK', publicGoal: 'Keep the crew standing.', secret: 'Run the block themselves.' },
  { id: 'GET_PAID', publicGoal: 'Help everyone eat.', secret: 'Walk away with the most cash.' },
  { id: 'STAY_CLEAN', publicGoal: 'Keep the heat down.', secret: 'Make sure it lands on somebody else.' },
  { id: 'SETTLE_UP', publicGoal: 'Watch the crew\'s back.', secret: 'Settle an old debt with one of them.' },
  { id: 'BE_KNOWN', publicGoal: 'Do right by the block.', secret: 'Be the one they tell stories about.' }
];

/** Emotional states (section 30). These modify decisions rather than just flavour text. */
const AIP_EMOTIONS = ['CALM', 'AMUSED', 'ANGRY', 'AFRAID', 'SUSPICIOUS', 'CONFIDENT', 'BETRAYED'];

/**
 * Difficulty (section 35): changes decision QUALITY, not personality.
 *
 * `competence` scales how much the tactical read counts. `noise` is the variance section 9
 * asks for, so the companion picks from the top candidates rather than the maximum — a
 * perfect optimiser is boring, and section 8 says so directly.
 */
const AIP_DIFFICULTY = {
  STORY:     { competence: 0.35, noise: 0.55 },
  NORMAL:    { competence: 0.70, noise: 0.35 },
  HARD:      { competence: 1.00, noise: 0.20 },
  NIGHTMARE: { competence: 1.35, noise: 0.10 }
};

/** Relationship dimensions (section 11). */
const AIP_REL_DIMS = ['trust', 'respect', 'friendship', 'fear', 'suspicion', 'rivalry'];

/** Memory importance bands (section 13). Only CANON survives the campaign. */
const AIP_MEMORY_BANDS = [
  { at: 81, band: 'CANON' },
  { at: 51, band: 'IMPORTANT' },
  { at: 21, band: 'NOTABLE' },
  { at: 0, band: 'MINOR' }
];

/** Names that belong on this block rather than the PRD's placeholders. */
const AIP_NAMES = ['Marcus', 'Tasha', 'Rico', 'Junior', 'Nay', 'Deandre', 'Peaches', 'Slim'];

/** Deterministic LCG. Same round, same companion, same decision. */
function aipSeeded(seedText) {
  let seed = 0;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  seed = seed || 1;
  return () => (seed = (seed * 48271) % 2147483647) / 2147483647;
}

/** Card tag inference, shared with the canon engine so one card reads the same everywhere. */
let AIP_canonTags = null;
if (typeof require !== 'undefined') {
  try { AIP_canonTags = require('./canon-engine.js').canonTags; } catch (e) { AIP_canonTags = null; }
}
if (!AIP_canonTags && typeof window !== 'undefined') AIP_canonTags = window.canonTags;
if (!AIP_canonTags) AIP_canonTags = () => [];

class AiCompanion {
  constructor(options = {}) {
    this.name = options.name || 'Companion';
    this.archetypeId = options.archetype || 'WILDCARD';
    this.archetype = AIP_ARCHETYPES[this.archetypeId] || AIP_ARCHETYPES.WILDCARD;
    // Personality is COPIED, not referenced: section 22 has companions evolve, and mutating
    // the shared archetype would change every companion of that type at once — including in
    // other save files loaded later in the same session.
    this.traits = { ...this.archetype };
    // No default objective. Defaulting to AIP_OBJECTIVES[0] gave every companion created
    // without one the same secret agenda, and its +7 for family cards then outweighed even
    // the Greedy One's greed — so the archetypes stopped being distinguishable. A secret
    // objective is something a party assigns (see AiParty.generate), not a fallback.
    this.objective = options.objective || null;
    this.emotion = 'CALM';
    this.hand = [];
    this.relationships = {};
    this.memories = [];
    this.level = 1;
    this.xp = 0;
    this.inParty = true;
  }

  /** Relationship record toward another party member, created on first reference. */
  toward(name) {
    if (!this.relationships[name]) {
      // Neutral-positive start: a companion who has never met you should not be suspicious.
      this.relationships[name] = {
        trust: 50, respect: 50, friendship: 40, fear: 10, suspicion: 10, rivalry: 5
      };
    }
    return this.relationships[name];
  }

  adjust(name, deltas) {
    const rel = this.toward(name);
    Object.keys(deltas || {}).forEach(dim => {
      if (!AIP_REL_DIMS.includes(dim)) return;
      rel[dim] = Math.max(0, Math.min(100, rel[dim] + deltas[dim]));
    });
    return rel;
  }

  /**
   * Records something that happened (sections 12-13).
   *
   * Importance decides what survives: only CANON-band memories persist past the session,
   * which is what stops a companion's memory becoming an undifferentiated log where
   * everything is equally significant and therefore nothing is.
   */
  remember(entry) {
    const importance = Math.max(0, Math.min(100, Number(entry.importance) || 0));
    const band = AIP_MEMORY_BANDS.find(b => importance >= b.at).band;
    const memory = {
      text: String(entry.text || ''),
      about: entry.about || null,
      importance,
      band,
      round: entry.round || 0
    };
    this.memories.push(memory);
    return memory;
  }

  /** What this companion still carries. CANON first, then by importance. */
  significantMemories(limit = 5) {
    return [...this.memories]
      .sort((a, b) => (b.importance - a.importance) || (b.round - a.round))
      .slice(0, limit);
  }

  /**
   * Emotional state, derived rather than assigned (section 30).
   *
   * Derived so it cannot contradict the relationship numbers it is supposed to express —
   * a companion at trust 5 and rivalry 80 must not be reported as CALM.
   */
  updateEmotion(towardName) {
    const rel = this.toward(towardName);
    if (rel.trust < 20 && rel.rivalry > 55) this.emotion = 'BETRAYED';
    else if (rel.suspicion > 65) this.emotion = 'SUSPICIOUS';
    else if (rel.rivalry > 60) this.emotion = 'ANGRY';
    else if (rel.fear > 55) this.emotion = 'AFRAID';
    else if (rel.friendship > 70) this.emotion = 'CONFIDENT';
    else if (this.traits.chaos > 0.7) this.emotion = 'AMUSED';
    else this.emotion = 'CALM';
    return this.emotion;
  }

  /**
   * Scores one card for one slot (sections 7 and 9).
   *
   * The terms are the PRD's, mapped onto what this game actually tracks. The important
   * property is that PERSONALITY and RELATIONSHIP terms are weighted independently of the
   * tactical read, so raising difficulty cannot turn every companion into the same
   * optimiser — section 36 calls that personality override and calls it essential.
   */
  scoreCard(card, context) {
    const ctx = context || {};
    const tags = AIP_canonTags(card);
    const t = this.traits;
    const diff = AIP_DIFFICULTY[ctx.difficulty] || AIP_DIFFICULTY.NORMAL;

    // Tactical: does this card serve what the scenario is staking?
    let tactical = 0;
    if (ctx.stake && tags.includes(ctx.stake)) tactical += 10;
    if (tags.includes('heat')) tactical -= 6;
    if (tags.includes('trust')) tactical += 4;
    tactical *= diff.competence;

    // Personality: who they are, regardless of whether it is smart.
    let personality = 0;
    if (tags.includes('heat')) personality += t.risk * 12 - 4;
    if (tags.includes('cash')) personality += t.greed * 12;
    if (tags.includes('trust')) personality += t.empathy * 10;
    if (tags.includes('disrespect')) personality += t.aggression * 10;
    // A long, strange card is the chaotic pick. Cheap proxy, but it correlates: the absurd
    // cards in this deck are the wordy ones.
    if (String(card).length > 46) personality += t.chaos * 9;

    // Relationship: a card that hurts somebody is more attractive if you dislike them.
    let relationship = 0;
    if (tags.includes('disrespect') && ctx.target) {
      const rel = this.toward(ctx.target);
      relationship += (rel.rivalry - rel.friendship) * 0.12;
      relationship += (60 - rel.trust) * 0.06;
    }

    // Objective: the secret one, which is why it is not visible to the player.
    let objective = 0;
    if (this.objective) {
      if (this.objective.id === 'GET_PAID' && tags.includes('cash')) objective += 10;
      if (this.objective.id === 'STAY_CLEAN' && tags.includes('heat')) objective -= 10;
      if (this.objective.id === 'SETTLE_UP' && tags.includes('disrespect')) objective += 9;
      if (this.objective.id === 'BE_KNOWN' && String(card).length > 40) objective += 6;
      if (this.objective.id === 'RUN_THE_BLOCK' && tags.includes('trust')) objective += 7;
    }

    // Emotion (section 30) shifts the weighting rather than adding a flat bonus.
    let emotional = 0;
    if (this.emotion === 'ANGRY' || this.emotion === 'BETRAYED') {
      emotional += tags.includes('disrespect') ? 10 : -3;
    }
    if (this.emotion === 'AFRAID') emotional += tags.includes('heat') ? -10 : 4;
    if (this.emotion === 'AMUSED') emotional += String(card).length > 46 ? 6 : 0;

    // Running jokes (section 47): a companion who has heard the block repeat something
    // starts reaching for it too. This reads the same ledger the human's cards feed.
    let callback = 0;
    if (Array.isArray(ctx.legends) && ctx.legends.length) {
      const words = new Set(String(card).toLowerCase().split(/[^a-z0-9]+/));
      if (ctx.legends.some(l => words.has(l))) callback += 8 + t.chaos * 6;
    }

    return tactical + personality + relationship + objective + emotional + callback;
  }

  /**
   * Chooses a card from the hand (sections 7-9).
   *
   * Picks from the top candidates with seeded variance, never the raw maximum. Section 8
   * is unusually direct about this: a perfect optimiser is boring, and the mode's whole
   * success criterion (section 57) is the player saying "I can't believe the AI did that".
   *
   * Returns the index so the caller removes the card from the real hand — companions hold
   * real hands (section 6) and a card played must actually leave.
   */
  chooseCard(context) {
    const ctx = context || {};
    if (!this.hand.length) return -1;
    const diff = AIP_DIFFICULTY[ctx.difficulty] || AIP_DIFFICULTY.NORMAL;
    const rand = aipSeeded(`${this.name}|${ctx.seed || ''}|${ctx.slot || ''}|${this.hand.length}`);

    const scored = this.hand.map((card, index) => ({
      index,
      card,
      score: this.scoreCard(card, ctx) + (rand() - 0.5) * 40 * diff.noise
    })).sort((a, b) => b.score - a.score);

    // Consider a shortlist, weighted toward the front. On STORY the shortlist is wide and
    // the pick is loose; on NIGHTMARE it is nearly always the best card.
    const width = Math.max(1, Math.round(scored.length * (0.15 + diff.noise * 0.55)));
    const shortlist = scored.slice(0, width);
    const pick = shortlist[Math.floor(rand() * shortlist.length)] || scored[0];
    return pick.index;
  }

  /**
   * Votes on the completed plans (sections 16-17).
   *
   * Explicitly NOT the mathematically strongest option. A companion will vote for a worse
   * plan because they dislike whoever proposed the better one, which is where the social
   * politics of the mode comes from. Never votes for itself unless it is the only option —
   * self-voting every round makes the vote meaningless.
   */
  vote(plans, context) {
    const ctx = context || {};
    if (!Array.isArray(plans) || !plans.length) return null;
    const rand = aipSeeded(`${this.name}|vote|${ctx.seed || ''}`);
    const others = plans.filter(p => p.author !== this.name);
    const pool = others.length ? others : plans;

    const scored = pool.map(plan => {
      const rel = this.toward(plan.author);
      let score = 0;
      // How much they like the person.
      score += (rel.friendship + rel.trust + rel.respect) * 0.10;
      score -= (rel.rivalry + rel.suspicion) * 0.12;
      // How much they like the plan, on their own terms.
      score += this.scoreCard(plan.summary || '', ctx) * 0.5;
      // The competitive ones resent a good plan they did not make.
      score -= this.traits.competitive * 6;
      return { plan, score: score + (rand() - 0.5) * 14 };
    }).sort((a, b) => b.score - a.score);

    return scored[0].plan;
  }

  /**
   * Decides whether to turn on the player, and refuses to do it without a reason.
   *
   * Section 20 rules out "the AI decided to screw you because the script said so", so this
   * returns the CAUSE alongside the decision and returns null when there is not one. A
   * betrayal the player cannot reconstruct afterwards reads as the game cheating.
   *
   * Section 21 wants it telegraphed, which is what `pressure` is for: the caller can show
   * a warning sign long before this returns non-null.
   */
  betrayalRisk(towardName) {
    const rel = this.toward(towardName);
    const t = this.traits;
    const causes = [];
    if (rel.trust < 25) causes.push('you gave them no reason to trust you');
    if (rel.rivalry > 60) causes.push('they have been keeping score');
    if (this.emotion === 'BETRAYED') causes.push('you did it to them first');
    if (t.greed > 0.7 && this.objective && this.objective.id === 'GET_PAID') {
      causes.push('there is money in it for them');
    }
    if (this.objective && this.objective.id === 'SETTLE_UP' && rel.suspicion > 45) {
      causes.push('they came into this owed something');
    }

    const pressure = Math.min(100, Math.round(
      (100 - rel.trust) * 0.4 + rel.rivalry * 0.3 + rel.suspicion * 0.2 + t.deception * 20
    ));
    // Loyalty is a genuine brake, not a modifier: a Loyalist at 0.95 needs an extreme case.
    const threshold = 55 + t.loyalty * 40;

    // TWO causes to turn, one to show a warning.
    //
    // Section 21 requires a window where the player can see it coming. With a single cause
    // there was none: by the time the first grievance existed, pressure had already crossed
    // the threshold and the warning and the betrayal fired on the same round. Requiring a
    // second grievance opens the window naturally, and is better behaviour anyway — one bad
    // round should not flip a person.
    return {
      pressure,
      willBetray: causes.length >= 2 && pressure >= threshold,
      causes,
      // The telegraph: a single grievance is itself the warning sign.
      warning: causes.length >= 1 && pressure >= threshold - 25
    };
  }

  /**
   * Personality drift (section 22). Small, bounded, and always caused.
   *
   * Bounded to +/-0.35 of the archetype because a Straight Man who drifts into a Chaos
   * Agent stops being a character with an arc and becomes a random number.
   */
  evolve(kind) {
    const shift = (key, by) => {
      const base = this.archetype[key];
      this.traits[key] = Math.max(0, Math.min(1,
        Math.max(base - 0.35, Math.min(base + 0.35, this.traits[key] + by))));
    };
    switch (kind) {
      case 'SURVIVED_CHAOS': shift('risk', 0.06); shift('chaos', 0.04); break;
      case 'BETRAYED': shift('loyalty', -0.10); shift('deception', 0.05); break;
      case 'BEFRIENDED': shift('loyalty', 0.08); shift('empathy', 0.05); break;
      case 'WENT_HUNGRY': shift('greed', 0.08); break;
      default: return this.traits;
    }
    return this.traits;
  }

  /** XP and levels (section 37). */
  gainXp(amount) {
    this.xp += Math.max(0, Number(amount) || 0);
    while (this.xp >= this.level * 100) {
      this.xp -= this.level * 100;
      this.level++;
    }
    return this.level;
  }

  toJSON() {
    return {
      name: this.name, archetype: this.archetypeId, traits: this.traits,
      objective: this.objective, emotion: this.emotion, hand: this.hand,
      relationships: this.relationships, level: this.level, xp: this.xp,
      inParty: this.inParty,
      // Only CANON memories persist (section 13). Everything else was session detail.
      memories: this.memories.filter(m => m.band === 'CANON')
    };
  }

  static fromJSON(raw) {
    if (!raw) return null;
    const c = new AiCompanion({ name: raw.name, archetype: raw.archetype, objective: raw.objective });
    if (raw.traits) c.traits = { ...c.traits, ...raw.traits };
    c.emotion = raw.emotion || 'CALM';
    c.hand = Array.isArray(raw.hand) ? raw.hand : [];
    c.relationships = raw.relationships || {};
    c.memories = Array.isArray(raw.memories) ? raw.memories : [];
    c.level = raw.level || 1;
    c.xp = raw.xp || 0;
    c.inParty = raw.inParty !== false;
    return c;
  }
}

class AiParty {
  constructor(options = {}) {
    this.difficulty = AIP_DIFFICULTY[options.difficulty] ? options.difficulty : 'NORMAL';
    this.members = [];
    this.humanName = options.humanName || 'You';
  }

  /**
   * Builds a party (sections 43-45).
   *
   * Deterministic from the seed so PARTY PREVIEW shows the party that will actually be
   * played — a re-roll on start would make the preview a lie.
   */
  static generate(options = {}) {
    // `Number(size) || 3` turns a requested size of 0 into 3, because 0 is falsy — so
    // "clamp to at least 1" silently became "default to 3". Check for a finite number.
    const requested = Number(options.size);
    const size = Math.max(1, Math.min(7, Number.isFinite(requested) ? requested : 3));
    const party = new AiParty(options);
    const rand = aipSeeded(options.seed || 'party');
    const archetypes = Object.keys(AIP_ARCHETYPES);
    const names = [...AIP_NAMES];
    const themed = AiParty.THEMES[options.theme] || null;

    for (let i = 0; i < size; i++) {
      const name = names.splice(Math.floor(rand() * names.length), 1)[0] || `Companion ${i + 1}`;
      const archetype = themed
        ? themed[i % themed.length]
        : archetypes[Math.floor(rand() * archetypes.length)];
      const objective = AIP_OBJECTIVES[Math.floor(rand() * AIP_OBJECTIVES.length)];
      party.members.push(new AiCompanion({ name, archetype, objective }));
    }
    return party;
  }

  /** Themed parties (section 45). */
  static get THEMES() {
    return {
      WORST_POSSIBLE: ['CHAOS_AGENT', 'INSTIGATOR', 'WILDCARD'],
      MASTERMINDS: ['SCHEMER', 'GREEDY_ONE', 'STRAIGHT_MAN'],
      PROFESSIONAL_LIARS: ['SCHEMER', 'SCHEMER', 'WILDCARD'],
      SOLID_CREW: ['LOYALIST', 'STRAIGHT_MAN', 'LOYALIST']
    };
  }

  active() { return this.members.filter(m => m.inParty); }

  /** Deals real cards (section 6). Companions cannot play what they do not hold. */
  deal(deck, handSize = 6) {
    this.active().forEach(m => {
      while (m.hand.length < handSize) {
        const card = deck && typeof deck.draw === 'function' ? deck.draw() : null;
        if (card === null || card === undefined) break;
        m.hand.push(card);
      }
    });
  }

  /**
   * Each companion completes the scenario in their own words (section 58).
   *
   * Returns plans in the same shape the human's completion takes, so the vote and the
   * simulation cannot tell them apart — section 27's "no separate AI rules", enforced by
   * making the data identical rather than by intending to.
   */
  completePlans(slots, context) {
    const ctx = context || {};
    return this.active().map(member => {
      const filled = {};
      slots.forEach(slot => {
        const index = member.chooseCard({ ...ctx, slot, difficulty: this.difficulty, target: this.humanName });
        if (index < 0) { filled[slot] = '(nothing left)'; return; }
        filled[slot] = member.hand.splice(index, 1)[0];
      });
      return {
        author: member.name,
        archetype: member.archetype.label,
        slots: filled,
        summary: slots.map(s => filled[s]).join(' / ')
      };
    });
  }

  /** Tallies the party's votes (sections 16-17). Returns counts by author. */
  tallyVotes(plans, context) {
    const tally = {};
    const ballots = [];
    this.active().forEach(member => {
      const choice = member.vote(plans, { ...context, difficulty: this.difficulty });
      if (!choice) return;
      tally[choice.author] = (tally[choice.author] || 0) + 1;
      ballots.push({ voter: member.name, votedFor: choice.author });
    });
    return { tally, ballots };
  }

  /**
   * Applies the outcome of a run to every companion (section 27's memory update step).
   *
   * Importance is derived from the outcome rather than passed in, so a routine round cannot
   * be recorded as campaign-defining just because a caller said so.
   */
  applyOutcome(result, context) {
    const ctx = context || {};
    const reactions = [];
    const severe = ['CATASTROPHIC_FAILURE', 'FAILURE'].includes(result && result.tier);
    const great = ['CRITICAL_SUCCESS', 'CHAOTIC_SUCCESS'].includes(result && result.tier);
    const importance = great ? 85 : severe ? 60 : 30;

    this.active().forEach(member => {
      const authorIsHuman = ctx.author === this.humanName;
      if (authorIsHuman) {
        // How they feel about you now depends on how your plan went for them.
        if (great) member.adjust(this.humanName, { respect: 8, friendship: 5, trust: 4 });
        else if (severe) member.adjust(this.humanName, { respect: -7, trust: -6, suspicion: 6 });
        // A chaotic streak costs you the conservative ones specifically (section 31).
        if (result && result.tier === 'CHAOTIC_SUCCESS' && member.traits.chaos < 0.35) {
          member.adjust(this.humanName, { trust: -5, suspicion: 4 });
        }
      }
      member.updateEmotion(this.humanName);
      member.gainXp(great ? 40 : severe ? 25 : 15);
      if (great) member.evolve('SURVIVED_CHAOS');
      if (severe && member.traits.greed > 0.6) member.evolve('WENT_HUNGRY');

      const memory = member.remember({
        text: `${ctx.author || 'Somebody'} ran ${(result && result.title) || 'a job'} — ${(result && result.label) || 'it happened'}.`,
        about: ctx.author || null,
        importance,
        round: ctx.round || 0
      });

      const risk = member.betrayalRisk(this.humanName);
      reactions.push({
        name: member.name, emotion: member.emotion, memory,
        warning: risk.warning && !risk.willBetray ? risk : null,
        betrayal: risk.willBetray ? risk : null
      });
    });
    return { reactions, importance };
  }

  /**
   * The "Previously..." recap (section 41).
   *
   * Built from recorded memories and relationships, never invented — this is the same rule
   * the scenario narrator follows. A recap that embellishes is a recap the player cannot
   * trust when they are trying to remember what actually happened.
   */
  recap() {
    const lines = [];
    const all = this.members.flatMap(m => m.significantMemories(3).map(mem => ({ ...mem, who: m.name })));
    const seen = new Set();
    all.sort((a, b) => b.importance - a.importance).forEach(mem => {
      if (seen.has(mem.text)) return;
      seen.add(mem.text);
      if (lines.length < 4) lines.push(mem.text);
    });

    const standing = this.members.map(m => {
      const rel = m.toward(this.humanName);
      const mood = rel.trust >= 60 ? 'solid with you'
        : rel.rivalry > 55 ? 'keeping score'
          : rel.suspicion > 55 ? 'watching you'
            : 'undecided';
      return `${m.name} is ${mood}.`;
    });

    return {
      events: lines.length ? lines : ['Nothing has happened yet worth retelling.'],
      standing
    };
  }

  toJSON() {
    return {
      difficulty: this.difficulty, humanName: this.humanName,
      members: this.members.map(m => m.toJSON())
    };
  }

  static fromJSON(raw) {
    if (!raw) return null;
    const party = new AiParty({ difficulty: raw.difficulty, humanName: raw.humanName });
    party.members = (raw.members || []).map(AiCompanion.fromJSON).filter(Boolean);
    return party;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AiCompanion, AiParty, aipSeeded,
    AIP_ARCHETYPES, AIP_OBJECTIVES, AIP_EMOTIONS, AIP_DIFFICULTY,
    AIP_REL_DIMS, AIP_MEMORY_BANDS, AIP_NAMES
  };
}
if (typeof window !== 'undefined') {
  window.AiCompanion = AiCompanion;
  window.AiParty = AiParty;
  window.AIP_ARCHETYPES = AIP_ARCHETYPES;
  window.AIP_DIFFICULTY = AIP_DIFFICULTY;
}
