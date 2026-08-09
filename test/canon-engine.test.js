const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BlockLedger, canonMotifs, canonHeadMotif, canonTags, CANON_CALLBACK_REP
} = require('../src/pixel_engine/canon-engine.js');

/**
 * The PRD's own success criterion (section 58): a joke becomes an RPG consequence, and
 * the block remembers it later. These tests hold the loop that proves it.
 */

test('Canon: motifs are the vivid words, not the grammar', () => {
  const motifs = canonMotifs('the grandma who still cooks like it was 1999');
  assert.ok(motifs.includes('grandma'), 'the noun that makes the joke must be a motif');
  assert.ok(motifs.includes('cooks'));
  ['the', 'who', 'still', 'like', 'was'].forEach(w => {
    assert.ok(!motifs.includes(w), `${w} is grammar and must not become a block legend`);
  });
  assert.ok(!motifs.includes('1999'), 'bare numbers are not motifs');
});

test('Canon: motif extraction keeps grammar out but is not over-aggressive', () => {
  // The stoplist is deliberately short. An aggressive one strips exactly the words that
  // make a running joke, so this pins the behaviour in both directions.
  assert.deepEqual(canonMotifs('a mixtape nobody asked for').sort(), ['asked', 'mixtape']);
  // Adverbs are dropped: an -ly word modifies the memorable thing rather than being it.
  assert.deepEqual(canonMotifs('an extremely confident pigeon').sort(),
    ['confident', 'pigeon']);
  assert.deepEqual(canonMotifs('a suspiciously wet briefcase'), ['briefcase'],
    "'wet' is under four letters and 'suspiciously' is an adverb");
});

test('Canon: the legend is the noun the card is about, not one of its adjectives', () => {
  // The flaw this prevents shipped as far as a passing test suite: every word carried
  // equal weight, so three plays of "an extremely confident pigeon" promoted `confident`
  // and `pigeon` identically, ties broke alphabetically, and the ending read
  // "The block runs on CONFIDENT now."
  assert.equal(canonHeadMotif('an extremely confident pigeon'), 'pigeon');
  assert.equal(canonHeadMotif('a suspiciously wet briefcase'), 'briefcase');
  assert.equal(canonHeadMotif('unpaid parking tickets'), 'tickets');
  assert.equal(canonHeadMotif('the'), null, 'a card of pure grammar has no head');

  const ledger = new BlockLedger();
  for (let i = 0; i < 3; i++) ledger.record({ player: 'Ray', card: 'an extremely confident pigeon' });
  const top = ledger.legends('KNOWN')[0];
  assert.equal(top.motif, 'pigeon', 'the head noun must outrank its own modifiers');
  assert.ok(ledger.motifs.get('pigeon') > ledger.motifs.get('confident'));
});

test('Canon: the strongest promotion is reported first, not the first word in the card', () => {
  // Callers show promotions[0] as the headline. In motif order that was whichever word
  // came first in the card, so the round that made PIGEON a block legend announced
  // "CONFIDENT is known on the block" and buried the actual event. Caught by looking at
  // the chronicle screen, not by any assertion that existed at the time.
  const ledger = new BlockLedger();
  for (let i = 0; i < 3; i++) ledger.record({ player: 'Ray', card: 'a confident pigeon' });
  const third = ledger.events[2];

  assert.ok(third.promotions.length > 1, 'this round promotes both words');
  assert.equal(third.promotions[0].motif, 'pigeon');
  assert.equal(third.promotions[0].tier, 'LEGEND');

  const line = ledger.chronicle().find(l => l.round === third.round);
  assert.match(line.text, /^PIGEON/, 'the chronicle headline must be the strongest event');
});

test('Canon: a card is tagged from its text, because the cards carry no metadata', () => {
  assert.deepEqual(canonTags('unpaid parking tickets'), ['heat']);
  assert.deepEqual(canonTags('rent money in a sock'), ['cash']);
  assert.deepEqual(canonTags('the cookout at grandma house').sort(), ['trust']);
  assert.deepEqual(canonTags('an extremely confident pigeon'), [],
    'most white cards are jokes, not crimes — untagged is the honest default');
});

test('Canon: a snitch card is both heat and disrespect, and both apply', () => {
  const tags = canonTags('the snitch from the third floor');
  assert.deepEqual(tags.sort(), ['disrespect', 'heat']);
  const ledger = new BlockLedger();
  const event = ledger.record({ player: 'Ray', card: 'the snitch from the third floor' });
  assert.equal(event.effects.heat, 1);
  assert.equal(event.effects.reputation, -1);
});

test('Canon: a motif becomes a block legend on its third mention', () => {
  const ledger = new BlockLedger();
  const play = () => ledger.record({ player: 'Ray', card: 'an extremely confident pigeon' });

  const first = play();
  assert.deepEqual(first.promotions, [],
    'one crowning is not a pattern — the first play must promote nothing');

  const second = play();
  assert.ok(second.promotions.some(p => p.motif === 'pigeon' && p.tier === 'KNOWN'));

  const third = play();
  assert.ok(third.promotions.some(p => p.motif === 'pigeon' && p.tier === 'LEGEND'),
    'three mentions must make it a legend — this is the whole feature');

  assert.deepEqual(ledger.legends('LEGEND').map(l => l.motif).slice(0, 1), ['pigeon']);
});

