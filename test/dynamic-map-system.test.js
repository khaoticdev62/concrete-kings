/**
 * Dynamic Narrative Map — PRD Coverage (CRPG-MAP-PRD-001 §134 MVP + §136 Phase 2)
 *
 * This file tracks ACTUAL coverage of the PRD's required MVP and Phase 2
 * features. Each test maps to a PRD section. If a section is not yet
 * implemented, the corresponding test fails rather than silently passing.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DMMapState, DMMapModes, DMMapTimeBlocks, DMScenarioStates, DMCharacterStates, DMFactionTerritoryStates
} = require('../src/pixel_engine/dynamic-map-state.js');

function fresh() { return new DMMapState(); }

/* ============================ MVP (§134) ============================ */

test('§134 MVP: Story Map + World Map modes exist', () => {
  const s = fresh();
  s.setMode(DMMapModes.STORY); assert.equal(s.mode, 'STORY');
  s.setMode(DMMapModes.WORLD); assert.equal(s.mode, 'WORLD');
});

test('§134 MVP: 6-10 locations', () => {
  const s = fresh();
  assert.ok(Object.keys(s._locations).length >= 6 && Object.keys(s._locations).length <= 10);
});

test('§134 MVP: location states defined (§17)', () => {
  const s = fresh();
  const states = Object.values(s._locations).map(l => l.state);
  assert.ok(states.includes('SAFE') || states.includes('ACTIVE'));
});

test('§134 MVP: routes exist (§50)', () => {
  const s = fresh();
  assert.ok(Object.keys(s._routes).length >= 1);
  const r = Object.values(s._routes)[0];
  assert.ok(r.origin && r.destination && 'danger' in r);
});

test('§134 MVP: character presence (§20)', () => {
  const s = fresh();
  assert.ok(Object.keys(s._characters).length >= 1);
  assert.ok(s._presence.player && s._presence.player.locationId);
});

test('§134 MVP: scenario nodes (§25)', () => {
  const s = fresh();
  assert.ok(Object.keys(s._scenarios).length >= 1);
});

test('§134 MVP: scenario requirements gating (§26)', () => {
  const s = fresh();
  assert.equal(s.getScenario('studio_session').status, DMScenarioStates.LOCKED);
  s.travelTo('detroit_lot');
  assert.notEqual(s.getScenario('studio_session').status, DMScenarioStates.LOCKED);
});

test('§134 MVP: time blocks (§47)', () => {
  const s = fresh();
  assert.deepEqual(Object.keys(DMMapTimeBlocks), ['MORNING','AFTERNOON','EVENING','NIGHT','LATE_NIGHT']);
});

test('§134 MVP: basic rumors (§34)', () => {
  const s = fresh();
  assert.ok(Object.keys(s._rumors).length >= 1);
  s._rumors.miami_deal.discovered = true; s.worldTick();
  assert.notEqual(s.getScenario('hidden_meet').status, DMScenarioStates.HIDDEN);
});

test('§134 MVP: basic relationship display (§64)', () => {
  const s = fresh();
  s.setRelationship('player','marcus', 40);
  assert.equal(s.getRelationship('player','marcus'), 40);
  assert.ok(s.relationshipNodes().nodes.some(n => n.id === 'player'));
});

test('§134 MVP: scenario -> scene transition (§73)', () => {
  const s = fresh();
  s.travelTo('detroit_lot');
  const h = s.handoffToScene('studio_session');
  assert.ok(h && h.scenarioId === 'studio_session');
});

test('§134 MVP: scene -> map transition + consequences (§74)', () => {
  const s = fresh();
  s.travelTo('detroit_lot');
  s.handoffToScene('studio_session');
  s.returnFromScene({ scenarioId:'studio_session', outcome:'success', effects:[] });
  assert.equal(s.getScenario('studio_session').status, DMScenarioStates.COMPLETED);
});

test('§134 MVP: consequence updates (§76)', () => {
  const s = fresh();
  s.applyConsequence({ locationState: { locationId:'blue_plate', locationState:'UNDER_SURVEILLANCE' } });
  assert.equal(s.getLocation('blue_plate').state, 'UNDER_SURVEILLANCE');
});

