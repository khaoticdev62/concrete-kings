/**
 * Concrete Kings: Dynamic Narrative Map — UX Systems (PRD §121-§131)
 *
 * §121  DMHaptics            — controller haptic patterns (configurable)
 * §122/§123 DMTransitionDirector — map↔scene transition phase sequences
 * §124  enforced by the fromScene sequence (consequence animation is mandatory)
 * §125  DMNarrativeFeedback  — visual relationship/situation text blocks
 * §126/§127 DMMinigameBridge — scenario → minigame mapping + discovery examples
 * §128  DMEconomyModel       — resource costs a scenario may demand
 * §129  opportunityCard()    — the cost/benefit opportunity card data
 * §130/§131 DMDecisionAxes   — design tension axes (data, for AI director)
 *
 * Engine-agnostic (no DOM/audio/canvas). Deterministic + unit-testable.
 */

// §121 — haptic patterns (configurable intensities)
const DM_HAPTIC_PATTERNS = {
  node_selection:   { intensity: 0.3, duration_ms: 40, repeat: 1, label: 'select' },
  new_event:        { intensity: 0.5, duration_ms: 60, repeat: 2, label: 'event' },
  urgent_scenario:  { intensity: 0.8, duration_ms: 120, repeat: 1, label: 'urgent' },
  map_transition:   { intensity: 0.6, duration_ms: 200, repeat: 1, label: 'transition' },
  major_consequence:{ intensity: 1.0, duration_ms: 250, repeat: 2, label: 'consequence' }
};

class DMHaptics {
  constructor(bus, profile) {
    this.bus = bus || null;
    this.enabled = true;
    this.profile = Object.assign({}, DM_HAPTIC_PATTERNS, profile || {}); // override intensities
  }
  configure(name, opts) { this.profile[name] = Object.assign({}, this.profile[name] || {}, opts); }
  setEnabled(on) { this.enabled = !!on; }
  trigger(kind, ctx) {
    const pat = this.profile[kind];
    if (!pat || !this.enabled) return null;
    const signal = { kind, pattern: pat, ctx: ctx || null, t: Date.now() };
    if (this.bus) this.bus.emit('haptic', signal);
    return signal;
  }
}

// §122/§123 — transition phase sequences. Each phase is emitted so the
// renderer/UI can animate; the order is the contract.
const DM_TRANSITION_TO_SCENE = [
  'select_node', 'expand_node', 'card_appears', 'participant_portraits',
  'stakes_display', 'player_confirm', 'camera_zoom', 'scene_machine'
];
const DM_TRANSITION_FROM_SCENE = [
  'scene_end', 'final_moment_hold', 'fade', 'map_return',
  'consequence_animation', 'old_node_changes', 'new_node_reveals', 'event_feed_update'
  // §124: consequence_animation MUST occur before the player is "back on the map"
];

class DMTransitionDirector {
  constructor(bus) { this.bus = bus || null; this.onPhase = null; }
  // returns the phase list; if cb provided, invokes cb(phase, index) in order
  toScene(cb) { return this._run(DM_TRANSITION_TO_SCENE, cb, 'to_scene'); }
  fromScene(cb) { return this._run(DM_TRANSITION_FROM_SCENE, cb, 'from_scene'); }
  _run(phases, cb, name) {
    phases.forEach((p, i) => {
      if (this.bus) this.bus.emit('transition_phase', { name, phase: p, index: i });
      if (typeof cb === 'function') cb(p, i);
    });
    return phases.slice();
  }
  // §124 guard: consequence_animation must precede the final phase return
  enforcesConsequenceAnimation() {
    const seq = DM_TRANSITION_FROM_SCENE;
    return seq.indexOf('consequence_animation') < seq.indexOf('event_feed_update')
      && seq.indexOf('consequence_animation') > seq.indexOf('map_return');
  }
}

// §125 — narrative feedback text blocks
class DMNarrativeFeedback {
  // e.g. narrativeRelationshipText('MARCUS', 72) -> block like the PRD example
  relationshipText(name, trust, broken) {
    const bar = '●' + '─'.repeat(Math.max(0, Math.min(8, Math.round(trust / 12)))) + (broken ? 'X' : '') + '─'.repeat(Math.max(0, 8 - Math.round(trust / 12))) + 'PLAYER';
    return `${name}\nTrust: ${trust}\n\n${bar}`;
  }
  situationText(text) { return `NEW SITUATION\n${text}`; }
}

