#!/usr/bin/env bash
# Prepares generated prop art for the top-down map renderer.
#
# The renderer sets imageSmoothingEnabled = false, so the browser downscales by
# point sampling. A 96x96 source drawn at 18x30 loses ~80% of its pixels and a
# thin lamp post can be missed by the sampling grid entirely — which is exactly
# how the first pass shipped lamps that looked like hair-thin squiggles.
#
# So the scaling happens here instead, with an area-average filter that keeps
# detail, and the PNG lands at the size the renderer draws it. Nearest-neighbour
# at draw time is then 1:1 and crisp.
#
# Also trims transparent padding, since the generator centres a small subject on
# a large canvas.
#
# Deliberately NOT remapped to assets/palettes/concrete_kings_64.json. That was
# tried: the master palette is thin on neutral mid-greys, so a car's grey body
# snapped to the amber accent ramp and the props came out orange-framed. The
# districts' procedural geometry is palette-bound; generated art is not.
#
# Usage: bash scripts/process-props.sh
set -euo pipefail
cd "$(dirname "$0")/.."

WEB=assets/props/web

# file:display_width:display_height — must match the renderer's draw sizes.
PROPS="
street_lamp_prop.png:18:30
phone_booth_prop.png:14:26
dumpster_prop.png:24:22
car_prop.png:22:36
"

for entry in $PROPS; do
  file="$WEB/${entry%%:*}"
  rest="${entry#*:}"
  w="${rest%%:*}"
  h="${rest##*:}"
  [ -f "$file" ] || { echo "MISSING $file"; continue; }

  before=$(magick identify -format '%wx%h' "$file")
  # Alpha is thresholded to binary after the downscale: partial alpha from an
  # area-average filter reads as a soft grey halo against dark asphalt.
  magick "$file" \
    -background none -alpha set \
    -fuzz 6% -trim +repage \
    -filter Box -resize "${w}x${h}!" \
    \( +clone -alpha extract -threshold 50% -write mpr:alpha +delete \) \
    mpr:alpha -compose CopyOpacity -composite \
    PNG32:"$file"
  echo "$(basename "$file"): $before -> $(magick identify -format '%wx%h' "$file")  corner=$(magick identify -format '%[pixel:p{0,0}]' "$file")"
done
