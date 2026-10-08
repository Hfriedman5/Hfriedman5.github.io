// Weather for Little Athens, set from the Machine Room. Drawn over the game canvas in screen space.
export const WEATHER = [
  { id: 'clear', name: 'Clear' },
  { id: 'rain', name: 'Rain' },
  { id: 'snow', name: 'Snow' },
  { id: 'fog', name: 'Fog' },
  { id: 'ominous', name: 'Mildly ominous' },
];

export function currentWeather() {
  try { const v = JSON.parse(localStorage.getItem('hf-weather')); return WEATHER.some((w) => w.id === v) ? v : 'clear'; } catch (e) { return 'clear'; }
}

// Returns a painter for one kind of weather on a w x h canvas. Call draw(ctx, now) once per frame, after the world.
export function createWeather(kind, w, h, { still = false } = {}) {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const parts = [];
  let last = 0, flashAt = 0, flash = 0;
  if (kind === 'rain' || kind === 'ominous') for (let i = 0; i < (kind === 'rain' ? 110 : 26); i++) parts.push({ x: rnd(0, w), y: rnd(0, h), v: rnd(170, 240), len: rnd(3, 6) });
  if (kind === 'snow') for (let i = 0; i < 80; i++) parts.push({ x: rnd(0, w), y: rnd(0, h), v: rnd(12, 30), r: Math.random() < .3 ? 2 : 1, ph: rnd(0, 6.28) });
  if (kind === 'fog' || kind === 'ominous') for (let i = 0; i < 7; i++) parts.push({ cloud: true, x: rnd(-40, w), y: rnd(0, h), rx: rnd(40, 90), ry: rnd(16, 30), v: rnd(3, 9) });

  function draw(c, now) {
    if (kind === 'clear') return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    const move = still ? 0 : dt;
    c.save();
    if (kind === 'rain') { c.fillStyle = 'rgba(30, 45, 70, .2)'; c.fillRect(0, 0, w, h); }
    if (kind === 'snow') { c.fillStyle = 'rgba(240, 244, 250, .12)'; c.fillRect(0, 0, w, h); }
    if (kind === 'ominous') { c.fillStyle = 'rgba(38, 28, 62, .36)'; c.fillRect(0, 0, w, h); }
    for (const p of parts) {
      if (p.cloud) {
        p.x += p.v * move; if (p.x - p.rx > w) p.x = -p.rx;
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rx);
        const col = kind === 'fog' ? '235, 237, 242' : '12, 8, 24';
        g.addColorStop(0, `rgba(${col}, ${kind === 'fog' ? .55 : .3})`); g.addColorStop(1, `rgba(${col}, 0)`);
        c.fillStyle = g; c.beginPath(); c.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); c.fill();
      } else if (kind === 'snow') {
        p.y += p.v * move; p.x += Math.sin(now / 900 + p.ph) * 8 * move;
        if (p.y > h) { p.y = -2; p.x = rnd(0, w); }
        c.fillStyle = '#ffffff'; c.fillRect(Math.round(p.x), Math.round(p.y), p.r, p.r);
      } else {
        p.y += p.v * move; p.x -= p.v * .18 * move;
        if (p.y > h) { p.y = -p.len; p.x = rnd(0, w + 30); }
        c.fillStyle = 'rgba(200, 220, 255, .65)';
        for (let i = 0; i < p.len; i++) c.fillRect(Math.round(p.x - i * .18), Math.round(p.y - i), 1, 1);
      }
    }
    if (kind === 'fog') { c.fillStyle = 'rgba(232, 234, 240, .3)'; c.fillRect(0, 0, w, h); }
    // Distant lightning, gentle and rare. Skipped entirely when motion is reduced.
    if (kind === 'ominous' && !still) {
      if (!flashAt) flashAt = now + rnd(5000, 11000);
      if (now > flashAt) { flash = .32; flashAt = now + rnd(7000, 14000); }
      if (flash > 0) { c.fillStyle = `rgba(235, 230, 255, ${flash})`; c.fillRect(0, 0, w, h); flash = Math.max(0, flash - dt * 1.1); }
    }
    c.restore();
  }
  return { draw };
}
