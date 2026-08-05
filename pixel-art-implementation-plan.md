=== FILE: pixel-art-implementation-plan.md ===

# CONCRETE KINGS: THE BLOCK CHRONICLES
## Complete Pixel Art Pipeline & Implementation Plan
**Version:** 1.0.0  
**Target Platform:** HTML5 / Godot Engine (Web & Mobile & Desktop)  
**Art Lead:** Senior Pixel Art Pipeline Specialist  

---

## SECTION 1: RESOLUTION STANDARDS

### Master Resolution Architecture
* **Native Internal Display Resolution:** `320 × 180` pixels (Aspect Ratio: `16:9`).
* **Tile Matrix Standard:** `16 × 16` pixel base grid.
* **Character Grid Standard:** `32 × 32` pixels (Frame bounding box) / `32 × 48` pixels for tall hero variants.
* **Card Canvas Standard:** `160 × 240` pixels (Rendered at 1:1 or 2:1 native scale, integer mapped within 320x180 layout).
* **Grid Enforcement:** All bounding boxes, hitboxes, collision shapes, and sprite margins MUST strictly align to power-of-2 or integer-even boundaries.

---

### Valid Asset Sizes Table

| Asset Type | Dimensions (WxH) | Grid Span (16px base) | Use Case |
| :--- | :--- | :--- | :--- |
| **Base Micro-Tile** | `16 × 16` | 1×1 | Pavement, road markings, brick patterns, grass patches |
| **Standard Tile** | `32 × 32` | 2×2 | Storefront doors, vehicle components, trees, bill targets |
| **Macro Tile / Structure** | `64 × 64` | 4×4 | Bodega facades, rowhouse sections, church windows |
| **Large Structure** | `128 × 128` | 8×8 | Multi-story building facades, bridge pillars, city landmarks |
| **Small UI Icon** | `16 × 16` | 1×1 | Resource counters, mini-badges, stat icons |
| **Medium UI Badge / Button**| `32 × 32` | 2×2 | Hustle badges, action buttons, inventory slots |
| **Large UI Frame / Seal** | `64 × 64` | 4×4 | Origin seals, character portraits, modal frames |
| **Character Sprite** | `32 × 32` | 2×2 | Standard character grid (Idle, Walk, Hustle action) |
| **Character Tall Hero** | `32 × 48` | 2×3 | Major story bosses, expanded posture variants |
| **Card Artwork Bounds** | `128 × 96` | 8×6 | Embedded illustration area on card frame |
| **Full Background Frame** | `320 × 180` | 20×11.25 | Full-screen story cards, region transition backdrops |

---

### Invalid Sizes Table (STRICTLY PROHIBITED)

| Invalid Dimension | Violation Reason | Pipeline Failure Mode |
| :--- | :--- | :--- |
| `17 × 17` | Odd pixel dimension | Sub-pixel jitter on 2x/4x scaling; seam bleeding on tilemaps. |
| `33 × 33` | Non-grid power-of-two offset | Destroys 16x16 tile snapping; causes 1px atlas overlap. |
| `50 × 50` | Decimal scale factor (3.125 tile ratio) | Unclean integer scaling to 1080p (50 * 6 = 300px, not grid aligned). |
| `75 × 75` | Non-even odd multiple | Textures shear across sprite batchers; breaks mipmaps. |
| `100 × 100` | Non-standard aspect ratio ratio | Causes uneven distortion on 320x180 viewport projection. |
| `24 × 24` | 1.5 tile width | Uneven tilemap alignment; requires decimal offset math in code. |

---

### Scaling Math Matrix

To achieve crisp, pixel-perfect rendering without anti-aliasing artifacts, all display viewports scale using strict **Integer Multipliers (1x, 2x, 3x, 4x, 6x, 8x, 12x)** combined with viewport letterboxing/pillarboxing.

$$\text{Scale Factor } (S) = \left\lfloor \min\left( \frac{W_{\text{viewport}}}{320}, \frac{H_{\text{viewport}}}{180} \right) \right\rfloor$$

```
320x180 Native Canvas
  ├── 2x Scale ──>  640 × 360  (Retro Window / Low-res Handheld)
  ├── 4x Scale ──> 1280 × 720  (720p HD Standard)
  ├── 6x Scale ──> 1920 × 1080 (1080p Full HD Desktop Standard)
  ├── 8x Scale ──> 2560 × 1440 (1440p QHD Monitors)
  └── 12x Scale ─> 3840 × 2160 (4K UHD Displays)
```

#### Resolution Adaptation Specifications:

1. **1080p Display (`1920 × 1080`)**:
   * Scale Factor: $S = \min(1920/320, 1080/180) = \min(6.0, 6.0) = \mathbf{6\times}$.
   * Scaled Render Area: $1920 \times 1080$. Zero letterboxing required.

2. **720p Display (`1280 × 720`)**:
   * Scale Factor: $S = \min(1280/320, 720/180) = \min(4.0, 4.0) = \mathbf{4\times}$.
   * Scaled Render Area: $1280 \times 720$. Zero letterboxing required.

3. **Mobile Display (`2532 × 1170` - e.g. iPhone 14 / OLED Mobile)**:
   * Scale Factor: $S = \lfloor \min(2532/320, 1170/180) \rfloor = \lfloor \min(7.91, 6.5) \rfloor = \mathbf{6\times}$.
   * Scaled Render Area: $1920 \times 1080$.
   * Horizontal Margins (Pillarbox): $(2532 - 1920) / 2 = \mathbf{306\text{ px each side}}$.
   * Vertical Margins (Letterbox): $(1170 - 1080) / 2 = \mathbf{45\text{ px top/bottom}}$.
   * Mobile touch UI controls render in outer margin deadzones.

---

## SECTION 2: MASTER PALETTE

The master palette is locked to **exactly 64 colors**, partitioned into 4 functional color groups of 16 colors each.

```
       CONCRETE KINGS 64-COLOR MASTER PALETTE ARCHITECTURE
┌─────────────────────────────────────────────────────────────────┐
│ GROUP 1: BLACKS & GRAYS  (16) ──> Concrete, Asphalt, Shadows   │
├─────────────────────────────────────────────────────────────────┤
│ GROUP 2: WARM TONAL RANGE (16) ──> Neon Amber, Bricks, Gold     │
├─────────────────────────────────────────────────────────────────┤
│ GROUP 3: COOL TONAL RANGE (16) ──> Neon Blue, Teal, Sirens      │
├─────────────────────────────────────────────────────────────────┤
│ GROUP 4: CULTURAL SKIN TONES (16) ──> Rich Melanin Spectrum     │
└─────────────────────────────────────────────────────────────────┘
```

### Palette Markdown Table

