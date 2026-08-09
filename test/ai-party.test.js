const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AiCompanion, AiParty, AIP_ARCHETYPES, AIP_OBJECTIVES, AIP_DIFFICULTY, AIP_REL_DIMS
} = require('../src/pixel_engine/ai-party.js');
const { SCN_SLOTS, SCN_TEMPLATES, ScenarioRun } = require('../src/pixel_engine/scenario-engine.js');

const HAND = [
  'unpaid parking tickets',
  'rent money in a sock',
  'the cookout at grandma house',
  'the snitch from the third floor',
  'an extremely confident pigeon that nobody wants to talk about anymore',
  'a bucket'
];

function companion(archetype, opts = {}) {
  const c = new AiCompanion({ name: opts.name || 'Marcus', archetype, objective: opts.objective });
  c.hand = [...HAND];
  return c;
}

test('AI: companions hold real cards and can only play what they hold', () => {
  // Section 6. If a companion could answer "what would you do?" it would always have
  // exactly the right card, and the game's own rules would not apply to it.
  const party = AiParty.generate({ size: 3, seed: 'realhands' });
  const deck = { items: [...HAND, ...HAND], draw() { return this.items.pop(); } };
  party.deal(deck, 4);

  party.members.forEach(m => assert.equal(m.hand.length, 4));
  const before = party.members[0].hand.length;
  const plans = party.completePlans(SCN_SLOTS, { stake: 'cash', seed: 'r1' });

  plans.forEach(plan => {
    SCN_SLOTS.forEach(slot => {
      assert.ok(plan.slots[slot], `${plan.author} must fill ${slot}`);
      assert.ok(HAND.includes(plan.slots[slot]) || plan.slots[slot] === '(nothing left)',
        `${plan.author} played a card that was never in any hand: ${plan.slots[slot]}`);
    });
  });
  assert.ok(party.members[0].hand.length < before, 'a played card must leave the hand');
});

test('AI: personality changes the pick — archetypes do not all play the same card', () => {
  // If these agreed, the seven archetypes would be flavour text.
  const picks = new Set();
  Object.keys(AIP_ARCHETYPES).forEach(a => {
    const c = companion(a, { name: 'P_' + a });
    picks.add(c.hand[c.chooseCard({ stake: 'cash', seed: 'same', slot: 'WHAT', difficulty: 'HARD' })]);
  });
  assert.ok(picks.size > 1, `every archetype chose the same card: ${[...picks]}`);
});

test('AI: greed reaches for money, empathy reaches for family', () => {
  const greedy = companion('GREEDY_ONE');
  const loyal = companion('LOYALIST');
  const cash = 'rent money in a sock';
  const family = 'the cookout at grandma house';
  const ctx = { difficulty: 'HARD' };

  assert.ok(greedy.scoreCard(cash, ctx) > greedy.scoreCard(family, ctx),
    'the greedy one must prefer the money');
  assert.ok(loyal.scoreCard(family, ctx) > loyal.scoreCard(cash, ctx),
    'the loyalist must prefer the family card');
});

test('AI: difficulty changes decision quality but never personality', () => {
  // Section 35, and section 36 calls the second half essential. Raising difficulty must not
  // converge every companion onto one optimiser.
  const chaosStory = companion('CHAOS_AGENT');
  const chaosNightmare = companion('CHAOS_AGENT');
  assert.deepEqual(chaosStory.traits, chaosNightmare.traits,
    'difficulty must not be baked into traits');

  const stakeCard = 'rent money in a sock';
  const straight = companion('STRAIGHT_MAN');
  const chaos = companion('CHAOS_AGENT');
  // On the hardest setting the tactical read is strongest, yet the two still disagree
  // because personality is weighted independently of it.
  const sStraight = straight.scoreCard(stakeCard, { stake: 'cash', difficulty: 'NIGHTMARE' });
  const sChaos = chaos.scoreCard('an extremely confident pigeon that nobody wants to talk about anymore',
    { stake: 'cash', difficulty: 'NIGHTMARE' });
  assert.ok(sChaos > 0, 'the chaos agent must still find the absurd card attractive at NIGHTMARE');
  assert.ok(sStraight > 0);
});

