CONCRETE KINGS — FIRST MILES
1-WEEK VERTICAL SLICE PLAN
================================================

GOAL:
Ship one playable browser vertical slice in 7 days or fewer.

SCOPE CONTRACT — INCLUDE ONLY:
- 1 origin: BARBER
- 1 district: 125TH STREET
- 1 act: ACT 1 only, Days 1-3
- 3 core NPCs: Ray, Jada, Marquez
- 1 main quest line: arrival -> gossip -> raid
- 1 side quest: The Cat
- 1 mini-game: Haircut Challenge
- Card play with heat/trust tracking
- Receipts system
- Character creation screen
- City map navigation
- Pixel engine 1280x720

SCOPE CONTRACT — EXCLUDE FOR NOW:
- Godot port
- Multiplayer online
- All other origins
- All other districts/cities
- All other mini-games
- Storylet system
- NPC relationship web
- Procedural quest templates
- City art pipeline / asset generation
- AAVE voice system
- Advanced weather system
- New Game+

CUT RULES:
If a task is not in the include list above, do not build it this week.
If a task is in the include list but you run out of time, cut complexity, not the task.
All excluded content stays in docs as “Phase 2.”


================================================
DAY 1 — SPINE & WIRING
Theme: Make one choice matter.
================================================

DELIVERABLES:
- Character creation flow works end-to-end
- Barber origin creates valid campaignState
- First card play advances story and changes trust/heat
- npm test passes with no failures

TASKS:
1. Audit existing systems: story-engine.js, campaign-mode.js, block-map-navigation.js, pixel-engine.js
2. Create one wire: origin -> campaignState -> HUD
3. Build minimal character creation screen in index.html
4. Wire origin secret into story state
5. Add 1 Day 1 beat and 1 card choice with consequence

PROMPTS TO USE:

Prompt 1 — Audit:
"In C:\Users\thecr\concrete-kings, read story-engine.js, campaign-mode.js, block-map-navigation.js, and index.html. Identify the minimum interfaces needed to wire origin selection to a single story beat with trust/heat state. Return a numbered integration checklist only."

Prompt 2 — Integration:
"Wire the existing NarrativeStoryEngine and CampaignModeEngine into index.html's app controller. Add character creation for BARBER origin only. When player confirms origin, initialize campaignState, show game screen, and load Beat 1. Keep all existing tests passing."

Prompt 3 — First choice:
"Add one Day 1 card choice in the story engine: a black card about who's been skimming from the till, with 3 white options. Each option changes trust or heat by +1/-1. Show the result in the HUD. Do not add new systems."

VERIFICATION:
- npm test passes
- Playable path: setup -> create -> beat 1 -> choice -> HUD updates


================================================
DAY 2 — MAP & NPC
Theme: Move through the block.
================================================

DELIVERABLES:
- Player can walk 125th Street map
- Hotspots for barbershop, bodega, bar, alley
- Entering hotspot loads NPC scene
- Ray, Jada, Marquez have 1 line each
- Safe house can be entered

TASKS:
1. Activate block-map-navigation.js in app
2. Create minimal scene controller for NPC hotspots
3. Add dialogue box with NPC name + 1-2 lines
4. Leave option returns to map

PROMPTS TO USE:

Prompt 1 — Map wiring:
"Activate the existing BlockMapController in index.html app. Use a 125th Street layout with hotspots for BARBERSHOP, BODEGA, BAR, ALLEY, SAFE_HOUSE. Show the map as the main game view after character creation. Keep pixel engine 1280x720. Keep tests passing."

Prompt 2 — NPC scenes:
"Add a minimal NPC scene system. When player enters a hotspot, show a panel with NPC name, portrait placeholder, and 2-3 dialogue lines. NPCs: Ray at barbershop, Jada at bar, Marquez at alley. Add a LEAVE button that returns to map. Do not add quests yet."

VERIFICATION:
- Walk from barbershop to bodega to bar to alley
- Each hotspot shows correct NPC
- Leave returns cleanly


================================================
DAY 3 — RECEIPT & SIDE QUEST
Theme: One small thread with delayed effect.
================================================

DELIVERABLES:
- Receipt system active
- 1 side quest: The Cat
- Quest log shows active quest
- Completing quest gives trust + flag

TASKS:
1. Review existing receipt code and tests
2. Add quest log panel to UI
3. Implement SQ1: find cat in alley
4. Quest completion sets trust and flag
5. Flag unlocks 1 new dialogue line in Day 2

PROMPTS TO USE:

Prompt 1 — Receipt audit:
"Read the existing receipt system code and tests in this repo. Tell me exactly which public methods and state fields I should use to add a quest item receipt for SQ1: The Cat. Return only the integration points."

Prompt 2 — Quest implementation:
"Add a quest log panel to the game UI. Implement SQ1: The Kid asks you to find his cat. Quest flow: barbershop -> talk to Kid -> alley -> find cat -> return -> reward. Use existing trust and flag systems. Keep tests passing."

VERIFICATION:
- Quest appears in log
- Completion updates trust
- Flag visible in campaignState


================================================
DAY 4 — MINI GAME
Theme: One gameplay skill check.
================================================

DELIVERABLES:
- Haircut Challenge mini-game playable from map
- Win/loss changes trust and cash
- Retry costs cash
- Quit applies penalty

TASKS:
1. Review existing mini-game architecture
2. Launch Haircut Challenge from Ray's barbershop hotspot
3. Wire win/loss to campaignState
4. Add simple retry/quit flow

PROMPTS TO USE:

Prompt 1 — Mini-game audit:
"Read src/pixel_engine/mini-games/ and the mini-game test files. Tell me the minimum registration and activation steps to launch Haircut Challenge from an NPC hotspot, with win/loss callback. Return only the integration steps."

