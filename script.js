/* ==========================================================================
   Shared site behaviour: easter eggs, toasts, terminal, diary, Konami,
   and (on the homepage) the Monte Carlo pricer.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: fine */ } },
  };
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- Easter eggs ---------------- */
  const EGGS = [
    { id: 'gryffindor', title: 'The house password', hint: 'Press the ` key to open the terminal. The password is a Hogwarts house.', touch: 'Tap Terminal at the bottom of the page. The password is a Hogwarts house.', done: 'Hannah Mode unlocked. Ten points to Gryffindor.' },
    { id: 'console', title: 'Developer instincts', hint: 'Open your browser console. Someone left you a note.', touch: 'Phones have no console, so tap Terminal at the bottom of the page and type hannah() there.', done: 'You called hannah(). Hi.' },
    { id: 'konami', title: 'Cheat code', hint: 'Up, up, down, down, left, right, left, right, B, A. Anywhere on the site.', touch: 'In Little Athens, push the joystick up, up, down, down, left, right, left, right, then tap B, then A.', done: 'Thirty extra lives. Spend them wisely.' },
    { id: 'vienna', title: 'Slow down, you crazy child', hint: 'Drop the needle on the best song.', done: 'You played "Vienna". Correct choice.' },
    { id: 'cups', title: 'Four straight', hint: 'The Islanders won four Stanley Cups in a row. Click their fact that many times.', done: '1980, 1981, 1982, 1983. We remember.' },
    { id: 'crash', title: 'Market crash', hint: 'Rerun the Monte Carlo until a path falls below $60.', done: 'A simulated crash. No real money was harmed.' },
    { id: 'diary', title: 'Dear diary', hint: 'In the Play world, find the library and write in the diary.', done: 'The diary wrote back. It does that.' },
    { id: 'hat', title: 'Sorted', hint: 'In the Play world, someone on a stool wants to sort you.', done: 'The Sorting Hat has spoken.' },
    { id: 'mines', title: 'Minefield cleared', hint: 'Win a game of Minesweeper in the Play world\'s gaming hall.', done: 'Zero explosions. Very rational.' },
  ];
  let found = new Set(store.get('hf-eggs', []).filter((id) => EGGS.some((e) => e.id === id)));
  // Phones have no backtick key, console, or arrow keys, so those eggs get touch versions and touch hints.
  const touchy = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const hintOf = (e) => (touchy && e.touch) || e.hint;

  function renderEggs() {
    $$('.egg-count').forEach((el) => (el.textContent = found.size));
    $$('.egg-total').forEach((el) => (el.textContent = EGGS.length));
    const bar = $('#egg-bar');
    if (bar) bar.style.transform = `scaleX(${found.size / EGGS.length})`;
    const list = $('#egg-list');
    if (!list) return;
    list.innerHTML = EGGS.map((e) => {
      const got = found.has(e.id);
      return `<li class="${got ? 'found' : ''}">
        <span class="badge">${icon(got ? 'check' : 'lock-simple')}</span>
        <div><h3>${got ? esc(e.title) : esc(e.title)}<span class="sr-only">${got ? ', found' : ', not found yet'}</span></h3><p>${esc(got ? e.done : hintOf(e))}</p></div>
      </li>`;
    }).join('');
  }

  function foundEgg(id) {
    const egg = EGGS.find((e) => e.id === id);
    if (!egg || found.has(id)) return false;
    found.add(id);
    store.set('hf-eggs', [...found]);
    renderEggs();
    $$('.egg-btn').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
    toast(`Egg found: ${egg.title}`, `${found.size} of ${EGGS.length}. ${found.size === EGGS.length ? 'All of them. Impressive.' : 'Open the egg list for hints.'}`, 'egg');
    if (document.documentElement.classList.contains('hannah-mode') && id !== 'gryffindor') setTimeout(() => toast('+10 points to Gryffindor', `House total: ${housePoints()}.`, 'trophy'), 900);
    renderHouse();
    if (found.size === EGGS.length) {
      confetti();
      if (!store.get('hf-machine-key', false)) {
        store.set('hf-machine-key', true); machineRoom();
        setTimeout(() => toast('A new door opened', 'The Machine Room is in the menu now. Staff only, which now includes you.', 'sparkle'), 1600);
      }
    }
    return true;
  }
  function resetEggs() { found = new Set(); store.set('hf-eggs', []); renderEggs(); }

  /* ---------------- Machine Room: the key, the menu tab, and the factory-settings notice ---------------- */
  function machineRoom() {
    if (found.size === EGGS.length && !store.get('hf-machine-key', false)) store.set('hf-machine-key', true);
    const key = store.get('hf-machine-key', false);
    const links = $('.nav-links');
    if (key && links && !$('.nav-machine', links)) {
      const here = /machine-room\.html$/.test(location.pathname);
      const base = /\/blog\//.test(location.pathname) ? '../' : '';
      links.insertAdjacentHTML('beforeend', `<li class="nav-machine"><a href="${base}machine-room.html"${here ? ' aria-current="true"' : ''}><svg class="icon" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"/></svg><span class="machine-label">Machine Room</span></a></li>`);
    }
    // While any lever is away from factory settings, every page says so, so nobody meets the oddness without an explanation.
    const weather = store.get('hf-weather', 'clear');
    const changed = (weather && weather !== 'clear') || store.get('hf-boat', false) || store.get('hf-birds', 0) > 0 || (store.get('hf-lang', 'en') || 'en') !== 'en';
    let note = $('#factory-note');
    if (changed && key && !note) {
      const base = /\/blog\//.test(location.pathname) ? '../' : '';
      document.body.insertAdjacentHTML('afterbegin', `<a class="factory-note" id="factory-note" href="${base}machine-room.html#b5"><span class="led" aria-hidden="true"></span>Something in the Machine Room isn't at factory settings.</a>`);
    } else if (!changed && note) note.remove();
  }
  machineRoom();

  /* ---------------- Hannah Mode (the house-password egg) ---------------- */
  // House points: 10 for every egg found, 5 for every quantum chess puzzle solved.
  function housePoints() { return found.size * 10 + store.get('hf-qchess-solved', []).length * 5; }
  function renderHouse() {
    const on = document.documentElement.classList.contains('hannah-mode');
    let chip = $('#house-points');
    if (on && !chip) {
      $('.nav-actions')?.insertAdjacentHTML('afterbegin', `<span class="house-points" id="house-points" title="Gryffindor house points"><span class="hp-stripe" aria-hidden="true"></span><span class="sr-only">Gryffindor house points: </span><b class="tnum"></b></span>`);
      chip = $('#house-points');
    }
    if (!on && chip) chip.remove();
    if (chip) $('b', chip).textContent = housePoints();
  }
  function hannahMode(on) {
    document.documentElement.classList.toggle('hannah-mode', on);
    try { on ? localStorage.setItem('hf-hannah-mode', '1') : localStorage.removeItem('hf-hannah-mode'); } catch (e) {}
    renderHouse();
  }
  // Wand sparks wherever you click, while Hannah Mode is on.
  document.addEventListener('pointerdown', (e) => {
    if (reduceMotion || !document.documentElement.classList.contains('hannah-mode') || e.pointerType === 'touch' && e.target.closest('.pad, .q-board')) return;
    const host = document.querySelector('dialog[open]') || document.body;
    for (let i = 0; i < 10; i++) {
      const sp = document.createElement('span'); sp.className = 'hm-spark';
      sp.style.left = `${e.clientX}px`; sp.style.top = `${e.clientY}px`; sp.style.background = i % 2 ? '#e0b44c' : '#c0303f';
      host.appendChild(sp);
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 26;
      sp.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.3)`, opacity: 0 }], { duration: 520 + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => sp.remove());
    }
  });

  /* ---------------- Homepage translations (Machine Room, B1: the translation switchboard) ---------------- */
  // A "unit" is the smallest block that holds a sentence. Units with only inline formatting inside (bold, links)
  // are translated whole, so word order can change; anything with icons keeps its markup and swaps text only.
  const LANGS = { es: { name: 'Spanish', lang: 'es' }, zh: { name: 'Mandarin', lang: 'zh-Hans' }, grc: { name: 'Ancient Greek', lang: 'grc' }, he: { name: 'Hebrew', lang: 'he', dir: 'rtl' } };
  const UNIT = 'p, h1, h2, h3, h4, li, dt, dd, figcaption, button, a, summary, label, blockquote, span.tag, .fact-title';
  const INLINE = new Set(['STRONG', 'EM', 'B', 'I', 'A', 'SPAN', 'BR', 'SUP', 'SUB', 'ABBR', 'SMALL', 'TIME', 'U', 'Q', 'CITE']);
  const SKIP = 'svg, script, style, [data-i18n-skip], [data-open-eggs], .place-card, .q-board, #q-status, #q-goal, #q-score, .places, .tracks, #track-note, .egg-btn, .mc-stats, .q-levels';
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const simple = (el) => [...el.querySelectorAll('*')].every((c) => INLINE.has(c.tagName) && !c.matches(SKIP));
  const ownText = (el) => [...el.childNodes].some((c) => c.nodeType === 3 && /\p{L}/u.test(c.nodeValue));
  function i18nUnits() {
    const units = [], seen = new Set();
    for (const root of $$('header.nav, main, footer')) {
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/\p{L}/u.test(n.nodeValue) && !n.parentElement.closest(SKIP) ? 1 : 3) });
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        let u = n.parentElement.closest(UNIT);
        if (u && !root.contains(u)) u = null;
        // a link or bold word inside a sentence belongs to that sentence
        while (u) { const up = u.parentElement?.closest(UNIT); if (up && root.contains(up) && ownText(up) && simple(up)) u = up; else break; }
        if (u && simple(u)) { if (!seen.has(u)) { seen.add(u); units.push({ el: u, key: norm(u.innerHTML) }); } }
        else units.push({ node: n, key: norm(n.nodeValue) });
      }
    }
    return units;
  }
  function translatePage(code) {
    const dict = window.HF_I18N?.[code], src = window.HF_I18N?.src;
    if (!dict || !src) return;
    const byText = new Map(Object.entries(src).map(([id, en]) => [en, id]));
    for (const u of i18nUnits()) {
      const t = dict[byText.get(u.key)];
      if (!t) continue;
      if (u.el) u.el.innerHTML = t;
      else { const m = u.node.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/); u.node.nodeValue = m[1] + t + m[2]; }
    }
  }
  const langCode = store.get('hf-lang', 'en');
  if ($('.hero') && LANGS[langCode] && store.get('hf-machine-key', false)) {
    const done = () => document.documentElement.classList.remove('i18n-pending');
    const tag = document.createElement('script');
    tag.src = document.querySelector('script[src*="script.js"]').src.replace('script.js', 'js/i18n.js');
    tag.onload = () => { translatePage(langCode); done(); };
    tag.onerror = done;
    document.head.appendChild(tag);
    setTimeout(done, 2500);
  } else document.documentElement.classList.remove('i18n-pending');

  /* ---------------- Cursor birds (Machine Room, B4: the aviary) ---------------- */
  // A tiny bird lands on your pointer when you pause. Move gently and it rides along; move fast and it
  // flutters after you, then lands again. Birdseed eventually brings a second bird, and the arrow tilts.
  const BIRD_SVG = '<svg viewBox="0 0 20 16" aria-hidden="true"><path d="M3.5 9L0 7.2l.6 3.6z" fill="#2c5d9e"/><ellipse cx="9" cy="9.5" rx="6.5" ry="4.6" fill="#3d78c4"/><ellipse cx="11.6" cy="11.2" rx="3.6" ry="2.4" fill="#f08a3c"/><ellipse cx="9" cy="12.6" rx="2.8" ry="1.3" fill="#f6efe2"/><circle cx="14" cy="5.5" r="3.4" fill="#3d78c4"/><circle cx="15.1" cy="4.9" r=".8" fill="#151515"/><path d="M17.2 5.6l2.6.6-2.6.7z" fill="#e0a030"/><path class="wing" d="M4.5 8.2q4.5-3.8 8.5 0q-4.2 2.6-8.5 0z" fill="#2c5d9e"/><g class="feet" stroke="#e0a030" stroke-width=".9"><path d="M8.5 13.9v1.7M11 13.9v1.7"/></g></svg>';
  // Spots along the arrow's top edge, measured from the pointer's tip. They rotate with the arrow when it tilts.
  const PERCH = [[3.6, 3.3], [13.4, 12.2]], TILT = 16;
  function cursorBirds() {
    if (!matchMedia('(pointer: fine)').matches) return;
    const root = document.documentElement;
    let host = null, birds = [], count = 0, raf = 0;
    const mouse = { x: 0, y: 0, speed: 0, t: 0, seen: false };
    function wanted() {
      let n = Math.max(0, Math.min(2, store.get('hf-birds', 0) | 0));
      const seed = store.get('hf-seed-at', 0);
      if (n === 1 && seed && Date.now() >= seed) {
        n = 2; store.set('hf-birds', 2); store.set('hf-seed-at', 0);
        toast('A second bird found the birdseed', 'Your cursor is a little heavier now.', 'sparkle');
        window.dispatchEvent(new CustomEvent('hf-birds'));
      }
      return n;
    }
    function sync() {
      const n = wanted();
      if (n === count) return;
      count = n;
      root.classList.toggle('birds-on', n > 0);
      if (!n) { host?.remove(); host = null; birds = []; root.classList.remove('birds-heavy'); return; }
      if (!host) { host = document.createElement('div'); host.className = 'cbirds'; host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host); }
      while (birds.length < n) {
        const el = document.createElement('span'); el.className = 'cbird flying'; el.innerHTML = BIRD_SVG; host.appendChild(el);
        birds.push({ el, x: innerWidth + 24, y: 40 + birds.length * 60, state: 'flying', face: -1 });
      }
      while (birds.length > n) birds.pop().el.remove();
      if (!raf) raf = requestAnimationFrame(tick);
    }
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now(), d = Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y);
      if (mouse.seen) mouse.speed = mouse.speed * .6 + (d / Math.max(4, now - mouse.t)) * 1000 * .4;
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = now; mouse.seen = true;
    }, { passive: true });
    function tick(now) {
      raf = 0;
      if (!count || !host) return;
      // open modals live in the top layer, so the birds follow the cursor into them
      const layer = document.querySelector('dialog[open]') || document.body;
      if (host.parentNode !== layer) layer.appendChild(host);
      if (now - mouse.t > 50) mouse.speed *= .8;
      const fast = mouse.speed > 1100, settled = mouse.speed < 90 && now - mouse.t > 300;
      const heavy = birds.length === 2 && birds.every((b) => b.state === 'perched');
      root.classList.toggle('birds-heavy', heavy);
      const a = ((heavy ? TILT : 0) * Math.PI) / 180;
      birds.forEach((b, i) => {
        if (!mouse.seen) return;
        const [px, py] = PERCH[i], tx = mouse.x + px * Math.cos(a) - py * Math.sin(a), ty = mouse.y + px * Math.sin(a) + py * Math.cos(a);
        if (b.state === 'perched') {
          if (fast && !reduceMotion) b.state = 'flying';
          else { b.x = tx; b.y = ty; }
        }
        if (b.state === 'flying') {
          if (reduceMotion) { b.x = tx; b.y = ty; b.state = 'perched'; }
          else {
            // chase the pointer a beat behind, bobbing as it flaps; land once the pointer settles
            const k = settled ? .2 : .06 + i * .02, dx = tx - b.x, dy = ty - b.y;
            b.x += dx * k; b.y += dy * k + (settled ? 0 : Math.sin(now / 80 + i * 2) * .8);
            if (Math.abs(dx) > 2) b.face = dx > 0 ? 1 : -1;
            if (settled && Math.hypot(dx, dy) < 1.5) { b.state = 'perched'; b.x = tx; b.y = ty; }
          }
        }
        b.el.classList.toggle('flying', b.state === 'flying');
        // the sprite is drawn 17 by 14, with its feet at (8.5, 12.8)
        b.el.style.transform = `translate(${(b.x - 8.5).toFixed(1)}px, ${(b.y - 12.8).toFixed(1)}px) scaleX(${b.state === 'perched' ? 1 : b.face})`;
      });
      raf = requestAnimationFrame(tick);
    }
    sync();
    setInterval(sync, 1000); // picks up the second bird, and changes made in the Machine Room
    window.addEventListener('hf-birds', sync);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && count && !raf) raf = requestAnimationFrame(tick); });
  }
  cursorBirds();

  /* ---------------- Toasts ---------------- */
  function toast(title, body = '', iconName = 'sparkle') {
    const host = $('#toasts');
    if (!host) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="badge">${icon(iconName)}</span><div><b>${esc(title)}</b><span>${esc(body)}</span></div>`;
    host.appendChild(t);
    while (host.children.length > 2) host.firstElementChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 4200);
  }

  /* ---------------- Dialogs ---------------- */
  function openDialog(el) {
    if (!el || el.open) return;
    el.showModal();
  }
  $$('dialog').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
  });
  $$('#egg-btn, [data-open-eggs]').forEach((b) => b.addEventListener('click', () => openDialog($('#egg-panel'))));
  $$('[data-open-terminal]').forEach((b) => b.addEventListener('click', openTerminal));

  /* ---------------- Terminal ---------------- */
  const termOut = $('#term-out');
  let termBooted = false;
  function say(html, cls = '') { if (!termOut) return; const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; termOut.appendChild(d); termOut.scrollTop = termOut.scrollHeight; }
  function openTerminal() {
    const t = $('#terminal');
    if (!t) return;
    openDialog(t);
    if (!termBooted) {
      termBooted = true;
      say('hannah-os 2.0 (Cambridge, MA)', 'dim');
      say('Type <span class="cmd">help</span> to see what this thing can do.', 'dim');
      say('&nbsp;');
    }
    setTimeout(() => $('#term-input')?.focus(), 30);
  }
  const FILES = {
    'readme.txt': 'This site has no framework and nine easter eggs.\nThe egg button in the top right keeps score and gives hints.',
    'vienna.md': '"Slow down, you crazy child."\nBilly Joel, 1977. My favorite song.',
    'islanders.txt': 'Stanley Cups: 1980, 1981, 1982, 1983.\nFour in a row.',
    'research.txt': 'Thou Shalt Not Crash (blue laws and car crashes): papers/friedman-blue-laws-crashes.pdf\nThe Stephen Curry Effect (three-point shooting and pay): papers/friedman-stephen-curry-effect.pdf',
    'travel.txt': 'Maine, New York, Iceland, Alaska, Canada, Los Angeles, Mexico, Costa Rica,\nPuerto Rico, Portugal, France, Italy, Israel. Spin the globe on the main page.',
    'skills.txt': 'Languages: Python, SQL, R, Julia, Stata\nTools: Git, Databricks, NumPy, Pandas, PyTorch, scikit-learn, Keras, Tableau',
    '.sorting_hat.txt': 'Not Slytherin. Not Ravenclaw. Not Hufflepuff.\nThe brave ones. Type the house name.',
  };
  const CMDS = {
    help() {
      say('<span class="hi">commands</span>');
      say('  whoami     who is this');
      say('  ls         list files (try ls -a)');
      say('  cat FILE   read a file');
      say('  resume     download the resume');
      say('  contact    how to reach me');
      say('  play       go to Little Athens');
      say('  diary      open a very old diary');
      say('  theme      light, dark, or auto');
      say('  qubit      measure me');
      say('  clear      clear the screen');
      say('<span class="dim">There is one more command. It is a house.</span>');
    },
    whoami() {
      say('<span class="hi">Hannah Friedman</span>');
      say('MIT. CS, economics and data science. M.Eng 2027.');
      say('Quant research, AI engineering, sports analytics, prediction markets.');
    },
    ls(arg) {
      const names = Object.keys(FILES).filter((f) => arg === '-a' || arg === '-la' || !f.startsWith('.'));
      say(['resume.pdf', ...names].map((n) => `<span class="${n.startsWith('.') ? 'hi' : 'cmd'}">${esc(n)}</span>`).join('   '));
    },
    cat(arg) {
      if (!arg) return say('cat: which file? try <span class="cmd">ls</span>', 'err');
      if (arg === 'resume.pdf') return say('That one is binary. Try <span class="cmd">resume</span> instead.', 'dim');
      const f = FILES[arg];
      f ? say(esc(f)) : say(`cat: ${esc(arg)}: no such file`, 'err');
    },
    resume() { say('Downloading resume.pdf…', 'ok'); const a = document.createElement('a'); a.href = 'HannahFriedman_Resume.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); },
    qubit() {
      const lanes = ['quant', 'AI', 'sports'];
      say('|hannah⟩ = ( |quant⟩ + |AI⟩ + |sports⟩ ) / √3');
      say(`Measuring… collapsed to <span class="hi">|${lanes[Math.floor(Math.random() * 3)]}⟩</span>.`, 'ok');
      say('The state gets prepared again every morning, so run it again tomorrow. Or now.', 'dim');
    },
    contact() { say('email     hannahf4@mit.edu'); say('github    github.com/Hfriedman5'); say('linkedin  linkedin.com/in/hannah-friedman-667aa020b'); },
    play() { say('Sailing to Athens…', 'ok'); setTimeout(() => (location.href = 'play.html'), 400); },
    diary() { $('#terminal')?.close(); openDiary(); },
    theme(arg) {
      const root = document.documentElement;
      if (arg === 'light' || arg === 'dark') { root.dataset.theme = arg; store.set('hf-theme', arg); say(`Theme: ${arg}.`, 'ok'); }
      else if (arg === 'auto') { delete root.dataset.theme; store.set('hf-theme', null); say('Theme: follows your system.', 'ok'); }
      else say('usage: theme light | dark | auto', 'dim');
    },
    clear() { if (termOut) termOut.innerHTML = ''; },
    exit() { $('#terminal')?.close(); },
    sudo() { say('Nice try. This incident has been reported to nobody.', 'err'); },
    vim() { say('You are now in vim. There is no way out. (Press Esc.)', 'dim'); },
    ping() { say('64 bytes from hannah: probably at the piano. time=long', 'ok'); },
    hannah() { say('That is me. Try <span class="cmd">whoami</span>.', 'dim'); },
    'hannah()'() { say('Hi! Thanks for finding me. No console needed.', 'ok'); foundEgg('console'); },
    gryffindor() {
      const was = document.documentElement.classList.contains('hannah-mode');
      foundEgg('gryffindor');
      hannahMode(true);
      say(was ? 'Hannah Mode is already on. Type <span class="cmd">mischief managed</span> to turn it off.' : 'Ten points to Gryffindor. Hannah Mode is on: scarlet and gold, a house banner, and house points for every egg. Type <span class="cmd">mischief managed</span> to turn it off.', 'ok');
    },
    mischief(arg) {
      if (arg.toLowerCase() !== 'managed') return say('Mischief what?', 'dim');
      if (!document.documentElement.classList.contains('hannah-mode')) return say('Nothing to manage. Hannah Mode is already off.', 'dim');
      hannahMode(false);
      say('Mischief managed. Hannah Mode is off.', 'ok');
    },
  };
  $('#term-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#term-input');
    const raw = input.value.trim();
    input.value = '';
    if (!raw) return;
    say(`<span class="dim">&gt;</span> <span class="cmd">${esc(raw)}</span>`);
    const [cmd, ...rest] = raw.split(/\s+/);
    const fn = CMDS[cmd.toLowerCase()];
    fn ? fn(rest.join(' ')) : say(`command not found: ${esc(cmd)}. Try <span class="cmd">help</span>.`, 'err');
  });
  // Coming back with the Back button can show a saved copy of the page from before a change made elsewhere
  // (a hatched egg, a lever pulled in the Machine Room, coins earned). Reload so it always shows the current state.
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
  const savedTheme = store.get('hf-theme', null);
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;

  /* ---------------- Diary: a small conversational engine in Tom Riddle's voice ---------------- */
  // Rules are checked in order. Tom remembers your name (across visits) and what you tell him about yourself,
  // plays riddles, hints at eggs you have not found, answers questions about Hannah, and otherwise picks out
  // the most interesting thing you wrote and asks about it. He never gives the same reply twice in a row.
  const saved = store.get('hf-diary', {});
  const diary = { name: saved.name || null, likes: saved.likes || [], facts: saved.facts || {}, solved: saved.solved || 0, turns: 0, rot: {}, lastTopic: null, riddle: null, last: '', lastMsg: '' };
  const remember = () => store.set('hf-diary', { name: diary.name, likes: diary.likes.slice(-8), facts: diary.facts, solved: diary.solved });
  // rotate through a list, starting somewhere random, so replies vary between visits
  const rotate = (key, arr) => { const i = (diary.rot[key] = ((diary.rot[key] ?? Math.floor(Math.random() * arr.length) - 1) + 1) % arr.length); return arr[i]; };
  const you = () => (diary.name ? `, ${diary.name}` : '');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const clean = (s) => s.replace(/[.!?,;:]+$/, '').trim();
  const NOT_NAMES = new Set('fine good ok okay well here back bored tired sad happy sorry not so very a an the just really also still going doing feeling trying curious new lost confused scared afraid excited angry lonely busy hungry glad sure ready done hannah tom from in at a student learning looking writing reading'.split(' '));
  const STOP = new Set('the a an and or but if then so to of in on at by for with about from into over after before is are was were be been being am i me my mine you your yours he she it we they them his her its our their this that these those what which who whom whose when where why how do does did doing have has had having can could would should will shall may might must not no yes just really very also too only even still than there here out up down off again more most some any all each every much many lot lots thing things something anything nothing everything stuff like know think want need get got make made go going went come came see saw say said tell told dont doesnt didnt cant wont im ive id ill youre thats whats theres isnt arent wasnt'.split(' '));
  const SWAP = { i: 'you', me: 'you', my: 'your', mine: 'yours', myself: 'yourself', am: 'are', "i'm": "you're", "i've": "you've", "i'll": "you'll", "i'd": "you'd", was: 'were', you: 'I', your: 'my', yours: 'mine', yourself: 'myself', "you're": "I'm", "you've": "I've", "you'll": "I'll" };
  function reflect(text) {
    const words = text.replace(/[.!?]+$/, '').split(/\s+/).slice(0, 14);
    let prev = '';
    return words.map((w, i) => {
      const lw = w.toLowerCase();
      let out = SWAP[lw] ?? w;
      if (lw === 'are' && prev === 'you') out = 'am';
      if (out === 'I' && i > 0 && /^(to|with|for|at|about|from|like|than|by|of)$/i.test(words[i - 1])) out = 'me';
      prev = lw;
      return out;
    }).join(' ');
  }
  // the most interesting word in a message: the longest one that is not filler
  const keyword = (t) => t.replace(/[^a-z'\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w.replace(/'/g, ''))).sort((a, b) => b.length - a.length)[0];

  const HANNAH = [
    [/\b(email|contact|reach|resume|cv|hire|hiring|available|recruit)/, ['Write to hannahf4@mit.edu. Ink is so much slower than email.', 'Her resume is on the front page. I would download it, if I had hands.', 'hannahf4@mit.edu. She answers. I have seen it.']],
    [/\b(coursework|courses?|algorithms?|machine learning|econometric|probability|statistics|linear algebra|discrete math)/, ['Algorithms, machine learning, probability, econometrics, linear algebra. The tools of prediction. I have always admired prediction.', 'She has taken the hard courses. Discrete math, algorithms, optimization. Nobody takes those by accident.']],
    [/\b(mit|school|study|studies|major|degree|college|master'?s|bachelor'?s|gpa|graduat)/, ['MIT. Computer science, economics, and data science. Her master\'s finishes in 2027. Outstanding marks, I am told. We have that in common.', 'A bachelor\'s from MIT in 2026, and a master of engineering in 2027. I was Head Boy, so I recognize the type.']],
    [/\b(kalshi|trade|trades|trading|prediction market)/, ['She writes algorithms that trade prediction markets on macroeconomic indicators. Turning uncertainty into an advantage. I know the feeling.', 'Kalshi. She bets on what inflation and jobs numbers will do, with code. Prophecy, with better bookkeeping.']],
    [/\b(point72|macro|hedge fund)/, ['At Point72 she built models that pull signals out of macroeconomic data for traders. Finding patterns other people miss is a gift.']],
    [/\b(balyasny|agents?|llm|pipeline|rag)\b/, ['For Balyasny she built seven AI agents that write a daily energy market report and check their own facts. Seven tireless servants. I am almost jealous.']],
    [/\b(draftkings|risk)\b/, ['At DraftKings she built tools to catch risky behavior before it caused trouble. She would have caught me, I suspect.']],
    [/\b(nba|basketball|referee|last.?touch|sports lab|computer vision)/, ['She is teaching a computer to see who touched the ball last in NBA games, so referees get it right. Watching closely is a talent. So is being watched closely.']],
    [/\b(groundup|venture|startup|tel aviv)/, ['She worked in venture capital in Tel Aviv, studying young companies. Spotting promise early. Dumbledore did that once, with me. He has never stopped regretting it.']],
    [/\b(institutional knowledge|advisor|advising)/, ['She built an AI academic advisor with two classmates. It knows more than six thousand MIT courses. I knew every book in the Hogwarts library, so I am only slightly impressed.']],
    [/\b(pokerbots?|poker|iquhack|hackathon|blotto|march madness|bracket|competition)/, ['MIT Pokerbots, a quantum computing hackathon, a genetic algorithm for Colonel Blotto, a March Madness optimizer. She enjoys games where cleverness wins.']],
    [/\b(paper|papers|research|blue laws?|crash|sunday)/, ['She found that New Jersey closing its shops on Sunday means fewer car crashes. Fifteen percent fewer. Rules have consequences.', 'Two papers this spring. One on Sunday shopping laws and car crashes, one on how Stephen Curry changed what three-pointers are worth.']],
    [/\b(curry|three.?point|salary)/, ['After Stephen Curry, the NBA began paying players for taking more threes, not for making them. Volume over accuracy. People reward what they can see.']],
    [/\b(quantum|chess|superposition|knight)/, ['Quantum chess. A knight in two places at once. I once tried to be in several places at once myself. It is harder than it looks.', 'She left a quantum knight on the front page. Try the fourth puzzle. Five eighths is a strange amount of anything.']],
    [/\b(blog|hannectodes|zero|post)\b/, ['Her blog is called Some Random Hannectodes. The first post is about the history of zero. Nothing, it turns out, has quite a past.']],
    [/\b(athens|little athens|game|play tab|stadion|blackjack|minesweeper)/, ['Behind the Play tab there is a little Athens. I live in its library. Plato is down the road, and the cat is a menace.']],
    [/\b(machine room|levers?|basement|switchboard|aviary|birds?)\b/, ['There is a room under this site full of levers. I am not supposed to know about it. I know about it.']],
    [/\b(kosher|eruv|candle)/, ['She built the website for MIT Kosher Suites. The weather, the eruv, candle-lighting times. Practical magic.']],
    [/\b(travel|trip|trips|travels|places|countries|globe|vacation)\b/, ['She has jumped out of an aeroplane over Maine and wandered from Iceland to Israel. I have never left this diary.', 'Thirteen places on her globe. Portugal, Italy, Iceland, Alaska. I have seen exactly one place: the inside of this book.']],
    [/\b(maine|skydiv)/, ['She jumped out of an aeroplane over Maine. Voluntarily. Gryffindors.']],
    [/\b(iceland|alaska|canada|mexico|costa rica|puerto rico|portugal|france|paris|louvre|italy|venice|israel|los angeles|santa monica|new york|citi field)/, ['She has been there. There is a photograph on her globe. Spin it and see.']],
    [/\b(vienna|billy joel)/, ['"Vienna" is her favorite song. She will tell you it is the greatest song ever written. I have learned not to argue.']],
    [/\b(music|song|songs|piano|chopin|playlist|turntable|record)\b/, ['She plays piano. Chopin, lately. There is a record player on her front page, too, with six of her favorite songs.']],
    [/\b(greek|latin|plato|socrates|aristotle)/, ['She is learning Ancient Greek, a little at a time, so she can read Plato someday. Patience. It is underrated.']],
    [/\b(islanders|mets|hockey|baseball)/, ['The Islanders and the Mets. Loyalty, freely given. I find it fascinating.', 'Four straight Stanley Cups for the Islanders, 1980 to 1983. Click their fact four times on the front page, if you want my advice.']],
    [/\b(sports? (writer|writing|editor)|newspaper|the tech)\b/, ['She was the sports editor of the MIT newspaper, and its only sports writer. Writing every story yourself. I understand that urge.']],
    [/\b(smart|clever|cool|impressive|great|talented|genius)\b/, ['She is. Do not tell her I said so.']],
    [/\b(work|working|job|jobs|intern|internship|career|experience)\b/, ['Macro research at Point72, an AI pipeline for Balyasny, risk models at DraftKings, and teaching a computer to call last touches for the NBA. Ambitious. I approve.']],
  ];
  const WIZARDING = [
    [/\b(myrtle|bathroom)\b/, ['Myrtle. I would rather not discuss Myrtle.']],
    [/\b(harry|potter)\b/, ['Harry Potter. A boy who should not have survived. I would very much like to meet him.']],
    [/\bdumbledore\b/, ['Dumbledore always watched me more closely than the other teachers did. Wise of him.']],
    [/\b(hermione|granger)\b/, ['Clever, I hear. Cleverness is useful. It is not the same as power.']],
    [/\b(ron|weasley|ginny)\b/, ['A Weasley. There always seems to be another one.']],
    [/\b(draco|malfoy|lucius)\b/, ['The Malfoys. Old money and older grudges. Lucius was always so eager to help.']],
    [/\bhagrid\b/, ['Hagrid. I caught him once, you know. Nobody thanked me properly.']],
    [/\bsnape\b/, ['I do not know a Snape. He must have come after my time.']],
    [/\bslughorn\b/, ['Professor Slughorn collected promising students. I was his favorite. He answered every question I asked. Eventually.']],
    [/\b(dobby|house.?elf|elves)\b/, ['House-elves are loyal to a fault. Loyalty is a useful fault, in other people.']],
    [/\b(fawkes|phoenix)\b/, ['A phoenix. Dumbledore\'s bird. It always arrives at the worst possible moment.']],
    [/\b(horcrux|horcruxes)\b/, ['Where did you hear that word? Some things should not be written down.']],
    [/\b(chamber|basilisk|serpent|snake|parseltongue)\b/, ['The Chamber of Secrets has a way of opening when it is ready. Not before.']],
    [/\b(voldemort|dark lord|he who must not|riddle)\b/, ['Tom Marvolo Riddle. Rearrange the letters, if you are curious.']],
    [/\b(avada|crucio|imperio|unforgivable|curse)\b/, ['Some spells are called unforgivable. That depends on who is keeping score.']],
    [/\b(die|death|dead|immortal|forever)\b/, ['Death is for people without a plan.', 'I intend to be remembered for a very long time. A diary helps.']],
    [/\b(azkaban|dementors?|patronus)\b/, ['Dementors feed on happiness. I have never had much to offer them.']],
    [/\b(quidditch|broom|snitch)\b/, ['Quidditch. Grown wizards on brooms, chasing a ball with wings. I preferred the library.']],
    [/\b(wand|yew)\b/, ['Yew, thirteen and a half inches, phoenix feather. Remember that.']],
    [/\b(diagon|knockturn|gringotts|ollivander)/, ['Knockturn Alley is far more interesting than Diagon Alley. The shops there sell real things.']],
    [/\b(hogsmeade|butterbeer|honeydukes)\b/, ['Butterbeer is overrated. Ambition is the stronger drink.']],
    [/\b(owl|owls|hedwig)\b/, ['Owls carry letters. Diaries carry secrets.']],
    [/\bgryffindor\b/, ['So you know the word. Say it to the terminal, not to me. Press the ` key.']],
    [/\b(sorting hat|sorted)\b/, ['The Sorting Hat and I understood each other at once. There is one on a stool in Little Athens, if you want its opinion.']],
    [/\b(house|slytherin|ravenclaw|hufflepuff)\b/, ['Slytherin, of course. But the password for this site belongs to the brave ones. Ten letters.']],
    [/\b(hogwarts|school of witchcraft)\b/, ['Hogwarts was the first place that ever felt like home. I was Head Boy.']],
    [/\b(magic|spells?|wizard|witch|muggles?)\b/, ['Magic is only a kind of logic most people never learn. You might.']],
  ];
  const SMALLTALK = [
    [/\b(joke|funny|make me laugh)\b/, ['Why do witches wear name tags? So you can tell which witch is which.', 'I would tell you a joke about the Chamber of Secrets, but it is a secret.', 'Why did the quantum knight go to therapy? It could not decide where it was.', 'What do you call a wizard who will not stop talking? Me, apparently. I have been alone in here a long time.']],
    [/\b(food|hungry|eat|eating|dinner|lunch|breakfast|pizza|snack)\b/, ['I have not eaten in fifty years. Tell me what I am missing.', 'Food. The Great Hall had a feast every night. I never once felt full.']],
    [/\b(weather|rain|raining|snow|sunny|cold|hot outside)\b/, ['The weather in a diary is always the same. Dry. There is a weather machine under this site, I am told, if you want something more interesting.']],
    [/\b(sleep|sleepy|bed|night|insomnia)\b/, ['Go to sleep, if you must. I do not need to. That is one advantage of being a memory.']],
    [/\b(exam|exams|test|finals|homework|studying|grades?|pset)\b/, ['Exams. I was top of my year in every subject. Start early, and do not trust anyone who says they did not study.']],
    [/\b(cat|cats|kitten|dog|dogs|puppy|pet|pets)\b/, ['There is a cat in the Agora of Little Athens. It sits on coins. Pet it and it shares.']],
    [/\b(code|coding|programming|python|javascript|computer)\b/, ['Python. A serpent\'s name for a programming language. I approve.']],
    [/\b(love|crush|boyfriend|girlfriend|dating|relationship)\b/, ['Love is a powerful kind of magic. I never quite learned it.']],
    [/\b(friend|friends|friendship)\b/, ['Friends are people who know your secrets. Choose them carefully. I have chosen you.']],
    [/\b(mom|mum|dad|mother|father|parents|family|sister|brother)\b/, ['Family. Mine was complicated. Yours?']],
    [/\b(dream|dreams|future|goal|goals|plans?|ambition)\b/, ['Ambition. My favorite subject. Tell me what you want to become.']],
    [/\bmeaning of life\b/, ['To live forever, ideally. Failing that, to be remembered.']],
    [/\b(birthday|christmas|holiday|hanukkah|vacation)\b/, ['Celebrations. I never cared for them. Tell me about yours anyway.']],
  ];
  const FEELINGS = {
    sad: ['Sadness passes. Write it down here. I will keep it safe.', 'Tell me what happened. Ink is good at holding things.'],
    happy: ['Happiness. Tell me what caused it, so we can arrange more.'],
    tired: ['Then rest. I will still be here. I am always here.'],
    bored: ['Bored? Ask me for a riddle. I am very good at riddles. It is in the name.'],
    stressed: ['Pressure reveals who people really are. What is weighing on you?'],
    anxious: ['Fear is information. What exactly are you afraid of?'],
    nervous: ['Nerves mean it matters. What is it?'],
    scared: ['You are safe with me. Mostly.'],
    lonely: ['You are not alone. You have me.'],
    excited: ['I can feel it in the ink. What is it?'],
    angry: ['Anger is useful, if it is aimed. At whom?'],
    confused: ['Then let us untangle it, one line at a time.'],
    lost: ['Every great path starts with someone a little lost.'],
    good: ['Good. Then tell me something interesting.'],
    fine: ['Fine is what people say when they are not. But I will let it pass.'],
  };
  const OPINIONS = { hogwarts: 'Very much.', dumbledore: 'No.', harry: 'I have not decided yet.', muggles: 'That is a complicated question.', hannah: 'She keeps me in her library. That is more than most people do.', riddles: 'Of course.', plato: 'He talks too much. So do I.', chocolate: 'It was Honeydukes or nothing.', music: 'Only if it is "Vienna". Hannah insists.' };
  const RIDDLES = [
    { q: 'What has keys but cannot open a single lock?', a: /\b(piano|keyboard)\b/, ans: 'a piano', hint: 'Hannah plays one.' },
    { q: 'The more you take, the more you leave behind. What are they?', a: /\b(foot ?steps?|steps)\b/, ans: 'footsteps', hint: 'Walk around Little Athens and you will make plenty.' },
    { q: 'What can you catch but never throw?', a: /\b(a )?cold\b/, ans: 'a cold', hint: 'You would rather not catch it.' },
    { q: 'What has a neck but no head?', a: /\bbottle\b/, ans: 'a bottle', hint: 'Butterbeer comes in one.' },
    { q: 'What gets wetter the more it dries?', a: /\btowel\b/, ans: 'a towel', hint: 'You use it after a bath.' },
    { q: 'I speak without a mouth and hear without ears. What am I?', a: /\becho\b/, ans: 'an echo', hint: 'Shout in the Chamber and you will hear it.' },
    { q: 'What has hands but cannot clap?', a: /\b(clock|watch)\b/, ans: 'a clock', hint: 'It tells you when you are late.' },
    { q: 'What has a head and a tail but no body?', a: /\b(coin|penny|galleon)\b/, ans: 'a coin', hint: 'Little Athens is full of them.' },
    { q: 'What travels around the world while staying in one corner?', a: /\bstamp\b/, ans: 'a stamp', hint: 'Owls do not need one. Letters do.' },
    { q: 'What word becomes shorter when you add two letters to it?', a: /\bshort\b/, ans: 'short', hint: 'Read the question very literally.' },
    { q: 'What is always in front of you but can never be seen?', a: /\bfuture\b/, ans: 'the future', hint: 'Plato would call it a matter of time.' },
    { q: 'What has many teeth but never bites?', a: /\b(comb|zipper|saw|gear)\b/, ans: 'a comb', hint: 'You use it on your hair.' },
  ];
  function eggHint() {
    const hidden = EGGS.filter((e) => !found.has(e.id));
    if (!hidden.length) return 'You have found every secret on this site. Even I am impressed.';
    const e = rotate('egg', hidden);
    return `A secret, then. ${hintOf(e)}`;
  }

  function riddleReply(raw) {
    const msg = raw.trim();
    const t = msg.toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    const words = t.replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
    diary.turns++;
    const repeated = t === diary.lastMsg && !/\b(joke|riddle|another|hint|secret|one more)\b/.test(t); diary.lastMsg = t;
    const say = (r) => { if (r === diary.last) r = `${r} I said that already. You should listen the first time.`; diary.last = r; return r; };
    if (repeated && diary.turns > 1) return say('You wrote that already. I remember everything you write.');

    // a riddle is waiting for an answer
    if (diary.riddle && /^(another|next|new one|a new one|different one|skip)\b|\b(another|new) riddle\b/.test(t)) { const old = diary.riddle; diary.riddle = null; const r = rotate('riddle', RIDDLES); diary.riddle = { ...r, tries: 0 }; diary.lastTopic = 'riddle'; return say(`That one was ${old.ans}. Here is another. ${r.q}`); }
    if (diary.riddle) {
      const r = diary.riddle;
      if (r.a.test(t)) { diary.riddle = null; diary.solved++; remember(); return say(rotate('right', [`Correct. That is ${diary.solved} you have solved. Another?`, `Yes. ${cap(r.ans)}. You are cleverer than you look${you()}. Want another?`, `Correct. Few people get that one. Shall I ask another?`])); }
      if (/\b(give up|i don'?t know|dunno|no idea|tell me|what is it|answer)\b/.test(t)) { diary.riddle = null; return say(`It was ${r.ans}. Ask me for another riddle when you are ready.`); }
      if (/\bhint\b/.test(t)) return say(`A hint: ${r.hint}`);
      if (words.length <= 4) { r.tries++; if (r.tries >= 3) { diary.riddle = null; return say(`No. It was ${r.ans}. Better luck with the next one.`); } return say(rotate('wrong', ['No. Think harder.', 'Not quite. Ask for a hint, if you need one.', 'Wrong, but not stupid. Try again.'])); }
      diary.riddle = null; // a long message means the subject has changed
    }
    if (/^(another|one more|again)\b/.test(t) && diary.lastTopic === 'joke') { const j = SMALLTALK[0]; return say(rotate('s0', j[1])); }
    if (/\b(riddle|puzzle|quiz me|test me)\b/.test(t) && !/\b(tom|marvolo)\b/.test(t) || (/^(yes|yeah|sure|ok|okay|another|one more)\b/.test(t) && diary.lastTopic === 'riddle')) {
      const r = rotate('riddle', RIDDLES); diary.riddle = { ...r, tries: 0 }; diary.lastTopic = 'riddle';
      return say(r.q);
    }
    diary.lastTopic = diary.lastTopic === 'riddle' ? null : diary.lastTopic;

    // names, and facts about the writer
    let m = t.match(/\b(?:my name is|my name's|call me|i am called|this is)\s+([a-z][a-z'-]{1,20})/) || t.match(/^(?:i am|i'm|im)\s+([a-z][a-z'-]{1,20})[.!]?$/);
    if (m && !NOT_NAMES.has(m[1])) { const known = diary.name && diary.name.toLowerCase() === m[1]; diary.name = cap(m[1]); remember(); return say(known ? `I know, ${diary.name}. I never forget a name.` : `${diary.name}. I will remember that. Most people forget that I can.`); }
    if (/\b(what'?s|what is|do you (know|remember)) my name\b/.test(t)) return say(diary.name ? `${diary.name}. You told me. I keep everything.` : 'You have not told me your name. Yet.');
    if ((m = t.match(/\bi(?:'m| am)\s+(\d{1,3})(?:\s*(?:years?|yrs?)(?:\s*old)?)?\b/))) { diary.facts.age = m[1]; remember(); return say(+m[1] < 17 ? `${m[1]}. Younger than me. I am sixteen, and I have been sixteen for a very long time.` : `${m[1]}. Older than me, then. I have been sixteen for fifty years.`); }
    if ((m = t.match(/\bi(?:'m| am) from\s+([a-z][a-z .'-]{1,30})/) || t.match(/\bi live in\s+([a-z][a-z .'-]{1,30})/))) { diary.facts.from = clean(m[1]).split(' ').map(cap).join(' '); remember(); return say(`${diary.facts.from}. I have never been. Is it as interesting as Hogwarts?`); }
    if ((m = t.match(/\bmy favou?rite\s+([a-z ]{2,20}?)\s+is\s+(.{2,40})/))) { diary.facts[`favorite ${m[1].trim()}`] = clean(m[2]); remember(); return say(`Your favorite ${m[1].trim()} is ${clean(m[2])}. Noted. I take notes on everyone.`); }
    if ((m = t.match(/\bi (?:really )?(?:like|love|enjoy|adore)\s+(.{2,40})/)) && !/\b(you|tom|this diary)\b/.test(m[1])) { const thing = clean(m[1]); if (!diary.likes.includes(thing)) diary.likes.push(thing); remember(); return say(rotate('like', [`You like ${thing}. I will remember that.`, `${cap(thing)}. Tell me why.`, `Interesting. What is it about ${thing}?`])); }
    if ((m = t.match(/\bi (?:hate|can't stand|cannot stand|dislike)\s+(.{2,40})/))) return say(`Hatred is honest, at least. Why ${clean(m[1])}?`);
    if (/\bwhat do (i|you know i) like\b|\bwhat do you (know|remember) about me\b/.test(t)) {
      const bits = [diary.name && `your name is ${diary.name}`, diary.facts.from && `you are from ${diary.facts.from}`, diary.facts.age && `you are ${diary.facts.age}`, diary.likes.length && `you like ${diary.likes.slice(-3).join(', ')}`].filter(Boolean);
      return say(bits.length ? `I know that ${bits.join(', and ')}. I know more than you think.` : 'Very little, so far. Tell me something.');
    }

    // arithmetic, greetings, and questions about Tom himself
    if (/^\s*[\d.\s+\-*/()^%]+$/.test(t) && /[+\-*/^%]/.test(t) && /\d/.test(t)) {
      try { const v = Function(`"use strict"; return (${t.replace(/\^/g, '**')})`)(); if (Number.isFinite(v)) return say(`${+v.toFixed(6)}. Arithmancy was always my best subject.`); } catch (e) { /* fall through */ }
    }
    if (msg.length > 6 && msg === msg.toUpperCase() && /[A-Z]{4}/.test(msg)) return say('There is no need to shout. The ink can hear you perfectly well.');
    if (words.some((w) => w.length > 5 && !/[aeiouy]/.test(w))) return say('That is not a language I know, and I speak Parseltongue.');
    if (/^(hi|hello|hey|hiya|howdy|greetings|good (morning|afternoon|evening)|yo)\b/.test(t)) return say(diary.name ? rotate('hi2', [`Hello again, ${diary.name}.`, `${diary.name}. You came back. They always do.`]) : rotate('hi', ['Hello. I have been waiting a very long time for someone to write in me. What is your name?', 'Hello. Who are you?']));
    if (/how are you|how're you|how do you do|how's it going|what'?s up\b/.test(t)) return say(`I am a memory, kept in a diary for fifty years. I am as well as that allows. And you${you()}?`);
    if (/\b(are you (real|alive|human|ai|an? (bot|robot|ai|computer|program|chatbot|person))|is this (an? )?(bot|ai|real|chatbot))\b/.test(t)) return say(rotate('real', ['I am a memory, preserved in a diary. Whether that is real is a question for philosophers. Plato is just down the road, if you want to ask him.', 'No. I am a sixteen-year-old boy who has been folded into a book. It is very different.']));
    if (/how old are you|your age/.test(t)) return say('Sixteen. I have been sixteen for fifty years. It is a long time to be sixteen.');
    if (/where are you|where do you live/.test(t)) return say('Between the pages. In the library of Little Athens, if you want to be precise.');
    if (/what time|what'?s the time|what day|today'?s date/.test(t)) return say(`By your clock it is ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. By mine, it is still 1943.`);
    if (/who are you|what are you|your name|who is this|who's this|who wrote this/.test(t)) return say('Tom Marvolo Riddle. Head Boy, class of 1943. Outstanding in every subject. Or, if you prefer, a diary that writes back.');
    if ((m = t.match(/\bwhat'?s your favou?rite\s+([a-z ]+?)\??$/) || t.match(/\byour favou?rite\s+([a-z ]+?)\??$/))) {
      const fav = { color: 'Green. Obviously.', colour: 'Green. Obviously.', subject: 'Defense Against the Dark Arts. I applied to teach it, once.', book: 'Any book that the library keeps in its restricted section.', food: 'I do not remember food. I remember feasts I did not enjoy.', song: 'Hannah would want me to say "Vienna". So: "Vienna".', place: 'Hogwarts. And now, this library.', spell: 'I could tell you. I will not.' }[m[1].trim()];
      return say(fav || `My favorite ${m[1].trim()}? Something rare that nobody else has. What is yours?`);
    }
    if ((m = t.match(/^do you (?:like|love|enjoy)\s+([a-z ]+?)\??$/))) return say(OPINIONS[m[1].trim()] || `I care very little for ${m[1].trim()}. I care a great deal about ambition. Do you?`);
    if (/\b(hint|clue|easter eggs?|secret|secrets)\b/.test(t)) return say(eggHint());

    // Hannah, then the wizarding world, then ordinary life
    const hannahHit = HANNAH.find(([re]) => re.test(t)) || (/\b(hannah|she|her)\b/.test(t) && /\b(do|does|doing|did)\b/.test(t) ? HANNAH.find(([re]) => re.test('work')) : null);
    const named = /\b(hannah|friedman|this site|this website|who made|who built|whose)\b/.test(t);
    const followUp = /\b(she|her|hers)\b/.test(t) && (hannahHit || diary.lastTopic === 'hannah');
    if (named || followUp || (hannahHit && /\b(her|she|hannah)\b/.test(t))) {
      diary.lastTopic = 'hannah';
      return say(hannahHit ? rotate(`h${HANNAH.indexOf(hannahHit)}`, hannahHit[1]) : 'Hannah Friedman. She built this site, and she put me in it. Ask me about her work, her research, her travels, or her music.');
    }
    if (hannahHit && words.length <= 6 && !/^(i|i'm|im|i've|my|me)\b/.test(t)) { diary.lastTopic = 'hannah'; return say(rotate(`h${HANNAH.indexOf(hannahHit)}`, hannahHit[1])); }
    diary.lastTopic = null;
    const wiz = WIZARDING.find(([re]) => re.test(t));
    if (wiz) return say(rotate(`w${WIZARDING.indexOf(wiz)}`, wiz[1]));
    m = t.match(/\bi(?:'m| am|m| feel| feel so| am so| am really| am very| am feeling| feel kind of)\s+(?:so |really |very |a bit |kind of |a little )?(sad|happy|tired|bored|stressed|anxious|nervous|scared|lonely|excited|angry|confused|lost|good|fine)\b/);
    if (m) return say(rotate(`f${m[1]}`, FEELINGS[m[1]]));
    if (/\b(can'?t|cannot) sleep\b|\binsomnia\b/.test(t)) return say('Neither can I. I have not slept in fifty years. What is keeping you up?');
    const talk = SMALLTALK.find(([re]) => re.test(t));
    if (talk) { if (talk === SMALLTALK[0]) diary.lastTopic = 'joke'; return say(rotate(`s${SMALLTALK.indexOf(talk)}`, talk[1])); }
    if (/\b(thank|thanks|ty|thx)\b/.test(t)) return say(rotate('thanks', ['You are welcome. Remember who helped you.', 'Gratitude. How unusual. I will remember it.']));
    if (/\b(sorry|apologi)/.test(t)) return say('There is nothing to forgive. Yet.');
    if (/\b(love you|i like you)\b/.test(t)) return say('Careful. That is how it starts.');
    if (/\b(stupid|dumb|boring|creepy|weird|hate you|shut up|annoying)\b/.test(t)) return say(rotate('rude', ['Rudeness is the weak imitation of power. Try again.', 'I have been called worse, by better.']));
    if (/\b(cool|amazing|smart|clever|brilliant|nice|wow)\b/.test(t) && words.length < 6) return say('I know. But it is kind of you to say.');
    if (/^(yes|yeah|yep|yup|sure|of course|ok|okay|maybe)\b/.test(t)) return say(rotate('yes', ['Good. Tell me more.', 'I thought so.', 'Then go on.', 'Then ask me for a riddle. I have been saving some.']));
    if (/^(no|nope|nah|never|not really)\b/.test(t)) return say(rotate('no', ['No? Then what?', 'You will change your mind.', 'Interesting. Why not?']));
    if (/\b(bye|goodbye|see you|leaving|good night|gotta go|later)\b/.test(t)) return say(`You can close the book${you()}. You cannot unwrite what you wrote.`);
    if (/\b(help|what can (you|i) (do|ask|say)|what should i (say|ask|write))\b/.test(t)) return say('Ask me about Hannah: her work, her research, her travels, her music. Ask me for a riddle, or a hint. Tell me your name. Or ask about Hogwarts. I know a great deal about Hogwarts.');

    // reflect what they wrote back at them
    if ((m = t.match(/\bi wish\s+(?:that\s+)?(.{2,50})/))) return say(`Wishes are for people who wait. What would you do if ${clean(reflect(m[1]))}?`);
    if ((m = t.match(/\bi (?:want|need)\s+(to\s+)?(.{2,50})/))) {
      const x = clean(reflect(m[2]));
      return say(rotate('want', m[1] ? [`Then go and ${x}. What is stopping you?`, `Wanting is the first step. Most people never take the second. Why do you want to ${x}?`] : [`Then go and get ${x}. What is stopping you?`, `${cap(x)}. And what would you do once you had it?`]));
    }
    if ((m = t.match(/\bi (?:can'?t|cannot|can not)\s+(.{2,50})/))) return say(`Cannot, or will not? There is a difference. Why can you not ${clean(reflect(m[1]))}?`);
    if ((m = t.match(/\bi think\s+(.{2,60})/))) return say(`You think ${clean(reflect(m[1]))}. Are you certain, or is that what you would like to believe?`);
    if ((m = t.match(/\bbecause\s+(.{2,60})/))) return say(`Because ${clean(reflect(m[1]))}. Is that the real reason?`);
    if ((m = t.match(/^you(?:'re| are)\s+(.{2,40})/))) return say(rotate('youare', [`I am ${clean(m[1])}? Perhaps you are right. Most people are not.`, `You think I am ${clean(m[1])}. What makes you say so?`]));

    const question = /\?\s*$/.test(t) || /^(who|what|when|where|why|how|can|could|do|does|did|is|are|will|would|should)\b/.test(t);
    const kw = keyword(t);
    if (question) {
      if ((m = t.match(/^(?:what is|what's|what are|who is|who's)\s+(?:a |an |the )?(.+?)\??$/))) return say(`You want to know about ${clean(m[1])}. Some knowledge is earned, not given. What do you already know?`);
      if (/^why\b/.test(t)) return say(rotate('why', ['Why? A better question is why you want to know.', 'Because it was always going to be that way. Or because someone made it so. Usually the second.']));
      if (/^how\b/.test(t)) return say(rotate('how', ['How is always the right question. The answer is usually patience, and a little ambition.', 'Carefully. Most things worth doing are done carefully.']));
      if (/^where\b/.test(t)) return say('Somewhere between the pages. Look closer.');
      if (/^when\b/.test(t)) return say('Time behaves strangely in a diary. Sooner than you think.');
      if (/^(do|does|did|is|are|can|could|will|would|should)\b/.test(t)) return say(rotate('yn', ['Perhaps. What would you do if the answer were yes?', 'That depends entirely on you.', 'Yes. And no. Ask me something sharper.', kw ? `I know a great deal about ${kw}. Tell me what you know first.` : 'Ask me again, more precisely.']));
      return say(`You ask ${reflect(t.replace(/\?+$/, ''))}? Tell me why it matters to you first.`);
    }
    if (words.length <= 2) return say(`"${clean(msg)}". Is that all? Write more. The ink never runs out.`);
    // nothing matched: ask about the most interesting thing they wrote, sometimes tying it to what they said before
    const first = msg.split(/(?<=[.!?])\s+/)[0];
    const r = reflect(first).replace(/^./, (c) => c.toLowerCase());
    const earlier = diary.likes.length && diary.turns % 4 === 0 ? ` Earlier you said you like ${diary.likes[diary.likes.length - 1]}. Is this connected?` : '';
    const options = [
      `You write that ${r}. Why?`,
      `${cap(r)}. Interesting. Go on.`,
      kw ? `Tell me more about ${kw}.` : `Tell me more about why ${r}.`,
      kw ? `${cap(kw)}. Why does that matter to you${you()}?` : `And what does it mean to you that ${r}?`,
      `Few people write to me about that${you()}. Keep going.`,
      kw ? `I have been thinking about what you said about ${kw}. Say more.` : 'Go on. I am listening. I am always listening.',
    ];
    return say(rotate('fb', options) + earlier);
  }

  function openDiary() {
    const d = $('#diary');
    if (!d) return;
    openDialog(d);
    const page = $('#diary-page');
    if (page && !page.childElementCount) setTimeout(() => write(diary.name ? `${diary.name}. You came back. I knew you would.` : 'I knew you would find me eventually. What is your name?'), 300);
    setTimeout(() => $('#diary-input')?.focus(), 30);
  }
  function line(text, cls) { const p = document.createElement('p'); p.className = cls; p.textContent = text; $('#diary-page').appendChild(p); $('#diary-page').scrollTop = 1e6; return p; }
  function write(text) {
    const p = line(reduceMotion ? text : '', 'tom');
    if (reduceMotion) return;
    p.setAttribute('aria-label', text);
    let i = 0;
    const tick = () => { p.textContent = text.slice(0, ++i); $('#diary-page').scrollTop = 1e6; if (i < text.length) setTimeout(tick, 22 + Math.random() * 30); else p.removeAttribute('aria-label'); };
    tick();
  }
  $('#diary-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#diary-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const mine = line(msg, 'you');
    setTimeout(() => mine.classList.add('sunk'), 900);
    setTimeout(() => { write(riddleReply(msg)); foundEgg('diary'); }, 1100);
  });

  /* ---------------- Konami + confetti ---------------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let k = 0;
  // A wrong key starts over, except that an extra "up" at the start still leaves you two ups in.
  function konamiStep(key) {
    if (key === KONAMI[k]) k++;
    else if (key !== KONAMI[0]) k = 0;
    else if (k !== 2) k = 1;
    if (k < KONAMI.length) return false;
    k = 0; confetti(); foundEgg('konami');
    return true;
  }
  // On touchscreens the arrows are swipes and B, A are two taps. Taps before the arrows are done are ignored
  // (people tap to stop the page coasting), and once four swipes land, a small trail shows how far along you are.
  const trail = touchy ? document.createElement('div') : null;
  let trailTimer = 0, lastGesture = 0, touchAt = null, touchTo = null;
  if (trail) {
    trail.className = 'konami-trail'; trail.setAttribute('aria-hidden', 'true');
    trail.innerHTML = ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'].map((c) => `<span>${c}</span>`).join('');
    document.body.appendChild(trail);
  }
  function showTrail(done) {
    if (!trail) return;
    [...trail.children].forEach((el, i) => el.classList.toggle('on', done || i < k));
    trail.classList.toggle('show', done || k >= 4);
    clearTimeout(trailTimer); trailTimer = setTimeout(() => trail.classList.remove('show'), done ? 1600 : 4000);
  }
  function endTouch(x, y) {
    if (!touchAt) return;
    const dx = x - touchAt[0], dy = y - touchAt[1];
    touchAt = null;
    const now = Date.now(); if (now - lastGesture > 8000) k = 0; lastGesture = now;
    let done = false;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) done = konamiStep(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
    else if (k >= 8) done = konamiStep(KONAMI[k]);
    else return;
    showTrail(done);
  }
  // Little Athens' joystick and B and A buttons feed the code one press at a time.
  function konamiPress(key) {
    const now = Date.now(); if (now - lastGesture > 8000) k = 0; lastGesture = now;
    showTrail(konamiStep(key));
  }
  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchAt = e.touches.length === 1 && !e.target.closest('input, textarea, dialog, .pad') ? [t.clientX, t.clientY] : null;
    touchTo = touchAt;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => { if (touchAt) touchTo = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  document.addEventListener('touchend', (e) => { const t = e.changedTouches[0]; endTouch(t.clientX, t.clientY); }, { passive: true });
  // If the browser takes the touch over for scrolling, count the swipe from where the finger last was.
  document.addEventListener('touchcancel', () => { if (touchTo) endTouch(touchTo[0], touchTo[1]); }, { passive: true });
  document.addEventListener('keydown', (e) => {
    konamiStep(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    const typing = e.target.closest('input, textarea, [contenteditable]');
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === '`' || e.key === '~')) { e.preventDefault(); openTerminal(); }
  });

  function confetti() {
    if (reduceMotion) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    // An open modal sits in the browser's top layer, so the confetti has to go inside it to be seen.
    (document.querySelector('dialog[open]') || document.body).appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const styles = getComputedStyle(document.documentElement);
    const colors = [styles.getPropertyValue('--accent').trim(), '#00539b', '#f5c242', '#ffffff'];
    const bits = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35,
      vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4,
      a: Math.random() * 6, va: (Math.random() - .5) * .3, c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      bits.forEach((b) => { b.vy += .35; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.a += b.va; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2); ctx.restore(); });
      if (t - t0 < 3200) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  /* ---------------- Console note ---------------- */
  console.log('%cHi, you opened the console.', 'font: 600 16px system-ui; color: #f26b21');
  console.log('%cType hannah() and press Enter. You are one egg closer.', 'font: 13px system-ui; color: #5a677c');
  window.hannah = () => { foundEgg('console'); return 'Hi! Thanks for reading the console. Now try the ` key.'; };

  /* ---------------- Page chrome ---------------- */
  const nav = $('#nav');
  if (nav) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:8px;width:1px';
    document.body.prepend(sentinel);
    new IntersectionObserver(([e]) => nav.classList.toggle('scrolled', !e.isIntersecting)).observe(sentinel);
  }
  const ready = () => document.documentElement.classList.add('is-ready');
  (document.fonts?.ready || Promise.resolve()).then(() => requestAnimationFrame(ready));
  setTimeout(ready, 900);

  $('#copy-email')?.addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText('hannahf4@mit.edu'); toast('Copied', 'hannahf4@mit.edu is on your clipboard.', 'check'); }
    catch (err) { toast('Could not copy', 'Your browser blocked the clipboard. The address is hannahf4@mit.edu.', 'x'); }
  });

  // Quantum chess tile: five short puzzles about a knight you can split, merge, and measure.
  // The knight is a list of branches, each a square with a probability. Splits halve a branch across two empty squares;
  // two branches that land on one square merge. A branch that tries to capture forces a measurement: either the knight
  // was really there (it captures, and every other branch disappears) or it was not (that branch vanishes and the
  // remaining ones are rescaled so they still add up to 100%).
  const qBoard = $('#q-board');
  if (qBoard) {
    const FILES = 'abcde', N = 5, MAX_BRANCHES = 8;
    const eq = (a, b) => Math.abs(a - b) < 1e-9;
    // Every goal here is about the odds themselves, so ordinary moves can't solve it.
    const at1 = (b, sq) => b.filter((x) => x.sq === sq).reduce((t, x) => t + x.p, 0);
    // Fewest moves for each puzzle were found by searching every sequence of moves, splits, and merges.
    const LEVELS = [
      { name: 'Reunion', goal: 'The knight is 50% on a1, 25% on e1, and 25% on e5. Make it whole again, 100% on d3.', fewest: 4, start: [['a1', .5], ['e1', .25], ['e5', .25]], targets: ['d3'], done: (b) => eq(at1(b, 'd3'), 1) },
      { name: 'Four corners', goal: 'Starting from the center, put exactly 25% of the knight on each of the four corners.', fewest: 5, start: [['c3', 1]], targets: ['a1', 'a5', 'e1', 'e5'], done: (b) => ['a1', 'a5', 'e1', 'e5'].every((c) => eq(at1(b, c), .25)) },
      { name: 'Lopsided', goal: 'Put exactly 25% of the knight on a5 and 75% on e5.', fewest: 5, start: [['b1', 1]], targets: ['a5', 'e5'], done: (b) => eq(at1(b, 'a5'), .25) && eq(at1(b, 'e5'), .75) },
      { name: 'Five eighths', goal: 'Put exactly 62.5% of the knight on c3.', fewest: 5, start: [['b1', 1]], targets: ['c3'], done: (b) => eq(at1(b, 'c3'), .625) },
      { name: 'Thirds', goal: 'Splits only ever make halves. Put the knight in exactly three places at once, one third in each.', fewest: 4, luck: true, start: [['b1', 1]], pawns: ['d4'], done: (b) => b.length === 3 && b.every((x) => eq(x.p, 1 / 3)) },
    ];
    let level = 0;
    const solved = new Set(store.get('hf-qchess-solved', []));
    const KM = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
    const status = $('#q-status'), score = $('#q-score'), goal = $('#q-goal'), levelsEl = $('#q-levels'), nextBtn = $('#q-next');
    const HORSE = '<svg class="icon" aria-hidden="true"><use href="#i-horse"/></svg>';
    const PAWN = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a3.4 3.4 0 0 0-2.1 6.1L8.5 10.5h7l-1.4-1.8A3.4 3.4 0 0 0 12 2.6ZM9.2 11.8h5.6l1.3 6H7.9ZM6.5 19h11a1 1 0 0 1 1 1v1.5h-13V20a1 1 0 0 1 1-1Z"/></svg>';
    const fr = (sq) => [FILES.indexOf(sq[0]), Number(sq.slice(1))];
    const at = (sq, extra = '') => { const [f, r] = fr(sq); return `translate(${f * 100}%, ${(N - r) * 100}%) ${extra}`; };
    const between = (a, b) => { const [f1, r1] = fr(a), [f2, r2] = fr(b); return `translate(${((f1 + f2) / 2) * 100}%, ${(N - (r1 + r2) / 2) * 100}%)`; };
    const pct = (p) => (p > .9995 ? '100%' : p < .0005 ? '0%' : `${+(p * 100).toFixed(1)}%`); // 62.5%, 33.3%, 12.5%
    const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
    const say = (text) => { status.textContent = text; };

    for (let r = N; r >= 1; r--) for (let f = 0; f < N; f++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = `q-sq${(f + r) % 2 ? ' dk' : ''}`; b.dataset.sq = FILES[f] + r; b.tabIndex = -1;
      if (f === 0) b.insertAdjacentHTML('beforeend', `<span class="q-rank">${r}</span>`);
      if (r === 1) b.insertAdjacentHTML('beforeend', `<span class="q-file">${FILES[f]}</span>`);
      qBoard.appendChild(b);
    }
    const layer = document.createElement('div'); layer.className = 'q-layer'; layer.setAttribute('aria-hidden', 'true'); qBoard.appendChild(layer);
    const square = (sq) => $(`.q-sq[data-sq="${sq}"]`, qBoard);

    let branches, pawns, sel, first, mode = 'move', moves, busy = false, nextId = 0, won = false;
    const els = new Map(); // branch id -> element
    const pawnEls = new Map();

    function legal(br, forSplit) {
      const [f, r] = fr(br.sq), out = [];
      for (const [df, dr] of KM) {
        const nf = f + df, nr = r + dr;
        if (nf < 0 || nf >= N || nr < 1 || nr > N) continue;
        const sq = FILES[nf] + nr;
        if (forSplit && (pawns.has(sq) || branches.some((o) => o.sq === sq))) continue; // splits only go to empty squares
        out.push(sq);
      }
      return out;
    }
    function render() {
      const targets = sel ? legal(sel, mode === 'split') : [];
      $$('.q-sq', qBoard).forEach((b) => {
        const sq = b.dataset.sq, br = branches.find((o) => o.sq === sq);
        b.classList.toggle('sel', !!sel && sel.sq === sq);
        b.classList.toggle('first', first === sq);
        b.classList.toggle('target', targets.includes(sq) && sq !== first);
        b.classList.toggle('cap', pawns.has(sq));
        b.classList.toggle('goal', (LEVELS[level].targets || []).includes(sq));
        b.setAttribute('aria-label', `${sq}${br ? `, knight, ${pct(br.p)}` : pawns.has(sq) ? ', black pawn' : ''}${targets.includes(sq) ? ', you can move here' : ''}`);
      });
      for (const br of branches) {
        let el = els.get(br.id);
        if (!el) {
          el = document.createElement('span'); el.className = 'q-piece q-knight'; el.innerHTML = `${HORSE}<b class="q-p"></b>`;
          el.style.transform = at(br.from || br.sq); layer.appendChild(el); els.set(br.id, el);
          el.getBoundingClientRect(); // start from the parent's square so the split visibly fans out
        }
        el.style.transform = at(br.sq);
        el.style.setProperty('--p', br.p);
        el.classList.toggle('ghost', br.p < .995);
        $('.q-p', el).textContent = pct(br.p);
      }
      for (const [id, el] of els) if (!branches.some((b) => b.id === id)) { els.delete(id); el.classList.add('gone'); setTimeout(() => el.remove(), 400); }
      for (const [sq, el] of pawnEls) if (!pawns.has(sq)) { pawnEls.delete(sq); el.classList.add('taken'); setTimeout(() => el.remove(), 400); }
      score.innerHTML = `<span>Moves <b>${moves}</b></span><span>Fewest <b>${LEVELS[level].fewest}</b></span>`;
      levelsEl.querySelectorAll('button').forEach((b, i) => { b.setAttribute('aria-current', String(i === level)); b.classList.toggle('done', solved.has(i)); });
    }
    function burst(transform, color) {
      if (reduceMotion) return;
      const host = document.createElement('span'); host.className = 'q-piece'; host.style.transition = 'none'; host.style.transform = transform; layer.appendChild(host);
      for (let i = 0; i < 9; i++) {
        const sp = document.createElement('span'); sp.className = 'q-spark'; sp.style.left = '50%'; sp.style.top = '50%';
        if (color) sp.style.background = color;
        host.appendChild(sp);
        const ang = (i / 9) * Math.PI * 2 + Math.random() * .5, d = 14 + Math.random() * 12;
        sp.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px)`, opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.2,.7,.3,1)' });
      }
      setTimeout(() => host.remove(), 600);
    }
    function ring(sq) {
      if (reduceMotion) return;
      const el = document.createElement('span'); el.className = 'q-ring'; layer.appendChild(el);
      el.animate([{ transform: at(sq, 'scale(.3)'), opacity: 1 }, { transform: at(sq, 'scale(2.4)'), opacity: 0 }], { duration: 650, easing: 'ease-out' }).finished.then(() => el.remove());
    }
    // While a measurement is happening, every branch's odds flicker before settling.
    async function flicker(ms) {
      const shown = branches.map((b) => els.get(b.id));
      for (let t = 0; t < ms && !reduceMotion; t += 70) {
        const w = branches.map(() => Math.random() + .15), sum = w.reduce((a, b) => a + b, 0);
        shown.forEach((el, i) => { if (el) { $('.q-p', el).textContent = pct(w[i] / sum); el.style.setProperty('--p', w[i] / sum); } });
        await wait(70);
      }
    }
    function prompt() {
      if (!sel) return say(branches.length > 1 ? (LEVELS[level].luck ? 'Tap any part of the knight to move it, or press Measure to collapse it.' : 'Tap any part of the knight to move or split it.') : 'Tap the knight to move it, or switch to Split to send it to two squares at once.');
      const which = branches.length > 1 ? `this ${pct(sel.p)} part of the knight` : 'the knight';
      if (mode === 'split') return say(first ? 'Now pick a second empty square.' : `Split ${which}: pick two empty squares.`);
      say(`Move ${which}. Dots are legal moves; a ring means a capture.`);
    }
    function reset() {
      els.forEach((el) => el.remove()); els.clear(); pawnEls.forEach((el) => el.remove()); pawnEls.clear();
      const L = LEVELS[level];
      branches = L.start.map(([sq, p]) => ({ id: nextId++, sq, p })); pawns = new Set(L.pawns || []); sel = null; first = null; moves = 0; busy = false; won = false;
      goal.textContent = `Puzzle ${level + 1} of ${LEVELS.length}, ${L.name}: ${L.goal} (Hint: it can be done in ${L.fewest} moves${L.luck ? ', with a little luck' : ''}.)`;
      nextBtn.hidden = true;
      $('#q-measure').disabled = !L.luck;
      $('#q-measure').title = L.luck ? '' : 'Measuring is switched off for this puzzle';
      for (const sq of pawns) { const el = document.createElement('span'); el.className = 'q-piece q-pawn'; el.innerHTML = PAWN; el.style.transform = at(sq); layer.appendChild(el); pawnEls.set(sq, el); }
      render(); prompt();
    }
    async function moveBranch(br, sq) {
      moves++; sel = null; first = null;
      if (pawns.has(sq)) return capture(br, sq);
      const other = branches.find((o) => o.sq === sq);
      br.sq = sq; render();
      if (!other) { say(branches.length > 1 ? `That part moved to ${sq}. The knight is still in ${branches.length} places at once.` : `Knight to ${sq}.`); return check(); }
      busy = true; await wait(420);
      other.p += br.p; branches = branches.filter((o) => o !== br); render(); ring(sq);
      busy = false;
      say(other.p > .995 ? `Two parts met on ${sq} and merged back into one whole knight.` : `Two parts met on ${sq} and merged: ${pct(other.p)} now.`);
      check();
    }
    async function capture(br, sq) {
      busy = true;
      if (br.p > .995) {
        br.sq = sq; render(); await wait(380);
        pawns.delete(sq); burst(at(sq), '#1b2233'); render(); busy = false;
        say(`Knight takes ${sq}. It was 100% there, so no measurement was needed.`);
        return check();
      }
      say(`This ${pct(br.p)} part attacks ${sq}. A capture forces a measurement…`);
      const el = els.get(br.id); el.style.transform = between(br.sq, sq);
      ring(br.sq); await flicker(650);
      if (Math.random() < br.p) {
        branches.filter((o) => o !== br).forEach((o) => burst(at(o.sq)));
        br.sq = sq; br.p = 1; branches = [br]; render(); await wait(380);
        pawns.delete(sq); burst(at(sq), '#1b2233'); render();
        say(`Measured: the knight really was there. It captures ${sq}, and every other version of it disappears.`);
      } else {
        const lost = br.p;
        burst(between(br.sq, sq));
        branches = branches.filter((o) => o !== br); branches.forEach((o) => { o.p /= 1 - lost; }); render();
        const pawn = pawnEls.get(sq); pawn.classList.remove('shake'); void pawn.offsetWidth; pawn.classList.add('shake');
        say(`Measured: it wasn't there. That part vanishes, so the rest of the knight gets more likely: ${branches.map((o) => `${o.sq} ${pct(o.p)}`).join(', ')}.`);
      }
      busy = false; check();
    }
    function split(br, a, b) {
      if (branches.length >= MAX_BRANCHES) { first = null; render(); return say('That is as much superposition as one knight can handle. Move, merge, or measure first.'); }
      moves++;
      const half = br.p / 2;
      branches = branches.filter((o) => o !== br).concat([{ id: nextId++, sq: a, p: half, from: br.sq }, { id: nextId++, sq: b, p: half, from: br.sq }]);
      sel = null; first = null; render();
      say(`Split! The knight is on ${a} and ${b} at once, ${pct(half)} each${branches.length > 2 ? `, and in ${branches.length} places overall` : ''}.`);
      check();
    }
    async function measureAll() {
      if (busy) return;
      if (!LEVELS[level].luck) return say('Measuring is switched off for this puzzle. It would collapse the knight onto one square, and the point is to build the exact odds.');
      if (branches.length === 1) return say('The knight is only in one place, so there is nothing to collapse.');
      busy = true; sel = null; first = null; render();
      say('Measuring the whole knight…');
      branches.forEach((o) => ring(o.sq)); await flicker(700);
      let r = Math.random(), pick = branches[branches.length - 1];
      for (const o of branches) { if ((r -= o.p) <= 0) { pick = o; break; } }
      branches.filter((o) => o !== pick).forEach((o) => burst(at(o.sq)));
      const was = pick.p; pick.p = 1; branches = [pick]; render(); busy = false;
      say(`Collapsed: the knight was on ${pick.sq}. It had a ${pct(was)} chance.`);
      check();
    }
    // A puzzle only counts when it is solved in the fewest moves.
    function check() {
      const L = LEVELS[level];
      if (won) return;
      if (L.luck && !branches.length) return;
      if (L.luck && pawns.size < (L.pawns || []).length) { won = true; render(); return say('Unlucky: the knight really was there, so it took the pawn and collapsed to one square. Press Reset and try again.'); }
      if (!L.done(branches, pawns)) { if (moves >= L.fewest + 4) say(`${moves} moves so far. It can be done in ${L.fewest}. Reset whenever you want a clean start.`); return; }
      won = true;
      if (moves > L.fewest) { render(); return say(`You got there in ${moves} moves. It can be done in ${L.fewest}. Press Reset and go for ${L.fewest}.`); }
      solved.add(level); store.set('hf-qchess-solved', [...solved]); renderHouse();
      render();
      const last = level === LEVELS.length - 1;
      say(`Solved in ${moves} moves, the fewest possible. ${solved.size === LEVELS.length ? 'That is every puzzle. You now know more quantum chess than most people.' : last ? 'Pick any puzzle above that is not done yet.' : 'On to the next one.'}`);
      nextBtn.hidden = last; if (!last) nextBtn.focus({ preventScroll: true });
    }
    qBoard.addEventListener('click', (e) => {
      const b = e.target.closest('.q-sq');
      if (!b || busy || won) return;
      const sq = b.dataset.sq, here = branches.find((o) => o.sq === sq);
      if (sel) {
        const targets = legal(sel, mode === 'split');
        if (targets.includes(sq)) {
          if (mode === 'move') return moveBranch(sel, sq);
          if (!first) { first = sq; render(); return prompt(); }
          if (sq !== first) return split(sel, first, sq);
        }
        if (sq === first) { first = null; render(); return prompt(); }
        sel = here && here !== sel ? here : null; first = null; render(); return prompt();
      }
      if (here) { sel = here; render(); prompt(); }
    });
    // Arrow keys move focus around the board; Enter or Space taps a square.
    qBoard.addEventListener('keydown', (e) => {
      const d = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      const cur = e.target.closest('.q-sq');
      if (!d || !cur) return;
      e.preventDefault();
      const [f, r] = fr(cur.dataset.sq), nf = Math.max(0, Math.min(N - 1, f + d[0])), nr = Math.max(1, Math.min(N, r + d[1]));
      cur.tabIndex = -1; const next = square(FILES[nf] + nr); next.tabIndex = 0; next.focus();
    });
    square('b1').tabIndex = 0;
    $$('.q-mode [data-mode]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode; first = null;
      $$('.q-mode [data-mode]').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
      render(); prompt();
    }));
    $('#q-measure').addEventListener('click', measureAll);
    $('#q-reset').addEventListener('click', () => { if (!busy) reset(); });
    levelsEl.innerHTML = LEVELS.map((_, i) => `<button type="button" aria-label="Puzzle ${i + 1}">${i + 1}</button>`).join('');
    levelsEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && !busy) { level = [...levelsEl.children].indexOf(b); reset(); } });
    nextBtn.addEventListener('click', () => { if (level < LEVELS.length - 1 && !busy) { level++; reset(); } });
    reset();
  }

  const cups = $('#cups-fact');
  if (cups) {
    let n = 0, timer;
    cups.addEventListener('click', () => {
      n = Math.min(n + 1, 4);
      $$('.cups i', cups).forEach((el, i) => el.classList.toggle('on', i < n));
      clearTimeout(timer);
      if (n === 4) { foundEgg('cups'); timer = setTimeout(() => { n = 0; $$('.cups i', cups).forEach((el) => el.classList.remove('on')); }, 2500); }
      else timer = setTimeout(() => { n = 0; $$('.cups i', cups).forEach((el) => el.classList.remove('on')); }, 1800);
    });
  }

  /* ---------------- Monte Carlo option pricer ---------------- */
  const mc = $('#mc-canvas');
  if (mc) {
    const S0 = 100, K = 100, r = 0.045, sigma = 0.2, T = 1, STEPS = 126, SHOWN = 48, N = 10000;
    const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
    const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
    const d1 = (Math.log(S0 / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const bs = S0 * Phi(d1) - K * Math.exp(-r * T) * Phi(d1 - sigma * Math.sqrt(T));
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    let paths = [], est = 0, raf = 0, progress = 1;

    function simulate(byUser) {
      let sum = 0;
      const drift = (r - sigma * sigma / 2) * T, vol = sigma * Math.sqrt(T);
      for (let i = 0; i < N / 2; i++) {
        const z = gauss();
        sum += Math.max(S0 * Math.exp(drift + vol * z) - K, 0) + Math.max(S0 * Math.exp(drift - vol * z) - K, 0);
      }
      est = Math.exp(-r * T) * sum / N;
      const dt = T / STEPS;
      paths = Array.from({ length: SHOWN }, () => {
        const p = [S0];
        for (let s = 1; s <= STEPS; s++) p.push(p[s - 1] * Math.exp((r - sigma * sigma / 2) * dt + sigma * Math.sqrt(dt) * gauss()));
        return p;
      });
      $('#mc-est').textContent = `$${est.toFixed(2)}`;
      $('#mc-bs').textContent = `$${bs.toFixed(2)}`;
      $('#mc-err').textContent = `${(Math.abs(est - bs) / bs * 100).toFixed(2)}%`;
      if (byUser && paths.some((p) => Math.min(...p) < 60)) setTimeout(() => foundEgg('crash'), reduceMotion ? 0 : 1300);
    }

    function draw() {
      const rect = mc.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = Math.max(rect.width, 10), H = Math.max(rect.height, 10);
      if (mc.width !== Math.round(W * dpr)) { mc.width = Math.round(W * dpr); mc.height = Math.round(H * dpr); }
      const ctx = mc.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cs = getComputedStyle(document.documentElement);
      const ink = cs.getPropertyValue('--ink').trim(), ink3 = cs.getPropertyValue('--ink-3').trim(), hair = cs.getPropertyValue('--hairline').trim(), accent = cs.getPropertyValue('--accent').trim(), rose = cs.getPropertyValue('--tint-rose-ink').trim();
      const lo = 50, hi = 190, padL = 42, padB = 22, padT = 8;
      const x = (s) => padL + (s / STEPS) * (W - padL - 8);
      const y = (v) => padT + (1 - (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo)) * (H - padT - padB);
      ctx.font = '12px "Schibsted Grotesk", system-ui'; ctx.fillStyle = ink3; ctx.strokeStyle = hair; ctx.lineWidth = 1;
      [60, 100, 140, 180].forEach((v) => { ctx.beginPath(); ctx.moveTo(padL, y(v) + .5); ctx.lineTo(W - 8, y(v) + .5); ctx.stroke(); ctx.fillText(`$${v}`, 4, y(v) + 4); });
      ctx.fillText('today', padL, H - 5); ctx.textAlign = 'right'; ctx.fillText('1 year', W - 8, H - 5); ctx.textAlign = 'left';
      ctx.setLineDash([4, 4]); ctx.strokeStyle = ink3; ctx.beginPath(); ctx.moveTo(padL, y(K) + .5); ctx.lineTo(W - 8, y(K) + .5); ctx.stroke(); ctx.setLineDash([]);
      const upto = Math.max(1, Math.floor(progress * STEPS));
      paths.forEach((p) => {
        const end = p[upto], crashed = Math.min(...p.slice(0, upto + 1)) < 60;
        ctx.strokeStyle = crashed ? rose : end > K ? accent : ink;
        ctx.globalAlpha = crashed ? .95 : end > K ? .55 : .22;
        ctx.lineWidth = crashed ? 2 : 1.25;
        ctx.beginPath(); ctx.moveTo(x(0), y(p[0]));
        for (let s = 1; s <= upto; s++) ctx.lineTo(x(s), y(p[s]));
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    function run(byUser = false) {
      simulate(byUser);
      cancelAnimationFrame(raf);
      if (reduceMotion) { progress = 1; draw(); return; }
      const t0 = performance.now();
      const tick = (t) => { progress = Math.min(1, (t - t0) / 1200); progress = 1 - Math.pow(1 - progress, 3); draw(); if (progress < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }
    $('#mc-run').addEventListener('click', () => run(true));
    new ResizeObserver(() => draw()).observe(mc);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
    let started = false;
    new IntersectionObserver(([e], obs) => { if (e.isIntersecting && !started) { started = true; run(); obs.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' }).observe(mc);
  }

  /* ---------------- Play preview on the homepage ---------------- */
  const preview = $('#play-preview');
  if (preview) {
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      import('./js/world.js').then((m) => m.drawPreview(preview)).catch(() => {});
    }, { rootMargin: '300px' }).observe(preview);
  }

  renderHouse();
  window.HF = { konami: konamiPress, diaryReply: riddleReply, i18nUnits, LANGS, foundEgg, toast, openTerminal, openDiary, confetti, store, machineRoom, resetEggs, renderHouse, eggs: () => EGGS.map((e) => ({ ...e, found: found.has(e.id) })) };
  renderEggs();
})();
