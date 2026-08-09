# CARD RPG
## SINGLE PLAYER + AI MODE
### Production Specification
### PRD Extension v2.1

---

# 1. MODE DEFINITION

## Single Player + AI

A complete campaign mode where:

- One human player controls their character.
- AI-controlled characters form the rest of the party.
- AI characters receive actual card hands.
- AI characters choose their own cards.
- AI characters have personalities, motivations, relationships, secrets, and objectives.
- AI characters can cooperate, compete, betray, manipulate, joke, fail, and make terrible decisions.
- The same scenario-completion system is used as multiplayer.
- The resulting scenario is simulated and played out.
- The world permanently remembers what happened.

The player should never feel like they are playing against generic bots.

The AI party should feel like **a dysfunctional group of actual RPG characters.**

---

# 2. PRIMARY DESIGN GOAL

The goal is NOT:

> "Make multiplayer playable without other humans."

The goal is:

> **Create a compelling RPG party consisting of one human and several autonomous characters.**

The player should eventually develop opinions about the AI characters.

Examples:

> "I trust Marcus."

> "Never let Tasha choose the escape card."

> "Don't give the briefcase to Rico."

> "The AI is absolutely going to betray us."

Those reactions indicate that the AI characters have become real game entities.

---

# 3. PLAYER PARTY

Recommended party:

### Minimum

1 Human + 1 AI

### Standard

1 Human + 3 AI

### Maximum

1 Human + 7 AI

The default recommendation is:

## 1 Human + 3 AI

This gives enough social interaction without making scenarios unnecessarily slow.

---

# 4. AI CHARACTER CREATION

AI characters should not simply be generated as names and dialogue.

Each AI character receives a persistent personality profile.

```yaml
character:
  name:
  archetype:
  personality:
  humor:
  risk_tolerance:
  loyalty:
  greed:
  aggression:
  empathy:
  intelligence:
  deception:
  chaos:
  competitiveness:
  trust:
  secrets:
  goals:
  fears:
  relationships:
```

---

# 5. PERSONALITY ARCHETYPES

Initial AI archetypes:

## THE STRAIGHT MAN

Attempts to keep everyone alive.

Behavior:

- Rational
- Conservative
- Low chaos
- High survival priority

---

## THE CHAOS AGENT

Chooses ridiculous options.

Behavior:

- High chaos
- High risk
- Low concern for consequences
- Loves rare outcomes

---

## THE SCHEMER

Optimizes for personal advantage.

Behavior:

- Deception
- Manipulation
- Secret objectives
- Opportunistic betrayal

---

## THE LOYALIST

Prioritizes party success.

Behavior:

- Protects allies
- Shares resources
- Avoids betrayal
- Supports weaker characters

---

## THE GREEDY ONE

Prioritizes:

- Money
- Items
- Rewards
- Personal objectives

---

## THE INSTIGATOR

Enjoys causing conflict.

Behavior:

- Starts arguments
- Encourages risky choices
- Targets rivals
- Creates chaos

---

## THE WILDCARD

Extremely unpredictable.

This character exists specifically to produce:

> "Why the hell did you choose THAT?"

moments.

---

# 6. AI HANDS ARE REAL

AI characters must receive actual cards.

They should not simply be asked:

> "What would you do?"

Instead:

```text
AI HAND
──────────────
Blame the Mayor
Steal the Evidence
Pretend to Be a Doctor
Call Your Ex
Run
The Suspicious Pigeon
```

The AI must choose from those cards.

This preserves the game's fundamental rules.

---

# 7. AI CARD SELECTION

AI evaluates available cards using:

```text
Scenario Fit
+
Personality
+
Character Stats
+
Personal Objective
+
Relationships
+
Risk
+
Expected Reward
+
Chaos Preference
+
Previous Behavior
```

Example:

Scenario:

> "Convince the police you weren't involved."

AI character:

**The Schemer**

Cards:

- Tell the truth
- Blame another player
- Bribe the officer
- Run

The AI may choose:

> **Blame another player**

because:

```text
Deception: HIGH
Self-preservation: HIGH
Loyalty: LOW
Relationship with target: -20
Personal objective: Betray someone
```

---

# 8. AI SHOULD NOT ALWAYS MAKE THE BEST MOVE

This is extremely important.

A perfect optimizer is boring.

The AI needs:

### Competence

It understands the situation.

