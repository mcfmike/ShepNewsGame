'use strict';

// ===== CANVAS SETUP =====
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const CW = canvas.width;   // 800
const CH = canvas.height;  // 545

// Polyfill for ctx.roundRect (Safari <15.4)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arcTo(x + w, y, x + w, y + r, r);
    this.lineTo(x + w, y + h - r);
    this.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.lineTo(x + r, y + h);
    this.arcTo(x, y + h, x, y + h - r, r);
    this.lineTo(x, y + r);
    this.arcTo(x, y, x + r, y, r);
    this.closePath();
  };
}

// ===== LAYOUT CONSTANTS =====
const HEADER_H = 45;
const COUNTER_Y = 338;
const CHAR_HEAD_Y = 455;
const CHRIS_X   = 95;
const BARRIE_X  = 705;
const CUSTOMER_X = 400;
const THROW_ORIGIN_X = 400;
const THROW_ORIGIN_Y = CH + 10;

// ===== INTRO SEQUENCE =====
const INTRO_STEPS = [
  { who: 'chris',  text: "Welcome to Shep's — the finest newsagent in Barrowford, Lancashire!", dur: 3800 },
  { who: 'barrie', text: "Established 1976! Right then, let's play... IT'S SHEP'S NEWSAGENT!", dur: 3800 },
  { who: 'chris',  text: "Super, smashing, great! Here's how it works — aim at the shelf and throw!", dur: 3500 },
  { who: 'barrie', text: "Your first customer's waiting. Bigger coins mean more points — but harder to aim! Good luck!", dur: 4000 },
];

// ===== GAME STATE =====
let G = {};

function resetGame() {
  G = {
    state: 'TITLE',
    round: 0,
    score: 0,
    currentRound: null,
    itemIndex: 0,
    throwsLeft: 3,
    projectileType: '1p',
    aimX: 400, aimY: 200,
    wobbleX: 0, wobbleY: 0,
    projectile: null,
    speech: null,
    floats: [],
    hitEffects: [],
    introStep: 0,
    introTimer: 0,
    stateTimer: 0,
    roundScores: [],
    prize: null,
    lastTs: 0,
    lastHit: false,
    resultHandled: false,
    pendingTransition: null,
    audioCtx: null,
  };
}

// ===== AUDIO =====
function getAudioCtx() {
  if (!G.audioCtx) {
    try { G.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return G.audioCtx;
}

function playTone(freq, duration, type, gainVal) {
  const ac = getAudioCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(gainVal || 0.25, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch(e) {}
}

function playSound(type) {
  const ac = getAudioCtx();
  if (!ac) return;
  if (type === 'throw') {
    playTone(200, 0.15, 'sawtooth', 0.15);
  } else if (type === 'hit') {
    playTone(523, 0.1, 'sine', 0.3);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 100);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 200);
  } else if (type === 'miss') {
    playTone(300, 0.08, 'sawtooth', 0.2);
    setTimeout(() => playTone(220, 0.2, 'sawtooth', 0.15), 80);
  } else if (type === 'fanfare') {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'square', 0.2), i * 120));
  }
}

// ===== INPUT =====
function setupInput() {
  canvas.addEventListener('mousemove', e => {
    const pos = canvasXY(e.clientX, e.clientY);
    G.aimX = pos.x;
    G.aimY = pos.y;
  });
  canvas.addEventListener('click', e => {
    if (G.state === 'AIMING') {
      e.preventDefault();
      throwProjectile();
    }
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    const pos = canvasXY(t.clientX, t.clientY);
    G.aimX = pos.x;
    G.aimY = pos.y;
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    const pos = canvasXY(t.clientX, t.clientY);
    G.aimX = pos.x;
    G.aimY = pos.y;
  }, { passive: false });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (G.state === 'AIMING') throwProjectile();
  }, { passive: false });
}

function canvasXY(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (cx - r.left) * (CW / r.width),
    y: (cy - r.top)  * (CH / r.height),
  };
}

