// Little Athens: a small top-down walkaround with the site's toys inside.
import { FIGURES, paintSchool, hotspot } from './school.js?v=20261009w';
import { createRace } from './race.js?v=20261009w';
import { createWeather, currentWeather } from './weather.js?v=20261009w';
import { CREATURES, TILE, W, H, BUILDINGS, NPCS, SIGNS, RINK, SANDAL_SPOTS, MAP_PLACES, ITEMS, itemById, avatarCanvas, boatCanvas, buildGrid, isSolid, isOlive, renderWorld, paintWater, spriteCanvas } from './world.js?v=20261009w';

const HF = () => window.HF || { foundEgg() {}, toast() {}, openDiary() {}, store: { get: (k, d) => d, set() {} } };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);

/* ---------------- World setup ---------------- */
const VIEW_W = 15, VIEW_H = 10;
const canvas = $('#world');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W * TILE; canvas.height = VIEW_H * TILE;
ctx.imageSmoothingEnabled = false;

const grid = buildGrid();
const base = renderWorld(grid);
const waterFrames = [0, 4, 8, 12].map((f) => {
  const cv = document.createElement('canvas'); cv.width = base.width; cv.height = base.height;
  const c = cv.getContext('2d'); c.drawImage(base, 0, 0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === '~') paintWater(c, x * TILE, y * TILE, x, y, f);
  return cv;
});

const saved = HF().store?.get?.('hf-play-pos', null);
const player = { tx: saved?.tx ?? 18, ty: saved?.ty ?? 11, dir: saved?.dir ?? 'up', moving: false, t: 0, fromX: 0, fromY: 0, step: 0, walkPhase: 0 };
if (isSolid(grid, player.tx, player.ty)) { player.tx = 18; player.ty = 11; }
// Hatchlings from the Machine Room incubator move into the Agora and wander its grass.
const HATCH_SPOTS = [[12, 10], [14, 9], [16, 11], [19, 9], [20, 11], [22, 10], [13, 12], [19, 12], [24, 9]];
const errands = HF().store?.get?.('hf-errands', {}) || {};
const hatched = (HF().store?.get?.('hf-hatched', []) || []).filter((id) => CREATURES[id] && !(errands[id]?.back > Date.now())); // away on an errand from the Machine Room
const hatchNpcs = hatched.map((id, i) => ({ id: `hatch-${id}`, creature: id, x: HATCH_SPOTS[i][0], y: HATCH_SPOTS[i][1], sprite: `hatch:${id}`, facing: 'left', wander: true, box: [11, 8, 24, 12], on: ['.', ',', '*'] }));
const npcs = [...NPCS, ...hatchNpcs].map((n) => ({ ...n, tx: n.x, ty: n.y, dir: n.facing, moving: false, t: 0, fromX: n.x, fromY: n.y, step: 0, nextWander: 1500 + Math.random() * 1500 }));

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const STEP_MS = 165, RUN_MS = 100;
let running = false; // hold B on the touch pad, or Shift on a keyboard
player.dur = STEP_MS;

/* ---------------- Input ---------------- */
const held = new Set();
let queued = null; // a tap that started and ended between frames still counts
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
const screen = $('#game');
function inDialogOrModal() { return !$('#dlg').hidden || document.querySelector('dialog[open]'); }
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, dialog')) return;
  if (KEYMAP[e.key]) { if (dlg.choosing) return; held.add(KEYMAP[e.key]); if (!e.repeat) queued = KEYMAP[e.key]; e.preventDefault(); }
  else if ((e.key === 'm' || e.key === 'M') && !e.repeat) { e.preventDefault(); openMap(); }
  else if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') { if (e.target.closest('button') && e.target !== screen) return; e.preventDefault(); pressA(); }
});
document.addEventListener('keyup', (e) => { if (KEYMAP[e.key]) held.delete(KEYMAP[e.key]); });
document.addEventListener('keydown', (e) => { if (e.key === 'Shift') running = true; });
document.addEventListener('keyup', (e) => { if (e.key === 'Shift') running = false; });
window.addEventListener('blur', () => { held.clear(); running = false; });
// Touch joystick: drag the knob, and the avatar walks whichever way it points most (up, down, left, or right).
const stick = $('#stick');
if (stick) {
  const knob = stick.querySelector('.stick-knob');
  let pid = null, dir = null;
  const steer = (d) => {
    // Each fresh push is one press of an arrow for the cheat code (up, up, down, down, left, right, left, right, B, A).
    if (d && d !== dir) HF().konami?.(`Arrow${d[0].toUpperCase()}${d.slice(1)}`);
    if (dir && dir !== d) held.delete(dir);
    if (d && !held.has(d)) { held.add(d); if (d !== dir) queued = d; }
    dir = d;
  };
  const track = (e) => {
    const r = stick.getBoundingClientRect(), reach = r.width / 2 - knob.offsetWidth / 2;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > reach) { dx *= reach / dist; dy *= reach / dist; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    steer(dist < 12 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };
  const release = () => { pid = null; steer(null); knob.style.transform = ''; stick.classList.remove('active'); };
  stick.addEventListener('pointerdown', (e) => { e.preventDefault(); pid = e.pointerId; try { stick.setPointerCapture(pid); } catch (err) { /* synthetic events have no live pointer */ } stick.classList.add('active'); track(e); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === pid) track(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => stick.addEventListener(ev, (e) => { if (e.pointerId === pid) release(); }));
}
$('#abtn').addEventListener('click', pressA);
$('#abtn').addEventListener('pointerdown', () => HF().konami?.('a'));
const bbtn = $('#bbtn');
if (bbtn) {
  bbtn.addEventListener('pointerdown', (e) => { e.preventDefault(); try { bbtn.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ } running = true; HF().konami?.('b'); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => bbtn.addEventListener(ev, () => { running = false; }));
  bbtn.addEventListener('contextmenu', (e) => e.preventDefault());
}
screen.addEventListener('click', () => screen.focus());
$('#dlg').addEventListener('click', (e) => { if (!e.target.closest('button')) advance(); });

/* ---------------- Dialogue ---------------- */
const dlg = { pages: [], i: 0, typing: false, full: '', shown: 0, choices: null, choosing: false, resolve: null };
function say(pages, choices = null) {
  return new Promise((resolve) => {
    held.clear(); queued = null;
    Object.assign(dlg, { pages: Array.isArray(pages) ? pages : [pages], i: 0, choices, resolve, choosing: false });
    $('#dlg').hidden = false;
    showPage();
  });
}
function showPage() {
  dlg.full = dlg.pages[dlg.i]; dlg.shown = reduceMotion ? dlg.full.length : 0; dlg.typing = !reduceMotion;
  $('#dlg-choices').innerHTML = '';
  renderText();
}
function renderText() {
  $('#dlg-text').textContent = dlg.full.slice(0, Math.floor(dlg.shown));
  const last = dlg.i === dlg.pages.length - 1;
  $('#dlg-more').style.visibility = !dlg.typing && !(last && dlg.choices) ? 'visible' : 'hidden';
  if (!dlg.typing && last && dlg.choices && !dlg.choosing) {
    dlg.choosing = true;
    const box = $('#dlg-choices');
    dlg.choices.forEach((c, idx) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = c.label;
      b.addEventListener('click', () => closeDialog(c.value));
      b.addEventListener('keydown', (e) => {
        const bs = [...box.children];
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); bs[(idx + 1) % bs.length].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); bs[(idx - 1 + bs.length) % bs.length].focus(); }
        if (e.key === 'Escape') closeDialog(null);
      });
      box.appendChild(b);
    });
    box.firstChild?.focus();
  }
}
function closeDialog(value) {
  $('#dlg').hidden = true; dlg.choosing = false;
  screen.focus();
  const r = dlg.resolve; dlg.resolve = null; r && r(value);
}
function advance() {
  if (dlg.typing) { dlg.shown = dlg.full.length; dlg.typing = false; renderText(); return; }
  if (dlg.choosing) return;
  if (dlg.i < dlg.pages.length - 1) { dlg.i++; showPage(); }
  else closeDialog(null);
}


/* ---------------- Coins: earned around Athens, spent at the blackjack table ---------------- */
const MAX_EARN = 1000; // no single reward pays more than this
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
const wallet = {
  get coins() { return Math.max(0, Math.floor(Number(lsGet('hf-coins', 0)) || 0)); },
  set coins(v) { lsSet('hf-coins', Math.max(0, Math.floor(v))); renderCoins(); },
};
function renderCoins() {
  const n = wallet.coins.toLocaleString();
  const el = $('#coin-count'); if (el) el.textContent = n;
  const bj = $('#bj-coins'); if (bj) bj.textContent = n;
}
function earn(amount, label = '') {
  const got = Math.min(MAX_EARN, Math.max(0, Math.floor(amount)));
  wallet.coins = wallet.coins + got;
  const hud = $('#coins');
  if (hud) {
    const f = document.createElement('span'); f.className = 'coin-float'; f.textContent = `+${got}`;
    hud.appendChild(f); setTimeout(() => f.remove(), 1400);
    hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump');
  }
  return got;
}
const cooldowns = lsGet('hf-cooldowns', {});
const ready = (key, ms) => Date.now() - (cooldowns[key] || 0) >= ms;
// How long each way of earning coins needs to rest, so nobody can farm Athens.
const COOLDOWN = { olives: 5 * 60e3, cat: 20 * 60e3, plato: 30 * 60e3, stadion: 10 * 60e3 };
const leftOf = (key) => Math.max(0, COOLDOWN[key] - (Date.now() - (cooldowns[key] || 0)));
const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
const inTime = (ms) => {
  if (ms < 60e3) return plural(Math.max(1, Math.ceil(ms / 1000)), 'second');
  const m = Math.ceil(ms / 60e3);
  return m < 60 ? plural(m, 'minute') : plural(Math.floor(m / 60), 'hour') + (m % 60 ? ` ${plural(m % 60, 'minute')}` : '');
};
const used = (key) => { cooldowns[key] = Date.now(); lsSet('hf-cooldowns', cooldowns); };
renderCoins();

