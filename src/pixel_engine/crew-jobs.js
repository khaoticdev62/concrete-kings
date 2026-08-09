/**
 * Concrete Kings: The Block Chronicles
 * Crew jobs — the companions propose work of their own.
 *
 * Implements CARD RPG SINGLE PLAYER MODE PRD.md sections 32, 33 and 49.
 *
 * Section 49 states the anti-goal plainly. The world must feel like
 *
 *   "Four people are collectively creating this disaster."
 *
 * and not
 *
 *   "Three NPCs wait for you to press buttons."
 *
 * Until now the crew could only react: they completed scenarios the game handed out and
 * voted on plans. Nothing originated with them. This module lets a companion put a job on
 * the table because of something true about their own state — a grudge, a secret objective,
 * a fear, or a running joke the block will not let go of.
 *
 * THE RULE THAT SHAPES EVERYTHING HERE: a proposal must be traceable. Every one carries a
 * `reason` derived from the state that produced it, and there is no generic fallback. A
 * companion proposing a job "because it is time for a job" is the same defect as an uncaused
 * betrayal (section 20) — the player cannot reconstruct it, so it reads as the game
 * generating filler rather than as a character wanting something.
 *
 * A generated scenario is a plain template of the same shape scenario-engine.js already
 * consumes, so an AI-initiated job runs through the identical ScenarioRun, resolution,
 * narration and ledger. That is section 27 of the v2 PRD once more: no separate AI rules.
 *
 * Determinism: no Math.random.
 */

/** Valid values, mirrored from scenario-engine.js so a generated template cannot be invalid. */
const CJB_ATTRS = ['str', 'wit', 'soul'];
const CJB_STAKES = ['heat', 'cash', 'trust', 'reputation'];
const CJB_MICRO = ['street_dice', 'bodega_run', 'haircut_challenge', 'lockpicking', 'negotiation'];

/**
 * Proposal kinds, in priority order.
 *
 * Ordered because a companion who is both broke and furious should raise the grudge — the
 * stronger feeling wins, which is how a person works. The first kind whose condition holds is
 * the one they bring up.
 */
const CJB_KINDS = [
  {
    id: 'SETTLE_UP',
    // A grudge against another crew member. The most interesting proposal available, because
    // it puts the player in the middle of it.
    test: (c, ctx) => {
      const target = (ctx.others || []).find(name => {
        const rel = c.toward(name);
        return rel.rivalry > 55 || rel.trust < 25;
      });
      return target ? { target } : null;
    },
    build: (c, ctx, hit) => ({
      title: 'SQUARE IT WITH ' + hit.target.toUpperCase(),
      setup: `${c.name} wants this settled tonight. Whatever is between them and ${hit.target} `
        + `has stopped being background noise, and standing in the middle of it is now a job.`,
      attr: 'soul', stake: 'trust', micro: 'negotiation',
      reason: `${c.name} has a problem with ${hit.target}`
    })
  },
  {
    id: 'RUNNING_JOKE',
    // The block will not let something go, and a companion decides to lean into it. This is
    // section 49 in its purest form: canon the players created becomes new work.
    test: (c, ctx) => {
      const legend = (ctx.legends || [])[0];
      return legend ? { legend } : null;
    },
    build: (c, ctx, hit) => ({
      title: 'THE ' + hit.legend.toUpperCase() + ' THING',
      setup: `Nobody on the block will shut up about the ${hit.legend}. ${c.name} reckons `
        + `there is money in that, or at least a story worth the trouble.`,
      attr: 'wit', stake: 'reputation', micro: 'street_dice',
      reason: `the block keeps bringing up the ${hit.legend}`
    })
  },
  {
    id: 'GET_PAID',
    test: (c) => (c.objective && c.objective.id === 'GET_PAID' && c.traits.greed > 0.55)
      ? { greed: c.traits.greed } : null,
    build: (c) => ({
      title: 'SOMETHING THAT PAYS',
      setup: `${c.name} is done doing favours. They have a number in mind and they are not `
        + `interested in hearing about the risk.`,
      attr: 'wit', stake: 'cash', micro: 'bodega_run',
      reason: `${c.name} wants to get paid`
    })
  },
  {
    id: 'LAY_LOW',
    // Fear is a legitimate motive for wanting a *quiet* job, which is still a job.
    test: (c, ctx) => (c.emotion === 'AFRAID' || (ctx.heat || 0) >= 6)
      ? { heat: ctx.heat || 0 } : null,
    build: (c, ctx, hit) => ({
      title: 'GET THE HEAT DOWN',
      setup: `${c.name} does not like how much attention the block is getting. `
        + `${hit.heat >= 6 ? 'They are not wrong.' : 'Nobody has told them they are wrong.'} `
        + `Whatever happens tonight needs to be quiet.`,
      attr: 'str', stake: 'heat', micro: 'lockpicking',
      reason: `${c.name} thinks there is too much heat`
    })
  },
  {
    id: 'BE_SEEN',
    test: (c) => (c.traits.competitive > 0.6 || (c.objective && c.objective.id === 'BE_KNOWN'))
      ? { competitive: c.traits.competitive } : null,
    build: (c) => ({
      title: 'MAKE IT COUNT',
      setup: `${c.name} is tired of small work. They want something people will still be `
        + `talking about next week, and they want to be standing in the front of it.`,
      attr: 'soul', stake: 'reputation', micro: 'haircut_challenge',
      reason: `${c.name} wants to be the one they talk about`
    })
  }
];