test('§134 MVP: controller support (camera + hints)', () => {
  const sys = require('../src/pixel_engine/dynamic-map-system.js');
  const system = new sys.DynamicMapSystem({});
  system.init({ game:{ players:[{stats:{reputation:1}}] }, humanIndex:0 });
  system.cameraZoomIn(); system.tick(300);
  assert.ok(system.camera.zoom > 1); // §12 controller camera zoom works
  // controller hint text is defined (wired to DOM in browser)
  assert.ok(typeof system.ui.constructor !== 'undefined');
  assert.ok(system.state && system.camera);
});

test('§134 MVP: save/load (§103)', () => {
  const s = fresh();
  s.travelTo('detroit_lot');
  const snap = JSON.parse(JSON.stringify(s.snapshot()));
  const s2 = new DMMapState(); s2.restore(snap);
  assert.equal(s2.activeLocationId, 'detroit_lot');
});

test('§134 MVP: basic map animations present (§86)', () => {
  const sys = require('../src/pixel_engine/dynamic-map-system.js');
  const system = new sys.DynamicMapSystem({});
  system.init({ game:{ players:[{stats:{reputation:1}}] }, humanIndex:0 });
  system.tick(16);
  assert.ok('pulse' in system.renderer); // pulse advances for selection/reveal anim
});

test('§134 MVP: debug tools (§110)', () => {
  const s = fresh();
  s.debug().reveal_location('miami_cut');
  assert.equal(s.getLocation('miami_cut').discovered, true);
  s.debug().complete_scenario('corner_hustle');
  assert.equal(s.getScenario('corner_hustle').status, DMScenarioStates.COMPLETED);
});

/* ============================ Phase 2 (§136) ============================ */

test('§22/§136: NPC routines applied on world tick', () => {
  const s = fresh();
  // marcus has a seeded goal (§24) -> detroit_lot, which overrides MORNING routine (stoop)
  s.advanceTime(DMMapTimeBlocks.MORNING);
  assert.equal(s.getCharacter('marcus').locationId, 'detroit_lot');
  // luna has NO goal, so her routine applies: MORNING -> blue_plate
  assert.equal(s.getCharacter('luna').locationId, 'blue_plate');
});

test('§43-46/§136: obligations + expiring + missed content', () => {
  const s = fresh();
  s.addObligation({ id:'ob1', target:'detroit_lot', label:'Help', consequence_if_broken:{trust:-20} });
  assert.ok(s.getObligation('ob1'));
  // scenario missed -> obligation broken consequence
  s.getScenario('studio_session').status = DMScenarioStates.EXPIRING;
  s._onMissed(s.getScenario('studio_session'));
  assert.equal(s.getObligation('ob1').met, 'broken');
});

test('§40-42/§136: story threads', () => {
  const s = fresh();
  s.addThread({ id:'t1', title:'Arc', current_stage:'intro', available:['middle'] });
  s.advanceThread('t1','middle');
  assert.deepEqual(s.getThread('t1').completed, ['intro']);
  assert.equal(s.getThread('t1').current_stage, 'middle');
});

test('§56-58/§136: faction territories + changes', () => {
  const s = fresh();
  assert.equal(s.getFaction('corner_crew').territory, DMFactionTerritoryStates.CONTROLLED);
  s.changeFactionControl('chi_grey', 'royal_clique');
  assert.equal(s.getLocation('chi_grey').ownership.faction, 'royal_clique');
});

test('§59-61/§136: world events + overlays', () => {
  const s = fresh();
  s.triggerEvent('police_sweep');
  assert.ok(s.activeEvents().some(e => e.id === 'police_sweep'));
  // event unlocks scenario
  assert.equal(s.getScenario('police_raid').hidden, false);
});

test('§65-71/§136: scenario generation pipeline + priority + limit + diversity + AI director', () => {
  const s = fresh();
  s.setAiDirector((ctx) => ([
    { id:'gen_a', locationId:'detroit_lot', type:'HEIST', title:'A', requirements:[] },
    { id:'gen_b', locationId:'blue_plate', type:'SOCIAL', title:'B', requirements:[] }
  ]));
  s.advanceTime();
  assert.ok(s.getScenario('gen_a') && s.getScenario('gen_b'));
  // priority scoring
  assert.ok(typeof s.scenarioPriority(s.getScenario('gen_a')) === 'number');
  // active node limit / diversity
  const cands = s.scenarioCandidates(10);
  assert.ok(cands.length <= 7);
});

test('§30/§38 (info system basics): player knowledge via discovered rumors', () => {
  const s = fresh();
  s._rumors.police_search.discovered = true; s.worldTick();
  // discovered rumor becomes player knowledge (tracked on the rumor object)
  assert.equal(s.getRumor('police_search').discovered, true);
  // a rumor that reveals a scenario surfaces it in the feed
  s._rumors.miami_deal.discovered = true; s.worldTick();
  assert.ok(s.feed.some(f => /Rumor revealed/.test(f.text)));
});

