const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { DISTRICTS, getDistrict } = require('../src/pixel_engine/topdown-city-data.js');
const { TopDownCityController } = require('../src/pixel_engine/topdown-city-controller.js');

// Parse PNG palette/colors from file
function getPngUniqueColors(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
    throw new Error('Not a valid PNG');
  }

  let pos = 8;
  let colorType = 0;
  let paletteColors = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);
    
    if (type === 'IHDR') {
      colorType = data[9];
    } else if (type === 'PLTE') {
      // Indexed palette chunk
      for (let i = 0; i < length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        paletteColors.push(hex);
      }
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }

  return { colorType, paletteColors };
}

test('Detroit Tiles: city_detroit_tiles.png exists and conforms to master palette compliance', () => {
  const filePath = path.join(__dirname, '..', 'assets', 'sprite_packs', 'city_detroit_tiles.png');
  assert.ok(fs.existsSync(filePath), 'Detroit tileset file must exist');

  const { colorType, paletteColors } = getPngUniqueColors(filePath);
  
  // Read master palette colors
  const masterPath = path.join(__dirname, '..', 'assets', 'palettes', 'concrete_kings_64.json');
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const allowedColors = new Set(Object.values(master.groups).flat().map(c => c.toUpperCase()));

  if (colorType === 3) {
    // If it's an indexed PNG, verify the color palette contains only allowed colors
    paletteColors.forEach(c => {
      assert.ok(allowedColors.has(c), `Color ${c} in Detroit tileset is not in the master palette`);
    });
  }
});

test('Detroit Tiles: Detroit district collision boundaries are valid and player spawn is walkable', () => {
  const controller = new TopDownCityController({ districtKey: 'DETROIT', attachInput: false });
  assert.equal(controller.districtKey, 'DETROIT');
  
  // Spawn coordinates must be walkable
  assert.equal(controller.collidesAt(controller.x, controller.y), false, 'Detroit spawn point must not collide');

  // Verify that the player stays within bounds
  assert.ok(controller.x >= 0 && controller.x <= 2400);
  assert.ok(controller.y >= 0 && controller.y <= 1300);
});

test('Detroit Tiles: Roads and sidewalks are walkable, while parcels defined as solid are blocked', () => {
  const detroit = getDistrict('DETROIT');
  const controller = new TopDownCityController({ districtKey: 'DETROIT', attachInput: false });

  // Test roads: should be walkable (no collision)
  detroit.roads.forEach(road => {
    const rx = road.x + road.w / 2;
    const ry = road.y + road.h / 2;
    assert.equal(controller.collidesAt(rx, ry), false, 'Road center must be walkable');
  });

  // Test sidewalks: should be walkable (no collision)
  detroit.sidewalks.forEach(sidewalk => {
    const sx = sidewalk.x + sidewalk.w / 2;
    const sy = sidewalk.y + sidewalk.h / 2;
    assert.equal(controller.collidesAt(sx, sy), false, 'Sidewalk center must be walkable');
  });

  // Test solid buildings: should collide
  const solidBuildings = detroit.parcels.filter(p => p.solid);
  assert.ok(solidBuildings.length >= 1, 'Detroit must have at least one solid building');
  solidBuildings.forEach(building => {
    const bx = building.x + building.w / 2;
    const by = building.y + building.h / 2;
    assert.equal(controller.collidesAt(bx, by), true, 'Solid building center must collide');
  });
});
