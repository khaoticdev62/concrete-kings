/**
 * Concrete Kings: Dynamic Narrative Map — UI Controller
 *
 * PRD-aligned (CRPG-MAP-PRD-001 §82-§88, §110, §120). Reads/writes DOM ids
 * only; emits intents to state. No authoritative state mutation here.
 */

const MAP_MODE_LABELS = {
  STORY: 'Story',
  WORLD: 'World',
  PEOPLE: 'People',
  RUMORS: 'Rumors',
  FACTIONS: 'Factions'
};

// PRD §12 controller mapping
const DM_CONTROLLER_HINTS = [
  '[L-Stick] Pan   [R-Stick] Zoom',
  '[A] Select   [B] Back   [X] Details',
  '[Y] Filters   [LB/RB] Layers',
  '[LT] Zoom Out   [RT] Zoom In',
  '[Start] Map Menu   [Select] Journal'
].join('   ');

class DMUI {
  constructor(state) {
    this.state = state;
    this.els = {};
    this.app = null;
    this.selectedScenarioId = null;
  }

  init(state, app) {
    this.state = state;
    this.app = app;
    if (typeof document === 'undefined') return;
    this.els = {
      topLocation: document.getElementById('topBarLocation'),
      topTime: document.getElementById('topBarTime'),
      topStatus: document.getElementById('topBarStatus'),
      modeRail: document.getElementById('mapModeRail'),
      filterWrap: document.getElementById('mapFilterWrap'),
      canvas: document.getElementById('narrativeMapCanvas'),
      overlay: document.getElementById('mapOverlay'),
      overlayTitle: document.getElementById('mapOverlayTitle'),
      overlayBody: document.getElementById('mapOverlayBody'),
      nodeDetails: document.getElementById('mapNodeDetails'),
      feed: document.getElementById('worldActivityFeed'),
      controllerHint: document.getElementById('mapControllerHint')
    };
    this._buildModeRail();
    if (this.els.controllerHint) this.els.controllerHint.textContent = DM_CONTROLLER_HINTS;
  }

