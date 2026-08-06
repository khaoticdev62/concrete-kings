/**
 * Concrete Kings: The Block Chronicles
 * Interactive Block Map Navigation & Walkable Character System
 * Version: 1.1.0
 */

const CHARACTER_ORIGINS = {
  BARBER: {
    id: 'BARBER',
    name: 'Master Barber',
    hairColor: '#3d2218',  // Hair Charcoal (#3D2218)
    skinColor: '#26120b',  // Rich Ebony (#26120B)
    outfitColor: '#d9382e',// Street Flame Hoodie (#D9382E)
    apronColor: '#f4f7ff', // Crisp White Apron
    pantsColor: '#274f80', // Slate Denim (#274F80)
    flavor: "Everybody's business runs through your chair. You hear it first, you know it best.",
    startingStats: { streetCred: 0, reputation: 2 }
  },
  STREET_SCHOLAR: {
    id: 'STREET_SCHOLAR',
    name: 'Street Scholar',
    hairColor: '#140a07',
    skinColor: '#522717',  // Warm Umber
    outfitColor: '#393e4d',// Weathered Slate Hoodie
    apronColor: null,
    pantsColor: '#181920', // Dark Charcoal
    flavor: "Books over corners, but you still know every angle the block's got.",
    startingStats: { streetCred: 1, reputation: 0 }
  },
  LOCAL_LEGEND: {
    id: 'LOCAL_LEGEND',
    name: 'Local Legend',
    hairColor: '#3d2218',
    skinColor: '#3b1c11',  // Dark Chocolate
    outfitColor: '#6b341d',// Leather Bomber (#6B341D)
    apronColor: null,
    pantsColor: '#101116',
    flavor: "They wrote songs about you. Reputation walks in the room before you do.",
    startingStats: { streetCred: 0, reputation: 2 }
  },
  CORNER_MERCHANT: {
    id: 'CORNER_MERCHANT',
    name: 'Corner Merchant',
    hairColor: '#26120b',
    skinColor: '#be6436',  // Honey Amber
    outfitColor: '#9c5c1d',// Utility Vest (#9C5C1D)
    apronColor: null,
    pantsColor: '#474d5e',
    flavor: "Bodega counter's your throne. You see everything, you say nothing — for now.",
    startingStats: { streetCred: 2, reputation: 0 }
  },
  COMMUNITY_ORGANIZER: {
    id: 'COMMUNITY_ORGANIZER',
    name: 'Community Organizer',
    hairColor: '#140a07',
    skinColor: '#854224',  // Warm Mahogany
    outfitColor: '#366ba6',// Denim Jacket (#366BA6)
    apronColor: null,
    pantsColor: '#22252e',
    flavor: "You rally the block before the block even knows it needs rallying.",
    startingStats: { streetCred: 0, reputation: 2 }
  },
  UNDERGROUND_DJ: {
    id: 'UNDERGROUND_DJ',
    name: 'Underground DJ',
    hairColor: '#3d2218',
    skinColor: '#a1522c',  // Golden Bronze
    outfitColor: '#521c6e',// Varsity Violet (#521C6E)
    apronColor: null,
    pantsColor: '#101116',
    flavor: "You keep the party alive till sunrise. Nobody forgets who kept it moving.",
    startingStats: { streetCred: 1, reputation: 1 }
  },
  BLOCK_ARCHITECT: {
    id: 'BLOCK_ARCHITECT',
    name: 'Block Architect',
    hairColor: '#140a07',
    skinColor: '#3b1c11',
    outfitColor: '#ffcd68',// High-Vis Gold (#FFCD68)
    apronColor: null,
    pantsColor: '#274f80',
    flavor: "Still earning your stripes — building trust takes longer than building blueprints.",
    startingStats: { streetCred: 1, reputation: -1 }
  },
  HUSTLE_VETERAN: {
    id: 'HUSTLE_VETERAN',
    name: 'Hustle Veteran',
    hairColor: '#3d2218',
    skinColor: '#d97843',  // Warm Copper
    outfitColor: '#174540',// Forest Green Tracksuit (#174540)
    apronColor: null,
    pantsColor: '#174540',
    flavor: "Old scars, older respect. You've been out here longer than most been alive.",
    startingStats: { streetCred: 2, reputation: 1 }
  }
};

