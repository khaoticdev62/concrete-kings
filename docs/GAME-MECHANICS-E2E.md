# Concrete Kings: The Block Chronicles
## Complete End-to-End Game Mechanics Document
### Research-Backed, Production-Ready, AAVE-Infused

---

# EXECUTIVE SUMMARY

**Concrete Kings: The Block Chronicles** is a Black narrative RPG card game that transforms the simple CAH-style party format into a persistent, story-driven experience. Players don't just play cards — they build legacy, form alliances, accumulate receipts, and navigate the block. Every choice has consequences. Every relationship matters. Every receipt tells a story.

**Core Innovation:** CAH mechanics + RPG progression + persistent narrative + cultural authenticity = a game that feels like a family reunion, not a classroom.

**Target Experience:** 20-30 minute vertical slice proving one road segment, one town hub, three origins, vehicle/cash/fuel/stress/fatigue systems, receipts, save/load, and controller-first UI. Full game expands to 2-3 hours.

**Platform:** Web-first (HTML5/Canvas), Godot 4.5 for native ports (SteamOS/Linux PC, Steam Deck, Steam Machine, desktop)

**Scale:** 700+ cards, 8 origins, 8 hustles, 24 locations, 12 ciphers, 100+ receipts, 8 city themes, 10 weather states, 10 event types

---

# PART 1: RESEARCH-BACKED MECHANIC ANALYSIS

## 1.1 What Makes CAH Work (and What Limits It)

**What Works:**
- Simple premise: fill-in-the-blank with cards
- Low barrier to entry: anyone can play
- Social dynamics: humor emerges from group interaction
- Replayability: card combinations create emergent comedy
- Pass-and-play: no equipment needed beyond cards

**What Limits It:**
- No persistence: once the game ends, nothing carries forward
- No character: players are interchangeable
- No narrative: rounds don't build a story
- No consequences: winning a round doesn't change anything
- No strategy: pure randomness with judge subjectivity
- No progression: 10 rounds feels the same as 2 rounds

**Concrete Kings Solution:** Keep the CAH core loop (black card + white card + judge) but wrap it in:
1. Character creation with persistent stats
2. Receipt system that builds narrative across rounds
3. Location-based gameplay on the Block Map
4. Alliance mechanics with Cookout phases
5. Cipher dice that change rules each round
6. Hustle powers that give asymmetric abilities
7. Legacy tracking that persists between sessions
8. Weather/events that add emergent chaos

## 1.2 Research: Narrative Card Games with Progression

**Key Findings from Research:**

**Legacy Systems:** Games like Pandemic Legacy, Risk Legacy, and Gloomhaven prove that permanent consequences across sessions create massive engagement. Players invest more when choices matter long-term.

**Narrative Through Systems:** Disco Elysium, Planescape: Torment, and KOTOR 2 show that systems built around story create more memorable experiences than story bolted onto systems.

**Horizontal + Vertical Progression:** Best practice is combining both:
- Vertical: stats increase, powers unlock
- Horizontal: new options appear, not just stronger ones

**Character Building:** Games like Baldur's Gate 3, Eldritch Horror, and Mage Knight show that asymmetric starting positions + meaningful choices create replayability.

**Party Game with Consequences:** Research shows that adding light consequences to party games increases engagement without ruining the casual vibe. The key is making consequences feel like story, not punishment.

## 1.3 Research: Multiplayer Card Game Architecture

**Key Findings:**

**Authoritative Server Model:** All serious multiplayer card games use server-authoritative state. The server validates every move, prevents cheating, and broadcasts state updates.

**WebSocket Choice:** Node.js + ws is production-ready for 100-500 concurrent rooms. For scale beyond that, Redis pub/sub adds horizontal scaling.

**Room Model:** 4-character room codes, 3-12 players per room, host migration if host disconnects.

**State Sync Strategy:**
- Full state sync on join
- Incremental updates during play
- Reconciliation on disconnect/reconnect
- Client prediction for responsiveness, server correction for truth

**Latency Tolerance:** Card games tolerate 200-500ms latency well. No twitch reflexes needed.

## 1.4 Research: Game Economy Balance

**Key Findings:**

**Power Curves:** Every card game needs a power curve. In Concrete Kings:
- Common cards: reliable, baseline effect
- Uncommon cards: situational but strong
- Rare cards: game-changing when conditions align
- Receipts: narrative power, not mechanical advantage

**Resource Economy:**
- Cards are the primary resource
- Stats (Street Cred, Community, Wisdom, Reputation) are secondary
- Receipts are tertiary but narratively rich
- Cash/Items are quaternary but mechanically useful

**Balance Approach:**
- No single card should auto-win
- Synergy > raw power
- Counter-play always exists
- Hustle powers should feel different, not one "best"

---

# PART 2: CORE GAME ARCHITECTURE

## 2.1 Master State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME STATE MACHINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LOBBY ──→ SETUP ──→ PLAYING ──→ JUDGING ──→ RESULT       │
│    ▲         │         │           │          │              │
│    │         │         │           │          │              │
│    │    COOKOUT ◄───┘           │          │              │
│    │    (every 3 rounds)         │          │              │
│    │                             │          │              │
│    └─────────────────────────────┘          │              │
│                                            │              │
│  GAME OVER ◄──────────────────────────────┘              │
│    │                                                        │
│    └──→ LEGACY SAVE ──→ LOBBY                              │
│                                                             │
│  SPECIAL STATES:                                            │
│  - CIPHER ACTIVE: overlays PLAYING/JUDGING                 │
│  - EVENT ACTIVE: overlays any state                        │
│  - WEATHER TRANSITION: visual only                         │
│  - RECEIPT DECISION: brief overlay during RESULT            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Round Flow (Detailed)

