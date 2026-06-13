'use strict';

// ===== BONUS ROUND DEFINITIONS =====
// Three local shops, each with a distinctly different minigame "flavour":
//   Beech's Butchers — tap the right swinging cut before it swings past
//   Ken's Chippy     — stop the frying needle bang in the perfect zone
//   Banny's Bakery   — catch the right bakes as they tumble off the shelf
const BONUS_SHOPS = {
  butchers: {
    id: 'butchers',
    name: "Beech's Butchers",
    ownerId: 'beech',
    tagline: 'Best Cuts in Barrowford',
    wallColor: '#EFE6DC',
    accentColor: '#B03020',
    floorColor: '#7A6048',
  },
  chippy: {
    id: 'chippy',
    name: "Ken's Chippy",
    ownerId: 'ken',
    tagline: 'Fish, Chips & Banter',
    wallColor: '#DCEEF5',
    accentColor: '#2299CC',
    floorColor: '#5C4830',
  },
  bakery: {
    id: 'bakery',
    name: "Banny's Bakery",
    ownerId: 'banny',
    tagline: 'Fresh Baked Daily',
    wallColor: '#FBE4ED',
    accentColor: '#D45C8A',
    floorColor: '#8B6F4E',
  }
};

// Which bonus shop pops up before which main round starts (round indices are
// 0-based, so this fires before the 2nd, 3rd and 4th customers).
const BONUS_TRIGGERS = { 1: 'butchers', 2: 'chippy', 3: 'bakery' };

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function sayBonusPhrase(ownerId, type) {
  const data = CHARACTER_DATA[ownerId];
  if (!data) return;
  const list = type === 'hit' ? data.catchphrases : data.missPhrases;
  if (list && list.length) {
    showSpeech(ownerId, list[Math.floor(Math.random() * list.length)], 2200);
  }
}

// ===== FLOW CONTROL =====
function startBonusRound(type) {
  const shop = BONUS_SHOPS[type];
  G.bonus = {
    type, shop,
    phase: 'intro',
    phaseTimer: performance.now(),
    score: 0,
  };
  G.speech = null;
  G.state = 'BONUS_INTRO';
  setThrowBarVisible(false);
  showSpeech(shop.ownerId, `Ay up! Welcome to ${shop.name} — fancy a quick go on us bonus challenge?`, 3400);
}

function beginBonusGame(b) {
  G.state = 'BONUS_PLAYING';
  b.phase = 'playing';
  b.phaseTimer = performance.now();
  G.speech = null;
  if (b.type === 'butchers') initButchers(b);
  else if (b.type === 'chippy') initChippy(b);
  else if (b.type === 'bakery') initBakery(b);
}

function finishBonusGame(b, summaryLine) {
  G.score += b.score;
  G.state = 'BONUS_RESULT';
  b.phase = 'result';
  b.phaseTimer = performance.now();
  showSpeech(b.shop.ownerId, summaryLine, 2600);
  playSound(b.score > 0 ? 'fanfare' : 'miss');
}

function endBonusRound() {
  G.bonus = null;
  G.speech = null;
  setThrowBarVisible(true);
  enableThrowButtons();
  G.currentRound = ROUNDS[G.round];
  G.state = 'ROUND_START';
  G.stateTimer = performance.now();
}

function updateBonus(ts, dt) {
  const b = G.bonus;
  if (!b) return;

  if (G.state === 'BONUS_INTRO') {
    if (ts - b.phaseTimer > 3600) beginBonusGame(b);
    return;
  }
  if (G.state === 'BONUS_PLAYING') {
    if (b.type === 'butchers') updateButchers(ts, dt);
    else if (b.type === 'chippy') updateChippy(ts, dt);
    else if (b.type === 'bakery') updateBakery(ts, dt);
    return;
  }
  if (G.state === 'BONUS_RESULT') {
    if (ts - b.phaseTimer > 2800) endBonusRound();
  }
}

function handleBonusTap(x, y) {
  const b = G.bonus;
  if (!b || G.state !== 'BONUS_PLAYING') return;
  if (b.type === 'butchers') tapButchers(b, x, y);
  else if (b.type === 'chippy') tapChippy(b, x, y);
  else if (b.type === 'bakery') tapBakery(b, x, y);
}

