# CARD RPG
## COMPLETE THE SCENARIO → WATCH IT HAPPEN
### Revised Core Gameplay & Narrative System
### PRD Revision v2.0

---

# 1. CORE DESIGN CHANGE

The original design treated the card system as an input mechanism layered on top of an RPG.

That is backwards.

The correct hierarchy is:

```text
CARD GAME
   ↓
SCENARIO COMPLETION
   ↓
NARRATIVE INTERPRETATION
   ↓
RPG SIMULATION
   ↓
PLAYABLE / OBSERVABLE SCENE
   ↓
CONSEQUENCES
   ↓
PERSISTENT WORLD STATE
```

The cards are not merely "actions."

They are **the ingredients used to construct what happens next.**

The player essentially tells the game:

> "This is what I think should happen."

The game then responds:

> "Okay. Let's see."

---

# 2. THE CORE EXPERIENCE

Every major encounter follows a five-part structure:

## 1. SETUP

The game establishes a situation.

## 2. COMPLETE

Players use cards to complete the scenario.

## 3. REVEAL

Everyone's submissions are revealed and interpreted.

## 4. WATCH IT HAPPEN

The game actually plays out the resulting scenario.

## 5. LIVE WITH IT

The consequences become part of the RPG world.

This is the fundamental gameplay loop.

---

# 3. THE NEW CORE LOOP

```text
                 ┌──────────────────┐
                 │    NEW SCENARIO  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │  READ SITUATION  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ COMPLETE SCENE   │
                 │ WITH YOUR CARDS  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │   REVEAL CARDS   │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ RESOLVE OUTCOME  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │   WATCH IT       │
                 │    HAPPEN        │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ APPLY CONSEQUENCES│
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ UPDATE WORLD     │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ NEXT SCENARIO    │
                 └──────────────────┘
                          ↑
                          └────────────
```

---

# 4. WHAT "COMPLETE THE SCENARIO" MEANS

A scenario should present **structured blanks**.

Think of it as a playable story template.

Example:

# SCENARIO

## "THE ROBBERY"

> You and your crew have exactly ten minutes to rob the corner store.

The scenario might contain:

```text
WHO?
WHERE?
WHAT?
HOW?
WHY?
TWIST?
CONSEQUENCE?
```

Players fill those blanks using cards.

Example:

```text
WHO:
[The local mechanic]

WHAT:
[Steal the mysterious package]

HOW:
[Disguise yourself as a pizza delivery driver]

TWIST:
[The police arrive]

ESCAPE:
[Blame the mayor]
```

Now the game has enough information to construct the actual encounter.

---

# 5. CARDS BECOME STORY COMPONENTS

Instead of every card simply being:

> "Do X."

Cards can represent **narrative variables**.

## CARD TYPES

### WHO

Who is involved?

- The mayor
- Your ex
- A cop
- Your landlord
- A suspicious stranger
- Your worst enemy

### WHAT

What happens?

- Steal something
- Start a fight
- Tell a lie
- Make an offer
- Destroy something
- Investigate

### HOW

How does it happen?

- Through deception
- With excessive confidence
- Completely by accident
- While pretending to be someone else
- By bribing somebody

### WHERE

Where does it happen?

- Parking lot
- Nightclub
- Police station
- Convenience store
- Abandoned warehouse

### TWIST

What changes?

- The cops arrive
- Someone betrays you
- The building catches fire
- Your mother walks in
- Everyone recognizes you

### CONSEQUENCE

What happens afterward?

- You become famous
- You get arrested
- Someone owes you a favor
- You become wanted
- You accidentally become responsible for something

---

# 6. THE PLAYER IS ESSENTIALLY CASTING A SCENE

The player isn't simply selecting an action.

They're assembling:

> **A scene specification.**

Example:

```text
SCENARIO:
Rob the store.

WHO:
Your ex.

WHAT:
Steal the golden briefcase.

HOW:
Pretend to be a health inspector.

TWIST:
The police arrive.

ESCAPE:
Blame the mayor.
```

The game now has a narrative recipe.

---

# 7. THE "WATCH IT HAPPEN" PHASE

This is the most important new feature.

After cards are locked:

## THE GAME TAKES CONTROL.

Players watch the scenario play out.

Example:

> Your character walks into the store.

The NPC recognizes you.

> "Oh, hell no."

Your character produces a fake health-inspector badge.

The store owner hesitates.

The police arrive.

Your character immediately points toward the mayor.

> "HE DID IT."

The mayor's reputation changes.

The police investigate.

The party escapes.

Then the RPG engine calculates what actually happened.

---

# 8. THIS SHOULD NOT BE A STATIC CUTSCENE

The scene must be **simulated**.