test('Canon: a tier announces once, however many times the motif is replayed', () => {
  // Without this the chronicle fills with the same promotion line repeated.
  const ledger = new BlockLedger();
  for (let i = 0; i < 8; i++) ledger.record({ player: 'Ray', card: 'the pigeon' });
  const pigeonPromotions = ledger.events
    .flatMap(e => e.promotions)
    .filter(p => p.motif === 'pigeon')
    .map(p => p.tier);
  assert.deepEqual(pigeonPromotions, ['KNOWN', 'LEGEND', 'INSTITUTION'],
    'each tier fires exactly once, in order');
});

test('Canon: a prompt that mentions a legend arms a callback, and playing into it pays', () => {
  // The payoff loop, end to end. This is the test that would fail if the feature were
  // decorative.
  const ledger = new BlockLedger();
  for (let i = 0; i < 3; i++) ledger.record({ player: 'Ray', card: 'a confident pigeon' });

  const armed = ledger.armCallback('The pigeon is the real reason the club closed early.');
  assert.ok(armed, 'a prompt naming an established legend must arm a callback');
  assert.equal(armed.motif, 'pigeon');

  const event = ledger.record({ player: 'Tasha', card: 'that same pigeon again' });
  assert.equal(event.calledBack, true);
  assert.equal(event.type, 'CALLBACK');
  assert.equal(event.effects.reputation, CANON_CALLBACK_REP,
    'the callback bonus is what turns a round-three joke into a round-ten reward');
});

test('Canon: a callback is consumed by the round it fires in', () => {
  const ledger = new BlockLedger();
  for (let i = 0; i < 3; i++) ledger.record({ player: 'Ray', card: 'a confident pigeon' });
  ledger.armCallback('The pigeon closed the club.');
  ledger.record({ player: 'Tasha', card: 'the pigeon' });
  assert.equal(ledger.activeCallback, null, 'an armed callback must not pay twice');

  const next = ledger.record({ player: 'Tasha', card: 'the pigeon' });
  assert.equal(next.calledBack, false);
  assert.equal(next.effects.reputation, 0);
});

test('Canon: a prompt naming a merely KNOWN motif does not arm a callback', () => {
  // KNOWN is two mentions — barely a pattern. Paying out on it would make callbacks
  // constant and meaningless.
  const ledger = new BlockLedger();
  ledger.record({ player: 'Ray', card: 'a confident pigeon' });
  ledger.record({ player: 'Ray', card: 'a confident pigeon' });
  assert.equal(ledger.armCallback('The pigeon did it.'), null);
});

test('Canon: the chronicle reports what changed, not every card played', () => {
  const ledger = new BlockLedger();
  ledger.record({ player: 'Ray', card: 'a quiet afternoon', round: 1 });   // no tags, no motif tier
  ledger.record({ player: 'Tasha', card: 'unpaid parking tickets', round: 2 });
  const lines = ledger.chronicle();

  assert.ok(lines.length >= 1);
  assert.ok(lines.some(l => l.kind === 'HEAT'), 'a heat card is worth a chronicle line');
  assert.ok(!lines.some(l => l.text.includes('quiet afternoon')),
    'a card that changed nothing must not be listed, or the chronicle becomes a log');
});

test('Canon: the ending line comes from the ledger, not the scoreboard', () => {
  // PRD section 54: endings depend on world state.
  const empty = new BlockLedger();
  assert.match(empty.standing(), /Nothing stuck/);

  const legend = new BlockLedger();
  for (let i = 0; i < 3; i++) legend.record({ player: 'Ray', card: 'a confident pigeon' });
  assert.match(legend.standing(), /PIGEON/);

  const institution = new BlockLedger();
  for (let i = 0; i < 5; i++) institution.record({ player: 'Ray', card: 'a confident pigeon' });
  assert.match(institution.standing(), /runs on PIGEON/);
});

test('Canon: the ledger is deterministic, so two clients derive the same history', () => {
  // The game has an online mode. A ledger that differs per client is a desync that
  // surfaces as players seeing different endings.
  const cards = ['a confident pigeon', 'unpaid parking tickets', 'the pigeon again',
    'rent money in a sock', 'that pigeon'];
  const run = () => {
    const l = new BlockLedger();
    cards.forEach((card, i) => {
      l.armCallback('The pigeon strikes again.');
      l.record({ player: 'P' + (i % 2), card, round: i + 1 });
    });
    return JSON.stringify(l.toJSON());
  };
  assert.equal(run(), run());
});

