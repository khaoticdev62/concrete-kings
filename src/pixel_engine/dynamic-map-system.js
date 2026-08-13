/**
 * Concrete Kings: Dynamic Narrative Map — System facade
 *
 * Owns state, renderer, UI. Exposes simple methods for app.
 */

class DynamicMapSystem {
  constructor(options = {}) {
    const deps = DynamicMapSystem._loadDeps();
    this.bus = (deps.DMEventBus) ? new deps.DMEventBus() : null;
    this.state = new deps.DMMapState(Object.assign({ bus: this.bus }, options));
    this.camera = new deps.DMCamera({ bounds: { x: 0, y: 0, w: 960, h: 540 } });
    this.assets = deps.DMAssetManager ? new deps.DMAssetManager(options.assetBase) : null;
    // When a generated asset finishes loading, redraw the living-world map so
    // sprites replace the geometric glyph fallback (images load async).
    if (this.assets) {
      this.assets.onImageLoaded = () => { if (this.worldRenderer) this.worldRenderer.render(); };
    }
    this.renderer = new deps.DMRenderer(Object.assign({ canvas: options.canvas, camera: this.camera, assets: this.assets }, options));
    this.ui = new deps.DMUI(this.state);
    // CRPG-MAP-PRD-002: living pixel-art world map layer over the existing state
    this.worldMap = (deps.DMWorldMap) ? new deps.DMWorldMap({ state: this.state }) : null;

    // Relay world marks from state to the world map.
    //
    // The marks live on DMWorldMap and the consequences that create them are
    // applied on DMMapState, which has no reference to the world by design.
    // Without this bridge, applyConsequence's worldMark effects and every
    // conditional POI turn on in state and never appear on the map — which is
    // exactly how they behaved before: authored, applied, invisible.
    if (this.worldMap && typeof this.state.on === 'function') {
      this.state.on('worldMarkAdded', ({ locationId, mark }) => {
        this.worldMap.addWorldMark(locationId, mark);
        this.renderFrame();
      });
    }
    // §96/§134 — load the designed level (THE BLOCK) if a level definition is
    // provided (browser: window.MAP_LEVEL; Node: passed via options.levelDef).
    // This is the single source of truth for the playable level; it replaces the
    // minimal seed world with a fully designed, data-driven neighborhood.
    if (this.worldMap) {
      const levelDef = (typeof window !== 'undefined' && window.MAP_LEVEL)
        ? window.MAP_LEVEL
        : (options.levelDef || null);
      if (levelDef && deps.LevelLoader) {
        try { deps.LevelLoader.loadLevel(this, levelDef); this.levelId = levelDef.id; }
        catch (e) { /* fall back to seed world */ }
      }
    }
    // §53/§57/§59 — generated asset registry so the world renderer draws the
    // Aseprite-MCP-produced PNGs from assets/generated/ instead of glyphs.
    this.assetRegistry = (deps.MapAssetRegistry)
      ? (typeof window !== 'undefined' && window.MAP_ASSET_MANIFEST)
        ? new deps.MapAssetRegistry().fromPaths(window.MAP_ASSET_MANIFEST)
        : (typeof require !== 'undefined')
          ? new deps.MapAssetRegistry().scanSync('assets/generated', 'generated/')
          : new deps.MapAssetRegistry()
      : null;
    this.worldRenderer = (deps.DMWorldMapRenderer && this.worldMap) ? new deps.DMWorldMapRenderer({ canvas: options.canvas, world: this.worldMap, assets: this.assets, assetRegistry: this.assetRegistry }) : null;
    this.useWorldView = true; // default to the new living-world presentation
    // §99/§116/§117/§120 — global services, audio director, player-experience tracker
    this.services = (deps.DMGlobalServices) ? new deps.DMGlobalServices(options.services || {}) : null;
    this.audio = (deps.DMAudioDirector && this.bus) ? new deps.DMAudioDirector(this.bus, this.services) : null;
    this.playerExperience = (deps.DMPlayerExperience) ? new deps.DMPlayerExperience() : null;
    this.onboarding = (deps.DMOnboarding) ? new deps.DMOnboarding() : null;
    // §121-§131 UX systems
    this.haptics = (deps.DMHaptics) ? new deps.DMHaptics(this.bus) : null;
    this.transitions = (deps.DMTransitionDirector) ? new deps.DMTransitionDirector(this.bus) : null;
    this.narrative = (deps.DMNarrativeFeedback) ? new deps.DMNarrativeFeedback() : null;
    this.minigame = (deps.DMMinigameBridge) ? new deps.DMMinigameBridge() : null;
    this.economy = (deps.DMEconomyModel) ? new deps.DMEconomyModel() : null;
    // §138-§144 quality & acceptance
    this.perf = (deps.DMPerfMonitor) ? new deps.DMPerfMonitor() : null;
    this.memory = (deps.DMMemoryBudget) ? new deps.DMMemoryBudget() : null;
    this.qualityGate = (deps.DMQualityGate) ? new deps.DMQualityGate() : null;
    this.dod = (deps.DMDefinitionOfDone) ? new deps.DMDefinitionOfDone() : null;
    this.contract = (deps.DMArchitecturalContract) ? new deps.DMArchitecturalContract() : null;
    this.designRule = (deps.DMCoreDesignRule) ? new deps.DMCoreDesignRule() : null;
    this.initialized = false;
    this.lastFrame = 0;
    this.raf = null;
    // focus camera on active location initially
    const loc = this.state.getLocation(this.state.activeLocationId);
    if (loc) this.camera.focusOnLocation(loc);
  }

