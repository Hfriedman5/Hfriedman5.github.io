// The School of Athens, after Raphael (1509 to 1511), redrawn in pixels for the Academy.
// The painting is a lunette: a rectangle with a semicircular top, 320 by 208 here (the fresco is about 770 by 500 cm).
import { figureCanvas, avatarCanvas } from './world.js?v=20261010g';

export const SW = 320, SH = 208;
const CX = 160, SPRING = 160, R = 160; // the frame's arch
const VX = 160, VY = 118;              // vanishing point for the floor, between Plato and Aristotle
const AY = 84;                         // where the vault's arches spring from their piers

const SKIN = { s: '#efc29c', S: '#d6a47c' };
const robe = (r, R2, p = r, b = '#8a5a34') => ({ r, R: R2, p, b });

// Everyone you can click, with where to find them. Coordinates are the sprite's top-left on the 320x208 canvas.
export const FIGURES = [
  { id: 'plato', name: 'Plato', where: 'Center, pointing up', x: 144, y: 116,
    text: 'He founded the Academy, this very building, around 387 BC. He points up toward his world of perfect Forms. Raphael is often said to have given him Leonardo da Vinci\'s face.' },
  { id: 'aristotle', name: 'Aristotle', where: 'Center, palm toward the ground', x: 160, y: 116,
    text: 'Plato\'s student for about twenty years, and later his most famous critic. Plato points up at ideas; Aristotle gestures at the world you can actually observe.' },
  { id: 'socrates', name: 'Socrates', where: 'Upper left, in green', x: 74, y: 116,
    text: 'He never wrote a word down, so most of what we know about him comes from Plato. Here he is counting off arguments on his fingers. Outside, he is still looking for his sandal.' },
  { id: 'pythagoras', name: 'Pythagoras', where: 'Lower left, writing in a book', x: 40, y: 168,
    text: 'Yes, that theorem. He taught that numbers sit underneath everything, and his followers famously refused to eat beans.' },
  { id: 'hypatia', name: 'Hypatia', where: 'Lower left, in white', x: 84, y: 162,
    text: 'Often identified as Hypatia of Alexandria, a mathematician and astronomer who taught around 400 AD. Art historians still debate who Raphael meant.' },
  { id: 'heraclitus', name: 'Heraclitus', where: 'Front, leaning on a marble block', x: 128, y: 168,
    text: '"No one steps into the same river twice." Raphael added him late, and he is often said to be a portrait of Michelangelo, who was painting the Sistine Chapel ceiling nearby at the time.' },
  { id: 'diogenes', name: 'Diogenes', where: 'Sprawled across the steps', x: 176, y: 137, w: 20, h: 16,
    text: 'He owned almost nothing and slept in a large clay jar. When Alexander the Great offered him anything he wanted, Diogenes reportedly asked him to stop blocking the sun.' },
  { id: 'euclid', name: 'Euclid', where: 'Lower right, with a compass', x: 212, y: 172,
    text: 'He wrote the Elements, the standard geometry textbook for about 2,000 years. Euclid\'s algorithm for greatest common divisors is still taught in computer science classes. Some say this figure is Archimedes instead.' },
  { id: 'ptolemy', name: 'Ptolemy', where: 'Lower right, holding the Earth', x: 244, y: 164,
    text: 'He put the Earth at the center of the universe in the 2nd century AD, and that model lasted about 1,400 years. Raphael gave him a crown, probably mixing him up with the Ptolemy kings of Egypt.' },
  { id: 'raphael', name: 'Raphael', where: 'Far right, in a black cap', x: 272, y: 162,
    text: 'The painter. He slipped his own portrait into the crowd at the far right, looking straight out at you.' },
  { id: 'hannah', name: 'Hannah', where: 'Far right, next to Raphael', x: 290, y: 164,
    text: 'Not in the original. Raphael put himself in the painting, so Hannah figured she could too. She is wearing whatever outfit you have on right now.' },
  { id: 'apollo', name: 'Apollo', where: 'Statue, left wall', x: 18, y: 100,
    text: 'Apollo, god of music, poetry, and the sun. Raphael painted him as a marble statue in a wall niche, holding his lyre, with Athena standing in the niche across from him.' },
  { id: 'athena', name: 'Athena', where: 'Statue, right wall', x: 286, y: 100,
    text: 'Athena, goddess of wisdom. Raphael painted her under her Roman name, Minerva. The Parthenon outside is her temple.' },
];