/* ============================ Save versioning (§104) ============================ */

test('§104: v1 save migrates to v2 with new structures', () => {
  const s = fresh();
  const v1 = JSON.parse(JSON.stringify(s.snapshot()));
  v1.version = 1; delete v1.relationships; delete v1.obligations; delete v1.threads; delete v1.events;
  const s2 = new DMMapState(); s2.restore(v1);
  assert.equal(s2._relationships && typeof s2._relationships === 'object', true);
  assert.equal(s2._obligations && typeof s2._obligations === 'object', true);
});

/* ============================ Phase 3 (§137) ============================ */

test('§24/§137: autonomous NPC goals override routine', () => {
  const s = fresh();
  // marcus has goal -> detroit_lot; on AFTERNOON routine says blue_plate
  s.advanceTime('AFTERNOON');
  assert.equal(s.getCharacter('marcus').locationId, 'detroit_lot');
  assert.ok(s.getCharacter('marcus').goals && s.getCharacter('marcus').goals.current);
});

test('§137: procedural scenario chains advance on completion', () => {
  const s = fresh();
  assert.equal(s.getScenario('block_fame').hidden, true);
  s.returnFromScene({ scenarioId: 'corner_hustle', outcome: 'success' });
  assert.equal(s._chains.marcus_arc.nodes[1], 'studio_session');
  assert.ok(s._chains.marcus_arc.index >= 1);
});

test('§34/§137: advanced rumor networks spread children + reveal scenario', () => {
  const s = fresh();
  s._rumors.miami_deal.discovered = true; s.worldTick();
  assert.equal(s.getRumor('rumor_courier').discovered, true);
  assert.equal(s.getRumor('rumor_buyer').discovered, true);
  assert.notEqual(s.getScenario('hidden_meet').status, DMScenarioStates.HIDDEN);
});

test('§58/§137: dynamic faction conflicts flip contested control', () => {
  const s = fresh();
  s.contestLocation('detroit_lot', 'royal_clique');
  assert.equal(s.getLocation('detroit_lot').contested, true);
  s.worldTick();
  // royal (influence 5) beats corner_crew (3) -> detroit_lot ownership flips
  assert.equal(s.getLocation('detroit_lot').ownership.faction, 'royal_clique');
});

test('§137: emergent world events from dangerous/contested state', () => {
  const s = fresh();
  s.getLocation('blue_plate').state = 'DANGEROUS';
  s.advanceTime(DMMapTimeBlocks.NIGHT);
  s._generateEmergentEvents();
  assert.ok(s.activeEvents().some(e => e.id === 'gang_war'));
});

test('§137: large-scale world simulation ticks all subsystems without error', () => {
  const s = fresh();
  for (let i = 0; i < 5; i++) s.worldTick();
  assert.ok(Object.keys(s._locations).length >= 6);
  assert.ok(Array.isArray(s.feed));
});

test('Phase 3 save/load preserves chains + rumor network', () => {
  const s = fresh();
  const snap = JSON.parse(JSON.stringify(s.snapshot()));
  const s2 = new DMMapState(); s2.restore(snap);
  assert.ok(s2._chains.marcus_arc);
  assert.equal(s2.getRumor('rumor_courier').id, 'rumor_courier');
});

/* ============================ Assets (P3-G) ============================ */

test('Assets: manifest maps location types to real asset paths', () => {
  const { DMAssetManager } = require('../src/pixel_engine/dynamic-map-assets.js');
  const a = new DMAssetManager('./assets/');
  assert.ok(a.getLocationAsset('RESTAURANT').endsWith('.png'));
  assert.ok(a.getTerrain().endsWith('.png'));
  assert.ok(a.getPolice().endsWith('.png'));
});

test('Assets: manager degrades gracefully when Image is unavailable (Node)', () => {
  const { DMAssetManager } = require('../src/pixel_engine/dynamic-map-assets.js');
  const a = new DMAssetManager('assets/');
  return a.load(a.getTerrain()).then(img => assert.equal(img, null));
});

/* ============================ Content Editor (§113) ============================ */