  // Resolve sibling modules without re-declaring their top-level names.
  // In the browser all <script> files share one global scope, so declaring
  // DMMapState/DMRenderer/DMUI here would collide. In Node we require them.
  static _loadDeps() {
    if (typeof window !== 'undefined' && window.DMMapState) {
      return {
        DMMapState: window.DMMapState,
        DMMapModes: window.DMMapModes,
        DMMapTimeBlocks: window.DMMapTimeBlocks,
        DMRenderer: window.DMRenderer,
        DMUI: window.DMUI,
        DMCamera: window.DMCamera,
        DMAssetManager: window.DMAssetManager,
        DMEventBus: window.DMEventBus,
        DMGlobalServices: window.DMGlobalServices,
        DMAudioDirector: window.DMAudioDirector,
        DMPlayerExperience: window.DMPlayerExperience,
        DMOnboarding: window.DMOnboarding,
        DMHaptics: window.DMHaptics,
        DMTransitionDirector: window.DMTransitionDirector,
        DMNarrativeFeedback: window.DMNarrativeFeedback,
        DMMinigameBridge: window.DMMinigameBridge,
        DMEconomyModel: window.DMEconomyModel,
        DMPerfMonitor: window.DMPerfMonitor,
        DMMemoryBudget: window.DMMemoryBudget,
        DMQualityGate: window.DMQualityGate,
        DMDefinitionOfDone: window.DMDefinitionOfDone,
        DMArchitecturalContract: window.DMArchitecturalContract,
        DMCoreDesignRule: window.DMCoreDesignRule,
        DMWorldMap: window.DMWorldMap,
        DMWorldMapRenderer: window.DMWorldMapRenderer,
        MapAssetRegistry: window.MapAssetRegistry,
        LevelLoader: window.LevelLoader
      };
    }
    if (typeof require !== 'undefined') {
      const s = require('./dynamic-map-state.js');
      const r = require('./dynamic-map-renderer.js');
      const u = require('./dynamic-map-ui.js');
      const c = require('./dynamic-map-camera.js');
      const a = require('./dynamic-map-assets.js');
      const e = require('./dynamic-map-eventbus.js');
      const svc = require('./dynamic-map-services.js');
      const x = require('./dynamic-map-ux.js');
      const q = require('./dynamic-map-quality.js');
      const wm = require('./dynamic-world-map.js');
      const wmr = require('./dynamic-world-map-renderer.js');
      return {
        DMMapState: s.DMMapState,
        DMMapModes: s.DMMapModes,
        DMMapTimeBlocks: s.DMMapTimeBlocks,
        DMRenderer: r.DMRenderer,
        DMUI: u.DMUI,
        DMCamera: c.DMCamera,
        DMAssetManager: a.DMAssetManager,
        DMEventBus: e.DMEventBus,
        DMGlobalServices: svc.DMGlobalServices,
        DMAudioDirector: svc.DMAudioDirector,
        DMPlayerExperience: svc.DMPlayerExperience,
        DMOnboarding: svc.DMOnboarding,
        DMHaptics: x.DMHaptics,
        DMTransitionDirector: x.DMTransitionDirector,
        DMNarrativeFeedback: x.DMNarrativeFeedback,
        DMMinigameBridge: x.DMMinigameBridge,
        DMEconomyModel: x.DMEconomyModel,
        DMPerfMonitor: q.DMPerfMonitor,
        DMMemoryBudget: q.DMMemoryBudget,
        DMQualityGate: q.DMQualityGate,
        DMDefinitionOfDone: q.DMDefinitionOfDone,
        DMArchitecturalContract: q.DMArchitecturalContract,
        DMCoreDesignRule: q.DMCoreDesignRule,
        DMWorldMap: wm.DMWorldMap,
        DMWorldMapRenderer: wmr.DMWorldMapRenderer,
        MapAssetRegistry: require('./map-asset-registry.js').MapAssetRegistry,
        LevelLoader: require('./level-loader.js').LevelLoader
      };
    }
    return {
      DMMapState: null, DMMapModes: null, DMMapTimeBlocks: null,
      DMRenderer: null, DMUI: null, DMCamera: null
    };
  }

