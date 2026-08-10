# Concrete Kings — Structured Scenario Compiler

## Goal
Replace freeform narrative generation with a deterministic scenario object
that compiles into a temporary runtime simulation. The scenario owns the beat
structure, outcomes, side quests, mini-games, and ending rules; the game only
renders and plays that compiled state.

This removes the need for an LLM to “freestyle” a cutscene. The story still
branches, but every branch is authored data, not generated text.

## Scenario Schema

```ts
type Scenario = {
  id: string;
  title: string;
  acts: Act[];
  originSecrets: Record<string, SecretDef>;
  sideQuests: Record<string, SideQuest>;
  endings: EndingRule[];
  world?: WorldSnapshot;
};

type Act = {
  number: number;
  title: string;
  beats: Beat[];
};

type Beat = {
  id: string;
  act: number;
  day: number;
  title: string;
  narrative: string;
  blackCard: string;
  tagConsequences: Record<string, Consequence>;
  trustNpc?: string;
  sideQuest?: string;
  miniGame?: string;
  choices?: Choice[];
};

type Consequence = {
  heat: number;
  trust: number;
  text: string;
};

type Choice = {
  id: string;
  label: string;
  requires?: string | number;
  effect?: (sim: Simulation) => void;
};

type SecretDef = {
  id: string;
  callbackText: string;
};

type SideQuest = {
  id: string;
  title: string;
  day: [number, number];
  trustNpc: string;
  rewardTrust: number;
  rewardFlag: string;
};

type EndingRule = {
  id: string;
  title: string;
  text: string;
  condition: (sim: Simulation) => boolean;
};

type WorldSnapshot = {
  heat: number;
  trust: Record<string, number>;
  flags: string[];
  receipts: Receipt[];
};
```

## Compiled Simulation

The compiler turns one `Scenario` into a temporary `Simulation` instance.
That instance is the only source of truth during a run. Cards, UI, and
mini-games mutate it; nothing writes back into the scenario definition.

```ts
class Simulation {
  readonly scenarioId: string;
  act: number;
  day: number;
  heat: number;
  trust: Record<string, number>;
  flags: string[];
  secrets: string[];
  sideQuestsCompleted: string[];
  beatHistory: BeatLog[];
  currentBeatIndex: number;
  miniGameQueue: string[];
  pendingChoice: Choice | null;

  tick(choice: string): TickResult;
  render(): RenderFrame;
  ending(): EndingRule | null;
  snapshot(): WorldSnapshot;
}
```

## Compiler Rules

1. Beats are sequential within an act.
2. A beat may queue one optional mini-game before advancing.
3. A side quest unlocks when its day window opens, but completion is still
   triggered by beat resolution or explicit interaction.
4. Tag inference remains deterministic text matching.
5. Act breaks are compiler-generated transitions, not authored beats.
6. Endings are evaluated in declaration order; first match wins.

## Bridge Between Cards and Gameplay

- Card submission -> `simulation.tick(cardText)`
- `tick()` applies `tagConsequences`, updates heat/trust/flags, records
  history, advances `currentBeatIndex`, and queues any attached mini-game.
- UI reads `simulation.render()` for the current frame.
- Mini-games read/write only `simulation`.
- No LLM prompt is needed at runtime. The narrative text is fixed authored
  content; only the simulation state changes.

## Integration Points

- `src/pixel_engine/first-miles-campaign.js` keeps `FIRST_MILES_BEATS`,
  `FIRST_MILES_SIDE_QUESTS`, `FIRST_MILES_ORIGIN_SECRETS` as scenario data.
- A new `src/pixel_engine/scenario-compiler.js` compiles those objects into
  `FirstMilesSimulation`.
- `FirstMilesCampaign` becomes a thin screen adapter around `Simulation`.
- Existing save/load serializes `simulation.snapshot()` plus `currentBeatIndex`.

## Acceptance Criteria

- `npm test` passes.
- No TODO/FIXME/placeholder/no-op/coming soon markers in touched files.
- Scenario data is pure JSON-like objects with no DOM access.
- `Simulation` has no network, no LLM call, and no randomness.
- A beat can be resolved, rendered, and saved deterministically.
