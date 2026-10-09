// The Machine Room: the translation switchboard, the weather machine, the harbor works, the aviary,
// the egg incubator, and the factory reset lever. Every setting lives in this visitor's localStorage; the other pages read them.
import { renderWorld, buildGrid, spriteCanvas, boatCanvas, creatureCanvas, CREATURES, NPCS, ERRANDS, ERRAND_HOURS, ERRAND_PAY } from './world.js?v=20261010r';
import { WEATHER, createWeather } from './weather.js?v=20261010r';

const $ = (s, r = document) => r.querySelector(s);
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HF = () => window.HF;
const store = {
  get: (k, d) => HF()?.store?.get(k, d) ?? d,
  set: (k, v) => HF()?.store?.set(k, v),
};
// The homepage's first line, exactly as index.html writes it, so the preview can look up its translation.
const LEDE = 'MIT computer science, economics and data science. I build models for <strong>hedge funds</strong>, <strong>prediction markets</strong>, and <strong>NBA referees</strong>.';
const FLOORS = ['G', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
// The switchboard: each jack's label is written in its own language.
const JACKS = [
  { id: 'en', label: 'English', sub: 'English' },
  { id: 'es', label: 'Español', sub: 'Spanish' },
  { id: 'zh', label: '中文', sub: 'Mandarin' },
  { id: 'grc', label: 'Ἑλληνική', sub: 'Ancient Greek' },
  { id: 'he', label: 'עברית', sub: 'Hebrew' },
];

if (!root.dataset.mrLocked) init();

function init() {
  const s = {
    weather: WEATHER.some((w) => w.id === store.get('hf-weather', 'clear')) ? store.get('hf-weather', 'clear') : 'clear',
    lang: JACKS.some((j) => j.id === store.get('hf-lang', 'en')) ? store.get('hf-lang', 'en') : 'en',
    boat: !!store.get('hf-boat', false),
    birds: Math.max(0, Math.min(2, store.get('hf-birds', 0) | 0)),
  };
  const birdText = () => (s.birds === 0 ? 'Window closed' : s.birds === 1 ? '1 bird' : '2 birds');
  const weatherName = () => WEATHER.find((w) => w.id === s.weather).name;

  /* ---------- Status board and LEDs ---------- */
  function status() {
    const born = store.get('hf-hatched', []), eggs = HF().eggs(), warm = eggs.filter((e) => e.found && !born.includes(e.id)).length;
    const rows = [
      ['Homepage language', JACKS.find((j) => j.id === s.lang).sub, s.lang === 'en'],
      ['Weather, Athens', weatherName(), s.weather === 'clear'],
      ['Sailboat', s.boat ? 'Launched' : 'In the shed', !s.boat],
      ['Aviary', birdText(), !s.birds],
      ['Egg incubator', `${warm} warm, ${born.length} hatched${Object.keys(store.get('hf-errands', {})).length ? `, ${Object.keys(store.get('hf-errands', {})).length} on errands` : ''}`, true],
    ];
    $('#mr-status').innerHTML = rows.map(([k, v, ok]) => `<div><span class="mr-led${ok ? '' : ' warn'}" aria-hidden="true"></span><dt>${k}</dt><dd class="${ok ? 'ok' : ''}">${v}</dd></div>`).join('');
    $('#led-lang').classList.toggle('warn', s.lang !== 'en');
    $('#led-weather').classList.toggle('warn', s.weather !== 'clear');
    $('#led-harbor').classList.toggle('warn', s.boat);
    $('#led-birds').classList.toggle('warn', s.birds > 0);
    $('#led-all').classList.toggle('warn', s.lang !== 'en' || s.boat || s.birds > 0 || s.weather !== 'clear');
    $('#led-eggs').classList.toggle('warn', warm === 0);
    HF().machineRoom();
  }

  // A lever that stays where you put it: down is on.
  function toggleLever(el, on, labels) {
    el.classList.toggle('on', on);
    el.setAttribute('aria-pressed', String(on));
    $('.mr-lever-label', el).textContent = on ? labels[1] : labels[0];
  }

  /* ---------- B1: Translation switchboard ---------- */
  const jacks = $('#mr-jacks');
  jacks.innerHTML = JACKS.map((j) => `<button type="button" class="mr-jack" role="radio" data-lang="${j.id}" aria-checked="${j.id === s.lang}" aria-label="${j.sub}"><span class="mr-socket" aria-hidden="true"></span><b lang="${j.id === 'zh' ? 'zh-Hans' : j.id}"${j.id === 'he' ? ' dir="rtl"' : ''}>${j.label}</b><span>${j.sub}</span></button>`).join('');
  // The periscope shows the hero's name and first line in whatever language is patched in.
  function preview() {
    const mini = $('#mr-mini-lang'), dict = window.HF_I18N?.[s.lang], src = window.HF_I18N?.src || {};
    const idOf = (en) => Object.keys(src).find((k) => src[k] === en);
    const name = (dict && dict[idOf('Hannah Friedman')]) || 'Hannah Friedman';
    const lede = (dict && dict[idOf(LEDE)]) || LEDE;
    $('b', mini).textContent = name; $('span', mini).innerHTML = lede;
    mini.dir = s.lang === 'he' ? 'rtl' : 'ltr';
    mini.lang = s.lang === 'zh' ? 'zh-Hans' : s.lang;
  }
  function setLang(id, announce = true) {
    s.lang = id; store.set('hf-lang', id);
    jacks.querySelectorAll('.mr-jack').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lang === id)));
    if (announce) $('#lang-status').textContent = id === 'en' ? 'Patched back to English.' : `Patched to ${JACKS.find((j) => j.id === id).sub}. Go upstairs to read the homepage${id === 'he' ? ', right to left' : ''}.`;
    preview(); status();
  }
  jacks.addEventListener('click', (e) => { const b = e.target.closest('.mr-jack'); if (b) setLang(b.dataset.lang); });
  radioKeys(jacks, '.mr-jack', (b) => setLang(b.dataset.lang));

  /* ---------- B2: Weather machine, with a live periscope view of the Agora ---------- */
  const world = renderWorld(buildGrid());
  const settings = $('#mr-weather'), knob = $('#mr-knob');
  settings.innerHTML = WEATHER.map((w) => `<button type="button" class="mr-setting" role="radio" data-weather="${w.id}" aria-checked="${w.id === s.weather}">${w.name}</button>`).join('');
  const views = [];
  function setWeather(id, announce = true) {
    s.weather = id; store.set('hf-weather', id);
    settings.querySelectorAll('.mr-setting').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.weather === id)));
    knob.style.transform = `rotate(${-100 + WEATHER.findIndex((w) => w.id === id) * 50}deg)`;
    views.forEach((v) => { v.sky = createWeather(id, v.canvas.width, v.canvas.height, { still: reduceMotion }); });
    if (announce) {
      $('#weather-status').textContent = {
        clear: 'Set to Clear. Sunny over the Aegean, as usual.',
        rain: 'Set to Rain. Athens gets wet the next time you visit.',
        snow: 'Set to Snow. Rare in Athens, but it does happen every few years.',
        fog: 'Set to Fog. Good luck finding the sandal.',
        ominous: 'Set to Mildly ominous. Nothing bad will happen. Probably.',
      }[id];
    }
    status();
  }
  settings.addEventListener('click', (e) => { const b = e.target.closest('.mr-setting'); if (b) setWeather(b.dataset.weather); });
  radioKeys(settings, '.mr-setting', (b) => setWeather(b.dataset.weather));

  /* ---------- B3: Harbor works, with a periscope on the beach ---------- */
  const boatLever = $('#boat-lever'), BOAT = ['Launch the sailboat', 'Bring the boat in'];
  function setBoat(on, announce = true) {
    s.boat = on; store.set('hf-boat', on);
    toggleLever(boatLever, on, BOAT);
    if (announce) $('#harbor-status').textContent = on ? 'Sailboat launched. It is tied up at the beach below the Stadium. The cat has noticed.' : 'The boat is back in the shed.';
    status();
  }
  boatLever.addEventListener('click', () => setBoat(!s.boat));

  // Two live periscope views of Little Athens, each animated only while it is on screen.
  function makeView(canvas, crop, extra) {
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    const v = { canvas, sky: createWeather(s.weather, canvas.width, canvas.height, { still: reduceMotion }), on: false };
    const draw = (now) => {
      c.drawImage(world, crop.x * 16, crop.y * 16, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      for (const n of NPCS) {
        const x = (n.x - crop.x) * 16, y = (n.y - crop.y) * 16;
        if (x > -16 && y > -16 && x < canvas.width && y < canvas.height) c.drawImage(spriteCanvas(n.sprite, n.facing, 0), x, y - 4);
      }
      extra?.(c, now);
      v.sky.draw(c, now);
      if (v.on && !reduceMotion) requestAnimationFrame(draw);
    };
    new IntersectionObserver((entries) => {
      const was = v.on; v.on = entries.some((e) => e.isIntersecting);
      if (v.on && !was) requestAnimationFrame(draw);
    }).observe(canvas);
    draw(performance.now());
    views.push(v);
  }
  makeView($('#mr-athens'), { x: 11, y: 5 });
  // The beach view is cropped in pixels so the boat sits inside the round window.
  const SHORE = { x: 216 / 16, y: 261 / 16 };
  makeView($('#mr-shore'), SHORE, (c, now) => {
    const bob = reduceMotion ? 0 : Math.round(Math.sin(now / 700) * 1.5), water = 22 * 16 + 9 - SHORE.y * 16;
    if (s.boat) {
      const x = 18 * 16 + 8 - 22 - SHORE.x * 16, y = 22 * 16 + 12 - 26 + bob - SHORE.y * 16;
      c.drawImage(boatCanvas('rig'), x, y); c.drawImage(boatCanvas('hull'), x, y);
    }
  });

  /* ---------- B4: Aviary ---------- */
  const birdLever = $('#bird-lever'), seedBtn = $('#seed-btn'), BIRD = ['Open the window', 'Close the window'];
  function renderBirds() {
    toggleLever(birdLever, s.birds > 0, BIRD);
    seedBtn.disabled = s.birds !== 1 || !!store.get('hf-seed-at', 0);
    $('#mr-mini-birds').dataset.birds = s.birds;
  }
  function setBirds(n, announce = true) {
    s.birds = n; store.set('hf-birds', n);
    if (!n) store.set('hf-seed-at', 0);
    renderBirds();
    if (announce) $('#bird-status').textContent = n ? 'Window open. Hold your cursor still for a moment and the bird will land on it.' : 'Window closed. The birds are back in the aviary.';
    window.dispatchEvent(new CustomEvent('hf-birds'));
    status();
  }
  birdLever.addEventListener('click', () => setBirds(s.birds ? 0 : 1));
  seedBtn.addEventListener('click', () => {
    if (s.birds !== 1) return;
    // Somebody small and hungry notices, eventually.
    store.set('hf-seed-at', Date.now() + 15000 + Math.random() * 15000);
    seedBtn.classList.remove('scatter'); void seedBtn.offsetWidth; seedBtn.classList.add('scatter');
    renderBirds();
    $('#bird-status').textContent = 'Birdseed scattered. Give it a little while.';
  });
  // the second bird can arrive while you are on this page
  window.addEventListener('hf-birds', () => {
    const n = Math.max(0, Math.min(2, store.get('hf-birds', 0) | 0));
    if (n !== s.birds) { s.birds = n; renderBirds(); status(); if (n === 2) $('#bird-status').textContent = 'A second bird found the seed. Your cursor is a little heavier now.'; }
  });

  /* ---------- B5: Egg incubator ---------- */
  const HATCH_COST = 500;
  const coins = () => Math.max(0, Math.floor(Number(store.get('hf-coins', 0)) || 0));
  const hatchedList = () => store.get('hf-hatched', []).filter((id) => CREATURES[id]);
  function renderEggs() {
    const have = coins(), done = hatchedList();
    $('#mr-coins').textContent = have.toLocaleString();
    $('#mr-eggs').innerHTML = HF().eggs().map((e) => {
      const born = done.includes(e.id), cr = CREATURES[e.id];
      if (born) return `<li class="hatched" data-egg="${e.id}"><span class="mr-dome" aria-hidden="true"><canvas class="mr-hatchling" width="16" height="16"></canvas></span><b>${cr.name}</b>${errandCell(e.id)}</li>`;
      if (!e.found) return `<li data-egg="${e.id}"><span class="mr-dome" aria-hidden="true"><span class="mr-egg"></span></span><b>${e.title}</b><span>Still hidden</span></li>`;
      return `<li class="found" data-egg="${e.id}"><span class="mr-dome" aria-hidden="true"><span class="mr-egg"></span></span><b>${e.title}</b><button type="button" class="mr-hatch" data-hatch="${e.id}"${have < HATCH_COST ? ' disabled' : ''} aria-label="Hatch the ${e.title} egg for ${HATCH_COST} coins">Hatch, ${HATCH_COST} coins</button></li>`;
    }).join('');
    $('#mr-eggs').querySelectorAll('li.hatched').forEach((li) => {
      const cv = $('canvas', li), c = cv.getContext('2d');
      c.imageSmoothingEnabled = false; c.drawImage(creatureCanvas(li.dataset.egg, 'right'), 0, 0);
    });
  }
  // Hatchlings can run an errand: gone for ERRAND_HOURS (and missing from the Agora), then back with coins to collect.
  const errands = () => store.get('hf-errands', {});
  const left = (ms) => { const m = Math.ceil(ms / 60e3), h = Math.floor(m / 60); return h ? `${h} h ${m % 60} min` : `${m} min`; };
  function errandCell(id) {
    const job = ERRANDS[id], out = errands()[id];
    if (!out) return `<span>Lives in the Agora</span><button type="button" class="mr-hatch mr-errand" data-errand="${id}" title="${job.job}">Send on an errand</button><span class="mr-job">${job.job}, ${ERRAND_HOURS} hours</span>`;
    if (out.back > Date.now()) return `<span class="mr-away">Out: ${job.job.toLowerCase()}</span><span class="mr-job">Back in ${left(out.back - Date.now())}</span>`;
    return `<span class="mr-back">Back from its errand</span><button type="button" class="mr-hatch" data-collect="${id}">Collect ${out.pay} coins</button>`;
  }
  $('#mr-eggs').addEventListener('click', (e) => {
    const send = e.target.closest('[data-errand]'), take = e.target.closest('[data-collect]');
    if (send) {
      const id = send.dataset.errand, all = errands();
      all[id] = { back: Date.now() + ERRAND_HOURS * 3600e3, pay: ERRAND_PAY[0] + Math.floor(Math.random() * (ERRAND_PAY[1] - ERRAND_PAY[0] + 1)) };
      store.set('hf-errands', all); renderEggs(); status();
      $('#egg-status').textContent = `The ${CREATURES[id].name.toLowerCase()} set off to ${ERRANDS[id].job.toLowerCase()}. Back in ${ERRAND_HOURS} hours.`;
    }
    if (take) {
      const id = take.dataset.collect, all = errands(), out = all[id];
      if (!out || out.back > Date.now()) return;
      delete all[id]; store.set('hf-errands', all);
      store.set('hf-coins', coins() + out.pay); renderEggs(); status();
      $('#egg-status').textContent = `${ERRANDS[id].back}: ${out.pay} coins, added to your Little Athens wallet.`;
      HF().toast(`+${out.pay} coins`, `Your ${CREATURES[id].name.toLowerCase()} is back from its errand.`, 'egg');
    }
  });
  setInterval(() => { if (Object.keys(errands()).length) renderEggs(); }, 30e3);
  // The egg wobbles, cracks, and the hatchling pops out. It moves into the Agora in Little Athens.
  $('#mr-eggs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-hatch]');
    if (!b || b.disabled) return;
    const id = b.dataset.hatch, li = b.closest('li'), cr = CREATURES[id];
    if (coins() < HATCH_COST) { $('#egg-status').textContent = `Hatching costs ${HATCH_COST} coins. Earn some in Little Athens first.`; return; }
    store.set('hf-coins', coins() - HATCH_COST);
    store.set('hf-hatched', [...new Set([...hatchedList(), id])]);
    $('#mr-eggs').querySelectorAll('[data-hatch]').forEach((x) => { x.disabled = true; });
    li.classList.add('hatching');
    setTimeout(() => {
      renderEggs(); status();
      const born = $(`#mr-eggs li[data-egg="${id}"]`); born?.classList.add('just-hatched');
      $('#egg-status').textContent = `It hatched! A ${cr.name.toLowerCase()}. It has moved into the Agora in Little Athens. Go say hello.`;
      HF().toast(`An egg hatched: ${cr.name}`, 'It lives in the Agora in Little Athens now.', 'egg');
    }, reduceMotion ? 0 : 1500);
  });
  const eggLever = $('#egg-lever');
  let armedUntil = 0;
  eggLever.addEventListener('click', () => {
    if (Date.now() > armedUntil) {
      armedUntil = Date.now() + 5000;
      eggLever.classList.add('armed');
      $('#egg-status').textContent = 'Safety catch released. Pull again within 5 seconds to re-hide all nine eggs.';
      setTimeout(() => { if (Date.now() > armedUntil) { eggLever.classList.remove('armed'); $('#egg-status').textContent = 'Safety catch is back on.'; } }, 5100);
      return;
    }
    armedUntil = 0; eggLever.classList.remove('armed');
    pull(eggLever, () => {
      HF().resetEggs(); renderEggs(); status();
      $('#egg-status').textContent = 'All nine eggs are hidden again. Happy hunting. Your key to this room still works.';
    });
  });

  /* ---------- B6: Factory settings ---------- */
  const resetLever = $('#reset-lever');
  resetLever.addEventListener('click', () => {
    const already = s.lang === 'en' && !s.boat && !s.birds && s.weather === 'clear';
    pull(resetLever, () => {
      setLang('en', false); setWeather('clear', false); setBoat(false, false); setBirds(0, false);
      ['#lang-status', '#weather-status', '#harbor-status', '#bird-status'].forEach((id) => { $(id).textContent = ''; });
      $('#reset-status').textContent = already ? 'Everything was already at factory settings. Satisfying to pull anyway.' : 'Homepage in English, sky clear, boat in the shed, birds back in the aviary. Everything is the way Hannah left it.';
    });
  });

  function pull(lever, then) {
    lever.classList.add('pulled');
    setTimeout(then, reduceMotion ? 0 : 380);
    setTimeout(() => lever.classList.remove('pulled'), reduceMotion ? 300 : 1100);
  }

  /* ---------- Lobby gears ---------- */
  const gear = (teeth, r0, r1) => {
    const pts = [];
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2, r = i % 2 ? r0 : r1;
      pts.push([Math.cos(a0) * r, Math.sin(a0) * r], [Math.cos(a1) * r, Math.sin(a1) * r]);
    }
    return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
  };
  $('.mr-gears .g1 path').setAttribute('d', gear(12, 38, 46));
  $('.mr-gears .g2 path').setAttribute('d', gear(8, 26, 34));

  /* ---------- Freight elevator floor indicator ---------- */
  const STEP = 144 / (FLOORS.length - 1);
  $('.mr-dial-ticks').innerHTML = FLOORS.map((f, i) => {
    const a = ((-72 + i * STEP) * Math.PI) / 180, sn = Math.sin(a), cs = Math.cos(a);
    return `<line x1="${100 + 80 * sn}" y1="${104 - 80 * cs}" x2="${100 + 88 * sn}" y2="${104 - 88 * cs}"/><text x="${100 + 66 * sn}" y="${104 - 66 * cs}">${f}</text>`;
  }).join('');
  const floorsEl = $('#mr-floors');
  floorsEl.innerHTML = FLOORS.map((f) => `<li><button type="button" data-go="${f.toLowerCase()}">${f}</button></li>`).join('');
  floorsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) document.getElementById(b.dataset.go).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  const sections = FLOORS.map((f) => document.getElementById(f.toLowerCase()));
  const needle = $('#mr-needle'), main = $('#main');
  const up = $('.mr-arrow.up'), down = $('.mr-arrow.down');
  let lastY = scrollY, lampTimer;
  function onScroll() {
    // the arrow lamps light up in the direction the elevator is moving
    if (scrollY !== lastY) {
      up.classList.toggle('on', scrollY < lastY); down.classList.toggle('on', scrollY > lastY);
      clearTimeout(lampTimer); lampTimer = setTimeout(() => { up.classList.remove('on'); down.classList.remove('on'); }, 450);
      lastY = scrollY;
    }
    const mid = scrollY + innerHeight * .45;
    const tops = sections.map((sec) => sec.getBoundingClientRect().top + scrollY);
    let f = 0;
    for (let i = 0; i < tops.length - 1; i++) if (mid >= tops[i]) f = i + Math.min(1, (mid - tops[i]) / (tops[i + 1] - tops[i]));
    if (mid >= tops[tops.length - 1]) f = tops.length - 1;
    needle.style.transform = `rotate(${-72 + f * STEP}deg)`;
    const cur = Math.round(f);
    floorsEl.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
    const max = document.documentElement.scrollHeight - innerHeight;
    main.style.setProperty('--depth', (max > 0 ? scrollY / max : 0) * .9);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  setLang(s.lang, false); setWeather(s.weather, false);
  toggleLever(boatLever, s.boat, BOAT); renderBirds();
  renderEggs(); status(); onScroll();
}

// Arrow keys move between options in a radio group, and selecting follows focus.
function radioKeys(group, sel, choose) {
  group.addEventListener('keydown', (e) => {
    const items = [...group.querySelectorAll(sel)], i = items.indexOf(e.target.closest(sel));
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (i < 0 || !d) return;
    e.preventDefault();
    const next = items[(i + d + items.length) % items.length];
    next.focus(); choose(next);
  });
}
