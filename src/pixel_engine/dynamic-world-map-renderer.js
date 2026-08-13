/**
 * CARD RPG — Pixel Narrative World Map Renderer (PRD CRPG-MAP-PRD-002 §3/§4/§6/§7)
 *
 * Renders the living world from a DMWorldMap model onto a pixelated 2D canvas.
 * Consumes the wrapped DMMapState for gameplay truth (locations, scenarios,
 * characters, rumors, factions, worldEvents, time, weather, feed). Uses the existing
 * DMAssetManager for real pixel-art assets (assets/) with geometric glyph fallback.
 *
 * Pixel-art discipline (§7/§8): nearest-neighbor scaling, hard edges, consistent
 * 16px base tile density. No anti-aliasing on image draws.
 */
(function (root, factory) {
  const mod = factory(
    (typeof require !== 'undefined') ? require('./dynamic-map-state.js') : (typeof window !== 'undefined' ? window : {}),
    (typeof require !== 'undefined') ? require('./dynamic-world-map.js') : (typeof window !== 'undefined' ? window : {})
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof window !== 'undefined') window.DMWorldMapRenderer = mod.DMWorldMapRenderer;
})(this, function (DMStateMod, DMWorldMod) {
  const DM_LOC_VISUAL = (DMWorldMod && DMWorldMod.DM_LOC_VISUAL) || {};
  const DM_SCENARIO_ENERGY = (DMWorldMod && DMWorldMod.DM_SCENARIO_ENERGY) || {};
  const DM_WEATHER = (DMWorldMod && DMWorldMod.DM_WEATHER) || {};
  const DM_TOD = (DMWorldMod && DMWorldMod.DM_TOD) || {};

  // master tile size (§7)
  const TILE = 16;

  /**
   * Time-of-day tint, shared by the sky fill and the ground tint (§23).
   *
   * Module scope inside this factory, not global, so it cannot collide with
   * another <script>-loaded engine file (HANDOFF trap 2.4).
   */
  const DM_TOD_TINTS = {
    DAWN: '#2b2140', DAY: '#3a4a6b', DUSK: '#5a3a55',
    EVENING: '#1d2335', NIGHT: '#0d1020', LATE_NIGHT: '#080a14'
  };

  /**
   * How strongly the tint sits over the ground, per time block.
   *
   * The asphalt tile is a fixed daylight-luminance 81 — the darkest flat tile
   * in the whole 2832x4944 city terrain atlas, so there is no darker one to
   * pick. Without this the street reads the same at midnight as at noon, and
   * the map turns into a pale grey field that fights the game's dark palette.
   * Multiplying through: DAY lands near 80, EVENING near 53, NIGHT near 33.
   */
  const DM_TOD_GROUND_ALPHA = {
    DAWN: 0.45, DAY: 0.15, DUSK: 0.5,
    EVENING: 0.6, NIGHT: 0.75, LATE_NIGHT: 0.85
  };

  /**
   * How strongly the tint sits over the whole scene, per time block.
   *
   * Much lighter than the ground values above, and separate from them because
   * the two are doing different jobs. The ground is one flat tile at a fixed
   * daylight luminance and needs a heavy multiply to read as night. The
   * buildings are detailed art that only needs an atmospheric cast: reusing the
   * ground alphas over them desaturated every facade to the same grey-blue and
   * threw away the thing that distinguishes one location from another.
   */
  const DM_TOD_SCENE_ALPHA = {
    DAWN: 0.18, DAY: 0, DUSK: 0.2,
    EVENING: 0.25, NIGHT: 0.4, LATE_NIGHT: 0.5
  };

  class DMWorldMapRenderer {
    constructor(options) {
      options = options || {};
      this.canvas = options.canvas || null;
      this.world = options.world || null;     // DMWorldMap
      this.assets = options.assets || null;   // DMAssetManager
      this.assetRegistry = options.assetRegistry || null; // MapAssetRegistry (generated assets/)
      this.ctx = null;
      this._t = 0;
    }

    setWorld(w) { this.world = w; return this; }
    setAssets(a) { this.assets = a; return this; }
    setAssetRegistry(r) { this.assetRegistry = r; return this; }

    // helper: resolve + load a generated asset path via the DMAssetManager cache.
    // Returns the cached HTMLImageElement or null (→ caller falls back to glyph).
    _loadLegacy(path) {
      if (!path || !this.assets || !this.assets.get) return null;
      return this.assets.get(path);
    }

    /**
     * Fit a sprite inside a square draw box instead of stretching it to one.
     *
     * Resolved on first call rather than at parse time. dynamic-map-assets.js
     * is a separate <script> and binding to it while this file parses is
     * exactly what makes lightmap.js load-order-sensitive (HANDOFF section 3).
     * Falls back to the old square behaviour if it cannot be resolved at all,
     * so a load-order change degrades instead of throwing.
     */
    _fit(img, box) {
      if (this._fitFn === undefined) {
        this._fitFn = (typeof require !== 'undefined')
          ? require('./dynamic-map-assets.js').dmFitSprite
          : ((typeof window !== 'undefined' && window.dmFitSprite) || null);
      }
      return this._fitFn ? this._fitFn(img, box) : { dw: box, dh: box, ox: 0, oy: 0 };
    }

    _gen(kind, ...args) {
      if (!this.assetRegistry) return null;
      let path = null;
      if (kind === 'location') path = this.assetRegistry.resolveLocation(args[0], args[1], args[2], args[3]);
      else if (kind === 'character') path = this.assetRegistry.resolveCharacter(args[0], args[1]);
      else if (kind === 'vehicle') path = this.assetRegistry.resolveVehicle(args[0], args[1]);
      else if (kind === 'tile') path = this.assetRegistry.resolveTile(args[0]);
      else if (kind === 'prop') path = this.assetRegistry.resolveProp(args[0]);
      else if (kind === 'fx') path = this.assetRegistry.resolveEffect(args[0]);
      else if (kind === 'event') path = this.assetRegistry.resolveEvent(args[0]);
      if (!path || !this.assets || !this.assets.get) return null;
      return this.assets.get(path);
    }

    render(tick) {
      const canvas = this.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false; // §57 nearest-neighbor
      this.ctx = ctx;
      const w = canvas.width, h = canvas.height;
      this._t = (typeof tick === 'number') ? tick : (this._t + 1);
      ctx.clearRect(0, 0, w, h);

      if (!this.world) { this._drawFallback(ctx, w, h); return; }

      // depth layers (§47): skyline bg -> terrain -> roads -> buildings -> props
      // -> characters -> vehicles -> scenario markers -> fx -> ui
      this._drawSky(ctx, w, h);
      this._drawTerrain(ctx, w, h);
      this._drawRoads(ctx, w, h);
      this._drawLocations(ctx, w, h);
      this._drawAmbient(ctx, w, h);
      this._drawCharacters(ctx, w, h);
      this._drawVehicles(ctx, w, h);
      this._drawScenarioMarkers(ctx, w, h);
      this._drawWeather(ctx, w, h);
      this._drawTimeOfDay(ctx, w, h);
      this._drawHUD(ctx, w, h);
    }

    // ----- helpers -----
    _locScreen(loc, w, h) {
      // normalized 0..1 positions -> screen, with zoom/detail scaling.
      // Prefer explicit loc.x / loc.y (0..1); fall back to pixel-space
      // loc.coordinates (0..960 / 0..540) so levels that only set coordinates
      // still spread correctly across the map instead of stacking.
      const zoom = this.world.zoom;
      const district = this.world.districts.find(d => d.id === (loc.districtId || this.world.activeDistrictId)) || { x: 0.5, y: 0.5 };
      let nx = (typeof loc.x === 'number') ? loc.x : (loc.coordinates && loc.coordinates.x != null ? loc.coordinates.x / 960 : 0.5);
      let ny = (typeof loc.y === 'number') ? loc.y : (loc.coordinates && loc.coordinates.y != null ? loc.coordinates.y / 540 : 0.5);
      const spread = zoom === 'CITY' ? 0.12 : zoom === 'DISTRICT' ? 0.5 : zoom === 'STREET' ? 0.85 : 1.0;
      const baseX = district.x + nx * spread;
      const baseY = district.y + ny * spread;
      return { x: baseX * w, y: baseY * h };
    }

    _drawSky(ctx, w, h) {
      // time-of-day tint (§23)
      ctx.fillStyle = DM_TOD_TINTS[this.world.timeOfDay] || DM_TOD_TINTS.EVENING;
      ctx.fillRect(0, 0, w, h);
    }

    _drawTerrain(ctx, w, h) {
      // Tiled ground from asset if available, else the checkerboard (§11).
      //
      // The asset half of that promise was never wired: this method only ever
      // drew the checkerboard, which is the flat two-tone grid the map shipped
      // with. assets/map/web/ground_asphalt.png is a 48x48 seamless tile cut
      // from the city terrain atlas, drawn 1:1 so nothing resamples.
      const tile = (this.assets && this.assets.getTerrain) ? this._loadLegacy(this.assets.getTerrain()) : null;
      if (tile && tile.width) {
        const tw = tile.width, th = tile.height;
        for (let x = 0; x < w; x += tw) for (let y = 0; y < h; y += th) ctx.drawImage(tile, x, y, tw, th);

        // Ground-only tint. _drawSky's tint is painted UNDER this layer, so an
        // opaque tile hides it completely and every clock looked like noon. This
        // one is heavy because the tile is a fixed daylight luminance 81 and has
        // to reach ~33 at night; the scene-wide wash in _drawTimeOfDay is much
        // lighter and does not have to carry that.
        const tod = this.world.timeOfDay;
        const alpha = DM_TOD_GROUND_ALPHA[tod];
        if (alpha) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = DM_TOD_TINTS[tod] || DM_TOD_TINTS.EVENING;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
        return;
      }
      const ts = TILE * 2;
      for (let x = 0; x < w; x += ts) for (let y = 0; y < h; y += ts) {
        ctx.fillStyle = ((x / ts + y / ts) % 2 === 0) ? '#23262e' : '#1b1e25';
        ctx.fillRect(x, y, ts, ts);
      }
    }

    _drawRoads(ctx, w, h) {
      // route ribbons between districts; condition affects color (§69/§70)
      const condColor = { OPEN: '#3a3f4a', CONGESTED: '#4a4330', BLOCKED: '#5a2a2a', DANGEROUS: '#5a2a2a', SECRET: '#2a3a4a', CONTROLLED: '#3a3a5a' };
      this.world.routes.forEach(r => {
        const a = this.world.districts.find(d => d.id === r.from);
        const b = this.world.districts.find(d => d.id === r.to);
        if (!a || !b) return;
        ctx.strokeStyle = condColor[r.condition] || condColor.OPEN;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      });
    }

    _drawLocations(ctx, w, h) {
      const state = (this.world.state);
      const locs = state && state.locations ? Object.values(state.locations) : [];
      locs.forEach(loc => {
        const p = this._locScreen(loc, w, h);
        const vis = this.world.locationVisualState(loc.id);
        // building body: prefer a generated §59 asset, else CraftPix, else glyph (§18/§59)
        const size = this.world.zoom === 'CITY' ? 22 : this.world.zoom === 'DISTRICT' ? 40 : 64;
        // Resolution order: this location's own art, then the generated set,
        // then the type fallback, then the glyph below.
        //
        // Per-location art comes FIRST because the generated set it displaces is
        // a flat 32x32 colour square per location — it would otherwise win on
        // every id that has one, which is every id this table covers.
        //
        // byId returning { path: null } means "this location is mapped to no art
        // deliberately"; that must skip the generated fallback as well, or the
        // placeholder simply comes back. byId returning null means the table has
        // no opinion, and the old chain runs unchanged.
        const byId = (this.assets && this.assets.getLocationAssetById)
          ? this.assets.getLocationAssetById(loc.id) : null;
        let sprite = null;
        if (byId) {
          sprite = byId.path ? this._loadLegacy(byId.path) : null;
        } else {
          // _gen() resolves a generated §59 asset to a cached HTMLImageElement
          // (already loaded, or null). Don't re-resolve the Image as a path.
          const gen = this._gen('location', loc.type, loc.id, loc.name, this.world.timeOfDay);
          sprite = (gen && typeof gen === "object" && typeof gen.width === "number" && typeof gen !== "string") ? gen
            : (this.assets && this.assets.getLocationAsset ? this._loadLegacy(this.assets.getLocationAsset(loc.type)) : null);
        }
        if (sprite) {
          // Fitted, not stretched: these sprites are 64x55, 40x64, 32x64 and so
          // on. Forcing them square turned a storefront into a smear.
          const f = this._fit(sprite, size);
          ctx.drawImage(sprite, p.x - size / 2 + f.ox, p.y - size + f.oy, f.dw, f.dh);
        } else {
          ctx.fillStyle = (vis === DM_LOC_VISUAL.DAMAGED) ? '#5a3a2a' : (vis === DM_LOC_VISUAL.POLICE_TAPE || vis === DM_LOC_VISUAL.POLICE_ACTIVITY) ? '#2a3550' : '#3a4250';
          ctx.fillRect(p.x - size / 2, p.y - size, size, size);
          // roof
          ctx.fillStyle = '#22262e';
          ctx.fillRect(p.x - size / 2, p.y - size, size, size * 0.25);
        }
        // visual-state overlay (§20/§21): police tape, smoke, etc.
        if (vis === DM_LOC_VISUAL.POLICE_TAPE || vis === DM_LOC_VISUAL.POLICE_ACTIVITY) {
          ctx.fillStyle = '#ffcd68';
          ctx.fillRect(p.x - size / 2, p.y - size * 0.5, size, 3);
        }
        if (this.world.worldMarksFor(loc.id).includes('broken_windows')) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(p.x - size / 4, p.y - size * 0.7, 4, 4);
        }
        // label (§18: identity should read even before text, but we add a small tag)
        if (this.world.zoom !== 'CITY') {
          ctx.fillStyle = '#cbd5ed';
          ctx.font = '8px monospace';
          ctx.fillText(loc.name || loc.id, p.x - size / 2, p.y + 4);
        }
        // active location highlight
        if (state.activeLocationId === loc.id) {
          ctx.strokeStyle = '#6fe8d8';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x - size / 2 - 3, p.y - size - 3, size + 6, size + 6);
        }
      });
    }

    _drawAmbient(ctx, w, h) {
      if (this.world.zoom === 'CITY') return; // too small to matter
      this.world.ambient.forEach(a => {
        const x = a.x * w, y = a.y * h;
        if (a.kind === 'car') { ctx.fillStyle = '#444a55'; ctx.fillRect(x, y, 8, 4); }
        else if (a.kind === 'ped') { ctx.fillStyle = '#6b7280'; ctx.fillRect(x, y, 2, 5); }
        else if (a.kind === 'light') { ctx.fillStyle = ((this._t + a.phase) % 30 < 15) ? '#ffcd68' : '#7a6a30'; ctx.fillRect(x, y, 2, 2); }
        else if (a.kind === 'smoke') { ctx.fillStyle = 'rgba(180,180,180,0.25)'; ctx.fillRect(x, y, 4, 4); }
      });
    }

    _drawCharacters(ctx, w, h) {
      const state = this.world.state;
      if (!state || !state.characters) return;
      Object.values(state.characters).forEach(c => {
        const loc = c.locationId ? state.getLocation(c.locationId) : null;
        if (!loc) return;
        const p = this._locScreen(loc, w, h);
        const size = this.world.zoom === 'CITY' ? 4 : this.world.zoom === 'DISTRICT' ? 8 : 12;
        // character sprite: prefer generated §59 asset, else glyph (§27)
        const gen = this._gen('character', c.id, c.name);
        const sprite = (gen && typeof gen === "object" && typeof gen.width === "number" && typeof gen !== "string") ? gen
          : (this.assets && this.assets.getCharacter ? this._loadLegacy(this.assets.getCharacter(c.id)) : null);
        const cx = p.x + (c._jitX || 0), cy = p.y - 14;
        if (sprite) {
          // Bottom-aligned inside the box by _fit, because a figure stands on
          // the ground rather than floating in the middle of its cell.
          const f = this._fit(sprite, size);
          ctx.drawImage(sprite, cx - size / 2 + f.ox, cy - size / 2 + f.oy, f.dw, f.dh);
        } else { ctx.fillStyle = c.color || '#d98a5a'; ctx.fillRect(cx - size / 2, cy - size / 2, size, size); }
        if (this.world.layers.has('PEOPLE') && this.world.zoom !== 'CITY') {
          ctx.fillStyle = '#cbd5ed'; ctx.font = '7px monospace';
          ctx.fillText(c.name || c.id, cx - size, cy - size / 2 - 2);
        }
      });
    }

    _drawVehicles(ctx, w, h) {
      const vehs = (this.world.vehicles) || (this.world.state && this.world.state.vehicles) || [];
      if (!Array.isArray(vehs) || !vehs.length) return;
      const state = this.world.state;
      vehs.forEach(v => {
        const loc = v.locationId && state && state.getLocation ? state.getLocation(v.locationId) : null;
        const x = loc ? this._locScreen(loc, w, h).x + (v.dx || 0) : (v.x != null ? v.x * w : w / 2);
        const y = loc ? this._locScreen(loc, w, h).y + (v.dy || 0) : (v.y != null ? v.y * h : h / 2);
        const size = this.world.zoom === 'CITY' ? 8 : this.world.zoom === 'DISTRICT' ? 16 : 22;
        const gen = this._gen('vehicle', v.id, v.name);
        const sprite = (gen && typeof gen === "object" && typeof gen.width === "number" && typeof gen !== "string") ? gen : null;
        if (sprite) {
          const f = this._fit(sprite, size);
          ctx.drawImage(sprite, x - size / 2 + f.ox, y - size / 2 + f.oy, f.dw, f.dh);
        } else { ctx.fillStyle = v.color || '#444a55'; ctx.fillRect(x - size / 2, y - size / 4, size, size / 2); }
      });
    }

    _drawScenarioMarkers(ctx, w, h) {
      const state = this.world.state;
      if (!state || !state.scenarios) return;
      if (!this.world.layers.has('STORY')) return;
      Object.values(state.scenarios).forEach(s => {
        if (!s.locationId || s.status === 'HIDDEN' || s.status === 'COMPLETED') return;
        const loc = state.getLocation(s.locationId);
        if (!loc) return;
        const p = this._locScreen(loc, w, h);
        const energy = this.world.scenarioEnergy(s);
        const color = { LOW: '#6fe8d8', MEDIUM: '#ffcd68', HIGH: '#ef8a3a', CRITICAL: '#ef5a5a' }[energy] || '#6fe8d8';
        const pulse = energy === 'CRITICAL' ? (this._t % 12 < 6 ? 1 : 0.4) : (this._t % 40 < 20 ? 1 : 0.55);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = color;
        const r = energy === 'CRITICAL' ? 7 : energy === 'HIGH' ? 5 : 4;
        ctx.beginPath(); ctx.arc(p.x + 10, p.y - 26, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    _drawWeather(ctx, w, h) {
      const weather = this.world.weather;
      if (weather === 'RAIN' || weather === 'HEAVY_RAIN') {
        ctx.strokeStyle = 'rgba(150,180,220,0.5)';
        ctx.lineWidth = 1;
        const n = weather === 'HEAVY_RAIN' ? 60 : 30;
        for (let i = 0; i < n; i++) {
          const x = ((i * 97 + this._t * 6) % w);
          const y = ((i * 53 + this._t * 14) % h);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 6); ctx.stroke();
        }
      } else if (weather === 'FOG') {
        ctx.fillStyle = 'rgba(200,200,210,0.12)'; ctx.fillRect(0, 0, w, h);
      } else if (weather === 'STORM') {
        ctx.fillStyle = 'rgba(20,20,40,0.25)'; ctx.fillRect(0, 0, w, h);
      }
    }

    _drawTimeOfDay(ctx, w, h) {
      // Time-of-day wash over the whole world layer (§23).
      //
      // Needed because buildings no longer carry their own day / evening / night
      // files — one sprite per location now — so without this they read as noon
      // over an evening street. Deliberately much lighter than the ground tint;
      // see DM_TOD_SCENE_ALPHA for why the two cannot share a value.
      //
      // Runs after ground, roads, buildings, characters and vehicles, and before
      // _drawHUD — so the scene shares one wash and the HUD stays legible on top
      // of it rather than being dimmed with everything else.
      const tod = this.world.timeOfDay;
      const alpha = DM_TOD_SCENE_ALPHA[tod];
      if (alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = DM_TOD_TINTS[tod] || DM_TOD_TINTS.EVENING;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // subtle vignette by time (§23)
      if (this.world.timeOfDay === 'NIGHT' || this.world.timeOfDay === 'LATE_NIGHT') {
        const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
    }

    _drawHUD(ctx, w, h) {
      // minimal HUD (§71): top bar with location/time/weather
      ctx.fillStyle = 'rgba(8,8,10,0.7)';
      ctx.fillRect(0, 0, w, 16);
      ctx.fillStyle = '#ffcd68';
      ctx.font = '9px monospace';
      const todName = this.world.timeOfDay, wx = this.world.weather;
      const locName = (this.world.state && this.world.state.activeLocationId && this.world.state.getLocation)
        ? (this.world.state.getLocation(this.world.state.activeLocationId) || {}).name : '—';
      const district = this.world.districts.find(d => d.id === this.world.activeDistrictId);
      ctx.fillText(`${district ? district.name.toUpperCase() : ''} • ${todName} • ${wx} • ${locName}`, 6, 11);
      // bottom objective line (§71)
      ctx.fillStyle = 'rgba(8,8,10,0.7)';
      ctx.fillRect(0, h - 14, w, 14);
      ctx.fillStyle = '#6fe8d8';
      const active = (this.world.state && this.world.state.scenarios)
        ? Object.values(this.world.state.scenarios).filter(s => s.status === 'NEW' || s.status === 'AVAILABLE' || s.status === 'URGENT').length : 0;
      ctx.fillText(`ACTIVE SCENARIOS: ${active}   ZOOM: ${this.world.zoom}`, 6, h - 4);
    }

    _drawFallback(ctx, w, h) {
      ctx.fillStyle = '#1d2335'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffcd68'; ctx.font = '12px monospace';
      ctx.fillText('No world model attached.', 12, h / 2);
    }
  }

  return { DMWorldMapRenderer, TILE };
});
