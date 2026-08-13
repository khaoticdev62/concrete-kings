#!/usr/bin/env bash
# Derives per-location building art for the narrative map into assets/map/web/.
#
# WHAT THIS REPLACES. assets/generated/map_building_*.png are 32x32 PNGs of
# 113 bytes each: a single flat colour, no art. They were drawn at 40px and 64px
# by the world renderer, so every location on the map was a slightly blurry
# coloured square. Their day / evening / night variants are the same file size
# and evening and night are the same colour, so the time-of-day axis they cost
# 3x the files for was not carrying anything either.
#
# WHY assets/Buildings AND NOT THE MODERN EXTERIORS PACK. Modern Exteriors is
# organised as construction kits — its terraced houses are ~60% roof, which at
# 64px leaves the facade unreadable, and its storefronts are all the same
# building in twelve colourways. assets/Buildings/Pngs holds seven hand-drawn
# urban facades with distinct silhouettes, materials and signage, which is what
# actually distinguishes one location from another at map scale.
#
# Like every other process-* script here: the sources are an untracked local
# vendor drop, the outputs are tracked. See HANDOFF section 5.
#
# Usage: bash scripts/process-map-buildings.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Sources are repo-relative per row: the buildings come from assets/Buildings
# and the train car is a crop out of a 1536x8880 station sheet.
OUT=assets/map/web
BOX=64

mkdir -p "$OUT"

# location id | source (repo-relative) | crop or "-" | why this art for this place
#
# Matched on what each image SHOWS against what the level calls the place. The
# level's own names are doing the work here — "Chicago Greystone" wants stone,
# "The Blue Plate" wants a diner, "Harlem Stoop" wants a walk-up.
#
# detroit_lot IS DELIBERATELY ABSENT, and not because the art is missing — that
# was the earlier reasoning and it was the weaker argument. A vacant lot has no
# building. Drawing one there is the wrong instinct: the geometric node, which
# is a flat plate with a state-coloured ring, is a more accurate picture of open
# ground than any facade in the drop would be. Its story is told by its POIs —
# tags on the back wall, and a burnt hulk once the war comes through.
# Read line by line rather than `for entry in $TABLE`: the sibling scripts get
# away with word splitting because none of their fields contain spaces, and the
# "why" column here does. Word splitting turned every word of it into its own
# bogus iteration looking for a file called "red-brick".
while IFS='|' read -r id src crop why; do
  [ -n "$id" ] || continue
  out="$OUT/building_loc_$id.png"

  if [ ! -f "$src" ]; then
    echo "MISSING SOURCE $src"
    echo "  The vendor asset drop is not in this checkout. Restore assets/ before rebuilding."
    continue
  fi

  # Idempotence guard, as in the sibling scripts: a second pass through Box
  # loses detail that the first pass already committed to.
  if [ -f "$out" ] && [ "$(magick identify -format '%[fx:max(w,h)]' "$out")" = "$BOX" ]; then
    echo "$id: already $(magick identify -format '%wx%h' "$out"), skipped"
    continue
  fi

  before=$(magick identify -format '%wx%h' "$src")
  args=("$src")
  [ "$crop" != "-" ] && args+=(-crop "$crop" +repage)
  # Box for the downscale (area average, no ringing on flat colour) and a binary
  # alpha afterwards, so no soft fringe survives to read as a halo against the
  # dark asphalt these are drawn on.
  magick "${args[@]}" \
    -background none -alpha set \
    -filter Box -resize "${BOX}x${BOX}" \
    \( +clone -alpha extract -threshold 50% -write mpr:a +delete \) \
    mpr:a -compose CopyOpacity -composite \
    -strip PNG32:"$out"

  echo "$id: $before -> $(magick identify -format '%wx%h' "$out")  $(du -k "$out" | cut -f1)KB  <- $(basename "$src") ($why)"
done <<'TABLE'
stoop|assets/Buildings/Pngs/Building7.png|-|narrow red-brick walk-up with a stooped base
blue_plate|assets/Buildings/Pngs/Building4.png|-|blue roof, red-and-white striped awning, deep windows - a diner
corner_store|assets/Buildings/Pngs/Building2.png|-|brick shopfront under twin awnings
chi_grey|assets/Buildings/Pngs/Building5.png|-|tan stone with arched windows - a greystone
bmore_steps|assets/Buildings/Pngs/Building1.png|-|red-brick rowhouse with rooftop units
miami_cut|assets/Buildings/Pngs/Building6.png|-|columned storefront, the closest thing here to deco
train_yard|assets/20_Subway_and_Train_Station_48x48.png|300x215+245+5930|one graffitied car section - the block's writing, on something leaving
TABLE
