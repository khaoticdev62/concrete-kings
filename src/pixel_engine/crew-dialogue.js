/**
 * Concrete Kings: The Block Chronicles
 * Crew dialogue — the companions get a voice.
 *
 * Implements CARD RPG SINGLE PLAYER MODE PRD.md sections 15, 28, 29 and 46.
 *
 * The crew already had hands, grudges, votes, memories and emotional states. What they did
 * not have was a voice, and a companion with an opinion who never says anything is a
 * spreadsheet. Section 57's first success criterion is "I actually like this character",
 * which cannot happen in silence.
 *
 * SECTION 29 IS THE ARCHITECTURE, and it is a hard boundary:
 *
 *   "The AI generates dialogue. But the engine controls who speaks, what happened, whether
 *    they succeeded, whether they are angry, whether a relationship changed."
 *
 * So every line here is SELECTED by state that has already been computed — emotion,
 * relationship, archetype, outcome tier — never authored ahead of it and never adding a
 * fact. A line cannot say the job went well; it is chosen *because* the engine already
 * decided the job went well. This is the same rule the scenario narrator follows (v2
 * section 31), and it is the seam an AI narrator would attach to: it would rewrite these
 * lines, never choose which one is true.
 *
 * Determinism: no Math.random. Which line a companion says is seeded from the companion,
 * the situation and the round, so a replay says the same things.
 */

/**
 * Line pools, keyed by situation and then by the state that selects them.
 *
 * Written as pools rather than single strings so a companion does not repeat itself
 * verbatim every round, and keyed by EMOTION first because that is the state most visible
 * to the player — a companion at BETRAYED must never produce a warm line, and the only way
 * to guarantee that is to make it impossible to reach one.
 */
const CRW_LINES = {
  PLAN_REVEALED: {
    CALM: ['I mean. It could work.', 'Alright. I have heard worse.'],
    AMUSED: ['Oh this is going to be a disaster. I am in.', 'Absolutely not. Do it anyway.'],
    CONFIDENT: ['Yeah. Yeah, run that.', 'That is the one. Go.'],
    SUSPICIOUS: ['And what exactly do you get out of this?', 'Say the rest of it.'],
    ANGRY: ['Of course that is your plan.', 'You are not serious.'],
    AFRAID: ['This is how people get got.', 'Can we not?'],
    BETRAYED: ['Do what you want. You always do.', 'Sure. Whatever you say.']
  },
  VOTED_FOR: {
    CALM: ['I am with {who}.', '{who} has the right idea.'],
    AMUSED: ['{who}. Obviously {who}.', 'I want to see what {who} does.'],
    CONFIDENT: ['{who} knows what they are doing.', 'Riding with {who}.'],
    SUSPICIOUS: ['{who}. At least I can see them coming.', 'Going with {who}. For now.'],
    ANGRY: ['{who}. Anybody but you.', 'I said {who}.'],
    AFRAID: ['{who}. That one gets us home.', '{who}, please.'],
    BETRAYED: ['{who}. Not you. Never you again.', '{who}.']
  },
  SCENE_TURN: {
    CALM: ['Hold up.', 'That was not the plan.'],
    AMUSED: ['THERE it is.', 'I knew it. I KNEW it.'],
    CONFIDENT: ['Stay on it. Stay on it.', 'We are fine. Keep moving.'],
    SUSPICIOUS: ['Somebody talked.', 'Who else knew about this?'],
    ANGRY: ['Are you KIDDING me.', 'Every time. Every single time.'],
    AFRAID: ['Out. We go out. Now.', 'I told you. I told all of you.'],
    BETRAYED: ['Good. Let it burn.', 'Not my problem anymore.']
  },
  OUTCOME_GOOD: {
    CALM: ['Alright. That worked.', 'Fine. Good.'],
    AMUSED: ['I cannot believe that worked.', 'Nobody is ever going to believe this.'],
    CONFIDENT: ['Told you.', 'That is how that goes.'],
    SUSPICIOUS: ['That went too smooth.', 'And nothing went wrong? Nothing?'],
    ANGRY: ['Lucky. That is all that was.', 'Do not get comfortable.'],
    AFRAID: ['We are done. We are done, right?', 'I need to sit down.'],
    BETRAYED: ['Congratulations.', 'Good for you.']
  },
  OUTCOME_BAD: {
    CALM: ['Okay. We regroup.', 'That is on all of us.'],
    AMUSED: ['Worth it.', 'Ten out of ten. Would ruin again.'],
    CONFIDENT: ['We go again. Different angle.', 'One bad night.'],
    SUSPICIOUS: ['Somebody set that up.', 'That was not bad luck.'],
    ANGRY: ['This is YOUR fault.', 'I am not doing this with you again.'],
    AFRAID: ['I cannot keep doing this.', 'How much heat is on us now?'],
    BETRAYED: ['Of course.', 'Exactly what I expected.']
  },
  CALLBACK: {
    CALM: ['Not the {motif} again.', 'We are back on the {motif}?'],
    AMUSED: ['THE {motif}. LET US GO.', 'Please tell me the {motif} is involved.'],
    CONFIDENT: ['The {motif} never misses.', '{motif}. Every time.'],
    SUSPICIOUS: ['Why is it always the {motif} with you.', 'The {motif}. Again. Interesting.'],
    ANGRY: ['I am so tired of hearing about the {motif}.', 'Enough with the {motif}.'],
    AFRAID: ['Not the {motif}. Anything but the {motif}.', 'The {motif} got us in trouble last time.'],
    BETRAYED: ['The {motif}. Sure.', 'Do the {motif} thing. See what happens.']
  }
};