### Personality

It has preferences.

### Imperfection

It makes mistakes.

### Bias

It favors certain people/actions.

### Emotion

Its choices change based on relationships.

---

# 9. AI DECISION MODEL

Conceptually:

```text
CARD SCORE
=
TACTICAL VALUE
+
PERSONALITY VALUE
+
RELATIONSHIP VALUE
+
OBJECTIVE VALUE
+
RISK PREFERENCE
+
CHAOS VALUE
+
EMOTIONAL STATE
+
RANDOM VARIANCE
```

The AI selects from the top candidates rather than always choosing the mathematical maximum.

---

# 10. AI SECRET OBJECTIVES

AI characters can have hidden objectives.

Example:

### Marcus

Public objective:

> Help the party escape.

Secret objective:

> Obtain the golden briefcase.

---

### Tasha

Public objective:

> Keep everyone alive.

Secret objective:

> Become party leader.

---

### Rico

Public objective:

> Make money.

Secret objective:

> Get another player arrested.

The player can discover these objectives through gameplay.

---

# 11. AI RELATIONSHIP MEMORY

AI characters track their relationships with every party member.

Example:

```text
MARCUS → PLAYER

Trust: 72
Respect: 81
Friendship: 66
Fear: 12
Suspicion: 8
Rivalry: 0
```

After the player betrays Marcus:

```text
Trust: 12
Respect: 35
Friendship: 20
Suspicion: 91
Rivalry: 68
```

Marcus should behave differently afterward.

---

# 12. AI MEMORY

AI characters should remember significant events.

Memory categories:

### Immediate Memory

Last several actions.

### Session Memory

Everything important during the current session.

### Campaign Memory

Permanent major events.

### Relationship Memory

Actions involving specific characters.

---

# 13. MEMORY IMPORTANCE

Not every event needs permanent memory.

Assign importance:

```text
1–20
Minor

21–50
Notable

51–80
Important

81–100
Canon
```

High-importance events enter permanent character memory.

---

# 14. AI REACTION TO PLAYER ACTIONS

Example:

Player chooses:

> "Blame Marcus."

Marcus survives.

Next scenario:

> Marcus receives an opportunity to retaliate.

The AI evaluates:

```text
PLAYER BETRAYAL
↓
Marcus Trust ↓
Marcus Rivalry ↑
Marcus Revenge Motivation ↑
```

Marcus may then choose a card specifically targeting the player.

---

# 15. AI ARGUMENTS

AI characters should be able to disagree.

Example:

**Marcus:**

> "We should leave."

**Tasha:**

> "Absolutely not. We're getting the briefcase."

**Rico:**

> "I'm with Tasha."

The player can intervene.

This creates a lightweight party-dialogue system.

---

# 16. AI VOTING

During voting phases, AI characters vote according to:

```text
Humor
Personal Preference
Strategy
Relationships
Objectives
Scenario Requirements
```

They should not simply vote for the mathematically strongest result.

An AI may vote for a worse option because:

> "I don't like Marcus."

This creates social politics.

---

# 17. AI VOTING EXAMPLE

Four scenarios:

```text
PLAYER:
Blame the Mayor

MARCUS:
Tell the Truth

TASHA:
Bribe the Cop

RICO:
Set the Building on Fire
```

Votes:

```text
PLAYER → Tasha
Marcus → Tasha
Tasha → Player
Rico → Himself
```

Winner:

**Tasha**

The game then simulates:

> Bribe the cop.

---

# 18. AI CARD COMBINATIONS

AI characters should be capable of creating combinations that intentionally interact.

Example:

Player:

> "Pretend to be a doctor."

AI Marcus:

> "Bring the fake medical equipment."

AI Tasha:

> "The patient is actually the mayor."

The engine recognizes:

```text
DOCTOR
+
MEDICAL EQUIPMENT
+
MAYOR
```

and produces a coherent scenario.

---

# 19. AI COOPERATION

AI characters can coordinate.

Example:

Marcus privately tells the player:

> "Play 'Distract the Guard.' I'll use 'Steal the Key.'"

The game can support cooperative planning.

---

# 20. AI BETRAYAL

AI can betray the player.

But betrayal must have causes.

Valid causes:

- Secret objective
- Low trust
- Faction allegiance
- Fear
- Greed
- Revenge
- Opportunity
- Survival

Invalid:

