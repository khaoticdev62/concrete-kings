#!/usr/bin/env bash
# Derives world-mark decals into assets/map/web/.
#
# WHAT A WORLD MARK IS. dynamic-world-map.js defines DM_WORLD_MARKS — eight
# categorical marks a location can carry (graffiti, police_tape, burn_marks,
# broken_windows, missing_sign, damaged_vehicle, new_guards, faction_marking).
# The level's `pois` are authored marks present at load; consequences add more
# at runtime. Either way the renderer draws the same sprite, which is why this
# script produces EIGHT decals and not one per POI: 24 POI records share them.
#
# The level design originally scoped 24 bespoke decals. That was wrong on two
# counts — at a 22-64px location sprite a 16px bespoke decal per POI is noise,
# and the engine already keys on the mark type rather than the POI id. The POI
# record carries the story (`meaning`); the sprite carries the category.
#
# FOUR OF THE EIGHT ARE DERIVED, FOUR STAY PROCEDURAL. Only four have honest
# art in the drop. The renderer draws the rest as palette shapes, which is the
# established asset-first / procedural-fallback rule from HANDOFF section 7 —
# a missing decal must never blank a location.
#
#   graffiti          wildstyle piece
#   faction_marking   character throw-up, deliberately unlike the piece above
#   burn_marks        burnt-out car hulk, top-down
#   damaged_vehicle   abandoned wreck, top-down
#
# Usage: bash scripts/process-poi-decals.sh
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=assets/map/web
SIZE=16

mkdir -p "$OUT"

# name | source | crop or "-"
#
# The wreck sources ship a side view at frame 000 and a top-down at 002. The map
# is top-down, so it is always 002; frame 000 would read as a car standing on
# its side next to a building drawn front-on.
while IFS='|' read -r name src crop; do
  [ -n "$name" ] || continue
  out="$OUT/mark_$name.png"

  if [ ! -f "$src" ]; then
    echo "MISSING SOURCE $src"
    echo "  The vendor asset drop is not in this checkout. Restore assets/ before rebuilding."
    continue
  fi

  if [ -f "$out" ] && [ "$(magick identify -format '%wx%h' "$out")" = "${SIZE}x${SIZE}" ]; then
    echo "$name: already ${SIZE}x${SIZE}, skipped"
    continue
  fi

  before=$(magick identify -format '%wx%h' "$src")
  args=("$src")
  [ "$crop" != "-" ] && args+=(-crop "$crop" +repage)

  # -trim first: these sources centre a small subject on a large transparent
  # canvas, and without the trim the decal is mostly empty and reads as a
  # 4-pixel smudge at map scale. Alpha thresholded after the downscale so no
  # soft fringe survives against dark asphalt.
  magick "${args[@]}" \
    -background none -alpha set \
    -trim +repage \
    -filter Box -resize "${SIZE}x${SIZE}" \
    \( +clone -alpha extract -threshold 45% -write mpr:a +delete \) \
    mpr:a -compose CopyOpacity -composite \
    -strip PNG32:"$out"

  echo "$name: $before -> $(magick identify -format '%wx%h' "$out")  $(magick identify -format '%b' "$out")  <- $(basename "$src")"
done <<'TABLE'
graffiti|assets/ME_Singles_Garage_Sales_48x48_Graffiti_1.png|-
faction_marking|assets/ME_Singles_Garage_Sales_48x48_Graffiti_9.png|-
burn_marks|assets/Wreckage/Burnt/Civic/CIVIC_Burnt_002.png|-
damaged_vehicle|assets/Wreckage/Abandoned/Civic/Black/Black_CIVIC_Wreck_002.png|-
TABLE
