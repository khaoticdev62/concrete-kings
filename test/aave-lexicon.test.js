const test = require('node:test');
const assert = require('node:assert/strict');
const { AAVELexiconHUD, AAVE_LEXICON } = require('../src/pixel_engine/aave-lexicon-hud.js');

test('AAVE Lexicon HUD: Core cultural terms and definitions exist', () => {
  assert.ok(AAVE_LEXICON.length >= 10, 'Must have at least 10 core cultural terms');
  const hud = new AAVELexiconHUD();
  const def = hud.lookupTerm('Cookout');
  assert.ok(def && def.includes('central communal gathering place'));
});

test('AAVE Lexicon HUD: Filter query returns matching terms', () => {
  const hud = new AAVELexiconHUD();
  const results = hud.getFilteredTerms('barber');
  assert.ok(results.length > 0);
});
