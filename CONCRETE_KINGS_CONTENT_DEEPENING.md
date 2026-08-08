CONCRETE KINGS — CAMPAIGN CONTENT DEEPENING SYSTEM
Reactive World, Systemic Story, Layered Lore
================================================

PURPOSE:
This document adds depth to the existing campaign without breaking the current
card/mini-game loop. It layers additional content systems on top of the
13-beat main quest structure in CONCRETE_KINGS_CAMPAIGN.md.

RESEARCH BASIS:
- Systemic storytelling: static beats + reactive storylets + dynamic casting
- Environmental storytelling: lore delivered through props, graffiti, audio logs
- Procedural quests with meaningful dependencies, not fetch/kill loops
- Delayed consequences: choices from Day 1 alter Day 10+ without explicit reminders
- NPC relationship webs: each NPC remembers player actions and references them


================================================
1. REACTIVE NPC RELATIONSHIP WEB
================================================

CORE IDEA:
Every NPC has a relationship map toward every other NPC. Player actions shift
these relationships indirectly. NPC dialogue changes based on:
- Direct player trust with that NPC
- That NPC's current relationship with other NPCs
- World state flags set by earlier choices

RELATIONSHIP AXES:
  ray <-> jada:    business partners, former lovers, hidden tension
  ray <-> marquez: mutual suspicion, occasional cooperation
  ray <-> chen:    customer relationship, payment disputes
  jada <-> marquez: past romance, current distrust
  jada <-> chen:   supply chain dependency
  marquez <-> chen: corruption nexus, shared secrets
  jenkins <-> ray: old friends, shared history
  jenkins <-> marquez: military history, unspoken debt
  kid <-> ray:     surrogate father figure
  kid <-> jada:    protective older sister energy

RELATIONSHIP STATES:
  allied:   +2 trust modifier when both are present
  neutral:  no modifier
  rival:    NPC will badmouth the other, lock joint scenes
  hostile:  one will betray the other depending on player loyalty

REACTIVE BARK EXAMPLES:
  If player helped Ray but rejected Marquez:
    - Jada says: "Ray said you came through. Marquez says you went soft."
    - Marquez says: "Ray's using you. You think that shop is clean?"
    - Ray says: "Marquez talked to you? Don't trust anything he says."

  If player exposed Chen's shipment but kept Ray loyal:
    - Chen says: "I heard you talked to Ray. You're both fools."
    - Ray says: "Chen called. Says he knows it was us. Be careful."

IMPLEMENTATION:
  Each NPC has:
    trusts: { player: 0-5, otherNPCs: { name: -2 to +2 } }
    relationshipState: { target: allied|neutral|rival|hostile }
    barkRules: [ { condition: ..., lines: [...] } ]

  Barcks evaluate at scene start and rotate based on:
    - Current act
    - Most recent 3 player choices involving this NPC
    - Current heat/reputation thresholds


================================================
2. STORYLET / REACTIVE ENCOUNTER SYSTEM
================================================

CORE IDEA:
Instead of only scripted beats, the world injects reactive storylets based on
game state. These are small 1-2 card scenes that appear between main beats
or when entering specific locations with specific flags.

STORYLET STRUCTURE:
  id: unique storylet id
  title: short scene title
  trigger:
    location: bar|bodega|barbershop|alley|safehouse|street
    heatRange: [min, max]
    flags: [required flags]
    notFlags: [forbidden flags]
    time: day|night|any
    act: 1|2|3
    probability: 0.0-1.0
  card:
    blackCard: scene text
    whiteOptions: [ { text, consequence } ]
  cooldown: number of days before this storylet can repeat

EXAMPLE STORYLETS:

