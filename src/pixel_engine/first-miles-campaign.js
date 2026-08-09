/**
 * Concrete Kings: First Miles
 * Noir Street RPG Campaign Module
 * Wires the First Miles story beats into the existing app/screens.
 */

const FIRST_MILES_BEATS = {
  1: {
    act: 1, day: 1, title: 'Arrival',
    narrative: '125th Street hums. The air is heavy with rain and old business. Your origin determines who meets you first.',
    blackCard: "The first thing you noticed back on the block was ____.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'Block lookouts clock you. The heat rises slightly.' },
      family: { heat: 0, trust: 1, text: 'A familiar face steadies you on the stoop.' },
      church: { heat: -1, trust: 0, text: 'Church bells mark your return. The street eases.' },
      food: { heat: 0, trust: 0, text: 'The bodega smells the same. Nothing changes.' },
      humor: { heat: 0, trust: 1, text: 'A loud laugh on the corner buys you cover.' }
    }
  },
  2: {
    act: 1, day: 1, title: 'First Block',
    narrative: 'Ray, Jada, Marquez, Mr. Chen, and The Kid are all within a few storefronts. You can only help one first.',
    blackCard: 'At the hub, I introduced myself with ____.',
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'You keep it brief. The block respects distance.' },
      family: { heat: 0, trust: 1, text: 'You ask after people first. Trust warms.' },
      church: { heat: 0, trust: 1, text: 'You bless the space before moving. People notice.' },
      food: { heat: 0, trust: 0, text: 'You grab a sandwich and listen.' },
      humor: { heat: 0, trust: 1, text: 'You crack a joke and break the tension.' }
    }
  },
  3: {
    act: 1, day: 1, title: 'The Gossip',
    narrative: 'Jada needs a rumor checked. The answer changes who owes you.',
    blackCard: "I told Jada the truth about ____.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'Street talk is sharp. Jada keeps her distance.' },
      family: { heat: 0, trust: 1, text: 'You frame it gently. Jada trusts you more.' },
      church: { heat: 0, trust: 1, text: 'You lead with honesty. Jada opens up.' },
      food: { heat: 0, trust: 0, text: 'You trade the gossip for a favor later.' },
      humor: { heat: 1, trust: 0, text: 'You joke through it. Jada laughs but remembers.' }
    }
  },
  4: {
    act: 1, day: 2, title: 'Working Stiff',
    narrative: 'Ray offers proof of work: a haircut challenge under pressure.',
    blackCard: "Ray's razor slipped because of ____.",
    tagConsequences: {
      street: { heat: 0, trust: 1, text: 'You know rhythm from the block. Ray nods.' },
      family: { heat: 0, trust: 1, text: 'You work steady like your elders taught.' },
      church: { heat: 0, trust: 0, text: 'You stay calm under pressure. No bonus, no shame.' },
      food: { heat: 0, trust: 0, text: 'You snack beforehand. You stay focused.' },
      humor: { heat: 1, trust: 0, text: 'You crack a joke mid-cut. Ray scolds you.' }
    },
    miniGame: 'haircut_challenge'
  },
  5: {
    act: 1, day: 2, title: 'The Missing Kid',
    narrative: "The Kid's brother hasn't returned. Find him before the block does.",
    blackCard: "I found The Kid's brother ____.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'He was in a dice game. The street kept him late.' },
      family: { heat: 0, trust: 2, text: 'He was watching his cousin. Blood loyalty holds.' },
      church: { heat: 0, trust: 1, text: 'He was at the church basement. Safe.' },
      food: { heat: 0, trust: 0, text: 'He crashed at the bodega back room.' },
      humor: { heat: 0, trust: 1, text: 'You talk him down with jokes. He comes home.' }
    },
    sideQuest: 'SQ1_THE_CAT'
  },
  6: {
    act: 1, day: 2, title: "Marquez Check-In",
    narrative: 'Marquez wants a favor that costs more than he says.',
    blackCard: "When Marquez offered cash to look the other way, I chose ____.",
    tagConsequences: {
      street: { heat: 1, trust: 1, text: 'You take the cash. Marquez now owns a piece of you.' },
      family: { heat: 0, trust: 0, text: 'You refuse cleanly. No debt, no gain.' },
      church: { heat: -1, trust: 0, text: 'You walk away. The street calls you soft.' },
      food: { heat: 0, trust: 0, text: 'You buy time. The favor sits unresolved.' },
      humor: { heat: 1, trust: 0, text: 'You laugh it off. Marquez does not.' }
    },
    sideQuest: 'SQ2_RAYS_DEBT'
  },
  7: {
    act: 1, day: 3, title: 'Night Falls',
    narrative: 'Heat rises after dark unless you chose a safe path.',
    blackCard: 'After dark, I survived by ____.',
    tagConsequences: {
      street: { heat: 2, trust: 0, text: 'You run the shadows. The night adds weight.' },
      family: { heat: 0, trust: 1, text: 'You stay on familiar stoops. The block protects you.' },
      church: { heat: -1, trust: 0, text: 'You take shelter at the church. Heat fades.' },
      food: { heat: 0, trust: 0, text: 'You hide in plain sight at the bodega.' },
      humor: { heat: 1, trust: 0, text: 'You talk your way past trouble. Heat rises anyway.' }
    }
  },
  8: {
    act: 1, day: 3, title: 'The Receipt',
    narrative: 'A receipt appears: a photograph, a torn note, or a key. It ties to your origin secret.',
    blackCard: "The receipt in my pocket was ____.",
    tagConsequences: {
      street: { heat: 0, trust: 0, text: 'A photo of a deal going down. Useful later.' },
      family: { heat: 0, trust: 1, text: 'A note from family that means more than money.' },
      church: { heat: 0, trust: 1, text: 'A prayer card with a date written on it.' },
      food: { heat: 0, trust: 0, text: 'A ledger line with a name you know.' },
      humor: { heat: 0, trust: 0, text: 'A joke ticket. It still resolves later.' }
    }
  },
  9: {
    act: 1, day: 3, title: 'The Raid',
    narrative: 'Lights flash. The barbershop or bodega is hit. Your origin changes how you escape.',
    blackCard: "During the raid, I used ____ to get out alive.",
    tagConsequences: {
      street: { heat: 2, trust: 0, text: 'You slip through alleys. The street saves you.' },
      family: { heat: 0, trust: 1, text: 'Ray takes the fall. Blood debt deepens.' },
      church: { heat: -1, trust: 1, text: 'You shout the crowd toward sanctuary. Trust rises.' },
      food: { heat: 0, trust: 0, text: 'You duck into the bodega freezer. Cold but safe.' },
      humor: { heat: 1, trust: 0, text: 'You distract the officers. Heat climbs fast.' }
    }
  },
  10: {
    act: 2, day: 4, title: 'Cleanup',
    narrative: 'The block is watching. Reduce heat or pay for it later.',
    blackCard: 'I cleaned up my name by ____.',
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'You lean on a small timer. Heat lingers.' },
      family: { heat: 0, trust: 1, text: 'You ask family for cover. Trust rises.' },
      church: { heat: -1, trust: 1, text: 'You do a quiet good turn. Heat drops.' },
      food: { heat: 0, trust: 0, text: 'You feed the right person. Favors accrue.' },
      humor: { heat: 1, trust: 0, text: 'You joke your way through apologies. Heat stays.' }
    },
    sideQuest: 'SQ3_CHEN_SHIPMENT'
  },
  11: {
    act: 2, day: 5, title: 'Old Man Jenkins',
    narrative: 'Jenkins knew your secret before you did.',
    blackCard: "Jenkins revealed he knew about ____.",
    tagConsequences: {
      street: { heat: 0, trust: 1, text: 'He watched you from the stoop for years.' },
      family: { heat: 0, trust: 1, text: 'He kept your family name when you were gone.' },
      church: { heat: 0, trust: 1, text: 'He prayed for your return long before today.' },
      food: { heat: 0, trust: 0, text: 'He logged every bodega step you took.' },
      humor: { heat: 0, trust: 1, text: 'He laughed and said you were predictable.' }
    },
    sideQuest: 'SQ5_OLD_MANS_STORY'
  },
  12: {
    act: 2, day: 6, title: "Chen's Problem",
    narrative: "Shipments are being intercepted. Chen offers a cut if you investigate.",
    blackCard: "I sided with ____ during Chen's shipment war.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'You play both sides. The street gets noisier.' },
      family: { heat: 0, trust: 1, text: 'You protect Chen for family loyalty.' },
      church: { heat: 0, trust: 1, text: 'You choose the safer route. Chen is uneasy.' },
      food: { heat: 0, trust: 0, text: 'You broker a food trade instead of violence.' },
      humor: { heat: 1, trust: 0, text: 'You turn it into a bet. The tension stays.' }
    }
  },
  13: {
    act: 2, day: 7, title: 'The Gossip Network',
    narrative: 'Connect the dots before they connect you.',
    blackCard: "The network showed me that ____ controls the block.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'The corners talk faster than the beat.' },
      family: { heat: 0, trust: 1, text: 'Your cousin already knew the answer.' },
      church: { heat: 0, trust: 1, text: 'The choir heard the truth before anyone else.' },
      food: { heat: 0, trust: 0, text: 'The bodega counter knows all receipts.' },
      humor: { heat: 1, trust: 0, text: 'A joke network is still a network.' }
    },
    sideQuest: 'SQ10_KING_OF_THE_BLOCK'
  },
  14: {
    act: 2, day: 8, title: 'Ray or Marquez?',
    narrative: 'Your prior trust decides who reaches for you now.',
    blackCard: "I chose ____ because they had my back first.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'The street always remembers a debt.' },
      family: { heat: 0, trust: 1, text: 'Blood memory shortens the distance.' },
      church: { heat: 0, trust: 1, text: 'Spiritual trust is harder to break.' },
      food: { heat: 0, trust: 0, text: 'You chose the table that fed you.' },
      humor: { heat: 1, trust: 0, text: 'You chose the laugh over the lecture.' }
    }
  },
  15: {
    act: 2, day: 9, title: 'Safe House Raid',
    narrative: 'Someone sold you out. The safe house is hit and receipts are scattered.',
    blackCard: "I escaped the safe house using ____.",
    tagConsequences: {
      street: { heat: 2, trust: 0, text: 'The alley knows your name now.' },
      family: { heat: 0, trust: 1, text: 'A neighbor opened a back door.' },
      church: { heat: -1, trust: 1, text: 'You hide in the vestibule until heat drops.' },
      food: { heat: 0, trust: 0, text: 'You slip out through the kitchen.' },
      humor: { heat: 1, trust: 0, text: 'You distract the raiders with noise and chaos.' }
    },
    sideQuest: 'SQ6_MARQUEZS_FAVOR'
  },
  16: {
    act: 2, day: 10, title: 'The Betrayal',
    narrative: 'They have The Kid. Your accumulated trust decides who betrayed you.',
    blackCard: "I answered the betrayal with ____.",
    tagConsequences: {
      street: { heat: 2, trust: 0, text: 'Violence cements the block memory.' },
      family: { heat: 0, trust: 1, text: 'You use leverage from family loyalty.' },
      church: { heat: -1, trust: 1, text: 'You choose mercy. The block is surprised.' },
      food: { heat: 0, trust: 0, text: 'You trade resources for time.' },
      humor: { heat: 1, trust: 0, text: 'A risky joke buys a second.' }
    }
  },
  17: {
    act: 3, day: 11, title: 'Preparation',
    narrative: 'One last visit before the final route.',
    blackCard: "I spent my last quiet moment with ____.",
    tagConsequences: {
      street: { heat: 0, trust: 0, text: 'The street sharpens your edges.' },
      family: { heat: 0, trust: 1, text: 'Family gives you something to fight for.' },
      church: { heat: -1, trust: 1, text: 'Peace holds longer than rage.' },
      food: { heat: 0, trust: 0, text: 'You eat and plan.' },
      humor: { heat: 0, trust: 1, text: 'Laughter keeps fear from settling in.' }
    }
  },
  18: {
    act: 3, day: 11, title: 'The Plan',
    narrative: 'Choose your route into the endgame.',
    blackCard: "The plan relies on ____.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'Street force is loud and risky.' },
      family: { heat: 0, trust: 1, text: 'Family loyalty buys access.' },
      church: { heat: 0, trust: 1, text: 'Moral clarity opens a legal path.' },
      food: { heat: 0, trust: 0, text: 'Cash and logistics buy a cleaner path.' },
      humor: { heat: 1, trust: 0, text: 'Chaos is a strategy, but not a safe one.' }
    }
  },
  19: {
    act: 3, day: 12, title: 'The Confrontation',
    narrative: 'The location depends on your chosen route: legal, street, violent, or secret.',
    blackCard: 'In the final confrontation, I used ____.',
    tagConsequences: {
      street: { heat: 2, trust: 0, text: 'Violence rewires the block.' },
      family: { heat: 0, trust: 1, text: 'Blood lines decide the final door.' },
      church: { heat: -1, trust: 1, text: 'Truth spoken aloud ends the worst lies.' },
      food: { heat: 0, trust: 0, text: 'Negotiation feeds the outcome.' },
      humor: { heat: 1, trust: 0, text: 'A surprise move changes the table.' }
    }
  },
  20: {
    act: 3, day: 13, title: 'The Reckoning',
    narrative: 'All receipts, secrets, trusts, and heat resolve into one ending.',
    blackCard: 'The block will remember me for ____.',
    tagConsequences: {
      street: { heat: 1, trust: 0, text: 'Fear is a durable legacy.' },
      family: { heat: 0, trust: 1, text: 'Loyalty lasts longer than power.' },
      church: { heat: -1, trust: 1, text: 'Mercy rewrites the ending.' },
      food: { heat: 0, trust: 0, text: 'Cash can buy a new name.' },
      humor: { heat: 0, trust: 1, text: 'A good story keeps you alive after you leave.' }
    }
  }
};