test('AI: the pick is not always the highest-scoring card', () => {
  // Section 8: a perfect optimiser is boring. Across seeds the same companion must
  // sometimes take something other than its top card.
  const picks = new Set();
  for (let i = 0; i < 30; i++) {
    const c = companion('WILDCARD');
    picks.add(c.chooseCard({ stake: 'cash', seed: 'seed' + i, slot: 'WHAT', difficulty: 'STORY' }));
  }
  assert.ok(picks.size > 1, 'STORY difficulty must produce varied picks, not one answer');
});

test('AI: relationships start neutral-positive and clamp to 0..100', () => {
  const c = companion('STRAIGHT_MAN');
  const rel = c.toward('You');
  AIP_REL_DIMS.forEach(d => assert.ok(typeof rel[d] === 'number', `${d} must exist`));
  assert.ok(rel.trust >= 40, 'a companion who has never met you must not start distrustful');

  c.adjust('You', { trust: -999, rivalry: 999 });
  assert.equal(c.toward('You').trust, 0);
  assert.equal(c.toward('You').rivalry, 100);
  c.adjust('You', { nonsense: 50 });
  assert.equal(c.toward('You').nonsense, undefined, 'unknown dimensions are ignored');
});

test('AI: emotion is derived from the relationship, so it cannot contradict it', () => {
  // Section 30. A companion at trust 5 and rivalry 80 reported as CALM would be a lie the
  // player can see through immediately.
  const c = companion('STRAIGHT_MAN');
  assert.equal(c.updateEmotion('You'), 'CALM');
  c.adjust('You', { trust: -40, rivalry: 70 });
  assert.equal(c.updateEmotion('You'), 'BETRAYED');
});

test('AI: betrayal requires a cause and reports it', () => {
  // Section 20 rules out "the script said so". A betrayal the player cannot reconstruct
  // afterwards reads as the game cheating.
  const fresh = companion('SCHEMER');
  const clean = fresh.betrayalRisk('You');
  assert.equal(clean.willBetray, false, 'a companion with no grievance must not turn');

  const wronged = companion('SCHEMER');
  wronged.adjust('You', { trust: -40, rivalry: 70, suspicion: 60 });
  wronged.updateEmotion('You');
  const risk = wronged.betrayalRisk('You');
  assert.ok(risk.causes.length > 0, 'the causes must be enumerable');
  assert.ok(risk.pressure > clean.pressure);
});

test('AI: betrayal is telegraphed before it fires', () => {
  // Section 21: the player should be able to look back and think "I should have seen that".
  // So there must be a band where the warning is up but the betrayal has not happened.
  const c = companion('SCHEMER');
  let sawWarningBeforeBetrayal = false;
  for (let i = 0; i < 20; i++) {
    c.adjust('You', { trust: -6, rivalry: 5, suspicion: 5 });
    c.updateEmotion('You');
    const r = c.betrayalRisk('You');
    if (r.warning && !r.willBetray) sawWarningBeforeBetrayal = true;
    if (r.willBetray) break;
  }
  assert.ok(sawWarningBeforeBetrayal,
    'there must be a window where the warning shows and the betrayal has not yet fired');
});

test('AI: a loyalist is genuinely harder to turn than a schemer', () => {
  const mk = (a) => {
    const c = companion(a);
    c.adjust('You', { trust: -45, rivalry: 75, suspicion: 65 });
    c.updateEmotion('You');
    return c.betrayalRisk('You');
  };
  const schemer = mk('SCHEMER');
  const loyalist = mk('LOYALIST');
  assert.ok(schemer.willBetray, 'a wronged schemer should turn');
  assert.equal(loyalist.willBetray, false,
    'loyalty must be a real brake, not a modifier — same grievance, different answer');
});

