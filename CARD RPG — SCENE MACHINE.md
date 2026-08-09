# CARD RPG — SCENE MACHINE
## Production-Ready Product Requirements Document

**Document ID:** CRPG-SM-PRD-001  
**Version:** 1.0  
**Status:** Production Ready  
**Target Engine:** Godot 4.5+  
**Primary Platform:** PC / Steam Deck  
**Budget Constraint:** $0 / Free-tool-first  
**Art Constraint:** No professional pixel-art requirement  
**Primary Mode:** Single Player + AI  
**Future Modes:** Local Multiplayer / Online Multiplayer  
**Architecture:** Data-driven, deterministic, modular, reusable

---

# 1. EXECUTIVE SUMMARY

The Scene Machine is the core presentation and narrative execution system for CARD RPG.

Its purpose is to transform player-created card combinations into dynamic narrative scenes that are:

- visually entertaining
- mechanically meaningful
- replayable
- deterministic
- procedurally assembled
- AI-compatible
- inexpensive to produce
- expandable without requiring large quantities of hand-authored animation

The fundamental product promise is:

> **The player creates the situation. The Scene Machine makes it happen.**

The player should experience:

```text
READ
  ↓
CHOOSE CARDS
  ↓
LOCK
  ↓
REVEAL
  ↓
WATCH
  ↓
PLAY / INTERACT
  ↓
CONSEQUENCE
  ↓
WORLD REMEMBERS
```

The Scene Machine is therefore not merely a cutscene player.

It is a **narrative scene compiler and presentation runtime**.

---

# 2. PRODUCT VISION

CARD RPG combines:

- card-based scenario construction
- RPG statistics
- character relationships
- AI-controlled party members
- procedural narrative assembly
- short interactive mini-games
- cinematic scene playback
- persistent world consequences

The Scene Machine connects those systems.

```text
CARD SYSTEM
     ↓
SCENARIO RESULT
     ↓
SCENE COMPILER
     ↓
SCENE GRAPH
     ↓
PLAYBACK ENGINE
     ↓
MINI-GAME
     ↓
OUTCOME
     ↓
CONSEQUENCE ENGINE
     ↓
WORLD STATE
```

The system must make a relatively small content library feel significantly larger through combinations.

---

# 3. PROBLEM STATEMENT

Traditional narrative games often require:

- large quantities of hand-authored cutscenes
- unique animations
- unique character poses
- unique environments
- extensive branching dialogue
- extensive cinematic scripting

That approach is inappropriate for a zero-budget solo/small-team project.

CARD RPG instead requires:

> **Maximum narrative variation from minimum authored assets.**

The Scene Machine solves this by using reusable:

- actors
- locations
- props
- animations
- expressions
- camera behaviors
- dialogue beats
- scene beats
- mini-games
- consequence templates

---

# 4. PRODUCT GOALS

## P0 — Mandatory

The system must:

1. Load scenes from data.
2. Spawn modular characters.
3. Position characters.
4. Play reusable animations.
5. Display dialogue.
6. Control the camera.
7. Play sound effects/music cues.
8. Execute scene beats sequentially.
9. Support branching outcomes.
10. Support AI characters.
11. Accept card-generated scenario data.
12. Trigger mini-games.
13. Produce deterministic outcomes.
14. Save results before presentation.
15. Update persistent world state.
16. Record Chronicle events.
17. Support controller navigation.
18. Run on Steam Deck.
19. Allow scenes to be skipped.
20. Allow scenes to be fast-forwarded.
21. Support reduced-motion settings.
22. Require minimal custom art per new scene.

---

# 5. NON-GOALS

Version 1 will NOT attempt to build:

- full 3D cinematics
- motion capture
- advanced facial rigging
- procedural voice acting
- real-time physics-driven cinematics
- fully generated environments
- fully autonomous AI storytelling
- unlimited procedural animation
- cinematic-quality lip sync
- dozens of bespoke mini-games

These may be future extensions.

---

# 6. CORE DESIGN PRINCIPLE

## DATA, NOT CODE.

A designer should be able to create a new scene without modifying the playback engine.

Bad:

```gdscript
func mayor_scene():
    ...
```

Good:

```yaml
scene:
  id: mayor_scene_001
  location: mayor_office

  beats:
    - type: enter
      actor: player

    - type: dialogue
      actor: mayor
      text: "You have some explaining to do."

    - type: reaction
      actor: marcus
      expression: nervous
```

The runtime interprets the data.

---

# 7. CORE USER EXPERIENCE

The player experience must follow:

```text
SCENARIO
   ↓
CARD SELECTION
   ↓
AI SELECTION
   ↓
LOCK-IN
   ↓
REVEAL
   ↓
SCENE PLAYBACK
   ↓
OPTIONAL MINI-GAME
   ↓
SCENE RESOLUTION
   ↓
CONSEQUENCE
   ↓
CHRONICLE
```

