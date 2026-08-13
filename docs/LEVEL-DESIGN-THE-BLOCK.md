# THE BLOCK — Production Level Design

**Level ID:** `the-block` · **Status:** v2 design, revising the shipped v1 · **Target:** MVP-complete in 3 sprints

---

## 0. Two corrections to the brief, made before designing

**This game does not run on Godot.** The brief specifies Godot 4.5+, `TileMapLayer`, `CharacterBody2D`, `GPUParticles2D`. The shipped runtime is plain HTML/CSS/JS with a Canvas 2D renderer (`dynamic-world-map-renderer.js`) and no build step. `godot/` contains six files — a palette shader, a pixel-perfect camera, a tilemap helper, an atlas loader and `project.godot`. There are no scenes, no level data and no gameplay. `docs/CLAUDE.md` lists the Godot port under "still only designed".

Designing this level for Godot would produce a document that cannot be built. **§31–32 therefore specify the real runtime**, and §45 carries the Godot port mapping as a forward-compatible appendix. Every structure below is chosen so the port stays mechanical.

**The level already exists.** `assets/generated/level-the-block.js` ships 12 locations, 5 districts, 11 roled routes, 7 characters with five-block routines, 13 scenarios, 5 rumors, 2 chains, 3 events and a consequence matrix. Its `experience` block already names the emotions and pacing this brief asks for in Phase 1. Designing a parallel level would throw that away and desync the level from the engine that loads it.

**This document revises v1 rather than replacing it.** Sections marked ▲ are changes from shipped state; everything else is confirmation that the shipped design is correct and why.

---

## 1. Level overview

**THE BLOCK.** Eight square blocks of a Black neighborhood you grew up on, in the year the money starts noticing it. You are not a hero and you are not a kingpin. You are someone with a reputation, a grandmother, a friend with talent, and a crew across the avenue that has started calling your corner *The Cut*.

The level is the game's tutorial, its vertical slice, and its emotional thesis. Everything the full game does — scenarios resolved with four cards, scenes played back, consequences written into the world and remembered by the block ledger — happens here at small scale, on ground the player can hold in their head.

**Scope:** 12 locations · 16 routes ▲ · 7 named NPCs · 18 scenarios ▲ · 24 environmental POIs ▲ · 5 time blocks · 5 weather states.

**Tagline (shipped, kept):** *Run your block. Keep your people. Don't let the Cut take it.*

---

## 2. Player experience

### Level emotion

Four emotions, in the order the level delivers them. Shipped `experience.emotion` is `comfort, curiosity, paranoia, pride` — kept, because it is correct and the geography already produces it.

| Emotion | Where it lives | How geography produces it |
|---|---|---|
| **Comfort** | The Stoop, Rec Center | Two locations, one minute apart, both `SAFE`, both containing someone who is pleased to see you. Low route danger (0.2). The west side of the map has no faction markings. |
| **Curiosity** | Corner Store, The Blue Plate | The two locations where NPCs talk *about* other locations. Every rumor in the level enters through one of these two doors. They sit on the primary route, so you pass them going anywhere. |
| **Paranoia** | Baltimore Steps, Detroit Lot, Miami Cut | Danger climbs with distance from the Stoop (0.2 → 0.45 → 0.6 → 0.7). Faction markings appear. Officer Reyes' patrol crosses here. The player learns the map's danger gradient by walking it, not by reading a number. |
| **Pride** | Chicago Greystone, the return to the Stoop | Payoff locations. Pride is *retrospective*: it works only because the environment shows what you did — the mural you paid for, the tape on the diner, the Clique mark flipped. |

### Player fantasy

**"Running your home block — relationships, reputation, and territory."** (Shipped, kept.)

The player is not exploring a dungeon. They are maintaining a place they already belong to, against pressure. Concretely, the player's verbs are: *check in on people, hear things, decide who to tell, spend reputation, and live with it.*

The fantasy fails if the player feels like a courier. Every route therefore has a social or informational reason to be walked, not just a destination.

### Pacing

Shipped `experience.pacing` maps beats to locations. Kept, with the DECISION beat's geography fixed (§16-B).

```
CALM       stoop, rec_center       west     safe, low danger, familiar faces
CURIOSITY  corner_store, blue_plate centre   rumors enter here
DISCOVERY  stash_spot, rooftop      hidden   rumor-gated and secret-route-gated
TENSION    detroit_lot, bmore_steps east     faction ground, danger 0.45-0.6
DECISION   miami_cut                far east the Cut; danger 0.7
PAYOFF     chi_grey                 north    Block Fame
RECOVERY   stoop                    west     the world has changed; you can see it
```

**How the geography creates the pacing.** The map is a **west-to-east danger gradient with a northern payoff loop**. Home is west. The Cut is east. Every step east costs more and risks more. The player never has to be told this: route `danger` rises monotonically eastward, and the environmental markers (§17) change from Block Family colors to Royal Clique marks along the same axis.

The RECOVERY beat is the load-bearing one. It only works if the return trip west is *through the same locations the player changed*. That is why the escape and secret routes both re-enter the map in the middle rather than teleporting home (§4).

---

## 3. Design pillars

Four pillars. Every decision in this document is traceable to one. If a proposed addition serves none, it is cut.

1. **The block remembers.** Every consequence is visible somewhere in the level, not only in a stat. If the player cannot walk past a decision they made, the decision was not designed.
2. **Distance is the cost.** Risk, information and reputation are all spatial. The level teaches its economy through walking, never through a tooltip.
3. **No location is a corridor.** Every location has at least one scenario and one reason to stop. Anything that is only a route gets deleted or promoted.
4. **The same door twice.** A location the player has already visited must be able to produce a different scenario on the second visit, driven by time, story state, NPC position or rumor state.

---

## 4. Level objectives

**Why this level exists.** It is the only level in the MVP. It has to teach the entire loop and then be worth replaying.

| Objective | Delivered by |
|---|---|
| Teach the loop end-to-end | `corner_hustle` at the Stoop — a SOCIAL scenario with no fail state, run on turn one |
| Teach that cards are intent, stats are execution | `supply_run` at the Corner Store — the first scenario where a good card choice can still fail on a bad stat |
| Teach the danger gradient | The walk from Blue Plate to Baltimore Steps; `danger` 0.2 → 0.6 in two hops |
| Teach that information is a key | `stash_whisper` rumor → `stash_discovery` → the secret route |
| Teach that consequences persist | `police_raid` leaves tape on the Blue Plate that is still there next visit |
| Establish the three factions | Block Family (west), Corner Crew (east), Royal Clique (the Cut), Police (transverse) |
| Give the crew system a home | Marcus, Luna, Ty, Dove, Gram all have routines here; the AI crew (`ai-party.js`) recruits from them |
| Terminate two threads | `marcus_arc` (payoff at Chicago Greystone), `cut_arc` (payoff at Miami Cut) |
| Leave one thread open | The courier rumor chain seeds the next level |

**What can permanently change:** the Blue Plate's state (police tape), the Detroit Lot (burn marks), the Miami Cut's faction ownership, Marcus' career, Gram's health thread, and the Stoop's mural.

---

## 5. Spatial layout