// §126/§127 — minigame bridge
class DMMinigameBridge {
  // Map a scenario/location to a minigame type. Uses location tags + scenario type.
  minigameFor(scenario, location) {
    if (!scenario || !location) return null;
    const tags = location.tags || [];
    const type = location.type;
    if (tags.includes('locked') || type === 'WAREHOUSE' || scenario.type === 'ESCAPE') return 'lockpick';
    if (tags.includes('highway') || tags.includes('driving') || scenario.type === 'PURSUIT') return 'driving';
    if (type === 'CLUB' || tags.includes('social') || scenario.type === 'SOCIAL') return 'conversation';
    return null; // no minigame for this scenario
  }
  // §127 discovery examples (static reference set)
  discoveryExamples() {
    return [
      { location: 'WAREHOUSE', trigger: 'Locked Door', minigame: 'lockpick' },
      { location: 'HIGHWAY', trigger: 'Police Pursuit', minigame: 'driving' },
      { location: 'CLUB', trigger: 'Social Pressure', minigame: 'conversation' }
    ];
  }
  // §126 full chain
  chain(scenario, location) {
    const mg = this.minigameFor(scenario, location);
    return { from: 'MAP', scenario: scenario && scenario.id, minigame: mg, result: 'RESULT', scene: 'SCENE', consequence: 'CONSEQUENCE' };
  }
}

// §128 — economy model: what a scenario may cost
const DM_RESOURCE_KEYS = ['money', 'time', 'health', 'reputation', 'relationships', 'information', 'cards', 'risk'];

class DMEconomyModel {
  // scenario.costs may carry explicit values; otherwise infer sensible defaults.
  scenarioCosts(scenario, state) {
    const out = {};
    const explicit = (scenario && scenario.costs) || {};
    DM_RESOURCE_KEYS.forEach(k => { if (explicit[k] != null) out[k] = explicit[k]; });
    // inference for missing fields
    if (out.time == null && scenario) {
      const loc = state && state.getLocation(scenario.locationId);
      const route = loc && state.activeLocationId ? (state.routesFrom(state.activeLocationId) || []).find(r => r.destination === loc.id) : null;
      out.time = route ? route.travel_time : 1;
    }
    if (out.risk == null && scenario) {
      const lvl = scenario.urgency && scenario.urgency.level;
      out.risk = lvl === 'high' ? 'HIGH' : (scenario.hidden ? 'MODERATE' : 'LOW');
    }
    return out;
  }
}

// §129 — opportunity card data
function dmOpportunityCard(scenario, state) {
  if (!scenario) return null;
  const costs = new DMEconomyModel().scenarioCosts(scenario, state);
  let benefit = 'Unknown';
  if (Array.isArray(scenario.rewards) && scenario.rewards.length) benefit = scenario.rewards.map(r => r.label || r.type || r).join(', ');
  else if (scenario.consequences && scenario.consequences.rewards) benefit = scenario.consequences.rewards;
  else {
    // §144: derive a benefit framing so the card never says "go here" with no upside.
    const parts = [];
    const chars = (scenario.participants || []).filter(p => p && p !== 'player');
    if (chars.length) parts.push(chars.map(c => `${c[0].toUpperCase() + c.slice(1)} Trust ↑`).join(', '));
    if (scenario.type === 'STORY') parts.push('Progresses the story');
    else if (scenario.type === 'SOCIAL') parts.push('Builds the connection');
    else if (scenario.type === 'FACTION') parts.push('Shifts the balance');
    else if (scenario.type === 'ESCAPE') parts.push('Gets you out');
    benefit = parts.length ? parts.join(', ') : 'A new situation';
  }
  return {
    title: scenario.title || scenario.id,
    costs,
    benefit,
    canPlay: scenario.status ? ['AVAILABLE', 'URGENT', 'NEW', 'EXPIRING'].includes(scenario.status) : true
  };
}

// §130/§131 — design tension axes (data used by AI director / card generation)
const DMDecisionAxes = [
  { axis: 'GOOD vs GOOD' },
  { axis: 'GOOD vs BAD' },
  { axis: 'NOW vs LATER' },
  { axis: 'SAFE vs RISKY' },
  { axis: 'PERSON vs OBJECTIVE' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DMHaptics, DM_HAPTIC_PATTERNS, DMTransitionDirector,
    DM_TRANSITION_TO_SCENE, DM_TRANSITION_FROM_SCENE,
    DMNarrativeFeedback, DMMinigameBridge, DMEconomyModel, DM_RESOURCE_KEYS,
    dmOpportunityCard, DMDecisionAxes
  };
}
if (typeof window !== 'undefined') {
  window.DMHaptics = DMHaptics;
  window.DMTransitionDirector = DMTransitionDirector;
  window.DMNarrativeFeedback = DMNarrativeFeedback;
  window.DMMinigameBridge = DMMinigameBridge;
  window.DMEconomyModel = DMEconomyModel;
  window.dmOpportunityCard = dmOpportunityCard;
  window.DMDecisionAxes = DMDecisionAxes;
}