  init(app) {
    this.initialized = true;
    this.ui.init(this.state, app);
    // Wire the renderer(s) to the real canvas in the DOM (browser only).
    if (typeof document !== 'undefined') {
      const c = document.getElementById('narrativeMapCanvas');
      if (c) {
        if (!this.renderer.canvas) this.renderer.canvas = c;
        // the living-world renderer is what's actually drawn — make sure it's
        // bound to the canvas or nothing renders.
        if (this.worldRenderer && !this.worldRenderer.canvas) this.worldRenderer.canvas = c;
      }
    }
    this.updateStatusBarFromState();
    if (typeof document !== 'undefined') this.ui.renderDebug && this.ui.renderDebug();
  }

  updateStatusBarFromState() {
    const loc = this.state.getLocation(this.state.activeLocationId);
    const name = loc ? loc.name : 'Unknown';
    if (this.ui.els.topLocation) this.ui.els.topLocation.textContent = name.toUpperCase();
    if (this.ui.els.topTime) this.ui.els.topTime.textContent = this.state.timeBlock;
    if (this.ui.els.topStatus) {
      const app = this.ui.app || {};
      const game = app.game || {};
      const players = Array.isArray(game.players) ? game.players : [];
      const idx = typeof app.humanIndex === 'number' ? app.humanIndex : 0;
      const player = players[idx];
      const rep = player && player.stats ? player.stats.reputation : 0;
      this.ui.els.topStatus.textContent = `REP ${rep} · ${game.weatherMode || 'CLEAR'}`;
    }
  }

  show() {
    if (!this.initialized) return;
    this.updateStatusBarFromState();
    this.ui._buildModeRail();
    this.ui.renderFeed(this.state.feed);
    this.ui.renderNodeDetails(this.state.selectedNodeId);
    this.renderFrame();
  }

  hide() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  setMode(mode) {
    this.state.setMode(mode);
    this.updateStatusBarFromState();
    this.renderFrame();
  }

  // ---- camera control (PRD §11/§12) ----
  cameraPan(dx, dy) { this.camera.pan(dx, dy); this.renderFrame(); }
  cameraZoomBy(factor, fx, fy) { this.camera.zoomBy(factor, fx, fy); this.renderFrame(); }
  cameraZoomIn() { this.camera.zoomIn(); this.renderFrame(); }
  cameraZoomOut() { this.camera.zoomOut(); this.renderFrame(); }
  cameraFocusLocation(locationId) {
    const loc = this.state.getLocation(locationId);
    if (loc) { this.camera.focusOnLocation(loc); this.renderFrame(); }
  }
  cameraSetZoomLevel(level) { this.camera.setZoomLevel(level); this.renderFrame(); }
  cameraCycleZoom(dir) { this.camera.nextZoomLevel(dir); this.renderFrame(); }

