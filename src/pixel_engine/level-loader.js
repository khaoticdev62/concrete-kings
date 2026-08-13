/**
 * Concrete Kings — Level Loader (PRD §134 / CRPG-MAP-PRD-002)
 *
 * A level is pure DATA. This module turns a level definition object into live
 * world state by calling the existing DMMapState editor APIs (createLocation,
 * addRoute, createScenario, addRumorNode, addScenarioChain, setCharacterGoal,
 * setRelationship, addThread, addObligation, defineEvent) and the DMWorldMap
 * presentation layer (districts, vehicles, routes, weather/time).
 *
 * No scenario logic is hard-coded into map objects — the level stays a SYSTEM
 * described by data (per the level-design spec: separate visual/nav/gameplay/
 * narrative maps, data-driven scene definitions).
 *
 * Source of truth: assets/generated/level-the-block.json (authored by the
 * LEAD LEVEL DESIGNER). This file is the loader only.
 */

(function (root, factory) {
  const mod = factory(
    (typeof require !== 'undefined') ? require('./dynamic-map-state.js') : (typeof window !== 'undefined' ? window : {}),
    (typeof require !== 'undefined') ? require('./dynamic-world-map.js') : (typeof window !== 'undefined' ? window : {})
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof window !== 'undefined') window.LevelLoader = mod;
})(this, function (stateDeps, worldDeps) {
  const DMMapState = stateDeps.DMMapState || (typeof window !== 'undefined' ? window.DMMapState : null);
  const DMTOD = (worldDeps.DM_TOD) || (typeof window !== 'undefined' ? window.DM_TOD : null);
  const DM_WEATHER = (worldDeps.DM_WEATHER) || (typeof window !== 'undefined' ? window.DM_WEATHER : null);

  /**
   * Load a level definition into a live DynamicMapSystem instance.
   * @param {object} engine  DynamicMapSystem (has .state and .worldMap)
   * @param {object} def     Level definition (see level-the-block.json schema)
   * @returns {object} summary {locations, routes, scenarios, characters, ...}
   */
  function loadLevel(engine, def) {
    if (!engine || !engine.state) throw new Error('loadLevel requires an engine with .state');
    const state = engine.state;
    const world = engine.worldMap;
    if (!def || !def.id) throw new Error('loadLevel requires a level definition with .id');

    // 1. Clean slate so the designed level fully replaces seed content.
    if (typeof state.resetWorld === 'function') state.resetWorld();
    else { Object.keys(state._locations || {}).forEach(k => delete state._locations[k]); }

    const log = { locations: 0, routes: 0, scenarios: 0, characters: 0, rumors: 0, chains: 0, events: 0, threads: 0, obligations: 0, factions: 0 };

    // 2. Factions (must exist before locations claim ownership).
    (def.factions || []).forEach(f => {
      // createLocation-style faction registration via state internals is not
      // exposed; reuse the seeded faction shape by writing through a helper.
      if (state._factions && !state._factions[f.id]) {
        state._factions[f.id] = {
          id: f.id, name: f.name, influence: f.influence != null ? f.influence : 0,
          controlledLocations: [], territory: f.territory || 'NEUTRAL'
        };
        log.factions++;
      } else if (state._factions && state._factions[f.id]) {
        Object.assign(state._factions[f.id], { name: f.name, influence: f.influence != null ? f.influence : state._factions[f.id].influence, territory: f.territory || state._factions[f.id].territory });
        log.factions++;
      }
    });

    // 3. Locations.
    (def.locations || []).forEach(l => {
      // The living-world renderer (_locScreen) positions markers from
      // normalized loc.x / loc.y (0..1). Our level data stores pixel-space
      // coordinates (0..960 / 0..540) for readability, so derive x/y here.
      const cx = (l.coordinates && l.coordinates.x) || 480;
      const cy = (l.coordinates && l.coordinates.y) || 270;
      state.createLocation({
        id: l.id, name: l.name, type: l.type, region_id: l.region_id || l.district_id || 'unknown',
        district_id: l.district_id || 'unknown',
        coordinates: { x: cx, y: cy },
        x: +(cx / 960).toFixed(4), y: +(cy / 540).toFixed(4),
        tags: l.tags || [], state: l.state || 'ACTIVE', faction: l.faction || 'neutral',
        discovered: l.discovered !== false
      });
      log.locations++;
    });

    // 4. Routes — authoritative in state, mirrored to worldMap for rendering.
    (def.routes || []).forEach(r => {
      state.addRoute({
        id: r.id, origin: r.origin, destination: r.destination,
        travel_time: r.travel_time || 1, cost: r.cost || 0, danger: r.danger != null ? r.danger : 0.3,
        tags: r.tags || []
      });
      if (world && world.addRoute) world.addRoute({ id: r.id, from: r.origin, to: r.destination, condition: r.condition || 'OPEN', discovered: r.discovered !== false, role: r.role || null });
      log.routes++;
    });

    // 5. Characters (with optional routine + goal).
    (def.characters || []).forEach(c => {
      state.addCharacter(c.id, {
        id: c.id, name: c.name, locationId: c.locationId || null, state: c.state || 'PRESENT',
        color: c.color, goals: c.goals
      });
      if (c.routine && typeof state.setCharacterSchedule === 'function') state.setCharacterSchedule(c.id, c.routine);
      if (c.goal && typeof state.setCharacterGoal === 'function') state.setCharacterGoal(c.id, c.goal);
      log.characters++;
    });

    // 6. Scenarios.
    (def.scenarios || []).forEach(s => {
      state.createScenario({
        id: s.id, locationId: s.locationId, type: s.type, title: s.title, summary: s.summary || '',
        participants: s.participants || ['player'], urgency: s.urgency || { level: 'moderate' },
        expiration: s.expiration || null, requirements: s.requirements || [],
        rewards: s.rewards || [], consequences: s.consequences || null,
        status: s.status || 'AVAILABLE', hidden: !!s.hidden, priority: s.priority || 0
      });
      log.scenarios++;
    });

    // 7. Rumor network.
    (def.rumors || []).forEach(r => {
      state.addRumorNode({
        id: r.id, text: r.text || '', truth: r.truth || 'UNVERIFIED', discovered: !!r.discovered,
        reveals: r.reveals || null, source: r.source || null, target: r.target || null, children: r.children || []
      });
      log.rumors++;
    });

    // 8. Scenario chains.
    (def.chains || []).forEach(ch => { state.addScenarioChain({ id: ch.id, nodes: ch.nodes || [] }); log.chains++; });

    // 9. Threads / obligations.
    (def.threads || []).forEach(t => { state.addThread(t); log.threads++; });
    (def.obligations || []).forEach(o => { state.addObligation(o); log.obligations++; });

    // 10. World events (definitions; triggered later by play or emergent rules).
    (def.events || []).forEach(e => { state.defineEvent(e); log.events++; });

    // 11. Relationships.
    (def.relationships || []).forEach(rel => {
      state.setRelationship(rel.from, rel.to, rel.value);
    });

    // 12. Presentation layer (worldMap): districts, vehicles, weather, time.
    if (world) {
      if (Array.isArray(def.districts)) world.districts = def.districts.map(d => Object.assign({}, d));
      if (Array.isArray(def.vehicles)) world.vehicles = def.vehicles.map(v => Object.assign({ dx: 0, dy: 0, color: '#444a55' }, v));
      if (def.weather && DM_WEATHER && Object.values(DM_WEATHER).includes(def.weather)) world.setWeather(def.weather);
      if (def.timeOfDay && DMTOD && Object.values(DMTOD).includes(def.timeOfDay)) world.setTimeOfDay(def.timeOfDay);
      if (def.activeDistrictId) world.setDistrict(def.activeDistrictId);
    }

    // 13. Initial world tick to evaluate scenario availability + NPC routines.
    if (typeof state.worldTick === 'function') { try { state.worldTick(); } catch (e) {} }

    // 14. Drop the player at the designed start location.
    const start = def.startLocationId || (def.locations && def.locations[0] && def.locations[0].id);
    if (start && state.getLocation(start)) {
      state.setLocation(start);
      if (typeof state._ensurePlayerPresence === 'function') state._ensurePlayerPresence();
      if (state._presence && state._presence.player) { state._presence.player.locationId = start; state._presence.player.state = 'PRESENT'; }
    }

    // 15. Final world tick AFTER the player is placed, so `player_present`
    // scenario requirements evaluate against the real start location.
    if (typeof state.worldTick === 'function') { try { state.worldTick(); } catch (e) {} }

    return log;
  }

  /**
   * Validate a level definition against the live engine: every scenario's
   * locationId must resolve, every participant must exist, every chain node
   * must exist. Returns { ok, errors:[] }.
   */
  function validateLevel(engine, def) {
    const errors = [];
    if (!engine || !engine.state) { errors.push('no engine/state'); return { ok: false, errors }; }
    const state = engine.state;
    (def.scenarios || []).forEach(s => {
      if (!state.getLocation(s.locationId)) errors.push(`scenario ${s.id} -> missing location ${s.locationId}`);
      (s.participants || []).forEach(p => { if (p !== 'player' && !state.getCharacter(p)) errors.push(`scenario ${s.id} -> missing participant ${p}`); });
    });
    (def.chains || []).forEach(ch => (ch.nodes || []).forEach(n => { if (!state.getScenario(n)) errors.push(`chain ${ch.id} -> missing node ${n}`); }));
    (def.routes || []).forEach(r => {
      if (!state.getLocation(r.origin)) errors.push(`route ${r.id} -> missing origin ${r.origin}`);
      if (!state.getLocation(r.destination)) errors.push(`route ${r.id} -> missing destination ${r.destination}`);
    });
    return { ok: errors.length === 0, errors };
  }

  return { loadLevel, validateLevel };
});
