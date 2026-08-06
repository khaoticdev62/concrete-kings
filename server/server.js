const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const ROOT = path.resolve(__dirname, '..');
const rooms = new Map();
const matchmakingQueue = [];

setInterval(() => {
  if (matchmakingQueue.length === 0) return;
  const now = Date.now();
  const oldest = matchmakingQueue[0];
  if (now - oldest.joinedAt >= 15000) {
    const matchedCount = matchmakingQueue.length;
    const matched = matchmakingQueue.splice(0, matchedCount);
    
    const roomCode = `QP-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const room = { clients: new Set(), players: [], started: false, pointsToWin: 5 };
    
    const botCount = 4 - matchedCount;
    const botNames = ['O.G. Big Dave (Master Barber)', 'Stoop Homie', 'Bodega Clerk'];
    const botOrigins = ['BARBER', 'LOCAL_LEGEND', 'CORNER_MERCHANT'];
    for (let i = 0; i < botCount; i++) {
      room.players.push({
        name: botNames[i % botNames.length],
        origin: botOrigins[i % botOrigins.length],
        cityTheme: 'Harlem',
        x: 140,
        y: 124,
        points: 0,
        hand: [],
        ready: true
      });
    }
    
    rooms.set(roomCode, room);
    
    matched.forEach((item, index) => {
      if (item.ws.readyState === 1) {
        item.ws.send(JSON.stringify({
          type: 'match_found',
          roomCode,
          isHost: (index === 0),
          botCount
        }));
      }
    });
  }
}, 1000);


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
    const headers = { 'Content-Type': types[ext] || 'text/plain' };
    if (ext === '.html') headers['Cache-Control'] = 'no-store, no-cache';
    res.writeHead(200, headers);
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

    if (msg.type === 'list_rooms') {
      const list = [];
      rooms.forEach((room, code) => {
        if (!room.started && room.players.length > 0) {
          list.push({
            code: code,
            host: room.players[0].name,
            count: room.players.length,
            pointsToWin: room.pointsToWin || 7
          });
        }
      });
      ws.send(JSON.stringify({ type: 'rooms_list', rooms: list }));
      return;
    }

    if (msg.type === 'join_queue') {
      const existingIdx = matchmakingQueue.findIndex(item => item.ws === ws || item.playerName === msg.playerName);
      if (existingIdx !== -1) {
        matchmakingQueue.splice(existingIdx, 1);
      }
      
      matchmakingQueue.push({
        ws,
        playerName: msg.playerName,
        characterOrigin: msg.characterOrigin || 'BARBER',
        cityTheme: msg.cityTheme || 'Harlem',
        joinedAt: Date.now()
      });
      
      const statusMsg = JSON.stringify({
        type: 'queue_status',
        count: matchmakingQueue.length
      });
      matchmakingQueue.forEach(item => {
        if (item.ws.readyState === 1) item.ws.send(statusMsg);
      });
      
      if (matchmakingQueue.length >= 4) {
        const matched = matchmakingQueue.splice(0, 4);
        const roomCode = `QP-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const room = { clients: new Set(), players: [], started: false, pointsToWin: 5 };
        rooms.set(roomCode, room);
        
        matched.forEach((item, index) => {
          if (item.ws.readyState === 1) {
            item.ws.send(JSON.stringify({
              type: 'match_found',
              roomCode,
              isHost: (index === 0),
              botCount: 0
            }));
          }
        });
      }
      return;
    }

    if (msg.type === 'leave_queue') {
      const idx = matchmakingQueue.findIndex(item => item.ws === ws);
      if (idx !== -1) {
        matchmakingQueue.splice(idx, 1);
      }
      const statusMsg = JSON.stringify({
        type: 'queue_status',
        count: matchmakingQueue.length
      });
      matchmakingQueue.forEach(item => {
        if (item.ws.readyState === 1) item.ws.send(statusMsg);
      });
      return;
    }


    if (msg.type === 'join') {
      const { roomCode, playerName, characterOrigin, cityTheme } = msg;
      if (!roomCode || !playerName) return;
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, { clients: new Set(), players: [], started: false, pointsToWin: 7 });
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
        hand: [],
        ready: false
      });
      currentRoom = roomCode;
      broadcast(roomCode, { type:'system', text: `${playerName} (${ws.characterOrigin}) joined the room.` }, ws);
      ws.send(JSON.stringify({ 
        type:'joined', 
        roomCode, 
        playerName, 
        pointsToWin: room.pointsToWin,
        players: room.players.map(p => ({ name: p.name, origin: p.origin, cityTheme: p.cityTheme, x: p.x, y: p.y, ready: p.ready })) 
      }));
      broadcast(roomCode, { 
        type:'room_players', 
        players: room.players.map(p => ({ name: p.name, origin: p.origin, cityTheme: p.cityTheme, x: p.x, y: p.y, ready: p.ready })) 
      });
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

    if (msg.type === 'ready') {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      const player = room.players.find(p => p.name === ws.playerName);
      if (player) {
        player.ready = !!msg.ready;
      }
      broadcast(ws.roomCode, { 
        type:'room_players', 
        players: room.players.map(p => ({ name: p.name, origin: p.origin, cityTheme: p.cityTheme, x: p.x, y: p.y, ready: p.ready })) 
      });
      return;
    }

    if (msg.type === 'leave') {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      room.clients.delete(ws);
      room.players = room.players.filter(p => p.name !== ws.playerName);
      broadcast(ws.roomCode, { type:'system', text: `${ws.playerName} left.` });
      broadcast(ws.roomCode, { 
        type:'room_players', 
        players: room.players.map(p => ({ name: p.name, origin: p.origin, cityTheme: p.cityTheme, x: p.x, y: p.y, ready: p.ready })) 
      });
      return;
    }

    if (msg.type === 'settings') {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      if (room.players[0] && room.players[0].name === ws.playerName) {
        room.pointsToWin = parseInt(msg.pointsToWin, 10) || 7;
        broadcast(ws.roomCode, { type: 'settings', pointsToWin: room.pointsToWin });
      }
      return;
    }

    if (msg.type === 'start') {
      const room = rooms.get(ws.roomCode);
      if (!room || !room.players.length) return;
      room.started = true;
      broadcast(ws.roomCode, { type:'game_start', players: room.players.map(p=>p.name), host: ws.playerName, pointsToWin: room.pointsToWin });
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
      broadcast(ws.roomCode, { type:'submission', player: msg.player || ws.playerName, card: msg.card });
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
    const qIdx = matchmakingQueue.findIndex(item => item.ws === ws);
    if (qIdx !== -1) {
      matchmakingQueue.splice(qIdx, 1);
      const statusMsg = JSON.stringify({
        type: 'queue_status',
        count: matchmakingQueue.length
      });
      matchmakingQueue.forEach(item => {
        if (item.ws.readyState === 1) item.ws.send(statusMsg);
      });
    }

    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.clients.delete(ws);
    room.players = room.players.filter(p => p.name !== ws.playerName);
    broadcast(currentRoom, { type:'system', text: `${ws.playerName} left.` });
    broadcast(currentRoom, { 
      type:'room_players', 
      players: room.players.map(p => ({ name: p.name, origin: p.origin, cityTheme: p.cityTheme, x: p.x, y: p.y, ready: p.ready })) 
    });
  });
});

server.listen(PORT, () => {
  console.log(`Concrete Kings server running at http://localhost:${PORT}`);
});
