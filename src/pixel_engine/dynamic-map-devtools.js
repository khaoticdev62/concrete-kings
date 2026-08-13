/**
 * Concrete Kings: Dynamic Narrative Map — Dev Tools (PRD §112 + §113)
 *
 * Two developer panels, mounted on top of the existing map:
 *   §112 SCENARIO SIMULATOR — pick location/characters/time/world-state,
 *         GENERATE -> candidate scenarios, priority scores, requirements,
 *         AI proposals, final scenario list.
 *   §113 MAP CONTENT EDITOR — create locations, position nodes, define routes,
 *         create scenarios, configure requirements, define rumors, configure
 *         events, define NPC schedules — without touching code.
 *
 * Pure DOM construction; emits intents to DMMapState. No authoritative logic.
 */

class DMDevTools {
  constructor(state, system) {
    this.state = state;
    this.system = system;
    this.root = null;
    this.tab = 'sim'; // 'sim' | 'editor'
  }

  mount(parentId) {
    if (typeof document === 'undefined') return;
    const parent = document.getElementById(parentId) || document.body;
    const root = document.createElement('div');
    root.id = 'dmDevTools';
    root.style.cssText = 'position:fixed;top:8px;right:8px;width:340px;max-height:92vh;overflow:auto;' +
      'background:#0e1018ee;color:#cbd5ed;border:1px solid #2a2f40;border-radius:8px;' +
      'font:11px monospace;z-index:9999;padding:10px;box-shadow:0 8px 30px #000a;';
    root.innerHTML = this._template();
    parent.appendChild(root);
    this.root = root;
    this._wire();
    this.render();
  }

  _template() {
    return `
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <button data-tab="sim" class="dmTab">SIMULATOR §112</button>
        <button data-tab="editor" class="dmTab">EDITOR §113</button>
        <button id="dmClose" style="margin-left:auto;">✕</button>
      </div>
      <div id="dmSim" style="display:none;"></div>
      <div id="dmEditor" style="display:none;"></div>
      <button id="dmValidate" class="secondary" style="margin-top:8px;width:100%;">VALIDATE MAP (§114/§115)</button>
      <div id="dmOut" style="margin-top:8px;white-space:pre-wrap;color:#9affc0;"></div>
    `;
  }

  _wire() {
    if (!this.root) return;
    this.root.querySelectorAll('.dmTab').forEach(b => {
      b.onclick = () => { this.tab = b.dataset.tab; this.render(); };
    });
    const close = this.root.querySelector('#dmClose');
    if (close) close.onclick = () => { this.root.style.display = 'none'; };
    const validate = this.root.querySelector('#dmValidate');
    if (validate) validate.onclick = () => this._validate();
  }

  render() {
    if (!this.root) return;
    this.root.querySelectorAll('.dmTab').forEach(b => {
      b.style.borderColor = b.dataset.tab === this.tab ? '#ffcd68' : '';
    });
    const sim = this.root.querySelector('#dmSim');
    const ed = this.root.querySelector('#dmEditor');
    if (this.tab === 'sim') { sim.style.display = 'block'; ed.style.display = 'none'; this._renderSim(sim); }
    else { sim.style.display = 'none'; ed.style.display = 'block'; this._renderEditor(ed); }
  }

