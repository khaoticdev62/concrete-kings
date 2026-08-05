const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Texture Atlases: Procedural PNG atlases exist and have valid PNG signatures', () => {
  const atlasDir = path.join(__dirname, '..', 'assets', 'atlases');
  const files = ['master_tiles_atlas.png', 'characters_atlas.png', 'cards_atlas.png'];

  files.forEach(filename => {
    const filePath = path.join(atlasDir, filename);
    assert.ok(fs.existsSync(filePath), `Atlas file ${filename} must exist`);

    const stats = fs.statSync(filePath);
    assert.ok(stats.size > 100, `Atlas ${filename} must have non-trivial size`);

    const buf = fs.readFileSync(filePath);
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    assert.deepEqual(buf.subarray(0, 8), pngSignature, `Atlas ${filename} must have valid PNG signature`);
  });
});