/** Said only when a companion is about to turn, or nearly. Kept out of the pools above so
 *  it cannot be selected by emotion alone — it needs a real cause behind it. */
const CRW_WARNING_LINES = [
  'You keep counting me out of things.',
  'I notice more than you think.',
  'Remember I was here for this part.'
];
const CRW_BETRAYAL_LINES = [
  'I am done. Handle it yourself.',
  'This is where I get off.',
  'You made this call a while ago. I am just saying it out loud.'
];

/** Deterministic LCG, so a replay says the same things. */
function crwSeeded(seedText) {
  let seed = 0;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  seed = seed || 1;
  return () => (seed = (seed * 48271) % 2147483647) / 2147483647;
}

/**
 * One line, chosen by state.
 *
 * Returns null rather than a fallback when the situation is unknown: a companion saying
 * something generic is worse than a companion saying nothing, because a generic line is
 * exactly what makes an AI read as a bot.
 */
function crewLine(companion, situation, context) {
  const ctx = context || {};
  if (!companion || !CRW_LINES[situation]) return null;
  const emotion = companion.emotion || 'CALM';
  const pool = CRW_LINES[situation][emotion] || CRW_LINES[situation].CALM;
  if (!pool || !pool.length) return null;

  const rand = crwSeeded(`${companion.name}|${situation}|${emotion}|${ctx.seed || ''}`);
  const text = pool[Math.floor(rand() * pool.length)]
    .replace(/\{who\}/g, ctx.who || 'them')
    .replace(/\{motif\}/g, (ctx.motif || 'thing').toUpperCase());
  return { name: companion.name, emotion, text, situation };
}

/**
 * An argument between two companions (section 15).
 *
 * Only fires on a REAL disagreement — they voted differently, or they genuinely dislike each
 * other. Manufacturing friction between two companions who get along would be the same
 * defect as an uncaused betrayal (section 20): the player cannot reconstruct it, so it reads
 * as the game generating noise.
 *
 * Returns null when there is nothing to argue about, which is most rounds.
 */
function crewArgument(a, b, context) {
  const ctx = context || {};
  if (!a || !b || a.name === b.name) return null;

  const aToB = a.toward(b.name);
  const bToA = b.toward(a.name);
  const votedDifferently = ctx.votes
    && ctx.votes[a.name] && ctx.votes[b.name]
    && ctx.votes[a.name] !== ctx.votes[b.name];
  const mutualFriction = (aToB.rivalry + bToA.rivalry) / 2 > 35
    || (aToB.trust + bToA.trust) / 2 < 35;

  if (!votedDifferently && !mutualFriction) return null;

  const cause = votedDifferently
    ? `${a.name} backed ${ctx.votes[a.name]}, ${b.name} backed ${ctx.votes[b.name]}`
    : 'they have been rubbing each other wrong for a while';

  const rand = crwSeeded(`${a.name}|${b.name}|argue|${ctx.seed || ''}`);
  const opens = [
    `${a.name}: "You want to explain that pick?"`,
    `${a.name}: "Say it to me again."`,
    `${a.name}: "That is the play you are going with?"`
  ];
  const closes = [
    `${b.name}: "I do not answer to you."`,
    `${b.name}: "Watch your tone."`,
    `${b.name}: "It worked, did it not?"`
  ];
  return {
    between: [a.name, b.name],
    cause,
    lines: [opens[Math.floor(rand() * opens.length)], closes[Math.floor(rand() * closes.length)]]
  };
}

/**
 * Two companions had something without you (section 46).
 *
 * Deliberately withholds what it was. The PRD's example is the player asking "what
 * happened?" and getting "Nothing." / "Everything." — the point is the gap, and filling it
 * in would remove the only thing that makes it land.
 */
