/**
 * Concrete Kings: The Block Chronicles
 * Card Visual System & 4-Frame Shimmer Renderer
 * Version: 1.0.0
 */

const CARD_PALETTE_64 = (typeof window !== 'undefined' && window.MASTER_PALETTE_64)
  ? window.MASTER_PALETTE_64
  : ((typeof require !== 'undefined') ? require('./pixel-engine.js').MASTER_PALETTE_64 : {});

const CARD_TYPES = {
  BLACK: 'BLACK',
  WHITE: 'WHITE'
};

const CARD_CATEGORIES = {
  // Black Card Categories
  BLOCK_LOYALTY: {
    id: 'BLOCK_LOYALTY',
    type: CARD_TYPES.BLACK,
    name: 'Block Loyalty',
    primaryColor: '#7a1d1c', // Brick Red
    accentColor: '#ffc475',  // Streetlamp Gold
    darkBg: '#08080a',
    description: 'Stoops, block parties, and neighborhood bonds.'
  },
  STREET_COMMERCE: {
    id: 'STREET_COMMERCE',
    type: CARD_TYPES.BLACK,
    name: 'Street Commerce',
    primaryColor: '#c9822b', // Raw Brass
    accentColor: '#ffe299',  // Warm Glow
    darkBg: '#101116',
    description: 'Barber shops, sneaker drops, food trucks, and corner hustles.'
  },
  URBAN_WISDOM: {
    id: 'URBAN_WISDOM',
    type: CARD_TYPES.BLACK,
    name: 'Urban Wisdom',
    primaryColor: '#6e3e14', // Aged Timber
    accentColor: '#ffcd68',  // Canary Yellow
    darkBg: '#181920',
    description: 'Park chess tables, late night porch wisdom, and vinyl crates.'
  },
  UNDERGROUND_POWER: {
    id: 'UNDERGROUND_POWER',
    type: CARD_TYPES.BLACK,
    name: 'Underground Power',
    primaryColor: '#521c6e', // Neon Violet
    accentColor: '#6fe8d8',  // Electric Mint
    darkBg: '#0a1526',
    description: 'Rooftop night skylines and basement music studios.'
  },

  // White Card Categories
  SYSTEMIC_PRESSURE: {
    id: 'SYSTEMIC_PRESSURE',
    type: CARD_TYPES.WHITE,
    name: 'Systemic Pressure',
    primaryColor: '#366ba6', // Bodega Blue
    accentColor: '#5eaaff',  // Police Siren Blue
    darkBg: '#11233f',
    description: 'Courthouses, flashing sirens, and security lenses.'
  },
  GENTRIFICATION: {
    id: 'GENTRIFICATION',
    type: CARD_TYPES.WHITE,
    name: 'Gentrification',
    primaryColor: '#565e70', // Light Concrete
    accentColor: '#ff7a45',  // Sunset Blaze
    darkBg: '#22252e',
    description: 'Demolition cranes, luxury glass condos, and eviction notices.'
  },
  INSTITUTIONAL_TRAP: {
    id: 'INSTITUTIONAL_TRAP',
    type: CARD_TYPES.WHITE,
    name: 'Institutional Trap',
    primaryColor: '#2d313d', // Deep Slate
    accentColor: '#d9382e',  // Warning Crimson
    darkBg: '#101116',
    description: 'Precinct lobbies, bank loan rejections, and industrial locks.'
  },
  CORPORATE_GREED: {
    id: 'CORPORATE_GREED',
    type: CARD_TYPES.WHITE,
    name: 'Corporate Greed',
    primaryColor: '#1c375c', // Shadow Teal
    accentColor: '#f0ab43',  // Pure Gold
    darkBg: '#08080a',
    description: 'Skyscraper reflections, boardrooms, and armored trucks.'
  }
};

/**
 * Categorizes a card text string into one of the 8 narrative categories based on keywords.
 */
function classifyCardCategory(cardText, cardType = CARD_TYPES.WHITE) {
  const text = (cardText || '').toLowerCase();

  if (cardType === CARD_TYPES.BLACK) {
    if (text.includes('club') || text.includes('studio') || text.includes('legend') || text.includes('secret')) {
      return CARD_CATEGORIES.UNDERGROUND_POWER;
    }
    if (text.includes('barber') || text.includes('ghetto') || text.includes('food') || text.includes('mix')) {
      return CARD_CATEGORIES.STREET_COMMERCE;
    }
    if (text.includes('neighbor') || text.includes('porch') || text.includes('wisdom') || text.includes('cookout')) {
      return CARD_CATEGORIES.URBAN_WISDOM;
    }
    return CARD_CATEGORIES.BLOCK_LOYALTY;
  } else {
    if (text.includes('cop') || text.includes('ticket') || text.includes('bolt') || text.includes('siren') || text.includes('felony')) {
      return CARD_CATEGORIES.SYSTEMIC_PRESSURE;
    }
    if (text.includes('condo') || text.includes('crane') || text.includes('eviction') || text.includes('promoter')) {
      return CARD_CATEGORIES.GENTRIFICATION;
    }
    if (text.includes('bank') || text.includes('money') || text.includes('designer') || text.includes('apple pay')) {
      return CARD_CATEGORIES.CORPORATE_GREED;
    }
    return CARD_CATEGORIES.INSTITUTIONAL_TRAP;
  }
}

