# CARD RPG
# UI / UX / INTERACTION / MINI-GAME DESIGN SPECIFICATION

## Version 3.0
### Production UX Architecture
### Single Player + AI / Local Multiplayer / Future Online Multiplayer

---

# 1. UX NORTH STAR

CARD RPG is not primarily a menu-driven RPG.

It is a **social narrative machine**.

The player should constantly feel:

> "I am building something, and I'm about to find out what happens."

Therefore, the interface must preserve:

### ANTICIPATION

What is about to happen?

### AGENCY

What am I contributing?

### TENSION

What did everyone else choose?

### REVEAL

What did we just create?

### PAYOFF

Let's watch it happen.

### CONSEQUENCE

Oh shit.

### MEMORY

The game remembers.

---

# 2. PRIMARY UX LOOP

```text
┌───────────────────────┐
│       SCENARIO        │
│       SETUP            │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│       BUILD            │
│    Complete Scenario   │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│        LOCK             │
│     Submit Cards       │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│       REVEAL            │
│   See What We Created  │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│        JUDGE            │
│   Vote / Resolve       │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│       PLAYBACK          │
│     WATCH IT HAPPEN    │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│      CONSEQUENCE        │
│      RPG Results       │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│        MEMORY           │
│   World State Updated  │
└──────────┬────────────┘
           ↓
        NEXT SCENE
```

This sequence is the game's **UX spine**.

---

# 3. DESIGN PRINCIPLE: ONE PRIMARY QUESTION PER SCREEN

Every major screen should answer one question.

### Scenario Screen

> What's happening?

### Card Selection

> What are you going to do?

### Reveal

> What did everyone choose?

### Vote

> Which plan should happen?

### Playback

> What actually happened?

### Consequence

> What did that cost?

### Chronicle

> What have we done?

Avoid screens that ask the player to simultaneously:

- read lore
- manage inventory
- inspect stats
- select cards
- read NPC dialogue
- watch an animation
- understand objectives

One screen = one cognitive task.

---

# 4. GLOBAL UI STRUCTURE

Recommended 16:9 layout:

```text
┌─────────────────────────────────────────────────────┐
│ CAMPAIGN      CHAPTER 03        DAY 07       PAUSE │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                 PRIMARY CONTENT                     │
│                                                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ PARTY / WORLD STATUS                                │
├─────────────────────────────────────────────────────┤
│ HAND / CONTEXT ACTIONS / CONTROLLER PROMPTS        │
└─────────────────────────────────────────────────────┘
```

The bottom region is reserved for **interaction**.

The center is reserved for **story**.

The top is reserved for **persistent context**.

---

# 5. SCREEN HIERARCHY

The game should use three information layers.

## Layer 1 — Immediate

What must I know right now?

## Layer 2 — Context

What helps me make this decision?

## Layer 3 — Deep Information

What can I inspect if I want more?

Deep information should never block the primary interaction.

---

# 6. PRIMARY GAME HUD

```text
┌───────────────────────────────────────────────┐
│ CHAPTER 2                  DAY 7              │
│ THE MAYOR PROBLEM                             │
├───────────────────────────────────────────────┤
│                                               │
│              CURRENT SCENARIO                 │
│                                               │
│ "The mayor knows what you did."               │
│                                               │
│ COMPLETE THE SCENARIO                         │
│                                               │
│ WHO?     [__________]                         │
│ WHAT?    [__________]                         │
│ HOW?     [__________]                         │
│ TWIST?   [__________]                         │
│                                               │
├───────────────────────────────────────────────┤
│ YOU     MARCUS     TASHA      RICO             │
│ ♥ 72      ♥ 61       ♥ 43       ♥ 88           │
├───────────────────────────────────────────────┤
│ YOUR HAND                                      │
│ [CARD] [CARD] [CARD] [CARD] [CARD] [CARD]     │
└───────────────────────────────────────────────┘
```

---

# 7. CARD DESIGN

Cards are the game's most important interactive objects.

They must be:

- Immediately readable
- Visually distinct
- Tactile
- Easy to select
- Easy to inspect
- Easy to compare
- Controller-friendly

A card should visually communicate:

```text
CATEGORY
TITLE
DESCRIPTION
TAGS
RARITY
SPECIAL EFFECT
```

But avoid turning every card into a spreadsheet.

---

# 8. CARD STATES

Every card requires these visual states:

### Idle

Normal.

### Focused

Controller/keyboard focus.

### Hovered

Mouse/touch.

### Selected

Player intends to use it.

### Locked

Submission confirmed.

### Invalid

Cannot be used here.

### Recommended

Optional contextual suggestion.

### Revealed

Used during scenario reveal.

### Canon

Card has become permanently significant.

---

# 9. CARD FOCUS

Focused cards should:

- Increase slightly in size
- Lift visually
- Gain a strong outline
- Reveal contextual information
- Produce subtle audio feedback

Do NOT rely only on color.

Current accessibility guidance specifically recommends highly visible focus indicators that remain visible and don't disappear behind overlays.

---

# 10. CARD ANIMATION

Card interaction should feel physical.

### Focus

```text
scale: 1.00 → 1.05
y: 0 → -8px
duration: 120ms
```

