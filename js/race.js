// The stadion: one lap of the stadium, about 192 meters, you against the runner.
// Alternate left and right to run. Each step adds speed and you slow down between steps,
// so your speed settles at roughly twice your step rate in meters per second.
const LEN = 192, PXM = 6, START = 40;          // meters, pixels per meter, x of the starting sill
const VW = 240, VH = 112, WORLD = START + LEN * PXM + 90;
const IMPULSE = 2, DRAG = 1, VMAX = 20, TAU = .7;
const TOUCH_IMPULSE = 2.7; // thumbs on glass can't tap as fast as fingers on keys, so each tap counts a little more
const LANE_HIM = 80, LANE_YOU = 101;          // where each runner's feet touch the track

function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// The whole stadium, painted once: sky, hills, a grass embankment full of spectators, the sand track, and two stone sills.
function paintStadium() {
  const cv = document.createElement('canvas'); cv.width = WORLD; cv.height = VH;
  const c = cv.getContext('2d');
  px(c, 0, 0, WORLD, 24, '#cfe6f5');
  for (let x = 0; x < WORLD; x++) { const h = 4 + Math.round(3 * Math.sin(x / 37) + 2 * Math.sin(x / 13)); px(c, x, 26 - h, 1, h + 6, '#9fbb60'); }
  px(c, 0, 30, WORLD, 32, '#8aa850');
  const robes = ['#c8643c', '#f4efe4', '#3d6fa8', '#e0b44c', '#6b3fa0', '#4f8f3a', '#f6f2e8', '#a14c2c'];
  for (let y = 33; y < 58; y += 6) for (let x = (y % 12) / 2; x < WORLD; x += 5) {
    if (hash(x, y) < .25) continue;
    px(c, x, y, 2, 2, hash(y, x) < .5 ? '#efc29c' : '#c88b62');
    px(c, x, y + 2, 2, 2, robes[(hash(x, y + 1) * robes.length) | 0]);
  }
  px(c, 0, 61, WORLD, 2, '#cfc3a8');
  px(c, 0, 63, WORLD, 40, '#e8cf9c');
  for (let i = 0; i < WORLD * 3; i++) px(c, (hash(i, 7) * WORLD) | 0, 63 + ((hash(7, i) * 40) | 0), 1, 1, '#d9bb82');
  for (let x = 0; x < WORLD; x += 8) px(c, x, 83, 4, 1, '#fbf5e6');
  px(c, 0, 103, WORLD, 2, '#cfc3a8');
  px(c, 0, 105, WORLD, VH - 105, '#9fbb60');
  for (const m of [0, LEN]) { // the balbis: a stone starting sill with grooves for your toes
    const x = START + m * PXM;
    px(c, x - 2, 63, 5, 40, '#e6e1d6'); px(c, x - 2, 63, 1, 40, '#bdb6a6');
    for (let y = 65; y < 103; y += 4) px(c, x, y, 2, 1, '#a9a191');
  }
  const fx = START + LEN * PXM; // the finish post, and quarter markers along the top edge
  px(c, fx + 4, 44, 4, 18, '#f6f2e8'); px(c, fx + 3, 42, 6, 3, '#d9d2c2'); px(c, fx + 8, 46, 6, 4, '#c0303f');
  for (const m of [48, 96, 144]) px(c, START + m * PXM, 55, 2, 7, '#f6f2e8');
  return cv;
}

