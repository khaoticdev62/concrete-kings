const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function indexHtml() {
  return fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
}

test('Migration: the side-on stage-canvas is fully removed', () => {
  const html = indexHtml();
  assert.equal(html.includes('stage-canvas'), false,
    'no stage-canvas element or reference may survive — a stale getElementById returns null and throws at runtime');
});

test('Migration: the online avatar broadcast survives and uses the top-down controller', () => {
  const html = indexHtml();
  assert.ok(html.includes("type: 'avatar_update'"), 'multiplayer position broadcast must still exist');

  const idx = html.indexOf("type: 'avatar_update'");
  const block = html.slice(idx - 400, idx + 400);
  assert.ok(block.includes('topDownController'),
    'the broadcast must read top-down coordinates, not the removed mapController');
});

test('Migration: the broadcast sends a character origin, not a city name', () => {
  // The receiver does CHARACTER_ORIGINS[p.origin]. A city name here is not a
  // valid key, so every remote avatar would silently render as BARBER.
  const html = indexHtml();
  const idx = html.indexOf("type: 'avatar_update'");
  const block = html.slice(idx, idx + 500);

  assert.ok(/origin:\s*this\.mapController\.origin\.id/.test(block),
    'origin must be a CHARACTER_ORIGINS key');
  assert.equal(/origin:\s*[^,]*district\.city/.test(block), false,
    'origin must not be a city name');
});

test('Migration: weather still composites somewhere', () => {
  const html = indexHtml();
  assert.ok(html.includes('weatherSystem.render('), 'weather must still be rendered');
  assert.ok(html.includes('weatherSystem.advanceFrame('), 'weather must still advance');
});

test('Migration: the game screen no longer hosts a walkable viewport', () => {
  const html = indexHtml();
  const gameStart = html.indexOf('<section id="game"');
  const gameEnd = html.indexOf('<section id="judging"');
  const gameSection = html.slice(gameStart, gameEnd);

  assert.equal(gameSection.includes('<canvas id="stage-canvas"'), false);
  assert.equal(gameSection.includes('BLOCK VIEWPORT'), false,
    'the side-on viewport heading must be gone from the card table');
});