The cards establish intentions and variables.

The RPG engine determines execution.

For example:

```text
CARD INTENT
      ↓
CHARACTER STATS
      ↓
NPC PERSONALITY
      ↓
RELATIONSHIPS
      ↓
WORLD STATE
      ↓
RANDOM EVENTS
      ↓
SCENE SIMULATION
      ↓
RESULT
```

Therefore:

Two players can submit the same cards and produce different outcomes.

---

# 9. RPG STATS BECOME THE "HOW WELL DID THAT WORK?" SYSTEM

Cards determine:

> **What you're attempting.**

Stats determine:

> **How successfully it happens.**

Example:

Player chooses:

**"Lie to the police."**

The card establishes the action.

Character has:

```text
DECEPTION: 87
CHARISMA: 72
LUCK: 41
```

The result may be:

> The officer believes you.

Another character with:

```text
DECEPTION: 21
CHARISMA: 30
```

might produce:

> The officer immediately knows you're lying.

Same card.

Different RPG outcome.

---

# 10. THE RPG SHOULD NOT OVERRIDE THE CARD

This distinction is critical.

If the player submits:

> "Rob the bank."

The engine should not randomly decide:

> "You instead go fishing."

Stats determine **execution**, not the fundamental intent.

Bad:

```text
PLAYER:
Rob bank.

GAME:
You decided to buy a sandwich.
```

Good:

```text
PLAYER:
Rob bank.

GAME:
You attempt the robbery.

RESULT:
Your poor planning causes the alarm to trigger.
```

The player's card remains canon.

---

# 11. CARD + RPG = INTENT + EXECUTION

This becomes the fundamental mechanical equation:

```text
CARD
=
INTENT

RPG SYSTEM
=
EXECUTION

WORLD STATE
=
CONSEQUENCE
```

This is the game's central design philosophy.

---

# 12. MULTI-CARD SCENARIOS

Some scenarios require several cards.

Example:

# "GET OUT OF TROUBLE"

Complete:

```text
YOUR EXCUSE:
[________]

YOUR ACCOMPLICE:
[________]

YOUR DISTRACTION:
[________]

YOUR ESCAPE:
[________]
```

Each player fills the available slots.

The resulting scene is generated from the entire combination.

---

# 13. PARTY CONTRIBUTION

Players should have different roles in completing a scenario.

Example:

```text
PLAYER 1
Choose WHO

PLAYER 2
Choose HOW

PLAYER 3
Choose TWIST

PLAYER 4
Choose ESCAPE
```

This makes everyone participate.

It also produces hilarious combinations.

---

# 14. HIDDEN CARD CONTRIBUTIONS

Some cards can secretly affect the scene.

Example:

Player contributes:

> "Someone is secretly lying."

The game doesn't immediately reveal the mechanical effect.

During the scene:

> One NPC suddenly changes their story.

Players realize:

> "WAIT—WHO PLAYED THAT?"

This creates social deduction.

---

# 15. THE REVEAL

The reveal should be theatrical.

Cards appear one at a time.

Example:

```text
WHO?
        THE MAYOR

WHAT?
        STEAL HIS SHOES

HOW?
        PRETEND TO BE A DOCTOR

TWIST?
        YOUR MOM SHOWS UP
```

Then:

# SCENE STARTING...

This transition should feel like the curtain opening.

---

# 16. SCENE SIMULATION

Scenes should be short.

Target:

### 10–60 seconds

for normal scenarios.

Major story events:

### 1–3 minutes

The goal is not to watch a 15-minute cutscene.

The goal is:

> **"Holy shit, it actually did it."**

---

# 17. SCENE SIMULATION LEVELS

Different scenarios can use different presentation levels.

### LEVEL 1 — UI EVENT

Simple scenarios.

Example:

> NPC gives you money.

Displayed through animated UI.

---

### LEVEL 2 — DIALOGUE SCENE

Characters talk.

---

### LEVEL 3 — PLAYABLE MICRO-SCENE

Players briefly control characters.

---

### LEVEL 4 — AUTOMATED ACTION SCENE

The engine plays the event.

---

### LEVEL 5 — FULL SET PIECE

Major campaign events.

---

# 18. MICRO-SCENES

A particularly important design option:

After the cards are revealed, the game can occasionally hand control back to players.

Example:

Cards establish:

> "You are escaping the police through a nightclub."

The game launches a 30-second micro-game.

Players must:

- Run
- Hide
- Distract
- Choose doors
- Avoid NPCs

The cards established the scene.

The players determine whether the plan actually succeeds.

---

# 19. SCENARIO COMPLETION IS NOT ALWAYS SUCCESS

Completing the scenario means:

