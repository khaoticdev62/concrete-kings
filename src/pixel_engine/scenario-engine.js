/**
 * Concrete Kings: The Block Chronicles
 * Scenario engine — complete the scenario, watch it happen, live with it.
 *
 * Implements the core loop of CARD RPG.md PRD Revision v2.0. That revision inverts the
 * original hierarchy: cards stop being "actions layered on an RPG" and become the
 * ingredients of a scene specification. The player says what they think should happen;
 * the RPG decides how well it goes; the world remembers the result.
 *
 *   CARD = INTENT      RPG = EXECUTION      WORLD STATE = CONSEQUENCE      (v2 section 11)
 *
 * Two rules from the revision are load-bearing and are enforced structurally rather
 * than by discipline:
 *
 *  - Section 10: the RPG must not override the card. Stats decide how well the attempt
 *    goes, never what the attempt was. `resolve()` therefore copies the submitted slot
 *    values into the result untouched and every narration beat is built by interpolating
 *    those values — there is no code path that can substitute a different intent.
 *  - Section 31: the narration must never contradict the simulation. Beats are selected
 *    by outcome tier AFTER the tier is computed, so prose cannot disagree with the
 *    result. In this game the narrator is a template, not a model, so this is free — but
 *    the seam is where an AI layer would attach, and it must attach on this side of it.
 *
 * Determinism (v1 section 64): no Math.random. The seed is derived from the scenario, the
 * submitted cards and the acting character, so the same plan by the same person always
 * plays out the same way, and two clients agree.
 *
 * Prefixed globals: these files load as classic <script> tags sharing one scope in the
 * browser, where a bare `const SLOTS` would collide with another module and stop this
 * file parsing — a failure node's per-module scope hides completely.
 */

/**
 * Slot order. WHO / WHAT / HOW / TWIST, from v2 sections 4-5.
 *
 * Four, not the seven the PRD lists (WHO/WHERE/WHAT/HOW/WHY/TWIST/CONSEQUENCE). WHERE is
 * already answered by the district the player is standing in, CONSEQUENCE is what the
 * engine is for rather than something a player declares, and WHY is the one slot playtest
 * logic says nobody can fill amusingly with a noun card. Four slots is also the most a
 * hand of ten cards can fill without emptying it.
 */
const SCN_SLOTS = ['WHO', 'WHAT', 'HOW', 'TWIST'];

/** Human-readable prompt per slot, shown above the card picker. */
const SCN_SLOT_PROMPTS = {
  WHO: 'Who is in this with you?',
  WHAT: 'What are you actually doing?',
  HOW: 'How are you pulling it off?',
  TWIST: 'What goes sideways?'
};

/**
 * Outcome tiers, v2 section 20. Ordered worst to best so an index comparison works.
 *
 * CHAOTIC_SUCCESS is deliberately outside the ordering (v2 section 21): the plan fails on
 * its own terms but produces an opportunity anyway, so it is neither above nor below a
 * plain success — it is sideways, and it is meant to be the signature result.
 */
const SCN_TIERS = [
  'CATASTROPHIC_FAILURE',
  'FAILURE',
  'PARTIAL_FAILURE',
  'SUCCESS_WITH_CONSEQUENCE',
  'SUCCESS',
  'CRITICAL_SUCCESS'
];

const SCN_TIER_LABELS = {
  CATASTROPHIC_FAILURE: 'CATASTROPHIC FAILURE',
  FAILURE: 'FAILURE',
  PARTIAL_FAILURE: 'PARTIAL FAILURE',
  SUCCESS_WITH_CONSEQUENCE: 'SUCCESS, WITH A COST',
  SUCCESS: 'SUCCESS',
  CRITICAL_SUCCESS: 'CRITICAL SUCCESS',
  CHAOTIC_SUCCESS: 'CHAOTIC SUCCESS'
};

/**
 * Scenario templates. Five, per v2 section 38's instruction to prove the chain on minimal
 * content before adding systems.
 *
 * `attr` is the attribute the plan leans on, which is what makes the same cards resolve
 * differently for different characters (v2 section 9). `micro` names an existing mini-game
 * the scene can hand control to — v2 section 18 asks for playable micro-scenes, and this
 * game already has five, so the honest implementation is to reuse them rather than build a
 * sixth kind of thing.
 */