const textWrapCache = new Map();

function wrapCardText(ctx, text, maxWidth) {
  const cacheKey = (text || '') + '|' + maxWidth;
  if (textWrapCache.has(cacheKey)) {
    return textWrapCache.get(cacheKey);
  }

  const words = (text || '').split(' ');
  const lines = [];
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  textWrapCache.set(cacheKey, lines);
  return lines;
}

/**
 * Pixel Card Renderer Engine
 */
class CardVisualRenderer {
  constructor(options = {}) {
    this.width = options.width || 160;
    this.height = options.height || 240;
    this.shimmerFrame = 0; // 4-frame budget (0, 1, 2, 3)
  }

  advanceShimmerFrame() {
    this.shimmerFrame = (this.shimmerFrame + 1) % 4;
    return this.shimmerFrame;
  }

  /**
   * Render card onto a native 160x240 canvas context
   */
  renderCard(ctx, text, category, isSelected = false) {
    const w = this.width;
    const h = this.height;

    // Clear background
    ctx.fillStyle = category.darkBg;
    ctx.fillRect(0, 0, w, h);

    // 1. Render Procedural Pixel Backdrop (Upper 160x120 Area)
    this.renderPixelBackdrop(ctx, category);

    // 2. Render Card Frame Border (Brick / Gold Foil)
    this.renderCardFrame(ctx, category, isSelected);

    // 3. Render Card Header Badge
    this.renderCategoryBadge(ctx, category);

    // 4. Render Card Text Block (Lower 160x120 Area)
    this.renderCardText(ctx, text, category);

    // 5. Render 4-Frame Gold Shimmer Sweep (A-08 Keyframe)
    if (isSelected || category.type === CARD_TYPES.BLACK) {
      this.renderShimmerSweep(ctx);
    }
  }

  renderPixelBackdrop(ctx, category) {
    const w = this.width;
    const artHeight = 110;

    ctx.save();
    ctx.beginPath();
    ctx.rect(6, 6, w - 12, artHeight);
    ctx.clip();

    // Sky / Base
    ctx.fillStyle = category.darkBg;
    ctx.fillRect(0, 0, w, artHeight);

    // Category-specific procedural pixel art silhouette
    if (category.id === CARD_CATEGORIES.BLOCK_LOYALTY) {
      // Stoop under sodium lamp
      ctx.fillStyle = '#11233f'; ctx.fillRect(0, 0, w, 50);
      ctx.fillStyle = '#7a1d1c'; ctx.fillRect(20, 30, 120, 80); // Red brick facade
      ctx.fillStyle = '#ffc475'; ctx.fillRect(80, 20, 4, 4); // Streetlamp bulb
      ctx.fillStyle = '#ffe299'; ctx.fillRect(35, 45, 20, 24); ctx.fillRect(105, 45, 20, 24); // Lit windows
    } else if (category.id === CARD_CATEGORIES.STREET_COMMERCE) {
      // Barber shop interior
      ctx.fillStyle = '#22252e'; ctx.fillRect(0, 0, w, artHeight);
      ctx.fillStyle = '#c9822b'; ctx.fillRect(10, 20, 140, 4); // Brass pole trim
      ctx.fillStyle = '#d9382e'; ctx.fillRect(15, 24, 6, 40); // Barber pole stripe
      ctx.fillStyle = '#f4f7ff'; ctx.fillRect(21, 24, 6, 40);
      ctx.fillStyle = '#366ba6'; ctx.fillRect(27, 24, 6, 40);
      ctx.fillStyle = '#3b1c11'; ctx.fillRect(60, 50, 40, 50); // Barber chair back
    } else if (category.id === CARD_CATEGORIES.UNDERGROUND_POWER) {
      // Rooftop skyline
      ctx.fillStyle = '#0a1526'; ctx.fillRect(0, 0, w, 40);
      ctx.fillStyle = '#2a1138'; ctx.fillRect(15, 20, 30, 90); ctx.fillRect(65, 10, 40, 100); ctx.fillRect(120, 25, 30, 85);
      ctx.fillStyle = '#6fe8d8'; ctx.fillRect(75, 15, 4, 4); ctx.fillRect(85, 35, 4, 4); // Neon glow windows
    } else if (category.id === CARD_CATEGORIES.SYSTEMIC_PRESSURE) {
      // Sirens & Courthouse pillars
      ctx.fillStyle = '#11233f'; ctx.fillRect(0, 0, w, artHeight);
      ctx.fillStyle = '#788196'; ctx.fillRect(20, 20, 12, 90); ctx.fillRect(50, 20, 12, 90); ctx.fillRect(90, 20, 12, 90); ctx.fillRect(120, 20, 12, 90);
      ctx.fillStyle = '#5eaaff'; ctx.fillRect(0, 80, w, 30); // Siren blue flash overlay
    } else {
      // Default Brick / Concrete cityscape
      ctx.fillStyle = category.primaryColor;
      ctx.fillRect(10, 25, 140, 85);
      ctx.fillStyle = category.accentColor;
      ctx.fillRect(30, 40, 24, 30); ctx.fillRect(106, 40, 24, 30);
    }

    ctx.restore();
  }