// ===== SHARED SCENE CHROME =====
function drawBonusChrome(b) {
  const shop = b.shop;

  ctx.fillStyle = shop.wallColor;
  ctx.fillRect(0, HEADER_H, CW, COUNTER_Y - HEADER_H);

  const floorGrad = ctx.createLinearGradient(0, COUNTER_Y + 55, 0, CH);
  floorGrad.addColorStop(0, lightenHex(shop.floorColor, 12));
  floorGrad.addColorStop(1, darkenHex(shop.floorColor, 28));
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, COUNTER_Y + 55, CW, CH - (COUNTER_Y + 55));

  const cg = ctx.createLinearGradient(0, COUNTER_Y, 0, COUNTER_Y + 55);
  cg.addColorStop(0, lightenHex(shop.accentColor, 70));
  cg.addColorStop(1, darkenHex(shop.accentColor, 30));
  ctx.fillStyle = cg;
  ctx.fillRect(0, COUNTER_Y, CW, 55);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, COUNTER_Y + 52, CW, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, COUNTER_Y, CW, 3);

  const hg = ctx.createLinearGradient(0, 0, 0, HEADER_H);
  hg.addColorStop(0, lightenHex(shop.accentColor, 40));
  hg.addColorStop(1, shop.accentColor);
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, CW, HEADER_H);
  ctx.fillStyle = '#5C2D0A';
  ctx.fillRect(0, HEADER_H - 4, CW, 4);

  ctx.fillStyle = '#FFF8DC';
  ctx.font = "bold 18px 'Bowlby One SC', Impact, sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(shop.name.toUpperCase(), 12, 30);

  ctx.fillStyle = '#1a1a1a';
  ctx.font = "bold 15px 'Bowlby One SC', Impact, sans-serif";
  ctx.textAlign = 'right';
  ctx.fillText(`BONUS: +${b.score}`, CW - 12, 28);
}

function renderBonus(ts) {
  const b = G.bonus;
  if (!b) return;

  if (G.state === 'BONUS_INTRO') {
    drawBonusChrome(b);
    drawCharacter(ctx, b.shop.ownerId, CUSTOMER_X, CHAR_HEAD_Y, 1.05, 'grin');

    ctx.fillStyle = 'rgba(255,253,231,0.95)';
    ctx.strokeStyle = '#5C2D0A';
    ctx.lineWidth = 2.5;
    const bw = 360, bh = 64;
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, HEADER_H + 56, bw, bh, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = "bold 18px 'Bowlby One SC', Impact, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('★ BONUS ROUND! ★', CW / 2, HEADER_H + 82);
    ctx.font = "italic 13px Georgia, serif";
    ctx.fillStyle = '#5C2D0A';
    ctx.fillText(b.shop.tagline, CW / 2, HEADER_H + 104);
    return;
  }

  if (b.type === 'butchers') renderButchers(b, ts);
  else if (b.type === 'chippy') renderChippy(b, ts);
  else if (b.type === 'bakery') renderBakery(b, ts);

  if (G.state === 'BONUS_RESULT') {
    ctx.fillStyle = 'rgba(20,10,2,0.55)';
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#FFD700';
    ctx.font = "bold 28px 'Bowlby One SC', Impact, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`+${b.score} POINTS!`, CW / 2, CH / 2 - 8);
    ctx.fillStyle = '#FFF8DC';
    ctx.font = "16px 'Bowlby One SC', Impact, sans-serif";
    ctx.fillText(`${b.shop.name} bonus complete!`, CW / 2, CH / 2 + 24);
  }
}

// =====================================================================
// BEECH'S BUTCHERS — "Sausage Swing"
// Cuts of meat swing on hooks like pendulums; tap the one called out
// before it swings past. Reflexes + a bit of timing/prediction.
// =====================================================================
const MEAT_ITEMS = [
  { label: 'Pork Sausages', color: '#C9806A' },
  { label: 'Black Pudding', color: '#3A2A28' },
  { label: 'Lamb Chops',    color: '#D9A282' },
  { label: 'Bacon Joint',   color: '#E8A8A0' },
  { label: 'Steak Pie',     color: '#B07840' },
  { label: 'Faggots',       color: '#8B5A40' },
];

function initButchers(b) {
  b.round = 0;
  b.totalRounds = 3;
  setupButchersRound(b);
}