/* ---------------- Figures ---------------- */
const SPRITES = {
  plato: () => figureCanvas({ head: 'beard', pal: { ...SKIN, h: '#ece9e2', H: '#ffffff', ...robe('#c0453a', '#7d4a9e', '#c0453a') },
    extra(put) { for (let y = 5; y <= 9; y++) { put(0, y, '#c0453a'); put(1, y, '#c0453a'); } for (let y = -2; y <= 4; y++) put(1, y, '#efc29c'); put(1, -3, '#d6a47c'); put(0, 0, '#efc29c');
      for (let y = 9; y <= 12; y++) { put(13, y, '#7a5a3a'); put(14, y, '#a8743f'); } } }),
  aristotle: () => figureCanvas({ head: 'beard', pal: { ...SKIN, h: '#6b4a2e', H: '#8a6440', ...robe('#3d6fa8', '#7a5a3a', '#7a5a3a', '#5a3e26') },
    extra(put) { put(13, 10, '#3d6fa8'); put(14, 10, '#3d6fa8'); put(15, 10, '#efc29c'); put(15, 9, '#efc29c'); for (let x = 1; x <= 3; x++) { put(x, 11, '#a8743f'); put(x, 12, '#7a5a3a'); } } }),
  socrates: () => figureCanvas({ head: 'bald', pal: { ...SKIN, g: '#cfc8bb', ...robe('#6f7d3a', '#556030') },
    extra(put) { put(14, 9, '#efc29c'); put(14, 8, '#efc29c'); put(15, 9, '#efc29c'); } }),
  alcibiades: () => figureCanvas({ dir: 'left', overlays: ['helmet'], pal: { ...SKIN, h: '#6b3f24', ...robe('#c8913a', '#8a5a22', '#7a1414', '#5a3e26') } }),
  pythagoras: () => figureCanvas({ head: 'beard', pal: { ...SKIN, h: '#e8e4da', H: '#ffffff', ...robe('#efe6d2', '#c8913a') },
    extra(put) { for (let x = 3; x <= 12; x++) for (let y = 10; y <= 12; y++) put(x, y, x === 7 || x === 8 ? '#bfb5a2' : '#fbf8f0'); for (let x = 4; x <= 6; x++) put(x, 11, '#7a6248'); put(10, 11, '#7a6248'); } }),
  averroes: () => figureCanvas({ dir: 'left', pal: { ...SKIN, h: '#f4f1ea', H: '#ffffff', ...robe('#4f7f5a', '#2f5a3a') } }),
  hypatia: () => figureCanvas({ pal: { ...SKIN, h: '#5a3a22', H: '#7a5232', ...robe('#f6f2ea', '#d9d2c2', '#f6f2ea', '#d9d2c2') } }),
  heraclitus: () => figureCanvas({ head: 'beard', pal: { ...SKIN, h: '#3a2a1c', H: '#5a4230', ...robe('#6b3fa0', '#4a2a73', '#5a3e26', '#3a2a1c') } }),
  diogenes: () => figureCanvas({ head: 'bald', pal: { ...SKIN, g: '#bdb5a6', ...robe('#7fb2dc', '#5a8fbf', '#7fb2dc', '#efc29c') } }),
  euclid: () => figureCanvas({ head: 'bald', dir: 'down', pal: { ...SKIN, g: '#efc29c', ...robe('#d9603f', '#e0b44c') } }),
  ptolemy: () => figureCanvas({ dir: 'up', overlays: ['crown'], pal: { ...SKIN, h: '#6b4a2e', H: '#8a6440', ...robe('#e0b44c', '#b8862e', '#c9a03e') } }),
  raphael: () => figureCanvas({ pal: { ...SKIN, h: '#3a2a1c', H: '#5a4230', ...robe('#2a2f3d', '#1b1b1b', '#2a2f3d', '#1b1b1b') },
    extra(put) { for (let x = 3; x <= 12; x++) put(x, 0, '#14161c'); for (let x = 4; x <= 11; x++) put(x, -1, '#14161c'); } }),
  apollo: () => figureCanvas({ marble: true, overlays: ['laurel', 'lyre'], pal: { h: '#8f5a35' } }),
  athena: () => figureCanvas({ marble: true, overlays: ['helmet'], pal: { h: '#8f5a35' } }),
  filler: (dir, color, color2, hair = '#4a3626') => figureCanvas({ dir, pal: { ...SKIN, h: hair, H: hair, ...robe(color, color2, color, '#5a3e26') } }),
};

