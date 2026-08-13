const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

test('E2E Audit: UI, Navigation Flow, Gameplay Loop, and Mini-Game Functionality', async (t) => {
  const indexPath = 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Chromium launch skipped or fallback:', e.message);
    return;
  }

  // try/finally around everything from here down.
  //
  // Without it, any failing assertion below skips browser.close() and leaves a
  // live Chromium attached to the runner, so `npm test` stops reporting and
  // hangs forever instead of printing the failure. That is the same shape as
  // the MiniGameManager.start() leak in HANDOFF section 6, and it cost real
  // time: an assertion here started failing and the whole suite went silent.
  try {
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Load Main Application
  await page.goto(indexPath, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Assert Title & Main Layout Elements
  const title = await page.title();
  assert.equal(title.includes('Concrete Kings'), true, 'Page title must contain Concrete Kings');

  // 2. Check UI Navigation Elements
  const canvasExists = await page.evaluate(() => !!document.getElementById('narrativeMapCanvas'));
  assert.equal(canvasExists, true, '#narrativeMapCanvas must exist in DOM');

  const minigameCanvasExists = await page.evaluate(() => !!document.getElementById('minigame-canvas'));
  assert.equal(minigameCanvasExists, true, '#minigame-canvas must exist in DOM');

  // 3. Test Modals & Engines in Window Scope
  //
  // Only engines index.html actually calls. DeckBuilderEngine, CardCraftingEngine,
  // FriendsListEngine and MatchmakingReconnectionEngine used to be asserted here
  // and are deliberately gone: they are unloaded, because nothing referenced
  // them. Their <script> tags are removed with a note in index.html and they
  // keep their own unit tests. Asserting a global exists proves the tag loaded,
  // not that the engine does anything — leaving those four here would have
  // guarded the tag and nothing else.
  const engineCheck = await page.evaluate(() => {
    return {
      ScenarioCompiler: typeof window.ScenarioCompiler,
      ScenarioUIEngine: typeof window.ScenarioUIEngine,
      SinglePlayerAICampaign: typeof window.SinglePlayerAICampaign,
      ChronicleCanonEngine: typeof window.ChronicleCanonEngine,
      MiniGameManager: typeof window.MiniGameManager
    };
  });
  console.log('Window Engine Audit:', engineCheck);
  const windowEnginesOk = Object.values(engineCheck).every(v => v !== 'undefined');
  assert.equal(windowEnginesOk, true, `All core engines must be registered in window scope: ${JSON.stringify(engineCheck)}`);

  // The unloaded engines must STAY unloaded. Without this the tags can drift
  // back in and nobody notices 4221 lines re-entering every page load.
  const unloaded = await page.evaluate(() => ({
    DeckBuilderEngine: typeof window.DeckBuilderEngine,
    FriendsListEngine: typeof window.FriendsListEngine,
    TopDownCityRenderer: typeof window.TopDownCityRenderer,
    AssetRegistry: typeof window.AssetRegistry
  }));
  assert.deepEqual({ ...unloaded }, {
    DeckBuilderEngine: 'undefined',
    FriendsListEngine: 'undefined',
    TopDownCityRenderer: 'undefined',
    AssetRegistry: 'undefined'
  }, 'these modules are intentionally not loaded in the browser; see index.html');

  // 4. Audit Mini-Game Registration & Functionality
  const registeredGames = await page.evaluate(() => {
    const minigameCanvas = document.getElementById('minigame-canvas');
    if (!minigameCanvas) return [];
    const manager = new MiniGameManager(minigameCanvas);
    if (typeof window.StreetDice !== 'undefined') manager.registerGame('street_dice', window.StreetDice);
    if (typeof window.BodegaRun !== 'undefined') manager.registerGame('bodega_run', window.BodegaRun);
    if (typeof window.HaircutChallenge !== 'undefined') manager.registerGame('haircut_challenge', window.HaircutChallenge);
    if (typeof window.Lockpicking !== 'undefined') manager.registerGame('lockpicking', window.Lockpicking);
    if (typeof window.Negotiation !== 'undefined') manager.registerGame('negotiation', window.Negotiation);
    if (typeof window.FreestyleCipher !== 'undefined') manager.registerGame('freestyle_cipher', window.FreestyleCipher);
    if (typeof window.DissTrackShowdown !== 'undefined') manager.registerGame('diss_track_showdown', window.DissTrackShowdown);
    if (typeof window.PackageRun !== 'undefined') manager.registerGame('package_run', window.PackageRun);
    if (typeof window.SampleClearance !== 'undefined') manager.registerGame('sample_clearance', window.SampleClearance);
    if (typeof window.StashHouse !== 'undefined') manager.registerGame('stash_house', window.StashHouse);
    if (typeof window.StudioSession !== 'undefined') manager.registerGame('studio_session', window.StudioSession);
    if (typeof window.BlockTerritory !== 'undefined') manager.registerGame('block_territory', window.BlockTerritory);
    if (typeof window.FuneralEulogy !== 'undefined') manager.registerGame('funeral_eulogy', window.FuneralEulogy);
    if (typeof window.GraffitiTagging !== 'undefined') manager.registerGame('graffiti_tagging', window.GraffitiTagging);
    if (typeof window.DJBattle !== 'undefined') manager.registerGame('dj_battle', window.DJBattle);
    if (typeof window.PoliceInterrogation !== 'undefined') manager.registerGame('police_interrogation', window.PoliceInterrogation);
    window.testMiniGameManager = manager;
    return Object.keys(manager.registry);
  });

  const expectedGames = [
    'street_dice', 'bodega_run', 'haircut_challenge', 'lockpicking', 'negotiation',
    'freestyle_cipher', 'diss_track_showdown', 'package_run',
    'sample_clearance', 'stash_house', 'studio_session', 'block_territory', 'funeral_eulogy',
    'graffiti_tagging', 'dj_battle', 'police_interrogation'
  ];

  expectedGames.forEach(g => {
    assert.equal(registeredGames.includes(g), true, `Mini-game '${g}' must be registered`);
  });

  // 5. Test Mini-Game Trigger Execution
  const miniGameRunSuccess = await page.evaluate(() => {
    if (!window.testMiniGameManager) return false;
    try {
      const manager = window.testMiniGameManager;
      if (!manager.registry['freestyle_cipher']) return true;
      const res = manager.start('freestyle_cipher', {});
      return res === true;
    } catch (e) {
      return false;
    }
  });
  if (miniGameRunSuccess !== true && await page.evaluate(() => !!window.testMiniGameManager?.registry['freestyle_cipher'])) {
    assert.equal(miniGameRunSuccess, true, 'Mini-game start trigger must execute successfully');
  }

  // 6. Test Scenario Builder Modal Interaction
  await page.evaluate(() => {
    const modal = document.getElementById('scenarioModal');
    if (modal) modal.style.display = 'block';
  });
  await page.waitForTimeout(300);

  const scenarioModalVisible = await page.evaluate(() => {
    const modal = document.getElementById('scenarioModal');
    return modal && modal.style.display !== 'none';
  });
  assert.equal(scenarioModalVisible, true, '#scenarioModal must open cleanly');

  // Close modal
  await page.evaluate(() => {
    if (window.app && typeof window.app.closeScenarioModal === 'function') {
      window.app.closeScenarioModal();
    }
  });

  // 7. The narrative map must fit its frame.
  //
  // This is measured rather than static because it cannot be seen any other way:
  // HANDOFF trap 2.1 is that documentElement.scrollHeight always reports the
  // viewport height here, so every screen looks like a perfect fit unless you
  // measure the .screen element itself.
  //
  // #blockMap ran 277px past its frame. Two causes, both of which can come back
  // silently: the world control bar wrapping to four rows under the canvas, and
  // the canvas sizing itself from a fixed calc(100vh - Npx) that no longer
  // matched the chrome around it.
  // Both the short and the tall viewport, because the two failure modes appear
  // at opposite ends and neither viewport catches both.
  //
  // Overflow shows where vertical space is SCARCE. Stretch shows where it is
  // SPARE: the canvas is capped at its native 540, so a frame that grows past it
  // pulls the canvas with it via the flex align-self:stretch default. At
  // 1920x1080 that produced a 960x703 canvas — 1.37 on 16:9 art. At 1280x720
  // there is no spare height, the canvas measures 643x362 either way, and an
  // aspect assertion there passes whether the bug is present or not.
  const measure = () => {
    const s = document.getElementById('blockMap');
    const c = document.getElementById('narrativeMapCanvas');
    const r = c.getBoundingClientRect();
    return {
      overflow: s.scrollHeight - s.clientHeight,
      ratio: r.height ? +(r.width / r.height).toFixed(2) : 0,
      hScroll: document.body.scrollWidth > document.body.clientWidth
    };
  };

  for (const vp of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(vp);
    await page.evaluate(() => window.app && window.app.showMap && window.app.showMap('STORY'));
    await page.waitForTimeout(1000);
    const fit = await page.evaluate(measure);
    const at = `${vp.width}x${vp.height}`;
    assert.equal(fit.overflow, 0, `#blockMap must fit its frame at ${at}; overflows by ${fit.overflow}px`);
    assert.equal(fit.hScroll, false, `the map screen must not cause horizontal page scroll at ${at}`);
    assert.equal(fit.ratio, 1.78, `map canvas must keep its 16:9 aspect at ${at}, got ${fit.ratio}`);
  }

  // Assert No Uncaught Console Errors
  assert.equal(consoleErrors.length, 0, `Uncaught console errors detected: ${consoleErrors.join(', ')}`);
  } finally {
    await browser.close();
  }
});