| Index | Color Name | HEX Code | Group | Primary Usage |
| :--- | :--- | :--- | :--- | :--- |
| `00` | Pure Void Black | `#08080A` | Blacks/Grays | Deep outlines, UI drop shadows, dark voids |
| `01` | Midnight Asphalt | `#101116` | Blacks/Grays | Asphalt base, deep shadow cast |
| `02` | Dark Charcoal | `#181920` | Blacks/Grays | Roofing shingles, nighttime pavement |
| `03` | Concrete Shadow | `#22252E` | Blacks/Grays | Building shadows, iron railings |
| `04` | Deep Slate | `#2D313D` | Blacks/Grays | Wet concrete, alleyway walls |
| `05` | Weathered Stone | `#393E4D` | Blacks/Grays | Curbs, stone steps, brick mortar |
| `06` | Mid Concrete | `#474D5E` | Blacks/Grays | Main sidewalk tiles, concrete pillars |
| `07` | Light Concrete | `#565E70` | Blacks/Grays | Sunlit concrete, building trim |
| `08` | Industrial Metal | `#666E82` | Blacks/Grays | Fire escapes, manhole covers |
| `09` | Steel Gray | `#788196` | Blacks/Grays | Chainlink fences, car bumpers |
| `10` | Silver Trim | `#8B95AB` | Blacks/Grays | Window frames, chrome details |
| `11` | Platinum Highlight | `#A0AAC2` | Blacks/Grays | Metal highlights, glossy surfaces |
| `12` | Fog Gray | `#B6C0D8` | Blacks/Grays | Atmospheric haze, sky gradient lower |
| `13` | Cloud Haze | `#CBD5ED` | Blacks/Grays | UI borders, light metallic reflections |
| `14` | Off-White Glow | `#E2E8F7` | Blacks/Grays | White car paint, sign highlights |
| `15` | Pure Crisp White | `#F4F7FF` | Blacks/Grays | UI text, high-intensity gleams |
| `16` | Brick Shadow | `#2B0D0D` | Warm Tones | Dark brick mortar, wood shadows |
| `17` | Rust Mahogany | `#4D1414` | Warm Tones | Aged brickwork, rusty pipes |
| `18` | Classic Brick | `#7A1D1C` | Warm Tones | Main red brick tiles, bodega facades |
| `19` | Terracotta Orange | `#AA2724` | Warm Tones | Sunlit brick, clay planters |
| `20` | Street Flame | `#D9382E` | Warm Tones | Fire hydrants, brake lights, warning signs |
| `21` | Neon Crimson | `#F25438` | Warm Tones | Neon signs, hazard UI, highlight effects |
| `22` | Sunset Blaze | `#FF7A45` | Warm Tones | Golden hour sky top, orange neon |
| `23` | Golden Amber | `#FFA059` | Warm Tones | Streetlamp glow edge, warm interior light |
| `24` | Streetlamp Gold | `#FFC475` | Warm Tones | Sodium vapor streetlights, lit windows |
| `25` | Warm Glow Yellow | `#FFE299` | Warm Tones | Window lit interiors, gold jewelry gleam |
| `26` | Aged Timber | `#6E3E14` | Warm Tones | Wooden porches, park benches, doors |
| `27` | Burnished Copper | `#9C5C1D` | Warm Tones | Copper roofing, storefront trim |
| `28` | Raw Brass | `#C9822B` | Warm Tones | Brass doorknobs, chain links, belt buckles |
| `29` | Pure Gold | `#F0AB43` | Warm Tones | Gold chains, VIP card frames, status icons |
| `30` | Bright Canary | `#FFCD68` | Warm Tones | Yellow taxi cabs, caution street markings |
| `31` | High-Vis Yellow | `#FFF0AA` | Warm Tones | Taxi hood highlights, neon amber text |
| `32` | Midnight Sky Navy | `#0A1526` | Cool Tones | Night sky top, deep ocean background |
| `33` | Deep Bodega Blue | `#11233F` | Cool Tones | Awning stripes, night environment shadows |
| `34` | Shadow Teal | `#1C375C` | Cool Tones | Water puddle shadows, dark glass |
| `35` | Slate Denim | `#274F80` | Cool Tones | Jean jackets, storefront window glass |
| `36` | Bodega Blue | `#366BA6` | Cool Tones | Classic bodega plastic awnings, blue jeans |
| `37` | Royal Blue | `#488BD9` | Cool Tones | Police car trim, jersey fabric |
| `38` | Police Siren Blue | `#5EAAFF` | Cool Tones | Siren flash, electric card accents |
| `39` | Sky Cyan Glow | `#85C4FF` | Cool Tones | Card energy glow, glass highlights |
| `40` | Deep Pine Green | `#0D2926` | Cool Tones | Tree foliage shadow, alley moss |
| `41` | Forest Green | `#174540` | Cool Tones | Urban tree leaves, park turf |
| `42` | Park Foliage Green | `#246961` | Cool Tones | Sunlit tree canopy, street planters |
| `43` | Neon Emerald | `#339488` | Cool Tones | Green streetlights, neon cash sign |
| `44` | Mint Accent | `#47C2B3` | Cool Tones | Money card accents, mint sneakers |
| `45` | Electric Mint | `#6FE8D8` | Cool Tones | Mint highlights, digital UI gauges |
| `46` | Deep Purple Velvet | `#2A1138` | Cool Tones | Velvet interior, night club shadows |
| `47` | Neon Violet | `#521C6E` | Cool Tones | Underground club neon, mystic cards |
| `48` | Deep Espresso | `#140A07` | Skin Tones | Dark melanin outline, hair shadow |
| `49` | Rich Ebony | `#26120B` | Skin Tones | Deep melanin base skin tone |
| `50` | Dark Chocolate | `#3B1C11` | Skin Tones | Deep brown complexion base |
| `51` | Warm Umber | `#522717` | Skin Tones | Medium-dark skin shadow |
| `52` | Deep Chestnut | `#6B341D` | Skin Tones | Rich brown skin midtone |
| `53` | Warm Mahogany | `#854224` | Skin Tones | Warm brown complexion midtone |
| `54` | Golden Bronze | `#A1522C` | Skin Tones | Golden undertone skin base |
| `55` | Honey Amber | `#BE6436` | Skin Tones | Warm golden skin midtone |
| `56` | Warm Copper | `#D97843` | Skin Tones | Light brown skin midtone |
| `57` | Rich Caramel | `#EB8E52` | Skin Tones | Caramel skin highlight |
| `58` | Golden Tan | `#F7A768` | Skin Tones | Warm golden skin highlight |
| `59` | Soft Sand | `#FFC085` | Skin Tones | Fair melanin skin highlight |
| `60` | Warm Ochre | `#FFD6A8` | Skin Tones | High-intensity skin reflection |
| `61` | Hair Charcoal | `#3D2218` | Skin Tones | Locs, braids, hair texture midtone |
| `62` | Hair Chestnut | `#5C3222` | Skin Tones | Brown hair highlights, beard trim |
| `63` | Baby Hair Edge | `#7D442C` | Skin Tones | Edge control / baby hair transition tone |

---

### Master Palette JSON Specification

```json
{
  "palette_name": "ConcreteKings_64_Master",
  "version": "1.0.0",
  "color_count": 64,
  "groups": {
    "blacks_grays": [
      "#08080A", "#101116", "#181920", "#22252E", "#2D313D", "#393E4D", "#474D5E", "#565E70",
      "#666E82", "#788196", "#8B95AB", "#A0AAC2", "#B6C0D8", "#CBD5ED", "#E2E8F7", "#F4F7FF"
    ],
    "warm_tones": [
      "#2B0D0D", "#4D1414", "#7A1D1C", "#AA2724", "#D9382E", "#F25438", "#FF7A45", "#FFA059",
      "#FFC475", "#FFE299", "#6E3E14", "#9C5C1D", "#C9822B", "#F0AB43", "#FFCD68", "#FFF0AA"
    ],
    "cool_tones": [
      "#0A1526", "#11233F", "#1C375C", "#274F80", "#366BA6", "#488BD9", "#5EAAFF", "#85C4FF",
      "#0D2926", "#174540", "#246961", "#339488", "#47C2B3", "#6FE8D8", "#2A1138", "#521C6E"
    ],
    "skin_tones": [
      "#140A07", "#26120B", "#3B1C11", "#522717", "#6B341D", "#854224", "#A1522C", "#BE6436",
      "#D97843", "#EB8E52", "#F7A768", "#FFC085", "#FFD6A8", "#3D2218", "#5C3222", "#7D442C"
    ]
  }
}
```

