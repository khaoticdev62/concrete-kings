const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const ROOT = path.resolve(__dirname, '..');
const rooms = new Map();

function broadcast(roomCode, obj, excludeSocket=null) {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const ws of room.clients) {
    if (ws !== excludeSocket && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }
}

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  let filePath = path.join(ROOT, url);
  if (url.startsWith('/design-system/')) {
    filePath = path.join(ROOT, 'public', url);
  }
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const types = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const { roomCode, playerName, characterOrigin, cityTheme } = msg;
      if (!roomCode || !playerName) return;
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, { clients: new Set(), players: [], started: false });
      }
      const room = rooms.get(roomCode);
      if (room.started) return;
      ws.roomCode = roomCode;
      ws.playerName = playerName;
      ws.characterOrigin = characterOrigin || 'BARBER';
      ws.cityTheme = cityTheme || 'Harlem';
      room.clients.add(ws);
      room.players.push({ 
        name: playerName, 
        origin: ws.characterOrigin, 
        cityTheme: ws.cityTheme, 
        x: 140, 
        y: 124, 
        points: 0, 
        hand: [] 
      });
      currentRoom = roomCode;
      broadcast(roomCode, { type:'system', text: `${playerName} (${ws.characterOrigin}) joined the room.` }, ws);
      ws.send(JSON.stringify({ 
        type:'joined', 
        roomCode, 
        playerName, 
        players: room.players.map(p => ({ name: p.name, origin: p.origin, cityTheme: p.cityTheme, x: p.x, y: p.y })) 
      }));
      return;
    }

    if (msg.type === 'avatar_update') {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      const player = room.players.find(p => p.name === ws.playerName);
      if (player) {
        if (msg.x !== undefined) player.x = msg.x;
        if (msg.y !== undefined) player.y = msg.y;
        if (msg.origin) player.origin = msg.origin;
        if (msg.cityTheme) player.cityTheme = msg.cityTheme;
      }
      broadcast(ws.roomCode, {
        type: 'avatar_update',
        player: ws.playerName,
        origin: msg.origin || ws.characterOrigin,
        cityTheme: msg.cityTheme || ws.cityTheme,
        x: msg.x,
        y: msg.y,
        frame: msg.frame
      }, ws);
      return;
    }

    if (msg.type === 'chat') {
      const text = (msg.text || '').trim();
      if (!text) return;
      broadcast(ws.roomCode, { type:'chat', playerName: ws.playerName, text }, ws);
      return;
    }

    if (msg.type === 'leave') {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      room.clients.delete(ws);
      room.players = room.players.filter(p => p.name !== ws.playerName);
      broadcast(ws.roomCode, { type:'system', text: `${ws.playerName} left.` });
      return;
    }

    if (msg.type === 'start') {
      const room = rooms.get(ws.roomCode);
      if (!room || !room.players.length) return;
      room.started = true;
      broadcast(ws.roomCode, { type:'game_start', players: room.players.map(p=>p.name), host: ws.playerName });
      return;
    }

    if (msg.type === 'black') {
      broadcast(ws.roomCode, { type:'black', prompt: msg.prompt, hasDice: msg.hasDice });
      return;
    }

    if (msg.type === 'roll') {
      broadcast(ws.roomCode, { type:'roll', label: msg.label, prompt: msg.prompt });
      return;
    }

    if (msg.type === 'submission') {
      broadcast(ws.roomCode, { type:'submission', player: ws.playerName, card: msg.card });
      return;
    }

    if (msg.type === 'judge_phase') {
      broadcast(ws.roomCode, { type:'judge_phase' });
      return;
    }

    if (msg.type === 'winner') {
      const room = rooms.get(ws.roomCode);
      if (room) {
        const p = room.players.find(x => x.name === msg.player);
        if (p) p.points = (p.points || 0) + 1;
      }
      broadcast(ws.roomCode, { type:'winner', player: msg.player, card: msg.card });
      return;
    }
  });

  ws.on('close', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.clients.delete(ws);
    room.players = room.players.filter(p => p.name !== ws.playerName);
    broadcast(currentRoom, { type:'system', text: `${ws.playerName} left.` });
  });
});

server.listen(PORT, () => {
  console.log(`Concrete Kings server running at http://localhost:${PORT}`);
});
