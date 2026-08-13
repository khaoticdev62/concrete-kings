/**
 * CARD RPG — Pixel Narrative World Map (PRD CRPG-MAP-PRD-002 v2.0.0)
 *
 * Adapted for Concrete Kings' existing Dynamic Narrative Map + Scene Machine.
 * This is a STATE/CONTROLLER layer that wraps the existing DMMapState and adds
 * the "living pixel-art world" features:
 *   - WORLD/DISTRICT/LOCATION/SCENE visual hierarchy (§2/§4)
 *   - zoom levels CITY/DISTRICT/STREET/LOCATION (§5)
 *   - weather + time-of-day overlays (§22/§23)
 *   - map layer/mode filters STORY/WORLD/PEOPLE/RUMORS/FACTIONS (§72)
 *   - route conditions OPEN/CONGESTED/BLOCKED/DANGEROUS/SECRET/CONTROLLED (§70)
 *   - location visual states + consequence visualization (§20/§80)
 *   - ambient activity (cars/pedestrians/lights) as lightweight data (§3/§32)
 *   - map -> scene continuity + scene -> map consequence (§77/§79/§80)
 *   - world memory (burn marks, police tape, etc.) (§81/§82)
 *
 * It is DOM-free and deterministic so it is unit-testable in Node; the renderer
 * (dynamic-world-map-renderer.js) consumes this model.
 */