---

## SECTION 3: ASSET INVENTORY

### Summary Master Quantities & Budgets

* **Total Unique Asset Entries:** 322 items
* **Total File Size Budget:** **1,784 KB (1.74 MB)** $\le$ 2.0 MB Target limit.

---

### Master Asset Inventory Table

| Category | Asset Name | Resolution | Count | File Size (KB) | Priority | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Block Map Tiles** | Asphalt Road Straight / Curves | `16 × 16` | 16 | 12 | P0 | Includes crosswalks & oil stains |
| **Block Map Tiles** | Concrete Sidewalks & Curbs | `16 × 16` | 16 | 12 | P0 | Includes cracks & sewer grates |
| **Block Map Tiles** | Red Brick Facade Modules | `32 × 32` | 12 | 18 | P0 | Standard 2-flat & bodega walls |
| **Block Map Tiles** | Brownstone / Rowhouse Modules | `32 × 32` | 12 | 18 | P0 | Baltimore & Harlem stoops |
| **Block Map Tiles** | Storefront Windows & Awnings | `32 × 32` | 16 | 24 | P0 | Lit/unlit windows, striped awnings |
| **Block Map Tiles** | Doors, Stoops & Railings | `32 × 32` | 12 | 16 | P0 | Wrought iron railings, wooden doors |
| **Block Map Tiles** | Roof Tops & Cornices | `32 × 32` | 12 | 16 | P0 | Water towers, gravel roofs |
| **Block Map Tiles** | Urban Trees & Planters | `32 × 32` | 10 | 14 | P1 | Tree pits, green canopy |
| **Block Map Tiles** | Streetlights & Traffic Lights | `16 × 32` | 8 | 10 | P0 | Sodium lights & walk signals |
| **Block Map Tiles** | Park Benches & Fire Hydrants | `16 × 16` | 8 | 8 | P1 | Sprays & cast-iron benches |
| **Block Map Tiles** | City Cars & Vehicles | `64 × 32` | 8 | 28 | P1 | Caddy, Caprice, Box Chevy |
| **Block Map Tiles** | Bodega Signs & Murals | `64 × 32` | 10 | 32 | P0 | Neon signs & community murals |
| **Card Backgrounds**| Black Cards: Block Loyalty | `160 × 240`| 3 | 48 | P0 | Stoop gatherings, street lights |
| **Card Backgrounds**| Black Cards: Street Commerce | `160 × 240`| 3 | 48 | P0 | Barber shop interior, sneaker line |
| **Card Backgrounds**| Black Cards: Urban Wisdom | `160 × 240`| 3 | 48 | P0 | Late night porch, chess in park |
| **Card Backgrounds**| Black Cards: Underground Power | `160 × 240`| 3 | 48 | P0 | Rooftop night view, basement studio |
| **Card Backgrounds**| White Cards: Systemic Pressure | `160 × 240`| 3 | 48 | P0 | Court house steps, flashing sirens |
| **Card Backgrounds**| White Cards: Gentrification | `160 × 240`| 3 | 48 | P0 | Construction crane, luxury condo |
| **Card Backgrounds**| White Cards: Institutional Trap | `160 × 240`| 3 | 48 | P0 | Precinct lobby, eviction notice |
| **Card Backgrounds**| White Cards: Corporate Greed | `160 × 240`| 3 | 48 | P0 | Bank vault interior, skyscraper shadow |
| **Characters** | Barber Origin (6 Hustle Levels) | `32 × 32` | 6 | 24 | P0 | Apron, clippers, fresh fit |
| **Characters** | Street Scholar Origin (6 Hustles)| `32 × 32` | 6 | 24 | P0 | Books, hoodie, glasses, notebook |
| **Characters** | Local Legend Origin (6 Hustles) | `32 × 32` | 6 | 24 | P0 | Leather jacket, gold chain |
| **Characters** | Corner Merchant (6 Hustles) | `32 × 32` | 6 | 24 | P0 | Vest, cap, stack of papers |
| **Characters** | Community Organizer (6 Hustles)| `32 × 32` | 6 | 24 | P0 | Megaphone, jacket, natural hair |
| **Characters** | Underground DJ (6 Hustles) | `32 × 32` | 6 | 24 | P0 | Headphones, crate, varsity coat |
| **Characters** | Block Architect (6 Hustles) | `32 × 32` | 6 | 24 | P0 | Work boots, measuring tape, vest |
| **Characters** | Hustle Veteran (6 Hustles) | `32 × 32` | 6 | 24 | P0 | Tracksuit, bucket hat, sunglasses |
| **UI Assets** | Resource Icons (Respect, Cash, etc.)| `16 × 16` | 16 | 8 | P0 | Coins, fists, crowns, flame icons |
| **UI Assets** | Origin Seals & Badges | `32 × 32` | 16 | 16 | P0 | Gold foil stamps, neighborhood badges |
| **UI Assets** | Card Frames & Borders | `64 × 64` | 16 | 32 | P0 | Brick, concrete, gold foil frames |
| **UI Assets** | Interactive Buttons & Toggles | `32 × 16` | 16 | 12 | P0 | Press states, neon hover outlines |
| **UI Assets** | Dialogue Overlay Panels | `320 × 60` | 8 | 40 | P0 | Translucent dark slate text boxes |
| **UI Assets** | HUD Headers & Status Bars | `160 × 24` | 8 | 24 | P0 | Health/respect meter containers |
| **Effects** | Weather Particles (Rain/Snow) | `16 × 16` | 6 | 6 | P1 | Sheet rain, snow dust, steam |
| **Effects** | Neon Light Flicker Sequences | `32 × 32` | 6 | 12 | P1 | 4-frame neon state changes |
| **Effects** | Steam Vent & Smoke Plumes | `16 × 32` | 6 | 10 | P1 | Alley steam rise, exhaust smoke |
| **Effects** | Card Impact & Clash Effects | `32 × 32` | 6 | 14 | P0 | Spark bursts, gold flash rays |
| **Effects** | Sirens Light Flash Overlays | `320 × 180`| 6 | 36 | P0 | Red/blue ambient screen flashes |

---

## SECTION 4: CITY THEME SYSTEM

The City Theme system utilizes **Palette Index Swapping** on a single master set of **60 shared base tiles**, generating 8 distinct regional aesthetics without duplicating texture memory.

```
                  CITY THEME PALETTE SWAP ARCHITECTURE
                                ┌───────────────────────────┐
                                │   Master Base Tiles (60)  │
                                └─────────────┬─────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [Shader Palette Swapper]                        [City Unique Overlay Tiles]
  (Remaps 16-color region slots in real-time)            (10 unique regional tiles per city)
                      │                                               │
      ┌───────────────┼───────────────┐               ┌───────────────┼───────────────┐
      ▼               ▼               ▼               ▼               ▼               ▼
   Detroit         Chicago          Miami          Harlem          Oakland        Baltimore
 (Rust/Steel)   (Red Brick/Gray) (Neon/Pastel)  (Brownstone)     (Golden Sun)    (Formstone)
```

---

### Regional Palette Overrides

