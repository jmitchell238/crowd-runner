'use strict';
// ------------------------------------------------- shared mutable game state
let state = 'menu';                   // menu | play | win | lose
let player, items, enemies, particles, texts, finishZ, battle, shakeT, tick = 0;
let peakCount = 1;
let crates = [], runPower = 1, coinsRun = 0, cratesTaken = 0;
let bonusWalls = [], bonusMult = 1, bonusEndZ = 0;
let hazards = [];

// weapon shown in hand: every crate grabbed bumps the visible tier by one
function visualTier() {
  return Math.min(WEAPONS.length - 1, up.weapon + cratesTaken);
}

function popParticles(x, z, color) {
  for (let i = 0; i < 5; i++) {
    particles.push({ x, z, y: rand(.4, 1.4),
      vx: rand(-3, 3), vy: rand(2, 6), vz: rand(-3, 3),
      life: rand(.35, .6), color });
  }
}

function floatText(x, z, str, color) {
  texts.push({ x, z, y: 2.2, str, color, life: 1.1 });
}