### Select

```text
scale: 1.05 → 1.10
rotation: subtle
particle: minimal
sound: tactile
```

### Submit

Card flies toward its destination slot.

```text
HAND
 ↓
SCENARIO SLOT
```

### Reveal

Cards should enter individually.

Not all at once.

---

# 11. NEVER OVER-ANIMATE THE UI

Animation should communicate:

- Focus
- Selection
- State change
- Causality
- Reward
- Consequence

It should not exist merely because:

> "Animation is cool."

Motion should also be controllable. Accessibility guidance recommends the ability to pause/disable distracting or moving content.

---

# 12. SCENARIO SCREEN

The scenario is the game's stage.

Recommended hierarchy:

```text
TITLE
↓
SHORT SETUP
↓
OBJECTIVE
↓
CARD SLOTS
↓
OPTIONAL CONTEXT
```

Example:

# THE MAYOR PROBLEM

> The mayor knows you were involved.

### COMPLETE THE SCENARIO

**WHO confronts him?**

[ CARD SLOT ]

**What do you want?**

[ CARD SLOT ]

**How do you approach him?**

[ CARD SLOT ]

**What goes wrong?**

[ CARD SLOT ]

---

# 13. CARD SLOT INTERACTION

Selecting a slot opens the hand.

The player can:

- Navigate
- Inspect
- Select
- Cancel
- Replace

The rest of the scenario remains visible.

Never force the player into a separate full-screen card browser for simple choices.

---

# 14. SLOT VALIDATION

Invalid cards should be visually disabled.

Example:

```text
CARD
"Fight the Mayor"

Not valid for:
HOW?

Reason:
This scenario requires a social approach.
```

But don't simply gray everything out.

Explain why.

---

# 15. CARD RECOMMENDATIONS

The game can optionally mark cards:

### STRONG MATCH

### INTERESTING

### CHAOTIC

### HIGH RISK

### STORY

These recommendations should never automatically select a card.

The player owns the decision.

---

# 16. PLAYER + AI SCENARIO UI

Single-player mode should show AI participation without clutter.

```text
┌─────────────────────────────────────────┐
│              SCENARIO                   │
│                                         │
│          THE MAYOR PROBLEM              │
│                                         │
│ WHO?     [ YOUR CARD ]                  │
│                                         │
│ WHAT?    [ MARCUS...]                   │
│                                         │
│ HOW?     [ TASHA...]                    │
│                                         │
│ TWIST?   [ RICO...]                     │
│                                         │
├─────────────────────────────────────────┤
│ YOU       MARCUS       TASHA       RICO │
│ ● THINK   ● THINK      ● THINK      ✓   │
└─────────────────────────────────────────┘
```

AI thinking indicators should communicate:

> They are deciding.

Not:

> The game is frozen.

---

# 17. AI THINKING ANIMATION

Use character-specific thinking behavior.

### Marcus

Thoughtful pause.

### Tasha

Quick selection.

### Rico

Long pause followed by:

> "Oh no."

Then card submission.

This is personality communicated through UX.

---

# 18. SUBMISSION PHASE

When the player finishes:

> **LOCK IN**

Controller:

**A — Submit**

**B — Back**

The game should clearly indicate:

```text
3 / 4 SLOTS COMPLETE
```

Never make the player wonder whether they have finished.

---

# 19. LOCK-IN MOMENT

This should feel meaningful.

When submitted:

- Cards lock
- Hand dims
- Scenario slots become sealed
- Countdown disappears
- Music changes
- Camera centers on scenario

Then:

> **LET'S SEE WHAT YOU JUST DID.**

---

# 20. REVEAL SEQUENCE

This is a major emotional beat.

Do not immediately jump into gameplay.

Use:

```text
BLACK
 ↓
SCENARIO TITLE
 ↓
WHO
 ↓
WHAT
 ↓
HOW
 ↓
TWIST
 ↓
FULL COMBINATION
 ↓
REACTION
 ↓
SCENE START
```

Each card gets a short reveal beat.

---

# 21. REVEAL TIMING

Example:

```text
WHO?
     0.5 sec

WHAT?
     0.5 sec

HOW?
     0.7 sec

TWIST?
     0.8 sec

FULL COMBINATION
     1.2 sec

REACTION
     1.0 sec

SCENE
     START
```

Allow player-controlled fast-forward.

Never force long animations repeatedly.

---

# 22. REACTION CAMERA

When a ridiculous combination appears:

Cut briefly to:

- NPC reaction
- AI character reaction
- Player avatar
- Crowd
- Environmental reaction

Example:

Card:

> "Your grandmother."

Camera:

**Marcus slowly looks at you.**

> "Again?"

This is where the game earns its comedy.

---

# 23. THE SCENE PLAYBACK SYSTEM

The resulting scene should feel like a miniature television episode.

Structure:

```text
ESTABLISHING SHOT
↓
CHARACTERS ENTER
↓
ACTION
↓
REACTION
↓
ESCALATION
↓
TWIST
↓
RESOLUTION
↓
AFTERMATH
```

---

# 24. SCENE LENGTH

Normal:

### 10–45 seconds