/** Deterministic LCG. */
function cjbSeeded(seedText) {
  let seed = 0;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  seed = seed || 1;
  return () => (seed = (seed * 48271) % 2147483647) / 2147483647;
}

/** Stable id from a title, so the same proposal is the same scenario across a reload. */
function cjbId(proposer, kind) {
  return `CREW_${String(kind).toUpperCase()}_${String(proposer).toUpperCase()}`
    .replace(/[^A-Z0-9_]/g, '');
}

/**
 * What the crew want to do (section 33).
 *
 * Returns at most one proposal per companion, and an empty array when nobody has a reason —
 * which is the correct answer on a quiet night. Manufacturing a proposal so the list is never
 * empty is the filler this module exists to avoid.
 */
function crewProposals(party, options) {
  const ctx = options || {};
  const members = (party && typeof party.active === 'function' ? party.active() : []) || [];
  if (!members.length) return [];

  const names = members.map(m => m.name);
  const out = [];
  // Titles already on the table. Some kinds are impersonal — a running joke is the block's,
  // not one companion's — so without this two companions with no stronger motive both raise
  // the identical job, and the player is offered the same work twice. A companion whose first
  // choice is taken falls through to their next motive instead, which also surfaces more of
  // the crew's actual wants.
  const claimed = new Set();

  members.forEach(member => {
    const others = names.filter(n => n !== member.name);
    const kindCtx = { ...ctx, others, legends: ctx.legends || [], heat: ctx.heat || 0 };

    for (const kind of CJB_KINDS) {
      const hit = kind.test(member, kindCtx);
      if (!hit) continue;
      const built = kind.build(member, kindCtx, hit);
      if (claimed.has(built.title)) continue;   // somebody already raised this one
      // Validate against the scenario engine's own vocabulary rather than trusting the
      // table: an invalid attr or stake would resolve to a silently wrong simulation.
      if (!CJB_ATTRS.includes(built.attr)) break;
      if (!CJB_STAKES.includes(built.stake)) break;
      if (!CJB_MICRO.includes(built.micro)) break;

      claimed.add(built.title);
      out.push({
        proposer: member.name,
        kind: kind.id,
        reason: built.reason,
        template: {
          id: cjbId(member.name, kind.id),
          title: built.title,
          setup: built.setup,
          attr: built.attr,
          stake: built.stake,
          micro: built.micro,
          proposedBy: member.name
        }
      });
      break;   // one proposal per companion — the strongest feeling, not a list of wants
    }
  });

  return out;
}

/**
 * Something happening in the crew between jobs (section 32).
 *
 * Reads existing state only. Returns null when the crew are settled, because a party event
 * every single time you return to the menu stops being an event.
 */
function crewPartyEvent(party, options) {
  const ctx = options || {};
  const members = (party && typeof party.active === 'function' ? party.active() : []) || [];
  if (!members.length) return null;

  const rand = cjbSeeded(`partyevent|${ctx.seed || ''}|${members.length}`);

  // Somebody is far enough gone to say something about it.
  const aggrieved = members.filter(m => {
    const rel = m.toward(ctx.humanName || 'You');
    return rel.trust < 30 || rel.rivalry > 55;
  });
  if (aggrieved.length) {
    const who = aggrieved[Math.floor(rand() * aggrieved.length)];
    return {
      kind: 'WANTS_A_WORD',
      who: who.name,
      text: `${who.name} wants a word. Not in front of everybody.`,
      cause: `${who.name} is ${who.emotion.toLowerCase()} with you`
    };
  }

  // Somebody levelled up and it shows.
  const grown = members.filter(m => m.level > 1);
  if (grown.length) {
    const who = grown[Math.floor(rand() * grown.length)];
    return {
      kind: 'CAME_UP',
      who: who.name,
      text: `${who.name} carries themselves different now. Level ${who.level}.`,
      cause: `${who.name} has run enough jobs to change`
    };
  }

  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crewProposals, crewPartyEvent, cjbId, cjbSeeded,
    CJB_KINDS, CJB_ATTRS, CJB_STAKES, CJB_MICRO
  };
}
if (typeof window !== 'undefined') {
  window.crewProposals = crewProposals;
  window.crewPartyEvent = crewPartyEvent;
}
