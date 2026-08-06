/**
 * Concrete Kings: The Block Chronicles
 * Story Engine for "The Last Package on 125th" Noir Prototype
 */

const NARRATIVE_BEATS = {
  1: {
    beat: 1,
    title: "The Dropoff",
    narrative: "Midnight on 125th. Rain-slicked asphalt under neon haze. A luxury sedan pulls up to the curb. A scarred hand slides a heavy manila package across. The passenger whispers: 'Deliver this to Marcus. Don't look inside, and don't get caught.'",
    blackCard: "The handoff was quick, but the package smelled like ____.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: "The street stench draws unwanted attention from lookouts." },
      family: { heat: 0, trust: 1, text: "A comforting aroma reminds you of family cooking, keeping your focus steady." },
      church: { heat: 0, trust: 1, text: "A scent of sanctuary oil calms your nerves on the dark street." },
      food: { heat: 0, trust: 0, text: "The smell of seasoned takeout makes you hungry but changes nothing." },
      humor: { heat: -1, trust: 0, text: "A ridiculous scent cracks a smile, easing the local tension." }
    }
  },
  2: {
    beat: 2,
    title: "The Tail",
    narrative: "You take three steps down the block before headlights flicker behind you. An unmarked cruiser crawling at five miles an hour. Your collar feels tight. If you run, you're done. If you walk too slow, they'll surround you.",
    blackCard: "To shake the tail, I blended into the crowd by pretending to be interested in ____.",
    tagConsequences: {
      street: { heat: 1, trust: 0, text: "Blending with corner lookouts keeps you moving but raises the patrol's suspicion." },
      family: { heat: 0, trust: 1, text: "Greeting a neighbor on their stoop makes you look like part of the neighborhood." },
      church: { heat: -1, trust: 0, text: "Stepping toward the church steps makes the cruiser roll right past." },
      food: { heat: 0, trust: 0, text: "Pretending to read a bodega menu stall works well enough." },
      humor: { heat: 0, trust: 1, text: "Cracking a joke with the stoop crew gains their trust and screens you." }
    }
  },
  3: {
    beat: 3,
    title: "The Checkpoint",
    narrative: "Blue and red lights block the avenue. A precinct tactical unit is searching bags near the subway entrance. Marcus's warehouse is just past them. You need to talk your way through or create a distraction.",
    blackCard: "I talked my way past the officers by claiming this package was just ____.",
    tagConsequences: {
      street: { heat: 2, trust: 0, text: "Your sketchy explanation gets you patted down. The heat is boiling." },
      family: { heat: 0, trust: 1, text: "Claiming it's Grandma's medicine works. They let you pass with a warning." },
      church: { heat: -1, trust: 1, text: "Showing the church charity banner earns their respect and trust." },
      food: { heat: 0, trust: 0, text: "Claiming it's a delivery order gets you through, but they check it briefly." },
      humor: { heat: 1, trust: 0, text: "A sarcastic comment almost gets you locked up, but you slip away." }
    }
  },
  4: {
    beat: 4,
    title: "The Handover",
    narrative: "Inside the dark warehouse backroom. Marcus sits behind a steel desk, cigar smoke drifting. He doesn't look at you—his eyes are locked on the package. 'You're late,' he grunts. 'Did anyone see you?'",
    blackCard: "I proved my loyalty to Marcus by showing him ____.",
    tagConsequences: {
      street: { heat: 1, trust: 1, text: "Offering street respect earns Marcus's confidence but links you deeper into the network." },
      family: { heat: 0, trust: 2, text: "Invoking family names makes Marcus nod. He respects blood." },
      church: { heat: 0, trust: 1, text: "Swearing on a Bible makes Marcus smirk, but he accepts your word." },
      food: { heat: -1, trust: 0, text: "Offering a cold soda cools Marcus down. The tension drops." },
      humor: { heat: 1, trust: -1, text: "Marcus does not appreciate jokes in his office. Trust drops." }
    }
  },
  5: {
    beat: 5,
    title: "The Standoff",
    narrative: "As Marcus reaches for the package, sirens wail outside. The back door kicks open. The alley is blocked. Marcus looks at you, his hand sliding under his coat. 'Did you set me up?'",
    blackCard: "In the final standoff, I pulled out ____ to settle the score.",
    tagConsequences: {
      street: { heat: 2, trust: 0, text: "Pulling iron brings absolute fire down. The neighborhood erupts." },
      family: { heat: 0, trust: 1, text: "Pleading for family peace stalls Marcus for a critical second." },
      church: { heat: -1, trust: 1, text: "Calling for spiritual calm breaks the trigger-finger tension." },
      food: { heat: 0, trust: 0, text: "A desperate distraction gives you a window." },
      humor: { heat: 0, trust: 0, text: "A crazy remark throws everyone off balance." }
    }
  }
};

