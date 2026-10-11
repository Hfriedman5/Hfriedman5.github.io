// Record player: playlist, transport, and the img2threejs turntable (lazy-loaded).
import { TRACKS, freshPreview } from './tracks.js?v=20261011a';

const $ = (s) => document.querySelector(s);
const player = $('#player');
if (player) init();

function init() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const audio = new Audio();
  audio.preload = 'none';
  let current = 0;
  let deck = null; // 3D scene controller, once loaded

  const buttons = [...document.querySelectorAll('#tracks button')];
  const playBtn = $('#playpause');
  const seek = $('#seek');
  const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

  function select(i) {
    current = (i + TRACKS.length) % TRACKS.length;
    buttons.forEach((b, j) => b.setAttribute('aria-current', j === current ? 'true' : 'false'));
    audio.src = TRACKS[current].src;
    deck?.setLabel(TRACKS[current]);
    showNote(TRACKS[current]);
  }
  // Under the controls: a preview links to the full song, a free recording credits its players.
  const note = $('#track-note');
  function showNote(t) {
    if (!note) return;
    const a = `<a href="${t.link}" target="_blank" rel="noopener">`;
    note.innerHTML = t.apple
      ? `30-second preview${t.by ? ` by the ${t.by}` : ''}. ${a}Hear the full recording on Apple Music</a>`
      : `Full recording by ${t.by}, in the public domain. ${a}Source</a>`;
  }
  function play() {
    if (!audio.src) select(current);
    audio.play().catch(() => {});
  }
  function pause() { audio.pause(); }
  function toggle() { audio.paused ? play() : pause(); }

  buttons.forEach((b, i) => b.addEventListener('click', () => {
    if (i === current && !audio.paused) return pause();
    if (i !== current || !audio.src) select(i);
    play();
  }));
  playBtn.addEventListener('click', toggle);
  $('#prev').addEventListener('click', () => { select(current - 1); play(); });
  $('#next').addEventListener('click', () => { select(current + 1); play(); });
  seek.addEventListener('input', () => { if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration; });

  audio.addEventListener('play', () => {
    player.classList.add('is-playing');
    $('#deck').classList.add('is-playing');
    playBtn.setAttribute('aria-label', 'Pause');
    playBtn.querySelector('use').setAttribute('href', '#i-pause');
    deck?.setPlaying(true);
    if (TRACKS[current].egg) window.HF?.foundEgg(TRACKS[current].egg);
  });
  audio.addEventListener('pause', () => {
    player.classList.remove('is-playing');
    $('#deck').classList.remove('is-playing');
    playBtn.setAttribute('aria-label', 'Play');
    playBtn.querySelector('use').setAttribute('href', '#i-play');
    deck?.setPlaying(false);
  });
  audio.addEventListener('timeupdate', () => {
    $('#t-cur').textContent = fmt(audio.currentTime);
    if (audio.duration) { seek.value = Math.round((audio.currentTime / audio.duration) * 1000); deck?.setProgress(audio.currentTime / audio.duration); }
  });
  audio.addEventListener('loadedmetadata', () => { $('#t-dur').textContent = fmt(audio.duration); });
  audio.addEventListener('ended', () => { select(current + 1); play(); });
  audio.addEventListener('error', async () => {
    const t = TRACKS[current];
    if (await freshPreview(t)) { audio.src = t.src; return play(); }
    window.HF?.toast('That record skipped', 'The audio did not load. Try another track.', 'x');
  });
  buttons[0].setAttribute('aria-current', 'true');
  showNote(TRACKS[0]);

  // Load the 3D deck when the section gets close to the viewport.
  const host = $('#deck');
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    buildDeck(host, { reduceMotion, onToggle: toggle })
      .then((d) => { deck = d; deck.setLabel(TRACKS[current]); $('#deck-fallback')?.remove(); })
      .catch((err) => {
        console.warn('Turntable fell back to 2D:', err);
        const fb = $('#deck-fallback');
        if (fb) fb.textContent = 'The 3D turntable needs WebGL. The music still works: pick a track.';
      });
  }, { rootMargin: '400px' }).observe(host);
}

