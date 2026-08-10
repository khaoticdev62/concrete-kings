/**
 * Concrete Kings: The Block Chronicles
 * Player Customization & Cosmetic Engine (Checklist Section 12.1 & Spec v3.0)
 *
 * Manages player avatars, frames, titles, card backs, and profile cosmetic themes.
 */

const AVATARS = [
  { id: 'BARBER_RAY', name: 'Master Barber Ray', origin: 'BARBER', asset: 'assets/sprites/player_barber.jpg' },
  { id: 'PLUG_CHEN', name: 'Chen', origin: 'CORNER_MERCHANT', asset: 'assets/sprites/player_plug.jpg' },
  { id: 'LEGEND_TBONE', name: 'T-Bone', origin: 'LOCAL_LEGEND', asset: 'assets/sprites/player_legend.jpg' },
  { id: 'HUSTLER_GATE', name: 'Gate', origin: 'HUSTLE_VETERAN', asset: 'assets/sprites/player_hustler.jpg' },
  { id: 'SCHEMER_TASHA', name: 'Tasha', origin: 'COMMUNITY_ORGANIZER', asset: 'assets/sprites/player_hustler.jpg' },
  { id: 'CHAOS_RICO', name: 'Rico', origin: 'UNDERGROUND_DJ', asset: 'assets/sprites/player_legend.jpg' }
];

const AVATAR_FRAMES = [
  { id: 'DEFAULT_BORDER', name: 'Standard Border', borderStyle: '2px solid #2d313d' },
  { id: 'GOLDEN_CHEVRON', name: 'Golden Chevron', borderStyle: '3px solid #ffcd68' },
  { id: 'NEON_GLOW', name: 'Neon Glow', borderStyle: '3px solid #6fe8d8' },
  { id: 'BLOCK_LEGEND_FRAME', name: 'Block Legend', borderStyle: '3px solid #f25438' }
];

const CARD_BACKS = [
  { id: 'DEFAULT_BLACK', name: 'Concrete Black', color: '#101116' },
  { id: 'HARLEM_GOLD', name: 'Harlem Gold', color: '#ffcd68' },
  { id: 'DETROIT_STEEL', name: 'Detroit Steel', color: '#a0aac2' },
  { id: 'MIAMI_NEON', name: 'Miami Neon', color: '#6fe8d8' },
  { id: 'NOLA_CREOLE', name: 'NOLA Creole', color: '#ff7fbf' },
  { id: 'CHICAGO_WIND', name: 'Chicago Wind', color: '#339488' }
];

const UNLOCKABLE_TITLES = [
  "Block Legend",
  "O.G.",
  "Receipt Collector",
  "Master Barber",
  "Street Scholar",
  "High Roller"
];

class PlayerCustomizationEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.profile = {
      avatarId: 'BARBER_RAY',
      frameId: 'DEFAULT_BORDER',
      cardBackId: 'DEFAULT_BLACK',
      title: 'Block Legend'
    };
    this.loadState();
  }

  loadState() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem('ck-player-customization');
      if (raw) {
        const saved = JSON.parse(raw);
        this.profile = { ...this.profile, ...saved };
      }
    } catch (e) {}
  }

  saveState() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-player-customization', JSON.stringify(this.profile));
    } catch (e) {}
  }

  setAvatar(avatarId) {
    const avatar = AVATARS.find(a => a.id === avatarId);
    if (!avatar) return false;
    this.profile.avatarId = avatarId;
    this.saveState();
    return true;
  }

  setFrame(frameId) {
    const frame = AVATAR_FRAMES.find(f => f.id === frameId);
    if (!frame) return false;
    this.profile.frameId = frameId;
    this.saveState();
    return true;
  }

  setCardBack(backId) {
    const back = CARD_BACKS.find(b => b.id === backId);
    if (!back) return false;
    this.profile.cardBackId = backId;
    this.saveState();
    return true;
  }

  setTitle(titleStr) {
    if (!UNLOCKABLE_TITLES.includes(titleStr)) return false;
    this.profile.title = titleStr;
    this.saveState();
    return true;
  }

  getProfileDetails() {
    const avatar = AVATARS.find(a => a.id === this.profile.avatarId) || AVATARS[0];
    const frame = AVATAR_FRAMES.find(f => f.id === this.profile.frameId) || AVATAR_FRAMES[0];
    const cardBack = CARD_BACKS.find(b => b.id === this.profile.cardBackId) || CARD_BACKS[0];

    return {
      avatar,
      frame,
      cardBack,
      title: this.profile.title
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PlayerCustomizationEngine, AVATARS, AVATAR_FRAMES, CARD_BACKS, UNLOCKABLE_TITLES };
}
if (typeof window !== 'undefined') {
  window.PlayerCustomizationEngine = PlayerCustomizationEngine;
  window.AVATARS = AVATARS;
  window.AVATAR_FRAMES = AVATAR_FRAMES;
  window.CARD_BACKS = CARD_BACKS;
  window.UNLOCKABLE_TITLES = UNLOCKABLE_TITLES;
}
