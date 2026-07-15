'use strict';
// ------------------------------------------------- input, game flow, loop
let dragging = false, lastPX = 0;
let thumbSteer = 0, thumbPid = null;
const keys = {};
cv.addEventListener('pointerdown', e => {
  dragging = true; lastPX = e.clientX;
  cv.classList.add('dragging'); cv.setPointerCapture(e.pointerId);
  audio();
});
cv.addEventListener('pointermove', e => {
  if (!dragging || !player) return;
  const worldPerPx = 14 / Math.min(W, 900);
  player.targetX = clamp(player.targetX + (e.clientX - lastPX) * worldPerPx,
                         -ROAD_W / 2 + 0.8, ROAD_W / 2 - 0.8);
  lastPX = e.clientX;
});
addEventListener('pointerup', () => { dragging = false; cv.classList.remove('dragging'); });
addEventListener('keydown', e => { keys[e.key] = true; });
addEventListener('keyup',   e => { keys[e.key] = false; });

$('thumb').addEventListener('pointerdown', e => {
  $('thumb').setPointerCapture(e.pointerId);
  thumbPid = e.pointerId;
  const rect = $('thumb').getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width / 2);
  thumbSteer = clamp(dx / 44, -1, 1);
  $('thumbKnob').style.transform = 'translate(calc(-50% + ' + (thumbSteer * 38) + 'px), -50%)';
});
$('thumb').addEventListener('pointermove', e => {
  if (thumbPid !== e.pointerId) return;
  const rect = $('thumb').getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width / 2);
  thumbSteer = clamp(dx / 44, -1, 1);
  $('thumbKnob').style.transform = 'translate(calc(-50% + ' + (thumbSteer * 38) + 'px), -50%)';
});
$('thumb').addEventListener('pointerup', e => {
  if (thumbPid !== e.pointerId) return;
  thumbSteer = 0; thumbPid = null;
  $('thumbKnob').style.transform = 'translate(-50%,-50%)';
});
$('thumb').addEventListener('pointercancel', e => {
  if (thumbPid !== e.pointerId) return;
  thumbSteer = 0; thumbPid = null;
  $('thumbKnob').style.transform = 'translate(-50%,-50%)';
});

// ------------------------------------------------- flow
function startLevel() {
  buildLevel(level);
  $('levelLabel').textContent = 'Level ' + level;
  updateHud();
  hideLobby();
  $('thumb').classList.toggle('hidden', controls !== 'touch');
  state = 'play';
}
$('btnPlay').onclick = () => { audio(); startLevel(); };
$('restartBtn').onclick = () => { if (state === 'play') startLevel(); };
$('exitBtn').onclick = () => { if (state !== 'play') return; if (!confirm('ARE YOU SURE? All progress and coins will be lost for this level.')) return; coins = Math.max(0, coins - coinsRun); localStorage.setItem('ccr_coins', coins); state = 'menu'; showLobby(); };

function winLevel() {
  state = 'win'; sndWin();
  missionAdd('win', 1);
  const bonus = Math.ceil((player.count * 1.5 + level * 6) * coinMult()) * bonusMult;
  coins += bonus; coinsRun += bonus;
  localStorage.setItem('ccr_coins', coins);
  const msg = '🎉 <b>Level ' + level + ' complete!</b><br>' +
    'You finished with ' + player.count + ' fighters (peak army: ' + peakCount +
    ').<br>Earned 🪙 ' + coinsRun + ' this run, including a 🪙 ' + bonus +
    ' finish bonus' + (bonusMult > 1 ? ' (x' + bonusMult + ' from bonus walls!)' : '') + '.';
  level++;
  localStorage.setItem('ccr_level', level);
  showLobby(msg, 'Next level ▶');
}
function loseLevel() {
  state = 'lose'; sndLose();
  showLobby('💀 <b>Your army was defeated!</b><br>Peak army: ' + peakCount +
    ' fighters. You keep the 🪙 ' + coinsRun +
    ' you earned — grab upgrades in the Shop and try again!', 'Try again');
}