| City Theme | Primary Architecture | Primary Color Swap Override | Secondary Color Swap Override | Ambient Tone |
| :--- | :--- | :--- | :--- | :--- |
| **Detroit** | Industrial Brick & Steel | Red Brick `#7A1D1C` $\rightarrow$ Rust `#4D1414` | Concrete `#474D5E` $\rightarrow$ Industrial `#2D313D` | Cold Industrial |
| **Chicago** | Greystone & 2-Flat | Red Brick `#7A1D1C` $\rightarrow$ Slate Gray `#565E70` | Mortar `#393E4D` $\rightarrow$ Dark Charcoal `#181920` | Wind-swept Slate |
| **Miami** | Art Deco & Stucco | Red Brick `#7A1D1C` $\rightarrow$ Pastel Cyan `#6FE8D8` | Concrete `#474D5E` $\rightarrow$ Neon Pink `#F25438` | Tropical Neon |
| **Baltimore** | Rowhouses & Formstone | Red Brick `#7A1D1C` $\rightarrow$ Formstone Tan `#FFCD68` | Doors `#6E3E14` $\rightarrow$ Gloss Black `#101116` | Warm Ochre |
| **Atlanta** | Brick & Red Clay | Red Brick `#7A1D1C` $\rightarrow$ Red Clay `#AA2724` | Trees `#246961` $\rightarrow$ Lush Pine `#174540` | Forest Warmth |
| **Harlem** | Historic Brownstone | Red Brick `#7A1D1C` $\rightarrow$ Deep Mahogany `#6B341D` | Trim `#8B95AB` $\rightarrow$ Polished Brass `#C9822B` | Heritage Gold |
| **Oakland** | Victorian Wood & Stucco| Red Brick `#7A1D1C` $\rightarrow$ Weathered Teal `#339488` | Roof `#181920` $\rightarrow$ Sunset Orange `#FF7A45` | Bay Sunset |
| **New Orleans**| French Quarter Cast Iron| Red Brick `#7A1D1C` $\rightarrow$ Aged Stucco `#D97843` | Iron `#666E82` $\rightarrow$ Emerald `#246961` | Moist Moss |

---

### Tile Allocation Breakdown

* **Shared Base Block Map Tiles:** `60` tiles (Roads, curbs, standard roofs, basic windows, fences).
* **City Unique Tiles:** `10` tiles per city $\times 8\text{ cities} = \mathbf{80\text{ unique tiles}}$.
* **Total Unique Physical Tiles in Atlas:** $60 + 80 = \mathbf{140\text{ tiles}}$ ($\le 160$ Maximum Constraint).

#### City Unique Tile Specs (10 per city):
1. **Detroit:** Abandoned factory window, muscle car wreck, elevated rail beam, steam boiler grate.
2. **Chicago:** Elevated train pillar, 2-flat stoop, classic tavern sign, gangway gate.
3. **Miami:** Palm tree planter, neon flamingo sign, pastel balcony, open air terrace.
4. **Baltimore:** Marble stoop step, painted window screen, formstone wall panel, alley bench.
5. **Atlanta:** Red clay embankment, trap house porch, dogwood blossom, oversized car rim sign.
6. **Harlem:** Historic brownstone step, Apollo-style marquee, fire escape ladder, chess table.
7. **Oakland:** Port crane silhouette, Victorian turret corner, avocado tree, BART station pillar.
8. **New Orleans:** Wrought iron balcony rail, shotgun house door, shuttered window, cobblestone drain.

---

## SECTION 5: AI GENERATION PROMPTS

### Master Tile Generation Prompt
```text
PROMPT:
Pixel art tilemap asset sheet, 16x16 and 32x32 tiles, native 320x180 16-bit color style. Authentic Black American urban neighborhood, detailed red brick walls, concrete sidewalks with cracks, bodega storefront, wrought iron stoop railings, sodium vapor streetlamp. Precise pixel grid, sharp edges, zero blur, zero anti-aliasing, transparent background. Color palette restricted strictly to: #08080A, #101116, #181920, #22252E, #393E4D, #474D5E, #7A1D1C, #D9382E, #FFC475, #366BA6, #140A07, #854224. 

NEGATIVE PROMPT:
3d render, vector art, smooth gradients, blur, anti-aliased edges, futuristic, fantasy, medieval, sub-pixel rendering, high resolution, photographic, white background, noise, extra lines, odd dimensions.
```

#### City Variant Prompts (1-8):
1. **Detroit:** `Add industrial rust spots, weathered steel beams, boarded factory windows, cold slate tint.`
2. **Chicago:** `Add Chicago 2-flat stone stoop, greystone facade texture, L-train steel column, windy leaves.`
3. **Miami:** `Add pastel turquoise stucco wall, palm tree shadow, bright pink neon sign trim, art deco trim.`
4. **Baltimore:** `Add Baltimore rowhouse marble steps, formstone texture panels, painted window screens, dark wood door.`
5. **Atlanta:** `Add red clay soil line, lush oak tree foliage, brick craftsman porch, gold-trimmed awning.`
6. **Harlem:** `Add classic Harlem brownstone stoop, wrought iron ornate railing, historic theater marquee.`
7. **Oakland:** `Add Victorian wood trim facade, Bay breeze palm canopy, colorful mural wall tile.`
8. **New Orleans:** `Add French Quarter wrought iron lace balcony, shotgun house shutters, mossy stone drain.`

---

### Character Generation Prompts

#### Base Origin Prompts (8 Origins):
1. **Barber Origin:** `32x32 pixel art character sprite, Master Black Barber, wearing crisp apron over hoodie, barbershop clippers in hand, sharp lineup, fresh fade, locs tied back, 16-bit style, sharp pixels.`
2. **Street Scholar Origin:** `32x32 pixel art character sprite, Black intellectual scholar, wearing wire glasses, heavy hoodie, leather backpack, holding book, short afro with crisp hairline.`
3. **Local Legend Origin:** `32x32 pixel art character sprite, Neighborhood OG, wearing leather bomber jacket, gold rope chain, fitted cap, confident posture, full beard.`
4. **Corner Merchant Origin:** `32x32 pixel art character sprite, Street merchant, utility vest with pockets, bucket hat, holding rolled newspapers, warm caramel skin.`
5. **Community Organizer Origin:** `32x32 pixel art character sprite, Activist leader, wearing denim jacket, natural afro, holding megaphone, baby hairs styled, determined look.`
6. **Underground DJ Origin:** `32x32 pixel art character sprite, DJ beatmaker, headphones around neck, vintage varsity jacket, vinyl record crate at feet, dreadlocks.`
7. **Block Architect Origin:** `32x32 pixel art character sprite, Urban developer, wearing heavy work boots, high-vis vest over hoodie, blueprints under arm, dark skin tone.`
8. **Hustle Veteran Origin:** `32x32 pixel art character sprite, Veteran hustler, wearing classic velour tracksuit, tinted sunglasses, fresh white sneakers, relaxed posture.`

#### Hustle Variant Modifiers (6 Levels):
* **Level 1 (Novice):** `Simple plain t-shirt, worn sneakers, neutral posture, no jewelry.`
* **Level 2 (Apprentice):** `Added brand hoodie, clean sneakers, small silver chain.`
* **Level 3 (Journeyman):** `Custom jacket, gold watch, branded cap, posture confident.`
* **Level 4 (Master):** `Leather jacket, heavy gold rope chain, premium sneakers, glowing aura.`
* **Level 5 (Kingpin):** `Tailored designer outerwear, multiple gold chains, ring stack, shadow cast.`
* **Level 6 (Legend):** `Gold foil trimmed outfit, crown badge overlay, halo of streetlamp light.`

---

### Card Background Prompts (24 Prompts)

