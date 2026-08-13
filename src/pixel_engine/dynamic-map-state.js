/**
 * Concrete Kings: Dynamic Narrative Map — State
 *
 * PRD-aligned (CRPG-MAP-PRD-001 v1.0.0) deterministic data model.
 * Covers MVP (§134) + Phase 2 (§136): camera-external state, NPC routines,
 * obligations, threads, faction territories, world events, scenario generation
 * pipeline, relationships, save versioning, debug commands.
 *
 * Pure state + event bus. No DOM, no canvas.
 * The map NEVER mutates authoritative game state (PRD §7). Core systems
 * own money/relationships/inventory; the map only displays and requests.
 */

const DM_MAP_SCHEMA_VERSION = 2;   // bumped for Phase 2 structures (§104)
const DM_WORLD_SCHEMA_VERSION = 2;
const DM_SCENARIO_SCHEMA_VERSION = 2;

const DMMapModes = Object.freeze({
  STORY: 'STORY', WORLD: 'WORLD', PEOPLE: 'PEOPLE', RUMORS: 'RUMORS', FACTIONS: 'FACTIONS'
});

// PRD §47 — narrative time blocks
const DMMapTimeBlocks = Object.freeze({
  MORNING: 'MORNING', AFTERNOON: 'AFTERNOON', EVENING: 'EVENING',
  NIGHT: 'NIGHT', LATE_NIGHT: 'LATE_NIGHT'
});
const DM_TIME_ORDER = Object.values(DMMapTimeBlocks);

// PRD §17 — location states
const DMLocationStates = Object.freeze({
  SAFE: 'SAFE', ACTIVE: 'ACTIVE', TENSE: 'TENSE', DANGEROUS: 'DANGEROUS',
  LOCKED: 'LOCKED', UNDER_SURVEILLANCE: 'UNDER_SURVEILLANCE', COMPROMISED: 'COMPROMISED',
  ABANDONED: 'ABANDONED', DAMAGED: 'DAMAGED', DESTROYED: 'DESTROYED', SPECIAL_EVENT: 'SPECIAL_EVENT'
});

// PRD §27 — scenario types
const DMScenarioTypes = Object.freeze([
  'STORY', 'SOCIAL', 'INVESTIGATION', 'ESCAPE', 'HEIST', 'COMBAT',
  'NEGOTIATION', 'ROMANCE', 'MYSTERY', 'MINIGAME', 'TRAVEL',
  'RANDOM_EVENT', 'CHARACTER', 'FACTION', 'BOSS'
]);

// PRD §28 — scenario visual states
const DMScenarioStates = Object.freeze({
  HIDDEN: 'HIDDEN', NEW: 'NEW', AVAILABLE: 'AVAILABLE', URGENT: 'URGENT',
  EXPIRING: 'EXPIRING', LOCKED: 'LOCKED', COMPLETED: 'COMPLETED', FAILED: 'FAILED',
  MISSED: 'MISSED', COMPROMISED: 'COMPROMISED'
});

// PRD §21 — character presence states
const DMCharacterStates = Object.freeze({
  PRESENT: 'PRESENT', TRAVELING: 'TRAVELING', EXPECTED: 'EXPECTED', MISSING: 'MISSING',
  HIDDEN: 'HIDDEN', UNAVAILABLE: 'UNAVAILABLE', CAPTURED: 'CAPTURED', INJURED: 'INJURED', DEAD: 'DEAD'
});

// PRD §57 — faction territory states
const DMFactionTerritoryStates = Object.freeze({
  CONTROLLED: 'CONTROLLED', CONTESTED: 'CONTESTED', NEUTRAL: 'NEUTRAL',
  OCCUPIED: 'OCCUPIED', UNSTABLE: 'UNSTABLE', ABANDONED: 'ABANDONED'
});

// PRD §923 — rumor truth states
const DMRumorStates = Object.freeze({ TRUE: 'TRUE', FALSE: 'FALSE', UNVERIFIED: 'UNVERIFIED' });

const DM_RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'SEVERE', 'EXTREME'];
const DM_REWARD_LEVELS = ['SMALL', 'MODERATE', 'VALUABLE', 'MAJOR', 'UNIQUE'];

// PRD §67 — configurable priority weights
const DM_PRIORITY_WEIGHTS = Object.freeze({
  story_relevance: 3, relationship_relevance: 2, urgency: 3, player_relevance: 2,
  world_relevance: 1, novelty: 1, consequence_value: 2
});

// PRD §68 — active node limit
const DM_ACTIVE_NODE_MIN = 3;
const DM_ACTIVE_NODE_MAX = 7;

class DMMapState {
  constructor(options = {}) {
    this.app = options.app || null;
    this.mode = DMMapModes.STORY;
    this.timeBlock = DMMapTimeBlocks.EVENING;
    this.activeLocationId = null;
    this.selectedNodeId = null;
    this.overlayOpen = false;
    this.listeners = new Map();
    this.feed = [];
    // §100 event bus (optional): if a DMEventBus is provided we bridge emits to it
    this.bus = options.bus || null;
    this._seedWorld();
  }

  // ---- event bus ----
  on(evt, fn) { if (!this.listeners.has(evt)) this.listeners.set(evt, []); this.listeners.get(evt).push(fn); return this; }
  emit(evt, payload) {
    (this.listeners.get(evt) || []).forEach(fn => { try { fn(payload); } catch (e) {} });
    if (this.bus) this.bus.emit(evt, payload); // bridge to §100 bus
  }

  // ---- map modes (PRD §8, §9 default STORY) ----
  setMode(mode) {
    if (!Object.values(DMMapModes).includes(mode)) return;
    if (this.mode === mode) return;
    this.mode = mode;
    this.emit('modeChange', { mode });
  }

  setLocation(locationId) {
    const loc = this.getLocation(locationId);
    if (!loc) return;
    this.activeLocationId = locationId;
    if (loc.discovered === false) loc.discovered = true;
    this.emit('locationChange', { locationId });
  }

  selectNode(nodeId) {
    this.selectedNodeId = nodeId || null;
    this.emit('select', { nodeId: this.selectedNodeId });
  }

  openOverlay() { this.overlayOpen = true; }
  closeOverlay() { this.overlayOpen = false; }

  pushFeed(item) {
    const entry = {
      id: Date.now() + ':' + Math.random().toString(36).slice(2, 7),
      text: item && item.text ? item.text : '',
      kind: item && item.kind ? item.kind : 'event',
      timeBlock: this.timeBlock
    };
    this.feed = [entry, ...this.feed].slice(0, 40);
    this.emit('feedUpdate', this.feed);
  }

