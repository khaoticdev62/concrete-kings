# CITY_ART_PROMPTS.md
# Concrete Kings — City Art Prompt System
# Version: 1.0

## 1. Real-City District Profiles

Use these profiles as the foundation for all district art. Each profile is grounded in real US city visual research.

### 1.1 Detroit — Midtown Alley
- Light: sodium-vapor amber from parking lot floods, flickering neon from surviving barber and liquor signs.
- Noise: distant police scanner, wide avenue headlights, train horn.
- Material: red brick, concrete block, steel frame, corrugated metal, broken glass.
- Time cue: 10 PM, almost all storefronts closed.
- Palette: #b85c38, #3b3b4f, #2a2a3a, #ff9944, #140a07.
- Mood: post-industrial resilience, hidden value, quiet danger.
- Key detail: half-lot tall grass, hand-painted signs, security grilles with local slogans.

### 1.2 Miami — Ocean Drive Strip
- Light: neon pink/blue Art Deco signage, fluorescent motel signs, streetlamp halos through humidity.
- Noise: bass from club, distant ocean, mosquitoes.
- Material: pastel stucco, terrazzo, glass block, chrome, palm wood.
- Time cue: 11 PM, clubs letting out, ocean still warm.
- Palette: #ff7fbf, #00e5ff, #ffcc88, #ff4d2a, #26120b.
- Mood: surface glamour, latent heat, tourist vs local tension.
- Key detail: geometric Art Deco borders, steam from street drains, neon hotel name in script.

### 1.3 New Orleans — French Quarter Corner
- Light: warm gas lamps, neon bar signs, porch lights through live oak foliage, streetcar arcs.
- Noise: jazz from corner bar, distant streetcar bell, fountain.
- Material: brick, cast iron, cypress, slate, wrought iron, gas glass.
- Time cue: midnight, bars closing, humidity heavy.
- Palette: #d9382e, #854224, #ffcc00, #140a07, #26120b.
- Mood: memory, ritual, celebration and ruin intertwined.
- Key detail: iron balcony beads, second-line footprints, jukebox glow.

### 1.4 Houston — Underpass Strip
- Light: highway orange glow underpass, parking-lot floods, skyscraper spire LEDs, neon bodega signs.
- Noise: freeway drone, distant train, AC compressor hum.
- Material: glass, steel, stucco, concrete panel, vinyl, sheet metal.
- Time cue: 1 AM, city still moving but emptying.
- Palette: #9c5c1d, #ffcc88, #393e4d, #2a2a3a, #d9382e.
- Mood: ambition without grid, hidden in plain sight, humidity and concrete.
- Key detail: sound wall graffiti, taco truck under floodlight, water stains on stucco.

### 1.5 Baltimore — Rowhouse Alley
- Light: sodium streetlights, harbor spotlights, rowhouse porch lamps, neon from corner bar.
- Noise: harbor horn, distant train, alley conversation.
- Material: formstone, yellow Roman brick, marble, slate, iron, painted wood.
- Time cue: 9 PM, row-house lights on, alleys active.
- Palette: #274f80, #ffcc88, #be6436, #3b3b4f, #d9382e.
- Mood: hard-edged charm, neighborhood loyalty, water and brick.
- Key detail: painted window screens, white marble steps, alley communal space.

### 1.6 Chicago — El-Track Block
- Light: cool fluorescent under the L, amber storefronts, lakefront blue-white, neon theater marquee.
- Noise: train rumble, wind off the lake, alley garage door.
- Material: limestone, steel, glass, terra cotta, concrete, weathered bronze.
- Time cue: 11 PM, trains still running, wind off the lake.
- Palette: #393e4d, #00e5ff, #ff9944, #181920, #d9382e.
- Mood: cold ambition, layered history, transit-driven urgency.
- Key detail: el track shadows on wet asphalt, hot dog stand under heat lamp, alley garage.

### 1.7 New York — Bodega Block
- Light: fluorescent bodega, sodium avenue, neon bar, apartment window grid.
- Noise: subway grate rumble, crosswalk signal, distant siren.
- Material: brick, stone, cast iron, glass, fire escape steel, asphalt.
- Time cue: 1 AM, city still noisy but shifting to backstage.
- Palette: #181920, #ffcc88, #d9382e, #00e5ff, #393e4d.
- Mood: information overload, anonymity, proximity and distance.
- Key detail: stacked signs, fire escapes, steam from manhole, stoop culture.

### 1.8 Los Angeles — Boulevard Strip
- Light: car headlight canyons, neon motel sign, billboard flood, streetlight pool.
- Noise: freeway sound, distant siren, taco stand smoke.
- Material: stucco, glass, steel, concrete, tile, spray paint.
- Time cue: 10 PM, nightlife still starting, traffic still heavy.
- Palette: #ff7fbf, #ffcc00, #393e4d, #be6436, #3b3b4f.
- Mood: desire and distance, performance, sunburned nightlife.
- Key detail: palm trunk silhouette, mural eyes, drive-in speaker post.

