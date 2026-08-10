const test = require('node:test');
const assert = require('node:assert/strict');
const { QuickChatSystem, QUICK_PHRASES, EMOTE_ACTIONS } = require('../src/pixel_engine/quick-chat-system.js');

test('QuickChatSystem: sends AAVE preset quick phrases', () => {
  const chat = new QuickChatSystem();
  const msg = chat.sendQuickPhrase(0, 'Player1');

  assert.equal(msg.type, 'CHAT');
  assert.equal(msg.sender, 'Player1');
  assert.equal(msg.text, 'No cap!');
});

test('QuickChatSystem: parses chat commands /help, /whisper, and /emote', () => {
  const chat = new QuickChatSystem();

  const help = chat.processCommand('/help');
  assert.equal(help.type, 'SYSTEM');
  assert.equal(help.text.includes('/whisper'), true);

  const whisper = chat.processCommand('/whisper Marcus hold the line', 'Player1');
  assert.equal(whisper.type, 'WHISPER');
  assert.equal(whisper.target, 'Marcus');
  assert.equal(whisper.text, 'hold the line');

  const emote = chat.processCommand('/emote NOD', 'Player1');
  assert.equal(emote.type, 'EMOTE');
  assert.equal(emote.text, '* Player1 nods respectfully *');
});

test('QuickChatSystem: manages active speech bubbles and expires them', () => {
  const chat = new QuickChatSystem();
  const bubble = chat.createSpeechBubble('MARCUS', 'Check the receipts!', { x: 150, y: 200 }, 50);

  assert.equal(chat.activeBubbles.size, 1);

  setTimeout(() => {
    const active = chat.pruneExpiredBubbles();
    assert.equal(active.length, 0);
  }, 100);
});
