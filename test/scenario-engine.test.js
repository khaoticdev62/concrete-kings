const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ScenarioRun, scnSceneBeats, scnSceneDuration,
  SCN_SLOTS, SCN_TEMPLATES, SCN_TIERS, SCN_TIER_LABELS
} = require('../src/pixel_engine/scenario-engine.js');

const T = SCN_TEMPLATES[0];
const actor = (str, wit, soul, name = 'You') =>
  ({ name, attributes: { str, wit, soul }, stats: { streetCred: 0, reputation: 0 } });

function filled(template = T, cards = {}) {
  const run = new ScenarioRun(template, { district: 'HARLEM' });
  run.fill('WHO', cards.WHO || 'your cousin with the van', 'You');
  run.fill('WHAT', cards.WHAT || 'take the mysterious package', 'You');
  run.fill('HOW', cards.HOW || 'pretend to be the health inspector', 'You');
  run.fill('TWIST', cards.TWIST || 'the police pull up', 'You');
  return run;
}

test('Scenario: a run is not resolvable until every slot is filled', () => {
  const run = new ScenarioRun(T);
  assert.equal(run.complete, false);
  assert.deepEqual(run.pending, SCN_SLOTS);
  assert.equal(run.resolve(actor(2, 2, 2)), null, 'an incomplete scene must not simulate');

  run.fill('WHO', 'your cousin');
  assert.deepEqual(run.pending, ['WHAT', 'HOW', 'TWIST']);
  assert.equal(filled().complete, true);
});

test('Scenario: any card fits any slot — the deck is untyped and a bad fit is the joke', () => {
  const run = new ScenarioRun(T);
  assert.equal(run.fill('WHO', 'an extremely confident pigeon'), true);
  assert.equal(run.fill('NOPE', 'a card'), false, 'an unknown slot must be rejected');
});

test('Scenario: the RPG never overrides the card — intent survives resolution verbatim', () => {
  // v2 section 10, the rule the whole revision hangs on. Whatever the simulation decides,
  // it must be deciding about the plan the players actually submitted.
  const cards = {
    WHO: 'your landlord', WHAT: 'steal the golden briefcase',
    HOW: 'while pretending to be a doctor', TWIST: 'your mother walks in'
  };
  [actor(0, 0, 0), actor(9, 9, 9)].forEach(a => {
    const result = filled(T, cards).resolve(a, { heat: 0 });
    SCN_SLOTS.forEach(s => {
      assert.equal(result.intent[s], cards[s],
        `${s} must come back exactly as played, whatever the stats did`);
    });
  });
});

test('Scenario: the narration can only be about the submitted cards', () => {
  // The structural half of section 10. If a beat could mention something the players did
  // not play, the engine would be inventing intent behind their backs.
  const cards = {
    WHO: 'ZEBRAWHO', WHAT: 'ZEBRAWHAT', HOW: 'ZEBRAHOW', TWIST: 'ZEBRATWIST'
  };
  let sawEveryTier = 0;
  // Sweep attributes and heat to reach several tiers, and check every beat of each.
  for (let str = 0; str <= 9; str += 3) {
    for (let heat = 0; heat <= 9; heat += 3) {
      const result = filled(SCN_TEMPLATES[1], cards).resolve(actor(str, 0, 0), { heat });
      const beats = scnSceneBeats(result);
      assert.ok(beats.length >= 4, 'a scene needs a shape, not one line');
      sawEveryTier++;
      beats.forEach(b => {
        // Any capitalised token in a beat that looks like a card value must be one of ours.
        const zebras = b.text.match(/ZEBRA[A-Z]*/g) || [];
        zebras.forEach(z => assert.ok(Object.values(cards).includes(z),
          `beat invented a value: ${z} in "${b.text}"`));
      });
    }
  }
  assert.ok(sawEveryTier > 0);
});

test('Scenario: beat text never varies with the actor, so it cannot mis-conjugate', () => {
  // Real output was "You moves on it with a networking event...", from interpolating an
  // actor that can be either "You" or a name. My first attempt at this test asserted the
  // actor's name is absent from every beat, which failed on the fixed second person in
  // "You walk. Clean, mostly." — that line is always grammatical and was never the bug.
  //
  // The invariant that actually prevents the defect is that beats must not DEPEND on the
  // actor: fixed second person is fine, interpolating a name is not.
  const cards = { WHO: 'a networking event', WHAT: 'a check', HOW: 'a bad idea', TWIST: 'sirens' };
  const texts = ['You', 'Ray', 'Tasha'].map(name =>
    scnSceneBeats(filled(T, cards).resolve(actor(4, 4, 4, name), {})).map(b => b.text));

  // Same plan, same stats, different name: the seed includes the name so the tier may
  // differ, but wherever the tier matches the prose must match exactly.
  const byTier = {};
  ['You', 'Ray', 'Tasha'].forEach((name, idx) => {
    const r = filled(T, cards).resolve(actor(4, 4, 4, name), {});
    (byTier[r.tier] = byTier[r.tier] || []).push(texts[idx].join('|'));
  });
  Object.entries(byTier).forEach(([tier, variants]) => {
    assert.equal(new Set(variants).size, 1,
      `${tier} narration differs by actor name, so it is interpolating one`);
  });
});

