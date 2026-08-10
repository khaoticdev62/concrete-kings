/**
 * Concrete Kings: The Block Chronicles
 * Leaderboards & District Rankings Engine (Checklist Section 8.6 & Priority Matrix #5)
 *
 * Manages global and district scoreboards, player rank calculations, and weekly resets.
 */

class LeaderboardEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.leaderboard = this.loadLeaderboard();
  }

  loadLeaderboard() {
    if (!this.storage) return this.getDefaultLeaderboard();
    try {
      const raw = this.storage.getItem('ck-leaderboard');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.getDefaultLeaderboard();
  }

  saveLeaderboard() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-leaderboard', JSON.stringify(this.leaderboard));
    } catch (e) {}
  }

  getDefaultLeaderboard() {
    return [
      { rank: 1, tag: 'HarlemKing#1994', name: 'Harlem King', score: 2850, district: 'Harlem', wins: 42 },
      { rank: 2, tag: 'BmoreHustler#4410', name: 'B-More Hustler', score: 2620, district: 'Baltimore', wins: 38 },
      { rank: 3, tag: 'ChiTownPlug#3120', name: 'Windy City Plug', score: 2490, district: 'Chicago', wins: 34 },
      { rank: 4, tag: 'DetroitLegend#3130', name: 'Motor City Legend', score: 2310, district: 'Detroit', wins: 30 },
      { rank: 5, tag: 'MiamiVice#3050', name: 'Magic City Plug', score: 2180, district: 'Miami', wins: 28 }
    ];
  }

  getRankings(filterDistrict = null) {
    let list = [...this.leaderboard];
    if (filterDistrict) {
      list = list.filter(e => e.district.toLowerCase() === filterDistrict.toLowerCase());
    }
    list.sort((a, b) => b.score - a.score);
    return list.map((e, idx) => ({ ...e, rank: idx + 1 }));
  }

  submitScore(tag, name, scoreDelta, district = 'Harlem') {
    let entry = this.leaderboard.find(e => e.tag === tag);
    if (!entry) {
      entry = { rank: 0, tag, name, score: 1000, district, wins: 0 };
      this.leaderboard.push(entry);
    }

    entry.score += scoreDelta;
    if (scoreDelta > 0) entry.wins += 1;

    this.saveLeaderboard();
    return this.getPlayerRank(tag);
  }

  getPlayerRank(tag) {
    const sorted = this.getRankings();
    const found = sorted.find(e => e.tag === tag);
    return found ? { rank: found.rank, entry: found } : null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeaderboardEngine };
}
if (typeof window !== 'undefined') {
  window.LeaderboardEngine = LeaderboardEngine;
}