Important:

### 45–90 seconds

Major:

### 1–3 minutes

Avoid making normal turns feel like watching television.

The player should quickly get back to making decisions.

---

# 25. SCENE CAMERA SYSTEM

Use cinematic camera rules.

### Establishing

Wide shot.

### Dialogue

Medium shot.

### Reaction

Close-up.

### Action

Dynamic framing.

### Consequence

Return to stable framing.

Camera movement should be purposeful.

---

# 26. SCENE SKIPPING

Player can:

### Skip

Immediately resolve.

### Fast Forward

2× speed.

### Auto

Play normally.

### Cinematic

No UI interruptions.

This supports repeat campaigns and accessibility.

---

# 27. MICRO-GAME SYSTEM

Some scenarios should become playable mini-games.

This is extremely important.

The card system establishes:

> **WHAT happens.**

The mini-game lets the player influence:

> **HOW WELL it happens.**

---

# 28. MINI-GAME RULE

A mini-game must NEVER feel like a completely different game.

It must be:

- Short
- Instantly understandable
- Thematically connected
- Mechanically meaningful
- Reusable
- Controller friendly

Target duration:

### 10–30 seconds

---

# 29. MINI-GAME TYPE 1 — ESCAPE

Scenario:

> Escape the police.

Cards established:

> "Run through the nightclub."

Mini-game:

```text
LEFT       RIGHT
    ↓
MOVE
    ↓
AVOID
    ↓
ESCAPE
```

Success modifies the RPG outcome.

---

# 30. MINI-GAME TYPE 2 — SOCIAL TIMING

Scenario:

> Convince the mayor.

Mini-game:

NPC presents dialogue cues.

Player chooses:

```text
LIE
TRUTH
THREATEN
JOKE
BRIBE
```

within a generous timing window.

This influences:

- Trust
- Suspicion
- Success

Timing should never be mandatory for accessibility; provide pause/alternative interaction where appropriate.

---

# 31. MINI-GAME TYPE 3 — SEARCH

Scenario:

> Find the evidence.

Player searches a small environment.

Important objects subtly react.

The mini-game lasts:

### 15–30 seconds.

---

# 32. MINI-GAME TYPE 4 — SOCIAL CHAOS

Multiple characters speak.

Player selects who to support.

Example:

```text
MARCUS:
"We should leave."

TASHA:
"We should steal it."

RICO:
"We should burn it."

YOU:
[ CHOOSE ]
```

This modifies party relationships.

---

# 33. MINI-GAME TYPE 5 — NEGOTIATION

Player builds a short sequence:

```text
OFFER
+
THREAT
+
INCENTIVE
```

The combination affects NPC response.

---

# 34. MINI-GAME TYPE 6 — QUICK PLAN

Player sees a limited set of cards and has:

### No hard timer by default

to arrange:

```text
APPROACH
→
ACTION
→
ESCAPE
```

Then watches the result.

This reinforces the primary card loop.

---

# 35. MINI-GAME TYPE 7 — CHAOS EVENT

A deliberately absurd interaction.

Example:

> Escape a restaurant while carrying a live chicken.

Controls:

- Move
- Grab
- Throw
- Dodge

The mini-game is mechanically simple but narratively ridiculous.

---

# 36. MINI-GAME SUCCESS

Mini-games should modify:

```text
SUCCESS
FAILURE
QUALITY
DAMAGE
REPUTATION
RELATIONSHIP
TIME
RESOURCES
```

They should not completely erase the card-generated intent.

---

# 37. IMPORTANT:

## PLAYER SHOULD NEVER FEEL PUNISHED FOR NOT BEING GOOD AT THE MINI-GAME

Example:

The player planned:

> Steal the evidence.

They fail the stealth mini-game.

The game should not simply say:

> "Nothing happens."

Instead:

> You fail to steal the evidence.

But perhaps:

> You discover who actually has it.

The story continues.

---

# 38. FAILURE IS CONTENT

Every mini-game should have:

### Success

### Partial Success

### Failure

### Chaotic Failure

### Unexpected Success

All should produce content.

---

# 39. POST-SCENE RESULT SCREEN

Do not dump a giant spreadsheet.

Use a dramatic summary.

```text
┌─────────────────────────────────┐
│          SCENE COMPLETE         │
├─────────────────────────────────┤
│                                 │
│        THE MAYOR IS PISSED.     │
│                                 │
│ ✓ You got the briefcase         │
│ ✓ Marcus escaped                │
│                                 │
│ ! Police suspicion +18          │
│ ! Mayor hostility +35           │
│ + Marcus trust +7               │
│                                 │
│       NEW THREAD                 │
│    "THE MAYOR'S REVENGE"        │
│                                 │
└─────────────────────────────────┘
```

---

# 40. CONSEQUENCE ANIMATION

Consequences should visually travel into their destination.

Example:

```text
SCENE
 ↓
POLICE SUSPICION +18
 ↓
POLICE ICON
 ↓
WORLD STATE
```

Relationship:

```text
YOU
 ↓
MARCUS
 ↓
TRUST +7
```

This creates visual causality.

---

# 41. WORLD MEMORY

After the consequence screen:

> **THE WORLD REMEMBERS**

Then display only significant changes.

Example:

```text
CANON EVENT CREATED

"The Mayor's Betrayal"

This event may return later.
```

This is a powerful psychological reward.

---

# 42. CAMPAIGN CHRONICLE

The Chronicle should be a major UI feature.

```text
CHRONICLE
─────────────────────

DAY 1
You met Marcus.

DAY 2
Rico stole a police horse.

DAY 4
You betrayed the mayor.

DAY 5
Tasha became party leader.

DAY 7
The police declared you wanted.
```

Each event can be opened for details.

---

# 43. CHRONICLE EVENT CARDS

Each important event becomes a visual card:

```text
┌────────────────────────────┐
│ CANON EVENT                 │
│                            │
│ THE POLICE HORSE           │
│                            │
│ Rico stole a police horse. │
│                            │
│ DAY 4                      │
│                            │
│ [ VIEW SCENE ]             │
└────────────────────────────┘
```

The player can replay the memory.

---

# 44. RELATIONSHIP UI

Do not use a giant spreadsheet.

Use relationship portraits.

```text
MARCUS
████████░░
TRUST 78

"Thinks you're reckless
but useful."

TASHA
█████░░░░░
TRUST 49

"Doesn't fully trust you."

RICO
█████████░
CHAOS BOND 91

"Probably a terrible influence."
```

---

# 45. CHARACTER SHEET

The character sheet should be layered.

### Level 1

```text
NAME
LEVEL
HP
REPUTATION
CURRENT STATUS
```

### Level 2

Stats.

### Level 3

Traits.

### Level 4

History.

### Level 5

Detailed mechanics.

Do not expose everything at once.

---

# 46. QUEST UI

Quests should be presented as story threads.

```text
ACTIVE THREADS

● THE MAYOR'S REVENGE
  High danger

● THE GOLDEN BRIEFCASE
  Unknown

● MARCUS' SECRET
  Personal

● POLICE INVESTIGATION
  Escalating
```

Selecting one opens:

```text
WHAT WE KNOW
WHAT WE DID
WHAT MIGHT HAPPEN
WHO IS INVOLVED
```

---

# 47. PARTY UI

The party screen should feel like a cast list.

```text
YOUR CREW

YOU
THE HUSTLER

MARCUS
THE STRAIGHT MAN
Trust: 78

TASHA
THE SCHEMER
Trust: 49

RICO
THE CHAOS AGENT
Trust: 91
```

Selecting a character opens their profile.

---

# 48. AI CHARACTER UI

AI characters should have visible personality indicators.

Example:

```text
RICO

CHAOS       ██████████
LOYALTY     ██████░░░░
GREED       ████████░░
RISK        ██████████
```

Don't reveal hidden objectives.

---

# 49. HIDDEN INFORMATION

Some information should intentionally remain hidden.

Examples:

- AI secret objectives
- NPC motives
- Hidden traits
- Faction agendas
- Future consequences

But the UI should communicate:

> **UNKNOWN**

rather than pretending the information doesn't exist.

---

# 50. DIALOGUE UI

Dialogue should not consume the whole screen unnecessarily.

Recommended:

```text
┌─────────────────────────────────────────┐
│                                         │
│            CHARACTER SCENE              │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ MARCUS                                  │
│ "You really think this is going to work?"│
│                                         │
│ [ Tell him the truth ]                  │
│ [ Lie ]                                  │
│ [ Joke ]                                 │
│ [ Say nothing ]                          │
└─────────────────────────────────────────┘
```

---

# 51. DIALOGUE CHOICES

Choices should show:

### Obvious intent

> Lie

rather than:

> "Maybe we could perhaps reconsider..."

Do not hide the actual meaning of the choice.

---

# 52. DIALOGUE CONSEQUENCE PREVIEW

Optional accessibility setting:

Show:

```text
LIKELY EFFECT

Marcus Trust
↑

Police Suspicion
?

Chaos
↑↑
```

Advanced players can disable this.

---

# 53. ANIMATION LANGUAGE

The game should establish a unified motion vocabulary.

### Selection

Lift.

### Confirmation

Snap.

### Submission

Fly.

### Reveal

Flip.

### Success

Burst.

### Failure

Drop.

### Relationship increase

Pulse toward character.

### Relationship decrease

Crack / fall / dim.

### New quest

Thread extends outward.

### Canon event

Stamp / seal.

---

# 54. TRANSITION LANGUAGE

Avoid arbitrary fades.

Use semantic transitions.

### Card → Scenario

Card physically moves into scenario slot.

### Scenario → Playback

Scenario card becomes the scene.

### Playback → Consequence

Scene collapses into result tokens.

### Consequence → Chronicle

Canon event flies into history.

This creates continuity.

---

# 55. AUDIO UX

Every important interaction should have audio feedback.

Examples:

### Focus

Soft tick.

### Select

Card click.

### Submit

Paper/card snap.

### Reveal

Card flip.

### Winning vote

Short sting.

### Scene begins

Musical transition.

### Canon event

Distinct signature sound.

### Relationship change

Character-specific tone.