> **You have constructed the attempt.**

Not:

> **You automatically win.**

Example:

```text
PLAYER PLAN:

Rob the casino.
Disguise as staff.
Use the janitor's closet.
Escape through the roof.
```

The game then asks:

> Let's see if your dumbass plan works.

That's where RPG mechanics become valuable.

---

# 20. OUTCOME TIERS

Every scenario can resolve into:

### CRITICAL SUCCESS

The plan works spectacularly.

### SUCCESS

The plan works.

### SUCCESS WITH CONSEQUENCE

It works, but something goes wrong.

### PARTIAL FAILURE

You accomplish part of the plan.

### FAILURE

The plan fails.

### CATASTROPHIC FAILURE

Everything gets worse.

### CHAOTIC SUCCESS

The original goal succeeds in a completely unexpected way.

---

# 21. CHAOTIC SUCCESS

This should be a signature outcome.

Example:

Goal:

> Rob the bank.

Result:

> You fail to rob the bank.

But:

> The police accidentally arrest the bank manager.

Therefore:

**CHAOTIC SUCCESS**

You didn't get the money.

But you created an opportunity.

---

# 22. CONSEQUENCES HAPPEN AFTER THE SCENE

Never immediately dump the consequences on the player before the scene finishes.

First:

## WATCH IT HAPPEN

Then:

## FIND OUT WHAT IT COST YOU

Example:

```text
SCENE COMPLETE
───────────────

✓ Escaped police
✓ Obtained briefcase

BUT...

✗ Police now recognize you
✗ Mayor wants revenge
✗ Your ex knows you lied
✗ New bounty issued
```

---

# 23. WORLD STATE UPDATE

The scene generates structured events.

Example:

```json
{
  "event": "MAYOR_BETRAYAL",
  "actor": "PLAYER_01",
  "target": "MAYOR",
  "location": "DOWNTOWN",
  "tags": [
    "crime",
    "betrayal",
    "political"
  ]
}
```

These become permanent world-state changes.

---

# 24. THE NEXT SCENARIO USES THE PREVIOUS ONE

This is essential.

The next scenario generator receives:

```text
Previous Cards
Previous Actions
Previous Outcomes
NPC Reactions
World Changes
Player Relationships
Faction Changes
Open Quests
Unresolved Consequences
```

Then generates the next encounter.

---

# 25. CALLBACK EXAMPLE

Scenario 1:

> Player blames the mayor.

Scenario 2:

> Police question the mayor.

Scenario 3:

> Mayor hires someone to find you.

Scenario 4:

> Mayor confronts you.

Scenario 5:

> Mayor offers you a deal.

Scenario 6:

> Mayor becomes an ally.

The original card has now generated an entire story arc.

---

# 26. THE CARD CAN BECOME A QUEST

If a card creates something significant, the engine promotes it.

Example:

Player plays:

> "The Golden Briefcase."

Initially:

```text
CARD
```

Then:

```text
OBJECT
```

Then:

```text
QUEST ITEM
```

Then:

```text
FACTION TARGET
```

Then:

```text
CAMPAIGN ARC
```

This progression should happen organically.

---

# 27. CARD PROMOTION SYSTEM

Cards can move through narrative importance:

```text
CARD
 ↓
EVENT
 ↓
CANON EVENT
 ↓
WORLD FLAG
 ↓
QUEST
 ↓
NPC
 ↓
FACTION CONFLICT
 ↓
CAMPAIGN ARC
```

This is one of the game's biggest opportunities.

---

# 28. SCENARIO TYPES

## A. Complete the Sentence

Classic CAH-style.

> "The worst thing to find in your boss's office is ______."

---

## B. Complete the Plan

> "How are you escaping?"

---

## C. Complete the Dialogue

NPC:

> "You have five seconds to explain yourself."

Player:

> [________]

---

## D. Complete the Scene

```text
WHO?
WHAT?
HOW?
TWIST?
```

---

## E. Complete the Mission

```text
OBJECTIVE
APPROACH
TOOL
ESCAPE
```

---

## F. Complete the Relationship

> "What do you say to convince your enemy to help you?"

---

## G. Complete the Crisis

> "The building is on fire. What happens next?"

---

## H. Complete the Finale

Major story events can use many card slots and multiple players.

---

# 29. PLAYER AGENCY

The player should always understand:

### "I caused this."

The system shouldn't feel like an AI randomly writing nonsense.

The chain should be visible:

```text
YOUR CARD
   ↓
YOUR INTENT
   ↓
YOUR CHARACTER
   ↓
YOUR OUTCOME
   ↓
YOUR CONSEQUENCE
```

---

# 30. NARRATIVE AI ROLE