// ===== BUTTONS =====
function setupButtons() {
  document.getElementById('btn-start').addEventListener('click', () => {
    getAudioCtx(); // unlock audio
    startIntro();
  });

  ['newspaper', '1p', '2p'].forEach(type => {
    const btn = document.getElementById('btn-' + (type === 'newspaper' ? 'newspaper' : type));
    if (btn) {
      btn.addEventListener('click', () => selectProjectile(type));
      btn.addEventListener('touchend', e => { e.preventDefault(); selectProjectile(type); });
    }
  });

  document.getElementById('btn-play-again').addEventListener('click', () => {
    document.getElementById('overlay-prize').classList.remove('active');
    document.getElementById('btn-play-again').classList.remove('visible');
    document.getElementById('prize-content').classList.remove('visible');
    document.getElementById('curtain-left').classList.remove('open');
    document.getElementById('curtain-right').classList.remove('open');
    resetGame();
    document.getElementById('overlay-title').classList.add('active');
  });
}

function selectProjectile(type) {
  if (G.state !== 'AIMING') return;
  G.projectileType = type;
  ['newspaper', '1p', '2p'].forEach(t => {
    const btn = document.getElementById('btn-' + (t === 'newspaper' ? 'newspaper' : t));
    if (btn) btn.classList.toggle('selected', t === type);
  });
}

function disableThrowButtons() {
  document.querySelectorAll('.throw-btn').forEach(b => b.disabled = true);
}
function enableThrowButtons() {
  document.querySelectorAll('.throw-btn').forEach(b => b.disabled = false);
}

// ===== COLOUR UTILITIES =====
function lightenHex(hex, amt) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, r+amt); g = Math.min(255, g+amt); b = Math.min(255, b+amt);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function darkenHex(hex, amt) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.max(0, r-amt); g = Math.max(0, g-amt); b = Math.max(0, b-amt);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ===== TEXT WRAP =====
function wrapText(text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width <= maxW) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [text];
}

// ===== GAME FLOW =====
function startIntro() {
  document.getElementById('overlay-title').classList.remove('active');
  G.state = 'INTRO';
  G.introStep = 0;
  G.introTimer = performance.now();
  G.currentRound = ROUNDS[0];
  showSpeech(INTRO_STEPS[0].who, INTRO_STEPS[0].text, INTRO_STEPS[0].dur - 500);
}

function updateIntro(ts) {
  const step = INTRO_STEPS[G.introStep];
  if (ts - G.introTimer >= step.dur) {
    G.introStep++;
    if (G.introStep >= INTRO_STEPS.length) {
      G.state = 'ROUND_START';
      G.stateTimer = ts;
      G.speech = null;
      G.round = 0;
      G.currentRound = ROUNDS[0];
    } else {
      G.introTimer = ts;
      const next = INTRO_STEPS[G.introStep];
      showSpeech(next.who, next.text, next.dur - 500);
    }
  }
}

function updateRoundStart(ts) {
  if (ts - G.stateTimer > 3200) {
    G.state = 'AIMING';
    enableThrowButtons();
    const targetId = G.currentRound.items[G.itemIndex];
    const target = SHELF_ITEMS[targetId];
    if (target) {
      G.aimX = target.x + target.w / 2;
      G.aimY = target.y + target.h / 2;
    }
    showSpeech('chris', `Alright! We need a ${SHELF_ITEMS[targetId] ? SHELF_ITEMS[targetId].label : 'item'} — take aim!`, 2500);
  }
}

function getCurrentTargetId() {
  if (!G.currentRound) return null;
  return G.currentRound.items[G.itemIndex];
}

// ===== THROW MECHANIC =====
function throwProjectile() {
  if (!G.currentRound || G.throwsLeft <= 0 || G.projectile) return;
  G.throwsLeft--;
  disableThrowButtons();

  const landX = Math.max(0, Math.min(CW, G.aimX + G.wobbleX));
  const landY = Math.max(0, Math.min(CH, G.aimY + G.wobbleY));

  const cpX = (THROW_ORIGIN_X + landX) / 2;
  const cpY = Math.min(THROW_ORIGIN_Y, landY) - 230;

  G.projectile = {
    startX: THROW_ORIGIN_X, startY: THROW_ORIGIN_Y,
    landX, landY, cpX, cpY,
    progress: 0, speed: 0.03,
    rotation: 0,
    type: G.projectileType,
  };

  G.state = 'THROWING';
  G.resultHandled = false;
  playSound('throw');
}

