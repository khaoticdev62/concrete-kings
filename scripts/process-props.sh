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
# Deliberately NOT remapped to assets/palettes/concrete_kings.json. That was
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
  # Idempotence guard. Without it a second run re-trims and re-resamples art that
  # is already at its target size, and each pass through the Box filter loses a
  # little more detail. The script is meant for fresh generator output, but it
  # gets re-run whenever a new prop is added.
  if [ "$before" = "${w}x${h}" ]; then
    echo "$(basename "$file"): already ${w}x${h}, skipped"
    continue
  fi
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

# ---------------------------------------------------------------------------
# POI props: halo cleanup for named files only.
#
# These are drawn at their native size, so they are not rescaled. What some of
# them need is edge cleanup. Removing a white background with a flood-fill clears
# the solid white but leaves the anti-aliased ring between background and subject
# — light grey pixels at partial alpha. Composited over dark asphalt that ring
# reads as a white outline around the building, which is how the COUNTER DEAL prop
# shipped.
#
# NO METRIC DECIDES WHICH FILES GO HERE. Two were tried and both were wrong:
# counting light semi-transparent pixels read zero once alpha was binarised (the
# halo had become fully opaque), and counting light opaque pixels flagged the
# chess table's checkerboard and the barber pole's white stripes as halo, then
# "fixed" them into looking worse. Some of these subjects legitimately contain
# near-white paint, so no threshold separates halo from art.
#
# The check is visual. Composite on dark and look:
#   magick assets/props/web/<f>.png -background "#101116" -flatten \
#     -filter point -resize 250% /tmp/check.png
# Of the five POI props, only shop_deal shows an outline.
HALO_PROPS="shop_deal.png"

for name in $HALO_PROPS; do
  file="$WEB/$name"
  [ -f "$file" ] || { echo "MISSING $file"; continue; }

  W=$(magick identify -format '%w' "$file")
  H=$(magick identify -format '%h' "$file")

  # The background is flattened back to white FIRST. A flood-fill seeded on an
  # already-transparent corner matches only transparent pixels, so running it on a
  # part-processed PNG leaves the grey ring untouched — which is how this prop kept
  # its outline through one attempted fix. Restoring an opaque white background
  # gives the fill a real seed colour, and 32% fuzz then takes the white and its AA
  # ring together. This subject is dark at its silhouette, so the fill stops there.
  magick "$file" -background white -alpha remove -alpha off \
    -alpha set -fuzz 32% -fill none \
    -draw "color 0,0 floodfill" -draw "color $((W-1)),0 floodfill" \
    -draw "color 0,$((H-1)) floodfill" -draw "color $((W-1)),$((H-1)) floodfill" \
    -channel A -threshold 50% +channel \
    PNG32:"$file"

  echo "$name: halo pass done, corners now $(magick identify -format '%[pixel:p{1,1}]' "$file")"
done