// What the avatar owns and wears. Outfits always have one item; other slots can be empty.
const wardrobe = Object.assign({ owned: ['chiton'], equipped: { outfit: 'chiton' } }, lsGet('hf-wardrobe', {}));
const saveWardrobe = () => lsSet('hf-wardrobe', wardrobe);
const companion = { x: null, y: null };

/* ---------------- Town request board: one small job a day ---------------- */
// The board by the main road, across the path from the Agora market, posts one request a day, picked at random the first time anyone looks. Fetch jobs hide
// something in town, delivery jobs start with one person and end with another, and the others ask you to make the rounds.
const NAMES = { socrates: 'Socrates', plato: 'Plato', owl: 'the owl', cat: 'the cat', merchant: 'the merchant', runner: 'the runner', captain: 'the captain', bank: 'the bank', library: 'the library', parthenon: 'the Parthenon', academy: 'the Academy' };
const REQUESTS = [
  { id: 'sandal', pay: 500, kind: 'fetch', item: 'sandal', thing: 'sandal', to: 'socrates', post: 'Socrates has lost a sandal again. He says he does not need it. He would like it back.',
    found: 'You found a sandal. Leather, well worn, and it smells faintly of philosophy.', thanks: ['"My sandal! I did not need it, of course. The unexamined foot is not worth shoeing."'] },
  { id: 'purse', pay: 450, kind: 'fetch', item: 'purse', thing: 'coin purse', to: 'bank', post: 'The banker dropped his coin purse on the way to work. Please return it to the bank.',
    found: 'A heavy little coin purse, tied with gold string.', thanks: ['The banker counts every coin twice.', '"All here. Honesty is rarer than silver."'] },
  { id: 'compass', pay: 400, kind: 'fetch', item: 'compass', thing: 'compass', to: 'captain', post: 'The ship captain lost a compass and would like to stop sailing in circles.',
    found: 'A brass compass. The needle still points north, which is reassuring.', thanks: ['"My compass! Now I know which way Egypt is again."'] },
  { id: 'yarn', pay: 350, kind: 'fetch', item: 'yarn', thing: 'ball of yarn', to: 'cat', post: "The cat's ball of yarn rolled away. The cat is pretending not to care.",
    found: 'A ball of red yarn, slightly chewed.', thanks: ['The cat bats the yarn once, then ignores it completely. It is clearly delighted.'] },
  { id: 'feather', pay: 350, kind: 'fetch', item: 'feather', thing: 'feather', to: 'owl', post: "Athena's owl dropped a feather and wants it back for its nest.",
    found: 'A soft gray owl feather. It looks wise, somehow.', thanks: ['"Hoo. Thank you. Wisdom is mostly remembering where you left things."'] },
  { id: 'scroll', pay: 400, kind: 'deliver', from: 'plato', to: 'library', thing: 'scroll', post: "Plato's library scroll is overdue. Pick it up from Plato and return it to the library.",
    got: ['"Ah, yes. The Odyssey. I meant to finish it. Would you take it back for me?"', 'You take the scroll.'], thanks: ['You slide the scroll back onto its shelf. The librarian waives the late fee, this once.'] },
  { id: 'letter', pay: 300, kind: 'deliver', from: 'merchant', to: 'socrates', thing: 'letter', post: 'The merchant has a letter for Socrates. Please carry it across town.',
    got: ['"A letter for Socrates. He never answers them, but deliver it anyway."', 'You take the letter.'], thanks: ['Socrates reads it. "It is a question. Wonderful. I will answer it with another question."'] },
  { id: 'olives', pay: 350, kind: 'olives', to: 'merchant', thing: 'basket of olives', post: 'The merchant needs a basket of fresh olives. Pick some from any olive tree and bring them over.',
    thanks: ['"Beautiful olives. These will sell before lunch."'] },
  { id: 'news', pay: 400, kind: 'visit', stops: ['runner', 'merchant', 'owl'], post: 'Town crier wanted: tell the runner, the merchant, and the owl that the games start tomorrow.',
    stop: (who) => `You tell ${NAMES[who]} that the games start tomorrow.`, thanks: ['Everyone has heard the news. The whole town is talking about the games.'] },
  { id: 'tour', pay: 400, kind: 'visit', stops: ['parthenon', 'academy', 'library'], post: 'A visitor from Sparta wants a tour. Show them the Parthenon, the Academy, and the library.',
    stop: (who) => `You show the Spartan visitor ${NAMES[who]}. They are trying very hard not to look impressed.`, thanks: ['The tour is over. The Spartan admits, quietly, that Athens is nice.'] },
];
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
let request = lsGet('hf-request', null);
const saveRequest = () => lsSet('hf-request', request);
function todaysRequest() {
  if (!request || request.day !== dayKey() || !REQUESTS.some((r) => r.id === request.id)) {
    request = { day: dayKey(), id: REQUESTS[Math.floor(Math.random() * REQUESTS.length)].id, taken: false, carrying: false, done: false, spot: Math.floor(Math.random() * SANDAL_SPOTS.length), seen: [] };
    saveRequest();
  }
  return REQUESTS.find((r) => r.id === request.id);
}
// Where today's lost thing is lying, if there is one to find right now.
function lostItem() {
  const r = todaysRequest();
  if (r.kind !== 'fetch' || !request.taken || request.done || request.carrying) return null;
  const [x, y] = SANDAL_SPOTS[request.spot];
  return { x, y, sprite: r.item };
}
const lostAt = (x, y) => { const it = lostItem(); return !!it && it.x === x && it.y === y; };
function spotHint() {
  const [x, y] = SANDAL_SPOTS[request.spot];
  if (y >= 21) return 'Someone saw it on the beach. The beach is long, I know.';
  if (x <= 4) return 'Someone saw it in the grass behind the library.';
  if (x >= 32) return 'Someone saw it in the grass beyond the Academy.';
  return 'Someone saw it near the stadium.';
}
async function pickUpLost() {
  const r = todaysRequest();
  request.carrying = true; saveRequest();
  await say([r.found, `Bring it to ${NAMES[r.to]}.`]);
}
async function finishRequest(r) {
  request.done = true; request.carrying = false; saveRequest();
  const n = earn(r.pay);
  await say([...r.thanks, `Request complete. You earned ${n} coins. A new request goes up on the board tomorrow.`]);
}
// Called before anyone's usual conversation. Returns true when the request board's job took over the moment.
async function requestTalk(who) {
  const r = todaysRequest();
  if (!request.taken || request.done) return false;
  if (r.kind === 'deliver' && !request.carrying && r.from === who) { request.carrying = true; saveRequest(); await say([...r.got, `Bring it to ${NAMES[r.to]}.`]); return true; }
  if (request.carrying && r.to === who) { await finishRequest(r); return true; }
  if (r.kind === 'visit' && r.stops.includes(who) && !request.seen.includes(who)) {
    request.seen.push(who); saveRequest();
    if (request.seen.length === r.stops.length) { await say(r.stop(who)); await finishRequest(r); }
    else await say(`${r.stop(who)} (${request.seen.length} of ${r.stops.length})`);
    return true;
  }
  return false;
}
async function readBoard() {
  const r = todaysRequest();
  if (request.done) return say(['Town request board.', "Today's request is done. Thank you! A new one goes up tomorrow."]);
  request.taken = true; saveRequest();
  let status = '';
  if (r.kind === 'fetch') status = request.carrying ? `You have the ${r.thing}. Bring it to ${NAMES[r.to]}.` : spotHint();
  if (r.kind === 'deliver') status = request.carrying ? `You have the ${r.thing}. Bring it to ${NAMES[r.to]}.` : `Start with ${NAMES[r.from]}.`;
  if (r.kind === 'olives') status = request.carrying ? `You have the olives. Bring them to ${NAMES[r.to]}.` : 'Any olive tree will do.';
  if (r.kind === 'visit') status = `So far: ${request.seen.length} of ${r.stops.length}.`;
  await say(['Town request board. One request a day.', r.post, `${status} Reward: ${r.pay} coins.`]);
}

/* ---------------- The bank: coins left here grow 2% a day ---------------- */
// Interest compounds continuously at 2% a day on up to BANK_CAP coins; anything above the cap waits without growing.
const BANK_RATE = .02, BANK_CAP = 25000;
const bank = Object.assign({ bal: 0, at: Date.now(), seen: 0 }, lsGet('hf-bank', {}));
function settleBank() {
  const days = Math.max(0, (Date.now() - bank.at) / 864e5), k = Math.log(1 + BANK_RATE);
  let b = bank.bal;
  if (b > 0 && b < BANK_CAP) { const toCap = Math.log(BANK_CAP / b) / k; b = days <= toCap ? b * Math.exp(k * days) : BANK_CAP + k * BANK_CAP * (days - toCap); }
  else if (b >= BANK_CAP) b += k * BANK_CAP * days;
  bank.bal = b; bank.at = Date.now(); lsSet('hf-bank', bank);
}
const amounts = (max) => [...[100, 500, 1000, 5000].filter((n) => n < max).map((n) => ({ label: n.toLocaleString(), value: n })), { label: `All (${max.toLocaleString()})`, value: max }, { label: 'Never mind', value: null }];

