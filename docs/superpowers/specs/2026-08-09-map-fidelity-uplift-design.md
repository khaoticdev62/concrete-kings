# Map Fidelity Uplift — Design

**Problem:** the generated pixel art and the procedurally drawn map sit in the same
frame and do not match. The bodega, the dumpster and the ground decals are richly
shaded; the asphalt, sidewalks, trees and cars beside them are flat colour slabs.

---

## 1. Measured, not asserted

Top-colour coverage of a rendered 960x520 map frame against the generated scene
art that sets the quality bar:

| Source | Top-5 colour coverage | Unique colours |
|---|---:|---:|
| **Map render (current)** | **81.1%** | 6,940 — almost all sprite noise |
| `bodega-corner-night.png` | 26.4% | 159 |
| `chicago-el-platform.png` | 15.7% | 160 |

The reference art is *more* palette-disciplined than the map (159 colours vs
6,940) and still three to five times better distributed. So this is not about
adding colours. **It is about how many tones each surface uses.** The map paints
81% of its area in five flat fills; the reference gives every surface a base, a
shadow, a highlight and texture, all inside a tight palette.

**Success criterion:** top-5 coverage under 45% while every procedural colour
remains a `MASTER_PALETTE_64` entry. That is measurable in-browser with
`getImageData`, so it can be asserted rather than eyeballed.

## 2. What is actually missing

Read against `RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md` §2.1–2.5 and the reference
art, six specific gaps:

1. **No material texture on any large surface.** Asphalt, sidewalk, ground and
   roofs are each one `fillRect` of one colour. The reference has asphalt grain,
   concrete slab seams and brick courses.
2. **Two tones per element, everywhere.** Every object uses `roofCol` + `roofDk`.
   The reference uses three to five: base, shade, highlight, and a rim.
3. **No light direction.** `drawParcel` fills `roofDk` along *both* the top and
   bottom edges of every roof — symmetrically. That reads as a drawn border, not
   as lighting. Nothing in the map has a consistent light source.
4. **No ambient occlusion.** Surfaces meet with a hard seam. The reference darkens
   1–2px wherever a wall meets ground, or a kerb meets road.
5. **No dithering.** The standard pixel-art tool for a gradient inside a limited
   palette is not used anywhere, so tonal transitions are hard steps or absent.
6. **Primitive silhouettes.** Trees are perfect circles with one darker arc — they
   read as poker chips. Cars are a rectangle with two darker squares.

## 3. Approach

### 3.1 A cached static surface layer

Everything that never moves within a district — ground, roads, lane markings,
crosswalks, sidewalks, kerbs, parcels, roof texture and rooftop clutter — is
rendered **once per district** into an offscreen canvas the size of the world, then
blitted each frame with a single `drawImage`. Dynamic elements (light pools,
decals, furniture, cars, trees, POIs, the player) continue to draw per frame on
top.

This is the one idea worth reviving from the graphics plan's retired Task 2, now
aimed at the renderer that actually exists. It is what makes the rest affordable:
per-pixel texture across a 2400x1300 world cannot run every frame, but it can run
once per district. It also cuts the current ~1,200 fills per frame to roughly a
tenth.

Cache one district at a time and evict on change — a full-world layer is ~12MB, so
holding all eight would cost ~96MB.

### 3.2 Texture, in three reusable primitives

Added to the renderer and used by every surface:

- `grain(ctx, rect, base, steps, density, seed)` — scatters single pixels of
  `paletteShift(base, ±1)` at a fixed density from a seeded PRNG. Deterministic,
  so a district looks identical every load.
- `dither(ctx, rect, from, to, direction)` — a 4x4 ordered-dither band between two
  palette tones, for kerb shading and roof falloff.
- `seams(ctx, rect, colour, spacingX, spacingY)` — slab and course lines for
  concrete, brick and tar.

All three take their colours from `paletteShift`, so nothing can leave the palette.

### 3.3 One light direction

A single module constant — light from the **north-west** — applied consistently:

- Roof edges: `paletteShift(roof, +1)` on the north and west edges,
  `paletteShift(roof, -1)` on the south and east. Replaces today's symmetric dark
  border.
- Building front face: gains a `-2` shade at its base, so it grounds instead of
  floating.
- Ambient occlusion: a 2px `-2` band on the ground along each parcel's south and
  east sides, dithered out.
- Kerbs: lit top edge, shaded inner edge.

### 3.4 Silhouettes

- **Trees:** irregular canopy from three overlapping offset circles, a lit
  north-west crown (`+1`), a shaded south-east underside (`-1`), plus grain, and a
  trunk shadow cast south-east.
- **Cars:** roof, windshield, bonnet, and two wheel pairs, with a lit roof edge —
  four tones instead of two.
- **Kerbs and crosswalks:** worn edges via grain rather than solid bars.

## 4. Constraints

Inherited from the graphics plan's global constraints, all still binding:

- Every colour via `paletteShift`; `MASTER_PALETTE_64` stays at exactly 64.
- Integer coordinates only.
- No `globalAlpha`, `shadowBlur` or `shadowColor` in gameplay draws — bake alpha
  into `rgba()`.
- 4-frame animation budget.
- No new dependencies, dual `module.exports` / `window` export.
- The map must still render correctly with zero assets present.

## 5. Risks

- **Noise instead of texture.** Grain at too high a density or contrast reads as
  television static, not asphalt. Density and step are tuned by looking at a
  magnified crop, not by choosing a number that sounds right.
- **Losing the walkability read.** §2.1 of the pack requires walk/no-walk to be
  legible by value alone. Texture must not close the value gap between road and
  pavement; the check is squinting at a downscaled frame.
- **The cache going stale.** Weather and district changes must invalidate it.

## 6. Order of work

1. Surface-layer cache with the existing draws moved into it, unchanged. Verify
   the frame is pixel-identical and the fill count drops.
2. `grain` / `dither` / `seams`, applied to asphalt, sidewalk, ground.
3. Light direction and ambient occlusion.
4. Tree and car silhouettes.
5. Measure top-5 coverage; iterate on the magnified crop until it reads.