No system should interrupt this flow unnecessarily.

---

# 8. SCENE MACHINE ARCHITECTURE

```text
┌──────────────────────────────────────┐
│           CARD SYSTEM                │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│        SCENARIO RESOLVER             │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│          SCENE COMPILER              │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│            SCENE GRAPH               │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│         PLAYBACK ENGINE              │
├──────────────────────────────────────┤
│ Actor Manager                        │
│ Animation Manager                    │
│ Camera Manager                       │
│ Dialogue Manager                     │
│ Audio Manager                        │
│ VFX Manager                          │
│ Mini-game Manager                    │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│        CONSEQUENCE ENGINE            │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│           WORLD STATE                │
└──────────────────────────────────────┘
```

---

# 9. CORE MODULES

The Scene Machine consists of:

## 9.1 Scene Loader

Loads scene definitions.

## 9.2 Scene Compiler

Converts scenario/card data into executable scene graphs.

## 9.3 Scene Runtime

Executes scene graphs.

## 9.4 Actor Manager

Controls characters.

## 9.5 Animation Manager

Controls reusable animation states.

## 9.6 Camera Manager

Controls cinematic framing.

## 9.7 Dialogue Manager

Controls dialogue and choices.

## 9.8 Audio Manager

Controls music, voice and sound effects.

## 9.9 VFX Manager

Controls visual effects.

## 9.10 Mini-game Manager

Injects interactive sequences.

## 9.11 Consequence Manager

Applies narrative effects.

## 9.12 Chronicle Manager

Records significant events.

## 9.13 Save Manager

Persists state safely.

---

# 10. SCENE DATA MODEL

Each scene requires:

```yaml
scene:
  id:
  version:

  metadata:
    title:
    description:
    tags:
    location:
    estimated_duration:

  participants:

  environment:

  variables:

  beats:

  outcomes:

  consequences:

  chronicle:
```

---

# 11. SCENE METADATA

Example:

```yaml
metadata:
  title: "The Mayor Problem"
  tags:
    - social
    - crime
    - urban
    - political

  location: mayor_office

  estimated_duration: 45
```

Tags are important because they allow the compiler to select reusable content.

---

# 12. ACTOR SYSTEM

Every actor must implement a common interface.

```text
Actor
├── identity
├── appearance
├── stats
├── relationship
├── state
├── animation
├── dialogue
└── actions
```

Required actor actions:

```text
spawn
despawn
move
face
look
speak
listen
react
gesture
attack
defend
interact
enter
exit
```

---

# 13. ACTOR NODE STRUCTURE

Recommended Godot structure:

```text
CharacterActor
├── CharacterRoot
├── Body
├── Head
├── Face
├── Hair
├── Clothing
├── Accessories
├── Shadow
├── AnimationController
├── DialogueAnchor
├── InteractionAnchor
└── AudioEmitter
```

---

# 14. MODULAR CHARACTER SYSTEM

Characters must be assembled from reusable components.

```text
character/
├── body
├── head
├── hair
├── face
├── clothing
├── accessory
```

Example:

```yaml
appearance:
  body: body_01
  head: head_03
  hair: hair_07
  clothing: jacket_02
  face: neutral
  accessory: glasses
```

This allows many characters from a small asset library.

---

# 15. INITIAL CHARACTER ASSET TARGET

Prototype:

- 3 base bodies
- 5 heads
- 6 hairstyles
- 6 outfits
- 8 expressions
- 10 accessories

This is sufficient for early development.

---

# 16. ANIMATION SYSTEM

The animation system must prioritize reusable procedural animation.

Required states:

```text
IDLE
WALK
RUN
TALK
LISTEN
POINT
LOOK
SURPRISE
ANGER
LAUGH
SAD
CONFUSED
THREATEN
GRAB
GIVE
TAKE
ATTACK
DEFEND
FALL
EXIT
```

---

# 17. PROCEDURAL MOTION

Idle animation should be generated where practical.

Examples:

- breathing
- subtle sway
- head movement
- blinking
- small clothing movement

This avoids hundreds of hand-authored frames.

---

# 18. ANIMATION API

The runtime should expose commands such as:

```text
actor.play("idle")
actor.play("talk")
actor.play("surprised")
actor.move_to(position, duration)
actor.face(target)
actor.look_at(target)
```

---

# 19. ANIMATION PRIORITY

Animation states have priority.

Example:

```text
IDLE = 1
TALK = 2
REACTION = 3
ACTION = 4
CINEMATIC = 5
```

Higher priority overrides lower priority.

---

# 20. EXPRESSION SYSTEM

Minimum expressions:

```text
neutral
happy
sad
angry
shocked
confused
afraid
disgusted
deadpan
laughing
```

