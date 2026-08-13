#!/usr/bin/env bash
# Derives the HUD icon set into assets/ui/web/.
#
# WHAT THIS REPLACES. index.html used colour emoji for six UI affordances. Emoji
# render from the operating system's colour emoji font, so they ignore the
# palette entirely, look different on Windows, macOS and Linux, and sit at a
# different visual weight from every other pixel in the game. They are the only
# thing on the header bar that is not pixel art.
#
# WHAT THIS DELIBERATELY DOES NOT DO. The same kit ships panel frames, button
# plates and progress bars, and none of them are used. Its chrome is warm
# fantasy-RPG tan and gold; the game's is slate bevel (#181920 on #474d5e with
# #8b95ab / #2d313d edges). Swapping one for the other would be a large cosmetic
# change that fights the app's identity rather than serving it. The icons are
# different: they are near-monochrome silhouettes, so recolouring them into the
# game's palette is faithful in a way that remapping multi-hue art is not — that
# is the distinction HANDOFF section 5 draws when it records why the
# topdown-recolor experiment was closed.
#
# WHY 16. Source cells are 48x48 but the art sits on a 16-pixel logical grid
# stored at 3x, so 48 -> 16 with a Box filter recovers the original grid instead
# of resampling it. 16px is also the size these draw at next to 8px button text.
#
# Usage: bash scripts/process-ui-icons.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SHEET="assets/ui/48x48/Modern_UI_Style_1_48x48.png"
OUT=assets/ui/web
SIZE=16

mkdir -p "$OUT"

if [ ! -f "$SHEET" ]; then
  echo "MISSING SOURCE $SHEET"
  echo "  The vendor asset drop is not in this checkout. Restore assets/ before rebuilding."
  exit 0
fi

# name | source rect | shadow colour | highlight colour
#
# Two colours rather than a flat fill: these glyphs carry a light and a dark
# tone, and +level-colors remaps that ramp instead of crushing it, so the icon
# keeps its shading. Colours are the game's own — #cbd5ed body text, #f25438 for
# locked and error states, #ffcd68 for the gold accent.
ICONS="
music_on|48x48+1008+96|#3a4152|#cbd5ed
music_off|48x48+1056+96|#3a4152|#cbd5ed
sound_on|48x48+1440+432|#3a4152|#cbd5ed
sound_off|48x48+1488+432|#3a4152|#cbd5ed
lock|48x48+1152+288|#5a1f16|#f25438
trophy|48x48+1248+432|#7a5a20|#ffcd68
"

for entry in $ICONS; do
  name="${entry%%|*}";   rest="${entry#*|}"
  rect="${rest%%|*}";    rest="${rest#*|}"
  shadow="${rest%%|*}"
  light="${rest##*|}"
  out="$OUT/$name.png"

  # Idempotence guard, same reasoning as the other process-* scripts.
  if [ -f "$out" ] && [ "$(magick identify -format '%wx%h' "$out")" = "${SIZE}x${SIZE}" ]; then
    echo "$name: already ${SIZE}x${SIZE}, skipped"
    continue
  fi

  # Alpha is thresholded after the downscale for the same reason as the props:
  # partial alpha from an area average reads as a grey fringe on a dark panel,
  # and at 16px a one-pixel fringe is a tenth of the glyph.
  # -channel RGB is load-bearing. Unrestricted, +level-colors remaps the alpha
  # channel along with the colour, which drives every transparent pixel to full
  # opacity and turns each icon into a solid coloured square. The glyph is still
  # in there, invisible against its own background.
  magick "$SHEET" -crop "$rect" +repage \
    -background none -alpha set \
    -channel RGB +level-colors "$shadow","$light" +channel \
    -filter Box -resize "${SIZE}x${SIZE}!" \
    \( +clone -alpha extract -threshold 45% -write mpr:a +delete \) \
    mpr:a -compose CopyOpacity -composite \
    -strip PNG32:"$out"

  echo "$name: $rect -> $(magick identify -format '%wx%h' "$out")  $(magick identify -format '%[fx:int(filesize/1)]' "$out" 2>/dev/null || stat -c%s "$out")B"
done
