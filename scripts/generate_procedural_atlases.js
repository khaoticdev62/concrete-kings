/**
 * Concrete Kings: The Block Chronicles
 * Procedural PNG Texture Atlas Generator (Zero External Dependencies)
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { MASTER_PALETTE_64 } = require('../src/pixel_engine/pixel-engine.js');

// Combine 64-color master palette into flat RGB array
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

/**
 * Calculates 32-bit CRC for PNG chunks
 */
function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c ^= buf[n];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Encodes indexed 8-bit image data into a valid PNG buffer
 */
function createIndexedPNG(width, height, pixelIndices, paletteRGB) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // Bit depth = 8
  ihdr.writeUInt8(3, 9);  // Color type = 3 (Indexed)
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // PLTE Chunk (Palette)
  const plte = Buffer.alloc(paletteRGB.length * 3);
  paletteRGB.forEach((color, i) => {
    plte[i * 3]     = color.r;
    plte[i * 3 + 1] = color.g;
    plte[i * 3 + 2] = color.b;
  });
  const plteChunk = createChunk('PLTE', plte);

  // IDAT Chunk (Scanlines with 0x00 filter byte per row)
  const rawScanlines = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width + 1);
    rawScanlines[rowOffset] = 0; // Filter 0: None
    for (let x = 0; x < width; x++) {
      rawScanlines[rowOffset + 1 + x] = pixelIndices[y * width + x] || 0;
    }
  }

  const compressedData = zlib.deflateSync(rawScanlines);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, plteChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcTarget, crcBuf]);
}

/**
 * Generates Procedural PNG Atlases into assets/atlases/
 */
function generateAtlases() {
  const outputDir = path.join(__dirname, '..', 'assets', 'atlases');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Generate Master Tiles Atlas (512x512 PNG Indexed)
  const tileW = 512;
  const tileH = 512;
  const tilePixels = new Uint8Array(tileW * tileH);
  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const localX = x % 16;
      const localY = y % 16;
      const tileType = (Math.floor(x / 16) + Math.floor(y / 16)) % 4;

      if (tileType === 0) {
        // Red Brick Wall with Staggered Mortar Lines & Dithering
        if (localY % 4 === 0 || (localY % 8 < 4 ? localX % 8 === 0 : (localX + 4) % 8 === 0)) {
          tilePixels[y * tileW + x] = 3; // Mortar Dark Slate (#22252E)
        } else {
          tilePixels[y * tileW + x] = (localX + localY) % 2 === 0 ? 17 : 18; // Brick Crimson / Rust
        }
      } else if (tileType === 1) {
        // Sidewalk Concrete with Cracks & Texture
        if ((localX === 3 && localY > 6) || (localY === 11 && localX > 4)) {
          tilePixels[y * tileW + x] = 1; // Crack Shadow (#101116)
        } else {
          tilePixels[y * tileW + x] = (localX % 4 === 0 && localY % 4 === 0) ? 5 : 6; // Concrete Light/Mid
        }
      } else if (tileType === 2) {
        // Bodega Window & Sodium Lamp Glow
        if (localX >= 3 && localX <= 12 && localY >= 3 && localY <= 12) {
          tilePixels[y * tileW + x] = 24; // Amber Sodium Glow (#FFC475)
        } else {
          tilePixels[y * tileW + x] = 2; // Dark Slate Frame
        }
      } else {
        // Road Asphalt & Yellow Marking
        if (localY >= 7 && localY <= 9 && (localX >= 2 && localX <= 13)) {
          tilePixels[y * tileW + x] = 30; // High-Vis Yellow (#FFCD68)
        } else {
          tilePixels[y * tileW + x] = (localX + localY) % 3 === 0 ? 1 : 2; // Asphalt Grain
        }
      }
    }
  }
  const tileBuf = createIndexedPNG(tileW, tileH, tilePixels, PALETTE_RGB);
  fs.writeFileSync(path.join(outputDir, 'master_tiles_atlas.png'), tileBuf);
  console.log(`Generated master_tiles_atlas.png (${tileBuf.length} bytes)`);

  // 2. Generate Character Sprites Atlas (512x512 PNG Indexed)
  const charW = 512;
  const charH = 512;
  const charPixels = new Uint8Array(charW * charH);
  for (let y = 0; y < charH; y++) {
    for (let x = 0; x < charW; x++) {
      const cx = x % 32;
      const cy = y % 32;
      
      // Detailed 32x32 Character Pixel Art (Locs, Durag, Hoodie, Gold Chain, Crisp Sneakers)
      if (cy >= 4 && cy <= 7 && cx >= 10 && cx <= 21) {
        charPixels[y * charW + x] = 61; // Locs / Hair Texture (#1A0F0D)
      } else if (cy >= 8 && cy <= 13 && cx >= 12 && cx <= 19) {
        charPixels[y * charW + x] = 53; // Melanin Skin Tone (#704028)
      } else if (cy === 14 && cx >= 15 && cx <= 16) {
        charPixels[y * charW + x] = 29; // Pure Gold Chain (#F0AB43)
      } else if (cy >= 15 && cy <= 24 && cx >= 10 && cx <= 21) {
        charPixels[y * charW + x] = 20; // Streetwear Hoodie (#366BA6)
      } else if (cy >= 25 && cy <= 29 && cx >= 11 && cx <= 20) {
        charPixels[y * charW + x] = 35; // Fitted Pants (#2B313D)
      } else if (cy >= 29 && cy <= 31 && ((cx >= 9 && cx <= 14) || (cx >= 17 && cx <= 22))) {
        charPixels[y * charW + x] = 15; // Crisp White Sneaker (#F2F4F7)
      } else {
        charPixels[y * charW + x] = 0; // Transparent Void
      }
    }
  }
  const charBuf = createIndexedPNG(charW, charH, charPixels, PALETTE_RGB);
  fs.writeFileSync(path.join(outputDir, 'characters_atlas.png'), charBuf);
  console.log(`Generated characters_atlas.png (${charBuf.length} bytes)`);

  // 3. Generate Cards Atlas (512x512 PNG Indexed)
  const cardW = 512;
  const cardH = 512;
  const cardPixels = new Uint8Array(cardW * cardH);
  for (let y = 0; y < cardH; y++) {
    for (let x = 0; x < cardW; x++) {
      const rx = x % 160;
      const ry = y % 240;
      if (rx < 4 || rx > 156 || ry < 4 || ry > 236) {
        cardPixels[y * cardW + x] = 29; // Gold Border Frame (#F0AB43)
      } else if (ry < 40) {
        cardPixels[y * cardW + x] = 17; // Category Header Crimson
      } else {
        cardPixels[y * cardW + x] = (rx + ry) % 2 === 0 ? 0 : 1; // Rich Dithered Card Body
      }
    }
  }
  const cardBuf = createIndexedPNG(cardW, cardH, cardPixels, PALETTE_RGB);
  fs.writeFileSync(path.join(outputDir, 'cards_atlas.png'), cardBuf);
  console.log(`Generated cards_atlas.png (${cardBuf.length} bytes)`);
}

if (require.main === module) {
  generateAtlases();
}

module.exports = {
  createIndexedPNG,
  generateAtlases
};
