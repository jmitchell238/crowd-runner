'use strict';
// ------------------------------------------------- gates (math + drawing)
function opLabel(op) {
  return op.t === 'add' ? '+' + op.v : op.t === 'mul' ? 'x' + op.v :
         op.t === 'sub' ? '-' + op.v : '÷' + op.v;
}
function applyOp(op, c) {
  if (op.t === 'add') return c + op.v;
  if (op.t === 'mul') return c * op.v;
  if (op.t === 'sub') return Math.max(1, c - op.v);
  return Math.max(1, Math.ceil(c / op.v));
}
function goodOp(L, c) {
  if (L >= 10 && c >= 12 && Math.random() < 0.12) return { t: 'mul', v: 3 };
  if (c >= 8 && Math.random() < 0.35) return { t: 'mul', v: 2 };
  return { t: 'add', v: irand(3, 6 + L) };
}
function badOp() {
  return Math.random() < 0.5 ? { t: 'sub', v: irand(2, 6) } : { t: 'div', v: 2 };
}

function drawBonusWall(w) {
  const hw = ROAD_W / 2 - 0.3, hWall = 3.6;
  const a = project(-hw, 0, w.z), b = project(hw, 0, w.z),
        c = project(hw, hWall, w.z), d = project(-hw, hWall, w.z);
  if (!a || !b || !c || !d) return;
  ctx.fillStyle = 'rgba(255,185,35,.6)';
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.stroke();
  // brick joints
  ctx.strokeStyle = 'rgba(180,110,10,.5)'; ctx.lineWidth = 1.5;
  for (const fy of [.25, .5, .75]) {
    const l = project(-hw, hWall * fy, w.z), r = project(hw, hWall * fy, w.z);
    ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(r[0], r[1]); ctx.stroke();
  }
  const mid = project(0, hWall * .62, w.z);
  const sub = project(0, hWall * .25, w.z);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.max(12, mid[2] * 1.5) + 'px system-ui';
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 4;
  ctx.strokeText('x' + w.mult, mid[0], mid[1]);
  ctx.fillStyle = '#fff';
  ctx.fillText('x' + w.mult, mid[0], mid[1]);
  ctx.font = '700 ' + Math.max(9, sub[2] * .7) + 'px system-ui';
  ctx.lineWidth = 3;
  const needStr = w.need + (w.need === 1 ? ' fighter' : ' fighters');
  ctx.strokeText(needStr, sub[0], sub[1]);
  // green if the crowd is currently big enough to smash it, red if not
  ctx.fillStyle = player && player.count >= w.need ? '#b9ffb9' : '#ffb4a0';
  ctx.fillText(needStr, sub[0], sub[1]);
}

function drawGate(g) {
  const hGate = 3.2;
  const sides = [
    { x0: -ROAD_W / 2 + 0.5, x1: -0.35, op: g.left },
    { x0: 0.35, x1: ROAD_W / 2 - 0.5, op: g.right },
  ];
  for (const s of sides) {
    const goodSide = s.op.t === 'add' || s.op.t === 'mul';
    const a = project(s.x0, 0, g.z), b = project(s.x1, 0, g.z),
          c = project(s.x1, hGate, g.z), d = project(s.x0, hGate, g.z);
    if (!a || !b || !c || !d) continue;
    ctx.fillStyle = g.used ? 'rgba(160,160,160,.25)' :
      goodSide ? 'rgba(45,110,255,.55)' : 'rgba(255,45,45,.5)';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.stroke();
    if (!g.used) {
      const mid = project((s.x0 + s.x1) / 2, hGate * 0.55, g.z);
      if (mid) {
        ctx.fillStyle = '#fff';
        ctx.font = '800 ' + Math.max(10, mid[2] * 1.1) + 'px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3;
        ctx.strokeText(opLabel(s.op), mid[0], mid[1]);
        ctx.fillText(opLabel(s.op), mid[0], mid[1]);
      }
    }
    // posts
    for (const px of [s.x0, s.x1]) {
      const p0 = project(px, 0, g.z), p1 = project(px, hGate, g.z);
      if (!p0 || !p1) continue;
      ctx.strokeStyle = '#cfd4da'; ctx.lineWidth = Math.max(1.5, p0[2] * .12);
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    }
  }
}
