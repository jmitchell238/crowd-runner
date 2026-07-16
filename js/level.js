'use strict';
// ------------------------------------------------- level generation
function buildLevel(L) {
  items = []; enemies = []; particles = []; texts = []; battle = null;
  shakeT = 0; crates = []; coinsRun = 0; cratesTaken = 0;
  runPower = troopPow(troopLevel()) * WEAPONS[up.weapon].pow;
  player = makeCrowd(0, 0, 1 + up.recruits * 2, SKINS[skin].color);
  player.speed = Math.min(11 + L * 0.35, 18);
  player.targetX = 0;
  peakCount = player.count;

  let expected = player.count;
  let z = 26;
  const nGates = 3 + Math.min(L, 7);
  const nEnemies = 1 + Math.min(Math.ceil(L / 2), 8);
  // build a shuffled plan: first item is always a gate
  const plan = ['gate'];
  const rest = [];
  for (let i = 1; i < nGates; i++) rest.push('gate');
  for (let i = 0; i < nEnemies; i++) rest.push('enemy');
  for (let i = rest.length - 1; i > 0; i--) {
    const j = irand(0, i); [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  plan.push(...rest);

  let pi = 0;
  for (const kind of plan) {
    if (kind === 'gate') {
      const good = goodOp(L, expected);
      let other;
      if (Math.random() < 0.15) {
        other = goodOp(L, expected);
        const leftExp = applyOp(good, expected);
        const rightExp = applyOp(other, expected);
        const leftGood = leftExp > rightExp;
        items.push({
          z,
          left:  leftGood ? good : other,
          right: leftGood ? other : good,
          used: false,
          mx: L >= 6 && Math.random() < 0.3 ? rand(1.2, 2.2) : 0,
          ms: Math.random() * 0.6 + 0.8,
          m0: rand(0, 6.28),
        });
        expected = Math.max(leftExp, rightExp);
      } else {
        other = Math.random() < 0.62 ? badOp() : { t: 'add', v: irand(1, 3) };
        const goodLeft = Math.random() < 0.5;
        items.push({
          z,
          left:  goodLeft ? good : other,
          right: goodLeft ? other : good,
          used: false,
          mx: L >= 6 && Math.random() < 0.3 ? rand(1.2, 2.2) : 0,
          ms: Math.random() * 0.6 + 0.8,
          m0: rand(0, 6.28),
        });
        expected = applyOp(good, expected);
      }
    } else {
      // enemy squads level up with the game level; some carry weapons (L5+)
      const eLvl = clamp(enemyLevel(L) + irand(-2, 2), 1, 100);
      let tier = 0;
      if (Math.random() < clamp((L - 4) * 0.08, 0, 0.6))
        tier = irand(1, Math.min(2 + Math.floor(L / 6), 5));
      const ePow = troopPow(eLvl) * WEAPONS[tier].pow;
      const ratio = runPower / ePow;   // player per-fighter advantage
      const cnt = Math.max(2, Math.ceil(expected * rand(0.35, 0.65) *
                                        Math.pow(ratio, 0.6)));
      const ex = rand(-ROAD_W / 2 + 2.2, ROAD_W / 2 - 2.2);
      const charKeys = ['knight', 'barbarian', 'rogue', 'mage', 'hooded'];
      enemies.push(Object.assign(
        makeCrowd(ex, z, cnt, PALETTE[pi % PALETTE.length]),
        { sprite: charKeys[pi % 5], radius: 1.6 + Math.sqrt(cnt) * 0.5, boss: false, dead: false,
          count0: cnt, tier, pow: ePow, lvl: eLvl, gear: gearColor(eLvl) }));
      pi++;
      expected = Math.max(1, expected - Math.ceil(cnt / ratio));
    }
    z += rand(30, 42);
  }

  // leave slack for hazard losses — players rarely dodge everything
  const nHazPlanned = L >= 3 ? Math.min(1 + Math.floor((L - 3) / 2), 5) : 0;
  expected = Math.max(1, Math.round(expected * Math.pow(0.93, nHazPlanned)));

  // boss army blocks the whole road just before the finish (armed from L8+)
  const bLvl = clamp(enemyLevel(L) + 3, 1, 100);
  let bTier = 0;
  if (L >= 8) bTier = Math.min(1 + Math.floor((L - 8) / 4), 5);
  const bPow = troopPow(bLvl) * WEAPONS[bTier].pow;
  const bRatio = runPower / bPow;
  const bType = BOSS_TYPES[(L - 1) % BOSS_TYPES.length];
  const mega = L % 5 === 0;                  // every 5th level: MEGA boss
  let bossCnt = Math.max(4, Math.ceil(expected * rand(0.7, 0.9) *
                                      Math.pow(bRatio, 0.85)));
  if (mega) bossCnt = Math.ceil(bossCnt * 1.25);
  z += 12;
  const fortress = L % 3 === 0 && L % 5 !== 0;
  let fortHP = 0;
  if (fortress) {
    fortHP = Math.max(30, Math.ceil(expected * rand(1.0, 1.3) * Math.pow(bRatio, 0.85) * 10));
    enemies.push(Object.assign(
      makeCrowd(0, z, fortHP, '#77655a', true),
      { radius: 3.5, boss: true, fort: true, dead: false, count0: fortHP,
        tier: bTier, pow: bPow, lvl: bLvl, gear: null,
        type: { name: 'FORTRESS', color: '#77655a' }, mega: false }));
  } else {
    enemies.push(Object.assign(
      makeCrowd(0, z, bossCnt, bType.color, true),
      { radius: 3.5, boss: true, dead: false, count0: bossCnt,
        tier: bTier, pow: bPow, lvl: bLvl, gear: gearColor(bLvl),
        type: bType, mega }));
  }
  finishZ = z + 22;

  // bonus walls after the finish line — smash as many as your leftovers allow
  bonusWalls = []; bonusMult = 1;
  const leftover = fortress
    ? Math.max(1, expected - Math.ceil(fortHP / (bRatio * 10)))
    : Math.max(1, expected - Math.ceil(bossCnt / bRatio));
  const MULTS = [2, 3, 4, 6, 10];
  const FRACS = [0.4, 0.9, 1.5, 2.3, 3.4];
  let prevNeed = 0;
  for (let i = 0; i < MULTS.length; i++) {
    const need = Math.max(prevNeed + 1, Math.round(leftover * FRACS[i]));
    bonusWalls.push({ z: finishZ + 14 + i * 15, need, mult: MULTS[i], broken: false });
    prevNeed = need;
  }
  bonusEndZ = finishZ + 14 + MULTS.length * 15 + 4;

  // weapon crates to grab mid-run (scavenger upgrade adds more)
  const nCrates = 1 + Math.min(Math.floor(L / 2), 3) + Math.floor(up.scavenger / 2);
  for (let i = 0; i < nCrates; i++) {
    for (let tries = 0; tries < 12; tries++) {
      const cz = rand(45, finishZ - 45);
      if (items.some(g => Math.abs(g.z - cz) < 7) ||
          enemies.some(e => Math.abs(e.z - cz) < 9) ||
          crates.some(c => Math.abs(c.z - cz) < 10)) continue;
      crates.push({ x: rand(-ROAD_W / 2 + 1.6, ROAD_W / 2 - 1.6), z: cz,
                    done: false, taken: false });
      break;
    }
  }

  // saws & spike strips from level 3 on
  hazards = [];
  if (nHazPlanned > 0) {
    for (let i = 0; i < nHazPlanned; i++) {
      for (let tries = 0; tries < 15; tries++) {
        const hz = rand(55, finishZ - 50);
        if (items.some(g => Math.abs(g.z - hz) < 8) ||
            enemies.some(e => Math.abs(e.z - hz) < 10) ||
            crates.some(c => Math.abs(c.z - hz) < 8) ||
            hazards.some(o => Math.abs(o.z - hz) < 14)) continue;
        const r = Math.random();
        if (r < 0.4) {
          hazards.push({ type: 'saw', z: hz, x0: rand(-1.5, 1.5), amp: rand(2, 3.4),
                         spd: rand(0.9, 1.6), phase: rand(0, 6.28), r: 1.3, done: false });
        } else if (r < 0.7) {
          const wSpk = rand(3.2, 4.5);
          const x0 = rand(-ROAD_W / 2 + 0.6, ROAD_W / 2 - 0.6 - wSpk);
          hazards.push({ type: 'spikes', z: hz, x0, x1: x0 + wSpk, done: false });
        } else if (L >= 5) {
          const x0 = rand(-ROAD_W / 2 + 0.6, ROAD_W / 2 - 0.6 - 2.6);
          hazards.push({ type: 'pit', z: hz, x0, x1: x0 + rand(2.6, 3.8), done: false });
        } else {
          continue;
        }
        break;
      }
    }
  }
}
