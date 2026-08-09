const test = require('node:test');
const assert = require('node:assert/strict');
const {
  crewLine, crewArgument, crewAside, crewBeats, crewVoteLines, crewBetrayalLine, CRW_LINES
} = require('../src/pixel_engine/crew-dialogue.js');
const { AiCompanion, AiParty } = require('../src/pixel_engine/ai-party.js');
const { scnSceneBeats, ScenarioRun, SCN_SLOTS, SCN_TEMPLATES } =
  require('../src/pixel_engine/scenario-engine.js');

function mk(name, archetype, emotion = 'CALM') {
  const c = new AiCompanion({ name, archetype });
  c.emotion = emotion;
  return c;
}

function resolvedResult(tier) {
  const run = new ScenarioRun(SCN_TEMPLATES[0], { district: 'HARLEM' });
  SCN_SLOTS.forEach(s => run.fill(s, 'a ' + s.toLowerCase() + ' card', 'You'));
  const result = run.resolve({ name: 'You', attributes: { str: 4, wit: 4, soul: 4 } }, {});
  result.tier = tier || result.tier;
  return result;
}

test('Dialogue: an emotion can only reach lines written for it', () => {
  // Section 29 draws the boundary: the engine controls whether they are angry. So a
  // companion at BETRAYED must not be able to produce a warm line, and the only way to
  // guarantee that is to make the warm pool unreachable rather than unlikely.
  const betrayed = mk('Marcus', 'STRAIGHT_MAN', 'BETRAYED');
  const warm = CRW_LINES.OUTCOME_GOOD.CONFIDENT;
  for (let i = 0; i < 40; i++) {
    const line = crewLine(betrayed, 'OUTCOME_GOOD', { seed: 'x' + i });
    assert.ok(!warm.includes(line.text),
      `a BETRAYED companion reached a CONFIDENT line: "${line.text}"`);
    assert.ok(CRW_LINES.OUTCOME_GOOD.BETRAYED.includes(line.text));
    assert.equal(line.emotion, 'BETRAYED');
  }
});

test('Dialogue: the same companion in the same state says the same thing', () => {
  const c = mk('Tasha', 'SCHEMER', 'SUSPICIOUS');
  const a = crewLine(c, 'PLAN_REVEALED', { seed: 'round-4' });
  const b = crewLine(c, 'PLAN_REVEALED', { seed: 'round-4' });
  assert.deepEqual(a, b, 'dialogue must replay identically');
});

test('Dialogue: an unknown situation says nothing rather than something generic', () => {
  // A generic line is exactly what makes an AI read as a bot, so there is no fallback.
  const c = mk('Rico', 'INSTIGATOR');
  assert.equal(crewLine(c, 'NOT_A_SITUATION', {}), null);
  assert.equal(crewLine(null, 'PLAN_REVEALED', {}), null);
});

test('Dialogue: every emotion has a line for every situation, so nobody falls silent', () => {
  // A missing pool would silently fall back to CALM and a furious companion would sound
  // fine. Checked exhaustively rather than trusted.
  const emotions = ['CALM', 'AMUSED', 'CONFIDENT', 'SUSPICIOUS', 'ANGRY', 'AFRAID', 'BETRAYED'];
  Object.keys(CRW_LINES).forEach(situation => {
    emotions.forEach(emotion => {
      const pool = CRW_LINES[situation][emotion];
      assert.ok(Array.isArray(pool) && pool.length >= 2,
        `${situation}/${emotion} needs at least two lines, or the companion repeats itself`);
    });
  });
});

test('Dialogue: a vote line always names who they actually backed', () => {
  // The player must be able to match the words to the ballot, or the commentary is noise.
  const party = AiParty.generate({ size: 3, seed: 'votes' });
  const ballots = party.active().map((m, i) => ({ voter: m.name, votedFor: i === 0 ? 'You' : 'Marcus' }));
  const lines = crewVoteLines(party, ballots, { seed: 'v' });

  assert.equal(lines.length, ballots.length);
  lines.forEach((line, i) => {
    assert.equal(line.name, ballots[i].voter);
    assert.ok(line.text.includes(ballots[i].votedFor),
      `"${line.text}" does not name ${ballots[i].votedFor}`);
  });
});