## 2. Scene Prompt Template

Subject: [specific location in district].
Lighting: [exact light source, color, direction].
Weather: [clear, rain, steam vent, siren light].
Palette: [3 dominant hex colors from district profile].
Mood: [suspicion, nostalgia, threat, excitement].
Style: noir pixel scene, nearest-filter scaling, no anti-aliasing, 320x180 native.
Composition: 2 foreground elements, 1 midground, 1 background cue.
Detail limit: max 3 interactive props per scene.

## 3. Example Scene Prompts

### 3.1 Detroit — Midtown Alley
Subject: alley behind Midtown barber shop at night, red neon barber pole reflection on wet concrete, security grille.
Lighting: sodium-vapor amber from parking lot, neon red glow on brick, headlights from avenue.
Weather: light rain, steam from sewer grate.
Palette: #b85c38, #3b3b4f, #ff9944.
Mood: hidden value, quiet danger, post-industrial resilience.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: wet concrete reflection, midground: security grille and neon barber pole, background: boarded brick building.

### 3.2 Miami — Ocean Drive Strip
Subject: Ocean Drive sidewalk at night, Art Deco hotel neon, palm canopy, wet terrazzo.
Lighting: neon pink/blue signage, streetlamp halo through humidity, fluorescent motel sign.
Weather: clear, humid, steam from street drain.
Palette: #ff7fbf, #00e5ff, #ffcc88.
Mood: surface glamour, latent heat, tourist vs local tension.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: wet terrazzo reflection, midground: palm trunk and neon sign, background: Art Deco facade.

### 3.3 New Orleans — French Quarter Corner
Subject: French Quarter corner at midnight, iron balcony, gas lamp, jukebox glow from bar.
Lighting: warm gas lamp on brick, neon bar sign, porch light through oak foliage.
Weather: humid, distant rain, streetcar arc in background.
Palette: #d9382e, #854224, #ffcc00.
Mood: memory, ritual, celebration and ruin intertwined.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: balcony beads on ground, midground: gas lamp and bar door, background: live oak and streetcar tracks.

### 3.4 Houston — Underpass Strip
Subject: highway underpass strip at night, bodega neon, taco truck under floodlight, sound wall graffiti.
Lighting: highway orange glow, parking-lot flood, skyscraper spire LED in distance.
Weather: humid, steam from vent, distant rain on freeway.
Palette: #9c5c1d, #ffcc88, #393e4d.
Mood: hidden in plain sight, ambition without grid, humidity and concrete.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: taco truck steam, midground: bodega neon and sound wall, background: freeway pillars and spire light.

### 3.5 Baltimore — Rowhouse Alley
Subject: rowhouse alley at night, painted formstone, marble steps, porch lamp, alley communal space.
Lighting: sodium streetlight, harbor spotlight in distance, porch lamp through window.
Weather: clear, distant rain on harbor.
Palette: #274f80, #ffcc88, #be6436.
Mood: hard-edged charm, neighborhood loyalty, water and brick.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: painted screen window, midground: marble steps and porch lamp, background: alley and harbor light.

### 3.6 Chicago — El-Track Block
Subject: el-track block at night, limestone building, neon theater marquee, wet asphalt, hot dog stand.
Lighting: cool fluorescent under el track, amber storefront, lakefront blue-white in distance.
Weather: wind-driven rain, lake mist.
Palette: #393e4d, #00e5ff, #ff9944.
Mood: cold ambition, layered history, transit-driven urgency.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: hot dog steam, midground: neon marquee and el shadow, background: lakefront glow.

### 3.7 New York — Bodega Block
Subject: bodega block at night, stacked signs, fire escape, subway entrance, steam from manhole.
Lighting: fluorescent bodega, sodium avenue, neon bar, apartment window grid.
Weather: steam from manhole, distant rain.
Palette: #181920, #ffcc88, #d9382e.
Mood: information overload, anonymity, proximity and distance.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: manhole steam, midground: fire escape and bodega awning, background: stacked signs and subway entrance.

### 3.8 Los Angeles — Boulevard Strip
Subject: boulevard strip at night, neon motel sign, mural wall, palm trunk, taco stand smoke.
Lighting: car headlight canyon, billboard flood, streetlight pool.
Weather: clear, smog horizon, distant freeway light.
Palette: #ff7fbf, #ffcc00, #393e4d.
Mood: desire and distance, performance, sunburned nightlife.
Style: noir pixel scene, 320x180, nearest-filter, no anti-aliasing.
Composition: foreground: taco stand smoke, midground: mural wall and neon motel sign, background: palm trunks and freeway.

