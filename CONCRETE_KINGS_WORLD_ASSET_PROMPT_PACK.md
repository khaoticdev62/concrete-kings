# Concrete Kings — World & Asset Prompt Pack

## Contents
1. Elite Minigame Mechanics
2. Pixel Art Generation System
3. City Art Prompts
4. World-Building Prompt Layer
5. Asset Pipeline Prompts
6. Usage and Versioning

---

## 1. Elite Minigame Mechanics

### 1.1 Core Philosophy

Minigames in Concrete Kings are narrative pressure valves. They translate card choices into visceral, time-bound moments. Every minigame must:
- Resolve in under 20 seconds of real time.
- Show state changes in a single frame update.
- Branch on player input, not random chance alone.
- Emit at least one narrative receipt: trust delta, heat delta, reputation delta, secret unlock, or future encounter hook.
- Respect the 4-frame animation budget unless explicitly waived.

### 1.2 Universal Minigame Anatomy

1. Cue: what the player sees and hears before acting.
2. Input: the exact control or choice the player makes.
3. Read: the window where the player must commit.
4. Resolve: the frame where outcome is shown.
5. Receipt: the narrative or system consequence that persists.

#### State Contract
Every minigame receives and returns:
- `player.state`: trust, heat, reputation, secrets, cash, stress, fatigue
- `world.state`: weather, district alert level, time of night
- `narrative.state`: activeNPC, activeDistrict, lastChoice, pendingConsequence

#### Receipt Taxonomy
- Immediate: shown in the minigame end frame.
- Delayed: stored in `pendingConsequence`, resolved in next encounter or district transition.
- Echo: changes a future minigame modifier without direct stat change.

### 1.3 Card Battle / Face-Off

#### Trigger Context
- Social showdown: street corner, barber shop, back room, police encounter.
- Card round resolves into a direct confrontation with an NPC or authority figure.

#### Mechanics
- Deck: player hand vs NPC hand, 3 cards each, reveal simultaneously.
- Power hierarchy: A > K > Q > J > numeric; suit matters only for ties.
- Edge: if player leads with a card that matches the district's dominant suit, +1 power.
- Counter: if NPC leads with a card that matches the player's secret motif, NPC power -1.
- Feint: player can discard one card face down before reveal; feinted card counts as lowest value unless opponent calls the feint.

#### Timing
- Cue: 2 seconds, NPC portrait + opening line.
- Reveal: 0.5 seconds, cards flip.
- Resolve: 1 second, power comparison + crowd reaction frame.
- Receipt: 1 second, delta overlay.

#### Failure Modes
- Hesitation: if player does not commit within reveal window, auto-loss with heat +1.
- Overread: if player uses feint on a non-feint-able opponent, trust -1, heat +1.
- Show-off: if player wins by 2+ power, reputation +1, but heat +1 from attention.

#### Balance Targets
- Win rate baseline: 55% without secrets or modifiers.
- Edge bonus: +15% win rate when suit matches.
- Feint success: 40% success rate, 60% detection rate.
- Stress cost per round: +1 stress regardless of outcome.

### 1.4 Chase / Block Run

#### Trigger Context
- Escape from police, rival crew, or collapsing social scene.
- Must reach a waypoint before timer expires.

#### Mechanics
- Lanes: 3 lanes, player switches with left/right or A/D.
- Obstacles: static (wall, dumpster) and dynamic (cop, rival, pedestrian).
- Gap: short lane with no obstacle, gives speed boost.
- Noise wall: visual/sound cue that player must duck or slide under.
- Stamina: each dodge costs 1 stamina; stamina regenerates 1 per 3 seconds of clear run.

#### Timing
- Cue: 1.5 seconds, direction arrow + audio cue.
- Run: variable, 8-15 seconds based on district length.
- Resolve: 0.5 seconds, success or crash frame.

#### Failure Modes
- Obstacle hit: fatigue +2, heat +1, run continues at -20% speed.
- Cop catch: trust -1 if in friendly district, heat +2, reputation -1.
- Dead end: encounter switches to social minigame instead of chase reward.

#### Balance Targets
- Clear run success: 70% with average reaction.
- With stamina management: 85%.
- Fatigue threshold: at 5 fatigue, run ends automatically.

### 1.5 Hustle / Trade

#### Trigger Context
- Buying, selling, or trading goods, information, or favors.
- Merchant, fence, informant, or community leader.

#### Mechanics
- Offer: player sees item/value, NPC offers price.
- Margin: visible as a thin bar; green = profit, red = loss, yellow = break-even.
- Risk: each offer has a risk tag: low, medium, high.
- Bluff: player can inflate value by 10-30%; if bluff is called, trust -1, no deal.
- Counter: NPC may counter-offer; player can accept, reject, or walk away.

#### Timing
- Cue: 2 seconds, NPC offer + item icon.
- Decision: 5 seconds, accept/reject/bluff/counter.
- Resolve: 1 second, deal or no deal frame.

#### Failure Modes
- Bad deal: if player accepts red margin on high-risk item, heat +1.
- Called bluff: trust -1, reputation -1 in that district.
- Walk away: no stat change, but NPC remembers; future offers from this NPC are -10% value.

