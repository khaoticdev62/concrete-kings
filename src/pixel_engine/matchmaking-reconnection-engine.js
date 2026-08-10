/**
 * Concrete Kings: The Block Chronicles
 * Matchmaking Queue & Reconnection Engine (Checklist Section 8.3 & 8.5 & Priority Matrix #6, #7)
 *
 * Handles ranked and casual queue matching, queue search timer expansion,
 * local match session state caching, and seamless WS session reconnection.
 */

class MatchmakingReconnectionEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.wsClient = options.wsClient || null;
    this.state = 'IDLE'; // IDLE, QUEUED, MATCHED, RECONNECTING
    this.queueType = 'CASUAL'; // CASUAL, RANKED
    this.queueTimer = 0;
    this.rating = options.rating || 1000;
    this.sessionToken = this.loadSessionToken();
    this.cachedMatchState = this.loadCachedMatchState();
  }

  loadSessionToken() {
    if (!this.storage) return null;
    try {
      return this.storage.getItem('ck-session-token') || null;
    } catch (e) {
      return null;
    }
  }

  saveSessionToken(token) {
    this.sessionToken = token;
    if (this.storage) {
      try {
        if (token) this.storage.setItem('ck-session-token', token);
        else this.storage.removeItem('ck-session-token');
      } catch (e) {}
    }
  }

  loadCachedMatchState() {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem('ck-match-state');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  cacheMatchState(matchState) {
    this.cachedMatchState = matchState;
    if (this.storage) {
      try {
        if (matchState) this.storage.setItem('ck-match-state', JSON.stringify(matchState));
        else this.storage.removeItem('ck-match-state');
      } catch (e) {}
    }
  }

  enterQueue(type = 'CASUAL') {
    if (this.state === 'QUEUED') return { success: false, reason: 'Already in queue.' };
    this.state = 'QUEUED';
    this.queueType = type;
    this.queueTimer = 0;

    return {
      success: true,
      queueType: this.queueType,
      rating: this.rating
    };
  }

  cancelQueue() {
    if (this.state !== 'QUEUED') return { success: false, reason: 'Not currently in queue.' };
    this.state = 'IDLE';
    this.queueTimer = 0;
    return { success: true };
  }

  updateQueue(dt) {
    if (this.state === 'QUEUED') {
      this.queueTimer += (dt / 1000);
      // Simulate matchmaking search range expansion
      const searchTolerance = Math.min(500, Math.floor(this.queueTimer * 50));
      return {
        queueTimer: Math.floor(this.queueTimer),
        searchTolerance
      };
    }
    return null;
  }

  simulateMatchFound(opponentData) {
    if (this.state !== 'QUEUED') return null;
    this.state = 'MATCHED';
    const matchId = `match_${Date.now()}`;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const matchInfo = {
      matchId,
      sessionToken: token,
      opponent: opponentData || { name: 'Harlem Rival', rating: 1020, district: 'Harlem' },
      round: 1,
      turn: 1
    };

    this.saveSessionToken(token);
    this.cacheMatchState(matchInfo);

    return matchInfo;
  }

  checkReconnectionAvailable() {
    return !!(this.sessionToken && this.cachedMatchState);
  }

  attemptReconnection() {
    if (!this.checkReconnectionAvailable()) {
      return { success: false, reason: 'No active session token or match state stored.' };
    }

    this.state = 'RECONNECTING';

    return {
      success: true,
      reconnectingState: this.cachedMatchState,
      sessionToken: this.sessionToken
    };
  }

  clearSession() {
    this.state = 'IDLE';
    this.saveSessionToken(null);
    this.cacheMatchState(null);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MatchmakingReconnectionEngine };
}
if (typeof window !== 'undefined') {
  window.MatchmakingReconnectionEngine = MatchmakingReconnectionEngine;
}