#### 12 Black Card Category Prompts:
1. **Block Loyalty 1:** `160x240 pixel art card background, night stoop gathering, friends on steps under sodium streetlamp glow.`
2. **Block Loyalty 2:** `160x240 pixel art card background, community block party setup, DJ booth in street, summer haze.`
3. **Block Loyalty 3:** `160x240 pixel art card background, alleyway handball court, sunset golden hour brick shadows.`
4. **Street Commerce 1:** `160x240 pixel art card background, barber shop interior, leather chair, mirrors, clippers.`
5. **Street Commerce 2:** `160x240 pixel art card background, sneaker store line, morning light on storefront glass.`
6. **Street Commerce 3:** `160x240 pixel art card background, food truck window, steam rising, neon sign glow.`
7. **Urban Wisdom 1:** `160x240 pixel art card background, park chess tables, elderly men playing under oak canopy.`
8. **Urban Wisdom 2:** `160x240 pixel art card background, porch late night, silhouette talking under amber light.`
9. **Urban Wisdom 3:** `160x240 pixel art card background, record store aisle, crates of vinyl records, warm amber.`
10. **Underground Power 1:** `160x240 pixel art card background, rooftop city view, water tower, night sky skyline.`
11. **Underground Power 2:** `160x240 pixel art card background, basement music studio, glow of audio meters and neon.`
12. **Underground Power 3:** `160x240 pixel art card background, secret alley meeting, silhouette against brick mural.`

#### 12 White Card Category Prompts:
1. **Systemic Pressure 1:** `160x240 pixel art card background, courthouse marble steps, cold gray pillars, harsh sun.`
2. **Systemic Pressure 2:** `160x240 pixel art card background, flashing police car sirens, red blue glow on wet asphalt.`
3. **Systemic Pressure 3:** `160x240 pixel art card background, security camera lens, grid line overlay, cold metal.`
4. **Gentrification 1:** `160x240 pixel art card background, construction crane over old brick building, demolition cloud.`
5. **Gentrification 2:** `160x240 pixel art card background, sleek luxury condo glass facade replacing bodega.`
6. **Gentrification 3:** `160x240 pixel art card background, eviction notice stapled to wooden door, cold gray tone.`
7. **Institutional Trap 1:** `160x240 pixel art card background, precinct front desk lobby, fluorescent light flicker.`
8. **Institutional Trap 2:** `160x240 pixel art card background, bank loan office desk, rejection stamp mark, cold blue.`
9. **Institutional Trap 3:** `160x240 pixel art card background, industrial fencing around empty lot, padlock shadow.`
10. **Corporate Greed 1:** `160x240 pixel art card background, skyscraper glass reflection overlooking dark alley.`
11. **Corporate Greed 2:** `160x240 pixel art card background, corporate boardroom table, cold fluorescent tint.`
12. **Corporate Greed 3:** `160x240 pixel art card background, armored bank truck parked on curb, metallic gray.`

---

### UI Asset Generation Prompt
```text
PROMPT:
Pixel art UI icon set, 16x16 and 32x32 pixels, 16-bit RPG gaming style. Gold foil stamps, brick frames, cash stacks, fist icons, respect crowns, hazard badges. Crisp pixels, heavy dark outline (#08080A), high contrast, game HUD UI elements. Transparent background. Palette matched to master 64 color palette.

NEGATIVE PROMPT:
3d vector, soft drop shadow, smooth gradients, anti-aliasing, blur, round corners, modern flat web icon, white background.
```

---

## SECTION 6: ASEPRITE AUTOMATION SCRIPTS

### Script 1: `generate_variants.lua`
```lua
-- Aseprite Script: generate_variants.lua
-- Generates 8 regional city color variants from a base tile sprite.

local app = app
local sprite = app.activeSprite
if not sprite then
    app.alert("No active sprite found!")
    return
end

-- Define Palette Overrides (Base HEX -> Target HEX)
local city_palettes = {
    Detroit   = { ["7a1d1c"] = "4d1414", ["474d5e"] = "2d313d" },
    Chicago   = { ["7a1d1c"] = "565e70", ["393e4d"] = "181920" },
    Miami     = { ["7a1d1c"] = "6fe8d8", ["474d5e"] = "f25438" },
    Baltimore = { ["7a1d1c"] = "ffcd68", ["6e3e14"] = "101116" },
    Atlanta   = { ["7a1d1c"] = "aa2724", ["246961"] = "174540" },
    Harlem    = { ["7a1d1c"] = "6b341d", ["8b95ab"] = "c9822b" },
    Oakland   = { ["7a1d1c"] = "339488", ["181920"] = "ff7a45" },
    NOLA      = { ["7a1d1c"] = "d97843", ["666e82"] = "246961" }
}

app.transaction("Generate City Variants", function()
    local base_path = sprite.filename
    local dir = app.fs.filePath(base_path)
    local title = app.fs.fileTitle(base_path)

    for city_name, color_map in pairs(city_palettes) do
        local new_sprite = Sprite(sprite)
        local pal = new_sprite.palettes[1]

        for i = 0, #pal - 1 do
            local color = pal:getColor(i)
            local hex = string.format("%02x%02x%02x", color.red, color.green, color.blue)
            if color_map[hex] then
                local target_hex = color_map[hex]
                local r = tonumber(target_hex:sub(1,2), 16)
                local g = tonumber(target_hex:sub(3,4), 16)
                local b = tonumber(target_hex:sub(5,6), 16)
                pal:setColor(i, Color{ r=r, g=g, b=b, a=color.alpha })
            end
        end

        local export_path = app.fs.joinPath(dir, title .. "_" .. city_name .. ".png")
        new_sprite:saveCopyAs(export_path)
        new_sprite:close()
    end
end)
app.alert("Generated 8 city variants successfully!")
```

---

### Script 2: `pack_spritesheets.lua`
```lua
-- Aseprite Script: pack_spritesheets.lua
-- Automatically packs active frames into a 2048x2048 Sprite Atlas.

local sprite = app.activeSprite
if not sprite then
    app.alert("No active sprite selected!")
    return
end

app.command.ExportSpriteSheet{
    ui = false,
    type = SpriteSheetType.GRID,
    columns = 64,
    rows = 64,
    width = 2048,
    height = 2048,
    textureFilename = app.fs.joinPath(app.fs.filePath(sprite.filename), "master_atlas.png"),
    dataFilename = app.fs.joinPath(app.fs.filePath(sprite.filename), "master_atlas.json"),
    dataFormat = SpriteSheetDataFormat.JSON_HASH,
    borderPadding = 0,
    shapePadding = 0,
    innerPadding = 0,
    trimSprite = false,
    extrude = false
}
app.alert("Master Atlas Packed to 2048x2048 successfully!")
```

---

### Script 3: `optimize_palette.lua`
```lua
-- Aseprite Script: optimize_palette.lua
-- Remaps image pixels strictly to the nearest color in the Master 64-Color Palette.

local sprite = app.activeSprite
if not sprite then return end

local hex_palette = {
    "#08080A","#101116","#181920","#22252E","#2D313D","#393E4D","#474D5E","#565E70",
    "#666E82","#788196","#8B95AB","#A0AAC2","#B6C0D8","#CBD5ED","#E2E8F7","#F4F7FF",
    "#2B0D0D","#4D1414","#7A1D1C","#AA2724","#D9382E","#F25438","#FF7A45","#FFA059",
    "#FFC475","#FFE299","#6E3E14","#9C5C1D","#C9822B","#F0AB43","#FFCD68","#FFF0AA",
    "#0A1526","#11233F","#1C375C","#274F80","#366BA6","#488BD9","#5EAAFF","#85C4FF",
    "#0D2926","#174540","#246961","#339488","#47C2B3","#6FE8D8","#2A1138","#521C6E",
    "#140A07","#26120B","#3B1C11","#522717","#6B341D","#854224","#A1522C","#BE6436",
    "#D97843","#EB8E52","#F7A768","#FFC085","#FFD6A8","#3D2218","#5C3222","#7D442C"
}

app.transaction("Optimize to Master Palette", function()
    local pal = Palette(#hex_palette)
    for i, hex in ipairs(hex_palette) do
        local r = tonumber(hex:sub(2,3), 16)
        local g = tonumber(hex:sub(4,5), 16)
        local b = tonumber(hex:sub(6,7), 16)
        pal:setColor(i-1, Color{ r=r, g=g, b=b, a=255 })
    end
    sprite:setPalette(pal)
    app.command.ColorMode{ ui=false, mode="indexed" }
end)
app.alert("Palette optimized and locked to 64 colors!")
```

