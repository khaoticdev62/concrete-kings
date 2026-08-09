const test = require('node:test');
const assert = require('node:assert/strict');
const { PlayerProgression, DAILY_QUEST_POOL } = require('../src/pixel_engine/player-progression.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('PlayerProgression: level starts at 1 with 0 XP and increases every 100 XP', () => {
  const storage = mockStorage();
  const prog = new PlayerProgression({ storage, initialXp: 0 });

  assert.equal(prog.level, 1);
  assert.equal(prog.progressInLevel, 0);

  prog.addXp(50);
  assert.equal(prog.level, 1);
  assert.equal(prog.progressInLevel, 50);

  prog.addXp(50);
  assert.equal(prog.level, 2);
  assert.equal(prog.progressInLevel, 0);

  prog.addXp(150);
  assert.equal(prog.level, 3);
  assert.equal(prog.progressInLevel, 50);
});

test('PlayerProgression: addXp detects level up correctly', () => {
  const storage = mockStorage();
  const prog = new PlayerProgression({ storage, initialXp: 80 });

  const res1 = prog.addXp(10);
  assert.equal(res1.leveledUp, false);
  assert.equal(res1.oldLevel, 1);
  assert.equal(res1.newLevel, 1);

  const res2 = prog.addXp(20);
  assert.equal(res2.leveledUp, true);
  assert.equal(res2.oldLevel, 1);
  assert.equal(res2.newLevel, 2);
});

test('PlayerProgression: generateDailyQuests produces 3 distinct quests', () => {
  const storage = mockStorage();
  const prog = new PlayerProgression({ storage, initialXp: 0 });

  assert.equal(prog.quests.length, 3);
  const ids = prog.quests.map(q => q.id);
  const unique = new Set(ids);
  assert.equal(unique.size, 3, 'daily quests must be distinct');
});

test('PlayerProgression: updateQuestProgress increments progress and awards rewards on completion', () => {
  const storage = mockStorage({ 'ck-dust-balance': '100' });
  const prog = new PlayerProgression({ storage, initialXp: 0 });

  const targetQuest = prog.quests[0];
  assert.equal(targetQuest.progress, 0);
  assert.equal(targetQuest.completed, false);

  // Partial progress
  const res1 = prog.updateQuestProgress(targetQuest.id, 1);
  assert.equal(res1.justCompleted, false);
  assert.equal(targetQuest.progress, 1);

  // Complete quest
  const remainingNeeded = targetQuest.target - 1;
  const res2 = prog.updateQuestProgress(targetQuest.id, remainingNeeded);

  assert.equal(res2.justCompleted, true);
  assert.equal(targetQuest.completed, true);
  assert.equal(res2.cashGranted, targetQuest.rewardCash);
  assert.equal(storage.getItem('ck-dust-balance'), (100 + targetQuest.rewardCash).toString());
});

test('PlayerProgression: loads saved state from storage', () => {
  const storage = mockStorage({
    'ck-player-xp': '250',
    'ck-quests-date': '2026-08-09',
    'ck-daily-quests': JSON.stringify([
      { id: 'win_rounds', title: 'BLOCK RULER', desc: 'Win 3 card game rounds', target: 3, progress: 2, rewardXp: 50, rewardCash: 25, completed: false }
    ])
  });

  const prog = new PlayerProgression({ storage });
  assert.equal(prog.xp, 250);
  assert.equal(prog.level, 3);
  assert.equal(prog.quests[0].progress, 2);
});
