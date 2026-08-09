#!/usr/bin/env bash
# Slices the generated 4x4 city tile atlases into ground decals for the
# top-down renderer.
#
# WHY DECALS AND NOT A TILED GROUND TEXTURE
#
# The obvious use for a tile atlas is to pattern-fill the roads and ground with
# it. That was tried and it looks wrong: these cells are individually
# illustrated tiles, not seamless textures. Each one carries a dark border and
# one dominant motif — a single crack star, one pothole — so repeating it
# produces a visible grid with the same crack stamped in every cell. Larger
# tiles made it worse, because the motif became more legible.
#
# So the flat procedural road and ground surfaces stay (they read clean), and
# the atlas is used for what it is actually good at: discrete detail scattered
# over that surface. Drains, manholes, litter and oil slicks are exactly the
# cells these generations got right.
#
# Row 0 cells are surface textures and row 3 is side-on building facades. Only
# row 2 — the detail row — is taken. See assets/ASSET_INVENTORY.md.
#
# Output is one strip per district, 32px tiles side by side, in the order the
# manifest declares them.
#
# Usage: bash scripts/slice-tilesets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=assets/sprite_packs
mkdir -p "$OUT"
CELL=256

# Atlas cells are addressed as row,col. Each district lists the cells to pull,
# in manifest order. Names are documentation only — the manifest owns the keys.
#
# Cells must be listed in the same order the manifest declares their sprite
# keys, since they are packed into the strip left to right.
#
# harlem:  drain, manhole, litter
# detroit: grate, vent, litter, oil slick
# nola:    fallen leaves, Mardi Gras beads
#
# Skipped as side-on rather than top-down: NOLA's wrought-iron fence. Its lamp
# post base is borderline and left out.
#
# MIAMI IS DELIBERATELY ABSENT. Its atlas is a pastel art-deco set in a different
# visual language from the districts, and worse, each of its cells has a wildly
# different field colour — near-white terrazzo, dark brown, orange tan. The tone
# correction below reconciles one field with one sidewalk colour; it cannot
# reconcile three. Every Miami decal read as a coloured square on the pavement.
# The atlas needs regenerating in the project palette, without captions.
#
# The row-0 surface cells were tried as occasional ground patches and cut: they
# are illustrated scenes, not patches. Harlem's is a two-tone wall/floor boundary
# and Detroit's a bright orange dirt square, and both read as a pasted tile.
TILESETS="
harlem:2,0:2,1:2,2
detroit:2,0:2,1:2,2:2,3
nola:2,2:2,3
miami:0,3:2,2:2,3
chicago:2,0:2,2:2,3
oakland:2,2:2,3
baltimore:2,0:2,2:2,3
atlanta:2,2:2,3
"

# Some generations caption every cell with its name — "Wet Asphalt", "Street
# Drain" — baked into a strip along the bottom. Those districts need a shorter
# crop or the caption ends up in the sprite. Miami's atlas is captioned; it is
# listed here so the handling survives a future regeneration.
LABELLED_ATLASES="miami"

# Each decal carries its own field colour baked in, so it draws as a square
# patch of that colour with the object on top. If the field does not match the
# pavement it sits on, the patch pops as a bright square — Harlem's decals came
# off a warm grey concrete field at luminance 105 against a sidewalk at 76.
#
# So each tile is toned to its district's sidewalk colour: the field luminance is
# measured and -modulate scales the whole tile to match, which preserves the
# object's internal contrast rather than flattening it. Reading the target from
# the palette means a newly generated district self-corrects.
# Prints "<luminance> <hex>" for a district's sidewalk colour, or nothing if the
# district key is unknown.
walk_target() {
  node -e '
const { DISTRICTS } = require("./src/pixel_engine/topdown-city-data.js");
const key = process.argv[1].toUpperCase();
const d = DISTRICTS[key];
if (!d) { console.log(""); process.exit(0); }
const hex = d.palette.walk;
const n = parseInt(hex.slice(1), 16);
const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
console.log(Math.round(lum), hex);
' "$1"
}

for entry in $TILESETS; do
  IFS=':' read -r district rest <<< "$entry:"
  src="assets/${district}_tileset_raw.jpg"
  [ -f "$src" ] || { echo "MISSING $src — skipped"; continue; }

  read -r target walk_hex <<< "$(walk_target "$district")"
  [ -n "${target:-}" ] || { echo "SKIP $district — not a known district key"; continue; }

  tmp=$(mktemp -d)
  i=0
  # Re-split the remaining fields as the cell list.
  cells=$(echo "$entry" | cut -d: -f2-)
  for cell in $(echo "$cells" | tr ':' ' '); do
    [ -n "$cell" ] || continue
    row="${cell%%,*}"
    col="${cell##*,}"
    out="$tmp/$(printf '%02d' $i).png"

    # Inset by 6px to drop the dark border the generator draws around each cell,
    # which would otherwise read as a hard frame around every decal. Captioned
    # atlases lose more from the bottom, where the caption sits.
    band=0
    case " $LABELLED_ATLASES " in *" $district "*) band=46 ;; esac
    side=$((CELL - 12 - band))
    magick "$src" \
      -crop "${side}x${side}+$((col * CELL + 6))+$((row * CELL + 6))" +repage \
      -filter Box -resize 32x32! \
      "$out"

    # Tone the field to the district's pavement. The corner pixel is the field,
    # since the object sits centred in every one of these cells.
    field=$(magick "$out" -alpha off -colorspace gray -format '%[fx:int(255*p{1,1})]' info:)
    if [ "$field" -gt 0 ]; then
      factor=$(( target * 100 / field ))
      [ "$factor" -lt 30 ] && factor=30
      [ "$factor" -gt 200 ] && factor=200
      # Luminance alone is not enough. The atlas fields are a warm grey and the
      # sidewalks are cool blue-grey, so brightness-matched decals still read as
      # warm squares pasted on the pavement. Pulling saturation down and tinting
      # a little toward the sidewalk colour settles the hue while leaving the
      # object's own detail — the red can in the litter still shows.
      magick "$out" -modulate "$factor,62" \
        -fill "$walk_hex" -colorize 20% "$out"
      echo "  ${district} cell ${row},${col}: field=${field} target=${target} modulate=${factor} tint=${walk_hex}"
    fi
    i=$((i + 1))
  done

  magick "$tmp"/*.png +append +repage -define png:color-type=6 PNG32:"$OUT/city_${district}_tiles.png"
  rm -rf "$tmp"

  echo "${district}: ${i} decals -> $(magick identify -format '%wx%h' "$OUT/city_${district}_tiles.png")  $OUT/city_${district}_tiles.png"
done
