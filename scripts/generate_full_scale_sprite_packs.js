/**
 * Concrete Kings: The Block Chronicles
 * Full-Scale Sprite Pack & Manifest Generator
 * Generates regional city tile packs & 48 character hustle variant sprite sheets.
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { createIndexedPNG } = require('./generate_procedural_atlases.js');
const { MASTER_PALETTE_64, CITY_THEME_OVERRIDES } = require('../src/pixel_engine/pixel-engine.js');
const { CHARACTER_ORIGINS } = require('../src/pixel_engine/block-map-navigation.js');

const ALL_HEX_COLORS = [
  ...MASTER_PALETTE_64.blacks_grays,
  ...MASTER_PALETTE_64.warm_tones,
  ...MASTER_PALETTE_64.cool_tones,
  ...MASTER_PALETTE_64.skin_tones
];

const PALETTE_RGB = ALL_HEX_COLORS.map(hex => ({
  r: parseInt(hex.substring(1, 3), 16),
  g: parseInt(hex.substring(3, 5), 16),
  b: parseInt(hex.substring(5, 7), 16)
}));

const CITIES = ['Detroit', 'Chicago', 'Miami', 'Baltimore', 'Atlanta', 'Harlem', 'Oakland', 'NOLA'];
const HUSTLE_LEVELS = [
  { level: 1, name: 'Novice', aura: false, chain: false },
  { level: 2, name: 'Apprentice', aura: false, chain: true },
  { level: 3, name: 'Journeyman', aura: false, chain: true },
  { level: 4, name: 'Master', aura: true, chain: true },
  { level: 5, name: 'Kingpin', aura: true, chain: true },
  { level: 6, name: 'Legend', aura: true, chain: true }
];

function generateCitySpritePack(cityName) {
  const packW = 256;
  const packH = 256;
  const pixelIndices = new Uint8Array(packW * packH);

  const overrides = CITY_THEME_OVERRIDES[cityName] || {};
  const brickIndex = overrides["7a1d1c"] ? 17 : 18; // Overridden brick index vs default

  // Draw 16x16 tile grid structure
  for (let y = 0; y < packH; y++) {
    for (let x = 0; x < packW; x++) {
      const tileX = Math.floor(x / 16);
      const tileY = Math.floor(y / 16);

      if (x % 16 === 0 || y % 16 === 0) {
        pixelIndices[y * packW + x] = 0; // Outline
      } else if (tileY < 4) {
        pixelIndices[y * packW + x] = (tileX + tileY) % 2 === 0 ? brickIndex : 6; // Building facades
      } else if (tileY < 8) {
        pixelIndices[y * packW + x] = 6; // Sidewalk concrete
      } else if (tileY < 12) {
        pixelIndices[y * packW + x] = 1; // Dark Asphalt
      } else {
        pixelIndices[y * packW + x] = 30; // High-Vis Yellow street markings
      }
    }
  }

  return createIndexedPNG(packW, packH, pixelIndices, PALETTE_RGB);
}

function generateCharacterHustlesAtlas() {
  // 48 Characters (8 Origins x 6 Hustles) x 4 Animation Frames = 192 Frames
  // Atlas layout: 16 columns x 12 rows of 32x32 frames = 512x384 PNG
  const atlasW = 512;
  const atlasH = 384;
  const pixelIndices = new Uint8Array(atlasW * atlasH);
  const manifest = {};

  const originKeys = Object.keys(CHARACTER_ORIGINS);

  originKeys.forEach((originKey, oIdx) => {
    const origin = CHARACTER_ORIGINS[originKey];

    HUSTLE_LEVELS.forEach((hustle, hIdx) => {
      const charKey = `${originKey}_L${hustle.level}`;
      manifest[charKey] = {
        origin: originKey,
        hustleLevel: hustle.level,
        hustleName: hustle.name,
        frames: []
      };

      for (let frame = 0; frame < 4; frame++) {
        // Calculate grid position in atlas
        const charGlobalIdx = oIdx * 6 + hIdx;
        const col = (charGlobalIdx * 4 + frame) % 16;
        const row = Math.floor((charGlobalIdx * 4 + frame) / 16);

        const startX = col * 32;
        const startY = row * 32;

        manifest[charKey].frames.push({ frame, x: startX, y: startY, w: 32, h: 32 });

        // Draw 32x32 character pixels into atlas
        for (let py = 0; py < 32; py++) {
          for (let px = 0; px < 32; px++) {
            const gx = startX + px;
            const gy = startY + py;

            // Character Body & Head
            if (px >= 12 && px <= 19 && py >= 6 && py <= 13) {
              pixelIndices[gy * atlasW + gx] = 53; // Skin tone midtone
            } else if (px >= 10 && px <= 21 && py >= 4 && py <= 7) {
              pixelIndices[gy * atlasW + gx] = 61; // Locs / Hair
            } else if (px >= 10 && px <= 21 && py >= 14 && py <= 24) {
              pixelIndices[gy * atlasW + gx] = 20; // Hoodie / Outfit
            } else if (px >= 11 && px <= 20 && py >= 25 && py <= 30) {
              pixelIndices[gy * atlasW + gx] = 35; // Pants
            } else if ((px >= 9 && px <= 14 && py >= 29 && py <= 31) || (px >= 17 && px <= 22 && py >= 29 && py <= 31)) {
              pixelIndices[gy * atlasW + gx] = 15; // Fresh White Sneakers
            }

            // Hustle Level Upgrades (Gold Chains & Glowing Auras for Level 4+)
            if (hustle.chain && px >= 15 && px <= 16 && py >= 13 && py <= 15) {
              pixelIndices[gy * atlasW + gx] = 29; // Pure Gold Chain (#F0AB43)
            }
            if (hustle.aura && (px === 8 || px === 23) && py >= 10 && py <= 20) {
              pixelIndices[gy * atlasW + gx] = (frame % 2 === 0) ? 24 : 31; // Neon Light Aura
            }
          }
        }
      }
    });
  });

  const pngBuf = createIndexedPNG(atlasW, atlasH, pixelIndices, PALETTE_RGB);
  return { pngBuf, manifest };
}

function runSpritePackPipeline() {
  const packsDir = path.join(__dirname, '..', 'assets', 'sprite_packs');
  if (!fs.existsSync(packsDir)) {
    fs.mkdirSync(packsDir, { recursive: true });
  }

  // 1. Generate 8 Regional City Tile Packs
  CITIES.forEach(city => {
    const pngBuf = generateCitySpritePack(city);
    const fileName = `city_${city.toLowerCase()}_tiles.png`;
    fs.writeFileSync(path.join(packsDir, fileName), pngBuf);
    console.log(`Generated ${fileName} (${pngBuf.length} bytes)`);
  });

  // 2. Generate 48 Character Hustle Variants Atlas & Manifest
  const { pngBuf, manifest } = generateCharacterHustlesAtlas();
  fs.writeFileSync(path.join(packsDir, 'character_hustles_atlas.png'), pngBuf);
  fs.writeFileSync(path.join(packsDir, 'sprite_manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Generated character_hustles_atlas.png (${pngBuf.length} bytes)`);
  console.log(`Generated sprite_manifest.json (48 character hustle entries mapped)`);
}

if (require.main === module) {
  runSpritePackPipeline();
}

module.exports = {
  generateCitySpritePack,
  generateCharacterHustlesAtlas,
  runSpritePackPipeline
};