function setupButchersRound(b) {
  const pool = shuffle(MEAT_ITEMS.slice()).slice(0, 3);
  const targetIdx = Math.floor(Math.random() * 3);
  const baseSpeed = 0.0017 + b.round * 0.0006;

  b.hooks = pool.map((item, i) => ({
    label: item.label,
    color: item.color,
    anchorX: CW * (0.28 + i * 0.22),
    anchorY: HEADER_H + 56,
    amplitude: 36 + Math.random() * 18,
    speed: baseSpeed * (0.85 + Math.random() * 0.4),
    phase: Math.random() * Math.PI * 2,
    isTarget: i === targetIdx,
  }));
  b.targetLabel = b.hooks[targetIdx].label;
  b.subPhase = 'announce';
  b.subTimer = performance.now();
  b.resolved = false;
  b.timeLimit = 6000;
  b.playStart = 0;

  showSpeech('beech', `Right then — give us the ${b.targetLabel.toUpperCase()}, sharpish!`, 2300);
}

function updateButchers(ts, dt) {
  const b = G.bonus;
  if (b.subPhase === 'announce') {
    if (ts - b.subTimer > 1700) {
      b.subPhase = 'playing';
      b.subTimer = ts;
      b.playStart = ts;
    }
    return;
  }
  if (b.subPhase === 'playing') {
    if (!b.resolved && ts - b.playStart > b.timeLimit) {
      resolveButchersRound(b, false, CW / 2, HEADER_H + 150);
    }
    return;
  }
  if (b.subPhase === 'feedback') {
    if (ts - b.subTimer > 1500) {
      b.round++;
      if (b.round >= b.totalRounds) {
        finishBonusGame(b, b.score >= 110
          ? "Cor, you've a butcher's eye on you! Champion work, that!"
          : "Not bad at all — you'll get the hang of them hooks!");
      } else {
        setupButchersRound(b);
      }
    }
  }
}

function tapButchers(b, x, y) {
  if (b.subPhase !== 'playing' || b.resolved) return;
  const ts = performance.now();
  for (const hook of b.hooks) {
    const sway = Math.sin((ts - b.playStart) * hook.speed + hook.phase) * hook.amplitude;
    const hx = hook.anchorX + sway;
    const hy = hook.anchorY + 78;
    if (x >= hx - 28 && x <= hx + 28 && y >= hy - 32 && y <= hy + 32) {
      resolveButchersRound(b, hook.isTarget, hx, hy);
      return;
    }
  }
  G.floats.push({ x, y, text: 'MISS', opacity: 1, vy: 1.2, color: '#FF6666', size: 14 });
}

function resolveButchersRound(b, success, fx, fy) {
  b.resolved = true;
  b.subPhase = 'feedback';
  b.subTimer = performance.now();

  if (success) {
    const elapsed = performance.now() - b.playStart;
    const speedBonus = Math.max(0, Math.round((1 - elapsed / b.timeLimit) * 30));
    const pts = 40 + speedBonus;
    b.score += pts;
    G.floats.push({ x: fx, y: fy - 30, text: `+${pts}`, opacity: 1, vy: 1.3, color: '#FFD700', size: 22 });
    G.floats.push({ x: fx, y: fy - 52, text: 'GOT IT!', opacity: 1, vy: 1.0, color: '#3FCB5A', size: 16 });
    sayBonusPhrase('beech', 'hit');
    playSound('hit');
  } else {
    G.floats.push({ x: fx, y: fy - 30, text: 'WRONG CUT!', opacity: 1, vy: 1.1, color: '#FF6666', size: 16 });
    sayBonusPhrase('beech', 'miss');
    playSound('miss');
  }
}