/* ---------------- Trading voyages from the beach ---------------- */
// Pay for a voyage and share the profit when the ship comes home. Every day each route gets its own sea and its own
// market (the same for everyone that day), so the best bet changes: some days Egypt is a bargain, some days it's a trap.
// Stormy weather from the Machine Room adds risk on top. Whether a ship sinks is settled when it sails.
const ROUTES = [
  { id: 'aegina', name: 'Aegina', hours: 2, gain: .1, risk: 0, cargo: 'pistachios' },
  { id: 'crete', name: 'Crete', hours: 4, gain: .5, risk: .2, cargo: 'olive oil' },
  { id: 'egypt', name: 'Egypt', hours: 8, gain: 1, risk: .35, cargo: 'grain' },
];
const SEAS = [['calm seas', .5, .3], ['choppy seas', 1, .45], ['storms at sea', 1.6, .25]];   // what it does to the risk, how often
const MARKETS = [['low', .6, .25], ['normal', 1, .5], ['high', 1.4, .25]];                     // what it does to the profit, how often
const seeded = (key) => { let h = 2166136261; for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 15; return ((Math.imul(h, 2246822507) >>> 0) % 1e6) / 1e6; };
const pickBy = (table, r) => table.find((row) => (r -= row[2]) < 0) || table[table.length - 1];
const stormy = () => ['rain', 'ominous'].includes(weatherKind) ? .1 : ['fog', 'snow'].includes(weatherKind) ? .05 : 0;
function seaReport(rt) {
  const sea = pickBy(SEAS, seeded(`${dayKey()}:${rt.id}:sea`)), market = pickBy(MARKETS, seeded(`${dayKey()}:${rt.id}:market`));
  const base = rt.risk ? rt.risk * sea[1] : sea[1] > 1 ? .08 : 0;
  return { sea: sea[0], demand: market[0], gain: Math.round(rt.gain * market[1] * 100) / 100, risk: Math.min(.9, base + (rt.risk ? stormy() : stormy() / 2)) };
}
const sinkRisk = (risk) => (risk ? `${Math.round(risk * 100)}% sink risk` : 'no risk');
const INTERACT = {
  async hat() {
    await say(['A hat on a stool, a very long way from Scotland. It clears its throat.', 'Hmm. Difficult. Very difficult.', 'Plenty of courage, I see. Not a bad mind, either. A real taste for proving people wrong…', 'Better be… GRYFFINDOR!']);
    HF().foundEgg('hat');
    await say(matchMedia('(hover: none) and (pointer: coarse)').matches ? 'Psst. That word is also a password. Tap Terminal at the bottom of the page and say it there.' : 'Psst. That word is also a password. Press the ` key and say it to the terminal.');
  },
  async owl() {
    if (await requestTalk('owl')) return;
    const weatherLine = { rain: 'It is raining in Athens. Somebody has been turning dials in the Machine Room.', snow: 'Snow in Athens. It happens every few years. This time somebody did it on purpose.', fog: 'I cannot see a thing. Who touched the weather machine?', ominous: 'The weather is mildly ominous today. I blame the Machine Room.' }[weatherKind];
    await say(['I am the owl of Athena. Wisdom is my whole thing.', weatherLine || "Hannah once explained Black-Scholes to me. I said \"who?\" She explained it again. Very patient."]);
  },
  async plato() {
    if (await requestTalk('plato')) return;
    if (!ready('plato', COOLDOWN.plato)) return say(`Plato is still thinking about your last answer. Come back in ${inTime(leftOf('plato'))}.`);
    const v = await say(['Plato here. Most people read me in translation.', 'Hannah is trying to learn Greek so she can read me in the original someday. Take your time. I have waited 2,400 years.', 'While you are here: answer a question and I will pay you in coins.'], [{ label: 'Ask me', value: 'quiz' }, { label: 'Maybe later', value: null }]);
    if (v !== 'quiz') return;
    const item = nextQuestion();
    const pick = await say(item.q, item.a.map((label, i) => ({ label, value: i })));
    if (pick == null) return;
    used('plato');
    if (pick === item.right) { const n = earn(300); await say(`Correct. Here are ${n} coins. Spend them wisely, or at least interestingly.`); }
    else { const n = earn(100); await say([`Not quite. It was "${item.a[item.right]}".`, `Here are ${n} coins anyway, for showing up. Socrates would say that counts for something.`]); }
  },
  async socrates() {
    if (await requestTalk('socrates')) return;
    if (todaysRequest().id === 'sandal' && !request.done) {
      request.taken = true; saveRequest();
      return say(['Socrates here. I seem to have lost a sandal.', 'I tell everyone I do not need it. I would like it back.', spotHint(), `Bring it to me and I will pay you ${todaysRequest().pay} coins.`]);
    }
    await say(['Socrates here. I have both sandals today, for once.', 'I know that I know nothing. I do know the request board by the main road has work, if you want coins.']);
  },
  async cat() {
    if (await requestTalk('cat')) return;
    if (!ready('cat', COOLDOWN.cat)) return say(`The cat is grooming itself and would like some privacy. Try again in ${inTime(leftOf('cat'))}.`);
    used('cat');
    const n = earn(10 + Math.floor(Math.random() * 191));
    const lines = [`You pet the cat. It purrs, stands up, and reveals ${n} coins it was sitting on.`, `The cat accepts one (1) pet, then drops ${n} coins at your feet. Athens has excellent cats.`, `The cat headbutts your hand. Somehow you are now ${n} coins richer.`];
    await say(lines[Math.floor(Math.random() * lines.length)]);
  },
  async recruiter() {
    const v = await say(['A wild RECRUITER appeared!', 'It has traveled 2,500 years to ask what Hannah is doing after her M.Eng in May 2027.'], [
      { label: 'Email Hannah', value: 'email' }, { label: 'Take the resume', value: 'resume' }, { label: 'Run away', value: 'run' }]);
    if (v === 'email') location.href = 'mailto:hannahf4@mit.edu';
    else if (v === 'resume') { downloadResume(); await say("You got HANNAH'S RESUME! It is one page. It is a very full page."); }
    else if (v === 'run') await say('Got away safely. (It will be back.)');
  },
  async runner() {
    if (await requestTalk('runner')) return;
    const v = await say(['I just won the stadion race. One lap, about 192 meters, in about 12 seconds. No shoes.', `Race me for ${RACE_STAKE} coins? Win and I pay you. Lose and you pay me.`], [{ label: 'Race', value: 'race' }, { label: 'Not now', value: null }]);
    if (v === 'race') return race.open();
    await say("Suit yourself. Hannah's Islanders won four straight Stanley Cups, from 1980 to 1983. Here, the prize is a jar of olive oil.");
  },
  async parthenon() {
    if (await requestTalk('parthenon')) return;
    const v = await say(['The Parthenon. Temple of Athena, goddess of wisdom and strategy.', "Someone carved Hannah's resume into a marble slab by the door. It's a little much."], [{ label: 'Download it', value: 'resume' }, { label: 'Leave', value: null }]);
    if (v === 'resume') downloadResume();
  },
  async gaming() {
    const v = await say(['The Gaming Hall. The Greeks played petteia in here. Today it is Minesweeper and blackjack.', `You have ${wallet.coins.toLocaleString()} coins.`], [{ label: 'Blackjack', value: 'bj' }, { label: 'Minesweeper', value: 'ms' }, { label: 'Leave', value: null }]);
    if (v === 'ms') { openModal('#arcade'); newMines(); }
    if (v === 'bj') { openModal('#blackjack'); bjRender(); }
  },
  async academy() {
    if (await requestTalk('academy')) return;
    await say(['Plato\'s Academy. Carved over the door: "Let no one ignorant of geometry enter."', 'Inside, someone has painted the entire school across one wall. Raphael got there first, in 1511.']); openSchool();
  },
  async library() {
    if (await requestTalk('library')) return;
    const v = await say(['The library is quiet. Scrolls everywhere.', 'Among them sits a small black diary. It is very old, but not this old.', 'On a shelf nearby, a newer scroll is labeled "Some Random Hannectodes". It is Hannah\u2019s blog.'], [{ label: 'Write in the diary', value: 'diary' }, { label: 'Read the blog', value: 'blog' }, { label: 'Leave', value: null }]);
    if (v === 'diary') HF().openDiary();
    if (v === 'blog') location.href = 'blog.html';
  },
  async merchant() {
    if (await requestTalk('merchant')) return;
    const v = await say(['Welcome to the Agora market. Finest linen in Athens, and a few things that should not exist for another 2,000 years.', `You have ${wallet.coins.toLocaleString()} coins.`], [{ label: 'Browse', value: 'shop' }, { label: 'Just looking', value: null }]);
    if (v === 'shop') { openModal('#shop'); renderShop(); }
  },
  async bank() {
    if (await requestTalk('bank')) return;
    settleBank();
    const whole = Math.floor(bank.bal), grew = whole - Math.floor(bank.seen || 0);
    bank.seen = bank.bal; lsSet('hf-bank', bank);
    const v = await say(['The Bank. A banker sits at a long table, a trapeza, stacking silver.',
      whole ? `Your account: ${whole.toLocaleString()} coins.${grew > 0 ? ` It earned ${grew.toLocaleString()} since your last visit.` : ''} It grows 2% a day, on up to ${BANK_CAP.toLocaleString()} coins.` : `Coins you leave here grow 2% every day, on up to ${BANK_CAP.toLocaleString()} coins. Take them out whenever you like.`],
      [{ label: 'Deposit', value: 'in' }, ...(whole ? [{ label: 'Withdraw', value: 'out' }] : []), { label: 'Leave', value: null }]);
    if (v === 'in') {
      if (!wallet.coins) return say('Your purse is empty. The olive trees are a good place to start.');
      const amt = await say(`You have ${wallet.coins.toLocaleString()} coins with you. How much will you deposit?`, amounts(wallet.coins));
      if (!amt) return;
      settleBank(); wallet.coins = wallet.coins - amt; bank.bal += amt; bank.seen = bank.bal; lsSet('hf-bank', bank);
      return say(`Deposited ${amt.toLocaleString()} coins. Your account: ${Math.floor(bank.bal).toLocaleString()}. Come back in a few days and it will have grown.`);
    }
    if (v === 'out') {
      const amt = await say(`Your account has ${whole.toLocaleString()} coins. How much will you take out?`, amounts(whole));
      if (!amt) return;
      settleBank(); bank.bal = Math.max(0, bank.bal - amt); bank.seen = bank.bal; lsSet('hf-bank', bank); wallet.coins = wallet.coins + amt;
      return say(`Withdrew ${amt.toLocaleString()} coins. ${Math.floor(bank.bal) ? `Still in the account: ${Math.floor(bank.bal).toLocaleString()}.` : 'Your account is empty, but it stays open.'}`);
    }
  },
  async captain() {
    if (await requestTalk('captain')) return;
    const vy = lsGet('hf-voyage', null), rt = vy && ROUTES.find((r) => r.id === vy.route);
    if (rt && Date.now() < vy.back) return say([`Captain here. Your ship to ${rt.name} is still at sea.`, `It should be home in ${inTime(vy.back - Date.now())}.`]);
    if (rt) {
      lsSet('hf-voyage', null);
      if (vy.sank) return say([`Bad news. Your ship to ${rt.name} met a storm and sank.`, `Your ${vy.stake.toLocaleString()} coins went down with it. The sea gives, and the sea takes.`]);
      wallet.coins = wallet.coins + vy.stake;
      const n = earn(Math.round(vy.stake * (vy.gain ?? rt.gain)));
      return say([`Your ship is home from ${rt.name}, full of ${rt.cargo}!`, `You get your ${vy.stake.toLocaleString()} coins back, plus ${n.toLocaleString()} in profit.`]);
    }
    const report = ROUTES.map((r) => ({ ...r, ...seaReport(r) }));
    const storm = stormy() ? ['Somebody has been turning the weather dials in the Machine Room, so every route is riskier than usual.'] : [];
    const pick = await say(['Captain here. Pay for a voyage and you share the profit when the ship comes home. Not every ship comes home.', ...storm,
      `Today's sea report:\n${report.map((r) => `${r.name}: ${r.sea}, ${r.demand} demand for ${r.cargo}.`).join('\n')}`],
      [...report.map((r) => ({ label: `${r.name}: ${r.hours} hours, +${Math.round(r.gain * 100)}% profit, ${sinkRisk(r.risk)}`, value: r.id })), { label: 'Not today', value: null }]);
    const route = report.find((r) => r.id === pick);
    if (!route) return;
    if (wallet.coins < 100) return say('A voyage takes at least 100 coins. Come back when your purse is heavier.');
    const stake = await say([`${route.name} it is. Home in ${route.hours} hours. If it makes it, you get your coins back plus ${Math.round(route.gain * 100)}%. ${route.risk ? `There is a ${Math.round(route.risk * 100)}% chance it sinks.` : 'It will not sink.'}`, `How much will you put in? You have ${wallet.coins.toLocaleString()} coins.`],
      [...[100, 250, 500, 1000].filter((n) => n <= wallet.coins).map((n) => ({ label: n.toLocaleString(), value: n })), { label: 'Never mind', value: null }]);
    if (!stake) return;
    wallet.coins = wallet.coins - stake;
    lsSet('hf-voyage', { route: route.id, stake, back: Date.now() + route.hours * 3600e3, sank: Math.random() < route.risk, gain: route.gain });
    await say(`The ship sails for ${route.name} with your ${stake.toLocaleString()} coins aboard. Come back in ${route.hours} hours.`);
  },
};
async function boardBoat() {
  const v = await say(['A little sailboat is tied up at the beach. Someone in the Machine Room launched it.', 'Take it out for a short sail along the coast?'], [{ label: 'Set sail', value: 'sail' }, { label: 'Not now', value: null }]);
  if (v === 'sail') startSail();
}
function downloadResume() { const a = document.createElement('a'); a.href = 'HannahFriedman_Resume.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); }

function pressA() {
  if (document.querySelector('dialog[open]') || sail) return;
  if (!$('#dlg').hidden) return advance();
  if (player.moving) return;
  const [dx, dy] = DIRS[player.dir];
  const fx = player.tx + dx, fy = player.ty + dy;
  const npc = npcs.find((n) => n.tx === fx && n.ty === fy);
  if (npc) { if (!npc.still) npc.dir = opposite(player.dir); return npc.creature ? say(CREATURES[npc.creature].line) : INTERACT[npc.id](); }
  const sign = SIGNS.find((s) => s.x === fx && s.y === fy);
  if (sign) return sign.board ? readBoard() : say(sign.text);
  const b = doorAt(fx, fy);
  if (b) return INTERACT[b.id]();
  if (harbor.boat && fy === DOCK.y && Math.abs(fx - DOCK.x) <= 1) return boardBoat();
  if (lostAt(fx, fy)) return pickUpLost();
  if (grid[fy]?.[fx] === '~' || grid[fy]?.[fx] === 's' && grid[fy + 1]?.[fx] === '~') return say('The Aegean. Homer called it wine-dark. You decide not to swim in it.');
  if (grid[fy]?.[fx] === 'T') {
    if (!isOlive(fx, fy)) return say('A cypress tree. Very tall, very elegant, no olives.');
    // One timer for every olive tree, so walking from tree to tree doesn't help.
    if (!ready('olives', COOLDOWN.olives)) return say(`Your basket is still full from the last tree. The olive buyers are back in ${inTime(leftOf('olives'))}.`);
    used('olives');
    const r = todaysRequest();
    if (r.kind === 'olives' && request.taken && !request.done && !request.carrying) { request.carrying = true; saveRequest(); return say(`You pick a basket of olives and keep it for ${NAMES[r.to]}.`); }
    const n = earn(25);
    return say(`You pick a basket of olives and sell them in the Agora for ${n} coins. Athena would approve.`);
  }
}
const opposite = (d) => ({ up: 'down', down: 'up', left: 'right', right: 'left' }[d]);
function doorAt(x, y) { return BUILDINGS.find((b) => (b.door[0] === x && b.door[1] === y) || (b.door2 && b.door2[0] === x && b.door2[1] === y)); }

/* ---------------- Harbor: the sailboat, launched from the Machine Room ---------------- */
const harbor = { boat: !!lsGet('hf-boat', false) };
const DOCK = { x: 18, y: 22 };                  // the water tile the boat is moored on, just off the beach
const SAIL_Y = DOCK.y * TILE + 12;              // waterline the boat rides on
const SAIL_PATH = [DOCK.x * TILE + 8, 2 * TILE, (W - 2) * TILE, DOCK.x * TILE + 8]; // x waypoints: west, then east, then home
let sail = null;
function sailPos(now) {
  const speed = 70, legs = [];
  for (let i = 0; i < SAIL_PATH.length - 1; i++) legs.push(Math.abs(SAIL_PATH[i + 1] - SAIL_PATH[i]));
  let d = ((now - sail.t0) / 1000) * speed;
  for (let i = 0; i < legs.length; i++) {
    if (d <= legs[i]) { const dir = Math.sign(SAIL_PATH[i + 1] - SAIL_PATH[i]); return { x: SAIL_PATH[i] + dir * d, facing: dir, progress: (legs.slice(0, i).reduce((a, b) => a + b, 0) + d) / legs.reduce((a, b) => a + b, 0) }; }
    d -= legs[i];
  }
  return { x: SAIL_PATH[SAIL_PATH.length - 1], facing: 1, progress: 1 };
}
const SAIL_LINES = [
  [0, 'The Agora cat appears out of nowhere and hops aboard. Nobody invited it.'],
  [.18, 'The cat sits on the map. You will be navigating from memory.'],
  [.36, 'From out here, the Parthenon looks tiny.'],
  [.62, 'The cat tries to steer. You let it, briefly. That was a mistake.'],
  [.95, 'Back at the beach. The cat leaves without saying thank you.'],
];
function caption(text, ms = 3200) {
  const el = $('#place'); el.textContent = text; el.classList.add('show', 'caption');
  clearTimeout(placeTimer); placeTimer = setTimeout(() => el.classList.remove('show', 'caption'), ms);
}
function startSail() {
  held.clear(); queued = null;
  const lines = [...SAIL_LINES];
  lines.sort((a, b) => a[0] - b[0]);
  sail = { t0: performance.now(), said: 0, lines };
}
function sailTick(now) {
  if (!sail) return;
  const p = sailPos(now);
  while (sail.said < sail.lines.length && p.progress >= sail.lines[sail.said][0]) caption(sail.lines[sail.said++][1]);
  if (p.progress >= 1) {
    sail = null;
    Object.assign(player, { tx: DOCK.x, ty: DOCK.y - 1, fromX: DOCK.x, fromY: DOCK.y - 1, dir: 'down', moving: false });
  }
}
function drawHarbor(camX, camY, now) {
  const bob = reduceMotion ? 0 : Math.round(Math.sin(now / 700) * 1.5);
  if (harbor.boat) {
    const p = sail ? sailPos(now) : { x: DOCK.x * TILE + 8, facing: 1 };
    const flip = p.facing < 0, x = Math.round(p.x - 22 - camX), y = SAIL_Y - 26 + bob - camY;
    const put = (img, dx, dy, mirror = flip) => {
      if (!mirror) return ctx.drawImage(img, x + dx, y + dy);
      ctx.save(); ctx.translate(x + 44 - dx, y + dy); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore();
    };
    put(boatCanvas('rig'), 0, 0);
    if (sail) {
      put(avatarCanvas('right', 0, observedLook(wardrobe.equipped)), 4, 2);
      put(spriteCanvas('cat', 'right'), 27, 7);
    }
    put(boatCanvas('hull'), 0, 0);
  }
}

/* ---------------- Movement ---------------- */
function occupied(x, y, self) {
  if (isSolid(grid, x, y)) return true;
  if (self !== player && player.tx === x && player.ty === y) return true;
  return npcs.some((n) => n !== self && n.tx === x && n.ty === y);
}
let lastPlace = '';
function placeName(x, y) {
  if (grid[y][x] === 'i') return 'The Stadium';
  if (y === 13 || y === 14) return 'The Panathenaic Way';
  if (y >= 8 && y <= 12 && x >= 11 && x <= 24) return 'The Agora';
  if (y >= 20) return 'The Aegean shore';
  return '';
}
let placeTimer;
function updatePlace() {
  const name = placeName(player.tx, player.ty);
  if (name && name !== lastPlace) {
    const el = $('#place'); el.textContent = name; el.classList.add('show');
    clearTimeout(placeTimer); placeTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }
  lastPlace = name || lastPlace;
}

function tryMove(ent, dir) {
  ent.dir = dir;
  const [dx, dy] = DIRS[dir];
  const nx = ent.tx + dx, ny = ent.ty + dy;
  if (ent === player) {
    const b = doorAt(nx, ny);
    if (b && dir === 'up') { held.clear(); INTERACT[b.id](); return false; }
  }
  if (occupied(nx, ny, ent)) return false;
  ent.fromX = ent.tx; ent.fromY = ent.ty; ent.tx = nx; ent.ty = ny; ent.moving = true; ent.t = 0;
  if (ent === player) ent.dur = running ? RUN_MS : STEP_MS;
  return true;
}

// The superposition jersey swaps teams with every step and collapses to one team when you stand still.
let measured = null;
function observedLook(look) {
  const item = itemById(look.outfit);
  if (!item?.split) return look;
  if (player.moving) { measured = null; return { ...look, outfit: item.split[player.walkPhase] }; }
  measured ??= item.split[Math.floor(Math.random() * item.split.length)];
  return { ...look, outfit: measured };
}

function update(dt) {
  if (player.moving) {
    player.t += dt;
    if (player.t >= player.dur) {
      player.moving = false; player.walkPhase ^= 1; updatePlace();
      if (lostAt(player.tx, player.ty)) pickUpLost();
      HF().store?.set?.('hf-play-pos', { tx: player.tx, ty: player.ty, dir: player.dir });
    }
  }
  if (!sail && !player.moving && $('#dlg').hidden && !document.querySelector('dialog[open]')) {
    const dir = [...held].pop() || queued;
    queued = null;
    if (dir) { if (!tryMove(player, dir)) player.dir = dir; }
  }
  for (const n of npcs) {
    if (n.moving) { n.t += dt; if (n.t >= STEP_MS * 1.6) n.moving = false; continue; }
    if (!n.wander || !$('#dlg').hidden) continue;
    n.nextWander -= dt;
    if (n.nextWander <= 0) {
      n.nextWander = 900 + Math.random() * 1600;
      const options = Object.keys(DIRS).filter((d) => {
        const [dx, dy] = DIRS[d], x = n.tx + dx, y = n.ty + dy;
        const inBox = !n.box || (x >= n.box[0] && y >= n.box[1] && x <= n.box[2] && y <= n.box[3]);
        return inBox && (n.on || ['i']).includes(grid[y]?.[x]) && !occupied(x, y, n) && !lostAt(x, y);
      });
      if (options.length) tryMove(n, options[(Math.random() * options.length) | 0]);
    }
  }
}

/* ---------------- Render ---------------- */
function entityPos(e, dur) {
  if (!e.moving) return [e.tx * TILE, e.ty * TILE];
  const k = Math.min(1, e.t / dur);
  return [(e.fromX + (e.tx - e.fromX) * k) * TILE, (e.fromY + (e.ty - e.fromY) * k) * TILE];
}
let waterTick = 0;
// Weather comes from the dial in the Machine Room (clear unless someone has been down there).
const weatherKind = currentWeather();
const weather = createWeather(weatherKind, canvas.width, canvas.height, { still: reduceMotion });
function render(now) {
  const [px, py] = entityPos(player, player.dur);
  const [fx, fy] = sail ? [sailPos(now).x - 8, SAIL_Y - 16] : [px, py];
  const camX = Math.round(Math.max(0, Math.min(W * TILE - canvas.width, fx + 8 - canvas.width / 2)));
  const camY = Math.round(Math.max(0, Math.min(H * TILE - canvas.height, fy + 8 - canvas.height / 2)));
  const frame = reduceMotion ? 0 : Math.floor(now / 450) % waterFrames.length;
  ctx.drawImage(waterFrames[frame], camX, camY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

  const lost = lostItem(); if (lost) ctx.drawImage(spriteCanvas(lost.sprite), lost.x * TILE - camX, lost.y * TILE - camY);
  drawHarbor(camX, camY, now);
  sailTick(now);
  const drawables = [
    ...npcs.filter((n) => !(sail && n.id === 'cat')).map((n) => { const [x, y] = entityPos(n, STEP_MS * 1.6); const step = n.moving ? (n.t < STEP_MS * .8 ? 1 : 2) : 0; return { y, draw: () => drawSprite(n.sprite, n.dir, step, x, y) }; }),
    ...(sail ? [] : [{ y: py, draw: () => { const step = player.moving ? (player.walkPhase ? 1 : 2) : 0; drawSprite('hannah', player.dir, step, px, py); } }]),
  ].sort((a, b) => a.y - b.y);
  function drawSprite(kind, dir, step, x, y) {
    const sx = Math.round(x - camX), sy = Math.round(y - camY) - 4;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(sx + 3, sy + 17, 10, 2);
    const bob = kind === 'hat' && !reduceMotion ? Math.round(Math.sin(now / 400)) : 0;
    if (kind === 'hannah') ctx.drawImage(avatarCanvas(dir, step, observedLook(wardrobe.equipped)), sx, sy - 4);
    else ctx.drawImage(spriteCanvas(kind, dir, step), sx, sy + bob);
  }
  const pet = sail ? null : wardrobe.equipped.companion;
  if (pet === 'owl' || pet === 'catpet' || pet === 'birdpet') {
    const [dx, dy] = DIRS[player.dir];
    const flying = pet === 'owl' || pet === 'birdpet';
    const tx = px - dx * (flying ? 13 : 15) + (dx === 0 ? 11 : 0), ty = py - dy * (flying ? 13 : 15) - (flying ? 9 : 4);
    if (companion.x == null) { companion.x = tx; companion.y = ty; }
    companion.x += (tx - companion.x) * (flying ? 0.12 : 0.09); companion.y += (ty - companion.y) * (flying ? 0.12 : 0.09);
    const bob = reduceMotion ? 0 : Math.round(Math.sin(now / (flying ? 220 : 160)) * (flying ? 1.5 : 0.6));
    const facing = companion.x > px ? 'left' : 'right';
    drawables.push({ y: companion.y + (flying ? 12 : 4), draw: () => ctx.drawImage(spriteCanvas(petSprite(pet), facing), Math.round(companion.x - camX), Math.round(companion.y - camY) + bob) });
    drawables.sort((a, b) => a.y - b.y);
  }
  drawables.forEach((d) => d.draw());
  weather.draw(ctx, now);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(now - last, 50); last = now;
  update(dt);
  if (dlg.typing) { dlg.shown += dt * 0.06; if (dlg.shown >= dlg.full.length) { dlg.shown = dlg.full.length; dlg.typing = false; } renderText(); }
  render(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
updatePlace();
setTimeout(() => screen.focus({ preventScroll: true }), 50);
if (!HF().store?.get?.('hf-play-welcomed', false)) {
  HF().store?.set?.('hf-play-welcomed', true);
  setTimeout(() => say(['Welcome to Little Athens.', 'Hannah set her world here because she loves history, and she is trying to learn Ancient Greek.', 'Walk up to people, signs, and doors, and press Space (or A) to talk. Some of the easter eggs are hiding here.']), 400);
}

/* ---------------- Modals ---------------- */
function openModal(sel) { const d = $(sel); if (d && !d.open) d.showModal(); }

/* ---------------- Map ---------------- */
const mapDialog = $('#map'), mapCanvas = $('#map-canvas');
function openMap() {
  if (!$('#dlg').hidden || document.querySelector('dialog[open]')) return;
  held.clear(); queued = null;
  // The whole town at 1x, with everyone where they are right now (lost things stay hidden: those are a hunt).
  mapCanvas.width = W * TILE; mapCanvas.height = H * TILE;
  const c = mapCanvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(waterFrames[0], 0, 0);
  for (const n of npcs) c.drawImage(spriteCanvas(n.sprite, n.dir, 0), n.tx * TILE, n.ty * TILE - 4);
  c.drawImage(avatarCanvas('down', 0, observedLook(wardrobe.equipped)), player.tx * TILE, player.ty * TILE - 8);
  const pct = (x, y) => `left:${(x / W) * 100}%;top:${(y / H) * 100}%`;
  $('#map-pins').innerHTML = MAP_PLACES.map((p) => `<button type="button" class="map-pin" data-go="${p.id}" style="${pct(...p.at)}">${p.name}</button>`).join('')
    + `<span class="map-you" style="${pct(player.tx + .5, player.ty + .2)}"><span>You</span></span>`;
  $('#map-list').innerHTML = MAP_PLACES.map((p) => `<li><button type="button" data-go="${p.id}"><b>${p.name}</b><span>${p.desc}</span></button></li>`).join('');
  mapDialog.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => travel(b.dataset.go)));
  mapDialog.showModal();
}
function travel(id) {
  const place = MAP_PLACES.find((p) => p.id === id);
  let [x, y, dir] = place.go;
  if (occupied(x, y, player)) {
    const free = Object.values(DIRS).map(([dx, dy]) => [x + dx, y + dy]).find(([nx, ny]) => !occupied(nx, ny, player));
    if (free) [x, y] = free;
  }
  Object.assign(player, { tx: x, ty: y, fromX: x, fromY: y, dir, moving: false, t: 0 });
  HF().store?.set?.('hf-play-pos', { tx: x, ty: y, dir });
  mapDialog.close();
  lastPlace = '';
  const el = $('#place'); el.textContent = place.name; el.classList.add('show');
  clearTimeout(placeTimer); placeTimer = setTimeout(() => el.classList.remove('show'), 1800);
  screen.focus();
}
$('#map-btn').addEventListener('click', openMap);

/* ---------------- Minesweeper ---------------- */
const MS = { R: 9, C: 9, M: 10 };
let ms;
function newMines() {
  clearInterval(ms?.timer);
  ms = { mines: null, open: new Set(), flags: new Set(), over: false, time: 0, timer: null };
  $('#ms-left').textContent = MS.M; $('#ms-time').textContent = 0; $('#ms-note').textContent = 'Click to reveal. Right-click, or long-press, to flag.';
  const g = $('#ms-grid'); g.innerHTML = '';
  for (let i = 0; i < MS.R * MS.C; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ms-cell'; b.dataset.i = i;
    b.setAttribute('aria-label', `Row ${Math.floor(i / MS.C) + 1}, column ${(i % MS.C) + 1}, hidden`);
    let press;
    b.addEventListener('click', () => reveal(i));
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); flag(i); });
    b.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') press = setTimeout(() => { flag(i); press = 'done'; }, 450); });
    b.addEventListener('pointerup', (e) => { if (press === 'done') { e.preventDefault(); } clearTimeout(press); });
    g.appendChild(b);
  }
}
const nbrs = (i) => { const r = Math.floor(i / MS.C), c = i % MS.C, out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < MS.R && cc >= 0 && cc < MS.C) out.push(rr * MS.C + cc); } return out; };
function plant(safe) {
  const avoid = new Set([safe, ...nbrs(safe)]); ms.mines = new Set();
  while (ms.mines.size < MS.M) { const i = (Math.random() * MS.R * MS.C) | 0; if (!avoid.has(i)) ms.mines.add(i); }
  ms.timer = setInterval(() => { ms.time++; $('#ms-time').textContent = ms.time; }, 1000);
}
function count(i) { return nbrs(i).filter((j) => ms.mines.has(j)).length; }
function cell(i) { return $('#ms-grid').children[i]; }
function reveal(i) {
  if (ms.over || ms.flags.has(i) || ms.open.has(i)) return;
  if (!ms.mines) plant(i);
  if (ms.mines.has(i)) {
    ms.over = true; clearInterval(ms.timer);
    ms.mines.forEach((m) => { const c = cell(m); c.classList.add('open'); c.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-sparkle"/></svg>'; c.setAttribute('aria-label', 'Mine'); });
    cell(i).classList.add('boom');
    $('#ms-note').textContent = 'Boom. The model said that one was safe. Try again?';
    return;
  }
  const stack = [i];
  while (stack.length) {
    const j = stack.pop(); if (ms.open.has(j) || ms.flags.has(j)) continue;
    ms.open.add(j); const n = count(j); const c = cell(j);
    c.classList.add('open'); c.textContent = n || ''; if (n) c.dataset.n = n;
    c.setAttribute('aria-label', n ? `${n} mines nearby` : 'Empty');
    if (!n) nbrs(j).forEach((k) => !ms.open.has(k) && stack.push(k));
  }
  if (ms.open.size === MS.R * MS.C - MS.M) {
    ms.over = true; clearInterval(ms.timer);
    $('#ms-note').textContent = `Cleared in ${ms.time} seconds. Not a single explosion.`;
    HF().foundEgg('mines');
  }
}
function flag(i) {
  if (ms.over || ms.open.has(i)) return;
  const c = cell(i);
  if (ms.flags.has(i)) { ms.flags.delete(i); c.innerHTML = ''; c.setAttribute('aria-label', 'Hidden'); }
  else { ms.flags.add(i); c.innerHTML = '<svg class="icon" aria-hidden="true" style="color:var(--accent-ink)"><use href="#i-lock-simple"/></svg>'; c.setAttribute('aria-label', 'Flagged'); }
  $('#ms-left').textContent = MS.M - ms.flags.size;
}
$('#ms-new').addEventListener('click', newMines);

/* ---------------- The Stadium: stadion race ---------------- */
const RACE_STAKE = 200;
const race = createRace({
  dialog: $('#race'),
  avatar: (step) => avatarCanvas('right', step, observedLook(wardrobe.equipped)),
  runner: (step) => spriteCanvas('runner', 'right', step),
  getBest: () => lsGet('hf-stadion-best', null),
  setBest: (t) => lsSet('hf-stadion-best', Math.round(t * 100) / 100),
  // Each race is for 200 coins: the winner collects, the loser pays. Broke runners, and anyone who just won, race for glory.
  stakes() {
    if (!ready('stadion', COOLDOWN.stadion)) return { staked: false, text: `This race is for glory. He races for coins again in ${inTime(leftOf('stadion'))}.` };
    if (wallet.coins < RACE_STAKE) return { staked: false, text: `This race is for glory. You need ${RACE_STAKE} coins to race him for money.` };
    return { staked: true, text: `Stakes: ${RACE_STAKE} coins. Win and he pays you; lose and you pay him.` };
  },
  onFinish({ won, staked }) {
    if (won) HF().confetti();
    if (!staked) return won ? '<p class="race-prize">You win! Nothing was riding on it, but the crowd saw everything.</p>' : '<p>He does this every day. Line up again whenever you like.</p>';
    if (won) {
      used('stadion');
      return `<p class="race-prize">You take the jar of olive oil, like a winner at the Panathenaic Games, and he pays you ${earn(RACE_STAKE)} coins.</p>`;
    }
    const lost = Math.min(RACE_STAKE, wallet.coins);
    wallet.coins = wallet.coins - lost;
    return `<p>He keeps the olive oil, and you pay him ${lost} coins. Line up again whenever you like.</p>`;
  },
});

/* ---------------- The Academy: The School of Athens ---------------- */
const schoolDialog = $('#school'), schoolSpots = $('#school-spots');
const schoolMet = new Set(lsGet('hf-school', []));
let schoolAt = -1;
function openSchool() {
  paintSchool($('#school-canvas'), observedLook(wardrobe.equipped));
  schoolSpots.innerHTML = FIGURES.map((f, i) => {
    const b = hotspot(f);
    return `<button type="button" class="school-spot" data-i="${i}" aria-label="${f.name}" style="left:${b.left}%;top:${b.top}%;width:${b.width}%;height:${b.height}%"></button>`;
  }).join('');
  schoolSpots.querySelectorAll('.school-spot').forEach((b) => b.addEventListener('click', () => meet(Number(b.dataset.i))));
  schoolAt = -1;
  schoolCount();
  openModal('#school');
}
function schoolCount() { $('#school-count').textContent = `${schoolMet.size} of ${FIGURES.length} met`; }
function meet(i) {
  schoolAt = (i + FIGURES.length) % FIGURES.length;
  const f = FIGURES[schoolAt];
  schoolSpots.querySelectorAll('.school-spot').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === schoolAt));
  let html = `<h3>${f.name}</h3><p class="school-where">${f.where}</p><p>${f.text}</p>`;
  const before = schoolMet.size;
  schoolMet.add(f.id); lsSet('hf-school', [...schoolMet]);
  // The Academy famously charged no tuition. Meeting everyone pays you instead, once.
  if (before < FIGURES.length && schoolMet.size === FIGURES.length && !lsGet('hf-school-paid', false)) {
    lsSet('hf-school-paid', true);
    const n = earn(300);
    html += `<p class="school-reward">You met the whole school. Plato's Academy never charged tuition, and now it pays you: ${n} coins.</p>`;
    HF().toast('You met the whole school', `+${n} coins from the Academy`);
  }
  $('#school-info').innerHTML = html;
  schoolCount();
}
$('#school-prev').addEventListener('click', () => meet(schoolAt < 0 ? FIGURES.length - 1 : schoolAt - 1));
$('#school-next').addEventListener('click', () => meet(schoolAt + 1));

