/**
 * Concrete Kings: Dynamic Narrative Map — Test Harness & Orphan Detection
 *
 * PRD §114 (MAP TEST HARNESS) + §115 (ORPHAN DETECTION).
 *
 * Data-driven validation over a DMMapState instance. Produces a report with
 * per-category §114 checks (location/route/scenario/character/thread/rumor/
 * event) and a list of §115 orphans (referential-integrity violations that are
 * CRITICAL — a CI build must fail on these).
 *
 * Engine-agnostic: operates on the live state collections, no DOM/canvas.
 */

// Requirement tokens that are valid without referencing a character.
const DM_KNOWN_REQUIREMENT_TOKENS = new Set([
  'always', 'has_cash', 'reputation_min', 'low_heat', 'high_heat',
  'in_gang', 'out_of_jail', 'owns_territory'
]);

class DMMapValidator {
  constructor(state) {
    this.state = state;
    this.issues = []; // { code, severity, message, ref }
  }

  _add(severity, code, message, ref) {
    this.issues.push({ severity, code, message, ref: ref || null });
  }

  _charIds() {
    return new Set(['player', ...Object.keys(this.state._characters || {})]);
  }

  _locationIds() {
    return new Set(Object.keys(this.state._locations || {}));
  }

  // ---- §114 category checks ----
  _checkLocations() {
    const res = { checked: 0, failures: 0 };
    const locIds = this._locationIds();
    // Every location referenced by another structure must exist.
    const refs = [];
    Object.values(this.state._scenarios || {}).forEach(s => refs.push(['scenario', s.id, s.locationId]));
    Object.values(this.state._characters || {}).forEach(c => { if (c.locationId) refs.push(['character', c.id, c.locationId]); });
    Object.values(this.state._rumors || {}).forEach(r => { if (r.locationId) refs.push(['rumor', r.id, r.locationId]); });
    refs.forEach(([kind, id, locId]) => {
      res.checked++;
      if (!locIds.has(locId)) {
        res.failures++;
        this._add('critical', 'ORPHAN_LOCATION_REF', `${kind} "${id}" references missing location "${locId}"`, locId);
      }
    });
    return res;
  }

  _checkRoutes() {
    const res = { checked: 0, failures: 0 };
    const locIds = this._locationIds();
    const routes = this.state._routes || {};
    Object.values(routes).forEach(r => {
      res.checked++;
      if (!locIds.has(r.origin)) { res.failures++; this._add('critical', 'ORPHAN_ROUTE_NODE', `route "${r.id}" origin missing: "${r.origin}"`, r.origin); }
      if (!locIds.has(r.destination)) { res.failures++; this._add('critical', 'ORPHAN_ROUTE_NODE', `route "${r.id}" destination missing: "${r.destination}"`, r.destination); }
      // §114: bidirectional where expected — report one-way as warning
      const reverse = Object.values(routes).some(o => o.origin === r.destination && o.destination === r.origin);
      if (!reverse) this._add('warning', 'ROUTE_ONEWAY', `route "${r.id}" (${r.origin}->${r.destination}) has no reverse`, r.id);
    });
    return res;
  }

  _checkScenarios() {
    const res = { checked: 0, failures: 0 };
    const charIds = this._charIds();
    const locIds = this._locationIds();
    Object.values(this.state._scenarios || {}).forEach(s => {
      res.checked++;
      // §115: scenario references missing location
      if (!locIds.has(s.locationId)) { res.failures++; this._add('critical', 'ORPHAN_SCENARIO_LOCATION', `scenario "${s.id}" references missing location "${s.locationId}"`, s.locationId); }
      // §114/§115: every participant must resolve
      (s.participants || []).forEach(p => {
        if (!charIds.has(p)) { res.failures++; this._add('critical', 'ORPHAN_SCENARIO_CHARACTER', `scenario "${s.id}" participant "${p}" does not resolve`, p); }
      });
      // §114: requirements valid
      (s.requirements || []).forEach(req => {
        if (/_present$/.test(req)) {
          const base = req.slice(0, -8);
          if (!charIds.has(base)) { res.failures++; this._add('warning', 'REQ_INVALID_CHAR', `scenario "${s.id}" requirement "${req}" references unknown character`, req); }
        } else if (!DM_KNOWN_REQUIREMENT_TOKENS.has(req)) {
          this._add('warning', 'REQ_UNKNOWN_TOKEN', `scenario "${s.id}" requirement "${req}" is not a recognized token`, req);
        }
      });
    });
    return res;
  }