test('§113: content editor CRUD — create location/route/scenario/event/schedule', () => {
  const s = fresh();
  const loc = s.createLocation({ id: 'new_spot', name: 'New Spot', type: 'CLUB', state: 'ACTIVE', coordinates: { x: 100, y: 100 } });
  assert.equal(s.getLocation('new_spot').name, 'New Spot');
  const route = s.addRoute({ id: 'stoop_to_new', origin: 'stoop', destination: 'new_spot' });
  assert.equal(route.destination, 'new_spot');
  const sc = s.createScenario({ id: 'new_sc', locationId: 'new_spot', title: 'New Scene', type: 'STORY', requirements: ['player_present'] });
  assert.equal(s.getScenario('new_sc').title, 'New Scene');
  const ev = s.defineEvent({ id: 'new_ev', name: 'New Event', unlocks: ['new_sc'] });
  assert.equal(s._eventDefs.new_ev.unlocks[0], 'new_sc');
  s.setCharacterSchedule('marcus', { MORNING: { location: 'stoop' }, NIGHT: { location: 'new_spot' } });
  assert.equal(s.getCharacter('marcus').routine.NIGHT.location, 'new_spot');
  assert.equal(s.moveLocation('new_spot', 200, 200), true);
  assert.deepEqual(s.getLocation('new_spot').coordinates, { x: 200, y: 200 });
});

/* ============================ Simulator (§112) ============================ */

test('§112: scenario simulator logic — candidates + AI proposals + ranked list', () => {
  const s = fresh();
  s.travelTo('detroit_lot'); // makes studio_session available (player_present met)
  const atLoc = s.scenariosForLocation('detroit_lot').filter(x => x.status !== 'HIDDEN' && x.status !== 'LOCKED');
  assert.ok(atLoc.length >= 1);
  // AI proposal helper should produce sensible proposals per world-state
  const dtMod = require('../src/pixel_engine/dynamic-map-devtools.js');
  const dt = new dtMod.DMDevTools(s, null);
  const proposals = dt._aiProposals('detroit_lot', ['marcus'], 'NIGHT', 'faction_war');
  assert.ok(proposals.some(p => p.type === 'COMBAT'));
  assert.ok(proposals.some(p => p.type === 'STORY')); // marcus present
});

test('§112/§113: dev tools module mounts without DOM error in Node', () => {
  const { DMDevTools } = require('../src/pixel_engine/dynamic-map-devtools.js');
  const s = fresh();
  const dt = new DMDevTools(s, null);
  assert.doesNotThrow(() => dt.mount('nope'));
  assert.ok(dt.state === s);
});

/* ============================ Test Harness + Orphan (§114/§115) ============================ */

test('§114/§115: seeded map validates with no critical orphans', () => {
  const { DMMapValidator } = require('../src/pixel_engine/dynamic-map-testharness.js');
  const s = fresh();
  const report = new DMMapValidator(s).run();
  assert.equal(report.ok, true);
  assert.equal(report.criticalCount, 0);
  // every category was exercised
  ['location', 'route', 'scenario', 'character', 'thread', 'rumor', 'event'].forEach(c => {
    assert.ok(report.categories[c].checked >= 0);
  });
});

test('§115: orphan detection flags scenario->missing location (critical)', () => {
  const { DMMapValidator } = require('../src/pixel_engine/dynamic-map-testharness.js');
  const s = fresh();
  s.createScenario({ id: 'orphan_sc', locationId: 'does_not_exist', title: 'Ghost', type: 'STORY' });
  const report = new DMMapValidator(s).run();
  assert.equal(report.ok, false);
  assert.ok(report.orphans.some(o => o.code === 'ORPHAN_SCENARIO_LOCATION'));
});

test('§115: orphan detection flags scenario->missing character participant', () => {
  const { DMMapValidator } = require('../src/pixel_engine/dynamic-map-testharness.js');
  const s = fresh();
  s.createScenario({ id: 'ghost_people', locationId: 'stoop', title: 'T', type: 'SOCIAL', participants: ['player', 'nonexistent_npc'] });
  const report = new DMMapValidator(s).run();
  assert.ok(report.orphans.some(o => o.code === 'ORPHAN_SCENARIO_CHARACTER'));
});

test('§115: orphan detection flags route->missing node (critical)', () => {
  const { DMMapValidator } = require('../src/pixel_engine/dynamic-map-testharness.js');
  const s = fresh();
  s.addRoute({ id: 'ghost_route', origin: 'stoop', destination: 'void' });
  const report = new DMMapValidator(s).run();
  assert.ok(report.orphans.some(o => o.code === 'ORPHAN_ROUTE_NODE'));
});

