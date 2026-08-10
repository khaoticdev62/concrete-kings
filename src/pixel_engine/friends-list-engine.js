/**
 * Concrete Kings: The Block Chronicles
 * Friends List & Social Graph Engine (Checklist Section 8.1 & Priority Matrix #4)
 *
 * Manages street friends list, active status, player blocking, and private match invitations.
 */

class FriendsListEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.friends = this.loadFriends();
    this.blocked = this.loadBlocked();
    this.activeInvites = [];
  }

  loadFriends() {
    if (!this.storage) return this.getDefaultFriends();
    try {
      const raw = this.storage.getItem('ck-friends-list');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.getDefaultFriends();
  }

  loadBlocked() {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem('ck-blocked-list');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  save() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-friends-list', JSON.stringify(this.friends));
      this.storage.setItem('ck-blocked-list', JSON.stringify(this.blocked));
    } catch (e) {}
  }

  getDefaultFriends() {
    return [
      { tag: 'HarlemLegend#1994', name: 'Harlem Legend', status: 'ONLINE', district: 'Harlem', level: 12 },
      { tag: 'BmoreKing#4410', name: 'B-More Hustler', status: 'IN_GAME', district: 'Baltimore', level: 8 },
      { tag: 'ChiTownPlug#3120', name: 'Windy City Plug', status: 'OFFLINE', district: 'Chicago', level: 15 }
    ];
  }

  getFriends() {
    return this.friends;
  }

  getBlocked() {
    return this.blocked;
  }

  addFriend(tag, name = tag) {
    if (!tag) return { success: false, reason: 'Invalid player tag.' };
    if (this.blocked.includes(tag)) {
      return { success: false, reason: `Player '${tag}' is blocked.` };
    }
    if (this.friends.some(f => f.tag === tag)) {
      return { success: false, reason: `Player '${tag}' is already on your friends list.` };
    }

    const newFriend = {
      tag,
      name,
      status: 'ONLINE',
      district: 'Harlem',
      level: 1
    };

    this.friends.push(newFriend);
    this.save();
    return { success: true, friend: newFriend };
  }

  removeFriend(tag) {
    const idx = this.friends.findIndex(f => f.tag === tag);
    if (idx === -1) return { success: false, reason: 'Friend not found.' };
    this.friends.splice(idx, 1);
    this.save();
    return { success: true };
  }

  blockPlayer(tag) {
    if (!tag) return { success: false };
    this.removeFriend(tag);
    if (!this.blocked.includes(tag)) {
      this.blocked.push(tag);
      this.save();
    }
    return { success: true };
  }

  unblockPlayer(tag) {
    const idx = this.blocked.indexOf(tag);
    if (idx !== -1) {
      this.blocked.splice(idx, 1);
      this.save();
    }
    return { success: true };
  }

  inviteToMatch(friendTag) {
    const friend = this.friends.find(f => f.tag === friendTag);
    if (!friend) return { success: false, reason: 'Friend not found.' };
    if (friend.status === 'OFFLINE') return { success: false, reason: 'Player is currently offline.' };

    const invite = {
      id: `invite_${Date.now()}`,
      friendTag,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    this.activeInvites.push(invite);
    return { success: true, invite };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FriendsListEngine };
}
if (typeof window !== 'undefined') {
  window.FriendsListEngine = FriendsListEngine;
}
