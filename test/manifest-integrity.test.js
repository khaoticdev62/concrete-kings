const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { AssetRegistry } = require('../src/pixel_engine/asset-registry.js');

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'manifest.json'), 'utf8'));

test('Manifest: every declared source file exists on disk', () => {
  // A missing source degrades to procedural rendering silently by design, which
  // is correct at runtime but means a typo'd path never surfaces. This is where
  // it surfaces.
  const missing = Object.entries(manifest.sources)
    .filter(([, p]) => !fs.existsSync(path.join(ROOT, p)))
    .map(([name, p]) => `${name} -> ${p}`);
  assert.deepEqual(missing, [], `manifest sources not found: ${missing.join(', ')}`);
});

test('Manifest: every sprite names a declared source', () => {
  const undeclared = Object.entries(manifest.sprites)
    .filter(([, def]) => !Object.prototype.hasOwnProperty.call(manifest.sources, def.source))
    .map(([key, def]) => `${key} -> ${def.source}`);
  assert.deepEqual(undeclared, [], `sprites naming undeclared sources: ${undeclared.join(', ')}`);
});

test('Manifest: no source is a browser-hostile size', () => {
  // The originals in assets/scenes and assets/prop_*.jpg run 0.4-14MB. Pointing
  // the manifest at one would make the game load it. Web copies are the only
  // thing that may be declared.
  const tooBig = Object.entries(manifest.sources)
    .map(([name, p]) => ({ name, p, kb: fs.statSync(path.join(ROOT, p)).size / 1024 }))
    .filter(s => s.kb > 400)
    .map(s => `${s.name} (${Math.round(s.kb)}KB)`);
  assert.deepEqual(tooBig, [], `manifest declares oversized sources: ${tooBig.join(', ')}`);
});

test('Manifest: POI prop sprites cover all five canonical POIs', () => {
  const { POI_IDS } = require('../src/pixel_engine/topdown-city-data.js');
  const missing = POI_IDS.filter(id => !manifest.sprites['prop_poi_' + id.toLowerCase()]);
  assert.deepEqual(missing, [],
    `POIs with no prop sprite, which fall back to a plain square: ${missing.join(', ')}`);
});

test('Manifest: sprite dimensions match the real image, so nothing draws stretched', async () => {
  // Reads the PNG IHDR directly rather than trusting the manifest's own numbers.
  const pngSize = (file) => {
    const buf = fs.readFileSync(file);
    if (buf.slice(1, 4).toString() !== 'PNG') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  };

  const wrong = [];
  for (const [key, def] of Object.entries(manifest.sprites)) {
    const file = path.join(ROOT, manifest.sources[def.source]);
    const real = pngSize(file);
    if (!real) continue;                     // non-PNG sources are not checked here
    if (def.x === 0 && def.y === 0) {
      // Full-image sprite: its declared size must match the file exactly.
      if (def.w !== real.w || def.h !== real.h) {
        wrong.push(`${key} declares ${def.w}x${def.h} but image is ${real.w}x${real.h}`);
      }
    } else if (def.x + def.w > real.w || def.y + def.h > real.h) {
      wrong.push(`${key} slice runs outside its ${real.w}x${real.h} source`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('; '));
});

test('Manifest: prop sprites have transparent corners, not an opaque background', () => {
  // Three of four street furniture props shipped with opaque backgrounds — two
  // white, one teal — because the background remover only stripped near-black
  // while the sources had white borders. They rendered as boxes on the map.
  // Dimensions, file sizes and resolution all passed; only looking caught it.
  // Corner alpha is the cheap invariant that would have caught it first.
  // Reads corner pixels as srgba(...) strings and pulls the alpha out. The fx
  // form for alpha is p{x,y}.a; the %[pixel:] form is simpler to parse.
  const corners = (file) => {
    const out = require('child_process').execFileSync('magick', [
      file, '-format',
      '%[pixel:p{1,1}]|%[pixel:p{w-2,1}]|%[pixel:p{1,h-2}]|%[pixel:p{w-2,h-2}]',
      'info:'
    ], { encoding: 'utf8' });
    return out.trim().split('|').map(px => {
      const m = px.match(/srgba?\(([^)]*)\)/);
      if (!m) return 1;                       // opaque named colour, e.g. "white"
      const parts = m[1].split(',').map(s => parseFloat(s));
      return parts.length === 4 ? parts[3] : 1;
    });
  };

  let magickAvailable = true;
  try { require('child_process').execFileSync('magick', ['-version'], { stdio: 'ignore' }); }
  catch { magickAvailable = false; }

  if (!magickAvailable) return;   // ImageMagick is a dev tool, not a dependency

  const opaque = [];
  Object.entries(manifest.sprites).forEach(([key, def]) => {
    if (!key.startsWith('prop_')) return;
    const file = path.join(ROOT, manifest.sources[def.source]);
    if (!file.endsWith('.png')) return;
    // A prop whose every corner is fully opaque has an unremoved background.
    if (corners(file).every(a => a > 0.99)) opaque.push(key);
  });

  assert.deepEqual(opaque, [],
    `these props have an opaque background and will draw as a box: ${opaque.join(', ')}`);
});

test('Manifest: furniture sprites are pre-scaled to the size the renderer draws them', () => {
  // The canvas runs with imageSmoothingEnabled = false, so an oversized source
  // is point-sampled down at draw time. The first pass drew 96x96 generator
  // canvases at 18x30 and the sampling grid missed the lamp post entirely —
  // lamps rendered as hair-thin squiggles. Every other check passed.
  // scripts/process-props.sh pre-scales the art; this keeps the two in step.
  const { FURNITURE_DISPLAY } = require('../src/pixel_engine/topdown-city-renderer.js');

  const wrong = [];
  Object.entries(FURNITURE_DISPLAY).forEach(([kind, size]) => {
    const def = manifest.sprites['prop_' + kind];
    if (!def) return;              // no sprite declared: renderer draws it procedurally
    if (def.w !== size.w || def.h !== size.h) {
      wrong.push(`prop_${kind} is ${def.w}x${def.h} but the renderer draws it at ${size.w}x${size.h}`);
    }
  });
  assert.deepEqual(wrong, [], wrong.join('; '));
});

test('Manifest: the registry loads it and resolves every sprite', async () => {
  const r = new AssetRegistry({ loadImage: async (p) => (fs.existsSync(path.join(ROOT, p)) ? { path: p } : null) });
  assert.equal(r.loadManifest(manifest), true, 'manifest must parse');
  await r.preload();

  const unresolved = Object.keys(manifest.sprites).filter(k => r.get(k) === null);
  assert.deepEqual(unresolved, [], `sprites that fail to resolve: ${unresolved.join(', ')}`);
});