> "The AI decided to screw you because the script said so."

---

# 21. AI BETRAYAL SHOULD BE TELEGRAPHED

Players should sometimes notice warning signs.

Example:

Marcus has recently:

- Stopped sharing items
- Chosen cards that hurt the player
- Increased suspicion
- Avoided cooperation

Eventually:

> Marcus betrays the party.

The player should be able to look backward and think:

> "Oh shit. I should have seen that coming."

---

# 22. AI PERSONALITY EVOLUTION

AI personalities should not remain static.

Repeated experiences can modify behavior.

Example:

Initial Marcus:

> Risk tolerance: 30

After surviving several chaotic encounters:

> Risk tolerance: 51

After being betrayed:

> Trust: -25

After becoming friends with the player:

> Loyalty: +20

Characters should develop.

---

# 23. AI CHARACTER ARC

An AI character can evolve through:

```text
INTRODUCTION
↓
FIRST IMPRESSION
↓
RELATIONSHIP
↓
CONFLICT
↓
CHOICE
↓
CONSEQUENCE
↓
CHANGE
↓
RESOLUTION
```

This creates actual party-member arcs.

---

# 24. AI PARTY DYNAMICS

The game should maintain a party relationship graph.

Example:

```text
             PLAYER
            /      \
         +80        -40
        /             \
     MARCUS -------- TASHA
          +60
           \
           RICO
           -20
```

These relationships affect future decisions.

---

# 25. AI SCENARIO ROLES

AI can be assigned temporary roles:

- Leader
- Planner
- Muscle
- Negotiator
- Driver
- Hacker
- Distraction
- Sacrifice
- Wildcard

Cards can modify those roles.

---

# 26. PLAYER LEADERSHIP

The human player should not automatically be the leader.

Leadership should emerge.

The party may vote.

Or an AI may become leader.

The player can challenge them.

This prevents the AI from feeling like disposable NPCs.

---

# 27. AI + "WATCH IT HAPPEN"

The AI mode must use exactly the same simulation pipeline:

```text
SCENARIO
↓
PLAYER + AI CARD SELECTION
↓
REVEAL
↓
VOTE / RESOLUTION
↓
SCENE SIMULATION
↓
WATCH IT HAPPEN
↓
CONSEQUENCES
↓
AI MEMORY UPDATE
↓
WORLD STATE UPDATE
```

There should be no separate "AI campaign rules."

---

# 28. AI SHOULD PARTICIPATE DURING THE SCENE

AI characters should react during the simulation.

Example:

Player:

> "Blame Marcus."

Scene:

Police:

> "Who did this?"

Player points at Marcus.

Marcus:

> "ARE YOU SERIOUS?"

This isn't just narration.

The AI character can have actual reactions.

---

# 29. AI DIALOGUE

AI dialogue should be generated from structured state.

Inputs:

```text
Personality
Current emotion
Relationship
Recent event
Scene context
Card played
World state
```

The AI generates dialogue.

But the engine controls:

- Who speaks
- What happened
- Whether they succeeded
- Whether they are angry
- Whether a relationship changed

---

# 30. AI EMOTIONAL STATE

Basic emotional states:

```text
CALM
HAPPY
AMUSED
ANGRY
AFRAID
SUSPICIOUS
EXCITED
JEALOUS
BETRAYED
CONFIDENT
DESPERATE
```

These modify decision-making.

---

# 31. AI SOCIAL REACTION

If the player repeatedly chooses chaotic cards:

A conservative AI may eventually say:

> "I'm not letting you plan the next one."

The relationship changes.

The AI might vote against the player.

---

# 32. AI PARTY EVENTS

Between scenarios, AI characters can initiate events.

Examples:

> Marcus wants to talk.

> Tasha found something.

> Rico is angry about the last mission.

> Someone stole your item.

> Two AI characters are arguing.

These create organic downtime.

---

# 33. AI INITIATED SCENARIOS

AI characters can create scenario requests.

Example:

Marcus:

> "We need to deal with the mayor."

The game converts this into:

### NEW SCENARIO

**THE MAYOR PROBLEM**

The player now completes the scenario with cards.

This makes the world feel proactive.

---

# 34. AI SHOULD HAVE ITS OWN CARD STRATEGY

AI characters can develop preferred card categories.

Example:

Marcus:

```text
Social: 80%
Deception: 70%
Combat: 20%
Chaos: 15%
```

