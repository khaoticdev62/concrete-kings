# Create a Character Screen — Deep Research & Claude Code Prompt

## Current State Diagnosis
From `index.html` character creation view:
- `characterCreationView` is a dense two-column layout inside `#setup`.
- Left column: origin cards + attribute bars.
- Right column: name input, lobby settings, appearance toggles, secret select, preview canvas, deck/shop buttons.
- Bottom confirmation bar and modals for review/journey.
- Lexicon HUD is embedded directly below creation, adding noise and competition for attention.

Pain points:
- No guided progression; it reads like a settings dump.
- Appearance controls are tiny and lack strong active-state feedback.
- Origin selection is not visually dominant despite being the most narrative choice.
- Review/dossier exists, but is modal and separated from the flow rather than being a dedicated step.
- Deck/shop shortcuts in creation context are distractors from the core task.

## Research Summary
Sources and insights:
- Character creation UX research (`uxdesign.cc`, ResearchGate, Diva Portal):
  - Stepwise interfaces outperform single-page forms for clarity and completion.
  - Preview and pose/lighting choices increase ownership and satisfaction.
  - Too many simultaneous choices increase decision fatigue and abandonment.
  - Save/share hooks are valued; for us, that maps to dossier/randomize/back/confirm.
- Game UI patterns:
  - Strong primary action per screen reduces ambiguity.
  - Progress indicators improve orientation in multi-step flows.
  - Secondary actions should be clearly subordinate in color, placement, and weight.
- Retro/pixel UI best practices:
  - Pixel fonts work well if hierarchy is created via size/weight/spacing, not font-family chaos.
  - High-contrast accents should be reserved for primary actions and active states.
  - Consistent spacing and alignment matter more than decoration in dense HUD-style UIs.

## Design Direction
### Core Principles
1. Guided 4-step wizard with explicit progress indicator.
2. Persistent right-side preview + summary panel.
3. One obvious primary action per step.
4. Clear visual states for selected/active choices.
5. Preserve existing element IDs used by JS bindings to avoid breaking flow.
6. Remove lexicon from creation; keep it accessible from main menu/setup only.
7. Keep 1280x720 baseline, existing palette, and pixel-font stack.

### Step Structure
1) ORIGIN
- Large origin cards in a responsive grid.
- Each card shows origin name, one-line flavor, and STR/WIT/SOUL/CASH summary.
- Active card has strong highlight/border treatment.
- Random origin button and simple filter chips if practical.

2) APPEARANCE
- Single-select tiles for hair, fit, and prop.
- Large enough for controller/keyboard navigation and quick scanning.
- Active tile uses consistent accent treatment.
- Updates `setup-character-preview` live.

3) BACKSTORY
- Secret/backstory selector with 1-2 sentence narrative flavor and gameplay hint.
- Player name and lobby settings live here: hostName, playerCount, pointsToWin.
- Keep options understandable without reading a manual.

4) REVIEW & CONFIRM
- Read-only dossier summarizing origin, appearance, secret, name, and lobby settings.
- Primary action: confirm into journey modal.
- Secondary actions: randomize, back.
- journeyModal remains the mode picker after confirm.

### Navigation and Actions
- Step indicator at top: ORIGIN → APPEARANCE → BACKSTORY → REVIEW.
- Completed steps visually distinct from current and future steps.
- Bottom action bar per step:
  - Back / Randomize where applicable
  - Next / Confirm as primary
- Controller-friendly focus movement:
  - Tab/arrow key traversal between selectable cards/tiles.
  - Enter/Space to select.
  - Visual focus ring on the active selectable element.

### Visual Hierarchy
- Titles: Press Start 2P, accent color `#ffcd68`.
- Body: JetBrains Mono, muted `#cbd5ed`.
- Primary buttons: high-contrast accent with strong border.
- Secondary buttons: lower contrast, smaller type.
- Active states:
  - Origin card: accent border + subtle glow/shadow.
  - Appearance tile: accent border + filled indicator.
  - Secret selector: accent underline or left border.

