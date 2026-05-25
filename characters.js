// Character definitions and Canvas 2D drawing system
// drawCharacter(ctx, charId, cx, cy, scale, expression) draws a character
// with head centered at (cx, cy). Body extends downward.

const CHARACTER_DATA = {
  chris: {
    name: 'Chris', role: 'Owner',
    gender: 'female',
    skinTone: '#F2C9A0',
    faceW: 58, faceH: 70,
    hairColor: '#5C3318', hairStyle: 'bob',
    eyeColor: '#4169E1', hasGlasses: true,
    noseTip: 'button',
    baseExpression: 'smile',
    collarColor: '#CC5588', collarStyle: 'scoop',
    catchphrases: [
      "Super, smashing, great!",
      "What a throw! Lovely jubbly!",
      "By 'eck, that's champion!",
      "The crowd goes wild!",
      "Magnificent! Absolutely magnificent!"
    ],
    missPhrases: [
      "Ooh, not quite love!",
      "Nearly! Have another go!",
      "You need 101 and in!",
      "Just a touch wide there!"
    ]
  },
  barrie: {
    name: 'Barrie', role: 'Owner',
    gender: 'male',
    skinTone: '#FDBCB4',
    faceW: 60, faceH: 72,
    hairColor: '#D4B060', hairStyle: 'short-side-part',
    eyeColor: '#4A7C59', hasGlasses: false,
    hasMoustache: false,
    noseTip: 'normal',
    baseExpression: 'grin',
    collarColor: '#2244AA', collarStyle: 'collar',
    catchphrases: [
      "Cracking stuff!",
      "Champion! Right on target!",
      "That's Barrowford's finest at work!",
      "You can't beat a trip to Shep's!",
      "By 'eck, right between the eyes!"
    ],
    missPhrases: [
      "Nay, nay and thrice nay!",
      "Oh deary me!",
      "That's gone a bit wide!",
      "Have another pop at it!"
    ]
  },
  martin: {
    name: 'Martin', role: 'Staff',
    gender: 'male',
    skinTone: '#F5CBA7',
    faceW: 54, faceH: 64,
    hairColor: '#E0C040', hairStyle: 'floppy',
    eyeColor: '#228B22', hasGlasses: false,
    hasMoustache: false,
    hasFreckles: true,
    noseTip: 'button',
    baseExpression: 'friendly',
    collarColor: '#CC4400', collarStyle: 'collar',
    catchphrases: ["Coming right up!", "No problem at all!", "There you go!"]
  },
  david: {
    name: 'David', role: 'Staff',
    gender: 'male',
    skinTone: '#C8886A',
    faceW: 54, faceH: 66,
    hairColor: '#1A1A1A', hairStyle: 'neat-short',
    eyeColor: '#4A2800', hasGlasses: true,
    hasMoustache: false,
    noseTip: 'normal',
    baseExpression: 'neutral',
    collarColor: '#228B22', collarStyle: 'collar',
    catchphrases: ["Right away!", "Here we are!", "Cheers!"]
  },
  wilf: {
    name: 'Wilf', role: 'Customer',
    gender: 'male',
    skinTone: '#DEB887',
    faceW: 60, faceH: 72,
    hairColor: '#C8C8C8', hairStyle: 'wispy',
    eyeColor: '#888888', hasGlasses: false,
    hasMoustache: false,
    hasWrinkles: true,
    hasHearingAid: true,
    noseTip: 'bulbous',
    baseExpression: 'friendly-old',
    collarColor: '#7A5C3A', collarStyle: 'collar',
    requestLine: "Could I have me Daily Mirror and twenty Bensons, love? Me legs aren't what they were!"
  },
  simon: {
    name: 'Simon', role: 'Customer',
    gender: 'male',
    skinTone: '#D4956A',
    faceW: 62, faceH: 74,
    hairColor: '#4A3020', hairStyle: 'sideburns',
    eyeColor: '#8B6914', hasGlasses: false,
    hasMoustache: false,
    noseTip: 'normal',
    baseExpression: 'smile',
    collarColor: '#CC6600', collarStyle: 'wide-collar',
    requestLine: "Sun and a Mars Bar please, mate. Big match today!"
  },
  jordan: {
    name: 'Jordan', role: 'Customer',
    gender: 'male',
    skinTone: '#F5CBA7',
    faceW: 50, faceH: 60,
    hairColor: '#C8A050', hairStyle: 'long',
    eyeColor: '#4169E1', hasGlasses: false,
    hasMoustache: false,
    noseTip: 'button',
    baseExpression: 'wide-eyed',
    collarColor: '#884499', collarStyle: 'collar',
    requestLine: "TV Times and a Kit Kat please! Dead excited!"
  },
  betty: {
    name: 'Betty', role: 'Customer',
    gender: 'female',
    skinTone: '#E0B080',
    faceW: 56, faceH: 66,
    hairColor: '#AAAAAA', hairStyle: 'perm',
    eyeColor: '#8B6914', hasGlasses: false,
    hasHeadscarf: true,
    noseTip: 'button',
    baseExpression: 'pursed',
    collarColor: '#884488', collarStyle: 'scoop',
    requestLine: "Radio Times and the Express please, pet."
  },
  derek: {
    name: 'Derek', role: 'Customer',
    gender: 'male',
    skinTone: '#C89060',
    faceW: 58, faceH: 68,
    hairColor: '#6B4226', hairStyle: 'thinning',
    eyeColor: '#808080', hasGlasses: false,
    hasThinMoustache: true,
    noseTip: 'long',
    baseExpression: 'worried',
    collarColor: '#446688', collarStyle: 'collar',
    requestLine: "Twenty Embassy and one of them mix bags, if you please."
  }
};