Audio should never be the only indicator of state. Multiple sensory channels are recommended for important gameplay cues.

---

# 56. HAPTICS

Controller vibration can reinforce:

### Card selected

Tiny pulse.

### Card locked

Firm click.

### Reveal

Light rhythmic pulses.

### Major consequence

Strong pulse.

### Failure

Low pulse.

### Canon event

Distinct signature.

Haptics must be adjustable or disableable.

---

# 57. CONTROLLER-FIRST UX

Every important action must work using:

- D-pad
- Left stick
- A
- B
- X
- Y
- LB
- RB
- Menu
- View

No mouse dependency.

This is especially important for Steam Deck, where the default configuration must provide access to all content for Verified-level compatibility.

---

# 58. DEFAULT CONTROLLER MAP

```text
LEFT STICK
Navigate

A
Select / Confirm

B
Back / Cancel

X
Inspect

Y
Sort / Details

LB / RB
Cycle cards / categories

LT
Card zoom / preview

RT
Quick submit

VIEW
Chronicle / campaign info

MENU
Pause
```

Exact mapping should remain remappable.

---

# 59. FOCUS MODEL

The entire UI should use a predictable focus graph.

Example:

```text
CARD 1
 ↓
CARD 2
 ↓
CARD 3
 ↓
CARD 4
 ↓
CARD 5
 ↓
SUBMIT
```

Never teleport focus unexpectedly.

Current Xbox guidance specifically emphasizes predictable focus movement and visible focus at all times.

---

# 60. FOCUS MEMORY

When closing an overlay:

Return focus to:

> The element that opened it.

Example:

Player inspects Card 4.

Closes inspection.

Focus returns to:

**Card 4**

Not Card 1.

---

# 61. OVERLAYS

Use overlays for:

- Card inspection
- Character details
- Quest details
- History
- Settings

Avoid navigating away from the current scene unless necessary.

---

# 62. NO UI JUMPS

Menus must not unexpectedly:

- Move
- Scroll
- Resize
- Reorder
- Hide the focused element

Moving targets are particularly problematic for precision-oriented UI.

---

# 63. TUTORIAL DESIGN

Do NOT start with:

> "Welcome to CARD RPG. Here are 27 mechanics."

Instead:

## Tutorial Scenario

> "You need to explain why you're late."

The game teaches:

1. Pick a card.
2. Submit it.
3. Reveal.
4. Watch the result.
5. See consequence.

Then:

> "Congratulations. You understand the game."

Additional mechanics unlock naturally.

Contextual and interactive tutorials are preferable to information dumps.

---

# 64. FIRST 15 MINUTES

### Minute 0–2

Character introduction.

### Minute 2–5

First simple scenario.

### Minute 5–7

First complete scene playback.

### Minute 7–10

First consequence.

### Minute 10–12

First AI disagreement.

### Minute 12–15

First scenario generated from a previous decision.

The player should experience:

> **"Holy shit, it remembered."**

within the first session.

---

# 65. FIRST SCENARIO

Keep it extremely simple.

Example:

# YOU'RE LATE

> Your boss wants to know why you're late.

Complete:

### WHY?

One card.

That's it.

---

# 66. SECOND SCENARIO

Introduce:

### HOW?

Two cards.

---

# 67. THIRD SCENARIO

Introduce:

### TWIST

Three cards.

---

# 68. FOURTH SCENARIO

Introduce:

### RPG CHECK

Now the player understands:

> Cards establish intent.

> Character stats influence execution.

---

# 69. FIFTH SCENARIO

Introduce:

### AI DISAGREEMENT

Now the player understands:

> These characters have opinions.

---

# 70. SIXTH SCENARIO

Introduce:

### CONSEQUENCE CALLBACK

Now the player understands:

> The world remembers.

This is a much stronger tutorial than a conventional tutorial screen.

---

# 71. MINI-GAME UX RULE

Every mini-game must communicate:

### WHAT AM I DOING?

### WHAT CONTROLS DO I USE?

### WHAT DOES SUCCESS MEAN?

within approximately:

## 2 seconds

No lengthy instruction screen.

---

# 72. MINI-GAME INTRO

Example:

```text
ESCAPE!

GET OUT BEFORE THE COPS ARRIVE.

MOVE
← →
```

Then immediately start.

---

# 73. MINI-GAME HUD

Minimal.

```text
ESCAPE
████████░░

POLICE
██████░░░░
```

Only show information that affects the player's decision.

---

# 74. MINI-GAME END

Immediately communicate:

```text
SUCCESS!
```

or:

```text
PARTIAL SUCCESS
```

Then transition back into the story.

No unnecessary results screen.

---

# 75. MINI-GAME REPLAYABILITY

Mini-games should be reusable templates with changing context.

Example:

### ESCAPE TEMPLATE

Can represent:

- Police chase
- Security guards
- Angry mob
- Ex chasing you
- Burning building
- Raccoons
- Monster
- Debt collectors

Same interaction.

Different narrative.

---

# 76. MINI-GAME LIBRARY

Initial production library:

### SOCIAL

- Conversation
- Debate
- Negotiation
- Interrogation

### MOVEMENT

- Escape
- Chase
- Sneak

### SEARCH