function onProjectileLanded() {
  if (G.resultHandled) return;
  G.resultHandled = true;

  const p = G.projectile;
  G.projectile = null;
  G.state = 'RESULT';

  const targetId = getCurrentTargetId();
  const target = SHELF_ITEMS[targetId];

  const hit = target &&
    p.landX >= target.x && p.landX <= target.x + target.w &&
    p.landY >= target.y && p.landY <= target.y + target.h;

  if (hit) {
    G.lastHit = true;
    const cfg = PROJECTILES[G.projectileType];
    const cx = target.x + target.w / 2;
    const cy = target.y + target.h / 2;
    const normDist = Math.sqrt(
      Math.pow((p.landX - cx) / (target.w / 2), 2) +
      Math.pow((p.landY - cy) / (target.h / 2), 2)
    );
    const bonus = normDist < 0.3 ? 1.5 : 1;
    const pts = Math.round(target.basePoints * cfg.multiplier * bonus);
    G.score += pts;
    G.roundScores[G.round] = (G.roundScores[G.round] || 0) + pts;

    G.floats.push({ x: p.landX, y: p.landY - 10, text: `+${pts}`, opacity: 1, vy: 1.5, color: '#FFD700', size: 22 });
    if (normDist < 0.3) {
      G.floats.push({ x: p.landX, y: p.landY - 36, text: 'BULLSEYE!', opacity: 1, vy: 1.0, color: '#FF2200', size: 18 });
      playSound('fanfare');
    } else {
      playSound('hit');
    }
    G.hitEffects.push({ x: cx, y: cy, timer: 700, maxTimer: 700 });
    sayRandomPhrase('hit');

    setTimeout(() => {
      G.throwsLeft = 3;
      G.itemIndex++;
      advanceToNextItem();
    }, 1800);

  } else {
    G.lastHit = false;
    G.floats.push({ x: p.landX, y: p.landY - 10, text: 'MISS!', opacity: 1, vy: 1.2, color: '#FF6666', size: 20 });
    playSound('miss');
    sayRandomPhrase('miss');

    if (G.throwsLeft > 0) {
      setTimeout(() => {
        G.state = 'AIMING';
        enableThrowButtons();
      }, 1400);
    } else {
      // Out of throws for this item — skip it
      setTimeout(() => {
        G.throwsLeft = 3;
        G.itemIndex++;
        advanceToNextItem();
      }, 1800);
    }
  }
}

function advanceToNextItem() {
  if (G.itemIndex >= G.currentRound.items.length) {
    G.round++;
    G.itemIndex = 0;
    G.speech = null;
    if (G.round >= ROUNDS.length) {
      setTimeout(() => showPrizeReveal(), 600);
    } else {
      G.currentRound = ROUNDS[G.round];
      G.state = 'ROUND_START';
      G.stateTimer = performance.now();
      showSpeech('barrie', `Great round! Next customer please!`, 2500);
    }
  } else {
    const nextId = G.currentRound.items[G.itemIndex];
    const nextItem = SHELF_ITEMS[nextId];
    G.state = 'AIMING';
    enableThrowButtons();
    if (nextItem) {
      G.aimX = nextItem.x + nextItem.w / 2;
      G.aimY = nextItem.y + nextItem.h / 2;
    }
    showSpeech('chris', `Now find the ${nextItem ? nextItem.label : 'next item'}!`, 2500);
  }
}

// ===== COMMENTARY =====
function sayRandomPhrase(type) {
  const chris = CHARACTER_DATA['chris'];
  const barrie = CHARACTER_DATA['barrie'];
  let who, text;

  if (type === 'hit') {
    if (Math.random() < 0.5) {
      who = 'chris';
      text = chris.catchphrases[Math.floor(Math.random() * chris.catchphrases.length)];
    } else {
      who = 'barrie';
      text = barrie.catchphrases[Math.floor(Math.random() * barrie.catchphrases.length)];
    }
  } else if (type === 'miss') {
    if (Math.random() < 0.5) {
      who = 'chris';
      text = chris.missPhrases[Math.floor(Math.random() * chris.missPhrases.length)];
    } else {
      who = 'barrie';
      text = barrie.missPhrases[Math.floor(Math.random() * barrie.missPhrases.length)];
    }
  } else if (type === 'next-item') {
    who = Math.random() < 0.5 ? 'chris' : 'barrie';
    text = "Right, what else do they need?";
  }

  if (who && text) showSpeech(who, text, 2800);
}