const FIRST_MILES_ORIGIN_SECRETS = {
  BARBER: 'shop_debt',
  STREET_SCHOLAR: 'expelled_record',
  LOCAL_LEGEND: 'old_tapes',
  CORNER_MERCHANT: 'supply_ledger',
  COMMUNITY_ORGANIZER: 'petition_file',
  UNDERGROUND_DJ: 'bootleg_track',
  BLOCK_ARCHITECT: 'site_plans',
  HUSTLE_VETERAN: 'old_contact'
};

const FIRST_MILES_SIDE_QUESTS = {
  SQ1_THE_CAT: { title: 'The Cat', day: [1, 3], trustNpc: 'kid', rewardTrust: 1, rewardFlag: 'cat_found' },
  SQ2_RAYS_DEBT: { title: "Ray's Debt", day: [2, 4], trustNpc: 'ray', rewardTrust: 1, rewardFlag: 'rays_debt_settled' },
  SQ3_CHEN_SHIPMENT: { title: "Chen's Shipment", day: [4, 7], trustNpc: 'chen', rewardTrust: 1, rewardFlag: 'shipment_route' },
  SQ4_JADAS_SECRET: { title: "Jada's Secret", day: [5, 7], trustNpc: 'jada', rewardTrust: 1, rewardFlag: 'jada_past' },
  SQ5_OLD_MANS_STORY: { title: "Old Man's Story", day: [5, 8], trustNpc: 'jenkins', rewardTrust: 1, rewardFlag: 'jenkins_mercy' },
  SQ6_MARQUEZS_FAVOR: { title: "Marquez's Favor", day: [7, 9], trustNpc: 'marquez', rewardTrust: 1, rewardFlag: 'dirty_cop' },
  SQ7_BODEGA_QUIZ: { title: 'Bodega Quiz', day: [2, 5], trustNpc: 'chen', rewardTrust: 1, rewardFlag: 'local_history' },
  SQ8_BARBER_CONTEST: { title: 'Barber Contest', day: [3, 4], trustNpc: 'ray', rewardTrust: 1, rewardFlag: 'barber_contest_win' },
  SQ9_PHONE_HACK: { title: 'Phone Hack', day: [4, 7], trustNpc: 'tech', rewardTrust: 0, rewardFlag: 'caller_id' },
  SQ10_KING_OF_BLOCK: { title: 'King of the Block', day: [5, 8], trustNpc: 'none', rewardTrust: 0, rewardFlag: 'block_leader' }
};