function renderButchers(b, ts) {
  drawBonusChrome(b);

  // Meat rail
  ctx.fillStyle = '#8B6F4E';
  ctx.fillRect(CW * 0.18, HEADER_H + 38, CW * 0.64, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(CW * 0.18, HEADER_H + 46, CW * 0.64, 3);

  const elapsed = ts - b.playStart;
  b.hooks.forEach(hook => {
    const sway = (b.subPhase === 'playing') ? Math.sin(elapsed * hook.speed + hook.phase) * hook.amplitude : 0;
    const hx = hook.anchorX + sway;
    const cy = hook.anchorY + 78;

    // Chain
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hook.anchorX, hook.anchorY);
    ctx.lineTo(hx, cy - 32);
    ctx.stroke();

    // Cut of meat
    ctx.save();
    ctx.translate(hx, cy);
    ctx.fillStyle = hook.color;
    ctx.strokeStyle = darkenHex(hook.color, 40);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-28, -32, 56, 64, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = "bold 10px Arial";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrapText(hook.label, 50);
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, i * 12 - (lines.length - 1) * 6);
    });
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  });

  // Order banner
  ctx.fillStyle = 'rgba(255,253,231,0.92)';
  ctx.strokeStyle = '#5C2D0A';
  ctx.lineWidth = 2;
  const bw = 300, bh = 32;
  ctx.beginPath();
  ctx.roundRect(CW / 2 - bw / 2, COUNTER_Y - 46, bw, bh, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "bold 13px 'Bowlby One SC', Impact, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(`ORDER ${Math.min(b.round + 1, b.totalRounds)}/${b.totalRounds}: ${b.targetLabel.toUpperCase()}`, CW / 2, COUNTER_Y - 26);

  if (b.subPhase === 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = "12px Arial";
    ctx.fillText('Tap the right cut before it swings away!', CW / 2, HEADER_H + 26);
  } else if (b.subPhase === 'announce') {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = "12px Arial";
    ctx.fillText('Get ready...', CW / 2, HEADER_H + 26);
  }

  drawCharacter(ctx, b.shop.ownerId, CUSTOMER_X, CHAR_HEAD_Y, 0.95, 'smile');
}

// =====================================================================
// KEN'S CHIPPY — "Perfect Fry"
// A needle sweeps across a frying gauge; tap to stop it bang in the
// green "perfectly fried" zone. Pure precision timing — no aiming.
// =====================================================================
function initChippy(b) {
  b.round = 0;
  b.totalRounds = 3;
  b.items = ['Chips', 'Battered Fish', 'Meat & Potato Pie'];
  setupChippyRound(b);
}

function setupChippyRound(b) {
  b.subPhase = 'announce';
  b.subTimer = performance.now();
  b.resolved = false;
  b.itemLabel = b.items[b.round];
  b.needlePos = 0;
  b.needleDir = 1;
  b.needleSpeed = 0.00075 + b.round * 0.00028;
  b.lastResultText = null;
  b.lastResultColor = null;

  const perfectW = 0.16 - b.round * 0.035;
  const goodPad = 0.16;
  const center = 0.32 + Math.random() * 0.36;
  b.zone = {
    perfectStart: center - perfectW / 2,
    perfectEnd: center + perfectW / 2,
    goodStart: center - perfectW / 2 - goodPad,
    goodEnd: center + perfectW / 2 + goodPad,
  };

  showSpeech('ken', `Let's get this ${b.itemLabel.toLowerCase()} cooked just right — tap when you reckon it's perfect!`, 2600);
}

function updateChippy(ts, dt) {
  const b = G.bonus;
  if (b.subPhase === 'announce') {
    if (ts - b.subTimer > 2200) { b.subPhase = 'playing'; b.subTimer = ts; }
    return;
  }
  if (b.subPhase === 'playing') {
    b.needlePos += b.needleDir * b.needleSpeed * dt;
    if (b.needlePos >= 1) { b.needlePos = 1; b.needleDir = -1; }
    if (b.needlePos <= 0) { b.needlePos = 0; b.needleDir = 1; }
    return;
  }
  if (b.subPhase === 'feedback') {
    if (ts - b.subTimer > 1700) {
      b.round++;
      if (b.round >= b.totalRounds) {
        finishBonusGame(b, b.score >= 110
          ? "Now THAT'S what I call a fish supper — magic timing, that!"
          : "Decent effort — practice makes perfect chips, lad!");
      } else {
        setupChippyRound(b);
      }
    }
  }
}

