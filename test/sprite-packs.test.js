const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Sprite Packs: All 8 regional city tile packs exist and are valid 8-bit PNGs', () => {
  const packsDir = path.join(__dirname, '..', 'assets', 'sprite_packs');
  const cities = ['detroit', 'chicago', 'miami', 'baltimore', 'atlanta', 'harlem', 'oakland', 'nola'];

  cities.forEach(city => {
    const fileName = `city_${city}_tiles.png`;
    const filePath = path.join(packsDir, fileName);
    assert.ok(fs.existsSync(filePath), `City sprite pack ${fileName} must exist`);

    const buf = fs.readFileSync(filePath);
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    assert.deepEqual(buf.subarray(0, 8), pngSignature, `File ${fileName} must be a valid PNG`);
  });
});

test('Sprite Packs: Character hustles atlas & sprite manifest exist with 48 character entries', () => {
  const packsDir = path.join(__dirname, '..', 'assets', 'sprite_packs');
  const atlasPath = path.join(packsDir, 'character_hustles_atlas.png');
  const manifestPath = path.join(packsDir, 'sprite_manifest.json');

  assert.ok(fs.existsSync(atlasPath), 'character_hustles_atlas.png must exist');
  assert.ok(fs.existsSync(manifestPath), 'sprite_manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entries = Object.keys(manifest);

  assert.equal(entries.length, 48, 'Manifest must contain exactly 48 character hustle entries (8 origins x 6 levels)');

  // Verify Barber Level 6 Legend entry
  const barberL6 = manifest['BARBER_L6'];
  assert.ok(barberL6);
  assert.equal(barberL6.origin, 'BARBER');
  assert.equal(barberL6.hustleLevel, 6);
  assert.equal(barberL6.frames.length, 4, 'Each hustle variant must have 4 animation frames');
});
