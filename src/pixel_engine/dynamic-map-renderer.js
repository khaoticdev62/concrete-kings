/**
 * Concrete Kings: Dynamic Narrative Map — Renderer
 *
 * Deterministic Canvas 2D renderer, PRD-aligned (CRPG-MAP-PRD-001 §82/§88).
 * Draws locations, routes, faction territories, scenario nodes, character
 * presence, and event overlays. Pure function of state + layout.
 *
 * Camera: a DMCamera (pan/zoom/focus, interpolation — PRD §11/§12) is applied
 * as a canvas transform, so all draw logic stays in world coordinates.
 * Zoom levels (Region/District/Location — PRD §10) are expressed via camera.zoom.
 *
 * No custom pixel art required (PRD §91): nodes are geometric + labeled.
 */

const DMNodeColors = {
  SAFE: '#5bd97a',
  ACTIVE: '#ffcd68',
  TENSE: '#ff9f43',
  DANGEROUS: '#ff5e5e',
  LOCKED: '#9aa0b5',
  UNDER_SURVEILLANCE: '#7b6cff',
  COMPROMISED: '#ff5e5e',
  ABANDONED: '#5b6275',
  DAMAGED: '#ff9f43',
  DESTROYED: '#3a3f4d',
  SPECIAL_EVENT: '#ff66cc'
};

const DMScenarioColors = {
  HIDDEN: '#3a3f4d',
  NEW: '#ffffff',
  AVAILABLE: '#ffcd68',
  URGENT: '#ff5e5e',
  EXPIRING: '#ff9f43',
  LOCKED: '#9aa0b5',
  COMPLETED: '#5bd97a',
  FAILED: '#7a3b3b',
  MISSED: '#5b6275',
  COMPROMISED: '#ff5e5e'
};

class DMRenderer {
  constructor(options = {}) {
    this.canvas = options.canvas || null;
    this.layout = options.layout || null; // optional injected layout
    this.camera = options.camera || null; // DMCamera instance
    this.assets = options.assets || null; // DMAssetManager instance
    this.pulse = null;
  }

  /**
   * Fit a sprite inside a square draw box instead of stretching it to one.
   *
   * Resolved on first call rather than at parse time, so this file does not
   * become order-dependent on dynamic-map-assets.js the way lightmap.js is on
   * the top-down renderer (HANDOFF section 3). Degrades to the old square
   * behaviour rather than throwing if it cannot be resolved.
   */
  _fit(img, box) {
    if (this._fitFn === undefined) {
      this._fitFn = (typeof require !== 'undefined')
        ? require('./dynamic-map-assets.js').dmFitSprite
        : ((typeof window !== 'undefined' && window.dmFitSprite) || null);
    }
    return this._fitFn ? this._fitFn(img, box) : { dw: box, dh: box, ox: 0, oy: 0 };
  }

  _worldToScreen(state, wx, wy) {
    const cam = this.camera;
    const w = this.canvas ? this.canvas.width : 960;
    const h = this.canvas ? this.canvas.height : 540;
    if (!cam) return { x: wx, y: wy };
    return cam.worldToScreen(wx, wy, w, h);
  }

  render(state) {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, w, h);

    // Phase 3 / assets: tiled pixel-art terrain backdrop (falls back to solid fill)
    if (this.assets) this._drawTerrain(ctx, state, w, h);
    else { ctx.fillStyle = '#0c0e14'; ctx.fillRect(0, 0, w, h); }

