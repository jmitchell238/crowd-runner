'use strict';
// ------------------------------------------------- weapon crates
function drawCrate(cr) {
  const b = project(cr.x, 0, cr.z);
  if (!b) return;
  const u = b[2], w = u * 1.0, h = u * .8;
  ctx.fillStyle = 'rgba(0,0,0,.2)';
  ctx.beginPath(); ctx.ellipse(b[0], b[1], w * .62, u * .16, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#b06f2e';
  ctx.fillRect(b[0] - w / 2, b[1] - h, w, h);
  ctx.strokeStyle = '#7c4a1c'; ctx.lineWidth = Math.max(1, u * .06);
  ctx.strokeRect(b[0] - w / 2, b[1] - h, w, h);
  ctx.beginPath();
  ctx.moveTo(b[0] - w / 2, b[1] - h); ctx.lineTo(b[0] + w / 2, b[1]);
  ctx.moveTo(b[0] + w / 2, b[1] - h); ctx.lineTo(b[0] - w / 2, b[1]);
  ctx.stroke();
  // spinning sword floating above the crate
  const t = project(cr.x, 1.9 + Math.sin(tick * 2.5) * 0.15, cr.z);
  if (t) {
    ctx.save(); ctx.translate(t[0], t[1]); ctx.rotate(tick * 2);
    seg('#eef2f6', u * .12, 0, u * .45, 0, -u * .45);
    seg('#7c5a1e', u * .09, -u * .16, u * .14, u * .16, u * .14);
    ctx.restore();
  }
}
