#!/usr/bin/env node
/**
 * Regenerates assets/palettes/concrete_kings.json from PALETTE_RAMPS.
 *
 * The palette exists in two places for good reasons — the engine shades with it at
 * runtime, and the asset pipeline quantises generated art to it — but only one of
 * them can be the authority. It is src/pixel_engine/pixel-engine.js. This script
 * emits the JSON, and test/pixel-engine.test.js asserts the emitted file still
 * matches the ramps, so the two cannot drift.
 *
 * That drift was real: expanding the palette to nine ramps left the JSON on the old
 * 64 colours, and the district-data test failed against the stale file rather than
 * against anything actually wrong.
 *
 * Run: node scripts/generate-palette-json.js
 */

const fs = require('fs');
const path = require('path');
const { PALETTE_RAMPS, MASTER_PALETTE } = require('../src/pixel_engine/pixel-engine.js');

const OUT = path.join(__dirname, '..', 'assets', 'palettes', 'concrete_kings.json');

/**
 * `groups` is kept alongside `ramps` because the pipeline and the generation prompts
 * ask for colours by broad family, not by shading ramp. Greys map straight across;
 * warm covers brick and sodium; cool covers azure, teal, green and violet.
 */
const GROUPS = {
  blacks_grays: ['greys'],
  warm_tones: ['brick', 'earth'],
  cool_tones: ['azure', 'teal', 'green', 'violet'],
  skin_tones: ['skin', 'skinShade']
};

const payload = {
  palette_name: 'ConcreteKings_Master',
  version: '2.0.0',
  generated_by: 'scripts/generate-palette-json.js from src/pixel_engine/pixel-engine.js',
  color_count: MASTER_PALETTE.length,
  note: 'Ramps are the shading authority: paletteShift(colour, n) walks the ramp a '
    + 'colour belongs to. Every adjacent pair is within CIELAB dE 12, so one step is '
    + 'one shade rather than a change of hue. Groups are a convenience view for asset '
    + 'generation and quantisation.',
  ramps: PALETTE_RAMPS,
  groups: Object.fromEntries(
    Object.entries(GROUPS).map(([group, ramps]) => [group, ramps.flatMap(r => PALETTE_RAMPS[r])])
  )
};

// Sanity: the convenience view must not lose or duplicate a colour, or art quantised
// through `groups` would be quantised to a different gamut than the engine shades in.
const flatGroups = Object.values(payload.groups).flat();
if (flatGroups.length !== MASTER_PALETTE.length || new Set(flatGroups).size !== MASTER_PALETTE.length) {
  console.error('GROUPS does not partition the ramps — every ramp must appear exactly once.');
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${payload.color_count} colours, `
  + `${Object.keys(PALETTE_RAMPS).length} ramps`);