The map is **960 × 540 in level coordinates** (the renderer's native space). Five districts on a west–east axis with a northern spur.

```
                                        N
   ┌──────────────────────────────────────────────────────────────┐
   │                                          ▓ CHI GREYSTONE     │
   │                                          (payoff, north)     │
   │                                               ▲              │
   │   ░ ROOFTOP                                   │              │
   │      │ (secret)                          ▓ DETROIT LOT       │
   │   ░ THE STASH                            (tension, corner crew)
   │      │                                        ▲              │
   │   ██ THE STOOP ────── ▒ BLUE PLATE ───────────┘              │
   │   (home, start)          (rumor hub)                         │
   │      │                       │  ╲                            │
   │   ▒ REC CENTER ── ▒ CORNER    │   ╲                          │
   │      (calm)         STORE     │    ╲ (alley, risky)          │
   │                       │       │     ▓ BALTIMORE STEPS        │
   │                    ◆ PRECINCT │            ╲                 │
   │                    (law)      │             ╲                │
   │                               │              ▓▓ MIAMI CUT    │
   │                          ▓ RAIL YARDS          (the Cut)     │
   │                          (escape)                            │
   └──────────────────────────────────────────────────────────────┘
      WEST — safe                                    EAST — the Cut

   ██ start   ▒ safe/social   ▓ tense   ▓▓ dangerous   ░ hidden   ◆ institution
```

### Districts

| District | Locations | Role | Danger band |
|---|---|---|---|
| `harlem` | Stoop, Rec Center, Stash, Rooftop | Home. CALM + DISCOVERY. | 0.1 – 0.2 |
| `downtown` | Blue Plate, Corner Store, Precinct ▲ | Information and the law. CURIOSITY. | 0.15 – 0.3 |
| `detroit` | Detroit Lot, Chicago Greystone | Work and payoff. TENSION → PAYOFF. | 0.3 – 0.45 |
| `east_side` | Baltimore Steps, Miami Cut | The Cut. TENSION → DECISION. | 0.6 – 0.7 |
| `industrial` | Rail Yards | Escape valve. | 0.4 – 0.5 |

▲ **Change:** the Precinct is reassigned from unassigned to `downtown` and given routes (§6). In shipped v1 it has **zero routes and is unreachable** — see §16-A.

### Spatial element purposes

Every element justifies itself against §3.

| Element | Purpose | Pillar |
|---|---|---|
| West–east axis | Encodes the entire risk economy in one readable direction | 2 |
| Northern spur (Detroit → Chi Grey) | Separates *payoff* from *danger* so success does not feel like more risk | 1 |
| The alley chain (Blue Plate → Steps → Cut) | The only fast way east; makes speed cost safety | 2 |
| Rooftop above the Stash | Vertical discovery; the vantage that reveals the map | 4 |
| Rail Yards south | Escape that does not lead home, so fleeing has a cost | 2 |
| Precinct as a spur off Corner Store | The law is adjacent to daily life, not a destination | 1 |

**Dead ends: zero.** Every location has degree ≥ 2 after §6.

---

## 6. Route design ▲

Shipped v1 has 11 routes and a broken graph. Measured:

```
precinct     0 routes   ** UNREACHABLE **
miami_cut    1 route    climax is a dead end with no escape
rooftop      1 route    leaf
rec_center   1 route    leaf
```

v2 adds five routes. All six brief-required route roles are then present and *mechanically* different, not cosmetically.

| ID | From → To | Role | Time | Cost | Danger | Gate |
|---|---|---|---|---|---|---|
| `stoop_blue` | Stoop → Blue Plate | primary | 1 | 2 | 0.20 | — |
| `blue_store` | Blue Plate → Corner Store | social | 1 | 1 | 0.20 | — |
| `store_rec` | Corner Store → Rec Center | social | 1 | 1 | 0.20 | — |
| ▲ `rec_stoop` | Rec Center → Stoop | social | 1 | 1 | 0.15 | — |
| ▲ `store_precinct` | Corner Store → Precinct | primary | 1 | 2 | 0.15 | — |
| ▲ `precinct_blue` | Precinct → Blue Plate | secondary | 1 | 2 | 0.25 | — |
| `blue_detroit` | Blue Plate → Detroit Lot | secondary | 2 | 5 | 0.45 | — |
| `detroit_chi` | Detroit Lot → Chi Greystone | secondary | 1 | 4 | 0.30 | — |
| `blue_bmore` | Blue Plate → Baltimore Steps | risky shortcut | 1 | 3 | 0.60 | — |
| `bmore_miami` | Baltimore Steps → Miami Cut | risky shortcut | 2 | 6 | 0.70 | — |
| `stoop_stash` | Stoop → Stash | secret | 1 | 1 | 0.10 | rumor `stash_whisper` |
| `stash_roof` | Stash → Rooftop | secret | 1 | 1 | 0.15 | `stash_discovery` resolved |
| ▲ `roof_blue` | Rooftop → Blue Plate | secret | 1 | 1 | 0.10 | `rooftop_lookout` resolved |
| ▲ `miami_roof` | Miami Cut → Rooftop | emergency escape | 2 | 0 | 0.35 | `roof_blue` known |
| `detroit_train` | Detroit Lot → Rail Yards | emergency escape | 2 | 3 | 0.50 | — |
| `train_chi` | Rail Yards → Chi Greystone | emergency escape | 2 | 4 | 0.40 | — |

**Resulting degree:** Stoop 3, Rec 2, Stash 2, Blue Plate 6, Store 3, Rooftop 3, Precinct 2, Detroit 3, Chi Grey 2, Steps 2, Miami Cut 2, Rail Yards 2.

### Why each role is a real decision

- **Primary** (Stoop → Blue Plate → Detroit): slowest east, cheapest, safest. The default.
- **Risky shortcut** (the alley chain): saves 2 travel-time to the Cut, at 0.6–0.7 danger and triple the cash. Chosen when a scenario has an expiry.
- **Secret** (Stash → Rooftop → Blue Plate): free, near-zero danger, but requires two resolved scenarios and a rumor. Converts *information* into *mobility* — the level's central economy in one route.
- **Emergency escape** (Miami Cut → Rooftop; Detroit → Rail Yards → Chi Grey): free or cheap, always available, but **does not go home**. Fleeing the Cut puts you on your own roof at night with heat on you. Fleeing Detroit puts you at the Greystone, away from Gram.
- **Social** (the west loop): no combat value, but each hop has an NPC check-in that can raise a relationship. This is the route the player takes when they have time and want people.
- **Secondary** (Precinct → Blue Plate): the route Reyes walks. Taking it at the same time block as Reyes triggers an unscheduled encounter (§7).

---

## 7. Points of interest

Full POI table. `Discovery` says how the player learns it exists — no location is revealed by a quest marker alone.

### 7.1 The Stoop — `stoop`

| Field | Value |
|---|---|
| Type / District | HOME / harlem · start location |
| Purpose | Home base. CALM. Teaches the loop. |
| Visual identity | Narrow red-brick walk-up, stooped base. Block Family mural on the left wall. *(shipped: `building_loc_stoop.png`)* |
| NPCs | Gram (MORNING, NIGHT, LATE_NIGHT), Marcus (MORNING) |
| Scenarios | `corner_hustle` (SOCIAL), ▲ `gram_asks` (CHARACTER, gated on day ≥ 3) |
| Actions | Talk · Rest (advance time block) · Check ledger · Depart |
| Risks | None. Danger 0. The only location that cannot become `DANGEROUS`. |
| Rewards | +TRUST with Gram; time advance; ledger review |
| Connects | Blue Plate, Rec Center ▲, Stash (secret) |
| Discovery | Start |
| Time of day | MORNING Gram on the steps · EVENING empty, porch light · NIGHT Gram waiting up — dialogue changes if HEAT > 5 |
| Weather | RAIN moves Gram indoors; the stoop reads empty and the scene is interior |
| Story states | Mural intact → tagged over (if the Cut takes the block) → repainted (if you take it back) |
| Permanent | Mural state. Gram's thread outcome. |

### 7.2 Rec Center — `rec_center`

| Field | Value |
|---|---|
| Type / District | SOCIAL / harlem |
| Purpose | CALM. The block as a community, not a territory. The counter-argument to the Cut. |
| Visual identity | Outdoor basketball court, chain-link, painted key *(shipped: `building_social.png`)* |
| NPCs | Gram (AFTERNOON, EVENING) |
| Scenarios | `community_block` (SOCIAL — the Cookout) |
| Actions | Talk · Play (minigame `block_territory`) · Recruit crew · Depart |
| Risks | None, unless faction control has flipped — then Corner Crew presence |
| Rewards | +REP, crew recruitment, Cookout Alliance |
| Connects | Corner Store, Stoop ▲ |
| Discovery | Visible from start |
| Time of day | AFTERNOON kids on court · EVENING cookout smoke · NIGHT empty, one light |
| Weather | RAIN empties the court entirely — `community_block` unavailable |
| Story states | Neutral → Cookout held (+alliance) → Contested (Corner Crew tags the court) |
| Permanent | Whether the Cookout ever happened. Referenced by name in later dialogue. |

### 7.3 Corner Store — `corner_store`

| Field | Value |
|---|---|
| Type / District | STORE / downtown |
| Purpose | CURIOSITY. Supplies and the first rumor door. |
| Visual identity | Brick shopfront, twin awnings *(shipped: `building_loc_corner_store.png`)* |
| NPCs | Mr. Chen (static, always present — the level's fixed point) |
| Scenarios | `supply_run` (MINIGAME — `bodega_run`) |
| Actions | Buy prep items · Talk · Ask about (rumor probe) · Depart |
| Risks | Low (0.2). Raises HEAT if you run the minigame dishonestly. |
| Rewards | Prep items, rumor `rumor_courier` |
| Connects | Blue Plate, Rec Center, Precinct ▲ |
| Discovery | On the primary route |
| Time of day | Open MORNING–NIGHT; shuttered LATE_NIGHT (shutter sprite; scenario unavailable) |
| Weather | STORM closes it early |
| Story states | Open → Shuttered (if HEAT > 8, Chen stops serving you) |
| Permanent | Chen's willingness to serve. |

### 7.4 The Blue Plate — `blue_plate`

| Field | Value |
|---|---|
| Type / District | RESTAURANT / downtown · **the level's hub, degree 6** |
| Purpose | CURIOSITY. Every rumor enters here or at the Store. Where all three factions eat. |
| Visual identity | Blue roof, red-and-white striped awning, deep windows *(shipped: `building_loc_blue_plate.png`)* |
| NPCs | Luna (MORNING, AFTERNOON, LATE_NIGHT), Officer Reyes (transient, AFTERNOON) |
| Scenarios | `police_raid` (ESCAPE), `snitch_or_silent` (CHARACTER, spawned by raid success) |
| Actions | Eat (restore) · Listen (rumor draw) · Talk · Depart |
| Risks | Raid can trigger on any visit while `police_sweep` is active |
| Rewards | Rumors, Luna relationship, restore |
| Connects | Stoop, Corner Store, Detroit Lot, Baltimore Steps, Precinct ▲, Rooftop ▲ |
| Discovery | On the primary route |
| Time of day | AFTERNOON busiest — highest rumor yield, highest raid chance · LATE_NIGHT Luna alone, best relationship scene |
| Weather | RAIN fills it; +1 rumor draw, +0.1 raid chance |
| Story states | Normal → Police tape (permanent after raid) → Reopened (if you cover for Chen) |
| Permanent | **Police tape.** The level's signature persistent consequence. |

### 7.5 The Stash — `stash_spot`

| Field | Value |
|---|---|
| Type / District | HIDDEN / harlem |
| Purpose | DISCOVERY. Payoff for listening to Gram. Gate to the secret route. |
| Visual identity | Closed roller shutter in a brick recess *(shipped: `building_hidden.png`)* |
| NPCs | None — deliberately. Discovery should feel private. |
| Scenarios | `stash_discovery` (MYSTERY) |
| Actions | Search · Stash item · Take · Depart |
| Risks | 0.1. Raises HEAT if discovered by patrol during `police_sweep` |
| Rewards | Cash cache, opens `stash_roof` |
| Connects | Stoop, Rooftop |
| Discovery | **Rumor `stash_whisper` from Gram at the Stoop.** Not shown on the map until then. |
| Time of day | Only enterable NIGHT / LATE_NIGHT. Visible but locked otherwise. |
| Weather | Unchanged (it is a doorway) |
| Story states | Unknown → Known → Emptied → Compromised (if Ty follows you) |
| Permanent | Whether the Cut ever learns about it. |

### 7.6 The Rooftop — `rooftop`

| Field | Value |
|---|---|
| Type / District | LANDMARK / harlem |
| Purpose | DISCOVERY + the level's map-legibility tool. |
| Visual identity | Tan walk-up seen from its roof line *(shipped: `building_loc_...`/`building_landmark.png`)* |
| NPCs | None by default; Marcus here LATE_NIGHT after `studio_session` |
| Scenarios | `rooftop_lookout` (INVESTIGATION) |
| Actions | Watch (reveals NPC positions map-wide for one time block) · Talk · Descend |
| Risks | 0.15 |
| Rewards | **Reveals every NPC's current location on the map** — the single most valuable non-cash reward in the level |
| Connects | Stash, Blue Plate ▲, Miami Cut ▲ (escape only) |
| Discovery | Rumor `roof_legend` + `stash_discovery` resolved |
| Time of day | NIGHT is the intended read — city lights, the whole block below |
| Weather | FOG blocks the Watch action entirely; the reward is weather-gated |
| Story states | Unknown → Known → Your spot (Marcus starts meeting you here) |
| Permanent | Becomes a recurring scene location for the crew. |

### 7.7 12th Precinct — `precinct` ▲

| Field | Value |
|---|---|
| Type / District | INSTITUTION / downtown ▲ |
| Purpose | The law as a *place with a door*, not an ambient threat. |
| Visual identity | Two-storey precinct, badge sign, blue trim *(shipped: `building_institution.png`)* |
| NPCs | Officer Reyes (default location) |
| Scenarios | `officer_trust` (NEGOTIATION), ▲ `heat_check` (CHARACTER, gated HEAT ≥ 6) |
| Actions | Talk · Report · Pay fine (spend CASH to drop HEAT) · Depart |
| Risks | Entering with HEAT ≥ 8 can trigger detention (lose one time block) |
| Rewards | HEAT reduction, Reyes relationship, `snitch_or_silent` access |
| Connects | Corner Store ▲, Blue Plate ▲ |
| Discovery | ▲ Visible from the start. **Was unreachable in v1.** |
| Time of day | Reyes present MORNING/EVENING/NIGHT; on patrol AFTERNOON |
| Weather | Unchanged |
| Story states | Neutral → Reyes owes you → Reyes watching you |
| Permanent | Reyes' disposition, which gates the entire snitch thread. |

### 7.8 Detroit Lot — `detroit_lot`

| Field | Value |
|---|---|
| Type / District | PARK / detroit |
| Purpose | TENSION. Corner Crew ground. Where Marcus works. |
| Visual identity | ▲ **Currently a geometric glyph — no art exists.** See §28-A. A fenced vacant lot, oil-drum fire, one wall of tags. |
| NPCs | Marcus (EVENING, NIGHT), Ty (MORNING, AFTERNOON, NIGHT, LATE_NIGHT) |
| Scenarios | `studio_session` (STORY) |
| Actions | Talk · Record · Watch · Depart |
| Risks | 0.45. Ty is hostile if the Cut arc has escalated. |
| Rewards | Marcus arc progress, `block_fame` unlock |
| Connects | Blue Plate, Chi Greystone, Rail Yards |
| Discovery | Marcus mentions it during `corner_hustle` |
| Time of day | EVENING is the intended read — drum fire, Marcus recording on a phone |
| Weather | RAIN cancels the session; scenario deferred, Marcus disappointed (−TRUST) |
| Story states | Neutral → Burn marks (if `clique_war` escalates) → Fenced off |
| Permanent | **Burn marks.** Visible from the Blue Plate route thereafter. |

### 7.9 Chicago Greystone — `chi_grey`

| Field | Value |
|---|---|
| Type / District | APARTMENT / detroit |
| Purpose | PAYOFF. Separated from danger on purpose. |
| Visual identity | Tan stone, arched windows *(shipped: `building_loc_chi_grey.png`)* |
| NPCs | Marcus (after `studio_session`) |
| Scenarios | `block_fame` (STORY — the arc terminus) |
| Actions | Talk · Celebrate · Depart |
| Risks | 0.3 |
| Rewards | Large REP, Marcus arc resolution, the level's emotional high |
| Connects | Detroit Lot, Rail Yards |
| Discovery | Unlocked by `studio_session` |
| Time of day | NIGHT — windows lit, music audible |
| Weather | Unchanged |
| Story states | Quiet → Party (post-`block_fame`) → Emptied (if Marcus leaves the block) |
| Permanent | Whether Marcus stays. |

### 7.10 Baltimore Steps — `bmore_steps`

| Field | Value |
|---|---|
| Type / District | ALLEY / east_side |
| Purpose | TENSION. The threshold to the Cut. |
| Visual identity | Red-brick rowhouse, marble steps, rooftop units *(shipped: `building_loc_bmore_steps.png`)* |
| NPCs | Ty (EVENING), Dove (LATE_NIGHT) |
| Scenarios | ▲ `the_steps_watch` (INVESTIGATION) — **v1 has zero scenarios here** |
| Actions | Watch · Talk · Pass through · Depart |
| Risks | 0.6. Passing at NIGHT with HEAT ≥ 5 triggers an encounter. |
| Rewards | Advance warning of Cut activity; identifies the courier |
| Connects | Blue Plate, Miami Cut |
| Discovery | On the risky shortcut |
| Time of day | LATE_NIGHT is when the courier moves — the only window to observe it |
| Weather | FOG hides the courier; the scenario becomes unwinnable and says so |
| Story states | Neutral → Watched (Clique knows you stop here) |
| Permanent | Whether the Clique knows your face. |

### 7.11 Miami Cut — `miami_cut`

| Field | Value |
|---|---|
| Type / District | CLUB / east_side |
| Purpose | DECISION. The level's climax. |
| Visual identity | Columned storefront, neon under the cornice *(shipped: `building_loc_miami_cut.png`)* |
| NPCs | Dove (all blocks except LATE_NIGHT), Luna (EVENING, NIGHT) |
| Scenarios | `hidden_meet` (FACTION), `clique_war` (BOSS) |
| Actions | Enter · Talk · Deal · Leave · ▲ Escape to roof |
| Risks | 0.7 — highest in the level |
| Rewards | Territory, the `cut_arc` resolution |
| Connects | Baltimore Steps, ▲ Rooftop (escape) |
| Discovery | Rumor `miami_deal` |
| Time of day | NIGHT only for `hidden_meet` |
| Weather | RAIN → neon reflections; the level's signature shot |
| Story states | Clique-held → Contested → Block Family-held |
| Permanent | **Faction ownership.** Changes the marking, the NPC set and the west-side dialogue. |

### 7.12 Rail Yards — `train_yard`

| Field | Value |
|---|---|
| Type / District | TRANSITION / industrial |
| Purpose | Escape valve. Makes fleeing a real option with a real cost. |
| Visual identity | ▲ **Currently a geometric glyph — no art exists.** See §28-A. Freight cars, gravel, sodium light. |
| NPCs | None (transient: Dove if fleeing the Cut) |
| Scenarios | `train_heist` (HEIST) |
| Actions | Board · Search · Hide · Depart |
| Risks | 0.5; the only location where failure can cost a full day |
| Rewards | Large cash, the level's biggest single score |
| Connects | Detroit Lot, Chi Greystone |
| Discovery | Visible; the heist needs `rumor_buyer` |
| Time of day | LATE_NIGHT only for the heist |
| Weather | STORM masks the heist (−danger), but disables the escape route |
| Story states | Quiet → Patrolled (after any heist) |
| Permanent | Patrol state, which raises danger on the escape route thereafter. |

---

## 8. NPC design

Seven named NPCs. Each has a home, a work location, a favourite location, a full five-block routine and a travel route between them. **No NPC stands next to a marker.** The player meets them by being somewhere at a time.

### Marcus — the friend with talent

| | |
|---|---|
| Role | Best friend; aspiring artist; the `marcus_arc` |
| Home / Work / Favourite | Stoop / Detroit Lot / Chicago Greystone |
| Routine | MORNING Stoop · AFTERNOON Blue Plate · EVENING Detroit Lot · NIGHT Detroit Lot · LATE_NIGHT Stoop |
| Travel | Uses the primary route; never the alley (he avoids the Cut) |
| Relationships | Player (close), Luna (attracted), Ty (wary) |
| Secret | He has already been offered a way out of the block |
| Goal / Fear | Build career / being the one who left |
| Current state | PRESENT, `build_career` |

### Luna — the one who hears everything

| | |
|---|---|
| Role | Works the Blue Plate; the rumor broker |
| Home / Work / Favourite | Blue Plate / Blue Plate / Miami Cut |
| Routine | MORNING Blue Plate · AFTERNOON Blue Plate · EVENING Miami Cut · NIGHT Miami Cut · LATE_NIGHT Blue Plate |
| Travel | Takes the alley — she is the reason the player learns it is passable |
| Relationships | Marcus (mutual), Dove (dangerous, hidden) |
| Secret | She carries messages for the Clique |
| Goal / Fear | Stay independent / being made to choose |
| Note | **Luna is the only NPC who crosses the whole map daily.** Her routine is the player's introduction to the east side. |

### Ty — the pressure

| | |
|---|---|
| Role | Corner Crew enforcer |
| Home / Work / Favourite | Detroit Lot / Detroit Lot / Baltimore Steps |
| Routine | MORNING Detroit · AFTERNOON Detroit · EVENING Baltimore Steps · NIGHT Detroit · LATE_NIGHT Detroit |
| Travel | Blue Plate → Steps, primary and alley both |
| Relationships | Marcus (wary), Dove (rival), Player (scales with REP) |
| Secret | He is being squeezed by the Clique and is looking for a way out |
| Goal / Fear | Hold the lot / being replaced |
| Note | Ty is the level's **escalation dial**. His hostility is a function of `cut_arc` progress, not a fixed flag. |

### Dove — the Cut

| | |
|---|---|
| Role | Royal Clique lieutenant |
| Home / Work / Favourite | Miami Cut / Miami Cut / Baltimore Steps |
| Routine | MORNING–NIGHT Miami Cut · LATE_NIGHT Baltimore Steps |
| Travel | Only within east_side — **Dove never comes west unless the player brings the war there** |
| Relationships | Luna (hidden), Ty (rival) |
| Secret | The Clique's Chicago buyer is real; Dove is the courier's handler |
| Goal / Fear | Take the block / losing the Cut |
| Note | Dove's LATE_NIGHT move to the Steps is what makes `the_steps_watch` possible. Geography *is* the stealth mechanic. |

### Gram — the reason

| | |
|---|---|
| Role | Grandmother; the block's memory |
| Home / Work / Favourite | Stoop / Rec Center / Rec Center |
| Routine | MORNING Stoop · AFTERNOON Rec Center · EVENING Rec Center · NIGHT Stoop · LATE_NIGHT Stoop |
| Travel | Stoop ↔ Rec Center only; the `rec_stoop` route ▲ exists so this is a real walk |
| Relationships | Player (unconditional), everyone (respected) |
| Secret | She knows about the Stash. She is also sicker than she says. |
| Goal / Fear | Keep you here / outliving you |
| Note | Gram is the source of `stash_whisper`. The level's best reward is behind talking to your grandmother. |

### Officer Reyes — the law

| | |
|---|---|
| Role | Neighbourhood officer; not a villain |
| Home / Work / Favourite | — / Precinct / Blue Plate |
| Routine | MORNING Precinct · AFTERNOON **patrol** (Blue Plate) · EVENING Precinct · NIGHT Precinct · LATE_NIGHT Precinct |
| Travel | ▲ `precinct_blue` — walking it at AFTERNOON produces an unscheduled encounter |
| Relationships | Chen (friendly), Player (scales with HEAT) |
| Secret | She grew up two blocks over and is protecting someone |
| Goal / Fear | Keep a lid on it / becoming what she polices |

### Mr. Chen — the fixed point

| | |
|---|---|
| Role | Corner Store owner |
| Routine | **Static — always at the Corner Store.** Deliberate: the map needs one certainty. |
| Secret | He has been paying the Clique for two years |
| Goal / Fear | Stay open / being made an example |

---

## 9. Scenario distribution

18 scenarios ▲ across 12 locations. No location has zero (§3, pillar 3). No location has more than two, so nothing clusters.

| Location | Scenarios | Beat |
|---|---|---|
| Stoop | `corner_hustle`, ▲ `gram_asks` | CALM |
| Rec Center | `community_block` | CALM |
| Corner Store | `supply_run` | CURIOSITY |
| Blue Plate | `police_raid`, `snitch_or_silent` | CURIOSITY |
| Stash | `stash_discovery` | DISCOVERY |
| Rooftop | `rooftop_lookout` | DISCOVERY |
| Precinct | `officer_trust`, ▲ `heat_check` | — |
| Detroit Lot | `studio_session` | TENSION |
| Chi Greystone | `block_fame` | PAYOFF |
| Baltimore Steps | ▲ `the_steps_watch` | TENSION |
| Miami Cut | `hidden_meet`, `clique_war` | DECISION |
| Rail Yards | `train_heist` | — |

### Scenario specification format

Every scenario is authored against this shape. Worked example for the new tension scenario:

**`the_steps_watch`** ▲

| Field | Value |
|---|---|
| Location | Baltimore Steps |
| Trigger | Player present at LATE_NIGHT with `rumor_courier` discovered |
| Context | Dove moves to the Steps at LATE_NIGHT. Someone hands something over. You can see it from the stoop of 1400 if you stay still. |
| Participants | player, dove, (courier — unnamed) |
| Player knows | A courier moves product through the Cut |
| Player does not know | The courier is Luna |
| Cards — WHO | Nobody / Marcus / Ty / the block itself |
| Cards — WHAT | Watch and count / Get closer / Announce yourself / Photograph it |
| Cards — HOW | Patiently / Fast / Loud / Paid off |
| Cards — TWIST | Dove looks up / It starts raining / Someone you love walks in / Reyes is already here |
| Playback type | `investigate` template · beats: establish → approach → action → reaction → outcome |
| Success | Courier identified. `rumor_courier` → TRUE. Unlocks `hidden_meet` at reduced danger. |
| Failure | Seen. Steps become `WATCHED`. `bmore_miami` danger 0.70 → 0.85. |
| Unexpected | If the TWIST card is *Someone you love walks in* and Luna's routine places her at the Cut: the courier is revealed as Luna, three scenes earlier than intended, and `snitch_or_silent` rewrites to be about her. |
| Consequences | Rumor truth state; route danger; Luna relationship |
| Replay variations | FOG → unwinnable and says so · Ty present → he can be flipped · post-`clique_war` → the Steps are Block Family and the scenario becomes a patrol |

---

## 10. Narrative flow

The level is a **branching ecosystem with two arcs that share a midpoint**, not a line.

```
                    INTRODUCTION
                    corner_hustle (Stoop)
                            │
                    FIRST DISCOVERY
                    stash_whisper → stash_discovery
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ROUTE A            ROUTE B             ROUTE C
   The Friend         The Law             The Cut
   studio_session     officer_trust       the_steps_watch
   (Detroit)          (Precinct)          (Steps)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    MIDPOINT — police_raid (Blue Plate)
                    fires regardless of route taken
                            │
                    COMPLICATION — snitch_or_silent
                            │
              ┌─────────────┴─────────────┐
              │                           │
        MAJOR DECISION              MAJOR DECISION
        hidden_meet                 clique_war
        (deal with the Cut)         (fight for it)
              │                           │
              └─────────────┬─────────────┘
                            │
                    CLIMAX — block_fame (Chi Greystone)
                            │
                    AFTERMATH — return to Stoop
```

**All three routes reach the midpoint.** Route A learns *what the block could be*, B learns *what the law will tolerate*, C learns *what the Cut is actually doing*. The raid then lands differently depending on which you know — same beat, three readings. That is the level's core replay proposition.

**Optional branches:** `train_heist` (money route, skips a decision by buying it), `community_block` (alliance route, changes `clique_war`'s odds), `gram_asks` ▲ (the human route; the only branch with no material reward).

---

## 11. Card interaction with geography

Cards resolve through the shipped four-slot model — **WHO / WHAT / HOW / TWIST** (`scenario-engine.js`). Cards are intent; stats are execution; the world is the consequence. Twelve concrete geographic interactions:

| # | Card | Slot | Geographic effect |
|---|---|---|---|
| 1 | *a rooftop you know how to get onto* | HOW | Reveals `roof_blue`, permanently adding a secret route |
| 2 | *a grandma who gave you a dollar* | WHO | Gram accompanies; Stoop and Rec danger → 0; the Cut becomes impassable while she is with you |
| 3 | *a cousin who owes everybody money* | WHO | Ty becomes non-hostile at Detroit Lot for one time block |
| 4 | *a hair appointment that cost more than your car note* | WHAT | Consumes a time block; NPC routines advance while you are occupied |
| 5 | *a doctor who didn't believe your pain* | TWIST | Fires Gram's health thread early, changing Stoop scenes for the rest of the level |
| 6 | *a job offer that disappeared after they saw your name* | TWIST | Marcus takes the way out; Chicago Greystone becomes `EMPTIED` |
| 7 | *paid off* | HOW | Reduces the current route's danger by 0.25 for this trip only; costs CASH |
| 8 | *a blunt shaped like a baby bottle* | HOW | Raises HEAT 2; if HEAT crosses 8, the Corner Store shutters |
| 9 | *the club promoter with zero followers* | WHO | Opens Miami Cut at a non-NIGHT block, bypassing the time gate |
| 10 | *a bolo in the backseat* | WHAT | Rail Yards heist becomes available without `rumor_buyer` |
| 11 | *an argument over who makes the best mac & cheese* | WHAT | Converts a `clique_war` BOSS scenario into a `community_block` SOCIAL one — de-escalation as a card |
| 12 | *texting at the stoplight* | TWIST | Reyes witnesses the scene wherever it occurs; the Precinct thread opens from any location |

**Rule:** a card that only changes flavour text is not shipped. Every card in the level's active pool must alter at least one of: route, risk, availability, NPC position, or consequence.

---

## 12. Scene playback plan

Playback runs on the shipped `SceneMachine` — 20 animation states, 8 camera presets (`WIDE, MEDIUM, CLOSE, REACTION, OVER_SHOULDER, DRAMATIC, ESTABLISHING, FOLLOW`), a beat system, and content templates matched by keyword.

Worked plan for the level's signature scene:

### `police_raid` — Blue Plate, midpoint

| Beat | Camera | Actors | Animation | Environment |
|---|---|---|---|---|
| establish | `ESTABLISHING` | Luna at counter, Chen in booth | IDLE, IDLE | Rain on the window; neon sign hum |
| approach | `WIDE` | Reyes enters | WALK | Door bell; conversation stops |
| action | `OVER_SHOULDER` on player | Reyes | TALK / POINT | Ceiling light flickers |
| reaction | `REACTION` | Luna, Chen | SURPRISE, LOOK | Chair scrape |
| escalation | `DRAMATIC` | Reyes, player | THREATEN / DEFEND | Blue light through the window |
| outcome | `CLOSE` | resolved actor | per tier | Tape goes up, or does not |

**Card effect on playback:** the HOW card selects the escalation beat's animation pair. *Loud* → THREATEN/ANGER. *Patiently* → LISTEN/LISTEN and the escalation beat is skipped entirely, shortening the scene — de-escalation is felt as *less scene*, not as a different text.

**The four things every scene must communicate:** what happened (action beat), who did it (REACTION on the actor, not the player), why it mattered (escalation), what changed (outcome beat holds on the changed object — the tape, the mark, the empty chair).

---

## 13. Consequence matrix

Four classes. The shipped `consequence_matrix` covers `police_raid` only; v2 extends it to all eight major scenarios.

| Class | Window | Example |
|---|---|---|
| **Immediate** | This scene | Reyes' disposition shifts; CASH changes |
| **Short term** | 1–2 time blocks | Blue Plate `TENSE`; NPCs avoid it |
| **Long term** | Rest of the level | `snitch_or_silent` spawns; Chen stops serving you |
| **Permanent** | Forever, and recorded in the block ledger | Police tape on the Blue Plate |

### Worked matrix — `clique_war`

| Outcome | Immediate | Short | Long | Permanent |
|---|---|---|---|---|
| **Block Family takes the Cut** | +REP 8, −CASH | Dove leaves east_side | Miami Cut markings flip; Luna's routine reroutes west | Cut is Block Family. Stoop mural repainted with a fourth name. |
| **Stalemate** | +HEAT 4 | Both markings present | `bmore_miami` danger +0.1 | Detroit Lot burn marks |
| **Clique holds** | −REP 5 | Ty defects to the Clique | Corner Store shutters; Rec Center contested | Stoop mural tagged over. Gram's dialogue changes permanently. |

**Rule:** every row's Permanent column must name a *visible object in the level*. A consequence the player cannot walk past is not shipped.

---

## 14. Environmental storytelling — 24 POIs ▲

Shipped v1 has 4 POIs and **the loader never reads them** (§16-C). v2 ships 24, loaded and rendered as decal sprites at their location.

| # | POI | Location | Type | What it says |
|---|---|---|---|---|
| 1 | Block Family mural | Stoop | graffiti | Territory claimed, not contested |
| 2 | Three names painted small | Stoop | graffiti | People who did not make it. A fourth space is blank. |
| 3 | Porch light | Stoop | lighting | On = Gram waited up |
| 4 | Folding chairs stacked | Rec Center | props | The Cookout happened, or is about to |
| 5 | Painted key, worn through | Rec Center | architecture | This court gets used |
| 6 | Chain-link with a bent panel | Rec Center | damage | Everyone gets in the same way |
| 7 | Hand-lettered price list | Corner Store | signs | Chen sets prices himself |
| 8 | Security shutter, half down | Corner Store | interactive | Closing early = something is expected |
| 9 | Clique tag on the store's side wall | Corner Store | faction | Chen is paying someone |
| 10 | Police tape | Blue Plate | police | The raid happened. Permanent. |
| 11 | Two coffee cups, one booth | Blue Plate | props | Reyes meets someone here |
| 12 | Flyer for Marcus' set | Blue Plate | posters | Appears after `studio_session` |
| 13 | Roller shutter, fresh padlock | Stash | interactive | Someone still uses this |
| 14 | Cigarette pile by the recess | Stash | trash | Somebody waits here regularly |
| 15 | Folding chair facing the block | Rooftop | props | This is someone's spot |
| 16 | Pigeon coop, empty | Rooftop | architecture | An older use of this roof |
| 17 | Community notice board | Precinct | signs | Names of the missing, none removed |
| 18 | Cruiser parked nose-out | Precinct | vehicles | Ready to leave in a hurry |
| 19 | Oil-drum fire | Detroit Lot | lighting | The lot is occupied at night |
| 20 | Burn marks | Detroit Lot | damage | Appears if `clique_war` escalates |
| 21 | Marble steps, scrubbed white | Baltimore Steps | architecture | Somebody's grandmother still cleans them |
| 22 | Royal Clique mark | Miami Cut | faction | Flips to Block Family if you take it |
| 23 | Neon reflected in standing water | Miami Cut | weather | The level's signature shot, RAIN only |
| 24 | Freight car with old tags | Rail Yards | graffiti | The block's writing has left the block |

**Rule applied:** each POI answers "why does this exist?" with a story fact. None are decoration.

---

## 15. Systems

### World events
Shipped: `city_blackout` (2 blocks, −0.3 security), `police_sweep` (1 block, +0.4 security, unlocks `police_raid`), `gang_war` (2 blocks, −0.5 security). Kept. ▲ Added: `cookout` (1 block, +0.2 activity, west-side danger → 0) fired by `community_block` success — so the player's own actions can create world events, not only suffer them.

### Time of day
Five blocks: `MORNING, AFTERNOON, EVENING, NIGHT, LATE_NIGHT`. Every location has a distinct read per block (§7). Three scenarios are hard-gated by block (`stash_discovery` NIGHT+, `hidden_meet` NIGHT, `train_heist` LATE_NIGHT, `the_steps_watch` LATE_NIGHT) — enough that the clock is a resource, not so many that the player is waiting.

### Weather
`CLEAR, RAIN, HEAVY_RAIN, FOG, STORM`. Weather is a **gameplay modifier, not a filter**: RAIN fills the Blue Plate (+rumor, +raid chance), FOG disables the Rooftop watch and the Steps observation, STORM masks the heist but closes the escape route.

### Replayability
Four independent axes, so a second run differs without new content: **route knowledge** (secret routes known from the start change the optimal path), **which of A/B/C you take first** (recolours the midpoint), **NPC routine collisions** (Luna's crossing means encounters vary by hour), and **the block ledger** — crowned cards from a previous run become motifs the level references by name.

### Discovery
No scenario is revealed by a marker alone. Three discovery channels: **overheard** (Blue Plate / Corner Store rumor draws), **observed** (Rooftop watch, Steps stakeout), **told** (Gram, Marcus). A location the player has not discovered is drawn as a dimmed glyph — visible as *somewhere*, not as *something*.

### Map markers
Marker taxonomy, deliberately small: **scenario available** (pulsing dot, energy-coloured), **NPC present** (small figure, only if known), **rumor lead** (question glyph), **consequence** (persistent decal, no icon — the world shows it). Four marker types total; anything more and the map becomes a menu.

---

## 16. Design review — problems found and fixed ▲

Phase 16 requires finding problems and *fixing* them. These were measured against the shipped level file, not guessed.

### A. The Precinct is unreachable — **fixed**
Measured route degree: `precinct 0`. It holds Officer Reyes, the `officer_trust` scenario, and is required by `police_raid`'s success branch which spawns `snitch_or_silent` with `requirements: ['player_present','officer_01_present']`. **An entire narrative thread is stranded behind a location with no roads.**
**Fix:** routes `store_precinct` and `precinct_blue` (§6). The Precinct becomes a spur off daily life, and Reyes' AFTERNOON patrol makes `precinct_blue` an encounter route.

### B. The climax is a dead end — **fixed**
`miami_cut` degree 1. The player reaches the level's most dangerous location by one 0.7-danger alley and can only leave the way they came. There is no escape from the climax, which makes the BOSS scenario feel like a trap rather than a decision.
**Fix:** `miami_roof` (§6) — an emergency escape to the Rooftop, gated on having discovered `roof_blue`. Players who did the discovery work get an exit; players who did not are committed. The gate makes exploration pay off at exactly the moment it matters.

### C. Environmental storytelling and consequences are dead data — **fixed**
`level-loader.js` consumes 18 fields. `pois` and `consequence_matrix` are **not among them**. Both are authored in the level file and never loaded, so no POI has ever rendered and no consequence has ever fired from the matrix.
**Fix:** extend `loadLevel` to read both (§18), and expand POIs 4 → 24 (§14).

### D. Baltimore Steps is a pure corridor — **fixed**
Zero scenarios, despite being named in `experience.pacing` as a TENSION beat. It is currently 100% travel time.
**Fix:** `the_steps_watch` (§9), which also gives Dove's LATE_NIGHT routine a gameplay purpose.

### E. Rec Center and Rooftop are leaves — **fixed**
Degree 1 each. A leaf location is one the player visits once and never routes through.
**Fix:** `rec_stoop` closes the west social loop; `roof_blue` turns the Rooftop from a viewpoint into a shortcut. Both make the west side re-traversable.

### F. Two locations have no art — **open, scoped**
Detroit Lot and Rail Yards render as geometric glyphs. This was a deliberate call (no honest vacant-lot or rail-yard art exists in the vendor drop), but they are TENSION and ESCAPE beats and deserve art. Scoped in §17 as the only two new-art tasks.

### G. Scenario clustering — **verified clean**
Measured: max 2 scenarios per location, 12/12 locations non-empty after fix D. No cluster.

---

## 17. Art requirements

The pipeline is established and idempotent: `scripts/process-*.sh` cut tracked sprites out of the untracked vendor drop into `assets/*/web/`. Long edge 64 for map sprites; the ground tile is exactly 48×48 and must stay seamless.

### A. New art required — 2 buildings

| Asset ID | Category | Dimensions | Scale | Anim | Variants | Palette | Priority |
|---|---|---|---|---|---|---|---|
| `building_loc_detroit_lot` | Building | ≤64 long edge | 1:1 at 64px | none | 1 | ≤120 luminance on fills | **P0** |
| `building_loc_train_yard` | Building | ≤64 long edge | 1:1 at 64px | none | 1 | ≤120 luminance on fills | **P0** |

Both must be authored — no source in the drop matches. Aseprite MCP task: a fenced vacant lot with an oil-drum fire (front elevation, 3/4), and a freight car end with gravel apron.

### B. New art required — 24 POI decals

| Asset ID | Category | Dimensions | Anim | Variants | Reuse | Priority |
|---|---|---|---|---|---|---|
| `decal_poi_*` (×24) | Prop decal | 16×16 | none | per §14 | High — graffiti/tags reused across 6 locations | **P1** |

Authored as **one 8×3 sheet at 16px**, sliced by a new `scripts/process-poi-decals.sh` following the established pattern. 24 decals ≈ 6 KB total.

### C. Existing, no work needed

`ground_asphalt` (48×48 seamless), 10 building sprites, `character_fallback`, 6 HUD icons, 7 generated characters, 4 vehicles, 13 props.

### Aseprite file structure

```
art/
  buildings/    the-block-lots.aseprite      2 frames, 1 layer per building
  decals/       the-block-poi.aseprite       8x3 grid, 1 layer, indexed palette
  palette/      concrete_kings.gpl           generated from pixel-engine.js
```

**Palette rule (enforced by test):** all colours come from the 101-colour, 9-ramp master palette in `pixel-engine.js`. Shade with `paletteShift(colour, ±n)`; never darken a hex arithmetically. Large fills stay under luminance 120.

---

## 18. Implementation

### Runtime structure (real)

| Layer | File | Responsibility |
|---|---|---|
| Level data | `assets/generated/level-the-block.js` | `window.MAP_LEVEL`, pure data |
| Loader | `src/pixel_engine/level-loader.js` | `loadLevel(engine, def)` → state |
| Gameplay state | `src/pixel_engine/dynamic-map-state.js` | locations, scenarios, rumors, factions, time, weather |
| World model | `src/pixel_engine/dynamic-world-map.js` | zoom, layers, routes, visual states |
| Renderer | `src/pixel_engine/dynamic-world-map-renderer.js` | Canvas 2D, layered draw |
| Sprite manifest | `src/pixel_engine/dynamic-map-assets.js` | id/type → tracked sprite path |
| Scenario resolution | `src/pixel_engine/scenario-engine.js` | WHO/WHAT/HOW/TWIST → outcome tier |
| Playback | `src/pixel_engine/scene-machine.js` | beats, camera presets, animation states |
| Memory | `src/pixel_engine/canon-engine.js` | block ledger, motifs, callbacks |

**The four maps are already separated** as the brief requires: visual (renderer), navigation (routes in state), gameplay (scenarios/state), narrative (chains/threads/rumors). Scenario logic lives in data, not in map objects.

### Required loader changes

```
loadLevel(engine, def)
  + (def.pois || []).forEach(p => state.addPoi(p))                    // §16-C
  + if (def.consequence_matrix) state.setConsequenceMatrix(def.consequence_matrix)
```

Both are additive; no existing field changes shape.

### Data schema (authoritative — matches `loadLevel`)

```
MAP_LEVEL {
  id, startLocationId, activeDistrictId, weather, timeOfDay
  districts[]      { id, name, x, y }
  factions[]       { id, name, color, territory[] }
  locations[]      { id, name, type, district_id, coordinates{x,y}, tags[], state, faction, discovered }
  routes[]         { id, origin, destination, travel_time, cost, danger, tags[], role, condition, discovered? }
  characters[]     { id, name, locationId, state, color, routine{BLOCK:{location}}, goal }
  scenarios[]      { id, locationId, type, title, summary, participants[], urgency, requirements[], priority }
  rumors[]         { id, text, truth, discovered, reveals?, children[]? }
  chains[]         { id, nodes[] }
  threads[], obligations[], events[], vehicles[], relationships[]
  pois[]                 ▲ { id, locationId, type, meaning, sprite, condition? }
  consequence_matrix{}   ▲ { scenarioId: { success[], fail[] } }
}
```

`type` ∈ `HOME, SOCIAL, HIDDEN, RESTAURANT, STORE, LANDMARK, INSTITUTION, PARK, APARTMENT, ALLEY, CLUB, TRANSITION`.
`state` ∈ `SAFE, ACTIVE, TENSE, DANGEROUS, LOCKED, DESTROYED, UNDER_SURVEILLANCE`.

---

## 19. QA plan with acceptance criteria

Every criterion is measurable and most are automatable in the existing harness (`node --test` + Playwright).

| # | Test | Acceptance criterion | Automatable |
|---|---|---|---|
| 1 | Graph connectivity | Every location reachable from `stoop` without secret routes | ✅ node |
| 2 | No dead ends | Every location degree ≥ 2 | ✅ node |
| 3 | Scenario coverage | Every location has ≥ 1 scenario | ✅ node |
| 4 | No clustering | No location has > 2 scenarios | ✅ node |
| 5 | Art coverage | Every location has a sprite or a documented null | ✅ node (shipped) |
| 6 | Route roles | All 6 roles present, each with ≥ 1 route | ✅ node |
| 7 | NPC routines | Every named NPC has all 5 time blocks defined | ✅ node |
| 8 | NPC reachability | Every routine location is route-connected | ✅ node |
| 9 | Rumor targets | Every `reveals` names a real scenario | ✅ node |
| 10 | Chain integrity | Every chain node is a real scenario id | ✅ node |
| 11 | Consequence visibility | Every Permanent consequence names a real POI | ✅ node |
| 12 | Screen fit | `#blockMap` overflow = 0 at 1280×720 and 1920×1080 | ✅ Playwright (shipped) |
| 13 | Aspect | Canvas ratio 1.78 at both viewports | ✅ Playwright (shipped) |
| 14 | Zero console errors | 0 errors, 0 failed requests on map load | ✅ Playwright (shipped) |
| 15 | Travel time | Stoop → Miami Cut ≤ 4 time units by any route | ✅ node |
| 16 | Soft lock | No scenario requires an NPC whose routine never visits its location | ✅ node |
| 17 | Hard lock | No route gated on a scenario that is itself gated behind that route | ✅ node |
| 18 | Readability | 10 testers place 8/12 locations on a blank map after 20 min | ❌ manual |
| 19 | Pacing | Median time to first scenario < 90 s | ❌ manual |
| 20 | Steam Deck | Playable at 1280×800, all text ≥ 8px, no overflow | ✅ Playwright + manual |
| 21 | Controller | Every action reachable without a pointer | ❌ manual |
| 22 | Palette | No sprite introduces a colour outside the 101 ramps | ✅ node |
| 23 | Performance | Map frame < 16 ms at 1080p on integrated graphics | ❌ manual |
| 24 | Replay | Two runs of A-first vs C-first differ in ≥ 4 scenario outcomes | ❌ manual |

Tests 1–11 and 15–17 and 22 are **new and should be written as `test/level-the-block.test.js`** — pure data validation against the shipped level file, no browser needed. They would have caught §16-A, B, D at authoring time.

---

## 20. Edge cases and failure conditions

| Case | Handling |
|---|---|
| Player has no CASH for any route | The social west loop costs 1; `miami_roof` and secret routes cost 0. Movement is never blocked. |
| Player at Miami Cut with HEAT 10 | `miami_roof` remains available (it is the escape valve). Detention costs a block, never a run. |
| All NPCs at one location | Impossible by routine design — no time block has more than 3 NPCs co-located. Asserted by QA #7. |
| Scenario requires an absent NPC | QA #16 fails at authoring time. |
| Rumor reveals a completed scenario | Rumor resolves to a callback line rather than an unlock. |
| Weather disables the only route | STORM closes the escape route but never the primary; asserted by QA #1 under every weather state. |
| Player never talks to Gram | `stash_whisper` also drops from the Blue Plate at LATE_NIGHT, at higher cost. No content is permanently missable. |
| Save during a scene | Playback is deterministic from `(scenario, cards)`; the scene replays from its beat index. |
| Two consequences target the same POI | Last write wins, and the ledger records both. The POI shows the most recent. |

---

## 21. Production plan

### MVP scope (3 sprints)

**Sprint 1 — structural fixes.** Ship §16-A/B/D/E: five routes, two scenarios, `precinct` district assignment. Write `test/level-the-block.test.js` (QA 1–11, 15–17). Zero new art. *This sprint alone makes the shipped level structurally sound.*

**Sprint 2 — the dead data.** Extend `loadLevel` for `pois` and `consequence_matrix`. Author 24 POIs. Build `scripts/process-poi-decals.sh` and the 8×3 decal sheet. Render decals in `_drawLocations`. Extend the consequence matrix to all 8 major scenarios.

**Sprint 3 — art and polish.** Author the two missing buildings. Wire `the_steps_watch` and `gram_asks` playback. Time-of-day location variants for the six highest-traffic locations. Manual QA 18–24.

### Post-MVP
Interior scenes for Blue Plate and Miami Cut · NPC pathing animation along routes · dynamic faction territory shading · a second level reusing this schema (the courier thread already seeds it).

### Development order
Data → validation tests → loader → render → art. Art last, deliberately: every structural problem in §16 was invisible while the art was the thing being looked at.

---

## 22. Final design test

| Question | Answer |
|---|---|
| Can the player understand the geography? | Yes — one west→east danger axis, 12 locations, 5 districts |
| Can they make meaningful route decisions? | Yes — 6 roles differing in time, cost, danger and gate |
| Can they discover scenarios organically? | Yes — 3 channels (overheard, observed, told); no marker-only reveals |
| Can the same location produce different experiences? | Yes — time, weather, story state, NPC position, faction control |
| Can cards meaningfully alter gameplay? | Yes — 12 documented geographic effects; flavour-only cards are cut |
| Can Scene Playback dramatize those choices? | Yes — HOW card selects escalation animation; de-escalation shortens the scene |
| Can consequences visibly change the level? | Yes — every Permanent consequence names a POI |
| Can NPCs create emergent encounters? | Yes — Luna crosses the map daily; Reyes patrols `precinct_blue` |
| Interesting after one playthrough? | Yes — A/B/C ordering recolours the midpoint; ledger motifs carry across runs |
| Buildable by a small team? | Yes — 2 buildings + 1 decal sheet of new art; everything else ships |
| Producible with modular Aseprite assets? | Yes — 3 `.aseprite` files, existing `process-*.sh` pattern |
| Does the system scale to more levels? | Yes — the level is pure data against a documented 20-field schema |

**No answer is NO. Design approved for production.**

---

## Appendix — Godot port mapping

For the eventual port. The level is pure data, so the port is renderer-and-input work only.

| Runtime concept | Godot 4.5 equivalent |
|---|---|
| `MAP_LEVEL` data | `LevelData` custom `Resource` (`.tres`) |
| `dynamic-map-state` | Autoload singleton |
| Canvas layered draw | `CanvasLayer` per depth band |
| Ground tile | `TileMapLayer` + `TileSet`, 48×48 |
| Location sprite | `Sprite2D` in a `Location` scene, one prefab |
| POI decal | `Sprite2D` child of the location prefab |
| Route | `Line2D` + `Area2D` for hover |
| NPC | `CharacterBody2D` + `AnimatedSprite2D`, `NavigationAgent2D` on routes |
| Scene playback camera | `Camera2D` + `AnimationPlayer` per preset |
| Weather | `GPUParticles2D` (rain), `CanvasModulate` (tint) |
| Palette swap | `godot/shaders/palette_swap.gdshader` — already written |
| Pixel-perfect scaling | `godot/scripts/PixelPerfectCamera.gd` — already written |
| Consequence signals | Godot `signal` on the state singleton |

**Port cost estimate:** the four existing `.gd` files cover camera and palette. The remaining work is the location prefab, the route line, the NPC agent and the scene camera — roughly one sprint, because no design decision has to be remade.