Expressions must be changeable independently of body animation.

---

# 21. DIALOGUE SYSTEM

Dialogue beat:

```yaml
- type: dialogue
  actor: marcus
  text: "You said this was easy."
```

Optional:

```yaml
emotion: skeptical
camera: medium
sfx: annoyed_breath
```

---

# 22. DIALOGUE PRESENTATION

The player must be able to:

- advance
- skip
- fast-forward
- pause
- replay where supported

Dialogue text must remain readable.

---

# 23. CAMERA SYSTEM

Required presets:

```text
WIDE
MEDIUM
CLOSE
REACTION
OVER_SHOULDER
DRAMATIC
ESTABLISHING
FOLLOW
```

---

# 24. CAMERA COMMANDS

```yaml
- type: camera
  preset: close
  target: marcus
  duration: 0.6
```

Camera commands must support:

- target
- position
- zoom
- rotation
- duration
- easing
- shake
- transition

---

# 25. CAMERA RULES

The camera should prioritize:

1. Speaker
2. Important reaction
3. Action
4. Environmental event
5. Player

Avoid unnecessary camera movement.

---

# 26. LOCATION SYSTEM

Locations must be modular.

Recommended structure:

```text
Location
├── Background
├── Midground
├── Floor
├── Props
├── Actors
├── Foreground
├── Lighting
├── VFX
└── Audio
```

---

# 27. LOCATION ASSET STRATEGY

New scenes should reuse existing locations whenever possible.

A single location should support multiple scenarios through:

- prop changes
- lighting changes
- character placement
- camera changes
- weather
- time of day
- background dressing

---

# 28. INITIAL LOCATION TARGET

Prototype:

1. Diner
2. Street
3. Apartment
4. Office
5. Police station

Do not expand the location library until the Scene Machine works.

---

# 29. PROP SYSTEM

Props must be reusable.

Example:

```text
desk
chair
phone
laptop
weapon
drink
bag
briefcase
door
window
vehicle
trash_can
```

Props support:

- interaction
- animation
- destruction
- pickup
- drop
- placement

---

# 30. SCENE BEAT SYSTEM

The fundamental unit of scene authoring is a:

# BEAT

Supported beats:

```text
ENTER
EXIT
MOVE
FACE
LOOK
DIALOGUE
REACTION
ANIMATION
CAMERA
WAIT
SOUND
MUSIC
VFX
SPAWN
DESPAWN
INTERACT
MINI_GAME
BRANCH
CONSEQUENCE
END
```

---

# 31. BEAT EXECUTION

Each beat must:

1. Validate its parameters.
2. Execute.
3. Report completion.
4. Permit the next beat.
5. Handle interruption.
6. Handle skip/fast-forward.

---

# 32. BEAT EXAMPLE

```yaml
- type: move
  actor: player
  target: desk
  duration: 1.2
  easing: ease_out
```

Then:

```yaml
- type: interact
  actor: player
  target: briefcase
```

Then:

```yaml
- type: reaction
  actor: mayor
  expression: shocked
```

---

# 33. SCENE GRAPH

Scenes should execute as graphs rather than only linear scripts.

```text
INTRO
  ↓
DIALOGUE
  ↓
ACTION
  ↓
CHECK
 ├── SUCCESS
 │     ↓
 │   REACTION
 │
 └── FAILURE
       ↓
    ESCALATION
       ↓
      OUTCOME
```

---

# 34. BRANCHING

Branches must be data-driven.

```yaml
- type: branch
  condition: mayor_trust >= 50

  true:
    - type: dialogue
      actor: mayor
      text: "I'll hear you out."

  false:
    - type: dialogue
      actor: mayor
      text: "Get out."
```

---

# 35. CARD → SCENE COMPILER

This is the most important subsystem.

Input:

```yaml
scenario:
  prompt: "Convince the mayor."

  cards:
    who: mayor
    method: threaten
    ally: rico
    twist: police
```

Output:

```text
ENTER MAYOR OFFICE
↓
PLAYER APPROACHES MAYOR
↓
PLAYER THREATENS MAYOR
↓
RICO ENTERS
↓
MAYOR REACTS
↓
POLICE ARRIVE
↓
ESCAPE SEQUENCE
```

---

# 36. COMPILER RESPONSIBILITIES

The compiler must:

1. Parse cards.
2. Resolve tags.
3. Determine compatible scene templates.
4. Select actors.
5. Select animations.
6. Select camera beats.
7. Select dialogue templates.
8. Insert mini-games.
9. Determine possible outcomes.
10. Produce a deterministic Scene Graph.

---

# 37. CARD TAGGING

Cards should have tags.

Example:

```yaml
card:
  id: threaten
  tags:
    - aggressive
    - social
    - intimidation
    - high_risk
```

The compiler uses tags to select compatible scene beats.