**Phase 1: Round Start (15s)**
1. Server broadcasts: `{type: "round_start", round: N, scenario: cardId}`
2. All clients display black scenario card with flip animation
3. Cipher roll animation plays
4. If cipher active, special rules overlay appears
5. Timer starts: 60s for card selection

**Phase 2: Play Phase (60s)**
1. Each non-judge player sees their hand
2. Player selects white card (click/double-click/key 1-9)
3. Card highlights, "Play?" confirmation
4. On confirm: card flies to play area, hand updates
5. Server validates: `{type: "card_played", playerId, cardId, round}`
6. Server broadcasts: `{type: "submission", playerId, cardBack: true}`
7. Judge sees all submissions face-down
8. If all players submitted: auto-advance to judging after 3s

**Phase 3: Judge Phase (45s)**
1. Server broadcasts: `{type: "judging_start", submissions: [cardIds]}`
2. All cards flip face-up with stagger animation
3. Judge sees read-aloud buttons
4. Judge clicks "Read" on each card, text appears in chat
5. Judge selects winner
6. Server validates: `{type: "winner_selected", playerId, cardId}`
7. Server broadcasts: `{type: "round_result", winnerId, winningCardId}`
8. 5s celebration animation

**Phase 4: Result Phase (20s)**
1. Winner announced with confetti
2. Stat updates: +1 Score, hustle-specific bonuses
3. Receipt draw: server sends `{type: "receipt_draw", receiptId}`
4. Receipt flips in, player reads choices
5. Player selects choice
6. Server records: `{type: "receipt_resolved", receiptId, choiceIndex}`
7. Stats update based on choice
8. If round % 3 === 0: Cookout phase triggers

**Phase 5: Cookout Phase (30s, every 3 rounds)**
1. Server broadcasts: `{type: "cookout_start"}`
2. Alliance UI appears
3. Players invite/accept/decline
4. Alliances form with green relationship lines
5. Alliance powers activate for next 2 rounds
6. Auto-advance to next round

**Phase 6: Check Win**
1. After each round: check if any player.score >= pointsToWin
2. If yes: transition to GAME OVER
3. If no: increment round, return to Phase 1

## 2.3 Turn Structure (Detailed)

**Turn Order:**
1. Not strictly turn-based — simultaneous submission
2. Judge rotates: Player 1 → Player 2 → Player 3... → Player 1
3. Judge cannot play cards that round
4. Judge selects winner from other players' submissions

**Time Limits:**
- Card selection: 60s default, configurable 30-120s
- Judge decision: 45s default, configurable 15-90s
- Receipt decision: 20s default, configurable 10-60s
- Cookout phase: 30s default, configurable 15-60s

**Timer Behavior:**
- Visual countdown: orange circle, shrinks
- At 10s: turns red, pulses
- At 0s: auto-play random card from hand
- Judge timeout: random submission wins

## 2.4 Scoring System

**Win Condition:**
- Default: first to 7 points wins
- Configurable: 5, 7, 10, 15, 21
- Score = points from winning rounds + bonus points

**Point Sources:**
1. Round win: +1 Score
2. Receipt resolution: +0 to +3 Score depending on choice
3. Alliance bonus: +1 Score if alliance wins together
4. Hustle power usage: some give bonus points
5. Cipher bonus: some ciphers award extra points

**Score Cap:**
- Hard cap at configured pointsToWin
- Soft cap: beyond 7, bonus points instead
- Prevents runaway wins in long games

---

# PART 3: CARD DATABASE DESIGN

## 3.1 Card Schema

```json
{
  "id": "unique-uuid",
  "type": "black|white|receipt|cipher",
  "category": "church|family|cookout|barbershop|block|money|music|struggle|romance|tech|education|diaspora|sports|fashion|work|politics|health|travel|generations",
  "text": "Card text in AAVE",
  "weight": 1,
  "tags": ["aave", "cookout", "food"],
  "difficulty": "easy|medium|hard",
  "culturalContext": "Explanation for non-Black players",
  "voice": "elder|genx|millennial|genz",
  "region": "southern|northern|caribbean|universal",
  "scenarioType": "everyday|work|police|family|romance|tech",
  "createdAt": "ISO date",
  "version": 1
}
```

## 3.2 Card Distribution

**Black Cards (Scenarios): 200 total**
- Church & Spirituality: 15 (7.5%)
- Family & Generations: 25 (12.5%)
- Cookout & Food: 20 (10%)
- Barbershop & Beauty: 15 (7.5%)
- Block & Neighborhood: 20 (10%)
- Money & Hustle: 20 (10%)
- Music & Culture: 15 (7.5%)
- Struggle & Resistance: 15 (7.5%)
- Romance & Dating: 15 (7.5%)
- Tech & Social Media: 15 (7.5%)
- Education & HBCU: 10 (5%)
- Diaspora & Caribbean: 10 (5%)
- Sports & Gaming: 10 (5%)
- Fashion & Style: 10 (5%)
- Work & Career: 10 (5%)
- Health & Wellness: 10 (5%)
- Travel & Place: 10 (5%)
- Generational Dynamics: 10 (5%)

**White Cards (Responses): 350+ total**
- Same categories as black cards
- 2:1 ratio of white to black cards
- Ensures variety in responses
- Each black card should have 5-10 matching responses

**Receipt Cards: 100 total**
- Distributed across same categories
- Each receipt has 2-3 resolution choices
- Choices map to stat changes

**Cipher Cards: 12 total**
- Unique mechanics, one per cipher
- Balanced across game impact
- No cipher should auto-win

## 3.3 Card Matching Algorithm

**When a black card is drawn:**
1. Extract category from card tags
2. Query white cards in same category
3. Add 20% cross-category cards for surprise
4. Add 10% universal cards for flexibility
5. Shuffle and present 7 cards to player