/* ---------------- Blackjack (six-deck shoe, dealer stands on 17, 3:2 blackjack, splits up to four hands) ---------------- */
const SUITS = [['♠', 'black'], ['♥', 'red'], ['♦', 'red'], ['♣', 'black']];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
// bj.bet is everything on the table; each hand also tracks its own share so splits and doubles settle separately.
const bj = { shoe: [], dealer: [], hands: [], active: 0, bet: 0, baseBet: 0, lastBet: 0, phase: 'bet', msg: 'Pick your chips, then deal.' };
function newShoe() {
  bj.shoe = [];
  for (let d = 0; d < 6; d++) for (const [s, color] of SUITS) for (const r of RANKS) bj.shoe.push({ r, s, color });
  for (let i = bj.shoe.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bj.shoe[i], bj.shoe[j]] = [bj.shoe[j], bj.shoe[i]]; }
}
function draw(faceDown = false) { if (bj.shoe.length < 52) newShoe(); return { ...bj.shoe.pop(), down: faceDown, fresh: true }; }
function total(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { if (c.down) continue; if (c.r === 'A') { aces++; t += 11; } else t += ['J', 'Q', 'K'].includes(c.r) ? 10 : Number(c.r); }
  while (t > 21 && aces) { t -= 10; aces--; }
  return t;
}
const isBlackjack = (cards) => cards.length === 2 && total(cards.map((c) => ({ ...c, down: false }))) === 21;