---

# 38. SCENE TEMPLATE

Templates define the general structure.

Example:

```yaml
template:
  id: social_confrontation

  required:
    - target
    - approach

  optional:
    - ally
    - twist

  beats:
    - establish
    - approach
    - confrontation
    - reaction
    - escalation
    - outcome
```

---

# 39. TEMPLATE LIBRARY

Initial templates:

### SOCIAL

- conversation
- confrontation
- negotiation
- interrogation
- persuasion

### CRIME

- theft
- break-in
- deception
- escape

### ACTION

- fight
- chase
- ambush
- defense

### INVESTIGATION

- search
- discovery
- interrogation
- evidence

### CHAOS

- disaster
- public embarrassment
- accidental escalation
- absurd event

---

# 40. TEMPLATE SELECTION

Selection priority:

```text
EXACT MATCH
↓
TAG MATCH
↓
CONTEXT MATCH
↓
GENERIC FALLBACK
```

The system must always have a valid fallback.

---

# 41. SCENE FALLBACK

If no specialized scene exists:

```text
GENERIC_INTERACTION
```

The game should never crash because a card combination wasn't anticipated.

---

# 42. AI INTEGRATION

AI characters participate before scene compilation.

The AI chooses cards based on:

- personality
- goals
- relationships
- risk tolerance
- current world state
- hidden objectives
- prior events

The Scene Machine receives the AI's choices exactly like player choices.

---

# 43. AI REACTIONS

AI characters must be capable of reacting to the resulting scene.

Examples:

```text
approval
disapproval
fear
amusement
anger
betrayal
excitement
confusion
```

Reaction is determined from character personality and world state.

---

# 44. AI MUST NOT CONTROL CANON DIRECTLY

AI can recommend or select behavior.

The deterministic game systems decide:

- outcomes
- stats
- consequences
- canon
- save state

This prevents unpredictable AI behavior from corrupting the campaign.

---

# 45. MINI-GAME INTEGRATION

Mini-games are optional scene nodes.

```yaml
- type: minigame
  id: escape
  difficulty: medium
  success:
    next: escape_success

  failure:
    next: escape_failure
```

---

# 46. INITIAL MINI-GAME LIBRARY

Production target:

1. Escape
2. Negotiation
3. Search
4. Social timing
5. Chase
6. Stealth
7. Quick plan
8. Chaos interaction

Only build the first three for the initial vertical slice.

---

# 47. MINI-GAME DESIGN REQUIREMENT

Each mini-game must:

- teach itself
- start quickly
- last 10–30 seconds
- have success
- have partial success
- have failure
- modify the narrative
- support accessibility settings
- return control to the scene runtime

---

# 48. OUTCOME SYSTEM

Every major scene should resolve to:

```text
SUCCESS
PARTIAL_SUCCESS
FAILURE
CHAOTIC_SUCCESS
CHAOTIC_FAILURE
```

The outcome should be calculated before playback when possible.

---

# 49. DETERMINISTIC RESOLUTION

The engine resolves:

```text
cards
+
stats
+
relationships
+
world state
+
random seed
=
outcome
```

The result is saved.

Playback only presents it.

---

# 50. RANDOM SEED

Every scene receives a seed:

```yaml
scene:
  seed: 18273645
```

This allows debugging and replay consistency.

---

# 51. SAVE ORDER

Critical requirement:

```text
CARD SUBMISSION
↓
RESOLVE OUTCOME
↓
SAVE RESULT
↓
START PLAYBACK
```

Never:

```text
START CINEMATIC
↓
ROLL OUTCOME
```

Otherwise crashes/reloads can corrupt narrative state.

---

# 52. CONSEQUENCE SYSTEM

Scene results produce structured consequences.

Example:

```yaml
consequences:
  - target: mayor_hostility
    operation: add
    value: 30

  - target: police_suspicion
    operation: add
    value: 18

  - target: marcus_trust
    operation: add
    value: 7
```

---

# 53. WORLD STATE

World state must support:

```text
relationships
reputation
faction_standing
quests
flags
inventory
locations
NPC states
canon events
time
wanted levels
```

---

# 54. CHRONICLE

Important events become Chronicle entries.

```yaml
chronicle:
  event:
    id: mayor_betrayal
    title: "The Mayor's Betrayal"
    day: 7
    participants:
      - player
      - mayor
      - marcus

    summary:
      "The mayor turned against the crew."
```

---

# 55. SCENE PLAYBACK STATES

Runtime states:

```text
INITIALIZING
LOADING
ESTABLISHING
PLAYING
WAITING
DIALOGUE
INTERACTION
MINI_GAME
BRANCHING
RESOLVING
COMPLETE
SKIPPING
PAUSED
ERROR
```

---

# 56. SCENE STATE MACHINE

