/**
 * Concrete Kings: The Block Chronicles
 * Weather & Environmental Effects System (4-Frame Budget)
 * Version: 1.0.0
 */

const WEATHER_MODES = {
  CLEAR: 'CLEAR',
  RAIN: 'RAIN',
  STEAM_VENT: 'STEAM_VENT',
  POLICE_SIRENS: 'POLICE_SIRENS',
  NEON_FLICKER: 'NEON_FLICKER'
};

class WeatherEffectsSystem {
  constructor(nativeWidth = 320, nativeHeight = 180) {
    this.width = nativeWidth;
    this.height = nativeHeight;
    this.activeMode = WEATHER_MODES.RAIN;
    this.frameIndex = 0; // 4-frame budget: 0, 1, 2, 3

    // Particle pools
    this.rainDrops = [];
    this.steamPlumes = [];
    this.initParticles();
  }

  setMode(mode) {
    if (WEATHER_MODES[mode]) {
      this.activeMode = mode;
    }
  }

  initParticles() {
    // Seed 16 rain particles
    for (let i = 0; i < 16; i++) {
      this.rainDrops.push({
        x: (i * 20 + Math.floor(Math.random() * 10)) % this.width,
        y: Math.floor(Math.random() * this.height),
        length: 4 + (i % 3) * 2,
        speed: 4 + (i % 3)
      });
    }

    // Seed 3 steam vent plumes (e.g. sewer grates)
    this.steamPlumes = [
      { x: 45, y: 135 },
      { x: 160, y: 138 },
      { x: 260, y: 135 }
    ];
  }

  advanceFrame() {
    this.frameIndex = (this.frameIndex + 1) % 4;

    // Update rain positions
    this.rainDrops.forEach(drop => {
      drop.y += drop.speed;
      if (drop.y > 140) {
        drop.y = Math.floor(Math.random() * 20);
        drop.x = (drop.x + 35) % this.width;
      }
    });
  }

  /**
   * Render active weather effects on native 320x180 canvas
   */
  render(ctx) {
    if (this.activeMode === WEATHER_MODES.CLEAR) return;

    if (this.activeMode === WEATHER_MODES.RAIN || this.activeMode === WEATHER_MODES.STEAM_VENT) {
      this.renderRainAndRipples(ctx);
    }

    if (this.activeMode === WEATHER_MODES.STEAM_VENT || this.activeMode === WEATHER_MODES.RAIN) {
      this.renderSteamVentPlumes(ctx);
    }

    if (this.activeMode === WEATHER_MODES.POLICE_SIRENS) {
      this.renderPoliceSirensOverlay(ctx);
    }

    if (this.activeMode === WEATHER_MODES.NEON_FLICKER) {
      this.renderNeonFlicker(ctx);
    }
  }

  /**
   * Anim ID: A-09 - Rain Drops & Concentric Sidewalk Ripples (4-Frame Loop)
   */
  renderRainAndRipples(ctx) {
    ctx.fillStyle = 'rgba(133, 196, 255, 0.6)'; // Sky Cyan Glow (#85C4FF)

    // Draw falling sheet rain lines
    this.rainDrops.forEach(drop => {
      ctx.fillRect(drop.x, drop.y, 1, drop.length);
    });

    // Draw concentric 1px sidewalk ripples (A-09 Keyframes)
    const rippleRadius = (this.frameIndex % 4) + 1;
    ctx.strokeStyle = '#85c4ff';
    ctx.lineWidth = 1;

    [
      { x: 50, y: 130 },
      { x: 120, y: 135 },
      { x: 210, y: 128 },
      { x: 280, y: 132 }
    ].forEach(p => {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rippleRadius * 2, rippleRadius, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  /**
   * Anim ID: A-04 - Alley Steam Vent Plume (4-Frame Loop: Alpha Shifts 100% to 25%)
   */
  renderSteamVentPlumes(ctx) {
    const alphas = [0.8, 0.6, 0.4, 0.2];
    const currentAlpha = alphas[this.frameIndex];
    ctx.fillStyle = `rgba(226, 232, 247, ${currentAlpha})`; // Off-White Glow (#E2E8F7)

    this.steamPlumes.forEach(p => {
      const yOffset = this.frameIndex * 2;
      ctx.fillRect(p.x - 2, p.y - yOffset, 6, 4);
      ctx.fillRect(p.x - 4, p.y - 6 - yOffset, 10, 5);
      ctx.fillRect(p.x - 6, p.y - 12 - yOffset, 14, 6);
    });
  }

  /**
   * Anim ID: A-10 - Police Siren Light Flash Overlay (4-Frame Loop)
   * Red overlay -> Off -> Blue overlay -> Off
   */
  renderPoliceSirensOverlay(ctx) {
    const sirenColors = [
      'rgba(217, 56, 46, 0.25)',  // Red (#D9382E)
      'rgba(0, 0, 0, 0)',         // Off
      'rgba(94, 170, 255, 0.25)', // Siren Blue (#5EAAFF)
      'rgba(0, 0, 0, 0)'          // Off
    ];

    const overlayColor = sirenColors[this.frameIndex];
    if (overlayColor !== 'rgba(0, 0, 0, 0)') {
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /**
   * Anim ID: A-05 - Bodega Neon Flicker (4-Frame Loop)
   */
  renderNeonFlicker(ctx) {
    const isLit = (this.frameIndex !== 1); // Random flicker off on frame 1
    if (isLit) {
      ctx.fillStyle = '#f25438'; // Neon Crimson (#F25438)
      ctx.fillRect(100, 48, 40, 8);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WEATHER_MODES,
    WeatherEffectsSystem
  };
}

if (typeof window !== 'undefined') {
  window.WEATHER_MODES = WEATHER_MODES;
  window.WeatherEffectsSystem = WeatherEffectsSystem;
}
