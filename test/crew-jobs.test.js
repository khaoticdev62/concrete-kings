const test = require('node:test');
const assert = require('node:assert/strict');
const { crewProposals, crewPartyEvent, CJB_ATTRS, CJB_STAKES, CJB_MICRO } =
  require('../src/pixel_engine/crew-jobs.js');
const { AiCompanion, AiParty, AIP_OBJECTIVES } = require('../src/pixel_engine/ai-party.js');
const { ScenarioRun, SCN_SLOTS } = require('../src/pixel_engine/scenario-engine.js');

const obj = (id) => AIP_OBJECTIVES.find(o => o.id === id);

function partyOf(specs) {
  const p = new AiParty({ humanName: 'You' });
  p.members = specs.map(s => {
    const c = new AiCompanion({ name: s.name, archetype: s.archetype, objective: s.objective });
    if (s.emotion) c.emotion = s.emotion;
    if (s.level) c.level = s.level;
    return c;
  });
  return p;
}

test('Jobs: a settled crew propose nothing, rather than filler', () => {
  // An empty list is the correct answer on a quiet night. Manufacturing a proposal so the
  // list is never empty is exactly the filler this module exists to avoid.
  const calm = partyOf([{ name: 'Marcus', archetype: 'STRAIGHT_MAN' }]);
  assert.deepEqual(crewProposals(calm, { legends: [], heat: 0 }), []);
  assert.deepEqual(crewProposals(null, {}), []);
  assert.deepEqual(crewProposals(new AiParty({}), {}), []);
});

test('Jobs: every proposal carries a reason traceable to real state', () => {
  // The rule this module is built on. A companion proposing a job "because it is time for a
  // job" is the same defect as an uncaused betrayal — unreconstructable, so it reads as the
  // game generating filler instead of a character wanting something.
  const party = partyOf([
    { name: 'Marcus', archetype: 'GREEDY_ONE', objective: obj('GET_PAID') },
    { name: 'Tasha', archetype: 'STRAIGHT_MAN', emotion: 'AFRAID' },
    { name: 'Rico', archetype: 'SCHEMER', objective: obj('BE_KNOWN') }
  ]);
  const proposals = crewProposals(party, { legends: [], heat: 0 });

  assert.ok(proposals.length >= 3, 'three motivated companions should each want something');
  proposals.forEach(p => {
    assert.ok(p.reason && p.reason.length > 8, `${p.proposer} gave no reason: ${p.reason}`);
    assert.ok(p.reason.includes(p.proposer),
      `the reason must name whose it is: "${p.reason}"`);
    assert.ok(p.kind, 'a proposal must record which rule produced it');
  });
});

test('Jobs: a grudge proposal names a real crew member, never an invented one', () => {
  const party = partyOf([
    { name: 'Marcus', archetype: 'INSTIGATOR' },
    { name: 'Tasha', archetype: 'LOYALIST' }
  ]);
  party.members[0].adjust('Tasha', { rivalry: 80, trust: -40 });

  const p = crewProposals(party, { legends: [], heat: 0 }).find(x => x.proposer === 'Marcus');
  assert.ok(p, 'a companion with a grudge must raise it');
  assert.equal(p.kind, 'SETTLE_UP');
  assert.ok(p.template.title.includes('TASHA'), `title must name the target: ${p.template.title}`);
  assert.ok(p.reason.includes('Tasha'));
  // And never itself.
  assert.ok(!p.template.title.includes('MARCUS'));
});

test('Jobs: a companion cannot hold a grudge against somebody not in the crew', () => {
  // The grudge scan is restricted to the other members, so a relationship with the player or
  // a departed companion cannot produce a job about somebody who is not there.
  const party = partyOf([{ name: 'Marcus', archetype: 'INSTIGATOR' }]);
  party.members[0].adjust('You', { rivalry: 95, trust: -50 });
  party.members[0].adjust('Ghost', { rivalry: 95, trust: -50 });

  const p = crewProposals(party, { legends: [], heat: 0 })[0];
  if (p) {
    assert.notEqual(p.kind, 'SETTLE_UP',
      'a solo companion has nobody in the crew to settle up with');
  }
});

test('Jobs: the block running jokes become work — the AI creates canon', () => {
  // Section 49: the player is not the only source of story. A motif the players made becomes
  // a job a companion brings to them.
  const party = partyOf([{ name: 'Rico', archetype: 'WILDCARD' }]);
  const p = crewProposals(party, { legends: ['pigeon'], heat: 0 })[0];

  assert.ok(p, 'an established legend must be enough reason for a job');
  assert.equal(p.kind, 'RUNNING_JOKE');
  assert.ok(p.template.title.includes('PIGEON'));
  assert.ok(p.template.setup.includes('pigeon'));
  assert.ok(p.reason.includes('pigeon'));
});

