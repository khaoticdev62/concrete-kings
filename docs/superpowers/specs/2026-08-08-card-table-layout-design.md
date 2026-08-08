# Card Table Layout — Design Spec

Date: 2026-08-08
Status: Approved for implementation

## Context

At 1280x720 the `#game` screen's content measures 1386px inside a 595px screen
frame. The player scrolls to reach their own hand, the black card, the submit
button, the RPG stat HUD and the scoreboard. Measured in-browser.

Removing the side-on block viewport (`2026-08-08-topdown-city-map-design.md`)
reclaimed roughly 640px of vertical space, but nothing was laid out to use it.
That spec deliberately deferred this rework; this is it.

**The root cause is a missing CSS rule, not crowding.** The class
`game-bottom-grid` appears once in `index.html` markup and is defined nowhere —
not in the inline stylesheet, not in `pixel-engine.css`. It falls back to
`display: block`, so the hand column and the status rail stack vertically
instead of sitting side by side. Both measure 1023px wide. That one missing rule
accounts for 312px of the overflow.

Measured breakdown against the 595px budget:

| Block | Now | Target |
|---|---:|---:|
| Narrative panel (hard-coded `height:300px`) | 300 | 130 |
| Round info / pass-device strip | 173 | 55 |
| Main row (stacked 312 + 518) | 830 | 355 |
| `[ MAP ]` in its own panel | 59 | 0 |
| Margins | 24 | 20 |
| **Total** | **1386** | **560** |

## Design

### 1. Define `game-bottom-grid`

Add the missing rule as a two-column grid: the hand and black card on the left,
the status rail on the right, with the rail at a fixed track width so the hand
gets the remaining space.

```css
.game-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 12px;
  align-items: start;
}
```

`minmax(0, 1fr)` rather than `1fr` so the hand column can shrink below its
content width instead of forcing the grid wider — the hand is a horizontal card
strip and must be allowed to clip and scroll internally.

Below 1000px the grid collapses to one column, since a 300px rail beside a
hand strip stops being usable on narrow screens.

### 2. Narrative panel: fixed 300px becomes 130px with internal scroll

The panel currently hard-codes `height: 300px`. It becomes `height: 130px` with
`overflow-y: auto` on its text area, so a long story beat scrolls in place
rather than pushing the table off-screen. The beat title stays pinned and
visible; only the body text scrolls.

### 3. Fold chat into the existing right-tab system

The status rail currently stacks four panels — RPG stat HUD (99px), scoreboard
(219px), community chat (114px), dev console (38px) — totalling 518px. The rail
must fit 355px.

`switchRightTab(tabId)` already exists and toggles between `scoreboard` and
`receipts`. Extend it to a third tab, `chat`, so three stacked panels become one
tabbed panel: **SCOREBOARD / RECEIPTS / CHAT**. This reuses a pattern already in
the codebase rather than inventing one, and it is what makes the rail fit.

The rail becomes: RPG stat HUD (with its SHOP button) + one tabbed panel + the
dev console, which stays the collapsed `<details>` it already is.

### 4. Compress the round strip and fold in `[ MAP ]`

The round-info block drops to a single line (round, judge, turn prompt, deck
counts). The pass-device banner stays but loses its vertical padding. `[ MAP ]`
moves out of its own 59px panel and into the action row beside SUBMIT SELECTION
and PASS / END TURN.

### 5. What must be visible without scrolling

Black card, the player's hand, submit and pass, the RPG stat HUD including its
SHOP button, and whichever right tab is active. These are the elements required
to take a turn.

The dev console remains collapsed. Non-active tabs are one click away by design.

## Known tension

560px of a 595px budget is tight, and it assumes a 4-player scoreboard. At 8
players the scoreboard tab scrolls internally rather than growing the rail — the
tabbed panel gets a fixed max height so the rail's height never depends on
player count. This is deliberate: an internally-scrolling scoreboard is correct,
but a rail that grows with player count would reintroduce the original bug.

## Testing

- The game screen's `scrollHeight` is within 2px of its `clientHeight` at
  1280x720, asserted with both 4 and 8 players — 8 players is the case that
  would regress if the rail were allowed to grow.
- `game-bottom-grid` resolves to `display: grid` with two column tracks. This
  guards the actual root cause: a class referenced in markup but defined nowhere
  fails silently, which is how it shipped.
- `switchRightTab` shows exactly one of scoreboard/receipts/chat at a time, and
  every tab id it accepts corresponds to a panel that exists.
- The turn-critical elements listed in section 5 are inside the viewport at
  1280x720 without scrolling.

Measurement note for anyone verifying by hand: `body` and `.wrap` are
`100vh; overflow:hidden`, so `documentElement.scrollHeight` always reports 720
and looks like a perfect fit regardless. Measure the `.screen` element's
`scrollHeight` against its `clientHeight`.

## Out of scope

- The Game Board and Main Game Screen wireframe documents, which remain
  near-duplicates needing collapse into one. Separate project.
- Judging, round-result, and game-over screen layouts. This spec covers the
  default play state only; those states reuse the same screen but arrange
  different panels and would each need their own measurement pass.
- Recolouring `assets/topdown-recolor/`, and district arrival art from the
  remaining 15 unused scenes.
