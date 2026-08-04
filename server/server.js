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
      const { roomCode, playerName } = msg;
      if (!roomCode || !playerName) return;
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, { clients: new Set(), players: [], started: false });
      }
      const room = rooms.get(roomCode);
      if (room.started) return;
      ws.roomCode = roomCode;
      ws.playerName = playerName;
      room.clients.add(ws);
      room.players.push({ name: playerName, points: 0, hand: [] });
      currentRoom = roomCode;
      broadcast(roomCode, { type:'system', text: `${playerName} joined the room.` }, ws);
      ws.send(JSON.stringify({ type:'joined', roomCode, playerName, players: room.players.map(p=>p.name) }));
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