STORYLET: "The Barback Confession"
  trigger:
    location: bar
    heatRange: [2, 7]
    flags: [jada_trust_3]
    probability: 0.6
  card:
    blackCard: "The barback pulls you aside. 'Jada's been leaving early. Someone's
                 calling her.'"
    whiteOptions:
      - text: "Tell Jada"
        consequence: trust + jada, flag: jada_loyal
      - text: "Find the caller"
        consequence: flag: jada_caller_investigated, secret flag
      - text: "Ignore it"
        consequence: nothing
  cooldown: 3

STORYLET: "The Street Preacher"
  trigger:
    location: street
    heatRange: [0, 4]
    act: 1
    probability: 0.3
  card:
    blackCard: "A preacher on the corner points at you. 'The block remembers what
                 you did.'"
    whiteOptions:
      - text: "Give $5"
        consequence: cash -5, rep + elders
      - text: "Walk past"
        consequence: nothing
      - text: "Argue"
        consequence: heat +1
  cooldown: 5

STORYLET: "The Lost Receipt"
  trigger:
    location: alley
    heatRange: [0, 10]
    flags: [has_receipt_5]
    probability: 0.4
  card:
    blackCard: "Wind lifts a receipt from your pocket. It's dated three days before
                 you arrived."
    whiteOptions:
      - text: "Keep it"
        consequence: flag: receipt_mystery_deepened
      - text: "Burn it"
        consequence: flag: receipt_burned, heat -1
  cooldown: 999  # once per playthrough

IMPLEMENTATION RULES:
  - Evaluate 3-5 storylets per day transition
  - Roll probability against game seed for deterministic replay
  - Storylet choice consequences must be visible within 2-3 beats
  - No storylet can override main quest climax
  - Storylets may unlock new side quests or modify existing ones


================================================
3. ENVIRONMENTAL STORYTELLING LAYER
================================================

CORE IDEA:
The block tells stories through objects, graffiti, audio cues, and NPC ambient
behavior. This rewards curious players with lore fragments without requiring
explicit quest markers.

ENVIRONMENTAL CHANNELS:

A) GRAFFITI / STREET ART
  - Changes based on main plot progress
  - Act 1: generic block tags, no political content
  - Act 2: political slogans appear, NPC names spray-painted
  - Act 3: memorial graffiti, victory tags, threat tags
  - Player can interact: photograph, remove, add to
  - Graffiti state tracked in world.flags.graffiti[]

B) ABANDONED OBJECTS
  - Receipts, photographs, IDs, weapons found in specific locations
  - Some are collectibles, some are quest triggers, some are red herrings
  - Each object has 1-3 lore fragments when inspected
  - Example: "torn photograph" found in alley behind barbershop
    - Inspect: shows Ray with a man in a precinct uniform
    - Lore: "Ray and Marquez used to work together"
    - Quest impact: unlocks dialogue option with both NPCs

C) AMBIENT NPC SCHEDULES
  - NPCs move between locations based on time and trust
  - Ray: barbershop (morning), bar (afternoon), safehouse (night if trust low)
  - Jada: bar (evening), bodega (morning), park (afternoon if trust high)
  - Marquez: cruiser (patrol), alley (night), barbershop (morning if trust high)
  - Mr. Chen: bodega (all day), warehouse (night if quest active)
  - Jenkins: safehouse (always), park (afternoon if trust >= 2)
  - Kid: street (morning), bar (afternoon), alley (night if quest active)

  Impact:
    - Player must learn schedules to find specific NPCs
    - Missing an NPC can cause quest failure or delay
    - Showing up at unexpected location can create unique storylets

D) AUDIO CUES
  - Sirens change meaning based on heat
  - Music from bars changes based on Jada's mood
  - Street conversations change based on reputation
  - Silence in normally busy areas = danger or opportunity

E) PROP STORIES
  - Barbershop chair: worn leather, name carved, blood stain under seat
  - Bodega counter: bullet hole patched, price list with secret codes
  - Bar jukebox: only plays songs Jada's ex-husband liked
  - Safehouse radio: only receives one station, code broadcasts at midnight


