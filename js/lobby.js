'use strict';
// ------------------------------------------------- lobby: tabs, daily, settings
const TABS = ['Home', 'Shop', 'Daily', 'Settings'];
const INTRO_MSG = 'Lead your crowd down the road: grow it through <b>blue gates</b>, ' +
  'beat every army in your way — and the boss at the finish line!';

function switchTab(name) {
  for (const t of TABS) {
    $('page' + t).classList.toggle('hidden', t !== name);
    $('tab' + t).classList.toggle('active', t === name);
  }
  if (name === 'Shop') renderShop();
  if (name === 'Daily') renderDaily();
  if (name === 'Settings') renderSettings();
}

function showLobby(msgHtml, btnLabel) {
  $('lobby').classList.remove('hidden');
  for (const id of ['hud', 'coinHud', 'restartBtn', 'exitBtn', 'thumb']) $(id).classList.add('hidden');
  $('homeMsg').innerHTML = msgHtml || INTRO_MSG;
  $('btnPlay').textContent = btnLabel || 'Play';
  $('homeLevel').textContent = 'Level ' + level;
  updateHud();
  updateDailyDot();
  switchTab('Home');
}
function hideLobby() {
  $('lobby').classList.add('hidden');
  for (const id of ['hud', 'coinHud', 'restartBtn', 'exitBtn']) $(id).classList.remove('hidden');
}

// ------------------------------------------------- daily check-in & missions
const DAY_MULT = [1, 1.5, 2, 2.5, 3, 4, 6];
const MISSION_POOL = [
  {key:'win', desc:'Win # levels', base:2},
  {key:'walls', desc:'Smash # bonus walls', base:3},
  {key:'crates', desc:'Grab # weapon crates', base:4},
  {key:'boss', desc:'Defeat # bosses', base:2},
  {key:'peak', desc:'Reach a crowd of #', base:30}
];