function showSpeech(who, text, duration) {
  G.speech = { who, text, until: performance.now() + duration };
}

// ===== PRIZE REVEAL =====
function showPrizeReveal() {
  G.prize = selectPrize(G.score);
  const overlay = document.getElementById('overlay-prize');
  overlay.classList.add('active');

  document.getElementById('prize-name').textContent = G.prize.name;
  document.getElementById('prize-value').textContent = `Estimated value: ${G.prize.value}`;
  document.getElementById('prize-score-display').textContent =
    `Your final score: ${G.score} point${G.score !== 1 ? 's' : ''} — ${getScoreRating(G.score)}`;

  playSound('fanfare');

  // Open curtains after brief pause
  setTimeout(() => {
    document.getElementById('curtain-left').classList.add('open');
    document.getElementById('curtain-right').classList.add('open');

    // Show content
    setTimeout(() => {
      document.getElementById('prize-content').classList.add('visible');
      // Type out description
      typeOut(document.getElementById('prize-desc'), G.prize.description, 40, () => {
        document.getElementById('btn-play-again').classList.add('visible');
      });
    }, 1400);
  }, 800);
}

function getScoreRating(score) {
  if (score >= 300) return 'BARROWFORD LEGEND!';
  if (score >= 200) return 'Shelf Specialist!';
  if (score >= 100) return 'Newsagent Novice';
  return 'Keep practising, love!';
}

function typeOut(el, text, delay, done) {
  el.textContent = '';
  let i = 0;
  const step = () => {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(step, delay);
    } else if (done) {
      done();
    }
  };
  setTimeout(step, delay);
}

// ===== MAIN LOOP =====
function loop(ts) {
  const dt = Math.min(ts - G.lastTs, 50);
  G.lastTs = ts;
  update(ts, dt);
  render(ts);
  requestAnimationFrame(loop);
}

function update(ts, dt) {
  // Floating scores
  G.floats = G.floats.filter(f => {
    f.y -= f.vy;
    f.opacity -= 0.014;
    return f.opacity > 0;
  });

  // Hit effects
  G.hitEffects = G.hitEffects.filter(h => {
    h.timer -= dt;
    return h.timer > 0;
  });

  // Speech expiry
  if (G.speech && ts > G.speech.until) G.speech = null;

  // Projectile
  if (G.projectile) {
    G.projectile.progress += G.projectile.speed;
    G.projectile.rotation += 0.18;
    if (G.projectile.progress >= 1) {
      G.projectile.progress = 1;
      onProjectileLanded();
    }
  }

  // State updates
  if (G.state === 'INTRO') updateIntro(ts);
  if (G.state === 'ROUND_START') updateRoundStart(ts);
}

// ===== RENDERING =====
function render(ts) {
  ctx.clearRect(0, 0, CW, CH);

  drawBackground(ts);
  drawShelfItems(ts);
  drawCounter();
  drawCharacterStrip(ts);

  if (G.state === 'AIMING' && !G.projectile) drawCrosshair(ts);
  if (G.projectile) drawProjectileAnim(ts);

  drawHitEffects(ts);
  drawFloatingScores();
  drawSpeechBubble();
  drawHUD(ts);

  if (G.state === 'ROUND_START' || G.state === 'INTRO') {
    drawCustomerRequest(ts);
  }
}