const NARRATIVE_WHITE_DECK = [
  { text: "A Glock 19 with the serial scratched off", category: "street" },
  { text: "A brick of unregistered burner phones", category: "street" },
  { text: "Wad of dirty cash wrapped in rubber bands", category: "street" },
  { text: "Graffiti tags freshly painted on the bodega gate", category: "street" },
  { text: "A stolen police scanner buzzing with codes", category: "street", secret: true },

  { text: "Grandma's secret sweet potato pie recipe", category: "family" },
  { text: "A warm hug from Mama Gloria", category: "family" },
  { text: "Collard greens seasoned with smoked ham hock", category: "family" },
  { text: "An old family photo inside a cracked frame", category: "family" },
  { text: "Your cousin's neighborhood security warning", category: "family", secret: true },

  { text: "A blessed prayer oil bottle from the usher board", category: "church" },
  { text: "Sunday service program signed by the pastor", category: "church", secret: true },
  { text: "The choir robe embroidered deacon patch", category: "church" },
  { text: "A booming gospel hymn sung from the heart", category: "church" },
  { text: "A collection plate filled with loose quarters", category: "church" },

  { text: "A bag of hot fries and a blue drink", category: "food" },
  { text: "Uncooked chopped cheese ingredients", category: "food" },
  { text: "A greasy bag of corner chicken wings", category: "food" },
  { text: "Ice-cold sweet tea brewed in a gallon milk jug", category: "food" },
  { text: "A bodega ledger with names you shouldn't know", category: "food", secret: true },

  { text: "A TikTok dancer doing the hustle on 125th", category: "humor" },
  { text: "A master barber doing a line-up with a dull blade", category: "humor" },
  { text: "A loud stoop conversation about absolutely nothing", category: "humor" },
  { text: "An uncle claiming he used to run with the Panthers", category: "humor", secret: true }
];

const ENDINGS = {
  trap: {
    title: "THE TRAP",
    text: "The alley lights flash red and blue. Marcus is tackled, and before you can drop the package, handcuffs click cold around your wrists. Too much Heat. You are dragged into the precinct cruiser as 125th Street watches in silence. A street noir tragedy."
  },
  exit: {
    title: "THE EXIT",
    text: "Marcus nods, grabs the package, and pushes you through a secret floor grate just as the police breech. You crawl into the subway lines and emerge under the morning sun with your cut of the money. High Trust. You made it out clean. You exited the cycle."
  },
  hustle: {
    title: "THE HUSTLE",
    text: "In the chaos, the package is dropped, and you scramble out of the warehouse side vent. Marcus vanishes. The cops find nothing. By tomorrow morning, you are right back on the stoop, counting small bills, planning the next run. Balanced stats. The grind goes on."
  },
  insider: {
    title: "THE INSIDER",
    text: "You never picked a side. Street, family, church, corner store — you just kept your ears open and your mouth shut. When the dust settles on 125th, you walk away without the package and without a scratch. What you've got is better than cash: you know where every body on this block is buried. Marcus doesn't own you. You own his secrets."
  }
};

const ORIGIN_TAG_AFFINITY = {
  BARBER: 'family',
  STREET_SCHOLAR: 'church',
  LOCAL_LEGEND: 'street',
  CORNER_MERCHANT: 'food',
  COMMUNITY_ORGANIZER: 'family',
  UNDERGROUND_DJ: 'humor',
  BLOCK_ARCHITECT: 'church',
  HUSTLE_VETERAN: 'street',
};

class NarrativeStoryEngine {
  constructor() {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = false;
    this.history = [];
    this.origin = null;
    this.specialAbilityUsed = false;
    this.secrets = [];
  }

  reset(originKey = null) {
    this.beat = 1;
    this.heat = 0;
    this.trust = 0;
    this.active = true;
    this.history = [];
    this.origin = originKey;
    this.specialAbilityUsed = false;
    this.secrets = [];
  }

  markAbilityUsed() {
    if (this.specialAbilityUsed) return false;
    this.specialAbilityUsed = true;
    return true;
  }

  getCurrentBeat() {
    return NARRATIVE_BEATS[this.beat] || null;
  }

  applyWinnerCard(cardText) {
    const matchedCard = NARRATIVE_WHITE_DECK.find(c => c.text === cardText);
    const category = matchedCard ? matchedCard.category : "food";
    const currentBeatData = this.getCurrentBeat();
    if (!currentBeatData) return { text: "No more beats", ended: true };

    const consequence = currentBeatData.tagConsequences[category] || { heat: 0, trust: 0, text: "Nothing happens." };
    const originBonus = this.origin && ORIGIN_TAG_AFFINITY[this.origin] === category;
    let heatDelta = consequence.heat;
    let trustDelta = consequence.trust;
    if (originBonus) {
      if (heatDelta > 0) heatDelta -= 1;
      trustDelta += 1;
    }
    this.heat = Math.max(0, this.heat + heatDelta);
    this.trust = Math.max(0, this.trust + trustDelta);

    if (matchedCard && matchedCard.secret && !this.secrets.includes(matchedCard.text)) {
      this.secrets.push(matchedCard.text);
    }

    this.history.push({
      beat: this.beat,
      card: cardText,
      category,
      consequenceText: consequence.text
    });

    if (this.beat >= 5) {
      let endingKey = "hustle";
      if (this.secrets.length >= 2) endingKey = "insider";
      else if (this.heat >= 3) endingKey = "trap";
      else if (this.trust >= 3) endingKey = "exit";

      const ending = ENDINGS[endingKey];
      this.active = false;
      return {
        consequenceText: consequence.text,
        ended: true,
        endingTitle: ending.title,
        endingText: ending.text
      };
    } else {
      this.beat++;
      return {
        consequenceText: consequence.text,
        ended: false
      };
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NarrativeStoryEngine,
    NARRATIVE_BEATS,
    NARRATIVE_WHITE_DECK,
    ENDINGS,
    ORIGIN_TAG_AFFINITY
  };
}

if (typeof window !== 'undefined') {
  window.NarrativeStoryEngine = NarrativeStoryEngine;
  window.NARRATIVE_BEATS = NARRATIVE_BEATS;
  window.NARRATIVE_WHITE_DECK = NARRATIVE_WHITE_DECK;
  window.ENDINGS = ENDINGS;
  window.ORIGIN_TAG_AFFINITY = ORIGIN_TAG_AFFINITY;
}