---

## SECTION 7: GODOT SETUP

### 1. Project Settings Configuration (`project.godot` snippet)

```ini
[display]
window/size/viewport_width=320
window/size/viewport_height=180
window/size/mode=0
window/stretch/mode="viewport"
window/stretch/aspect="keep"
window/stretch/scale=1.0

[rendering]
textures/canvas_textures/default_texture_filter=0 ; 0 = Nearest (Pixel-Perfect)
textures/vram_compression/import_etc2_astc=true
2d/snap/snap_2d_transforms_to_pixel=true
2d/snap/snap_2d_vertices_to_pixel=true
```

---

### 2. Pixel-Perfect Scaling Script (`PixelPerfectCamera.gd`)

```gdscript
extends Camera2D
class_name PixelPerfectCamera

@export var native_resolution: Vector2i = Vector2i(320, 180)

func _ready() -> void:
	get_tree().root.size_changed.connect(_on_viewport_resized)
	_update_camera_zoom()

func _on_viewport_resized() -> void:
	_update_camera_zoom()

func _update_camera_zoom() -> void:
	var window_size: Vector2i = get_viewport().get_visible_rect().size
	var scale_x: int = int(window_size.x / native_resolution.x)
	var scale_y: int = int(window_size.y / native_resolution.y)
	var integer_scale: int = max(1, min(scale_x, scale_y))
	
	# Keep internal resolution 1:1, viewport stretch handles integer zoom
	position = position.floor()
```

---

### 3. City Theme Palette Swap Shader & Controller (`PaletteManager.gd`)

#### Shader Code (`palette_swap.gdshader`):

```glsl
shader_type canvas_item;

uniform sampler2D palette_texture : hint_default_black;
uniform float city_index : hint_range(0.0, 7.0, 1.0);
uniform float total_cities = 8.0;

void fragment() {
	vec4 col = texture(TEXTURE, UV);
	if (col.a < 0.01) {
		COLOR = col;
	} else {
		// Use red channel as index lookup in palette texture
		float u = col.r;
		float v = (city_index + 0.5) / total_cities;
		vec4 swapped_color = texture(palette_texture, vec2(u, v));
		COLOR = vec4(swapped_color.rgb, col.a);
	}
}
```

#### GDScript Controller (`PaletteManager.gd`):

```gdscript
extends Node
class_name PaletteManager

enum CityTheme { DETROIT, CHICAGO, MIAMI, BALTIMORE, ATLANTA, HARLEM, OAKLAND, NOLA }

@export var palette_swap_material: ShaderMaterial

func set_city_theme(theme: CityTheme) -> void:
	if palette_swap_material:
		palette_swap_material.set_shader_parameter("city_index", float(theme))
```

---

### 4. Block Map TileMap Setup (`BlockTileMap.gd`)

```gdscript
extends TileMap
class_name BlockTileMap

const TILE_SIZE: int = 16

func _ready() -> void:
	cell_quadrant_size = TILE_SIZE
	tile_set.tile_size = Vector2i(TILE_SIZE, TILE_SIZE)
	# Setup layers
	add_layer(0) # Ground Asphalt/Sidewalk
	add_layer(1) # Building Walls/Stoops
	add_layer(2) # Props/Streetlamps (Y-Sorted)
	set_layer_y_sort_enabled(2, true)
```

---

### 5. Sprite Atlas Loader (`AtlasLoader.gd`)

```gdscript
extends Node
class_name AtlasLoader

var atlas_texture: Texture2D = preload("res://assets/atlases/master_atlas.png")
var sprite_cache: Dictionary = {}

func get_atlas_sub_texture(rect: Rect2) -> AtlasTexture:
	var cache_key: String = str(rect)
	if sprite_cache.has(cache_key):
		return sprite_cache[cache_key]
	
	var sub_tex := AtlasTexture.new()
	sub_tex.atlas = atlas_texture
	sub_tex.region = rect
	sprite_cache[cache_key] = sub_tex
	return sub_tex
```

---

## SECTION 8: HTML5 SETUP

### 1. CSS Pixel-Crisp Engine Styles (`style.css`)

```css
/* HTML5 Canvas Pixel-Perfect Constraints */
html, body {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  background-color: #08080a;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

#game-canvas {
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  touch-action: none;
}
```

---

### 2. Canvas Context Setup & Integer Scaling (`main.js`)

```javascript
// Concrete Kings Canvas Controller
const NATIVE_WIDTH = 320;
const NATIVE_HEIGHT = 180;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

function setupCanvasContext() {
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
}

function resizeViewport() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const scaleX = Math.floor(windowWidth / NATIVE_WIDTH);
  const scaleY = Math.floor(windowHeight / NATIVE_HEIGHT);
  const scale = Math.max(1, Math.min(scaleX, scaleY));

  const scaledWidth = NATIVE_WIDTH * scale;
  const scaledHeight = NATIVE_HEIGHT * scale;

  canvas.width = NATIVE_WIDTH;
  canvas.height = NATIVE_HEIGHT;

  canvas.style.width = `${scaledWidth}px`;
  canvas.style.height = `${scaledHeight}px`;

  setupCanvasContext();
}

window.addEventListener("resize", resizeViewport);
window.addEventListener("DOMContentLoaded", () => {
  resizeViewport();
});
```

---

### 3. Sprite Sheet Renderer & Palette Swapper (`SpriteRenderer.js`)

```javascript
class SpriteRenderer {
  constructor(atlasImage) {
    this.atlas = atlasImage;
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.offscreenCanvas.getContext("2d");
  }

  drawFrame(ctx, sx, sy, sw, sh, dx, dy) {
    ctx.drawImage(this.atlas, sx, sy, sw, sh, Math.floor(dx), Math.floor(dy), sw, sh);
  }

  // HTML5 Canvas Color Swap Pipeline
  renderTileWithPaletteSwap(ctx, sx, sy, sw, sh, dx, dy, colorMap) {
    this.offscreenCanvas.width = sw;
    this.offscreenCanvas.height = sh;
    
    this.offscreenCtx.drawImage(this.atlas, sx, sy, sw, sh, 0, 0, sw, sh);
    const imgData = this.offscreenCtx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const hex = ((1 << 24) + (data[i] << 16) + (data[i + 1] << 8) + data[i + 2])
        .toString(16).slice(1).toLowerCase();

      if (colorMap[hex]) {
        const targetHex = colorMap[hex];
        data[i] = parseInt(targetHex.substr(0, 2), 16);
        data[i + 1] = parseInt(targetHex.substr(2, 2), 16);
        data[i + 2] = parseInt(targetHex.substr(4, 2), 16);
      }
    }

    this.offscreenCtx.putImageData(imgData, 0, 0);
    ctx.drawImage(this.offscreenCanvas, Math.floor(dx), Math.floor(dy));
  }
}
```

---

## SECTION 9: ANIMATION PIPELINE

### Animation Decision Matrix