function crewAside(party, context) {
  const ctx = context || {};
  const members = (party && typeof party.active === 'function' ? party.active() : []) || [];
  if (members.length < 2) return null;

  const rand = crwSeeded(`aside|${ctx.seed || ''}|${members.length}`);
  const i = Math.floor(rand() * members.length);
  let j = Math.floor(rand() * members.length);
  if (j === i) j = (i + 1) % members.length;
  const a = members[i];
  const b = members[j];

  // Only worth reporting if there is friction to imply. Two companions who are fine do not
  // generate an ominous silence.
  const arg = crewArgument(a, b, ctx);
  if (!arg) return null;
  return {
    between: [a.name, b.name],
    cause: arg.cause,
    lines: [`You: "What happened?"`, `${a.name}: "Nothing."`, `${b.name}: "Everything."`]
  };
}

/**
 * Interleaves companion reactions into the scene beats (section 28).
 *
 * The crew react DURING the simulation rather than after it, which is the difference between
 * a scene and a results screen. Insertion points are fixed to the beats the engine already
 * produced — the turn and the ending — so dialogue can never appear at a moment the
 * simulation did not reach.
 *
 * Takes and returns the scenario engine's own beat shape, and returns the input untouched
 * when there is no crew, so scenario mode is identical without one.
 */
function crewBeats(beats, party, result, context) {
  const ctx = context || {};
  if (!Array.isArray(beats) || !beats.length) return beats || [];
  const members = (party && typeof party.active === 'function' ? party.active() : []) || [];
  if (!members.length || !result) return beats;

  const rand = crwSeeded(`beats|${result.scenario || ''}|${ctx.seed || ''}`);
  const speaker = members[Math.floor(rand() * members.length)];
  const good = ['CRITICAL_SUCCESS', 'SUCCESS', 'CHAOTIC_SUCCESS'].includes(result.tier);

  // The turn beat is the one starting "THEN —"; react immediately after it.
  const turnIndex = beats.findIndex(b => /^THEN —/.test(b.text));
  const out = [];
  beats.forEach((beat, index) => {
    out.push(beat);
    if (index === turnIndex) {
      const line = crewLine(speaker, 'SCENE_TURN', { seed: ctx.seed });
      if (line) out.push({ text: `${line.name}: "${line.text}"`, ms: 2000, speaker: line.name });
    }
  });

  // And one closing reaction, from whoever is most invested — the companion who feels the
  // most about it, rather than a fixed member, so the voice changes as relationships do.
  const reactor = [...members].sort((a, b) => {
    const rank = { BETRAYED: 6, ANGRY: 5, SUSPICIOUS: 4, AFRAID: 3, AMUSED: 2, CONFIDENT: 1, CALM: 0 };
    return (rank[b.emotion] || 0) - (rank[a.emotion] || 0);
  })[0];
  const closing = crewLine(reactor, good ? 'OUTCOME_GOOD' : 'OUTCOME_BAD', { seed: ctx.seed });
  if (closing) out.push({ text: `${closing.name}: "${closing.text}"`, ms: 2400, speaker: closing.name });

  return out;
}

/**
 * Vote commentary, so the tally is not a bare number (sections 16-17).
 *
 * Every line names who the companion actually backed, so the player can always match the
 * words to the ballot.
 */
function crewVoteLines(party, ballots, context) {
  const ctx = context || {};
  const members = (party && typeof party.active === 'function' ? party.active() : []) || [];
  if (!members.length || !Array.isArray(ballots)) return [];
  return ballots.map(ballot => {
    const member = members.find(m => m.name === ballot.voter);
    if (!member) return null;
    return crewLine(member, 'VOTED_FOR', { who: ballot.votedFor, seed: ctx.seed });
  }).filter(Boolean);
}

/**
 * The line a companion says when they are turning, or nearly.
 *
 * Requires the betrayal state to be passed in rather than recomputing it, so the words and
 * the mechanics cannot disagree about whether someone is actually done with you.
 */
function crewBetrayalLine(companion, risk, context) {
  const ctx = context || {};
  if (!companion || !risk || (!risk.warning && !risk.willBetray)) return null;
  const pool = risk.willBetray ? CRW_BETRAYAL_LINES : CRW_WARNING_LINES;
  const rand = crwSeeded(`${companion.name}|betray|${risk.willBetray}|${ctx.seed || ''}`);
  return {
    name: companion.name,
    text: pool[Math.floor(rand() * pool.length)],
    terminal: !!risk.willBetray,
    cause: risk.causes && risk.causes[0] ? risk.causes[0] : null
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crewLine, crewArgument, crewAside, crewBeats, crewVoteLines, crewBetrayalLine,
    crwSeeded, CRW_LINES, CRW_WARNING_LINES, CRW_BETRAYAL_LINES
  };
}
if (typeof window !== 'undefined') {
  window.crewLine = crewLine;
  window.crewArgument = crewArgument;
  window.crewAside = crewAside;
  window.crewBeats = crewBeats;
  window.crewVoteLines = crewVoteLines;
  window.crewBetrayalLine = crewBetrayalLine;
}