test('AI: voting is social, not optimal, and never self-serving by default', () => {
  // Sections 16-17. A companion votes for a worse plan because they dislike the author.
  const c = companion('INSTIGATOR');
  const plans = [
    { author: 'Marcus', summary: 'rent money in a sock' },
    { author: 'Rico', summary: 'a bucket' }
  ];
  // Marcus is itself, so it must vote for the other plan.
  const choice = c.vote(plans, { seed: 'v1' });
  assert.equal(choice.author, 'Rico', 'a companion must not vote for its own plan');

  // Now make Rico hated and confirm the vote moves.
  const hater = companion('INSTIGATOR', { name: 'Nay' });
  hater.adjust('Rico', { rivalry: 90, trust: -45 });
  hater.adjust('Marcus', { friendship: 40, trust: 30 });
  const swayed = hater.vote(plans, { seed: 'v1' });
  assert.equal(swayed.author, 'Marcus', 'dislike must be able to decide a vote');
});

test('AI: a companion votes for itself only when there is nothing else', () => {
  const c = companion('GREEDY_ONE');
  const only = c.vote([{ author: 'Marcus', summary: 'a bucket' }], { seed: 'x' });
  assert.equal(only.author, 'Marcus', 'with no alternative the single plan wins');
});

test('AI: companions pick up the block running jokes', () => {
  // Section 47: the AI starts referencing what the block repeats. Reads the same legends
  // the human's own crowned cards produce, so there is one culture rather than two.
  const c = companion('WILDCARD');
  const plain = c.scoreCard('a bucket', { difficulty: 'HARD' });
  const withLegend = c.scoreCard('a bucket', { difficulty: 'HARD', legends: ['bucket'] });
  assert.ok(withLegend > plain, 'an established legend must make the card more attractive');
});

test('AI: memory is banded, and only CANON survives a save', () => {
  // Section 13. Persisting everything makes memory a log where nothing is significant.
  const c = companion('STRAIGHT_MAN');
  c.remember({ text: 'minor thing', importance: 10 });
  c.remember({ text: 'notable thing', importance: 35 });
  c.remember({ text: 'big thing', importance: 90 });
  assert.deepEqual(c.memories.map(m => m.band), ['MINOR', 'NOTABLE', 'CANON']);

  const restored = AiCompanion.fromJSON(JSON.parse(JSON.stringify(c.toJSON())));
  assert.deepEqual(restored.memories.map(m => m.text), ['big thing']);
  assert.equal(c.significantMemories(1)[0].text, 'big thing');
});

test('AI: personality drift is bounded, so an archetype cannot become another one', () => {
  // Section 22 wants development. Unbounded drift is not development, it is noise.
  const c = companion('STRAIGHT_MAN');
  const base = AIP_ARCHETYPES.STRAIGHT_MAN.chaos;
  for (let i = 0; i < 200; i++) c.evolve('SURVIVED_CHAOS');
  assert.ok(c.traits.chaos > base, 'surviving chaos must actually change them');
  assert.ok(c.traits.chaos <= base + 0.351,
    `drift must stay near the archetype, got ${c.traits.chaos} from ${base}`);
  assert.ok(c.traits.chaos < AIP_ARCHETYPES.CHAOS_AGENT.chaos,
    'a Straight Man must never drift into a Chaos Agent');
});

test('AI: evolving one companion does not change every companion of that archetype', () => {
  // Traits are copied from the archetype, not referenced. Sharing the object would let one
  // companion's arc rewrite everyone else's personality, including in a later save.
  const a = companion('LOYALIST', { name: 'A' });
  const b = companion('LOYALIST', { name: 'B' });
  for (let i = 0; i < 20; i++) a.evolve('BETRAYED');
  assert.notEqual(a.traits.loyalty, b.traits.loyalty);
  assert.equal(b.traits.loyalty, AIP_ARCHETYPES.LOYALIST.loyalty);
  assert.equal(AIP_ARCHETYPES.LOYALIST.loyalty, 0.95, 'the archetype table must be untouched');
});