```
                             ANIMATION METHOD DECISION TREE
                                           │
                        Is element a Sprite or Background UI?
                                 /                  \
                        [Sprite]                  [UI / Env]
                           │                          │
              Requires Character Physics?    Is it continuous environmental glow?
                   /             \                 /               \
             (Yes)               (No)           (Yes)              (No)
               │                  │               │                 │
      [4-Frame Frame-Anim]  [Tween/Pos]   [Shader/Canvas]   [CSS Keyframes]
      (Walk, Idle, Hustle)  (Card Slid)   (Streetlamp Glow) (UI Pulse/Flash)
```

---

### Frame Budget Constraints
* **Maximum Allowable Frames Per Animation:** **4 Frames** (`00`, `01`, `02`, `03`).
* **Frame Durations:** Standard 150ms per frame (6.6 FPS internal animation speed) or 250ms for subtle environmental loops.

---

### 10 Core Animation Keyframe Specifications

| Anim ID | Animation Name | Target Sprite | Frame Count | Keyframe Timings (ms) | Loop Type | Action Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `A-01` | Streetlamp Sodium Pulse | Streetlight Overlay | 4 | `0, 200, 400, 600` | Ping-Pong | Light radius expands/contracts by 1px |
| `A-02` | Urban Tree Leaf Sway | Park Tree Canopy | 4 | `0, 300, 600, 900` | Cycle | Canopy shifts 1px left/right |
| `A-03` | Fire Hydrant Water Spray | Hydrant Prop | 4 | `0, 100, 200, 300` | Cycle | Water burst particles cycle vertically |
| `A-04` | Alley Steam Vent Plume | Sewer Grate | 4 | `0, 150, 300, 450` | Cycle | Smoke alpha shifts from 100% to 25% |
| `A-05` | Bodega Neon Flicker | Neon Sign Tile | 4 | `0, 100, 150, 400` | Random | Rapid off/on glow intensity pulse |
| `A-06` | Character Breathing Idle | Hero Character | 4 | `0, 250, 500, 750` | Cycle | Chest/shoulder offset 1px vertical |
| `A-07` | Character Walk Step | Hero Character | 4 | `0, 150, 300, 450` | Cycle | Alternating leg stride & arm swing |
| `A-08` | Card Draw Shimmer | Card Border UI | 4 | `0, 80, 160, 240` | One-Shot | Gold shine ray moves diagonally |
| `A-09` | Rain Puddle Splash | Sidewalk Tile | 4 | `0, 100, 200, 300` | Cycle | Concentric 1px ripple expands |
| `A-10` | Police Siren Flashing | Screen Tint Effect | 4 | `0, 120, 240, 360` | Cycle | Red overlay $\rightarrow$ Off $\rightarrow$ Blue overlay $\rightarrow$ Off |

---

### Performance Targets
* **Desktop Platform Target:** Locked `60 FPS` @ $<15\%$ CPU Usage.
* **Mobile Platform Target:** Locked `30 FPS` / `60 FPS` @ $<10\%$ Battery Draw / min.

---

## SECTION 10: PRODUCTION SCHEDULE

### 8-Week Master Execution Roadmap

```
Week 1: Foundation ──────> Master Pipeline Setup & Palette Lock
Week 2-4: Block Map ─────> 140 Map Tiles & 8 City Overrides
Week 5-6: Card Backs ────> 24 High-Impact Narrative Card Backs
Week 7: Characters ──────> 48 Origin & Hustle Character Sprites
Week 8: UI & Effects ────> 80 UI Elements, 30 Effects & Polishing
```

---

### Weekly Deliverable Schedule

#### Week 1: Pipeline Foundation & Automation
* **Deliverables:** Master Palette locked (64 colors), Aseprite Lua scripts (`generate_variants.lua`, `pack_spritesheets.lua`, `optimize_palette.lua`), Godot shader pipeline setup, HTML5 scaling engine.
* **Asset Count:** 1 Master Palette + 3 Pipeline Scripts + 2 Code Base Harnesses.
* **File Budget Target:** `45 KB`.

#### Week 2: Base Block Map Tiles (Shared Grid)
* **Deliverables:** 60 Base shared block map tiles (Asphalt roads, sidewalks, basic red brick facades, standard roofs, doors, stoops).
* **Asset Count:** 60 Tiles (`16x16` & `32x32`).
* **File Budget Target:** `180 KB`.

#### Week 3: Regional City Unique Tiles (Part 1 - Detroit, Chicago, Miami, Baltimore)
* **Deliverables:** 40 City-specific unique tiles (10 tiles per city for Detroit, Chicago, Miami, Baltimore).
* **Asset Count:** 40 Tiles (`32x32` & `64x32`).
* **File Budget Target:** `220 KB`.

#### Week 4: Regional City Unique Tiles (Part 2 - Atlanta, Harlem, Oakland, NOLA)
* **Deliverables:** 40 City-specific unique tiles (10 tiles per city for Atlanta, Harlem, Oakland, NOLA). Atlas packed into `master_tiles_atlas.png`.
* **Asset Count:** 40 Tiles (`32x32` & `64x32`).
* **File Budget Target:** `220 KB`.

#### Week 5: Black Category Card Backgrounds
* **Deliverables:** 12 Black card backgrounds (Block Loyalty, Street Commerce, Urban Wisdom, Underground Power).
* **Asset Count:** 12 Card Backgrounds (`160x240`).
* **File Budget Target:** `288 KB`.

#### Week 6: White Category Card Backgrounds
* **Deliverables:** 12 White card backgrounds (Systemic Pressure, Gentrification, Institutional Trap, Corporate Greed). Atlas packed into `cards_atlas.png`.
* **Asset Count:** 12 Card Backgrounds (`160x240`).
* **File Budget Target:** `288 KB`.

#### Week 7: Character Sprites & Hustle Variants
* **Deliverables:** 48 Character sprites (8 Origins $\times$ 6 Hustle levels, 4-frame animation sheets).
* **Asset Count:** 48 Sprite Sheets (`32x32` per frame).
* **File Budget Target:** `192 KB`.

#### Week 8: UI Assets, Special Effects & Final Optimization
* **Deliverables:** 80 UI assets (Badges, seals, buttons, overlay panels), 30 Effect animations (Weather, flashes, neon flickers). Master atlas build verification.
* **Asset Count:** 110 Combined UI & Effect Assets.
* **File Budget Target:** `351 KB`.

---

## SECTION 11: FILE SIZE BUDGET

### Master File Size Budget Breakdown

| Category | Item Count | Native Dimensions | Format | Compression Standard | Max Budget (KB) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Block Map Atlas** | 140 Tiles | `2048 × 2048` (Atlas) | PNG-8 | Indexed 64-Color Palette | `380 KB` |
| **Card Backgrounds Atlas** | 24 Cards | `2048 × 2048` (Atlas) | PNG-8 | Indexed 64-Color Palette | `576 KB` |
| **Character Sprites Atlas** | 48 Characters | `1024 × 1024` (Atlas) | PNG-8 | Indexed 64-Color Palette | `192 KB` |
| **UI Assets Atlas** | 80 Elements | `1024 × 1024` (Atlas) | PNG-8 | Indexed 64-Color Palette | `185 KB` |
| **Effects & Particles Sheet**| 30 Effects | `512 × 512` (Sheet) | PNG-8 | Indexed 64-Color Palette | `96 KB` |
| **Code & Shader Files** | - | Text / GDScript / JS | UTF-8 | Minified Code | `45 KB` |
| **Audio SFX Buffer (Bonus)**| 16 Chiptunes | Mono / Low-bitrate | OGGS | Ogg Vorbis 22kHz | `310 KB` |
| **TOTAL PROJECT BUDGET** | **322 Assets** | - | - | **STRICTLY UNDER 2MB** | **1,784 KB (1.74 MB)**|