// ------------------------------------------------- update
function update(dt) {
  tick += dt;
  if (state !== 'play') return;

  // steering
  const kdir = (keys.ArrowRight || keys.d || keys.D ? 1 : 0) -
               (keys.ArrowLeft  || keys.a || keys.A ? 1 : 0);
  if (kdir) player.targetX = clamp(player.targetX + kdir * 9 * dt,
                                   -ROAD_W / 2 + 0.8, ROAD_W / 2 - 0.8);
  if (thumbSteer) player.targetX = clamp(player.targetX + thumbSteer * 9 * dt,
                                         -ROAD_W / 2 + 0.8, ROAD_W / 2 - 0.8);
  player.x = lerp(player.x, player.targetX, Math.min(1, dt * 10));

  // forward motion (paused during a battle)
  if (!battle) player.z += player.speed * dt;

  // members chase their formation slot, bunching up inside the road
  for (let i = 0; i < player.members.length; i++) {
    const m = player.members[i], [ox, oz] = formationOffset(i);
    const tx = clamp(player.x + ox + m.jx, -ROAD_HALF, ROAD_HALF);
    let tz = player.z + oz + m.jz;
    if (battle) tz += 1.5;                       // surge toward the enemy
    m.x = lerp(m.x, tx, Math.min(1, dt * 8));
    m.z = lerp(m.z, tz, Math.min(1, dt * 8));
  }

  // gates
  for (const g of items) {
    if (g.used || player.z < g.z) continue;
    g.used = true;
    const ox = gateOx(g);
    const op = player.x < ox ? g.left : g.right;
    const before = player.count;
    player.count = applyOp(op, player.count);
    peakCount = Math.max(peakCount, player.count);
    missionAdd('peak', player.count);
    const gained = player.count - before;
    if (gained >= 0) { sndGood(); floatText(player.x, player.z, '+' + gained, '#7ecbff'); }
    else { sndBad(); shakeT = 0.3; floatText(player.x, player.z, '' + gained, '#ff8080'); }
    syncMembers(player, false);
  }

  // weapon crates
  for (const cr of crates) {
    if (cr.done || player.z < cr.z) continue;
    cr.done = true;
    if (Math.abs(player.x - cr.x) < 1.9) {
      cr.taken = true;
      missionAdd('crates', 1);
      const before = visualTier();
      cratesTaken++;
      runPower *= 1 + cratePower();
      const after = visualTier();
      sndGood(); shakeT = 0.1;
      floatText(cr.x, cr.z, after > before ?
        '⚔️ ' + WEAPONS[after].name.toUpperCase() + '!' :
        '⚔️ POWER +' + Math.round(cratePower() * 100) + '%', '#ffd23e');
      updateHud();
    }
  }

  // hazards: saws & spikes shred part of the crowd if you run into them
  for (const h of hazards) {
    if (h.done || player.z < h.z - 1) continue;
    if (player.z > h.z + 2) { h.done = true; continue; }
    const hit = h.type === 'saw'
      ? Math.abs(player.x - hazardX(h)) < h.r + 0.8
      : player.x > h.x0 - 0.6 && player.x < h.x1 + 0.6;
    if (hit) {
      h.done = true;
      const frac = h.type === 'saw' ? 0.25 : h.type === 'pit' ? 0.30 : 0.35;
      const lose = Math.min(player.count - 1, Math.ceil(player.count * frac));
      if (lose > 0) {
        player.count -= lose;
        syncMembers(player, false);
        sndBad(); shakeT = 0.3;
        popParticles(player.x, player.z, player.color);
        floatText(player.x, player.z, '-' + lose + ' fell!', '#ff6b6b');
      }
    }
  }

  // battles
  if (!battle) {
    for (const e of enemies) {
      if (e.dead) continue;
      const closeZ = e.z - player.z < e.radius + 1.5 && e.z - player.z > -3;
      const closeX = e.boss || Math.abs(e.x - player.x) < e.radius + 1.2;
      if (closeZ && closeX) { battle = { enemy: e, accP: 0, accE: 0 }; break; }
    }
  }
  if (battle) {
    const e = battle.enemy;
    // both sides trade losses — the power ratio decides who drains faster,
    // armor divides what you take
    const rate = 5 + Math.min(player.count, e.count) * 2.2;
    const ratio = Math.sqrt(runPower / (e.pow || 1));
    if (e.fort) {
      battle.volleyT = (battle.volleyT || 0) + dt;
      if (battle.volleyT >= 1.5) {
        battle.volleyT = 0;
        const volleyDmg = Math.max(1, Math.ceil(player.count * 0.05 / armorDiv()));
        player.count = Math.max(0, player.count - volleyDmg);
        syncMembers(player, false);
        sndBad(); shakeT = 0.25;
        if (player.members.length > 0) {
          const tm = player.members[irand(0, player.members.length - 1)];
          popParticles(tm.x, tm.z, player.color);
        }
        floatText(player.x, player.z, '-' + volleyDmg, '#ff6b6b');
      }
    } else {
      battle.accP += rate / ratio / armorDiv() * dt;
    }
    battle.accE += rate * ratio * dt;
    const kp = Math.floor(battle.accP), ke = Math.floor(battle.accE);
    if (kp > 0 || ke > 0) {
      battle.accP -= kp; battle.accE -= ke;
      player.count = Math.max(0, player.count - kp);
      e.count = Math.max(0, e.count - ke);
      syncMembers(player, false); syncMembers(e, false);
      if (e.single && ke > 0)                // boss hit sparks
        popParticles(e.x + rand(-1.5, 1.5), e.z + rand(-1, 0.5), e.color);
      sndPop(); shakeT = 0.12;
    }
    // enemy members lunge at the player
    for (let i = 0; i < e.members.length; i++) {
      const m = e.members[i], [ox, oz] = formationOffset(i);
      m.x = lerp(m.x, clamp(e.x + ox + m.jx, -ROAD_HALF, ROAD_HALF), Math.min(1, dt * 6));
      m.z = lerp(m.z, e.z + oz - 1.5, Math.min(1, dt * 6));
    }
    if (e.count <= 0) {
      e.dead = true;
      if (e.single) {                        // boss death burst
        missionAdd('boss', 1);
        for (let i = 0; i < 8; i++)
          popParticles(e.x + rand(-2.5, 2.5), e.z + rand(-2, 2), e.color);
      }
      if (player.count <= 0) { player.count = 1; syncMembers(player, false); }
      const gain = e.fort ? Math.ceil(e.count0 * (e.pow || 1) * 0.05 * coinMult()) : Math.ceil(e.count0 * (e.pow || 1) * 0.5 * coinMult());
      coins += gain; coinsRun += gain;
      localStorage.setItem('ccr_coins', coins);
      updateHud();
      floatText(e.x, e.z, '+' + gain + ' 🪙', '#ffd23e');
      battle = null;
    } else if (player.count <= 0) {
      loseLevel(); return;
    }
  }

  // finish line -> bonus wall zone
  if (player.z > finishZ) {
    for (const w of bonusWalls) {
      if (w.broken || player.z < w.z - 2) continue;
      if (player.count >= w.need) {
        w.broken = true; bonusMult = w.mult;
        missionAdd('walls', 1);
        sndSmash(); shakeT = 0.25;
        for (let i = -3; i <= 3; i++)
          popParticles(i * ROAD_W / 7, w.z, '#ffce4d');
        floatText(player.x, w.z, 'x' + w.mult + ' BONUS!', '#ffd23e');
      } else {
        floatText(player.x, w.z, 'NEED ' + w.need + '!', '#ff9d6e');
        winLevel(); return;          // stopped by this wall
      }
    }
    if (player.z > bonusEndZ) { winLevel(); return; }
  }

  // camera follows
  cam.x = lerp(cam.x, player.x * 0.35, Math.min(1, dt * 5));
  cam.z = player.z - 14;
  shakeT = Math.max(0, shakeT - dt);

  // particles / floating text
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.z += p.vz * dt;
    p.y += p.vy * dt; p.vy -= 14 * dt;
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.life -= dt; t.y += 1.6 * dt;
    if (t.life <= 0) texts.splice(i, 1);
  }
}

