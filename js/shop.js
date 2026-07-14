'use strict';
// ------------------------------------------------- HUD & upgrade shop
const $ = id => document.getElementById(id);

function updateHud() {
  const txt = '🪙 ' + coins;
  $('coinHud').textContent = txt + (stars > 0 ? '   ⭐ ' + stars : '');
  $('lobbyCoins').textContent = txt;
  $('lobbyStars').textContent = stars > 0 ? '⭐ ' + stars : '';
  const pl = $('powerLabel');
  if (runPower > 1.01) {
    pl.textContent = '⚔️ power x' + (runPower >= 10 ? runPower.toFixed(0) : runPower.toFixed(1));
    pl.style.display = '';
  } else pl.style.display = 'none';
}

function renderShop() {
  const shop = $('shop');
  let html = '<div id="shopCoins">🪙 ' + coins + '</div><div id="shopItems">';
  for (const it of SHOP_ITEMS) {
    const lvl = up[it.key], maxed = lvl >= it.max;
    const cost = maxed ? 0 : it.cost(lvl);
    html += '<div class="shopItem"><h4>' + it.name +
      ' <span class="lv">Lv ' + lvl + '</span></h4>' +
      '<div class="eff">' + it.effect(lvl) +
      (maxed ? '' : '<br>&rarr; ' + it.effect(lvl + 1)) + '</div>' +
      '<button data-key="' + it.key + '"' +
      (maxed || coins < cost ? ' disabled' : '') + '>' +
      (maxed ? 'MAX' : 'Upgrade — 🪙 ' + cost) + '</button></div>';
  }
  html += '</div>';
  // rebirth: the long game — trade all progress for a permanent coin boost
  const can = level > REBIRTH_LEVEL;
  html += '<div class="shopItem" style="width:340px;margin-top:10px">' +
    '<h4>⭐ Rebirth <span class="lv">' + stars + ' star' + (stars === 1 ? '' : 's') +
    (stars > 0 ? ' — +' + Math.round((prestigeMult() - 1) * 100) + '% coins' : '') +
    '</span></h4>' +
    '<div class="eff">Reset your level, coins and upgrades for a permanent ' +
    '+30% coin boost.' +
    (can ? '' : ' Unlocks after beating level ' + REBIRTH_LEVEL +
     ' (you are on level ' + level + ').') + '</div>' +
    '<button id="btnRebirth"' + (can ? '' : ' disabled') + '>Rebirth ⭐</button></div>';
  shop.innerHTML = html;
  shop.querySelectorAll('button[data-key]').forEach(b =>
    b.onclick = () => buyUpgrade(b.dataset.key));
  const rb = shop.querySelector('#btnRebirth');
  if (rb) rb.onclick = doRebirth;
}

function buyUpgrade(key) {
  const it = SHOP_ITEMS.find(i => i.key === key);
  const lvl = up[key];
  if (lvl >= it.max || coins < it.cost(lvl)) return;
  coins -= it.cost(lvl); up[key]++;
  localStorage.setItem('ccr_coins', coins);
  localStorage.setItem('ccr_up_' + key, up[key]);
  sndGood(); renderShop(); updateHud();
}

function doRebirth() {
  if (level <= REBIRTH_LEVEL) return;
  if (!confirm('Rebirth resets your level, coins and ALL upgrades in exchange ' +
               'for a permanent +30% coin boost. Continue?')) return;
  stars++; level = 1; coins = 0;
  for (const k of Object.keys(up)) { up[k] = 0; localStorage.setItem('ccr_up_' + k, 0); }
  localStorage.setItem('ccr_stars', stars);
  localStorage.setItem('ccr_level', 1);
  localStorage.setItem('ccr_coins', 0);
  sndWin();
  buildLevel(level);
  $('levelLabel').textContent = 'Level 1';
  $('homeLevel').textContent = 'Level 1';
  updateHud(); renderShop();
}