/* ---------------- Painting ---------------- */
function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
// An arch: a half annulus above AY whose ends continue straight down to the floor as piers.
function band(c, r0, r1, col, coffer) {
  for (let y = Math.max(0, AY - r1); y <= 128; y++) for (let x = VX - r1; x <= VX + r1; x++) {
    const d = Math.hypot(x - VX, Math.min(0, y - AY));
    if (d < r0 || d > r1) continue;
    const ang = Math.atan2(Math.min(0, y - AY), x - VX);
    px(c, x, y, 1, 1, coffer && Math.floor(ang / 0.16) % 2 && d > r0 + 2 && d < r1 - 2 ? coffer : col);
  }
}
function fill(c, rIn, col) {
  for (let y = Math.max(0, AY - rIn); y <= 128; y++) for (let x = VX - rIn; x <= VX + rIn; x++) {
    if (Math.hypot(x - VX, Math.min(0, y - AY)) <= rIn) px(c, x, y, 1, 1, col);
  }
}

export function paintSchool(canvas, look) {
  canvas.width = SW; canvas.height = SH;
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  // walls, then three receding arches of the vault, with sky through the last one
  px(c, 0, 0, SW, SH, '#e4d6ba');
  band(c, 104, 118, '#cfbd99', '#bba77f'); fill(c, 104, '#d8c9a8');
  band(c, 74, 84, '#c8b48e', '#b29e76'); fill(c, 74, '#cdbd9a');
  band(c, 48, 56, '#bfab84', '#a8946c'); fill(c, 48, '#bcd9ee');
  [[128, 54, 14], [172, 62, 12], [146, 72, 8]].forEach(([x, y, w]) => { px(c, x, y, w, 3, '#f4f8fb'); px(c, x + 2, y - 2, w - 6, 2, '#f4f8fb'); });
  px(c, 112, 112, 96, 16, '#a9c7dc'); px(c, 112, 118, 96, 10, '#9fb98a'); // distant hills under the last arch
  // pilaster edges for depth
  [42, 56, 76, 85, 104, 111, 209, 216, 235, 244, 264, 278].forEach((x) => px(c, x, AY, 1, 128 - AY, '#a8946c'));
  // niches with statues on the side walls
  for (const nx of [16, 284]) {
    px(c, nx, 96, 20, 32, '#a8946c'); px(c, nx + 2, 92, 16, 4, '#a8946c'); px(c, nx + 4, 90, 12, 2, '#a8946c');
    px(c, nx + 1, 97, 18, 30, '#9a8660');
    px(c, nx - 1, 122, 22, 6, '#cfbd99'); px(c, nx - 1, 122, 22, 1, '#e8dcc4');
  }
  // upper platform, three steps, and the paved floor in front
  px(c, 0, 128, SW, 12, '#dccaa6'); px(c, 0, 140, SW, 1, '#b9a47c');
  for (let i = 0; i < 3; i++) { px(c, 0, 141 + i * 4, SW, 2, '#e6d6b4'); px(c, 0, 143 + i * 4, SW, 2, '#bca883'); }
  px(c, 0, 153, SW, SH - 153, '#d6c29b');
  [160, 168, 178, 191].forEach((y) => px(c, 0, y, SW, 1, '#c6b088'));
  for (let k = -6; k <= 6; k++) { // paving joints that converge on the vanishing point
    const bx = VX + k * 52;
    for (let y = 154; y < SH; y++) { const x = Math.round(VX + (bx - VX) * (y - VY) / (SH - VY)); if (x >= 0 && x < SW) px(c, x, y, 1, 1, '#c6b088'); }
  }

  // people, back to front
  const draw = (cv, x, y) => c.drawImage(cv, x, y);
  draw(SPRITES.filler('right', '#9a6a3a', '#7a5232'), 56, 116);
  draw(SPRITES.socrates(), 74, 116);
  draw(SPRITES.alcibiades(), 92, 116);
  draw(SPRITES.filler('right', '#4f7f9e', '#355d7a', '#2f2219'), 112, 116);
  draw(SPRITES.filler('left', '#8e4234', '#6b2e24', '#d9d4c9'), 186, 116);
  draw(SPRITES.filler('left', '#6b7d5a', '#4f5f40'), 204, 116);
  draw(SPRITES.filler('up', '#b85a48', '#8e4234', '#3a2a1c'), 226, 116);
  draw(SPRITES.filler('left', '#d9a046', '#a8762f', '#6b4a2e'), 244, 116);
  draw(SPRITES.filler('right', '#7d4a9e', '#5a3378', '#e9e6de'), 128, 117);
  draw(SPRITES.plato(), 144, 116);
  draw(SPRITES.aristotle(), 160, 116);
  // Diogenes, lying across the steps
  c.save(); c.translate(176, 153); c.rotate(-Math.PI / 2); c.drawImage(SPRITES.diogenes(), 0, 0); c.restore();
  draw(SPRITES.apollo(), 18, 100); draw(SPRITES.athena(), 286, 100);
  // lower left: Pythagoras on a stool with his book, a man in a white turban leaning in, and Hypatia
  draw(SPRITES.averroes(), 56, 162);
  px(c, 41, 184, 14, 3, '#7a5a3a'); px(c, 42, 187, 2, 5, '#5a3e26'); px(c, 52, 187, 2, 5, '#5a3e26');
  c.drawImage(SPRITES.pythagoras(), 0, 0, 16, 18, 40, 168, 16, 18);
  draw(SPRITES.hypatia(), 84, 162);
  // Heraclitus behind his marble block
  draw(SPRITES.heraclitus(), 128, 168);
  px(c, 122, 182, 30, 13, '#eeeae2'); px(c, 122, 182, 30, 2, '#ffffff'); px(c, 122, 193, 30, 2, '#cfc9bc'); px(c, 151, 182, 1, 13, '#cfc9bc');
  // Euclid bent over a slate, drawing with a compass; students watching
  draw(SPRITES.filler('right', '#3d6fa8', '#2c4f7a', '#e2b04a'), 194, 168);
  draw(SPRITES.filler('left', '#4f8f3a', '#356a28'), 230, 168);
  draw(SPRITES.euclid(), 212, 172);
  px(c, 204, 192, 20, 7, '#3a3f4a'); px(c, 204, 192, 20, 1, '#5a606c');
  [[211, 194], [212, 194], [213, 194], [210, 195], [214, 195], [211, 196], [212, 196], [213, 196], [218, 194], [219, 195], [220, 196]].forEach(([x, y]) => px(c, x, y, 1, 1, '#f4f1ea'));
  // Ptolemy holding the Earth, Raphael, and Hannah
  draw(SPRITES.ptolemy(), 244, 164);
  px(c, 258, 172, 7, 7, '#3d6fa8'); px(c, 259, 171, 5, 9, '#3d6fa8'); px(c, 259, 173, 3, 2, '#4f8f3a'); px(c, 262, 176, 2, 2, '#4f8f3a'); px(c, 259, 172, 2, 1, '#8fc0ea');
  draw(SPRITES.raphael(), 272, 162);
  draw(avatarCanvas('down', 0, look), 290, 164);

  // Cut the lunette: clear everything above the arch, then gild the edge.
  const edge = (y) => Math.floor(Math.sqrt(R * R - (SPRING - y) ** 2));
  for (let y = 0; y < SPRING; y++) { const dx = edge(y); c.clearRect(0, y, CX - dx, 1); c.clearRect(CX + dx, y, SW - CX - dx, 1); }
  for (let y = 0; y < SH; y++) {
    const dx = y < SPRING ? edge(y) : CX;
    const prev = y > 0 && y - 1 < SPRING ? edge(y - 1) : dx;
    const from = Math.min(dx, prev);
    px(c, CX - dx, y, Math.max(2, dx - from + 1), 1, '#b8913a'); px(c, CX + dx - Math.max(2, dx - from + 1), y, Math.max(2, dx - from + 1), 1, '#b8913a');
  }
  px(c, 0, SH - 2, SW, 2, '#b8913a');
}

// Hotspot boxes as percentages of the painting, with a little slack around each sprite.
export function hotspot(f) {
  const w = f.w || 16, h = f.h || 20, pad = 1;
  return { left: ((f.x - pad) / SW) * 100, top: ((f.y - pad) / SH) * 100, width: ((w + pad * 2) / SW) * 100, height: ((h + pad * 2) / SH) * 100 };
}
