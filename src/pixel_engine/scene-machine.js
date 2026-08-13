/**
 * Concrete Kings — CARD RPG Scene Machine (PRD CRPG-SM-PRD-001)
 *
 * Data-driven, deterministic, modular narrative scene playback runtime.
 * This is the JS prototype that mirrors the Godot 4.5 target design.
 *
 * Layers (PRD §2/§8):
 *   CARD SYSTEM -> SCENARIO RESOLVER -> SCENE COMPILER -> SCENE GRAPH
 *   -> PLAYBACK ENGINE (Actor/Animation/Camera/Dialogue/Audio/VFX/MiniGame)
 *   -> CONSEQUENCE ENGINE -> WORLD STATE (+ CHRONICLE)
 *
 * Design rules enforced here (PRD §6, §49, §51, §57, §107):
 *   - Data, not code: scenes are plain objects; no engine change to add a scene.
 *   - Deterministic: seeds from scenario+cards+actor; no Math.random.
 *   - Resolve-then-play: outcome is computed and SAVED before playback (§51).
 *   - Skip applies the already-resolved outcome; never rerolls (§57).
 *   - The machine never interprets card meaning; tags -> templates -> beats (§107).
 */

// PRD §19 animation priority + §16 states, §20 expressions
const SM_ANIM_PRIORITY = { IDLE: 1, TALK: 2, REACTION: 3, ACTION: 4, CINEMATIC: 5 };
const SM_ANIM_STATES = ['IDLE','WALK','RUN','TALK','LISTEN','POINT','LOOK','SURPRISE','ANGER','LAUGH','SAD','CONFUSED','THREATEN','GRAB','GIVE','TAKE','ATTACK','DEFEND','FALL','EXIT'];
const SM_EXPRESSIONS = ['neutral','happy','sad','angry','shocked','confused','afraid','disgusted','deadpan','laughing'];
const SM_CAMERA_PRESETS = ['WIDE','MEDIUM','CLOSE','REACTION','OVER_SHOULDER','DRAMATIC','ESTABLISHING','FOLLOW'];
const SM_BEAT_TYPES = ['ENTER','EXIT','MOVE','FACE','LOOK','DIALOGUE','REACTION','ANIMATION','CAMERA','WAIT','SOUND','MUSIC','VFX','SPAWN','DESPAWN','INTERACT','MINI_GAME','BRANCH','CONSEQUENCE','END'];
const SM_PLAYBACK_STATES = ['INITIALIZING','LOADING','ESTABLISHING','PLAYING','WAITING','DIALOGUE','INTERACTION','MINI_GAME','BRANCHING','RESOLVING','COMPLETE','SKIPPING','PAUSED','ERROR'];
const SM_OUTCOMES = ['SUCCESS','PARTIAL_SUCCESS','FAILURE','CHAOTIC_SUCCESS','CHAOTIC_FAILURE'];

// ----------------------------- tiny event emitter -----------------------------
function smEmit(emitter, event, payload) { if (emitter && typeof emitter.emit === 'function') emitter.emit(event, payload); }

// ----------------------------- Actor Manager (§12/§13) -----------------------------
class ActorManager {
  constructor() { this.actors = {}; }
  spawn(id, spec) { this.actors[id] = Object.assign({ id, state: 'IDLE', expression: 'neutral', x: 0, y: 0, facing: 'forward' }, spec || {}); return this.actors[id]; }
  despawn(id) { delete this.actors[id]; }
  get(id) { return this.actors[id] || null; }
  play(id, anim) { const a = this.get(id); if (a) { a.state = anim; a._animPriority = SM_ANIM_PRIORITY[anim] || 0; } }
  face(id, dir) { const a = this.get(id); if (a) a.facing = dir; }
  express(id, expr) { const a = this.get(id); if (a && SM_EXPRESSIONS.includes(expr)) a.expression = expr; }
  moveTo(id, x, y) { const a = this.get(id); if (a) { a.x = x; a.y = y; } }
  list() { return Object.values(this.actors); }
}

// ----------------------------- Animation Manager (§16/§18) -----------------------------
class AnimationManager {
  constructor() { this.current = {}; }
  play(actorId, anim) { this.current[actorId] = { anim, since: Date.now() }; return SM_ANIM_STATES.includes(anim) ? anim : null; }
  priorityOf(anim) { return SM_ANIM_PRIORITY[anim] || 0; }
}

