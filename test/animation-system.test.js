const test = require('node:test');
const assert = require('node:assert/strict');
const { Animator, SpriteAnimation, DEFAULT_FRAME_DURATION } = require('../src/pixel_engine/animation-system.js');

function tick(animator, dt) {
  animator.update(dt);
}

test('Animation system: sprite animation plays and loops by default', () => {
  const anim = new SpriteAnimation({ name: 'walk', frames: [0, 1, 2, 3], frameDuration: 100 });
  tick(anim, 100);
  assert.equal(anim.currentFrame(), 1);
  tick(anim, 300);
  assert.equal(anim.currentFrame(), 0);
});

test('Animation system: one-shot animation stops on last frame', () => {
  const anim = new SpriteAnimation({ name: 'once', frames: [10, 11], frameDuration: 50, loop: false });
  tick(anim, 50);
  assert.equal(anim.currentFrame(), 11);
  tick(anim, 50);
  assert.equal(anim.currentFrame(), 11);
  assert.ok(anim.finished);
});

test('Animation system: animator switches and restarts clips', () => {
  const animator = new Animator();
  animator.add('idle', { frames: [0, 1], frameDuration: 100 });
  animator.add('run', { frames: [2, 3, 4], frameDuration: 80 });
  animator.play('idle');
  tick(animator, 100);
  assert.equal(animator.currentFrame(), 1);
  animator.play('run');
  assert.equal(animator.currentFrame(), 2);
});
