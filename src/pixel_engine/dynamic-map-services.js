/**
 * Concrete Kings: Dynamic Narrative Map — Services (PRD §99, §116, §117/§118, §120)
 *
 * §99  GlobalServices — thin adapter the map uses to talk to game systems
 *      (WorldState, SaveManager, TimeManager, RelationshipManager, AudioManager,
 *      etc.). Concrete implementations are injected; this is the contract.
 * §116 PlayerExperience — records the 10 first-time milestone flags.
 * §117/§118 Onboarding — sequential concept intro + first-map "YOU ARE HERE".
 * §120 AudioDirector — maps world state to audio cues via the EventBus.
 *
 * Engine-agnostic (no DOM/canvas). Deterministic.
 */

// §116 — the 10 first-time player experience milestones
const DM_PLAYER_EXPERIENCE_STEPS = [
  'first_map_open',
  'first_scenario_discovery',
  'first_travel',
  'first_rumor',
  'first_consequence',
  'first_relationship_change',
  'first_missed_opportunity',
  'first_map_state_transformation',
  'first_controller_nav',
  'first_offline_operation'
];

// §117/§118 — onboarding concept order
const DM_ONBOARDING_STEPS = [
  { id: 'location', text: 'This is a place. Every dot is somewhere you can be.' },
  { id: 'scenario', text: 'A star (★) is a situation — a chance to make a choice.' },
  { id: 'character', text: 'People move. Watch who is where.' },
  { id: 'travel', text: 'Lines connect places. Pick one to travel.' },
  { id: 'rumor', text: 'Rumors reveal hidden situations when confirmed.' },
  { id: 'consequences', text: 'Choices change the world. There is no undo.' },
  { id: 'threads', text: 'Stories span multiple situations — these are threads.' },
  { id: 'world_events', text: 'The city reacts. Events can change everything.' }
];

// §120 — world-state → audio layer mapping
function dmAudioLayerFor(state) {
  // returns one of: calm, tension, conflict, sting, notification
  const hasContested = Object.values(state._locations || {}).some(l => l.contested);
  const dangerCount = Object.values(state._locations || {}).filter(l => l.state === 'DANGEROUS').length;
  const activeEvents = (state.activeEvents ? state.activeEvents() : []).filter(e => e.active);
  if (activeEvents.some(e => e.id === 'gang_war' || e.id === 'police_sweep')) return 'conflict';
  if (hasContested || dangerCount > 0) return 'tension';
  const newScenarios = Object.values(state._scenarios || {}).filter(s => s.status === 'AVAILABLE' && !s._seen).length;
  if (newScenarios > 0) return 'notification';
  return 'calm';
}

class DMGlobalServices {
  // services: { WorldState, SaveManager, TimeManager, RelationshipManager,
  //             AudioManager, InventoryManager, CardManager, ... } — all optional
  constructor(services) {
    this.services = services || {};
  }
  get(name) { return this.services[name] || null; }
  has(name) { return !!this.services[name]; }
}

class DMPlayerExperience {
  constructor() {
    this.completed = {};
    DM_PLAYER_EXPERIENCE_STEPS.forEach(s => { this.completed[s] = false; });
    this.order = DM_PLAYER_EXPERIENCE_STEPS.slice();
  }
  mark(step) {
    if (!(step in this.completed)) return false;
    const was = this.completed[step];
    this.completed[step] = true;
    return !was; // true if this was the first time
  }
  isComplete(step) { return !!this.completed[step]; }
  remaining() { return this.order.filter(s => !this.completed[s]); }
  allComplete() { return this.remaining().length === 0; }
  snapshot() { return Object.assign({}, this.completed); }
}

class DMOnboarding {
  constructor() {
    this.steps = DM_ONBOARDING_STEPS.map((s, i) => ({ ...s, index: i, done: false }));
    this.active = this.steps.length > 0;
    this.firstMapShown = false;
  }
  current() { return this.steps.find(s => !s.done) || null; }
  completeCurrent() {
    const c = this.current();
    if (!c) { this.active = false; return null; }
    c.done = true;
    if (!this.steps.some(s => !s.done)) this.active = false;
    return c;
  }
  showFirstMap() {
    this.firstMapShown = true;
    // §117 first-map prompt
    return {
      title: 'YOU ARE HERE',
      body: '★ Someone wants to meet you.',
      cta: 'VIEW'
    };
  }
  snapshot() { return { steps: this.steps.map(s => ({ id: s.id, done: s.done })), active: this.active, firstMapShown: this.firstMapShown }; }
}

class DMAudioDirector {
  constructor(bus, services) {
    this.bus = bus || null;
    this.services = services || null; // may provide AudioManager
    this.currentLayer = 'calm';
    this._lastCue = null;
    if (this.bus) {
      // §119/§120: react to world events and scenario/rumor activity
      this.bus.on('location_state_changed', () => this.sync());
      this.bus.on('world_event_started', (e) => this.cue('sting', e));
      this.bus.on('scenario_created', () => this.sync());
      this.bus.on('rumor_created', () => this.cue('notification'));
      this.bus.on('relationship_changed', () => this.cue('notification'));
    }
  }

  sync(state) {
    const layer = dmAudioLayerFor(state || (this.services && this.services.get && this.services.get('WorldState')));
    this.setLayer(layer);
    return layer;
  }

  setLayer(layer) {
    if (layer === this.currentLayer) return;
    this.currentLayer = layer;
    this._emit(layer);
  }

  cue(type, payload) {
    this._lastCue = { type, payload, t: Date.now() };
    this._emit(type, payload);
  }

  _emit(kind, payload) {
    if (this.bus) this.bus.emit('audio_cue', { kind, layer: this.currentLayer, payload });
    const am = this.services && this.services.get ? this.services.get('AudioManager') : null;
    if (am && typeof am.playLayer === 'function') am.playLayer(kind);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DMGlobalServices, DMPlayerExperience, DMOnboarding, DMAudioDirector,
    DM_PLAYER_EXPERIENCE_STEPS, DM_ONBOARDING_STEPS, dmAudioLayerFor
  };
}
if (typeof window !== 'undefined') {
  window.DMGlobalServices = DMGlobalServices;
  window.DMPlayerExperience = DMPlayerExperience;
  window.DMOnboarding = DMOnboarding;
  window.DMAudioDirector = DMAudioDirector;
}
