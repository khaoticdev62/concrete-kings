CONCRETE KINGS — NPC RELATIONSHIP TABLES BY ORIGIN
================================================

PURPOSE:
These tables define how each origin path shifts NPC trusts, relationship
states, available shortcuts, and late-game options. Use them to build dialogue
filters, quest gating, and ending modifiers.

FORMAT KEY:
  trust base: starting trust value when player chooses this origin
  trust cap: maximum trust reachable with this NPC under this origin
  relationship state: allied | neutral | rival | hostile
  shortcut: gameplay or narrative advantage
  secret tie: how this NPC's secret interacts with player's origin secret
  Act 3 role: how this NPC appears in the final act based on trust level


================================================
BARBER ORIGIN
================================================

RAY
  trust base: 4
  trust cap: 5
  relationship state: allied
  shortcut: free haircuts = +1 charisma modifier in bar scenes
  secret tie: shop debt secret; Ray may reveal hidden ledger if trust = 5
  Act 3 role:
    trust 5: Ray provides barbershop as legal evidence vault; appears in Justice ending
    trust 3-4: Ray provides intel but stays neutral
    trust <=2: Ray turns shop into police drop point; betrays or abandons player

JADA
  trust base: 2
  trust cap: 4
  relationship state: neutral -> allied if shop debt repaid
  shortcut: bar scenes reveal extra clues about till skim if Ray is loyal
  secret tie: none direct, but Jada notices Ray's hidden ledger if player shows it
  Act 3 role:
    trust 4: Jada runs community bar association in Justice ending
    trust 2-3: Jada provides safe house access only
    trust <=1: Jada refuses help; player loses street intel

MARQUEZ
  trust base: 1
  trust cap: 3
  relationship state: rival
  shortcut: precinct access easier if player frames evidence using barbershop records
  secret tie: Marquez knows shop debt is fake; blackmail possible if trust = 3
  Act 3 role:
    trust 3: Marquez becomes reluctant ally in legal route
    trust 1-2: Marquez is obstacle; may be betrayer if Ray trust is low
    trust 0: Marquez arrests player on sight in precinct route

MR. CHEN
  trust base: 2
  trust cap: 3
  relationship state: neutral
  shortcut: bodega prices slightly lower because Ray vouches for player
  secret tie: Chen knows barbershop is a front; uses it as leverage
  Act 3 role:
    trust 3: Chen provides shipment evidence for Justice ending
    trust 2: Chen stays silent; no help, no harm
    trust <=1: Chen cuts player out of bodega network; cash penalties

THE KID
  trust base: 3
  trust cap: 5
  relationship state: allied
  shortcut: Kid watches shop when player is away; warns of raids
  secret tie: Kid saw Ray with Marquez; reveals if player asks right question
  Act 3 role:
    trust 5: Kid provides final intel during climax; survives all endings except Death
    trust 3-4: Kid provides single intel item
    trust <=2: Kid avoids player; missing-kid subplot unresolved

JENKINS
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: safe house access granted faster because Jenkins knew player's family
  secret tie: Jenkins knows shop debt history; trades info for old ledger page
  Act 3 role:
    trust 4: Jenkins provides evidence locker access in legal route
    trust 2-3: Jenkins provides safe house only
    trust <=1: Jenkins locks safe house; player loses retreat option


================================================
HUSTLER ORIGIN
================================================

RAY
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: bar scenes allow bluffing using street slang; +2 WIT in social checks
  secret tie: Ray knows Marquez marked player; can remove mark if trust >= 3
  Act 3 role:
    trust 4: Ray runs legal front for evidence handoff
    trust 2-3: Ray provides barbershop as meet point only
    trust <=1: Ray refuses player; shop becomes hostile territory

JADA
  trust base: 3
  trust cap: 5
  relationship state: allied
  shortcut: Jada teaches negotiation mini game trick; +1 rep in street deals
  secret tie: Jada knows Marquez's deal with player; loyalty tested if Marquez path chosen
  Act 3 role:
    trust 5: Jada handles money and bar network in Power ending
    trust 3-4: Jada provides inside info on target in any route
    trust <=2: Jada warns player off; loses street network access

MARQUEZ
  trust base: 4
  trust cap: 5
  relationship state: allied
  shortcut: precinct access granted; heat is treated as influence, not threat
  secret tie: Marquez's favor is the origin secret; becomes blackmail or death mark
  Act 3 role:
    trust 5: Marquez is enforcer in Power ending or reluctant ally in Justice ending
    trust 3-4: Marquez provides cruiser escape or precinct shortcut
    trust <=2: Marquez becomes betrayer; player is set up for arrest