---

## SECTION 12: CULTURAL SPECIFICITY CHECKLIST

Every asset generated or integrated into the pipeline MUST pass 100% of these cultural verification checks:

```
                  CULTURAL AUTHENTICITY VERIFICATION PIPELINE
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ [1. HAIR AUDIT]   ──> Locs, Braids, Edge Control, Fades, Durags, Baby Hair│
 ├───────────────────────────────────────────────────────────────────────────┤
 │ [2. FIT AUDIT]    ──> Outerwear, Sneakers, Chains, Fitted Caps, Hoodies   │
 ├───────────────────────────────────────────────────────────────────────────┤
 │ [3. SPACE AUDIT]  ──> Stoops, Formstone, Bodegas, Barber Poles, Porches   │
 ├───────────────────────────────────────────────────────────────────────────┤
 │ [4. REJECT CHECK] ──> Zero Monolithic Tropes / Zero Poverty Porn Tropes   │
 └───────────────────────────────────────────────────────────────────────────┘
```

### 1. Hair Authenticity Rules
* [x] **Locs:** Must show distinct root sectioning, wraps, and natural weight/drape.
* [x] **Braids & Twists:** Box braids, cornrows, and two-strand twists must feature visible part lines and correct taper ends.
* [x] **Fades & Lineups:** Hairlines must be sharp, 90-degree squared or naturally curved temp fades; no blurry generic rounded hair domes.
* [x] **Baby Hairs / Edge Control:** Female character portraits must incorporate delicate swooped edge hair pixels utilizing skin transition index `#7D442C`.
* [x] **Headwear Access:** Durags must feature visible tie tails; silk bonnets and bucket hats must rest naturally on textured hair bulk.

### 2. Wardrobe & Fit Rules
* [x] **Outerwear:** Heavy leather bombers, vintage varsity coats, oversized branded hoodies, and utility vests.
* [x] **Footwear:** Crisp high-top sneakers with distinct rubber toe caps and clean outsoles (no muddy gray blobs).
* [x] **Jewelry:** Solid rope chains, cuban links, and medallion pendants rendered with high-contrast gold highlight index `#F0AB43`.
* [x] **Headwear Fit:** Fitted caps rendered flat-brimmed or slightly curved, worn straight or precisely tilted.

### 3. Urban Environment & Architectural Space Rules
* [x] **Residential Stoops:** Stoops must reflect regional authenticity — Baltimore white marble steps, Harlem red sandstone brownstones, Chicago greystone flats with gangways.
* [x] **Bodega & Corner Store Details:** Exterior awnings must have classic stripe patterns, window clutter (deli signs, neon phone cards, ice iceboxes outside).
* [x] **Barber Shop Spaces:** Barber poles with spiraled red/white/blue stripes, classic hydraulic leather chairs, wall mirrors with framed posters.
* [x] **Porch Culture:** Wrought iron decorative porch railings, wooden rocking chairs, ceiling fans, milk crates used as seats.

### 4. Zero-Tolerance Rejection List
* [x] **NO Poverty Porn:** No cartoonish exaggerated decay, no gratuitous trash piles without cultural context.
* [x] **NO Monolithic Tropes:** Avoid generic "urban" presets; characters must reflect real working-class pride, intellectual depth, and entrepreneurial hustle.
* [x] **NO Caricature Proportions:** No exaggerated lips, eyes, or unnatural postures.

---

## SECTION 13: ANTI-PATTERNS

The following **20 technical and artistic anti-patterns** are strictly forbidden:

1. **Odd Asset Dimensions:** Creating assets with odd pixel counts (`17x17`, `33x33`, `50x50`) that ruin integer scaling.
2. **Anti-Aliasing / Sub-Pixel Blur:** Applying smooth blur filters or soft brush edges to pixel art textures.
3. **Exceeding Frame Budgets:** Creating character animations with more than 4 frames.
4. **Palette Discipline Breaches:** Introducing arbitrary colors outside the locked 64-color master palette.
5. **Hand-Drawing All Color Variants:** Manually repainting regional city variants instead of using palette swap shaders.
6. **Frame Animating Environmental Effects:** Using heavy frame animation sheets for steam, smoke, or light glows instead of lightweight shaders.
7. **Generic "Urban" Aesthetics:** Designing generic gray brick buildings without regional architectural markers (Formstone, 2-Flats, Brownstones).
8. **Decimal Scaling Ratios:** Scaling the 320x180 native canvas by fractional values like `2.5x` or `3.7x`.
9. **Uncentered Pivot Points:** Setting sprite origin points off integer pixel boundaries, causing sub-pixel jitter during movement.
10. **Bilinear Texture Filtering:** Enabling default bilinear filtering on pixel textures in engine settings.
11. **Non-Power-of-Two Atlases:** Exporting sprite atlases in arbitrary sizes like `1500x1200` instead of standard `1024x1024` or `2048x2048`.
12. **Monolithic Skin Tones:** Using a single flat brown color for character skin without using the 16-color melanin spectrum.
13. **Ignoring Tile Padding:** Packing sprite sheets with zero margin when extrusion is required for 3D camera projections.
14. **Over-Cluttered Tile Details:** Drawing hyper-detailed noisy pixels inside `16x16` tiles that create visual noise during gameplay movement.
15. **Soft UI Shadows:** Using multi-stop alpha gradients for UI drop shadows instead of solid dark slate `#08080A` pixel offsets.
16. **Inconsistent Light Sources:** Rendering tiles with conflicting shadow directions (Master rule: Top-Left light source at 45 degrees).
17. **Dynamic Canvas Resizing:** Modifying internal canvas resolution dynamically instead of scaling the outer viewport container.
18. **Unoptimized PNG Compression:** Saving PNG assets in 32-bit RGBA color mode when 8-bit Indexed PNG mode reduces file size by 70%.
19. **Mixing Pixel Densities ("Texel Density Mismatch"):** Rendering a 32x32 sprite scaled 2x next to a 16x16 sprite scaled 1x.
20. **Stereotypical Character Tropes:** Relying on outdated or caricatured designs instead of authentic Black narrative representation.

---

## SECTION 14: SUCCESS CRITERIA

The pixel art pipeline implementation will be formally accepted when it fulfills all **10 quantitative success criteria**:

1. **Integer Scale Compliance:** 100% of art assets align strictly to integer multiples of the native `320 × 180` resolution.
2. **Strict File Size Limit:** Total packed project asset footprint is verified under **2.0 MB** (Target: `1.78 MB`).
3. **Locked Framerate:** Engine maintains a constant **60 FPS** on desktop browsers and **30-60 FPS** on mobile viewports.
4. **Distinct City Themes:** All 8 city themes are visually distinguishable in gameplay tests within 3 seconds of load.
5. **Cultural Authenticity Passed:** 100% of character and environment sprites pass the Section 12 Cultural Specificity Checklist.
6. **Zero Odd Dimensions:** Zero assets in the repository contain odd width or height dimensions.
7. **Frame Budget Adherence:** Every character and environmental sprite animation contains $\le 4$ frames.
8. **Palette Enforcement:** Automated build scripts verify zero rogue colors exist outside the 64-color master palette.
9. **Atlas Optimization:** All sprite atlases pack tightly into power-of-two textures (`1024x1024` or `2048x2048`) with $\ge 85\%$ pixel density efficiency.
10. **Pipeline Repeatability:** A new city theme or character hustle variant can be generated and integrated into the game in under **15 minutes** using the provided automation scripts.
