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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MiniGameUI
  };
}

if (typeof window !== 'undefined') {
  window.MiniGameUI = MiniGameUI;
}