#### Balance Targets
- Acceptable profit margin: 15-25%.
- Bluff detection chance: 30% base, +10% per previous bluff with same NPC.
- Counter-offer acceptance: 50% chance NPC accepts player counter.

### 1.6 Reputation Scene

#### Trigger Context
- Public interaction where reputation matters: block party, corner store, community meeting, street performance.

#### Mechanics
- Silent beats: first 1.5 seconds, no text, just atmosphere and NPC animation.
- Line delivery: NPC speaks, player chooses response tone: hard, soft, joke, silence.
- Crowd meter: hidden meter shifts based on tone match with district culture.
- Receipt: reputation delta shown as crowd reaction frame.

#### Timing
- Silent beat: 1.5 seconds.
- NPC line: 2 seconds.
- Player choice: 3 seconds.
- Resolve: 1.5 seconds, crowd reaction + receipt.

#### Failure Modes
- Tone mismatch: if player picks hard in a soft district, reputation -1, heat +1.
- Silence: if player picks silence when NPC expects response, trust -1.
- Joke fail: if joke does not match district humor, reputation -1, stress +1.

#### Balance Targets
- Tone match rate: 60% for first encounter, 80% after district intel is bought.
- Reputation delta per scene: -1 to +2.
- Stress cost: +1 regardless of outcome.

### 1.7 Common Juice Rules

- Camera shake: 2 frames on failure, 1 frame on success.
- Screen flash: red on heat gain, gold on reputation gain, blue on trust gain.
- Audio cue: distinct sound per outcome, no reuse across minigame types.
- Text pop: show delta number in top-right for 1 second.

### 1.8 Implementation Notes

- Each minigame must be a single function: `resolveMinigame(type, state) -> updatedState + receipt[]`.
- All state mutations must be explicit; no hidden side effects.
- Receipts must be serializable to save format.
- Controller mapping: one minigame per button press or direction, no combos.

---

## 2. Pixel Art Generation System

### 2.1 Style Identity

Concrete Kings is a noir street-pixel game. Every asset must feel like it was cut from the same dark fabric.

- Gritty but readable.
- Dark dominant, with neon accents that punch through shadow.
- Silhouette-first; detail-second.
- No outlines for organic or weathered materials; hard outlines only for glass, metal, and UI chrome.
- All text rendered in 5x7 pixel font or smaller; prefer iconography over labels.

### 2.2 Resolution Discipline

- Native canvas: 320x180 logical pixels.
- Display scale: 4x integer upscale to 1280x720.
- No anti-aliasing. Nearest-filter scaling only.
- Every sprite must be divisible by 4 in both dimensions.
- UI elements must align to 4-pixel grid.

### 2.3 Color Bible

#### Dominant Palettes
- Concrete base: #3b3b4f, #2a2a3a
- Shadow tint: #140a07, #0a0402
- Neon accent: #ff7fbf, #00e5ff, #ffcc00
- Flame accent: #d9382e, #ff4d2a
- Street light: #ffcc88, #ff9944
- Skin tones: #26120b, #522717, #854224, #be6436

#### Material Rules
- Each material gets one dominant hue family.
- Leather: warm browns, no blue tint.
- Metal: cool grays with one highlight color.
- Glass: cyan or magenta tint, high transparency.
- Neon: bloom only through glow layers, not on the sprite itself.
- Concrete: desaturated purple-gray, avoid pure gray.

#### Value Separation
- Subject must read on both light and dark backgrounds.
- Test: blur the sprite. If the shape disappears, add value contrast.
- Minimum value spread: 3 stops from shadow to highlight on every character sprite.

### 2.4 Shape Language

#### Character Design
- Head-to-body ratio: 1:2 to 1:3 for player characters.
- Shoulder width: at least 1.5x head width for readability at small size.
- Silhouette test: if you remove all internal detail, can you still tell the character apart from others?
- Prop rule: every character carries one identifying prop that is visible in idle animation.

#### Environment Design
- Ground plane must be clearly defined by value, not just line.
- Overhangs and awnings create natural silhouette breaks.
- Street furniture: trash cans, fire hydrants, phone booths, newspaper boxes.
- Decal rule: graffiti, stickers, and posters are the only texture variation allowed on walls.

### 2.5 Animation Budget

Hard limit: 4 frames per animation cycle unless explicitly waived by lead.

#### Idle Cycle
- Frame 1: neutral.
- Frame 2: breath shift, 1-2 pixels.
- Frame 3: prop micro-movement.
- Frame 4: return to neutral.

#### Walk Cycle
- Frame 1: contact left.
- Frame 2: passing left.
- Frame 3: contact right.
- Frame 4: passing right.

#### Action Cycle
- Maximum 4 frames for any action: punch, dodge, interact, gesture.
- Reserve frame 4 for impact or reset.
- Never reuse walk frames for action animations.

### 2.6 Layering Rules

- World layer: backgrounds, buildings, ground.
- Character layer: player, NPCs, pets.
- FX layer: weather, neon bloom, screen shake particles.
- UI layer: HUD, cards, menus, text.

Rule: layers never share the same pixels. If a character overlaps a neon sign, the neon sign is in the world layer and the character casts a shadow on it.