function tapChippy(b, x, y) {
  if (b.subPhase !== 'playing' || b.resolved) return;
  b.resolved = true;
  b.subPhase = 'feedback';
  b.subTimer = performance.now();

  const pos = b.needlePos;
  const z = b.zone;
  let pts = 0, text = '', color = '';
  if (pos >= z.perfectStart && pos <= z.perfectEnd) {
    pts = 50; text = 'PERFECTLY FRIED!'; color = '#3FCB5A';
  } else if (pos >= z.goodStart && pos <= z.goodEnd) {
    pts = 25; text = 'A BIT CRISPY!'; color = '#FFD700';
  } else {
    pts = 0;
    text = pos < z.goodStart ? 'STILL RAW!' : 'BURNT TO A CRISP!';
    color = '#FF6666';
  }
  b.score += pts;
  b.lastResultText = text;
  b.lastResultColor = color;
  G.floats.push({ x: CW / 2, y: COUNTER_Y - 78, text: pts > 0 ? `+${pts}` : 'NO POINTS', opacity: 1, vy: 1.2, color, size: 22 });
  sayBonusPhrase('ken', pts > 0 ? 'hit' : 'miss');
  playSound(pts > 0 ? 'hit' : 'miss');
}

function renderChippy(b, ts) {
  drawBonusChrome(b);

  const barX = CW * 0.18, barW = CW * 0.64;
  const barY = HEADER_H + 92, barH = 34;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 8);
  ctx.clip();
  const z = b.zone;
  ctx.fillStyle = '#C0392B';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#E8B530';
  ctx.fillRect(barX + Math.max(0, z.goodStart) * barW, barY,
    (Math.min(1, z.goodEnd) - Math.max(0, z.goodStart)) * barW, barH);
  ctx.fillStyle = '#3FCB5A';
  ctx.fillRect(barX + z.perfectStart * barW, barY, (z.perfectEnd - z.perfectStart) * barW, barH);
  ctx.restore();

  ctx.strokeStyle = '#5C2D0A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 8);
  ctx.stroke();

  // Needle
  const nx = barX + b.needlePos * barW;
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(nx, barY - 12);
  ctx.lineTo(nx, barY + barH + 12);
  ctx.stroke();
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#5C2D0A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(nx, barY - 12, 6, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = b.shop.accentColor;
  ctx.font = "bold 15px 'Bowlby One SC', Impact, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(`FRYING: ${b.itemLabel.toUpperCase()}  (${Math.min(b.round + 1, b.totalRounds)}/${b.totalRounds})`, CW / 2, barY - 24);

  ctx.font = "13px Arial";
  if (b.subPhase === 'announce') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText('Tap to stop the needle in the green zone!', CW / 2, barY + barH + 38);
  } else if (b.subPhase === 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = "bold 14px 'Bowlby One SC', Impact, sans-serif";
    ctx.fillText('TAP NOW!', CW / 2, barY + barH + 40);
  } else if (b.subPhase === 'feedback' && b.lastResultText) {
    ctx.fillStyle = b.lastResultColor;
    ctx.font = "bold 17px 'Bowlby One SC', Impact, sans-serif";
    ctx.fillText(b.lastResultText, CW / 2, barY + barH + 42);
  }

  drawCharacter(ctx, b.shop.ownerId, CUSTOMER_X, CHAR_HEAD_Y, 0.95, 'smile');
}

// =====================================================================
// BANNY'S BAKERY — "Catch the Order"
// Bakes tumble down from the shelf in three lanes; tap the ones that
// match the order and leave the decoys well alone. Fast reactions.
// =====================================================================
const BAKE_ITEMS = [
  { label: 'Vanilla Slice',   color: '#F5E6C8' },
  { label: 'Cherry Bakewell', color: '#D9405A' },
  { label: 'Cream Horn',      color: '#F0D8B0' },
  { label: 'Iced Bun',        color: '#F2A8C0' },
  { label: 'Sausage Roll',    color: '#C8975A' },
  { label: 'Scotch Egg',      color: '#D4A85C' },
  { label: 'Pork Pie',        color: '#B07840' },
];

function initBakery(b) {
  const pool = shuffle(BAKE_ITEMS.slice());
  b.target = pool[0];
  b.decoys = pool.slice(1, 4);
  b.targetCount = 5;
  b.caught = 0;
  b.timeLimit = 22000;
  b.startTs = 0;
  b.subPhase = 'announce';
  b.subTimer = performance.now();
  b.lanes = [CW * 0.28, CW * 0.5, CW * 0.72];
  b.fallItems = [];
  b.spawnTimer = 0;
  b.spawnInterval = 1050;

  showSpeech('banny', `I need ${b.targetCount} ${b.target.label}s — catch 'em as they come off't shelf, and don't go grabbing owt else!`, 3400);
}