// ------------------------------------------------- draw
function draw() {
  ctx.save();
  if (shakeT > 0) ctx.translate(rand(-1, 1) * shakeT * 22, rand(-1, 1) * shakeT * 22);

  drawRoad();

  // collect everything with a depth, paint far -> near
  const q = [];
  for (const g of items)
    if (g.z > cam.z + 2 && g.z < cam.z + 160)
      q.push({ z: g.z, f: () => drawGate(g) });

  for (const e of enemies) {
    if (e.dead || e.z < cam.z + 2 || e.z > cam.z + 160) continue;
    const fighting = battle && battle.enemy === e;
    if (e.single) {                          // one giant boss figure
      if (e.fort) {
        q.push({ z: e.z, f: () => drawFortress(e, fighting) });
        q.push({ z: e.z - 5, f: () => drawCrowdLabel(e, '🏰 FORTRESS · ', 'Lv ' + e.lvl) });
      } else {
        q.push({ z: e.z, f: () => drawBossFigure(e, fighting) });
        q.push({ z: e.z - 5, f: () => drawCrowdLabel(e,
          '☠ ' + (e.mega ? 'MEGA ' : '') + e.type.name + ' · ', 'Lv ' + e.lvl) });
      }
      continue;
    }
    for (const m of e.members) {
      const p = project(m.x, 0, m.z);
      if (!p) continue;
      q.push({ z: m.z, f: () => drawPerson(p[0], p[1], p[2], e.shades[m.tint], e.dark,
                                           m.phase + tick * (fighting ? 14 : 2.2), fighting,
                                           e.tier || 0, e.gear) });
    }
    q.push({ z: e.z - 5, f: () => drawCrowdLabel(e, e.boss ? '☠ ' : '', 'Lv ' + e.lvl) });
  }

  for (const cr of crates) {
    if (cr.taken || cr.z < cam.z + 2 || cr.z > cam.z + 160) continue;
    q.push({ z: cr.z, f: () => drawCrate(cr) });
  }

  for (const w of bonusWalls) {
    if (w.broken || w.z < cam.z + 2 || w.z > cam.z + 160) continue;
    q.push({ z: w.z, f: () => drawBonusWall(w) });
  }

  for (const h of hazards) {
    if (h.z < cam.z + 2 || h.z > cam.z + 160) continue;
    q.push({ z: h.z, f: () => drawHazard(h) });
  }

  if (player) {
    const vTier = visualTier();
    const gearC = gearColor(troopLevel());
    for (const m of player.members) {
      const p = project(m.x, 0, m.z);
      if (!p) continue;
      q.push({ z: m.z, f: () => drawPerson(p[0], p[1], p[2], player.shades[m.tint], player.dark,
                                           m.phase + tick * 13, true, vTier, gearC) });
    }
    q.push({ z: player.z - 5, f: () => drawCrowdLabel(player, '', 'Lv ' + troopLevel()) });
  }

  for (const p of particles) {
    const s = project(p.x, p.y, p.z);
    if (!s) continue;
    q.push({ z: p.z, f: () => {
      ctx.globalAlpha = clamp(p.life * 2.2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(s[0], s[1], Math.max(1.5, s[2] * .1), 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    } });
  }

  q.sort((a, b) => b.z - a.z);
  for (const it of q) it.f();

  // floating texts on top
  for (const t of texts) {
    const p = project(t.x, t.y, t.z);
    if (!p) continue;
    ctx.globalAlpha = clamp(t.life, 0, 1);
    ctx.font = '800 ' + Math.max(14, p[2] * 1.0) + 'px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 4;
    ctx.strokeText(t.str, p[0], p[1]);
    ctx.fillStyle = t.color;
    ctx.fillText(t.str, p[0], p[1]);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ------------------------------------------------- boot & main loop
buildLevel(level);        // so the lobby has something pretty behind it
$('levelLabel').textContent = 'Level ' + level;
showLobby();

let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
