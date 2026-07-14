'use strict';
// ------------------------------------------------- canvas, camera, road
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const stage = document.getElementById('stage');
let W = 0, H = 0, CX = 0, CY = 0, F = 0;
function resize() {
  // 16:9 stage in landscape, 9:16 in portrait — letterboxed to the screen
  const ar = innerWidth >= innerHeight ? 16 / 9 : 9 / 16;
  let w = innerWidth, h = Math.round(w / ar);
  if (h > innerHeight) { h = innerHeight; w = Math.round(h * ar); }
  stage.style.width = w + 'px';
  stage.style.height = h + 'px';
  W = cv.width = w; H = cv.height = h;
  CX = W / 2; CY = H * 0.44;
  F = Math.max(H * 1.05, W * 0.6);
}
addEventListener('resize', resize); resize();

const PITCH = 0.46;                   // camera tilt down (radians)
const cam = { x: 0, y: 8.5, z: -14 };
const cosP = Math.cos(PITCH), sinP = Math.sin(PITCH);

// returns [screenX, screenY, scale] or null if behind camera
function project(wx, wy, wz) {
  const dx = wx - cam.x, dy = wy - cam.y, dz = wz - cam.z;
  const zc = -dy * sinP + dz * cosP;
  if (zc < 0.5) return null;
  const yc = dy * cosP + dz * sinP;
  const s = F / zc;
  return [CX + dx * s, CY - yc * s, s];
}

function drawRoad() {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#35c1e8'); sky.addColorStop(.62, '#7fd9f2');
  sky.addColorStop(.8, '#e8a7e0'); sky.addColorStop(1, '#d05fd0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  const zn = cam.z + 4, zf = cam.z + 160;
  const pn = project(0, 0, zn), pf = project(0, 0, zf);
  if (!pn || !pf) return;

  // road body
  const hw = ROAD_W / 2;
  const nl = project(-hw, 0, zn), nr = project(hw, 0, zn);
  const fl = project(-hw, 0, zf), fr = project(hw, 0, zf);
  ctx.fillStyle = '#8a8a8f';
  ctx.beginPath();
  ctx.moveTo(nl[0], nl[1]); ctx.lineTo(nr[0], nr[1]);
  ctx.lineTo(fr[0], fr[1]); ctx.lineTo(fl[0], fl[1]);
  ctx.closePath(); ctx.fill();

  // white edge stripes
  for (const side of [-1, 1]) {
    const a = project(side * hw, 0, zn), b = project(side * hw, 0, zf);
    const a2 = project(side * (hw - 0.45), 0, zn), b2 = project(side * (hw - 0.45), 0, zf);
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.lineTo(b2[0], b2[1]); ctx.lineTo(a2[0], a2[1]);
    ctx.closePath(); ctx.fill();
  }

  // centre dashes
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  const start = Math.floor(zn / 8) * 8;
  for (let z = start; z < zf; z += 8) {
    const a = project(-0.25, 0, z), b = project(0.25, 0, z),
          c = project(0.25, 0, z + 2.6), d = project(-0.25, 0, z + 2.6);
    if (!a || !b || !c || !d) continue;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
    ctx.closePath(); ctx.fill();
  }

  // finish line: checkered strip
  if (finishZ && finishZ > zn && finishZ < zf) {
    const cols = 8, cw = ROAD_W / cols;
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < cols; i++) {
        const x0 = -hw + i * cw, z0 = finishZ + r * 1.2;
        const a = project(x0, 0, z0), b = project(x0 + cw, 0, z0),
              c = project(x0 + cw, 0, z0 + 1.2), d = project(x0, 0, z0 + 1.2);
        if (!a || !b || !c || !d) continue;
        ctx.fillStyle = (i + r) % 2 ? '#111' : '#fff';
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
        ctx.closePath(); ctx.fill();
      }
    }
  }
}
