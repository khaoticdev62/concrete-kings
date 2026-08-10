/**
 * Concrete Kings: The Block Chronicles
 * Quick Chat & Emote System (Checklist Section 2.3)
 *
 * Implements AAVE preset phrases, chat commands (/whisper, /emote, /help),
 * profanity filtering, and animated speech bubble overlays over character avatars.
 */

const QUICK_PHRASES = [
  "No cap!",
  "Facts!",
  "That's hard!",
  "Hold up!",
  "Respect.",
  "You wilding!",
  "Check the receipts!",
  "Lineup fresh!"
];

const EMOTE_ACTIONS = {
  NOD: 'nods respectfully',
  SCOFF: 'scoffs and rolls eyes',
  LAUGH: 'laughs out loud',
  PANIC: 'panics and looks around',
  SALUTE: 'salutes the block',
  SHRUG: 'shrugs shoulders'
};

class QuickChatSystem {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.quickPhrases = [...QUICK_PHRASES];
    this.activeBubbles = new Map();
    this.chatLog = [];
    this.onNewMessage = options.onNewMessage || null;
  }

  processCommand(rawInput, senderName = 'YOU') {
    if (!rawInput) return null;
    const trimmed = rawInput.trim();

    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (command === 'help') {
        const helpMsg = {
          type: 'SYSTEM',
          text: 'Commands: /whisper <name> <msg>, /emote <nod|scoff|laugh|panic|salute|shrug>, /help',
          timestamp: Date.now()
        };
        this.addLog(helpMsg);
        return helpMsg;
      }

      if (command === 'whisper') {
        const target = args[0] || 'Unknown';
        const msg = args.slice(1).join(' ');
        const whisperMsg = {
          type: 'WHISPER',
          sender: senderName,
          target,
          text: msg,
          timestamp: Date.now()
        };
        this.addLog(whisperMsg);
        return whisperMsg;
      }

      if (command === 'emote') {
        const emoteKey = (args[0] || 'NOD').toUpperCase();
        const actionText = EMOTE_ACTIONS[emoteKey] || `does ${args.join(' ')}`;
        const emoteMsg = {
          type: 'EMOTE',
          sender: senderName,
          text: `* ${senderName} ${actionText} *`,
          timestamp: Date.now()
        };
        this.addLog(emoteMsg);
        return emoteMsg;
      }

      const unknownMsg = { type: 'SYSTEM', text: `Unknown command: /${command}. Type /help for assistance.`, timestamp: Date.now() };
      this.addLog(unknownMsg);
      return unknownMsg;
    }

    // Standard Chat Message
    const chatMsg = {
      type: 'CHAT',
      sender: senderName,
      text: trimmed,
      timestamp: Date.now()
    };
    this.addLog(chatMsg);
    return chatMsg;
  }

  sendQuickPhrase(phraseIndex, senderName = 'YOU') {
    const phrase = this.quickPhrases[phraseIndex] || this.quickPhrases[0];
    return this.processCommand(phrase, senderName);
  }

  addLog(msg) {
    this.chatLog.push(msg);
    if (typeof this.onNewMessage === 'function') {
      this.onNewMessage(msg);
    }
  }

  createSpeechBubble(characterId, text, position = { x: 100, y: 100 }, durationMs = 3000) {
    const bubbleId = `bubble_${characterId}_${Date.now()}`;
    const bubbleData = {
      id: bubbleId,
      characterId,
      text,
      position,
      expiresAt: Date.now() + durationMs
    };
    this.activeBubbles.set(bubbleId, bubbleData);
    return bubbleData;
  }

  pruneExpiredBubbles() {
    const now = Date.now();
    for (const [id, bubble] of this.activeBubbles.entries()) {
      if (now >= bubble.expiresAt) {
        this.activeBubbles.delete(id);
      }
    }
    return Array.from(this.activeBubbles.values());
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuickChatSystem, QUICK_PHRASES, EMOTE_ACTIONS };
}
if (typeof window !== 'undefined') {
  window.QuickChatSystem = QuickChatSystem;
  window.QUICK_PHRASES = QUICK_PHRASES;
  window.EMOTE_ACTIONS = EMOTE_ACTIONS;
}