### 2.7 Rendering Pipeline

#### Step 1: Silhouette
- Draw shape at 1-bit black/white.
- If it doesn't read, redesign before adding color.

#### Step 2: Value Study
- Block in 3 values: shadow, midtone, highlight.
- No color yet. If it reads here, it will read in color.

#### Step 3: Color Pass
- Apply color bible palette.
- Use hue variation only within the assigned material family.
- One surprise color per sprite: an accent that breaks the palette for narrative reason.

#### Step 4: Animation Pass
- Create 4-frame cycle.
- Test at 1x scale on 320x180 canvas.
- If it jitters, adjust registration point, not frame count.

#### Step 5: Integration Pass
- Place sprite in intended scene.
- Check contrast against background.
- Check readability at 4x upscale.
- Check that outline rules are followed.

### 2.8 Asset Categories and Standards

#### Player Character
- Size: 16x24 to 20x30 pixels.
- States: idle, walk, interact, card-play, hurt.
- Origin-specific colors applied via palette swap; same shape for all origins.
- Appearance variants: hair, fit, prop. Each is a 4-frame idle cycle.

#### NPC
- Size: 14x22 to 18x28 pixels.
- States: idle, talk, gesture, leave.
- District-specific silhouettes.
- Reputation-aware: posture changes based on player reputation level.

#### Props
- Size: 8x8 to 16x16 pixels.
- Must be readable at 1x scale.
- Interaction rule: if a prop is interactive, it has a 1-pixel highlight frame in idle.

#### Background Tiles
- Size: 16x16, 32x32, 64x64 pixels.
- Seamless edge rule: left and right edges must tile.
- Depth cue: background tiles are darker and less saturated than foreground.

#### Cards
- Size: 40x56 pixels in hand, 80x112 on table.
- Suit icons: 8x8 pixels.
- Rank text: 5x7 font, 8px tall.
- Frame: 1-pixel hard outline, inner 1-pixel highlight on top edge only.

#### UI Chrome
- Buttons: 8px border radius equivalent, 1-pixel inner bevel.
- Panels: 2-pixel outer border, 1-pixel inner shadow.
- Text: 5x7 font, white on dark, dark on light. No anti-aliasing.

### 2.9 Review Checklist

Before approving any asset:
- [ ] Reads at 1x scale on 320x180 canvas.
- [ ] No outlines on organic/weathered materials.
- [ ] Value separation minimum 3 stops.
- [ ] Animation cycles are exactly 4 frames.
- [ ] Layers are cleanly separated.
- [ ] Color matches material family.
- [ ] One surprise color present for narrative reason.
- [ ] Controller-visible: can you tell what it is while playing?

### 2.10 Prompt Templates for External Generation

When using AI or external artists, include:
- Style reference: noir pixel art, nearest-filter scaling, 320x180 native.
- Color reference: specific hex codes from color bible.
- Animation reference: 4-frame cycle, specific action.
- Context reference: where the asset appears, what light, what weather.
- Review reference: silhouette test, value test, integration test.

---

## 3. City Art Prompts

### 3.1 Real-City District Profiles

Use these profiles as the foundation for all district art. Each profile is grounded in real US city visual research.

#### Detroit — Midtown Alley
- Visual signature: brutalist concrete, boarded industrial brick, radial avenues, empty lots turning to prairie.
- Dominant materials: red brick, concrete block, steel frame, corrugated metal, broken glass.
- Lighting: sodium-vapor amber, flickering neon from surviving storefronts, headlights on wide empty avenues.
- Colors: #b85c38, #3b3b4f, #2a2a3a, #ff9944, #140a07.
- Mood: post-industrial resilience, hidden value, quiet danger.
- Time cue: 10 PM, almost all storefronts closed.
- Key detail: half-lots with tall grass, hand-painted signs, security grilles with local slogans.

#### Miami — Ocean Drive Strip
- Visual signature: Art Deco geometry, pastel stucco, palm canopies, neon hotel signage, oceanfront humidity.
- Dominant materials: stucco, terrazzo, glass block, neon, palm wood, chrome.
- Lighting: neon pink/blue, fluorescent motel signs, streetlamp halos through humidity.
- Colors: #ff7fbf, #00e5ff, #ffcc88, #ff4d2a, #26120b.
- Mood: surface glamour, latent heat, tourist vs local tension.
- Time cue: 11 PM, clubs letting out, ocean still warm.
- Key detail: pastel buildings with geometric borders, mosquitoes, steam from street drains.

#### New Orleans — French Quarter Corner
- Visual signature: French/Spanish iron balconies, pastel brick, gas lamps, live oaks, jazz residue.
- Dominant materials: brick, cast iron, cypress, slate, gas glass, wrought iron.
- Lighting: warm gas lamps, neon bar signs, porch lights through foliage, streetcar arcs.
- Colors: #d9382e, #854224, #ffcc00, #140a07, #26120b.
- Mood: memory, ritual, celebration and ruin intertwined.
- Time cue: midnight, bars closing, humidity heavy.
- Key detail: balcony beads, second-line footprints, jukebox glow from corner bars.