  renderCardFrame(ctx, category, isSelected) {
    const w = this.width;
    const h = this.height;

    let equippedBack = 'classic';
    if (typeof window !== 'undefined' && window.localStorage) {
      equippedBack = localStorage.getItem('ck-equipped-cardback') || 'classic';
    }

    // Outer border
    ctx.lineWidth = 4;
    if (equippedBack === 'gold') {
      ctx.strokeStyle = '#f0ab43';
    } else if (equippedBack === 'neon') {
      ctx.strokeStyle = '#6fe8d8';
    } else if (equippedBack === 'graffiti') {
      ctx.strokeStyle = '#ff7a45';
    } else if (equippedBack === 'spades') {
      ctx.strokeStyle = '#10b981';
    } else {
      ctx.strokeStyle = isSelected ? '#f0ab43' : category.primaryColor;
    }
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Inner frame dividing line
    ctx.strokeStyle = (equippedBack === 'gold') ? '#ffe299' : '#393e4d';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.beginPath();
    ctx.moveTo(6, 120);
    ctx.lineTo(w - 6, 120);
    ctx.stroke();

    // Corner highlights for premium card backs
    if (equippedBack === 'gold') {
      ctx.fillStyle = '#ffe299';
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(w - 7, 4, 3, 3);
      ctx.fillRect(4, h - 7, 3, 3);
      ctx.fillRect(w - 7, h - 7, 3, 3);
    } else if (equippedBack === 'spades') {
      ctx.fillStyle = '#10b981';
      ctx.font = '8px monospace';
      ctx.fillText('♠', 10, 15);
      ctx.fillText('♠', w - 15, 15);
    }
  }

  renderCategoryBadge(ctx, category) {
    ctx.fillStyle = category.primaryColor;
    ctx.fillRect(12, 124, this.width - 24, 16);

    ctx.fillStyle = '#f4f7ff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(category.name.toUpperCase(), this.width / 2, 136);
  }

  renderCardText(ctx, text, category) {
    // Background fill for lower text area
    ctx.fillStyle = category.type === CARD_TYPES.BLACK ? '#101116' : '#fff7e6';
    ctx.fillRect(8, 142, this.width - 16, this.height - 150);

    ctx.fillStyle = category.type === CARD_TYPES.BLACK ? '#f4f7ff' : '#101116';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';

    const maxWidth = this.width - 24;
    const lines = wrapCardText(ctx, text, maxWidth);

    let y = 162;
    lines.forEach(line => {
      ctx.fillText(line, this.width / 2, y);
      y += 14;
    });
  }

  /**
   * 4-Frame Gold Shimmer Diagonal Ray Sweep (Anim ID: A-08)
   */
  renderShimmerSweep(ctx) {
    const frame = this.shimmerFrame; // 0, 1, 2, 3
    const sweepOffsets = [-40, 20, 80, 140];
    const xOffset = sweepOffsets[frame];

    ctx.save();
    ctx.beginPath();
    ctx.rect(6, 6, this.width - 12, this.height - 12);
    ctx.clip();

    ctx.fillStyle = 'rgba(255, 205, 104, 0.25)'; // Gold highlight
    ctx.beginPath();
    ctx.moveTo(xOffset, 0);
    ctx.lineTo(xOffset + 24, 0);
    ctx.lineTo(xOffset + 74, this.height);
    ctx.lineTo(xOffset + 50, this.height);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CARD_TYPES,
    CARD_CATEGORIES,
    classifyCardCategory,
    CardVisualRenderer
  };
}

if (typeof window !== 'undefined') {
  window.CARD_TYPES = CARD_TYPES;
  window.CARD_CATEGORIES = CARD_CATEGORIES;
  window.classifyCardCategory = classifyCardCategory;
  window.CardVisualRenderer = CardVisualRenderer;
}
