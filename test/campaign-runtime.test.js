const test = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/dom-stubs');
const { FirstMilesCampaign, FIRST_MILES_ORIGIN_SECRETS } = require('../src/pixel_engine/first-miles-campaign.js');

function createApp() {
  return {
    firstMilesCampaign: null,
    storyEngine: null,
    game: {
      mode: 0,
      isCampaign: false,
      pointsToWin: 99,
      players: [{ name: 'Player', hand: ['hood_talk','block_talk','stay_quiet','make_a_call'], points: 0, submissions: [], selected: new Set() }],
      submissions: [],
      currentBlack: null,
      judgeIndex: 0,
      nextBlack() {},
      dealAll() {},
      refillHand() {}
    },
    humanIndex: 0,
    miniGameActive: false,
    updateTopHud() {},
    updateStatHud() {},
    renderGame() {},
    enterJudging() {},
    runNarrativeBotTurns() {},
    show() {},
    startResolutionAutoAdvance() {},
    clearResolutionAutoAdvance() {},
    refreshCampaignContinueButton() {},
    submitCampaignBeat(cardText) {
      if (!this.firstMilesCampaign || typeof this.firstMilesCampaign.choose !== 'function') return;
      this.firstMilesCampaign.choose(cardText);
    },
    nextRound() {
      const campaign = this.firstMilesCampaign;
      if (!campaign || !campaign.active) return;
      const beat = campaign.currentBeatData;
      if (!beat) {
        campaign.renderEpilogue();
        return;
      }
      this.game.currentBlack = { raw: beat.blackCard, prompt: beat.blackCard, hasDice: false, effect: null };
      if (campaign.currentScreen === 'beat' && typeof campaign.renderBeat === 'function') campaign.renderBeat();
      this.updateTopHud();
    }
  };
}

test('Campaign runtime: submit + nextRound advances beats and keeps the loop active', () => {
  const app = createApp();
  const campaign = new FirstMilesCampaign(app);
  campaign.start('BARBER', FIRST_MILES_ORIGIN_SECRETS['BARBER']);
  app.firstMilesCampaign = campaign;
  app.storyEngine = { active: true };

  assert.equal(campaign.state.currentBeat, 1, 'campaign starts on beat 1');

  app.submitCampaignBeat('hood_talk');
  assert.equal(campaign.state.currentBeat, 2, 'runtime beat advances from 1 to 2');
  assert.ok(campaign.active, 'campaign remains active after submit');
  assert.ok(campaign.currentBeatData, 'currentBeatData exists after submit');

  app.nextRound();
  assert.equal(app.game.currentBlack && app.game.currentBlack.prompt, campaign.currentBeatData.blackCard, 'next black prompt follows current beat');
});