#### Houston — Underpass Strip
- Visual signature: sprawl fragments, glass-and-steel towers, strip megastructures, bayou mist, highway underpasses.
- Dominant materials: glass, steel, stucco, concrete panel, vinyl, sheet metal.
- Lighting: parking-lot floods, highway orange glow, skyscraper spire LEDs, neon bodega signs.
- Colors: #9c5c1d, #ffcc88, #393e4d, #2a2a3a, #d9382e.
- Mood: ambition without grid, hidden in plain sight, humidity and concrete.
- Time cue: 1 AM, city still moving but emptying.
- Key detail: freeway sound walls, taco trucks under floodlights, water stains on stucco.

#### Baltimore — Rowhouse Alley
- Visual signature: marble-fronted downtown, painted formstone row houses, harbor cranes, alley markets.
- Dominant materials: formstone, yellow Roman brick, marble, slate, iron, painted wood.
- Lighting: sodium streetlights, harbor spotlights, rowhouse porch lamps, neon from corner bars.
- Colors: #274f80, #ffcc88, #be6436, #3b3b4f, #d9382e.
- Mood: hard-edged charm, neighborhood loyalty, water and brick.
- Time cue: 9 PM, row-house lights on, alleys active.
- Key detail: painted screens on windows, white marble steps, alley communal space.

#### Chicago — El-Track Block
- Visual signature: steel-and-glass canyon, WPA stonework, elevated train tracks, lake wind, gritty riverwalk.
- Dominant materials: limestone, steel, glass, terra cotta, concrete, weathered bronze.
- Lighting: cool fluorescent under the L, amber storefronts, lakefront blue-white, neon theater marquees.
- Colors: #393e4d, #00e5ff, #ff9944, #181920, #d9382e.
- Mood: cold ambition, layered history, transit-driven urgency.
- Time cue: 11 PM, trains still running, wind off the lake.
- Key detail: el tracks shadowing side streets, alley garages, hot dog stands under heat lamps.

#### New York — Bodega Block
- Visual signature: dense vertical layering, bodega awnings, subway entrances, stacked signage, brownstone stoops.
- Dominant materials: brick, stone, cast iron, glass, fire escape steel, asphalt.
- Lighting: mixed: fluorescent bodegas, sodium avenues, neon bars, apartment window grids.
- Colors: #181920, #ffcc88, #d9382e, #00e5ff, #393e4d.
- Mood: information overload, anonymity, proximity and distance.
- Time cue: 1 AM, city still noisy but shifting to backstage.
- Key detail: stacked signs, fire escapes, steam from manholes, stoop culture.

#### Los Angeles — Boulevard Strip
- Visual signature: low-rise sprawl, palm canyons, drive-in architecture, mural walls, smog horizons.
- Dominant materials: stucco, glass, steel, concrete, tile, spray paint.
- Lighting: car headlight canyons, neon motel signs, billboard flood, streetlight pools.
- Colors: #ff7fbf, #ffcc00, #393e4d, #be6436, #3b3b4f.
- Mood: desire and distance, performance, sunburned nightlife.
- Time cue: 10 PM, nightlife still starting, traffic still heavy.
- Key detail: taco stand smoke, palm trunks, mural eyes, freeway sound.

#### Philadelphia — Stoop Row
- Visual signature: row-house rivers, stoop culture, Masonic stonework, Market-Frankford el, graffiti layers.
- Dominant materials: red brick, brownstone, granite, iron, concrete, paint.
- Lighting: orange sodium, bar neon, porch lights, el shadows.
- Colors: #b85c38, #ff9944, #2a2a3a, #d9382e, #26120b.
- Mood: stubborn history, neighborhood fortress, working-class grit.
- Time cue: 10 PM, stoops still active, el rattling.
- Key detail: painted doors, graffiti tags over historic stone, cheesesteak steam.

#### Atlanta — Corridor Strip
- Visual signature: marble facade downtown, split-level suburbs, kudzu overtaking brick, hip-hop mural corridors.
- Dominant materials: marble, brick, stucco, kudzu, steel, glass.
- Lighting: warm porch lights, MARTA fluorescents, neon strip clubs, highway halos.
- Colors: #854224, #ffcc00, #3b3b4f, #d9382e, #26120b.
- Mood: Southern noir, old money vs new hustle, red clay after rain.
- Time cue: 11 PM, clubs active, suburbs quiet.
- Key detail: kudzu on abandoned structures, peach-tinted streetlights, church fan hum.

#### Phoenix — Desert Wash
- Visual signature: desert sprawl, concrete washes, mountain silhouettes, neon drive-ins, ADU backyards.
- Dominant materials: concrete block, stucco, steel, desert tile, glass, adobe.
- Lighting: cool white LEDs, neon motel signs, mountain shadows, parking-lot floods.
- Colors: #d9382e, #ff9944, #2a2a3a, #393e4d, #26120b.
- Mood: heat after dark, isolation in plain sight, mirage commerce.
- Time cue: 9 PM, still hot, neon active.
- Key detail: palm shadows on concrete, saguaro silhouettes, swim bars after dark.

