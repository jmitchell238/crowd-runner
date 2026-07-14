'use strict';
// ---------------------------------------------------------------- audio
let AC = null;
function audio() {
  if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  return AC;
}
function beep(freq, dur, type = 'sine', gain = 0.15, slide = 0) {
  if (!soundOn) return;
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, ac.currentTime + dur);
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur);
}
const sndGood = () => { beep(620, .12, 'triangle', .18, 260); };
const sndBad  = () => { beep(190, .22, 'sawtooth', .14, -70); };
const sndPop  = () => { beep(rand(140, 220), .05, 'square', .05); };
const sndSmash = () => { beep(120, .18, 'square', .22, -40);
                         beep(700, .08, 'triangle', .15, -200); };
const sndWin  = () => { [523, 659, 784, 1047].forEach((f, i) =>
                          setTimeout(() => beep(f, .18, 'triangle', .2), i * 110)); };
const sndLose = () => { [330, 262, 196].forEach((f, i) =>
                          setTimeout(() => beep(f, .25, 'sawtooth', .13), i * 160)); };
