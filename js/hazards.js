'use strict';
// ------------------------------------------------- road hazards
// saw: a spinning blade sweeping side to side; spikes: a fixed spike strip
function hazardX(h) {
  return h.x0 + Math.sin(tick * h.spd + h.phase) * h.amp;
}

function drawSaw(h) {
  const x = hazardX(h);
  // ground shadow
  const g = project(x, 0, h.z);
  if (g) {
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(g[0], g[1], h.r * g[2] * .9, h.r * g[2] * .22, 0, 0, 7);
    ctx.fill();
  }
  const c = project(x, h.r, h.z);   // blade centre sits at blade radius height
  if (!c) return;
  const rp = h.r * c[2];
  ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(tick * 7);
  ctx.fillStyle = '#6d7680';
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rp, Math.sin(a) * rp);
    ctx.lineTo(Math.cos(a + .18) * rp * 1.22, Math.sin(a + .18) * rp * 1.22);
    ctx.lineTo(Math.cos(a + .4) * rp, Math.sin(a + .4) * rp);
    ctx.closePath(); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, rp, 0, 7);
  ctx.fillStyle = '#8f99a3'; ctx.fill();
  ctx.strokeStyle = '#5a626b'; ctx.lineWidth = Math.max(1, rp * .08); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, rp * .18, 0, 7);
  ctx.fillStyle = '#454c53'; ctx.fill();
  ctx.restore();
}

function drawSpikes(h) {
  const n = Math.max(4, Math.round((h.x1 - h.x0) * 2));
  for (let i = 0; i < n; i++) {
    const xa = h.x0 + (h.x1 - h.x0) * i / n;
    const xb = h.x0 + (h.x1 - h.x0) * (i + 1) / n;
    const a = project(xa, 0, h.z), b = project(xb, 0, h.z),
          t = project((xa + xb) / 2, 1.1, h.z);
    if (!a || !b || !t) continue;
    ctx.fillStyle = i % 2 ? '#d92b2b' : '#a81d1d';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(t[0], t[1]);
    ctx.closePath(); ctx.fill();
  }
}

function drawHazard(h) {
  if (h.type === 'saw') drawSaw(h); else drawSpikes(h);
}