```text
LOADING
  ↓
ESTABLISHING
  ↓
PLAYING
  ↓
WAITING
  ↓
DIALOGUE
  ↓
PLAYING
  ↓
MINI_GAME
  ↓
PLAYING
  ↓
OUTCOME
  ↓
COMPLETE
```

---

# 57. SKIP SYSTEM

Skip must immediately resolve presentation to the already-determined outcome.

It must NOT reroll the scene.

```text
SKIP
 ↓
complete remaining presentation
 ↓
apply already-resolved state
 ↓
results
```

---

# 58. FAST-FORWARD

Support:

```text
1×
2×
4×
```

Dialogue should remain readable where possible.

---

# 59. SCENE REPLAY

Chronicle scenes may be replayable.

Replay must:

- not modify world state
- not award rewards
- not reroll outcomes
- clearly indicate REPLAY mode

---

# 60. AUDIO SYSTEM

Scene audio must support:

```text
music
ambient
dialogue
SFX
UI
voice
reactions
```

Each should have independent volume controls.

---

# 61. AUDIO BEATS

Example:

```yaml
- type: sound
  id: door_open

- type: music
  action: intensity_up

- type: sound
  id: police_siren
```

---

# 62. VISUAL EFFECTS

Reusable VFX:

- smoke
- sparks
- dust
- rain
- steam
- impact
- flash
- screen vignette
- environment shake
- notification burst

Avoid expensive custom effects.

---

# 63. LIGHTING

Lighting should be parameterized.

Examples:

```text
day
night
danger
police
warm
cold
dramatic
emergency
```

This allows one location to support many moods.

---

# 64. SCENE STYLE

Recommended visual direction:

## Stylized 2D / 2.5D Graphic-Novel Theater

Characteristics:

- strong silhouettes
- simplified forms
- bold shapes
- limited palette
- expressive poses
- dramatic lighting
- readable environments
- reusable assets

The art style is intentionally chosen to minimize production burden.

---

# 65. ART PRODUCTION RULE

No scene should require a new custom character animation unless absolutely necessary.

Default hierarchy:

```text
REUSE EXISTING ANIMATION
↓
MODIFY EXISTING ANIMATION
↓
COMBINE ANIMATIONS
↓
PROCEDURAL MOTION
↓
NEW ANIMATION
```

---

# 66. ZERO-BUDGET ASSET PIPELINE

Preferred tools:

```text
Godot
Krita
Inkscape
Blender
Python
Git
Free/open assets
AI-assisted concept generation
```

The system must not depend on paid proprietary software.

---

# 67. AI ASSET PIPELINE

AI-generated artwork should be treated as source material.

Pipeline:

```text
GENERATE
↓
CLEAN
↓
REMOVE BACKGROUND
↓
NORMALIZE
↓
SCALE
↓
STYLE CHECK
↓
IMPORT
↓
VALIDATE
```

Do not allow raw AI assets directly into production without normalization.

---

# 68. ASSET VALIDATION

Every asset should be checked for:

- resolution
- transparency
- naming
- dimensions
- color profile
- pivot
- orientation
- scale
- file format

---

# 69. ASSET NAMING

Use predictable names.

```text
char_marcus_body_01
char_marcus_face_angry
prop_briefcase_01
loc_diner_wall_01
vfx_smoke_01
sfx_door_open_01
```

---

# 70. SCENE AUTHORING TOOL

A lightweight internal Scene Editor is a P1 feature.

Interface:

```text
┌────────────────────────────────────────────────────────┐
│ SCENE EDITOR                                           │
├───────────────┬──────────────────────────┬─────────────┤
│ BEATS         │       PREVIEW            │ INSPECTOR   │
│               │                          │             │
│ ENTER         │                          │ Actor       │
│ DIALOGUE      │       LIVE SCENE         │ Action      │
│ MOVE          │                          │ Duration    │
│ REACTION      │                          │ Expression  │
│ CAMERA        │                          │             │
│ MINIGAME      │                          │             │
├───────────────┴──────────────────────────┴─────────────┤
│ TIMELINE                                                │
└─────────────────────────────────────────────────────────┘
```

---

# 71. EDITOR MVP

The first editor only needs:

- scene preview
- actor placement
- beat list
- beat editing
- play/pause
- scrub
- save/load
- validation

Do not build a full Unreal-style cinematic editor.

---

# 72. SCENE VALIDATOR

Before a scene is playable, validate:

```text
Missing actor?
Missing location?
Invalid beat?
Missing asset?
Broken branch?
Missing fallback?
Invalid dialogue?
Invalid mini-game?
```

Errors must be reported before runtime.

---

# 73. ERROR FORMAT

Example:

```text
SCENE VALIDATION ERROR

Scene:
mayor_office_001

Beat:
12

Problem:
Actor "rico" does not exist.

Suggested fix:
Add "rico" to participants.
```