MR. CHEN
  trust base: 3
  trust cap: 4
  relationship state: allied
  shortcut: Chen pays premium for street packages; cash flow improved
  secret tie: Chen knows Marquez's corruption; trades info for package delivery
  Act 3 role:
    trust 4: Chen funds player's route in exchange for pipeline protection
    trust 3: Chen provides cash or item support
    trust <=2: Chen cuts ties; player loses smuggling income

THE KID
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: Kid acts as lookout during street mini games
  secret tie: Kid knows Marquez from the streets; can confirm if Marquez is dirty
  Act 3 role:
    trust 4: Kid provides safe house warning and street scout
    trust 2-3: Kid provides single warning
    trust <=1: Kid refuses to help; missing-kid subplot harder

JENKINS
  trust base: 2
  trust cap: 3
  relationship state: neutral
  shortcut: Jenkins offers safe house, but distrusts Marquez ties
  secret tie: Jenkins knows Marquez's history; warns player about favor debt
  Act 3 role:
    trust 3: Jenkins provides old evidence and safe house
    trust 2: Jenkins provides safe house only
    trust <=1: Jenkins refuses entry; player loses fallback plan


================================================
MECHANIC ORIGIN
================================================

RAY
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: can fix shop equipment; Ray owes player a real favor
  secret tie: Ray knows stolen car is in alley; can hide or dispose of it
  Act 3 role:
    trust 4: Ray provides barbershop as evidence staging area
    trust 2-3: Ray provides tool access and lockpicking upgrades
    trust <=1: Ray calls police on stolen car; heat spike

JADA
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: Jada's bar has tools player can borrow for mini games
  secret tie: Jada knows car was seized; helps player fake ownership papers
  Act 3 role:
    trust 4: Jada provides bar as hideout and negotiation ground
    trust 2-3: Jada provides intel on who took receipts
    trust <=1: Jada bans player from bar; loses meeting location

MARQUEZ
  trust base: 1
  trust cap: 3
  relationship state: rival
  shortcut: can hotwire cruiser or disable alarms; bypasses precinct security
  secret tie: Marquez knows car seizure was illegal; leverage for blackmail
  Act 3 role:
    trust 3: Marquez allows evidence drop at precinct without arrest
    trust 1-2: Marquez sets up player in warehouse trap
    trust 0: Marquez confiscates tools; locks vehicle route

MR. CHEN
  trust base: 3
  trust cap: 4
  relationship state: allied
  shortcut: Chen offers paid mechanical work; reliable cash income
  secret tie: Chen knows shipment vehicles; player can disable them
  Act 3 role:
    trust 4: Chen provides warehouse keys and vehicle access
    trust 3: Chen pays for custom rigging or traps
    trust <=2: Chen hires another mechanic; player loses cash source

THE KID
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: Kid helps scavenge parts; faster crafting mini games
  secret tie: Kid saw who seized the car; provides description or plate
  Act 3 role:
    trust 4: Kid provides lookout and part scavenger during climax
    trust 2-3: Kid provides single key part or info
    trust <=1: Kid refuses to enter garage; quest delay

JENKINS
  trust base: 3
  trust cap: 5
  relationship state: allied
  shortcut: Jenkins offers cash job immediately; safe house access day 1
  secret tie: Jenkins arranged car seizure as test; reveals if trust = 5
  Act 3 role:
    trust 5: Jenkins becomes advisor; reveals true pipeline origin
    trust 3-4: Jenkins provides safe house, tools, and old contacts
    trust <=2: Jenkins withdraws offer; player starts with less cash


================================================
STUDENT ORIGIN
================================================

RAY
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: Ray uses player's knowledge of records/ledgers; shop debt can be audited
  secret tie: Expulsion record contains Ray's testimony; player can expose or protect it
  Act 3 role:
    trust 4: Ray provides old shop records as evidence for legal route
    trust 2-3: Ray provides haircut disguise for stealth
    trust <=1: Ray refuses to help; shop becomes hostile

JADA
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: Jada uses player's research skills; +2 WIT in negotiation mini games
  secret tie: Jada knows Dean who expelled player; can confirm self-defense
  Act 3 role:
    trust 4: Jada provides press contact and legal documents
    trust 2-3: Jada provides research access and library leads
    trust <=1: Jada sides with establishment; player loses ally

MARQUEZ
  trust base: 1
  trust cap: 3
  relationship state: rival
  shortcut: Can use legal loopholes to trap Marquez in contradiction
  secret tie: Marquez signed expulsion affidavit; evidence for expose
  Act 3 role:
    trust 3: Marquez agrees to testify if immunity offered
    trust 1-2: Marquez plants drugs on player; legal route fails
    trust 0: Marquez arrests player before climax

MR. CHEN
  trust base: 2
  trust cap: 3
  relationship state: neutral
  shortcut: Chen respects education; offers research-for-cash deals
  secret tie: Chen owns property tied to player's school records; reveals corruption
  Act 3 role:
    trust 3: Chen provides property deed as evidence
    trust 2: Chen provides cash or access to archive
    trust <=1: Chen evicts player from bodega; loses safe info source

