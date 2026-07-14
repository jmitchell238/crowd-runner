'use strict';
// ------------------------------------------------- crowds & person drawing
function formationOffset(i) {         // sunflower spiral around the leader
  if (i === 0) return [0, 0];
  const r = 0.68 * Math.sqrt(i), a = i * 2.39996;
  return [Math.cos(a) * r, Math.sin(a) * r * 0.8];
}

function makeMember(x, z) {
  return { x, z, phase: rand(0, Math.PI * 2),
           jx: rand(-.14, .14), jz: rand(-.14, .14), tint: irand(0, 2) };
}

function makeCrowd(x, z, count, color, single) {
  const c = { x, z, count, color, members: [], single: !!single,
              shades: [shade(color, 1), shade(color, 1.28), shade(color, 0.8)],
              dark: shade(color, 0.5) };
  syncMembers(c, true);
  return c;
}

function syncMembers(c, instant) {
  if (c.single) return;               // bosses are one big figure, no crowd
  const want = Math.min(c.count, MAXR);
  while (c.members.length < want) {
    const [ox, oz] = formationOffset(c.members.length);
    c.members.push(makeMember(
      instant ? clamp(c.x + ox, -ROAD_HALF, ROAD_HALF) : c.x + rand(-.5, .5),
      c.z + (instant ? oz : rand(-.5, .5))));
  }
  while (c.members.length > want) {
    const m = c.members.pop();
    popParticles(m.x, m.z, c.color);
  }
}

function seg(color, w, x0, y0, x1, y1) {
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}

function drawWeapon(u, tier) {         // drawn in a translated/rotated frame
  ctx.lineCap = 'round';
  if (tier === 1) {                    // stick
    seg('#8a5a2b', u * .1, 0, u * .08, 0, -u * .5);
  } else if (tier === 2) {             // sword
    seg('#dfe6ec', u * .09, 0, 0, 0, -u * .62);
    seg('#7c5a1e', u * .07, -u * .11, -u * .1, u * .11, -u * .1);
  } else if (tier === 3) {             // spear
    seg('#8a5a2b', u * .07, 0, u * .15, 0, -u * .75);
    ctx.fillStyle = '#c9ced4';
    ctx.beginPath(); ctx.moveTo(-u * .07, -u * .73); ctx.lineTo(u * .07, -u * .73);
    ctx.lineTo(0, -u * .95); ctx.closePath(); ctx.fill();
  } else if (tier === 4) {             // hammer
    seg('#8a5a2b', u * .08, 0, u * .1, 0, -u * .55);
    ctx.fillStyle = '#9aa2ab';
    ctx.fillRect(-u * .18, -u * .74, u * .36, u * .22);
  } else if (tier === 5) {             // blaster
    seg('#3a3f45', u * .13, 0, -u * .12, 0, -u * .55);
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath(); ctx.arc(0, -u * .58, u * .07, 0, 7); ctx.fill();
  }
}

function drawPerson(sx, sy, u, color, dark, phase, running, tier, gear) {
  if (u < 1.4) {                      // too far away: a simple dot
    ctx.fillStyle = color;
    ctx.fillRect(sx - u * .3, sy - u * 1.4, u * .6, u * 1.4);
    return;
  }
  const bob = running ? Math.abs(Math.sin(phase)) * 0.1 * u : Math.sin(phase) * 0.03 * u;
  const ow = Math.max(1, u * .06);    // outline width
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(sx, sy, u * .32, u * .11, 0, 0, 7); ctx.fill();
  // legs stride forward/back — seen from behind, the stepping foot lifts
  const hipY = sy - u * .6 - bob;
  const liftL = Math.max(0, Math.sin(phase)) * (running ? .24 : .05) * u;
  const liftR = Math.max(0, Math.sin(phase + Math.PI)) * (running ? .24 : .05) * u;
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1, u * .15);
  ctx.beginPath();
  ctx.moveTo(sx - u * .11, hipY); ctx.lineTo(sx - u * .11, sy - liftL);
  ctx.moveTo(sx + u * .11, hipY); ctx.lineTo(sx + u * .11, sy - liftR);
  ctx.stroke();
  // torso with outline
  const tw = u * .44, th = u * .72;
  const ty = sy - u * .55 - th - bob;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(sx - tw / 2, ty, tw, th, tw * .45);
  else ctx.rect(sx - tw / 2, ty, tw, th);
  ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = ow; ctx.stroke();
  // soft side shading gives the body a little depth
  if (u > 4) {
    ctx.globalAlpha = .15; ctx.fillStyle = dark;
    ctx.fillRect(sx + tw * .1, ty + ow, tw * .28, th - ow * 2);
    ctx.globalAlpha = 1;
  }
  // arms swing opposite to the legs
  const swing = Math.sin(phase) * (running ? .17 : .04) * u;
  const armY = ty + u * .12;
  const handL = armY + u * .48 + swing, handR = armY + u * .48 - swing;
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, u * .12);
  ctx.beginPath();
  ctx.moveTo(sx - tw / 2 - u * .02, armY); ctx.lineTo(sx - tw / 2 - u * .08, handL);
  ctx.moveTo(sx + tw / 2 + u * .02, armY); ctx.lineTo(sx + tw / 2 + u * .08, handR);
  ctx.stroke();
  // head with outline
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(sx, ty - u * .1, u * .2, 0, 7);
  ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = ow; ctx.stroke();
  // gear: helmet + chest band, color marks the troop level tier
  if (gear && u > 2.2) {
    ctx.fillStyle = gear;
    ctx.beginPath(); ctx.arc(sx, ty - u * .1, u * .21, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sx - tw / 2, ty + th * .35, tw, Math.max(1, th * .18));
  }
  // weapon in the right hand
  if (tier > 0 && u > 3) {
    ctx.save();
    ctx.translate(sx + tw / 2 + u * .08, handR);
    ctx.rotate(0.55 + Math.sin(phase) * 0.3);
    drawWeapon(u, tier);
    ctx.restore();
  }
}