test('Dialogue: an argument needs a real disagreement', () => {
  // Manufacturing friction between two companions who get along is the same defect as an
  // uncaused betrayal: the player cannot reconstruct it, so it reads as generated noise.
  const a = mk('Marcus', 'LOYALIST');
  const b = mk('Nay', 'LOYALIST');
  // Two loyalists who agree and start neutral-positive: nothing to argue about.
  assert.equal(crewArgument(a, b, { votes: { Marcus: 'You', Nay: 'You' }, seed: 's' }), null);

  // Different votes is a cause.
  const split = crewArgument(a, b, { votes: { Marcus: 'You', Nay: 'Rico' }, seed: 's' });
  assert.ok(split, 'a split vote must be arguable');
  assert.ok(split.cause.includes('Marcus') && split.cause.includes('Nay'));
  assert.equal(split.lines.length, 2);

  // So is mutual bad blood, with no vote at all.
  a.adjust('Nay', { rivalry: 80, trust: -40 });
  b.adjust('Marcus', { rivalry: 70, trust: -40 });
  assert.ok(crewArgument(a, b, { seed: 's' }), 'standing friction must be arguable');
});

test('Dialogue: nobody argues with themselves', () => {
  const a = mk('Marcus', 'INSTIGATOR');
  assert.equal(crewArgument(a, a, { seed: 's' }), null);
  assert.equal(crewArgument(a, null, { seed: 's' }), null);
});

test('Dialogue: an aside withholds what happened, because the gap is the point', () => {
  // Section 46's example is "Nothing." / "Everything." Filling it in removes the only thing
  // that makes it land.
  const party = AiParty.generate({ size: 3, seed: 'aside' });
  const members = party.active();
  members[0].adjust(members[1].name, { rivalry: 90, trust: -50 });
  members[1].adjust(members[0].name, { rivalry: 85, trust: -50 });

  let aside = null;
  for (let i = 0; i < 40 && !aside; i++) aside = crewAside(party, { seed: 'a' + i });
  assert.ok(aside, 'a party with real friction must eventually produce an aside');
  assert.equal(aside.lines.length, 3);
  assert.ok(aside.lines.some(l => /Nothing\./.test(l)));
  assert.ok(aside.lines.some(l => /Everything\./.test(l)));
  assert.ok(aside.cause, 'the cause must be available even though the scene withholds it');
});

test('Dialogue: an aside needs at least two companions and real friction', () => {
  const solo = AiParty.generate({ size: 1, seed: 'solo' });
  assert.equal(crewAside(solo, { seed: 's' }), null, 'one companion cannot have an aside');
  assert.equal(crewAside(null, {}), null);

  // A contented party generates no ominous silences.
  const happy = AiParty.generate({ size: 3, seed: 'happy' });
  happy.active().forEach(m => happy.active().forEach(o => {
    if (m.name !== o.name) m.adjust(o.name, { trust: 40, friendship: 40, rivalry: -10 });
  }));
  let found = null;
  for (let i = 0; i < 30 && !found; i++) found = crewAside(happy, { seed: 'h' + i });
  assert.equal(found, null, 'a crew that gets along must not manufacture drama');
});

test('Dialogue: crew reactions are woven into the scene, not appended after it', () => {
  // Section 28: the crew react DURING the simulation. That is the difference between a scene
  // and a results screen.
  const party = AiParty.generate({ size: 2, seed: 'beats' });
  const result = resolvedResult('SUCCESS');
  const base = scnSceneBeats(result);
  const woven = crewBeats(base, party, result, { seed: 'b1' });

  assert.ok(woven.length > base.length, 'the crew must add beats');
  const turnIndex = woven.findIndex(b => /^THEN —/.test(b.text));
  assert.ok(turnIndex >= 0);
  assert.ok(woven[turnIndex + 1].speaker,
    'a companion must speak immediately after the twist, not at the end');
  // And the original beats must all survive, in order.
  const kept = woven.filter(b => !b.speaker).map(b => b.text);
  assert.deepEqual(kept, base.map(b => b.text), 'no scene beat may be dropped or reordered');
});