const SCN_TEMPLATES = [
  {
    id: 'CORNER_STORE',
    title: 'THE CORNER STORE',
    setup: 'The bodega owner already thinks you owe him. Tonight you need something off his shelf and you are not paying for it.',
    attr: 'wit',
    micro: 'bodega_run',
    stake: 'cash'
  },
  {
    id: 'BACK_DOOR',
    title: 'THE BACK DOOR',
    setup: 'There is a door on the alley that has been locked since before you lived here. Tonight it matters what is behind it.',
    attr: 'str',
    micro: 'lockpicking',
    stake: 'heat'
  },
  {
    id: 'THE_SITDOWN',
    title: 'THE SITDOWN',
    setup: 'Somebody wants a number out of you and they brought company. You have one conversation to get out of this even.',
    attr: 'soul',
    micro: 'negotiation',
    stake: 'trust'
  },
  {
    id: 'THE_CHAIR',
    title: 'THE CHAIR',
    setup: 'You told half the block you could cut hair. Now somebody is sitting down and everyone is watching.',
    attr: 'wit',
    micro: 'haircut_challenge',
    stake: 'reputation'
  },
  {
    id: 'THE_DICE',
    title: 'THE DICE',
    setup: 'The game on the corner has been running since eleven. Getting in is easy. Getting out with anything is not.',
    attr: 'soul',
    micro: 'street_dice',
    stake: 'cash'
  }
];

/** Deterministic LCG, seeded from text. Same plan, same person, same scene. */
function scnSeeded(seedText) {
  let seed = 0;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  seed = seed || 1;
  return () => (seed = (seed * 48271) % 2147483647) / 2147483647;
}

/**
 * How much the submitted cards actually support the plan.
 *
 * Reuses the canon engine's tag inference rather than a second lexicon — a card that reads
 * as heat there must read as heat here, or the ledger and the simulation would disagree
 * about the same card. Loaded defensively: the scenario engine works without it, just with
 * flat card scoring.
 */
let SCN_canonTags = null;
if (typeof require !== 'undefined') {
  try { SCN_canonTags = require('./canon-engine.js').canonTags; } catch (e) { SCN_canonTags = null; }
}
if (!SCN_canonTags && typeof window !== 'undefined') SCN_canonTags = window.canonTags;
if (!SCN_canonTags) SCN_canonTags = () => [];

class ScenarioRun {
  /**
   * @param {object} template one of SCN_TEMPLATES
   * @param {object} options.district current district key, for the ledger and flavour
   */
  constructor(template, options = {}) {
    this.template = template;
    this.district = options.district || null;
    this.slots = {};
    SCN_SLOTS.forEach(s => { this.slots[s] = null; });
  }

  /** Assigns a card to a slot. Any card can fill any slot: the deck is untyped, and a
   *  wrong-sounding card in a slot is the joke rather than an error. */
  fill(slot, card, player) {
    if (!SCN_SLOTS.includes(slot)) return false;
    this.slots[slot] = { card: String(card || ''), player: player || null };
    return true;
  }

  get complete() {
    return SCN_SLOTS.every(s => this.slots[s] && this.slots[s].card);
  }

  /** Slots still to fill, in order, so a UI can ask for the next one. */
  get pending() {
    return SCN_SLOTS.filter(s => !this.slots[s] || !this.slots[s].card);
  }