  _buildModeRail() {
    const rail = this.els.modeRail;
    if (!rail) return;
    rail.innerHTML = '';
    Object.entries(MAP_MODE_LABELS).forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.className = 'secondary';
      btn.textContent = label.toUpperCase();
      btn.dataset.mode = key;
      btn.onclick = () => {
        this.state.setMode(key);
        this._buildModeRail();
        this.renderStatusBar();
      };
      rail.appendChild(btn);
    });
    this._refreshModeHighlight();
  }

  _refreshModeHighlight() {
    if (!this.els.modeRail) return;
    Array.from(this.els.modeRail.children).forEach(btn => {
      const active = btn.dataset.mode === this.state.mode;
      btn.disabled = active;
      btn.style.opacity = active ? '1' : '';
      btn.style.borderColor = active ? '#ffcd68' : '';
    });
  }

  // PRD §83 node detail panel
  renderNodeDetails(locationId) {
    const el = this.els.nodeDetails;
    if (!el) return;
    const loc = this.state.getLocation(locationId);
    if (!loc) { el.innerHTML = ''; return; }
    const chars = this.state.charactersAt(locationId).map(c => c.name);
    const scens = this.state.scenariosForLocation(locationId).map(s => (s.status === 'HIDDEN' ? '? ' : '★ ') + s.title);
    const rumors = Object.values(this.state._rumors).filter(r => r.discovered && r.locationId === locationId).map(r => '"' + r.text + '"');
    const routes = this.state.routesFrom(locationId).map(r => '→ ' + (this.state.getLocation(r.destination) || {}).name);
    const obls = Object.values(this.state._obligations).filter(o => o.target === locationId && !o.met).map(o => '⚑ ' + o.label);
    const threads = Object.values(this.state._threads).filter(t => t.status === 'active').map(t => '∞ ' + t.title + (t.current_stage ? ' (' + t.current_stage + ')' : ''));
    el.innerHTML =
      `<div style="color:#ffcd68;font-size:12px;margin-bottom:4px;">${loc.name.toUpperCase()}</div>` +
      (loc.state ? `<div>STATUS<br>⚠ ${loc.state}</div>` : '') +
      (chars.length ? `<div>PEOPLE<br>${chars.join(', ')}</div>` : '') +
      (scens.length ? `<div>ACTIVE SITUATIONS<br>${scens.join('<br>')}</div>` : '') +
      (obls.length ? `<div>OBLIGATIONS<br>${obls.join('<br>')}</div>` : '') +
      (threads.length ? `<div>THREADS<br>${threads.join('<br>')}</div>` : '') +
      (rumors.length ? `<div>RUMORS<br>${rumors.join('<br>')}</div>` : '') +
      (routes.length ? `<div>TRAVEL<br>${routes.join('<br>')}</div>` : '') +
      `<div style="color:#9aa0b5;font-size:9px;margin-top:6px;">[A] ENTER  [B] BACK  [X] DETAILS  [LB/RB] LAYER</div>`;
  }

  // PRD §84 scenario card
  showScenarioCard(scenarioId) {
    const s = this.state.getScenario(scenarioId);
    if (!s) return;
    this.selectedScenarioId = scenarioId;
    if (!this.els.overlay) return;
    const risk = s.urgency && s.urgency.level ? s.urgency.level.toUpperCase() : 'MODERATE';
    const body =
      `<div style="color:#ffcd68;font-size:14px;margin-bottom:6px;">★ ${s.title}</div>` +
      `<div style="margin-bottom:6px;">${s.summary || ''}</div>` +
      (s.participants && s.participants.length ? `<div>PEOPLE<br>${s.participants.join(', ')}</div>` : '') +
      `<div>RISK<br>${risk}</div>` +
      (s.expiration ? `<div>TIME<br>${s.expiration.time_block}</div>` : '') +
      `<div style="margin-top:8px;"><button class="secondary" onclick="window.__dmPlay('${s.id}')">[PLAY SCENE]</button></div>`;
    if (this.els.overlayTitle) this.els.overlayTitle.textContent = 'Situation';
    if (this.els.overlayBody) this.els.overlayBody.innerHTML = body;
    this.els.overlay.style.display = 'block';
    this.state.openOverlay();
    this.els.overlay.focus();
  }

  showOverlay(title, body) {
    if (!this.els.overlay) return;
    if (this.els.overlayTitle) this.els.overlayTitle.textContent = title || '';
    if (this.els.overlayBody) this.els.overlayBody.innerHTML = body || '';
    this.els.overlay.style.display = 'block';
    this.state.openOverlay();
    this.els.overlay.focus();
  }

  renderFeed(feed) {
    const el = this.els.feed;
    if (!el) return;
    el.innerHTML = (feed || []).slice(0, 6).map(item => `<div>${item.text}</div>`).join('');
  }

  renderStatusBar() {
    const loc = this.state.getLocation(this.state.activeLocationId);
    const name = loc ? loc.name : 'UNKNOWN';
    if (this.els.topLocation) this.els.topLocation.textContent = name.toUpperCase();
    if (this.els.topTime) this.els.topTime.textContent = this.state.timeBlock;
    if (this.els.topStatus) {
      const app = this.app || {};
      const game = app.game || {};
      const players = Array.isArray(game.players) ? game.players : [];
      const idx = typeof app.humanIndex === 'number' ? app.humanIndex : 0;
      const player = players[idx];
      const rep = player && player.stats ? player.stats.reputation : 0;
      this.els.topStatus.textContent = `REP ${rep} · ${game.weatherMode || 'CLEAR'}`;
    }
  }

  // PRD §110 debug mode
  renderDebug() {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('mapDebug');
    if (!el) return;
    const snap = this.state.snapshot();
    el.textContent = JSON.stringify({
      mode: snap.mode, time: snap.timeBlock, active: snap.activeLocationId,
      scenarios: Object.values(snap.scenarios).map(s => s.id + ':' + s.status),
      factions: Object.values(snap.factions).map(f => f.id + '=' + (f.controlledLocations || []).length + '[' + (f.territory || '?') + ']'),
      obligations: Object.keys(snap.obligations || {}).length,
      threads: Object.keys(snap.threads || {}).length,
      events: Object.values(snap.events || {}).filter(e => e.active).map(e => e.id),
      relationships: snap.relationships
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DMUI, MAP_MODE_LABELS, DM_CONTROLLER_HINTS };
}
if (typeof window !== 'undefined') {
  window.DMUI = DMUI;
  window.MAP_MODE_LABELS = MAP_MODE_LABELS;
}
