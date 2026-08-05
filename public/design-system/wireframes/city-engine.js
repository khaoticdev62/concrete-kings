// Shared living-city background + weather/event/audio engine, reused across all Concrete Kings screens.
export class CityEngine {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.theme = opts.theme || 'harlem';
    this.weather = opts.weather || 'clear';
    this.quality = opts.quality || 'high';
    this.rm = opts.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.eventType = null;
    this.ctx = canvas.getContext('2d');
    this.rain = []; this.snow = []; this.debris = []; this.evtP = []; this.lastT = null;
    this.ro = new ResizeObserver(() => this._resize());
    this.ro.observe(canvas.parentElement || canvas);
    this._resize();
    const loop = (now) => { this.raf = requestAnimationFrame(loop); this._draw(this.rm ? 0 : now / 1000); };
    this.raf = requestAnimationFrame(loop);
  }
  _resize() {
    const d = devicePixelRatio || 1, el = this.cv.parentElement || this.cv;
    this.cv.width = Math.max(1, el.clientWidth || window.innerWidth) * d;
    this.cv.height = Math.max(1, el.clientHeight || window.innerHeight) * d;
    this.dpr = d;
  }
  setTheme(k) { this.theme = k; }
  setWeather(k) { this.weather = k; }
  setQuality(q) { this.quality = q; }
  setReducedMotion(b) { this.rm = b; }
  triggerEvent(k, durMs) { this.eventType = k; clearTimeout(this._evtTm); this._evtTm = setTimeout(() => { this.eventType = null; }, durMs || 6000); }
  destroy() { cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); clearTimeout(this._evtTm); }
  qMul() { return { low: .15, medium: .5, high: 1, ultra: 1.4 }[this.quality] || 1; }
  rnd(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  themeDef(k) {
    return {
      harlem: { fill: '#4a2c22', fill2: '#3d241c', win: '#f7c948' },
      detroit: { fill: '#3a352e', fill2: '#2e2a24', win: '#ffb74d' },
      chicago: { fill: '#41332a', fill2: '#332a24', win: '#ffe082' },
      miami: { fill: '#f8bbd0', fill2: '#b2dfdb', win: '#fff9c4' },
      baltimore: { fill: '#4a3226', fill2: '#41372c', win: '#ffd54f' },
      atlanta: { fill: '#453528', fill2: '#38302a', win: '#ffe082' },
      oakland: { fill: '#4e3b4a', fill2: '#3c3040', win: '#ffcc80' },
      nola: { fill: '#43552e', fill2: '#4a3a55', win: '#ffe082' },
    }[k] || { fill: '#4a2c22', fill2: '#3d241c', win: '#f7c948' };
  }
  _draw(t) {
    const dt = this.lastT != null ? Math.min(.05, t - this.lastT) : .016; this.lastT = t;
    const x = this.ctx, W = this.cv.clientWidth || 1, H = this.cv.clientHeight || 1, dpr = this.dpr, th = this.themeDef(this.theme), k = this.theme;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a0a1a'); sky.addColorStop(1, k === 'miami' ? '#14201e' : '#1a1610');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    const R = this.rnd(3);
    x.globalAlpha = .5; x.fillStyle = '#fff7e6';
    for (let i = 0; i < 90; i++) { const sx = R() * W, sy = R() * H * .5, tw = this.rm ? .5 : .3 + .5 * Math.abs(Math.sin(t * .6 + i)); x.globalAlpha = tw * .6; x.fillRect(sx, sy, 1.4, 1.4); }
    x.globalAlpha = 1;
    const horizon = H * .62;
    this._buildRow(x, W, horizon - 70, 60, 130, .55, th, k, 11, .55);
    this._buildRow(x, W, horizon - 10, 90, 190, 1, th, k, 23, 1);
    x.fillStyle = k === 'miami' ? '#3a4a44' : '#26221c'; x.fillRect(0, horizon, W, H - horizon);
    x.strokeStyle = 'rgba(243,231,207,.22)'; x.lineWidth = 2; x.setLineDash([16, 20]); x.lineDashOffset = this.rm ? 0 : -t * 10;
    x.beginPath(); x.moveTo(0, horizon + (H - horizon) * .45); x.lineTo(W, horizon + (H - horizon) * .45); x.stroke(); x.setLineDash([]);
    const lampGap = 170, lampY = horizon + 6;
    for (let lx = lampGap / 2; lx < W; lx += lampGap) {
      const p = this.rm ? .35 : .28 + .14 * Math.sin(t * 1.4 + lx * .01);
      const g = x.createRadialGradient(lx, lampY, 2, lx, lampY, 46); g.addColorStop(0, `rgba(255,107,53,${p})`); g.addColorStop(1, 'rgba(255,107,53,0)');
      x.fillStyle = g; x.beginPath(); x.arc(lx, lampY, 46, 0, 7); x.fill();
      x.fillStyle = '#8a8a8a'; x.fillRect(lx - 1, lampY - 16, 2, 16); x.fillStyle = '#ffd54f'; x.fillRect(lx - 2, lampY - 19, 4, 4);
    }
    if (!this.rm) {
      const cy = horizon + (H - horizon) * .45;
      [0, 1].forEach((i) => {
        const cx = ((t * (60 + i * 20) * (i ? -1 : 1)) % (W + 200)) - (i ? 0 : 200);
        const px = i ? W - ((cx + 200) % (W + 200)) : cx;
        x.fillStyle = '#e8e2d2'; x.fillRect(px, cy - 4 + i * 26, 16, 7);
        const hg = x.createRadialGradient(px + (i ? -2 : 18), cy + i * 26, 1, px + (i ? -2 : 18), cy + i * 26, 26);
        hg.addColorStop(0, 'rgba(255,245,200,.45)'); hg.addColorStop(1, 'rgba(255,245,200,0)');
        x.fillStyle = hg; x.beginPath(); x.arc(px + (i ? -2 : 18), cy + i * 26, 26, 0, 7); x.fill();
      });
    }
    this._weather(x, t, dt, W, H);
    this._event(x, t, dt, W, H);
  }
  _buildRow(x, W, baseY, hMin, hMax, alphaMul, th, k, seed, scale) {
    const R = this.rnd(seed);
    let sx = -20;
    while (sx < W + 40) {
      const bw = (30 + R() * 40) * scale, bh = hMin + R() * (hMax - hMin);
      x.fillStyle = k === 'miami' ? ['#f8bbd0', '#b2dfdb', '#fff9c4'][Math.floor(R() * 3)] : (R() < .5 ? th.fill : th.fill2);
      x.globalAlpha = alphaMul; x.fillRect(sx, baseY - bh, bw, bh); x.globalAlpha = 1;
      const wc = Math.max(1, Math.floor(bw / 16));
      for (let c = 0; c < wc; c++) {
        const lit = R() < .55;
        x.fillStyle = lit ? th.win : 'rgba(0,0,0,.3)';
        x.globalAlpha = (lit ? .8 : .5) * alphaMul;
        x.fillRect(sx + 5 + c * 15, baseY - bh + bh * .3, 5 * scale, 6 * scale);
      }
      x.globalAlpha = 1;
      sx += bw + 8;
    }
  }
  _weather(x, t, dt, W, H) {
    const wthr = this.weather, q = this.qMul();
    if (wthr === 'overcast') { x.fillStyle = 'rgba(55,71,79,.18)'; x.fillRect(0, 0, W, H); }
    const raining = wthr === 'rain-light' || wthr === 'rain-heavy' || wthr === 'thunder';
    if (raining) {
      const heavy = wthr !== 'rain-light', target = Math.floor((heavy ? 220 : 110) * q);
      while (this.rain.length < target) this.rain.push({ x: Math.random() * W, y: Math.random() * H, spd: 500 + Math.random() * 300 });
      this.rain.length = Math.min(this.rain.length, target);
      x.strokeStyle = `rgba(176,190,197,${heavy ? .55 : .4})`; x.lineWidth = heavy ? 2 : 1;
      this.rain.forEach(p => { p.y += p.spd * dt; p.x += p.spd * dt * .3; if (p.y > H) { p.y = -10; p.x = Math.random() * W; } x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x + 6, p.y + 16); x.stroke(); });
    } else this.rain.length = 0;
    if (wthr === 'thunder') {
      if (!this.rm && Math.random() < .01) this._flashUntil = performance.now() + 90;
      if (this._flashUntil && performance.now() < this._flashUntil) { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 0, W, H); }
    }
    const snowing = wthr === 'snow-light' || wthr === 'snow-heavy';
    if (snowing) {
      const heavy = wthr === 'snow-heavy', target = Math.floor((heavy ? 180 : 90) * q);
      while (this.snow.length < target) this.snow.push({ x: Math.random() * W, y: Math.random() * H, spd: 40 + Math.random() * 60, seed: Math.random() * 10, r: heavy ? 3.5 : 2.5 });
      this.snow.length = Math.min(this.snow.length, target);
      x.fillStyle = 'rgba(255,255,255,.85)';
      this.snow.forEach(p => { p.y += p.spd * dt; p.x += Math.sin(t + p.seed) * .4; if (p.y > H) { p.y = -6; p.x = Math.random() * W; } x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); });
      this.snowAccum = Math.min(heavy ? .22 : .1, (this.snowAccum || 0) + dt * .015);
    } else this.snowAccum = Math.max(0, (this.snowAccum || 0) - dt * .03);
    if (this.snowAccum > 0) { const g = x.createLinearGradient(0, H * .75, 0, H); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${this.snowAccum})`); x.fillStyle = g; x.fillRect(0, H * .75, W, H * .25); }
    const fogTarget = wthr === 'fog' ? .32 : 0;
    this.fogA = (this.fogA || 0) + (fogTarget - (this.fogA || 0)) * Math.min(1, dt * 1.5);
    if (this.fogA > .01) { const g = x.createLinearGradient(0, H * .3, 0, H); g.addColorStop(0, 'rgba(158,158,158,0)'); g.addColorStop(1, `rgba(158,158,158,${this.fogA})`); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    if (wthr === 'heat') { x.fillStyle = 'rgba(255,107,53,.06)'; x.fillRect(0, 0, W, H); }
    if (wthr === 'windy') {
      const target = Math.floor(40 * q);
      while (this.debris.length < target) this.debris.push({ x: Math.random() * W, y: H * .6 + Math.random() * H * .4, spd: 80 + Math.random() * 140, rot: Math.random() * 6 });
      this.debris.length = Math.min(this.debris.length, target);
      x.fillStyle = 'rgba(120,95,60,.55)';
      this.debris.forEach(p => { p.x += p.spd * dt; p.rot += dt * 4; if (p.x > W + 10) { p.x = -10; p.y = H * .6 + Math.random() * H * .4; } x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillRect(-3, -1.5, 6, 3); x.restore(); });
    } else this.debris.length = 0;
  }
  _event(x, t, dt, W, H) {
    const ev = this.eventType; if (!ev) { this.evtP.length = 0; return; }
    const q = this.qMul(), anchorX = W * .7, anchorY = H * .72;
    const palettes = {
      blockparty: ['#ff6b35', '#f7c948', '#4caf50'], parade: ['#ff6b35', '#4caf50', '#9c27b0', '#f7c948'],
      cookout: ['#ff6b35', '#f7c948'], celebration: ['#ff6b35', '#9c27b0', '#2196f3', '#f7c948'],
    };
    if (ev === 'raid') { const on = Math.floor(t * 2) % 2 === 0; x.fillStyle = on ? 'rgba(255,68,68,.14)' : 'rgba(33,150,243,.14)'; x.fillRect(0, 0, W, H); }
    else if (ev === 'fire') {
      const rg = x.createRadialGradient(anchorX, anchorY, 10, anchorX, anchorY, 260); rg.addColorStop(0, 'rgba(255,68,68,.12)'); rg.addColorStop(1, 'rgba(255,68,68,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
      const target = Math.floor(30 * q);
      while (this.evtP.length < target) this.evtP.push({ x: anchorX - 20 + Math.random() * 40, y: anchorY, vy: -(60 + Math.random() * 60), c: Math.random() < .5 ? '#ff6b35' : '#ff4444', r: 3 + Math.random() * 4, life: 1 });
      this.evtP = this.evtP.filter(p => p.life > 0);
      this.evtP.forEach(p => { p.y += p.vy * dt; p.life -= dt * .6; x.fillStyle = p.c; x.globalAlpha = Math.max(0, p.life); x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); x.globalAlpha = 1; });
    } else if (ev === 'church') { const g = x.createRadialGradient(W * .3, H * .3, 10, W * .3, H * .3, 220); g.addColorStop(0, 'rgba(255,224,130,.2)'); g.addColorStop(1, 'rgba(255,224,130,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    else if (ev === 'protest' || ev === 'gentrification') { const g = x.createRadialGradient(W * .5, H * .6, 10, W * .5, H * .6, 300); g.addColorStop(0, ev === 'gentrification' ? 'rgba(156,39,176,.18)' : 'rgba(255,107,53,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    else if (ev === 'funeral') { x.fillStyle = 'rgba(60,72,88,.16)'; x.fillRect(0, 0, W, H); }
    else if (palettes[ev]) {
      const palette = palettes[ev], shape = ev === 'celebration' ? 'circle' : 'rect', target = Math.floor(60 * q), spanX = ev === 'parade' ? W : 200;
      while (this.evtP.length < target) this.evtP.push({ x: ev === 'parade' ? Math.random() * W : anchorX - spanX / 2 + Math.random() * spanX, y: anchorY + 20, vy: -(40 + Math.random() * 50), vx: (Math.random() - .5) * 30, rot: Math.random() * 6, c: palette[Math.floor(Math.random() * palette.length)], r: shape === 'circle' ? (5 + Math.random() * 4) : null, w: 6 + Math.random() * 4, h: 8 + Math.random() * 4, life: 1 + Math.random() });
      this.evtP = this.evtP.filter(p => p.y > -20 && p.life > 0);
      this.evtP.forEach(p => { p.y += p.vy * dt; p.x += p.vx * dt; p.rot += dt * 2; p.life -= dt * .15; x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c; x.globalAlpha = Math.max(0, Math.min(1, p.life)); if (shape === 'circle') { x.beginPath(); x.arc(0, 0, p.r, 0, 7); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore(); x.globalAlpha = 1; });
    }
  }
}

export class AudioEngine {
  init(state) {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext; this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain(); this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.masterGain);
      this.masterGain.gain.value = state.muted ? 0 : state.soundMaster / 100;
      this.musicGain.gain.value = state.soundMusic / 100;
      const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 55;
      const og = this.ctx.createGain(); og.gain.value = .05; osc.connect(og); og.connect(this.musicGain); osc.start();
      const bufSize = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const nf = this.ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 800;
      const ng = this.ctx.createGain(); ng.gain.value = 0;
      noise.connect(nf); nf.connect(ng); ng.connect(this.musicGain); noise.start();
      this.noiseGain = ng; this.noiseFilter = nf;
    } catch (e) { this.ctx = null; }
  }
  setGains(state) {
    if (!this.ctx) return;
    this.masterGain.gain.setTargetAtTime(state.muted ? 0 : state.soundMaster / 100, this.ctx.currentTime, .05);
    this.musicGain.gain.setTargetAtTime(state.soundMusic / 100, this.ctx.currentTime, .05);
  }
  setWeather(w) {
    if (!this.noiseGain) return;
    let target = 0, freq = 800;
    if (w === 'rain-light') { target = .05; freq = 1200; }
    else if (w === 'rain-heavy' || w === 'thunder') { target = .11; freq = 1500; }
    else if (w === 'windy') { target = .06; freq = 400; }
    this.noiseGain.gain.setTargetAtTime(target, this.ctx.currentTime, .4);
    this.noiseFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, .4);
  }
  sting(type) {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const tone = (freq, start, dur, wave, vol) => {
      const o = ctx.createOscillator(); o.type = wave; o.frequency.value = freq;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, now + start); g.gain.linearRampToValueAtTime(vol, now + start + .02); g.gain.exponentialRampToValueAtTime(.001, now + start + dur);
      o.connect(g); g.connect(this.masterGain); o.start(now + start); o.stop(now + start + dur + .05);
    };
    if (['blockparty', 'celebration', 'parade'].includes(type)) [523, 659, 784, 988].forEach((f, i) => tone(f, i * .09, .25, 'triangle', .12));
    else if (type === 'raid') for (let i = 0; i < 6; i++) tone(i % 2 ? 880 : 660, i * .18, .16, 'square', .1);
    else if (type === 'fire') { tone(180, 0, .5, 'sawtooth', .08); tone(90, .1, .6, 'sawtooth', .06); }
    else if (type === 'church') [261, 329, 392].forEach((f, i) => tone(f, i * .12, 1.1, 'sine', .09));
    else if (type === 'cookout') { tone(300, 0, .12, 'square', .05); tone(250, .15, .12, 'square', .05); }
    else if (type === 'funeral') tone(130, 0, 1.4, 'sine', .08);
    else if (type === 'protest' || type === 'gentrification') { tone(200, 0, .3, 'sawtooth', .07); tone(160, .3, .3, 'sawtooth', .07); }
  }
}

export const WEATHER_LIST = [['clear', '🌙 Clear Night'], ['overcast', '☁️ Overcast'], ['rain-light', '🌦️ Light Rain'], ['rain-heavy', '🌧️ Heavy Rain'], ['thunder', '⛈️ Thunderstorm'], ['snow-light', '🌨️ Light Snow'], ['snow-heavy', '❄️ Heavy Snow'], ['fog', '🌫️ Fog'], ['heat', '🥵 Heat Wave'], ['windy', '💨 Windy']];
export const EVENT_LIST = [
  ['blockparty', '🎉 Block Party', '🎉', '+1 Community for everybody nearby.', 7000],
  ['raid', '🚨 Police Raid', '🚨', 'Move or hide — caught costs \u22121 Street Cred.', 6000],
  ['fire', '🔥 Fire', '🔥', 'Location blocked 2 rounds. +2 Community for helping.', 6000],
  ['parade', '🎊 Parade', '🎊', '+1 Reputation for marching along.', 6000],
  ['protest', '✊🏾 Protest', '✊🏾', '+2 Community if you join, \u22121 Reputation if you ignore.', 7000],
  ['church', '⛪ Church Service', '⛪', '+1 Community, +1 Reputation for attending.', 7000],
  ['cookout', '🍗 Cookout', '🍗', '+1 Community, +1 Reputation for attending.', 7000],
  ['gentrification', '📢 Gentrification Protest', '📢', '+2 Community if you join, \u22121 Street Cred if you cross the line.', 7000],
  ['funeral', '🕊️ Funeral', '🕊️', '+1 Community for attending, \u22121 Reputation for disrespect.', 6000],
  ['celebration', '🎈 Celebration', '🎈', '+1 Reputation for attending.', 6000],
];
export const THEME_LIST = [['harlem', 'Harlem'], ['detroit', 'Detroit'], ['chicago', 'Chicago'], ['miami', 'Miami'], ['baltimore', 'Baltimore'], ['atlanta', 'Atlanta'], ['oakland', 'Oakland'], ['nola', 'N.O.']];
