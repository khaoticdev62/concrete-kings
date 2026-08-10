/**
 * Concrete Kings: Scenario Compiler
 *
 * Compiles a structured scenario object into a temporary Simulation instance.
 * The simulation is the runtime source of truth for one campaign run.
 * No LLM, no freeform generation: every beat, consequence, and ending is
 * authored data compiled into deterministic state transitions.
 */

const FMC = typeof require === 'function' ? require('./first-miles-campaign.js') : (typeof window !== 'undefined' ? window.FirstMilesCampaign : {});
const FMC_BEATS = FMC.FIRST_MILES_BEATS || (typeof FIRST_MILES_BEATS !== 'undefined' ? FIRST_MILES_BEATS : {});
const FMC_SIDE_QUESTS = FMC.FIRST_MILES_SIDE_QUESTS || (typeof FIRST_MILES_SIDE_QUESTS !== 'undefined' ? FIRST_MILES_SIDE_QUESTS : {});
const FMC_ORIGIN_SECRETS = FMC.FIRST_MILES_ORIGIN_SECRETS || (typeof FIRST_MILES_ORIGIN_SECRETS !== 'undefined' ? FIRST_MILES_ORIGIN_SECRETS : {});

const DEFAULT_ORIGIN_TRUST = ['ray','jada','marquez','chen','kid','jenkins'];

function createDefaultState(originKey, secretKey) {
  return {
    act: 1,
    day: 1,
    heat: 0,
    trust: Object.fromEntries(DEFAULT_ORIGIN_TRUST.map(k => [k, 0])),
    secrets: [],
    flags: [],
    receipts: [],
    sideQuestsCompleted: [],
    origin: originKey || null,
    originSecret: FMC_ORIGIN_SECRETS[originKey] || null,
    currentBeat: 1,
    act1ClimaxOutcome: null,
    act2Betrayer: null,
    act3Route: null,
    finalChoice: null,
    beatHistory: []
  };
}

function inferCategory(cardText) {
  const text = (cardText || '').toLowerCase();
  if (/grandma|family|cousin|blood|mama|aunt|uncle|photo/.test(text)) return 'family';
  if (/church|pastor|prayer|gospel|sanctuary|bible/.test(text)) return 'church';
  if (/bodega|food|chicken|sandwich|sweet tea|fries|pie/.test(text)) return 'food';
  if (/tiktok|funny|uncle panther|laugh|joke|humor|barber line-up/.test(text)) return 'humor';
  return 'street';
}

function originTagAffinity(origin) {
  const map = {
    BARBER: 'family', STREET_SCHOLAR: 'church', LOCAL_LEGEND: 'street',
    CORNER_MERCHANT: 'food', COMMUNITY_ORGANIZER: 'family', UNDERGROUND_DJ: 'humor',
    BLOCK_ARCHITECT: 'church', HUSTLE_VETERAN: 'street'
  };
  return map[origin] || 'food';
}

function scClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveActBreak(state) {
  if (state.currentBeat === 10) return 2;
  if (state.currentBeat === 17) return 3;
  return null;
}

function generateEpilogueCards(state, endingKey) {
  const cards = [];
  const trust = state.trust || {};
  const sq = state.sideQuestsCompleted || [];

  if (sq.includes('SQ2_RAYS_DEBT') || (trust.ray || 0) >= 3) {
    cards.push({ npc: 'Ray', text: 'Ray’s barbershop chair remains a sanctuary for the block.' });
  } else {
    cards.push({ npc: 'Ray', text: 'Ray struggled with debt, but kept his doors open.' });
  }

  if (endingKey === 'POWER' || (trust.marquez || 0) >= 4) {
    cards.push({ npc: 'Marquez', text: 'Marquez maintains an unspoken authority behind 125th Street.' });
  } else {
    cards.push({ npc: 'Marquez', text: 'Marquez pulled back into the shadows after the raid.' });
  }

  if ((trust.jada || 0) >= 3) {
    cards.push({ npc: 'Jada', text: 'Jada’s bar thrives as the social heart of Harlem.' });
  } else {
    cards.push({ npc: 'Jada', text: 'Jada keeps her bar running with a watchful eye.' });
  }

  cards.push({ npc: 'The Block', text: 'Your receipts become part of Harlem’s permanent folklore.' });

  return cards;
}