    // Apply camera transform: translate to center, scale, translate by -cam pos
    const cam = this.camera;
    if (cam) {
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);
    }

    this._drawFactionTerritories(ctx, state);
    this._drawRoutes(ctx, state);
    this._drawLocations(ctx, state);
    if (['STORY', 'PEOPLE', 'RUMORS', 'FACTIONS'].includes(state.mode)) {
      this._drawScenarioNodes(ctx, state);
    }
    this._drawCharacters(ctx, state);
    if (this.assets) this._drawEventAssets(ctx, state);
    if (state.mode === 'PEOPLE') this._drawRelationshipGraph(ctx, state);
    if (state.mode === 'FACTIONS') this._drawFactionTerritoryLabels(ctx, state);

    // UI chrome (mode label, zoom level, event banner) in screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._drawModeLabel(ctx, state, w);
    this._drawEventOverlays(ctx, state, w, h);
  }

  _drawFactionTerritories(ctx, state) {
    const owned = Object.values(state._locations).filter(l => l.ownership && l.ownership.faction && l.ownership.faction !== 'neutral');
    const byFaction = {};
    owned.forEach(l => { (byFaction[l.ownership.faction] = byFaction[l.ownership.faction] || []).push(l); });
    let idx = 0;
    Object.keys(byFaction).forEach(fid => {
      const fac = state.getFaction(fid);
      const color = fac ? this._factionColor(idx) : '#333';
      idx++;
      byFaction[fid].forEach(l => {
        const p = this._coord(l);
        ctx.fillStyle = color + '22';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 46, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  _factionColor(i) {
    return ['#7b6cff', '#ff66cc', '#43c6ff', '#ff9f43'][i % 4];
  }

  _coord(loc) {
    if (this.layout && this.layout[loc.id]) return this.layout[loc.id];
    const c = loc.coordinates || { x: 400, y: 300 };
    return { x: c.x, y: c.y };
  }

  _drawRoutes(ctx, state) {
    ctx.strokeStyle = '#2d313d';
    ctx.lineWidth = 2 / (this.camera ? this.camera.zoom : 1);
    Object.values(state._routes).forEach(r => {
      const a = state.getLocation(r.origin);
      const b = state.getLocation(r.destination);
      if (!a || !b) return;
      if (!a.discovered && !b.discovered) return;
      const pa = this._coord(a);
      const pb = this._coord(b);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.globalAlpha = r.danger > 0.5 ? 0.9 : 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  _drawLocations(ctx, state) {
    Object.values(state._locations).forEach(loc => {
      if (!loc.discovered) return;
      const p = this._coord(loc);
      const color = DMNodeColors[loc.state] || '#cbd5ed';
      // Draw pixel-art building sprite if available (assets), else geometric glyph
      // getLocationAsset returns null for a type mapped to no art (TRANSITION),
      // and get(null) would cache a bogus key and request base + "null".
      const assetPath = this.assets ? this.assets.getLocationAsset(loc.type) : null;
      const img = (this.assets && assetPath) ? this.assets.get(assetPath) : null;
      if (img) {
        const size = loc.id === state.activeLocationId ? 40 : 30;
        const f = this._fit(img, size);
        ctx.drawImage(img, p.x - size / 2 + f.ox, p.y - size / 2 + f.oy, f.dw, f.dh);
        // state ring
        ctx.strokeStyle = color; ctx.lineWidth = 2 / (this.camera ? this.camera.zoom : 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, size / 2 + 3, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, loc.id === state.activeLocationId ? 12 : 8, 0, Math.PI * 2);
        ctx.fill();
      }
      if (loc.id === state.activeLocationId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / (this.camera ? this.camera.zoom : 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      // MVP-D: selection/reveal pulse (§86) around active node
      if (loc.id === state.activeLocationId && this.pulse != null) {
        const pr = 16 + Math.sin(this.pulse) * 4;
        ctx.strokeStyle = 'rgba(255,205,104,0.6)';
        ctx.lineWidth = 1 / (this.camera ? this.camera.zoom : 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#cbd5ed';
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(loc.name.toUpperCase(), p.x, p.y + 28);
    });
  }

  _drawScenarioNodes(ctx, state) {
    Object.values(state._scenarios).forEach(s => {
      if (['COMPLETED', 'FAILED', 'MISSED', 'HIDDEN'].includes(s.status)) return;
      const loc = state.getLocation(s.locationId);
      if (!loc || !loc.discovered) return;
      const p = this._coord(loc);
      const color = DMScenarioColors[s.status] || '#ffcd68';
      ctx.fillStyle = color;
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      const glyph = s.status === 'LOCKED' ? '🔒' : s.status === 'URGENT' ? '★' : '◆';
      ctx.fillText(glyph, p.x + 20, p.y - 12);
    });
  }

  _drawCharacters(ctx, state) {
    Object.values(state._characters).forEach(c => {
      if (!c.locationId) return;
      const loc = state.getLocation(c.locationId);
      if (!loc || !loc.discovered) return;
      const p = this._coord(loc);
      ctx.fillStyle = c.id === 'player' ? '#ffffff' : '#6cf';
      ctx.beginPath();
      ctx.arc(p.x - 6, p.y - 14, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  _drawModeLabel(ctx, state, w) {
    ctx.fillStyle = '#ffcd68';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    const level = this.camera ? this.camera._levelFromZoom() : 'DISTRICT';
    ctx.fillText(state.mode + ' · ' + state.timeBlock + ' · ' + level, 12, 20);
  }

  // PRD §62/§63 — PEOPLE layer relationship graph
  _drawRelationshipGraph(ctx, state) {
    const { nodes, edges } = state.relationshipNodes();
    const pos = {};
    nodes.forEach((n, i) => { const l = state.getLocation(n.locationId); pos[n.id] = l ? this._coord(l) : { x: 480 + i * 40, y: 270 }; });
    edges.forEach(e => {
      const a = pos[e.a], b = pos[e.b];
      if (!a || !b) return;
      ctx.strokeStyle = e.value >= 0 ? '#5bd97a' : '#ff5e5e';
      ctx.globalAlpha = Math.min(1, Math.abs(e.value) / 100 + 0.2);
      ctx.lineWidth = 1 / (this.camera ? this.camera.zoom : 1);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#cbd5ed';
      ctx.font = '10px monospace'; ctx.textAlign = 'center';
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.fillText((e.value >= 0 ? '+' : '') + e.value, mx, my - 4);
    });
  }

  // PRD §57 — faction territory labels
  _drawFactionTerritoryLabels(ctx, state) {
    Object.values(state._factions).forEach(f => {
      if (f.id === 'neutral' || !f.controlledLocations.length) return;
      const loc = state.getLocation(f.controlledLocations[0]);
      if (!loc) return;
      const p = this._coord(loc);
      ctx.fillStyle = '#cbd5ed';
      ctx.font = '10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(f.name + ' [' + (f.territory || '?') + ']', p.x, p.y - 30);
    });
  }

  // PRD §61 — event overlays (screen space)
  _drawEventOverlays(ctx, state, w, h) {
    const active = state.activeEvents();
    if (!active.length) return;
    let y = 40;
    active.forEach(ev => {
      ctx.fillStyle = 'rgba(255,94,94,0.15)';
      ctx.fillRect(0, 0, w, h); // darkened/reddened tint while event active
      ctx.fillStyle = '#ff5e5e';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('⚠ EVENT: ' + ev.name.toUpperCase() + ' (' + ev.remaining + ')', 12, y);
      y += 20;
    });
  }

  // Phase 3 / assets: tiled pixel-art terrain backdrop
  _drawTerrain(ctx, state, w, h) {
    const terrPath = this.assets.getTerrain();
    const img = this.assets.get(terrPath);
    if (!img) { ctx.fillStyle = '#0c0e14'; ctx.fillRect(0, 0, w, h); return; }
    // tile the 48x48 terrain across the canvas (in screen space, before transform)
    const ts = 48;
    for (let x = 0; x < w; x += ts) for (let y = 0; y < h; y += ts) ctx.drawImage(img, x, y, ts, ts);
  }

  // Phase 3 / assets: character presence as pixel sprite (falls back to dot)
  _drawCharacters(ctx, state) {
    const charPath = this.assets.getCharacter();
    const img = this.assets.get(charPath);
    Object.values(state._characters).forEach(c => {
      if (!c.locationId) return;
      const loc = state.getLocation(c.locationId);
      if (!loc || !loc.discovered) return;
      const p = this._coord(loc);
      if (img) {
        const s = 18;
        const f = this._fit(img, s);
        ctx.drawImage(img, p.x - 9 + f.ox, p.y - 26 + f.oy, f.dw, f.dh);
      } else {
        ctx.fillStyle = c.id === 'player' ? '#ffffff' : '#6cf';
        ctx.beginPath(); ctx.arc(p.x - 6, p.y - 14, 3, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  // Phase 3 / assets: draw an event's signature sprite (e.g. police station)
  _drawEventAssets(ctx, state) {
    state.activeEvents().forEach(ev => {
      const path = this.assets.getEventAsset(ev.id);
      if (!path) return;
      const img = this.assets.get(path);
      if (!img) return;
      // place near top-right of world
      const p = this._coord(state.getLocation(state.activeLocationId) || { coordinates: { x: 480, y: 270 } });
      const f = this._fit(img, 40);
      ctx.drawImage(img, p.x - 20 + f.ox, p.y - 70 + f.oy, f.dw, f.dh);
    });
  }
}


if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DMRenderer, DMNodeColors, DMScenarioColors };
}
if (typeof window !== 'undefined') {
  window.DMRenderer = DMRenderer;
  window.DMNodeColors = DMNodeColors;
  window.DMScenarioColors = DMScenarioColors;
}
