# Mini-Game Wireframes
## New: Freestyle Cipher, Diss Track Showdown, Package Run, Graffiti Tagging, DJ Battle, Police Interrogation

---

## Freestyle Cipher
**ID:** freestyle_cipher  
**Trigger:** block party, cookout, studio session, npc_jada/npc_ray  
**Stats:** wit=punchlines, soul=emotion, str=aggression  
**Duration:** 45s  
**Difficulty:** medium  
**Rounds:** 3

### Layout
- Stage panel: center, x=240, y=100, w=800, h=520
- Crowd meter: top-right, x=940, y=120, w=280, h=20
- Opponent avatar: top-center
- Player verse area: center text box
- Topic wheel: bottom-center
- Score track: left rail

### States
- lobby: title, opponent intro, [PRESS ENTER TO START]
- play: topic shown, choose punchline category, timer counts
- resolve: judge votes, crowd reaction
- reward: rep/trust/romance outcome, [PRESS ENTER TO EXIT]

### Controls
- left/right: select category
- confirm: deliver verse
- up/down: change tone

### HUD
- top: MINI GAME, OPPONENT, CROWD HEAT, TIME
- bottom: ROUND=x/3, STATUS, DIFFICULTY

### Result Mapping
- win: rep++, trust++, possible romance++
- tie: respect maintained
- lose: rep--, possible diss track, gang respect--
- forfeit: long-term reputation hit

---

## Diss Track Showdown
**ID:** diss_track_showdown  
**Trigger:** studio, block party, npc_marquez/npc_jada, rival artist  
**Stats:** wit=bar complexity, soul=burn depth, str=aggression  
**Duration:** 40s  
**Difficulty:** medium  
**Rounds:** 2

### Layout
- Target portrait: left side
- Mic/studio icon: center
- Punchline palette: 3-4 card options stacked
- Heat meter: top-right
- Recording timer: top-center

### States
- lobby: title, target intro, [PRESS ENTER TO START]
- play: select punchline, confirm to record
- resolve: track rating, target reaction
- reward: outcome text, [PRESS ENTER TO EXIT]

### Controls
- left/right: choose punchline
- confirm: record
- up/down: adjust tone

### HUD
- top: MINI GAME, TARGET, HEAT, TIME
- bottom: ROUND=x/2, STATUS, DIFFICULTY

### Result Mapping
- critical_success: heat++, rep++, trust shift with target
- success: rep++, possible romance reaction
- failure: heat++, rep--, possible violence risk
- special: bad diss becomes block meme

---

## Package Run
**ID:** package_run  
**Trigger:** npc_marquez, gang territory, shipment pipeline  
**Stats:** str=confrontation, wit=route choice, soul=empathy check  
**Duration:** 35s  
**Difficulty:** hard  
**Phases:** 3 route choices

### Layout
- Block map strip: top-center, simplified 3-lane route
- Territory markers: Bloods/Crips/neutral icons
- Encounter cards: center panel
- Choice buttons: bottom row
- Heat/risk meter: bottom-left

### States
- lobby: title, package brief, [PRESS ENTER TO START]
- play: route phase 1-3, choose path
- resolve: final delivery status
- reward: outcome, [PRESS ENTER TO EXIT]

### Controls
- left/right: choose route
- confirm: commit route

### HUD
- top: MINI GAME, PACKAGE, TERRITORY, TIME
- bottom: PHASE=x/3, STATUS, DIFFICULTY

### Result Mapping
- success: cash++, gang trust++, heat neutral
- partial: cash+, heat++
- failure: arrest path, gang trust--, heat spike
- special: wrong colors trigger confrontation

---

## Graffiti Tagging
**ID:** graffiti_tagging  
**Trigger:** block wall, alley, territory dispute, art opportunity  
**Stats:** soul=style, wit=planning, str=execution speed  
**Duration:** 30s  
**Difficulty:** medium  
**Phases:** sketch, fill, outline

### Layout
- Wall canvas: centered brick panel
- Spray can cursor: moves with arrows
- Paint meter: bottom-left
- Heat/watch meter: bottom-right
- Style prompt: top-center

### States
- lobby: title, wall location, [PRESS ENTER TO START]
- play: tag phases, fill area before watch meter fills
- resolve: tag rating, police arrival?
- reward: outcome, [PRESS ENTER TO EXIT]

### Controls
- arrows: move spray can
- confirm: spray paint
- up/down: change color

### HUD
- top: MINI GAME, WALL, STYLE, TIME
- bottom: PHASE, PAINT, WATCH, STATUS

### Result Mapping
- success: rep++, territory claim, possible gang respect++
- partial: rep+, heat+
- failure: police encounter, rep--, heat++

---

## DJ Battle
**ID:** dj_battle  
**Trigger:** club, house party, block party, studio  
**Stats:** wit=track selection, soul=crowd read, str=energy  
**Duration:** 40s  
**Difficulty:** medium  
**Rounds:** 3

### Layout
- Turntable/deck: center panel
- Crowd meter: top-right
- Track queue: left rail
- Cue point selector: bottom-center
- Transition zone: right panel

### States
- lobby: title, opponent DJ intro, [PRESS ENTER TO START]
- play: select track, hit cue points, maintain energy
- resolve: crowd vote
- reward: outcome, [PRESS ENTER TO EXIT]

### Controls
- left/right: select track/cue
- confirm: drop/cue
- up/down: adjust energy

### HUD
- top: MINI GAME, OPPONENT, CROWD, TIME
- bottom: ROUND=x/3, STATUS, DIFFICULTY

### Result Mapping
- win: rep++, artist loyalty++, possible romance++
- tie: respect maintained
- lose: rep--, possible diss track fallout
- special: bad set becomes block meme

---

## Police Interrogation
**ID:** police_interrogation  
**Trigger:** precinct, arrest path, npc_marquez, raid aftermath  
**Stats:** wit=logic, soul=empathy, str=pressure  
**Duration:** 35s  
**Difficulty:** hard  
**Rounds:** 3-4

### Layout
- Interrogation room: center panel
- Marquez avatar: left side
- Evidence board: right side
- Statement options: bottom row
- Stress meter: top-right

### States
- lobby: title, accusation, [PRESS ENTER TO START]
- play: choose statement type, manage stress
- resolve: Marquez belief meter
- reward: outcome, [PRESS ENTER TO EXIT]

### Controls
- left/right: choose statement
- confirm: deliver statement
- up/down: change tone

### HUD
- top: MINI GAME, DETECTIVE, STRESS, TIME
- bottom: ROUND, BELIEF, STATUS, DIFFICULTY

### Result Mapping
- success: charges reduced, trust shift with Marquez, heat--
- partial: charges reduced but heat++
- failure: arrest path, heat spike, trust collapse
- special: reveal secret flips case entirely