  // ---- travel (PRD §50) ----
  travelTo(locationId, routeId) {
    const dest = this.getLocation(locationId);
    if (!dest) return { ok: false, reason: 'no-location' };
    if (dest.state === DMLocationStates.DESTROYED || dest.state === DMLocationStates.LOCKED) {
      return { ok: false, reason: 'unavailable' };
    }
    const origin = this.getLocation(this.activeLocationId);
    if (origin) this._setPresenceAt(origin.id, null);
    this.setLocation(locationId);
    this._ensurePlayerPresence();
    this._presence.player.locationId = locationId;
    this._presence.player.state = DMCharacterStates.PRESENT;
    this.advanceTime();
    this.pushFeed({ text: `Traveled to ${dest.name}`, kind: 'travel' });
    this.emit('travel', { from: origin && origin.id, to: locationId, routeId });
    return { ok: true };
  }

  // ---- time (PRD §47/§48) ----
  advanceTime(block) {
    const next = block || DM_TIME_ORDER[(DM_TIME_ORDER.indexOf(this.timeBlock) + 1) % DM_TIME_ORDER.length];
    this.timeBlock = next;
    this.worldTick();
    this.emit('timeChange', { timeBlock: this.timeBlock });
    this.emit('time_advanced', { timeBlock: this.timeBlock });
  }

  // PRD §49 world tick
  worldTick() {
    this._updateNpcRoutines();
    this._updateNpcGoals();          // §24 autonomous goals
    this._updateFactionConflicts();  // §137 dynamic faction conflicts
    this._updateEvents();
    this._expireOpportunities();
    this._recalculateScenarios();
    this._propagateRumors();         // §34/§137 advanced rumor networks
    this._updateFactions();
    this._runScenarioDirector();
    this._generateEmergentEvents();  // §137 emergent world events
    this.emit('worldTick', { timeBlock: this.timeBlock });
  }

  // ---- queries ----
  getLocation(id) { return this._locations[id] || null; }
  getRoute(id) { return this._routes[id] || null; }
  getScenario(id) { return this._scenarios[id] || null; }
  getCharacter(id) { return this._characters[id] || null; }
  getRumor(id) { return this._rumors[id] || null; }
  getFaction(id) { return this._factions[id] || null; }
  getThread(id) { return this._threads[id] || null; }
  getObligation(id) { return this._obligations[id] || null; }
  getEvent(id) { return this._events[id] || null; }

  // Enumerable collection accessors — the world-map renderer iterates these
  // (state.locations / state.characters / state.scenarios). Data is stored
  // privately (_locations etc.), so expose arrays here.
  get locations() { return Object.values(this._locations); }
  get characters() { return Object.values(this._characters); }
  get scenarios() { return Object.values(this._scenarios); }

  // Mutators used to seed a vertical-slice (§96) into the live map.
  addLocation(id, data) {
    if (!id) return null;
    this._locations[id] = Object.assign({ id, discovered: true, state: 'ACTIVE', ownership: { faction: 'neutral' } }, data);
    return this._locations[id];
  }
  addCharacter(id, data) {
    if (!id) return null;
    this._characters[id] = Object.assign({ id, state: 'PRESENT' }, data);
    return this._characters[id];
  }

  activeScenarios() {
    return Object.values(this._scenarios).filter(s =>
      [DMScenarioStates.AVAILABLE, DMScenarioStates.NEW, DMScenarioStates.URGENT, DMScenarioStates.EXPIRING].includes(s.status));
  }

  scenariosForLocation(locationId) {
    return Object.values(this._scenarios).filter(s =>
      s.locationId === locationId && ![DMScenarioStates.COMPLETED, DMScenarioStates.FAILED, DMScenarioStates.MISSED].includes(s.status));
  }

  routesFrom(locationId) {
    return Object.values(this._routes).filter(r => r.origin === locationId);
  }

  // PRD §67 priority score
  scenarioPriority(s) {
    if (s._priorityCache != null) return s._priorityCache;
    let p = 0;
    const w = DM_PRIORITY_WEIGHTS;
    p += (s.urgency && s.urgency.level === 'high') ? w.urgency : 1;
    if (s.status === DMScenarioStates.EXPIRING) p += w.urgency + 1;
    if (s.locationId === this.activeLocationId) p += w.player_relevance;
    if (s.type === 'BOSS' || s.type === 'FACTION') p += w.world_relevance + 1;
    if (s.type === 'STORY') p += w.story_relevance;
    if (Array.isArray(s.participants) && s.participants.some(p2 => p2 !== 'player')) p += w.relationship_relevance;
    if (s.status === DMScenarioStates.NEW) p += w.novelty;
    if (Array.isArray(s.consequences) && s.consequences.length) p += w.consequence_value;
    s._priorityCache = p;
    return p;
  }

  // PRD §68 — limit active nodes to 3-7
  scenarioCandidates(limit = 5) {
    const ranked = this.activeScenarios()
      .map(s => ({ ...s, priority: this.scenarioPriority(s) }))
      .sort((a, b) => b.priority - a.priority);
    // enforce diversity (§69): cap scenarios of the same type
    const typeCount = {};
    const out = [];
    for (const s of ranked) {
      if (out.length >= Math.max(DM_ACTIVE_NODE_MIN, Math.min(DM_ACTIVE_NODE_MAX, limit))) break;
      const t = s.type || 'STORY';
      typeCount[t] = (typeCount[t] || 0) + 1;
      if (typeCount[t] > 2) continue; // no more than 2 of a kind (avoids 5 combat)
      out.push(s);
    }
    return out.slice(0, DM_ACTIVE_NODE_MAX);
  }

  // ---- character presence (PRD §20/§21) ----
  _ensurePlayerPresence() {
    if (!this._presence.player) {
      this._presence.player = { id: 'player', name: 'You', locationId: this.activeLocationId, state: DMCharacterStates.PRESENT };
    }
  }

  _setPresenceAt(locationId, charId) {
    Object.values(this._characters).forEach(c => {
      if (c.locationId === locationId && (charId === null || c.id === charId)) c.locationId = null;
    });
  }

  charactersAt(locationId) { return Object.values(this._characters).filter(c => c.locationId === locationId); }

  // PRD §22/§23 — NPC routines applied on world tick
  _updateNpcRoutines() {
    Object.values(this._characters).forEach(c => {
      if (c.id === 'player' || !c.routine) return;
      const sched = c.routine[this.timeBlock];
      if (sched && sched.location && c.locationId !== sched.location) {
        c.locationId = sched.location;
        c.state = DMCharacterStates.PRESENT;
        this.emit('character_moved', { id: c.id, to: sched.location, timeBlock: this.timeBlock });
      }
    });
  }

  // ---- rumors (PRD §34/§36) ----
  revealScenarioFromRumor(rumorId) {
    const rumor = this.getRumor(rumorId);
    if (!rumor || !rumor.reveals) return false;
    const s = this.getScenario(rumor.reveals);
    if (!s) return false;
    s.hidden = false;
    this._evalScenario(s);
    this.pushFeed({ text: `Rumor revealed: ${s.title}`, kind: 'rumor' });
    this.emit('rumorRevealed', { rumorId, scenarioId: s.id });
    return true;
  }