test('Scenario: slot beats are labelled, so a noun-phrase card still reads', () => {
  // Every card in this deck is a noun phrase, so "The method: a collard greens that needed
  // more seasoning" came out as broken English rather than as a joke. Announcing each slot
  // as a labelled ingredient is what lets any card land.
  const result = filled(T, {
    WHO: 'a networking event', WHAT: 'a commission check',
    HOW: 'a collard greens that needed more seasoning', TWIST: 'a shop owner'
  }).resolve(actor(4, 4, 4), {});
  const beats = scnSceneBeats(result);
  ['IN ON IT', 'THE PLAY', 'THE ANGLE', 'THEN'].forEach(label => {
    assert.ok(beats.some(b => b.text.startsWith(label + ' —')),
      `the ${label} beat must be labelled rather than phrased as a sentence`);
  });
});

test('Scenario: stats decide execution — the same plan resolves differently by character', () => {
  // v2 section 9. If these came out the same, the RPG layer would be decorative.
  const cards = { WHO: 'a cop', WHAT: 'talk your way out', HOW: 'with excessive confidence', TWIST: 'everyone recognises you' };
  const weak = filled(SCN_TEMPLATES[2], cards).resolve(actor(0, 0, 0, 'Weak'), { heat: 4 });
  const strong = filled(SCN_TEMPLATES[2], cards).resolve(actor(9, 9, 9, 'Strong'), { heat: 0 });

  assert.ok(strong.score > weak.score, 'a better character must execute the same plan better');
  assert.notEqual(strong.tier, weak.tier, 'and that must actually change the outcome tier');
});

test('Scenario: the plan leans on the template attribute, not on all of them', () => {
  // THE SITDOWN leans on soul. A player who is all muscle and no soul should not ace it.
  const sitdown = SCN_TEMPLATES.find(t => t.id === 'THE_SITDOWN');
  assert.equal(sitdown.attr, 'soul');
  const allSoul = filled(sitdown).resolve(actor(0, 0, 9, 'Soul'), {});
  const allStr = filled(sitdown).resolve(actor(9, 0, 0, 'Muscle'), {});
  assert.ok(allSoul.score > allStr.score,
    'the attribute the scenario names must be the one that matters');
  assert.equal(allSoul.leaning, 'soul');
});

test('Scenario: heat makes everything harder, so the world state is felt', () => {
  const cool = filled().resolve(actor(4, 4, 4), { heat: 0 });
  const hot = filled().resolve(actor(4, 4, 4), { heat: 10 });
  assert.ok(hot.score < cool.score, 'a hot block must be harder to work');
  assert.equal(cool.breakdown.world, 0);
  assert.ok(hot.breakdown.world < 0);
});

test('Scenario: every tier is reachable, and CHAOTIC SUCCESS actually occurs', () => {
  // A tier that can never happen is dead content. Swept across characters, heat and cards.
  const seen = new Set();
  const cardSets = [
    { WHO: 'your cousin', WHAT: 'take the bag', HOW: 'quietly', TWIST: 'the police pull up' },
    { WHO: 'the snitch', WHAT: 'rent money', HOW: 'by lying', TWIST: 'a warrant' },
    { WHO: 'grandma', WHAT: 'the cookout', HOW: 'with family', TWIST: 'nothing at all' }
  ];
  SCN_TEMPLATES.forEach(t => {
    cardSets.forEach(cards => {
      for (let a = 0; a <= 9; a++) {
        for (let heat = 0; heat <= 12; heat += 3) {
          seen.add(filled(t, cards).resolve(actor(a, a, a, 'P' + a), { heat }).tier);
        }
      }
    });
  });
  SCN_TIERS.forEach(tier => assert.ok(seen.has(tier), `${tier} is unreachable`));
  assert.ok(seen.has('CHAOTIC_SUCCESS'),
    'chaotic success is the signature outcome and must actually fire');
});

test('Scenario: chaotic success pays reputation but never pays the stake', () => {
  // v2 section 21: you did not get the money, you created an opportunity. If it paid the
  // stake it would just be a success with extra steps.
  const fx = ScenarioRun.effectsFor('CHAOTIC_SUCCESS', 'cash');
  assert.equal(fx.cash, 0, 'the plan failed, so the thing it was for is not obtained');
  assert.ok(fx.reputation > 0, 'but the block noticed');
  assert.ok(fx.heat > 0, 'and it was not free');
});