test('Canon: the ledger survives a save/load round trip', () => {
  const ledger = new BlockLedger({ day: 3 });
  for (let i = 0; i < 3; i++) ledger.record({ player: 'Ray', card: 'a confident pigeon' });
  const restored = BlockLedger.fromJSON(JSON.parse(JSON.stringify(ledger.toJSON())));

  assert.equal(restored.day, 3);
  assert.deepEqual(restored.legends('LEGEND'), ledger.legends('LEGEND'));
  // And it must keep not re-announcing tiers it already announced before the save.
  const after = restored.record({ player: 'Ray', card: 'a confident pigeon' });
  assert.deepEqual(after.promotions, [],
    'a reloaded ledger must remember which tiers it already announced');
});

test('Canon: every mode that crowns a card records it, and online records exactly once', () => {
  // The ledger shipped wired into the classic path only. The campaign and story branches
  // of chooseWinner return long before the classic recording site, so the two narrative
  // modes — the ones where a remembered joke matters most — recorded nothing at all.
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // Sliced between explicit markers rather than matched with a wildcard window. The
  // first version of this test used /firstMilesCampaign[\s\S]{0,900}?recordCanon/, which
  // passed happily after the campaign's recordCanon call was deleted — the window simply
  // reached a different call site. A regex with a wildcard span is not a structural
  // assertion, it is a coincidence detector.
  const between = (from, to, where = html) => {
    const start = where.indexOf(from);
    assert.notEqual(start, -1, `marker not found: ${from}`);
    const end = where.indexOf(to, start + from.length);
    assert.notEqual(end, -1, `end marker not found after ${from}: ${to}`);
    return where.slice(start, end);
  };

  // Scoped to chooseWinner's own body first. `if (this.game.mode === MODE.ONLINE) {`
  // occurs three times in the file, and searching the whole document found the wrong one
  // — the slice then spanned the campaign branch and "proved" the opposite of the truth.
  const body = between('chooseWinner(index) {', 'recordCanon(winner, cardText) {');

  const campaignBranch = between('if (this.firstMilesCampaign) {', 'if (this.storyEngine && this.storyEngine.active) {', body);
  assert.ok(campaignBranch.includes('recordCanon'),
    'the campaign branch must record before it returns');

  // Markers are single-line on purpose: index.html has CRLF endings, so a marker
  // containing "\n" never matches and the slice silently fails to find its end.
  const storyBranch = between('if (this.storyEngine && this.storyEngine.active) {',
    'const winner = this.game.players.find(p => p.name === win.player);', body);
  assert.ok(storyBranch.includes('recordCanon'),
    'the story branch must record before it returns');

  // Online must NOT record at the click site: chooseWinner only sends the pick there and
  // the award happens when the server echoes it. Recording in both places logs the round
  // twice on the judge's client, and the ledger has to match on every client.
  const onlineClick = between('if (this.game.mode === MODE.ONLINE) {',
    'if (this.audioEngine) this.audioEngine.playVictoryFanfare();', body);
  assert.ok(!onlineClick.includes('recordCanon'),
    'online must record in the winner message handler, not at the click');

  const onlineHandler = between("if (msg.type === 'winner') {", "if (msg.type === 'chat')");
  assert.ok(onlineHandler.includes('recordCanon'),
    'the online winner handler must record');
});

test('Canon: the ledger is persisted and restored, or the block forgets on reload', () => {
  // toJSON/fromJSON existed and were unit-tested, but nothing in the game called either,
  // so the chronicle died with the tab. PRD section 43 lists canon events as saved state.
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes("localStorage.setItem('ck-block-ledger'"), 'the ledger must be saved');
  assert.ok(html.includes("localStorage.getItem('ck-block-ledger'"), 'the ledger must be restored');

  // Saved by recordCanon itself, so the save cannot be forgotten at a call site.
  const recordBody = html.slice(html.indexOf('recordCanon(winner, cardText) {'));
  const recordEnd = recordBody.indexOf('canonResultLines(event)');
  assert.notEqual(recordEnd, -1, 'recordCanon must be followed by canonResultLines');
  assert.ok(recordBody.slice(0, recordEnd).includes('this.saveLedger()'),
    'saving must happen inside recordCanon — sessions end by the tab closing, not on a timer');

  const initBody = html.slice(html.indexOf('  init() {'));
  assert.ok(initBody.slice(0, initBody.indexOf('renderProgressionUI')).includes('this.loadLedger()'),
    'the ledger must be restored during init, before anything renders');
  // Its own key, not the campaign save: abandoning a campaign must not wipe the block's
  // memory of a classic session.
  assert.ok(!html.includes("ck-first-miles-campaign', JSON.stringify(this.game.ledger"),
    'the ledger must not ride along in the campaign save');
});

test('Canon: bad input is handled rather than thrown, because it comes from the round loop', () => {
  const ledger = new BlockLedger();
  assert.doesNotThrow(() => ledger.record({}));
  assert.doesNotThrow(() => ledger.record({ card: null, player: undefined }));
  assert.deepEqual(canonMotifs(undefined), []);
  assert.deepEqual(canonTags(null), []);
  assert.equal(ledger.armCallback(undefined), null);
});