- Investigate
- Find object
- Examine evidence

### ACTION

- Fight
- Steal
- Break in

### CHAOS

- Crowd control
- Disaster response
- Ridiculous physical sequence

Start with approximately:

## 6–8 reusable mini-games.

Do not build 30 bespoke mini-games.

---

# 77. MINI-GAME SELECTION ENGINE

Scenario tags determine available mini-games.

```text
CRIME
+
ESCAPE
+
URBAN
=
ESCAPE MINI-GAME
```

```text
SOCIAL
+
NEGOTIATION
=
NEGOTIATION MINI-GAME
```

```text
INVESTIGATION
=
SEARCH MINI-GAME
```

---

# 78. MINI-GAME MODIFIERS

Cards can alter mini-games.

Example:

> "You're drunk."

Movement becomes less predictable.

> "You brought a disguise."

NPC recognition decreases.

> "Rico is helping."

A second AI distraction occurs.

This makes cards mechanically meaningful beyond the initial scenario.

---

# 79. AI PARTICIPATION IN MINI-GAMES

AI characters can:

- Help
- Interfere
- Fail
- Give advice
- Trigger events
- Use abilities

Example:

During an escape:

Rico suddenly runs the wrong way.

> "THIS WAY!"

Marcus:

> "THAT IS A WALL."

This can become canon.

---

# 80. PLAYER CAMERA DURING PLAYBACK

Use:

### 2.5D / 3D / 2D cinematic presentation

depending on the final art direction.

But maintain:

- Strong silhouettes
- Clear characters
- Strong composition
- Limited camera movement
- Readable dialogue

The UI should never obscure the scene.

---

# 81. VISUAL STORYTELLING

Whenever possible, show consequences rather than merely stating them.

Bad:

> "The mayor hates you."

Better:

Mayor walks past you.

He looks at you.

Turns away.

Security closes the gate.

**Mayor Hostility +35**

---

# 82. CHARACTER REACTION SYSTEM

Every major outcome should generate reactions from relevant characters.

Examples:

### Success

Celebration.

### Failure

Mockery.

### Betrayal

Anger.

### Absurdity

Confusion.

### Major achievement

Respect.

This reinforces the social RPG.

---

# 83. REACTION PRIORITY

Don't show reactions from everyone.

Prioritize:

1. Directly affected character
2. Player's closest relationship
3. Rival
4. Relevant faction
5. Other party members

This keeps the scene readable.

---

# 84. WORLD EVENT PRIORITY

Not every event deserves cinematic treatment.

Use:

### Minor

UI notification.

### Moderate

Dialogue reaction.

### Important

Short scene.

### Major

Full cinematic.

### Campaign-defining

Playable set piece.

---

# 85. INFORMATION DENSITY

The game should intentionally alternate:

### High-information phase

Scenario construction.

### Low-information phase

Scene playback.

### High-information phase

Consequences.

This prevents cognitive overload.

---

# 86. UX RHYTHM

The ideal session rhythm:

```text
THINK
↓
CHOOSE
↓
LAUGH
↓
ANTICIPATE
↓
WATCH
↓
REACT
↓
PROCESS
↓
CHOOSE AGAIN
```

This rhythm is more important than raw feature count.

---

# 87. MAIN MENU

Recommended:

```text
┌─────────────────────────────┐
│                             │
│         CARD RPG            │
│                             │
│      PLAY CAMPAIGN          │
│      CONTINUE               │
│      NEW GAME               │
│      CARD COLLECTION        │
│      CHRONICLE              │
│      SETTINGS               │
│      QUIT                   │
│                             │
└─────────────────────────────┘
```

Keep the main menu extremely simple.

---

# 88. PLAY MENU

```text
PLAY

SINGLE PLAYER + AI
LOCAL PARTY
ONLINE PARTY
CUSTOM SCENARIO
```

---

# 89. CAMPAIGN SELECT

Campaign cards:

```text
┌────────────────────┐
│ CAMPAIGN 07        │
│                    │
│ 12 HOURS           │
│ 47 CANON EVENTS    │
│ 3 ACTIVE THREADS   │
│                    │
│ [CONTINUE]         │
└────────────────────┘
```

---

# 90. CARD COLLECTION

Should feel like a physical collection.

Filters:

- Category
- Rarity
- Recently acquired
- Used frequently
- Canon
- Favorite

---

# 91. DECK BUILDER

Keep it simple initially.

```text
DECK
30 / 30

SOCIAL       8
CHAOS        7
CRIME        5
ACTION       6
WILDCARD     4
```

Show deck identity.

Example:

> **THE MENACE**

> High Chaos / High Risk

---

# 92. CARD INSPECTION

Selecting a card:

```text
┌─────────────────────────────┐
│ THE SUSPICIOUS PIGEON       │
│                             │
│ RESPONSE                    │
│                             │
│ "A pigeon that knows too    │
│  much."                     │
│                             │
│ CHAOS +4                    │
│ ABSURDITY +5                │
│                             │
│ USED: 17 TIMES              │
│                             │
│ CANON STATUS: ACTIVE        │
└─────────────────────────────┘
```

---

# 93. CANON CARDS