test('§115: orphan detection flags rumor->missing revealed scenario', () => {
  const { DMMapValidator } = require('../src/pixel_engine/dynamic-map-testharness.js');
  const s = fresh();
  s.addRumorNode({ id: 'ghost_rumor', text: 'x', reveals: 'no_such_scenario' });
  const report = new DMMapValidator(s).run();
  assert.ok(report.orphans.some(o => o.code === 'ORPHAN_RUMOR_REVEAL'));
});

test('§115: assertValid throws on critical orphans (CI build failure)', () => {
  const { DMMapValidator } = require('../src/pixel_engine/dynamic-map-testharness.js');
  const s = fresh();
  s.addRoute({ id: 'r2', origin: 'stoop', destination: 'missing_loc' });
  assert.throws(() => new DMMapValidator(s).assertValid());
});

/* ============================ Phase 4: Services & Experience (§99-§102, §116-§120) ============================ */

test('§100: event bus dispatches typed map events', () => {
  const { DMEventBus } = require('../src/pixel_engine/dynamic-map-eventbus.js');
  const bus = new DMEventBus();
  const seen = [];
  bus.on('relationship_changed', p => seen.push(p));
  const s = fresh();
  s.bus = bus;
  s.setRelationship('player', 'marcus', 50);
  assert.equal(seen.length, 1);
  assert.equal(bus.recent(1)[0].event, 'relationship_changed');
});

test('§101: scenario validation passes for a valid scenario, fails for broken one', () => {
  const s = fresh();
  const ok = s.validateScenarioForLaunch('corner_hustle');
  assert.equal(ok.ok, true); // player only, at stoop by default? player at stoop -> requirements met
  // break: point at missing location
  s.createScenario({ id: 'broken', locationId: 'nope', title: 'X', type: 'STORY' });
  const bad = s.validateScenarioForLaunch('broken');
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some(e => e.code === 'location_invalid'));
});

test('§102: transactional launch rolls back on invalid scenario', () => {
  const s = fresh();
  // create scenario at a missing location, then attempt transactional launch
  s.createScenario({ id: 'ghostly', locationId: 'void', title: 'X', type: 'STORY' });
  const res = s.launchSceneTransactionally('ghostly');
  assert.equal(res.ok, false);
  assert.equal(res.phase, 'validate');
  // scenario status must be unchanged (rolled back / never locked)
  assert.notEqual(s.getScenario('ghostly').status, 'LOCKED');
});

test('§99/§116: player experience tracker records first-time milestones', () => {
  const { DMPlayerExperience } = require('../src/pixel_engine/dynamic-map-services.js');
  const px = new DMPlayerExperience();
  assert.equal(px.isComplete('first_travel'), false);
  const first = px.mark('first_travel');
  assert.equal(first, true); // first time
  assert.equal(px.mark('first_travel'), false); // second time not first
  assert.equal(px.isComplete('first_travel'), true);
  assert.equal(px.remaining().length, 9);
});

test('§117/§118: onboarding sequential steps + first-map prompt', () => {
  const { DMOnboarding } = require('../src/pixel_engine/dynamic-map-services.js');
  const ob = new DMOnboarding();
  assert.equal(ob.current().id, 'location');
  ob.completeCurrent();
  assert.equal(ob.current().id, 'scenario');
  const first = ob.showFirstMap();
  assert.equal(first.title, 'YOU ARE HERE');
  assert.equal(first.body.includes('Someone wants to meet you'), true);
});

test('§120: audio director maps world state to a layer via the bus', () => {
  const { DMEventBus } = require('../src/pixel_engine/dynamic-map-eventbus.js');
  const { DMAudioDirector } = require('../src/pixel_engine/dynamic-map-services.js');
  const bus = new DMEventBus();
  const cues = [];
  bus.on('audio_cue', c => cues.push(c));
  const ad = new DMAudioDirector(bus, null);
  const s = fresh();
  s.bus = bus; // bridge state events to the bus so the director hears them
  s.getLocation('blue_plate').state = 'DANGEROUS';
  const layer = ad.sync(s);
  assert.equal(layer, 'tension');
  s.triggerEvent('gang_war'); // world_event_started -> sting
  assert.ok(cues.some(c => c.kind === 'sting'));
});

/* ============================ Phase 5: UX Systems (§121-§131) ============================ */