// ===== BACKGROUND =====
function drawBackground(ts) {
  // Cream wallpaper
  ctx.fillStyle = '#F2EDD8';
  ctx.fillRect(0, HEADER_H, CW, COUNTER_Y - HEADER_H);

  // Subtle wallpaper floral pattern
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#8B4513';
  for (let gx = 20; gx < CW; gx += 48) {
    for (let gy = HEADER_H + 20; gy < COUNTER_Y - 10; gy += 48) {
      ctx.beginPath();
      ctx.arc(gx, gy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Decorative border strip at top of wall
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(0, HEADER_H, CW, 10);
  // Gold stripe
  ctx.fillStyle = '#D4A017';
  ctx.fillRect(0, HEADER_H + 3, CW, 4);

  // Floor (under counter)
  const floorGrad = ctx.createLinearGradient(0, COUNTER_Y + 55, 0, CH);
  floorGrad.addColorStop(0, '#5C2D0A');
  floorGrad.addColorStop(1, '#3A1A04');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, COUNTER_Y + 55, CW, CH - (COUNTER_Y + 55));

  // Shelf planks
  drawShelfPlank(140);
  drawShelfPlank(232);
  drawShelfPlank(320);
}

function drawShelfPlank(y) {
  const g = ctx.createLinearGradient(0, y, 0, y + 12);
  g.addColorStop(0, '#C4833D');
  g.addColorStop(0.5, '#A0622A');
  g.addColorStop(1, '#7A4818');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, CW, 12);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, y + 12, CW, 5);
  // Highlight edge
  ctx.fillStyle = 'rgba(255,200,100,0.18)';
  ctx.fillRect(0, y, CW, 2);
}

// ===== SHELF ITEMS =====
function drawShelfItems(ts) {
  const targetId = getCurrentTargetId();
  const servedIds = G.currentRound ? G.currentRound.items.slice(0, G.itemIndex) : [];

  Object.values(SHELF_ITEMS).forEach(item => {
    const isTarget = item.id === targetId && (G.state === 'AIMING' || G.state === 'THROWING' || G.state === 'RESULT');
    const isServed = servedIds.includes(item.id);
    drawOneItem(item, isTarget, isServed, ts);
  });
}

function drawOneItem(item, isTarget, isServed, ts) {
  const { x, y, w, h, color, textColor, label } = item;

  ctx.save();

  if (isTarget) {
    const pulse = Math.sin(ts * 0.006) * 6 + 10;
    ctx.shadowBlur = pulse;
    ctx.shadowColor = '#FFD700';
  }

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, lightenHex(color, 30));
  grad.addColorStop(1, color);
  ctx.fillStyle = isServed ? '#777' : grad;
  ctx.strokeStyle = isTarget ? '#FFD700' : darkenHex(color, 40);
  ctx.lineWidth = isTarget ? 3.5 : 1.5;

  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 5);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = isServed ? '#444' : textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = Math.min(13, Math.max(9, Math.floor(w / (label.length * 0.6))));
  ctx.font = `bold ${fontSize}px 'Bowlby One SC', Impact, sans-serif`;
  const lines = [];
  const words = label.split(' ');
  let cur = '';
  words.forEach(word => {
    const test = cur ? cur + ' ' + word : word;
    if (ctx.measureText(test).width < w - 10) { cur = test; }
    else { if (cur) lines.push(cur); cur = word; }
  });
  if (cur) lines.push(cur);
  if (!lines.length) lines.push(label);

  const lh = Math.min(16, h / (lines.length + 0.5));
  const startY = y + h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, startY + i * lh);
  });

  ctx.textBaseline = 'alphabetic';

  // Served tick
  if (isServed) {
    ctx.fillStyle = '#00BB00';
    ctx.font = 'bold 26px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  // Target star indicator above item
  if (isTarget) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★ AIM HERE ★', x + w / 2, y - 4);
  }

  ctx.restore();
}

// ===== COUNTER =====
function drawCounter() {
  // Counter top surface
  const cg = ctx.createLinearGradient(0, COUNTER_Y, 0, COUNTER_Y + 55);
  cg.addColorStop(0, '#C8883A');
  cg.addColorStop(0.3, '#A86A28');
  cg.addColorStop(1, '#7A4A18');
  ctx.fillStyle = cg;
  ctx.fillRect(0, COUNTER_Y, CW, 55);

  // Green baize strip
  ctx.fillStyle = '#2A6A2A';
  ctx.fillRect(0, COUNTER_Y + 18, CW, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, COUNTER_Y + 18, CW, 4);

  // Highlight edge
  ctx.fillStyle = 'rgba(255,200,100,0.3)';
  ctx.fillRect(0, COUNTER_Y, CW, 3);
  // Shadow edge
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, COUNTER_Y + 52, CW, 5);

  // Till on right side
  drawTill(640, COUNTER_Y - 35);
}