Rico:

```text
Social: 30%
Deception: 20%
Combat: 80%
Chaos: 90%
```

Tasha:

```text
Social: 75%
Deception: 60%
Support: 85%
Chaos: 35%
```

This creates recognizable behavior.

---

# 35. AI DIFFICULTY

Difficulty should modify decision quality, NOT personality.

## STORY

AI makes entertaining decisions.

## NORMAL

AI makes competent decisions.

## HARD

AI understands objectives and consequences better.

## NIGHTMARE

AI strategically exploits relationships, card combinations and world state.

The AI should still behave like its character.

---

# 36. "PERSONALITY OVERRIDE" SYSTEM

Even on Hard difficulty:

The Chaos Agent may still choose an absurd card.

Why?

Because:

> **Character personality beats perfect optimization.**

This is essential.

---

# 37. AI COMPANION PROGRESSION

AI characters can level up.

They gain:

- New traits
- New cards
- New abilities
- New preferences
- New relationships
- New story arcs

The player can influence their development.

---

# 38. AI CHARACTER DEATH

If enabled:

An AI character can die.

But their story should continue through:

- Memorial events
- Revenge quests
- Replacement characters
- Inherited items
- Faction consequences
- Character callbacks

Their absence should matter.

---

# 39. AI SUCCESSOR SYSTEM

If Marcus dies:

A replacement character might inherit:

> Marcus's unfinished rivalry with the player.

This creates continuity.

---

# 40. AI CAMPAIGN MEMORY

At the end of each session:

Generate a structured summary:

```text
SESSION 07

Major events:
- Robbed casino
- Betrayed Marcus
- Acquired Golden Briefcase
- Police became hostile
- Tasha became party leader

Relationships:
Marcus: Hostile
Tasha: Trusted
Rico: Neutral

Open threads:
- Mayor wants revenge
- Briefcase contents unknown
- Police investigation active
```

This becomes campaign memory.

---

# 41. AI RECAP

When loading the campaign:

> **Previously...**

Then summarize the actual player-created story.

Example:

> You robbed a casino, blamed the mayor, betrayed Marcus, and somehow convinced Tasha to become party leader. The police still want you, and nobody knows what's inside the golden briefcase.

This should feel like a television series recap.

---

# 42. AI MODE MENU

Main menu:

```text
PLAY
│
├── LOCAL PARTY
├── SINGLE PLAYER + AI
├── ONLINE PARTY
└── SOLO STORY
```

"Single Player + AI" means:

> **One human + AI party**

"Solo Story" can later mean:

> **One human character + primarily NPC-driven narrative**

These should remain separate concepts.

---

# 43. AI MODE CAMPAIGN CREATION

Player chooses:

### Party Size

2–8

### AI Personalities

Random / Custom / Recommended

### Campaign Tone

- Comedy
- Crime
- Horror
- Adventure
- Mystery
- Absurd
- Mixed

### AI Behavior

- Cooperative
- Competitive
- Chaotic
- Unpredictable

### Difficulty

Story / Normal / Hard / Nightmare

---

# 44. AI PARTY PREVIEW

Before starting:

```text
YOUR PARTY
────────────────────────

YOU
The Hustler

MARCUS
The Straight Man
Loyalty: HIGH

TASHA
The Schemer
Trust: UNKNOWN

RICO
The Chaos Agent
Risk: EXTREME
```

The player should immediately understand:

> "Oh, this party is going to be a problem."

---

# 45. AI PARTY GENERATION

Players can choose:

### Hand Pick

Choose every AI.

### Random

Generate a completely random party.

### Themed

Examples:

> "The Worst Possible Team"

> "Criminal Masterminds"

> "Complete Idiots"

> "Professional Liars"

> "Chaos Mode"

---

# 46. AI-ONLY MOMENTS

The AI should sometimes interact without the player.

Example:

Marcus and Tasha privately argue.

The player returns to the scene:

> "What happened?"

Tasha:

> "Nothing."

Marcus:

> "Everything."

This creates the feeling of a living party.

---

# 47. AI SHOULD REMEMBER JOKES

If the player repeatedly uses:

> "The suspicious pigeon"

AI characters can start referencing it.

Eventually:

> Marcus: "Please tell me the pigeon isn't involved again."

This is how the game develops an internal culture.

---

# 48. AI SHOULD CREATE RUNNING JOKES