test('Scenario: every tier moves something, and the costed tiers actually cost', () => {
  // My first version of this asserted that EVERY non-failure tier must cost something,
  // and SUCCESS failed it. The assertion was wrong, not the design: section 20 lists
  // SUCCESS and SUCCESS_WITH_CONSEQUENCE as separate tiers, so a clean success is exactly
  // what makes the costed one mean anything. What section 22 actually requires is that the
  // tiers which are supposed to carry a bill do carry one.
  const COSTED = ['SUCCESS_WITH_CONSEQUENCE', 'PARTIAL_FAILURE', 'FAILURE',
    'CATASTROPHIC_FAILURE', 'CHAOTIC_SUCCESS'];

  [...SCN_TIERS, 'CHAOTIC_SUCCESS'].forEach(tier => {
    const fx = ScenarioRun.effectsFor(tier, 'cash');
    assert.ok(Object.values(fx).some(v => v !== 0), `${tier} must actually change something`);
    if (COSTED.includes(tier)) {
      assert.ok(Object.values(fx).some(v => v < 0) || fx.heat > 0,
        `${tier} must cost something — section 22 is about the bill`);
    }
  });

  // And a plain SUCCESS must stay clean, or the costed tier above it is indistinguishable.
  const clean = ScenarioRun.effectsFor('SUCCESS', 'cash');
  assert.equal(clean.heat, 0);
  assert.ok(clean.cash > 0 && clean.reputation > 0);
});

test('Scenario: the same plan by the same person always plays out the same way', () => {
  // Determinism (v1 section 64). The game has an online mode; a scene that differs per
  // client is players watching two different stories.
  const cards = { WHO: 'your ex', WHAT: 'the briefcase', HOW: 'a fake badge', TWIST: 'sirens' };
  const once = filled(T, cards).resolve(actor(3, 5, 2, 'Ray'), { heat: 2 });
  const twice = filled(T, cards).resolve(actor(3, 5, 2, 'Ray'), { heat: 2 });
  assert.deepEqual(once, twice);
  // And a different plan must not collide onto the same scene.
  const other = filled(T, { ...cards, HOW: 'a real badge' }).resolve(actor(3, 5, 2, 'Ray'), { heat: 2 });
  assert.notDeepEqual(once.breakdown, other.breakdown);
});

test('Scenario: playback fits the 10-60 second window the revision asks for', () => {
  // v2 section 16. The goal is "it actually did it", not a cutscene.
  SCN_TEMPLATES.forEach(t => {
    ['CRITICAL_SUCCESS', 'CHAOTIC_SUCCESS', 'CATASTROPHIC_FAILURE'].forEach(() => {
      const result = filled(t).resolve(actor(5, 5, 5), {});
      const ms = scnSceneDuration(scnSceneBeats(result));
      assert.ok(ms >= 10000 && ms <= 60000,
        `${t.id} scene runs ${ms}ms, outside the 10-60s window`);
    });
  });
});

test('Scenario: every template names a real mini-game for its micro-scene', () => {
  // v2 section 18 asks for playable micro-scenes. This game already has five, so a
  // template pointing at one that is not registered would be a dead hand-off.
  const registered = new Set(['street_dice', 'bodega_run', 'haircut_challenge', 'lockpicking', 'negotiation']);
  SCN_TEMPLATES.forEach(t => {
    assert.ok(registered.has(t.micro), `${t.id} points at unregistered mini-game ${t.micro}`);
    assert.ok(['str', 'wit', 'soul'].includes(t.attr), `${t.id} leans on unknown attribute ${t.attr}`);
    assert.ok(['heat', 'cash', 'trust', 'reputation'].includes(t.stake),
      `${t.id} stakes unknown stat ${t.stake}`);
  });
});

test('Scenario: the causal chain is reportable, so the player can see they caused it', () => {
  // v2 section 29: the player must always be able to trace card -> outcome.
  const result = filled().resolve(actor(4, 4, 4), {});
  assert.ok(result.chain.length >= 3);
  assert.ok(result.chain[0].includes('WHO'), 'the chain must start at the cards played');
  assert.ok(result.chain[result.chain.length - 1].includes(SCN_TIER_LABELS[result.tier]),
    'and end at the outcome');
  assert.ok(result.contributors.WHO, 'and record who contributed each slot for party play');
});

test('Scenario: bad input degrades instead of throwing, because this runs in the round loop', () => {
  const run = filled();
  assert.doesNotThrow(() => run.resolve(null, null));
  assert.doesNotThrow(() => run.resolve({}, {}));
  assert.doesNotThrow(() => run.resolve(actor(1, 1, 1), { heat: 'nonsense' }));
  assert.deepEqual(scnSceneBeats(null), []);
  assert.equal(scnSceneDuration(null), 0);
});