function drawTill(x, y) {
  // Body
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.roundRect(x, y, 120, 75, 6);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Screen
  ctx.fillStyle = '#88CC44';
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 6, 80, 28, 3);
  ctx.fill();
  // Display text
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`£${(G.score / 100).toFixed(2)}`, x + 48, y + 24);
  ctx.textAlign = 'left';
  // Keys
  for (let ky = 0; ky < 3; ky++) {
    for (let kx = 0; kx < 5; kx++) {
      ctx.fillStyle = kx < 3 ? '#888' : '#CC4400';
      ctx.beginPath();
      ctx.roundRect(x + 8 + kx * 18, y + 40 + ky * 10, 14, 7, 2);
      ctx.fill();
    }
  }
}

// ===== CHARACTERS =====
function drawCharacterStrip(ts) {
  // Chris (owner, left) - always visible
  const chrisExpr = G.speech && G.speech.who === 'chris' ? 'grin' : 'smile';
  drawCharacter(ctx, 'chris', CHRIS_X, CHAR_HEAD_Y, 0.9, chrisExpr);
  // Name
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.fillText('CHRIS', CHRIS_X, CHAR_HEAD_Y + 115);

  // Barrie (owner, right) - always visible
  const barrieExpr = G.speech && G.speech.who === 'barrie' ? 'grin' : 'grin';
  drawCharacter(ctx, 'barrie', BARRIE_X, CHAR_HEAD_Y, 0.9, barrieExpr);
  ctx.fillText('BARRIE', BARRIE_X, CHAR_HEAD_Y + 115);

  // Customer (center) - only during rounds
  if (G.currentRound && ['ROUND_START','AIMING','THROWING','RESULT'].includes(G.state)) {
    const cid = G.currentRound.customerId;
    const custExpr = G.lastHit && G.state === 'RESULT' ? 'grin' : 'friendly';
    drawCharacter(ctx, cid, CUSTOMER_X, CHAR_HEAD_Y - 5, 1.0, custExpr);
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(CHARACTER_DATA[cid].name.toUpperCase(), CUSTOMER_X, CHAR_HEAD_Y + 120);
  }
}