function resolveEnding(state) {
  const trustTotal = Object.values(state.trust || {}).reduce((a, b) => a + b, 0);
  const highestTrustNpc = Object.entries(state.trust || {}).sort((a, b) => b[1] - a[1])[0];
  const highestTrustValue = highestTrustNpc ? highestTrustNpc[1] : 0;

  let endingRes = { ending: 'HUSTLE', title: 'Hustle', text: 'The grind continues on 125th.' };

  if (state.heat >= 8) {
    endingRes = { ending: 'DEATH', title: 'DEATH', text: 'Heat claimed you before the block could.' };
  } else if (state.flags.includes('evidence') && trustTotal >= 6 && state.heat <= 5) {
    endingRes = { ending: 'JUSTICE', title: 'Justice', text: 'The block reforms around your choices.' };
  } else if (highestTrustValue >= 5 && state.heat >= 8) {
    endingRes = { ending: 'POWER', title: 'Power', text: 'You become the unspoken authority on 125th.' };
  } else if (state.flags.includes('origin_secret_used') && state.heat <= 3 && (state.reputation || 0) <= 2) {
    endingRes = { ending: 'GHOST', title: 'Ghost', text: 'You vanish with the receipts.' };
  } else if (state.receipts && state.receipts.length >= 6 && state.flags.includes('all_secrets') && trustBalanced(state.trust)) {
    endingRes = { ending: 'RECEIPT_KING', title: 'Receipt King', text: 'You break the block curse.' };
  } else if (highestTrustValue >= 3 && state.heat < 7) {
    endingRes = { ending: 'JUSTICE', title: 'Justice', text: 'You rebuild what was broken.' };
  }

  endingRes.epilogueCards = generateEpilogueCards(state, endingRes.ending);
  return endingRes;
}

function trustBalanced(trust) {
  const values = Object.values(trust);
  return values.every(v => v >= 1 && v <= 3);
}

class Simulation {
  constructor(scenario, originKey, secretKey) {
    this.scenario = scenario || { id: 'first-miles', title: 'First Miles' };
    this.state = createDefaultState(originKey, secretKey);
    this.ended = false;
    this.pendingActBreak = null;
  }

  currentBeatData() {
    return FMC_BEATS[this.state.currentBeat] || null;
  }

  tick(cardText) {
    if (this.ended) return null;

    const beat = this.currentBeatData();
    if (!beat) {
      this.ended = true;
      return { ending: resolveEnding(this.state), miniGame: null };
    }

    const category = inferCategory(cardText);
    const consequence = beat.tagConsequences[category] || { heat: 0, trust: 0, text: 'Nothing happens.' };
    const affinity = originTagAffinity(this.state.origin);
    const originBonus = affinity === category;
    const heatDelta = originBonus ? Math.max(0, consequence.heat - 1) : consequence.heat;
    const trustDelta = originBonus ? consequence.trust + 1 : consequence.trust;

    this.state.heat = scClamp(this.state.heat + heatDelta, 0, 10);
    if (trustDelta) {
      const npc = beat.trustNpc || highestTrustNpcKey(this.state.trust);
      if (npc && this.state.trust.hasOwnProperty(npc)) {
        this.state.trust[npc] = scClamp(this.state.trust[npc] + trustDelta, 0, 5);
      }
    }

    this.state.currentBeat += 1;
    this.state.day = Math.ceil(this.state.currentBeat / 2);
    this.recordHistory(beat, cardText, category, consequence.text);

    if (beat.sideQuest && !this.state.sideQuestsCompleted.includes(beat.sideQuest)) {
      this.autoCompleteSideQuest(beat.sideQuest);
    }

    if (this.state.currentBeat === 9) this.resolveAct1Climax();
    if (this.state.currentBeat === 16) this.resolveBetrayer();

    const actBreak = resolveActBreak(this.state);
    if (actBreak) {
      this.pendingActBreak = actBreak;
      return { actBreak, miniGame: beat.miniGame || null, consequenceText: consequence.text };
    }

    this.pendingActBreak = null;
    const nextBeat = this.currentBeatData();
    if (!nextBeat || this.state.currentBeat > 20) {
      this.ended = true;
      return { ending: resolveEnding(this.state), miniGame: beat.miniGame || null, consequenceText: consequence.text };
    }

    return { nextBeat, miniGame: beat.miniGame || null, consequenceText: consequence.text };
  }