THE KID
  trust base: 2
  trust cap: 4
  relationship state: neutral
  shortcut: Kid helps player sneak into school after hours
  secret tie: Kid saw Dean and Marquez meeting; witness for expose
  Act 3 role:
    trust 4: Kid provides school evidence and safe house lookout
    trust 2-3: Kid provides single witness statement
    trust <=1: Kid refuses to help; missing-kid subplot unresolved

JENKINS
  trust base: 3
  trust cap: 5
  relationship state: allied
  shortcut: Jenkins offers safe study space; archive access through veteran contacts
  secret tie: Jenkins knows Dean's past; provides blackmail or exoneration record
  Act 3 role:
    trust 5: Jenkins provides sealed military/court records for legal ending
    trust 3-4: Jenkins provides archive access and safe house
    trust <=2: Jenkins withdraws help; player loses research advantage


================================================
RELATIONSHIP CHANGE RULES
================================================

BASE RELATIONSHIP STATE:
  ray <-> jada: allied if both trusts >= 3, else neutral
  ray <-> marquez: neutral if player does not force choice; rival if player sides with one
  jada <-> marquez: rival by default; allied only if player mediates
  ray <-> chen: neutral; shifts to rival if Chen's shipment exposed
  jada <-> chen: neutral; shifts to allied if Jada accepts money
  marquez <-> chen: allied if corrupt path chosen; hostile if exposed
  jenkins <-> ray: allied by default; shifts to rival if player sides with Marquez
  jenkins <-> marquez: allied by history; shifts to hostile if Marquez betrays player

JOINT SCENE RULES:
  If two NPCs are allied and both present:
    - +1 effective trust for player with both
    - Joint dialogue references shared history
  If two NPCs are rival and both present:
    - Player must choose whom to support
    - Unsupported NPC loses 1 trust permanently
    - Supported NPC gains 1 trust

BETRAYER SELECTION:
  Default betrayer pool: Marquez, Jada, Jenkins
  Marquez becomes betrayer if:
    - Hustler origin and Marquez trust drops to <=1 after Day 5
    - Ray trust > 3 and Marquez trust < Ray trust by Day 8
  Jada becomes betrayer if:
    - Barber or Student origin and Jada trust drops to <=1 after Day 5
    - Player exposes Chen but does not tell Jada
  Jenkins becomes betrayer if:
    - Player refuses secret trade at Day 5 crossover
    - Player keeps origin secret from Jenkins while accepting his help

BETRAYER ALWAYS:
  - Betrayer is chosen at Day 8 based on trust delta, not raw values
  - Player can avoid betrayal by raising lowest-trust NPC above threshold before Day 8
  - If all NPC trusts >= 3, betrayer becomes The Stranger instead


================================================
ENDING MODIFIERS BY ORIGIN
================================================

JUSTICE ENDING MODIFIERS:
  Barber: Ray's ledger is primary evidence; shop becomes legal archive
  Hustler: Marquez testimony required; player must keep Marquez trust >= 3
  Mechanic: Warehouse rigging becomes evidence of tampering
  Student: Court documents and expulsion record exonerate player

POWER ENDING MODIFIERS:
  Barber: Player uses shop as headquarters; Ray runs front
  Hustler: Player inherits Marquez's crew structure; rep boost from street
  Mechanic: Player controls vehicle and security infrastructure
  Student: Player uses press and legal loopholes to legitimize control

GHOST ENDING MODIFIERS:
  Barber: Leaves shop key behind; Ray finds it and mourns
  Hustler: Marquez hunts player for breaking favor code
  Mechanic: Car is found abandoned; Jenkins knows player is alive
  Student: Dean uses expulsion record to discredit investigation

RECEIPT KING SECRET ENDING MODIFIERS:
  Barber: Ledger receipt is final key; shop history unlocks curse origin
  Hustler: Marquez receipt is final key; favor history unlocks curse origin
  Mechanic: Car seizure receipt is final key; Jenkins history unlocks curse origin
  Student: Expulsion receipt is final key; Dean history unlocks curse origin

DEATH ENDING MODIFIERS:
  Barber: Ray finds body; closes shop permanently
  Hustler: Marquez claims player ran; no closure
  Mechanic: Car found with body; Jenkins identified as accomplice
  Student: Body found in school archive; Dean covers it up


================================================
IMPLEMENTATION NOTES
================================================

  - Store per-origin trust caps and base trusts in originProfile objects
  - Relationship state is derived from pairwise trust values each scene
  - Betrayer selection runs once at Day 8 start; persists until Act 3
  - Betrayer can be avoided by trust-boosting side quests before Day 8
  - Joint scenes evaluate relationship states at scene start, not choice time
  - Origin modifiers should be data-driven in origin.json for easy tuning
