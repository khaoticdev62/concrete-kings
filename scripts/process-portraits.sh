#!/usr/bin/env bash
# Prepares NPC portrait art for the npcPoiScene portrait canvas.
#
# THE SOURCES ARE JPEGs WITH A .png EXTENSION. `file assets/portraits/ray.png`
# says "JPEG image data ... 1024x1024". Nothing in the repo reads the extension
# and fails on it — the browser sniffs content — but do not assume a PNG header
# is there, and do not point the game at these directly: they are 600-830KB
# each, against HANDOFF section 5's rule that raws never load in the browser.
#
# The art is drawn on a 128-logical-pixel grid and stored upscaled 8x to 1024.
# So 1024 -> 128 with an area-average Box filter is not a lossy downscale, it
# recovers the original grid almost exactly. Lanczos (ImageMagick's default for
# -resize) blurs the block edges and the portrait stops reading as pixel art.
#
# 128 is also the size the canvas draws at: #npcScenePortrait is width/height
# 128 with a 128px CSS box, so source -> canvas -> screen is 1:1 the whole way
# and nothing resamples at runtime. See HANDOFF trap 2.6 for why that matters.
#
# Usage: bash scripts/process-portraits.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets/portraits
WEB=assets/portraits/web
SIZE=128

mkdir -p "$WEB"

for src in "$SRC"/*.png; do
  [ -f "$src" ] || continue
  name=$(basename "$src")
  out="$WEB/$name"

  # Idempotence guard, same reasoning as process-props.sh: re-running must not
  # push already-correct art through the filter chain a second time.
  if [ -f "$out" ] && [ "$(magick identify -format '%wx%h' "$out")" = "${SIZE}x${SIZE}" ]; then
    echo "$name: already ${SIZE}x${SIZE}, skipped"
    continue
  fi

  before=$(magick identify -format '%wx%h' "$src")
  # -strip drops the 300dpi JFIF density block, which is meaningless on screen
  # and only inflates the file. PNG8 at 192 colours holds these portraits without
  # visible banding and lands each one around 20KB.
  magick "$src" \
    -filter Box -resize "${SIZE}x${SIZE}!" \
    -strip -colors 192 \
    PNG8:"$out"

  echo "$name: $before -> $(magick identify -format '%wx%h' "$out")  $(du -k "$out" | cut -f1)KB"
done