class FirstMilesCampaign {
  constructor(appBridge) {
    this.app = appBridge || null;
    this.state = null;
    this.active = false;
    this.currentScreen = 'menu';
  }

  start(originKey, secretKey) {
    this.state = {
      act: 1,
      day: 1,
      heat: 0,
      trust: { ray: 0, jada: 0, marquez: 0, chen: 0, kid: 0, jenkins: 0 },
      secrets: [],
      flags: [],
      receipts: [],
      sideQuestsCompleted: [],
      origin: originKey || null,
      originSecret: FIRST_MILES_ORIGIN_SECRETS[originKey] || null,
      currentBeat: 1,
      act1ClimaxOutcome: null,
      act2Betrayer: null,
      act3Route: null,
      finalChoice: null
    };
    this.active = true;
    this.currentScreen = 'intro';
    if (secretKey && !this.state.secrets.includes(secretKey)) {
      this.state.secrets.push(secretKey);
    }
    this.renderIntro();
  }

  get currentBeatData() {
    return FIRST_MILES_BEATS[this.state.currentBeat] || null;
  }

  resolveWinnerCard(cardText) {
    const beat = this.currentBeatData;
    if (!beat) return this.resolveEnding();
    const category = this.inferCategory(cardText);
    const consequence = beat.tagConsequences[category] || { heat: 0, trust: 0, text: 'Nothing happens.' };
    const affinity = this.originTagAffinity();
    const originBonus = affinity === category;
    const heatDelta = originBonus ? Math.max(0, consequence.heat - 1) : consequence.heat;
    const trustDelta = originBonus ? consequence.trust + 1 : consequence.trust;
    this.state.heat = Math.max(0, Math.min(10, this.state.heat + heatDelta));
    if (trustDelta) {
      const npc = beat.trustNpc || this.highestTrustNpcKey();
      if (npc && this.state.trust.hasOwnProperty(npc)) {
        this.state.trust[npc] = Math.min(5, Math.max(0, this.state.trust[npc] + trustDelta));
      }
    }
    this.state.currentBeat++;
    this.recordHistory(beat, cardText, category, consequence.text);
    if (beat.sideQuest && !this.state.sideQuestsCompleted.includes(beat.sideQuest)) {
      this.autoCompleteSideQuest(beat.sideQuest);
    }
    if (this.state.currentBeat === 9) this.resolveAct1Climax();
    if (this.state.currentBeat === 16) this.resolveBetrayer();
    return { consequenceText: consequence.text, ended: false, cardText };
  }