test('Jobs: a grudge outranks a running joke, because the stronger feeling wins', () => {
  // Kinds are ordered on purpose. A companion who is both furious and amused should raise the
  // grudge, which is how a person works.
  const party = partyOf([
    { name: 'Marcus', archetype: 'INSTIGATOR' },
    { name: 'Tasha', archetype: 'LOYALIST' }
  ]);
  party.members[0].adjust('Tasha', { rivalry: 80, trust: -40 });

  const p = crewProposals(party, { legends: ['pigeon'], heat: 9 }).find(x => x.proposer === 'Marcus');
  assert.equal(p.kind, 'SETTLE_UP', 'the grudge must come first');
});

test('Jobs: heat on the block is reason enough to want a quiet one', () => {
  const party = partyOf([{ name: 'Tasha', archetype: 'LOYALIST' }]);
  const quiet = crewProposals(party, { legends: [], heat: 8 })[0];
  assert.ok(quiet, 'a hot block must produce a proposal');
  assert.equal(quiet.kind, 'LAY_LOW');
  assert.equal(quiet.template.stake, 'heat');
  assert.ok(quiet.template.setup.includes('not wrong'),
    'at real heat the setup should concede they have a point');
});

test('Jobs: one proposal per companion, not a list of everything they want', () => {
  const party = partyOf([
    // Broke, scared, competitive and holding a grudge, all at once.
    { name: 'Marcus', archetype: 'GREEDY_ONE', objective: obj('GET_PAID'), emotion: 'AFRAID' },
    { name: 'Tasha', archetype: 'LOYALIST' }
  ]);
  party.members[0].adjust('Tasha', { rivalry: 80, trust: -30 });
  const mine = crewProposals(party, { legends: ['pigeon'], heat: 9 })
    .filter(p => p.proposer === 'Marcus');
  assert.equal(mine.length, 1, 'a companion raises one thing, the strongest');
});

test('Jobs: a generated template is valid for the scenario engine and actually runs', () => {
  // Section 27 again: no separate AI rules. An AI-initiated job must go through the identical
  // ScenarioRun, or this would be a second pipeline pretending to be the first.
  const party = partyOf([
    { name: 'Marcus', archetype: 'GREEDY_ONE', objective: obj('GET_PAID') },
    { name: 'Tasha', archetype: 'STRAIGHT_MAN', emotion: 'AFRAID' },
    { name: 'Rico', archetype: 'SCHEMER', objective: obj('BE_KNOWN') }
  ]);
  const proposals = crewProposals(party, { legends: ['bucket'], heat: 7 });
  assert.ok(proposals.length > 0);

  proposals.forEach(p => {
    const t = p.template;
    assert.ok(t.id && /^[A-Z0-9_]+$/.test(t.id), `bad id: ${t.id}`);
    assert.ok(t.title && t.setup && t.setup.length > 40, 'a job needs a real brief');
    assert.ok(CJB_ATTRS.includes(t.attr), `bad attr: ${t.attr}`);
    assert.ok(CJB_STAKES.includes(t.stake), `bad stake: ${t.stake}`);
    assert.ok(CJB_MICRO.includes(t.micro), `bad micro-game: ${t.micro}`);
    assert.equal(t.proposedBy, p.proposer, 'the template must credit whoever raised it');

    // And it resolves through the real engine.
    const run = new ScenarioRun(t, { district: 'HARLEM' });
    SCN_SLOTS.forEach(s => run.fill(s, 'a ' + s.toLowerCase() + ' card', 'You'));
    const result = run.resolve({ name: 'You', attributes: { str: 4, wit: 4, soul: 4 } }, { heat: 7 });
    assert.ok(result, `${t.id} must resolve`);
    assert.equal(result.title, t.title);
    assert.ok(result.effects, 'and produce consequences like any other job');
  });
});

test('Jobs: the same job is never offered twice', () => {
  // Caught by running it: two companions with no stronger motive both raised "THE PIGEON
  // THING", identical title and identical reason, so the player was offered the same work
  // twice. Some kinds are impersonal — a running joke belongs to the block, not to one
  // companion — so a claimed title makes the next companion fall through to their own next
  // motive, which also surfaces more of what the crew actually want.
  const party = partyOf([
    { name: 'Marcus', archetype: 'WILDCARD' },
    { name: 'Tasha', archetype: 'WILDCARD' },
    { name: 'Rico', archetype: 'WILDCARD' }
  ]);
  const proposals = crewProposals(party, { legends: ['pigeon'], heat: 8 });
  const titles = proposals.map(p => p.template.title);
  assert.equal(new Set(titles).size, titles.length, `duplicate offers: ${titles.join(' / ')}`);

  // And falling through must produce something different, not silence.
  assert.ok(proposals.length >= 2,
    'a crew with two available motives should raise two different jobs');
  assert.ok(new Set(proposals.map(p => p.kind)).size >= 2, 'and they should be different kinds');
});

test('Jobs: two grudges against different people are both offered', () => {
  // Dedupe is on the generated title, so genuinely distinct jobs must survive it — SETTLE_UP
  // names its target, so two grudges are two different jobs.
  const party = partyOf([
    { name: 'Marcus', archetype: 'INSTIGATOR' },
    { name: 'Tasha', archetype: 'INSTIGATOR' },
    { name: 'Rico', archetype: 'LOYALIST' }
  ]);
  party.members[0].adjust('Rico', { rivalry: 80, trust: -40 });
  party.members[1].adjust('Marcus', { rivalry: 80, trust: -40 });

  const settle = crewProposals(party, { legends: [], heat: 0 }).filter(p => p.kind === 'SETTLE_UP');
  assert.equal(settle.length, 2, 'two separate grudges are two separate jobs');
  assert.notEqual(settle[0].template.title, settle[1].template.title);
});