================================================
4. DELAYED CONSEQUENCE CHAIN SYSTEM
================================================

CORE IDEA:
Choices made in Act 1 should have visible effects in Act 2 and 3 without
explicit reminder prompts. The world should feel like it remembers.

CONSEQUENCE TYPES:
  immediate: same scene feedback
  short: next 1-2 days
  medium: act transition
  long: ending/epilogue only

EXAMPLES:

CHOICE: "Take Marquez's cash and look away" (Day 1)
  immediate: cash +50, heat +1, trust + marquez
  short (Day 2): Jada mentions "someone saw you take cash"
  medium (Act 2): Marquez asks you to look away again, but this time it's worse
  long (Act 3): If you refused later, Marquez says "You were always soft"

CHOICE: "Help The Kid find his cat" (Day 1)
  immediate: trust + kid
  short (Day 3): Kid warns you about the raid
  medium (Act 2): Kid provides intel about the pipeline
  long (Act 3): If Kid was rescued, he helps during climax; if not, you carry guilt

CHOICE: "Refuse Marquez openly" (Day 1)
  immediate: heat +1, trust - marquez
  short (Day 2): Marquez's crew follows you
  medium (Act 2): Marquez is the betrayer
  long (Act 3): Marquez tries to kill you during final confrontation

IMPLEMENTATION:
  Every choice writes to:
    campaignState.consequenceChains: [
      { id, trigger, effect, act, day }
    ]

  At each day/act transition, evaluate all pending chains:
    - If trigger conditions met, apply effect and mark resolved
    - If conditions never met, effect may auto-resolve at climax
    - Effects can be: trust +/- , heat +/- , flag, secret, item, dialogue unlock


================================================
5. PROCEDURAL SIDE QUEST TEMPLATE SYSTEM
================================================

CORE IDEA:
Instead of 12 hand-written side quests, create a template system that can
generate infinite variations while maintaining quality and lore coherence.

TEMPLATE STRUCTURE:
  id: SQ_TEMPLATE_001
  name: "The Missing ___"
  archetype: fetch|escort|investigate|intercept|protect|steal|negotiate
  locations: [valid locations for this archetype]
  NPCs: [valid NPCs to give this quest]
  rewards:
    trust: [valid NPC trust gains]
    heat: [0, 1, 2]
    cash: [min, max]
    flags: [possible flags]
  prerequisites:
    minDay: 1
    maxDay: 7
    requiredFlags: []
    excludedFlags: []
  steps:
    - type: talk
      target: NPC
      text: dynamic based on NPC relationship
    - type: mini_game|card|investigate
      target: location
      difficulty: based on heat
    - type: resolve
      branches: success|partial|failure

EXAMPLE TEMPLATE INSTANCES:

INSTANCE 1:
  template: SQ_TEMPLATE_001
  instanceName: "The Missing Bag"
  npc: Mr. Chen
  location: bodega -> alley
  miniGame: Gossip Network
  reward: trust + chen, cash 20-40, flag: chen_debt_1
  text: "A shipment never arrived. Someone saw it in the alley."

INSTANCE 2:
  template: SQ_TEMPLATE_001
  instanceName: "The Missing Brother"
  npc: The Kid
  location: street -> bar
  miniGame: Street Dice (persuade)
  reward: trust + kid, rep + neighborhood, flag: kid_family
  text: "My brother said he'd meet me here. He never showed."

INSTANCE 3:
  template: SQ_TEMPLATE_001
  instanceName: "The Missing Ledger"
  npc: Ray
  location: barbershop -> safehouse
  miniGame: Lockpicking
  reward: trust + ray, secret flag: shop_debt_hidden, flag: ray_secret
  text: "Someone took the ledger. If the wrong people see it, we're done."

IMPLEMENTATION:
  - 5-8 templates cover all side-quest archetypes needed
  - At day start, generate 2-3 instances from available templates
  - Instance selection respects: NPC availability, location access, player level
  - Each instance has unique text, but mechanical skeleton is template-driven
  - Completion of one instance can unlock another template chain


