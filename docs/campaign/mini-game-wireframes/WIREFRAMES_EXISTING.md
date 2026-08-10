# Mini-Game Wireframes
## Street Dice, Haircut Challenge, Lockpicking, Negotiation, Bodega Run

---

## Street Dice
**ID:** street_dice  
**Trigger:** map_corner, npc_tbone  
**Stats:** wit modifier, stake, DC  
**Duration:** 30s  
**Difficulty:** medium

### Layout
- Centered table panel: x=290, y=150, w=700, h=380, bg=#174540, border=#2d313d
- Player dice area: left-center
- Opponent dice area: right-center
- Status message: centered below dice
- Prompt: centered bottom

### States
- lobby: title, rules text, [PRESS ENTER TO START]
- play: dice hidden or rolling, [PRESS SPACE TO ROLL]
- resolve: sums shown, win/lose text
- reward: outcome text, [PRESS ENTER TO EXIT]

### Controls
- confirm: start/roll/exit

### HUD
- top: MINI GAME, NPC=T-Bone, LOCATION, TIME
- bottom: STATUS, DIFFICULTY

### Result Mapping
- win: cash+stake, trust+1, rep+1
- lose: cash-stake, trust-1, rep-1, heat+1

---

## Haircut Challenge
**ID:** haircut_challenge  
**Trigger:** map_barber_shop, npc_barber  
**Stats:** none direct, score-based  
**Duration:** 40s  
**Difficulty:** medium

### Layout
- Center panel: x=240, y=100, w=800, h=520
- Customer head preview: center y=240
- Timing bar: x=390, y=380, w=500, h=30
- GOOD zone: center 60% of bar, blue overlay
- PERFECT zone: center 16% of bar, cyan overlay
- Customer score log: y=445, three cards

### States
- lobby: title, [PRESS ENTER TO START]
- play: cursor ping-pong, [PRESS SPACE TO CLIP]
- resolve: final score shown
- reward: tier text, [PRESS ENTER TO EXIT]

### Controls
- confirm: clip/exit

### HUD
- top: MINI GAME, SCORE=x/300, CUSTOMER=1/3, TIME
- bottom: STATUS, DIFFICULTY

### Result Mapping
- critical_success: score>=250, cash*1.5, trust+2, rep+2
- success: score>=150, cash+stake, trust+1, rep+1
- partial: score>=100, cash*0.5
- failure: score<100, trust-1, rep-1, heat+2

---

## Lockpicking
**ID:** lockpicking  
**Trigger:** map_locked_door  
**Stats:** str bonus to tolerance  
**Duration:** 30s  
**Difficulty:** hard

### Layout
- Cylinder housing: x=340, y=160, w=600, h=220
- Shear line: horizontal guide across cylinder
- 5 pin channels: vertical shafts inside cylinder
- Selected pin highlight: gold
- Lockpick tool: red line under cylinder
- Feedback text: center y=480
- Controls hint: center y=510

### States
- lobby: title, [PRESS ENTER TO START]
- play: hold [W] to lift, [A/D] select pin, [SPACE] set
- resolve: all set or failed
- reward: outcome, [PRESS ENTER TO EXIT]

### Controls
- left/right: select pin
- confirm: set pin
- up: hold to lift
- down: reset pin

### HUD
- top: MINI GAME, SECURITY=x/5, TOLERANCE=±Xpx, TIME
- bottom: STATUS, DIFFICULTY

### Result Mapping
- success: cash+stake, trust+1, rep+2, secret=alley_keycard_intel
- failure: trust-1, rep-1, heat+1

---

## Negotiation
**ID:** negotiation  
**Trigger:** npc_merchant, shop_deal  
**Stats:** wit for LOGIC, soul/rep for CHARM  
**Duration:** 40s  
**Difficulty:** medium

### Layout
- Merchant avatar: left panel x=340, y=240
- Resistance meter: x=440, y=190, w=400, h=16
- Round quote bubble: right panel
- 4 option cards: y=385, w=180, h=95, spaced 190px
- Feedback text: center y=505
- Controls hint: center y=528

### States
- lobby: title, [PRESS ENTER TO START]
- play: round 1-3, select option, [A/D] move, [SPACE] select
- resolve: resistance<=0 or rounds exhausted
- reward: outcome, [PRESS ENTER TO EXIT]

### Controls
- left/right: choose option
- confirm: execute argument

### HUD
- top: MINI GAME, ROUND=x/3, RESISTANCE=X%, TIME
- bottom: STATUS, DIFFICULTY

### Result Mapping
- critical_success: fewer rounds, trust+2, cash+stake, rep+2, secret=wholesale_mixtape_leak
- success: trust+1, cash+stake, rep+1
- failure: trust-1, rep-1, heat+1

---

## Bodega Run
**ID:** bodega_run  
**Trigger:** map_bodega, npc_chen  
**Stats:** none direct, alertness mechanic  
**Duration:** 30s  
**Difficulty:** medium

### Layout
- Grid: 10x8, cell=60x60
- Board offset: centered in play area
- Shelves: brown striped blocks
- Items: cyan pulsing dots
- Exit: bottom-right cell
- Clerk vision cone: red translucent cells
- Player: gold square
- Clerk: red square
- Alertness bar: bottom center

### States
- lobby: title, [PRESS ENTER TO START]
- play: arrow movement, collect items, reach exit
- resolve: detected or escaped
- reward: outcome, [PRESS ENTER TO EXIT]

### Controls
- up/down/left/right: move player

### HUD
- top: MINI GAME, OBJECTIVE=items/x, EXIT=locked/unlocked, TIME
- bottom: STATUS, DIFFICULTY

### Result Mapping
- success: cash+stake, trust+1, rep+1, flag=bodega_run_complete
- failure: trust-1, heat+2, rep-1