  _propagateRumors() {
    Object.values(this._rumors).forEach(r => { if (r.discovered && r.reveals) this.revealScenarioFromRumor(r.id); });
  }

  // ---- obligations (PRD §43-§46) ----
  addObligation(o) {
    const ob = this._normalizeObligation(o);
    this._obligations[ob.id] = ob;
    this.pushFeed({ text: `Obligation: ${ob.label}`, kind: 'obligation' });
    this.emit('obligationAdded', ob);
    return ob;
  }

  _normalizeObligation(o) {
    return {
      id: o.id, target: o.target || null, label: o.label || 'Promise',
      deadline: o.deadline || null, importance: o.importance || 'moderate',
      consequence_if_broken: o.consequence_if_broken || null, met: false
    };
  }

  // expiring opportunities (§45) + missed content (§46)
  _expireOpportunities() {
    Object.values(this._scenarios).forEach(s => {
      if (s.status === DMScenarioStates.EXPIRING || s.status === DMScenarioStates.URGENT) {
        const expired = s.expiration && DM_TIME_ORDER.indexOf(this.timeBlock) > DM_TIME_ORDER.indexOf(s.expiration.time_block);
        const missedByAbsence = s.requirements.includes('player_present') && this.activeLocationId !== s.locationId && Math.random() < 0.15;
        if (expired || missedByAbsence) {
          s.status = DMScenarioStates.MISSED;
          this._onMissed(s);
        }
      }
    });
  }

  _onMissed(s) {
    // §46: missing a scenario can create consequences rather than just delete
    this.pushFeed({ text: `Missed: ${s.title}`, kind: 'missed' });
    // mark relevant obligation broken if any
    Object.values(this._obligations).forEach(o => {
      if (o.target === s.locationId && !o.met && o.consequence_if_broken) {
        o.met = 'broken';
        this.pushFeed({ text: `Obligation broken: ${o.label}`, kind: 'consequence' });
      }
    });
    this.emit('scenarioMissed', { id: s.id });
  }

  // ---- story threads (PRD §40-§42) ----
  addThread(t) {
    const th = this._normalizeThread(t);
    this._threads[th.id] = th;
    this.emit('threadAdded', th);
    return th;
  }

  _normalizeThread(t) {
    return {
      id: t.id, title: t.title || 'Thread', status: t.status || 'active',
      current_stage: t.current_stage || null,
      completed: Array.isArray(t.completed) ? t.completed : [],
      available: Array.isArray(t.available) ? t.available : [],
      locked: Array.isArray(t.locked) ? t.locked : []
    };
  }

  advanceThread(threadId, stage) {
    const th = this.getThread(threadId);
    if (!th) return;
    th.completed.push(th.current_stage);
    th.current_stage = stage;
    th.available = th.available.filter(a => a !== stage);
    this.emit('threadAdvanced', { id: threadId, stage });
  }

  // ---- factions (PRD §56-§58) ----
  _updateFactions() {
    Object.values(this._factions).forEach(f => {
      const owned = Object.values(this._locations).filter(l => l.ownership && l.ownership.faction === f.id && l.state !== DMLocationStates.DESTROYED);
      f.controlledLocations = owned.map(l => l.id);
      if (owned.length === 0 && f.id !== 'neutral') f.territory = DMFactionTerritoryStates.UNSTABLE;
      else if (f.id !== 'neutral') f.territory = DMFactionTerritoryStates.CONTROLLED;
      else f.territory = DMFactionTerritoryStates.NEUTRAL;
    });
    this.emit('factionsUpdated', this._factions);
  }

  changeFactionControl(locationId, factionId) {
    const loc = this.getLocation(locationId);
    if (!loc) return;
    loc.ownership = { faction: factionId };
    this._updateFactions();
    this.pushFeed({ text: `${loc.name} now controlled by ${this.getFaction(factionId) ? this.getFaction(factionId).name : factionId}`, kind: 'faction' });
    this.emit('factionChange', { locationId, factionId });
  }

  // ---- world events (PRD §59-§61) ----
  triggerEvent(eventId) {
    const def = this._eventDefs[eventId];
    if (!def) return false;
    const ev = { id: def.id, name: def.name, duration: def.duration || 1, remaining: def.duration || 1, effects: def.effects || {}, unlocks: def.unlocks || [], active: true };
    this._events[ev.id] = ev;
    (def.unlocks || []).forEach(sid => { const s = this.getScenario(sid); if (s) { s.hidden = false; this._evalScenario(s); } });
    this.pushFeed({ text: `Event: ${ev.name}`, kind: 'event' });
    this.emit('eventTriggered', ev);
    this.emit('world_event_started', ev);
    return true;
  }

  _updateEvents() {
    Object.values(this._events).forEach(ev => {
      if (!ev.active) return;
      ev.remaining -= 1;
      if (ev.remaining <= 0) { ev.active = false; this.pushFeed({ text: `Event ended: ${ev.name}`, kind: 'event' }); this.emit('world_event_ended', ev); }
    });
  }

  activeEvents() { return Object.values(this._events).filter(e => e.active); }

  // ---- scenario lifecycle (PRD §25-§33) ----
  _recalculateScenarios() {
    Object.values(this._scenarios).forEach(s => { s._priorityCache = null; this._evalScenario(s); });
    this.emit('scenariosRecalculated', this.activeScenarios());
  }

  _evalScenario(s) {
    if ([DMScenarioStates.COMPLETED, DMScenarioStates.FAILED, DMScenarioStates.MISSED].includes(s.status)) return;
    if (s.hidden) { s.status = DMScenarioStates.HIDDEN; return; }
    if (s.status === DMScenarioStates.NEW) return;
    const reqsMet = this._requirementsMet(s);
    if (!reqsMet) { s.status = DMScenarioStates.LOCKED; return; }
    if (s.expiration && DM_TIME_ORDER.indexOf(this.timeBlock) >= DM_TIME_ORDER.indexOf(s.expiration.time_block)) s.status = DMScenarioStates.EXPIRING;
    else if (s.urgency && s.urgency.level === 'high') s.status = DMScenarioStates.URGENT;
    else s.status = DMScenarioStates.AVAILABLE;
  }

  _requirementsMet(s) {
    if (!Array.isArray(s.requirements) || s.requirements.length === 0) return true;
    return s.requirements.every(req => {
      if (req === 'player_present') return this.activeLocationId === s.locationId;
      if (req.endsWith('_present')) {
        const charId = req.replace('_present', '');
        const ch = this.getCharacter(charId);
        return ch && ch.locationId === s.locationId;
      }
      return true;
    });
  }

