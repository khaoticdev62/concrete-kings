const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function indexHtml() {
  return fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
}

/**
 * This is the highest-value guard in the suite.
 *
 * Three whole features shipped broken because JS drove element ids that existed
 * nowhere in the markup, and nothing errored:
 *
 *  - The Deck Builder rendered an empty grid and no deck could be built at all,
 *    because setDeckBuilderTab() begins `if (!colPanel || !shopPanel) return;`
 *    and bailed before renderCollectionGrid() ever ran. The Receipt Dust
 *    cosmetics shop was unreachable for the same reason.
 *  - The LEXICON menu button did nothing: renderSetupGlossary() bails at
 *    `if (!box) return;`. Ten AAVE terms, a search engine and the CSS all
 *    existed with nowhere to render.
 *  - The Receipt system, fully implemented and tested, had no UI because
 *    switchRightTab and renderReceiptsTab drove six absent ids.
 *
 * Every one of those guards with `if (!el) return;` — which is correct defensive
 * code, and exactly why the failure is silent. Only this scan catches it.
 */
test('No dead references: every element id used from JS exists in the markup', () => {
  const html = indexHtml();

  const referenced = new Set([...html.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]));
  const present = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

  // Ids created at runtime rather than authored in markup belong here, with a
  // reason. Anything else in this list is a bug waiting to be found.
  const RUNTIME_CREATED = new Set([]);

  const dead = [...referenced]
    .filter(id => !present.has(id) && !RUNTIME_CREATED.has(id))
    .sort();

  assert.deepEqual(dead, [],
    `JS drives element ids that do not exist in the markup, so these features ` +
    `fail silently: ${dead.join(', ')}`);
});

test('No dead references: the Deck Builder tab panels exist', () => {
  // Regression guard for the specific outage: without these two,
  // setDeckBuilderTab returns early and the card grid never renders.
  const html = indexHtml();
  ['collectionPanel', 'shopPanel', 'collectionGrid', 'shopGrid', 'dustBalanceVal',
   'tabCollectionBtn', 'tabShopBtn'].forEach(id => {
    assert.ok(html.includes(`id="${id}"`), `#${id} is required by the deck builder`);
  });
});

test('No dead references: the lexicon has a home on the setup screen', () => {
  const html = indexHtml();
  ['lexiconView', 'lexiconSearchBox', 'lexiconResults', 'lexiconTabPanel',
   'rulebookTabPanel', 'tabLexiconBtn', 'tabRulebookBtn'].forEach(id => {
    assert.ok(html.includes(`id="${id}"`), `#${id} is required by the lexicon`);
  });
});

test('No dead references: the FPS overlay the accessibility toggle writes to exists', () => {
  const html = indexHtml();
  assert.ok(html.includes('id="fpsOverlay"'),
    'SHOW FPS COUNTER wrote to #fpsOverlay, which did not exist, so the setting did nothing');
});

test('No dead references: the setup screen routes all three views through one helper', () => {
  // Two views grew a third with no handling. Routing through showSetupView means
  // a fourth cannot leave two visible at once.
  const html = indexHtml();
  assert.ok(html.includes('showSetupView(which)'), 'showSetupView must exist');
  ['mainMenuView', 'characterCreationView', 'lexiconView'].forEach(id => {
    assert.ok(html.includes(`id="${id}"`), `#${id} must exist as a setup view`);
  });
});
