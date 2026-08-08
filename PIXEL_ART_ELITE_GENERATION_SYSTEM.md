# PIXEL_ART_ELITE_GENERATION_SYSTEM.md
# Concrete Kings — Pixel Art Generation System
# Version: 1.0

## 1. Core Style Rules

- Readability first, detail second.
- Dark dominant, neon accents punch through shadow.
- Silhouette must be readable at 64x64 or smaller.
- 4-frame animation budget for all rendering systems unless waived.
- Nearest-filter scaling only.
- No anti-aliasing.

## 2. Color Rules

- Choose 3-color story plus 1-color highlight per asset.
- Hue separation: each material gets one dominant hue family.
- Value separation: subject must read on light and dark backgrounds.
- Surprise color: one accent per sprite that breaks the palette for narrative reason.

## 3. Shape Rules

- Character shapes must be distinct by silhouette alone.
- World shapes must read as place, not decoration.
- FX shapes must be simple blobs, not detailed textures.

## 4. Animation Rules

- Idle: 4 frames, 1-2 pixel movement per frame.
- Walk: 4 frames, contact-passing cycle.
- Action: 4 frames max, reserve frame 4 for impact or reset.
- Breath beats: 1-2 pixels, save motion for action.

## 5. Layer Rules

- World, character, FX never share the same pixels.
- Outline only for glass, metal, UI chrome.
- Soft inner shading for leather, skin, concrete.

## 6. UI Rules

- Text in 5x7 or smaller.
- Prefer iconography.
- Buttons: 1-pixel inner bevel.
- Panels: 2-pixel outer border, 1-pixel inner shadow.

## 7. Rendering Pipeline

1. Silhouette at 1-bit black/white.
2. Value study with 3 values.
3. Color pass with color bible.
4. Animation pass at 1x scale.
5. Integration pass in intended scene.

## 8. Review Checklist

- [ ] Reads at 1x scale.
- [ ] 4-frame max.
- [ ] Layers clean.
- [ ] Color matches material.
- [ ] Value separation 3 stops.
- [ ] Outline rules followed.
- [ ] Surprise color present.