  // ---------------- §112 SCENARIO SIMULATOR ----------------
  _renderSim(el) {
    const locs = Object.values(this.state._locations);
    const chars = Object.values(this.state._characters);
    const timeOpts = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'LATE_NIGHT'].map(t => `<option value="${t}">${t}</option>`).join('');
    const locOpts = locs.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
    const charOpts = chars.map(c => `<label style="display:block;"><input type="checkbox" class="dmChar" value="${c.id}"> ${c.name}</label>`).join('');
    el.innerHTML = `
      <div style="color:#ffcd68;margin-bottom:6px;">SCENARIO SIMULATOR</div>
      <label>LOCATION <select id="dmSimLoc">${locOpts}</select></label>
      <div style="margin-top:6px;">CHARACTERS ${charOpts}</div>
      <label style="display:block;margin-top:6px;">TIME <select id="dmSimTime">${timeOpts}</select></label>
      <label style="display:block;margin-top:6px;">WORLD STATE
        <select id="dmSimWorld">
          <option value="default">default</option>
          <option value="faction_war">faction war active</option>
          <option value="police_present">police present</option>
          <option value="low_security">low security</option>
        </select>
      </label>
      <button id="dmSimGen" class="secondary" style="margin-top:8px;width:100%;">GENERATE</button>
    `;
    const gen = el.querySelector('#dmSimGen');
    gen.onclick = () => this._runSim(el);
  }

  _runSim(el) {
    const locId = el.querySelector('#dmSimLoc').value;
    const time = el.querySelector('#dmSimTime').value;
    const world = el.querySelector('#dmSimWorld').value;
    const picked = Array.from(el.querySelectorAll('.dmChar:checked')).map(c => c.value);

    // Build a simulated context from selections (does not mutate live state)
    const simState = this.state; // use live state as base; generation is read-only
    // Apply transient world-state modifiers for the simulation
    const prevTime = simState.timeBlock;
    simState.timeBlock = time;

    const out = { location: locId, time, characters: picked, worldState: world, candidates: [], aiProposals: [], finalList: [] };

    // Candidate scenarios at this location
    const atLoc = simState.scenariosForLocation(locId).filter(s => s.status !== 'HIDDEN' && s.status !== 'LOCKED');
    atLoc.forEach(s => {
      out.candidates.push({ id: s.id, title: s.title, type: s.type, priority: simState.scenarioPriority(s), requirements: s.requirements });
    });

    // AI director proposals (§106-§107) — generated from context
    const proposals = this._aiProposals(locId, picked, time, world);
    out.aiProposals = proposals.map(p => ({ location_id: p.locationId, type: p.type, objective: p.objective, reason: p.reason }));

    // Final scenario list: merge candidates + proposals, dedupe, rank by priority
    const merged = {};
    atLoc.forEach(s => { merged[s.id] = { id: s.id, title: s.title, priority: simState.scenarioPriority(s), source: 'existing' }; });
    proposals.forEach(p => {
      const id = 'ai_' + p.type.toLowerCase() + '_' + p.locationId;
      merged[id] = { id, title: (p.title || (p.type + ' @ ' + p.locationId)), priority: 5, source: 'ai' };
    });
    out.finalList = Object.values(merged).sort((a, b) => b.priority - a.priority).slice(0, 7);

    // restore time
    simState.timeBlock = prevTime;

    this._print(out);
  }

  _aiProposals(locId, chars, time, world) {
    // §106-§107: AI may propose scenarios but cannot move money/relationships
    // directly — it only proposes; the game rules normalize & gate them.
    const proposals = [];
    if (world === 'faction_war') proposals.push({ locationId: locId, type: 'COMBAT', title: 'Territory Clash', objective: 'defend_block', reason: 'faction war active' });
    if (world === 'police_present') proposals.push({ locationId: locId, type: 'ESCAPE', title: 'Cool Exit', objective: 'avoid_bust', reason: 'police presence' });
    if (chars.includes('marcus')) proposals.push({ locationId: locId, type: 'STORY', title: 'Marcus Pitch', objective: 'build_trust', reason: 'relationship_tension' });
    if (world === 'low_security') proposals.push({ locationId: locId, type: 'HEIST', title: 'Easy Lick', objective: 'grab_loot', reason: 'low security' });
    if (!proposals.length) proposals.push({ locationId: locId, type: 'SOCIAL', title: 'Street Word', objective: 'gather_info', reason: 'ambient' });
    return proposals;
  }

  // ---------------- §113 MAP CONTENT EDITOR ----------------
  _renderEditor(el) {
    const locOpts = Object.values(this.state._locations).map(l => `<option value="${l.id}">${l.name}</option>`).join('');
    const charOpts = Object.values(this.state._characters).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    el.innerHTML = `
      <div style="color:#ffcd68;margin-bottom:6px;">MAP CONTENT EDITOR</div>

      <details open>
        <summary>LOCATION</summary>
        <div style="margin-top:4px;">
          id <input id="edLocId" size="10"> name <input id="edLocName" size="10"><br>
          type <select id="edLocType">
            <option>RESTAURANT</option><option>HOME</option><option>PARK</option>
            <option>APARTMENT</option><option>CLUB</option><option>ALLEY</option>
          </select> state <select id="edLocState">
            <option>SAFE</option><option>ACTIVE</option><option>TENSE</option>
            <option>DANGEROUS</option><option>UNDER_SURVEILLANCE</option>
          </select><br>
          x <input id="edLocX" size="4" value="480"> y <input id="edLocY" size="4" value="270">
          <button id="edLocAdd" class="secondary">ADD</button>
        </div>
      </details>

      <details>
        <summary>MOVE NODE</summary>
        <div style="margin-top:4px;">
          <select id="edMoveLoc">${locOpts}</select>
          x <input id="edMoveX" size="4" value="480"> y <input id="edMoveY" size="4" value="270">
          <button id="edMoveBtn" class="secondary">MOVE</button>
        </div>
      </details>

      <details>
        <summary>ROUTE</summary>
        <div style="margin-top:4px;">
          id <input id="edRouteId" size="10"><br>
          from <select id="edRouteFrom">${locOpts}</select>
          to <select id="edRouteTo">${locOpts}</select><br>
          danger <input id="edRouteDanger" size="3" value="0.3">
          <button id="edRouteAdd" class="secondary">ADD</button>
        </div>
      </details>

      <details>
        <summary>SCENARIO</summary>
        <div style="margin-top:4px;">
          id <input id="edScId" size="10"> title <input id="edScTitle" size="10"><br>
          loc <select id="edScLoc">${locOpts}</select>
          type <select id="edScType">
            <option>STORY</option><option>SOCIAL</option><option>INVESTIGATION</option>
            <option>ESCAPE</option><option>HEIST</option><option>COMBAT</option><option>FACTION</option>
          </select><br>
          reqs (comma) <input id="edScReq" size="16" placeholder="player_present"><br>
          <button id="edScAdd" class="secondary">ADD</button>
        </div>
      </details>

      <details>
        <summary>RUMOR</summary>
        <div style="margin-top:4px;">
          id <input id="edRumId" size="10"><br>
          text <input id="edRumText" size="18"><br>
          reveals <input id="edRumReveals" size="10" placeholder="scenario_id">
          <button id="edRumAdd" class="secondary">ADD</button>
        </div>
      </details>

      <details>
        <summary>EVENT</summary>
        <div style="margin-top:4px;">
          id <input id="edEvId" size="10"> name <input id="edEvName" size="10"><br>
          unlocks <input id="edEvUnlocks" size="12" placeholder="scenario_id">
          <button id="edEvAdd" class="secondary">ADD</button>
        </div>
      </details>

      <details>
        <summary>NPC SCHEDULE</summary>
        <div style="margin-top:4px;">
          char <select id="edSchedChar">${charOpts}</select><br>
          MORNING <input id="edSchedM" size="8"><br>
          AFTERNOON <input id="edSchedA" size="8"><br>
          EVENING <input id="edSchedE" size="8"><br>
          NIGHT <input id="edSchedN" size="8"><br>
          LATE_NIGHT <input id="edSchedL" size="8"><br>
          <button id="edSchedBtn" class="secondary">SET</button>
        </div>
      </details>

      <button id="edRefresh" class="secondary" style="margin-top:8px;width:100%;">REFRESH MAP</button>
    `;
    this._wireEditor(el);
  }

  _wireEditor(el) {
    const click = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = fn; };
    click('#edLocAdd', () => {
      try {
        const spec = {
          id: el.querySelector('#edLocId').value.trim(),
          name: el.querySelector('#edLocName').value.trim(),
          type: el.querySelector('#edLocType').value,
          state: el.querySelector('#edLocState').value,
          coordinates: { x: +el.querySelector('#edLocX').value || 480, y: +el.querySelector('#edLocY').value || 270 }
        };
        if (!spec.id) return this._print({ error: 'location id required' });
        this.state.createLocation(spec);
        this._print({ ok: 'created location ' + spec.id });
        this.render(); // refresh dropdowns so new location appears in route/scenario selects
        if (this.system) this.system.renderFrame();
      } catch (e) { this._print({ error: e.message }); }
    });
    click('#edMoveBtn', () => {
      const id = el.querySelector('#edMoveLoc').value;
      const x = +el.querySelector('#edMoveX').value || 0, y = +el.querySelector('#edMoveY').value || 0;
      this.state.moveLocation(id, x, y);
      this._print({ ok: 'moved ' + id + ' -> ' + x + ',' + y });
      if (this.system) this.system.renderFrame();
    });
    click('#edRouteAdd', () => {
      try {
        this.state.addRoute({
          id: el.querySelector('#edRouteId').value.trim(),
          origin: el.querySelector('#edRouteFrom').value,
          destination: el.querySelector('#edRouteTo').value,
          danger: parseFloat(el.querySelector('#edRouteDanger').value) || 0.3
        });
        this._print({ ok: 'added route' });
      } catch (e) { this._print({ error: e.message }); }
    });
    click('#edScAdd', () => {
      try {
        const reqs = el.querySelector('#edScReq').value.split(',').map(s => s.trim()).filter(Boolean);
        this.state.createScenario({
          id: el.querySelector('#edScId').value.trim(),
          title: el.querySelector('#edScTitle').value.trim(),
          locationId: el.querySelector('#edScLoc').value,
          type: el.querySelector('#edScType').value,
          requirements: reqs
        });
        this._print({ ok: 'created scenario' });
      } catch (e) { this._print({ error: e.message }); }
    });
    click('#edRumAdd', () => {
      this.state.addRumorNode({
        id: el.querySelector('#edRumId').value.trim(),
        text: el.querySelector('#edRumText').value.trim(),
        reveals: el.querySelector('#edRumReveals').value.trim() || null
      });
      this._print({ ok: 'added rumor' });
    });
    click('#edEvAdd', () => {
      const unlocks = el.querySelector('#edEvUnlocks').value.split(',').map(s => s.trim()).filter(Boolean);
      this.state.defineEvent({ id: el.querySelector('#edEvId').value.trim(), name: el.querySelector('#edEvName').value.trim(), unlocks });
      this._print({ ok: 'defined event' });
    });
    click('#edSchedBtn', () => {
      const map = { MORNING: '#edSchedM', AFTERNOON: '#edSchedA', EVENING: '#edSchedE', NIGHT: '#edSchedN', LATE_NIGHT: '#edSchedL' };
      const routine = {};
      Object.entries(map).forEach(([tb, sel]) => { const v = el.querySelector(sel).value.trim(); if (v) routine[tb] = { location: v }; });
      this.state.setCharacterSchedule(el.querySelector('#edSchedChar').value, routine);
      this._print({ ok: 'set NPC schedule' });
    });
    click('#edRefresh', () => { if (this.system) this.system.renderFrame(); this._print({ ok: 'map refreshed' }); });
  }

  _validate() {
    if (typeof DMMapValidator === 'undefined' && typeof require !== 'undefined') {
      try { DMMapValidator = require('./dynamic-map-testharness.js').DMMapValidator; } catch (e) { return this._print({ error: 'validator not available' }); }
    }
    if (typeof DMMapValidator === 'undefined') return this._print({ error: 'validator not available' });
    const report = new DMMapValidator(this.state).run();
    const summary = {
      status: report.ok ? 'VALID ✓' : 'INVALID ✗',
      critical: report.criticalCount,
      warnings: report.warningCount,
      categories: Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, { checked: v.checked, failures: v.failures }])),
      orphans: report.orphans.map(o => `[${o.code}] ${o.message}`),
      warnings_detail: report.warnings.map(o => `[${o.code}] ${o.message}`)
    };
    this._print(summary);
    return report;
  }

  _print(obj) {
    if (!this.root) return;
    const out = this.root.querySelector('#dmOut');
    if (out) out.textContent = JSON.stringify(obj, null, 2);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DMDevTools };
}
if (typeof window !== 'undefined') {
  window.DMDevTools = DMDevTools;
}