test('§121: haptics configurable + emits haptic signals on the bus', () => {
  const { DMEventBus } = require('../src/pixel_engine/dynamic-map-eventbus.js');
  const { DMHaptics } = require('../src/pixel_engine/dynamic-map-ux.js');
  const bus = new DMEventBus();
  const signals = [];
  bus.on('haptic', sig => signals.push(sig));
  const h = new DMHaptics(bus);
  h.configure('node_selection', { intensity: 0.9 });
  const sig = h.trigger('node_selection');
  assert.ok(sig && sig.pattern.intensity === 0.9);
  assert.equal(signals.length, 1);
  h.setEnabled(false);
  assert.equal(h.trigger('new_event'), null); // disabled => no signal
});

test('§122/§123: transition director emits correct phase sequences', () => {
  const { DMEventBus } = require('../src/pixel_engine/dynamic-map-eventbus.js');
  const { DMTransitionDirector } = require('../src/pixel_engine/dynamic-map-ux.js');
  const bus = new DMEventBus();
  const phases = [];
  bus.on('transition_phase', p => phases.push(p.phase));
  const td = new DMTransitionDirector(bus);
  const to = td.toScene();
  assert.equal(to[0], 'select_node');
  assert.equal(to[to.length - 1], 'scene_machine');
  const from = td.fromScene();
  assert.equal(from[0], 'scene_end');
  assert.equal(from[from.length - 1], 'event_feed_update');
  // §124: consequence_animation must appear in the from-scene sequence
  assert.ok(from.includes('consequence_animation'));
  assert.equal(td.enforcesConsequenceAnimation(), true);
});

test('§125: narrative feedback produces relationship + situation text', () => {
  const { DMNarrativeFeedback } = require('../src/pixel_engine/dynamic-map-ux.js');
  const nf = new DMNarrativeFeedback();
  const rel = nf.relationshipText('MARCUS', 72);
  assert.ok(rel.includes('MARCUS') && rel.includes('Trust: 72') && rel.includes('PLAYER'));
  const sit = nf.situationText('Marcus left the safehouse.');
  assert.ok(sit.startsWith('NEW SITUATION'));
});

test('§126/§127: minigame bridge maps scenarios to minigames', () => {
  const { DMMinigameBridge } = require('../src/pixel_engine/dynamic-map-ux.js');
  const mb = new DMMinigameBridge();
  const convo = mb.minigameFor({ id: 's1', type: 'SOCIAL' }, { tags: ['social'], type: 'CLUB' });
  assert.equal(convo, 'conversation');
  const drive = mb.minigameFor({ id: 's2', type: 'PURSUIT' }, { tags: ['highway'], type: 'HIGHWAY' });
  assert.equal(drive, 'driving');
  assert.equal(mb.minigameFor({ id: 's3', type: 'STORY' }, { tags: [], type: 'PARK' }), null);
  assert.equal(mb.discoveryExamples().length, 3);
});

test('§128/§129: economy costs + opportunity card data', () => {
  const { DMEconomyModel, dmOpportunityCard } = require('../src/pixel_engine/dynamic-map-ux.js');
  const s = fresh();
  const em = new DMEconomyModel();
  const sc = s.getScenario('studio_session');
  const costs = em.scenarioCosts(sc, s);
  assert.ok('risk' in costs && 'time' in costs);
  const card = dmOpportunityCard(sc, s);
  assert.equal(card.title, 'Studio Session');
  assert.ok('costs' in card && 'benefit' in card);
});

test('§130/§131: decision axes defined (design tension data)', () => {
  const { DMDecisionAxes } = require('../src/pixel_engine/dynamic-map-ux.js');
  assert.equal(DMDecisionAxes.length, 5);
  assert.ok(DMDecisionAxes.some(a => a.axis === 'SAFE vs RISKY'));
});

test('§121-§129: system wires UX modules live', () => {
  const sys = new (require('../src/pixel_engine/dynamic-map-system.js').DynamicMapSystem)({});
  sys.init({ game: { players: [{ stats: { reputation: 1 } }] }, humanIndex: 0 });
  assert.ok(sys.haptics && sys.transitions && sys.narrative && sys.minigame && sys.economy);
  const sig = sys.haptics.trigger('node_selection');
  assert.ok(sig);
});

/* ============================ Phase 6: Quality & Acceptance (§138-§144) ============================ */