async function buildDeck(host, { reduceMotion, onToggle }) {
  const THREE = await import('three');
  const M = await import('./turntable-model.js?v=20261011a');

  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', 'Turntable. Press to play or pause the record.');
  host.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  M.configureTranscriptionTurntableRenderer(renderer);
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.environment = M.createTranscriptionTurntableEnvironment(renderer);
  const lights = M.createTranscriptionTurntableLookDevLights('neutral');
  lights.traverse((l) => { if (l.isDirectionalLight && l.castShadow) l.shadow.mapSize.set(1024, 1024); });
  scene.add(lights);

  const model = M.createTranscriptionTurntableModel({ textureSize: 256 });
  scene.add(model);
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.18 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const find = (name) => { let hit = null; model.traverse((o) => { if (!hit && o.name === name) hit = o; }); return hit; };
  const platter = find('Platter with ribbed rubber mat__pivot');
  const arm = find('Tonearm pivot post__pivot');
  const label = find('Record label');
  if (!platter || !arm) throw new Error('turntable nodes missing');

  // Label texture: the current track, printed on an orange label.
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = labelCanvas.height = 512;
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = 4;
  if (label) {
    label.material = label.material.clone();
    label.material.map = labelTex;
    label.material.color = new THREE.Color(0xffffff);
    label.material.roughness = 0.7;
    label.material.needsUpdate = true;
    // Cylinder cap UVs map the disc to the full texture, so draw a round label.
  }
  function drawLabel(track) {
    const c = labelCanvas.getContext('2d');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f26b21';
    c.fillStyle = accent; c.fillRect(0, 0, 512, 512);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc(256, 256, 250, 0, Math.PI * 2); c.arc(256, 256, 236, 0, Math.PI * 2, true); c.fill();
    c.fillStyle = '#1a0d04'; c.textAlign = 'center';
    c.font = '700 64px "Bricolage Grotesque", system-ui'; c.fillText('HF', 256, 150);
    c.font = '600 40px "Schibsted Grotesk", system-ui';
    const words = track.title.split(' '); let lines = [''];
    words.forEach((w) => { const t = (lines[lines.length - 1] + ' ' + w).trim(); if (c.measureText(t).width > 360 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = t; });
    lines.slice(0, 2).forEach((l, i) => c.fillText(l, 256, 340 + i * 46));
    c.font = '400 30px "Schibsted Grotesk", system-ui'; c.fillText(track.artist, 256, 340 + Math.min(lines.length, 2) * 46 + 12);
    c.fillStyle = '#d9d4cc'; c.beginPath(); c.arc(256, 256, 14, 0, Math.PI * 2); c.fill();
    labelTex.needsUpdate = true;
  }

  // Tonearm geometry (from the sculpt spec): pivot at (0.33, -0.2), stylus at (-0.062, 0.322) in the arm frame.
  const C = { x: -0.065, z: 0.02 };
  const P = { x: 0.33, z: -0.2 };
  const tip = { x: -0.062, z: 0.322 };
  const yawFor = (radius) => {
    let best = 0, err = Infinity;
    for (let a = -1.2; a <= 0.2; a += 0.001) {
      const x = P.x + tip.x * Math.cos(a) + tip.z * Math.sin(a);
      const z = P.z - tip.x * Math.sin(a) + tip.z * Math.cos(a);
      const e = Math.abs(Math.hypot(x - C.x, z - C.z) - radius);
      if (e < err) { err = e; best = a; }
    }
    return best;
  };
  const YAW_START = yawFor(0.255), YAW_END = yawFor(0.12);
  let playing = false, progress = 0, armYaw = 0, spin = 0;

  const camera = new THREE.PerspectiveCamera(28, 4 / 3, 0.01, 50);
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    M.frameTranscriptionTurntableCamera(camera, model, { azimuthDeg: 24, elevationDeg: 32, margin: w < 480 ? 1.18 : 1.1 });
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // Click/press the record to play or pause.
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    if (ray.intersectObject(model, true).length) onToggle();
  });
  canvas.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    const target = playing ? YAW_START + (YAW_END - YAW_START) * progress : 0;
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 4);
    armYaw += (target - armYaw) * k;
    arm.rotation.y = armYaw;
    if (playing && !reduceMotion) spin += dt * (33.333 / 60) * Math.PI * 2;
    platter.rotation.y = -spin;
    renderer.render(scene, camera);
  });

  return {
    setPlaying(p) { playing = p; },
    setProgress(p) { progress = Math.max(0, Math.min(1, p)); },
    setLabel(track) { drawLabel(track); },
  };
}