(function (root, factory) {
  const mod = factory(
    (typeof require !== 'undefined') ? require('./dynamic-map-state.js') : (typeof window !== 'undefined' ? window : {})
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof window !== 'undefined') {
    window.DMWorldMapModule = mod;
    window.DMWorldMap = mod.DMWorldMap;
    window.DM_ZOOM = mod.DM_ZOOM;
    window.DM_WEATHER = mod.DM_WEATHER;
    window.DM_TOD = mod.DM_TOD;
    window.DM_MAP_LAYERS = mod.DM_MAP_LAYERS;
    window.DM_ROUTE_COND = mod.DM_ROUTE_COND;
    window.DM_LOC_VISUAL = mod.DM_LOC_VISUAL;
    window.DM_SCENARIO_ENERGY = mod.DM_SCENARIO_ENERGY;
    window.DM_WORLD_MARKS = mod.DM_WORLD_MARKS;
    window.DM_DEFAULT_DISTRICTS = mod.DM_DEFAULT_DISTRICTS;
  }
})(this, function (deps) {
  const DMState = deps.DMMapState || (typeof window !== 'undefined' ? window.DMMapState : null);

  // ---- Zoom levels (§5) ----
  const DM_ZOOM = Object.freeze({ CITY: 'CITY', DISTRICT: 'DISTRICT', STREET: 'STREET', LOCATION: 'LOCATION' });
  const DM_ZOOM_ORDER = ['CITY', 'DISTRICT', 'STREET', 'LOCATION'];

  // ---- Weather (§22), first set CLEAR/RAIN (§101) ----
  const DM_WEATHER = Object.freeze({ CLEAR: 'CLEAR', CLOUDY: 'CLOUDY', RAIN: 'RAIN', HEAVY_RAIN: 'HEAVY_RAIN', FOG: 'FOG', SNOW: 'SNOW', STORM: 'STORM' });

  // ---- Time-of-day (§23), first set DAY/EVENING/NIGHT (§102) ----
  const DM_TOD = Object.freeze({ DAWN: 'DAWN', DAY: 'DAY', DUSK: 'DUSK', EVENING: 'EVENING', NIGHT: 'NIGHT', LATE_NIGHT: 'LATE_NIGHT' });

  // ---- Map layers / mode filters (§72) ----
  const DM_MAP_LAYERS = Object.freeze({ STORY: 'STORY', WORLD: 'WORLD', PEOPLE: 'PEOPLE', RUMORS: 'RUMORS', FACTIONS: 'FACTIONS' });

  // ---- Route conditions (§70) ----
  const DM_ROUTE_COND = Object.freeze({ OPEN: 'OPEN', CONGESTED: 'CONGESTED', BLOCKED: 'BLOCKED', DANGEROUS: 'DANGEROUS', SECRET: 'SECRET', CONTROLLED: 'CONTROLLED' });

  // ---- Location visual states (§20) -> consequence visualization (§80) ----
  const DM_LOC_VISUAL = Object.freeze({
    NORMAL: 'NORMAL', POLICE_ACTIVITY: 'POLICE_ACTIVITY', POLICE_TAPE: 'POLICE_TAPE',
    LOCKED: 'LOCKED', DAMAGED: 'DAMAGED', CLOSED: 'CLOSED', CELEBRATING: 'CELEBRATING', ABANDONED: 'ABANDONED'
  });

  // ---- Scenario marker energy (§35/§36) ----
  const DM_SCENARIO_ENERGY = Object.freeze({ LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' });

  // ---- World memory marks (§81) ----
  const DM_WORLD_MARKS = ['burn_marks', 'broken_windows', 'police_tape', 'graffiti', 'missing_sign', 'damaged_vehicle', 'new_guards', 'faction_marking'];

  // ---- Default districts for the first vertical slice (§96/§97) ----
  const DM_DEFAULT_DISTRICTS = [
    { id: 'downtown', name: 'Downtown', x: 0.5, y: 0.45, blurb: 'The neon heart of the city.' },
    { id: 'industrial', name: 'Industrial', x: 0.18, y: 0.7, blurb: 'Rail yards, warehouses, auto shops.' },
    { id: 'east_side', name: 'East Side', x: 0.82, y: 0.66, blurb: 'Clubs, motels, markets, safehouses.' }
  ];

  /**
   * DMWorldMap — controller over a DMMapState instance.
   * Owns the "living world" presentation state; reads gameplay truth from the
   * wrapped DMMapState (which remains the source of truth for locations/scenarios/
   * characters/rumors/factions/worldEvents/time/weather/feed).
   */
  class DMWorldMap {
    constructor(options) {
      options = options || {};
      this.state = options.state || (DMState ? new DMState(options) : null);
      this.zoom = options.zoom || DM_ZOOM.DISTRICT;
      this.activeDistrictId = options.activeDistrictId || 'downtown';
      this.weather = options.weather || DM_WEATHER.CLEAR;
      this.timeOfDay = options.timeOfDay || DM_TOD.EVENING;
      this.layers = new Set([DM_MAP_LAYERS.STORY, DM_MAP_LAYERS.WORLD, DM_MAP_LAYERS.PEOPLE, DM_MAP_LAYERS.RUMORS, DM_MAP_LAYERS.FACTIONS]);
      this.districts = options.districts || DM_DEFAULT_DISTRICTS.map(d => Object.assign({}, d));
      this.routes = options.routes || [];          // [{id, from, to, condition, discovered}]
      this.vehicles = options.vehicles || [];      // [{id, name, locationId, dx, dy, color}] (§99)
      this.ambient = [];                          // lightweight ambient actors (cars/peds/lights)
      this.worldMarks = {};                       // locationId -> [marks]
      this.ambientTick = 0;
      this._lastSceneInherit = null;
    }

    // ---------- zoom (§5) ----------
    setZoom(z) { if (DM_ZOOM_ORDER.includes(z)) { this.zoom = z; return true; } return false; }
    zoomIn() { const i = DM_ZOOM_ORDER.indexOf(this.zoom); if (i < DM_ZOOM_ORDER.length - 1) { this.zoom = DM_ZOOM_ORDER[i + 1]; return true; } return false; }
    zoomOut() { const i = DM_ZOOM_ORDER.indexOf(this.zoom); if (i > 0) { this.zoom = DM_ZOOM_ORDER[i - 1]; return true; } return false; }

    // ---------- weather / time (§22/§23) ----------
    setWeather(w) { if (Object.values(DM_WEATHER).includes(w)) { this.weather = w; return true; } return false; }
    setTimeOfDay(t) { if (Object.values(DM_TOD).includes(t)) { this.timeOfDay = t; return true; } return false; }

    // ---------- layers/modes (§72) ----------
    toggleLayer(layer) { if (!Object.values(DM_MAP_LAYERS).includes(layer)) return false; if (this.layers.has(layer)) this.layers.delete(layer); else this.layers.add(layer); return true; }
    setLayer(layer, on) { if (Object.values(DM_MAP_LAYERS).includes(layer)) { if (on) this.layers.add(layer); else this.layers.delete(layer); } }

    // ---------- districts + routes (§2/§69) ----------
    setDistrict(id) { if (this.districts.some(d => d.id === id)) { this.activeDistrictId = id; return true; } return false; }
    addRoute(r) { if (!r || !r.id) return false; this.routes.push(Object.assign({ condition: DM_ROUTE_COND.OPEN, discovered: true }, r)); return true; }
    routeCondition(routeId) { const r = this.routes.find(x => x.id === routeId); return r ? r.condition : null; }
    setRouteCondition(routeId, cond) { const r = this.routes.find(x => x.id === routeId); if (r && Object.values(DM_ROUTE_COND).includes(cond)) { r.condition = cond; return true; } return false; }

    // ---------- apply a §96 first-vertical-slice spec ----------
    // `slice` (from scripts/batch_generate_slice.cjs -> assets/generated/slice.json
    // and the window.MAP_SLICE JS global):
    //   { districts?, routes?, vehicles?, locations?, characters? }
    // Seeds locations/characters into the wrapped DMMapState (so the renderer
    // draws them), plus routes + vehicles on the world.
    //
    // If no explicit slice is passed, fall back to the window.MAP_SLICE global
    // (when running in the browser with map-slice.js loaded).
    applySlice(slice) {
      if (!slice && typeof window !== 'undefined' && window.MAP_SLICE) slice = window.MAP_SLICE;
      if (!slice) return false;
      if (Array.isArray(slice.locations) && this.state && this.state.addLocation) {
        slice.locations.forEach(l => this.state.addLocation(l.id, l));
      }
      if (Array.isArray(slice.characters) && this.state && this.state.addCharacter) {
        slice.characters.forEach(c => this.state.addCharacter(c.id, c));
      }
      if (Array.isArray(slice.routes)) slice.routes.forEach(r => this.addRoute(r));
      if (Array.isArray(slice.vehicles)) {
        // merge by id (don't duplicate)
        const seen = new Set(this.vehicles.map(v => v.id));
        slice.vehicles.forEach(v => { if (!seen.has(v.id)) this.vehicles.push(v); });
      }
      if (Array.isArray(slice.districts)) {
        // add any districts not already present
        const ids = new Set(this.districts.map(d => d.id));
        slice.districts.forEach(d => { if (!ids.has(d.id)) this.districts.push(Object.assign({}, d)); });
      }
      return true;
    }

    // ---------- location visual state + world memory (§20/§80/§81) ----------
    locationVisualState(locationId) {
      const loc = this.state && this.state.getLocation ? this.state.getLocation(locationId) : null;
      if (!loc) return DM_LOC_VISUAL.NORMAL;
      if (loc.state === 'LOCKED') return DM_LOC_VISUAL.LOCKED;
      if (loc.state === 'DESTROYED') return DM_LOC_VISUAL.DAMAGED;
      if (loc.state === 'CLOSED') return DM_LOC_VISUAL.CLOSED;
      if (loc.taped) return DM_LOC_VISUAL.POLICE_TAPE;
      if ((this.worldMarks[locationId] || []).includes('broken_windows') || (this.worldMarks[locationId] || []).includes('burn_marks')) return DM_LOC_VISUAL.DAMAGED;
      if (loc.policeActivity) return DM_LOC_VISUAL.POLICE_ACTIVITY;
      return DM_LOC_VISUAL.NORMAL;
    }
    addWorldMark(locationId, mark) {
      if (!DM_WORLD_MARKS.includes(mark)) return false;
      this.worldMarks[locationId] = this.worldMarks[locationId] || [];
      if (!this.worldMarks[locationId].includes(mark)) this.worldMarks[locationId].push(mark);
      return true;
    }
    worldMarksFor(locationId) { return this.worldMarks[locationId] || []; }

    // ---------- scenario marker energy (§35/§36) ----------
    scenarioEnergy(scenarioOrId) {
      const s = (typeof scenarioOrId === 'string' && this.state && this.state.getScenario)
        ? this.state.getScenario(scenarioOrId) : scenarioOrId;
      if (!s) return DM_SCENARIO_ENERGY.LOW;
      if (s.status === 'URGENT') return DM_SCENARIO_ENERGY.CRITICAL;
      if (s.status === 'EXPIRING') return DM_SCENARIO_ENERGY.HIGH;
      if (s.urgency && s.urgency.level === 'HIGH') return DM_SCENARIO_ENERGY.HIGH;
      if (s.urgency && s.urgency.level === 'MODERATE') return DM_SCENARIO_ENERGY.MEDIUM;
      return DM_SCENARIO_ENERGY.LOW;
    }

    // ---------- ambient activity (§3/§32) ----------
    // Deterministic pseudo-activity keyed by tick + seed (no Math.random in core
    // gameplay paths; ambient is decorative and seeded for replayability).
    tickAmbient(tick) {
      this.ambientTick = (typeof tick === 'number') ? tick : this.ambientTick + 1;
      // a small, stable pool of ambient actors that drift
      if (this.ambient.length === 0) {
        const kinds = ['car', 'ped', 'light', 'smoke'];
        for (let i = 0; i < 12; i++) {
          this.ambient.push({ id: 'amb_' + i, kind: kinds[i % kinds.length], x: (i * 53 % 100) / 100, y: (i * 31 % 100) / 100, phase: i });
        }
      }
      this.ambient.forEach(a => {
        const drift = 0.002 * ((this.ambientTick + a.phase) % 7);
        a.x = (a.x + drift) % 1;
        a.y = (a.y + drift * 0.5) % 1;
      });
      return this.ambient.length;
    }

    // ---------- map -> scene continuity (§77/§78) ----------
    // Build the scene-inheritance package so the Scene Machine / CARD RPG scene
    // inherits the player's current map context (same place, time, weather, people).
    sceneInheritsFromMap(scenarioId) {
      const s = this.state && this.state.getScenario ? this.state.getScenario(scenarioId) : null;
      const loc = (s && s.locationId && this.state.getLocation) ? this.state.getLocation(s.locationId) : null;
      const pkg = {
        scenarioId,
        locationId: loc ? loc.id : this.state.activeLocationId,
        locationName: loc ? loc.name : null,
        timeOfDay: this.timeOfDay,
        weather: this.weather,
        districtId: this.activeDistrictId,
        participants: (loc && loc.characters) ? loc.characters.slice() : (s && s.participants ? s.participants.slice() : []),
        worldStateSnapshot: this._snapshotWorld()
      };
      this._lastSceneInherit = pkg;
      return pkg;
    }

    _snapshotWorld() {
      if (!this.state) return {};
      const out = { relationships: {}, flags: [] };
      if (this.state.characters) {
        Object.values(this.state.characters).forEach(c => {
          if (c.relationships) Object.assign(out.relationships, c.relationships);
        });
      }
      if (this.state.relationships) Object.assign(out.relationships, this.state.relationships);
      return out;
    }

    // ---------- scene -> map consequence (§79/§80) ----------
    // Apply a resolved scene result back onto the map so the world visibly changes.
    applySceneResultToMap(result) {
      if (!result || !result.scenarioId) return false;
      const sc = this.state && this.state.getScenario ? this.state.getScenario(result.scenarioId) : null;
      const locId = (sc && sc.locationId) || (result.effects && result.effects[0] && result.effects[0].locationId);
      const effects = result.effects || [];
      effects.forEach(e => {
        if (!e) return;
        const lid = e.locationId || locId;
        if (e.type === 'location_state' && lid) {
          const loc = this.state.getLocation(lid);
          if (loc) {
            if (e.value === 'POLICE_TAPE') { loc.taped = true; loc.policeActivity = true; }
            else if (e.value === 'DAMAGED') { this.addWorldMark(lid, 'broken_windows'); loc.state = 'DESTROYED'; }
            else if (e.value === 'CLOSED') { loc.state = 'CLOSED'; }
            else if (e.value === 'LOCKED') { loc.state = 'LOCKED'; }
          }
        }
        if (e.type === 'world_mark' && lid) this.addWorldMark(lid, e.value);
      });
      // if the scenario failed/confrontation, mark consequence on the map
      if (result.outcome === 'FAILURE' || result.outcome === 'CHAOTIC_FAILURE') {
        if (locId) { this.addWorldMark(locId, 'police_tape'); const l = this.state.getLocation(locId); if (l) l.policeActivity = true; }
      }
      if (sc && this.state.emit) this.state.emit('map_consequence_applied', { scenarioId: result.scenarioId, locationId: locId });
      return true;
    }

    // ---------- serialization (save/load, §53 style consistency) ----------
    snapshot() {
      return {
        zoom: this.zoom, activeDistrictId: this.activeDistrictId, weather: this.weather,
        timeOfDay: this.timeOfDay, layers: Array.from(this.layers),
        routes: this.routes.slice(), worldMarks: JSON.parse(JSON.stringify(this.worldMarks))
      };
    }
    restore(snap) {
      if (!snap) return;
      if (snap.zoom) this.zoom = snap.zoom;
      if (snap.activeDistrictId) this.activeDistrictId = snap.activeDistrictId;
      if (snap.weather) this.weather = snap.weather;
      if (snap.timeOfDay) this.timeOfDay = snap.timeOfDay;
      if (Array.isArray(snap.layers)) this.layers = new Set(snap.layers);
      if (Array.isArray(snap.routes)) this.routes = snap.routes.slice();
      if (snap.worldMarks) this.worldMarks = snap.worldMarks;
    }
  }

  return {
    DMWorldMap, DM_ZOOM, DM_ZOOM_ORDER, DM_WEATHER, DM_TOD, DM_MAP_LAYERS,
    DM_ROUTE_COND, DM_LOC_VISUAL, DM_SCENARIO_ENERGY, DM_WORLD_MARKS, DM_DEFAULT_DISTRICTS
  };
});
