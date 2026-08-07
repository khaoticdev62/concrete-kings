# Game Board Fidelity — Design Spec

Date: 2026-08-07
Status: Approved for planning

## Context

Phase 3 of the UI-wireframe-fidelity effort (`UI_WIREFRAME_GAME_BOARD.txt`), following Phase 1 (Main Game Screen HUD) and Phase 2 (Character Creation). Phase 1's plan explicitly deferred "Card Selected zoom state, visible judging countdown, Ending screen final-stats panel, and the Action Bar" to this phase.

Investigation of the current codebase found the real gaps are smaller than the wireframe's state-machine language implies:

- **Card Selected**: `toggleCard()` (`index.html:3343`) already creates a real selected-but-unsubmitted state (`this.game.selected` Set, `SUBMIT SELECTION` button gated on it, `.selected` CSS class applied in `renderHand()`). The wireframe's "Card Selected" state is a visual treatment on an existing interaction, not a new state machine.
- **Judging countdown**: genuinely missing. `enterJudging()` (`index.html:3404`) shows submissions and lets the judge click one (resolving immediately via `chooseWinner(i)`) with no time limit at all.
- **Resolution hold**: `roundResult` waits indefinitely for a manual `NEXT ROUND` click — no auto-advance.
- **Ending stats**: the narrative ending's `winnerMeta` (`index.html:3494` area, set inside `chooseWinner()`) already shows `HEAT`/`TRUST`/secrets on game-end; missing Rep/Cash/Flags. `storyEngine.history` (an array of per-beat `{beat, card, category, consequenceText}` records) is already tracked but never displayed anywhere — a natural fit for a "REVIEW LOG" button.
- **Action Bar**: Play (`submitBtn`) and Map (`showBlockMap()`, `index.html:859`) already exist as real, working actions elsewhere on the game screen. Inventory and Quests have no underlying system — adding buttons for them would be non-functional decoration, repeating a mistake this project has already corrected twice this session (dead stats, dead mini-game hooks). They are explicitly out of scope.

## Design

### 1. Card Selected — visual zoom treatment

When a card is added to `this.game.selected` in `toggleCard()`, its canvas gets an enlarged/highlighted treatment (CSS transform scale + amber border glow, matching the existing `.selected` class hook already applied in `renderHand()`) and a hint line appears near the hand ("Selected — press SUBMIT to play, click again to deselect"). No change to the underlying selection logic — this is a CSS/small-DOM addition layered on the existing `.selected` class and `submitBtn` gating.

### 2. Judging countdown (12s, auto-pick)

`enterJudging()` starts a 12-second countdown, rendered as a visible timer element on the Judging screen (matching the wireframe's `TIMER 00:12` panel). If the judge (human or otherwise) hasn't resolved the round when it reaches zero, the app auto-calls `chooseWinner()` with a random submission index. The timer is cleared whenever `chooseWinner()` runs through any existing path (direct canvas click or the `CROWN WINNER` button), so it never fires after a real resolution. Online mode's judging flow is unaffected — the auto-pick only ever runs when `this.isJudge()` is true for the local human, matching the existing judge-only gating pattern already used for Veto/Double-Down (Phase 1's prior-session context).

### 3. Resolution auto-advance (5s or confirm)

`roundResult`'s existing `NEXT ROUND` / `BACK TO STOOP` button keeps working exactly as today for an early click. In addition, a 5-second timer starts when the screen is shown; if it elapses without a click, the app calls whichever action the visible button is currently wired to (`app.nextRound()` in classic/mid-campaign flow, `app.endNarrativeGame()` on an ending beat) — reading the button's own `onclick` at fire time rather than duplicating the branching logic, since `chooseWinner()` already sets that button's handler correctly for both cases.

### 4. Ending stats completeness + Review Log

The narrative ending's stats line (set in `chooseWinner()`'s `result.ended` branch) gains Rep/Cash (from `this.game.players[this.humanIndex].stats`) and any set flags (`storyEngine`'s tracked flags, if present — the existing secrets line pattern is reused for flags too, omitted entirely if none are set, matching the existing secrets line's own omit-if-empty behavior). A new `REVIEW LOG` button appears alongside `NEW GAME` on the ending screen, opening a simple overlay listing `storyEngine.history` beat-by-beat (beat number, the card played, and its consequence text) — reusing the existing modal-overlay visual pattern already established by Phase 2's Review/Character-Dossier modal.

### 5. Action Bar (consolidation)

A bottom action bar is added to the main game screen's default state, per the wireframe's `[ PLAY ] [ INVENTORY ] [ MAP ] [ QUESTS ]` layout — but populated with exactly one real action: **MAP** (calling the existing `showBlockMap()`). PLAY is not duplicated into the bar — `submitBtn` already serves that role prominently in the card-play area, and a second button doing the same thing would be redundant, not fidelity. Inventory and Quests are not built. The bar renders with the one button that does something rather than padding with disabled placeholders for systems that don't exist.

## Testing

- The judging countdown and resolution auto-advance are timer-driven DOM/`app`-object behavior — testable via `node --test` using fake timers (Node's `node:test` supports `mock.timers`, already available in this Node version per the existing `node --test` usage) to advance time without real waiting, calling the exported `app` from `loadGameModule()` the same way Phase 1's final review demonstrated is possible for other `app` methods. Manual browser verification still confirms the visible countdown renders correctly and the auto-pick/auto-advance is not jarring.
- Ending stats and Review Log get `node --test` coverage on `storyEngine.history`'s shape and content (already partially covered by existing tests) plus a new assertion on the ending stats string including Rep/Cash.
- Card Selected's visual treatment and the Action Bar are DOM-only and get manual verification.

## Out of scope

- Inventory and Quest systems — no data model, no content, would be non-functional if added now.
- City/Block Map screen redesign (tile-grid, legend, fast-travel, quest-filter) — separate phase per the parent spec's execution order.
- NPC/POI Scenes, Decision Panel, Mini-Game HUD — separate phases.
