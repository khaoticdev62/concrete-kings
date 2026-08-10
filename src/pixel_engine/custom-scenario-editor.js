/**
 * Concrete Kings: The Block Chronicles
 * Custom Scenario Editor & UGC Sharing Engine
 *
 * Implements custom scenario design (Title, Description, WHO/WHAT/HOW/TWIST Objectives, Tag Affinities),
 * Base64 sharing code generation (`SCN_...`), code decoding, and local scenario library management.
 */

class CustomScenarioEditorEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.customScenarios = this.loadLibrary();
  }

  loadLibrary() {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem('ck-custom-scenarios');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  saveLibrary() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-custom-scenarios', JSON.stringify(this.customScenarios));
    } catch (e) {}
  }

  createScenarioTemplate(config = {}) {
    return {
      id: config.id || `scn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: config.title || 'THE HEIST AT 125TH',
      description: config.description || 'A high-stakes operation on Harlem main street.',
      objectives: {
        WHO: config.whoObjective || 'Who leads the heist?',
        WHAT: config.whatObjective || 'What are we stealing?',
        HOW: config.howObjective || 'How do we enter?',
        TWIST: config.twistObjective || 'What goes wrong?'
      },
      tagAffinity: config.tagAffinity || 'street',
      createdAt: Date.now()
    };
  }

  exportScenarioCode(scenarioObj) {
    if (!scenarioObj || !scenarioObj.title) return null;
    const clean = {
      t: scenarioObj.title,
      d: scenarioObj.description,
      w: scenarioObj.objectives ? scenarioObj.objectives.WHO : '',
      wt: scenarioObj.objectives ? scenarioObj.objectives.WHAT : '',
      h: scenarioObj.objectives ? scenarioObj.objectives.HOW : '',
      tw: scenarioObj.objectives ? scenarioObj.objectives.TWIST : '',
      a: scenarioObj.tagAffinity || 'street'
    };

    try {
      const jsonStr = JSON.stringify(clean);
      const b64 = typeof btoa !== 'undefined' ? btoa(jsonStr) : Buffer.from(jsonStr).toString('base64');
      return `SCN_${b64}`;
    } catch (e) {
      return null;
    }
  }

  importScenarioCode(codeString) {
    if (!codeString || typeof codeString !== 'string' || !codeString.startsWith('SCN_')) {
      return { success: false, reason: 'Invalid scenario code format. Code must start with SCN_.' };
    }

    try {
      const rawB64 = codeString.replace('SCN_', '');
      const jsonStr = typeof atob !== 'undefined' ? atob(rawB64) : Buffer.from(rawB64, 'base64').toString('utf8');
      const data = JSON.parse(jsonStr);

      const scenario = this.createScenarioTemplate({
        title: data.t,
        description: data.d,
        whoObjective: data.w,
        whatObjective: data.wt,
        howObjective: data.h,
        twistObjective: data.tw,
        tagAffinity: data.a
      });

      return { success: true, scenario };
    } catch (e) {
      return { success: false, reason: 'Failed to decode scenario code string.' };
    }
  }

  saveCustomScenario(scenario) {
    if (!scenario || !scenario.id) return false;
    const existingIndex = this.customScenarios.findIndex(s => s.id === scenario.id);
    if (existingIndex >= 0) {
      this.customScenarios[existingIndex] = scenario;
    } else {
      this.customScenarios.push(scenario);
    }
    this.saveLibrary();
    return true;
  }

  getCustomScenarios() {
    return [...this.customScenarios];
  }

  deleteCustomScenario(id) {
    this.customScenarios = this.customScenarios.filter(s => s.id !== id);
    this.saveLibrary();
    return true;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CustomScenarioEditorEngine };
}
if (typeof window !== 'undefined') {
  window.CustomScenarioEditorEngine = CustomScenarioEditorEngine;
}