function spawnBakeItem(b) {
  const isTarget = Math.random() < 0.5;
  const item = isTarget ? b.target : b.decoys[Math.floor(Math.random() * b.decoys.length)];
  const lane = Math.floor(Math.random() * b.lanes.length);
  b.fallItems.push({
    label: item.label, color: item.color, isTarget,
    x: b.lanes[lane],
    y: HEADER_H + 96,
    speed: 0.07 + Math.random() * 0.03,
  });
}

function updateBakery(ts, dt) {
  const b = G.bonus;
  if (b.subPhase === 'announce') {
    if (ts - b.subTimer > 3000) {
      b.subPhase = 'playing';
      b.subTimer = ts;
      b.startTs = ts;
      b.spawnTimer = ts;
    }
    return;
  }
  if (b.subPhase === 'playing') {
    const elapsed = ts - b.startTs;

    if (ts - b.spawnTimer > b.spawnInterval && b.fallItems.length < 4) {
      spawnBakeItem(b);
      b.spawnTimer = ts;
      b.spawnInterval = Math.max(620, 1050 - elapsed * 0.018);
    }

    const catchY = COUNTER_Y - 6;
    b.fallItems = b.fallItems.filter(it => {
      it.y += it.speed * dt;
      if (it.y > catchY) {
        if (it.isTarget) {
          G.floats.push({ x: it.x, y: catchY, text: 'MISSED!', opacity: 1, vy: 1.1, color: '#FF6666', size: 14 });
        }
        return false;
      }
      return true;
    });

    if (b.caught >= b.targetCount || elapsed > b.timeLimit) {
      b.subPhase = 'feedback';
      b.subTimer = ts;
      b.fallItems = [];
    }
    return;
  }
  if (b.subPhase === 'feedback') {
    if (ts - b.subTimer > 2200) {
      finishBonusGame(b, b.caught >= b.targetCount
        ? "Ooh, a natural! You'd run rings round our Saturday girl, you would!"
        : "Good effort, love — the ovens wait for no one, mind!");
    }
  }
}

function tapBakery(b, x, y) {
  if (b.subPhase !== 'playing') return;
  for (let i = b.fallItems.length - 1; i >= 0; i--) {
    const it = b.fallItems[i];
    if (x >= it.x - 32 && x <= it.x + 32 && y >= it.y - 28 && y <= it.y + 28) {
      b.fallItems.splice(i, 1);
      if (it.isTarget) {
        b.caught++;
        b.score += 25;
        G.floats.push({ x: it.x, y: it.y, text: '+25', opacity: 1, vy: 1.3, color: '#FFD700', size: 20 });
        playSound('hit');
      } else {
        b.score = Math.max(0, b.score - 10);
        G.floats.push({ x: it.x, y: it.y, text: 'OOPS! −10', opacity: 1, vy: 1.3, color: '#FF6666', size: 16 });
        playSound('miss');
      }
      return;
    }
  }
}

function renderBakery(b, ts) {
  drawBonusChrome(b);

  // Order banner
  ctx.fillStyle = 'rgba(255,253,231,0.92)';
  ctx.strokeStyle = '#5C2D0A';
  ctx.lineWidth = 2;
  const bw = 320, bh = 30;
  ctx.beginPath();
  ctx.roundRect(CW / 2 - bw / 2, HEADER_H + 16, bw, bh, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = "bold 12px 'Bowlby One SC', Impact, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(`CATCH: ${b.target.label.toUpperCase()}  (${b.caught}/${b.targetCount})`, CW / 2, HEADER_H + 36);

  // Falling bakes
  b.fallItems.forEach(it => {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.fillStyle = it.color;
    ctx.strokeStyle = darkenHex(it.color, 40);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = "bold 9px Arial";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrapText(it.label, 52);
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, i * 11 - (lines.length - 1) * 5.5);
    });
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  });

  // Catch-line hint
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CW * 0.12, COUNTER_Y - 6);
  ctx.lineTo(CW * 0.88, COUNTER_Y - 6);
  ctx.stroke();
  ctx.setLineDash([]);

  if (b.subPhase === 'announce') {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = "12px Arial";
    ctx.textAlign = 'center';
    ctx.fillText('Tap the right bakes as they fall — leave the rest be!', CW / 2, COUNTER_Y - 16);
  }

  drawCharacter(ctx, b.shop.ownerId, CUSTOMER_X, CHAR_HEAD_Y, 0.95, 'smile');
}