function drawCharacter(ctx, charId, cx, cy, scale, expression) {
  const p = CHARACTER_DATA[charId];
  if (!p) return;
  const expr = expression || p.baseExpression;
  const hw = p.faceW / 2;
  const hh = p.faceH / 2;

  ctx.save();
  ctx.translate(cx, cy);
  if (scale && scale !== 1) ctx.scale(scale, scale);

  // --- Body / collar ---
  drawBody(ctx, p, hw, hh);

  // --- Neck ---
  ctx.fillStyle = p.skinTone;
  ctx.fillRect(-8, hh - 2, 16, 22);

  // --- Ears ---
  drawEars(ctx, p, hw, hh);

  // --- Head ---
  ctx.fillStyle = p.skinTone;
  ctx.beginPath();
  if (p.gender === 'female') {
    // Slightly softer, rounder oval
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  } else {
    // Slightly squarer jaw for males
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.strokeStyle = darken(p.skinTone, 30);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // --- Hair (drawn over top of head) ---
  drawHair(ctx, p, hw, hh);

  // --- Eyes ---
  drawEyes(ctx, p, hw, hh, expr);

  // --- Glasses ---
  if (p.hasGlasses) drawGlasses(ctx, p, hw, hh);

  // --- Nose ---
  drawNose(ctx, p, hh);

  // --- Mouth ---
  drawMouth(ctx, p, hh, expr);

  // --- Facial hair ---
  if (p.hasMoustache) drawMoustache(ctx, p, hh, '#5C3A1E');
  if (p.hasThinMoustache) drawThinMoustache(ctx, p, hh);

  // --- Freckles ---
  if (p.hasFreckles) drawFreckles(ctx, hw);

  // --- Wrinkles ---
  if (p.hasWrinkles) drawWrinkles(ctx, hw, hh);

  // --- Hearing aid ---
  if (p.hasHearingAid) drawHearingAid(ctx, hw);

  // --- Headscarf ---
  if (p.hasHeadscarf) drawHeadscarf(ctx, p, hw, hh);

  // --- Name tag (small, below body) ---

  ctx.restore();
}

function drawBody(ctx, p, hw, hh) {
  const bodyTop = hh + 18;
  const bodyH = 55;
  // Shirt/top body
  ctx.fillStyle = p.collarColor;
  ctx.beginPath();
  if (p.collarStyle === 'scoop') {
    // Rounded scoop neck for female characters
    ctx.moveTo(-hw - 10, bodyTop + bodyH);
    ctx.lineTo(-hw - 10, bodyTop + 15);
    ctx.quadraticCurveTo(-hw, bodyTop, 0, bodyTop + 5);
    ctx.quadraticCurveTo(hw, bodyTop, hw + 10, bodyTop + 15);
    ctx.lineTo(hw + 10, bodyTop + bodyH);
    ctx.closePath();
  } else if (p.collarStyle === 'wide-collar') {
    // 70s wide collar
    ctx.moveTo(-hw - 12, bodyTop + bodyH);
    ctx.lineTo(-hw - 12, bodyTop + 8);
    ctx.lineTo(-8, bodyTop);
    ctx.lineTo(0, bodyTop + 12);
    ctx.lineTo(8, bodyTop);
    ctx.lineTo(hw + 12, bodyTop + 8);
    ctx.lineTo(hw + 12, bodyTop + bodyH);
    ctx.closePath();
  } else {
    // Standard shirt collar
    ctx.moveTo(-hw - 10, bodyTop + bodyH);
    ctx.lineTo(-hw - 10, bodyTop + 10);
    ctx.lineTo(-6, bodyTop + 4);
    ctx.lineTo(0, bodyTop + 10);
    ctx.lineTo(6, bodyTop + 4);
    ctx.lineTo(hw + 10, bodyTop + 10);
    ctx.lineTo(hw + 10, bodyTop + bodyH);
    ctx.closePath();
  }
  ctx.fill();
  ctx.strokeStyle = darken(p.collarColor, 40);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawEars(ctx, p, hw, hh) {
  ctx.fillStyle = p.skinTone;
  ctx.strokeStyle = darken(p.skinTone, 25);
  ctx.lineWidth = 1.2;
  // Left ear
  ctx.beginPath();
  ctx.ellipse(-hw - 5, 2, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Right ear
  ctx.beginPath();
  ctx.ellipse(hw + 5, 2, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
}

function drawHair(ctx, p, hw, hh) {
  ctx.fillStyle = p.hairColor;
  ctx.strokeStyle = darken(p.hairColor, 20);
  ctx.lineWidth = 1.5;

  switch (p.hairStyle) {
    case 'bob': {
      // Short brown bob for Chris — fits around sides of head to jaw level
      ctx.beginPath();
      ctx.arc(0, -hh * 0.3, hw + 6, Math.PI, 0);  // top cap
      ctx.lineTo(hw + 6, hh * 0.4);
      ctx.quadraticCurveTo(hw + 2, hh * 0.6, hw - 4, hh * 0.55);
      ctx.lineTo(-hw + 4, hh * 0.55);
      ctx.quadraticCurveTo(-hw - 2, hh * 0.6, -hw - 6, hh * 0.4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Part line
      ctx.strokeStyle = darken(p.hairColor, 40);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -hh);
      ctx.lineTo(-2, -hh * 0.5);
      ctx.stroke();
      break;
    }
    case 'short-side-part': {
      // Short blonde, side-parted for Barrie
      ctx.beginPath();
      ctx.arc(0, -hh * 0.25, hw + 5, Math.PI * 1.1, Math.PI * 0.02);
      ctx.lineTo(hw + 2, -hh * 0.1);
      ctx.lineTo(hw - 4, -hh * 0.05);
      ctx.lineTo(-hw + 6, -hh * 0.0);
      ctx.lineTo(-hw - 4, -hh * 0.05);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Side part line
      ctx.strokeStyle = darken(p.hairColor, 35);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.3, -hh);
      ctx.lineTo(-hw * 0.15, -hh * 0.3);
      ctx.stroke();
      break;
    }
    case 'floppy': {
      // Blond floppy hair for Martin — falls forward
      ctx.beginPath();
      ctx.arc(0, -hh * 0.3, hw + 7, Math.PI, 0);
      ctx.lineTo(hw + 4, -hh * 0.1);
      ctx.quadraticCurveTo(hw * 0.5, -hh * 0.15, hw * 0.2, -hh * 0.55);
      ctx.quadraticCurveTo(-hw * 0.2, -hh * 0.1, -hw - 5, -hh * 0.15);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Floppy fringe
      ctx.beginPath();
      ctx.moveTo(-hw * 0.6, -hh * 0.7);
      ctx.quadraticCurveTo(hw * 0.3, -hh * 0.4, hw * 0.7, -hh * 0.6);
      ctx.stroke();
      break;
    }
    case 'neat-short': {
      // Neat black hair for David
      ctx.beginPath();
      ctx.arc(0, -hh * 0.28, hw + 4, Math.PI * 1.05, Math.PI * 0.05);
      ctx.lineTo(hw + 1, -hh * 0.05);
      ctx.lineTo(-hw - 1, -hh * 0.05);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'wispy': {
      // White wispy hair for Wilf — thin and sparse
      ctx.lineWidth = 2;
      // A few sparse wisps
      const wisps = [[-hw*0.5,-hh*0.9],[0,-hh],[hw*0.3,-hh*0.85]];
      wisps.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(sx * 0.5, -hh * 0.7);
        ctx.quadraticCurveTo(sx * 0.8, sy + 4, sx, sy);
        ctx.stroke();
      });
      // Thin top patch
      ctx.fillStyle = p.hairColor;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(0, -hh * 0.8, hw * 0.55, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
      break;
    }
    case 'sideburns': {
      // Brown hair with massive 70s sideburns for Simon
      ctx.beginPath();
      ctx.arc(0, -hh * 0.28, hw + 5, Math.PI * 1.08, Math.PI * 0.08);
      ctx.lineTo(hw + 3, -hh * 0.05);
      ctx.lineTo(-hw - 3, -hh * 0.05);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Big sideburns — descend to jaw
      ctx.beginPath();
      ctx.moveTo(-hw + 2, -hh * 0.05);
      ctx.lineTo(-hw - 8, 0);
      ctx.lineTo(-hw - 10, hh * 0.55);
      ctx.lineTo(-hw + 2, hh * 0.5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hw - 2, -hh * 0.05);
      ctx.lineTo(hw + 8, 0);
      ctx.lineTo(hw + 10, hh * 0.55);
      ctx.lineTo(hw - 2, hh * 0.5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'long': {
      // Sandy long hair for Jordan — falls around shoulders
      // Left side
      ctx.beginPath();
      ctx.arc(0, -hh * 0.3, hw + 7, Math.PI, Math.PI * 0.15);
      ctx.lineTo(hw + 10, hh * 0.8);
      ctx.quadraticCurveTo(hw + 5, hh * 0.9, hw - 5, hh * 0.75);
      ctx.lineTo(hw - 3, hh * 0.1);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-hw - 7, -hh * 0.2);
      ctx.lineTo(-hw - 10, hh * 0.8);
      ctx.quadraticCurveTo(-hw - 5, hh * 0.9, -hw + 5, hh * 0.75);
      ctx.lineTo(-hw + 3, hh * 0.1);
      ctx.lineTo(-hw - 4, -hh * 0.1);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'perm': {
      // Grey permed curly hair for Betty — wide curly mass
      ctx.beginPath();
      const pCx = 0, pCy = -hh * 0.2, pR = hw + 18;
      for (let a = Math.PI; a >= 0; a -= 0.15) {
        const bumpR = pR + Math.sin(a * 6) * 7;
        ctx.lineTo(Math.cos(a) * bumpR + pCx, Math.sin(a) * bumpR + pCy);
      }
      ctx.lineTo(hw + 8, hh * 0.1);
      ctx.lineTo(-hw - 8, hh * 0.1);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'thinning': {
      // Thin thinning brown hair for Derek — bald patch, combover
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, -hh * 0.3, hw + 4, Math.PI * 1.1, Math.PI * 0.0);
      ctx.lineTo(hw, -hh * 0.05);
      ctx.quadraticCurveTo(0, -hh * 0.3, -hw, -hh * 0.05);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
      // Comb-over lines
      ctx.strokeStyle = darken(p.hairColor, 10);
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, -hh);
        ctx.quadraticCurveTo(i * 8 + 15, -hh * 0.5, i * 6 + 25, -hh * 0.2);
        ctx.stroke();
      }
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, -hh * 0.3, hw + 5, Math.PI, 0);
      ctx.lineTo(hw + 2, -hh * 0.05);
      ctx.lineTo(-hw - 2, -hh * 0.05);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }
}

function drawEyes(ctx, p, hw, hh, expression) {
  const eyeY = -hh * 0.18;
  const eyeSpacing = hw * 0.38;
  const eyeR = p.faceW < 55 ? 6 : 7;
  const isWideEyed = expression === 'wide-eyed';
  const actualR = isWideEyed ? eyeR * 1.3 : eyeR;

  [-eyeSpacing, eyeSpacing].forEach(ex => {
    // White
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, actualR, actualR * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Iris
    ctx.fillStyle = p.eyeColor;
    ctx.beginPath();
    ctx.arc(ex, eyeY, actualR * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(ex, eyeY, actualR * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(ex + actualR * 0.18, eyeY - actualR * 0.22, actualR * 0.18, 0, Math.PI * 2);
    ctx.fill();
  });

  // Eyebrows
  const browY = eyeY - actualR - 4;
  const browBend = expression === 'worried' ? 3 : expression === 'angry' ? -3 : 0;
  ctx.strokeStyle = p.hairColor === '#C8C8C8' || p.hairColor === '#AAAAAA' ? '#888888' : darken(p.hairColor, 10);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  [-eyeSpacing, eyeSpacing].forEach((ex, i) => {
    ctx.beginPath();
    ctx.moveTo(ex - eyeR + 1, browY + (i === 0 ? browBend : -browBend));
    ctx.quadraticCurveTo(ex, browY - 2, ex + eyeR - 1, browY + (i === 0 ? -browBend : browBend));
    ctx.stroke();
  });
}

function drawGlasses(ctx, p, hw, hh) {
  const eyeY = -hh * 0.18;
  const eyeSpacing = hw * 0.38;
  const glassR = p.faceW < 55 ? 10 : 11;

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(180,220,255,0.18)';

  [-eyeSpacing, eyeSpacing].forEach(ex => {
    ctx.beginPath();
    if (p.gender === 'female') {
      // Rounded cat-eye-ish frames for Chris
      ctx.ellipse(ex, eyeY, glassR + 1, glassR - 1, -0.12, 0, Math.PI * 2);
    } else {
      // Rectangular frames for David
      ctx.roundRect(ex - glassR, eyeY - glassR * 0.8, glassR * 2, glassR * 1.6, 3);
    }
    ctx.fill(); ctx.stroke();
  });

  // Bridge between lenses
  ctx.beginPath();
  ctx.moveTo(-eyeSpacing + glassR + 1, eyeY);
  ctx.lineTo(eyeSpacing - glassR - 1, eyeY);
  ctx.stroke();

  // Temple arms
  ctx.beginPath();
  ctx.moveTo(-eyeSpacing - glassR, eyeY - 2);
  ctx.lineTo(-hw - 4, eyeY - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(eyeSpacing + glassR, eyeY - 2);
  ctx.lineTo(hw + 4, eyeY - 2);
  ctx.stroke();
}

function drawNose(ctx, p, hh) {
  ctx.fillStyle = darken(p.skinTone, 15);
  ctx.strokeStyle = darken(p.skinTone, 30);
  ctx.lineWidth = 1;

  switch (p.noseTip) {
    case 'button': {
      ctx.beginPath();
      ctx.arc(0, hh * 0.08, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bulbous': {
      ctx.beginPath();
      ctx.arc(0, hh * 0.08, 7, 0, Math.PI * 2);
      ctx.fill();
      // Nostrils
      ctx.fillStyle = darken(p.skinTone, 40);
      ctx.beginPath(); ctx.arc(-4, hh * 0.12, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4, hh * 0.12, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'long': {
      ctx.beginPath();
      ctx.moveTo(0, -hh * 0.05);
      ctx.quadraticCurveTo(-3, hh * 0.1, -4, hh * 0.16);
      ctx.quadraticCurveTo(0, hh * 0.2, 4, hh * 0.16);
      ctx.quadraticCurveTo(3, hh * 0.1, 0, -hh * 0.05);
      ctx.fill(); ctx.stroke();
      break;
    }
    default: {
      // Normal nose — two nostril dots
      ctx.fillStyle = darken(p.skinTone, 28);
      ctx.beginPath(); ctx.arc(-3.5, hh * 0.1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3.5, hh * 0.1, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawMouth(ctx, p, hh, expression) {
  const mY = hh * 0.38;
  ctx.strokeStyle = '#8B3A3A';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  switch (expression) {
    case 'grin':
    case 'smile':
    case 'friendly': {
      // Big happy smile
      const mW = expression === 'grin' ? 20 : 16;
      ctx.beginPath();
      ctx.moveTo(-mW, mY - 4);
      ctx.quadraticCurveTo(0, mY + 10, mW, mY - 4);
      ctx.stroke();
      if (expression === 'grin') {
        // Teeth
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-mW + 2, mY - 3);
        ctx.quadraticCurveTo(0, mY + 7, mW - 2, mY - 3);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'friendly-old': {
      ctx.beginPath();
      ctx.moveTo(-13, mY - 2);
      ctx.quadraticCurveTo(0, mY + 8, 13, mY - 2);
      ctx.stroke();
      // Wrinkle lines at corners
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-14, mY - 3); ctx.lineTo(-18, mY - 8); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(14, mY - 3); ctx.lineTo(18, mY - 8); ctx.stroke();
      break;
    }
    case 'neutral': {
      ctx.beginPath();
      ctx.moveTo(-12, mY);
      ctx.quadraticCurveTo(0, mY + 2, 12, mY);
      ctx.stroke();
      break;
    }
    case 'wide-eyed': {
      ctx.beginPath();
      ctx.moveTo(-10, mY - 2);
      ctx.quadraticCurveTo(0, mY + 6, 10, mY - 2);
      ctx.stroke();
      break;
    }
    case 'pursed': {
      // Slight downturn at corners for Betty
      ctx.beginPath();
      ctx.moveTo(-12, mY - 2);
      ctx.quadraticCurveTo(0, mY + 1, 12, mY - 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-12, mY - 2); ctx.lineTo(-14, mY + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, mY - 2); ctx.lineTo(14, mY + 2); ctx.stroke();
      break;
    }
    case 'worried': {
      ctx.beginPath();
      ctx.moveTo(-11, mY + 3);
      ctx.quadraticCurveTo(0, mY - 3, 11, mY + 3);
      ctx.stroke();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.moveTo(-10, mY);
      ctx.quadraticCurveTo(0, mY + 5, 10, mY);
      ctx.stroke();
    }
  }
}

function drawMoustache(ctx, p, hh, color) {
  const mY = hh * 0.22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, mY);
  ctx.bezierCurveTo(-4, mY - 4, -14, mY - 5, -16, mY + 2);
  ctx.bezierCurveTo(-14, mY + 5, -6, mY + 4, 0, mY);
  ctx.bezierCurveTo(6, mY + 4, 14, mY + 5, 16, mY + 2);
  ctx.bezierCurveTo(14, mY - 5, 4, mY - 4, 0, mY);
  ctx.fill();
}

function drawThinMoustache(ctx, p, hh) {
  const mY = hh * 0.22;
  ctx.fillStyle = darken(p.hairColor, 10);
  ctx.beginPath();
  ctx.rect(-14, mY - 2, 28, 4);
  ctx.fill();
}

function drawFreckles(ctx, hw) {
  ctx.fillStyle = '#C8805A';
  const spots = [[-14, -8], [14, -8], [-18, 2], [18, 2], [-10, 6], [10, 6]];
  spots.forEach(([fx, fy]) => {
    ctx.beginPath();
    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawWrinkles(ctx, hw, hh) {
  ctx.strokeStyle = 'rgba(100,60,20,0.28)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  // Forehead
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.5, -hh * 0.4 + i * 8);
    ctx.quadraticCurveTo(0, -hh * 0.38 + i * 8 - 3, hw * 0.5, -hh * 0.4 + i * 8);
    ctx.stroke();
  }
  // Crow's feet
  [-hw * 0.55, hw * 0.55].forEach(wx => {
    ctx.beginPath();
    ctx.moveTo(wx, -hh * 0.15);
    ctx.lineTo(wx + (wx > 0 ? 8 : -8), -hh * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wx, -hh * 0.1);
    ctx.lineTo(wx + (wx > 0 ? 9 : -9), -hh * 0.1);
    ctx.stroke();
  });
}

function drawHearingAid(ctx, hw) {
  ctx.fillStyle = '#D4A860';
  ctx.strokeStyle = '#A07840';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-hw - 4, 5, 4, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-hw - 4, 5);
  ctx.lineTo(-hw - 1, 12);
  ctx.stroke();
}

function drawHeadscarf(ctx, p, hw, hh) {
  ctx.fillStyle = '#CC44AA';
  ctx.strokeStyle = '#AA2288';
  ctx.lineWidth = 1.5;
  // Scarf band across forehead
  ctx.beginPath();
  ctx.moveTo(-hw - 4, -hh * 0.55);
  ctx.quadraticCurveTo(0, -hh * 0.7, hw + 4, -hh * 0.55);
  ctx.quadraticCurveTo(hw + 2, -hh * 0.3, hw - 2, -hh * 0.1);
  ctx.lineTo(-hw + 2, -hh * 0.1);
  ctx.quadraticCurveTo(-hw - 2, -hh * 0.3, -hw - 4, -hh * 0.55);
  ctx.fill(); ctx.stroke();
  // Knot at top
  ctx.fillStyle = '#EE66BB';
  ctx.beginPath();
  ctx.arc(0, -hh * 0.75, 8, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
}

function darken(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Draw a character name tag below the character
function drawNameTag(ctx, name, y) {
  const tw = ctx.measureText(name).width + 14;
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, y, tw, 20, 4);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, 0, y + 14);
}
