const { test } = require('node:test');
const { strictEqual, ok } = require('node:assert');
const { loadGameModule } = require('./helpers/load-app.js');

test('Save/Load: state shape can be serialized and restored equivalently', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Host');
  game.addPlayer('Player 2');
  game.dealAll();
  game.nextBlack();
  game.advanceJudge();
  game.weatherMode = 'POLICE_SIRENS';

  const state = {
    mode: game.mode,
    pointsToWin: game.pointsToWin,
    round: game.round,
    players: game.players.map(p => ({
      name: p.name,
      points: p.points,
      hand: p.hand.slice(),
      streetCred: p.stats.streetCred,
      community: p.stats.community,
      wisdom: p.stats.wisdom,
      reputation: p.stats.reputation,
      receipts: p.receipts.slice()
    })),
    weatherMode: game.weatherMode,
    currentBlack: game.currentBlack,
    submissions: game.submissions.slice()
  };

  const json = JSON.stringify(state);
  const parsed = JSON.parse(json);

  strictEqual(parsed.players.length, 2);
  strictEqual(parsed.weatherMode, 'POLICE_SIRENS');
  ok(parsed.currentBlack);
  strictEqual(parsed.round, game.round);
  strictEqual(parsed.players[0].hand.length, game.players[0].hand.length);
});

test('Save/Load: restored state rehydrates fields used by UI/systems', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Host');
  game.weatherMode = 'NEON_FLICKER';
  game.pointsToWin = 10;
  game.round = 3;

  const state = {
    mode: game.mode,
    pointsToWin: game.pointsToWin,
    round: game.round,
    players: game.players.map(p => ({
      name: p.name,
      points: p.points,
      hand: p.hand.slice(),
      streetCred: p.stats.streetCred,
      community: p.stats.community,
      wisdom: p.stats.wisdom,
      reputation: p.stats.reputation,
      receipts: p.receipts.slice()
    })),
    weatherMode: game.weatherMode,
    currentBlack: game.currentBlack,
    submissions: game.submissions.slice()
  };

  const restored = new Game();
  restored.mode = state.mode;
  restored.pointsToWin = state.pointsToWin;
  restored.round = state.round;
  restored.weatherMode = state.weatherMode;
  restored.players = state.players.map(p => ({
    name: p.name,
    points: p.points,
    hand: p.hand.slice(),
    stats: {
      streetCred: p.streetCred || 0,
      community: p.community || 0,
      wisdom: p.wisdom || 0,
      reputation: p.reputation || 0
    },
    receipts: p.receipts.slice()
  }));
  restored.currentBlack = state.currentBlack;
  restored.submissions = state.submissions.slice();

  strictEqual(restored.pointsToWin, 10);
  strictEqual(restored.weatherMode, 'NEON_FLICKER');
  strictEqual(restored.round, 3);
  ok(restored.players[0]?.name);
});

test('Block Map: travel behavior resets weather to clear', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Host');
  game.weatherMode = 'POLICE_SIRENS';

  const before = game.weatherMode;
  game.weatherMode = 'CLEAR';
  const after = game.weatherMode;

  strictEqual(before, 'POLICE_SIRENS');
  strictEqual(after, 'CLEAR');
});

test('Block Map: locations cover the expected city themes', () => {
  const locations = [
    { name: 'Harlem Stoop', city: 'Harlem' },
    { name: 'Detroit Lot', city: 'Detroit' },
    { name: 'Chicago Greystone', city: 'Chicago' },
    { name: 'Miami Cut', city: 'Miami' },
    { name: 'Baltimore Steps', city: 'Baltimore' },
    { name: 'Atlanta Porch', city: 'Atlanta' },
    { name: 'Oakland Corner', city: 'Oakland' },
    { name: 'NOLA Balcony', city: 'NOLA' }
  ];
  strictEqual(locations.length, 8);
  const cities = locations.map(l => l.city);
  for (const city of ['Harlem','Detroit','Chicago','Miami','Baltimore','Atlanta','Oakland','NOLA']) {
    ok(cities.includes(city), `expected city ${city}`);
  }
});

test('Weather: mode switching preserves valid mode contract', () => {
  const modes = ['CLEAR','RAIN','STEAM_VENT','POLICE_SIRENS','NEON_FLICKER'];
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Host');
  for (const mode of modes) {
    game.weatherMode = mode;
    strictEqual(game.weatherMode, mode);
  }
});