test('Dialogue: with no crew the scene is byte-identical to the solo version', () => {
  // Scenario mode must be unchanged without a party, or adding the crew would have altered a
  // mode that was already shipped and tested.
  //
  // Mutation-testing this found the assertion weaker than it reads: removing the
  // `!members.length` early return changes nothing, because every step after it is
  // independently defensive and an empty member list produces no lines anyway. The early
  // return is defence in depth, not the thing under test. What IS under test is the pair —
  // unchanged without a crew, and demonstrably changed with one — so the positive control
  // lives here rather than only in a separate test.
  const result = resolvedResult('SUCCESS');
  const base = scnSceneBeats(result);

  assert.deepEqual(crewBeats(base, null, result, {}), base, 'no party');
  assert.deepEqual(crewBeats(base, AiParty.generate({ size: 1, seed: 'x' }), null, {}), base,
    'no result to react to');
  assert.deepEqual(crewBeats([], AiParty.generate({ size: 3, seed: 'x' }), result, {}), [],
    'no beats to weave into');

  // A party whose members have all walked out: non-null, but nobody left to speak.
  const departed = AiParty.generate({ size: 3, seed: 'gone' });
  departed.members.forEach(m => { m.inParty = false; });
  assert.deepEqual(crewBeats(base, departed, result, { seed: 'd' }), base,
    'a party everyone has left must be as quiet as no party at all');

  // Positive control: with a crew present the beats MUST change, or every assertion above
  // is satisfied by a function that does nothing.
  const withCrew = crewBeats(base, AiParty.generate({ size: 3, seed: 'loud' }), result, { seed: 'd' });
  assert.ok(withCrew.length > base.length, 'a present crew must actually speak');
});

test('Dialogue: the closing reaction comes from whoever feels the most about it', () => {
  // A fixed speaker makes the crew wallpaper. The voice should move as relationships do.
  const party = new AiParty({ humanName: 'You' });
  const calm = mk('Marcus', 'STRAIGHT_MAN', 'CALM');
  const furious = mk('Rico', 'INSTIGATOR', 'BETRAYED');
  party.members = [calm, furious];

  const result = resolvedResult('FAILURE');
  const woven = crewBeats(scnSceneBeats(result), party, result, { seed: 'c' });
  const last = woven[woven.length - 1];
  assert.equal(last.speaker, 'Rico',
    'the most invested companion should be the one who closes the scene');
});

test('Dialogue: a good outcome and a bad one draw from different pools', () => {
  // The line must be selected by the outcome the engine computed, never able to contradict
  // it (v2 section 31).
  const party = new AiParty({ humanName: 'You' });
  party.members = [mk('Marcus', 'STRAIGHT_MAN', 'CALM')];

  const good = crewBeats(scnSceneBeats(resolvedResult('CRITICAL_SUCCESS')), party,
    resolvedResult('CRITICAL_SUCCESS'), { seed: 'g' });
  const bad = crewBeats(scnSceneBeats(resolvedResult('CATASTROPHIC_FAILURE')), party,
    resolvedResult('CATASTROPHIC_FAILURE'), { seed: 'g' });

  const goodLine = good[good.length - 1].text;
  const badLine = bad[bad.length - 1].text;
  assert.ok(CRW_LINES.OUTCOME_GOOD.CALM.some(l => goodLine.includes(l)));
  assert.ok(CRW_LINES.OUTCOME_BAD.CALM.some(l => badLine.includes(l)));
  assert.notEqual(goodLine, badLine);
});

test('Dialogue: a callback line names the running joke it is about', () => {
  const c = mk('Rico', 'CHAOS_AGENT', 'AMUSED');
  const line = crewLine(c, 'CALLBACK', { motif: 'pigeon', seed: 'cb' });
  assert.ok(line.text.includes('PIGEON'), `"${line.text}" must name the motif`);
});

test('Dialogue: the betrayal line comes from the mechanics, not from a mood', () => {
  // Passed in rather than recomputed, so the words and the mechanics cannot disagree about
  // whether somebody is actually done with you.
  const c = mk('Tasha', 'SCHEMER', 'BETRAYED');
  assert.equal(crewBetrayalLine(c, { warning: false, willBetray: false }, {}), null,
    'a companion who is not turning has nothing to say about turning');

  const warn = crewBetrayalLine(c, { warning: true, willBetray: false, causes: ['low trust'] }, { seed: 'w' });
  assert.equal(warn.terminal, false);
  assert.equal(warn.cause, 'low trust');

  const done = crewBetrayalLine(c, { warning: true, willBetray: true, causes: ['low trust'] }, { seed: 'w' });
  assert.equal(done.terminal, true);
  assert.notEqual(done.text, warn.text, 'turning must not sound like a warning');
});

test('Dialogue: bad input degrades instead of throwing', () => {
  assert.equal(crewLine(undefined, undefined, undefined), null);
  assert.equal(crewArgument(null, null, null), null);
  assert.equal(crewAside(undefined, undefined), null);
  assert.deepEqual(crewVoteLines(null, null, null), []);
  assert.equal(crewBetrayalLine(null, null, null), null);
  assert.deepEqual(crewBeats(null, null, null, null), []);
});
