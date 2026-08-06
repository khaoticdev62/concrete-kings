const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Server WebSocket Sync: server.js contains room joining with characterOrigin and avatar_update message handler', () => {
  const serverPath = path.join(__dirname, '..', 'server', 'server.js');
  const code = fs.readFileSync(serverPath, 'utf8');

  assert.ok(code.includes('characterOrigin'), 'Server must handle characterOrigin');
  assert.ok(code.includes('cityTheme'), 'Server must handle cityTheme');
  assert.ok(code.includes('avatar_update'), 'Server must handle avatar_update broadcasting');
  assert.ok(code.includes('join_queue'), 'Server must handle join_queue');
  assert.ok(code.includes('leave_queue'), 'Server must handle leave_queue');
  assert.ok(code.includes('match_found'), 'Server must handle match_found events');
  assert.ok(code.includes('matchmakingQueue'), 'Server must define matchmakingQueue array');
});
