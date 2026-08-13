/**
 * CARD RPG Scene Machine — CONTENT LIBRARY (PRD §104/§105)
 *
 * This file is PURE DATA + a registration helper. It contains NO engine logic.
 * Adding a new card, location, mini-game definition, or sample scene here requires
 * zero changes to scene-machine.js — satisfying the §92 "data, not code" rule.
 *
 * To expand content later: append entries to CARDS / LOCATIONS / SCENES / or add a
 * mini-game resolver. Nothing else needs to change.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof window !== 'undefined') window.SceneContent = mod;
})(this, function () {

  // ---------------------------------------------------------------------
  // CARD LIBRARY (§104: 30-50 cards). Each card: id, text, slot, tags.
  // slot ∈ WHO / WHAT / HOW / TWIST. Tags drive template selection (§37).
  // ---------------------------------------------------------------------
  const CARDS = [
    // WHO (characters / factions)
    { id: 'who_marcus', slot: 'WHO', text: 'Marcus', tags: ['social', 'crew'] },
    { id: 'who_mayor', slot: 'WHO', text: 'the Mayor', tags: ['social', 'political', 'high_risk'] },
    { id: 'who_bartender', slot: 'WHO', text: 'the Bartender', tags: ['social', 'neutral'] },
    { id: 'who_rico', slot: 'WHO', text: 'Rico', tags: ['social', 'crime'] },
    { id: 'who_police', slot: 'WHO', text: 'the Police', tags: ['social', 'authority', 'high_risk'] },
    { id: 'who_grandma', slot: 'WHO', text: 'Grandma', tags: ['social', 'family'] },
    { id: 'who_courier', slot: 'WHO', text: 'the Courier', tags: ['social', 'neutral'] },
    { id: 'who_informant', slot: 'WHO', text: 'the Informant', tags: ['social', 'investigation'] },

    // WHAT (goal / approach verb)
    { id: 'what_confront', slot: 'WHAT', text: 'confront the target', tags: ['aggressive', 'confrontation'] },
    { id: 'what_steal', slot: 'WHAT', text: 'steal the package', tags: ['crime', 'steal', 'theft'] },
    { id: 'what_chase', slot: 'WHAT', text: 'start a high-speed chase', tags: ['action', 'chase', 'fast'] },
    { id: 'what_search', slot: 'WHAT', text: 'search the room', tags: ['investigation', 'search', 'discover'] },
    { id: 'what_negotiate', slot: 'WHAT', text: 'negotiate a deal', tags: ['negotiation', 'deal', 'peace'] },
    { id: 'what_interrogate', slot: 'WHAT', text: 'interrogate for the truth', tags: ['interrogation', 'question', 'pressure'] },
    { id: 'what_sneak', slot: 'WHAT', text: 'sneak past everyone', tags: ['stealth', 'sneak', 'quiet'] },
    { id: 'what_persuade', slot: 'WHAT', text: 'convince them with charm', tags: ['persuasion', 'convince', 'charm'] },
    { id: 'what_threaten', slot: 'WHAT', text: 'threaten them', tags: ['aggressive', 'intimidation', 'high_risk'] },
    { id: 'what_bribe', slot: 'WHAT', text: 'bribe the guard', tags: ['crime', 'bribe', 'deal'] },

    // HOW (style / method)
    { id: 'how_loud', slot: 'HOW', text: 'loudly', tags: ['intimidation'] },
    { id: 'how_quiet', slot: 'HOW', text: 'quietly', tags: ['sneaky', 'stealth'] },
    { id: 'how_forceful', slot: 'HOW', text: 'with force', tags: ['aggressive', 'action'] },
    { id: 'how_smooth', slot: 'HOW', text: 'smoothly', tags: ['charm', 'persuasion'] },
    { id: 'how_careful', slot: 'HOW', text: 'carefully', tags: ['investigation', 'quiet'] },
    { id: 'how_reckless', slot: 'HOW', text: 'recklessly', tags: ['chaos', 'wild'] },
    { id: 'how_fast', slot: 'HOW', text: 'as fast as possible', tags: ['fast', 'action', 'escape'] },
    { id: 'how_polite', slot: 'HOW', text: 'politely', tags: ['peace', 'negotiation'] },

    // TWIST (complication)
    { id: 'twist_police', slot: 'TWIST', text: 'the cops arrive', tags: ['chaos', 'authority', 'high_risk'] },
    { id: 'twist_betrayal', slot: 'TWIST', text: 'an ally betrays you', tags: ['chaos', 'betrayal'] },
    { id: 'twist_fire', slot: 'TWIST', text: 'a fire breaks out', tags: ['chaos', 'disaster', 'wild'] },
    { id: 'twist_witness', slot: 'TWIST', text: 'a witness appears', tags: ['investigation', 'evidence'] },
    { id: 'twist_luck', slot: 'TWIST', text: 'a lucky break', tags: ['chaotic', 'story'] },
    { id: 'twist_power', slot: 'TWIST', text: 'the power goes out', tags: ['chaos', 'disaster'] },
    { id: 'twist_ambush', slot: 'TWIST', text: 'you are ambushed', tags: ['action', 'chaos', 'high_risk'] },
    { id: 'twist_nothing', slot: 'TWIST', text: 'nothing goes wrong', tags: ['story'] },

    // ---- Expansion batch (content growth, §105) ----
    // WHO
    { id: 'who_judge', slot: 'WHO', text: 'the Judge', tags: ['social', 'authority', 'political'] },
    { id: 'who_reporter', slot: 'WHO', text: 'the Reporter', tags: ['social', 'media', 'neutral'] },
    { id: 'who_boss', slot: 'WHO', text: 'the Crew Boss', tags: ['social', 'crime', 'high_risk'] },
    { id: 'who_cop_friend', slot: 'WHO', text: 'your Cop Friend', tags: ['social', 'authority', 'ally'] },
    // WHAT
    { id: 'what_heist', slot: 'WHAT', text: 'pull off the heist', tags: ['crime', 'steal', 'theft'] },
    { id: 'what_rescue', slot: 'WHAT', text: 'rescue the hostage', tags: ['action', 'rescue', 'fast'] },
    { id: 'what_spy', slot: 'WHAT', text: 'spy on the meeting', tags: ['investigation', 'discover', 'evidence'] },
    { id: 'what_apologize', slot: 'WHAT', text: 'apologize and make peace', tags: ['negotiation', 'peace', 'deal'] },
    { id: 'what_frame', slot: 'WHAT', text: 'frame someone else', tags: ['crime', 'deception', 'high_risk'] },
    { id: 'what_rally', slot: 'WHAT', text: 'rally the neighborhood', tags: ['social', 'chaos', 'public'] },
    // HOW
    { id: 'how_bribed', slot: 'HOW', text: 'with a bribe', tags: ['crime', 'bribe', 'deal'] },
    { id: 'how_stealthy', slot: 'HOW', text: 'using stealth', tags: ['stealth', 'sneak', 'quiet'] },
    { id: 'how_charming', slot: 'HOW', text: 'with charm', tags: ['persuasion', 'charm', 'convince'] },
    { id: 'how_brutal', slot: 'HOW', text: 'with brute force', tags: ['aggressive', 'action', 'high_risk'] },
    { id: 'how_cunning', slot: 'HOW', text: 'with cunning', tags: ['investigation', 'story', 'sneaky'] },
    // TWIST
    { id: 'twist_explosion', slot: 'TWIST', text: 'an explosion rocks the block', tags: ['chaos', 'disaster', 'wild'] },
    { id: 'twist_recording', slot: 'TWIST', text: 'the whole thing was recorded', tags: ['investigation', 'evidence', 'high_risk'] },
    { id: 'twist_ally_help', slot: 'TWIST', text: 'an unexpected ally helps', tags: ['story', 'ally', 'chaotic'] },
    { id: 'twist_ambush2', slot: 'TWIST', text: 'you walk into an ambush', tags: ['action', 'chaos', 'high_risk'] }
  ];

  // ---------------------------------------------------------------------
  // LOCATIONS (§28/§104). Data-only; the runtime loads only what a scene needs.
  // ---------------------------------------------------------------------
  const LOCATIONS = {
    diner: { id: 'diner', name: 'The Diner', props: ['booth', 'counter', 'coffee', 'door'], lighting: 'warm' },
    street: { id: 'street', name: 'City Street', props: ['trash_can', 'car', 'lamp', 'door'], lighting: 'cold' },
    apartment: { id: 'apartment', name: "Marcus's Apartment", props: ['couch', 'window', 'bag', 'door'], lighting: 'warm' },
    office: { id: 'office', name: 'City Hall Office', props: ['desk', 'chair', 'briefcase', 'window'], lighting: 'dramatic' },
    police_station: { id: 'police_station', name: 'Police Station', props: ['desk', 'cell', 'phone', 'door'], lighting: 'police' }
  };

  // ---------------------------------------------------------------------
  // MINI-GAME RESOLVERS (§45/§47). Deterministic: result derived from seed.
  // success / partial / failure, each may modify the narrative. Data-only defs.
  // ---------------------------------------------------------------------
  const MINI_GAMES = {
    escape: { id: 'escape', label: 'Escape', difficulty: 'medium',
      resolve(seed) { const r = seed % 3; return r === 0 ? 'SUCCESS' : r === 1 ? 'PARTIAL_SUCCESS' : 'FAILURE'; } },
    negotiation: { id: 'negotiation', label: 'Negotiation', difficulty: 'easy',
      resolve(seed) { const r = (seed >> 3) % 3; return r === 0 ? 'SUCCESS' : r === 1 ? 'PARTIAL_SUCCESS' : 'FAILURE'; } },
    search: { id: 'search', label: 'Search', difficulty: 'medium',
      resolve(seed) { const r = (seed >> 5) % 3; return r === 0 ? 'SUCCESS' : r === 1 ? 'PARTIAL_SUCCESS' : 'FAILURE'; } }
  };

  // ---------------------------------------------------------------------
  // CONTENT TEMPLATES (data-only, registered into the compiler by
  // registerSceneContent). Adding these required zero engine-code changes.
  // ---------------------------------------------------------------------
  const CONTENT_TEMPLATES = {
    heist: {
      id: 'heist', match: ['heist', 'theft', 'steal', 'crime'], minigame: 'escape',
      beats: ['establish', 'approach', 'action', 'reaction', 'escalation', 'outcome']
    },
    rescue: {
      id: 'rescue', match: ['rescue', 'hostage', 'action', 'fast'], minigame: 'escape',
      beats: ['establish', 'approach', 'action', 'reaction', 'outcome']
    },
    frame: {
      id: 'frame', match: ['frame', 'deception', 'crime'], minigame: 'search',
      beats: ['establish', 'approach', 'confrontation', 'reaction', 'outcome']
    }
  };

  // ---------------------------------------------------------------------
  // SAMPLE SCENES (§92 acceptance: data-only, validate + play with no engine code).
  // Each is a full scene definition the SceneLoader can load.
  // ---------------------------------------------------------------------
  const SCENES = {
    diner_incident: {
      id: 'diner_incident', location: 'diner', participants: ['player', 'marcus', 'bartender'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'diner' },
        { type: 'ENTER', actor: 'marcus' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to confront the target.", emotion: 'determined' },
        { type: 'REACTION', actor: 'marcus', expression: 'angry' },
        { type: 'DIALOGUE', actor: 'narrator', text: 'Then: the cops arrive.', emotion: 'shocked' },
        { type: 'CAMERA', preset: 'DRAMATIC', target: 'marcus' },
        { type: 'MINI_GAME', id: 'escape', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    street_chase: {
      id: 'street_chase', location: 'street', participants: ['player', 'rico'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'street' },
        { type: 'ENTER', actor: 'rico' },
        { type: 'ANIMATION', actor: 'rico', anim: 'ACTION' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to start a high-speed chase.", emotion: 'determined' },
        { type: 'MINI_GAME', id: 'escape', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    apartment_search: {
      id: 'apartment_search', location: 'apartment', participants: ['player', 'marcus'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'apartment' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to search the room.", emotion: 'determined' },
        { type: 'MINI_GAME', id: 'search', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    mayor_negotiation: {
      id: 'mayor_negotiation', location: 'office', participants: ['player', 'mayor'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'office' },
        { type: 'ENTER', actor: 'mayor' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to negotiate a deal.", emotion: 'determined' },
        { type: 'REACTION', actor: 'mayor', expression: 'confused' },
        { type: 'MINI_GAME', id: 'negotiation', difficulty: 'easy' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    station_interrogation: {
      id: 'station_interrogation', location: 'police_station', participants: ['player', 'police'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'police_station' },
        { type: 'ENTER', actor: 'police' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to interrogate for the truth.", emotion: 'determined' },
        { type: 'REACTION', actor: 'police', expression: 'angry' },
        { type: 'MINI_GAME', id: 'search', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },

    // ---- Expansion batch: more scenes across locations/templates (§105) ----
    office_heist: {
      id: 'office_heist', location: 'office', participants: ['player', 'mayor'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'office' },
        { type: 'ENTER', actor: 'mayor' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to pull off the heist.", emotion: 'determined' },
        { type: 'ANIMATION', actor: 'mayor', anim: 'ACTION' },
        { type: 'DIALOGUE', actor: 'narrator', text: 'Then: an explosion rocks the block.', emotion: 'shocked' },
        { type: 'CAMERA', preset: 'DRAMATIC', target: 'mayor' },
        { type: 'MINI_GAME', id: 'escape', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    apartment_rescue: {
      id: 'apartment_rescue', location: 'apartment', participants: ['player', 'marcus'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'apartment' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to rescue the hostage.", emotion: 'determined' },
        { type: 'ANIMATION', actor: 'marcus', anim: 'ACTION' },
        { type: 'MINI_GAME', id: 'escape', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    street_rally: {
      id: 'street_rally', location: 'street', participants: ['player', 'bartender'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'street' },
        { type: 'ENTER', actor: 'bartender' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to rally the neighborhood.", emotion: 'determined' },
        { type: 'REACTION', actor: 'bartender', expression: 'confused' },
        { type: 'DIALOGUE', actor: 'narrator', text: 'Then: an unexpected ally helps.', emotion: 'shocked' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    diner_spy: {
      id: 'diner_spy', location: 'diner', participants: ['player', 'informant'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'diner' },
        { type: 'ENTER', actor: 'informant' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to spy on the meeting.", emotion: 'determined' },
        { type: 'MINI_GAME', id: 'search', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    },
    station_frame: {
      id: 'station_frame', location: 'police_station', participants: ['player', 'cop_friend'],
      beats: [
        { type: 'ENTER', actor: 'player', location: 'police_station' },
        { type: 'ENTER', actor: 'cop_friend' },
        { type: 'DIALOGUE', actor: 'player', text: "Alright, I'm going to frame someone else.", emotion: 'determined' },
        { type: 'REACTION', actor: 'cop_friend', expression: 'angry' },
        { type: 'MINI_GAME', id: 'search', difficulty: 'medium' },
        { type: 'CONSEQUENCE', outcome: 'RESOLVED' },
        { type: 'END' }
      ]
    }
  };

  // Cards grouped by slot, for easy random-free selection in tests/demos.
  function cardsBySlot(slot) { return CARDS.filter(c => c.slot === slot); }

  /**
   * Wire this content library into an existing SceneMachine instance.
   * This is configuration, not engine logic — it only registers data.
   * @param {SceneMachine} sm
   */
  function registerSceneContent(sm) {
    if (!sm) return;
    // merge content-defined templates (data-only; no engine-code change)
    if (sm.compiler && sm.compiler.templates) {
      Object.assign(sm.compiler.templates, CONTENT_TEMPLATES);
    }
    // register sample scenes into the loader
    if (sm.loader) {
      Object.values(SCENES).forEach(s => sm.loader.register(s.id, s));
    }
    // register deterministic mini-game resolvers
    if (sm.runtime && sm.runtime.minigame) {
      Object.values(MINI_GAMES).forEach(mg => sm.runtime.minigame.register(mg.id, mg.resolve));
    }
    return sm;
  }

  return {
    CARDS, LOCATIONS, MINI_GAMES, SCENES, CONTENT_TEMPLATES,
    cardsBySlot, registerSceneContent
  };
});
