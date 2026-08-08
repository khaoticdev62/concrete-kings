# MINIGAME_ELITE_MECHANICS_PROMPT.md
# Concrete Kings — Elite Mini Game Mechanics Prompt System
# Version: 1.0

## 1. Purpose

Use this prompt system when:
- Designing a new minigame for a district or campaign beat.
- Reviewing existing minigame balance or juice.
- Generating external prompts for a minigame prototype.

## 2. Core Constraints

- Resolution: 320x180 logical pixels, 1280x720 display.
- Input: controller-first, one action per press or direction.
- Timing: resolve in under 20 seconds.
- Animation: strict 4-frame budget unless waived.
- Receipt: every minigame must emit at least one persistent narrative/system effect.

## 3. Minigame Categories

### 3.1 Card Battle / Face-Off

- Trigger: social showdown, barber shop, back room, police encounter.
- Flow: cue, reveal, resolve, receipt.
- Mechanics: power hierarchy, edge by district suit, counter by secret motif, feint with detection chance.
- Balance targets: 55% baseline win rate, +15% with edge, 40% feint success, +1 stress per round.

### 3.2 Chase / Block Run

- Trigger: escape from police, rival crew, or collapsing scene.
- Flow: cue, run, resolve, receipt.
- Mechanics: 3 lanes, obstacles, gaps, noise walls, stamina management.
- Balance targets: 70% clear success, 85% with stamina management, 5 fatigue = auto end.

### 3.3 Hustle / Trade

- Trigger: merchant, fence, informant, community leader interaction.
- Flow: cue, decision, resolve, receipt.
- Mechanics: visible margin, risk tags, bluff with detection, counter-offer.
- Balance targets: 15-25% profit margin, 30% bluff detection base, 50% counter acceptance.

### 3.4 Reputation Scene

- Trigger: public interaction where reputation matters.
- Flow: silent beat, NPC line, player choice, crowd reaction, receipt.
- Mechanics: tone matching, hidden crowd meter, district culture alignment.
- Balance targets: 60% tone match first encounter, 80% after intel, -1 to +2 reputation delta.

## 4. Receipt Rules

- Immediate: shown in end frame.
- Delayed: stored in `pendingConsequence` for next encounter or district transition.
- Echo: modifies future minigame without direct stat change.

## 5. Juice Requirements

- Camera shake: 2 frames on failure, 1 frame on success.
- Screen flash: red for heat, gold for reputation, blue for trust.
- Audio cue: distinct sound per outcome, no reuse across minigame types.
- Text pop: delta number in top-right for 1 second.

## 6. Implementation Contract

- Function signature: `resolveMinigame(type, state) -> updatedState + receipt[]`
- No hidden side effects.
- Receipts must be serializable to save format.
- Controller mapping: one action per button or direction, no combos.

## 7. Review Checklist

- [ ] Resolves under 20 seconds.
- [ ] State changes visible in one frame.
- [ ] At least one receipt emitted.
- [ ] No combos required.
- [ ] Audio cue distinct.
- [ ] Juice respects animation budget.
- [ ] Balance targets met in playtest.