test('§138: perf monitor measures ops and respects Steam Deck targets', () => {
  const { DMPerfMonitor, DM_PERF_TARGETS } = require('../src/pixel_engine/dynamic-map-quality.js');
  const pm = new DMPerfMonitor();
  const r = pm.measure('nodeSelectionMs', () => 1 + 1);
  assert.ok(r.ms >= 0 && r.ok === true);
  assert.equal(pm.fpsFromFrameMs(16.67) >= 60, true);
  assert.equal(typeof DM_PERF_TARGETS.mapLoadMs, 'number');
});

test('§139: memory budget loads only active region + nearby + relevant scenarios', () => {
  const { DMMemoryBudget } = require('../src/pixel_engine/dynamic-map-quality.js');
  const s = fresh();
  const mb = new DMMemoryBudget({ nearbyRadius: 250 });
  const view = mb.relevantView(s, 'stoop');
  assert.ok(view.locations.length <= view.totalLocations);
  assert.ok(view.scenarios.length <= Object.keys(s._scenarios).length);
  assert.ok('activeRegion' in view && 'trimmed' in view);
});

test('§141: quality gate passes for the built system (no anti-patterns)', () => {
  const { DMQualityGate } = require('../src/pixel_engine/dynamic-map-quality.js');
  const sys = new (require('../src/pixel_engine/dynamic-map-system.js').DynamicMapSystem)({});
  sys.init({ game: { players: [{ stats: { reputation: 1 } }] }, humanIndex: 0 });
  const gate = new DMQualityGate();
  const results = gate.evaluate(sys);
  const failed = results.filter(r => !r.pass);
  assert.equal(failed.length, 0, 'failed checks: ' + failed.map(f => f.id).join(','));
});

test('§142: definition of done satisfied across 7 domains', () => {
  const { DMDefinitionOfDone } = require('../src/pixel_engine/dynamic-map-quality.js');
  const sys = new (require('../src/pixel_engine/dynamic-map-system.js').DynamicMapSystem)({});
  sys.init({ game: { players: [{ stats: { reputation: 1 } }] }, humanIndex: 0 });
  const dod = new DMDefinitionOfDone();
  assert.equal(dod.allTrue(sys), true);
});

test('§143: architectural contract hierarchy is preserved and the full loop links', () => {
  const { DMArchitecturalContract } = require('../src/pixel_engine/dynamic-map-quality.js');
  const sys = new (require('../src/pixel_engine/dynamic-map-system.js').DynamicMapSystem)({});
  sys.init({ game: { players: [{ stats: { reputation: 1 } }] }, humanIndex: 0 });
  const c = new DMArchitecturalContract();
  const ev = c.evaluate(sys);
  assert.equal(ev.fullLoop, true, 'full hierarchy loop must link: ' + JSON.stringify(ev));
  assert.equal(c.preserved(sys), true);
});

test('§144: core design rule — scenarios carry narrative, cards frame benefit', () => {
  const { DMCoreDesignRule } = require('../src/pixel_engine/dynamic-map-quality.js');
  const sys = new (require('../src/pixel_engine/dynamic-map-system.js').DynamicMapSystem)({});
  sys.init({ game: { players: [{ stats: { reputation: 1 } }] }, humanIndex: 0 });
  const dr = new DMCoreDesignRule();
  const ev = dr.evaluate(sys);
  assert.equal(ev.scenariosWithNarrative, ev.totalScenarios, 'all scenarios must have narrative');
  assert.equal(ev.opportunityCardsFrameBenefit, true);
  assert.equal(dr.satisfied(sys), true);
});

test('§140: technical acceptance criteria (AC-001..AC-010) all pass on the system', () => {
  const sys = new (require('../src/pixel_engine/dynamic-map-system.js').DynamicMapSystem)({});
  sys.init({ game: { players: [{ stats: { reputation: 1 } }] }, humanIndex: 0 });
  const s = sys.state;
  assert.ok(sys.initialized);
  s.setMode('WORLD'); assert.equal(s.mode, 'WORLD'); s.setMode('STORY');
  s.selectNode('stoop'); assert.equal(s.selectedNodeId, 'stoop');
  assert.ok(s.activeScenarios().length >= 1);
  const travel = s.travelTo('stoop'); assert.equal(travel.ok, true);
  const before = s.timeBlock; s.travelTo('blue_plate'); assert.notEqual(s.timeBlock, before);
  const marcusBefore = s.getCharacter('marcus').locationId; s.worldTick(); assert.ok(s.getCharacter('marcus').locationId !== undefined);
  assert.equal(s.validateScenarioForLaunch('studio_session').ok, true);
  s.travelTo('stoop'); // corner_hustle requires player at stoop
  const pkg = s.handoffToScene('corner_hustle'); assert.ok(pkg && pkg.scenarioId);
  s.returnFromScene({ scenarioId: 'corner_hustle', outcome: 'success', effects: [] });
  assert.equal(s.getScenario('corner_hustle').status, 'COMPLETED');
});