  // ---- Phase 2 scenario generation pipeline (PRD §65-§71) ----
  // candidate generation -> requirement check -> duplicate check -> scoring -> limit
  generateScenarios(aiProposals) {
    const candidates = [];
    (aiProposals || []).forEach(p => candidates.push(this._normalizeScenario(p)));
    // requirement + duplicate checks
    const valid = candidates.filter(c => !this._scenarios[c.id] && this.getLocation(c.locationId) && this._requirementsMet(c));
    valid.forEach(c => { this._scenarios[c.id] = c; this.pushFeed({ text: `New situation: ${c.title}`, kind: 'consequence' }); });
    this._recalculateScenarios();
    return valid.map(c => ({ id: c.id, priority: this.scenarioPriority(c) }));
  }

  // PRD §70 — AI director hook. The function receives a context package and
  // may propose scenarios. AI proposals are validated by the pipeline above
  // and can never directly mutate authoritative state.
  setAiDirector(fn) { this._aiDirector = fn; }

  _runScenarioDirector() {
    if (typeof this._aiDirector !== 'function') return;
    const ctx = this.getAiContext();
    let proposals = [];
    try { proposals = this._aiDirector(ctx) || []; } catch (e) { return; }
    if (Array.isArray(proposals) && proposals.length) this.generateScenarios(proposals);
  }

  // PRD §108 — map -> AI context package
  getAiContext() {
    return {
      timeBlock: this.timeBlock,
      activeLocationId: this.activeLocationId,
      locations: Object.values(this._locations).filter(l => l.discovered).map(l => ({ id: l.id, type: l.type, state: l.state })),
      characters: Object.values(this._characters).map(c => ({ id: c.id, locationId: c.locationId, state: c.state })),
      activeScenarios: this.activeScenarios().map(s => ({ id: s.id, type: s.type, locationId: s.locationId })),
      factions: Object.values(this._factions).map(f => ({ id: f.id, controlled: f.controlledLocations })),
      worldSeed: this._seed
    };
  }