#### Seattle — Waterfront Block
- Visual signature: Pioneer Square brick, water under piers, evergreen backdrops, Pike Place neon, ferry headlights.
- Dominant materials: brick, timber, water-stained concrete, marine steel, glass, moss.
- Lighting: cool green-white LEDs, neon pub signs, ferry spotlights, rain reflections.
- Colors: #00e5ff, #3b3b4f, #393e4d, #26120b, #ff9944.
- Mood: wet darkness, coffee-warm interiors, water and forest pressure.
- Time cue: 10 PM, rain, bars closing, ferries still running.
- Key detail: neon reflected on wet brick, salmon tiles, coffee cup steam.

### 3.2 Scene Prompt Template

Subject: [specific location in district].
Lighting: [exact light source, color, direction].
Weather: [clear, rain, steam vent, siren light].
Palette: [3 dominant hex colors from district profile].
Mood: [suspicion, nostalgia, threat, excitement].
Style: noir pixel scene, nearest-filter scaling, no anti-aliasing, 320x180 native.
Composition: 2 foreground elements, 1 midground, 1 background cue.
Detail limit: max 3 interactive props per scene.

### 3.3 Example Scene Prompts

#### Detroit — Midtown Alley
Subject: alley behind Midtown barber shop at night, red neon barber pole reflection on wet concrete, security grille.
Lighting: sodium-vapor amber from parking lot, neon red glow on brick, headlights from avenue.
Weather: light rain, steam from sewer grate.
Palette: #b85c38, #3b3b4f, #ff9944.
Mood: hidden value, quiet danger, post-industrial resilience.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: wet concrete reflection, midground: security grille and neon barber pole, background: boarded brick building.

#### Miami — Ocean Drive Strip
Subject: Ocean Drive sidewalk at night, Art Deco hotel neon, palm canopy, wet terrazzo.
Lighting: neon pink/blue signage, streetlamp halo through humidity, fluorescent motel sign.
Weather: clear, humid, steam from street drain.
Palette: #ff7fbf, #00e5ff, #ffcc88.
Mood: surface glamour, latent heat, tourist vs local tension.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: wet terrazzo reflection, midground: palm trunk and neon sign, background: Art Deco facade.

#### New Orleans — French Quarter Corner
Subject: French Quarter corner at midnight, iron balcony, gas lamp, jukebox glow from bar.
Lighting: warm gas lamp on brick, neon bar sign, porch light through oak foliage.
Weather: humid, distant rain, streetcar arc in background.
Palette: #d9382e, #854224, #ffcc00.
Mood: memory, ritual, celebration and ruin intertwined.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: balcony beads on ground, midground: gas lamp and bar door, background: live oak and streetcar tracks.

#### Houston — Underpass Strip
Subject: highway underpass strip at night, bodega neon, taco truck under floodlight, sound wall graffiti.
Lighting: highway orange glow, parking-lot flood, skyscraper spire LED in distance.
Weather: humid, steam from vent, distant rain on freeway.
Palette: #9c5c1d, #ffcc88, #393e4d.
Mood: hidden in plain sight, ambition without grid, humidity and concrete.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: taco truck steam, midground: bodega neon and sound wall, background: freeway pillars and spire light.

#### Baltimore — Rowhouse Alley
Subject: rowhouse alley at night, painted formstone, marble steps, porch lamp, alley communal space.
Lighting: sodium streetlight, harbor spotlight in distance, porch lamp through window.
Weather: clear, distant rain on harbor.
Palette: #274f80, #ffcc88, #be6436.
Mood: hard-edged charm, neighborhood loyalty, water and brick.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: painted screen window, midground: marble steps and porch lamp, background: alley and harbor light.

#### Chicago — El-Track Block
Subject: el-track block at night, limestone building, neon theater marquee, wet asphalt, hot dog stand.
Lighting: cool fluorescent under el track, amber storefront, lakefront blue-white in distance.
Weather: wind-driven rain, lake mist.
Palette: #393e4d, #00e5ff, #ff9944.
Mood: cold ambition, layered history, transit-driven urgency.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: hot dog steam, midground: neon marquee and el shadow, background: lakefront glow.

#### New York — Bodega Block
Subject: bodega block at night, stacked signs, fire escape, subway entrance, steam from manhole.
Lighting: fluorescent bodega, sodium avenue, neon bar, apartment window grid.
Weather: steam from manhole, distant rain.
Palette: #181920, #ffcc88, #d9382e.
Mood: information overload, anonymity, proximity and distance.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: manhole steam, midground: fire escape and bodega awning, background: stacked signs and subway entrance.

#### Los Angeles — Boulevard Strip
Subject: boulevard strip at night, neon motel sign, mural wall, palm trunk, taco stand smoke.
Lighting: car headlight canyon, billboard flood, streetlight pool.
Weather: clear, smog horizon, distant freeway light.
Palette: #ff7fbf, #ffcc00, #393e4d.
Mood: desire and distance, performance, sunburned nightlife.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: taco stand smoke, midground: mural wall and neon motel sign, background: palm trunks and freeway.

### 3.4 City Mixer Prompt System

Use this system to remix any two cities into a new hybrid district. Pick one dominant city and one influence city, then merge their visual signatures while keeping gameplay clarity.