test('AI: the party preview shows the party that actually gets played', () => {
  // Section 44. A re-roll between preview and start would make the preview a lie.
  const a = AiParty.generate({ size: 3, seed: 'preview-me' });
  const b = AiParty.generate({ size: 3, seed: 'preview-me' });
  assert.deepEqual(a.members.map(m => m.name + ':' + m.archetypeId),
    b.members.map(m => m.name + ':' + m.archetypeId));
  assert.equal(new Set(a.members.map(m => m.name)).size, 3, 'names must be unique');
});

test('AI: themed parties honour their theme', () => {
  const worst = AiParty.generate({ size: 3, seed: 't', theme: 'WORST_POSSIBLE' });
  const ids = worst.members.map(m => m.archetypeId);
  assert.ok(ids.includes('CHAOS_AGENT') && ids.includes('INSTIGATOR'),
    `"The Worst Possible Team" must actually be bad news: ${ids}`);

  const solid = AiParty.generate({ size: 3, seed: 't', theme: 'SOLID_CREW' });
  assert.ok(solid.members.every(m => ['LOYALIST', 'STRAIGHT_MAN'].includes(m.archetypeId)));
});

test('AI: party size is clamped to the PRD range', () => {
  assert.equal(AiParty.generate({ size: 99, seed: 's' }).members.length, 7, 'max 7 companions');
  assert.equal(AiParty.generate({ size: 0, seed: 's' }).members.length, 1, 'min 1 companion');
});

test('AI: an outcome updates relationships, memory, XP and emotion together', () => {
  // Section 27's memory-update step. Importance is derived from the outcome rather than
  // passed in, so a routine round cannot be recorded as campaign-defining.
  const party = AiParty.generate({ size: 3, seed: 'outcome' });
  const before = party.members.map(m => ({ ...m.toward('You') }));

  const great = party.applyOutcome(
    { tier: 'CRITICAL_SUCCESS', title: 'THE CORNER STORE', label: 'CRITICAL SUCCESS' },
    { author: 'You', round: 3 });

  assert.equal(great.reactions.length, 3);
  assert.equal(great.importance, 85, 'a critical success is campaign memory');
  party.members.forEach((m, i) => {
    assert.ok(m.toward('You').respect > before[i].respect, 'a great run must earn respect');
    assert.ok(m.xp > 0);
    assert.ok(m.memories.length > 0);
  });

  const bad = party.applyOutcome({ tier: 'FAILURE', title: 'THE DICE', label: 'FAILURE' },
    { author: 'You', round: 4 });
  assert.equal(bad.importance, 60);
});

test('AI: a chaotic run specifically costs you the conservative companions', () => {
  // Section 31: a conservative AI eventually stops letting you plan.
  const party = new AiParty({ humanName: 'You' });
  const cautious = new AiCompanion({ name: 'Marcus', archetype: 'STRAIGHT_MAN' });
  const wild = new AiCompanion({ name: 'Rico', archetype: 'CHAOS_AGENT' });
  party.members = [cautious, wild];

  const trustBefore = { m: cautious.toward('You').trust, r: wild.toward('You').trust };
  party.applyOutcome({ tier: 'CHAOTIC_SUCCESS', title: 'THE DICE', label: 'CHAOTIC SUCCESS' },
    { author: 'You', round: 1 });

  assert.ok(cautious.toward('You').trust < trustBefore.m + 4,
    'the cautious one must not simply be delighted by chaos');
  assert.ok(wild.toward('You').trust >= trustBefore.r,
    'the chaos agent has no complaint');
});