  // Interpolation tick (called from the game loop / rAF). dt in ms.
  tick(dt) {
    if (this.camera) this.camera.update(dt);
    if (this.renderer) {
      this.renderer.pulse = (this.renderer.pulse == null ? 0 : this.renderer.pulse) + dt * 0.004;
    }
    this.renderFrame();
  }

  travelTo(locationId) {
    const result = this.state.travelTo(locationId);
    if (result && result.ok) {
      this.updateStatusBarFromState();
      this.ui.renderNodeDetails(locationId);
      this.ui.renderFeed(this.state.feed);
      const loc = this.state.getLocation(locationId);
      this.ui.showOverlay('Arriving in ' + loc.name, '<div style="color:#cbd5ed;">' + loc.type + '</div>');
      this.renderFrame();
    }
    return result;
  }

  showArrivalOverlay(locationId) {
    const loc = this.state.getLocation(locationId);
    if (!loc) return;
    this.ui.showOverlay('Arriving in ' + loc.name, '<div style="color:#cbd5ed;">' + loc.type + '</div>');
  }

  selectLocation(locationId) {
    if (!this.state.getLocation(locationId)) return;
    this.state.setLocation(locationId);
    this.ui.renderNodeDetails(locationId);
    this.renderFrame();
  }

  selectNode(nodeId) {
    this.state.selectNode(nodeId);
    const scen = this.state.getScenario(nodeId);
    if (scen && scen.status !== 'HIDDEN' && scen.status !== 'LOCKED') {
      this.ui.showScenarioCard(nodeId);
    } else if (scen && scen.status === 'LOCKED') {
      this.ui.showOverlay('Locked', '<div style="color:#cbd5ed;">Requirements: ' + scen.requirements.join(', ') + '</div>');
    } else {
      this.ui.renderNodeDetails(this.state.activeLocationId);
    }
    this.renderFrame();
  }

  playScenario(scenarioId) {
    let handoff = this.state.handoffToScene(scenarioId);
    // §143/v2: the CARD RPG loop must be reachable even if the player isn't
    // physically at the scenario's location yet — travel there first, then hand off.
    if (!handoff) {
      const sc = this.state.getScenario(scenarioId);
      if (sc && sc.locationId && this.state.activeLocationId !== sc.locationId) {
        this.state.travelTo(sc.locationId);
        handoff = this.state.handoffToScene(scenarioId);
      }
    }
    if (!handoff) return null;
    // CRPG-MAP-PRD-002 §77/§78: capture the map context the scene inherits.
    if (this.worldMap) this._sceneInherit = this.worldMap.sceneInheritsFromMap(scenarioId);
    if (this.ui.app && typeof this.ui.app.launchScenarioScene === 'function') {
      this.ui.app.launchScenarioScene(handoff);
    }
    return handoff;
  }

  returnFromScene(result) {
    this.state.returnFromScene(result);
    // CRPG-MAP-PRD-002 §79/§80: apply the resolved scene result back onto the
    // living world so locations visibly change (police tape, damage, etc.).
    if (this.worldMap && result) this.worldMap.applySceneResultToMap(result);
    if (this.ui.renderStatusBar) this.ui.renderStatusBar();
    this.ui.renderNodeDetails(this.state.activeLocationId);
    this.renderFrame();
  }