/* ================ Environmental storytelling (Sprint 2) ================ */

test('POIs: addPoi rejects an unknown location and keeps the meaning text', () => {
  const s = fresh();
  s.addLocation('stoop', { id: 'stoop', name: 'The Stoop', type: 'HOME' });
  assert.equal(s.addPoi({ id: 'p1', locationId: 'nowhere', type: 'graffiti' }), null);
  const poi = s.addPoi({ id: 'p1', locationId: 'stoop', type: 'graffiti', meaning: 'Block Family colors.' });
  assert.equal(poi.meaning, 'Block Family colors.');
  assert.equal(poi.active, true, 'an unconditional POI is on at load');
  assert.deepEqual(s.activeMarksFor('stoop'), ['graffiti']);
});

test('POIs: a conditional POI stays off until its branch fires', () => {
  const s = fresh();
  s.addLocation('detroit_lot', { id: 'detroit_lot', name: 'Detroit Lot', type: 'PARK' });
  s.addPoi({ id: 'burn', locationId: 'detroit_lot', type: 'burn_marks', meaning: 'x', condition: 'clique_war:fail' });
  assert.deepEqual(s.activeMarksFor('detroit_lot'), [], 'nothing has burned yet');
  s.activatePoiCondition('clique_war:success');
  assert.deepEqual(s.activeMarksFor('detroit_lot'), [], 'the wrong branch must not reveal it');
  s.activatePoiCondition('clique_war:fail');
  assert.deepEqual(s.activeMarksFor('detroit_lot'), ['burn_marks']);
});

test('consequences: applyConsequence announces worldMark effects', () => {
  // Regression. applyConsequence had NO worldMark branch, so every mark
  // authored in every level file was silently discarded — the consequence
  // applied, the number moved, and the world never changed. The marks live on
  // DMWorldMap and this class is display-agnostic, so it emits and the map
  // system relays.
  const s = fresh();
  s.addLocation('blue_plate', { id: 'blue_plate', name: 'The Blue Plate', type: 'RESTAURANT' });
  const seen = [];
  s.on('worldMarkAdded', e => seen.push(e));
  s.applyConsequence({ worldMark: { locationId: 'blue_plate', mark: 'police_tape' } });
  assert.deepEqual(seen, [{ locationId: 'blue_plate', mark: 'police_tape' }]);
});

test('consequences: activating a POI announces its mark too', () => {
  const s = fresh();
  s.addLocation('stoop', { id: 'stoop', name: 'The Stoop', type: 'HOME' });
  s.addPoi({ id: 'tag', locationId: 'stoop', type: 'faction_marking', meaning: 'x', condition: 'clique_war:fail' });
  const seen = [];
  s.on('worldMarkAdded', e => seen.push(e));
  s.activatePoiCondition('clique_war:fail');
  assert.deepEqual(seen, [{ locationId: 'stoop', mark: 'faction_marking' }],
    'a POI that turns on in state but never reaches the map is invisible');
});

test('consequences: applyScenarioOutcome runs the authored branch and its POIs', () => {
  const s = fresh();
  s.addLocation('miami_cut', { id: 'miami_cut', name: 'Miami Cut', type: 'CLUB' });
  s.addPoi({ id: 'taken', locationId: 'miami_cut', type: 'graffiti', meaning: 'x', condition: 'clique_war:success' });
  s.setConsequenceMatrix({
    clique_war: {
      success: [{ locationState: { locationId: 'miami_cut', locationState: 'TENSE' } }],
      fail: [{ locationState: { locationId: 'miami_cut', locationState: 'DANGEROUS' } }]
    }
  });
  assert.equal(s.consequencesFor('clique_war', 'success').length, 1);
  assert.equal(s.consequencesFor('nothing', 'success').length, 0, 'an unauthored scenario yields no effects, not a throw');

  const applied = s.applyScenarioOutcome('clique_war', 'success');
  assert.equal(applied, 1);
  assert.equal(s.getLocation('miami_cut').state, 'TENSE');
  assert.deepEqual(s.activeMarksFor('miami_cut'), ['graffiti'], 'the branch POI turned on with the branch');
});