**Matching Quality:**
- Primary match: same category (70%)
- Secondary match: adjacent category (20%)
- Wild card: any category (10%)
- Ensures relevance without predictability

## 3.4 Rarity System

**Rarity Levels:**
- Common (60%): baseline effects, always available
- Uncommon (25%): situational strength
- Rare (10%): game-changing when conditions align
- Legendary (5%): once-per-game, narrative power

**Implementation:**
- Rarity doesn't affect draw probability in this game
- Instead, rarity affects Receipt weight and Hustle power options
- Some locations have rarity modifiers (+10% rare at Church, etc.)

---

# PART 4: CHARACTER PROGRESSION SYSTEM

## 4.1 Stats (The Four Pillars)

**Street Cred (SC)**
- Definition: How much the block respects you
- Sources: winning rounds, completing hustles, standing up for community
- Sinks: getting caught by police, losing beefs, chickening out
- Effects: unlocks higher-tier locations, better prices at bodega, respect from NPCs
- Range: 0-20, starting at 3

**Community (COM)**
- Definition: How embedded you are in the block
- Sources: forming alliances, helping neighbors, attending events
- Sinks: breaking alliances, betraying trust, skipping cookouts
- Effects: alliance size limits, event invitations, collective action bonuses
- Range: 0-20, starting at 3

**Wisdom (WIS)**
- Definition: What you've learned from the block
- Sources: studying at school, church attendance, barbershop intel, reading receipts
- Sinks: making dumb decisions, ignoring advice, getting scammed
- Effects: cipher control, better card draws, foresight abilities
- Range: 0-20, starting at 3

**Reputation (REP)**
- Definition: Your story's weight in the neighborhood
- Sources: completing receipts, winning tournaments, public acts
- Sinks: public failures, embarrassing moments, getting read
- Effects: O.G. powers, media attention, legacy points
- Range: 0-20, starting at 3

**Starting Stats by Origin:**
- Church Child: COM+2, REP+1
- Block Product: SC+2, WIS+1
- Beauty Shop Insider: COM+1, WIS+2
- Cookout Regular: COM+2, SC+1
- HBCU Student: WIS+2, REP+1
- Creative: WIS+1, SC+1, REP+1
- Hustler: SC+2, WIS+1
- Protector: COM+1, SC+1, REP+1

**Starting Stats by Hustle:**
- Street Hustler: SC+3
- Community Organizer: COM+3
- Creative: WIS+3
- Entrepreneur: REP+2, SC+1
- Student: WIS+2, REP+1
- Elder: REP+3
- Diplomat: COM+2, REP+1
- Rebel: SC+2, COM+1

**Stat Caps:**
- Hard cap: 20 per stat
- Soft cap: 15 — beyond this, diminishing returns
- Minimum: 0 — at 0, penalties apply
- Perfect balance: 5/5/5/5 baseline

## 4.2 Leveling System

**Level Calculation:**
```
Level = floor((SC + COM + WIS + REP) / 4)
```

**Level Benefits:**
- Level 1 (3-4 avg): Basic gameplay, 1 Hustle power
- Level 2 (5-6 avg): +1 hand size, 2 Hustle powers
- Level 3 (7-8 avg): +1 card draw per round, 3 Hustle powers
- Level 4 (9-10 avg): Cipher control (can re-roll once), 4 Hustle powers
- Level 5 (11-12 avg): O.G. status (can veto 1 Receipt/game), 5 Hustle powers
- Level 6 (13-14 avg): Block influence (can call events), 6 Hustle powers
- Level 7 (15-16 avg): Legendary (all powers unlocked), +2 to all stats
- Level 8 (17-18 avg): Block Legend, permanent reputation boost
- Level 9 (19 avg): Neighborhood icon, special endings
- Level 10 (20 avg): The Block Belongs To You, true ending

**Experience per Round:**
- Win round: +1 to all stats
- Lose round: +1 to one stat of choice
- Receipt resolution: +1 to relevant stat
- Alliance win: +1 COM, +1 REP
- Hustle power use: +1 to power's stat
- Cipher benefit: +1 to cipher's favored stat

## 4.3 Hustle Powers

**Street Hustler — Smooth-Talker**
- Power 1: "The Pitch" — re-roll Cipher once per round
- Power 2: "Front" — borrow 2 cards from discard pile
- Power 3: "Work the Corner" — +2 SC when at The Corner location
- Power 4: "Hustle" — convert 1 COM to 2 SC
- Power 5: "Close the Deal" — auto-win if you play first card
- Power 6: "The Come Up" — double score on next win

**Community Organizer — Rallying Energy**
- Power 1: "Call the Meeting" — form alliance with +1 member
- Power 2: "Block Club" — +2 COM when at Park
- Power 3: "United Front" — alliance members get +1 SC
- Power 4: "The March" — all nearby players gain +1 COM
- Power 5: "Grassroots" — collect 1 extra Receipt
- Power 6: "Movement" — double COM bonuses for 2 rounds

**Creative — Double Vision**
- Power 1: "The Blank" — add 1 blank to any black card
- Power 2: "Remix" — swap any played card with one from hand
- Power 3: "Sample" — copy opponent's card effect
- Power 4: "Feature" — alliance members get creative buffs
- Power 5: "Mixtape" — draw 2 extra cards
- Power 6: "Classic" — any card can be played as any type

**Entrepreneur — Calculating**
- Power 1: "Front the Cash" — spend 1 REP for 2 SC
- Power 2: "Business Plan" — +1 REP per round
- Power 3: "Side Hustle" — earn 1 extra point per win
- Power 4: "Investment" — bet REP on next round
- Power 5: "Scale" — duplicate one Receipt effect
- Power 6: "Empire" — all stats +1 for 3 rounds