When a card becomes important:

Visually transform it.

Example:

```text
NORMAL CARD
↓
USED REPEATEDLY
↓
CANON CARD
```

Add:

- Unique border
- Canon mark
- History
- First appearance
- Important events

---

# 94. PLAYER FEEDBACK MODEL

Every player action should produce at least one response:

### Visual

Animation.

### Audio

Sound.

### Haptic

Optional.

### State

Something changes.

Not every action requires all four.

But important actions should use multiple channels.

---

# 95. ERROR HANDLING

Never say:

> Invalid action.

Instead:

> **You can't use that card here.**

And explain why if useful.

Error messaging should be contextual and clear. Xbox guidance specifically recommends UI context that helps players understand what an interaction will do before activating it.

---

# 96. DESTRUCTIVE ACTIONS

Before:

- Discarding rare cards
- Permanently changing decks
- Killing characters
- Leaving campaigns
- Deleting saves

Require confirmation.

But avoid confirmation spam.

---

# 97. ACCESSIBILITY BASELINE

Required:

- Full controller navigation
- Keyboard navigation
- Mouse support
- Remapping
- Adjustable text
- High contrast mode
- Colorblind-safe indicators
- Subtitle controls
- Separate audio sliders
- Reduce motion
- Disable screen shake
- Animation speed
- Pause during scenes
- Skip scenes
- Slow/fast playback
- No color-only information

These align with established game accessibility guidance.

---

# 98. STEAM DECK REQUIREMENTS

Treat Steam Deck as a primary design target.

Requirements:

- Full controller operation
- Controller glyph detection
- No mouse-required screens
- Large readable text
- 1280×800 layout validation
- Suspend/resume testing
- Steam Input compatibility
- Touchscreen optional
- Trackpad optional

Valve specifically recommends readable couch-distance interfaces and full controller access, and Steam Deck supports local multiplayer.

---

# 99. TOUCHSCREEN

Touch should be supplementary.

Useful:

- Card selection
- Card inspection
- Scrolling
- Menu navigation

But never make touch the only method.

---

# 100. UI SCALING

Create three UI density profiles:

### HANDHELD

Steam Deck.

### DESKTOP

Monitor.

### TV

Living-room distance.

TV mode should prioritize larger typography and fewer simultaneous elements.

---

# 101. TYPOGRAPHY

Typography must prioritize:

1. Readability
2. Hierarchy
3. Personality

Recommended hierarchy:

```text
SCENARIO TITLE
    ↓
PROMPT
    ↓
CARD TEXT
    ↓
CONTEXT
    ↓
SECONDARY INFORMATION
```

Important text should never be buried in decorative typography.

Steam's developer guidance recommends readable UI for couch viewing; Xbox guidance similarly emphasizes readable text and adequate contrast.

---

# 102. COLOR SYSTEM

Color should communicate categories, but never be the sole signal.

Example:

```text
SOCIAL
icon + color

CHAOS
icon + color

CRIME
icon + color

TECH
icon + color
```

Every color-coded system also gets:

- Icon
- Shape
- Label

---

# 103. ANIMATION ACCESSIBILITY

Settings:

```text
Motion:
FULL
REDUCED
MINIMAL
OFF

Screen Shake:
ON/OFF

Card Animation:
FULL/SIMPLE

Scene Playback:
FULL/FAST/SKIP

Background Animation:
ON/OFF
```

---

# 104. PAUSE ANYTIME

Because the game is narrative-heavy:

The player should be able to pause:

- Playback
- Dialogue
- Tutorials
- Results
- Mini-games where practical

Avoid making the player race to read.

---

# 105. SAVE FLOW

Autosave:

### After every scenario.

Manual save:

### Between scenarios.

Campaign state should be safe even if the game crashes during playback.

The engine should commit important state **before** cinematic playback and mark the playback as presentation of already-determined results.

---

# 106. DETERMINISTIC PRESENTATION

Critical architecture:

```text
GAME ENGINE
    ↓
DETERMINES RESULT
    ↓
SAVES RESULT
    ↓
PRESENTATION
```

Not:

```text
CUTSCENE
    ↓
RANDOM RESULT
```

This prevents reload abuse and AI inconsistencies.

---

# 107. SCENE COMPILER

Every completed scenario should become a structured scene object.

Example:

```yaml
scene:
  location: mayor_office

  participants:
    - player
    - mayor
    - marcus

  intent:
    action: negotiate

  cards:
    who: mayor
    what: demand_money
    how: threaten
    twist: police_arrive

  modifiers:
    player_charisma: 72
    player_deception: 81
    mayor_trust: 12

  outcome:
    success: partial
    consequence:
      police_suspicion: +18
      mayor_hostility: +30
```

The presentation layer then turns this into a scene.

---

# 108. SCENE GRAPH

Scenes should be represented as nodes.

```text
INTRO
  ↓
DIALOGUE
  ↓
ACTION
  ↓
CHECK
  ├── SUCCESS
  │      ↓
  │   REACTION
  │
  └── FAILURE
         ↓
      ESCALATION
         ↓
      OUTCOME
```

This allows designers to author scenes without hardcoding every variation.

---