#### Mixer Template
District name: [neighborhood name].
Base city: [dominant visual signature, materials, lighting, palette].
Influence city: [secondary visual signature, materials, lighting, palette].
Hybrid rule: keep base city architecture and scale; import exactly one influence detail into foreground or midground.
Weather: [choose from base city profile].
Mood: [merge moods].
Time cue: [choose one].
Key detail: [one detail from base city, one from influence city].

#### Example Mixers

**Detroit + New Orleans — Railside Shrine**
- Base city: Detroit industrial brick, concrete block, sodium-vapor amber.
- Influence city: New Orleans iron balcony, gas lamp, live oak.
- Hybrid rule: Detroit warehouse block with New Orleans iron balconies on upper floor.
- Weather: humid, distant rain.
- Mood: post-industrial memory, ritual in decay.
- Time cue: 10 PM.
- Key detail: half-lot grass with iron balcony, security grille with Mardi Gras beads.

**Miami + Chicago — Lakefront Neon Strip**
- Base city: Miami Art Deco pastel stucco, neon pink/blue.
- Influence city: Chicago el track shadow, lakefront blue-white.
- Hybrid rule: pastel Art Deco strip under el track shadow.
- Weather: wind-driven mist, lakefront humidity.
- Mood: glamour under transit, cold neon heat.
- Time cue: 11 PM.
- Key detail: Art Deco border el shadow, neon sign reflected on wet lakefront asphalt.

**Houston + New York — Bodega Underpass**
- Base city: Houston highway underpass, bodega neon, stucco.
- Influence city: New York stacked signs, fire escape, steam.
- Hybrid rule: Houston underpass bodega with New York stacked signage and fire escape.
- Weather: steam from vent, distant freeway rain.
- Mood: hidden in plain sight, information overload.
- Time cue: 1 AM.
- Key detail: bodega neon under sound wall, fire escape above freeway pillar.

**Baltimore + Philadelphia — Brick River Block**
- Base city: Baltimore rowhouse formstone, painted screens, marble steps.
- Influence city: Philadelphia row-house brick, el shadow, stoop culture.
- Hybrid rule: Baltimore formstone rowhouses with Philadelphia brick row-house rhythm and el shadow.
- Weather: clear, distant rain on river.
- Mood: neighborhood fortress, stubborn history.
- Time cue: 10 PM.
- Key detail: painted screen on brick row-house, el shadow on marble steps.

**Los Angeles + Seattle — Wet Boulevard**
- Base city: Los Angeles boulevard, palm trunks, mural wall, neon motel.
- Influence city: Seattle wet brick, ferry spotlights, coffee steam.
- Hybrid rule: LA boulevard mural wall with Seattle wet brick and coffee steam.
- Weather: rain, neon reflected on wet asphalt.
- Mood: performance in rain, sunburned nightlife softened by water.
- Time cue: 10 PM.
- Key detail: palm trunk on wet brick, mural eyes reflected in puddle.

**Atlanta + New Orleans — Corridor Porch**
- Base city: Atlanta corridor strip, MARTA fluorescent, kudzu.
- Influence city: New Orleans iron balcony, gas lamp, porch culture.
- Hybrid rule: Atlanta strip with New Orleans iron balconies and porch culture.
- Weather: humid, kudzu damp, distant thunder.
- Mood: Southern noir, old money vs new hustle.
- Time cue: 11 PM.
- Key detail: kudzu on iron balcony, gas lamp on MARTA corridor wall.

**Phoenix + Miami — Desert Neon Strip**
- Base city: Phoenix desert sprawl, concrete wash, mountain silhouette.
- Influence city: Miami pastel stucco, neon pink/blue, palm canopy.
- Hybrid rule: Phoenix concrete block buildings with Miami pastel stucco facades and neon.
- Weather: clear, heat haze, distant desert rain.
- Mood: heat after dark, surface glamour in isolation.
- Time cue: 9 PM.
- Key detail: saguaro silhouette behind pastel neon sign, palm shadow on concrete wash.

**Seattle + Detroit — Wet Industrial Block**
- Base city: Seattle Pioneer Square brick, water-stained concrete, ferry spotlights.
- Influence city: Detroit industrial brick, security grille, half-lot grass.
- Hybrid rule: Seattle brick block with Detroit industrial security grille and half-lot.
- Weather: rain, neon reflected on wet brick.
- Mood: wet darkness, hidden value, post-industrial water.
- Time cue: 10 PM.
- Key detail: neon on water-stained brick, security grille with moss.

### 3.5 Transition Prompt Template

Scene change from [A] to [B].
Keep 1 anchor element constant across frames: [specific prop, light, or architectural detail].
Use fade or wipe consistent with in-world light source.
Avoid motion blur; prefer stepped pixel movement.
Duration: 1-2 seconds at 24fps, 24-48 frames.

#### Example Transitions

##### Detroit — Barber Shop → Alley
Scene change from barber shop interior to alley.
Anchor: red neon glow from barber pole.
Wipe: horizontal pixel wipe from right to left, following neon light direction.
No motion blur; 2-pixel stepped movement per frame.