// ----------------------------- Camera Manager (§23/§24) -----------------------------
class CameraManager {
  constructor() { this.preset = 'MEDIUM'; this.target = null; this.shake = 0; }
  set(preset, target, opts) { if (SM_CAMERA_PRESETS.includes(preset)) this.preset = preset; this.target = target || null; this._opts = opts || {}; return this.preset; }
  shake(amount) { this.shake = amount; }
}

// ----------------------------- Dialogue Manager (§21/§22) -----------------------------
class DialogueManager {
  constructor() { this.lines = []; }
  say(actorId, text, opts) { const line = { actor: actorId, text, emotion: (opts && opts.emotion) || 'neutral', camera: (opts && opts.camera) || null, sfx: (opts && opts.sfx) || null }; this.lines.push(line); return line; }
}

// ----------------------------- Audio Manager (§60/§61) -----------------------------
class AudioManager {
  constructor() { this.cues = []; this.volumes = { music:1, ambient:1, dialogue:1, sfx:1, ui:1, voice:1, reactions:1 }; }
  playMusic(action) { this.cues.push({ kind:'music', action }); }
  sfx(id) { this.cues.push({ kind:'sfx', id }); }
  setVolume(bus, v) { if (bus in this.volumes) this.volumes[bus] = v; }
}

// ----------------------------- VFX Manager (§62) -----------------------------
class VFXManager {
  constructor() { this.effects = []; }
  play(id) { this.effects.push(id); return id; }
  lighting(mode) { this._lighting = mode; }
}

// ----------------------------- Chronicle Manager (§54) -----------------------------
class ChronicleManager {
  constructor() { this.events = []; }
  record(entry) { const e = Object.assign({ id: 'evt_' + (this.events.length + 1), day: entry.day || 1 }, entry); this.events.push(e); return e; }
  list() { return this.events.slice(); }
}

// ----------------------------- Save Manager (§51/§53) -----------------------------
class SaveManager {
  constructor() { this.store = {}; }
  // §51: result is saved BEFORE presentation
  saveResult(key, result) { this.store[key] = JSON.parse(JSON.stringify(result)); return this.store[key]; }
  load(key) { return this.store[key] || null; }
  saveWorld(world) { this.world = JSON.parse(JSON.stringify(world)); }
  loadWorld() { return this.world || null; }
}

