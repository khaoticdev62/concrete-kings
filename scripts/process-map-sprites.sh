#!/usr/bin/env bash
# Derives the narrative map's sprite set into assets/map/web/.
#
# WHY DERIVE AT ALL. assets/ holds ~511,000 PNGs of which git tracks ~123: the
# Modern Exteriors / Interiors library is an untracked local vendor drop. Every
# sheet this script reads is untracked, so pointing the game at those paths
# directly would make the map resolve on one machine and 404 on a fresh clone.
# The derived PNGs below ARE tracked, they are a few KB each, and the manifest
# in dynamic-map-assets.js references only them. test/map-sprites.test.js fails
# if a mapping ever points back outside assets/map/web/.
#
# WHY RECTS. The sources are not what their names suggest. 2_City_Terrains_48x48
# is a 2832x4944 atlas, not a tile; Condo_6_Garage_Door_48x48 is a 5760x144
# strip. Those need a source rect. The rest are whole single objects at awkward
# aspect ratios (1008x864, 240x384) that were being drawn into a forced square.
# Cropping happens here so the renderer only ever draws a finished sprite.
#
# WHY 64. The world renderer draws locations at 22px (CITY zoom), 40px
# (DISTRICT) and 64px (closest), so 64 on the long edge is 1:1 at the largest
# draw and downsamples cleanly at the other two. The existing generated art in
# assets/generated/ is 32x32 and is already being upscaled 2x at closest zoom,
# which is part of why the map reads as mush.
#
# Usage: bash scripts/process-map-sprites.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets
OUT=assets/map/web
BOX=64

mkdir -p "$OUT"

# out_name | source file | crop geometry or "-" | mode
#
# mode=tile  keep native size, never resample - the ground tile must stay 48x48
#            or it stops tiling seamlessly.
# mode=fit   fit inside BOXxBOX preserving aspect ratio.
SPRITES="
ground_asphalt|2_City_Terrains_48x48.png|48x48+0+192|tile
building_hidden|Condo_6_Garage_Door_48x48.png|192x144+0+0|fit
building_landmark|ME_Singles_Generic_Building_48x48_Condo_1_1.png|144x288+0+288|fit
character_fallback|2_Characters/Old/Single_Characters_Legacy/48x48/Adam_idle_48x48.png|48x96+0+0|fit
building_institution|ME_Singles_Police_Station_48x48_Police_Station_1.png|-|fit
building_social|ME_Singles_School_48x48_Basketball_Court_1.png|-|fit
building_default|ME_Singles_Shopping_Center_and_Markets_48x48_Market_Small_1.png|-|fit
"

for entry in $SPRITES; do
  name="${entry%%|*}";      rest="${entry#*|}"
  src="$SRC/${rest%%|*}";   rest="${rest#*|}"
  crop="${rest%%|*}"
  mode="${rest##*|}"
  out="$OUT/$name.png"

  if [ ! -f "$src" ]; then
    echo "MISSING SOURCE $src"
    echo "  The vendor asset drop is not in this checkout. Restore assets/ before rebuilding."
    continue
  fi

  # Idempotence guard, same reasoning as process-props.sh: a second run must not
  # push already-correct art through the filter chain again. Each pass through
  # Box loses a little more detail.
  if [ -f "$out" ]; then
    have=$(magick identify -format '%wx%h' "$out")
    if [ "$mode" = tile ] && [ "$have" = "48x48" ]; then
      echo "$name: already $have, skipped"; continue
    fi
    if [ "$mode" = fit ]; then
      long=$(magick identify -format '%[fx:max(w,h)]' "$out")
      if [ "$long" = "$BOX" ]; then echo "$name: already $have, skipped"; continue; fi
    fi
  fi

  before=$(magick identify -format '%wx%h' "$src")

  if [ "$mode" = tile ]; then
    # No resize and no alpha work. This tile is opaque asphalt (#534f52, mean
    # luminance 81) picked out of 1006 flat tiles in the atlas as the flattest
    # one under the luminance-120 ceiling HANDOFF section 5 puts on large ground
    # fills. The lighter pavement family in the same atlas sits at 142 and is
    # deliberately not used here.
    magick "$src" -crop "$crop" +repage -strip PNG32:"$out"
  else
    args=("$src")
    [ "$crop" != "-" ] && args+=(-crop "$crop" +repage)
    # Box is an area average: the right filter for a large downscale of pixel
    # art, where Lanczos ringing shows up as haloing on flat colour. Alpha is
    # thresholded back to binary afterwards because partial alpha from the
    # average reads as a soft grey fringe against dark asphalt.
    magick "${args[@]}" \
      -background none -alpha set \
      -filter Box -resize "${BOX}x${BOX}" \
      \( +clone -alpha extract -threshold 50% -write mpr:a +delete \) \
      mpr:a -compose CopyOpacity -composite \
      -strip PNG32:"$out"
  fi

  echo "$name: $before -> $(magick identify -format '%wx%h' "$out")  $(du -k "$out" | cut -f1)KB  <- $(basename "$src")"
done