## 4. Transition Prompt Template

Scene change from [A] to [B].
Keep 1 anchor element constant across frames: [specific prop, light, or architectural detail].
Use fade or wipe consistent with in-world light source.
Avoid motion blur; prefer stepped pixel movement.
Duration: 1-2 seconds at 24fps, 24-48 frames.

### 4.1 Detroit Transition
Scene change from barber shop interior to alley.
Anchor: red neon glow from barber pole.
Wipe: horizontal pixel wipe from right to left, following neon light direction.
No motion blur; 2-pixel stepped movement per frame.

### 4.2 Miami Transition
Scene change from hotel lobby to Ocean Drive sidewalk.
Anchor: neon hotel name in script.
Wipe: vertical pixel wipe from top to bottom, following palm canopy line.
No motion blur; 2-pixel stepped movement per frame.

### 4.3 New Orleans Transition
Scene change from bar interior to French Quarter street.
Anchor: jukebox glow fading as player exits.
Fade: black overlay fades in over 12 frames, cuts to street, fades out over 12 frames.

### 4.4 Houston Transition
Scene change from bodega to underpass strip.
Anchor: bodega neon sign remains visible.
Wipe: horizontal pixel wipe from left to right, following freeway direction.
No motion blur; 2-pixel stepped movement per frame.

### 4.5 Baltimore Transition
Scene change from rowhouse interior to alley.
Anchor: porch lamp glow remains visible through window.
Fade: black overlay fades in over 12 frames, cuts to alley, fades out over 12 frames.

### 4.6 Chicago Transition
Scene change from theater interior to el-track block.
Anchor: neon marquee remains visible through doorway.
Wipe: vertical pixel wipe from top to bottom, following el track height.
No motion blur; 2-pixel stepped movement per frame.

### 4.7 New York Transition
Scene change from bodega to sidewalk.
Anchor: fluorescent bodega glow remains visible through window.
Fade: black overlay fades in over 8 frames, cuts to sidewalk, fades out over 8 frames.

### 4.8 Los Angeles Transition
Scene change from motel room to boulevard.
Anchor: neon motel sign remains visible through window.
Wipe: horizontal pixel wipe from left to right, following freeway direction.
No motion blur; 2-pixel stepped movement per frame.

## 5. Environmental Storytelling Prompts

### 5.1 Graffiti Prompt Template
Subject: graffiti on [wall, phone booth, alley].
Content: [short phrase, 3-5 words, city-specific slang or neighborhood tag].
Style: spray-painted tag, drips, layered over older tags.
Color: one dominant color from district palette, one highlight.
Readability: must be legible at 1x scale.

### 5.2 Poster Prompt Template
Subject: [event, person, product] poster on [wall, lamp post, store window].
Content: [short text, 2-4 words, bold claim].
Style: wheatpaste, peeling at corners, layered over older posters.
Color: high contrast, one dominant color, one highlight.
Readability: must be legible at 1x scale.

### 5.3 Decal Prompt Template
Subject: [sticker, warning label, band logo] on [surface].
Content: [short text or icon].
Style: die-cut sticker, fading, scratches.
Color: flat color, no gradients.
Readability: must be legible at 1x scale.

## 6. Weather and Light Effects

### 6.1 Rain
- Pixel density: 2-3 rain pixels per column, 1 pixel tall.
- Ground reflection: 1-pixel mirror of neon signs, 50% opacity.
- Steam vent: 3-5 pixel columns, 20-40 pixels tall, value #3b3b4f.
- Siren light: 1-pixel red/blue flash, 2 frames on, 2 frames off, affects all sprites in scene.

### 6.2 Neon Bloom
- Glow layer: 1-pixel soft edge around neon source, same hue, lower value.
- Bloom intensity: 2-3 pixels maximum.
- Never bloom onto character layer.

### 6.3 Screen Shake
- Horizontal offset: 1-2 pixels.
- Vertical offset: 1 pixel.
- Duration: 2 frames on impact, 1 frame on close call.
- Never shake UI layer.

## 7. Implementation Notes

- All backgrounds must be tileable in 16x16, 32x32, or 64x64 chunks.
- Parallax layers: background moves at 0.25x, midground at 0.5x, foreground at 1.0x.
- Depth cue: background layers are darker and less saturated.
- Day/night variants: same shape, different value and color palette.
- Seasonal variants: same shape, different weather and foliage.

## 8. Review Checklist

Before approving any scene:
- [ ] Reads at 1x scale on 320x180 canvas.
- [ ] Dominant light source is clear.
- [ ] Dominant noise layer is implied, not explicit.
- [ ] Material palette matches district profile.
- [ ] Time-of-night cue is visible.
- [ ] Anchor element present for transitions.
- [ ] Weather effects respect pixel budget.
- [ ] Parallax layers are cleanly separated.
