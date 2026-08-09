/**
 * Concrete Kings: The Block Chronicles
 * Consequence & Canon Event Chronicle Engine (Spec v3.0)
 *
 * Tracks visual consequence flows, creates permanent Canon Event cards ("The World Remembers"),
 * and maintains the persistent Campaign Chronicle timeline.
 */

class ChronicleCanonEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.canonEvents = [];
    this.chronicle = [];
    this.loadState();
  }

  loadState() {
    if (!this.storage) return;
    try {
      const canonRaw = this.storage.getItem('ck-canon-events');
      if (canonRaw) this.canonEvents = JSON.parse(canonRaw);
      const chronRaw = this.storage.getItem('ck-chronicle');
      if (chronRaw) this.chronicle = JSON.parse(chronRaw);
    } catch (e) {}
  }

  saveState() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-canon-events', JSON.stringify(this.canonEvents));
      this.storage.setItem('ck-chronicle', JSON.stringify(this.chronicle));
    } catch (e) {}
  }

  addCanonEvent(title, description, day = 1, districtKey = 'HARLEM', tags = []) {
    const id = `canon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const eventCard = {
      id,
      title,
      description,
      day,
      districtKey,
      tags,
      timestamp: Date.now(),
      isCanon: true
    };

    this.canonEvents.push(eventCard);
    this.addChronicleEntry(day, `CANON EVENT: ${title} — ${description}`, 'CANON');
    this.saveState();
    return eventCard;
  }

  addChronicleEntry(day, text, category = 'STORY') {
    const entry = {
      id: `entry_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      day,
      text,
      category,
      timestamp: Date.now()
    };
    this.chronicle.push(entry);
    this.saveState();
    return entry;
  }

  getCanonEvents() {
    return [...this.canonEvents];
  }

  getChronicleByDay() {
    const grouped = {};
    this.chronicle.forEach(item => {
      if (!grouped[item.day]) grouped[item.day] = [];
      grouped[item.day].push(item);
    });
    return grouped;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChronicleCanonEngine };
}
if (typeof window !== 'undefined') {
  window.ChronicleCanonEngine = ChronicleCanonEngine;
}
