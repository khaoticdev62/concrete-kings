/**
 * Concrete Kings: The Block Chronicles
 * Mini-Game UI & Rendering Wrapper
 */

class MiniGameUI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.nativeWidth = 1280;
    this.nativeHeight = 720;
    
    this.virtualCanvas = document.createElement("canvas");
    this.virtualCanvas.width = this.nativeWidth;
    this.virtualCanvas.height = this.nativeHeight;
    this.virtualCtx = this.virtualCanvas.getContext("2d", { alpha: true });
    
    this.ctx.imageSmoothingEnabled = false;
    this.virtualCtx.imageSmoothingEnabled = false;
    
    this.scaleInfo = { scale: 1, renderWidth: 1280, renderHeight: 720, marginX: 0, marginY: 0 };
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement || document.body;
    const vpW = parent.clientWidth || window.innerWidth;
    const vpH = parent.clientHeight || window.innerHeight;

    // Use global calculateIntegerScale from pixel-engine.js if available, otherwise fallback
    if (typeof calculateIntegerScale === 'function') {
      this.scaleInfo = calculateIntegerScale(vpW, vpH, this.nativeWidth, this.nativeHeight);
    } else {
      const scaleX = Math.floor(vpW / this.nativeWidth);
      const scaleY = Math.floor(vpH / this.nativeHeight);
      const scale = Math.max(1, Math.min(scaleX, scaleY));
      this.scaleInfo = {
        scale: scale,
        renderWidth: this.nativeWidth * scale,
        renderHeight: this.nativeHeight * scale,
        marginX: Math.floor((vpW - (this.nativeWidth * scale)) / 2),
        marginY: Math.floor((vpH - (this.nativeHeight * scale)) / 2)
      };
    }

    // calculateIntegerScale clamps scale to a minimum of 1, so on any viewport
    // narrower or shorter than 1280x720 it returns a 1280x720 frame that does not
    // fit and present() then silently clips it. The HUD bars sit at y=0..54 and
    // y=666..720, so the first thing lost is the score and the controls.
    //
    // Below native, fit fractionally instead. A soft-scaled frame is worse than a
    // pixel-exact one and better than an invisible one. calculateIntegerScale is
    // shared with the map and card renderers and pinned by tests, so the fallback
    // lives here rather than in it.
    if (this.scaleInfo.renderWidth > vpW || this.scaleInfo.renderHeight > vpH) {
      const fit = Math.min(vpW / this.nativeWidth, vpH / this.nativeHeight);
      const renderWidth = Math.max(1, Math.floor(this.nativeWidth * fit));
      const renderHeight = Math.max(1, Math.floor(this.nativeHeight * fit));
      this.scaleInfo = {
        scale: fit,
        renderWidth,
        renderHeight,
        marginX: Math.floor((vpW - renderWidth) / 2),
        marginY: Math.floor((vpH - renderHeight) / 2)
      };
    }

    this.canvas.width = vpW;
    this.canvas.height = vpH;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    this.virtualCtx.clearRect(0, 0, this.nativeWidth, this.nativeHeight);
  }

  present() {
    const { renderWidth, renderHeight, marginX, marginY } = this.scaleInfo;
    
    // Clear outer display canvas transparently
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Blit virtual canvas scaled with crisp nearest-neighbor
    this.ctx.drawImage(
      this.virtualCanvas,
      0, 0, this.nativeWidth, this.nativeHeight,
      marginX, marginY, renderWidth, renderHeight
    );
  }

  drawRetroBox(x, y, w, h, bg = '#101116', border = '#2d313d', borderWidth = 4) {
    const ctx = this.virtualCtx;
    
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);
    }
    
    if (border && borderWidth > 0) {
      ctx.strokeStyle = border;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(x + borderWidth / 2, y + borderWidth / 2, w - borderWidth, h - borderWidth);
    }
  }

  drawText(text, x, y, options = {}) {
    const ctx = this.virtualCtx;
    const font = options.font || 'VT323'; // Press Start 2P, VT323, JetBrains Mono
    const size = options.size || '24px';
    const color = options.color || '#f4f7ff';
    const align = options.align || 'left';
    
    ctx.fillStyle = color;
    ctx.font = `${size} "${font}", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  drawTimerBar(x, y, w, h, percentage, options = {}) {
    const ctx = this.virtualCtx;
    const bg = options.bg || '#22252e';
    const color = options.color || '#6fe8d8';
    const border = options.border || '#2d313d';

    // Draw background
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // Draw filled percentage
    const fillWidth = Math.max(0, Math.min(w, w * percentage));
    ctx.fillStyle = color;
    ctx.fillRect(x, y, fillWidth, h);

    // Draw border outline
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  /* CARD RPG SPEC v3.0 (#71-#74 & #118): INSTANT INTRO HEADER */
  drawMiniGameHeader(title, subtitle, controlsHint) {
    const ctx = this.virtualCtx;

    // Top banner panel, seated in the gap between the HUD bar and the play area.
    //
    // MiniGameManager.render() draws this header and THEN drawHUD, whose top bar
    // is an opaque box spanning y=0..54. At the original y=16 the banner's title
    // and its controls badge were painted over by that bar every frame — the
    // game's name and how to play it were both half-buried. Nobody saw it while
    // the frame was being clipped to its top 100px; it showed up the moment the
    // stage got a real viewport.
    //
    // The band is 58..122, which is tighter than the original 70px. It has to
    // clear the HUD bar at 54 and still finish above y=130, where the individual
    // games start drawing their own titles — they were authored against a banner
    // ending at 86 and there is only so much room between the two.
    ctx.fillStyle = '#101116';
    ctx.fillRect(20, 58, 1240, 64);
    ctx.strokeStyle = '#ffcd68';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 58, 1240, 64);

    // Title & Subtitle
    ctx.fillStyle = '#ffcd68';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), 36, 82);

    ctx.fillStyle = '#6fe8d8';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(subtitle, 36, 104);

    // Controls badge on right
    if (controlsHint) {
      ctx.fillStyle = '#151821';
      ctx.fillRect(940, 66, 300, 48);
      ctx.strokeStyle = '#339488';
      ctx.lineWidth = 2;
      ctx.strokeRect(940, 66, 300, 48);

      ctx.fillStyle = '#ffcd68';
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(controlsHint, 1090, 88);
    }
  }

  /* CARD RPG SPEC v3.0 (#73): DUAL-BAR MINIMAL HUD */
  drawDualHudBars(playerLabel, playerPct, threatLabel, threatPct) {
    // Player progress bar (top left under banner)
    this.drawText(playerLabel.toUpperCase(), 36, 100, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8' });
    this.drawTimerBar(36, 116, 400, 16, playerPct, { color: '#6fe8d8', bg: '#151821', border: '#339488' });

    // Threat / Timer bar (top right under banner)
    this.drawText(threatLabel.toUpperCase(), 840, 100, { font: 'Press Start 2P', size: '10px', color: '#ff7fbf' });
    this.drawTimerBar(840, 116, 400, 16, threatPct, { color: '#ff7fbf', bg: '#151821', border: '#f25438' });
  }

  /* CARD RPG SPEC v3.0 (#74 & #1007): INSTANT OUTCOME OVERLAY */
  drawOutcomeOverlay(resultType, narrativeText) {
    const ctx = this.virtualCtx;

    // Centered result panel (700x220)
    const x = (1280 - 700) / 2;
    const y = (720 - 220) / 2;

    ctx.fillStyle = '#101116';
    ctx.fillRect(x, y, 700, 220);
    const borderColor = resultType.includes('FAIL') ? '#f25438' : '#ffcd68';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, 700, 220);

    ctx.fillStyle = borderColor;
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(resultType.toUpperCase(), 1280 / 2, y + 40);

    ctx.fillStyle = '#cbd5ed';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(narrativeText || 'The story continues...', 1280 / 2, y + 100);

    ctx.fillStyle = '#6fe8d8';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('RESUMING SCENE PLAYBACK...', 1280 / 2, y + 160);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MiniGameUI
  };
}

if (typeof window !== 'undefined') {
  window.MiniGameUI = MiniGameUI;
}
