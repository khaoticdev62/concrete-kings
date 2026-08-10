# Implementation Guide
## Scenario compiler, save schema, tests, integration map

### Scenario Compiler Integration
- Card submission -> simulation.tick(cardText)
- Beat resolution updates state deterministically
- Act breaks and endings derived from state
- No LLM, no randomness

### Save/Load Schema
- scenario id
- current beat/act index
- district, position, facing
- heat, trust map, flags, receipts
- side quests completed
- world state flags
- mini-game state if active

### Test Requirements
- Each beat fork has a deterministic state transition test
- NPC trust thresholds gate dialogue options
- Storylet trigger tests by heat/flag/act/time
- Receipt discovery tests
- Ending gate tests
- World state mutation tests
- Delayed consequence chain tests

### Integration Points
- `src/pixel_engine/first-miles-campaign.js` keeps authored beat data
- `src/pixel_engine/scenario-compiler.js` compiles to Simulation
- `FirstMilesCampaign` becomes thin screen adapter
- `index.html` renders from simulation.render()
- Mini-games read/write only simulation state
- Save/load serializes simulation.snapshot()