  // ---- relationships (PRD §63/§64) ----
  setRelationship(a, b, value) {
    if (!this._relationships[a]) this._relationships[a] = {};
    this._relationships[a][b] = value;
    if (!this._relationships[b]) this._relationships[b] = {};
    this._relationships[b][a] = value; // symmetric
    this.emit('relationship_changed', { a, b, value });
  }
  getRelationship(a, b) { return (this._relationships[a] && this._relationships[a][b]) || 0; }
  relationshipNodes() {
    // PEOPLE layer graph (§62): characters present + the player node
    const nodes = Object.values(this._characters).filter(c => c.locationId).map(c => ({ id: c.id, name: c.name, locationId: c.locationId }));
    const player = this._presence.player;
    if (player && player.locationId) nodes.push({ id: 'player', name: player.name || 'You', locationId: player.locationId });
    const edges = [];
    const ids = nodes.map(n => n.id);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const v = this.getRelationship(ids[i], ids[j]);
      if (v) edges.push({ a: ids[i], b: ids[j], value: v });
    }
    return { nodes, edges };
  }

  // ---- consequence intake (PRD §7: core systems call this; map stays display-only) ----
  applyConsequence(effect) {
    if (!effect) return;
    if (effect.locationState) {
      const locId = typeof effect.locationState === 'object' ? effect.locationState.locationId : effect.locationId;
      const newState = typeof effect.locationState === 'object' ? effect.locationState.locationState : effect.locationState;
      const loc = this.getLocation(locId);
      if (loc && newState) { loc.state = newState; this.pushFeed({ text: `${loc.name} is now ${loc.state}`, kind: 'consequence' }); this.emit('location_state_changed', { locationId: locId, state: newState }); }
    }
    if (effect.locationDiscovered) { const loc = this.getLocation(effect.locationDiscovered); if (loc) loc.discovered = true; }
    if (effect.relationship) { this.setRelationship(effect.relationship.from, effect.relationship.to, effect.relationship.value); }
    if (effect.completeScenario) { const s = this.getScenario(effect.completeScenario); if (s) { s.status = DMScenarioStates.COMPLETED; this.pushFeed({ text: `Resolved: ${s.title}`, kind: 'consequence' }); } }
    if (effect.failScenario) { const s = this.getScenario(effect.failScenario); if (s) s.status = DMScenarioStates.FAILED; }
    if (effect.metObligation) { const o = this.getObligation(effect.metObligation); if (o) o.met = true; }
    if (effect.factionControl) this.changeFactionControl(effect.factionControl.locationId, effect.factionControl.factionId);
    if (effect.triggerEvent) this.triggerEvent(effect.triggerEvent);
    if (effect.newScenario) { this._scenarios[effect.newScenario.id] = this._normalizeScenario(effect.newScenario); this._evalScenario(this._scenarios[effect.newScenario.id]); this.pushFeed({ text: `New situation: ${effect.newScenario.title}`, kind: 'consequence' }); }
    this.emit('consequenceApplied', effect);
  }

  // ---- scene handoff (PRD §73/§74) ----
  handoffToScene(scenarioId) {
    const s = this.getScenario(scenarioId);
    if (!s) return null;
    if (!this._requirementsMet(s)) return null;
    s.status = DMScenarioStates.NEW; // seen -> no longer NEW
    this.pushFeed({ text: `Entering: ${s.title}`, kind: 'scene' });
    this.emit('sceneHandoff', { scenarioId, type: s.type });
    this.emit('scene_started', { scenarioId, type: s.type });
    return { scenarioId, type: s.type, locationId: s.locationId };
  }

  returnFromScene(result) {
    if (!result || !result.scenarioId) return;
    const s = this.getScenario(result.scenarioId);
    if (!s) return;
    if (result.outcome === 'success' || result.outcome === 'complete') s.status = DMScenarioStates.COMPLETED;
    else if (result.outcome === 'fail') s.status = DMScenarioStates.FAILED;
    if (Array.isArray(result.effects)) result.effects.forEach(e => this.applyConsequence(e));
    this._advanceChains(result.scenarioId);   // §137 procedural chains advance
    this.advanceTime();
    this.pushFeed({ text: `Returned from: ${s.title}`, kind: 'scene' });
    this.emit('sceneReturn', result);
    this.emit('scene_completed', result);
    if (s.status === DMScenarioStates.COMPLETED) this.emit('scenario_completed', { id: s.id });
  }

  // ---- save/load (PRD §103/§104) with versioning + migration ----
  snapshot() {
    return {
      schema: { map: DM_MAP_SCHEMA_VERSION, world: DM_WORLD_SCHEMA_VERSION, scenario: DM_SCENARIO_SCHEMA_VERSION },
      version: 2,
      mode: this.mode, timeBlock: this.timeBlock,
      activeLocationId: this.activeLocationId, selectedNodeId: this.selectedNodeId, overlayOpen: this.overlayOpen,
      feed: this.feed.slice(0, 20),
      locations: this._locations, routes: this._routes, scenarios: this._scenarios,
      characters: this._characters, rumors: this._rumors, factions: this._factions,
      presence: this._presence, relationships: this._relationships,
      obligations: this._obligations, threads: this._threads, events: this._events,
      seed: this._seed, chains: this._chains || {}
    };
  }

  restore(snap) {
    if (!snap) return;
    const migrated = this._migrate(snap);
    this.mode = migrated.mode || this.mode;
    this.timeBlock = migrated.timeBlock || this.timeBlock;
    this.activeLocationId = migrated.activeLocationId || this.activeLocationId;
    this.selectedNodeId = migrated.selectedNodeId || null;
    this.overlayOpen = !!migrated.overlayOpen;
    this.feed = Array.isArray(migrated.feed) ? migrated.feed : this.feed;
    this._locations = migrated.locations || this._locations;
    this._routes = migrated.routes || this._routes;
    this._scenarios = migrated.scenarios || this._scenarios;
    this._characters = migrated.characters || this._characters;
    this._rumors = migrated.rumors || this._rumors;
    this._factions = migrated.factions || this._factions;
    this._presence = migrated.presence || this._presence;
    this._relationships = migrated.relationships || {};
    this._obligations = migrated.obligations || {};
    this._threads = migrated.threads || {};
    this._events = migrated.events || {};
    this._chains = migrated.chains || {};
    this._seed = migrated.seed || this._seed;
    this.emit('restored', this.snapshot());
  }

  // PRD §104 — versioned migration. Older saves are upgraded in place.
  _migrate(snap) {
    const v = snap.version || (snap.schema && snap.schema.map) || 1;
    if (v < 2) {
      // v1 had no relationships/obligations/threads/events; default them
      snap.relationships = snap.relationships || {};
      snap.obligations = snap.obligations || {};
      snap.threads = snap.threads || {};
      snap.events = snap.events || {};
      snap.version = 2;
    }
    return snap;
  }

  validate() {
    const issues = [];
    if (this.activeLocationId && !this.getLocation(this.activeLocationId)) issues.push('activeLocationId missing');
    Object.values(this._scenarios).forEach(s => { if (!this.getLocation(s.locationId)) issues.push('scenario ' + s.id + ' bad location'); });
    return issues;
  }

  // PRD §134 — clean level (re)load. Clears all private collections so a
  // level definition can populate the world from scratch without orphaned
  // seed content. Relationships/presence are reset too.
  resetWorld() {
    this._locations = {};
    this._routes = {};
    this._scenarios = {};
    this._characters = {};
    this._rumors = {};
    this._factions = {};
    this._eventDefs = {};
    this._presence = {};
    this._relationships = {};
    this._obligations = {};
    this._threads = {};
    this._events = {};
    this._chains = {};
    this._seed = 'level-loaded';
    this.mode = DMMapModes.STORY;
    this.activeLocationId = null;
    this.selectedNodeId = null;
    this.feed = [];
    this.emit('worldReset', {});
  }

  // ===================== PHASE 3 (§137) =====================

  // PRD §24 — autonomous NPC goals. Goals are deterministic per character;
  // they override routine when a goal demands a location. Goals feed scenario
  // generation (a character at their goal location can spawn goal-driven scenes).
  setCharacterGoal(charId, goal) {
    const c = this.getCharacter(charId);
    if (!c) return;
    c.goals = c.goals || { primary: null, current: null, immediate: null };
    c.goals = Object.assign(c.goals, goal);
    this.emit('goalSet', { charId, goal: c.goals });
  }

  _updateNpcGoals() {
    Object.values(this._characters).forEach(c => {
      if (c.id === 'player' || !c.goals || !c.goals.current) return;
      const g = c.goals.current;
      if (g.location && c.locationId !== g.location && (!c.routine || c.routine[this.timeBlock] == null || c.routine[this.timeBlock].location !== g.location)) {
        c.locationId = g.location; // goal overrides routine (§23)
        c.state = DMCharacterStates.PRESENT;
      }
    });
  }

  // PRD §58 / §137 — dynamic faction conflicts. A location flagged `contested`
  // (with a `contestedBy` attacker) resolves deterministically by influence:
  // if the attacker out-influences the current owner, control flips.
  _updateFactionConflicts() {
    Object.values(this._locations).forEach(l => {
      if (!l.contested || !l.contestedBy) return;
      const owner = this.getFaction(l.ownership && l.ownership.faction);
      const attacker = this.getFaction(l.contestedBy);
      if (!owner || !attacker) return;
      if (attacker.influence > owner.influence) {
        l.ownership = { faction: attacker.id };
        l.state = DMLocationStates.TENSE;
        l.contested = false; l.contestedBy = null;
        attacker.territory = DMFactionTerritoryStates.CONTROLLED;
        if (owner.id !== 'neutral') owner.territory = DMFactionTerritoryStates.UNSTABLE;
        this.pushFeed({ text: `${attacker.name} seized ${l.name}`, kind: 'faction' });
      } else if (owner.influence > attacker.influence) {
        // defender holds: contest ends, owner retains
        l.contested = false; l.contestedBy = null;
        attacker.territory = DMFactionTerritoryStates.CONTROLLED;
        this.pushFeed({ text: `${owner.name} held ${l.name}`, kind: 'faction' });
      }
      // tie: remains contested
    });
    this._updateFactions();
  }

  contestLocation(locationId, attackerFactionId) {
    const loc = this.getLocation(locationId);
    if (!loc) return;
    const owner = loc.ownership && loc.ownership.faction;
    if (!owner || owner === 'neutral' || owner === attackerFactionId) return;
    loc.contested = true;                       // §58 contested flag (does not clobber location state)
    loc.contestedBy = attackerFactionId;
    if (loc.state !== DMLocationStates.DESTROYED && loc.state !== DMLocationStates.LOCKED) {
      loc.state = DMLocationStates.TENSE;
    }
    const f = this.getFaction(attackerFactionId);
    if (f) f.territory = DMFactionTerritoryStates.CONTESTED;
    this.pushFeed({ text: `${f ? f.name : attackerFactionId} contests ${loc.name}`, kind: 'faction' });
    this.emit('factionContest', { locationId, attackerFactionId });
  }

  // PRD §137 — procedural scenario chains. A chain is an ordered list of
  // scenario ids; completing one unlocks the next (cannot be skipped).
  addScenarioChain(chain) {
    const c = { id: chain.id, nodes: Array.isArray(chain.nodes) ? chain.nodes : [], index: 0, status: 'active' };
    this._chains = this._chains || {};
    this._chains[c.id] = c;
    // first node becomes available; rest stay locked until predecessor done
    c.nodes.forEach((sid, i) => {
      const s = this.getScenario(sid);
      if (s) { s.chain = c.id; s.chainIndex = i; s.status = i === 0 ? s.status : DMScenarioStates.LOCKED; }
    });
    this.emit('chainAdded', c);
    return c;
  }

  _advanceChains(scenarioId) {
    this._chains = this._chains || {};
    Object.values(this._chains).forEach(c => {
      const done = c.nodes[c.index];
      if (done === scenarioId && c.index < c.nodes.length - 1) {
        c.index++;
        const next = this.getScenario(c.nodes[c.index]);
        if (next) { next.status = this._requirementsMet(next) ? DMScenarioStates.AVAILABLE : DMScenarioStates.LOCKED; this.pushFeed({ text: `Chain advanced: ${next.title}`, kind: 'chain' }); }
      }
    });
  }

  // PRD §34 / §137 — advanced rumor networks. Rumors form a graph: a rumor
  // can be sourced from a character/location, point at a target, and spawn
  // child rumors when discovered (information propagation §37).
  addRumorNode(r) {
    const node = {
      id: r.id, text: r.text || '', truth: r.truth || DMRumorStates.UNVERIFIED,
      discovered: !!r.discovered, reveals: r.reveals || null,
      source: r.source || null, target: r.target || null,
      children: Array.isArray(r.children) ? r.children : [], spread: 0
    };
    this._rumors[node.id] = node;
    this.emit('rumor_created', node);
    return node;
  }

  _propagateRumors() {
    // discover children of already-discovered rumors (network spread §37)
    Object.values(this._rumors).forEach(r => {
      if (r.discovered && r.children) {
        r.children.forEach(cid => {
          const child = this.getRumor(cid);
          if (child && !child.discovered) { child.discovered = true; child.spread = (child.spread || 0) + 1; this.pushFeed({ text: `Rumor spreads: ${child.text}`, kind: 'rumor' }); }
        });
      }
      if (r.discovered && r.reveals) this.revealScenarioFromRumor(r.id);
    });
  }

  // PRD §137 — emergent world events. Generated from current world state
  // deterministically (§105): e.g., a DANGEROUS contested location during
  // NIGHT can spark a gang war; low security can spark a police sweep.
  _generateEmergentEvents() {
    if (this._emergentCooldown && this._emergentCooldown > 0) { this._emergentCooldown--; return; }
    const dangerousContested = Object.values(this._locations).find(l => l.contested || (l.state === DMLocationStates.DANGEROUS && this.timeBlock === DMMapTimeBlocks.NIGHT));
    if (dangerousContested && !this.activeEvents().some(e => e.id === 'gang_war')) {
      this.triggerEvent('gang_war');
      this._emergentCooldown = 2;
    }
  }

  // ===================== CONTENT EDITOR (§113) =====================
  // Designer-facing CRUD so locations/routes/scenarios/rumors/events/schedules
  // can be authored without touching code. All validated against existing ids.

  createLocation(spec) {
    if (!spec || !spec.id) throw new Error('createLocation requires id');
    const loc = {
      id: spec.id, name: spec.name || spec.id, type: spec.type || 'PARK',
      region_id: spec.region_id || 'unknown', district_id: spec.district_id || 'unknown',
      coordinates: spec.coordinates || { x: 480, y: 270 }, tags: spec.tags || [],
      state: spec.state || DMLocationStates.SAFE,
      ownership: { faction: spec.faction || 'neutral' },
      discovered: spec.discovered !== false
    };
    this._locations[loc.id] = loc;
    this._updateFactions();
    this.emit('locationCreated', loc);
    return loc;
  }

  moveLocation(id, x, y) {
    const loc = this.getLocation(id);
    if (!loc) return false;
    loc.coordinates = { x, y };
    this.emit('locationMoved', { id, x, y });
    return true;
  }

  addRoute(spec) {
    if (!spec || !spec.id || !spec.origin || !spec.destination) throw new Error('addRoute requires id/origin/destination');
    this._routes[spec.id] = {
      id: spec.id, origin: spec.origin, destination: spec.destination,
      travel_time: spec.travel_time || 1, cost: spec.cost || 0,
      danger: typeof spec.danger === 'number' ? spec.danger : 0.3, tags: spec.tags || []
    };
    this.emit('routeAdded', this._routes[spec.id]);
    return this._routes[spec.id];
  }

  createScenario(spec) {
    if (!spec || !spec.id || !spec.locationId) throw new Error('createScenario requires id/locationId');
    const n = this._normalizeScenario(spec);
    this._scenarios[n.id] = n;
    this._evalScenario(n);
    this.emit('scenario_created', n);
    return n;
  }

  setScenarioRequirements(id, requirements) {
    const s = this.getScenario(id);
    if (!s) return false;
    s.requirements = Array.isArray(requirements) ? requirements : [];
    this._evalScenario(s);
    return true;
  }

  defineEvent(spec) {
    if (!spec || !spec.id) throw new Error('defineEvent requires id');
    this._eventDefs[spec.id] = {
      id: spec.id, name: spec.name || spec.id, duration: spec.duration || 1,
      effects: spec.effects || {}, unlocks: spec.unlocks || []
    };
    this.emit('eventDefined', this._eventDefs[spec.id]);
    return this._eventDefs[spec.id];
  }

  setCharacterSchedule(charId, routine) {
    const c = this.getCharacter(charId);
    if (!c) return false;
    c.routine = routine || c.routine;
    this.emit('scheduleSet', { charId, routine: c.routine });
    return true;
  }

  // ===================== SCENARIO LAUNCH (§101 / §102) =====================

  // §101 — validate a scenario is launchable. Returns { ok, errors:[] }.
  validateScenarioForLaunch(scenarioId) {
    const errors = [];
    const s = this.getScenario(scenarioId);
    if (!s) { errors.push({ code: 'no_scenario', msg: 'scenario does not exist' }); return { ok: false, errors }; }
    // location valid
    if (!this.getLocation(s.locationId)) errors.push({ code: 'location_invalid', msg: `location "${s.locationId}" missing` });
    // participants valid
    (s.participants || []).forEach(p => {
      if (p !== 'player' && !this.getCharacter(p)) errors.push({ code: 'participant_invalid', msg: `participant "${p}" missing` });
    });
    // requirements valid (all resolvable)
    (s.requirements || []).forEach(req => {
      if (/_present$/.test(req)) { const base = req.slice(0, -8); if (base !== 'player' && !this.getCharacter(base)) errors.push({ code: 'requirement_invalid', msg: `requirement "${req}" unresolved` }); }
    });
    // time valid — not expired against current block
    if (s.expiration && DM_TIME_ORDER.indexOf(this.timeBlock) >= DM_TIME_ORDER.indexOf(s.expiration.time_block)) errors.push({ code: 'expired', msg: 'scenario expired' });
    // not duplicated — no other AVAILABLE scenario with same id already launched
    if (s.status === DMScenarioStates.COMPLETED || s.status === DMScenarioStates.FAILED || s.status === DMScenarioStates.MISSED) errors.push({ code: 'already_resolved', msg: `scenario is ${s.status}` });
    // world state valid — location not destroyed/locked
    const loc = this.getLocation(s.locationId);
    if (loc && (loc.state === DMLocationStates.DESTROYED || loc.state === DMLocationStates.LOCKED)) errors.push({ code: 'location_unavailable', msg: `location ${loc.state}` });
    return { ok: errors.length === 0, errors };
  }

  // §102 — transactional scene launch. Validates -> locks -> reserves ->
  // generates package -> on failure rolls back and returns player to map.
  launchSceneTransactionally(scenarioId, ctx) {
    const rollback = {};
    try {
      const v = this.validateScenarioForLaunch(scenarioId);
      if (!v.ok) { return { ok: false, phase: 'validate', errors: v.errors }; }
      // lock scenario
      const s = this.getScenario(scenarioId);
      rollback.prevStatus = s.status;
      s.status = DMScenarioStates.LOCKED;
      // reserve required resources (e.g. participants must be present)
      const reserved = [];
      (s.participants || []).forEach(p => { if (p !== 'player') { const c = this.getCharacter(p); if (c) { reserved.push({ id: c.id, prevLoc: c.locationId }); } } });
      rollback.reserved = reserved;
      // generate scene package (§72)
      const pkg = this.handoffToScene(scenarioId);
      if (!pkg) { throw new Error('handoff failed'); }
      this.emit('scene_started', { scenarioId, transactional: true });
      return { ok: true, package: pkg };
    } catch (e) {
      // rollback
      if (rollback.prevStatus) { const s2 = this.getScenario(scenarioId); if (s2) s2.status = rollback.prevStatus; }
      (rollback.reserved || []).forEach(r => { const c = this.getCharacter(r.id); if (c) c.locationId = r.prevLoc; });
      this.emit('scene_launch_rolled_back', { scenarioId, reason: e.message });
      return { ok: false, phase: 'launch', error: e.message };
    }
  }

  // ---- snapshot/restore must include Phase 3 collections ----

  debug() {
    const self = this;
    return {
      reveal_all() { Object.values(self._locations).forEach(l => l.discovered = true); self.emit('debug', 'reveal_all'); },
      reveal_location(id) { const l = self.getLocation(id); if (l) l.discovered = true; },
      spawn_scenario(s) { const n = self._normalizeScenario(s); self._scenarios[n.id] = n; self._evalScenario(n); },
      complete_scenario(id) { const s = self.getScenario(id); if (s) s.status = DMScenarioStates.COMPLETED; },
      expire_scenario(id) { const s = self.getScenario(id); if (s) { s.expiration = { time_block: self.timeBlock }; s.status = DMScenarioStates.EXPIRING; } },
      move_character(id, location) { const c = self.getCharacter(id); if (c) c.locationId = location; },
      advance_time(block) { self.advanceTime(block); },
      trigger_event(id) { self.triggerEvent(id); },
      clear_rumors() { self._rumors = {}; },
      reset_state() { self._seedWorld(); },
      contest(loc, faction) { self.contestLocation(loc, faction); },
      add_chain(chain) { self.addScenarioChain(chain); },
      add_rumor(r) { self.addRumorNode(r); },
      set_goal(charId, goal) { self.setCharacterGoal(charId, goal); }
    };
  }

  // ---- normalization ----
  _normalizeScenario(s) {
    return {
      id: s.id, locationId: s.locationId, type: DMScenarioTypes.includes(s.type) ? s.type : 'STORY',
      title: s.title || 'Untitled', summary: s.summary || '',
      participants: Array.isArray(s.participants) ? s.participants : [],
      urgency: s.urgency || { level: 'moderate' }, expiration: s.expiration || null,
      requirements: Array.isArray(s.requirements) ? s.requirements : [],
      rewards: Array.isArray(s.rewards) ? s.rewards : [],
      consequences: s.consequences || null,
      status: s.status || DMScenarioStates.AVAILABLE, hidden: !!s.hidden, priority: s.priority || 0
    };
  }

  // ---- seed world (PRD §134 MVP: 6-10 locations, routes, scenarios, rumors, characters) + Phase 2 data ----
  _seedWorld() {
    this._seed = 'concrete-kings-v2';
    this._locations = {
      blue_plate: { id: 'blue_plate', name: 'The Blue Plate', type: 'RESTAURANT', region_id: 'downtown', district_id: 'central', coordinates: { x: 420, y: 260 }, tags: ['food', 'social', 'rumor', 'nightlife'], state: DMLocationStates.ACTIVE, ownership: { faction: 'neutral' }, discovered: true },
      stoop: { id: 'stoop', name: 'Harlem Stoop', type: 'HOME', region_id: 'uptown', district_id: 'harlem', coordinates: { x: 160, y: 200 }, tags: ['safe', 'social'], state: DMLocationStates.SAFE, ownership: { faction: 'neutral' }, discovered: true },
      detroit_lot: { id: 'detroit_lot', name: 'Detroit Lot', type: 'PARK', region_id: 'midwest', district_id: 'detroit', coordinates: { x: 620, y: 360 }, tags: ['social', 'criminal'], state: DMLocationStates.TENSE, ownership: { faction: 'corner_crew' }, discovered: true },
      chi_grey: { id: 'chi_grey', name: 'Chicago Greystone', type: 'APARTMENT', region_id: 'midwest', district_id: 'chicago', coordinates: { x: 700, y: 180 }, tags: ['safe', 'social'], state: DMLocationStates.SAFE, ownership: { faction: 'neutral' }, discovered: true },
      miami_cut: { id: 'miami_cut', name: 'Miami Cut', type: 'CLUB', region_id: 'south', district_id: 'miami', coordinates: { x: 540, y: 520 }, tags: ['nightlife', 'social', 'criminal'], state: DMLocationStates.DANGEROUS, ownership: { faction: 'royal_clique' }, discovered: false },
      bmore_steps: { id: 'bmore_steps', name: 'Baltimore Steps', type: 'ALLEY', region_id: 'midatlantic', district_id: 'baltimore', coordinates: { x: 360, y: 440 }, tags: ['criminal', 'dangerous'], state: DMLocationStates.UNDER_SURVEILLANCE, ownership: { faction: 'neutral' }, discovered: false }
    };
    this._routes = {
      stoop_to_blue: { id: 'stoop_to_blue', origin: 'stoop', destination: 'blue_plate', travel_time: 1, cost: 2, danger: 0.2, tags: ['safe', 'fast'] },
      blue_to_detroit: { id: 'blue_to_detroit', origin: 'blue_plate', destination: 'detroit_lot', travel_time: 2, cost: 5, danger: 0.5, tags: ['alley', 'criminal'] },
      detroit_to_chi: { id: 'detroit_to_chi', origin: 'detroit_lot', destination: 'chi_grey', travel_time: 1, cost: 4, danger: 0.3, tags: ['fast'] },
      blue_to_miami: { id: 'blue_to_miami', origin: 'blue_plate', destination: 'miami_cut', travel_time: 3, cost: 8, danger: 0.7, tags: ['highway', 'dangerous'] },
      blue_to_bmore: { id: 'blue_to_bmore', origin: 'blue_plate', destination: 'bmore_steps', travel_time: 1, cost: 3, danger: 0.6, tags: ['alley', 'shortcut'] }
    };
    this._scenarios = {
      corner_hustle: this._normalizeScenario({ id: 'corner_hustle', locationId: 'stoop', type: 'SOCIAL', title: 'Corner Hustle', summary: 'Run your block.', participants: ['player'], urgency: { level: 'moderate' }, requirements: ['player_present'], priority: 1 }),
      studio_session: this._normalizeScenario({ id: 'studio_session', locationId: 'detroit_lot', type: 'STORY', title: 'Studio Session', summary: 'Lay a track.', participants: ['player', 'marcus'], urgency: { level: 'high' }, requirements: ['player_present', 'marcus_present'], priority: 2 }),
      police_raid: this._normalizeScenario({ id: 'police_raid', locationId: 'blue_plate', type: 'ESCAPE', title: 'Police Raid', summary: 'Police have entered.', participants: ['player', 'marcus', 'officer_01'], urgency: { level: 'high' }, expiration: { time_block: DMMapTimeBlocks.NIGHT }, requirements: ['player_present', 'marcus_present'], priority: 3 }),
      hidden_meet: this._normalizeScenario({ id: 'hidden_meet', locationId: 'miami_cut', type: 'FACTION', title: 'The Quiet Meet', summary: 'A rumored deal.', participants: ['player'], hidden: true, priority: 1 })
    };
    this._characters = {
      marcus: { id: 'marcus', name: 'Marcus', locationId: 'detroit_lot', state: DMCharacterStates.PRESENT, routine: { MORNING: { location: 'stoop' }, AFTERNOON: { location: 'blue_plate' }, EVENING: { location: 'detroit_lot' }, NIGHT: { location: 'detroit_lot' }, LATE_NIGHT: { location: 'stoop' } } },
      luna: { id: 'luna', name: 'Luna', locationId: 'blue_plate', state: DMCharacterStates.PRESENT, routine: { MORNING: { location: 'blue_plate' }, AFTERNOON: { location: 'blue_plate' }, EVENING: { location: 'miami_cut' }, NIGHT: { location: 'miami_cut' }, LATE_NIGHT: { location: 'blue_plate' } } },
      officer_01: { id: 'officer_01', name: 'Officer Reyes', locationId: 'blue_plate', state: DMCharacterStates.PRESENT }
    };
    this._rumors = {
      miami_deal: { id: 'miami_deal', text: 'Someone is watching the Miami Cut.', truth: DMRumorStates.UNVERIFIED, discovered: false, reveals: 'hidden_meet' },
      police_search: { id: 'police_search', text: 'Police are searching for you.', truth: DMRumorStates.TRUE, discovered: true, reveals: null }
    };
    this._factions = {
      neutral: { id: 'neutral', name: 'Unaffiliated', influence: 0, controlledLocations: [], territory: DMFactionTerritoryStates.NEUTRAL },
      corner_crew: { id: 'corner_crew', name: 'Corner Crew', influence: 3, controlledLocations: [], territory: DMFactionTerritoryStates.CONTROLLED },
      royal_clique: { id: 'royal_clique', name: 'Royal Clique', influence: 5, controlledLocations: [], territory: DMFactionTerritoryStates.CONTROLLED }
    };
    this._eventDefs = {
      city_blackout: { id: 'city_blackout', name: 'City Blackout', duration: 2, effects: { security: -0.3, activity: -0.2 }, unlocks: [] },
      police_sweep: { id: 'police_sweep', name: 'Police Sweep', duration: 1, effects: { security: 0.4 }, unlocks: ['police_raid'] },
      gang_war: { id: 'gang_war', name: 'Gang War', duration: 2, effects: { security: -0.5 }, unlocks: [] }
    };
    this._presence = {};
    this._relationships = { player: { marcus: 35, luna: 20, officer_01: -10 } };
    this._obligations = {};
    this._threads = {};
    this._events = {};
    this._chains = {};
    // Phase 3 seed: a procedural scenario chain + rumor network + an NPC goal
    this._scenarios.block_fame = this._normalizeScenario({ id: 'block_fame', locationId: 'chi_grey', type: 'STORY', title: 'Block Fame', summary: 'Blow up.', participants: ['player', 'marcus'], urgency: { level: 'moderate' }, requirements: ['player_present', 'marcus_present'], hidden: true, priority: 2 });
    this.addScenarioChain({ id: 'marcus_arc', nodes: ['corner_hustle', 'studio_session', 'block_fame'] });
    // rumor network: miami_deal has child rumors that spread when discovered
    this._rumors.miami_deal.children = ['rumor_courier', 'rumor_buyer'];
    this.addRumorNode({ id: 'rumor_courier', text: 'A courier moves product through the Cut.', truth: DMRumorStates.UNVERIFIED, discovered: false });
    this.addRumorNode({ id: 'rumor_buyer', text: 'A buyer from Chicago is interested.', truth: DMRumorStates.UNVERIFIED, discovered: false });
    // autonomous NPC goal (§24): Marcus wants to be at the studio
    this.setCharacterGoal('marcus', { primary: 'build_career', current: { location: 'detroit_lot' } });
    this.activeLocationId = 'stoop';
    this._ensurePlayerPresence();
    this._updateFactions();
    this._recalculateScenarios();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DMMapState, DMMapModes, DMMapTimeBlocks, DMLocationStates,
    DMScenarioTypes, DMScenarioStates, DMCharacterStates, DMRumorStates,
    DMFactionTerritoryStates, DM_RISK_LEVELS, DM_REWARD_LEVELS,
    DM_MAP_SCHEMA_VERSION, DM_WORLD_SCHEMA_VERSION, DM_SCENARIO_SCHEMA_VERSION,
    DM_PRIORITY_WEIGHTS, DM_ACTIVE_NODE_MIN, DM_ACTIVE_NODE_MAX
  };
}
if (typeof window !== 'undefined') {
  window.DMMapState = DMMapState;
  window.DMMapModes = DMMapModes;
  window.DMMapTimeBlocks = DMMapTimeBlocks;
  window.DMLocationStates = DMLocationStates;
  window.DMScenarioTypes = DMScenarioTypes;
  window.DMScenarioStates = DMScenarioStates;
  window.DMCharacterStates = DMCharacterStates;
  window.DMRumorStates = DMRumorStates;
  window.DMFactionTerritoryStates = DMFactionTerritoryStates;
}