AI should convert structured gameplay into entertaining presentation.

Example engine result:

```text
ACTION:
LIE

SUCCESS:
TRUE

NPC:
POLICE_OFFICER

RELATIONSHIP:
-12

SUSPICION:
+8
```

AI transforms it into:

> The officer stares at you for a long second.

> "You expect me to believe that?"

You confidently nod.

He sighs.

> "Unfortunately... I do."

The AI makes the **simulation entertaining**.

It does not invent the underlying result.

---

# 31. THE AI SHOULD NEVER CHEAT

The AI cannot say:

> "Actually, the police arrest you."

if the deterministic engine says:

```text
DECEPTION SUCCESS
ESCAPE SUCCESS
```

The narrative layer must respect simulation results.

---

# 32. PLAYER VOTING

Voting should be used primarily when the game asks:

> **Which completed scenario is the funniest / most appropriate / most entertaining?**

But voting should NOT replace simulation.

Correct:

```text
CARDS
↓
VOTE
↓
WINNING SCENARIO
↓
SIMULATION
↓
CONSEQUENCES
```

This preserves the CAH party-game DNA.

---

# 33. TWO-STAGE PARTY GAMEPLAY

For multiplayer:

## Stage 1 — Create

Players submit cards.

## Stage 2 — Judge

Players vote.

## Stage 3 — Watch

The winning scenario happens.

## Stage 4 — React

Everyone watches the consequences.

This should become the game's signature rhythm.

---

# 34. WHY THIS IS BETTER

Traditional RPG:

> "Choose an action."

Card party game:

> "Choose a funny answer."

CARD RPG:

> **"Create the answer, then watch the world react."**

That's a much stronger identity.

---

# 35. THE COMPLETE GAME LOOP

The final production loop should therefore be:

```text
╔══════════════════════════════════╗
║          SCENARIO ARRIVES        ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║       PLAYERS COMPLETE IT        ║
║                                  ║
║   WHO / WHAT / HOW / TWIST       ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║             REVEAL               ║
║                                  ║
║       "OH NO... THEY PICKED      ║
║             THAT."               ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║          JUDGE / VOTE            ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║          SCENE BEGINS            ║
║                                  ║
║        WATCH IT HAPPEN            ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║        RPG ENGINE RESOLVES       ║
║                                  ║
║ Stats / Traits / NPCs / Luck     ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║          CONSEQUENCES            ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║       WORLD STATE UPDATED        ║
╚════════════════╤═════════════════╝
                 ↓
╔══════════════════════════════════╗
║         NEW SCENARIO             ║
║                                  ║
║   "Remember what you just did?"  ║
╚════════════════╤═════════════════╝
                 │
                 └──────────────→ LOOP
```

---

# 36. THE THREE-LAYER DESIGN

The game should ultimately be understood as three systems.

## LAYER 1 — CARDS

**What do the players propose?**

---

## LAYER 2 — RPG ENGINE

**What actually happens when they try it?**

---

## LAYER 3 — WORLD MEMORY

**What does the world remember afterward?**

This creates:

```text
CARDS
= PLAYER CREATIVITY

RPG
= SIMULATION

WORLD MEMORY
= STORY
```

---

# 37. THE MOST IMPORTANT DESIGN RULE

### Never waste a good card combination.

If players create something hilarious, clever, unexpected, or narratively significant, the engine should look for a reason to preserve it.

Not every joke becomes a quest.

But the game should continuously ask:

> **"Can this become something?"**

---

# 38. MVP MUST PROVE THIS

The first playable prototype should contain only:

```text
20 Scenario Templates
100 Response Cards
20 Action Cards
3 Character Archetypes
5 Stats
10 NPCs
1 Location
Basic RPG Resolution
Basic Scene Playback
World-State Database
```

And demonstrate this exact chain:

```text
CARD
↓
SCENARIO
↓
COMPLETION
↓
REVEAL
↓
SIMULATION
↓
WATCH IT HAPPEN
↓
CONSEQUENCE
↓
NEXT SCENARIO
```

If that feels addictive with only one location and 100 cards, the concept works.

If it doesn't, **do not add more RPG systems yet.**

---

# 39. FINAL DESIGN STATEMENT

CARD RPG is not:

> **Cards Against Humanity + RPG stats.**

It is:

> **A social narrative RPG where players construct scenarios with cards, vote on the chaos they want to see, and then watch the game simulate the consequences.**

The player creates the premise.

The cards create the situation.

The RPG determines whether it works.

The simulation shows what happened.

The world remembers.

And the next scenario is built from the wreckage.

### THE CORE PROMISE:

> **Complete the scenario.**
>
> **Watch it happen.**
>
> **Live with what you just created.**