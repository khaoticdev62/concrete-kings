/**
 * CARD RPG Scene Editor (PRD §70/§71/§102)
 *
 * A lightweight, data-driven scene authoring tool. The footage rule (§92) still
 * holds: a new scene authored here is pure data; the playback engine needs no
 * change to run it. This module has two layers:
 *
 *   SceneEditorModel  — DOM-free logic: add/move/delete/validate/serialize/toGraph.
 *                        Unit-testable in Node (no jsdom needed).
 *   SceneEditor       — DOM rendering: palette, timeline, inspector, preview, save/load.
 *
 * The editor produces a `sceneDef` ({ id, location, participants, beats:[] }) that
 * the SceneLoader/SceneMachine can load and play directly.
 */
(function (root, factory) {
  const mod = factory(
    (typeof require !== 'undefined') ? require('./scene-machine.js') : (typeof window !== 'undefined' ? window : {})
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof window !== 'undefined') window.SceneEditorModule = mod;
})(this, function (deps) {
  const SM = deps.SceneMachine ? deps : (typeof window !== 'undefined' ? window : {});
  const SM_BEAT_TYPES = (SM && SM.SM_BEAT_TYPES) || ['ENTER','EXIT','MOVE','FACE','LOOK','DIALOGUE','REACTION','ANIMATION','CAMERA','WAIT','SOUND','MUSIC','VFX','SPAWN','DESPAWN','INTERACT','MINI_GAME','BRANCH','CONSEQUENCE','END'];
  const SceneValidator = SM.SceneValidator || null;

  // Default field values per beat type, so the inspector has sane starting points.
  function defaultBeat(type, idx) {
    const b = { type };
    switch (type) {
      case 'ENTER': case 'EXIT': case 'SPAWN': case 'DESPAWN':
        b.actor = (type === 'SPAWN' || type === 'DESPAWN') ? 'npc' : 'player'; break;
      case 'MOVE': b.actor = 'player'; b.x = 0; b.y = 0; b.duration = 1.0; break;
      case 'FACE': case 'LOOK': b.actor = 'player'; b.target = 'narrator'; break;
      case 'DIALOGUE': b.actor = 'player'; b.text = 'New line of dialogue.'; b.emotion = 'neutral'; b.camera = 'MEDIUM'; break;
      case 'REACTION': b.actor = 'player'; b.expression = 'neutral'; break;
      case 'ANIMATION': b.actor = 'player'; b.anim = 'IDLE'; break;
      case 'CAMERA': b.preset = 'MEDIUM'; b.target = 'player'; break;
      case 'WAIT': b.duration = 1.0; break;
      case 'SOUND': b.id = 'door_open'; break;
      case 'MUSIC': b.action = 'intensity_up'; break;
      case 'VFX': b.id = 'smoke'; break;
      case 'INTERACT': b.actor = 'player'; b.target = 'npc'; break;
      case 'MINI_GAME': b.id = 'escape'; b.difficulty = 'medium';
        b.success = { next: 'outcome' }; b.failure = { next: 'outcome' }; break;
      case 'BRANCH': b.condition = "marcus_trust >= 50";
        b.true = [{ type: 'DIALOGUE', actor: 'narrator', text: 'Branch A.' }];
        b.false = [{ type: 'DIALOGUE', actor: 'narrator', text: 'Branch B.' }]; break;
      case 'CONSEQUENCE': b.outcome = 'RESOLVED'; break;
      case 'END': break;
      default: break;
    }
    return b;
  }

  // Which inspector fields apply to a given beat type.
  function fieldsFor(type) {
    const common = ['type'];
    switch (type) {
      case 'ENTER': case 'EXIT': return common.concat(['actor', 'location']);
      case 'SPAWN': case 'DESPAWN': return common.concat(['target']);
      case 'MOVE': return common.concat(['actor', 'x', 'y', 'duration']);
      case 'FACE': case 'LOOK': return common.concat(['actor', 'target']);
      case 'DIALOGUE': return common.concat(['actor', 'text', 'emotion', 'camera']);
      case 'REACTION': return common.concat(['actor', 'expression']);
      case 'ANIMATION': return common.concat(['actor', 'anim']);
      case 'CAMERA': return common.concat(['preset', 'target']);
      case 'WAIT': return common.concat(['duration']);
      case 'SOUND': case 'VFX': return common.concat(['id']);
      case 'MUSIC': return common.concat(['action']);
      case 'INTERACT': return common.concat(['actor', 'target']);
      case 'MINI_GAME': return common.concat(['id', 'difficulty']);
      case 'BRANCH': return common.concat(['condition']);
      case 'CONSEQUENCE': return common.concat(['outcome']);
      case 'END': return common;
      default: return common;
    }
  }

  // -------------------------------------------------------------------------
  // SceneEditorModel — DOM-free editor state + operations (unit-testable).
  // -------------------------------------------------------------------------
  class SceneEditorModel {
    constructor(opts) {
      opts = opts || {};
      this.sceneDef = {
        id: opts.id || 'new_scene',
        location: opts.location || 'diner',
        participants: opts.participants || ['player', 'marcus'],
        beats: opts.beats ? opts.beats.map(b => Object.assign({}, b)) : []
      };
      this.selectedIndex = this.sceneDef.beats.length ? 0 : -1;
    }
    setId(id) { this.sceneDef.id = id; return this; }
    setLocation(loc) { this.sceneDef.location = loc; return this; }
    setParticipants(arr) { this.sceneDef.participants = arr.slice(); return this; }

    addBeat(type, atIndex) {
      if (!SM_BEAT_TYPES.includes(type)) throw new Error('Unknown beat type: ' + type);
      const beat = defaultBeat(type, this.sceneDef.beats.length);
      const i = (typeof atIndex === 'number') ? atIndex : this.sceneDef.beats.length;
      this.sceneDef.beats.splice(i, 0, beat);
      this.selectedIndex = i;
      return beat;
    }
    removeBeat(index) {
      if (index < 0 || index >= this.sceneDef.beats.length) return false;
      this.sceneDef.beats.splice(index, 1);
      if (this.selectedIndex >= this.sceneDef.beats.length) this.selectedIndex = this.sceneDef.beats.length - 1;
      return true;
    }
    moveBeat(index, dir) {
      const j = index + dir;
      if (index < 0 || index >= this.sceneDef.beats.length) return false;
      if (j < 0 || j >= this.sceneDef.beats.length) return false;
      const arr = this.sceneDef.beats;
      const tmp = arr[index]; arr[index] = arr[j]; arr[j] = tmp;
      this.selectedIndex = j;
      return true;
    }
    select(index) { this.selectedIndex = index; return this; }
    updateBeat(index, patch) {
      if (index < 0 || index >= this.sceneDef.beats.length) return false;
      // type is immutable here; only its fields change
      Object.assign(this.sceneDef.beats[index], patch);
      return true;
    }

    validate() {
      if (!SceneValidator) return { valid: true, errors: [], note: 'validator-unavailable' };
      const v = new SceneValidator();
      return v.validate(this.sceneDef, { locations: true });
    }

    // Normalize into the shape SceneLoader/SceneMachine expect.
    toSceneGraph() {
      return {
        id: this.sceneDef.id,
        location: this.sceneDef.location,
        participants: this.sceneDef.participants.slice(),
        beats: this.sceneDef.beats.map(b => Object.assign({}, b)),
        seed: 0
      };
    }
    serialize() { return JSON.parse(JSON.stringify(this.sceneDef)); }
    load(def) {
      if (!def) return false;
      this.sceneDef = {
        id: def.id || 'new_scene',
        location: def.location || 'diner',
        participants: def.participants || ['player', 'marcus'],
        beats: (def.beats || []).map(b => Object.assign({}, b))
      };
      this.selectedIndex = this.sceneDef.beats.length ? 0 : -1;
      return true;
    }
  }

  // -------------------------------------------------------------------------
  // SceneEditor — DOM rendering layer (palette / timeline / inspector / preview).
  // Pure view; all edits go through the SceneEditorModel. Safe to skip in Node.
  // -------------------------------------------------------------------------
  class SceneEditor {
    constructor(opts) {
      opts = opts || {};
      this.model = opts.model || new SceneEditorModel(opts.sceneDef);
      this.sm = opts.sm || null;            // a SceneMachine for preview/play
      this.root = opts.root || null;        // container element
      this.onSave = opts.onSave || null;    // (id, def) => void
      this.onLoad = opts.onLoad || null;    // (id) => sceneDef | null
      this._listeners = {};
    }
    on(evt, fn) { (this._listeners[evt] = this._listeners[evt] || []).push(fn); }
    _emit(evt, payload) { (this._listeners[evt] || []).forEach(fn => fn(payload)); }

    // Build the editor DOM inside this.root.
    mount(root) {
      this.root = root || this.root;
      if (!this.root || typeof document === 'undefined') return this;
      const el = this.root;
      el.innerHTML = `
        <div class="sm-editor" style="display:flex; gap:8px; height:70vh; font-family:'JetBrains Mono',monospace; color:#cbd5ed;">
          <div class="sm-palette" style="width:160px; overflow:auto; border-right:1px solid #2d313d; padding:6px;">
            <div style="color:#ffcd68; font-weight:bold; margin-bottom:6px;">BEATS</div>
            <div class="sm-palette-list"></div>
            <hr style="border-color:#2d313d;">
            <div style="color:#ffcd68; font-weight:bold; margin:6px 0;">SCENE</div>
            <input class="sm-id" placeholder="scene id" style="width:100%; box-sizing:border-box; background:#101116; color:#cbd5ed; border:1px solid #2d313d;">
            <input class="sm-loc" placeholder="location" style="width:100%; box-sizing:border-box; margin-top:4px; background:#101116; color:#cbd5ed; border:1px solid #2d313d;">
            <input class="sm-parts" placeholder="participants csv" style="width:100%; box-sizing:border-box; margin-top:4px; background:#101116; color:#cbd5ed; border:1px solid #2d313d;">
          </div>
          <div class="sm-center" style="flex:1; display:flex; flex-direction:column; min-width:0;">
            <div class="sm-toolbar" style="display:flex; gap:6px; padding:4px; border-bottom:1px solid #2d313d;">
              <button class="sm-validate">Validate</button>
              <button class="sm-play">Preview</button>
              <button class="sm-save">Save</button>
              <select class="sm-load" style="background:#101116; color:#cbd5ed;"><option value="">Load…</option></select>
              <span class="sm-status" style="margin-left:auto; color:#6fe8d8;"></span>
            </div>
            <div class="sm-timeline" style="flex:1; overflow:auto; padding:6px;"></div>
          </div>
          <div class="sm-inspector" style="width:240px; overflow:auto; border-left:1px solid #2d313d; padding:6px;">
            <div style="color:#ffcd68; font-weight:bold; margin-bottom:6px;">INSPECTOR</div>
            <div class="sm-inspector-body"></div>
          </div>
        </div>`;

      // palette buttons
      const pal = el.querySelector('.sm-palette-list');
      SM_BEAT_TYPES.forEach(t => {
        const b = document.createElement('button');
        b.className = 'sm-pal';
        b.textContent = '+ ' + t;
        b.style.cssText = 'display:block; width:100%; text-align:left; margin-bottom:3px; background:#151821; color:#cbd5ed; border:1px solid #2d313d; cursor:pointer;';
        b.onclick = () => { this.model.addBeat(t); this.render(); };
        pal.appendChild(b);
      });

      // scene meta bindings
      const idEl = el.querySelector('.sm-id');
      const locEl = el.querySelector('.sm-loc');
      const partsEl = el.querySelector('.sm-parts');
      idEl.onchange = () => { this.model.setId(idEl.value); this._emit('change', this.model.sceneDef); };
      locEl.onchange = () => { this.model.setLocation(locEl.value); this._emit('change', this.model.sceneDef); };
      partsEl.onchange = () => { this.model.setParticipants(partsEl.value.split(',').map(s => s.trim()).filter(Boolean)); this._emit('change', this.model.sceneDef); };

      el.querySelector('.sm-validate').onclick = () => this.validateAndShow();
      el.querySelector('.sm-play').onclick = () => this.preview();
      el.querySelector('.sm-save').onclick = () => this.save();
      const loadSel = el.querySelector('.sm-load');
      loadSel.onchange = () => {
        const id = loadSel.value;
        if (!id) return;
        const def = this.onLoad ? this.onLoad(id) : (this.sm && this.sm.loader ? this.sm.loader.load(id) : null);
        if (def && def.beats) { this.model.load(def); this.render(); }
      };

      this._refs = { idEl, locEl, partsEl, loadSel, status: el.querySelector('.sm-status') };
      this.render();
      return this;
    }

    _refreshMetaInputs() {
      if (!this._refs) return;
      this._refs.idEl.value = this.model.sceneDef.id;
      this._refs.locEl.value = this.model.sceneDef.location;
      this._refs.partsEl.value = this.model.sceneDef.participants.join(',');
      // populate load dropdown from sm loader
      const sel = this._refs.loadSel;
      if (this.sm && this.sm.loader) {
        const ids = Object.keys(this.sm.loader.library);
        sel.innerHTML = '<option value="">Load…</option>' + ids.map(i => `<option value="${i}">${i}</option>`).join('');
      }
    }

    render() {
      if (!this.root || typeof document === 'undefined') return;
      this._refreshMetaInputs();
      const tl = this.root.querySelector('.sm-timeline');
      tl.innerHTML = '';
      this.model.sceneDef.beats.forEach((beat, i) => {
        const row = document.createElement('div');
        const sel = (i === this.model.selectedIndex);
        row.style.cssText = `padding:5px; margin-bottom:3px; border:1px solid ${sel ? '#ffcd68' : '#2d313d'}; background:${sel ? '#1c1f29' : '#101116'}; cursor:pointer; display:flex; gap:6px; align-items:center;`;
        const label = beat.type + (beat.actor ? ' · ' + beat.actor : '') + (beat.text ? ' · ' + String(beat.text).slice(0, 24) : '');
        row.innerHTML = `<span style="flex:1;">${i + 1}. ${label}</span>`;
        const up = document.createElement('button'); up.textContent = '↑'; up.onclick = (e) => { e.stopPropagation(); this.model.moveBeat(i, -1); this.render(); };
        const dn = document.createElement('button'); dn.textContent = '↓'; dn.onclick = (e) => { e.stopPropagation(); this.model.moveBeat(i, 1); this.render(); };
        const del = document.createElement('button'); del.textContent = '✕'; del.onclick = (e) => { e.stopPropagation(); this.model.removeBeat(i); this.render(); };
        row.appendChild(up); row.appendChild(dn); row.appendChild(del);
        row.onclick = () => { this.model.select(i); this.renderInspector(); };
        tl.appendChild(row);
      });
      this.renderInspector();
    }

    renderInspector() {
      if (!this.root || typeof document === 'undefined') return;
      const body = this.root.querySelector('.sm-inspector-body');
      const i = this.model.selectedIndex;
      if (i < 0 || i >= this.model.sceneDef.beats.length) { body.innerHTML = '<div style="color:#8b95ab;">Select a beat.</div>'; return; }
      const beat = this.model.sceneDef.beats[i];
      const fields = fieldsFor(beat.type).filter(f => f !== 'type');
      let html = `<div style="color:#ffcd68; margin-bottom:4px;">${beat.type}</div>`;
      fields.forEach(f => {
        const val = beat[f];
        html += `<label style="display:block; margin-bottom:4px; font-size:11px;">${f}<br><input data-f="${f}" value="${val === undefined || val === null ? '' : (typeof val === 'object' ? JSON.stringify(val) : val)}" style="width:100%; box-sizing:border-box; background:#101116; color:#cbd5ed; border:1px solid #2d313d;"></label>`;
      });
      body.innerHTML = html;
      body.querySelectorAll('input[data-f]').forEach(inp => {
        inp.onchange = () => {
          let v = inp.value;
          if (v === 'true') v = true; else if (v === 'false') v = false;
          else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
          this.model.updateBeat(i, { [inp.dataset.f]: v });
          this._emit('change', this.model.sceneDef);
        };
      });
    }

    validateAndShow() {
      const res = this.model.validate();
      if (this._refs) {
        this._refs.status.textContent = res.valid ? 'VALID ✓' : (res.errors.length + ' ERROR(S)');
        this._refs.status.style.color = res.valid ? '#6fe8d8' : '#ef5a5a';
      }
      this._emit('validate', res);
      return res;
    }

    preview() {
      if (!this.sm) { this._emit('preview', { error: 'no-scene-machine' }); return null; }
      // ensure scene is registered for the runtime
      const g = this.model.toSceneGraph();
      this.sm.loader.register(g.id, g);
      const outcome = this.sm.runtime.resolveOutcome(g.seed || 1);
      this.sm.runtime.load(g, outcome, []);
      const played = this.sm.runtime.play();
      const result = { ok: played.ok, outcome: this.sm.runtime.outcome, dialogue: this.sm.runtime.dialogue.lines.slice(), state: this.sm.runtime.state };
      this._emit('preview', result);
      if (this._refs) { this._refs.status.textContent = played.ok ? 'PREVIEW OK ✓' : 'PREVIEW FAIL'; this._refs.status.style.color = played.ok ? '#6fe8d8' : '#ef5a5a'; }
      return result;
    }

    save() {
      const def = this.model.serialize();
      if (this.sm && this.sm.loader) this.sm.loader.register(def.id, def);
      if (this.onSave) this.onSave(def.id, def);
      if (this._refs) { this._refs.status.textContent = 'SAVED ✓'; this._refs.status.style.color = '#6fe8d8'; }
      this._emit('save', def);
      return def;
    }
  }

  return { SceneEditorModel, SceneEditor, defaultBeat, fieldsFor, SM_BEAT_TYPES };
});