# 109. MINI-GAME GRAPH

Mini-games should be inserted as optional nodes:

```text
SCENARIO
 ↓
CARD RESULT
 ↓
MINI-GAME
 ↓
PERFORMANCE
 ↓
SCENE
 ↓
CONSEQUENCE
```

Not every scenario needs one.

---

# 110. CONTENT AUTHORING TOOL

Eventually create an internal Scenario Editor.

Designer can define:

```text
Scenario
Prompt
Card Slots
Allowed Tags
NPCs
Mini-Game
Difficulty
Success Conditions
Failure Conditions
Consequences
Canon Rules
Follow-Up Scenarios
```

Then preview:

> **CARD COMBINATION → GENERATED SCENE**

This should be a core production tool.

---

# 111. UX TESTING

Prototype testing should test:

### Can a new player understand the first scenario without instructions?

### Can they complete it using a controller?

### Do they understand what cards do?

### Do they understand when they are locked in?

### Do they understand what caused the result?

### Do they notice the game remembered?

### Do they understand why a mini-game appeared?

### Can they return to the game after a week and understand their campaign?

---

# 112. UX FAILURE CONDITIONS

The design is failing if players say:

> "What am I supposed to do?"

> "Why can't I select this?"

> "Did my card actually get played?"

> "Why did that happen?"

> "What did I change?"

> "Why did the AI do that?"

> "What am I supposed to remember?"

Every one of these questions indicates a UX problem.

---

# 113. THE GOLDEN UX TEST

After a scenario ends, ask a player:

> **"Why did that happen?"**

They should be able to answer:

> "Because I played X, Marcus played Y, the mayor hated us, and I failed the negotiation."

If they say:

> "I don't know."

the simulation/UI connection isn't strong enough.

---

# 114. THE SECOND GOLDEN TEST

After several scenarios:

> **"What is your relationship with Marcus?"**

The player should be able to answer without opening a spreadsheet.

That means the relationship system is successfully communicating through:

- Dialogue
- Behavior
- UI
- Consequences
- Memory

---

# 115. THE THIRD GOLDEN TEST

Ask:

> **"What happened last session?"**

The Chronicle should answer immediately.

---

# 116. THE FOURTH GOLDEN TEST

Ask:

> **"What happens if I play this card?"**

The player should understand enough to make an informed choice without requiring a wiki.

---

# 117. THE IDEAL SESSION

The player experiences:

```text
SCENARIO
   ↓
"I have an idea."
   ↓
CARD SELECTION
   ↓
"Wait... what did Rico choose?"
   ↓
REVEAL
   ↓
"OH NO."
   ↓
SCENE
   ↓
"HAHAHAHA"
   ↓
CONSEQUENCE
   ↓
"OH SHIT."
   ↓
CHRONICLE
   ↓
"The game remembered."
   ↓
NEXT SCENARIO
   ↓
"I wonder what happens if..."
```

That is the UX loop.

---

# 118. PROFESSIONAL MINI-GAME DESIGN STANDARD

Every mini-game must have:

```text
1. PURPOSE
2. PLAYER GOAL
3. INPUT
4. FEEDBACK
5. SUCCESS
6. FAILURE
7. PARTIAL RESULT
8. ACCESSIBILITY MODE
9. REWARD
10. NARRATIVE CONSEQUENCE
```

If a mini-game cannot satisfy all ten, don't build it.

---

# 119. MINI-GAME PRODUCTION TEMPLATE

```yaml
minigame:
  id:

  name:

  purpose:

  scenario_tags:

  duration:
    min:
    target:
    max:

  player_goal:

  controls:

  feedback:

  success:

  partial_success:

  failure:

  accessibility:
    reduced_motion:
    no_timing:
    simplified_controls:
    pause_allowed:

  rewards:

  consequences:

  reusable_contexts:
```

This allows the mini-game library to remain modular.

---

# 120. DESIGN RULE: NEVER BREAK THE FANTASY

A mini-game should feel like:

> "I'm actually doing the thing the cards created."

Not:

> "The RPG suddenly turned into a random rhythm game."

Every mini-game must reinforce the narrative.

---

# 121. FINAL UX ARCHITECTURE

The finished experience should be understood as:

```text
              CARD RPG
                  │
        ┌─────────┴─────────┐
        │                   │
      CREATE              WATCH
        │                   │
        ↓                   ↓
   CARD SYSTEM        SCENE SYSTEM
        │                   │
        └─────────┬─────────┘
                  ↓
             RPG ENGINE
                  ↓
             WORLD STATE
                  ↓
              MEMORY
                  ↓
             NEW STORY
```

---

# 122. FINAL PRODUCT EXPERIENCE

The game should never feel like:

> "Pick an option from a menu."

It should feel like:

> **"Let's build a ridiculous plan and see what happens."**

Then:

> **"Oh shit. It actually worked."**

Or:

> **"Oh shit. It absolutely did not work."**

And then:

> **"Wait... the game remembers that."**

That is the complete CARD RPG experience.

---

# 123. UX NORTH STAR

## CREATE IT.

## WATCH IT HAPPEN.

## LIVE WITH IT.

## DO IT AGAIN.