##### Miami — Hotel Lobby → Ocean Drive
Scene change from hotel lobby to Ocean Drive sidewalk.
Anchor: neon hotel name in script.
Wipe: vertical pixel wipe from top to bottom, following palm canopy line.
No motion blur; 2-pixel stepped movement per frame.

##### New Orleans — Bar Interior → French Quarter Street
Scene change from bar interior to French Quarter street.
Anchor: jukebox glow fading as player exits.
Fade: black overlay fades in over 12 frames, cuts to street, fades out over 12 frames.

##### Houston — Bodega → Underpass Strip
Scene change from bodega to underpass strip.
Anchor: bodega neon sign remains visible.
Wipe: horizontal pixel wipe from left to right, following freeway direction.
No motion blur; 2-pixel stepped movement per frame.

##### Baltimore — Rowhouse Interior → Alley
Scene change from rowhouse interior to alley.
Anchor: porch lamp glow remains visible through window.
Fade: black overlay fades in over 12 frames, cuts to alley, fades out over 12 frames.

##### Chicago — Theater Interior → El-Track Block
Scene change from theater interior to el-track block.
Anchor: neon marquee remains visible through doorway.
Wipe: vertical pixel wipe from top to bottom, following el track height.
No motion blur; 2-pixel stepped movement per frame.

##### New York — Bodega → Sidewalk
Scene change from bodega to sidewalk.
Anchor: fluorescent bodega glow remains visible through window.
Fade: black overlay fades in over 8 frames, cuts to sidewalk, fades out over 8 frames.

##### Los Angeles — Motel Room → Boulevard
Scene change from motel room to boulevard.
Anchor: neon motel sign remains visible through window.
Wipe: horizontal pixel wipe from left to right, following freeway direction.
No motion blur; 2-pixel stepped movement per frame.

### 3.6 Environmental Storytelling Prompts

#### Graffiti Prompt Template
Subject: graffiti on [wall, phone booth, alley].
Content: [short phrase, 3-5 words, city-specific slang or neighborhood tag].
Style: spray-painted tag, drips, layered over older tags.
Color: one dominant color from district palette, one highlight.
Readability: must be legible at 1x scale.

#### Poster Prompt Template
Subject: [event, person, product] poster on [wall, lamp post, store window].
Content: [short text, 2-4 words, bold claim].
Style: wheatpaste, peeling at corners, layered over older posters.
Color: high contrast, one dominant color, one highlight.
Readability: must be legible at 1x scale.

#### Decal Prompt Template
Subject: [sticker, warning label, band logo] on [surface].
Content: [short text or icon].
Style: die-cut sticker, fading, scratches.
Color: flat color, no gradients.
Readability: must be legible at 1x scale.

### 3.7 Weather and Light Effects

#### Rain
- Pixel density: 2-3 rain pixels per column, 1 pixel tall.
- Ground reflection: 1-pixel mirror of neon signs, 50% opacity.
- Steam vent: 3-5 pixel columns, 20-40 pixels tall, value #3b3b4f.
- Siren light: 1-pixel red/blue flash, 2 frames on, 2 frames off, affects all sprites in scene.

#### Neon Bloom
- Glow layer: 1-pixel soft edge around neon source, same hue, lower value.
- Bloom intensity: 2-3 pixels maximum.
- Never bloom onto character layer.

#### Screen Shake
- Horizontal offset: 1-2 pixels.
- Vertical offset: 1 pixel.
- Duration: 2 frames on impact, 1 frame on close call.
- Never shake UI layer.

### 3.8 Implementation Notes

- All backgrounds must be tileable in 16x16, 32x32, or 64x64 chunks.
- Parallax layers: background moves at 0.25x, midground at 0.5x, foreground at 1.0x.
- Depth cue: background layers are darker and less saturated.
- Day/night variants: same shape, different value and color palette.
- Seasonal variants: same shape, different weather and foliage.

### 3.9 Review Checklist

Before approving any scene:
- [ ] Reads at 1x scale on 320x180 canvas.
- [ ] Dominant light source is clear.
- [ ] Dominant noise layer is implied, not explicit.
- [ ] Material palette matches district profile.
- [ ] Time-of-night cue is visible.
- [ ] Anchor element present for transitions.
- [ ] Weather effects respect pixel budget.
- [ ] Parallax layers are cleanly separated.

---

## 4. World-Building Prompt Layer

### 4.1 Narrative Environment Prompts

Use these prompts when generating world lore, district backstory, or environmental narrative hooks.

#### District Origin Prompt
Subject: the origin story of [district name].
Key event: [founding moment, disaster, migration, or deal].
Tone: [noir, hopeful, tragic, suspicious].
Style: 3-paragraph prompt, max 200 words.
Output: district name, founding year, key families, current power structure, one hidden secret.