---

# 74. DEBUG MODE

Developer build must expose:

```text
[F1] Scene debugger
[F2] Skip beat
[F3] Reload scene
[F4] Force success
[F5] Force failure
[F6] Show actor IDs
[F7] Show hitboxes
[F8] Show scene graph
[F9] Show world state
```

---

# 75. SCENE DEBUG OVERLAY

Optional overlay:

```text
SCENE: mayor_office_001
BEAT: 17 / 32
STATE: PLAYING
ACTOR: marcus
ANIMATION: shocked
CAMERA: reaction
SEED: 18273645
```

---

# 76. PERFORMANCE REQUIREMENTS

Target:

### PC

60 FPS minimum.

### Steam Deck

60 FPS target.

30 FPS acceptable during unusually heavy scenes if necessary.

Scene loading should avoid visible stalls.

---

# 77. MEMORY REQUIREMENTS

Scenes should load only required:

- actors
- props
- backgrounds
- audio
- VFX

Avoid loading the entire campaign into memory.

---

# 78. RESOURCE MANAGEMENT

Use:

- Godot ResourceLoader
- packed scenes
- asynchronous loading where appropriate
- asset caching
- reusable resources

---

# 79. SCENE PRELOADING

Before playback:

```text
LOAD LOCATION
↓
LOAD ACTORS
↓
LOAD REQUIRED AUDIO
↓
LOAD REQUIRED VFX
↓
VALIDATE
↓
START
```

If loading fails, present a safe fallback rather than crashing.

---

# 80. ACCESSIBILITY REQUIREMENTS

Mandatory:

- controller support
- keyboard support
- mouse support
- remapping
- subtitles
- adjustable text
- high contrast
- reduced motion
- screen shake toggle
- fast-forward
- skip
- pause
- audio controls
- color-independent indicators

---

# 81. CONTROLLER REQUIREMENTS

Default:

```text
A = Confirm
B = Back
X = Inspect
Y = Skip/Options
LB/RB = Previous/Next
LT/RT = Playback Speed
View = Chronicle
Menu = Pause
```

All mappings must be remappable.

---

# 82. STEAM DECK REQUIREMENTS

The system must:

- function entirely with controller
- provide readable 1280×800 UI
- support suspend/resume
- avoid mouse-only interactions
- correctly display controller prompts
- support Steam Input
- support handheld and TV viewing

---

# 83. UX REQUIREMENT

The player must always understand:

1. What is happening.
2. Who is involved.
3. What they chose.
4. What the AI chose.
5. Why the result occurred.
6. What changed afterward.

If any of these are unclear, the scene has failed UX review.

---

# 84. SCENE TIMING

Target:

### Standard scene

10–45 seconds.

### Important scene

45–90 seconds.

### Major scene

1–3 minutes.

Scenes longer than three minutes require strong justification.

---

# 85. PLAYER CONTROL

During normal playback:

```text
A
Continue

B
Skip/Back where applicable

X
Dialogue/scene details

Y
Playback options

LT/RT
Speed
```

---

# 86. SCENE INTERRUPTIONS

The system must safely handle:

- pause
- controller disconnect
- application suspension
- window focus loss
- scene skip
- save
- loading
- error recovery

---

# 87. FAILURE RECOVERY

If a scene fails:

1. Log error.
2. Preserve resolved game state.
3. Attempt generic fallback presentation.
4. Never corrupt the save.
5. Report developer diagnostics.

Player-facing error:

> "The scene presentation failed, but your story state was preserved."

Developer log contains technical details.

---

# 88. TESTING STRATEGY

Testing occurs at four levels.

## Unit

Individual systems.

## Integration

Systems working together.

## Scene

Individual scenes.

## Campaign

Long-term state persistence.

---

# 89. UNIT TEST TARGETS

Test:

- beat execution
- actor commands
- branching
- card tags
- compiler rules
- consequences
- save/load
- deterministic seeds
- mini-game results

---

# 90. AUTOMATED SCENE TESTS

Every scene should have a headless test.

Example:

```text
LOAD SCENE
↓
EXECUTE ALL BEATS
↓
VALIDATE
↓
VERIFY OUTCOME
↓
VERIFY CONSEQUENCES
```

---

# 91. CONTENT TESTING

Generate combinations such as:

```text
10 cards
×
5 locations
×
5 templates
×
4 twists
```

and validate that no combination causes runtime errors.

---

# 92. ACCEPTANCE TEST

A new scene must be creatable by editing only data files.

Example:

```text
Create:
new_scene.yaml

No engine code changes.

Run.

Scene works.
```

This is a core acceptance criterion.

---

# 93. VERTICAL SLICE

The first production milestone is:

# THE DINER

Required:

### Location

Diner.

### Actors

Player.