export function createRace({ dialog, avatar, runner, onFinish, getBest, setBest, stakes }) {
  const $ = (s) => dialog.querySelector(s);
  const cv = $('#race-canvas'); cv.width = VW; cv.height = VH;
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
  const bg = paintStadium();
  let st, raf = 0, timers = [];

  function call(text) { $('#race-call').textContent = text; $('#race-call').classList.toggle('show', !!text); }
  function clear() { cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = []; }
  function reset() {
    clear();
    const T = 11.6 + Math.random() * .8; // the runner's finishing time for this race: about 12 seconds
    st = { phase: 'ready', t: 0, you: { d: 0, v: 0, last: null, fin: null }, him: { d: 0, vmax: LEN / (T - TAU), fin: null }, react: null, staked: false };
    $('#race-stakes').textContent = stakes().text;
    call(''); hud(); draw();
  }
  function hud() {
    $('#race-time').textContent = `${st.t.toFixed(2)} s`;
    $('#race-you').style.left = `${Math.min(100, (st.you.d / LEN) * 100)}%`;
    $('#race-him').style.left = `${Math.min(100, (st.him.d / LEN) * 100)}%`;
    $('#race-start').textContent = st.phase === 'done' ? 'Race again' : 'Line up';
    $('#race-start').disabled = !(st.phase === 'ready' || st.phase === 'done');
  }
  function lineUp() {
    if (!(st.phase === 'ready' || st.phase === 'done')) return;
    reset();
    $('#race-result').hidden = true;
    st.staked = stakes().staked; // locked in at the start line
    st.phase = 'marks'; call('On your marks'); hud();
    timers.push(setTimeout(() => { st.phase = 'set'; call('Get set'); }, 1000));
    timers.push(setTimeout(go, 1900 + Math.random() * 1200));
  }
  function go() {
    st.phase = 'go'; st.t0 = performance.now(); st.last = st.t0; call('Go!');
    timers.push(setTimeout(() => { if (st.phase === 'go') call(''); }, 700));
    raf = requestAnimationFrame(tick);
  }
  function falseStart() {
    clear();
    st.phase = 'ready'; call('False start!'); hud();
    result('<p class="race-verdict">False start.</p><p>At the ancient Games, judges whipped runners who left early. Here you just line up again.</p>');
  }
  function step(foot, touch = false) {
    if (st.phase === 'marks' || st.phase === 'set') return falseStart();
    if (st.phase !== 'go' || st.you.fin != null || st.you.last === foot) return; // feet have to alternate
    st.you.last = foot;
    st.you.v = Math.min(VMAX, st.you.v + (touch ? TOUCH_IMPULSE : IMPULSE));
    if (st.react == null) st.react = (performance.now() - st.t0) / 1000;
    const f = $(`[data-foot="${foot}"]`); f.classList.add('hit'); setTimeout(() => f.classList.remove('hit'), 90);
  }
  function tick(now) {
    const dt = Math.min(.05, (now - st.last) / 1000); st.last = now;
    st.t = (now - st.t0) / 1000;
    const y = st.you, h = st.him;
    if (y.fin == null) {
      y.v *= Math.exp(-DRAG * dt);
      const d0 = y.d; y.d += y.v * dt;
      if (y.d >= LEN) y.fin = st.t - dt + dt * (LEN - d0) / (y.d - d0);
    }
    if (h.fin == null) {
      const d0 = h.d; h.d = h.vmax * (st.t - TAU * (1 - Math.exp(-st.t / TAU)));
      if (h.d >= LEN) h.fin = st.t - dt + dt * (LEN - d0) / (h.d - d0);
    }
    hud(); draw();
    const gaveUp = h.fin != null && y.fin == null && st.t - h.fin > 8;
    if ((y.fin != null && h.fin != null) || gaveUp) return finish(gaveUp);
    raf = requestAnimationFrame(tick);
  }
  function finish(gaveUp) {
    st.phase = 'done'; call(''); hud();
    const y = st.you.fin, h = st.him.fin, best = getBest();
    const won = !gaveUp && y < h;
    if (won && (best == null || y < best)) setBest(y);
    const newBest = getBest();
    const verdict = gaveUp ? 'The runner wins. You can stop for water any time.'
      : won ? `You win by ${(h - y).toFixed(2)} s!` : y === h ? 'A dead heat!' : `The runner wins by ${(y - h).toFixed(2)} s.`;
    const stat = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
    result(`<p class="race-verdict">${verdict}</p><dl class="race-stats">${
      stat('Your time', gaveUp ? 'Did not finish' : `${y.toFixed(2)} s`) + stat('Runner', `${h.toFixed(2)} s`)
      + stat('Reaction', st.react == null ? 'No start' : `${st.react.toFixed(2)} s`) + stat('Your best win', newBest == null ? 'None yet' : `${newBest.toFixed(2)} s`)
    }</dl>${onFinish({ won, staked: st.staked, time: y, margin: h - y }) || ''}`);
    $('#race-stakes').textContent = stakes().text;
  }
  function result(html) { $('#race-result').innerHTML = html; $('#race-result').hidden = false; }

  function draw() {
    const youX = START + st.you.d * PXM, himX = START + st.him.d * PXM;
    const camX = Math.round(Math.max(0, Math.min(WORLD - VW, youX - 90)));
    c.drawImage(bg, camX, 0, VW, VH, 0, 0, VW, VH);
    const frame = (e, moving) => (moving ? (Math.floor(e.d * 1.3) % 2 ? 1 : 2) : 0);
    const hs = runner(frame(st.him, st.phase === 'go' && st.him.fin == null));
    const ys = avatar(frame(st.you, st.phase === 'go' && st.you.v > .3 && st.you.fin == null));
    for (const [img, x, feet] of [[hs, himX, LANE_HIM], [ys, youX, LANE_YOU]]) {
      const sx = Math.round(x - camX - 8), sy = feet - img.height;
      px(c, sx + 3, feet - 1, 10, 2, 'rgba(0,0,0,.18)');
      c.drawImage(img, sx, sy);
    }
  }

  // Listen on the document: once the race starts, the focused Line up button is disabled and focus can fall back to <body>.
  document.addEventListener('keydown', (e) => {
    if (!dialog.open) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); if (!e.repeat) step('L'); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); if (!e.repeat) step('R'); }
    else if ((k === ' ' || k === 'Enter') && !e.target.closest('button')) { e.preventDefault(); lineUp(); }
  });
  dialog.querySelectorAll('[data-foot]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); step(b.dataset.foot, e.pointerType === 'touch'); });
    b.addEventListener('contextmenu', (e) => e.preventDefault()); // a long press shouldn't open a menu mid-race
  });
  $('#race-start').addEventListener('click', lineUp);
  dialog.addEventListener('close', () => { reset(); $('#race-result').hidden = true; });
  reset();
  return {
    open() { reset(); $('#race-result').hidden = true; dialog.showModal(); $('#race-start').focus(); },
  };
}
