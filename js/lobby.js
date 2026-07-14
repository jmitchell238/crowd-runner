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
  for (const id of ['hud', 'coinHud', 'restartBtn']) $(id).classList.add('hidden');
  $('homeMsg').innerHTML = msgHtml || INTRO_MSG;
  $('btnPlay').textContent = btnLabel || 'Play';
  $('homeLevel').textContent = 'Level ' + level;
  updateHud();
  updateDailyDot();
  switchTab('Home');
}
function hideLobby() {
  $('lobby').classList.add('hidden');
  for (const id of ['hud', 'coinHud', 'restartBtn']) $(id).classList.remove('hidden');
}

// ------------------------------------------------- daily check-in
const DAY_MULT = [1, 1.5, 2, 2.5, 3, 4, 6];
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
  $('dailyDot').style.display = dailyState().claimed ? 'none' : 'block';
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
}
function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem('ccr_sound', soundOn ? '1' : '0');
  if (soundOn) sndGood();
  renderSettings();
}
function resetProgress() {
  if (!confirm('Delete ALL progress (levels, coins, upgrades, stars)?')) return;
  ['ccr_level', 'ccr_coins', 'ccr_stars', 'ccr_daily_last', 'ccr_daily_streak',
   'ccr_sound'].forEach(k => localStorage.removeItem(k));
  Object.keys(up).forEach(k => localStorage.removeItem('ccr_up_' + k));
  if (typeof location !== 'undefined') location.reload();
}

// ------------------------------------------------- wiring
for (const t of TABS) $('tab' + t).onclick = () => { audio(); switchTab(t); };
$('btnClaim').onclick = claimDaily;
$('btnSound').onclick = toggleSound;
$('btnReset').onclick = resetProgress;
