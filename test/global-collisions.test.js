const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/**
 * The files index.html loads as classic <script> tags, in load order.
 *
 * These share ONE global scope in the browser. `node --test` gives each its own
 * scope via require, so a duplicate top-level declaration is invisible to every
 * other test in this suite — it only shows up as a SyntaxError in a real browser,
 * and then only for the second file onwards.
 */
function scriptFiles() {
  return [...INDEX.matchAll(/<script src="([^"]+\.js)"><\/script>/g)]
    .map(m => m[1])
    .filter(p => fs.existsSync(path.join(ROOT, p)));
}

/**
 * Top-level declarations in one file.
 *
 * Handles destructuring as well as plain declarations. That matters: the scanner
 * documented in HANDOFF.md only matched `const NAME`, so it reported zero
 * collisions while four files each declared `const { Animator } = ...` at top
 * level. Three of them threw "Identifier 'Animator' has already been declared",
 * and because weather-effects-system.js was among them WeatherEffectsSystem was
 * never defined and app.init() failed on it.
 */
function topLevelNames(source) {
  const names = [];

  // Only column-0 declarations are top level. Anything indented is inside a
  // block, a class body or a function, and cannot collide across files.
  const plain = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of source.matchAll(plain)) names.push(m[1]);

  // const { a, b: c } = ... / const [a, b] = ...
  const destructured = /^(?:const|let|var)\s*([{[])([^}\]]*)[}\]]\s*=/gm;
  for (const m of source.matchAll(destructured)) {
    m[2].split(',').forEach(part => {
      const piece = part.trim();
      if (!piece) return;
      // `key: local` binds `local`; `name` binds `name`; drop defaults.
      const bound = (piece.includes(':') ? piece.split(':')[1] : piece).split('=')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(bound)) names.push(bound);
    });
  }
  return names;
}

test('Browser globals: no two <script>-loaded engine files declare the same top-level name', () => {
  const owners = new Map();
  scriptFiles().forEach(rel => {
    const source = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    new Set(topLevelNames(source)).forEach(name => {
      if (!owners.has(name)) owners.set(name, []);
      owners.get(name).push(rel);
    });
  });

  const collisions = [...owners.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([name, files]) => `${name} in ${files.join(' + ')}`);

  assert.deepEqual(collisions, [], [
    'These names are declared at top level in more than one <script>-loaded file.',
    'They share one global scope in the browser, so every file after the first',
    'throws "Identifier X has already been declared" and stops parsing — taking',
    'its exports with it. Prefix them per file, as CTRL_WORLD / RND_WORLD do:',
    ...collisions
  ].join('\n'));
});

test('Browser globals: the scanner sees destructured declarations, not just plain ones', () => {
  // Guards the guard. The previous scanner missed `const { X } = ...` entirely,
  // which is exactly how the Animator collision shipped.
  const sample = [
    'const Plain = 1;',
    'let AlsoPlain = 2;',
    'class Klass {}',
    'function fn() {}',
    'const { Destructured } = require("x");',
    'const { key: Renamed, Second } = require("y");',
    'const [First, Second2] = arr;',
    '  const Indented = 3;',            // not top level
    'const { Defaulted = 4 } = opts;'
  ].join('\n');

  const found = topLevelNames(sample);
  ['Plain', 'AlsoPlain', 'Klass', 'fn', 'Destructured', 'Renamed', 'Second',
   'First', 'Second2', 'Defaulted'].forEach(n => {
    assert.ok(found.includes(n), `scanner must find ${n}`);
  });
  assert.ok(!found.includes('Indented'), 'indented declarations are not top level');
  assert.ok(!found.includes('key'), 'a renamed key binds the local name, not the key');
});

test('Browser globals: every declared script file exists, so none 404s at load', () => {
  const declared = [...INDEX.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m => m[1]);
  const missing = declared.filter(p => !fs.existsSync(path.join(ROOT, p)));
  assert.deepEqual(missing, [], `script tags pointing at missing files: ${missing.join(', ')}`);
  assert.ok(declared.length > 10, 'the engine scripts should all be declared');
});

test('Browser globals: a dependency is loaded before the file that reads it at parse time', () => {
  // scenario-compiler.js binds FIRST_MILES_BEATS, FIRST_MILES_SIDE_QUESTS and
  // FIRST_MILES_ORIGIN_SECRETS into top-level consts while it parses. If
  // first-miles-campaign.js has not run yet those are all undefined and the
  // compiler silently produces empty scenarios rather than throwing.
  //
  // This used to pin lightmap.js before topdown-city-renderer.js, and
  // topdown-city-data.js before topdown-city-controller.js. All four files are
  // now unloaded — the top-down city map was superseded by DynamicMapSystem —
  // so those assertions could only ever fail on a file that is not there. The
  // rule they encoded still holds for anything that resolves a global at parse
  // time; add the pair here when you introduce one.
  const order = [...INDEX.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m => m[1]);
  const before = (a, b) => {
    const i = order.findIndex(p => p.endsWith(a));
    const j = order.findIndex(p => p.endsWith(b));
    assert.notEqual(i, -1, `${a} must be loaded`);
    assert.notEqual(j, -1, `${b} must be loaded`);
    assert.ok(i < j, `${a} must load before ${b}`);
  };
  before('first-miles-campaign.js', 'scenario-compiler.js');
});
