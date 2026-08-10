const test = require('node:test');
const assert = require('node:assert/strict');
const { FriendsListEngine } = require('../src/pixel_engine/friends-list-engine.js');
const { MatchmakingReconnectionEngine } = require('../src/pixel_engine/matchmaking-reconnection-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('FriendsListEngine: adds friends, blocks players, and issues match invites', () => {
  const friends = new FriendsListEngine({ storage: mockStorage() });

  const addRes = friends.addFriend('QueensPlug#7180', 'Queens Plug');
  assert.equal(addRes.success, true);
  assert.equal(friends.getFriends().some(f => f.tag === 'QueensPlug#7180'), true);

  const blockRes = friends.blockPlayer('QueensPlug#7180');
  assert.equal(blockRes.success, true);
  assert.equal(friends.getFriends().some(f => f.tag === 'QueensPlug#7180'), false);
  assert.equal(friends.getBlocked().includes('QueensPlug#7180'), true);

  const inviteRes = friends.inviteToMatch('HarlemLegend#1994');
  assert.equal(inviteRes.success, true);
  assert.equal(inviteRes.invite.status, 'PENDING');
});

test('MatchmakingReconnectionEngine: manages queue states and session reconnection', () => {
  const mm = new MatchmakingReconnectionEngine({ storage: mockStorage() });

  const queueRes = mm.enterQueue('RANKED');
  assert.equal(queueRes.success, true);
  assert.equal(mm.state, 'QUEUED');

  mm.updateQueue(5000);

  const match = mm.simulateMatchFound({ name: 'Bronx Rival', rating: 1050 });
  assert.equal(mm.state, 'MATCHED');
  assert.equal(mm.checkReconnectionAvailable(), true);

  const reconRes = mm.attemptReconnection();
  assert.equal(reconRes.success, true);
  assert.equal(reconRes.reconnectingState.opponent.name, 'Bronx Rival');
});