  /**
   * Runs the simulation.
   *
   * @param {object} actor  { name, attributes:{str,wit,soul}, stats:{...} }
   * @param {object} world  { heat, trust } optional campaign state
   */
  resolve(actor, world) {
    if (!this.complete) return null;
    // Explicit null guard, not a default parameter. A default only fires on `undefined`,
    // so resolve(actor, null) — which the round loop can produce when no campaign is
    // running — walked straight into reading .heat off null.
    const state = world || {};

    const attrs = (actor && actor.attributes) || { str: 0, wit: 0, soul: 0 };
    const leaning = this.template.attr;
    const attrScore = (attrs[leaning] || 0) * 6;

    // Card support: a card whose tags match what the plan is staking helps; a card that
    // brings heat into a plan that was already hot hurts. This is the only place the cards
    // influence the ODDS — they always determine the intent regardless.
    let cardScore = 0;
    const tagsBySlot = {};
    SCN_SLOTS.forEach(slot => {
      const tags = SCN_canonTags(this.slots[slot].card);
      tagsBySlot[slot] = tags;
      if (tags.includes(this.template.stake)) cardScore += 8;
      if (tags.includes('heat')) cardScore -= 5;
      if (tags.includes('trust')) cardScore += 4;
      if (tags.includes('disrespect')) cardScore -= 3;
    });
    // A TWIST is supposed to cost you something. A twist card that brings no trouble at
    // all means the plan never actually got tested.
    const twistBite = tagsBySlot.TWIST.length ? -6 : 0;

    const heat = Number(state.heat) || 0;
    // `-heat * 2` yields -0 at zero heat, which is a real value in a reported breakdown
    // and reads as a bug to anyone looking at it.
    const worldScore = heat ? -heat * 2 : 0;

    const rand = scnSeeded([
      this.template.id, actor && actor.name,
      ...SCN_SLOTS.map(s => this.slots[s].card)
    ].join('|'));
    const luck = Math.floor(rand() * 24) - 8;

    const total = 40 + attrScore + cardScore + twistBite + worldScore + luck;

    // Chaotic success (v2 section 21): the plan misses, but the seed says the miss creates
    // an opening. Checked BEFORE the tier ladder because it is sideways to it, not a rung.
    const missed = total < 40;
    const chaotic = missed && rand() < 0.28;

    const tier = chaotic ? 'CHAOTIC_SUCCESS' : ScenarioRun.tierFor(total);

    return {
      scenario: this.template.id,
      title: this.template.title,
      district: this.district,
      // Intent, copied verbatim. Nothing downstream may replace these — section 10.
      intent: SCN_SLOTS.reduce((acc, s) => {
        acc[s] = this.slots[s].card;
        return acc;
      }, {}),
      contributors: SCN_SLOTS.reduce((acc, s) => {
        acc[s] = this.slots[s].player;
        return acc;
      }, {}),
      actor: (actor && actor.name) || 'You',
      tier,
      label: SCN_TIER_LABELS[tier],
      score: total,
      breakdown: {
        base: 40, attribute: attrScore, cards: cardScore,
        twist: twistBite, world: worldScore, luck
      },
      leaning,
      micro: this.template.micro,
      effects: ScenarioRun.effectsFor(tier, this.template.stake),
      chain: [
        `You played ${SCN_SLOTS.map(s => `${s}: "${this.slots[s].card}"`).join(', ')}`,
        `The plan leaned on your ${leaning.toUpperCase()}`,
        `${SCN_TIER_LABELS[tier]} (${total})`
      ]
    };
  }

  /** Score to tier. Bands are wide because the luck term spans 24 points. */
  static tierFor(total) {
    if (total >= 78) return 'CRITICAL_SUCCESS';
    if (total >= 62) return 'SUCCESS';
    if (total >= 48) return 'SUCCESS_WITH_CONSEQUENCE';
    if (total >= 34) return 'PARTIAL_FAILURE';
    if (total >= 20) return 'FAILURE';
    return 'CATASTROPHIC_FAILURE';
  }

  /**
   * Consequences, in the shape the canon ledger and the HUD already consume.
   *
   * Deliberately never all-upside or all-downside: v2 section 22 wants the player to find
   * out what it cost them, so even a critical success moves heat a little and a
   * catastrophe leaves something behind.
   */
  static effectsFor(tier, stake) {
    const base = { heat: 0, cash: 0, trust: 0, reputation: 0 };
    const bump = (key, n) => { base[key] = (base[key] || 0) + n; };
    switch (tier) {
      case 'CRITICAL_SUCCESS': bump(stake, 3); bump('reputation', 2); bump('heat', 1); break;
      case 'SUCCESS': bump(stake, 2); bump('reputation', 1); break;
      case 'SUCCESS_WITH_CONSEQUENCE': bump(stake, 2); bump('heat', 2); break;
      case 'PARTIAL_FAILURE': bump(stake, 1); bump('heat', 2); bump('reputation', -1); break;
      case 'FAILURE': bump('heat', 3); bump('reputation', -1); break;
      case 'CATASTROPHIC_FAILURE': bump('heat', 4); bump('reputation', -2); break;
      // The plan failed, so the stake is not paid — but the mess is worth something.
      case 'CHAOTIC_SUCCESS': bump('reputation', 3); bump('heat', 2); break;
      default: break;
    }
    return base;
  }
}