// ----------------------------- Seed (§49/§50) -----------------------------
function smHash(str) {
  // deterministic FNV-1a-ish hash; no Math.random
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function smSeed(scenario, cards) {
  const key = [scenario && scenario.id, cards && cards.who, cards && cards.what, cards && cards.how, cards && cards.twist]
    .map(v => (v && (v.text || v)) || '').join('|');
  return smHash(key);
}

// ----------------------------- Card templates (§38/§39/§40) -----------------------------
// Data-only: the compiler matches tags to a template and emits beats from the
// template's `beats` array + optional `minigame`. Adding a new scene/template is
// pure data (PRD §92). Selection priority (§40): EXACT -> TAG -> CONTEXT -> GENERIC.
const SM_TEMPLATES = {
  social_confrontation: {
    id: 'social_confrontation', match: ['aggressive','social','intimidation','confrontation'], minigame: 'negotiation',
    beats: ['establish','approach','confrontation','reaction','escalation','outcome']
  },
  crime_theft: {
    id: 'crime_theft', match: ['crime','steal','theft','sneaky'], minigame: 'escape',
    beats: ['establish','approach','action','reaction','escalation','outcome']
  },
  action_chase: {
    id: 'action_chase', match: ['action','chase','run','escape','fast'], minigame: 'escape',
    beats: ['establish','approach','action','reaction','escalation','outcome']
  },
  investigation_search: {
    id: 'investigation_search', match: ['investigation','search','discover','evidence'], minigame: 'search',
    beats: ['establish','approach','action','reaction','outcome']
  },
  chaos_event: {
    id: 'chaos_event', match: ['chaos','absurd','public','disaster','wild'], minigame: null,
    beats: ['establish','reaction','escalation','outcome']
  },
  negotiation: {
    id: 'negotiation', match: ['negotiation','peace','deal','barter'], minigame: 'negotiation',
    beats: ['establish','approach','confrontation','reaction','outcome']
  },
  interrogation: {
    id: 'interrogation', match: ['interrogation','question','pressure','truth'], minigame: 'search',
    beats: ['establish','approach','confrontation','reaction','outcome']
  },
  stealth: {
    id: 'stealth', match: ['stealth','sneak','hide','quiet'], minigame: 'search',
    beats: ['establish','approach','action','outcome']
  },
  persuasion: {
    id: 'persuasion', match: ['persuasion','convince','charm','appeal'], minigame: 'negotiation',
    beats: ['establish','approach','confrontation','reaction','outcome']
  },
  GENERIC_INTERACTION: {
    id: 'GENERIC_INTERACTION', match: [], minigame: null,
    beats: ['establish','approach','outcome']
  }
};

/**
 * DMScenarioTypes -> preferred scene tags, best first.
 *
 * Only used when the player's cards carry no recognised tag at all. Listed as
 * tags rather than template ids so this survives templates being renamed or
 * added in data (scene-content.js registers more at runtime).
 */
const SM_TYPE_TAGS = {
  INVESTIGATION: ['investigation', 'search'],
  MYSTERY: ['investigation', 'search'],
  HEIST: ['crime', 'theft', 'stealth'],
  ESCAPE: ['action', 'chase', 'escape'],
  COMBAT: ['action', 'confrontation'],
  NEGOTIATION: ['negotiation', 'deal'],
  FACTION: ['negotiation', 'confrontation'],
  BOSS: ['confrontation', 'aggressive'],
  SOCIAL: ['social', 'persuasion'],
  CHARACTER: ['persuasion', 'social'],
  ROMANCE: ['persuasion', 'charm'],
  STORY: ['social'],
  RANDOM_EVENT: ['chaos', 'wild'],
  TRAVEL: ['action']
};

// ----------------------------- Card Compiler (§35/§36/§41) -----------------------------
class CardCompiler {
  constructor(templates) { this.templates = templates || SM_TEMPLATES; }

  /**
   * Cards are intent, so card tags still decide the scene. The scenario only
   * breaks the tie.
   *
   * This used to take `cards` alone and fall straight to GENERIC_INTERACTION
   * when no tag matched, which meant an INVESTIGATION scenario played as a
   * generic conversation whenever the player's four cards happened to carry no
   * recognised tag — the scene forgot what it was about. The scenario's own
   * type is a fact the compiler already had and was throwing away.
   *
   * Order is deliberate and unchanged at the top: exact card id, then card
   * tags, then scenario type, then generic. A card can still take an
   * INVESTIGATION somewhere unexpected, which is the whole point of the card
   * system; it just can no longer land nowhere.
   */
  selectTemplate(cards, scenario) {
    const tags = this._collectTags(cards);
    // EXACT: a template whose id matches a card id
    for (const t of Object.values(this.templates)) {
      const cid = (cards.what && cards.what.id) || (cards.how && cards.how.id) || '';
      if (t.id === cid) return t;
    }
    // TAG match
    for (const t of Object.values(this.templates)) {
      if (t.id === 'GENERIC_INTERACTION') continue;
      if (t.match.some(m => tags.includes(m))) return t;
    }
    // SCENARIO TYPE: the scene should still know what kind of situation it is.
    const byType = this._templateForScenarioType(scenario && scenario.type);
    if (byType) return byType;
    // CONTEXT / GENERIC fallback (§41: never crash)
    return this.templates.GENERIC_INTERACTION;
  }

  /**
   * Scenario type -> the tag its scene is closest to. Mapped through the
   * existing `match` vocabulary rather than a parallel id list, so a template
   * renamed or replaced in data keeps working without touching this.
   */
  _templateForScenarioType(type) {
    const wanted = SM_TYPE_TAGS[type];
    if (!wanted) return null;
    for (const tag of wanted) {
      for (const t of Object.values(this.templates)) {
        if (t.id === 'GENERIC_INTERACTION') continue;
        if (t.match.includes(tag)) return t;
      }
    }
    return null;
  }

  _collectTags(cards) {
    const tags = [];
    ['who','what','how','twist'].forEach(k => {
      const c = cards && cards[k];
      if (c && Array.isArray(c.tags)) tags.push(...c.tags);
    });
    return tags;
  }

  // cards -> scene graph (list of beats) (§35). Beats are derived from the
  // selected template's `beats` array (data), so new scenes need no engine change.
  compile(scenario, cards) {
    const template = this.selectTemplate(cards, scenario);
    const seed = smSeed(scenario, cards);
    const who = (cards && cards.who && (cards.who.text || cards.who.id)) || 'someone';
    const what = (cards && cards.what && (cards.what.text || cards.what.id)) || 'do something';
    const how = (cards && cards.how && (cards.how.text || cards.how.id)) || 'normally';
    const twist = (cards && cards.twist && (cards.twist.text || cards.twist.id)) || null;
    const participants = (scenario && scenario.participants) || [];
    const allParticipants = Array.from(new Set(['player'].concat(participants, [who]).filter(p => p && p !== 'narrator')));
    const beats = this._expandBeats(template, { scenario, who, what, how, twist });
    return {
      id: (scenario && scenario.id) || 'scene',
      template: template.id,
      seed,
      beats,
      participants: allParticipants,
      minigame: template.minigame || null
    };
  }

  // Turn a template's token list into concrete beats using the submitted cards.
  _expandBeats(template, ctx) {
    const { scenario, who, what, how, twist } = ctx;
    const tokens = template.beats || ['establish','approach','outcome'];
    const loc = scenario && scenario.location;
    const others = (scenario && scenario.participants || []).filter(p => p !== 'player' && p !== 'narrator');
    const beats = [];
    if (tokens.includes('establish')) {
      beats.push({ type: 'ENTER', actor: 'player', location: loc });
      others.forEach(p => beats.push({ type: 'ENTER', actor: p }));
      beats.push({ type: 'CAMERA', preset: 'ESTABLISHING', target: 'player' });
    }
    if (tokens.includes('approach')) {
      beats.push({ type: 'DIALOGUE', actor: 'player', text: `Alright, I'm going to ${what}.`, emotion: 'determined' });
      if (who && who !== 'player') beats.push({ type: 'DIALOGUE', actor: who, text: `${who}: You really think ${how} is going to work?`, emotion: 'skeptical' });
    }
    if (tokens.includes('confrontation') && who && who !== 'player') {
      beats.push({ type: 'REACTION', actor: who, expression: 'angry' });
    }
    if (tokens.includes('action') && who && who !== 'player') {
      beats.push({ type: 'ANIMATION', actor: who, anim: 'ACTION' });
    }
    if (twist) {
      beats.push({ type: 'DIALOGUE', actor: 'narrator', text: `Then: ${twist}.`, emotion: 'shocked' });
      if (who && who !== 'player') beats.push({ type: 'REACTION', actor: who, expression: 'shocked' });
      beats.push({ type: 'CAMERA', preset: 'DRAMATIC', target: who });
    }
    if (tokens.includes('escalation') && !twist) {
      beats.push({ type: 'DIALOGUE', actor: 'narrator', text: 'Things escalate quickly.', emotion: 'angry' });
    }
    // optional mini-game node (§45) — id comes from template data, not engine code
    if (template.minigame) {
      beats.push({
        type: 'MINI_GAME', id: template.minigame, difficulty: 'medium',
        success: { next: 'outcome' }, failure: { next: 'outcome' }
      });
    }
    // outcome (always present) + end
    beats.push({ type: 'CONSEQUENCE', outcome: 'RESOLVED' });
    beats.push({ type: 'END' });
    return beats;
  }
}

// ----------------------------- Scene Validator (§72/§73) -----------------------------
class SceneValidator {
  validate(sceneGraph, opts) {
    const errors = [];
    const sg = sceneGraph || {};
    const beats = sg.beats || [];
    const participants = new Set((sg.participants || []).concat(['player','narrator']));
    const locations = (opts && opts.locations) || ['diner','street','apartment','office','police_station'];
    if (!sg.location && !opts) {/* location optional in some scenes */}
    if (!beats.length) errors.push({ problem: 'Scene has no beats.', fix: 'Add at least one beat.' });
    beats.forEach((b, i) => {
      if (!SM_BEAT_TYPES.includes(b.type)) {
        errors.push({ beat: i + 1, problem: `Invalid beat type "${b.type}".`, fix: 'Use a known beat type.' });
      }
      if ((b.type === 'DIALOGUE' || b.type === 'REACTION') && b.actor && !participants.has(b.actor)) {
        errors.push({ beat: i + 1, problem: `Actor "${b.actor}" does not exist.`, fix: `Add "${b.actor}" to participants.` });
      }
      if (b.type === 'DIALOGUE' && !(b.text || b.actor === 'narrator')) {
        errors.push({ beat: i + 1, problem: 'Dialogue beat missing text.', fix: 'Add a text field.' });
      }
      if (b.type === 'BRANCH' && typeof b.condition !== 'string') {
        errors.push({ beat: i + 1, problem: 'Branch beat missing condition.', fix: 'Add a condition expression.' });
      }
      if (b.type === 'MINI_GAME' && !b.id) {
        errors.push({ beat: i + 1, problem: 'Mini-game beat missing id.', fix: 'Add a mini-game id.' });
      }
    });
    // missing fallback check
    if (sceneGraph && sceneGraph.template === undefined && beats.length === 0) {
      errors.push({ problem: 'No template and no beats (missing fallback).', fix: 'Provide GENERIC_INTERACTION fallback.' });
    }
    return { valid: errors.length === 0, errors };
  }
}

// ----------------------------- Scene Loader (§9.1) -----------------------------
class SceneLoader {
  constructor(library) { this.library = library || {}; }
  register(id, sceneDef) { this.library[id] = sceneDef; }
  load(id) {
    const def = this.library[id];
    if (!def) return { error: `Scene "${id}" not found.` };
    // normalize: ensure beats array exists
    return { id, location: def.location || null, participants: def.participants || ['player'], beats: def.beats || [], seed: def.seed || 0 };
  }
}

// ----------------------------- Mini-Game Manager (§45/§47) -----------------------------
// Prefix SM_ to avoid colliding with mini-game-manager.js's MiniGameManager in the
// browser's shared global scope (see global-collisions.test.js).
class SM_MiniGameManager {
  constructor() { this.games = {}; }
  register(id, fn) { this.games[id] = fn; }
  // deterministic result from seed (§49): success / partial / failure
  run(id, seed, params) {
    const fn = this.games[id];
    if (fn) return fn(seed, params);
    const r = seed % 3;
    return r === 0 ? 'SUCCESS' : r === 1 ? 'PARTIAL_SUCCESS' : 'FAILURE';
  }
}

// ----------------------------- Consequence Manager (§52/§53) -----------------------------
class ConsequenceManager {
  constructor(world) { this.world = world || { relationships: {}, flags: [], reputation: 0, faction_standing: {}, quests: [] }; }
  apply(consequences) {
    const list = consequences || [];
    list.forEach(c => {
      const target = c.target;
      if (!target) return;
      if (/(trust|hostility|suspicion|standing|reputation)/.test(target)) {
        const bucket = /reputation/.test(target) ? 'reputation' : 'relationships';
        if (c.operation === 'set') this.world[bucket][target] = c.value;
        else this.world[bucket][target] = (this.world[bucket][target] || 0) + c.value;
      } else if (c.operation === 'add') {
        if (!this.world.flags.includes(target)) this.world.flags.push(target);
      }
    });
    return this.world;
  }
}

// ----------------------------- Beat System (§30/§31) -----------------------------
// Executes one beat at a time; validates, executes, reports completion.
// Headless-safe: managers record events instead of touching the DOM.
class BeatSystem {
  constructor(runtime) { this.rt = runtime; }
  validate(beat) {
    if (!beat || !SM_BEAT_TYPES.includes(beat.type)) return { valid: false, reason: 'Unknown beat type' };
    return { valid: true };
  }
  execute(beat) {
    const rt = this.rt;
    const v = this.validate(beat);
    if (!v.valid) return { ok: false, reason: v.reason };
    switch (beat.type) {
      case 'ENTER':
        rt.actors.spawn(beat.actor, { location: beat.location });
        smEmit(rt.bus, 'sm:actor_entered', { actor: beat.actor });
        break;
      case 'EXIT':
        rt.actors.despawn(beat.actor);
        break;
      case 'MOVE':
        rt.actors.moveTo(beat.actor, beat.x || 0, beat.y || 0);
        rt.anim.play(beat.actor, 'WALK');
        break;
      case 'FACE': rt.actors.face(beat.actor, beat.target); break;
      case 'LOOK': rt.actors.face(beat.actor, beat.target); break;
      case 'DIALOGUE':
        rt.actors.express(beat.actor, (beat.emotion && SM_EXPRESSIONS.includes(beat.emotion)) ? beat.emotion : 'neutral');
        rt.dialogue.say(beat.actor, beat.text || '', { emotion: beat.emotion, camera: beat.camera, sfx: beat.sfx });
        rt.camera.set(beat.camera || 'MEDIUM', beat.actor);
        smEmit(rt.bus, 'sm:dialogue', { actor: beat.actor, text: beat.text });
        break;
      case 'REACTION':
        rt.actors.express(beat.actor, (beat.expression && SM_EXPRESSIONS.includes(beat.expression)) ? beat.expression : 'neutral');
        rt.anim.play(beat.actor, 'REACTION');
        smEmit(rt.bus, 'sm:reaction', { actor: beat.actor, expression: beat.expression });
        break;
      case 'ANIMATION': rt.anim.play(beat.actor, beat.anim || 'IDLE'); break;
      case 'CAMERA': rt.camera.set(beat.preset || 'MEDIUM', beat.target, beat); break;
      case 'WAIT': /* duration handled by runtime scheduler */ break;
      case 'SOUND': rt.audio.sfx(beat.id); break;
      case 'MUSIC': rt.audio.playMusic(beat.action); break;
      case 'VFX': rt.vfx.play(beat.id); break;
      case 'SPAWN': rt.actors.spawn(beat.target, {}); break;
      case 'DESPAWN': rt.actors.despawn(beat.target); break;
      case 'INTERACT': smEmit(rt.bus, 'sm:interact', { actor: beat.actor, target: beat.target }); break;
      case 'MINI_GAME':
        rt.rt = rt.rt; // noop placeholder
        smEmit(rt.bus, 'sm:minigame', { id: beat.id, difficulty: beat.difficulty });
        break;
      case 'BRANCH': smEmit(rt.bus, 'sm:branch', { condition: beat.condition }); break;
      case 'CONSEQUENCE': smEmit(rt.bus, 'sm:consequence', { outcome: beat.outcome }); break;
      case 'END': rt.state = 'COMPLETE'; break;
      default: break;
    }
    return { ok: true };
  }
}

// ----------------------------- Scene Runtime (§55/§56/§57/§86) -----------------------------
class SceneRuntime {
  constructor(opts) {
    opts = opts || {};
    this.bus = opts.bus || null;
    this.actors = opts.actors || new ActorManager();
    this.anim = opts.anim || new AnimationManager();
    this.camera = opts.camera || new CameraManager();
    this.dialogue = opts.dialogue || new DialogueManager();
    this.audio = opts.audio || new AudioManager();
    this.vfx = opts.vfx || new VFXManager();
    this.chronicle = opts.chronicle || new ChronicleManager();
    this.save = opts.save || new SaveManager();
    this.consequence = opts.consequence || new ConsequenceManager(opts.world);
    this.minigame = opts.minigame || new SM_MiniGameManager();
    this.beats = new BeatSystem(this);
    this.state = 'INITIALIZING';
    this.beatIndex = 0;
    this.speed = 1.0;       // §58 fast-forward 1/2/4
    this.paused = false;
    this.skipped = false;
    this.graph = null;
    this.outcome = null;     // resolved before playback (§51)
  }

  // §51: resolve outcome and SAVE before playback
  load(graph, resolvedOutcome, consequences) {
    this.state = 'LOADING';
    this.graph = graph;
    this.beatIndex = 0;
    // outcome resolved & saved first
    this.outcome = resolvedOutcome || 'RESOLVED';
    const seed = graph && graph.seed ? graph.seed : 0;
    this.save.saveResult((graph && graph.id) || 'scene', { outcome: this.outcome, seed, consequences: consequences || [] });
    this.state = 'ESTABLISHING';
    return { ok: true, seeded: seed };
  }

  // deterministic outcome from cards+seed (§49). Not a reroll on skip (§57).
  resolveOutcome(seed) { return SM_OUTCOMES[seed % SM_OUTCOMES.length]; }

  play() {
    if (!this.graph) return { ok: false, reason: 'No scene loaded' };
    this.state = 'PLAYING';
    try {
      this._runToEnd();
    } catch (e) {
      // §87 failure recovery: preserve resolved state, generic fallback
      this.state = 'ERROR';
      this._error = String(e && e.message || e);
      return { ok: false, error: this._error };
    }
    return { ok: true, outcome: this.outcome, beatCount: this.beatIndex };
  }

  _runToEnd() {
    const beats = (this.graph.beats || []);
    while (this.beatIndex < beats.length) {
      if (this.paused) break;
      const beat = beats[this.beatIndex];
      const r = this.beats.execute(beat);
      if (!r.ok) {
        // recovery: skip broken beat, keep going (never corrupt save)
        smEmit(this.bus, 'sm:beat_error', { beat: this.beatIndex + 1, reason: r.reason });
      }
      this.beatIndex++;
      if (this.state === 'COMPLETE') break;
    }
    if (this.state !== 'COMPLETE') this.state = 'COMPLETE';
  }

  // §57 skip: jump straight to resolved outcome, apply consequences, no reroll
  skip() {
    this.skipped = true;
    this.state = 'SKIPPING';
    // do not re-execute beats; outcome already resolved
    this.state = 'COMPLETE';
    return { skipped: true, outcome: this.outcome };
  }

  // §58 fast-forward multiplier
  setSpeed(mult) { this.speed = (mult === 2 || mult === 4) ? mult : 1.0; return this.speed; }

  pause() { this.paused = true; this.state = 'PAUSED'; }
  resume() { this.paused = false; this.state = 'PLAYING'; }

  // apply the resolved consequences to world state + chronicle (§52/§54)
  finish(consequenceList, chronicleEntry) {
    if (consequenceList) this.consequence.apply(consequenceList);
    if (chronicleEntry) this.chronicle.record(chronicleEntry);
    this.save.saveWorld(this.consequence.world);
    this.state = 'COMPLETE';
    return { world: this.consequence.world, chronicle: this.chronicle.list() };
  }
}

// ----------------------------- SceneMachine facade -----------------------------
// Single entry point that ties compilers + managers + runtime together (§8/§116).
class SceneMachine {
  constructor(opts) {
    opts = opts || {};
    this.bus = opts.bus || null;
    this.world = opts.world || { relationships: {}, flags: [], reputation: 0, faction_standing: {}, quests: [] };
    this.loader = opts.loader || new SceneLoader();
    this.compiler = opts.compiler || new CardCompiler();
    this.validator = opts.validator || new SceneValidator();
    this.runtime = new SceneRuntime(Object.assign({ bus: this.bus, world: this.world }, opts));
  }

  // Compile cards -> validate -> produce a runnable scene graph (§35/§72)
  buildScene(scenario, cards) {
    const graph = this.compiler.compile(scenario, cards);
    const v = this.validator.validate(graph, { locations: true });
    return { graph, validation: v, seed: graph.seed };
  }

  // Full flow: build + resolve + play + consequences + chronicle (§7/§116)
  playScenario(scenario, cards, consequences, chronicleEntry) {
    const { graph, validation } = this.buildScene(scenario, cards);
    if (!validation.valid) return { ok: false, reason: 'scene-invalid', errors: validation.errors };
    const seed = graph.seed;
    const outcome = this.runtime.resolveOutcome(seed);
    this.runtime.load(graph, outcome, consequences);
    const played = this.runtime.play();
    const done = this.runtime.finish(consequences, chronicleEntry);
    smEmit(this.bus, 'sm:scene_complete', { scenario: scenario && scenario.id, outcome, world: done.world });
    return { ok: played.ok, outcome, world: done.world, chronicle: done.chronicle, seed };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SceneMachine, SceneRuntime, BeatSystem, SM_ANIM_PRIORITY, SM_ANIM_STATES, SM_EXPRESSIONS, SM_CAMERA_PRESETS,
    SM_BEAT_TYPES, SM_PLAYBACK_STATES, SM_OUTCOMES,
    ActorManager, AnimationManager, CameraManager, DialogueManager, AudioManager, VFXManager,
    ChronicleManager, SaveManager, smEmit, smSeed, smHash,
    SM_TEMPLATES, SM_TYPE_TAGS, CardCompiler, SceneValidator, SceneLoader, SM_MiniGameManager, ConsequenceManager
  };
}

if (typeof window !== 'undefined') {
  window.SceneMachine = SceneMachine;
  window.SM_TEMPLATES = SM_TEMPLATES;
  window.SM_BEAT_TYPES = SM_BEAT_TYPES;
  window.SM_PLAYBACK_STATES = SM_PLAYBACK_STATES;
  window.SM_OUTCOMES = SM_OUTCOMES;
}