================================================
6. RECEIPT / LORE FRAGMENT SYSTEM
================================================

CORE IDEA:
Receipts are not just quest items. They are layered lore fragments that reward
exploration and curiosity. Each receipt has:
- Surface meaning: quest clue or objective
- Hidden meaning: lore about the block's history
- Meta meaning: connection to the campaign's central mystery

RECEIPT CATALOG:

R1: TORN BARBERSHOP RECEIPT (Day 1)
  Found: barbershop counter
  Surface: old haircut receipt, date before player arrived
  Hidden: Ray was paying someone weekly
  Meta: the barbershop debt is fake; it's a laundering front
  Lore fragment: "125th Street hasn't had a real barbershop since 2009."

R2: POLICE REPORT (Day 2)
  Found: alley behind precinct
  Surface: report of "suspicious activity" with player's origin name
  Hidden: Marquez flagged player before they arrived
  Meta: player was watched from the moment they stepped off the bus
  Lore fragment: "The block has a welcome wagon. It's called a warrant."

R3: BODEGA PRICE LIST (Day 3)
  Found: bodega counter, Mr. Chen's handwriting
  Surface: prices with secret codes in margins
  Hidden: Chen's prices encode shipment schedules
  Meta: the bodega is the block's central nervous system
  Lore fragment: "Every bodega in Harlem has two prices: one for you, one for them."

R4: PHOTOGRAPH (Day 4)
  Found: Jenkins' safehouse, hidden drawer
  Surface: photo of 4 men in front of barbershop, 1998
  Hidden: Jenkins, Ray, Marquez, and Chen were young together
  Meta: the current conflict is 25 years in the making
  Lore fragment: "Friendship doesn't break. It just gets weaponized."

R5: KID'S DRAWING (Day 5)
  Found: Kid's backpack, after completing SQ1
  Surface: crayon drawing of 4 figures with guns
  Hidden: Kid saw something he shouldn't have
  Meta: the Kid is a witness, not a victim
  Lore fragment: "Children see the block clearer than adults."

R6: NEGOTIATION NOTE (Day 6)
  Found: bar table after SQ12
  Surface: napkin with numbers and names
  Hidden: debt ledger for half the block
  Meta: Jada runs the books for everyone
  Lore fragment: "No one leaves the block clean. Everyone owes."

R7: WAREHOUSE TAG (Day 7)
  Found: warehouse district during SQ3
  Surface: spray-painted symbol, red
  Hidden: symbol marks pipeline drop points
  Meta: the pipeline has 7 locations, this is only one
  Lore fragment: "The block breathes through the pipeline."

R8: COURT DOCUMENT (Day 8)
  Found: precinct evidence room during SQ9
  Surface: dismissed case, player's origin secret referenced
  Hidden: the original charges were fabricated
  Meta: someone wanted player's origin persona removed from the block
  Lore fragment: "Expulsion, arrest, seizure—same playbook, different decade."

R9: THE STRANGER'S NOTE (Day 9)
  Found: after The Stranger encounter
  Surface: cryptic warning: "They know your secret"
  Hidden: The Stranger is from player's past
  Meta: origin secret is not just personal; it's political
  Lore fragment: "The past doesn't die. It waits for you to come back."

R10: SAFE HOUSE LOG (Day 10)
  Found: after safe house raid
  Surface: list of safe house visitors with timestamps
  Hidden: betrayer is in the log
  Meta: trust is measurable; betrayal is predictable
  Lore fragment: "The safe house knows everyone's secrets. Including yours."

R11: MR. CHEN'S LEDGER (Day 11)
  Found: Chen's back room after choosing investigation route
  Surface: cash flow records
  Hidden: Chen has been paying Marquez for protection
  Meta: the corruption goes to the top
  Lore fragment: "Money doesn't talk. It walks. And it walks to Marquez."