// ===== CROSSHAIR =====
function drawCrosshair(ts) {
  const cfg = PROJECTILES[G.projectileType];
  const wX = Math.sin(ts * cfg.wobbleFreqX * Math.PI * 2) * cfg.wobbleMag;
  const wY = Math.cos(ts * cfg.wobbleFreqY * Math.PI * 2) * cfg.wobbleMag;
  G.wobbleX = wX;
  G.wobbleY = wY;

  const cx = G.aimX + wX;
  const cy = G.aimY + wY;
  const r = 22;

  ctx.save();
  ctx.translate(cx, cy);

  // Wobble zone ring (dashed)
  if (cfg.wobbleMag > 5) {
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(-wX, -wY, cfg.wobbleMag, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Outer ring
  ctx.strokeStyle = 'rgba(255, 40, 40, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  // Cross lines
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r - 10, 0); ctx.lineTo(-5, 0);
  ctx.moveTo(5, 0);      ctx.lineTo(r + 10, 0);
  ctx.moveTo(0, -r - 10); ctx.lineTo(0, -5);
  ctx.moveTo(0, 5);      ctx.lineTo(0, r + 10);
  ctx.stroke();

  // Centre dot
  ctx.fillStyle = 'rgba(255,40,40,0.95)';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Mini projectile icon below crosshair
  drawProjectileIcon(ctx, 0, r + 18, G.projectileType, 0.65);

  ctx.restore();
}

// ===== PROJECTILE ANIMATION =====
function drawProjectileAnim(ts) {
  if (!G.projectile) return;
  const p = G.projectile;
  const t = p.progress;
  const mt = 1 - t;
  const bx = mt*mt*p.startX + 2*mt*t*p.cpX + t*t*p.landX;
  const by = mt*mt*p.startY + 2*mt*t*p.cpY + t*t*p.landY;
  const scale = Math.max(0.22, 1.5 - t * 1.28);

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(p.rotation);
  ctx.scale(scale, scale);
  drawProjectileIcon(ctx, 0, 0, p.type, 1);
  ctx.restore();
}

function drawProjectileIcon(ctx, x, y, type, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (type === 'newspaper') {
    // Rolled newspaper cylinder
    ctx.fillStyle = '#E8E0C8';
    ctx.strokeStyle = '#8A7840';
    ctx.lineWidth = 1.5;
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0.35, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Left end
    ctx.fillStyle = '#D8D0B0';
    ctx.beginPath();
    ctx.ellipse(-11, -3.5, 6, 9, 0.35, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Right end
    ctx.beginPath();
    ctx.ellipse(11, 3.5, 6, 9, 0.35, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Headline stripe
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(-9, -1.5, 18, 3);
  } else {
    const r = type === '2p' ? 13 : 9;
    // Coin edge (dark)
    ctx.fillStyle = '#A06020';
    ctx.beginPath();
    ctx.ellipse(0, 2, r, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    // Coin face
    ctx.fillStyle = '#C87830';
    ctx.strokeStyle = '#8B5020';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Shine
    ctx.fillStyle = 'rgba(255,220,140,0.45)';
    ctx.beginPath();
    ctx.ellipse(-r*0.3, -r*0.1, r*0.5, r*0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    // Label
    ctx.fillStyle = '#5C3010';
    ctx.font = `bold ${r * 0.75}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, 0, 0);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();
}

// ===== HIT EFFECTS =====
function drawHitEffects(ts) {
  G.hitEffects.forEach(h => {
    const prog = 1 - h.timer / h.maxTimer;
    const r = 30 + prog * 50;
    ctx.save();
    ctx.globalAlpha = h.timer / h.maxTimer;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();
    // Stars
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + prog;
      const sr = r * 1.2;
      ctx.fillStyle = '#FF4400';
      ctx.beginPath();
      ctx.arc(h.x + Math.cos(angle)*sr, h.y + Math.sin(angle)*sr, 4, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  });
}

// ===== FLOATING SCORES =====
function drawFloatingScores() {
  G.floats.forEach(f => {
    ctx.save();
    ctx.globalAlpha = f.opacity;
    ctx.fillStyle = f.color || '#FFD700';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.font = `bold ${f.size || 20}px 'Bowlby One SC', Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  });
}

// ===== SPEECH BUBBLE =====
function drawSpeechBubble() {
  if (!G.speech) return;
  const { who, text } = G.speech;

  let anchorX;
  if (who === 'chris') anchorX = CHRIS_X;
  else if (who === 'barrie') anchorX = BARRIE_X;
  else anchorX = CUSTOMER_X;

  const bubbleY = CHAR_HEAD_Y - 120;
  const maxBW = 200;
  const pad = 12;

  ctx.font = '12px Arial';
  // Build lines
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width <= maxBW - pad * 2) { cur = test; }
    else { if (cur) lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);

  const lh = 16;
  const bh = lines.length * lh + pad * 2;
  const bw = Math.max(80, Math.min(maxBW, ...lines.map(l => ctx.measureText(l).width + pad * 2)));

  let bx = anchorX - bw / 2;
  bx = Math.max(6, Math.min(CW - bw - 6, bx));
  const by = bubbleY - bh;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(bx + 3, by + 3, bw, bh, 8);
  ctx.fill();

  // Bubble
  ctx.fillStyle = '#FFFDE7';
  ctx.strokeStyle = '#5C2D0A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill(); ctx.stroke();

  // Tail
  const tailX = Math.max(bx + 14, Math.min(bx + bw - 14, anchorX));
  ctx.fillStyle = '#FFFDE7';
  ctx.beginPath();
  ctx.moveTo(tailX - 8, by + bh);
  ctx.lineTo(tailX, by + bh + 14);
  ctx.lineTo(tailX + 8, by + bh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5C2D0A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(tailX - 8, by + bh + 1);
  ctx.lineTo(tailX, by + bh + 14);
  ctx.lineTo(tailX + 8, by + bh + 1);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left';
  ctx.font = '12px Arial';
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + pad, by + pad + 12 + i * lh);
  });
}

// ===== HUD =====
function drawHUD(ts) {
  // Header bar gradient
  const hg = ctx.createLinearGradient(0, 0, 0, HEADER_H);
  hg.addColorStop(0, '#D4A017');
  hg.addColorStop(1, '#9B7210');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, CW, HEADER_H);

  // Bottom border of header
  ctx.fillStyle = '#5C2D0A';
  ctx.fillRect(0, HEADER_H - 4, CW, 4);

  // Shop name
  ctx.fillStyle = '#FFF8DC';
  ctx.font = "bold 20px 'Bowlby One SC', Impact, sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText("SHEP'S NEWSAGENT", 12, 30);

  // Score (right side)
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "bold 16px 'Bowlby One SC', Impact, sans-serif";
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${G.score}`, CW - 12, 28);

  // Round indicator (center)
  if (G.state !== 'TITLE' && G.state !== 'INTRO' && G.round < ROUNDS.length) {
    ctx.fillStyle = '#FFF8DC';
    ctx.font = "13px 'Bowlby One SC', Impact, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${G.round + 1} / ${ROUNDS.length}`, CW / 2, 28);
  }

  // Throws left (during aiming)
  if (G.state === 'AIMING') {
    const targetId = getCurrentTargetId();
    const target = SHELF_ITEMS[targetId];
    ctx.fillStyle = '#CC0000';
    ctx.font = "bold 11px 'Bowlby One SC', Impact, sans-serif";
    ctx.textAlign = 'left';
    const throwsStr = '●'.repeat(G.throwsLeft) + '○'.repeat(3 - G.throwsLeft);
    ctx.fillText(`THROWS: ${throwsStr}  |  TARGET: ${target ? target.label.toUpperCase() : ''}`, 12, 30);
  }
}

