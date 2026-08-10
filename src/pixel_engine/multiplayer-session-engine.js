/**
 * Concrete Kings: The Block Chronicles
 * Multiplayer WebSocket Session Engine (Checklist Section 1.3 & Server Integration)
 *
 * Manages WebSocket connections to server/server.js, 4-player room creation and joining,
 * card submission & vote broadcasting, live state synchronization, and reconnection logic.
 */

class MultiplayerSessionEngine {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || (typeof window !== 'undefined' ? `ws://${window.location.hostname}:3001` : 'ws://localhost:3001');
    this.ws = null;
    this.isConnected = false;
    this.roomCode = null;
    this.playerTag = options.playerTag || `Player_${Math.floor(Math.random() * 1000)}`;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emitLocal(event, data) {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => cb(data));
  }

  connect(url = this.wsUrl) {
    this.wsUrl = url;
    if (typeof WebSocket === 'undefined') {
      this.emitLocal('error', { message: 'WebSocket not supported in current environment.' });
      return false;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emitLocal('connect', { playerTag: this.playerTag });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type) {
            this.emitLocal(msg.type, msg.payload || msg);
          }
        } catch (e) {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emitLocal('disconnect', { roomCode: this.roomCode });
        this.attemptReconnect();
      };

      this.ws.onerror = (err) => {
        this.emitLocal('error', err);
      };

      return true;
    } catch (e) {
      this.emitLocal('error', e);
      return false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, 1000 * Math.min(this.reconnectAttempts, 5));
    }
  }

  send(type, payload = {}) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type, payload, playerTag: this.playerTag, roomCode: this.roomCode }));
      return true;
    }
    return false;
  }

  createRoom(deck = []) {
    this.roomCode = `ROOM_${Math.floor(1000 + Math.random() * 9000)}`;
    this.send('CREATE_ROOM', { deck });
    return this.roomCode;
  }

  joinRoom(roomCode, deck = []) {
    this.roomCode = roomCode;
    this.send('JOIN_ROOM', { roomCode, deck });
    return true;
  }

  submitCard(slotId, cardId) {
    return this.send('SUBMIT_CARD', { slotId, cardId });
  }

  votePlan(planIndex) {
    return this.send('VOTE_PLAN', { planIndex });
  }

  leaveRoom() {
    this.send('LEAVE_ROOM', { roomCode: this.roomCode });
    this.roomCode = null;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MultiplayerSessionEngine };
}
if (typeof window !== 'undefined') {
  window.MultiplayerSessionEngine = MultiplayerSessionEngine;
}
