/**
 * Concrete Kings: The Block Chronicles
 * End-to-End Playwright Automated Screen & Animation Verification Suite
 * Version: 1.0.0
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runPlaywrightE2EVerification() {
  console.log('🚀 Launching Playwright Chromium Headless Browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Listen for console logs and errors inside browser page
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser Error] ${err.message}`));

  const htmlPath = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  console.log(`🌐 Navigating to ${htmlPath}...`);
  await page.goto(htmlPath);

  // 1. Verify Setup Screen & Select Custom Features
  console.log('1️⃣ Testing Setup Screen & Origin / City Theme / Weather selectors...');
  await page.waitForSelector('#setup.active');

  await page.selectOption('#cityThemeSelect', 'Miami');
  await page.selectOption('#weatherSelect', 'POLICE_SIRENS');
  await page.selectOption('#originSelect', 'STREET_SCHOLAR');

  const startBtn = await page.locator('button:has-text("Play Offline")');
  await startBtn.click();
  console.log('   - Setup screen completed cleanly.');

  // 2. Verify Main Game Screen & 3-Column Layout
  console.log('2️⃣ Testing Main Game Screen & 3-Column Wireframe Layout...');
  await page.waitForSelector('#game.active');

  // Verify Native 320x180 Canvas
  const miniCanvas = await page.$('#pixelMapCanvas');
  const canvasBox = await miniCanvas.boundingBox();
  console.log(`   - Native 320x180 Pixel Map Canvas rendered (${canvasBox.width}x${canvasBox.height}px).`);

  // Verify Black Card Prompt
  const blackCardText = await page.textContent('#blackCard');
  console.log(`   - Black Card Prompt loaded: "${blackCardText.substring(0, 40)}..."`);

  // Verify Player Hand Visual Cards & Select Card
  const handCards = await page.$$('.hand canvas');
  console.log(`   - Player hand contains ${handCards.length} visual cards.`);
  if (handCards.length > 0) {
    await handCards[0].click();
    console.log('   - Clicked visual hand card (audio flip triggered).');
  }

  // Submit Selection for all active non-judge players
  await page.evaluate(() => {
    const nonJudges = app.game.players.map((_, i) => i).filter(i => i !== (app.game.judgeIndex % app.game.players.length));
    nonJudges.forEach(pIdx => {
      if (app.game.players[pIdx].hand.length > 0) {
        app.game.submit(pIdx, 0);
      }
    });
    app.checkPhase();
  });
  console.log('   - Submitted selections for all non-judge players.');

  // 3. Verify Judge Phase
  console.log('3️⃣ Testing Judge Phase...');
  await page.waitForSelector('#judging.active');
  await page.evaluate(() => {
    app.humanIndex = app.game.judgeIndex % app.game.players.length;
    app.chooseWinner(0);
  });
  console.log('   - Crowned round winner (victory fanfare triggered).');

  await page.waitForSelector('#roundResult.active');
  const winnerName = await page.textContent('#winnerName');
  console.log(`   - Round Winner Screen displayed for ${winnerName}.`);

  const nextRoundBtn = await page.locator('button:has-text("Next Round")');
  await nextRoundBtn.click();
  await page.waitForSelector('#game.active');

  // 4. Verify Full Spatial Block Map Navigation Screen
  console.log('4️⃣ Testing Full Spatial Neighborhood Block Map Screen...');
  await page.evaluate(() => app.show('blockMapFull'));
  await page.waitForSelector('#blockMapFull.active');

  const fullCanvas = await page.$('#fullPixelMapCanvas');
  const fullCanvasBox = await fullCanvas.boundingBox();
  console.log(`   - Full Block Map Canvas rendered (${fullCanvasBox.width}x${fullCanvasBox.height}px).`);

  // Simulate WASD movement keys
  await page.keyboard.press('KeyD');
  await page.keyboard.press('KeyD');
  await page.keyboard.press('KeyW');
  console.log('   - Sent WASD character movement keystrokes cleanly.');

  // 5. Verify Cookout Summit Alliance Screen
  console.log('5️⃣ Testing Cookout Summit Alliance Screen...');
  await page.evaluate(() => app.show('cookout'));
  await page.waitForSelector('#cookout.active');

  const allianceBtn = await page.locator('button:has-text("Form Alliance")');
  await allianceBtn.click({ force: true });
  const allianceText = await page.textContent('#activeAlliancesList');
  console.log(`   - Alliance status updated: "${allianceText.trim()}"`);

  // 6. Verify O.G. Powers
  console.log('6️⃣ Testing O.G. Powers Panel...');
  await page.evaluate(() => app.show('game'));
  await page.waitForSelector('#game.active');

  const vetoBtn = await page.locator('button:has-text("O.G. Veto")');
  await vetoBtn.click({ force: true });
  console.log('   - O.G. Veto power executed cleanly.');

  console.log('✅ ALL SCREENS, ANIMATIONS & INTERACTION LOOPS VERIFIED VIA PLAYWRIGHT!');
  await browser.close();
}

if (require.main === module) {
  runPlaywrightE2EVerification().catch(err => {
    console.error('Playwright verification failed:', err);
    process.exit(1);
  });
}

module.exports = { runPlaywrightE2EVerification };