R12: RAY'S OLD TAPE (Day 12)
  Found: barbershop back room during climax
  Surface: cassette tape labeled "1998"
  Hidden: recording of the night everything changed
  Meta: the original sin that created the pipeline
  Lore fragment: "Every block has a founding crime. Ours was a shortcut."

R13: THE FINAL RECEIPT (Day 13, ending only)
  Found: only if all 12 receipts collected
  Surface: blank receipt from the original barbershop, 1998
  Hidden: the true origin of the block's curse
  Meta: player's origin secret is the 13th receipt
  Lore fragment: "The block doesn't cost. It collects. And it collects forever."

RECEIPT MECHANICS:
  - Receipts are hidden; no quest marker until discovered
  - Inspecting a receipt reveals lore fragment and possible flag
  - Collecting all 13 unlocks Secret Ending D: The Receipt King
  - Some receipts are mutually exclusive based on path choices
  - Receipts persist across New Game+ as lore fragments only


================================================
7. WORLD STATE CHANGE SYSTEM
================================================

CORE IDEA:
The block physically changes based on player actions. Locations transform,
NPCs move, opportunities open and close permanently.

WORLD STATE TRACKERS:
  blockControl: player|ray|jada|marquez|chen| contested
  barbershopState: open|closed|raided|front
  barState: normal|shut_down|jada_owned
  bodegaState: normal|intercepted|chen_gone
  safehouseState: secure|compromised|burned
  precinctState: corrupt|exposed|reformed
  pipelineState: active|exposed|taken_over|destroyed

STATE CHANGE RULES:
  - State changes are permanent within the playthrough
  - Some states lock out locations; others open new ones
  - NPC schedules change based on location states
  - Storylets and side quests change based on world state

EXAMPLE CHAINS:

If player helps Marquez in Act 1:
  Day 3: precinctState shifts slightly toward corrupt
  Day 5: Marquez appears more often, Ray disappears from some scenes
  Day 8: safehouseState may become compromised if heat is high
  Day 10: Marquez is more likely betrayer
  Day 13: precinctState determines legal route availability

If player exposes Chen's shipments:
  Day 4: bodegaState shifts to intercepted
  Day 6: Chen offers desperate deals, lower prices, higher risk
  Day 9: Chen may disappear or turn informant
  Day 13: Chen's fate affects Power ending stability

If player completes SQ10 (King of the Block):
  Day 5: blockControl shifts to contested
  Day 7: NPCs reference player's influence
  Day 10: Street route in Act 3 is enhanced
  Day 13: Power ending has additional stability

VISUAL/TEXTUAL INDICATORS:
  - Boarded windows if location is closed
  - Graffiti changes to reflect new control
  - NPC ambient lines change: "Heard the shop closed" / "They say Chen's gone"
  - Map icons change color or disappear


================================================
8. DYNAMIC DIALOGUE SYSTEM
================================================

CORE IDEA:
Dialogue is not static text. It is assembled from:
  - Core lines: essential plot information
  - Relationship lines: reference to shared history
  - State lines: reference to current world conditions
  - Reactive lines: reference to recent player choices
  - Filler lines: ambient, optional, repeatable

DIALOGUE ASSEMBLY:
  Each dialogue node selects 1-3 lines from each category based on:
    - NPC trusts[player]
    - NPC trusts[otherNPCs]
    - worldState
    - recentConsequences (last 3 choices involving this NPC)

EXAMPLE: Ray greeting at barbershop

Core (always present):
  "You made it. What do you need?"

Relationship (if trust >= 3):
  "Glad you're here. Shop's been quiet."
  "Kid asked about you yesterday."

State (if shop is raided):
  "Place is a mess. Insurance won't cover it."
  "Don't mention the raid to Chen."

Reactive (if player helped Ray recently):
  "You came through last time. I won't forget."
  "Marquez says you went soft. I say you did what you had to."

