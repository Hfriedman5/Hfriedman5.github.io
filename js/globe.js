// Travel globe: dotted land, photo pins, drag to spin, pick a place to fly to it.
const PLACES = [
  { id: 'maine', name: 'Maine', lat: 43.4, lon: -70.9, img: 'assets/travel/skydiving.jpg', alt: 'Hannah mid-air during a tandem skydive, the plane still visible above.', caption: 'A tandem skydive over Maine.' },
  { id: 'newyork', name: 'New York', lat: 40.76, lon: -73.85, img: 'assets/travel/newyork.jpg', alt: 'A sunny view over the infield at Citi Field during a Mets game, with the scoreboard and packed stands behind it.', caption: 'A Mets game at Citi Field in Queens.' },
  { id: 'iceland', name: 'Iceland', lat: 63.6, lon: -20.0, img: 'assets/travel/iceland.jpg', alt: 'A tall waterfall pouring off a green cliff in Iceland.', caption: 'A waterfall on the south coast of Iceland.' },
  { id: 'alaska', name: 'Alaska', lat: 61.5, lon: -149.5, img: 'assets/travel/alaska.jpg', alt: 'A turquoise lake ringed by spruce forest and mountains in Alaska.', caption: 'Lakes, spruce, and mountains in Alaska.' },
  { id: 'canada', name: 'Canada', lat: 48.4, lon: -123.4, img: 'assets/travel/canada.jpg', alt: 'A grand stone government building outlined in lights at night, a Canadian flag hanging at its center.', caption: 'A parliament building lit up at night in Canada.' },
  { id: 'la', name: 'Los Angeles', lat: 34.01, lon: -118.5, img: 'assets/travel/la.jpg', alt: 'The Santa Monica Pier with its Ferris wheel and roller coaster above bright turquoise surf.', caption: 'The Santa Monica Pier in Los Angeles.' },
  { id: 'mexico', name: 'Mexico', lat: 19.4, lon: -99.2, img: 'assets/travel/mexico.jpg', alt: 'A round stone castle tower above a formal garden in Mexico City.', caption: 'A castle tower and gardens in Mexico City.' },
  { id: 'costarica', name: 'Costa Rica', lat: 9.7, lon: -85.0, img: 'assets/travel/costarica.jpg', alt: 'Paddlers in red life vests in an outrigger canoe on turquoise water.', caption: 'Outrigger canoeing off the coast of Costa Rica.' },
  { id: 'puertorico', name: 'Puerto Rico', lat: 18.47, lon: -66.12, img: 'assets/travel/puertorico.jpg', alt: 'Dark volcanic rocks on a shoreline beside an old stone wall and a long pier.', caption: 'The rocky coastline in Puerto Rico.' },
  { id: 'portugal', name: 'Portugal', lat: 38.79, lon: -9.39, img: 'assets/travel/portugal.jpg', alt: 'The yellow and red towers and domes of a hilltop palace in Sintra.', caption: 'Pena Palace in Sintra, Portugal.' },
  { id: 'france', name: 'France', lat: 48.86, lon: 2.34, img: 'assets/travel/france.jpg', alt: 'Hannah standing on a stone block with her arms raised in front of the Louvre pyramid.', caption: 'At the Louvre in Paris.' },
  { id: 'italy', name: 'Italy', lat: 45.44, lon: 12.33, img: 'assets/travel/italy.jpg', alt: 'The prow of a gondola on a narrow Venetian canal under a stone bridge.', caption: 'A gondola ride through Venice.' },
  { id: 'israel', name: 'Israel', lat: 30.6, lon: 34.8, img: 'assets/travel/israel.jpg', alt: 'A line of riders on camels crossing a sandy desert under a clear sky.', caption: 'A camel trek through the desert in Israel.' },
];

const $ = (s, r = document) => r.querySelector(s);
const root = $('#travel');
if (root) init();

function init() {
  const list = $('#places', root);
  const card = $('#place-card', root);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let globe = null;
  let current = null;

  list.innerHTML = PLACES.map((p) => `<li><button type="button" data-place="${p.id}">${p.name}</button></li>`).join('');
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-place]'); if (b) select(b.dataset.place, true); });

  function select(id, fly) {
    const p = PLACES.find((x) => x.id === id);
    if (!p) return;
    current = p;
    list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.place === id)));
    const img = $('img.fg', card), bg = $('img.bg', card);
    card.classList.add('swapping');
    const done = () => { card.classList.remove('swapping'); };
    img.onload = done; img.onerror = done;
    img.src = p.img; img.alt = p.alt; bg.src = p.img;
    $('.place-name', card).textContent = p.name;
    $('.place-caption', card).textContent = p.caption;
    if (img.complete) done();
    globe?.focus(p, fly && !reduceMotion);
  }
  select('maine', false);

  // Preload the next photo the visitor is likely to open.
  list.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-place]'); if (b) { const p = PLACES.find((x) => x.id === b.dataset.place); if (p) new Image().src = p.img; } });

  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    buildGlobe($('#globe', root), { reduceMotion, onPick: (id) => select(id, true) })
      .then((g) => { globe = g; if (current) globe.focus(current, false); $('#globe-fallback', root)?.remove(); })
      .catch((err) => {
        console.warn('Globe fell back to the list:', err);
        const fb = $('#globe-fallback', root);
        if (fb) fb.textContent = 'The 3D globe needs WebGL. Pick a place from the list instead.';
      });
  }, { rootMargin: '400px' }).observe(root);
}