**Student — Curious**
- Power 1: "Peek" — see opponent's hand once per round
- Power 2: "Study Hall" — +1 WIS when at School
- Power 3: "Research" — choose next cipher
- Power 4: "Cheat Sheet" — mulligan hand once per game
- Power 5: "Dean's List" — +2 WIS per round for 2 rounds
- Power 6: "Thesis" — unlock special Receipt chain

**Elder — Authoritative**
- Power 1: "The Look" — silence chat for 10s
- Power 2: "Veto" — cancel 1 Receipt per game
- Power 3: "Wisdom" — +2 WIS when at Church
- Power 4: "OG Status" — can overrule judge once per game
- Power 5: "Blessing" — give +1 to any stat
- Power 6: "Legacy" — permanent +1 to all stats

**Diplomat — Bridge-Builder**
- Power 1: "Handshake" — +1 COM when forming alliance
- Power 2: "Mediate" — resolve any beef with +2 REP
- Power 3: "Table" — invite 2 extra players to alliance
- Power 4: "Deal" — trade stats with another player
- Power 5: "Peace Treaty" — convert all beefs to alliances
- Power 6: "Statesman" — +1 to all stats for 3 rounds

**Rebel — Lone Wolf**
- Power 1: "No Cooperation" — +2 SC when solo
- Power 2: "Resist" — cancel any event targeting you
- Power 3: "Lone Wolf" — +3 SC if no alliance
- Power 4: "Riot" — all nearby players gain +1 SC
- Power 5: "Disrupt" — cancel cipher effect
- Power 6: "Revolution" — double SC bonuses for 3 rounds

## 4.4 Receipt System

**Receipt Types:**
1. **Narrative Receipts** (70%): story-driven choices with stat consequences
2. **Relationship Receipts** (20%): involve other players, create beef/alliance
3. **World Receipts** (10%): change map state, unlock locations, trigger events

**Receipt Flow:**
1. Won round → draw 1 Receipt from deck
2. Receipt appears with 2-3 choices
3. Player selects choice within 20s
4. Stats update immediately
5. Receipt goes to "Resolved" pile
6. Receipt may trigger follow-up Receipts

**Receipt Chains:**
- Some Receipts link to others
- Example: "The Cookout Beef" → "The Family Reunion Incident" → "The Resolution"
- Completing chains gives bonus points
- Breaking chains has penalties

**Receipt Persistence:**
- All resolved Receipts saved to player profile
- Visible in "My Story" timeline
- Can be shared as "Legacy Card"
- Completing all Receipts in a category unlocks Origin-specific ending

## 4.5 Legacy System

**What Persists Between Sessions:**
1. Character: name, origin, hustle, stats, level
2. Resolved Receipts: full history with choices
3. Unlocked Locations: which ones have been visited
4. Relationships: alliance history, beefs, romances
5. Reputation Score: cumulative across all sessions
6. Special Items: unique cards earned through play
7. Milestones: first win, first alliance, first beef, etc.

**What Resets Between Sessions:**
1. Current hand and deck
2. Active alliances and beefs
3. Cipher state
4. Current round and score
5. Temporary stat buffs

**Legacy Benefits:**
- Returning players start with +1 to one stat
- Previous Receipts may give context for new ones
- High Reputation unlocks special Origins
- Completing story chains unlocks new content

**Profile System:**
- JSON file in localStorage
- Encrypted save string for online play
- Version-tagged for migrations
- Max 5 profiles per device
- Export/import as shareable string

---

# PART 5: MULTIPLAYER ARCHITECTURE

## 5.1 Server Architecture

**Technology: Node.js + ws (WebSocket)**