  inferCategory(cardText) {
    const text = (cardText || '').toLowerCase();
    if (/grandma|family|cousin|blood|mama|aunt|uncle|photo/.test(text)) return 'family';
    if (/church|pastor|prayer|gospel|sanctuary|bible/.test(text)) return 'church';
    if (/bodega|food|chicken|sandwich|sweet tea|fries|pie/.test(text)) return 'food';
    if (/tiktok|funny|uncle panther|laugh|joke|humor|barber line-up/.test(text)) return 'humor';
    return 'street';
  }

  originTagAffinity() {
    const map = {
      BARBER: 'family', STREET_SCHOLAR: 'church', LOCAL_LEGEND: 'street',
      CORNER_MERCHANT: 'food', COMMUNITY_ORGANIZER: 'family', UNDERGROUND_DJ: 'humor',
      BLOCK_ARCHITECT: 'church', HUSTLE_VETERAN: 'street'
    };
    return map[this.state.origin] || 'food';
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
    if (this.state.heat >= 4) {
      this.state.heat += 2;
    } else {
      this.state.heat = Math.max(0, this.state.heat - 1);
    }
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
    const quest = FIRST_MILES_SIDE_QUESTS[sideQuestId];
    if (!quest) return;
    if (this.state.sideQuestsCompleted.includes(sideQuestId)) return;
    if (quest.day && this.state.day < quest.day[0]) return;
    this.state.sideQuestsCompleted.push(sideQuestId);
    if (quest.trustNpc && quest.trustNpc !== 'none') {
      this.state.trust[quest.trustNpc] = Math.min(5, (this.state.trust[quest.trustNpc] || 0) + quest.rewardTrust);
    }
    if (quest.rewardFlag) this.state.flags.push(quest.rewardFlag);
  }

