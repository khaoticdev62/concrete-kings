const test = require('node:test');
const assert = require('node:assert/strict');
const { TutorialOnboardingEngine, TUTORIAL_STEPS } = require('../src/pixel_engine/tutorial-onboarding-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('TutorialOnboardingEngine: progresses through 5 tutorial steps', () => {
  const storage = mockStorage();
  const tutorial = new TutorialOnboardingEngine({ storage });

  assert.equal(tutorial.getCurrentStep().title, "YOU'RE LATE");

  const res1 = tutorial.advanceStep();
  assert.equal(res1.completed, false);
  assert.equal(tutorial.getCurrentStep().title, 'SECOND CHANCE');

  tutorial.advanceStep(); // 3
  tutorial.advanceStep(); // 4
  tutorial.advanceStep(); // 5

  const res5 = tutorial.advanceStep();
  assert.equal(res5.completed, true);
  assert.equal(tutorial.isCompleted, true);
  assert.equal(storage.getItem('ck-tutorial-complete'), 'true');
});

test('TutorialOnboardingEngine: supports skipping and resetting tutorial', () => {
  const storage = mockStorage();
  const tutorial = new TutorialOnboardingEngine({ storage });

  tutorial.skipTutorial();
  assert.equal(tutorial.isCompleted, true);
  assert.equal(tutorial.getCurrentStep(), null);

  tutorial.resetTutorial();
  assert.equal(tutorial.isCompleted, false);
  assert.equal(tutorial.getCurrentStep().title, "YOU'RE LATE");
});
