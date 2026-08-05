/**
 * Concrete Kings: The Block Chronicles
 * Interactive Block Map Navigation & Walkable Character System
 * Version: 1.0.0
 */

const CHARACTER_ORIGINS = {
  BARBER: {
    id: 'BARBER',
    name: 'Master Barber',
    hairColor: '#3d2218',  // Hair Charcoal (#3D2218)
    skinColor: '#26120b',  // Rich Ebony (#26120B)
    outfitColor: '#d9382e',// Street Flame Hoodie (#D9382E)
    apronColor: '#f4f7ff', // Crisp White Apron
    pantsColor: '#274f80'  // Slate Denim (#274F80)
  },
  STREET_SCHOLAR: {
    id: 'STREET_SCHOLAR',
    name: 'Street Scholar',
    hairColor: '#140a07',
    skinColor: '#522717',  // Warm Umber
    outfitColor: '#393e4d',// Weathered Slate Hoodie
    apronColor: null,
    pantsColor: '#181920'  // Dark Charcoal
  },
  LOCAL_LEGEND: {
    id: 'LOCAL_LEGEND',
    name: 'Local Legend',
    hairColor: '#3d2218',
    skinColor: '#3b1c11',  // Dark Chocolate
    outfitColor: '#6b341d',// Leather Bomber (#6B341D)
    apronColor: null,
    pantsColor: '#101116'
  },
  CORNER_MERCHANT: {
    id: 'CORNER_MERCHANT',
    name: 'Corner Merchant',
    hairColor: '#26120b',
    skinColor: '#be6436',  // Honey Amber
    outfitColor: '#9c5c1d',// Utility Vest (#9C5C1D)
    apronColor: null,
    pantsColor: '#474d5e'
  },
  COMMUNITY_ORGANIZER: {
    id: 'COMMUNITY_ORGANIZER',
    name: 'Community Organizer',
    hairColor: '#140a07',
    skinColor: '#854224',  // Warm Mahogany
    outfitColor: '#366ba6',// Denim Jacket (#366BA6)
    apronColor: null,
    pantsColor: '#22252e'
  },
  UNDERGROUND_DJ: {
    id: 'UNDERGROUND_DJ',
    name: 'Underground DJ',
    hairColor: '#3d2218',
    skinColor: '#a1522c',  // Golden Bronze
    outfitColor: '#521c6e',// Varsity Violet (#521C6E)
    apronColor: null,
    pantsColor: '#101116'
  },
  BLOCK_ARCHITECT: {
    id: 'BLOCK_ARCHITECT',
    name: 'Block Architect',
    hairColor: '#140a07',
    skinColor: '#3b1c11',
    outfitColor: '#ffcd68',// High-Vis Gold (#FFCD68)
    apronColor: null,
    pantsColor: '#274f80'
  },
  HUSTLE_VETERAN: {
    id: 'HUSTLE_VETERAN',
    name: 'Hustle Veteran',
    hairColor: '#3d2218',
    skinColor: '#d97843',  // Warm Copper
    outfitColor: '#174540',// Forest Green Tracksuit (#174540)
    apronColor: null,
    pantsColor: '#174540'
  }
};

class BlockMapController {
  constructor(options = {}) {
    this.width = options.width || 320;
    this.height = options.height || 180;

    // Player State
    this.x = options.startX || 150;
    this.y = options.startY || 124;
    this.speed = 2; // Pixels per tick
    this.facing = 'RIGHT'; // LEFT, RIGHT
    this.isMoving = false;

    // Character Origin
    this.origin = options.origin || CHARACTER_ORIGINS.BARBER;

    // Animation budget (4 frames max: 0, 1, 2, 3)
    this.animFrame = 0;
    this.animTick = 0;

    // Hotspot trigger definitions
    this.hotspots = [
      { id: 'BARBER_SHOP', name: 'Barber Shop Stoop', x: 80, y: 124, width: 24, prompt: 'Press Enter to get a lineup' },
      { id: 'BODEGA', name: 'Corner Bodega', x: 160, y: 124, width: 32, prompt: 'Press Enter to enter Bodega' },
      { id: 'CHESS_PARK', name: 'Park Chess Tables', x: 240, y: 124, width: 24, prompt: 'Press Enter to play chess' }
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

    // Apply movement with bounds checking (Sidewalk bounds y: 118..142)
    const nextX = Math.max(10, Math.min(this.width - 40, this.x + dx));
    const nextY = Math.max(118, Math.min(142, this.y + dy));

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
   * Render 32x32 Walkable Character & Hotspots onto 320x180 Canvas
   */
  render(ctx) {
    // 1. Render Hotspot Indicators
    this.hotspots.forEach(spot => {
      const isNear = (this.activeHotspot === spot);
      ctx.fillStyle = isNear ? '#f0ab43' : '#474d5e';
      ctx.fillRect(spot.x, spot.y + 12, 16, 2);

      if (isNear) {
        // Render 4-frame pulse icon over active hotspot
        ctx.fillStyle = '#ffc475';
        ctx.fillRect(spot.x + 6, spot.y - 12 - (this.animFrame % 2), 4, 4);
      }
    });

    // 2. Render Player Character (32x32 bounding box)
    const frame = this.animFrame;
    const px = Math.floor(this.x);
    const py = Math.floor(this.y);

    // Anim A-06 Breathing Idle vs Anim A-07 Walk Step
    const yBob = this.isMoving ? (frame % 2) * 2 : (frame === 1 ? 1 : 0);
    const legOffset = this.isMoving ? (frame === 1 ? 2 : (frame === 3 ? -2 : 0)) : 0;

    // Head & Hair
    ctx.fillStyle = this.origin.skinColor;
    ctx.fillRect(px + 12, py - 18 + yBob, 8, 8); // Head

    ctx.fillStyle = this.origin.hairColor;
    ctx.fillRect(px + 10, py - 20 + yBob, 12, 4); // Hair / Locs / Afro

    // Gold rope chain accent
    ctx.fillStyle = '#f0ab43';
    ctx.fillRect(px + 15, py - 9 + yBob, 2, 2);

    // Jacket / Hoodie
    ctx.fillStyle = this.origin.outfitColor;
    ctx.fillRect(px + 10, py - 10 + yBob, 12, 10);

    // Apron (Barber specific)
    if (this.origin.apronColor) {
      ctx.fillStyle = this.origin.apronColor;
      ctx.fillRect(px + 12, py - 9 + yBob, 8, 9);
    }

    // Pants / Legs
    ctx.fillStyle = this.origin.pantsColor;
    ctx.fillRect(px + 11 + legOffset, py, 4, 10);
    ctx.fillRect(px + 17 - legOffset, py, 4, 10);

    // Fresh White Sneakers
    ctx.fillStyle = '#f4f7ff';
    ctx.fillRect(px + 9 + legOffset, py + 10, 6, 3);
    ctx.fillRect(px + 17 - legOffset, py + 10, 6, 3);

    // 3. Render Active Hotspot Banner Prompt
    if (this.activeHotspot) {
      ctx.fillStyle = 'rgba(8, 8, 10, 0.85)';
      ctx.fillRect(40, 160, 240, 16);

      ctx.fillStyle = '#ffc475';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.activeHotspot.prompt.toUpperCase(), 160, 171);
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