  _checkCharacters() {
    const res = { checked: 0, failures: 0 };
    const locIds = this._locationIds();
    Object.values(this.state._characters || {}).forEach(c => {
      res.checked++;
      if (c.locationId && !locIds.has(c.locationId)) { res.failures++; this._add('critical', 'ORPHAN_CHARACTER_LOCATION', `character "${c.id}" at missing location "${c.locationId}"`, c.locationId); }
    });
    return res;
  }

  _checkThreads() {
    const res = { checked: 0, failures: 0 };
    const scenIds = new Set(Object.keys(this.state._scenarios || {}));
    Object.values(this.state._threads || {}).forEach(t => {
      res.checked++;
      const stages = t.stages || null;
      const known = stages ? new Set(Object.keys(stages)) : new Set([...(t.available || []), t.current_stage, ...(t.completed || [])].filter(Boolean));
      (t.available || []).forEach(st => {
        if (!known.has(st)) { res.failures++; this._add('warning', 'THREAD_UNREACHABLE', `thread "${t.id}" branch "${st}" is not reachable`, st); }
      });
      if (t.current_stage && !known.has(t.current_stage)) { res.failures++; this._add('warning', 'THREAD_BAD_STAGE', `thread "${t.id}" current_stage "${t.current_stage}" undefined`, t.current_stage); }
      // §115: thread references missing scenario
      (t.scenarioRefs || []).forEach(sid => { if (!scenIds.has(sid)) { res.failures++; this._add('critical', 'ORPHAN_THREAD_SCENARIO', `thread "${t.id}" references missing scenario "${sid}"`, sid); } });
    });
    return res;
  }

  _checkRumors() {
    const res = { checked: 0, failures: 0 };
    const charIds = this._charIds();
    const locIds = this._locationIds();
    const scenIds = new Set(Object.keys(this.state._scenarios || {}));
    Object.values(this.state._rumors || {}).forEach(r => {
      res.checked++;
      // §115: rumor references missing source (if a source is declared)
      if (r.source && !charIds.has(r.source) && !locIds.has(r.source)) { res.failures++; this._add('critical', 'ORPHAN_RUMOR_SOURCE', `rumor "${r.id}" source "${r.source}" does not exist`, r.source); }
      // §114: rumor reveals must point at a real scenario
      if (r.reveals && !scenIds.has(r.reveals)) { res.failures++; this._add('critical', 'ORPHAN_RUMOR_REVEAL', `rumor "${r.id}" reveals missing scenario "${r.reveals}"`, r.reveals); }
      (r.children || []).forEach(cid => { if (!this.state._rumors[cid]) { res.failures++; this._add('warning', 'RUMOR_MISSING_CHILD', `rumor "${r.id}" child "${cid}" missing`, cid); } });
    });
    return res;
  }

  _checkEvents() {
    const res = { checked: 0, failures: 0 };
    const scenIds = new Set(Object.keys(this.state._scenarios || {}));
    const regionIds = new Set(Object.values(this.state._locations || {}).map(l => l.region_id).filter(Boolean));
    Object.values(this.state._eventDefs || {}).forEach(ev => {
      res.checked++;
      // §115: event references missing region (if a region is declared)
      if (ev.region && !regionIds.has(ev.region)) { res.failures++; this._add('critical', 'ORPHAN_EVENT_REGION', `event "${ev.id}" region "${ev.region}" does not exist`, ev.region); }
      // §114: unlocks must reference existing scenarios
      (ev.unlocks || []).forEach(sid => { if (!scenIds.has(sid)) { res.failures++; this._add('critical', 'ORPHAN_EVENT_UNLOCK', `event "${ev.id}" unlocks missing scenario "${sid}"`, sid); } });
    });
    return res;
  }

  // ---- full run ----
  run() {
    this.issues = [];
    const categories = {
      location: this._checkLocations(),
      route: this._checkRoutes(),
      scenario: this._checkScenarios(),
      character: this._checkCharacters(),
      thread: this._checkThreads(),
      rumor: this._checkRumors(),
      event: this._checkEvents()
    };
    const orphans = this.issues.filter(i => i.severity === 'critical');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    return {
      categories,
      orphans,
      warnings,
      criticalCount: orphans.length,
      warningCount: warnings.length,
      ok: orphans.length === 0
    };
  }

  // Convenience: throw if any critical (§115 "build should fail for critical errors")
  assertValid() {
    const report = this.run();
    if (!report.ok) {
      const lines = report.orphans.map(o => `[${o.code}] ${o.message}`).join('\n');
      throw new Error('Map validation failed with ' + report.criticalCount + ' critical error(s):\n' + lines);
    }
    return report;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DMMapValidator, DM_KNOWN_REQUIREMENT_TOKENS };
}
if (typeof window !== 'undefined') {
  window.DMMapValidator = DMMapValidator;
}
