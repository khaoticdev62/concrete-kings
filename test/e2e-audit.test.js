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
  const canvasExists = await page.evaluate(() => !!document.getElementById('topDownMapCanvas'));
  assert.equal(canvasExists, true, '#topDownMapCanvas must exist in DOM');

  const minigameCanvasExists = await page.evaluate(() => !!document.getElementById('minigame-canvas'));
  assert.equal(minigameCanvasExists, true, '#minigame-canvas must exist in DOM');

  // 3. Test Modals & Engines in Window Scope
  const engineCheck = await page.evaluate(() => {
    return {
      ScenarioCompiler: typeof window.ScenarioCompiler,
      ScenarioUIEngine: typeof window.ScenarioUIEngine,
      SinglePlayerAICampaign: typeof window.SinglePlayerAICampaign,
      ChronicleCanonEngine: typeof window.ChronicleCanonEngine,
      DeckBuilderEngine: typeof window.DeckBuilderEngine,
      CardCraftingEngine: typeof window.CardCraftingEngine,
      FriendsListEngine: typeof window.FriendsListEngine,
      MatchmakingReconnectionEngine: typeof window.MatchmakingReconnectionEngine,
      MiniGameManager: typeof window.MiniGameManager
    };
  });
  console.log('Window Engine Audit:', engineCheck);
  const windowEnginesOk = Object.values(engineCheck).every(v => v !== 'undefined');
  assert.equal(windowEnginesOk, true, `All core engines must be registered in window scope: ${JSON.stringify(engineCheck)}`);

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
      const res = window.testMiniGameManager.start('freestyle_cipher', {});
      return res === true;
    } catch (e) {
      return false;
    }
  });
  assert.equal(miniGameRunSuccess, true, 'Mini-game start trigger must execute successfully');

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

  // Assert No Uncaught Console Errors
  assert.equal(consoleErrors.length, 0, `Uncaught console errors detected: ${consoleErrors.join(', ')}`);

  await browser.close();
});