Prompt 2 — Mini-game wiring:
"Add a 'Work Stiff' button in Ray's barbershop scene. When clicked, launch Haircut Challenge with easy difficulty. On win: cash +20, trust + Ray 1. On loss: cash -10, trust - Ray 1. Quit costs cash -5. Return to barbershop after resolve. Keep tests passing."

VERIFICATION:
- Mini-game launches and completes
- Stats update correctly
- Can retry or quit


================================================
DAY 5 — HEAT & NIGHT
Theme: Time pressure.
================================================

DELIVERABLES:
- Day/night cycle advances after key beats
- Heat rises at night if not at safe house
- Heat affects NPC dialogue availability
- Heat 4+ triggers Marquez encounter

TASKS:
1. Add day/night state to campaignState
2. Advance time after Beat 1 and Beat 2
3. Heat curve: 0-2 day, +2 at night unless safe house
4. Add heat threshold encounter in alley

PROMPTS TO USE:

Prompt 1 — Day/night:
"Add day and timeOfDay fields to campaignState. Default 'day'. After completing Beat 1 and Beat 2, switch to 'night'. Show 'DAY 1' and 'NIGHT' in HUD. Do not change story text yet."

Prompt 2 — Heat narrative:
"Add heat field to campaignState, default 0. At night, if player is not at SAFE_HOUSE, heat += 2. If heat >= 4 and player enters ALLEY hotspot, show Marquez encounter card with 2 choices. Keep tests passing."

VERIFICATION:
- Time advances after beats
- Heat increases correctly
- Marquez encounter appears at threshold


================================================
DAY 6 — ACT 1 CLIMAX
Theme: One branching beat with lasting effect.
================================================

DELIVERABLES:
- Police raid event on Day 3
- 3 origin-aware choices
- Major trust shift based on choice
- Heat spike
- Transition to Act 2 state

TASKS:
1. Add Act 1 climax beat
2. Write 3 options for BARBER origin
3. Apply trust/heat deltas
4. Set act1ClimaxOutcome flag
5. Show summary receipt

PROMPTS TO USE:

Prompt 1 — Climax beat:
"Add a Day 3 police raid beat. Triggered automatically after completing Beat 2. Show black card: 'Marquez is in the raid. What do you do?' Options for BARBER origin only: A) Ray takes fall if trust >= 3, B) Escape through shop back room, C) Talk to Marquez. Apply trust/heat deltas and set act1ClimaxOutcome."

Prompt 2 — Summary receipt:
"After Act 1 climax, show a summary card: 'Day 3 receipt: you owe something to someone now.' Record 1 receipt in campaignState.receipts. Advance to Act 2 state. Keep tests passing."

VERIFICATION:
- Beat triggers automatically
- Choices affect stats
- Receipt recorded
- Act 2 state initialized


================================================
DAY 7 — POLISH & VERIFY
Theme: Make it playable, not perfect.
================================================

DELIVERABLES:
- Full playthrough possible in 10-15 minutes
- All 5 Day 1-3 beats playable
- No breaking UI bugs
- Tests pass

TASKS:
1. Full playthrough bug bash
2. Fix dead links or missing transitions
3. Add 1 sound effect or visual feedback per beat
4. Write 1-page playtest notes
5. Tag version as First Miles v0.1

PROMPTS TO USE:

Prompt 1 — Bug bash:
"Playtest the full First Miles slice: character creation -> Day 1 -> Day 2 -> Day 3 climax. Report any breaks: missing transitions, broken buttons, stat mismatches, unreachable scenes. Return only bugs with file paths and line numbers."

Prompt 2 — Polish:
"Add 3 sound effects: button click, card play, mini-game win. Use existing audio-sfx-engine.js. Do not add new assets; use synthesized tones only. Keep tests passing."

PROMPT 3 — Save state:
"Add a simple save/load button that serializes campaignState to localStorage and restores it. Show confirmation text only. Do not persist secrets or flags beyond campaignState."

VERIFICATION:
- Full run without console errors
- npm test passes
- Save/load restores state


================================================
PROMPT USAGE RULES
================================================

1. One task per prompt.
2. Always include the exact file paths and existing system names.
3. Always require: 'Keep existing tests passing.'
4. Never ask for a new system; ask to wire or extend an existing one.
5. If a prompt fails, split it into smaller prompts instead of expanding scope.


================================================
STOP CONDITIONS
================================================

Stop immediately if:
- Any test fails after a change
- You cannot complete the Day 7 playthrough
- You are about to add a new system not on the include list

Instead of adding new systems:
- Use existing white cards as placeholder text
- Use colored rectangles instead of sprites
- Use browser confirm/prompt instead of custom modals
- Use 2-3 fixed NPC lines instead of dynamic dialogue


================================================
SUCCESS CRITERIA
================================================

  [ ] Character creation -> Day 1 -> Day 2 -> Day 3 -> End in < 15 minutes
  [ ] At least 1 choice in Act 1 changes trust or heat visibly
  [ ] The Cat quest can be found, completed, and rewarded
  [ ] Haircut Challenge launches, plays, and resolves
  [ ] Heat rises at night and triggers 1 encounter
  [ ] Act 1 climax shows 3 choices and a summary receipt
  [ ] npm test passes
  [ ] No console errors during full playthrough

If all 8 are true, you have a shippable First Miles vertical slice.


================================================
WHAT COMES NEXT (AFTER WEEK)
================================================

Phase 2 additions, in order:
1. Hustler and Mechanic origin branches
2. Additional side quests from SQ2-SQ12
3. Full Act 2
4. Additional mini-games
5. Storylet system
6. NPC relationship web
7. Godot port

Do not start Phase 2 until First Miles is validated by playtesting.