// ------------------------------------------------- boss figures
function bossHeight(c) {
  return Math.min(8, 3.4 + Math.sqrt(c.count) * 0.28);
}

function drawBossFigure(e, fighting) {
  const b = project(e.x, 0, e.z);
  if (!b) return;
  const u = b[2];
  const h = bossHeight(e) * u;              // full height in px
  const sx = b[0], sy = b[1];
  const name = e.type.name;
  const phase = tick * (fighting ? 9 : 1.6);
  const bob = Math.sin(phase) * h * .012;
  const col = e.color, dark = e.dark;
  const w = h * .4;                          // torso width
  const ow = Math.max(1.5, h * .012);        // outline
  ctx.lineCap = 'round';

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(sx, sy, w * .85, h * .045, 0, 0, 7); ctx.fill();

  const legH = name === 'REAPER' ? 0 : h * .3;
  const torsoH = h * .42, headR = h * .11;
  const ty = sy - legH - torsoH - bob;       // torso top

  // legs (stomping)
  if (legH) {
    const stomp = Math.sin(phase) * (fighting ? h * .02 : h * .008);
    ctx.strokeStyle = dark; ctx.lineWidth = h * .07;
    ctx.beginPath();
    ctx.moveTo(sx - w * .28, ty + torsoH); ctx.lineTo(sx - w * .28, sy - stomp);
    ctx.moveTo(sx + w * .28, ty + torsoH); ctx.lineTo(sx + w * .28, sy + stomp);
    ctx.stroke();
  }

  // torso: robe (trapezoid) for reaper, blocky for golem, rounded otherwise
  ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = ow;
  ctx.beginPath();
  if (name === 'REAPER') {
    ctx.moveTo(sx - w * .35, ty); ctx.lineTo(sx + w * .35, ty);
    ctx.lineTo(sx + w * .62, sy); ctx.lineTo(sx - w * .62, sy);
    ctx.closePath();
  } else if (name === 'GOLEM') {
    ctx.rect(sx - w / 2, ty, w, torsoH);
  } else if (ctx.roundRect) ctx.roundRect(sx - w / 2, ty, w, torsoH, w * .2);
  else ctx.rect(sx - w / 2, ty, w, torsoH);
  ctx.fill(); ctx.stroke();
  if (name === 'OGRE') {                     // belly
    ctx.beginPath(); ctx.ellipse(sx, ty + torsoH * .62, w * .42, torsoH * .3, 0, 0, 7);
    ctx.fillStyle = shade(col, 1.22); ctx.fill();
  }
  if (name === 'GOLEM') {                    // cracks
    ctx.strokeStyle = dark; ctx.lineWidth = ow;
    ctx.beginPath();
    ctx.moveTo(sx - w * .2, ty + torsoH * .2); ctx.lineTo(sx, ty + torsoH * .45);
    ctx.lineTo(sx - w * .12, ty + torsoH * .7);
    ctx.moveTo(sx + w * .25, ty + torsoH * .35); ctx.lineTo(sx + w * .1, ty + torsoH * .6);
    ctx.stroke();
  }

  // arms + weapon (right arm raised while fighting)
  const armY = ty + torsoH * .18;
  const raise = fighting ? Math.abs(Math.sin(phase)) * h * .12 : 0;
  ctx.strokeStyle = col; ctx.lineWidth = h * .055;
  ctx.beginPath();
  ctx.moveTo(sx - w * .5, armY); ctx.lineTo(sx - w * .72, armY + h * .16);
  ctx.moveTo(sx + w * .5, armY); ctx.lineTo(sx + w * .72, armY + h * .16 - raise);
  ctx.stroke();
  const hx = sx + w * .72, hy = armY + h * .16 - raise;   // right hand
  ctx.save(); ctx.translate(hx, hy);
  ctx.rotate(-0.5 + (fighting ? Math.sin(phase) * .5 : 0));
  if (name === 'OGRE') {                     // spiked club
    seg('#7c4a1c', h * .05, 0, h * .06, 0, -h * .3);
    ctx.fillStyle = '#5f5f66';
    for (const fy of [-.28, -.2, -.12])
      ctx.fillRect(-h * .045, h * fy, h * .09, h * .028);
  } else if (name === 'KNIGHT') {            // great sword
    seg('#e8edf2', h * .04, 0, 0, 0, -h * .34);
    seg('#7c5a1e', h * .03, -h * .06, -h * .05, h * .06, -h * .05);
  } else if (name === 'REAPER') {            // scythe
    seg('#6e5a3a', h * .035, 0, h * .1, 0, -h * .42);
    ctx.strokeStyle = '#dfe6ec'; ctx.lineWidth = h * .035;
    ctx.beginPath(); ctx.arc(-h * .1, -h * .42, h * .12, -0.4, 1.6); ctx.stroke();
  } else if (name === 'DEMON') {             // trident
    seg('#3a3f45', h * .035, 0, h * .1, 0, -h * .34);
    for (const fx of [-.05, 0, .05])
      seg('#3a3f45', h * .028, h * fx, -h * .3, h * fx, -h * .4);
  } else {                                   // golem: giant fist
    ctx.fillStyle = shade(col, .85);
    ctx.beginPath(); ctx.arc(0, 0, h * .07, 0, 7); ctx.fill();
  }
  ctx.restore();
  if (name === 'KNIGHT') {                   // shield on the left arm
    ctx.fillStyle = '#7a8894'; ctx.strokeStyle = dark; ctx.lineWidth = ow;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx - w * .88, armY, w * .32, h * .2, w * .06);
    else ctx.rect(sx - w * .88, armY, w * .32, h * .2);
    ctx.fill(); ctx.stroke();
  }

  // head (square for golem, hooded for reaper) + horns/helmet
  const hy2 = ty - headR * .8;
  ctx.fillStyle = name === 'REAPER' ? shade(col, .75) : col;
  ctx.strokeStyle = dark; ctx.lineWidth = ow;
  ctx.beginPath();
  if (name === 'GOLEM') ctx.rect(sx - headR, hy2 - headR, headR * 2, headR * 2);
  else ctx.arc(sx, hy2, headR, 0, 7);
  ctx.fill(); ctx.stroke();
  if (name === 'OGRE' || name === 'DEMON') { // horns
    ctx.fillStyle = name === 'DEMON' ? '#2b2b31' : '#e8e2d2';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx + s * headR * .55, hy2 - headR * .6);
      ctx.lineTo(sx + s * headR * 1.15, hy2 - headR * 1.5);
      ctx.lineTo(sx + s * headR * .95, hy2 - headR * .45);
      ctx.closePath(); ctx.fill();
    }
  }
  if (name === 'KNIGHT') {                   // plume
    ctx.strokeStyle = '#d33'; ctx.lineWidth = h * .03;
    ctx.beginPath(); ctx.arc(sx, hy2 - headR * .4, headR * .9, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  // glowing eyes — bosses face the player
  const ey = hy2 - headR * .05;
  ctx.fillStyle = name === 'REAPER' || name === 'DEMON' ? '#ff5b3d' : '#fff';
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(sx + s * headR * .38, ey, headR * .16, headR * .2, 0, 0, 7);
    ctx.fill();
  }
  if (name !== 'REAPER' && name !== 'DEMON') {
    ctx.fillStyle = '#1d2430';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(sx + s * headR * .38, ey + headR * .04, headR * .07, 0, 7);
      ctx.fill();
    }
  }
}

function drawCrowdLabel(c, extra, lvlText) {
  const p = project(c.x, c.single ? bossHeight(c) + 0.9
                         : 2.7 + Math.sqrt(c.count) * 0.12, c.z);
  if (!p) return;
  const fs = Math.max(11, p[2] * 0.9);
  ctx.font = '800 ' + fs + 'px system-ui';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 4;
  const str = (extra || '') + c.count;
  ctx.strokeText(str, p[0], p[1]);
  ctx.fillStyle = '#fff';
  ctx.fillText(str, p[0], p[1]);
  if (lvlText) {
    ctx.font = '700 ' + fs * 0.55 + 'px system-ui';
    ctx.lineWidth = 3;
    ctx.strokeText(lvlText, p[0], p[1] + fs * 0.85);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(lvlText, p[0], p[1] + fs * 0.85);
  }
}