let drawHighDetailCharacterSpriteFn;
if (typeof window !== 'undefined' && window.drawHighDetailCharacterSprite) {
  drawHighDetailCharacterSpriteFn = window.drawHighDetailCharacterSprite;
} else if (typeof require !== 'undefined') {
  try {
    drawHighDetailCharacterSpriteFn = require('./pixel-engine.js').drawHighDetailCharacterSprite;
  } catch (e) {
    drawHighDetailCharacterSpriteFn = () => {};
  }
} else {
  drawHighDetailCharacterSpriteFn = () => {};
}

class BlockMapController {
  constructor(options = {}) {
    this.width = options.width || 1280;
    this.height = options.height || 720;

    // Player State
    this.x = options.startX || 600;
    this.y = options.startY || 550;
    this.speed = 4; // Pixels per tick
    this.facing = 'RIGHT'; // LEFT, RIGHT
    this.isMoving = false;

    // Character Origin
    this.origin = options.origin || CHARACTER_ORIGINS.BARBER;

    // Animation budget (4 frames max: 0, 1, 2, 3)
    this.animFrame = 0;
    this.animTick = 0;

    // Hotspot trigger definitions
    this.hotspots = [
      { id: 'BARBER_SHOP', name: 'Barber Shop Stoop', x: 300, y: 550, width: 90, prompt: 'Press Enter to get a lineup' },
      { id: 'BODEGA', name: 'Corner Bodega', x: 600, y: 550, width: 120, prompt: 'Press Enter to enter Bodega' },
      { id: 'CHESS_PARK', name: 'Park Chess Tables', x: 900, y: 550, width: 90, prompt: 'Press Enter to play chess' }
    ];

    this.activeHotspot = null;
    this.keys = {};

    this.setupInputListeners();
  }

  setOrigin(originKey) {
    if (CHARACTER_ORIGINS[originKey]) {
      this.origin = CHARACTER_ORIGINS[originKey];
    }
  }

  setupInputListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update() {
    let dx = 0;
    let dy = 0;

    if (this.keys['arrowleft'] || this.keys['a']) {
      dx -= this.speed;
      this.facing = 'LEFT';
    }
    if (this.keys['arrowright'] || this.keys['d']) {
      dx += this.speed;
      this.facing = 'RIGHT';
    }
    if (this.keys['arrowup'] || this.keys['w']) {
      dy -= this.speed;
    }
    if (this.keys['arrowdown'] || this.keys['s']) {
      dy += this.speed;
    }

    this.isMoving = (dx !== 0 || dy !== 0);

    // Apply movement with bounds checking
    const nextX = Math.max(10, Math.min(this.width - 150, this.x + dx));
    const nextY = Math.max(150, Math.min(this.height - 180, this.y + dy));

    this.x = nextX;
    this.y = nextY;

    // Advance 4-frame animation loop
    this.animTick++;
    if (this.animTick % 10 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Check hotspot proximity
    this.checkHotspots();
  }

  checkHotspots() {
    this.activeHotspot = null;
    for (const spot of this.hotspots) {
      if (Math.abs(this.x - spot.x) < spot.width) {
        this.activeHotspot = spot;
        break;
      }
    }
  }

  /**
   * Render 128x128 Walkable Character & Hotspots onto 1280x720 Canvas
   */
  render(ctx) {
    // 1. Render Hotspot Indicators
    this.hotspots.forEach(spot => {
      const isNear = (this.activeHotspot === spot);
      ctx.fillStyle = isNear ? '#f0ab43' : '#474d5e';
      ctx.fillRect(spot.x, spot.y + 45, 60, 8);

      if (isNear) {
        // Render 4-frame pulse icon over active hotspot
        ctx.fillStyle = '#ffc475';
        ctx.fillRect(spot.x + 20, spot.y - 45 - (this.animFrame % 2) * 4, 16, 16);
      }
    });

    // 2. Render Player Character (128x128 bounding box) using 64-bit high detail sprite
    const frame = this.animFrame;
    const px = Math.floor(this.x);
    const py = Math.floor(this.y);
    drawHighDetailCharacterSpriteFn(ctx, this.origin, px, py, frame, true, this.isMoving);

    // 3. Render Active Hotspot Banner Prompt
    if (this.activeHotspot) {
      ctx.fillStyle = 'rgba(8, 8, 10, 0.85)';
      ctx.fillRect(160, 580, 960, 64);

      ctx.fillStyle = '#ffc475';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.activeHotspot.prompt.toUpperCase(), 640, 620);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CHARACTER_ORIGINS,
    BlockMapController
  };
}

if (typeof window !== 'undefined') {
  window.CHARACTER_ORIGINS = CHARACTER_ORIGINS;
  window.BlockMapController = BlockMapController;
}