#### NPC Backstory Prompt
Subject: [NPC name], a [role] in [district].
Motivation: [what they want, what they fear, what they owe].
Connection to player: [how they know the player's origin].
Tone: [warm, cold, suspicious, loyal].
Style: 2-paragraph prompt, max 150 words.
Output: name, role, motivation, fear, debt, one line of dialogue, one secret.

#### Encounter Hook Prompt
Subject: an encounter that triggers when player enters [district] at [time of night].
Condition: [weather, heat level, reputation, secret].
NPC: [name, role, tone].
Choice: [hard, soft, joke, silence].
Consequence: [immediate, delayed, echo].
Style: 1-paragraph prompt, max 100 words.
Output: encounter title, trigger, NPC, choice set, consequence tree.

### 4.2 District Relationship Prompts

Use these to map how districts see each other.

#### District Rivalry Prompt
District A: [name, dominant trait].
District B: [name, dominant trait].
Conflict: [resource, territory, respect, information].
History: [one past event that created the rift].
Current tension: [what would trigger open conflict].
Style: 2-paragraph prompt, max 150 words.
Output: rivalry name, cause, history, trigger, escalation path.

#### District Alliance Prompt
District A: [name, dominant trait].
District B: [name, dominant trait].
Bond: [shared enemy, shared profit, shared origin].
Risk: [what breaks the alliance].
Style: 2-paragraph prompt, max 150 words.
Output: alliance name, bond, risk, shared resource, betrayal condition.

### 4.3 Weather and World-State Prompts

#### Weather Shift Prompt
Current weather: [clear, rain, steam vent, police sirens, neon flicker].
Trigger: [time passage, district event, player action].
Next weather: [must differ from current].
Effect on gameplay: [dice modifier, betting cost, reputation change, encounter spawn].
Effect on narrative: [NPC reaction, district mood, visual cue].
Style: 1-paragraph prompt, max 100 words.
Output: weather shift, trigger, gameplay effect, narrative effect, visual cue.

#### District Alert Level Prompt
District: [name].
Current alert: [low, medium, high].
Trigger for change: [player action, NPC action, world event].
Effect on encounters: [new encounters, removed encounters, modified outcomes].
Effect on atmosphere: [lighting, sound, color shift].
Style: 1-paragraph prompt, max 100 words.
Output: alert level, trigger, encounter changes, atmosphere changes.

### 4.4 Lore and Easter Egg Prompts

#### Hidden History Prompt
Subject: an event that is not in any official record but is known to [district] elders.
Clue type: [graffiti, NPC dialogue, prop detail, environmental storytelling].
Revelation: [what player learns, how it changes a choice].
Style: 1-paragraph prompt, max 100 words.
Output: event name, clue type, revelation, affected choice, affected NPC.

#### Recurring Motif Prompt
Motif: [object, phrase, color, sound].
First appearance: [district, encounter].
Meaning: [what it represents to the player, to the district, to the world].
Evolution: [how it changes across the story].
Style: 1-paragraph prompt, max 100 words.
Output: motif, first appearance, meaning, evolution, final resonance.

---

## 5. Asset Pipeline Prompts

### 5.1 Generation Request Template

When requesting assets from external tools or artists, always include:
- Asset name and type.
- Native resolution: 320x180 logical pixels.
- Display scale: 4x upscale to 1280x720.
- Style: noir pixel art, nearest-filter scaling, no anti-aliasing.
- Color reference: specific hex codes from color bible.
- Animation reference: 4-frame cycle, specific action.
- Context: where the asset appears, what light, what weather.
- Review: silhouette test, value test, integration test.

### 5.2 Review Request Template

When submitting assets for review, include:
- Asset file and sprite sheet.
- Native resolution confirmation.
- Animation frame count confirmation.
- Color palette confirmation.
- Integration screenshot in intended scene.
- Checklist completion: silhouette, value, animation, layers, color, surprise color, controller visibility.

### 5.3 Iteration Prompt Template

When requesting changes, specify:
- What failed: silhouette, value, color, animation, integration.
- Exact change: "increase contrast by 2 stops", "add 1-pixel highlight on left edge", "reduce frame count to 4".
- Constraint reminder: 320x180 native, 4-frame max, nearest-filter.
- Priority: must-fix before merge, nice-to-have, post-launch.

---

## 6. Usage and Versioning

### 6.1 Version Rules
- Major version: structural change to style, color bible, or animation budget.
- Minor version: new district, new minigame type, new asset category.
- Patch version: typo fix, prompt clarification, example update.

### 6.2 Prompt Hygiene
- Never reuse a prompt across districts without adapting the palette and mood.
- Never add new colors without updating the color bible.
- Never exceed the 4-frame animation budget without explicit lead approval.
- Always test at 1x scale before upscaling.

### 6.3 File Naming Convention
- Minigame prompts: `MINIGAME_<TYPE>_PROMPT.md`
- Asset prompts: `ASSET_<CATEGORY>_PROMPT.md`
- District prompts: `DISTRICT_<NAME>_PROMPT.md`
- World prompts: `WORLD_<LAYER>_PROMPT.md`

### 6.4 Integration Points
- `src/pixel_engine/`: rendering engine, animation controller, FX layer.
- `src/pixel_engine/first-miles-campaign.js`: encounter definitions, receipt handling.
- `index.html`: HUD, cards, menus, UI chrome.
- `test/`: validation for prompt compliance, animation budget, color fidelity.

### 6.5 Review Gates
- Code review: prompt changes must be reviewed by art lead and narrative lead.
- Playtest: new prompts must be validated in-game before merge.
- Regression: prompt changes must not break existing assets or encounters.