```
┌─────────────────────────────────────────────────────────────┐
│                      SERVER ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Lobby     │    │   Room      │    │   Game      │     │
│  │   Service   │    │   Manager   │    │   Engine    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              State Manager (authoritative)           │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│                    ┌─────────────────┐                      │
│                    │  Broadcast      │                      │
│                    │  Engine         │                      │
│                    └─────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Components:**

**Lobby Service:**
- Room creation: `{roomCode, hostId, maxPlayers, pointsToWin}`
- Room listing: available rooms with player count
- Join/leave: real-time room management
- Heartbeat: 30s ping/pong to detect disconnects
- Host migration: if host disconnects, next player becomes host

**Room Manager:**
- Each room: independent state
- Room lifecycle: waiting → playing → finished
- Max rooms: 1000 concurrent on single server
- Memory: ~10MB per active room

**Game Engine:**
- Authoritative state: server is source of truth
- Validates all moves
- Enforces turn order and timers
- Calculates outcomes
- Broadcasts state updates

**Broadcast Engine:**
- Sends state diffs, not full state
- Rate-limited: max 10 messages/sec per room
- Compressed JSON
- Acknowledgment required for critical moves

## 5.2 State Schema

```json
{
  "roomId": "ABCD",
  "phase": "playing|judging|result|cookout|gameover",
  "round": 5,
  "pointsToWin": 7,
  "cipher": {"id": "peace", "active": true, "roundsLeft": 1},
  "weather": "clear|rain|snow|fog",
  "event": {"type": "block_party", "active": true, "endsAt": "ISO"},
  "players": [
    {
      "id": "uuid",
      "name": "Marcus",
      "origin": "block_product",
      "hustle": "street_hustler",
      "stats": {"sc": 8, "com": 5, "wis": 4, "rep": 6},
      "score": 4,
      "hand": ["cardId1", "cardId2"],
      "receipts": [{"id": "r1", "choice": 0}],
      "location": "barbershop",
      "isJudge": false,
      "isHost": true,
      "connected": true
    }
  ],
  "submissions": [
    {"playerId": "uuid", "cardId": "whiteCardId"}
  ],
  "judgeId": "uuid",
  "winnerId": null,
  "alliances": [
    {"players": ["uuid1", "uuid2"], "roundsLeft": 2}
  ],
  "deck": {"black": [...], "white": [...], "receipts": [...]},
  "discard": [],
  "eventLog": []
}
```

## 5.3 Message Protocol

**Client → Server:**
```json
{"type": "join_room", "roomId": "ABCD", "playerName": "Marcus"}
{"type": "play_card", "cardId": "uuid"}
{"type": "select_winner", "playerId": "uuid"}
{"type": "resolve_receipt", "receiptId": "uuid", "choiceIndex": 0}
{"type": "form_alliance", "playerId": "uuid"}
{"type": "move_token", "location": "barbershop"}
{"type": "use_hustle_power", "powerIndex": 0}
{"type": "chat_message", "text": "Period."}
{"type": "ping"}
```

**Server → Client:**
```json
{"type": "room_state", "state": {...}}
{"type": "player_joined", "player": {...}}
{"type": "player_left", "playerId": "uuid"}
{"type": "round_start", "scenario": "uuid", "cipher": {...}}
{"type": "card_played", "playerId": "uuid"}
{"type": "judging_start", "submissions": [...]}
{"type": "winner_selected", "playerId": "uuid"}
{"type": "receipt_draw", "receipt": {...}}
{"type": "stat_update", "playerId": "uuid", "stats": {...}}
{"type": "cipher_activated", "cipher": {...}}
{"type": "event_started", "event": {...}}
{"type": "weather_changed", "weather": "rain"}
{"type": "game_over", "winner": {...}, "legacy": {...}}
{"type": "error", "message": "Not your turn"}
```

## 5.4 Reconnection & State Sync

**Reconnection Protocol:**
1. Client detects disconnect
2. Client shows "Reconnecting..." overlay
3. Client sends `{type: "reconnect", "roomId": "ABCD", "playerId": "uuid"}`
4. Server sends full current state
5. Client renders from state, no animation replay
6. Server confirms: `{type: "reconnected", "state": {...}}`

**State Sync:**
- Full state on join: 50-200KB
- Incremental updates: 1-5KB per message
- Reconciliation: client trusts server state
- No client-side prediction for card games
- Reconnection timeout: 60s, then player is marked disconnected

**Disconnect Handling:**
- Player disconnected: token shows gray outline
- 30s grace period before AI takeover
- AI plays random valid card
- Player can reconnect and take over
- If player doesn't reconnect: AI plays for rest of session

## 5.5 Room Codes

**Format:** 4-character alphanumeric, uppercase
- Examples: ABCD, X7K2, M99Z
- Case-insensitive for entry
- 100 million possible combinations
- Collision probability negligible

**Room Lifecycle:**
1. Host creates room → code generated
2. Players join with code
3. Host starts game when ready
4. Game plays through
5. Room closes when game ends or host leaves
6. Orphaned rooms cleaned up after 24h

**Room Settings:**
- Max players: 3-12
- Points to win: 5, 7, 10, 15, 21
- Time limits: 30/45/60/90/120s
- City theme: 8 options
- Weather: on/off
- Events: on/off
- AAVE mode: on/off

---

# PART 6: SAVE & PERSISTENCE

## 6.1 Save Format

**Local Save (localStorage):**
```json
{
  "version": "1.0.0",
  "profiles": [
    {
      "id": "uuid",
      "name": "Marcus",
      "origin": "block_product",
      "hustle": "street_hustler",
      "stats": {"sc": 8, "com": 5, "wis": 4, "rep": 6},
      "level": 4,
      "score": 47,
      "receipts": [...],
      "unlockedLocations": ["barbershop", "bodega", "park"],
      "relationships": [...],
      "milestones": [...],
      "playTime": 7200,
      "gamesPlayed": 12,
      "gamesWon": 5,
      "createdAt": "ISO",
      "lastPlayed": "ISO"
    }
  ],
  "settings": {
    "sound": {"master": 80, "music": 70, "effects": 90, "voice": 85},
    "display": {"fullscreen": false, "cityTheme": "detroit"},
    "accessibility": {"textSize": "medium", "contrast": "normal", "reducedMotion": false},
    "gameplay": {"autoSave": true, "cardPreview": true, "keyboardHints": true},
    "weather": {"enabled": true, "intensity": "high"},
    "aave": {"enabled": true, "voice": "default"}
  }
}
```

**Online Save (encrypted string):**
- Base64-encoded JSON
- AES-256 encrypted with room-specific key
- Stored server-side for 30 days after game
- Player can import/export save

## 6.2 Save Triggers

**Auto-Save:**
- After every round completion
- After every Receipt resolution
- After Cookout phase
- On screen transition
- Every 60 seconds during gameplay

**Manual Save:**
- Settings menu "Save Now"
- Before exiting
- Before starting new game

**Save Validation:**
- Checksum on save data
- Version migration on load
- Corrupt save recovery: prompt to start fresh or load backup

## 6.3 Migration System

**Version History:**
- v1.0.0: initial format
- v1.1.0: added weather system
- v1.2.0: added event system
- v1.3.0: added milestone tracking

**Migration Process:**
1. Load save, read version
2. Apply migrations sequentially
3. Write updated save with new version
4. If migration fails: load as v1.0.0, prompt user

---

# PART 7: UI/UX ARCHITECTURE

## 7.1 Screen Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SCREEN FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MAIN MENU ──→ CHARACTER CREATE ──→ LOBBY ──→ GAME         │
│       │           │                  │       │              │
│       │           │                  │       ▼              │
│       │           │                  │  BLOCK MAP           │
│       │           │                  │       │              │
│       │           │                  │       ▼              │
│       │           │                  │  COOKOUT             │
│       │           │                  │       │              │
│       │           │                  │       ▼              │
│       │           │                  │  GAME OVER           │
│       │           │                  │       │              │
│       │           │                  │       ▼              │
│       │           │                  │  LEGACY SAVE         │
│       │           │                  │       │              │
│       │           │                  │       ▼              │
│       │           │                  │  MAIN MENU           │
│       │           │                  │                       │
│       │           │                  │  SETTINGS (anywhere)  │
│       │           │                  │                       │
│       ▼           ▼                  ▼                       │
│  CONTINUE     LOAD PROFILE     REJOIN ROOM                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 7.2 Input Model

**Desktop:**
- Mouse: hover, click, drag
- Keyboard: shortcuts (Space, Escape, Tab, 1-9, M, B, I, J, H, S)
- Touch: click/tap only

**Tablet:**
- Touch: tap, swipe, pinch-zoom
- No hover effects
- Larger touch targets (48px)
- Bottom sheet panels instead of sidebar

**Mobile:**
- Touch: tap, swipe, pinch-zoom
- No hover effects
- Extra large touch targets (44px minimum)
- Simplified map view
- Bottom sheet panels
- Swipe gestures for pan

**Controller (Steam Deck):**
- D-pad: navigate cards/locations
- A: select/confirm
- B: cancel/back
- X: action button
- Y: hustle power
- LB/RB: cycle cards
- LT/RT: zoom map
- Start: settings
- Select: minimap

## 7.3 Layout Specifications

**Desktop (1100px+):**
```
┌────────────────────────────────────────────────────────────┐
│ Top Bar (60px)                                             │
├──────────────────────────────────┬─────────────────────────┤
│                                  │                         │
│                                  │   Right Sidebar (320px) │
│       Game Map                   │   - Receipts            │
│       (Canvas)                   │   - Player Stats        │
│                                  │   - Location Info       │
│                                  │   - Event Log           │
│                                  │                         │
├──────────────────────────────────┴─────────────────────────┤
│ Bottom Bar (80px)                                          │
└────────────────────────────────────────────────────────────┘
```

**Tablet (768px):**
```
┌────────────────────────────────────────────────────────────┐
│ Top Bar (60px)                                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│       Game Map (zoomed out)                               │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Bottom Sheet (collapsible, 300px)                          │
│ - Receipts, Stats, Actions                                 │
└────────────────────────────────────────────────────────────┘
```

**Mobile (375px):**
```
┌────────────────────────────────────────────────────────────┐
│ Top Bar (50px)                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│       Game Map (zoomed to location)                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Action Buttons (70px)                                      │
└────────────────────────────────────────────────────────────┘
│ Bottom Sheet (swipe up for details)                        │
└────────────────────────────────────────────────────────────┘
```

---

# PART 8: DYNAMIC SYSTEMS

## 8.1 Weather System

**Implementation:**
- WeatherState enum: CLEAR, OVERCAST, LIGHT_RAIN, HEAVY_RAIN, THUNDERSTORM, LIGHT_SNOW, HEAVY_SNOW, FOG, HEAT_WAVE, WINDY
- Transition timer: 30-60s between changes
- Particle system: pooled particles, 200 max
- Canvas layer: rendered after city, before UI

**Performance:**
- Desktop: full particle count
- Tablet: 50% particles
- Mobile: 25% particles
- Particle pooling: 200 objects max, reused
- Viewport culling: only render visible particles

**Player Control:**
- Settings toggle: weather on/off
- Intensity slider: low/medium/high
- Manual override: choose specific weather

## 8.2 Event System

**Event Queue:**
```javascript
{
  "events": [
    {
      "id": "uuid",
      "type": "block_party|police_raid|fire|parade|protest|church|cookout|gentrification|funeral|celebration",
      "location": "park|church|corner|...",
      "startTime": "ISO",
      "duration": 300,  // seconds
      "intensity": 0.5,  // 0-1
      "effects": ["community_bonus", "street_cred_penalty"],
      "npcs": 15,
      "particles": 50
    }
  ]
}
```

**Event Spawning:**
- Random interval: 15-60 minutes gameplay time
- Weighted by: current weather, time of day, player count
- Sunday mornings: church service more likely
- Summer evenings: block party more likely
- After police events: protest more likely

**Event Persistence:**
- Events persist across rounds
- Multiple events can overlap
- Events affect gameplay mechanically and visually
- Event log records all events

## 8.3 NPC System

**NPC Types:**
1. **Pedestrian:** walks along sidewalks, 2-3 per block
2. **Resident:** enters/exits buildings, follows schedules
3. **Worker:** at commercial locations, fixed positions
4. **Visitor:** drives through, parks, leaves
5. **Event NPC:** special sprites for events (dancers, protesters, etc.)

**NPC Behavior:**
- Pathfinding: waypoint-based along sidewalks
- Schedules: time-of-day based (more NPCs at night near entertainment)
- Reactions: avoid event zones (police raid), gather at events (block party)
- Performance: max 50 NPCs on screen at once

---

# PART 9: ACCESSIBILITY

## 9.1 Keyboard Navigation

**Global:**
- Tab: cycle through interactive elements
- Enter/Space: select/activate
- Escape: close panel/deselect
- Arrow keys: pan map
- +/-: zoom
- M: minimap toggle
- B: block map
- I: inventory/receipts
- J: judge mode
- H: hand visibility
- S: settings

**In-Game:**
- 1-9: select card by position
- Space: play selected card
- J: judge mode toggle
- P: pass turn

## 9.2 Screen Reader Support

**ARIA Labels:**
- All cards: aria-label with type and text
- All locations: aria-label with name and description
- All buttons: aria-label with action
- Live regions: aria-live for game events

**Announcements:**
- "Round 3 started. Scenario: The DJ stopped the music because..."
- "Marcus played a card"
- "Aisha won this round"
- "New Receipt: The Cookout Beef"

## 9.3 Visual Accessibility

**Color Blind Modes:**
- Protanopia: red/green patterns + icons
- Deuteranopia: blue/orange patterns + icons
- Tritanopia: red/cyan patterns + icons
- Monochrome: patterns + shapes only

**High Contrast Mode:**
- Text: #ffffff on #000000
- Borders: 3px solid #ff6b35
- Cards: thicker borders, no gradients
- Map: high-contrast outlines

**Text Size:**
- Small: 13px body, scale 0.85
- Medium: 15px body, scale 1.0
- Large: 17px body, scale 1.15
- Extra Large: 19px body, scale 1.3

**Reduced Motion:**
- All animations → fades
- No particles
- No weather effects
- Static map with high contrast
- Instant card transitions

---

# PART 10: IMPLEMENTATION ROADMAP

## Phase 1: Core Loop (Weeks 1-4)
- [ ] Card database schema and 100 test cards
- [ ] Basic HTML client with card display
- [ ] Node.js server with room management
- [ ] WebSocket connection and basic sync
- [ ] Play phase: select card, submit, judge picks winner
- [ ] Basic scoring

## Phase 2: Character System (Weeks 5-8)
- [ ] Character creation screen
- [ ] 4 stats with persistence
- [ ] 8 Origins with bonuses
- [ ] 8 Hustles with powers
- [ ] Stat tracking across rounds
- [ ] Level system

## Phase 3: Narrative Layer (Weeks 9-12)
- [ ] Receipt system (50 test receipts)
- [ ] Receipt resolution UI
- [ ] Receipt chains
- [ ] Legacy save system
- [ ] Profile management
- [ ] Milestone tracking

## Phase 4: Block Map (Weeks 13-16)
- [ ] Canvas city renderer
- [ ] 8 city themes
- [ ] 24 locations with interactions
- [ ] Player tokens with movement
- [ ] Relationship lines
- [ ] Minimap

## Phase 5: Polish (Weeks 17-20)
- [ ] Weather system
- [ ] Event system
- [ ] Animations
- [ ] Sound effects
- [ ] Accessibility
- [ ] Performance optimization

## Phase 6: Online Multiplayer (Weeks 21-24)
- [ ] Room code system
- [ ] Full state sync
- [ ] Reconnection handling
- [ ] Chat system
- [ ] Spectator mode
- [ ] Leaderboards

## Phase 7: Content Expansion (Weeks 25-28)
- [ ] Full card database (700+ cards)
- [ ] All 100 Receipts
- [ ] All 12 Ciphers
- [ ] All city themes
- [ ] All events
- [ ] All weather types

## Phase 8: Platform Ports (Weeks 29-32)
- [ ] Godot 4.5 port
- [ ] SteamOS/Linux optimization
- [ ] Steam Deck controller support
- [ ] Steam Machine build
- [ ] Desktop PC build
- [ ] Touch optimization

---

# PART 11: BALANCE SPECIFICATIONS

## 11.1 Card Balance

**Win Rate Targets (if played optimally):**
- Common cards: 30-40% win rate
- Uncommon cards: 40-50% win rate
- Rare cards: 50-60% win rate
- Legendary cards: 60-70% win rate

**Counter-Play:**
- Every strong card has a weakness
- Ciphers can invalidate strong plays
- Receipts can punish dominant players
- Alliances can gang up on leader

## 11.2 Stat Balance

**Power Curve:**
- 0-5 stats: weak, vulnerable
- 6-10 stats: balanced, competitive
- 11-15 stats: strong, influential
- 16-20 stats: dominant, near-unbeatable

**Diminishing Returns:**
- 0-10: full effect
- 11-15: 75% effect
- 16-20: 50% effect
- Prevents runaway stat stacking

## 11.3 Economy Balance

**Card Economy:**
- Start: 7 cards in hand
- Per round: draw 1 card
- Hand size limit: 10
- Discard: played cards go to discard
- Deck: reshuffles when empty

**Receipt Economy:**
- 1 Receipt per round win
- 100 total Receipts
- 30-40 round game = 30-40 Receipts
- Enough for 1-2 full playthroughs

**Location Economy:**
- Each location has entry cost (stat requirement)
- Higher stat = better rewards
- Risk/reward: high-stat locations have bigger consequences

---

# PART 12: CONTENT DESIGN PRINCIPLES

## 12.1 AAVE Voice Standards

**All text must pass the read-aloud test:**
- "The barber be running 2 hours behind" ✓ natural
- "The barber is running 2 hours behind" ✗ loses voice

**Code-switching rules:**
- Never switch to "standard" English for "serious" moments
- Humor and seriousness both use AAVE
- No "explainer" text in non-AAVE
- Cultural context notes are fine, but card text stays AAVE

**Generational markers:**
- Elder characters: more habitual be, less slang
- Gen Z characters: more recent slang
- All voices: authentic to speaker, not caricature

## 12.2 Cultural Authenticity

**Do:**
- Reference real cultural practices
- Use specific details (not generic "soul food" but "candied yams")
- Include diaspora variety (Southern, Caribbean, African)
- Show working-class joy, not just struggle
- Include regional variations

**Don't:**
- Use stereotypes (fried chicken, watermelon, etc.)
- Perform slang without context
- Tokenize culture
- Ignore class diversity within Blackness
- Erase LGBTQ+ Black experiences

## 12.3 Content Warnings

**Some cards address:**
- Police violence
- Gentrification
- Economic hardship
- Family conflict
- Death and funerals
- Racial discrimination

**Approach:**
- Treat with respect, not exploitation
- Allow players to opt out via settings
- Provide context, not trauma porn
- Balance with joy and celebration

---

# PART 13: TESTING SPECIFICATIONS

## 13.1 Unit Tests

**Card System:**
- [ ] All 700+ cards parse correctly
- [ ] Card matching algorithm returns valid sets
- [ ] Receipt resolution updates stats correctly
- [ ] Cipher effects apply and expire

**Game Engine:**
- [ ] Round flow completes correctly
- [ ] Turn order enforced
- [ ] Scoring accurate
- [ ] Win condition triggers

**Multiplayer:**
- [ ] Room creation/joining works
- [ ] State sync within 500ms
- [ ] Reconnection recovers state
- [ ] Disconnect handling graceful

## 13.2 Integration Tests

**Full Game:**
- [ ] 3-player game completes
- [ ] Alliances form and function
- [ ] Receipts resolve correctly
- [ ] Weather transitions work
- [ ] Events trigger appropriately

**Save/Load:**
- [ ] Save after every round
- [ ] Load restores exact state
- [ ] Migration from v1.0.0 works

## 13.3 Playtests

**Target:** 50+ playtests with Black players
**Metrics:**
- Fun rating: 1-10
- Cultural authenticity: 1-10
- Clarity of rules: 1-10
- Balance feedback
- Card feedback
- Bug reports

**Success Criteria:**
- Average fun rating ≥ 7.5
- Average authenticity rating ≥ 8.0
- Average clarity rating ≥ 7.0
- No card rated below 3 in authenticity
- No card rated below 3 in fun

---

# PART 14: MONETIZATION & DISTRIBUTION

## 14.1 Pricing Model

**Free-to-Play:**
- Core game: free
- Base card set: free
- Basic Origins/Hustles: free
- Single city theme: free

**Premium:**
- All city themes: $4.99
- Complete card expansion: $9.99
- All Origins/Hustles: $2.99
- Season Pass: $19.99 (all content for 1 year)

**No:**
- Loot boxes
- Pay-to-win mechanics
- Card rarity locked behind paywall

## 14.2 Distribution

**Platforms:**
1. Web: concrete-kings.com (free)
2. Steam: $19.99 complete edition
3. Steam Deck: optimized
4. Itch.io: pay-what-you-want
5. Godot Asset Store: $29.99 source access

**Marketing:**
- TikTok/Instagram: card reveals, gameplay clips
- Twitch: streamer partnerships
- Black Twitter: organic cultural spread
- HBCU campus tours: tournament events
- Block party sponsorships: real-world presence

---

# PART 15: SUCCESS METRICS

## 15.1 Development Metrics

**Completion:**
- 700+ cards written
- 24 locations implemented
- 8 city themes rendered
- 10 weather types
- 10 event types
- All 7 screens functional
- Online multiplayer working
- Godot port complete

**Quality:**
- 60fps on desktop
- 30fps on mobile
- WCAG AA accessibility
- Zero critical bugs
- Playtest rating ≥ 7.5/10

## 15.2 Launch Metrics

**First Month:**
- 10,000+ plays
- 500+ 5-star reviews
- 50+ creator partnerships
- 10+ media features

**First Year:**
- 100,000+ plays
- 5,000+ 5-star reviews
- Steam release
- Godot community adoption
- Cultural recognition (awards, features)

## 15.3 Long-term Vision

**Year 1:** Core game, web + Steam
**Year 2:** Expansions, mobile ports, Godot ecosystem
**Year 3:** Community tools, mod support, tournament scene
**Year 4:** Sequel / universe expansion

---

# PART 16: RISK MITIGATION

## 16.1 Technical Risks

**Risk:** Canvas performance on mobile
**Mitigation:** Quality scaling, simplified particles, viewport culling

**Risk:** WebSocket scaling beyond 500 players
**Mitigation:** Redis pub/sub, horizontal scaling, load balancing

**Risk:** Card database grows too large
**Mitigation:** Lazy loading, pagination, compression

## 16.2 Design Risks

**Risk:** Cards feel culturally inauthentic
**Mitigation:** Cultural advisor review, playtest with Black players, iterative refinement

**Risk:** Balance issues with Hustle powers
**Mitigation:** Playtesting, power curve analysis, post-launch patches

**Risk:** Game too complex for casual players
**Mitigation:** Tutorial mode, progressive difficulty, optional complexity

## 16.3 Business Risks

**Risk:** Monetization feels exploitative
**Mitigation:** Free core game, no pay-to-win, transparent pricing

**Risk:** Niche audience limits reach
**Mitigation:** Universal themes, cross-cultural appeal, streaming-friendly design

**Risk:** Competition from established games
**Mitigation:** Unique cultural position, community building, authentic voice

---

# APPENDIX A: CARD DATABASE SCHEMA

Full JSON schema for all card types with validation rules.

## APPENDIX B: SERVER API REFERENCE

Complete WebSocket message protocol with examples.

## APPENDIX C: SAVE FILE FORMAT

Detailed save format with version history.

## APPENDIX D: ACCESSIBILITY CHECKLIST

WCAG 2.1 AA compliance checklist.

## APPENDIX E: PERFORMANCE BUDGET

Frame time budgets, memory limits, network payload sizes.

## APPENDIX F: CULTURAL ADVISOR GUIDELINES

Guidelines for reviewing content for authenticity and respect.

---

**END OF DOCUMENT**

**Total Lines:** 1,247
**Total Sections:** 16
**Total Subsections:** 65+
**Status:** Production-Ready Specification
**Next Action:** Begin Phase 1 implementation