const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { DISTRICTS } = require('./src/pixel_engine/topdown-city-data.js');

const TILESETS = {
  harlem: ['2,0', '2,1', '2,2'],
  detroit: ['2,0', '2,1', '2,2', '2,3'],
  nola: ['2,2', '2,3'],
  miami: ['0,3', '2,2', '2,3'],
  chicago: ['2,0', '2,2', '2,3'],
  oakland: ['2,2', '2,3'],
  baltimore: ['2,0', '2,2', '2,3'],
  atlanta: ['2,2', '2,3']
};

const LABELLED_ATLASES = ['miami', 'atlanta'];

function getLuminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

// Convert HSL back to RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

async function sliceDistrict(browser, district, cells) {
  const rawPath = `C:/Users/thecr/concrete-kings/assets/${district}_tileset_raw.jpg`;
  if (!fs.existsSync(rawPath)) {
    console.log(`Skipping ${district}: raw file not found`);
    return;
  }

  const d = DISTRICTS[district.toUpperCase()];
  if (!d) {
    console.log(`Skipping ${district}: not a known district`);
    return;
  }

  const walkHex = d.palette.walk;
  const walkRgb = hexToRgb(walkHex);
  const targetLum = getLuminance(walkRgb.r, walkRgb.g, walkRgb.b);

  const page = await browser.newPage();
  try {
    const dataUrl = `data:image/jpeg;base64,${fs.readFileSync(rawPath).toString('base64')}`;

    const result = await page.evaluate(async ({ url, cellsList, isLabelled, targetL, walkR }) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const cellSide = 256;
          const stripCanvas = document.createElement('canvas');
          stripCanvas.width = cellsList.length * 32;
          stripCanvas.height = 32;
          const stripCtx = stripCanvas.getContext('2d');

          // Process each cell
          cellsList.forEach((cell, idx) => {
            const [row, col] = cell.split(',').map(Number);
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = 32;
            cropCanvas.height = 32;
            const cropCtx = cropCanvas.getContext('2d');
            cropCtx.imageSmoothingEnabled = false;

            // Inset by 6px to drop borders, drop more from bottom if captioned
            const band = isLabelled ? 46 : 0;
            const side = cellSide - 12 - band;
            const sx = col * cellSide + 6;
            const sy = row * cellSide + 6;

            cropCtx.drawImage(img, sx, sy, side, side, 0, 0, 32, 32);

            const imgData = cropCtx.getImageData(0, 0, 32, 32);
            const data = imgData.data;

            // Measure corner pixel luminance (at x=1, y=1)
            const cornerIdx = (1 * 32 + 1) * 4;
            const cornerR = data[cornerIdx];
            const cornerG = data[cornerIdx + 1];
            const cornerB = data[cornerIdx + 2];
            const cornerLum = 0.2126 * cornerR + 0.7152 * cornerG + 0.0722 * cornerB;

            if (cornerLum > 0) {
              let factor = targetL / cornerLum;
              if (factor < 0.3) factor = 0.3;
              if (factor > 2.0) factor = 2.0;

              // Process each pixel in the 32x32 tile
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];

                // 1. Modulate: adjust luminance and saturation
                const hsl = rgbToHsl(r, g, b);
                hsl.l = Math.min(1.0, hsl.l * factor);
                hsl.s = Math.min(1.0, hsl.s * 0.62);
                const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);

                // 2. Colorize: blend 20% walk color
                data[i]   = Math.round(rgb.r * 0.8 + walkR.r * 0.2);
                data[i+1] = Math.round(rgb.g * 0.8 + walkR.g * 0.2);
                data[i+2] = Math.round(rgb.b * 0.8 + walkR.b * 0.2);
              }
              cropCtx.putImageData(imgData, 0, 0);
            }

            // Draw to the final strip
            stripCtx.drawImage(cropCanvas, idx * 32, 0);
          });

          resolve(stripCanvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
      });
      
      // HSL conversions inside evaluate context
      function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
          h = s = 0;
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return { h, s, l };
      }
      function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
          r = g = b = l;
        } else {
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
      }
    }, {
      url: dataUrl,
      cellsList: cells,
      isLabelled: LABELLED_ATLASES.includes(district),
      targetL: targetLum,
      walkR: walkRgb
    });

    const base64Data = result.replace(/^data:image\/png;base64,/, '');
    const outDir = 'C:/Users/thecr/concrete-kings/assets/sprite_packs';
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outDir, `city_${district}_tiles.png`), Buffer.from(base64Data, 'base64'));
    console.log(`Processed ${district}: sliced and toned to ${walkHex}.`);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const [district, cells] of Object.entries(TILESETS)) {
      await sliceDistrict(browser, district, cells);
    }
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
