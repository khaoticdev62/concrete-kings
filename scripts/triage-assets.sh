#!/usr/bin/env bash
# Triage assets/ — separate extraction scratch from the sources worth keeping.
#
# assets/ holds ~472,000 files and 2.5GB, of which git tracks 286. Most of the
# bulk is the same itch.io packs extracted three or four times over by different
# runs of scripts/aseprite/convert_new_assets*.js. Nothing under any path this
# script touches is tracked, and every pack it removes is reproducible from a
# zip that stays on disk.
#
# WHAT THIS DOES NOT TOUCH:
#   raw_assets/                   the documented approved-source root
#                                 (scripts/aseprite/README.md)
#   assets/*/web/, assets/generated/, assets/palettes/, assets/card_faces/ ...
#                                 derived output, tracked, and what the game loads
#   assets/Buildings, Wreckage, ui/, portraits/, Modern_Exteriors_*, ME_Singles_*
#                                 the flattened working copies process-*.sh read
#   any .zip                      the actual archive, 48 files
#
# DRY RUN BY DEFAULT. Pass --apply to delete.
#
# Usage: bash scripts/triage-assets.sh            # report only
#        bash scripts/triage-assets.sh --apply    # delete
set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

# Extraction scratch. Each of these is a re-extraction of packs that also exist
# elsewhere, or of zips still on disk.
TARGETS=(
  "assets/tmp_aseprite_work"      # 1503MB — _probe/_single/_2zips are three
                                  # separate re-extractions of the same packs;
                                  # the 20 pack originals all have zips on disk
  "assets/tmp_interiors"          # 156MB
  "assets/tmp_extract"            # 7MB
  "assets/tmp_combined"
  "assets/tmp_ranitaya"
  "assets/tmp_ranitaya_work"
  "assets/__MACOSX"               # macOS archive residue
  "tmp_aseprite_work"             # empty stub at repo root
)

# Byte-identical duplicate of assets/modernexteriors-win.zip. Verified by hash
# before this script was written; re-verified below rather than trusted.
DUP_ZIP="modernexteriors-win.zip"
DUP_OF="assets/modernexteriors-win.zip"

total_mb=0
total_files=0

echo "=== extraction scratch ==="
for t in "${TARGETS[@]}"; do
  if [ ! -e "$t" ]; then
    printf '  %-34s (absent)\n' "$t"
    continue
  fi
  # Refuse to touch anything git knows about. This is the safety net: if a
  # target ever starts carrying tracked files, the script stops instead of
  # deleting them.
  tracked=$(git ls-files "$t" | wc -l | tr -d ' ')
  if [ "$tracked" != "0" ]; then
    printf '  %-34s SKIPPED — %s tracked files\n' "$t" "$tracked"
    continue
  fi
  files=$(find "$t" -type f 2>/dev/null | wc -l | tr -d ' ')
  mb=$(du -sm "$t" 2>/dev/null | cut -f1)
  total_mb=$((total_mb + mb))
  total_files=$((total_files + files))
  printf '  %-34s %6s MB  %8s files\n' "$t" "$mb" "$files"
  [ "$APPLY" = "1" ] && rm -rf "$t"
done

echo
echo "=== duplicate archive ==="
if [ -f "$DUP_ZIP" ] && [ -f "$DUP_OF" ]; then
  a=$(sha256sum "$DUP_ZIP" | cut -d' ' -f1)
  b=$(sha256sum "$DUP_OF" | cut -d' ' -f1)
  mb=$(du -sm "$DUP_ZIP" | cut -f1)
  if [ "$a" = "$b" ]; then
    printf '  %-34s %6s MB  identical to %s\n' "$DUP_ZIP" "$mb" "$DUP_OF"
    total_mb=$((total_mb + mb))
    total_files=$((total_files + 1))
    [ "$APPLY" = "1" ] && rm -f "$DUP_ZIP"
  else
    printf '  %-34s NOT identical — keeping both\n' "$DUP_ZIP"
  fi
else
  echo "  (one or both copies absent)"
fi

echo
echo "=== duplicate naming at assets/ root ==="
# Every Modern Exteriors single is present twice under two names:
#   ME_Singles_Camping_48x48_Tree_17.png
#   Modern_Exteriors_Complete_Singles_48x48_ME_Singles_Camping_48x48_Tree_17.png
# 6222 pairs, all byte-identical, no orphans. Only ~13MB — sprites are small —
# but 6222 of the 40076 PNGs in a single flat directory, and the build scripts
# had drifted into depending on BOTH conventions. The short form wins: it is
# what most of process-*.sh already reads and what the packs themselves use.
dup_pairs=$(node -e "
const fs=require('fs'),crypto=require('crypto');
const PRE='Modern_Exteriors_Complete_Singles_48x48_';
const long=fs.readdirSync('assets').filter(f=>f.startsWith(PRE)&&f.endsWith('.png'));
let n=0,b=0;
for(const L of long){
  const S=L.slice(PRE.length);
  if(!fs.existsSync('assets/'+S))continue;
  const h=p=>crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
  if(h('assets/'+L)!==h('assets/'+S))continue;
  n++; b+=fs.statSync('assets/'+L).size;
  if(process.argv[1]==='apply') fs.unlinkSync('assets/'+L);
}
console.log(n+' '+Math.round(b/1048576));
" "$([ "$APPLY" = "1" ] && echo apply || echo dry)")
set -- $dup_pairs
printf '  %-34s %6s MB  %8s files (long prefix, identical twin kept)\n' "Modern_Exteriors_Complete_*" "$2" "$1"
total_mb=$((total_mb + $2))
total_files=$((total_files + $1))

echo
printf 'TOTAL: %s MB across %s files\n' "$total_mb" "$total_files"
if [ "$APPLY" = "1" ]; then
  echo "APPLIED. Re-extract any pack from its zip if you need the originals back."
else
  echo "DRY RUN — nothing deleted. Re-run with --apply to remove."
fi
