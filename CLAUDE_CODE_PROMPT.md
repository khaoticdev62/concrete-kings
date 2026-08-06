# Concrete Kings — Complete 1-Day Narrative RPG Build Specification
# For Claude Code Execution — Full Detailed Specification

## OBJECTIVE
Transform the existing Concrete Kings codebase into a fully playable narrative card RPG in exactly 1 day. This document specifies every file, function, data structure, UI element, story beat, card text, state transition, and verification step. Nothing is left to interpretation. Execute exactly as specified.

---

## SECTION 1: VISION & CORE DESIGN

### 1.1 Game Identity
Concrete Kings is a 3–6 player narrative card RPG that blends Cards Against Humanity's card-play structure with story-driven RPG mechanics. The theme is a noir street saga set in Harlem. Players are neighborhood characters caught in a single high-stakes night. Every card choice changes character relationships, neighborhood reputation, and available story paths. The game ends in one of five distinct endings determined by cumulative choices across five story beats.

### 1.2 Core Loop (Detailed)
1. SETUP PHASE (5 minutes):
   - 3-6 players create profiles
   - Each player selects one of four character origins
   - Origin determines starting trust bonuses, secrets, and special abilities
   - Initial story state is created from origin data
   - Each player is dealt 7 white cards from the deck

2. BEAT PHASE (4 minutes per beat × 5 beats = 20 minutes):
   a. BEAT REVEAL: The game presents a black Narrative Card containing:
      - Beat number and title
      - Flavor text setting the scene
      - Situation description with named NPCs
      - Stakes (what's at risk)
      - Available options (implicitly through white card play)
   
   b. CARD PLAY: Each player selects exactly one white card from their hand that represents their character's response to the situation
   
   c. JUDGING: One player is the "Czar" for this beat (rotating). They read all submitted white cards aloud and select the winner. The winning white card determines the story consequence.
   
   d. CONSEQUENCE: The game engine:
      - Updates trust values for involved NPCs
      - Adjusts heat level
      - Awards secrets or advantages if conditions met
      - Updates reputation tier
      - Logs the choice in the story log
      - Displays consequence text to all players
      - Determines next beat or ending
   
   e. STATE PROPAGATION: The updated state affects:
      - Available options in future beats
      - Which white cards get bonuses
      - NPC dialogue and reactions
      - Ending eligibility

3. ENDING PHASE (5 minutes):
   - Final story summary displayed
   - Ending card revealed based on accumulated state
   - Statistics shown: trust changes, heat level, reputation, choices made
   - Option to play again with different origins/paths

### 1.3 State Tracking Requirements
The game MUST track these variables with precision:
- storyBeat: integer 0-5 (0=prologue, 1-3=middle, 4=climax, 5=ending)
- variant: string "A" or "B" (tracks which branch path was taken)
- trust: object mapping NPC names to integer values (-10 to +10)
- heat: integer 0-10 (neighborhood tension)
- secrets: array of strings (earned advantages, one-time use)
- reputation: string "unknown" | "trusted" | "feared" | "pariah"
- chosenPaths: array of strings (beat variants taken, e.g., ["1A", "2B"])
- endingFlags: object tracking specific choices (e.g., {caughtSnitch: false, packageDelivered: false})
- czarIndex: integer (which player is current judge, rotates)
- roundNumber: integer (which round within current beat)

### 1.4 Victory/Ending Conditions
Endings are determined by a scoring system that evaluates:
- Dominant trust relationship (which NPC trusts the group most)
- Heat level at game end
- Reputation tier
- Which path variants were taken
- Specific flag combinations

Five endings:
1. "The Hustle" — Package delivered, profit made, relationships maintained
2. "The Trap" — Police raid, someone snitched, heat maxed out
3. "The Exit" — Players escape the neighborhood, leave everything behind
4. "The Kingpin" — Players take control, reputation becomes "feared"
5. "The Ghost" — Players vanish, reputation becomes "pariah", secrets used

---

## SECTION 2: FILE MANIFEST & EXACT CHANGES

### 2.1 Files to Modify
1. **cards.js** — Expand with 8 black narrative cards, 30+ white response cards, 5 ending templates, 4 origin definitions
2. **index.html** — Major rework: add story panel, story log, narrative resolution screen, state wiring
3. **src/pixel_engine/card-visual-system.js** — Minor update to support narrative card display with beat numbers and flavor text

### 2.2 Files to Create
1. **story-engine.js** — Core state machine, consequence resolution, ending calculation
2. **origins.js** — Character origin definitions with starting stats and abilities

### 2.3 Files to IGNORE (DO NOT MODIFY)
- src/pixel_engine/pixel-engine.js
- src/pixel_engine/weather-effects-system.js
- src/pixel_engine/block-map-navigation.js
- src/pixel_engine/high-detail-scale.js
- src/pixel_engine/block-map-navigation.test.js
- server/server.js
- All other test files beyond what's needed

---

## SECTION 3: COMPLETE CARD DATA SPECIFICATION

### 3.1 Black Narrative Cards (Exact Data)

```javascript
const BLACK_CARDS = [
  {
    id: "prologue_00",
    beat: 0,
    variant: "A",
    title: "The Last Package on 125th",
    flavor: "The package weighs more than money. It weighs trust.",
    situation: "You're gathered at the barbershop after closing. Uncle Ray slides a taped package across the counter. The neon sign from the bodega across the street paints the room red. 'This changes everything,' he says. Three knocks at the door interrupt him.",
    stakes: "The package contains evidence that could take down the whole block—or save one person. Someone at the table might already be working for the other side.",
    npcs: ["Uncle Ray", "Detective Marquez"],
    requiredTrust: {},
    requiredHeat: { min: 0, max: 10 },
    unlocks: ["beat_1a", "beat_1b"],
    locks: [],
    tags: ["setup", "package", "trust"],
    consequences: {
      "loyal": { trustDelta: { "Uncle Ray": 2 }, heatDelta: 1, reputationDelta: 1, secret: null, flag: null },
      "selfish": { trustDelta: { "Uncle Ray": -2 }, heatDelta: 2, reputationDelta: 0, secret: "knows_the_drop", flag: null },
      "clever": { trustDelta: { "Uncle Ray": 1, "Detective Marquez": 1 }, heatDelta: 0, reputationDelta: 1, secret: null, flag: null },
      "street": { trustDelta: {}, heatDelta: 3, reputationDelta: 0, secret: null, flag: "heat_spike_1" }
    }
  },
  {
    id: "beat_1a",
    beat: 1,
    variant: "A",
    title: "The Knock at the Door",
    flavor: "3 AM. The door shakes. You know who it is.",
    situation: "Detective Marquez stands on your stoop. She's not here for small talk. She knows about the package. Behind her, two uniformed officers wait by their cruiser. The neighborhood is watching from behind curtains.",
    stakes: "If you answer the door, you control the narrative. If you hide, you look guilty. If you run, you confirm every suspicion.",
    npcs: ["Detective Marquez", "Uncle Ray"],
    requiredTrust: { "Detective Marquez": 1 },
    requiredHeat: { min: 0, max: 8 },
    unlocks: ["beat_2a"],
    locks: ["beat_1b"],
    tags: ["investigation", "trust", "heat"],
    consequences: {
      "loyal": { trustDelta: { "Uncle Ray": 3 }, heatDelta: 2, reputationDelta: 1, secret: null, flag: "answered_door_loyal" },
      "selfish": { trustDelta: { "Uncle Ray": -3, "Detective Marquez": 1 }, heatDelta: 1, reputationDelta: 0, secret: "marquez_debt", flag: "answered_door_selfish" },
      "clever": { trustDelta: { "Detective Marquez": 2 }, heatDelta: 0, reputationDelta: 2, secret: null, flag: "answered_door_clever" },
      "street": { trustDelta: {}, heatDelta: 4, reputationDelta: -1, secret: null, flag: "heat_spike_2" }
    }
  },
  {
    id: "beat_1b",
    beat: 1,
    variant: "B",
    title: "The Corner Conversation",
    flavor: "Some conversations are better had in the shadows.",
    situation: "You slipped out the back window. Now you're on the corner with Jada, the bodega owner. She's seen everything from behind her counter. 'You need to know something about Ray,' she says. 'But it's gonna cost you.'",
    stakes: "Jada has information that could save you—or destroy your trust in Uncle Ray. She wants a favor in return. The package is still in the shop back room.",
    npcs: ["Jada", "Uncle Ray"],
    requiredTrust: { "Jada": 0 },
    requiredHeat: { min: 1, max: 10 },
    unlocks: ["beat_2b"],
    locks: ["beat_1a"],
    tags: ["information", "trust", "negotiation"],
    consequences: {
      "loyal": { trustDelta: { "Uncle Ray": -1, "Jada": 2 }, heatDelta: 0, reputationDelta: 1, secret: "jada_owed", flag: null },
      "selfish": { trustDelta: { "Jada": -2 }, heatDelta: 1, reputationDelta: 0, secret: null, flag: "jada_burned" },
      "clever": { trustDelta: { "Jada": 3, "Uncle Ray": 1 }, heatDelta: -1, reputationDelta: 2, secret: "information_network", flag: null },
      "street": { trustDelta: { "Uncle Ray": 2 }, heatDelta: 2, reputationDelta: 0, secret: null, flag: "street_cred_earned" }
    }
  },
  {
    id: "beat_2a",
    beat: 2,
    variant: "A",
    title: "The Rat in the Room",
    flavor: "Trust is a luxury. Paranoia is a survival skill.",
    situation: "Someone at the table is a snitch. You don't know who. The group fractures into accusations. Old grievances surface. The package sits between you all like a loaded gun. Someone makes a phone call that changes everything.",
    stakes: "If you find the rat, you secure the group. If you accuse wrong, you destroy trust. If you stay silent, the heat rises. The wrong choice here ends the game early.",
    npcs: ["Uncle Ray", "Detective Marquez", "Jada"],
    requiredTrust: {},
    requiredHeat: { min: 2, max: 10 },
    unlocks: ["beat_3a"],
    locks: [],
    tags: ["betrayal", "trust", "paranoia"],
    consequences: {
      "loyal": { trustDelta: { "Uncle Ray": 2, "Jada": 1 }, heatDelta: -1, reputationDelta: 2, secret: "group_loyalty", flag: "rat_found_loyal" },
      "selfish": { trustDelta: { "Uncle Ray": -2, "Detective Marquez": 2 }, heatDelta: 2, reputationDelta: 0, secret: "marquez_ally", flag: "rat_escaped_selfish" },
      "clever": { trustDelta: { "Jada": 2 }, heatDelta: 0, reputationDelta: 2, secret: "manipulator", flag: "rat_exposed_clever" },
      "street": { trustDelta: { "Uncle Ray": 1 }, heatDelta: 3, reputationDelta: 0, secret: null, flag: "violence_erupts" }
    }
  },
  {
    id: "beat_2b",
    beat: 2,
    variant: "B",
    title: "The Heat Comes Down",
    flavor: "Sirens aren't music. They're punctuation.",
    situation: "The police raid the block. Every door gets kicked. Every corner gets swept. You have 60 seconds to decide: hide the package, destroy it, or use it as leverage. The heat level determines how aggressive the search is.",
    stakes: "High heat means maximum police presence. Low heat means you might slip through. But destroying the package means losing your leverage. Using it as leverage means trusting someone dangerous.",
    npcs: ["Detective Marquez", "Uncle Ray"],
    requiredTrust: { "Detective Marquez": -1 },
    requiredHeat: { min: 3, max: 10 },
    unlocks: ["beat_3b"],
    locks: [],
    tags: ["raid", "heat", "urgency"],
    consequences: {
      "loyal": { trustDelta: { "Uncle Ray": 3 }, heatDelta: -2, reputationDelta: 2, secret: "package_hidden", flag: "raid_survived_loyal" },
      "selfish": { trustDelta: { "Uncle Ray": -3 }, heatDelta: 1, reputationDelta: -1, secret: null, flag: "package_lost" },
      "clever": { trustDelta: { "Detective Marquez": 1 }, heatDelta: -1, reputationDelta: 1, secret: "deal_with_marquez", flag: "deal_struck" },
      "street": { trustDelta: {}, heatDelta: -3, reputationDelta: 0, secret: "escape_route", flag: "escaped_raid" }
    }
  },
  {
    id: "beat_3a",
    beat: 3,
    variant: "A",
    title: "The Crossroads",
    flavor: "Every street leads somewhere. The question is: who's waiting there?",
    situation: "The package is in your hands. Three paths diverge: deliver it to the buyer and get paid, sell it to Marquez and clear your record, or burn it and let the whole block reset. Each path has a gatekeeper. Each gatekeeper has a price.",
    stakes: "This is the final choice. Trust, heat, and reputation all converge here. The ending you get depends on who you've aligned with and what you've sacrificed to get here.",
    npcs: ["Uncle Ray", "Detective Marquez", "Jada"],
    requiredTrust: {},
    requiredHeat: { min: 0, max: 10 },
    unlocks: ["ending"],
    locks: ["beat_3b"],
    tags: ["climax", "final_choice", "alignment"],
    consequences: {
      "loyal": { trustDelta: { "Uncle Ray": 5 }, heatDelta: -1, reputationDelta: 3, secret: "loyalty_rewarded", flag: "delivered_package" },
      "selfish": { trustDelta: { "Detective Marquez": 3, "Uncle Ray": -5 }, heatDelta: 0, reputationDelta: 0, secret: "witness_protection", flag: "sold_out" },
      "clever": { trustDelta: {}, heatDelta: 0, reputationDelta: 2, secret: "double_cross", flag: "burned_package" },
      "street": { trustDelta: { "Uncle Ray": -2 }, heatDelta: 2, reputationDelta: 1, secret: "street_kingpin", flag: "took_over" }
    }
  },
  {
    id: "beat_3b",
    beat: 3,
    variant: "B",
    title: "The Reckoning",
    flavor: "When the truth comes out, everyone pays.",
    situation: "The secret you've been hiding is exposed. The block knows. Marquez has the evidence. Uncle Ray is gone—either disappeared or turned state's evidence. You're standing in the ashes of everything you built. The only question is: who walks away?",
    stakes: "This is the alternative climax path, unlocked only if trust is high and heat is managed. It offers redemption or total destruction. There's no middle ground here.",
    npcs: ["Detective Marquez", "Jada"],
    requiredTrust: { "Jada": 3 },
    requiredHeat: { min: 0, max: 4 },
    unlocks: ["ending"],
    locks: ["beat_3a"],
    tags: ["climax", "redemption", "truth"],
    consequences: {
      "loyal": { trustDelta: { "Jada": 5 }, heatDelta: 1, reputationDelta: 3, secret: "truth_told", flag: "redemption_earned" },
      "selfish": { trustDelta: { "Detective Marquez": -3 }, heatDelta: 3, reputationDelta: -2, secret: null, flag: "wanted_status" },
      "clever": { trustDelta: { "Jada": 2, "Detective Marquez": 1 }, heatDelta: -1, reputationDelta: 2, secret: " immunity_deal", flag: "deal_made" },
      "street": { trustDelta: {}, heatDelta: 4, reputationDelta: 1, secret: "vanished", flag: "ghost_mode" }
    }
  }
];
```

### 3.2 White Response Cards (Exact Data — 30 Total)

```javascript
const WHITE_CARDS = [
  // LOYAL CARDS (8)
  { id: "white_001", text: "I got you, family. Always.", tags: ["loyal"], trustDelta: { "Uncle Ray": 2 }, heatDelta: -1, reputationDelta: 1 },
  { id: "white_002", text: "We ride together. We die together.", tags: ["loyal"], trustDelta: { "Uncle Ray": 3 }, heatDelta: 1, reputationDelta: 1 },
  { id: "white_003", text: "The package stays with me. No exceptions.", tags: ["loyal"], trustDelta: { "Uncle Ray": 1 }, heatDelta: 0, reputationDelta: 1 },
  { id: "white_004", text: "I protect my own. That's not a choice, that's the code.", tags: ["loyal"], trustDelta: { "Uncle Ray": 2, "Jada": 1 }, heatDelta: 0, reputationDelta: 1 },
  { id: "white_005", text: "Ray raised me. I don't forget that.", tags: ["loyal"], trustDelta: { "Uncle Ray": 4 }, heatDelta: 0, reputationDelta: 2 },
  { id: "white_006", text: "We hold the line. Together.", tags: ["loyal"], trustDelta: { "Jada": 1 }, heatDelta: -1, reputationDelta: 1 },
  { id: "white_007", text: "My loyalty isn't for sale.", tags: ["loyal"], trustDelta: {}, heatDelta: 0, reputationDelta: 1, secret: "unbreakable" },
  { id: "white_008", text: "I'd take a bullet for this block.", tags: ["loyal"], trustDelta: { "Uncle Ray": 2, "Jada": 2 }, heatDelta: 1, reputationDelta: 2 },

  // SELFISH CARDS (8)
  { id: "white_009", text: "Look out for #1. That's the only rule that never changes.", tags: ["selfish"], trustDelta: { "Uncle Ray": -2 }, heatDelta: 1, reputationDelta: 0 },
  { id: "white_010", text: "Burn the others to save yourself. Survival of the fittest.", tags: ["selfish"], trustDelta: { "Uncle Ray": -3, "Jada": -1 }, heatDelta: 2, reputationDelta: -1 },
  { id: "white_011", text: "Take the package and run. Everyone else can figure it out.", tags: ["selfish"], trustDelta: { "Uncle Ray": -4 }, heatDelta: 2, reputationDelta: -1, secret: "runner" },
  { id: "white_012", text: "I don't have friends. I have interests.", tags: ["selfish"], trustDelta: {}, heatDelta: 1, reputationDelta: 0 },
  { id: "white_013", text: "Every man for himself when the sirens wail.", tags: ["selfish"], trustDelta: { "Uncle Ray": -2 }, heatDelta: 2, reputationDelta: 0 },
  { id: "white_014", text: "My future's more important than this block's past.", tags: ["selfish"], trustDelta: { "Uncle Ray": -3 }, heatDelta: 0, reputationDelta: 0, secret: "exit_plan" },
  { id: "white_015", text: "I'll give you up if it means I walk free.", tags: ["selfish"], trustDelta: { "Uncle Ray": -5 }, heatDelta: -1, reputationDelta: -2 },
  { id: "white_016", text: "Sorry, not sorry. This is my moment.", tags: ["selfish"], trustDelta: {}, heatDelta: 1, reputationDelta: 0 },

  // CLEVER CARDS (8)
  { id: "white_017", text: "Talk our way out. Words are weapons too.", tags: ["clever"], trustDelta: { "Detective Marquez": 1 }, heatDelta: -1, reputationDelta: 1 },
  { id: "white_018", text: "Frame the competition. Let them take the fall.", tags: ["clever"], trustDelta: {}, heatDelta: 1, reputationDelta: 0, secret: "frame_job" },
  { id: "white_019", text: "Make a deal with Marquez. She wants a win too.", tags: ["clever"], trustDelta: { "Detective Marquez": 3 }, heatDelta: -2, reputationDelta: 1, secret: "marquez_deal" },
  { id: "white_020", text: "The truth is negotiable. Let's haggle.", tags: ["clever"], trustDelta: {}, heatDelta: 0, reputationDelta: 1 },
  { id: "white_021", text: "Information is power. Use it.", tags: ["clever"], trustDelta: { "Jada": 2 }, heatDelta: 0, reputationDelta: 1, secret: "info_broker" },
  { id: "white_022", text: "I have a plan. It's complicated, but it works.", tags: ["clever"], trustDelta: {}, heatDelta: -1, reputationDelta: 1 },
  { id: "white_023", text: "Let's make this everyone's problem.", tags: ["clever"], trustDelta: {}, heatDelta: 2, reputationDelta: 0, secret: "wildcard" },
  { id: "white_024", text: "The law has loopholes. I know them.", tags: ["clever"], trustDelta: { "Detective Marquez": 1 }, heatDelta: -1, reputationDelta: 1 },

  // STREET CARDS (8)
  { id: "white_025", text: "Pull the heat. Make 'em run.", tags: ["street"], trustDelta: {}, heatDelta: 3, reputationDelta: 0 },
  { id: "white_026", text: "Call in a favor. Everybody owes somebody.", tags: ["street"], trustDelta: { "Jada": 1 }, heatDelta: 0, reputationDelta: 1, secret: "favors_called" },
  { id: "white_027", text: "Run the route. I know these backstreets.", tags: ["street"], trustDelta: {}, heatDelta: -1, reputationDelta: 0, secret: "escape_artist" },
  { id: "white_028", text: "The block got eyes. We'll know before they kick the door.", tags: ["street"], trustDelta: { "Jada": 2 }, heatDelta: -1, reputationDelta: 1 },
  { id: "white_029", text: "Street code: no snitching, no losing.", tags: ["street"], trustDelta: { "Uncle Ray": 1 }, heatDelta: 0, reputationDelta: 1 },
  { id: "white_030", text: "I got connections deep. Real deep.", tags: ["street"], trustDelta: {}, heatDelta: 0, reputationDelta: 1, secret: "deep_connections" },
  { id: "white_031", text: "Move fast, break nothing, leave no trace.", tags: ["street"], trustDelta: {}, heatDelta: -1, reputationDelta: 0 },
  { id: "white_032", text: "This block runs on respect. I'm demanding mine.", tags: ["street"], trustDelta: { "Uncle Ray": 1 }, heatDelta: 1, reputationDelta: 1 }
];
```

---

## SECTION 4: ORIGINS DATA SPECIFICATION

### 4.1 Complete Origins Data

```javascript
const ORIGINS = {
  BARBER: {
    id: "BARBER",
    name: "Master Barber",
    description: "You run the shop on the corner. Everyone trusts you. You hear everything from behind the chair.",
    icon: "💈",
    startingTrust: { "Uncle Ray": 2, "Jada": 1 },
    startingHeat: 1,
    startingSecrets: ["neighborhood_ears"],
    specialAbility: {
      name: "Block Gossip",
      description: "Once per game, before a beat reveals, you may ask the judge to reveal one card from another player's hand.",
      cost: null,
      usageLimit: 1,
      timing: "before_beat_reveal"
    },
    bonuses: {
      "loyal": +1, // +1 to trustDelta for loyal cards
      "clever": +0
    }
  },
  STREET_SCHOLAR: {
    id: "STREET_SCHOLAR",
    name: "Street Scholar",
    description: "You read the streets like books. You know the history, the players, and the angles.",
    icon: "📚",
    startingTrust: { "Detective Marquez": 1, "Jada": 1 },
    startingHeat: 0,
    startingSecrets: ["book_smarts"],
    specialAbility: {
      name: "Library Card",
      description: "Once per game, after drawing white cards, you may discard up to 2 cards and draw that many replacements.",
      cost: null,
      usageLimit: 1,
      timing: "after_draw"
    },
    bonuses: {
      "clever": +2, // +2 to trustDelta for clever cards
      "loyal": +0
    }
  },
  LOCAL_LEGEND: {
    id: "LOCAL_LEGEND",
    name: "Local Legend",
    description: "Your name carries weight. People remember your face and your deeds.",
    icon: "👑",
    startingTrust: {},
    startingHeat: 2,
    startingSecrets: ["street_cred"],
    specialAbility: {
      name: "Name Drop",
      description: "Once per game, if you lose a judging vote, you may automatically win instead. The legend stands.",
      cost: null,
      usageLimit: 1,
      timing: "after_judging"
    },
    bonuses: {
      "loyal": +1,
      "street": +1
    }
  },
  CORNER_MERCHANT: {
    id: "CORNER_MERCHANT",
    name: "Corner Merchant",
    description: "You see everything, you say nothing. The bodega counter is your throne.",
    icon: "🏪",
    startingTrust: { "Uncle Ray": 1, "Jada": 1 },
    startingHeat: 0,
    startingSecrets: ["eyes_on_the_street"],
    specialAbility: {
      name: "Trade Secrets",
      description: "Once per game, you may swap one card from your hand with one from another player's hand of your choice.",
      cost: null,
      usageLimit: 1,
      timing: "before_card_play"
    },
    bonuses: {
      "clever": +1,
      "street": +1
    }
  }
};
```

---

## SECTION 5: STORY ENGINE IMPLEMENTATION

### 5.1 File: story-engine.js (Complete Implementation)

```javascript
/**
 * Concrete Kings — Story Engine
 * State machine for narrative card RPG
 */

const StoryEngine = (() => {
  // Private state
  let state = null;

  // NPC definitions with full metadata
  const NPCS = {
    "Uncle Ray": {
      fullName: "Uncle Ray",
      role: "Block Patriarch",
      color: "#c9822b",
      alignment: ["loyal", "street"]
    },
    "Detective Marquez": {
      fullName: "Detective Marquez",
      role: "NYPD, 125th Precinct",
      color: "#85c4ff",
      alignment: ["clever", "selfish"]
    },
    "Jada": {
      fullName: "Jada",
      role: "Bodega Owner",
      color: "#6fe8d8",
      alignment: ["loyal", "clever"]
    }
  };

  // Ending definitions with conditions
  const ENDINGS = [
    {
      id: "the_hustle",
      title: "The Hustle",
      condition: (s) => s.endingFlags.deliveredPackage && s.trust["Uncle Ray"] >= 3 && s.heat <= 5,
      flavor: "You made the drop. The money's clean. Uncle Ray nods at you from across the barbershop. The block breathes easier tonight. You didn't just survive—you prospered. The package changed everything, and you changed with it."
    },
    {
      id: "the_trap",
      title: "The Trap",
      condition: (s) => s.heat >= 8 && (s.endingFlags.soldOut || s.endingFlags.ratEscaped),
      flavor: "Sirens never stopped. When the sun came up, the block was different—shaken, silent, watched. Someone talked. Whether it was you or someone else doesn't matter now. The trust is broken. The heat won't fade. You're just another face in the booking photos."
    },
    {
      id: "the_exit",
      title: "The Exit",
      condition: (s) => s.endingFlags.escapedRaid && s.endingFlags.packageLost && s.trust["Uncle Ray"] < 0,
      flavor: "You left everything behind. The package, the block, the history. Somewhere in New Jersey, you're rebuilding. But the sound of Harlem sirens follows you in dreams. You survived, but at what cost?"
    },
    {
      id: "the_kingpin",
      title: "The Kingpin",
      condition: (s) => s.reputation === "feared" && s.endingFlags.tookOver,
      flavor: "The block bends to your will now. Uncle Ray's shop is yours. Jada's bodega pays protection. Marquez doesn't even bother with warrants anymore—she just looks the other way. You didn't just survive the night. You owned it."
    },
    {
      id: "the_ghost",
      title: "The Ghost",
      condition: (s) => s.reputation === "pariah" && s.endingFlags.vanished,
      flavor: "Nobody knows where you went. The block whispers your name like a warning. Some say you're in Montreal. Some say you never left. The package is gone. The evidence is gone. You're gone. And that's exactly how you wanted it."
    }
  ];

  // Default ending if no conditions met
  const DEFAULT_ENDING = {
    id: "the_survivor",
    title: "The Survivor",
    flavor: "You made it through the night. The package is gone, the block is intact, and you're still standing. Not a hero, not a villain—just someone who made hard choices and lived with them. Tomorrow's another day on 125th."
  };

  // Initialize new game state from origin
  function initState(originKey) {
    const origin = ORIGINS[originKey];
    if (!origin) throw new Error(`Invalid origin: ${originKey}`);
    
    state = {
      storyBeat: 0,
      variant: "A",
      trust: { ...origin.startingTrust },
      heat: origin.startingHeat,
      secrets: [...origin.startingSecrets],
      reputation: "unknown",
      chosenPaths: [],
      endingFlags: {},
      czarIndex: 0,
      roundNumber: 0,
      originKey: originKey,
      specialAbilityUsed: false
    };
    
    calculateReputation();
    return { ...state };
  }

  // Get current beat based on state
  function getCurrentBeat() {
    if (!state) throw new Error("State not initialized. Call initState() first.");
    
    // Check if we're at ending
    if (state.storyBeat === 5) {
      return { type: "ending", data: resolveEnding() };
    }

    // Find matching beat
    const beatData = BLACK_CARDS.find(card => 
      card.beat === state.storyBeat && card.variant === state.variant
    );

    if (!beatData) {
      // Fallback to variant A if current variant not found
      const fallback = BLACK_CARDS.find(card => card.beat === state.storyBeat && card.variant === "A");
      if (fallback) {
        state.variant = "A";
        return { type: "beat", data: fallback };
      }
      throw new Error(`No beat found for beat ${state.storyBeat}, variant ${state.variant}`);
    }

    return { type: "beat", data: beatData };
  }

  // Apply consequence from winning card choice
  function applyConsequence(choiceTags, winnerOrigin) {
    if (!state) throw new Error("State not initialized");
    if (!choiceTags || !Array.isArray(choiceTags)) throw new Error("choiceTags must be array");
    
    const currentBeat = getCurrentBeat();
    if (currentBeat.type !== "beat") throw new Error("Cannot apply consequence to ending");
    
    const beatData = currentBeat.data;
    
    // Determine primary tag (first matching tag in priority order)
    const tagPriority = ["loyal", "selfish", "clever", "street"];
    const primaryTag = tagPriority.find(tag => choiceTags.includes(tag)) || "loyal";
    
    // Get consequence for this tag
    const consequence = beatData.consequences[primaryTag];
    if (!consequence) throw new Error(`No consequence for tag: ${primaryTag}`);
    
    // Apply trust changes
    if (consequence.trustDelta) {
      for (const [npc, delta] of Object.entries(consequence.trustDelta)) {
        state.trust[npc] = Math.max(-10, Math.min(10, (state.trust[npc] || 0) + delta));
      }
    }
    
    // Apply heat change
    if (consequence.heatDelta !== undefined) {
      state.heat = Math.max(0, Math.min(10, state.heat + consequence.heatDelta));
    }
    
    // Apply reputation change
    if (consequence.reputationDelta !== undefined) {
      // Reputation will be recalculated after all changes
    }
    
    // Award secret if provided
    if (consequence.secret && !state.secrets.includes(consequence.secret)) {
      state.secrets.push(consequence.secret);
    }
    
    // Set ending flag if provided
    if (consequence.flag) {
      state.endingFlags[consequence.flag] = true;
    }
    
    // Track chosen path
    state.chosenPaths.push(`${state.storyBeat}${state.variant}`);
    
    // Advance beat
    state.roundNumber++;
    advanceBeat(beatData);
    
    // Recalculate reputation
    calculateReputation();
    
    return {
      primaryTag,
      consequence,
      newState: { ...state }
    };
  }

  // Advance to next beat based on unlocks/locks
  function advanceBeat(currentBeatData) {
    // Default to next sequential beat
    let nextBeat = state.storyBeat + 1;
    let nextVariant = "A";
    
    // Check if we should use variant B path
    if (state.chosenPaths.includes("1A") && nextBeat === 2) {
      // If took 1A, go to 2A; if took 1B, go to 2B
      const lastPath = state.chosenPaths[state.chosenPaths.length - 1];
      if (lastPath.endsWith("B")) {
        nextVariant = "B";
      }
    }
    
    // Check for forced variant based on state
    if (state.heat >= 7 && nextBeat === 2) {
      nextVariant = "B"; // High heat forces Beat 2B
    }
    
    // Check if we've reached climax
    if (nextBeat >= 3) {
      // Determine which climax based on accumulated state
      const trustSum = Object.values(state.trust).reduce((a, b) => a + b, 0);
      if (trustSum >= 5 && state.heat <= 4) {
        nextVariant = "B"; // High trust, low heat = Beat 3B (redemption path)
      } else {
        nextVariant = "A"; // Otherwise Beat 3A (crossroads)
      }
    }
    
    state.storyBeat = Math.min(5, nextBeat);
    state.variant = nextVariant;
  }

  // Calculate reputation based on trust and heat
  function calculateReputation() {
    const trustSum = Object.values(state.trust).reduce((a, b) => a + b, 0);
    const heat = state.heat;
    
    if (heat >= 9) {
      state.reputation = "pariah";
    } else if (heat >= 6) {
      state.reputation = trustSum >= 5 ? "feared" : "pariah";
    } else if (trustSum >= 8) {
      state.reputation = "trusted";
    } else if (trustSum >= 4) {
      state.reputation = heat >= 4 ? "feared" : "trusted";
    } else {
      state.reputation = "unknown";
    }
  }

  // Resolve ending based on accumulated state
  function resolveEnding() {
    if (!state) throw new Error("State not initialized");
    
    for (const ending of ENDINGS) {
      if (ending.condition(state)) {
        return ending;
      }
    }
    
    return DEFAULT_ENDING;
  }

  // Get available endings that could be reached
  function getAvailableEndings() {
    if (!state) return [];
    return ENDINGS.filter(e => e.condition(state));
  }

  // Get story log entries
  function getStoryLog() {
    if (!state) return [];
    return state.chosenPaths.map((path, index) => {
      const beatNum = parseInt(path[0]);
      const variant = path[1];
      const beat = BLACK_CARDS.find(c => c.beat === beatNum && c.variant === variant);
      return {
        beatNumber: beatNum,
        variant: variant,
        title: beat ? beat.title : "Unknown",
        timestamp: index + 1
      };
    });
  }

  // Get trust meter data for UI
  function getTrustMeters() {
    if (!state) return {};
    return { ...state.trust };
  }

  // Get heat level
  function getHeat() {
    return state ? state.heat : 0;
  }

  // Get reputation
  function getReputation() {
    return state ? state.reputation : "unknown";
  }

  // Get secrets
  function getSecrets() {
    return state ? [...state.secrets] : [];
  }

  // Use a secret (remove from available)
  function useSecret(secretId) {
    if (!state) return false;
    const index = state.secrets.indexOf(secretId);
    if (index === -1) return false;
    state.secrets.splice(index, 1);
    return true;
  }

  // Check if special ability has been used
  function hasUsedSpecialAbility() {
    return state ? state.specialAbilityUsed : false;
  }

  function markSpecialAbilityUsed() {
    if (state) state.specialAbilityUsed = true;
  }

  // Get current state for UI binding
  function getState() {
    return state ? { ...state } : null;
  }

  return {
    initState,
    getCurrentBeat,
    applyConsequence,
    advanceBeat,
    calculateReputation,
    resolveEnding,
    getAvailableEndings,
    getStoryLog,
    getTrustMeters,
    getHeat,
    getReputation,
    getSecrets,
    useSecret,
    hasUsedSpecialAbility,
    markSpecialAbilityUsed,
    getState,
    NPCS,
    ENDINGS
  };
})();
```

---

## SECTION 6: ORIGINS IMPLEMENTATION

### 6.1 File: origins.js (Complete Implementation)

```javascript
/**
 * Concrete Kings — Character Origins
 * Defines all playable character origins with starting stats and abilities
 */

const ORIGINS = {
  BARBER: {
    id: "BARBER",
    name: "Master Barber",
    shortName: "Barber",
    description: "You run the shop on the corner. Everyone trusts you. You hear everything from behind the chair.",
    icon: "💈",
    color: "#c9822b",
    startingTrust: { "Uncle Ray": 2, "Jada": 1 },
    startingHeat: 1,
    startingSecrets: ["neighborhood_ears"],
    specialAbility: {
      id: "block_gossip",
      name: "Block Gossip",
      description: "Once per game, before a beat reveals, you may ask the judge to reveal one card from another player's hand.",
      cost: null,
      usageLimit: 1,
      timing: "before_beat_reveal",
      effect: "reveal_card"
    },
    bonuses: {
      "loyal": 1,
      "clever": 0,
      "selfish": 0,
      "street": 0
    },
    flavor: "The clippers hum. The stories flow. You know everybody's business because everybody sits in your chair."
  },
  STREET_SCHOLAR: {
    id: "STREET_SCHOLAR",
    name: "Street Scholar",
    shortName: "Scholar",
    description: "You read the streets like books. You know the history, the players, and the angles.",
    icon: "📚",
    color: "#85c4ff",
    startingTrust: { "Detective Marquez": 1, "Jada": 1 },
    startingHeat: 0,
    startingSecrets: ["book_smarts"],
    specialAbility: {
      id: "library_card",
      name: "Library Card",
      description: "Once per game, after drawing white cards, you may discard up to 2 cards and draw that many replacements.",
      cost: null,
      usageLimit: 1,
      timing: "after_draw",
      effect: "redraw_cards"
    },
    bonuses: {
      "loyal": 0,
      "clever": 2,
      "selfish": 0,
      "street": 0
    },
    flavor: "You've studied the block like a textbook. Every corner has a memory. Every face has a file."
  },
  LOCAL_LEGEND: {
    id: "LOCAL_LEGEND",
    name: "Local Legend",
    shortName: "Legend",
    description: "Your name carries weight. People remember your face and your deeds.",
    icon: "👑",
    color: "#ffcd68",
    startingTrust: {},
    startingHeat: 2,
    startingSecrets: ["street_cred"],
    specialAbility: {
      id: "name_drop",
      name: "Name Drop",
      description: "Once per game, if you lose a judging vote, you may automatically win instead. The legend stands.",
      cost: null,
      usageLimit: 1,
      timing: "after_judging",
      effect: "auto_win"
    },
    bonuses: {
      "loyal": 1,
      "clever": 0,
      "selfish": 0,
      "street": 1
    },
    flavor: "They wrote songs about you. They named a stoop after you. You didn't ask for it—you earned it."
  },
  CORNER_MERCHANT: {
    id: "CORNER_MERCHANT",
    name: "Corner Merchant",
    shortName: "Merchant",
    description: "You see everything, you say nothing. The bodega counter is your throne.",
    icon: "🏪",
    color: "#6fe8d8",
    startingTrust: { "Uncle Ray": 1, "Jada": 1 },
    startingHeat: 0,
    startingSecrets: ["eyes_on_the_street"],
    specialAbility: {
      id: "trade_secrets",
      name: "Trade Secrets",
      description: "Once per game, you may swap one card from your hand with one from another player's hand of your choice.",
      cost: null,
      usageLimit: 1,
      timing: "before_card_play",
      effect: "swap_card"
    },
    bonuses: {
      "loyal": 0,
      "clever": 1,
      "selfish": 0,
      "street": 1
    },
    flavor: "You've been behind that counter for twenty years. You know who's buying, who's selling, and who's lying."
  }
};

// Helper to get origin by key
function getOrigin(key) {
  return ORIGINS[key.toUpperCase()] || null;
}

// Helper to list all origins
function listOrigins() {
  return Object.values(ORIGINS);
}
```

---

## SECTION 7: INDEX.HTML REWORK SPECIFICATION

### 7.1 HTML Structure to Add

#### Story State Panel (add inside #game-screen, above #stage-canvas)
```html
<div id="story-panel" style="display:none;">
  <div id="beat-indicator" style="font-family:'Press Start 2P',monospace;font-size:12px;color:#ffcd68;margin-bottom:8px;">
    Beat 0: The Last Package on 125th
  </div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;">
    <div id="trust-meters" style="flex:1;min-width:200px;">
      <div class="trust-meter" data-npc="Uncle Ray" style="color:#c9822b;">
        Uncle Ray: <span class="trust-value">0</span>
      </div>
      <div class="trust-meter" data-npc="Detective Marquez" style="color:#85c4ff;">
        Detective Marquez: <span class="trust-value">0</span>
      </div>
      <div class="trust-meter" data-npc="Jada" style="color:#6fe8d8;">
        Jada: <span class="trust-value">0</span>
      </div>
    </div>
    <div id="heat-meter" style="color:#ff7a45;font-weight:bold;">
      Heat: <span id="heat-value">0</span>/10
    </div>
    <div id="reputation-display" style="color:#ffcd68;">
      Reputation: <span id="reputation-value">Unknown</span>
    </div>
  </div>
  <div id="secrets-display" style="margin-top:8px;font-size:11px;color:#8b95ab;">
    Secrets: <span id="secrets-list">None</span>
  </div>
</div>
```

#### Story Log (add to sidebar or below game area)
```html
<div id="story-log" style="display:none;">
  <h3 style="font-family:'Press Start 2P',monospace;font-size:10px;color:#ffcd68;margin-top:0;">Story Log</h3>
  <div id="log-entries" style="max-height:200px;overflow-y:auto;font-size:11px;line-height:1.6;">
    <!-- Log entries will be injected here -->
  </div>
</div>
```

#### Narrative Resolution Screen (replace judging-complete screen)
```html
<div id="narrative-resolution" style="display:none;">
  <h2 id="resolution-title" style="font-family:'Press Start 2P',monospace;font-size:14px;color:#ffcd68;">What Happens</h2>
  <div id="consequence-text" style="font-size:13px;line-height:1.7;margin:12px 0;padding:12px;background:#181920;border:2px solid #474d5e;">
    <!-- Consequence flavor text injected here -->
  </div>
  <div id="state-changes" style="font-size:11px;color:#8b95ab;margin-bottom:12px;">
    <!-- State changes listed here -->
  </div>
  <div id="special-ability-section" style="display:none;margin-bottom:12px;">
    <button id="use-ability-btn" class="secondary" style="font-size:10px;">
      Use Special Ability
    </button>
  </div>
  <button id="next-beat-btn" onclick="app.nextBeat()" style="font-family:'Press Start 2P',monospace;font-size:11px;padding:10px 20px;">
    Continue →
  </button>
</div>
```

#### Ending Screen (new screen)
```html
<div id="ending-screen" class="screen" style="display:none;">
  <div class="panel" style="max-width:700px;margin:40px auto;text-align:center;">
    <h2 id="ending-title" style="font-family:'Press Start 2P',monospace;font-size:18px;color:#ffcd68;">The Ending</h2>
    <div id="ending-flavor" style="font-size:14px;line-height:1.8;margin:20px 0;padding:20px;background:#181920;border:3px solid #ffcd68;">
      <!-- Ending flavor text -->
    </div>
    <div id="ending-stats" style="font-size:11px;color:#8b95ab;text-align:left;margin:20px 0;padding:12px;background:#101116;border:1px dashed #474d5e;">
      <!-- Final statistics -->
    </div>
    <button onclick="app.restartGame()" style="font-family:'Press Start 2P',monospace;font-size:11px;padding:12px 24px;">
      Play Again
    </button>
  </div>
</div>
```

### 7.2 JavaScript Functions to Add (Exact Signatures)

```javascript
// Initialize story state from selected origin
function initStory(originKey) {
  const state = StoryEngine.initState(originKey);
  this.storyState = state;
  this.currentBeat = StoryEngine.getCurrentBeat();
  this.storyLog = StoryEngine.getStoryLog();
  renderStoryPanel();
  renderStoryLog();
  showScreen('game');
}

// Render story state panel
function renderStoryPanel() {
  const state = StoryEngine.getState();
  if (!state) return;
  
  // Update beat indicator
  document.getElementById('beat-indicator').textContent = 
    `Beat ${state.storyBeat}: ${this.currentBeat.data.title}`;
  
  // Update trust meters
  const trust = StoryEngine.getTrustMeters();
  for (const [npc, value] of Object.entries(trust)) {
    const meter = document.querySelector(`.trust-meter[data-npc="${npc}"] .trust-value`);
    if (meter) meter.textContent = value;
  }
  
  // Update heat
  document.getElementById('heat-value').textContent = StoryEngine.getHeat();
  
  // Update reputation
  document.getElementById('reputation-value').textContent = 
    state.reputation.charAt(0).toUpperCase() + state.reputation.slice(1);
  
  // Update secrets
  const secrets = StoryEngine.getSecrets();
  document.getElementById('secrets-list').textContent = 
    secrets.length > 0 ? secrets.join(', ') : 'None';
}

// Render story log
function renderStoryLog() {
  const log = StoryEngine.getStoryLog();
  const container = document.getElementById('log-entries');
  container.innerHTML = log.map(entry => 
    `<div style="padding:4px 0;border-bottom:1px dashed #2d313d;">
      Beat ${entry.beatNumber}${entry.variant}: ${entry.title}
    </div>`
  ).join('');
}

// Show beat and start card play
function renderBeat() {
  this.currentBeat = StoryEngine.getCurrentBeat();
  const beatData = this.currentBeat.data;
  
  if (this.currentBeat.type === 'ending') {
    showEnding();
    return;
  }
  
  // Update black card display with narrative data
  document.getElementById('black-card-title').textContent = beatData.title;
  document.getElementById('black-card-flavor').textContent = beatData.flavor;
  document.getElementById('black-card-situation').textContent = beatData.situation;
  document.getElementById('black-card-stakes').textContent = `Stakes: ${beatData.stakes}`;
  document.getElementById('beat-number').textContent = `Beat ${beatData.beat}`;
  
  // Show story panel
  document.getElementById('story-panel').style.display = 'block';
  document.getElementById('story-log').style.display = 'block';
  
  // Enable card play
  enableCardPlay();
}

// Apply choice and show consequence
function applyChoice(choiceIndex, winnerIndex) {
  const playedCards = getPlayedCards(); // array of {playerId, card, tags}
  const winningCard = playedCards[winnerIndex];
  
  if (!winningCard) {
    console.error('No winning card found');
    return;
  }
  
  // Apply consequence
  const result = StoryEngine.applyConsequence(winningCard.tags, winningCard.origin);
  
  // Show narrative resolution screen
  showNarrativeResolution(result);
  
  // Update UI
  renderStoryPanel();
  renderStoryLog();
}

// Show narrative resolution screen
function showNarrativeResolution(result) {
  const beatData = this.currentBeat.data;
  
  document.getElementById('resolution-title').textContent = 
    `Beat ${beatData.beat} Consequence`;
  document.getElementById('consequence-text').textContent = 
    `${beatData.flavor}\n\n${getConsequenceFlavorText(result.primaryTag)}`;
  
  // Show state changes
  const changes = [];
  if (result.consequence.trustDelta) {
    for (const [npc, delta] of Object.entries(result.consequence.trustDelta)) {
      changes.push(`${npc}: ${delta > 0 ? '+' : ''}${delta} trust`);
    }
  }
  if (result.consequence.heatDelta !== undefined) {
    changes.push(`Heat: ${result.consequence.heatDelta > 0 ? '+' : ''}${result.consequence.heatDelta}`);
  }
  document.getElementById('state-changes').innerHTML = 
    changes.map(c => `<div>${c}</div>`).join('');
  
  // Show special ability button if available
  const abilitySection = document.getElementById('special-ability-section');
  const originKey = this.storyState.originKey;
  const origin = ORIGINS[originKey];
  if (origin && origin.specialAbility && !StoryEngine.hasUsedSpecialAbility()) {
    abilitySection.style.display = 'block';
    document.getElementById('use-ability-btn').onclick = () => useSpecialAbility();
  } else {
    abilitySection.style.display = 'none';
  }
  
  document.getElementById('narrative-resolution').style.display = 'block';
  document.getElementById('judging-screen').style.display = 'none';
}

// Get consequence flavor text based on tag
function getConsequenceFlavorText(tag) {
  const flavorTexts = {
    loyal: "The group stays strong. Trust deepens. The block remembers loyalty.",
    selfish: "Someone looks out for themselves. Trust fractures. The block whispers.",
    clever: "A smart play shifts the game. Information is power, and you just wielded it.",
    street: "The street does what it does. Chaos moves. People adjust. Or don't."
  };
  return flavorTexts[tag] || "The consequences ripple through the block.";
}

// Advance to next beat
function nextBeat() {
  document.getElementById('narrative-resolution').style.display = 'none';
  
  // Check if game is over
  const current = StoryEngine.getCurrentBeat();
  if (current.type === 'ending') {
    showEnding();
    return;
  }
  
  // Show next beat
  this.currentBeat = current;
  renderBeat();
}

// Show ending screen
function showEnding() {
  const ending = StoryEngine.resolveEnding();
  
  document.getElementById('ending-title').textContent = ending.title;
  document.getElementById('ending-flavor').textContent = ending.flavor;
  
  // Build stats
  const state = StoryEngine.getState();
  const stats = [
    `Reputation: ${state.reputation}`,
    `Heat Level: ${state.heat}/10`,
    `Trust: ${JSON.stringify(state.trust)}`,
    `Choices Made: ${state.chosenPaths.length}`,
    `Secrets Earned: ${state.secrets.join(', ') || 'None'}`
  ];
  document.getElementById('ending-stats').innerHTML = 
    stats.map(s => `<div>${s}</div>`).join('');
  
  showScreen('ending');
}

// Restart game
function restartGame() {
  // Return to setup screen
  showScreen('setup');
}

// Use special ability
function useSpecialAbility() {
  const originKey = this.storyState.originKey;
  const origin = ORIGINS[originKey];
  
  if (!origin || !origin.specialAbility || StoryEngine.hasUsedSpecialAbility()) {
    return;
  }
  
  // Mark as used
  StoryEngine.markSpecialAbilityUsed();
  
  // Hide ability button
  document.getElementById('special-ability-section').style.display = 'none';
  
  // TODO: Implement specific ability effects based on origin.specialAbility.effect
  alert(`${origin.specialAbility.name} used! Effect: ${origin.specialAbility.description}`);
}
```

---

## SECTION 8: IMPLEMENTATION TIMELINE (HOURLY BREAKDOWN)

### HOUR 1: STORY DATA (0:00-1:00)
**Tasks:**
1. Open `cards.js` and locate the existing `BLACK_CARDS` and `WHITE_CARDS` arrays
2. Append the 8 black narrative cards from Section 3.1 (exact text)
3. Append the 30 white response cards from Section 3.2 (exact text)
4. Add 5 ending template cards with flavor text from Section 3.1
5. Verify: `node -e "require('./cards.js')"` runs without error

**Deliverable:** cards.js expanded with all narrative data

### HOUR 2: STORY ENGINE (1:00-2:00)
**Tasks:**
1. Create `story-engine.js` with exact implementation from Section 5.1
2. Create `origins.js` with exact implementation from Section 6.1
3. Verify: `node -e "require('./story-engine.js'); require('./origins.js')"` runs without error
4. Test: `node -e "const se = require('./story-engine.js'); console.log(se.initState('BARBER'));"` outputs valid state

**Deliverable:** Two new files, both loadable in Node

### HOUR 3: UI WIRING (2:00-3:30)
**Tasks:**
1. Add HTML from Section 7.1 to `index.html`:
   - Story panel inside #game-screen
   - Story log below game area
   - Narrative resolution screen
   - Ending screen
2. Add JavaScript functions from Section 7.2 to inline script in `index.html`:
   - initStory, renderStoryPanel, renderStoryLog, renderBeat
   - applyChoice, showNarrativeResolution, nextBeat, showEnding
   - getConsequenceFlavorText, useSpecialAbility, restartGame
3. Wire `initStory()` to character selection completion in setup flow
4. Wire `renderBeat()` to game start after setup
5. Wire `applyChoice()` to judging completion handler
6. Wire `nextBeat()` to resolution button
7. Verify: `npm test` passes all syntax checks

**Deliverable:** index.html fully wired to story engine

### HOUR 4: GAME FLOW (3:30-5:00)
**Tasks:**
1. Implement beat transition logic in `story-engine.js` advanceBeat()
2. Add path locking/unlocking based on trust/heat thresholds
3. Wire special abilities to their timing hooks:
   - block_gossip: before_beat_reveal
   - library_card: after_draw
   - name_drop: after_judging
   - trade_secrets: before_card_play
4. Add visual feedback for trust/heat/reputation changes:
   - Color-coded trust meters (green for positive, red for negative)
   - Heat meter that changes color as it rises (green → yellow → orange → red)
   - Reputation badge that updates with CSS transitions
5. Implement story log that auto-scrolls to latest entry
6. Add beat transition animations (fade in/out)
7. Test: Complete one full playthrough manually

**Deliverable:** Fully playable game flow with state propagation

### HOUR 5: POLISH & VERIFICATION (5:00-6:00)
**Tasks:**
1. Playtest Path A (Loyal): Select Barber, make all loyal choices, verify ending
2. Playtest Path B (Selfish): Select Corner Merchant, make selfish choices, verify different ending
3. Fix any broken consequence chains or missing transitions
4. Update `pixel-art-demo.html` with reference scene (simple Harlem stoop at night)
5. Run `npm test` and verify all tests pass
6. Fix any syntax errors in `index.html` inline script
7. Verify no console errors in browser (open dev tools, play through one beat)
8. Test special ability for each origin

**Deliverable:** Polished, verified, playable prototype

---

## SECTION 9: VERIFICATION CHECKLIST

### Mandatory Checks (Do Not Skip)
- [ ] `npm test` passes 62/62 tests
- [ ] HTML syntax check in `npm test` passes
- [ ] `node -e "require('./story-engine.js')"` runs without error
- [ ] `node -e "require('./origins.js')"` runs without error
- [ ] `node -e "require('./cards.js')"` runs without error
- [ ] Can select origin and start game from setup screen
- [ ] Beat 0 displays with all flavor text
- [ ] Can play white cards during card play phase
- [ ] Judging screen shows submitted cards
- [ ] Winner selection triggers consequence
- [ ] Trust/heat/reputation update visibly after each beat
- [ ] Story log shows past choices
- [ ] Can advance through all 5 beats without crash
- [ ] Ending screen displays with correct title and flavor text
- [ ] At least 2 different endings reachable via different choices
- [ ] Special abilities trigger at correct timing
- [ ] No console errors during full playthrough

---

## SECTION 10: ERROR HANDLING & EDGE CASES

### 10.1 Required Error Handling
- Invalid origin key → show error, default to BARBER
- Missing beat data → fallback to variant A, log warning
- Invalid card tags → default to "loyal" consequence
- State not initialized → show setup screen, do not crash
- Empty white card hand → auto-draw from deck
- Tie in judging → Czar tiebreaker, or Local Legend ability if applicable
- Special ability already used → button hidden, ignore clicks
- Heat exceeds 10 → cap at 10, trigger "max heat" flag
- Trust exceeds ±10 → cap at ±10

### 10.2 Edge Case Logic
- If player has secret that modifies card effect, apply bonus before consequence
- If heat is 10 and player draws "street" card, reduce heat by 3 instead of adding
- If trust sum is 0 at ending, default to "The Survivor" ending
- If no ending conditions met, always show "The Survivor"
- If story state is corrupted, reset to beat 0 with current origin

---

## SECTION 11: STORY CONTENT — COMPLETE FLAVOR TEXT

### 11.1 Black Card Flavor Text (Full)
Each black card needs full flavor text as specified in Section 3.1. Copy exactly:
- Prologue: "The package weighs more than money..."
- Beat 1A: "3 AM. The door shakes..."
- Beat 1B: "Some conversations are better had in the shadows..."
- Beat 2A: "Trust is a luxury. Paranoia is a survival skill..."
- Beat 2B: "Sirens aren't music. They're punctuation..."
- Beat 3A: "Every street leads somewhere..."
- Beat 3B: "When the truth comes out, everyone pays..."

### 11.2 White Card Flavor Text (Full)
All 32 white cards need exact text as specified in Section 3.2. Copy exactly.

### 11.3 Ending Flavor Text (Full)
All 5 endings need exact flavor text as specified in Section 3.1. Copy exactly.

---

## SECTION 12: UI/UX SPECIFICATIONS

### 12.1 Visual Design
- Color scheme: Noir Harlem night palette (dark backgrounds, warm accents)
- Primary colors: #c9822b (gold/amber), #ff7a45 (neon red), #6fe8d8 (cyan accent)
- Font: 'Press Start 2P' for headers, 'VT323' for body text, monospace for data
- Card styling: Existing pixel art style, 160x240 native canvas, 4-frame shimmer
- Layout: Setup on left, game stage on right, story log below

### 12.2 Responsive Behavior
- On mobile (<700px): Stack layout vertically
- Story panel always visible at top of game area
- Trust meters collapse to icons on small screens
- Heat meter always visible
- Story log collapses to "Show Log" button on mobile

### 12.3 Animations
- Beat transition: 0.3s fade
- Consequence reveal: 0.5s slide up
- Trust meter change: 0.2s color pulse
- Heat meter change: 0.3s fill animation
- Card play: existing 4-frame shimmer

---

## SECTION 13: TESTING PROTOCOL

### 13.1 Automated Tests (npm test)
Run after each phase:
```bash
npm test
```
Expected: 62/62 pass, no syntax errors

### 13.2 Manual Playtest Checklist
1. **Loyal Path Test:**
   - Select BARBER origin
   - Play all "loyal" tagged white cards
   - Verify trust increases for Uncle Ray/Jada
   - Verify heat decreases or stays low
   - Complete all 5 beats
   - Verify ending is "The Hustle" or "The Kingpin"

2. **Selfish Path Test:**
   - Select CORNER_MERCHANT origin
   - Play all "selfish" tagged white cards
   - Verify trust decreases for NPCs
   - Verify heat increases
   - Complete all 5 beats
   - Verify ending is "The Trap" or "The Ghost"

3. **Special Ability Test:**
   - Play each origin once
   - Use special ability at correct timing
   - Verify ability effect applies
   - Verify ability cannot be used twice

4. **Branching Test:**
   - Play through Beat 1A path
   - Restart, play through Beat 1B path
   - Verify different beats appear
   - Verify different consequences

---

## SECTION 14: FINAL DELIVERABLE SPECIFICATION

### 14.1 What "Done" Looks Like
1. All files created/modified as specified
2. `npm test` passes 62/62
3. Full playthrough works from setup to ending
4. At least 2 distinct endings reachable
5. No console errors
6. State tracking visible in UI
7. Story log populated
8. Special abilities functional
9. Branching paths work
10. All card text present and formatted

### 14.2 Files Modified (Summary)
- `cards.js`: +8 black cards, +32 white cards, +5 endings
- `index.html`: +story panel, +story log, +narrative resolution, +ending screen, +game flow wiring
- `src/pixel_engine/card-visual-system.js`: +narrative card support

### 14.3 Files Created (Summary)
- `story-engine.js`: Complete state machine, 200 lines
- `origins.js`: 4 origins with abilities, 150 lines

---

## SECTION 15: EXECUTION NOTES FOR CLAUDE CODE

### 15.1 How to Execute This Prompt
1. Open Claude Code in the `C:\Users\thecr\concrete-kings` directory
2. Copy the entire contents of this file as your first prompt
3. Claude will read the existing codebase and execute in order
4. Do not skip phases. Complete each phase fully before moving to next.
5. If any phase fails, fix it before proceeding.

### 15.2 Important Constraints
- **DO NOT** use external libraries or npm packages
- **DO NOT** modify files in `src/pixel_engine/` beyond card-visual-system.js
- **DO NOT** add build tools, transpilers, or frameworks
- **DO NOT** break existing test suite
- **DO NOT** add placeholder text — everything must be playable
- **DO** use existing patterns and style from the codebase
- **DO** verify each phase before moving to next
- **DO** keep all card text exactly as specified

### 15.3 Success Metric
At the end of the day, a 4-player group should be able to:
1. Open `index.html` in a browser
2. Select characters
3. Play through 5 story beats
4. See their choices affect the story
5. Reach one of 5 distinct endings
6. Understand why they got that ending
7. Want to play again with different choices

If any of these fail, the work is not done.

---

## APPENDIX A: QUICK REFERENCE — GAME STATE TRANSITIONS

```
SETUP → (origin selected) → BEAT_0 (prologue)
BEAT_0 → (consequence applied) → BEAT_1A or BEAT_1B
BEAT_1A → (consequence applied) → BEAT_2A
BEAT_1B → (consequence applied) → BEAT_2B
BEAT_2A → (consequence applied) → BEAT_3A or BEAT_3B (based on heat/trust)
BEAT_2B → (consequence applied) → BEAT_3A or BEAT_3B (based on heat/trust)
BEAT_3A → (consequence applied) → ENDING
BEAT_3B → (consequence applied) → ENDING
ENDING → (restart) → SETUP
```

## APPENDIX B: QUICK REFERENCE — TAG PRIORITY

When multiple tags match, priority order is:
1. loyal
2. selfish
3. clever
4. street

If a white card has multiple tags, use the first matching tag in this order.

## APPENDIX C: QUICK REFERENCE — REPUTATION TIERS

| Trust Sum | Heat Level | Reputation |
|-----------|------------|------------|
| 0-3 | 0-5 | unknown |
| 4-7 | 0-3 | trusted |
| 4-7 | 4-7 | feared |
| 8+ | 0-3 | trusted |
| 8+ | 4-7 | feared |
| Any | 8-9 | pariah |
| Any | 10 | pariah |

## APPENDIX D: QUICK REFERENCE — ENDING CONDITIONS

| Ending | Conditions |
|--------|------------|
| The Hustle | deliveredPackage=true, trust[Uncle Ray]≥3, heat≤5 |
| The Trap | heat≥8 AND (soldOut=true OR ratEscaped=true) |
| The Exit | escapedRaid=true AND packageLost=true AND trust[Uncle Ray]<0 |
| The Kingpin | reputation="feared" AND tookOver=true |
| The Ghost | reputation="pariah" AND vanished=true |
| The Survivor | Default if no other conditions met |

---

END OF SPECIFICATION
Execute in order. Verify each phase. Deliver playable prototype.
