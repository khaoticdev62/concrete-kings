/**
 * Concrete Kings: The Block Chronicles
 * Player Progression & Daily Quests System
 *
 * Handles XP calculation, level progression, daily quests generation,
 * progress tracking, and reward payouts.
 */

const DAILY_QUEST_POOL = [
  {
    id: 'win_rounds',
    title: 'BLOCK RULER',
    desc: 'Win 3 card game rounds',
    target: 3,
    rewardXp: 50,
    rewardCash: 25
  },
  {
    id: 'play_dice',
    title: 'HIGH ROLLER',
    desc: 'Play Street Dice mini-game',
    target: 1,
    rewardXp: 40,
    rewardCash: 20
  },
  {
    id: 'resolve_receipt',
    title: 'COLLECT DEBTS',
    desc: 'Resolve 1 receipt in game',
    target: 1,
    rewardXp: 60,
    rewardCash: 30
  },
  {
    id: 'travel_city',
    title: 'CITY HUSTLE',
    desc: 'Travel to 2 different districts',
    target: 2,
    rewardXp: 45,
    rewardCash: 20
  },
  {
    id: 'bodega_run',
    title: 'CORNER RUNNER',
    desc: 'Play Bodega Run mini-game',
    target: 1,
    rewardXp: 40,
    rewardCash: 20
  },
  {
    id: 'buy_item',
    title: 'STREET PREP',
    desc: 'Buy 1 prep item from shop',
    target: 1,
    rewardXp: 50,
    rewardCash: 25
  }
];

class PlayerProgression {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.xp = this.loadXp(options.initialXp);
    this.quests = [];
    this.lastQuestDate = null;
    this.loadQuests();
  }

  loadXp(overrideXp) {
    if (typeof overrideXp === 'number') return overrideXp;
    if (this.storage) {
      const val = parseInt(this.storage.getItem('ck-player-xp') || '0', 10);
      return isNaN(val) ? 0 : val;
    }
    return 0;
  }

  saveXp() {
    if (this.storage) {
      this.storage.setItem('ck-player-xp', this.xp.toString());
    }
  }

  get level() {
    return Math.floor(this.xp / 100) + 1;
  }

  get progressInLevel() {
    return this.xp % 100;
  }

  addXp(amount) {
    if (typeof amount !== 'number' || amount <= 0) return { oldLevel: this.level, newLevel: this.level, leveledUp: false, xpGained: 0 };
    const oldLevel = this.level;
    this.xp += amount;
    this.saveXp();
    const newLevel = this.level;
    return {
      oldLevel,
      newLevel,
      leveledUp: newLevel > oldLevel,
      xpGained: amount
    };
  }

  getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadQuests() {
    const today = this.getTodayDateString();
    if (this.storage) {
      const storedDate = this.storage.getItem('ck-quests-date');
      const storedQuests = this.storage.getItem('ck-daily-quests');
      if (storedDate === today && storedQuests) {
        try {
          this.quests = JSON.parse(storedQuests);
          this.lastQuestDate = today;
          return;
        } catch (e) {}
      }
    }
    this.generateDailyQuests(today);
  }

  generateDailyQuests(dateStr = this.getTodayDateString()) {
    // Pick 3 quests deterministically based on date string hash
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const available = [...DAILY_QUEST_POOL];
    const selected = [];

    for (let k = 0; k < 3; k++) {
      const idx = (absHash + k * 7) % available.length;
      const t = available.splice(idx, 1)[0];
      selected.push({
        id: t.id,
        title: t.title,
        desc: t.desc,
        target: t.target,
        progress: 0,
        rewardXp: t.rewardXp,
        rewardCash: t.rewardCash,
        completed: false
      });
    }

    this.quests = selected;
    this.lastQuestDate = dateStr;
    this.saveQuests();
  }

  saveQuests() {
    if (this.storage) {
      this.storage.setItem('ck-quests-date', this.lastQuestDate || this.getTodayDateString());
      this.storage.setItem('ck-daily-quests', JSON.stringify(this.quests));
    }
  }

  updateQuestProgress(questId, amount = 1) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest || quest.completed) return null;

    quest.progress = Math.min(quest.target, quest.progress + amount);
    let justCompleted = false;
    let xpResult = null;

    if (quest.progress >= quest.target && !quest.completed) {
      quest.completed = true;
      justCompleted = true;
      xpResult = this.addXp(quest.rewardXp);

      // Add cash to player's dust/cred balance
      if (this.storage) {
        const currentDust = parseInt(this.storage.getItem('ck-dust-balance') || '0', 10);
        this.storage.setItem('ck-dust-balance', (currentDust + quest.rewardCash).toString());
      }
    }

    this.saveQuests();

    return {
      quest,
      justCompleted,
      xpResult,
      cashGranted: justCompleted ? quest.rewardCash : 0
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PlayerProgression, DAILY_QUEST_POOL };
}
if (typeof window !== 'undefined') {
  window.PlayerProgression = PlayerProgression;
  window.DAILY_QUEST_POOL = DAILY_QUEST_POOL;
}