// Standard pip layouts: [x%, y%] on the card face; pips in the lower half print upside down.
const PIPS = {
  2: [[50, 20], [50, 80]], 3: [[50, 20], [50, 50], [50, 80]],
  4: [[30, 20], [70, 20], [30, 80], [70, 80]], 5: [[30, 20], [70, 20], [50, 50], [30, 80], [70, 80]],
  6: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80]], 7: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [30, 80], [70, 80]],
  8: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [50, 65], [30, 80], [70, 80]],
  9: [[30, 20], [70, 20], [30, 40], [70, 40], [50, 50], [30, 60], [70, 60], [30, 80], [70, 80]],
  10: [[30, 20], [70, 20], [50, 30], [30, 40], [70, 40], [30, 60], [70, 60], [50, 70], [30, 80], [70, 80]],
};
const SUIT_NAME = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
const RANK_NAME = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
function cardHTML(c) {
  const cls = `pcard${c.fresh ? ' deal' : ''}`;
  if (c.down) return `<div class="${cls} back" role="img" aria-label="Face-down card"><span>HF</span></div>`;
  let middle;
  if (c.r === 'A') middle = `<span class="pip ace" style="left:50%;top:50%">${c.s}</span>`;
  else if (RANK_NAME[c.r]) middle = `<span class="face"><b>${c.r}</b><span>${c.s}</span></span>`;
  else middle = PIPS[c.r].map(([x, y]) => `<span class="pip${y > 50 ? ' down' : ''}" style="left:${50 + (x - 50) * 0.8}%;top:${50 + (y - 50) * 0.9}%">${c.s}</span>`).join('');
  return `<div class="${cls} ${c.color}" role="img" aria-label="${RANK_NAME[c.r] || c.r} of ${SUIT_NAME[c.s]}"><span class="corner">${c.r}<br>${c.s}</span>${middle}<span class="corner flip">${c.r}<br>${c.s}</span></div>`;
}
function renderStack(amount) {
  const el = $('#bj-stack'); if (!el) return;
  const denoms = [[500, '#6b3fa0'], [100, '#1b2233'], [25, '#1d6b3c'], [10, '#c0303f'], [1, '#f4f1ea']];
  const chips = [];
  let left = amount;
  for (const [v, col] of denoms) while (left >= v && chips.length < 12) { chips.push(col); left -= v; }
  el.innerHTML = chips.map((col, i) => `<i style="--c:${col};top:${26 - i * 4}px"></i>`).join('') + (amount ? `<b>${amount.toLocaleString()}</b>` : '');
}
const RESULT_WORD = { blackjack: 'Blackjack', win: 'Win', push: 'Push', lose: 'Lose', bust: 'Bust' };
const current = () => (bj.phase === 'player' ? bj.hands[bj.active] : null);
function canDouble() { const h = current(); return !!h && h.cards.length === 2 && !h.splitAces && wallet.coins >= h.bet; }
function canSplit() { const h = current(); return !!h && h.cards.length === 2 && h.cards[0].r === h.cards[1].r && bj.hands.length < 4 && wallet.coins >= h.bet; }
function bjRender() {
  const cardsHTML = (cards) => { const html = cards.map(cardHTML).join(''); cards.forEach((c) => { c.fresh = false; }); return html; };
  $('#bj-dealer').innerHTML = cardsHTML(bj.dealer);
  const multi = bj.hands.length > 1;
  const player = $('#bj-player');
  player.classList.toggle('multi', multi);
  player.innerHTML = bj.hands.map((h, i) => {
    const active = multi && bj.phase === 'player' && i === bj.active;
    const tag = multi ? `<p class="hand-tag"><b>${total(h.cards)}</b>${h.result ? ` <span class="res ${h.result}">${RESULT_WORD[h.result]}</span>` : ` <span>${h.bet.toLocaleString()}</span>`}</p>` : '';
    return `<div class="hand-group${active ? ' active' : ''}"${active ? ' aria-current="true"' : ''}><div class="hand">${cardsHTML(h.cards)}</div>${tag}</div>`;
  }).join('');
  $('#bj-dealer-total').textContent = bj.dealer.length ? total(bj.dealer) + (bj.dealer.some((c) => c.down) ? ' + ?' : '') : '';
  $('#bj-player-total').textContent = multi ? `${bj.hands.length} hands` : bj.hands.length ? total(bj.hands[0].cards) : '';
  $('#bj-bet').textContent = bj.bet.toLocaleString();
  renderStack(bj.bet);
  $('#bj-msg').textContent = bj.msg;
  renderCoins();
  const betting = bj.phase === 'bet' || bj.phase === 'done';
  document.querySelectorAll('#bj-chips button').forEach((b) => { b.disabled = !betting; });
  $('#bj-deal').disabled = !betting || (bj.bet === 0 && !(bj.phase === 'done' && bj.lastBet && bj.lastBet <= wallet.coins));
  $('#bj-deal').textContent = bj.phase === 'done' && bj.bet === 0 && bj.lastBet ? `Deal again (${bj.lastBet})` : 'Deal';
  $('#bj-hit').disabled = bj.phase !== 'player';
  $('#bj-stand').disabled = bj.phase !== 'player';
  $('#bj-double').disabled = !canDouble();
  $('#bj-split').disabled = !canSplit();
  $('#bj-broke').hidden = !(betting && wallet.coins === 0 && bj.bet === 0);
}
function revealDealer() { bj.dealer.forEach((c) => { if (c.down) { c.down = false; c.fresh = true; } }); }
// Pays every hand, then writes one line about the round.
function payout(results) {
  let back = 0;
  results.forEach((r, i) => {
    const h = bj.hands[i]; h.result = r;
    back += { blackjack: Math.floor(h.bet * 2.5), win: h.bet * 2, push: h.bet, lose: 0, bust: 0 }[r];
  });
  if (back) wallet.coins = wallet.coins + back;
  const net = back - bj.bet, pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
  if (results.length > 1) {
    const verbs = { win: 'wins', push: 'pushes', lose: 'loses', bust: 'busts' };
    const summary = results.map((r, i) => `hand ${i + 1} ${verbs[r]}`).join(', ');
    const tail = net > 0 ? `You're up ${net.toLocaleString()} coins. Two roads diverged, and you took both.` : net < 0 ? `You're down ${(-net).toLocaleString()} coins. Divide and conquer works better for Romans.` : 'You break even. Very Stoic.';
    bj.msg = `${summary[0].toUpperCase()}${summary.slice(1)}. ${tail}`;
  } else {
    const h = bj.hands[0], r = results[0];
    bj.msg = {
      blackjack: () => `Blackjack! You win ${(back - h.bet).toLocaleString()} coins. Even Zeus is impressed.`,
      win: () => pick([`You win ${h.bet.toLocaleString()} coins. The dealer, a retired oracle, did not see that coming.`, `You win ${h.bet.toLocaleString()} coins. Nike, goddess of victory, sends her regards.`]),
      push: () => 'Push. Perfectly balanced, like a Doric column. Your bet comes back.',
      lose: () => pick(['The house wins. The house is a temple, so technically that was an offering.', 'Dealer wins. Even Achilles had a weak spot.']),
      bust: () => (h.doubled ? `Doubled and bust at ${total(h.cards)}. Bold. Wrong, but bold.` : `Bust at ${total(h.cards)}. Icarus also went a little too high.`),
    }[r]();
  }
  bj.lastBet = bj.baseBet; bj.bet = 0; bj.phase = 'done';
}
function finishRound() {
  revealDealer();
  if (bj.hands.some((h) => total(h.cards) <= 21)) while (total(bj.dealer) < 17) bj.dealer.push(draw());
  const d = total(bj.dealer);
  payout(bj.hands.map((h) => { const p = total(h.cards); return p > 21 ? 'bust' : d > 21 || p > d ? 'win' : p === d ? 'push' : 'lose'; }));
}
// Moves play to the next hand that still needs a decision, or to the dealer once every hand is finished.
function bjAdvance() {
  for (; bj.active < bj.hands.length; bj.active++) {
    const h = bj.hands[bj.active];
    if (h.cards.length === 1) h.cards.push(draw()); // a freshly split hand gets its second card when it comes up
    if (h.splitAces || h.doubled || total(h.cards) >= 21) h.done = true;
    if (!h.done) {
      const lead = bj.hands.length > 1 ? `Hand ${bj.active + 1} of ${bj.hands.length}. ` : '';
      bj.msg = lead + (canSplit() ? 'A pair! Hit, stand, double, or split.' : canDouble() ? 'Hit, stand, or double down.' : 'Hit or stand.');
      return bjRender();
    }
  }
  finishRound();
  bjRender();
}
function bjDeal() {
  if (bj.phase === 'done' && bj.bet === 0 && bj.lastBet && bj.lastBet <= wallet.coins) { bj.bet = bj.lastBet; wallet.coins = wallet.coins - bj.bet; }
  if (bj.bet <= 0) return;
  bj.baseBet = bj.bet;
  bj.hands = [{ cards: [draw(), draw()], bet: bj.bet }];
  bj.active = 0;
  bj.dealer = [draw(), draw(true)];
  bj.phase = 'player';
  const dealerBJ = isBlackjack(bj.dealer), playerBJ = isBlackjack(bj.hands[0].cards);
  if (playerBJ || dealerBJ) { revealDealer(); payout([playerBJ && dealerBJ ? 'push' : playerBJ ? 'blackjack' : 'lose']); return bjRender(); }
  bjAdvance();
}
function bjChip(v) {
  if (!(bj.phase === 'bet' || bj.phase === 'done')) return;
  if (bj.phase === 'done') { bj.phase = 'bet'; bj.hands = []; bj.dealer = []; bj.msg = 'Pick your chips, then deal.'; }
  const amount = v === 'all' ? wallet.coins : Math.min(Number(v), wallet.coins);
  if (amount <= 0) { bj.msg = 'Not enough coins for that chip.'; return bjRender(); }
  bj.bet += amount; wallet.coins = wallet.coins - amount;
  bjRender();
}
function bjClear() { if (bj.phase !== 'bet' && bj.phase !== 'done') return; wallet.coins = wallet.coins + bj.bet; bj.bet = 0; bjRender(); }
document.querySelectorAll('#bj-chips [data-chip]').forEach((b) => b.addEventListener('click', () => bjChip(b.dataset.chip)));
$('#bj-clear').addEventListener('click', bjClear);
$('#bj-deal').addEventListener('click', bjDeal);
$('#bj-hit').addEventListener('click', () => { const h = current(); if (!h) return; h.cards.push(draw()); bjAdvance(); });
$('#bj-stand').addEventListener('click', () => { const h = current(); if (!h) return; h.done = true; bjAdvance(); });
$('#bj-double').addEventListener('click', () => {
  if (!canDouble()) return;
  const h = current();
  wallet.coins = wallet.coins - h.bet; bj.bet += h.bet; h.bet *= 2; h.doubled = true;
  h.cards.push(draw());
  bjAdvance();
});
$('#bj-split').addEventListener('click', () => {
  if (!canSplit()) return;
  const h = current(), [a, b] = h.cards, aces = a.r === 'A';
  wallet.coins = wallet.coins - h.bet; bj.bet += h.bet;
  bj.hands.splice(bj.active, 1, { cards: [a], bet: h.bet, splitAces: aces }, { cards: [b], bet: h.bet, splitAces: aces });
  bjAdvance();
});
// Closing mid-hand returns the stake rather than silently losing it.
$('#blackjack').addEventListener('close', () => {
  if (bj.phase === 'player') { wallet.coins = wallet.coins + bj.bet; bj.bet = 0; bj.phase = 'bet'; bj.hands = []; bj.dealer = []; bj.msg = 'Pick your chips, then deal.'; }
  else if (bj.phase === 'bet' && bj.bet) bjClear();
});
newShoe();