// mission state
function missionDayNum() {
  return Math.floor(Date.now() / 86400000);
}
function missionState() {
  const dayNum = missionDayNum();
  const lastDay = parseInt(localStorage.getItem('ccr_miss_day') || '0', 10);
  if (lastDay !== dayNum) {
    localStorage.setItem('ccr_miss_day', dayNum);
    localStorage.setItem('ccr_miss_prog', JSON.stringify({win:0,walls:0,crates:0,boss:0,peak:0}));
    localStorage.setItem('ccr_miss_claimed', JSON.stringify([false,false,false]));
  }
  const prog = JSON.parse(localStorage.getItem('ccr_miss_prog') ||
    '{"win":0,"walls":0,"crates":0,"boss":0,"peak":0}');
  const claimed = JSON.parse(localStorage.getItem('ccr_miss_claimed') || '[false,false,false]');
  return { dayNum, prog, claimed };
}
function todaysMissions() {
  const dayNum = missionDayNum();
  const missions = [];
  for (let i = 0; i < 3; i++) {
    const idx = (dayNum + i * 2) % MISSION_POOL.length;
    missions.push({...MISSION_POOL[idx], idx});
  }
  return missions;
}
function missionTarget(m) {
  if (m.key === 'peak') return m.base + Math.floor((level - 1) / 2) * 10;
  return m.base;
}
function missionReward(i) {
  return Math.round((40 + (level - 1) * 10) * prestigeMult());
}
function missionAdd(key, n) {
  const st = missionState();
  if (!(key in st.prog)) st.prog[key] = 0;
  if (key === 'peak') st.prog[key] = Math.max(st.prog[key], n);
  else st.prog[key] += n;
  localStorage.setItem('ccr_miss_prog', JSON.stringify(st.prog));
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function dailyState() {
  const last = localStorage.getItem('ccr_daily_last');
  let streak = parseInt(localStorage.getItem('ccr_daily_streak') || '0', 10);
  const today = todayStr();
  if (last && last !== today && daysBetween(last, today) > 1) {
    streak = 0;                               // missed a day: streak resets
    localStorage.setItem('ccr_daily_streak', 0);
  }
  return { claimed: last === today, streak };
}
function dailyReward(i) {   // scales with progress so it always stays relevant
  return Math.round((40 + (level - 1) * 12) * DAY_MULT[i] * prestigeMult());
}
function renderDaily() {
  const st = dailyState();
  const todayIdx = st.claimed ? (st.streak - 1) % 7 : st.streak % 7;
  let html = '';
  for (let i = 0; i < 7; i++) {
    const done = st.claimed ? i <= todayIdx : i < todayIdx;
    html += '<div class="dayCard' + (done ? ' claimed' : '') +
      (i === todayIdx ? ' today' : '') + '">Day ' + (i + 1) +
      '<div class="amt">🪙 ' + dailyReward(i) + '</div>' +
      (done ? '✓' : i === todayIdx ? '★' : '&nbsp;') + '</div>';
  }
  $('dailyGrid').innerHTML = html;
  $('btnClaim').disabled = st.claimed;
  $('btnClaim').textContent = st.claimed ? 'Claimed — back tomorrow!' :
    'Claim 🪙 ' + dailyReward(todayIdx);
  renderMissions();
}

function renderMissions() {
  const st = missionState();
  const missions = todaysMissions();
  let html = '';
  for (let i = 0; i < 3; i++) {
    const m = missions[i];
    const target = missionTarget(m);
    const progress = st.prog[m.key] || 0;
    const done = progress >= target;
    const canClaim = done && !st.claimed[i];
    const reward = missionReward(i);
    const desc = m.desc.replace('#', target);
    html += '<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:8px 12px;margin:6px 0;text-align:left">' +
      '<div style="font-size:14px;font-weight:700;margin-bottom:4px">' + desc + '</div>' +
      '<div style="font-size:12px;opacity:.8;margin-bottom:6px">' + progress + ' / ' + target + '</div>' +
      '<button style="width:100%;padding:6px 18px;font-size:13px;min-width:0' +
      (canClaim ? '' : ';background:#9a9a9a;cursor:default') + '"' +
      (canClaim ? ' onclick="claimMission(' + i + ')"' : ' disabled') + '>' +
      (st.claimed[i] ? 'Claimed' : (canClaim ? 'Claim 🪙 ' + reward : 'In Progress')) +
      '</button></div>';
  }
  $('missions').innerHTML = html;
}

function claimMission(i) {
  const st = missionState();
  if (st.claimed[i]) return;
  const reward = missionReward(i);
  coins += reward;
  st.claimed[i] = true;
  localStorage.setItem('ccr_coins', coins);
  localStorage.setItem('ccr_miss_claimed', JSON.stringify(st.claimed));
  sndWin(); updateHud(); updateDailyDot(); renderMissions();
}
function claimDaily() {
  const st = dailyState();
  if (st.claimed) return;
  coins += dailyReward(st.streak % 7);
  localStorage.setItem('ccr_coins', coins);
  localStorage.setItem('ccr_daily_last', todayStr());
  localStorage.setItem('ccr_daily_streak', st.streak + 1);
  sndWin();
  updateHud(); updateDailyDot(); renderDaily();
}
function updateDailyDot() {
  const dailyClaimed = dailyState().claimed;
  const missState = missionState();
  const missions = todaysMissions();
  let missionClaimable = false;
  for (let i = 0; i < 3; i++) {
    const m = missions[i];
    const target = missionTarget(m);
    const progress = missState.prog[m.key] || 0;
    if (progress >= target && !missState.claimed[i]) {
      missionClaimable = true;
      break;
    }
  }
  $('dailyDot').style.display = (dailyClaimed && !missionClaimable) ? 'none' : 'block';
}

// ------------------------------------------------- settings
function renderSettings() {
  $('statsBox').innerHTML =
    'Game level: <b>' + level + '</b><br>' +
    'Troops: <b>Lv ' + troopLevel() + '</b> · Weapon: <b>' +
    WEAPONS[up.weapon].name + '</b><br>' +
    'Rebirth stars: <b>' + stars + '</b> (+' +
    Math.round((prestigeMult() - 1) * 100) + '% coins)<br>' +
    'Coins: <b>' + coins + '</b>';
  $('btnSound').textContent = 'Sound: ' + (soundOn ? 'On' : 'Off');
  $('btnControls').textContent = 'Controls: ' + (controls === 'touch' ? 'Touchscreen 🕹️' : 'Keyboard ⌨️');
}
function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem('ccr_sound', soundOn ? '1' : '0');
  if (soundOn) sndGood();
  renderSettings();
}
function toggleControls() {
  controls = controls === 'touch' ? 'keyboard' : 'touch';
  localStorage.setItem('ccr_controls', controls);
  renderSettings();
}
function resetProgress() {
  if (!confirm('Delete ALL progress (levels, coins, upgrades, stars)?')) return;
  ['ccr_level', 'ccr_coins', 'ccr_stars', 'ccr_daily_last', 'ccr_daily_streak',
   'ccr_sound', 'ccr_skin', 'ccr_skins', 'ccr_miss_day', 'ccr_miss_prog',
   'ccr_miss_claimed', 'ccr_controls'].forEach(k => localStorage.removeItem(k));
  Object.keys(up).forEach(k => localStorage.removeItem('ccr_up_' + k));
  if (typeof location !== 'undefined') location.reload();
}

// ------------------------------------------------- wiring
for (const t of TABS) $('tab' + t).onclick = () => { audio(); switchTab(t); };
$('btnClaim').onclick = claimDaily;
$('btnSound').onclick = toggleSound;
$('btnControls').onclick = toggleControls;
$('btnReset').onclick = resetProgress;