test('Jobs: a kind producing an invalid template is rejected, not proposed', () => {
  // Mutation-testing found this guard unverifiable from behaviour: the current table only
  // produces valid values, so deleting the validation changed nothing. It exists to stop a
  // future entry in CJB_KINDS reaching the engine with a stake or attribute the simulation
  // does not understand — which would resolve to a silently wrong outcome rather than an
  // error. So the test injects exactly that bad entry.
  const { CJB_KINDS } = require('../src/pixel_engine/crew-jobs.js');

  // One case per guard, each invalid in exactly ONE field. A single template that was wrong
  // in all three only proved the first check fires — removing either of the other two still
  // passed, because the first one short-circuited before reaching them.
  const cases = [
    ['BAD_ATTR', { attr: 'charisma', stake: 'cash', micro: 'street_dice' }],
    ['BAD_STAKE', { attr: 'wit', stake: 'notoriety', micro: 'street_dice' }],
    ['BAD_MICRO', { attr: 'wit', stake: 'cash', micro: 'competitive_chess' }]
  ];

  cases.forEach(([id, fields]) => {
    CJB_KINDS.unshift({
      id,
      test: () => ({ ok: true }),
      build: () => ({
        title: 'NONSENSE',
        setup: 'A job the engine could not actually simulate, described at sufficient length.',
        reason: 'testing the guard',
        ...fields
      })
    });
    try {
      const party = partyOf([{ name: 'Marcus', archetype: 'WILDCARD' }]);
      const proposals = crewProposals(party, { legends: [], heat: 0 });
      assert.ok(!proposals.some(p => p.kind === id),
        `${id} must be rejected — an unsimulatable template resolves to a silently wrong outcome`);
    } finally {
      CJB_KINDS.shift();
    }
  });
});

test('Jobs: a proposal id is stable, so the same job survives a reload', () => {
  const mk = () => {
    const party = partyOf([{ name: 'Marcus', archetype: 'GREEDY_ONE', objective: obj('GET_PAID') }]);
    return crewProposals(party, { legends: [], heat: 0 })[0].template.id;
  };
  assert.equal(mk(), mk());
  assert.match(mk(), /MARCUS/);
});

test('Jobs: proposals are deterministic', () => {
  const build = () => {
    const party = AiParty.generate({ size: 4, seed: 'jobs-determinism' });
    party.members[0].adjust(party.members[1].name, { rivalry: 80, trust: -40 });
    return JSON.stringify(crewProposals(party, { legends: ['bucket'], heat: 5 }));
  };
  assert.equal(build(), build());
});

test('Jobs: a party event reports something true or nothing at all', () => {
  // Section 32. An event every time you open the menu stops being an event.
  const settled = partyOf([{ name: 'Marcus', archetype: 'LOYALIST' }]);
  assert.equal(crewPartyEvent(settled, { humanName: 'You', seed: 's' }), null,
    'a settled crew generate no news');

  const sour = partyOf([{ name: 'Marcus', archetype: 'SCHEMER' }]);
  sour.members[0].adjust('You', { trust: -40, rivalry: 60 });
  sour.members[0].updateEmotion('You');
  const event = crewPartyEvent(sour, { humanName: 'You', seed: 's' });
  assert.ok(event, 'a companion with a grievance is news');
  assert.equal(event.kind, 'WANTS_A_WORD');
  assert.equal(event.who, 'Marcus');
  assert.ok(event.cause.includes('Marcus'), 'the cause must name them');

  const grown = partyOf([{ name: 'Nay', archetype: 'LOYALIST', level: 3 }]);
  const growth = crewPartyEvent(grown, { humanName: 'You', seed: 'g' });
  assert.equal(growth.kind, 'CAME_UP');
  assert.ok(growth.text.includes('Level 3'));
});

test('Jobs: a grievance outranks a level-up in the party news', () => {
  const both = partyOf([{ name: 'Marcus', archetype: 'SCHEMER', level: 4 }]);
  both.members[0].adjust('You', { trust: -45, rivalry: 65 });
  both.members[0].updateEmotion('You');
  assert.equal(crewPartyEvent(both, { humanName: 'You', seed: 'b' }).kind, 'WANTS_A_WORD');
});

test('Jobs: bad input degrades instead of throwing', () => {
  assert.deepEqual(crewProposals(undefined, undefined), []);
  assert.deepEqual(crewProposals({ active: () => [] }, {}), []);
  assert.equal(crewPartyEvent(null, null), null);
  assert.equal(crewPartyEvent({ active: () => [] }, {}), null);
  // A companion with no objective and no grudges must not crash the scan.
  const bare = partyOf([{ name: 'X', archetype: 'WILDCARD' }]);
  assert.doesNotThrow(() => crewProposals(bare, {}));
});