Marcus.

Bartender.

### Cards

Who.

Method.

Twist.

### Scene

Card reveal → cinematic playback.

### Mini-game

Escape.

### Consequence

Police suspicion.

### Relationship

Marcus trust.

### Chronicle

"The Diner Incident."

---

# 94. VERTICAL SLICE SUCCESS CRITERIA

The player must be able to:

1. Start a campaign.
2. Enter the diner.
3. Select cards.
4. Watch AI select cards.
5. Lock the scenario.
6. Watch cards reveal.
7. Watch the generated scene.
8. Play the escape mini-game.
9. Receive an outcome.
10. See consequences.
11. See Marcus react.
12. Open Chronicle.
13. See the event recorded.
14. Save.
15. Quit.
16. Reload.
17. See the world state preserved.

---

# 95. DEVELOPMENT PHASES

## PHASE 0 — FOUNDATION

Duration target:

### 1–3 days

Build:

- Godot project
- Git repository
- basic scene
- camera
- actor node
- test UI

Deliverable:

> One character appears and moves.

---

# 96. PHASE 1 — ACTOR SYSTEM

Duration target:

### 2–4 days

Build:

- modular actor
- expressions
- animation states
- movement
- facing
- dialogue anchor

Deliverable:

> Two characters can perform a conversation.

---

# 97. PHASE 2 — BEAT SYSTEM

Duration target:

### 2–4 days

Build:

- beat interface
- sequential execution
- dialogue beat
- movement beat
- camera beat
- reaction beat
- sound beat

Deliverable:

> A scene can be authored entirely from data.

---

# 98. PHASE 3 — SCENE RUNTIME

Duration target:

### 2–4 days

Build:

- scene loader
- scene state machine
- pause
- skip
- fast-forward
- error handling

Deliverable:

> A complete scene plays reliably.

---

# 99. PHASE 4 — CARD COMPILER

Duration target:

### 3–7 days

Build:

- card tags
- templates
- compiler
- fallback logic
- deterministic resolution

Deliverable:

> Different card combinations produce different scenes.

---

# 100. PHASE 5 — MINI-GAME

Duration target:

### 3–5 days

Build:

- mini-game manager
- escape prototype
- success
- partial success
- failure
- scene return

Deliverable:

> Scene → mini-game → scene works.

---

# 101. PHASE 6 — CONSEQUENCES

Duration target:

### 2–4 days

Build:

- consequence engine
- relationships
- world flags
- Chronicle
- persistence

Deliverable:

> The world remembers what happened.

---

# 102. PHASE 7 — SCENE EDITOR

Duration target:

### 5–10 days

Build:

- beat browser
- inspector
- preview
- timeline
- validation

Deliverable:

> New scenes can be authored without engine changes.

---

# 103. PHASE 8 — POLISH

Build:

- transitions
- camera polish
- audio
- VFX
- haptics
- accessibility
- Steam Deck testing

---

# 104. MINIMUM VIABLE PRODUCT

MVP should contain:

### 3 characters

### 3 locations

### 30–50 cards

### 5 scenario templates

### 3 mini-games

### 10–15 animations

### 8 expressions

### relationship system

### consequence system

### Chronicle

### Scene Machine

That is enough to prove the product.

---

# 105. CONTENT SCALABILITY

Once the engine works:

Adding a new card should require:

```text
1 card definition
+
tags
+
optional dialogue
```

Adding a new scene should require:

```text
1 scene/template definition
```

Adding a new location should require:

```text
location assets
+
location definition
```

Adding a new mini-game should require:

```text
mini-game implementation
+
scene integration definition
```

---

# 106. PRODUCTION RULE

Never add content faster than the system can support it.

The correct progression is:

```text
SYSTEM
↓
1 SCENE
↓
TEST
↓
SYSTEM IMPROVEMENT
↓
5 SCENES
↓
TEST
↓
CONTENT EXPANSION
```

---

# 107. CRITICAL ARCHITECTURAL RULE

The Scene Machine must never know what a specific card means narratively.

Instead:

```text
CARD
 ↓
TAG
 ↓
COMPILER
 ↓
SCENE TEMPLATE
 ↓
BEATS
```

This prevents hardcoded narrative logic.

---

# 108. EXTENSIBILITY

Future systems must be able to add:

- voice acting
- procedural dialogue
- online multiplayer
- additional mini-games
- new actor types
- faction scenes
- vehicles
- combat
- environmental destruction
- 3D staging
- modding

without rewriting the core runtime.

---

# 109. MODDING TARGET

Future scenes should be distributable as data packages.

Potential structure:

```text
mod/
├── manifest.json
├── scenes/
├── cards/
├── characters/
├── locations/
├── audio/
└── assets/
```

---

# 110. PERFORMANCE BUDGET

The Scene Machine must prioritize:

### CPU

Minimal per-frame logic.

### GPU

Simple 2D rendering.

### Memory

Load-on-demand resources.

### Storage

Compressed reusable assets.

Avoid unnecessary particle-heavy scenes.

---

# 111. QUALITY BAR

A scene is production-ready when:

- it communicates clearly
- animations don't visibly break
- characters don't overlap incorrectly
- camera doesn't obscure dialogue
- controller navigation works
- skip works
- pause works
- save state is safe
- consequences are correct
- no missing assets exist
- no debug information appears
- scene works at 1280×800
- scene works at desktop resolution

---

# 112. DEFINITION OF DONE — ENGINE

The Scene Machine is complete for MVP when:

```text
✓ Data-driven scenes
✓ Modular actors
✓ Reusable animations
✓ Camera system
✓ Dialogue
✓ Audio
✓ VFX
✓ Branching
✓ Card compiler
✓ Deterministic resolution
✓ Mini-game integration
✓ Consequences
✓ Chronicle
✓ Save/load
✓ Skip
✓ Fast-forward
✓ Accessibility
✓ Controller support
✓ Steam Deck support
✓ Debug tools
✓ Automated validation
```

---

# 113. DEFINITION OF DONE — CONTENT

A scene is complete when:

```text
✓ Scenario definition
✓ Card compatibility
✓ Scene template
✓ Actor list
✓ Location
✓ Beat sequence
✓ Dialogue
✓ Camera
✓ Audio
✓ VFX
✓ Outcome
✓ Consequences
✓ Chronicle entry
✓ Failure path
✓ Partial-success path
✓ Skip behavior
✓ Accessibility review
✓ Steam Deck test
```

---

# 114. DEVELOPMENT PRIORITY MATRIX

## P0

- Scene runtime
- Actor system
- Beat system
- Dialogue
- Camera
- Card compiler
- deterministic outcomes
- consequences
- save/load

## P1

- mini-games
- Chronicle
- scene editor
- procedural animation
- advanced AI reactions
- VFX

## P2

- replay
- modding
- advanced camera
- voice
- 3D staging
- advanced cinematic effects

---

# 115. WHAT NOT TO BUILD YET

Do not build:

- online multiplayer
- massive character creator
- hundreds of cards
- dozens of locations
- elaborate inventory
- procedural 3D environments
- advanced AI dialogue
- full voice acting
- custom animation editor
- elaborate combat

until the Scene Machine vertical slice works.

---

# 116. FINAL ARCHITECTURE

```text
                  PLAYER
                    │
                    ↓
              CARD SELECTION
                    │
                    ↓
               AI SELECTION
                    │
                    ↓
             SCENARIO RESOLVER
                    │
                    ↓
              CARD COMPILER
                    │
                    ↓
               SCENE GRAPH
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
     ACTORS      CAMERA       AUDIO
        │           │           │
        └───────────┼───────────┘
                    ↓
             SCENE PLAYBACK
                    │
                    ↓
               MINI-GAME
                    │
                    ↓
              FINAL OUTCOME
                    │
                    ↓
           CONSEQUENCE ENGINE
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
      WORLD STATE          CHRONICLE
          │                   │
          └─────────┬─────────┘
                    ↓
               NEXT SCENE
```

---

# 117. CORE PRODUCT INSIGHT

The Scene Machine should be treated as the game's equivalent of a **gameplay engine inside the narrative engine**.

Cards don't tell the player:

> "You unlocked dialogue option #4."

Cards tell the engine:

> "This is what these idiots decided to do."

The Scene Machine then turns that decision into:

> **a thing that actually happens.**

That is the product.

---

# 118. FINAL NORTH STAR

The complete system should make the player think:

> **"I made this happen."**

Then:

> **"I can't believe the game actually played that out."**

Then:

> **"Wait... that decision is going to matter later."**

And finally:

> **"Let's see what happens if I do something completely different."**

That loop is the foundation of CARD RPG.

---

# 119. FIRST PRODUCTION MILESTONE

Do not begin by making the full game.

Build exactly this:

## THE DINER VERTICAL SLICE

```text
3 CHARACTERS
     ↓
1 LOCATION
     ↓
3 CARD SLOTS
     ↓
AI CARD SELECTION
     ↓
CARD REVEAL
     ↓
GENERATED SCENE
     ↓
DIALOGUE
     ↓
REACTIONS
     ↓
ESCAPE MINI-GAME
     ↓
SUCCESS / PARTIAL / FAILURE
     ↓
RELATIONSHIP CHANGE
     ↓
WORLD STATE
     ↓
CHRONICLE
     ↓
SAVE / LOAD
```

If this works and feels good, **stop expanding the architecture and start making content**.

That is the fastest path from zero pixel-art experience and zero budget to a genuinely playable CARD RPG.