AI can independently create recurring concepts.

Example:

Rico repeatedly chooses:

> "A bucket."

Eventually the game recognizes:

```text
BUCKET_REFERENCE_COUNT = 8
```

The bucket becomes canon.

---

# 49. AI CAN CREATE CANON

AI characters can generate actions that become permanent.

The player isn't the only source of story.

This is crucial.

The world should feel like:

> **Four people are collectively creating this disaster.**

not:

> "Three NPCs wait for you to press buttons."

---

# 50. AI PARTY BALANCE

AI characters should not dominate every scenario.

The system should rotate opportunities.

Each AI should get moments to:

- Lead
- Fail
- Succeed
- Betray
- Joke
- Discover
- Make decisions
- Influence the campaign

The human remains the protagonist, but not the only source of agency.

---

# 51. HUMAN PROTAGONIST RULE

The player should retain ultimate ownership of their character.

AI cannot:

- Permanently alter player identity
- Spend major player resources without consent
- Permanently kill the player without a campaign rule
- Override the player's selected card

AI can:

- Betray
- Argue
- Refuse
- Compete
- Influence
- Negotiate
- Leave
- Help
- Hurt the player

---

# 52. AI PARTY MEMBER LEAVING

An AI character may leave the party.

Reasons:

- Betrayal
- Relationship collapse
- Faction conflict
- Personal objective
- Moral disagreement
- Fear
- Story event

They can potentially return later.

---

# 53. RECRUITMENT

New AI characters can join.

The player can encounter:

> A mysterious hacker.

Recruit them.

They receive:

- Personality
- Deck
- Stats
- Relationships
- Objectives
- Character arc

The party composition evolves organically.

---

# 54. AI PARTY COMPOSITION SYSTEM

The game should monitor:

```text
Combat
Social
Technical
Deception
Support
Chaos
Leadership
Survival
```

If the party lacks something, recruitment opportunities can appear.

But don't make this too gamey.

The goal is:

> **Find people you like, not assemble an optimized spreadsheet.**

---

# 55. SINGLE-PLAYER WIN CONDITION

The campaign can use:

### Personal Goal

The player's individual objective.

### Party Goal

The group's main objective.

### World Goal

The campaign's larger threat.

### Hidden Ending Conditions

Determined by world state.

The player can succeed personally while the party fails.

Or vice versa.

---

# 56. SINGLE PLAYER ENDINGS

Possible:

> You saved the city.

> You became the city's most wanted criminal.

> Your party abandoned you.

> Your former enemy became your closest ally.

> Marcus betrayed you.

> Tasha became mayor.

> Rico accidentally destroyed everything.

> The raccoons took over.

The ending should reflect the campaign's actual history.

---

# 57. AI MODE SUCCESS CRITERIA

The mode succeeds when players say:

> "I actually like this character."

and:

> "I can't believe the AI did that."

and eventually:

> "Remember when Marcus did ______?"

That means the AI has transitioned from system to character.

---

# 58. AI MODE CORE LOOP

```text id="ynb7t4"
SCENARIO
      ↓
HUMAN + AI DRAW CARDS
      ↓
AI DECIDES
      ↓
HUMAN DECIDES
      ↓
CARDS REVEALED
      ↓
VOTE / RESOLUTION
      ↓
SCENARIO CONSTRUCTED
      ↓
WATCH IT HAPPEN
      ↓
RPG SIMULATION
      ↓
AI REACTIONS
      ↓
CONSEQUENCES
      ↓
RELATIONSHIP UPDATES
      ↓
AI MEMORY UPDATES
      ↓
WORLD STATE
      ↓
NEW SCENARIO
```

---

# 59. FINAL AI DESIGN PRINCIPLE

The AI should not feel like:

> **NPCs pretending to be players.**

It should feel like:

> **Players who happen to be AI.**

They have:

- Their own cards
- Their own agendas
- Their own personalities
- Their own relationships
- Their own memories
- Their own mistakes
- Their own ambitions
- Their own sense of humor
- Their own grudges

And then all of those personalities collide inside the same:

> **Complete the scenario → watch it happen → live with it**

system.

---

# 60. PRODUCT PROMISE

### Multiplayer

**Bring your friends and create the disaster together.**

### Single Player + AI

**Bring nobody. The disaster comes with you.**

The fundamental game remains identical.

Only the participants change.