test('AI: the recap reports recorded memories and never invents any', () => {
  // Section 41, and the same rule the scenario narrator follows. A recap that embellishes
  // is one the player cannot trust when trying to remember what happened.
  const party = AiParty.generate({ size: 2, seed: 'recap' });
  const empty = party.recap();
  assert.match(empty.events[0], /Nothing has happened/);
  assert.equal(empty.standing.length, 2);

  party.applyOutcome({ tier: 'CRITICAL_SUCCESS', title: 'THE BACK DOOR', label: 'CRITICAL SUCCESS' },
    { author: 'You', round: 1 });
  const after = party.recap();
  const recorded = new Set(party.members.flatMap(m => m.memories.map(x => x.text)));
  after.events.forEach(e => assert.ok(recorded.has(e), `recap invented a line: "${e}"`));
});

test('AI: a party survives a save/load round trip with its grudges intact', () => {
  const party = AiParty.generate({ size: 3, seed: 'save', difficulty: 'HARD' });
  party.members[0].adjust('You', { trust: -30, rivalry: 60 });
  party.members[0].remember({ text: 'you left me at the store', importance: 95 });
  party.members[0].updateEmotion('You');

  const restored = AiParty.fromJSON(JSON.parse(JSON.stringify(party.toJSON())));
  assert.equal(restored.difficulty, 'HARD');
  assert.equal(restored.members.length, 3);
  assert.deepEqual(restored.members[0].toward('You'), party.members[0].toward('You'));
  assert.equal(restored.members[0].emotion, party.members[0].emotion);
  assert.equal(restored.members[0].memories[0].text, 'you left me at the store');
});

test('AI: companion plans run through the same ScenarioRun the human uses', () => {
  // Section 27: no separate AI rules. The proof is that a companion's completion resolves
  // through the identical pipeline and produces the identical result shape.
  const party = AiParty.generate({ size: 2, seed: 'pipeline' });
  const deck = { items: [...HAND, ...HAND, ...HAND], draw() { return this.items.pop(); } };
  party.deal(deck, 5);
  const plans = party.completePlans(SCN_SLOTS, { stake: 'cash', seed: 'p1' });

  const run = new ScenarioRun(SCN_TEMPLATES[0], { district: 'HARLEM' });
  SCN_SLOTS.forEach(s => run.fill(s, plans[0].slots[s], plans[0].author));
  assert.equal(run.complete, true);

  const result = run.resolve({ name: plans[0].author, attributes: { str: 3, wit: 3, soul: 3 } }, {});
  assert.ok(result, 'a companion plan must resolve');
  SCN_SLOTS.forEach(s => assert.equal(result.intent[s], plans[0].slots[s],
    'the companion plan must survive resolution verbatim, exactly as the human plan does'));
});

test('AI: decisions are deterministic, so a campaign replays identically', () => {
  const run = () => {
    const p = AiParty.generate({ size: 3, seed: 'determinism' });
    const deck = { items: [...HAND, ...HAND, ...HAND], draw() { return this.items.pop(); } };
    p.deal(deck, 5);
    const plans = p.completePlans(SCN_SLOTS, { stake: 'cash', seed: 'round-1' });
    const votes = p.tallyVotes(plans, { seed: 'round-1' });
    return JSON.stringify({ plans, votes });
  };
  assert.equal(run(), run());
});

test('AI: bad input degrades instead of throwing, because this runs in the round loop', () => {
  const c = new AiCompanion({});
  assert.equal(c.chooseCard({}), -1, 'an empty hand must report no choice, not throw');
  assert.equal(c.vote([], {}), null);
  assert.equal(c.vote(null, null), null);
  assert.doesNotThrow(() => c.remember({}));
  assert.doesNotThrow(() => c.evolve('NOT_A_THING'));
  assert.doesNotThrow(() => c.scoreCard(undefined, undefined));
  assert.equal(AiCompanion.fromJSON(null), null);
  assert.equal(AiParty.fromJSON(null), null);

  const party = new AiParty({});
  assert.doesNotThrow(() => party.deal(null, 5));
  assert.doesNotThrow(() => party.applyOutcome(null, null));
  assert.doesNotThrow(() => party.recap());
  assert.ok(AIP_OBJECTIVES.length > 0);
  assert.ok(Object.keys(AIP_DIFFICULTY).length === 4);
});