  // ---------- CRPG-MAP-PRD-002 living-world controls ----------
  renderWorld(tick) {
    if (!this.worldRenderer) return;
    this.worldRenderer.render(tick);
  }
  worldZoomIn() { if (this.worldMap && this.worldMap.zoomIn()) this.renderWorld(); }
  worldZoomOut() { if (this.worldMap && this.worldMap.zoomOut()) this.renderWorld(); }
  worldSetWeather(w) { if (this.worldMap && this.worldMap.setWeather(w)) this.renderWorld(); }
  worldSetTime(t) { if (this.worldMap && this.worldMap.setTimeOfDay(t)) this.renderWorld(); }
  worldToggleLayer(layer) { if (this.worldMap && this.worldMap.toggleLayer(layer)) this.renderWorld(); }
  worldSetDistrict(id) { if (this.worldMap && this.worldMap.setDistrict(id)) this.renderWorld(); }
  worldTickAmbient(tick) { if (this.worldMap) { this.worldMap.tickAmbient(tick); this.renderWorld(tick); } }
  getSceneInherit() { return this._sceneInherit || null; }

  applyConsequence(effect) {
    this.state.applyConsequence(effect);
    this.ui.renderNodeDetails(this.state.activeLocationId);
    this.renderFrame();
  }

  dismissOverlay() {
    this.state.closeOverlay();
    if (this.ui.els.overlay) this.ui.els.overlay.style.display = 'none';
    this.ui.renderNodeDetails(this.state.activeLocationId);
    this.renderFrame();
  }

  // Open the §112/§113 developer panel (dev-only tooling)
  openDevTools(parentId) {
    if (typeof DMDevTools === 'undefined' && typeof require !== 'undefined') {
      try { DMDevTools = require('./dynamic-map-devtools.js').DMDevTools; } catch (e) { return; }
    }
    if (typeof DMDevTools === 'undefined') return;
    if (!this._devTools) this._devTools = new DMDevTools(this.state, this);
    this._devTools.mount(parentId || 'blockMap');
    this._devTools.render();
    return this._devTools;
  }

  advanceTime(block) {
    this.state.advanceTime(block);
    if (this.ui.renderStatusBar) this.ui.renderStatusBar();
    this.updateStatusBarFromState();
    this.ui.renderFeed(this.state.feed);
    this.renderFrame();
  }

  handleScenarioOutcome(outcome) {
    if (!outcome || !outcome.text) return;
    this.state.pushFeed({ text: outcome.text });
    this.ui.renderFeed(this.state.feed);
    this.renderFrame();
  }

  renderFrame(ctx) {
    // Honor a canvas/ctx passed externally (e.g. mapFrameTick) by wiring it in.
    if (ctx && ctx.canvas) this.renderer.canvas = ctx.canvas;
    if (this.useWorldView && this.worldRenderer) {
      if (typeof requestAnimationFrame === 'function') {
        if (this.raf) return;
        this.raf = requestAnimationFrame(() => {
          this.raf = null;
          this.worldRenderer.render();
        });
        return;
      }
      this.worldRenderer.render();
      return;
    }
    if (typeof requestAnimationFrame === 'function') {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = null;
        this.renderer.render(this.state);
      });
      return;
    }
    this.renderer.render(this.state);
  }

  // ---------- level loading (PRD §134) ----------
  // Loads a data-driven level definition (assets/generated/level-*.json) into
  // the live world via the LevelLoader. The level is the single source of
  // truth for locations/routes/scenarios/NPCs/etc.
  loadLevel(def) {
    if (!this.LevelLoader) this.LevelLoader = (typeof require !== 'undefined') ? require('./level-loader.js').LevelLoader : (typeof window !== 'undefined' ? window.LevelLoader : null);
    if (!this.LevelLoader) return { ok: false, error: 'LevelLoader unavailable' };
    const result = this.LevelLoader.loadLevel(this, def);
    this.levelId = def && def.id;
    // re-apply the window.MAP_SLICE sprite manifest (character/vehicle markers)
    // is unnecessary here; the level defines its own vehicles/characters.
    this.renderFrame();
    return { ok: true, result };
  }

  snapshot() {
    return this.state.snapshot();
  }

  restore(snap) {
    this.state.restore(snap);
    this.updateStatusBarFromState();
    this.ui.renderFeed(this.state.feed);
    this.renderFrame();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DynamicMapSystem };
}
if (typeof window !== 'undefined') {
  window.DynamicMapSystem = DynamicMapSystem;
}
