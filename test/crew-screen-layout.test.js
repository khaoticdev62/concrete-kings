const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/**
 * Static guards for the two screens the AI crew added.
 *
 * Layout is browser-verified in this project, not unit-tested (HANDOFF section 6) — these
 * assert the *mechanisms* that keep it fitting, because the measurement itself cannot run
 * here. The scenario screen measured 777px of overflow inside a 595px frame with a
 * seven-strong crew, with the verdict and the buttons below the fold, which is exactly the
 * defect HANDOFF trap 2.1 exists for.
 *
 * Everything below matches with plain strings rather than regexes. The first version built
 * its patterns with template literals, and the backslashes escaping the parens were eaten
 * before they reached the file — so the regex read `getElementById('x')` with the parens as
 * a capture group and failed against source that was entirely correct. String matching has
 * nothing to escape.
 */

/** Exact source text for hiding and showing an element, so no escaping is involved. */
const hidden = (id) => "getElementById('" + id + "').style.display = 'none'";
const shown = (id, how) => "getElementById('" + id + "').style.display = '" + how + "'";

/** Slice between single-line markers — index.html is CRLF, so a marker with \n never matches. */
function between(from, to) {
  const start = HTML.indexOf(from);
  assert.notEqual(start, -1, `marker not found: ${from}`);
  const end = HTML.indexOf(to, start + from.length);
  assert.notEqual(end, -1, `end marker not found after ${from}: ${to}`);
  const slice = HTML.slice(start, end);
  assert.ok(slice.length > 0, `empty slice between ${from} and ${to}`);
  return slice;
}

test('Crew layout: every growing list is capped and scrollable', () => {
  // Each of these grows with the crew size. Uncapped, they push the verdict off screen — and
  // a screen that scrolls internally hides the outcome rather than losing it, which is worse
  // because nothing looks broken.
  [
    ['scnPlans', 'one row per competing plan, up to 8'],
    ['scnVotes', 'one line per ballot plus vote commentary'],
    ['scnReactions', 'one row per companion'],
    ['crewList', 'one card per companion, up to 7']
  ].forEach(([id, why]) => {
    const tag = between('id="' + id + '"', '</div>');
    assert.ok(tag.includes('max-height:'), `#${id} must be capped — ${why}`);
    assert.ok(tag.includes('overflow-y:auto'), `#${id} must scroll its own overflow — ${why}`);
  });
});

test('Crew layout: the scenario screen shows one phase at a time', () => {
  // The PRD's structure (v2 section 2) is sequential: SET UP, COMPLETE, REVEAL, WATCH, LIVE
  // WITH IT. Rendering all of them at once is what produced the 777px overflow.
  const run = between('runScenario() {', 'clearScenarioPlayback() {');
  ['scnSetup', 'scnSlots', 'scnPickerWrap'].forEach(id => {
    assert.ok(run.includes(hidden(id)), `#${id} must be hidden once the plan is locked`);
  });

  const finish = between('finishScenario() {', 'playScenarioMicro() {');
  assert.ok(finish.includes(hidden('scnStage')),
    'the stage must be hidden once the verdict is in');
  assert.ok(finish.includes('RAN THIS'),
    'the reveal must collapse to the plan that actually ran, not keep all eight');

  // And restored, or the second job starts with no picker and no brief.
  const fresh = between('newScenario() {', 'renderScenario() {');
  ['scnSetup', 'scnSlots', 'scnPickerWrap'].forEach(id => {
    assert.ok(fresh.includes(shown(id, 'block')) || fresh.includes(shown(id, 'grid')),
      `#${id} must be restored for the next job`);
  });
});

test('Crew layout: the crew screen never prints a secret objective', () => {
  // Section 10: the player discovers these through play. Rendering `secret` on the preview
  // would delete the feature outright, and it is one property name away at all times.
  const render = between('renderCrew() {', 'showCrew() {');
  assert.ok(!render.includes('.secret'),
    'the crew preview must show publicGoal only, never the secret objective');
  assert.ok(render.includes('publicGoal'), 'and it must show the public goal');
});