Filler (random ambient):
  "Rain's coming. Shop'll be busy."
  "New kid on the block. Might need a haircut."

NPC MEMORY:
  Each NPC stores:
    lastPlayerChoice: { id, timestamp, act, day }
    trustHistory: [ snapshots each time trust changes ]
    promises: [ promises made to player, promises player made to NPC ]
    secrets: [ what this NPC knows about player, what player knows about NPC ]

  At dialogue start, NPC references:
    - Unfulfilled promises: "You said you'd help. Day 3 was three days ago."
    - Recent betrayals: "You chose Jada. I get it."
    - Shared secrets: "Your secret's safe with me. Unlike some people."


================================================
9. REPLAY / NEW GAME+ DEEPENING
================================================

NEW GAME+ RULES:
  - All lore fragments, receipts, secrets carry over
  - Storylets that were once-only become repeatable with variations
  - Origin-specific dialogue expands: NPCs reference previous playthrough
  - Secret endings unlock additional dialogue options in early acts
  - Some side quests have "phantom" versions only visible in NG+

NG+ DIALOGUE EXAMPLES:

  If player completed Secret Ending D in previous game:
    - Ray: "You're back. Last time you left, the block changed."
    - Jada: "Heard what you did. The receipts. You know more than most."
    - Jenkins: "You found it, didn't you? The real secret."

  If player chose Power ending previously:
    - Marquez: "You're wearing the crown now. Don't let it weigh heavy."
    - Kid: "You run things now. Does that mean you're one of them?"

  If player chose Ghost ending previously:
    - Ray: "You look familiar. Did I cut your hair before?"
    - Jada: "You vanished once. Don't do it again."

NG+ META CONTENT:
  - The Stranger recognizes player: "We've done this before."
  - Jenkins hints at time loops: "Some blocks don't move forward. They repeat."
  - Secret ending receipt transforms into meta-lore: "You've been here 13 times."
  - Unlockable meta-ending: player breaks the loop, frees the block from repetition


================================================
10. IMPLEMENTATION PRIORITY & PHASING
================================================

PHASE 1 — CORE DEEPENING (must be in first full build):
  - Reactive NPC relationship web
  - Delayed consequence chain system
  - Environmental storytelling objects (receipts, graffiti)
  - Basic storylet system (10-15 storylets)

PHASE 2 — EXPANSION (post-launch content):
  - Procedural side-quest templates
  - NPC ambient schedules
  - World state change system
  - Expanded storylet pool (50+)

PHASE 3 — NG+ & META (long-term retention):
  - New Game+ lore carryover
  - Meta dialogue and secret endings
  - Procedural generation of receipts and lore fragments
  - Community-contributed storylets

TECHNICAL REQUIREMENTS:
  - All systems must be data-driven: JSON/YAML content files
  - No hard-coded story logic; everything evaluatable from campaignState
  - Deterministic evaluation for replay consistency
  - Each system must be disableable for performance/accessibility
  - All new content must pass existing 1280x720 wireframe tests
  - No new dependencies beyond plain JS modules


================================================
VERIFICATION CHECKLIST
================================================

  [ ] NPC relationship web affects dialogue in at least 3 scenes per NPC
  [ ] Every major choice has at least one delayed consequence
  [ ] Environmental objects have inspectable lore fragments
  [ ] Graffiti changes reflect world state across all 3 acts
  [ ] NPC schedules change based on trust and world state
  [ ] Storylets respect act boundaries and do not break climax
  [ ] Procedural quests maintain lore coherence
  [ ] Receipt system has 13 distinct items with unique lore
  [ ] World state changes are visible to player within 1 beat
  [ ] NG+ carries forward at least 5 lore elements
  [ ] All systems are data-driven, not hard-coded
  [ ] Total content depth exceeds 2 hours of unique playtime


================================================
END OF CONTENT DEEPENING DOCUMENT
================================================
