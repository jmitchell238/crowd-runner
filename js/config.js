'use strict';
// ------------------------------------------------- constants & saved state
const ROAD_W = 10;                    // road width, world units
const ROAD_HALF = ROAD_W / 2 - 0.45;  // members bunch up inside this
const MAXR = 130;                     // max rendered members per crowd
const PALETTE = ['#e0312f', '#9b2fd6', '#2fae4a', '#ff8c1a', '#e8d227', '#d62f9b'];
const REBIRTH_LEVEL = 15;             // rebirth unlocks after beating this level

const SKINS = [
  {name:'Ninja', color:'#43b649', cost:0, sprite:'ninja'},
  {name:'Rookie', color:'#ff8c1a', cost:2000, sprite:'rookie'},
  {name:'Scout', color:'#3f9d8a', cost:5000, sprite:'scout'},
  {name:'Monk', color:'#d6336c', cost:12000, sprite:'monk'},
  {name:'Brawler', color:'#e8590c', cost:25000, sprite:'brawler'},
  {name:'Elder', color:'#e03131', cost:50000, sprite:'elder'},
  {name:'Shade', color:'#7048e8', cost:100000, sprite:'shade'},
  {name:'Ranger', color:'#a9722d', cost:250000, sprite:'ranger'}
];

// progress saved in localStorage
let level = parseInt(localStorage.getItem('ccr_level') || '1', 10);
let coins = parseInt(localStorage.getItem('ccr_coins') || '0', 10);
let stars = parseInt(localStorage.getItem('ccr_stars') || '0', 10);
let soundOn = localStorage.getItem('ccr_sound') !== '0';
let controls = localStorage.getItem('ccr_controls') ||
  (('ontouchstart' in window) ? 'touch' : 'keyboard');
let skin = parseInt(localStorage.getItem('ccr_skin') || '0', 10);
let skinsOwned = JSON.parse(localStorage.getItem('ccr_skins') || '[0]');
let gfx = localStorage.getItem('ccr_gfx') || 'pixel';
const up = {
  weapon:    parseInt(localStorage.getItem('ccr_up_weapon')    || '0', 10),
  troops:    parseInt(localStorage.getItem('ccr_up_troops')    || '0', 10),
  recruits:  parseInt(localStorage.getItem('ccr_up_recruits')  || '0', 10),
  riches:    parseInt(localStorage.getItem('ccr_up_riches')    || '0', 10),
  armor:     parseInt(localStorage.getItem('ccr_up_armor')     || '0', 10),
  scavenger: parseInt(localStorage.getItem('ccr_up_scavenger') || '0', 10),
};

// fighter levels 1..100 — each level multiplies every fighter's strength.
// Enemy armies level up with the game level, so the arms race never stops.
const troopPow   = lvl => Math.pow(1.05, lvl - 1);
const troopLevel = () => 1 + up.troops;
const enemyLevel = L => clamp(1 + Math.floor((L - 1) * 1.15), 1, 100);

// gear look changes every 10 troop levels (helmet + chest band color)
const GEAR_COLORS = [null, '#b9722d', '#cfd6dd', '#ffd23e', '#8ff3ff', '#3ee06e',
                     '#a86bff', '#ff6bd5', '#ff4747', '#20262e', '#ffffff'];
const gearColor = lvl => GEAR_COLORS[Math.min(10, Math.floor(lvl / 10))];

const WEAPONS = [
  { name: 'Fists',   pow: 1.0 },
  { name: 'Stick',   pow: 1.3 },
  { name: 'Sword',   pow: 1.6 },
  { name: 'Spear',   pow: 2.0 },
  { name: 'Hammer',  pow: 2.5 },
  { name: 'Blaster', pow: 3.2 },
];
const WEAPON_COST = [150, 450, 1200, 3200, 8000];
const SHOP_ITEMS = [
  { key: 'weapon', name: '⚔️ Weapon', max: WEAPONS.length - 1,
    cost: l => WEAPON_COST[l],
    effect: l => WEAPONS[l].name + ' — x' + WEAPONS[l].pow.toFixed(1) + ' power' },
  { key: 'troops', name: '🎖️ Troops', max: 99,
    cost: l => Math.round(50 * Math.pow(1.09, l)),
    effect: l => 'Level ' + (l + 1) + ' fighters — x' +
                 troopPow(l + 1).toFixed(2) + ' strength' },
  { key: 'recruits', name: '👥 Recruits', max: 12,
    cost: l => Math.round(60 * Math.pow(1.7, l)),
    effect: l => 'Start with ' + (1 + l * 2) + (l ? ' fighters' : ' fighter') },
  { key: 'riches', name: '💰 Riches', max: 10,
    cost: l => Math.round(80 * Math.pow(1.8, l)),
    effect: l => '+' + (l * 20) + '% coins earned' },
  { key: 'armor', name: '🛡️ Armor', max: 10,
    cost: l => Math.round(70 * Math.pow(1.8, l)),
    effect: l => l ? Math.round((1 - 1 / (1 + l * 0.12)) * 100) + '% fewer clash losses'
                   : 'No armor' },
  { key: 'scavenger', name: '📦 Scavenger', max: 6,
    cost: l => Math.round(120 * Math.pow(2, l)),
    effect: l => '+' + Math.floor(l / 2) + ' crates, +' +
                 Math.round((0.08 + l * 0.02) * 100) + '% power per crate' },
];
// end-of-level bosses cycle through these; every 5th level is a MEGA boss
const BOSS_TYPES = [
  { name: 'CRAB',    color: '#e03131', sprite: 'crab' },
  { name: 'FLAME',   color: '#ff6b35', sprite: 'flame' },
  { name: 'BEAST',   color: '#a0522d', sprite: 'beast' },
  { name: 'PHOENIX', color: '#ffa94d', sprite: 'phoenix' },
  { name: 'FIEND',   color: '#9c36b5', sprite: 'fiend' },
];

const richesMult   = () => 1 + up.riches * 0.2;
const prestigeMult = () => 1 + stars * 0.3;
const coinMult     = () => richesMult() * prestigeMult();
const armorDiv     = () => 1 + up.armor * 0.12;
const cratePower   = () => 0.08 + up.scavenger * 0.02;   // multiplicative fraction