async function buildGlobe(host, { reduceMotion, onPick }) {
  const THREE = await import('three');
  const land = await fetch('assets/globe-land.json').then((r) => r.json());
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Globe with a pin for each place. Drag to spin it, or click a pin to see the photo.');
  canvas.setAttribute('role', 'img');
  host.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0, 4.4);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe8f2, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(-2, 2, 3); scene.add(sun);

  const world = new THREE.Group();
  world.rotation.order = 'XYZ';
  scene.add(world);

  const toVec = (lat, lon, r = 1) => {
    const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon);
    return new THREE.Vector3(r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b));
  };

  const ocean = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshStandardMaterial({ color: css('--globe-ocean') || '#dbe8f6', roughness: 1, metalness: 0, emissive: new THREE.Color(css('--globe-ocean') || '#dbe8f6'), emissiveIntensity: 0.35 }));
  world.add(ocean);

  // Land as round dots
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  const dc = dot.getContext('2d'); dc.fillStyle = '#fff'; dc.beginPath(); dc.arc(32, 32, 28, 0, Math.PI * 2); dc.fill();
  const dotTex = new THREE.CanvasTexture(dot);
  const pos = new Float32Array(land.points.length * 3);
  land.points.forEach(([la, lo], i) => { const v = toVec(la, lo, 1.004); pos.set([v.x, v.y, v.z], i * 3); });
  const landGeo = new THREE.BufferGeometry(); landGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const landMat = new THREE.PointsMaterial({ size: 0.03, map: dotTex, transparent: true, alphaTest: 0.5, color: css('--globe-land') || '#33415a', sizeAttenuation: true });
  world.add(new THREE.Points(landGeo, landMat));

  // Pins
  const accent = new THREE.Color(css('--accent') || '#f26b21');
  const pins = [];
  const headGeo = new THREE.SphereGeometry(0.026, 20, 14);
  const stalkGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8);
  const hitGeo = new THREE.SphereGeometry(0.075, 8, 6);
  const ringGeo = new THREE.RingGeometry(0.04, 0.052, 32);
  for (const p of PLACES) {
    const id = p.id;
    const g = new THREE.Group();
    const n = toVec(p.lat, p.lon, 1).normalize();
    g.position.copy(n);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const stalk = new THREE.Mesh(stalkGeo, new THREE.MeshStandardMaterial({ color: 0x0f1e33, roughness: 0.6 })); stalk.position.y = 0.035; g.add(stalk);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: accent, roughness: 0.45 })); head.position.y = 0.075; g.add(head);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; g.add(ring);
    const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.06; hit.userData.id = id; g.add(hit);
    world.add(g);
    pins.push({ id, g, head, ring, hit });
  }

  // Rotation state
  let rx = 0.35, ry = 0.9, vx = 0, vy = 0, target = null, dragging = false, idleSince = performance.now();
  const clampX = (x) => Math.max(-1.25, Math.min(1.25, x));
  function focus(p, animate) {
    const tx = clampX(THREE.MathUtils.degToRad(p.lat) * 0.85);
    let ty = -THREE.MathUtils.degToRad(p.lon);
    ty += Math.round((ry - ty) / (Math.PI * 2)) * Math.PI * 2; // shortest way round
    target = { x: tx, y: ty };
    if (!animate) { rx = tx; ry = ty; target = null; }
    pins.forEach((pin) => { pin.selected = pin.id === p.id; });
    idleSince = performance.now();
  }

  // Drag to spin, with inertia
  let last = null, moved = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; last = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); target = null; vx = vy = 0; });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) { hover(e); return; }
    const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy);
    last = { x: e.clientX, y: e.clientY };
    vy = dx * 0.006; vx = dy * 0.006; ry += vy; rx = clampX(rx + vx);
  });
  const end = (e) => { if (!dragging) return; dragging = false; idleSince = performance.now(); if (moved < 6) pick(e); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { dragging = false; });

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function hitTest(e) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects([ocean, ...pins.map((p) => p.hit)], false);
    const first = hits[0];
    return first && first.object.userData.id ? first.object.userData.id : null;
  }
  function hover(e) { canvas.style.cursor = hitTest(e) ? 'pointer' : 'grab'; }
  function pick(e) { const id = hitTest(e); if (id) onPick(id); }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.9 ? 5.2 : 4.4;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  function recolor() {
    ocean.material.color.set(css('--globe-ocean') || '#dbe8f6');
    ocean.material.emissive.set(css('--globe-ocean') || '#dbe8f6');
    landMat.color.set(css('--globe-land') || '#33415a');
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
  new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    if (target) {
      const k = 1 - Math.exp(-dt * 3.2);
      rx += (target.x - rx) * k; ry += (target.y - ry) * k;
      if (Math.abs(target.x - rx) + Math.abs(target.y - ry) < 0.002) target = null;
    } else if (!dragging) {
      vx *= 0.92; vy *= 0.92; ry += vy; rx = clampX(rx + vx);
      if (!reduceMotion && performance.now() - idleSince > 4000) ry += dt * 0.08;
    }
    world.rotation.set(rx, ry, 0);
    const t = clock.elapsedTime;
    pins.forEach((p) => {
      const s = p.selected ? 1.45 : 1;
      p.head.scale.setScalar(p.head.scale.x + (s - p.head.scale.x) * 0.2);
      p.ring.material.opacity = p.selected && !reduceMotion ? 0.55 * (1 - ((t * 0.8) % 1)) : p.selected ? 0.5 : 0;
      p.ring.scale.setScalar(p.selected && !reduceMotion ? 1 + ((t * 0.8) % 1) * 1.6 : 1.2);
    });
    renderer.render(scene, camera);
  });

  return { focus };
}