  toJSON() {
    return {
      version: 1,
      active: this.active,
      currentScreen: this.currentScreen,
      state: JSON.parse(JSON.stringify(this.state || {}))
    };
  }

  fromJSON(data) {
    if (!data || typeof data !== 'object') return;
    this.active = !!data.active;
    this.currentScreen = data.currentScreen || this.currentScreen;
    if (data.state && typeof data.state === 'object') {
      this.state = Object.assign({}, this.state, data.state);
    }
  }

  saveCampaign() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ck-first-miles-campaign', JSON.stringify(this.toJSON()));
      }
    } catch (e) {
      // non-fatal save failure
    }
  }

  loadCampaign() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const raw = window.localStorage.getItem('ck-first-miles-campaign');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data && data.version === 1) {
        this.fromJSON(data);
        return true;
      }
    } catch (e) {
      // non-fatal load failure
    }
    return false;
  }

  recordHistory(beat, cardText, category, text) {
    if (!this.state) return;
    if (!Array.isArray(this.state.beatHistory)) this.state.beatHistory = [];
    this.state.beatHistory.push({
      beat: beat.beat || beat.id,
      title: beat.title,
      cardText,
      category,
      text
    });
  }

  resolveEnding() {
    this.active = false;
    const trustTotal = Object.values(this.state.trust).reduce((a, b) => a + b, 0);
    const highestTrustNpc = Object.entries(this.state.trust).sort((a, b) => b[1] - a[1])[0];
    if (this.state.heat >= 8) return { ending: 'DEATH', title: 'DEATH', text: 'Heat claimed you before the block could.' };
    if (this.state.flags.includes('evidence') && trustTotal >= 6 && this.state.heat <= 5) return { ending: 'JUSTICE', title: 'Justice', text: 'The block reforms around your choices.' };
    if ((this.state.trust[highestTrustNpc[0]] || 0) >= 5 && this.state.heat >= 8) return { ending: 'POWER', title: 'Power', text: 'You become the unspoken authority on 125th.' };
    if (this.state.flags.includes('origin_secret_used') && this.state.heat <= 3 && this.state.reputation <= 2) return { ending: 'GHOST', title: 'Ghost', text: 'You vanish with the receipts.' };
    if (this.state.receipts.length >= 6 && this.state.flags.includes('all_secrets') && this.trustBalanced()) return { ending: 'RECEIPT_KING', title: 'Receipt King', text: 'You break the block curse.' };
    if ((this.state.trust[highestTrustNpc[0]] || 0) >= 3 && this.state.heat < 7) return { ending: 'JUSTICE', title: 'Justice', text: 'You rebuild what was broken.' };
    return { ending: 'HUSTLE', title: 'Hustle', text: 'The grind continues on 125th.' };
  }

  highestTrustNpcKey() {
    const highestTrustNpc = Object.entries(this.state.trust).sort((a, b) => b[1] - a[1])[0];
    return highestTrustNpc ? highestTrustNpc[0] : null;
  }

  trustBalanced() {
    const values = Object.values(this.state.trust);
    return values.every(v => v >= 1 && v <= 3);
  }

  getOriginSecretCallbackText() {
    const secret = this.state.originSecret;
    if (!secret) return '';
    switch (secret) {
      case 'shop_debt':
        return 'SECRET CALLBACK: old shop debt can buy silence or force a reckoning.';
      case 'expelled_record':
        return 'SECRET CALLBACK: the expelled record can clear your name or bury you.';
      case 'old_tapes':
        return 'SECRET CALLBACK: the old tapes only help if someone still believes you.';
      case 'supply_ledger':
        return 'SECRET CALLBACK: the supply ledger can redirect shipments—or expose them.';
      case 'petition_file':
        return 'SECRET CALLBACK: the petition file shifts power if it ever goes public.';
      case 'bootleg_track':
        return 'SECRET CALLBACK: the bootleg track can start a riot or save a life.';
      case 'site_plans':
        return 'SECRET CALLBACK: the site plans prove what they tried to hide.';
      case 'old_contact':
        return 'SECRET CALLBACK: the old contact answers only once.';
      default:
        return `SECRET IN PLAY: ${secret}`;
    }
  }

  renderIntro() {
    this.currentScreen = 'intro';
    if (typeof app !== 'undefined' && app.show) app.show('campaignIntro');
    this.fillCampaignIntro();
  }

  fillCampaignIntro() {
    const title = document.getElementById('campaignIntroTitle');
    const body = document.getElementById('campaignIntroBody');
    const startBtn = document.getElementById('campaignIntroStart');
    if (title) title.textContent = 'FIRST MILES';
    const secretLine = this.getOriginSecretCallbackText();
    if (body) body.textContent = secretLine
      ? `13 beats. One origin. Every mile costs.\n\n${secretLine}`
      : '13 beats. One origin. Every mile costs.';
    if (startBtn) startBtn.onclick = () => this.startBeat();
  }

  startBeat() {
    this.currentScreen = 'beat';
    if (typeof app !== 'undefined' && app.show) app.show('campaignBeat');
    this.renderBeat();
  }

  renderBeat() {
    const beat = this.currentBeatData;
    if (!beat) return this.renderEpilogue();
    const title = document.getElementById('campaignBeatTitle');
    const narrative = document.getElementById('campaignBeatNarrative');
    const prompt = document.getElementById('campaignBeatPrompt');
    const dayLabel = document.getElementById('campaignBeatDay');
    if (title) title.textContent = `${beat.title}`;
    if (narrative) narrative.textContent = `${beat.narrative}\n\n${this.getBeatActContext(beat.beat || this.state.currentBeat)}`;
    if (prompt) prompt.textContent = beat.blackCard;
    if (dayLabel) dayLabel.textContent = `DAY ${this.state.day}`;
    this.renderBeatChoices();
    if (typeof app !== 'undefined' && app.updateTopHud) app.updateTopHud();
  }

  getBeatActContext(beatNumber) {
    const num = Number(beatNumber) || 0;
    if (num <= 9) return 'Act 1 — The Setup';
    if (num <= 16) return 'Act 2 — The Turn';
    return 'Act 3 — The Reckoning';
  }

  renderBeatChoices() {
    const bar = document.getElementById('campaignChoiceBar');
    if (!bar) return;
    bar.innerHTML = '';
    const cards = this.app && typeof this.app.getNarrativeHand === 'function'
      ? this.app.getNarrativeHand()
      : ['Walk the block', 'Ask around', 'Stay quiet', 'Make a call'];
    cards.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.className = 'secondary';
      btn.style.textAlign = 'left';
      btn.style.fontFamily = "'Press Start 2P', monospace";
      btn.style.fontSize = '8px';
      btn.style.padding = '8px';
      btn.style.display = 'block';
      btn.style.width = '100%';
      btn.textContent = `[${String.fromCharCode(65 + idx)}] ${card}`;
      btn.onclick = () => {
        if (typeof app !== 'undefined' && app.submitCampaignBeat) app.submitCampaignBeat(card);
        else this.submitBeat(card);
      };
      bar.appendChild(btn);
    });
  }

  submitBeat(cardText) {
    const result = this.resolveWinnerCard(cardText);
    if (result.ended) return this.renderEpilogue();
    if (this.state.currentBeat > 20) return this.renderEpilogue();
    if (this.state.currentBeat === 10) return this.renderActBreak(2);
    if (this.state.currentBeat === 17) return this.renderActBreak(3);
    this.renderBeat();
  }

  choose(cardText) {
    return this.submitBeat(cardText);
  }

  renderEpilogue() {
    this.currentScreen = 'epilogue';
    if (typeof app !== 'undefined' && app.show) app.show('campaignEpilogue');
    const result = this.resolveEnding();
    const title = document.getElementById('campaignEndingTitle');
    const text = document.getElementById('campaignEndingText');
    if (title) title.textContent = result.title;
    if (text) text.textContent = result.text;
    if (typeof app !== 'undefined' && app.updateTopHud) app.updateTopHud();
  }

  renderActBreak(act) {
    this.currentScreen = 'actBreak';
    const title = document.getElementById('campaignBeatTitle');
    const narrative = document.getElementById('campaignBeatNarrative');
    const prompt = document.getElementById('campaignBeatPrompt');
    const dayLabel = document.getElementById('campaignBeatDay');
    if (title) title.textContent = `ACT ${act}`;
    if (narrative) narrative.textContent = act === 2
      ? 'Act 1 is over. The block remembers what you did. Act 2 starts now.'
      : 'Act 2 is over. The betrayer is known. Act 3 starts now.';
    if (prompt) prompt.textContent = 'Prepare your next move.';
    if (dayLabel) dayLabel.textContent = `DAY ${this.state.day}`;
    this.renderBeatChoices();
    if (typeof app !== 'undefined' && app.updateTopHud) app.updateTopHud();
  }

  backToMenu() {
    this.active = false;
    this.currentScreen = 'menu';
    if (typeof app !== 'undefined' && app.showMainMenu) app.showMainMenu();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIRST_MILES_BEATS, FIRST_MILES_SIDE_QUESTS, FIRST_MILES_ORIGIN_SECRETS, FirstMilesCampaign };
}
if (typeof window !== 'undefined') {
  window.FIRST_MILES_BEATS = FIRST_MILES_BEATS;
  window.FIRST_MILES_SIDE_QUESTS = FIRST_MILES_SIDE_QUESTS;
  window.FIRST_MILES_ORIGIN_SECRETS = FIRST_MILES_ORIGIN_SECRETS;
  window.FirstMilesCampaign = FirstMilesCampaign;
}