/* ---------------- Agora market (shop) ---------------- */
const SHOP_GROUPS = [['Outfits', ['outfit']], ['Headwear', ['head']], ['Accessories', ['face', 'held', 'companion']]];
function lookWith(item) { const look = { ...wardrobe.equipped }; if (item && item.slot !== 'companion') look[item.slot] = item.id; return look; }
const petSprite = (id) => ({ owl: 'owlpet', catpet: 'cat', birdpet: 'birdpet' }[id] || null);
function paintAvatar(canvas, look, pet) {
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
  const sprite = petSprite(pet);
  c.drawImage(avatarCanvas('down', 0, look), sprite ? 4 : Math.round((canvas.width - 16) / 2), 0);
  if (sprite) c.drawImage(spriteCanvas(sprite, 'left'), 22, sprite === 'cat' ? 4 : -1);
}
function renderShop(preview = null) {
  $('#shop-coins').textContent = wallet.coins.toLocaleString();
  paintAvatar($('#shop-preview'), lookWith(preview), preview?.slot === 'companion' ? preview.id : wardrobe.equipped.companion);
  if (preview) return;
  const groups = $('#shop-groups');
  groups.innerHTML = SHOP_GROUPS.map(([title, slots]) => `
    <section class="shop-group" aria-label="${title}"><h3>${title}</h3><div class="shop-grid">
      ${ITEMS.filter((it) => slots.includes(it.slot)).map((it) => {
        const owned = wardrobe.owned.includes(it.id), on = wardrobe.equipped[it.slot] === it.id;
        const short = Math.max(0, it.price - wallet.coins);
        const action = !owned ? (short ? `<button type="button" class="btn btn-secondary btn-sm" disabled>Need ${short.toLocaleString()} more</button>` : `<button type="button" class="btn btn-primary btn-sm" data-buy="${it.id}">Buy</button>`)
          : on ? (it.slot === 'outfit' ? '<button type="button" class="btn btn-secondary btn-sm" disabled>Wearing</button>' : `<button type="button" class="btn btn-secondary btn-sm" data-off="${it.id}">Take off</button>`)
          : `<button type="button" class="btn btn-secondary btn-sm" data-wear="${it.id}">Wear</button>`;
        return `<article class="shop-item${on ? ' on' : ''}" data-item="${it.id}" tabindex="-1">
          <canvas class="pixel-preview" width="16" height="20" aria-hidden="true"></canvas>
          <div class="shop-info"><h4>${it.name}</h4><p>${it.desc}</p></div>
          <div class="shop-buy"><span class="price">${it.price ? `<span class="coin" aria-hidden="true"></span>${it.price.toLocaleString()}` : 'Free'}</span>${action}</div>
        </article>`;
      }).join('')}
    </div></section>`).join('');
  groups.querySelectorAll('.shop-item').forEach((card) => {
    const it = itemById(card.dataset.item);
    const cv = card.querySelector('canvas');
    if (it.slot === 'companion') { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(spriteCanvas(petSprite(it.id), 'left'), 0, 3); }
    else paintAvatar(cv, lookWith(it), false);
    card.addEventListener('pointerenter', () => renderShop(it));
    card.addEventListener('pointerleave', () => renderShop.preview());
    card.addEventListener('focusin', () => renderShop(it));
  });
  groups.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => buyItem(itemById(b.dataset.buy))));
  groups.querySelectorAll('[data-wear]').forEach((b) => b.addEventListener('click', () => { const it = itemById(b.dataset.wear); wardrobe.equipped[it.slot] = it.id; saveWardrobe(); renderShop(); }));
  groups.querySelectorAll('[data-off]').forEach((b) => b.addEventListener('click', () => { const it = itemById(b.dataset.off); delete wardrobe.equipped[it.slot]; saveWardrobe(); renderShop(); }));
}
renderShop.preview = () => { $('#shop-coins').textContent = wallet.coins.toLocaleString(); paintAvatar($('#shop-preview'), lookWith(null), wardrobe.equipped.companion); };
function buyItem(it) {
  if (!it || wardrobe.owned.includes(it.id) || wallet.coins < it.price) return;
  wallet.coins = wallet.coins - it.price;
  wardrobe.owned.push(it.id);
  wardrobe.equipped[it.slot] = it.id;
  saveWardrobe();
  HF().toast(`Bought: ${it.name}`, it.slot === 'companion' ? 'It will follow you around Athens now.' : it.slot === 'held' ? "You're carrying it now." : "You're wearing it now.", 'check');
  renderShop();
}