/**
 * Turns a resolved result into timed beats for the "watch it happen" phase.
 *
 * Every beat interpolates the submitted cards, so the scene can only ever be about what
 * the players actually played (section 10), and beats are chosen by tier after the tier is
 * known, so the prose cannot contradict the simulation (section 31).
 *
 * Total runtime lands in v2 section 16's 10-60 second window for a normal scenario. The
 * goal is not a cutscene; it is "it actually did it".
 */
function scnSceneBeats(result) {
  if (!result) return [];
  const i = result.intent;
  const beat = (text, ms = 2000) => ({ text, ms });

  // Label form, not sentences, and the actor is never the grammatical subject.
  //
  // Both are fixes for real output. "${result.actor} moves on it with ..." produced
  // "You moves on it with ...", because the actor can be "You" or a name and no single
  // conjugation serves both. And every card in this deck is a NOUN PHRASE — "a collard
  // greens that needed more seasoning" — so "The method: <card>" read as broken English
  // rather than as a joke. Announcing each slot as a labelled ingredient lets any noun
  // phrase land, which is the whole premise of an untyped deck.
  const opening = [
    beat(`IN ON IT — ${i.WHO}.`, 2200),
    beat(`THE PLAY — ${i.WHAT}.`, 2200),
    beat(`THE ANGLE — ${i.HOW}.`, 2400)
  ];

  const turn = [beat(`THEN — ${i.TWIST}.`, 2600)];

  const ending = {
    CRITICAL_SUCCESS: [
      beat(`${i.HOW} should not have worked. It works perfectly.`, 2400),
      beat('Nobody on the block will tell this story the way it actually happened.', 2600)
    ],
    SUCCESS: [
      beat(`${i.HOW} holds up just long enough.`, 2400),
      beat('You walk. Clean, mostly.', 2200)
    ],
    SUCCESS_WITH_CONSEQUENCE: [
      beat(`You get what you came for. ${i.TWIST} does not go away.`, 2600),
      beat('Somebody saw. Somebody always sees.', 2200)
    ],
    PARTIAL_FAILURE: [
      beat(`Half of it lands. ${i.WHAT} is only half done.`, 2400),
      beat('You leave with less than you planned and more than you wanted.', 2600)
    ],
    FAILURE: [
      beat(`${i.HOW} falls apart the second it is tested.`, 2400),
      beat(`${i.WHAT} is not happening tonight.`, 2200)
    ],
    CATASTROPHIC_FAILURE: [
      beat(`${i.HOW} does not just fail. It makes everything worse.`, 2600),
      beat(`Now ${i.WHO} is a problem too.`, 2400)
    ],
    CHAOTIC_SUCCESS: [
      beat(`${i.WHAT} does not happen. Not even close.`, 2400),
      beat(`But ${i.TWIST} takes the heat off you entirely.`, 2600),
      beat('You failed into something better. Do not explain it to anyone.', 2600)
    ]
  }[result.tier] || [beat('It happens.', 2000)];

  return [...opening, ...turn, ...ending];
}

/** Total playback time, so a caller can check it against the 10-60s window. */
function scnSceneDuration(beats) {
  return (beats || []).reduce((sum, b) => sum + b.ms, 0);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ScenarioRun, scnSceneBeats, scnSceneDuration, scnSeeded,
    SCN_SLOTS, SCN_SLOT_PROMPTS, SCN_TEMPLATES, SCN_TIERS, SCN_TIER_LABELS
  };
}
if (typeof window !== 'undefined') {
  window.ScenarioRun = ScenarioRun;
  window.scnSceneBeats = scnSceneBeats;
  window.scnSceneDuration = scnSceneDuration;
  window.SCN_SLOTS = SCN_SLOTS;
  window.SCN_SLOT_PROMPTS = SCN_SLOT_PROMPTS;
  window.SCN_TEMPLATES = SCN_TEMPLATES;
  window.SCN_TIER_LABELS = SCN_TIER_LABELS;
}