### Preservation Rules
Do not break existing bindings:
- `characterOriginSelect`
- `characterSecretSelect`
- `hostName`
- `playerCount`
- `pointsToWin`
- `journeyModal`
- `reviewModal`
- `reviewContent`
- `setup-character-preview`
- `originCardsContainer`
- `attributesPanel`
- appearance button IDs: `hair-*`, `fit-*`, `prop-*`
Keep behavior:
- `confirmCharacter()` validates then shows `journeyModal`.
- `randomizeCharacter()` fills fields with valid random choices.
- Journey modes remain: local, online, campaign, sandbox mini-games.

## Claude Code Prompt

Use this exact prompt with Claude Code to implement the redesigned character creation screen in `index.html` only:

```
Rework the character creation flow in index.html only. Keep the same palette, pixel fonts, and 1280x720 baseline. Preserve existing element IDs used by JS bindings: characterOriginSelect, characterSecretSelect, hostName, playerCount, pointsToWin, journeyModal, reviewModal, reviewContent, setup-character-preview, originCardsContainer, attributesPanel, and all appearance button IDs. Do not break current startJourneyLocal/startJourneyOnline/startJourneyCampaign/startJourneySandbox flow.

Implement a 4-step wizard:
1) ORIGIN: large selectable origin cards with active highlight, flavor text, and STR/WIT/SOUL/CASH summary. Random origin button + simple filter chips if practical.
2) APPEARANCE: larger selectable tiles for hair/fit/prop with live preview update in setup-character-preview. Single-select per category with clear active state.
3) BACKSTORY: secret/backstory selector with short narrative flavor and gameplay hint. Keep character name + lobby settings here.
4) REVIEW & CONFIRM: read-only dossier with back/randomize/confirm actions. journeyModal remains the mode picker after confirm.

UI rules:
- One primary action per step.
- Step indicator at top.
- Move lexicon HUD out of creation; it belongs on main menu/setup only.
- Keep pixel font stack and existing CSS class conventions.
- Make click targets at least 7px tall with visible active states.
- Add keyboard-friendly selection where practical.

JS rules:
- Add app.nextCreationStep() and app.prevCreationStep().
- Add app.updateOriginCards() and app.updatePreview().
- Add app.updateReviewDossier().
- Keep confirmCharacter() behavior the same: validate then show journeyModal.
- Keep randomizeCharacter() behavior the same.

Tests:
- Add test/character-creation.test.js covering step navigation, origin selection, appearance selection, secret selection, review dossier population, confirm opens journey modal, and randomize fills fields.
- Run npm test and ensure green.
```

## Implementation Notes for Claude Code
- Keep all existing origin data and attribute mapping intact; this is a UI flow change, not a data-model rewrite.
- Origin cards should reuse existing origin definitions; do not invent new origins.
- Appearance preview updates can reuse existing canvas preview behavior if present; otherwise make a minimal visual change to prove wiring.
- Review dossier should summarize current selections in plain text into `reviewContent`.
- Journey modal should not be redesigned unless necessary; keep current mode buttons.

## Test Plan
Add `test/character-creation.test.js`:
- Step indicator starts at step 1.
- Selecting an origin updates summary values and active card state.
- Selecting appearance updates preview and marks active tile.
- Selecting secret updates dossier when review step is reached.
- Confirm shows journey modal only after validation passes.
- Randomize fills valid values for origin, appearance, secret, and lobby fields.
- Back/Next navigation preserves current selections.
- npm test remains green after changes.

## Acceptance Criteria
- Character creation is clearly a 4-step guided process.
- Each step has one obvious primary action.
- Active selection state is visually obvious for origins, appearance, and secrets.
- Preview updates on appearance changes.
- Review step shows a complete dossier before journey selection.
- Lexicon is not embedded in character creation.
- All existing JS bindings remain intact.
- npm test passes with the new test file.