  resolveAct1Climax() {
    const origin = this.state.origin;
    if (origin === 'BARBER') this.state.act1ClimaxOutcome = 'ray_takes_fall';
    else if (origin === 'HUSTLE_VETERAN') this.state.act1ClimaxOutcome = 'marquez_escape';
    else if (origin === 'BLOCK_ARCHITECT') this.state.act1ClimaxOutcome = 'hotwire_escape';
    else if (origin === 'STREET_SCHOLAR') this.state.act1ClimaxOutcome = 'back_exit_knowledge';
    else this.state.act1ClimaxOutcome = 'standard_escape';
    this.state.flags.push('act1_climax_resolved');
    if (this.state.act1ClimaxOutcome === 'ray_takes_fall') this.state.trust.ray += 1;
    if (this.state.act1ClimaxOutcome === 'marquez_escape') this.state.trust.marquez += 1;
    if (this.state.heat >= 4) this.state.heat += 2;
    else this.state.heat = Math.max(0, this.state.heat - 1);
  }

  resolveBetrayer() {
    const trusts = this.state.trust;
    const ray = trusts.ray || 0;
    const marquez = trusts.marquez || 0;
    const jada = trusts.jada || 0;
    const jenkins = trusts.jenkins || 0;
    if (marquez > ray && marquez > jada) this.state.act2Betrayer = 'marquez';
    else if (ray > jada && ray > marquez) this.state.act2Betrayer = 'jada';
    else this.state.act2Betrayer = 'jenkins';
    this.state.flags.push('betrayer_known');
    if (this.state.act2Betrayer === 'marquez') this.state.heat += 2;
    else if (this.state.act2Betrayer === 'jada') this.state.trust.jada = Math.max(0, this.state.trust.jada - 2);
    else this.state.trust.jenkins = Math.max(0, this.state.trust.jenkins - 2);
  }

  autoCompleteSideQuest(sideQuestId) {
    const quest = FMC_SIDE_QUESTS[sideQuestId];
    if (!quest) return;
    if (this.state.sideQuestsCompleted.includes(sideQuestId)) return;
    if (quest.day && this.state.day < quest.day[0]) return;
    this.state.sideQuestsCompleted.push(sideQuestId);
    if (quest.trustNpc && quest.trustNpc !== 'none') {
      this.state.trust[quest.trustNpc] = scClamp((this.state.trust[quest.trustNpc] || 0) + quest.rewardTrust, 0, 5);
    }
    if (quest.rewardFlag) this.state.flags.push(quest.rewardFlag);
  }

  recordHistory(beat, cardText, category, text) {
    if (!this.state.beatHistory) this.state.beatHistory = [];
    this.state.beatHistory.push({
      beat: beat.beat || this.state.currentBeat,
      title: beat.title,
      cardText,
      category,
      text
    });
  }

  snapshot() {
    return {
      version: 1,
      scenarioId: this.scenario.id,
      state: JSON.parse(JSON.stringify(this.state))
    };
  }

  restore(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return false;
    if (snapshot.version !== 1) return false;
    if (snapshot.scenarioId !== this.scenario.id) return false;
    if (!snapshot.state || typeof snapshot.state !== 'object') return false;
    this.state = Object.assign({}, createDefaultState(this.state.origin, this.state.originSecret), snapshot.state);
    this.ended = false;
    this.pendingActBreak = null;
    return true;
  }
}

function highestTrustNpcKey(trust) {
  const entries = Object.entries(trust).sort((a, b) => b[1] - a[1]);
  return entries[0] ? entries[0][0] : null;
}

function compileScenario(scenarioLike, originKey, secretKey) {
  const scenario = scenarioLike || { id: 'first-miles', title: 'First Miles' };
  const sim = new Simulation(scenario, originKey, secretKey);
  return sim;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Simulation,
    compileScenario,
    inferCategory,
    originTagAffinity,
    resolveEnding,
    createDefaultState,
    highestTrustNpcKey
  };
}
if (typeof window !== 'undefined') {
  window.ScenarioCompiler = {
    Simulation,
    compileScenario,
    inferCategory,
    originTagAffinity,
    resolveEnding,
    createDefaultState,
    highestTrustNpcKey
  };
}
