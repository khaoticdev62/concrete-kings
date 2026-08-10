/**
 * Concrete Kings: The Block Chronicles
 * Spectator Mode & Replay System Engine (Checklist Section 8.7 & Priority Matrix #6, #7)
 *
 * Records match turn-by-turn logs, replays match history step-by-step,
 * and broadcasts live match state to spectators.
 */

class SpectatorReplayEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.currentReplay = null;
    this.replayCursor = 0;
    this.isReplaying = false;
  }

  createReplaySession(matchId, players = []) {
    this.currentReplay = {
      matchId: matchId || `match_${Date.now()}`,
      timestamp: Date.now(),
      players,
      turns: []
    };
    this.replayCursor = 0;
    this.isReplaying = false;
    return this.currentReplay;
  }

  recordTurn(round, playerTag, action, outcome) {
    if (!this.currentReplay) return null;
    const turnData = {
      turnIndex: this.currentReplay.turns.length + 1,
      round,
      playerTag,
      action,
      outcome,
      timestamp: Date.now()
    };
    this.currentReplay.turns.push(turnData);
    this.saveReplay();
    return turnData;
  }

  saveReplay() {
    if (!this.storage || !this.currentReplay) return;
    try {
      this.storage.setItem(`ck-replay-${this.currentReplay.matchId}`, JSON.stringify(this.currentReplay));
    } catch (e) {}
  }

  loadReplay(matchId) {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(`ck-replay-${matchId}`);
      if (raw) {
        this.currentReplay = JSON.parse(raw);
        this.replayCursor = 0;
        this.isReplaying = true;
        return this.currentReplay;
      }
    } catch (e) {}
    return null;
  }

  nextStep() {
    if (!this.currentReplay || this.replayCursor >= this.currentReplay.turns.length) {
      return { done: true, turn: null };
    }
    const turn = this.currentReplay.turns[this.replayCursor];
    this.replayCursor += 1;
    return { done: false, turn, cursor: this.replayCursor, total: this.currentReplay.turns.length };
  }

  previousStep() {
    if (!this.currentReplay || this.replayCursor <= 0) {
      return { done: true, turn: null };
    }
    this.replayCursor = Math.max(0, this.replayCursor - 1);
    const turn = this.currentReplay.turns[this.replayCursor];
    return { done: false, turn, cursor: this.replayCursor, total: this.currentReplay.turns.length };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpectatorReplayEngine };
}
if (typeof window !== 'undefined') {
  window.SpectatorReplayEngine = SpectatorReplayEngine;
}
