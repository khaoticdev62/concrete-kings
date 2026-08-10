/**
 * Concrete Kings: The Block Chronicles
 * Battle Pass & Season Pass Engine (Checklist Section 7.5 & Priority Matrix #4)
 *
 * Manages seasonal progression, 50 tiers of Free & Premium rewards,
 * tier unlocking, and reward claiming.
 */

class BattlePassEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.xpPerTier = options.xpPerTier || 500;
    this.totalTiers = options.totalTiers || 50;
    this.state = this.loadState();
  }

  loadState() {
    if (!this.storage) return this.getDefaultState();
    try {
      const raw = this.storage.getItem('ck-battle-pass');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.getDefaultState();
  }

  saveState() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-battle-pass', JSON.stringify(this.state));
    } catch (e) {}
  }

  getDefaultState() {
    return {
      seasonId: 'season_1_harlem_rise',
      xp: 0,
      isPremium: false,
      claimedFree: [],
      claimedPremium: []
    };
  }

  get currentTier() {
    return Math.min(this.totalTiers, Math.floor(this.state.xp / this.xpPerTier) + 1);
  }

  get xpInTier() {
    return this.state.xp % this.xpPerTier;
  }

  addXp(amount) {
    if (typeof amount !== 'number' || amount <= 0) return { unlockedTiers: [] };
    const oldTier = this.currentTier;
    this.state.xp += amount;
    const newTier = this.currentTier;

    const unlockedTiers = [];
    for (let t = oldTier + 1; t <= newTier; t++) {
      unlockedTiers.push(t);
    }

    this.saveState();
    return {
      oldTier,
      newTier,
      unlockedTiers,
      totalXp: this.state.xp
    };
  }

  getRewardForTier(tier) {
    if (tier < 1 || tier > this.totalTiers) return null;
    return {
      free: { type: 'DUST', amount: 50 * tier, label: `${50 * tier} Receipt Dust` },
      premium: { type: 'CARD_BACK', id: `cb_tier_${tier}`, label: `District Card Back Tier ${tier}` }
    };
  }

  claimReward(tier, track = 'free') {
    if (tier > this.currentTier) {
      return { success: false, reason: `Tier ${tier} not unlocked yet (Current Tier: ${this.currentTier}).` };
    }
    if (track === 'premium' && !this.state.isPremium) {
      return { success: false, reason: 'Requires Premium Street Pass.' };
    }

    const claimedArray = track === 'premium' ? this.state.claimedPremium : this.state.claimedFree;
    if (claimedArray.includes(tier)) {
      return { success: false, reason: `Reward for tier ${tier} (${track}) already claimed.` };
    }

    const rewards = this.getRewardForTier(tier);
    const reward = track === 'premium' ? rewards.premium : rewards.free;
    claimedArray.push(tier);
    this.saveState();

    return {
      success: true,
      tier,
      track,
      reward
    };
  }

  upgradeToPremium() {
    this.state.isPremium = true;
    this.saveState();
    return { success: true };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BattlePassEngine };
}
if (typeof window !== 'undefined') {
  window.BattlePassEngine = BattlePassEngine;
}