// ===== CUSTOMER REQUEST PANEL =====
function drawCustomerRequest(ts) {
  if (!G.currentRound) return;
  if (G.state === 'INTRO' && G.introStep < 3) return; // Don't show until intro finishes

  const cid = G.currentRound.customerId;
  const cdata = CHARACTER_DATA[cid];
  const line = G.currentRound.line;

  // Panel at top of character area
  const px = CW / 2 - 200;
  const py = COUNTER_Y - 48;
  const pw = 400, ph = 44;

  // Request box
  ctx.fillStyle = 'rgba(255, 253, 231, 0.95)';
  ctx.strokeStyle = '#5C2D0A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 6);
  ctx.fill(); ctx.stroke();

  // Customer's speech in the box
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.font = 'italic 12px Georgia, serif';

  const words = line.split(' ');
  const lns = [];
  let cur2 = '';
  words.forEach(w => {
    const test = cur2 ? cur2 + ' ' + w : w;
    if (ctx.measureText(test).width < pw - 20) { cur2 = test; }
    else { if (cur2) lns.push(cur2); cur2 = w; }
  });
  if (cur2) lns.push(cur2);

  const usedLines = lns.slice(0, 2);
  usedLines.forEach((l, i) => {
    ctx.fillText(l, CW / 2, py + 15 + i * 16);
  });
}

// ===== TITLE SCREEN AVATARS =====
function renderTitleAvatars() {
  (['chris', 'barrie']).forEach(id => {
    const avatarCanvas = document.getElementById('title-canvas-' + id);
    if (!avatarCanvas) return;
    const ac = avatarCanvas.getContext('2d');
    ac.clearRect(0, 0, 120, 150);
    drawCharacter(ac, id, 60, 70, 1.1, 'smile');
    // Name tag
    ac.font = 'bold 12px Arial';
    ac.fillStyle = '#FFD700';
    ac.textAlign = 'center';
    ac.fillText(CHARACTER_DATA[id].name, 60, 136);
  });
}

// ===== INIT =====
function init() {
  resetGame();
  setupInput();
  setupButtons();
  renderTitleAvatars();
  requestAnimationFrame(loop);
}

window.addEventListener('DOMContentLoaded', init);
