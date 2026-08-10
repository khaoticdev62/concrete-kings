const test = require('node:test');
const assert = require('node:assert/strict');
const { MultiplayerSessionEngine } = require('../src/pixel_engine/multiplayer-session-engine.js');

test('MultiplayerSessionEngine: initializes session and manages room events', () => {
  const session = new MultiplayerSessionEngine({ playerTag: 'TestPlayer#1234' });
  assert.equal(session.playerTag, 'TestPlayer#1234');
  assert.equal(session.isConnected, false);

  let connectEventTriggered = false;
  session.on('connect', (data) => {
    connectEventTriggered = true;
  });

  session.emitLocal('connect', { playerTag: session.playerTag });
  assert.equal(connectEventTriggered, true);

  const roomCode = session.createRoom(['card_1', 'card_2']);
  assert.equal(typeof roomCode, 'string');
  assert.equal(roomCode.startsWith('ROOM_'), true);
});

test('MultiplayerSessionEngine: joins room, submits card, and votes plan', () => {
  const session = new MultiplayerSessionEngine();

  // Mock active WS send
  let lastSentMsg = null;
  session.ws = {
    send(str) { lastSentMsg = JSON.parse(str); }
  };
  session.isConnected = true;

  session.joinRoom('ROOM_9999', ['c1']);
  assert.equal(lastSentMsg.type, 'JOIN_ROOM');
  assert.equal(lastSentMsg.payload.roomCode, 'ROOM_9999');

  session.submitCard('WHO', 'c1');
  assert.equal(lastSentMsg.type, 'SUBMIT_CARD');
  assert.equal(lastSentMsg.payload.slotId, 'WHO');

  session.votePlan(1);
  assert.equal(lastSentMsg.type, 'VOTE_PLAN');
  assert.equal(lastSentMsg.payload.planIndex, 1);
});
