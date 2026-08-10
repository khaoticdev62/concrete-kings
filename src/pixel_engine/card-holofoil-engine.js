/**
 * Concrete Kings: The Block Chronicles
 * Card Rarity Reactive Holofoil & HUD Theme Engine
 *
 * Renders reactive metallic, silver foil, gold foil, and holo-flame animated canvas/CSS effects
 * based on card rarity, and manages customizable AAVE HUD frames.
 */

const HOLOFOIL_RARITY_STYLES = {
  COMMON: {
    name: 'MATTE_STREET',
    label: 'Matte Street',
    borderColor: '#474d5e',
    glowStyle: 'none',
    hasShimmer: false,
    particles: false
  },
  RARE: {
    name: 'SILVER_FOIL',
    label: 'Silver Foil',
    borderColor: '#d1d5db',
    glowStyle: '0 0 12px rgba(209, 213, 219, 0.8)',
    hasShimmer: true,
    shimmerPeriodMs: 2500,
    particles: false
  },
  EPIC: {
    name: 'GOLD_FOIL',
    label: 'Gold Foil',
    borderColor: '#fbbf24',
    glowStyle: '0 0 16px rgba(251, 191, 36, 0.9), 0 0 25px rgba(245, 158, 11, 0.5)',
    hasShimmer: true,
    shimmerPeriodMs: 1800,
    particles: false
  },
  LEGENDARY: {
    name: 'HOLO_FLAME',
    label: 'Holo Flame',
    borderColor: '#ec4899',
    glowStyle: '0 0 20px #ec4899, 0 0 35px #06b6d4, 0 0 50px #8b5cf6',
    hasShimmer: true,
    shimmerPeriodMs: 1200,
    particles: true
  }
};

const HUD_FRAME_PRESETS = {
  STANDARD_STREET: {
    id: 'STANDARD_STREET',
    name: 'Standard Street',
    borderColor: '#383c4a',
    accentColor: '#fbbf24',
    bgTexture: 'rgba(16, 17, 22, 0.95)'
  },
  NEON_CITY: {
    id: 'NEON_CITY',
    name: 'Neon City',
    borderColor: '#06b6d4',
    accentColor: '#ec4899',
    bgTexture: 'rgba(8, 14, 26, 0.95)'
  },
  GOLD_CHAIN: {
    id: 'GOLD_CHAIN',
    name: 'Gold Chain',
    borderColor: '#fbbf24',
    accentColor: '#f59e0b',
    bgTexture: 'rgba(26, 20, 8, 0.95)'
  },
  GRAFFITI_SPRAY: {
    id: 'GRAFFITI_SPRAY',
    name: 'Graffiti Spray',
    borderColor: '#8b5cf6',
    accentColor: '#10b981',
    bgTexture: 'rgba(20, 10, 26, 0.95)'
  },
  CHROME_SPIKE: {
    id: 'CHROME_SPIKE',
    name: 'Chrome Spike',
    borderColor: '#9ca3af',
    accentColor: '#60a5fa',
    bgTexture: 'rgba(18, 20, 24, 0.95)'
  }
};

class CardHolofoilEngine {
  constructor(options = {}) {
    this.activeHudTheme = options.hudTheme || 'STANDARD_STREET';
  }

  getStyleForRarity(rarity) {
    const key = (rarity || 'COMMON').toUpperCase();
    return HOLOFOIL_RARITY_STYLES[key] || HOLOFOIL_RARITY_STYLES.COMMON;
  }

  getHudTheme(themeKey) {
    const key = (themeKey || this.activeHudTheme).toUpperCase();
    return HUD_FRAME_PRESETS[key] || HUD_FRAME_PRESETS.STANDARD_STREET;
  }

  setHudTheme(themeKey) {
    if (HUD_FRAME_PRESETS[themeKey]) {
      this.activeHudTheme = themeKey;
      return true;
    }
    return false;
  }

  renderCanvasHolofoil(ctx, width, height, rarity, timeMs = 0) {
    if (!ctx) return;
    const style = this.getStyleForRarity(rarity);

    if (!style.hasShimmer) return;

    ctx.save();
    const phase = (timeMs % style.shimmerPeriodMs) / style.shimmerPeriodMs;
    const shimmerX = phase * (width * 2) - width;

    let grad;
    if (style.name === 'SILVER_FOIL') {
      grad = ctx.createLinearGradient(shimmerX, 0, shimmerX + 40, height);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else if (style.name === 'GOLD_FOIL') {
      grad = ctx.createLinearGradient(shimmerX, 0, shimmerX + 50, height);
      grad.addColorStop(0, 'rgba(255, 215, 0, 0)');
      grad.addColorStop(0.5, 'rgba(255, 235, 120, 0.45)');
      grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    } else if (style.name === 'HOLO_FLAME') {
      grad = ctx.createLinearGradient(shimmerX, 0, shimmerX + 60, height);
      const hue1 = (timeMs / 10) % 360;
      const hue2 = (hue1 + 180) % 360;
      grad.addColorStop(0, `hsla(${hue1}, 100%, 65%, 0)`);
      grad.addColorStop(0.5, `hsla(${hue2}, 100%, 75%, 0.55)`);
      grad.addColorStop(1, `hsla(${hue1}, 100%, 65%, 0)`);
    }

    if (grad) {
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CardHolofoilEngine, HOLOFOIL_RARITY_STYLES, HUD_FRAME_PRESETS };
}
if (typeof window !== 'undefined') {
  window.CardHolofoilEngine = CardHolofoilEngine;
  window.HOLOFOIL_RARITY_STYLES = HOLOFOIL_RARITY_STYLES;
  window.HUD_FRAME_PRESETS = HUD_FRAME_PRESETS;
}
