// Little Athens: map, tiles, sprites, and a static renderer.
// All art is authored here as code (pixel strings and rectangles); there are no image files.

export const TILE = 16;
export const W = 48, H = 24; // the town is columns 0-35; the farm is 36-47

/* ---------------- Palette ---------------- */
const P = {
  grass: '#a9c46a', grass2: '#9fbb60', grass3: '#8aa850', tuft: '#768f40',
  path: '#f1ebdf', path2: '#e2dacb', pathEdge: '#cabfaa',
  water: '#2f80c6', water2: '#63aee4', water3: '#1f5f9e',
  leaf: '#8fa66b', leaf2: '#b6c78e', leaf3: '#6a7f4b', trunk: '#7a5a3a', cypress: '#3f6b3c', cypress2: '#56864f', cypress3: '#2c4f2b',
  wall: '#f4f0e7', wall2: '#ddd6c6', wall3: '#bfb5a2', col: '#fbf9f4',
  roof: '#c8643c', roof2: '#a14c2c', roofR: '#c8643c', roofR2: '#a14c2c', roofT: '#d39a4a', roofT2: '#a8762f', roofP: '#b85a48', roofP2: '#8e4234', roofB: '#5f7896', roofB2: '#46607e', roofG: '#8a4f7d', roofG2: '#6b3a60', roofW: '#8a6a44', roofW2: '#6a4e30',
  ped: '#3d6fa8', ped2: '#c8643c',
  win: '#4a3a2c', win2: '#7a6248', door: '#6b4a2f', door2: '#4e3420',
  ice: '#d9a46b', ice2: '#f6efe2', board: '#e3dac8', boardLine: '#c7bca6',
  flowerR: '#d9423b', flowerY: '#f2c94c', flowerW: '#fbfaf2',
  sand: '#efdcab', ink: '#2a2f3d', sign: '#e9e2d2', sign2: '#a89a80',
};

/* ---------------- Map ----------------
   . grass  , tuft  * flowers  = path  ~ water  T tree  i ice  s sand  # blocked (building footprint, filled later) */
const ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T..,.......T...............T......,T...,.......T',
  'T.................................,T......,....T',
  'T..................................T.........,.T',
  'T,.........................,.......T...........T',
  'T..................................T...........T',
  'T.........,........................T.,.........T',
  'T....,.............................T....,......T',
  'T....=.....**....==.....**....=....T.......,...T',
  'T....=.....**....==.....**....=....T..........,T',
  'T....=...........==...........=..,.T...........T',
  'T....=.,.........==...........=....T...........T',
  'T....=...........==.......,...=....T..,........T',
  'T=======================================.......T',
  'T=======================================.......T',
  'T............=.........=...........T...........T',
  'T............=.........=...........T...........T',
  'T.,..........=.........=...........T,..........T',
  'T............=.........=..........,T...,.......T',
  'T..,.........=.........=...........T......,....T',
  'T.T..=========.........========..T.TTTTTTTTTTTTT',
  'ssssssssssssssssssssssssssssssssssssssssssssssss',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

export const BUILDINGS = [
  { id: 'parthenon', name: 'The Parthenon', kind: 'temple', x: 13, y: 2, w: 10, h: 6, door: [17, 7], door2: [18, 7] },
  { id: 'gaming', name: 'Gaming Hall', kind: 'house', roof: ['roofG', 'roofG2'], x: 3, y: 3, w: 6, h: 5, door: [5, 7] },
  { id: 'academy', name: 'The Academy', kind: 'house', roof: ['roofT', 'roofT2'], x: 28, y: 3, w: 6, h: 5, door: [30, 7], pediment: true },
  { id: 'library', name: 'Library', kind: 'house', roof: ['roof', 'roof2'], x: 3, y: 15, w: 6, h: 5, door: [5, 19] },
  { id: 'bank', name: 'The Bank', kind: 'house', roof: ['roofB', 'roofB2'], x: 28, y: 15, w: 6, h: 5, door: [30, 19], pediment: true },
  { id: 'workshop', name: 'The workshop', kind: 'house', roof: ['roofW', 'roofW2'], x: 40, y: 15, w: 6, h: 4, door: [42, 18] },
];
export const RINK = { x: 14, y: 15, w: 9, h: 5 };
// Places on the map. `at` is where the label sits (tile coords); `go` is where travel puts you, and which way you face.
export const MAP_PLACES = [
  { id: 'parthenon', name: 'The Parthenon', desc: "Hannah's resume, carved in marble, and her blog.", at: [18, 2.4], go: [17, 8, 'up'] },
  { id: 'gaming', name: 'Gaming Hall', desc: 'Blackjack and Minesweeper.', at: [6, 3.4], go: [5, 8, 'up'] },
  { id: 'academy', name: 'The Academy', desc: "Raphael's School of Athens, in pixels.", at: [31, 3.4], go: [30, 8, 'up'] },
  { id: 'market', name: 'Agora market', desc: 'Outfits and gadgets, paid in coins.', at: [23.5, 10.2], go: [23, 13, 'up'] },
  { id: 'library', name: 'Library', desc: 'Scrolls, from Homer to Herodotus.', at: [6, 15.4], go: [5, 20, 'up'] },
  { id: 'bank', name: 'The Bank', desc: 'Coins left with the banker grow 0.5% a day.', at: [31, 15.4], go: [30, 20, 'up'] },
  { id: 'board', name: 'Request board', desc: 'One small job for the town, every day.', at: [12.5, 11.1], go: [12, 13, 'up'] },
  { id: 'stadium', name: 'The Stadium', desc: 'Race the runner, one lap.', at: [18.5, 17.5], go: [18, 14, 'down'] },
  { id: 'farm', name: 'The farm', desc: 'Buy a plot, plant seeds, and sell what you grow.', at: [41.5, 1.4], go: [37, 13, 'up'] },
  { id: 'workshop', name: 'The workshop', desc: 'Turn crops into bread, wine, and olive oil.', at: [43, 14.6], go: [42, 19, 'up'] },
  { id: 'shore', name: 'The Aegean Sea', desc: 'Sand, sea, and a captain with ships for hire.', at: [18, 22.6], go: [18, 21, 'down'] },
];
export const STALL = { x: 22, y: 11, w: 3, h: 1 };
// The farm, east of town: Demetrios' stall at the entrance, twelve plots for sale, and a well.
export const FARM_STALL = { x: 36, y: 11, w: 3, h: 1 };
export const PLOT_SIZE = 2; // each plot is 2x2 tiles, so the crops have room to look like crops
export const PLOTS = [2, 5, 8].flatMap((y) => [39, 42, 45].map((x) => ({ x, y })));
export const WELL = { x: 37, y: 4 };
export const plotAt = (x, y) => PLOTS.findIndex((p) => x >= p.x && x < p.x + PLOT_SIZE && y >= p.y && y < p.y + PLOT_SIZE);
// A little wooden dock out into the sea. The Machine Room's sailboat moors alongside it.
export const PIER = [[15, 22], [16, 22], [17, 22], [15, 23], [16, 23], [17, 23]];
// Where lost things turn up for the request board's fetch jobs (sand and grass only).
export const SANDAL_SPOTS = [[4, 21], [31, 21], [17, 21], [2, 17], [11, 19], [33, 10]];

export const SIGNS = [
  { x: 12, y: 8, text: 'The Parthenon.\nTemple of Athena, goddess of wisdom and strategy.' },
  { x: 9, y: 8, text: 'Gaming Hall.\nMinesweeper and blackjack. Bring coins.' },
  { x: 26, y: 8, text: "Plato's Academy.\nInside: the whole School of Athens, painted on one wall." },
  { x: 9, y: 19, text: 'Library.\nQuiet, please. Something in here writes back.' },
  { x: 27, y: 19, text: 'The Bank.\nThe banker sits at a table, a trapeza. Coins left with him grow 0.5% a day.' },
  { x: 12, y: 12, board: true, text: 'Town request board.' },
  { x: 39, y: 12, farm: true, text: 'The farm.\nWalk up to a plot to buy it. Demetrios sells seeds and buys whatever you grow.' },
  { x: 38, y: 15, text: 'The workshop.\nTurn your harvest into bread, wine, and olive oil, which sell for more than the crops do. The door faces the sea.' },
  { x: 14, y: 21, text: 'The Aegean Sea.\nHomer called it wine-dark. It looks blue to you.' },
];

export const NPCS = [
  { id: 'hat', x: 15, y: 10, sprite: 'hat', facing: 'down', still: true },
  { id: 'owl', x: 21, y: 10, sprite: 'owl', facing: 'down', still: true },
  { id: 'plato', x: 27, y: 10, sprite: 'plato', facing: 'down', still: true },
  { id: 'socrates', x: 29, y: 11, sprite: 'socrates', facing: 'down', still: true },
  { id: 'cat', x: 13, y: 11, sprite: 'cat', facing: 'down', still: true, wander: true, box: [11, 8, 24, 12], on: ['.', ',', '*'] },
  { id: 'merchant', x: 23, y: 12, sprite: 'merchant', facing: 'down', still: true },
  { id: 'recruiter', x: 26, y: 14, sprite: 'recruiter', facing: 'left' },
  { id: 'runner', x: 18, y: 17, sprite: 'runner', facing: 'down', wander: true, on: ['i'] },
  { id: 'captain', x: 22, y: 21, sprite: 'captain', facing: 'down' },
  { id: 'keeper', x: 7, y: 9, sprite: 'keeper', facing: 'down' },
  { id: 'student', x: 11, y: 17, sprite: 'student', facing: 'left' },
  { id: 'farmer', x: 37, y: 12, sprite: 'farmer', facing: 'down' },
];

export function buildGrid() {
  const g = ROWS.map((r) => r.split(''));
  for (const b of BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) g[y][x] = '#';
  for (let y = RINK.y; y < RINK.y + RINK.h; y++) for (let x = RINK.x; x < RINK.x + RINK.w; x++) {
    const edge = y === RINK.y || y === RINK.y + RINK.h - 1 || x === RINK.x || x === RINK.x + RINK.w - 1;
    g[y][x] = edge ? 'b' : 'i';
  }
  g[RINK.y][RINK.x + 4] = 'i'; // gate in the boards, top middle
  for (let x = STALL.x; x < STALL.x + STALL.w; x++) g[STALL.y][x] = '#';
  for (const [x, y] of PIER) g[y][x] = 'd';
  for (let x = FARM_STALL.x; x < FARM_STALL.x + FARM_STALL.w; x++) g[FARM_STALL.y][x] = '#';
  for (const p of PLOTS) for (let dy = 0; dy < PLOT_SIZE; dy++) for (let dx = 0; dx < PLOT_SIZE; dx++) g[p.y + dy][p.x + dx] = 'p';
  g[WELL.y][WELL.x] = 'w';
  for (const s of SIGNS) g[s.y][s.x] = 'S';
  return g;
}

export function isSolid(grid, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return true;
  const c = grid[y][x];
  return c === 'T' || c === '~' || c === '#' || c === 'b' || c === 'S' || c === 'p' || c === 'w';
}

/* ---------------- Deterministic noise ---------------- */
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

export const isOlive = (x, y) => hash(x, y, 77) <= .55;

/* ---------------- Tile painters (16x16, pixel rects) ---------------- */
function px(c, x, y, w = 1, h = 1, color) { c.fillStyle = color; c.fillRect(x, y, w, h); }

function paintGrass(c, ox, oy, tx, ty) {
  px(c, ox, oy, 16, 16, (tx + ty) % 2 ? P.grass : P.grass2);
  for (let i = 0; i < 5; i++) { const x = (hash(tx, ty, i) * 14) | 0, y = (hash(ty, tx, i + 9) * 14) | 0; px(c, ox + x, oy + y, 1, 2, P.grass3); }
}
function paintTuft(c, ox, oy, tx, ty) {
  paintGrass(c, ox, oy, tx, ty);
  [[4, 8], [9, 5], [11, 10]].forEach(([x, y]) => { px(c, ox + x, oy + y, 1, 3, P.tuft); px(c, ox + x - 1, oy + y + 1, 1, 2, P.tuft); px(c, ox + x + 1, oy + y + 1, 1, 2, P.tuft); });
}
function paintFlowers(c, ox, oy, tx, ty) {
  paintGrass(c, ox, oy, tx, ty);
  [[3, 3, P.flowerR], [10, 4, P.flowerY], [6, 9, P.flowerW], [12, 11, P.flowerR], [2, 12, P.flowerY]].forEach(([x, y, col]) => {
    px(c, ox + x, oy + y - 1, 1, 1, col); px(c, ox + x - 1, oy + y, 3, 1, col); px(c, ox + x, oy + y + 1, 1, 1, col); px(c, ox + x, oy + y, 1, 1, P.flowerY === col ? '#e08a2a' : '#f6d24a');
  });
}
function paintPath(c, ox, oy, tx, ty, grid) {
  px(c, ox, oy, 16, 16, P.path);
  for (let i = 0; i < 4; i++) { const x = (hash(tx, ty, i + 3) * 13) | 0, y = (hash(tx + 7, ty, i) * 13) | 0; px(c, ox + x, oy + y, 3, 2, P.path2); }
  const g = (x, y) => (grid[y] && grid[y][x]) || 'T';
  const notPath = (ch) => ch !== '=' && ch !== '#' && ch !== 'S';
  if (notPath(g(tx, ty - 1))) px(c, ox, oy, 16, 1, P.pathEdge);
  if (notPath(g(tx, ty + 1))) px(c, ox, oy + 15, 16, 1, P.pathEdge);
  if (notPath(g(tx - 1, ty))) px(c, ox, oy, 1, 16, P.pathEdge);
  if (notPath(g(tx + 1, ty))) px(c, ox + 15, oy, 1, 16, P.pathEdge);
}
function paintSand(c, ox, oy, tx, ty) {
  px(c, ox, oy, 16, 16, P.sand);
  for (let i = 0; i < 3; i++) px(c, ox + ((hash(tx, ty, i) * 14) | 0), oy + ((hash(ty, tx, i) * 10) | 0), 2, 1, P.path2);
  px(c, ox, oy + 14, 16, 2, P.water2);
}
export function paintWater(c, ox, oy, tx, ty, frame = 0) {
  px(c, ox, oy, 16, 16, P.water);
  const off = (frame + tx * 3 + ty * 5) % 16;
  px(c, ox + ((off + 2) % 14), oy + 4, 4, 1, P.water2);
  px(c, ox + ((off + 9) % 13), oy + 10, 3, 1, P.water2);
  px(c, ox + ((off + 5) % 12), oy + 13, 5, 1, P.water3);
}
function paintTree(c, ox, oy, tx, ty) {
  paintGrass(c, ox, oy, tx, ty);
  if (hash(tx, ty, 77) > .55) { // cypress
    px(c, ox + 4, oy + 14, 8, 2, 'rgba(0,0,0,.18)');
    px(c, ox + 7, oy + 13, 2, 3, P.trunk);
    [[7, 0, 2], [6, 1, 4], [6, 2, 4], [5, 3, 6], [5, 4, 6], [5, 5, 6], [4, 6, 8], [4, 7, 8], [4, 8, 8], [4, 9, 8], [5, 10, 6], [5, 11, 6], [6, 12, 4]].forEach(([x, y, w]) => px(c, ox + x, oy + y, w, 1, P.cypress));
    [[7, 2, 1], [6, 4, 2], [6, 7, 1], [6, 9, 2]].forEach(([x, y, w]) => px(c, ox + x, oy + y, w, 1, P.cypress2));
    [[9, 5, 2], [9, 8, 3], [8, 11, 3]].forEach(([x, y, w]) => px(c, ox + x, oy + y, w, 1, P.cypress3));
    return;
  }
  // olive: gnarled trunk, silvery canopy
  px(c, ox + 3, oy + 13, 10, 2, 'rgba(0,0,0,.16)');
  px(c, ox + 7, oy + 9, 2, 6, P.trunk); px(c, ox + 6, oy + 12, 1, 3, P.trunk); px(c, ox + 9, oy + 10, 1, 2, P.trunk);
  [[4, 1, 8], [2, 2, 12], [1, 3, 14], [1, 4, 14], [2, 5, 12], [1, 6, 14], [2, 7, 12], [4, 8, 8]].forEach(([x, y, w]) => px(c, ox + x, oy + y, w, 1, P.leaf));
  [[4, 2, 3], [2, 4, 3], [9, 3, 3], [5, 6, 2], [11, 6, 2]].forEach(([x, y, w]) => px(c, ox + x, oy + y, w, 1, P.leaf2));
  [[7, 7, 4], [3, 7, 2], [12, 4, 2]].forEach(([x, y, w]) => px(c, ox + x, oy + y, w, 1, P.leaf3));
}
function paintIce(c, ox, oy, tx, ty) {
  px(c, ox, oy, 16, 16, P.ice);
  for (let i = 0; i < 3; i++) px(c, ox + ((hash(tx, ty, i) * 14) | 0), oy + ((hash(ty, tx, i) * 14) | 0), 1, 1, '#c8915a');
  px(c, ox, oy + 7, 16, 1, P.ice2); // lane line
  if (tx === RINK.x + 4) px(c, ox + 7, oy, 2, 16, 'rgba(246,239,226,.55)');
}
function paintBoard(c, ox, oy, tx, ty) {
  px(c, ox, oy, 16, 16, P.board);
  const vertical = tx === RINK.x || tx === RINK.x + RINK.w - 1;
  if (vertical) { for (let x = 2; x < 16; x += 5) px(c, ox + x, oy, 1, 16, P.boardLine); }
  else { for (let y = 3; y < 16; y += 5) px(c, ox, oy + y, 16, 1, P.boardLine); }
  if (hash(tx, ty, 3) > .7) px(c, ox + 6, oy + 6, 2, 2, P.wall3);
}
function paintPier(c, ox, oy, tx, ty) {
  const on = (x, y) => PIER.some(([a, b]) => a === x && b === y);
  const left = on(tx - 1, ty), right = on(tx + 1, ty), end = !on(tx, ty + 1);
  const x0 = left ? 0 : 2, x1 = right ? 16 : 14;
  paintWater(c, ox, oy, tx, ty, 0);
  px(c, ox + x0, oy, x1 - x0, end ? 15 : 16, '#b8875a');
  for (let y = 3; y < 16; y += 4) px(c, ox + x0, oy + y, x1 - x0, 1, '#8e6440');   // boards laid across the dock
  if (!left) px(c, ox + 2, oy, 1, 16, '#8e6440');
  if (!right) px(c, ox + 13, oy, 1, 16, '#8e6440');
  if (end) { if (!left) px(c, ox + 2, oy + 13, 2, 3, '#6b4a2f'); if (!right) px(c, ox + 12, oy + 13, 2, 3, '#6b4a2f'); px(c, ox + 7, oy + 14, 2, 2, '#6b4a2f'); } // posts at the far end
}
function paintSign(c, ox, oy, tx, ty, grid) {
  const under = PIER.some(([x, y]) => x === tx && y === ty) ? 'pier' : grid[ty][tx - 1] === '=' || grid[ty][tx + 1] === '=' ? 'path' : 'grass';
  under === 'pier' ? paintPier(c, ox, oy, tx, ty) : ROWS[ty][tx] === 's' ? paintSand(c, ox, oy, tx, ty) : under === 'path' ? px(c, ox, oy, 16, 16, P.path) : paintGrass(c, ox, oy, tx, ty);
  px(c, ox + 3, oy + 14, 11, 2, 'rgba(0,0,0,.16)');
  if (SIGNS.find((s) => s.x === tx && s.y === ty)?.board) { // the request board: two posts, a wooden board, pinned notes
    px(c, ox + 2, oy + 9, 2, 6, P.trunk); px(c, ox + 12, oy + 9, 2, 6, P.trunk);
    px(c, ox + 1, oy + 1, 14, 10, P.door2); px(c, ox + 2, oy + 2, 12, 8, P.door);
    px(c, ox + 3, oy + 3, 4, 5, P.sign); px(c, ox + 8, oy + 3, 5, 3, P.flowerW); px(c, ox + 9, oy + 7, 3, 2, P.sign);
    px(c, ox + 4, oy + 3, 2, 1, P.flowerR); px(c, ox + 10, oy + 3, 1, 1, P.flowerR); px(c, ox + 10, oy + 7, 1, 1, P.flowerR);
    [5, 6].forEach((y) => px(c, ox + 4, oy + y, 2, 1, P.sign2)); px(c, ox + 9, oy + 4, 3, 1, P.sign2);
    return;
  }
  px(c, ox + 4, oy + 2, 8, 13, P.sign2);
  px(c, ox + 5, oy + 3, 6, 11, P.sign);
  px(c, ox + 4, oy + 1, 8, 2, P.sign2);
  [5, 7, 9].forEach((y) => px(c, ox + 6, oy + y, 4, 1, P.sign2));
}

/* ---------------- Buildings ---------------- */
function paintHouse(c, b) {
  const X = b.x * 16, Y = b.y * 16, Wd = b.w * 16, Ht = b.h * 16;
  const [roof, roof2] = b.roof.map((k) => P[k]);
  px(c, X + 4, Y + Ht - 2, Wd, 4, 'rgba(0,0,0,.15)');
  const rh = Math.round(Ht * .4);
  // low-pitched tiled roof
  for (let i = 0; i < rh; i++) { const inset = Math.max(0, 8 - i); px(c, X + inset, Y + 4 + i, Wd - inset * 2, 1, i % 4 === 3 ? roof2 : roof); }
  for (let x = X + 6; x < X + Wd - 6; x += 6) px(c, x, Y + 6, 1, rh - 4, roof2);
  px(c, X - 1, Y + 4 + rh, Wd + 2, 2, roof2);
  // walls
  px(c, X + 2, Y + rh + 6, Wd - 4, Ht - rh - 6, P.wall);
  px(c, X + 2, Y + Ht - 3, Wd - 4, 3, P.wall3);
  for (let x = X + 6; x < X + Wd - 4; x += 22) { px(c, x, Y + rh + 6, 3, Ht - rh - 9, P.col); px(c, x + 3, Y + rh + 6, 1, Ht - rh - 9, P.wall2); }
  const wy = Y + rh + 12;
  for (let wx = X + 12; wx < X + Wd - 16; wx += 22) { px(c, wx, wy, 8, 8, P.win); px(c, wx + 1, wy + 1, 3, 3, P.win2); }
  const DX = b.door[0] * 16, DY = Y + Ht - 16;
  if (b.pediment) { for (let i = 0; i < 6; i++) px(c, DX + 2 + i, DY - 6 + i, 12 - i * 2, 1, P.wall2); }
  px(c, DX + 3, DY, 10, 16, P.door2); px(c, DX + 4, DY + 1, 8, 15, P.door); px(c, DX + 10, DY + 8, 1, 2, P.flowerY);
}
function paintTemple(c, b) {
  const X = b.x * 16, Y = b.y * 16, Wd = b.w * 16, Ht = b.h * 16, cx = X + Wd / 2;
  px(c, X + 4, Y + Ht - 2, Wd, 4, 'rgba(0,0,0,.15)');
  // pediment (triangle) with a painted tympanum
  const pedTop = Y + 4, pedH = 22;
  for (let i = 0; i <= pedH; i++) { const half = Math.round((i / pedH) * (Wd / 2 - 4)); px(c, cx - half, pedTop + i, half * 2, 1, i < 2 ? P.wall2 : P.wall); }
  for (let i = 5; i <= pedH - 2; i++) { const half = Math.round((i / pedH) * (Wd / 2 - 12)); px(c, cx - half, pedTop + i, half * 2, 1, P.ped); }
  px(c, cx - 3, pedTop + 12, 6, 8, P.wall); px(c, cx - 1, pedTop + 9, 2, 3, P.wall); // statue of Athena, roughly
  px(c, cx - 2, pedTop - 3, 4, 3, P.ped2); px(c, X + 4, pedTop + pedH - 3, 4, 3, P.ped2); px(c, X + Wd - 8, pedTop + pedH - 3, 4, 3, P.ped2);
  // entablature with triglyphs
  const ent = pedTop + pedH + 1;
  px(c, X + 2, ent, Wd - 4, 9, P.wall2);
  px(c, X + 2, ent, Wd - 4, 2, P.wall3);
  for (let x = X + 6; x < X + Wd - 6; x += 9) px(c, x, ent + 3, 3, 5, P.ped);
  // columns (Doric, fluted) over a dark cella
  const colTop = ent + 9, colBot = Y + Ht - 8;
  px(c, X + 6, colTop, Wd - 12, colBot - colTop, '#6d6250');
  const n = 8, step = (Wd - 20) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x0 = Math.round(X + 10 + i * step) - 4;
    px(c, x0 - 1, colTop, 10, 2, P.wall2);
    px(c, x0, colTop + 2, 8, colBot - colTop - 2, P.col);
    px(c, x0 + 2, colTop + 2, 1, colBot - colTop - 2, P.wall2); px(c, x0 + 5, colTop + 2, 1, colBot - colTop - 2, P.wall2); px(c, x0 + 7, colTop + 2, 1, colBot - colTop - 2, P.wall3);
  }
  // stylobate steps
  px(c, X + 4, Y + Ht - 8, Wd - 8, 3, P.wall); px(c, X + 2, Y + Ht - 5, Wd - 4, 3, P.wall2); px(c, X, Y + Ht - 2, Wd, 2, P.wall3);
  // doorway between the middle columns
  const DX = b.door[0] * 16;
  px(c, DX + 10, colTop + 14, 12, colBot - colTop - 14, P.door2); px(c, DX + 11, colTop + 15, 10, colBot - colTop - 15, P.door);
}

function paintStall(c) {
  const X = STALL.x * 16, Y = STALL.y * 16, Wd = STALL.w * 16;
  px(c, X + 2, Y + 14, Wd - 2, 3, 'rgba(0,0,0,.16)');
  px(c, X + 2, Y + 3, 2, 12, '#7a5a3a'); px(c, X + Wd - 4, Y + 3, 2, 12, '#7a5a3a');
  for (let i = 0; i < Wd; i += 6) px(c, X + i, Y - 4, 6, 7, (i / 6) % 2 ? '#f4efe4' : '#c8643c');
  for (let i = 0; i < Wd; i += 6) px(c, X + i + 1, Y + 3, 4, 2, (i / 6) % 2 ? '#f4efe4' : '#c8643c');
  px(c, X + 1, Y + 9, Wd - 2, 6, '#9a6a3a'); px(c, X + 1, Y + 9, Wd - 2, 1, '#b8844e');
  [['#6b3fa0', 6], ['#a31f34', 13], ['#f3d36b', 20], ['#00539b', 27], ['#4f8f3a', 34], ['#c8913a', 40]].forEach(([col, dx]) => { px(c, X + dx, Y + 6, 4, 4, col); px(c, X + dx + 1, Y + 5, 2, 1, col); });
}

// Demetrios' farm stall: a green awning over baskets of produce.
function paintFarmStall(c) {
  const X = FARM_STALL.x * 16, Y = FARM_STALL.y * 16, Wd = FARM_STALL.w * 16;
  px(c, X + 2, Y + 14, Wd - 2, 3, 'rgba(0,0,0,.16)');
  px(c, X + 2, Y + 3, 2, 12, '#7a5a3a'); px(c, X + Wd - 4, Y + 3, 2, 12, '#7a5a3a');
  for (let i = 0; i < Wd; i += 6) px(c, X + i, Y - 4, 6, 7, (i / 6) % 2 ? '#f4efe4' : '#4f8f3a');
  for (let i = 0; i < Wd; i += 6) px(c, X + i + 1, Y + 3, 4, 2, (i / 6) % 2 ? '#f4efe4' : '#4f8f3a');
  px(c, X + 1, Y + 9, Wd - 2, 6, '#9a6a3a'); px(c, X + 1, Y + 9, Wd - 2, 1, '#b8844e');
  // baskets: radishes, wheat, grapes, olives
  [[4, '#c0303f', '#4f8f3a'], [15, '#e0b44c', '#c8913a'], [26, '#6b3fa0', '#4a2a6b'], [37, '#4f6b2f', '#2f4a1f']].forEach(([dx, a, b]) => {
    px(c, X + dx, Y + 7, 7, 3, '#7a5a3a'); px(c, X + dx + 1, Y + 5, 5, 2, a); px(c, X + dx + 2, Y + 4, 2, 1, b); px(c, X + dx + 4, Y + 5, 1, 1, b);
  });
}
function paintWell(c, ox, oy, tx, ty) {
  paintGrass(c, ox, oy, tx, ty);
  px(c, ox + 2, oy + 13, 12, 3, 'rgba(0,0,0,.16)');
  px(c, ox + 2, oy + 7, 12, 7, P.wall3); px(c, ox + 3, oy + 7, 10, 6, P.wall2);
  px(c, ox + 4, oy + 6, 8, 3, '#2f6aa0'); px(c, ox + 5, oy + 7, 3, 1, P.water2);
  px(c, ox + 2, oy + 1, 2, 7, P.trunk); px(c, ox + 12, oy + 1, 2, 7, P.trunk); px(c, ox + 2, oy + 1, 12, 2, P.door);
  px(c, ox + 7, oy + 3, 2, 3, '#8a5a34');
}

/* ---------------- Farm plots: wild, soil, and crops at each stage (32x32, one plot covers 2x2 tiles) ---------------- */
const plotCache = new Map();
const CROP_INK = {
  leaf: '#4f8f3a', leafHi: '#7cbf5a', leafDk: '#356b28', radish: '#d23a5a', radishHi: '#f08aa0', root: '#f4efe2',
  wheat: '#d9a83c', wheatHi: '#f2cf6a', wheatDk: '#a87a24', stalk: '#6f9a3a', grape: '#6b3fa0', grapeHi: '#9a6ad0', grapeDk: '#4a2a6b',
  olive: '#8fa66b', oliveHi: '#b6c78e', oliveDk: '#5f7445', fruit: '#3a2f4a', wood: '#7a5a3a', woodHi: '#9c7650', post: '#b08a5a',
};
function blob(c, cx, cy, rx, ry, color) { // a filled oval, pixel by pixel
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    if (((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1) px(c, x, y, 1, 1, color);
  }
}
const K = CROP_INK;
const CROP_ART = {
  radish(c, stage) { // leafy rosettes; the red roots push up out of the soil when ripe
    [[9, 13], [23, 13], [9, 27], [23, 27]].forEach(([x, y]) => {
      if (stage === 'sprout') { px(c, x - 3, y - 3, 3, 2, K.leafHi); px(c, x + 1, y - 3, 3, 2, K.leafHi); px(c, x, y - 2, 1, 2, K.leaf); return; }
      const t = stage === 'ready' ? 2 : 0; // three leaves fanning out of the crown, each with a pale midrib
      blob(c, x - 3.5, y - 5 - t, 2.2, 3.2, K.leafDk); blob(c, x + 4.5, y - 5 - t, 2.2, 3.2, K.leafDk); blob(c, x + .5, y - 7 - t, 2.4, 3.6, K.leaf);
      px(c, x - 4, y - 7 - t, 1, 4, K.leafHi); px(c, x + 4, y - 7 - t, 1, 4, K.leafHi); px(c, x, y - 10 - t, 1, 6, K.leafHi);
      px(c, x - 2, y - 2 - t, 1, 2, K.leaf); px(c, x + 2, y - 2 - t, 1, 2, K.leaf); px(c, x, y - 3 - t, 1, 3, K.leaf);
      if (stage === 'grow') { px(c, x - 1, y - 1, 3, 1, K.radish); px(c, x, y - 2, 1, 1, K.radish); return; }
      px(c, x - 3, y - 3, 7, 5, K.radish); px(c, x - 2, y - 4, 5, 1, K.radish); px(c, x - 2, y + 2, 5, 1, K.radish); px(c, x - 2, y - 2, 2, 2, K.radishHi); px(c, x, y + 3, 1, 2, K.root);
    });
  },
  wheat(c, stage) { // two rows of stalks: short green blades, then tall green, then golden heads
    [16, 29].forEach((base) => {
      for (let i = 0, x = 4; x <= 27; x += 3, i++) {
        const h = stage === 'sprout' ? 3 : 7 + (i % 3 === 1 ? 2 : i % 3 === 2 ? 1 : 0); // uneven heights, like a real field
        px(c, x, base - h, 1, h, stage === 'ready' ? K.wheatDk : K.stalk);
        if (stage === 'sprout') { px(c, x + 1, base - 2, 1, 2, K.leafHi); continue; }
        px(c, x + 1, base - 4, 1, 2, K.leafHi); px(c, x - 1, base - 6, 1, 2, K.leafHi);
        const [main, hi, dk] = stage === 'ready' ? [K.wheat, K.wheatHi, K.wheatDk] : [K.leaf, K.leafHi, K.leafDk];
        const top = base - h - 5, lean = stage === 'ready' ? 1 : 0; // a narrow ear of grain, nodding when ripe
        px(c, x + lean, top - 1, 1, 1, hi); px(c, x - 1 + lean, top, 2, 5, main); px(c, x - 1 + lean, top, 1, 1, hi); px(c, x + lean, top + 2, 1, 1, dk); px(c, x - 1 + lean, top + 4, 1, 1, dk);
        if (stage === 'ready') px(c, x + 1 + lean, top - 2, 1, 2, hi); // whiskers
      }
    });
  },
  grapes(c, stage) { // two trellis rows on posts; leafy vines, then hanging purple bunches
    [4, 18].forEach((top) => {
      px(c, 3, top, 2, 11, K.post); px(c, 27, top, 2, 11, K.post); px(c, 3, top + 1, 26, 1, K.wood);
      if (stage === 'sprout') { [7, 15, 23].forEach((x) => { px(c, x, top + 6, 1, 5, K.leaf); px(c, x + 1, top + 5, 2, 2, K.leafHi); }); return; }
      for (let x = 5; x < 27; x += 4) { blob(c, x + 1.5, top + 3.5, 2.6, 2.4, K.leaf); px(c, x, top + 2, 2, 1, K.leafHi); }
      [8, 16, 24].forEach((x) => px(c, x, top + 5, 1, 6, K.wood));
      if (stage === 'grow') { [10, 20].forEach((x) => { px(c, x, top + 6, 2, 2, K.leafHi); px(c, x + 1, top + 8, 1, 1, K.leafHi); }); return; }
      [9, 19].forEach((x) => {
        px(c, x - 1, top + 5, 5, 2, K.grape); px(c, x, top + 7, 4, 2, K.grape); px(c, x + 1, top + 9, 2, 1, K.grape); px(c, x + 1, top + 10, 1, 1, K.grapeDk);
        px(c, x - 1, top + 5, 1, 1, K.grapeHi); px(c, x + 1, top + 6, 1, 1, K.grapeHi); px(c, x + 3, top + 6, 1, 1, K.grapeDk); px(c, x + 2, top + 8, 1, 1, K.grapeDk);
      });
    });
  },
  olives(c, stage) { // one olive tree per plot: a staked sapling, a young tree, then a full silvery tree hung with olives
    if (stage === 'sprout') {
      px(c, 18, 8, 1, 20, K.post); px(c, 15, 16, 1, 12, K.wood); px(c, 15, 20, 4, 1, K.wood);
      [[12, 15], [16, 13], [13, 19], [16, 18]].forEach(([x, y]) => { px(c, x, y, 3, 2, K.olive); px(c, x, y, 1, 1, K.oliveHi); });
      return;
    }
    const big = stage === 'ready';
    px(c, 14, 19, 4, 9, K.wood); px(c, 13, 26, 6, 2, K.wood); px(c, 15, 20, 1, 6, K.woodHi); px(c, 12, 18, 3, 2, K.wood); px(c, 17, 17, 3, 2, K.wood);
    const [rx, ry, cy] = big ? [13, 9, 11] : [9, 7, 12];
    blob(c, 16, cy + 1, rx, ry, K.oliveDk); blob(c, 16, cy, rx - 1, ry - 1, K.olive); blob(c, 13, cy - 2, rx / 2, ry / 2, K.oliveHi);
    [[8, 4], [20, 3], [24, 9], [11, 10], [6, 9]].forEach(([x, y]) => { if (big || (x > 8 && x < 24)) px(c, x, y + (big ? 0 : 3), 2, 1, K.oliveDk); });
    if (big) [[9, 8], [14, 5], [20, 7], [24, 12], [17, 13], [11, 13], [22, 4], [6, 12]].forEach(([x, y]) => { px(c, x, y, 2, 3, K.fruit); px(c, x, y, 1, 1, '#6a5a80'); });
  },
};
const sparkle = (c) => { px(c, 27, 1, 1, 5, '#f6d24a'); px(c, 25, 3, 5, 1, '#f6d24a'); px(c, 27, 3, 1, 1, '#fff6c8'); }; // ready to collect
export function plotCanvas(key) { // 'wild', 'soil', or `${crop}:${stage}` (stage: sprout, grow, ready), plus '-wet' for watered soil
  if (plotCache.has(key)) return plotCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const c = cv.getContext('2d');
  if (key === 'wild') { // an overgrown patch marked out with corner stakes, and a "for sale" sign
    px(c, 1, 1, 30, 30, P.grass3);
    [[3, 8], [7, 20], [11, 5], [15, 26], [20, 12], [24, 22], [27, 6], [5, 28], [13, 16], [26, 28], [18, 3], [22, 17]].forEach(([x, y]) => { px(c, x, y, 1, 3, P.tuft); px(c, x + 1, y - 1, 1, 4, P.tuft); px(c, x + 2, y + 1, 1, 2, P.tuft); });
    [[1, 1], [29, 1], [1, 27], [29, 27]].forEach(([x, y]) => { px(c, x, y, 2, 4, K.wood); px(c, x, y, 2, 1, K.woodHi); });
    px(c, 15, 12, 2, 12, K.wood); px(c, 9, 6, 14, 8, '#e9e2d2'); px(c, 9, 13, 14, 1, '#a89a80'); px(c, 9, 6, 14, 1, '#fffaf0');
    px(c, 12, 8, 8, 3, '#c0303f'); px(c, 11, 9, 1, 1, '#c0303f'); px(c, 20, 9, 1, 1, '#c0303f');
  } else {
    const wet = key.endsWith('-wet'), [crop, stage] = key.replace('-wet', '').split(':');
    const soil = wet ? '#5e3c22' : '#8a5a34', furrow = wet ? '#45291a' : '#6e4626', ridge = wet ? '#6e4a2c' : '#a06c40';
    px(c, 0, 0, 32, 32, K.wood); px(c, 0, 0, 32, 1, K.woodHi); px(c, 0, 0, 1, 32, K.woodHi); // a low wooden frame: a raised bed
    px(c, 2, 2, 28, 28, soil);
    for (let y = 5; y < 30; y += 7) { px(c, 3, y, 26, 1, furrow); px(c, 3, y - 1, 26, 1, ridge); }
    if (CROP_ART[crop]) CROP_ART[crop](c, stage);
    if (stage === 'ready') sparkle(c);
    else if (!wet) { // a water drop in the corner: this crop is dry and would grow faster with water
      px(c, 3, 1, 1, 1, '#2f6fae'); px(c, 2, 2, 3, 1, '#2f6fae'); px(c, 1, 3, 5, 3, '#2f6fae'); px(c, 2, 6, 3, 1, '#2f6fae');
      px(c, 3, 2, 1, 1, '#7cc4f2'); px(c, 2, 3, 3, 3, '#5aa9e6'); px(c, 2, 3, 1, 2, '#bfe4fa');
    }
  }
  plotCache.set(key, cv);
  return cv;
}

/* ---------------- Sprites (16x16 pixel strings) ---------------- */
const BODY_LOWER = {
  down: ['...orrrrrrrro...', '..orrrRrrRrrro..', '..osrrrrrrrrso..', '..ooRRRRRRRRoo..', '...oppppppppo...'],
  side: ['....orrrrrro....', '...orrrRrrro....', '...orsrrrrro....', '...oRRRRRRRo....', '....oppppppo....'],
};
const LEGS = {
  down: [['...oppo..oppo...', '...obbo..obbo...'], ['....opo..oppo...', '....obo..obbo...'], ['...oppo..opo....', '...obbo..obo....']],
  side: [['....oppoopo.....', '....obbo.obo....'], ['....opooppo.....', '....obo.obbo....'], ['.....oppo.......', '.....obbo.......']],
};
const HEAD = {
  down: ['....oooooooo....', '...ohhhhhhhho...', '..ohhhHHhhhhho..', '..ohhHhhhhhhho..', '..ohssssssssho..', '..ohsessssesho..', '..ohksssssskho..', '..hosssmmsssoh..', '...hooSSSSooh...'],
  up: ['....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhhHhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..hohhhhhhhhoh..', '...hooSSSSooh...'],
  beard: ['....oooooooo....', '...ohhhhhhhho...', '..ohhhHHhhhhho..', '..ohhHhhhhhhho..', '..ohssssssssho..', '..ohsessssesho..', '..ohhhssssshho..', '..hohhhmmhhhoh..', '...hohhhhhhoh...'],
  left: ['....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhHHho..', '..ohhhhhhhhhho..', '..ossssshhhhho..', '..osessshhhhho..', '..oksssshhhhho..', '...osmsssohhh...', '....ooSSoohh....'],
};
function personFrames(dir, step, bearded = false) {
  const head = bearded && dir === 'down' ? HEAD.beard : dir === 'right' ? HEAD.left : HEAD[dir];
  const lower = dir === 'left' || dir === 'right' ? BODY_LOWER.side : BODY_LOWER.down;
  const legs = (dir === 'left' || dir === 'right' ? LEGS.side : LEGS.down)[step];
  // 9 head rows + 5 body rows + 2 leg rows = 16
  return [...head, ...lower, ...legs];
}
const OWL = ['................', '...oo......oo...', '...ofo....ofo...', '..offffffffffo..', '..offeeffeeffo..', '..ofekeffekefo..', '..offeeffeeffo..', '..offffbbffffo..', '...offfbbfffo...', '..offllllllffo..', '..ofllFllFllfo..', '..ofllllllllfo..', '..ofFllFllFlfo..', '...offllllffo...', '....otto.otto...', '..wwwwwwwwwwww..'];
const BIRD = ['................', '................', '................', '......ooo.......', '.....obbbo......', '.....obebbo.....', '....okbbbbo.....', '.....obbrroo....', '....obbrrrbbo...', '....obrrrrbbbo..', '....obwwwrbbbbo.', '.....owwwwbboo..', '.....ooooooo....', '......t...t.....', '................', '................'];
const pad16 = (rows) => rows.map((r) => (r + '................').slice(0, 16));
const CAT = pad16(['................', '................', '...o........o...', '...oo......oo...', '...ocooooooco...', '...occcccccco...', '...ocecccceco...', '...occcnnccco...', '...owccccccwo...', '....oowwwwoo....', '..occccwwcccco..', '..occCcwwcCcco.o', '..occcccccccocC.', '..occCccccCccoC.', '..owwoccccowwo..', '...oo.oooo.oo...']);
const SOCRATES_HEAD = ['....oooooooo....', '...osssssssso...', '..osssssssssso..', '..ossSssssSsso..', '..osssssssssso..', '..ossessssesso..', '..ogssssssssgo..', '..oggggmmggggo..', '...oggggggggo...'];
const SANDAL = pad16(['................', '................', '................', '................', '................', '...........y....', '..........yyy...', '...........y....', '................', '....oooooo......', '...obbbbbbo.....', '...obBbbBbbo....', '...obbbbbbbo....', '....ooooooo.....', '................', '................']);
const BEAVER = ['................', '....oo....oo....', '...ouuuuuuuuo...', '..ouuuuuuuuuuo..', '..ouueuuuueuuo..', '..ouuuulluuuuo..', '..ouuulnnluuuo..', '..ouuuuwwuuuuo..', '...ouuuuuuuuo...', '..ouullllllluo..', '.ouuullllllluuo.', '.ouuullllllluuo.', '..ouulllllluuo..', '...ouuuuuuuuoUU.', '...ouo....ouoUUU', '...ooo....oooUU.'];
const HAT = ['........oo......', '.......oAo......', '......oaAo......', '......oaao......', '.....oafaao.....', '.....oaaAao.....', '....oaAAaaao....', '....oafaaaAo....', '...oaaeaaeaao...', '..oaaaAAAAaaao..', '.oaaaaaaaaaaaao.', 'oooooooooooooooo', '...okkkkkkkko...', '....oKo..oKo....', '....oKo..oKo....', '....ooo..ooo....'];

const YARN = pad16(['................', '................', '................', '................', '...........y....', '..........yyy...', '...........y....', '.....oooo.......', '....orrRro......', '...orRrrRro.....', '...orrRrrro.....', '...oRrrRrro.....', '....orrrRo.r....', '.....oooo..r....', '................', '................']);
const FEATHER = pad16(['................', '................', '................', '................', '...........y....', '..........yyy...', '...........y....', '.........oo.....', '........ollo....', '.......ollfo....', '......ollfo.....', '.....ollfo......', '....olffo.......', '...ooqo.........', '..q.............', '................']);
const PURSE = pad16(['................', '................', '................', '................', '...........y....', '..........yyy...', '......t....y....', '.....ooo........', '....oyyyo.......', '...obbbbbo......', '..obbBbbbbo.....', '..obbbbbBbo.....', '..obbbbbbbo.....', '...ooooooo......', '................', '................']);
const STYLUS = pad16(['................', '................', '................', '................', '...........y....', '..........yyy...', '...........y....', '.........oo.....', '........obbo....', '.......obbo.....', '......obbo......', '.....obbo.......', '....obbo........', '...oBbo.........', '...ooo..........', '................']);
const COMPASS = pad16(['................', '................', '................', '................', '...........y....', '..........yyy...', '...........y....', '.....ooooo......', '....owwrwwo.....', '...owwwrwwwo....', '...owwwkwwwo....', '...owwwkwwwo....', '....owwwwwo.....', '.....ooooo......', '................', '................']);

const PALETTES = {
  yarn: { o: '#2a2f3d', r: '#d9423b', R: '#a8302c', y: '#f6d24a' },
  feather: { o: '#2a2f3d', l: '#c9c3b6', f: '#8e8778', q: '#6e6658', y: '#f6d24a' },
  purse: { o: '#3a2a1c', b: '#8a5a34', B: '#6e4a26', y: '#f6d24a', t: '#f6d24a' },
  compass: { o: '#5a412a', w: '#f6efe2', r: '#d9423b', k: '#2a2f3d', y: '#f6d24a' },
  farmer: { o: '#2a2f3d', h: '#d9b56a', H: '#efd08a', s: '#d9a07a', S: '#bf8660', e: '#2a2f3d', k: '#e09080', m: '#9a4a36', r: '#4f8f3a', R: '#f4efe4', p: '#3d6b2c', b: '#6b4a2f' },
  stylus: { o: '#5a412a', b: '#d9a441', B: '#a8762f', y: '#f6d24a' },
  student: { o: '#2a2f3d', h: '#3a2a1c', H: '#5a412a', s: '#f0c49c', S: '#d6a47c', e: '#2a2f3d', k: '#e9a090', m: '#a0503a', r: '#9fb3c8', R: '#6b7f96', p: '#8ba0b6', b: '#7a5a3a' },
  keeper: { o: '#2a2f3d', h: '#7a3a1a', H: '#9a5a2a', s: '#d9a07a', S: '#bf8660', e: '#2a2f3d', k: '#e09080', m: '#9a4a36', r: '#6b8f4e', R: '#e0b44c', p: '#567a3c', b: '#7a5a3a' },
  captain: { o: '#2a2f3d', h: '#3a2a1c', H: '#5a412a', s: '#c98d64', S: '#ab7350', e: '#2a2f3d', k: '#d98a78', m: '#8a4a32', r: '#2f5a8c', R: '#f6f2e8', p: '#24466d', b: '#6b4a2f' },
  hannah: { o: '#2a2f3d', h: '#6b3f24', H: '#8f5a35', s: '#f6c9a4', S: '#e2a985', e: '#2a2f3d', k: '#f2a6a0', m: '#c0604a', r: '#f6f2e8', R: '#c8643c', p: '#ebe4d4', b: '#8a5a34' },
  recruiter: { o: '#2a2f3d', h: '#3b3b44', H: '#55555f', s: '#e9b48c', S: '#cf9a74', e: '#2a2f3d', k: '#e9a090', m: '#a0503a', r: '#2b3652', R: '#1c2438', p: '#1c2438', b: '#1b1b1b' },
  runner: { o: '#2a2f3d', h: '#2f2219', H: '#4a3626', s: '#e2a67c', S: '#c88b62', e: '#2a2f3d', k: '#e9a090', m: '#a0503a', r: '#c8643c', R: '#9e4a2a', p: '#e2a67c', b: '#7a5a3a' },
  socrates: { o: '#2a2f3d', h: '#d9d4c9', H: '#eeeae2', s: '#e9b48c', S: '#d39b74', e: '#2a2f3d', k: '#eaa49a', m: '#a8583f', g: '#d7d2c8', r: '#8a7b62', R: '#6b5e48', p: '#8a7b62', b: '#e9b48c' },
  cat: { o: '#2a2f3d', c: '#e39a46', C: '#b86d2a', w: '#fbf5ea', e: '#2a2f3d', n: '#e88a8a' },
  sandal: { o: '#3a2a1c', b: '#a8743f', B: '#6e4a26', y: '#f6d24a' },
  merchant: { o: '#2a2f3d', h: '#b8442e', H: '#d9603f', s: '#d9a07a', S: '#bf8660', e: '#2a2f3d', k: '#e09080', m: '#9a4a36', r: '#3d6fa8', R: '#e0b44c', p: '#2f5a8c', b: '#7a5a3a' },
  birdpet: { o: '#2a2f3d', b: '#3d78c4', e: '#1b1b1b', k: '#e0a030', r: '#f08a3c', w: '#f6efe2', t: '#e0a030' },
  owlpet: { o: '#2a2f3d', f: '#9a7a52', F: '#6e5638', l: '#e3d2a8', e: '#f2c94c', k: '#2a2f3d', b: '#d9932a', t: '#d9932a', w: '#7a5a3a' },
  plato: { o: '#2a2f3d', h: '#e9e6de', H: '#ffffff', s: '#efc29c', S: '#d6a47c', e: '#2a2f3d', k: '#eaa49a', m: '#b06a5a', r: '#3d5a8a', R: '#2c4266', p: '#3d5a8a', b: '#7a5a3a' },
  owl: { o: '#2a2f3d', f: '#9a7a52', F: '#6e5638', l: '#e3d2a8', e: '#f2c94c', k: '#2a2f3d', b: '#d9932a', t: '#d9932a', w: '#7a5a3a' },
  beaver: { o: '#2a2f3d', u: '#8a5a34', U: '#5f3d22', e: '#2a2f3d', l: '#c48d5c', n: '#2a2f3d', w: '#fbfaf2' },
  hat: { o: '#2a2f3d', a: '#7a5b3a', A: '#523c25', f: '#9a7a52', e: '#2a2f3d', k: '#a8743f', K: '#6f4a28' },
};

function paintSprite(c, rows, pal, ox, oy, flip = false) {
  rows.forEach((row, y) => {
    if (row.length !== 16 && !paintSprite.warned) { paintSprite.warned = true; console.warn('sprite row length', row.length, row); }
    for (let x = 0; x < 16; x++) {
      const ch = row[flip ? 15 - x : x];
      if (!ch || ch === '.') continue;
      const col = pal[ch];
      if (col) { c.fillStyle = col; c.fillRect(ox + x, oy + y, 1, 1); }
    }
  });
}

const spriteCache = new Map();
export function spriteCanvas(kind, dir = 'down', step = 0) {
  const key = `${kind}:${dir}:${step}`;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const c = cv.getContext('2d');
  if (kind === 'owl') paintSprite(c, OWL, PALETTES.owl, 0, 0);
  else if (kind === 'cat') paintSprite(c, CAT, PALETTES.cat, 0, 0, dir === 'right');
  else if (kind === 'owlpet') paintSprite(c, OWL.slice(0, 15), PALETTES.owlpet, 0, 1);
  else if (kind === 'birdpet') paintSprite(c, BIRD, PALETTES.birdpet, 0, 0, dir === 'right');
  else if (kind.startsWith('hatch:')) c.drawImage(creatureCanvas(kind.slice(6), dir === 'right' ? 'right' : 'left'), 0, 0);
  else if (kind === 'sandal') paintSprite(c, SANDAL, PALETTES.sandal, 0, 0);
  else if (kind === 'yarn') paintSprite(c, YARN, PALETTES.yarn, 0, 0);
  else if (kind === 'feather') paintSprite(c, FEATHER, PALETTES.feather, 0, 0);
  else if (kind === 'purse') paintSprite(c, PURSE, PALETTES.purse, 0, 0);
  else if (kind === 'compass') paintSprite(c, COMPASS, PALETTES.compass, 0, 0);
  else if (kind === 'stylus') paintSprite(c, STYLUS, PALETTES.stylus, 0, 0);
  else if (kind === 'socrates') paintSprite(c, [...pad16(SOCRATES_HEAD), ...BODY_LOWER.down, ...LEGS.down[0]], PALETTES.socrates, 0, 0);
  else if (kind === 'beaver') paintSprite(c, BEAVER, PALETTES.beaver, 0, 0, dir === 'right');
  else if (kind === 'hat') paintSprite(c, HAT, PALETTES.hat, 0, 0);
  else paintSprite(c, personFrames(dir, step, kind === 'plato'), PALETTES[kind] || PALETTES.hannah, 0, 0, dir === 'right');
  spriteCache.set(key, cv);
  return cv;
}

/* ---------------- Static world render ---------------- */
export function renderWorld(grid) {
  const cv = document.createElement('canvas'); cv.width = W * 16; cv.height = H * 16;
  const c = cv.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = ROWS[y][x], ox = x * 16, oy = y * 16;
    const g = grid[y][x];
    if (g === 'd') paintPier(c, ox, oy, x, y);
    else if (g === 'w') paintWell(c, ox, oy, x, y);
    else if (g === 'p') paintGrass(c, ox, oy, x, y); // plots are drawn live in play.js: wild grass, soil, or crops
    else if (g === 'i') paintIce(c, ox, oy, x, y);
    else if (g === 'b') paintBoard(c, ox, oy, x, y);
    else if (g === 'S') paintSign(c, ox, oy, x, y, grid);
    else if (ch === 'T') paintTree(c, ox, oy, x, y);
    else if (ch === '=') paintPath(c, ox, oy, x, y, grid);
    else if (ch === ',') paintTuft(c, ox, oy, x, y);
    else if (ch === '*') paintFlowers(c, ox, oy, x, y);
    else if (ch === 's') paintSand(c, ox, oy, x, y);
    else if (ch === '~') paintWater(c, ox, oy, x, y, 0);
    else paintGrass(c, ox, oy, x, y);
  }
  for (const b of BUILDINGS) b.kind === 'temple' ? paintTemple(c, b) : paintHouse(c, b);
  paintStall(c);
  paintFarmStall(c);
  return cv;
}

/* ---------------- Homepage preview ---------------- */
export function drawPreview(canvas) {
  const grid = buildGrid();
  const world = renderWorld(grid);
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  // crop around the Dome and the main path
  const sx = 9 * 16, sy = 1 * 16, sw = canvas.width, sh = canvas.height;
  c.drawImage(world, sx, sy, sw, sh, 0, 0, sw, sh);
  const put = (kind, dir, tx, ty) => c.drawImage(spriteCanvas(kind, dir, 0), tx * 16 - sx, ty * 16 - sy - 4);
  put('hannah', 'up', 17, 9);
  put('hat', 'down', 15, 10);
  put('owl', 'down', 21, 10);
}

/* ---------------- Wardrobe: outfits, headwear, and gadgets sold at the Agora market ---------------- */
export const ITEMS = [
  { id: 'chiton', slot: 'outfit', name: 'Classic chiton', price: 0, desc: 'The white linen you arrived in.' },
  { id: 'mit', slot: 'outfit', name: 'MIT sweatshirt', price: 500, desc: 'Cardinal red. Wildly anachronistic.', pal: { r: '#a31f34', R: '#8a8b8c', p: '#2c3e63', b: '#3a3030' } },
  { id: 'olympic', slot: 'outfit', name: "Olympic victor's robe", price: 600, desc: 'Gold trim, for people who win things.', pal: { r: '#f3d36b', R: '#b8862e', p: '#f6f2e8', b: '#8a5a34' } },
  { id: 'purple', slot: 'outfit', name: 'Tyrian purple himation', price: 700, desc: 'The most expensive dye in the ancient world. Now 700 coins.', pal: { r: '#6b3fa0', R: '#e0b44c', p: '#56328a', b: '#8a5a34' } },
  { id: 'islanders', slot: 'outfit', name: 'Islanders jersey', price: 800, desc: 'A blue hockey sweater with orange and white stripes.', pal: { r: '#00539b', R: '#f47d30', p: '#1c2a48', b: '#e8e8ea' }, pattern: 'hockey' },
  { id: 'mets', slot: 'outfit', name: 'Mets jersey', price: 800, desc: 'White home pinstripes with blue and orange trim.', pal: { r: '#f7f7f4', R: '#002d72', p: '#f7f7f4', b: '#1b2233' }, pattern: 'pinstripe' },
  { id: 'superposition', slot: 'outfit', name: 'Superposition jersey', price: 1000, desc: 'Islanders and Mets at once, until you stop walking and it collapses into one.', split: ['islanders', 'mets'] },
  { id: 'gryffindor', slot: 'outfit', name: 'Gryffindor robes', price: 900, desc: 'Scarlet and gold. The hat on the stool would approve.', pal: { r: '#7d1424', R: '#e0b44c', p: '#2a2f3d', b: '#3a3030' } },
  { id: 'recital', slot: 'outfit', name: 'Recital dress', price: 750, desc: 'Black with silver trim, for playing Chopin in public.', pal: { r: '#1f2433', R: '#c4ccd6', p: '#1f2433', b: '#1b1b1b' } },
  { id: 'hivis', slot: 'outfit', name: 'Hi-vis vest', price: 600, desc: 'Found in the Machine Room. Nobody has asked for it back.', pal: { r: '#ff6a13', R: '#e8eef2', p: '#34495e', b: '#3a2a1c' } },
  { id: 'suit', slot: 'outfit', name: 'Trading floor suit', price: 850, desc: 'Navy pinstripes, for pricing options in the Agora.', pal: { r: '#22304a', R: '#d9e1ea', p: '#22304a', b: '#1b1b1b' }, pattern: 'pinstripe' },
  { id: 'labcoat', slot: 'outfit', name: 'Lab coat', price: 450, desc: "For running experiments in Plato's Academy.", pal: { r: '#f4f6f8', R: '#9aa7b6', p: '#2c3e63', b: '#3a3030' } },
  { id: 'sailor', slot: 'outfit', name: "Sailor's shirt", price: 650, desc: 'Navy and white stripes, for sailing to Egypt, or at least to Aegina.', pal: { r: '#f6f2e8', R: '#1f3a5f', p: '#1f3a5f', b: '#6b4a2f' }, pattern: 'stripes' },
  { id: 'petasos', slot: 'head', name: 'Petasos sun hat', price: 400, desc: 'The wide-brimmed traveler\'s hat of ancient Greece. Hermes wore one.' },
  { id: 'gradcap', slot: 'head', name: 'Graduation cap', price: 700, desc: 'For the M.Eng, May 2027.' },
  { id: 'helmet', slot: 'head', name: 'Corinthian helmet', price: 900, desc: 'Bronze, plumed, and very hard to hear through.' },
  { id: 'olive', slot: 'head', name: 'Olive wreath', price: 450, desc: 'The actual prize at the ancient Olympics.' },
  { id: 'headphones', slot: 'head', name: 'Headphones', price: 250, desc: 'For listening to "Vienna" on repeat.' },
  { id: 'wizardhat', slot: 'head', name: 'A suspiciously familiar hat', price: 750, desc: 'It looks a lot like the one on the stool. It insists it is not.' },
  { id: 'crown', slot: 'head', name: 'Golden crown', price: 1000, desc: 'Gold, jeweled, and very hard to justify.' },
  { id: 'hardhat', slot: 'head', name: 'Hard hat', price: 400, desc: 'Required in the Machine Room. Not provided.' },
  { id: 'flowercrown', slot: 'head', name: 'Flower crown', price: 350, desc: 'Picked from the Agora flower beds, with permission.' },
  { id: 'shades', slot: 'face', name: 'Sunglasses', price: 150, desc: 'The Mediterranean sun is no joke.' },
  { id: 'monocle', slot: 'face', name: 'Monocle', price: 200, desc: 'A gold-rimmed lens, for inspecting olives very closely.' },
  { id: 'lyre', slot: 'held', name: 'Lyre', price: 350, desc: 'Comes pre-tuned to "Vienna".' },
  { id: 'scroll', slot: 'held', name: 'Scroll', price: 200, desc: "Plato's Republic, slightly used." },
  { id: 'basketball', slot: 'held', name: 'Basketball', price: 300, desc: 'For a former varsity captain.' },
  { id: 'hockeystick', slot: 'held', name: 'Hockey stick', price: 450, desc: 'Taped in Islanders orange.' },
  { id: 'torch', slot: 'held', name: 'Olympic torch', price: 600, desc: 'The flame, briefly borrowed from Olympia.' },
  { id: 'knight', slot: 'held', name: 'Quantum knight', price: 800, desc: 'A chess knight that is probably in your hand.' },
  { id: 'quill', slot: 'held', name: 'Quill', price: 250, desc: 'For writing blog posts without AI.' },
  { id: 'compass', slot: 'held', name: "Euclid's compass", price: 450, desc: 'Draws perfect circles. Euclid would like it back.' },
  { id: 'coinflex', slot: 'held', name: 'Coin flex award', price: 100000, desc: 'A solid gold trophy for owning 100,000 coins at once. It does nothing else. That is the point.' },
  { id: 'owl', slot: 'companion', name: 'Owl companion', price: 1000, desc: 'A small owl of Athena that follows you everywhere.' },
  { id: 'catpet', slot: 'companion', name: 'Cat companion', price: 800, desc: 'The Agora cat, now yours. It still sits on coins.' },
  { id: 'birdpet', slot: 'companion', name: 'Bird companion', price: 900, desc: 'A small bluebird from the Machine Room aviary. It follows you around.' },
];
export const itemById = (id) => ITEMS.find((i) => i.id === id);

// Overlay painters. Coordinates are in the 16x16 body frame; y may go to -4 (the avatar canvas has 4px of headroom).
// Side views are authored facing left and mirrored for right.
const OVERLAYS = {
  laurel(put, dir) {
    for (let x = 3; x <= 12; x++) put(x, 1, x % 2 ? '#4f8f3a' : '#7cbf5a');
    put(4, 0, '#7cbf5a'); put(11, 0, '#7cbf5a'); put(2, 2, '#4f8f3a'); put(13, 2, '#4f8f3a');
    if (dir !== 'up') { put(7, 0, '#7cbf5a'); put(8, 0, '#4f8f3a'); }
  },
  gradcap(put, dir) {
    const D = '#1b2233', E = '#2e3a52', T = '#f2c94c';
    if (dir === 'left') {
      for (let x = 1; x <= 14; x++) put(x, -1, D);
      for (let x = 4; x <= 11; x++) put(x, 0, E);
      for (let y = -1; y <= 2; y++) put(13, y, T);
      return;
    }
    for (let x = 5; x <= 10; x++) put(x, -2, D);
    for (let x = 2; x <= 13; x++) put(x, -1, D);
    for (let x = 4; x <= 11; x++) put(x, 0, E);
    put(7, -2, T); put(8, -2, T);
    for (let y = -1; y <= 2; y++) put(13, y, T);
  },
  helmet(put, dir) {
    const B = '#c8913a', K = '#8a5a22', H = '#e8b866', P = '#c0303f', P2 = '#8e1f2c';
    const crest = dir === 'left' ? [4, 11] : [6, 9];
    for (let x = crest[0]; x <= crest[1]; x++) { put(x, -3, P2); put(x, -2, P); put(x, -1, P); }
    for (let y = 0; y <= 4; y++) for (let x = 3; x <= 12; x++) put(x, y, y === 0 || x === 3 || x === 12 ? K : B);
    for (let x = 5; x <= 10; x++) put(x, 1, H);
    if (dir === 'up') { for (let y = 5; y <= 7; y++) for (let x = 3; x <= 12; x++) put(x, y, x === 3 || x === 12 ? K : B); return; }
    if (dir === 'left') { for (let y = 5; y <= 7; y++) for (let x = 8; x <= 12; x++) put(x, y, x === 12 ? K : B); return; }
    for (let y = 5; y <= 7; y++) { put(3, y, K); put(4, y, B); put(11, y, B); put(12, y, K); }
    put(7, 5, B); put(8, 5, B); put(7, 6, K); put(8, 6, K);
  },
  hardhat(put, dir) {
    const Y = '#f5c518', D = '#c99a0c', L = '#ffe066';
    for (let x = 6; x <= 9; x++) put(x, -2, Y);
    for (let x = 5; x <= 10; x++) put(x, -1, x === 7 || x === 8 ? L : Y);
    for (let x = 4; x <= 11; x++) put(x, 0, Y);
    for (let x = 3; x <= 12; x++) put(x, 1, Y);
    const [b0, b1] = dir === 'left' ? [1, 12] : [2, 13];
    for (let x = b0; x <= b1; x++) put(x, 2, D);
  },
  flowercrown(put, dir) {
    for (let x = 3; x <= 12; x++) put(x, 1, x % 2 ? '#4f8f3a' : '#6cb653');
    const blooms = dir === 'up' ? [[5, '#f7a3b6'], [10, '#fbfaf2']] : [[4, '#f7a3b6'], [7, '#f2c94c'], [10, '#fbfaf2'], [12, '#f7a3b6']];
    for (const [x, c] of blooms) { put(x, 0, c); put(x - 1, 1, c); put(x + 1, 1, c); put(x, 1, '#f2c94c'); }
  },
  petasos(put, dir) { // low crown, very wide brim, a cord under the chin
    const S = '#d9b56a', D = '#a8823e', C = '#7a5a2a';
    for (let x = 6; x <= 9; x++) put(x, -2, S);
    for (let x = 5; x <= 10; x++) put(x, -1, x === 5 || x === 10 ? D : S);
    for (let x = 4; x <= 11; x++) put(x, 0, C);
    const [b0, b1] = dir === 'left' ? [0, 13] : [1, 14];
    for (let x = b0; x <= b1; x++) put(x, 1, x === b0 || x === b1 ? D : S);
    if (dir === 'down') { put(4, 8, C); put(11, 8, C); }
  },
  monocle(put, dir) { // one gold-rimmed lens on a little chain
    if (dir === 'up') return;
    const G = '#d9a441', g = '#a8772a', L = '#cfe3f2';
    const cx = dir === 'left' ? 4 : 10;
    for (let x = cx - 1; x <= cx + 1; x++) { put(x, 4, G); put(x, 6, G); }
    put(cx - 1, 5, G); put(cx + 1, 5, G); put(cx, 5, L);
    put(cx + 1, 7, g); put(cx + 2, 8, g); put(cx + 2, 9, g);
  },
  shades(put, dir) {
    if (dir === 'up') return;
    const G = '#151515', g = '#5a6478';
    if (dir === 'left') { for (let x = 3; x <= 9; x++) put(x, 5, x <= 5 ? G : '#2a2f3d'); put(4, 5, g); return; }
    for (let x = 4; x <= 11; x++) put(x, 5, G);
    put(5, 5, g); put(10, 5, g);
  },
  lyre(put, dir) {
    if (dir === 'up') return;
    const Y = '#d9a441', y2 = '#a8772a', W = '#fbfaf2';
    const x0 = dir === 'left' ? 1 : 12;
    for (let x = x0; x <= x0 + 3; x++) put(x, 8, y2);
    for (let y = 9; y <= 12; y++) { put(x0, y, Y); put(x0 + 3, y, Y); put(x0 + 1, y, W); put(x0 + 2, y, W); }
    put(x0 + 1, 13, Y); put(x0 + 2, 13, Y);
  },
};

Object.assign(OVERLAYS, {
  olive(put, dir) {
    for (let x = 3; x <= 12; x++) put(x, 1, x % 2 ? '#6f8240' : '#9fb06a');
    put(4, 0, '#9fb06a'); put(11, 0, '#9fb06a'); put(2, 2, '#6f8240'); put(13, 2, '#6f8240');
    put(5, 2, '#3a3f2a'); put(10, 2, '#3a3f2a');
  },
  headphones(put, dir) {
    const D = '#2a2f3d', C = '#c0303f', c = '#e0414f';
    if (dir === 'left') {
      for (let x = 5; x <= 10; x++) put(x, 0, D);
      for (let y = 3; y <= 6; y++) for (let x = 7; x <= 9; x++) put(x, y, y === 3 || y === 6 ? D : (x === 8 ? c : C));
      return;
    }
    for (let x = 4; x <= 11; x++) put(x, 0, D);
    put(3, 1, D); put(12, 1, D); put(2, 2, D); put(13, 2, D);
    for (let y = 3; y <= 6; y++) { put(1, y, D); put(2, y, C); put(3, y, C); put(12, y, C); put(13, y, C); put(14, y, D); }
  },
  wizardhat(put, dir) {
    const A = '#7a5b3a', K = '#523c25', F = '#9a7a52';
    for (let x = 1; x <= 14; x++) put(x, 1, K);
    for (let x = 3; x <= 12; x++) put(x, 0, A);
    for (let x = 4; x <= 11; x++) put(x, -1, x === 6 ? F : A);
    for (let x = 5; x <= 10; x++) put(x, -2, A);
    for (let x = 7; x <= 10; x++) put(x, -3, x === 8 ? K : A);
    put(9, -4, A); put(10, -4, A);
    if (dir !== 'up') { put(6, 0, K); put(9, 0, K); put(7, -1, K); put(8, -1, K); }
  },
  crown(put, dir) {
    const G = '#f2c94c', D = '#b8862e';
    for (let x = 4; x <= 11; x++) { put(x, 0, D); put(x, -1, G); }
    [4, 7, 8, 11].forEach((x) => put(x, -2, G));
    [4, 11].forEach((x) => put(x, -3, G));
    put(7, -3, G);
    if (dir !== 'up') { put(6, -1, '#c0303f'); put(9, -1, '#3d6fa8'); }
  },
  scroll(put, dir) {
    if (dir === 'up') return;
    const x0 = dir === 'left' ? 0 : 12, R = '#a8743f', P = '#efe3c4', I = '#7a5a3a';
    for (let x = x0; x <= x0 + 3; x++) { put(x, 9, R); put(x, 13, R); }
    for (let y = 10; y <= 12; y++) for (let x = x0; x <= x0 + 3; x++) put(x, y, P);
    put(x0 + 1, 10, I); put(x0 + 2, 10, I); put(x0 + 1, 11, I);
  },
  basketball(put, dir) {
    if (dir === 'up') return;
    const x0 = dir === 'left' ? 0 : 12, O = '#e07a2a', S = '#7a3a12';
    put(x0 + 1, 9, O); put(x0 + 2, 9, O);
    for (let x = x0; x <= x0 + 3; x++) { put(x, 10, O); put(x, 11, O); }
    put(x0 + 1, 12, O); put(x0 + 2, 12, O);
    put(x0 + 2, 9, S); put(x0 + 2, 10, S); put(x0 + 1, 11, S); put(x0 + 1, 12, S);
  },
  hockeystick(put, dir) {
    const side = dir === 'left', x = side ? 1 : 14, W = '#c9a26b';
    for (let y = 5; y <= 12; y++) put(x, y, W);
    const blade = side ? [0, 1, 2, 3] : [12, 13, 14, 15];
    blade.forEach((bx) => put(bx, 13, '#1b1b1b'));
    put(x, 12, '#f47d30');
  },
  knight(put, dir) {
    if (dir === 'up') return;
    const x = dir === 'left' ? 0 : 12, W = '#e9e4ff', S = '#b9adf5', O = '#5b4fa0';
    [[1, 6], [2, 6]].forEach(([dx, y]) => put(x + dx, y, S));
    [[0, 7], [1, 7], [2, 7], [3, 7], [1, 8], [2, 8], [3, 8], [2, 9], [3, 9], [1, 10], [2, 10], [3, 10]].forEach(([dx, y]) => put(x + dx, y, dx === 3 ? S : W));
    put(x + 1, 7, O);
    for (let dx = 0; dx <= 3; dx++) { put(x + dx, 11, S); put(x + dx, 12, O); }
  },
  quill(put, dir) {
    if (dir === 'up') return;
    const x = dir === 'left' ? 0 : 12, F = '#fbfaf2', G = '#c4ccd6';
    [[3, 4, F], [3, 5, F], [2, 5, G], [2, 6, F], [3, 6, G], [2, 7, F], [1, 8, F], [2, 8, G], [1, 9, F], [1, 10, '#7a6248'], [0, 11, '#2a2f3d']].forEach(([dx, y, c]) => put(x + dx, y, c));
  },
  compass(put, dir) {
    if (dir === 'up') return;
    const x = dir === 'left' ? 0 : 12, B = '#c8913a', T = '#8a94a3';
    put(x + 1, 6, B); put(x + 2, 6, B); put(x + 1, 7, B); put(x + 2, 7, B);
    [[1, 8], [0, 9], [0, 10], [0, 11]].forEach(([dx, y]) => put(x + dx, y, B));
    [[2, 8], [3, 9], [3, 10], [3, 11]].forEach(([dx, y]) => put(x + dx, y, B));
    put(x, 12, T); put(x + 3, 12, T);
  },
  coinflex(put, dir) {
    if (dir === 'up') return;
    const x = dir === 'left' ? 0 : 11, G = '#f2c94c', D = '#b8862e', H = '#fff3b0';
    for (let dx = 0; dx <= 4; dx++) put(x + dx, 6, G);
    for (let y = 7; y <= 8; y++) for (let dx = 1; dx <= 3; dx++) put(x + dx, y, dx === 1 ? H : G);
    put(x, 7, D); put(x + 4, 7, D);
    put(x + 2, 9, D); put(x + 2, 10, D);
    for (let dx = 1; dx <= 3; dx++) put(x + dx, 11, D);
    put(x + 4, 4, '#ffffff'); put(x - 1, 5, '#ffffff');
  },
  torch(put, dir) {
    if (dir === 'up') return;
    const x = dir === 'left' ? 2 : 13;
    for (let y = 9; y <= 13; y++) put(x, y, '#b8862e');
    put(x - 1, 8, '#d9a441'); put(x, 8, '#d9a441'); put(x + 1, 8, '#d9a441');
    put(x, 7, '#d9423b'); put(x - 1, 6, '#f08a24'); put(x, 6, '#f08a24'); put(x + 1, 6, '#f08a24'); put(x, 5, '#f2c94c'); put(x, 4, '#f2c94c');
  },
});

// Uniform patterns: recolor only the pixels that are shirt (r) or pants (p) in the base sprite.
function paintPattern(c, pattern, pal, dir) {
  const img = c.getImageData(0, 0, 16, 20);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const shirt = hex(pal.r), pants = hex(pal.p);
  const is = (i, rgb) => img.data[i + 3] && img.data[i] === rgb[0] && img.data[i + 1] === rgb[1] && img.data[i + 2] === rgb[2];
  const set = (i, rgb) => { img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; };
  for (let y = 13; y < 20; y++) for (let x = 0; x < 16; x++) {
    const i = (y * 16 + x) * 4;
    const body = y - 4; // row in the 16x16 body frame
    if (pattern === 'pinstripe' && x % 2 === 0 && (is(i, shirt) || is(i, pants))) set(i, hex('#6f8fc4'));
    if (pattern === 'stripes' && is(i, shirt) && body % 2 === 0) set(i, hex('#1f3a5f'));
    if (pattern === 'hockey' && is(i, shirt)) {
      if (body === 11) set(i, hex('#f4f6f8'));
      if (body === 10 && dir === 'down' && (x === 7 || x === 8)) set(i, hex('#f47d30'));
    }
  }
  if (pattern === 'pinstripe' && dir !== 'up') { const i = ((10 + 4) * 16 + (dir === 'left' ? 5 : dir === 'right' ? 10 : 7)) * 4; set(i, hex('#ff5910')); set(i + 4, hex('#ff5910')); }
  c.putImageData(img, 0, 0);
}

/* ---------------- Harbor: the sailboat (launched from the Machine Room) ---------------- */
// Pixel art computed from simple shapes, then outlined, so it stays crisp at any scale.
function shapeCanvas(W, H, colorAt, outline) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'), img = c.createImageData(W, H), d = img.data;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const filled = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const col = colorAt(x, y); if (!col) continue;
    const [r, g, b] = hex(col), i = (y * W + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; filled[y * W + x] = 1;
  }
  if (outline) {
    const [r, g, b] = hex(outline);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (filled[y * W + x]) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled[(y + dy) * W + x + dx] && x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < H);
      if (near) { const i = (y * W + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
    }
  }
  c.putImageData(img, 0, 0);
  return cv;
}
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
let boatCache;
// A small sailboat, 44 by 30, facing right: sail and mast first, hull drawn separately so passengers can sit inside it.
export function boatCanvas(part) {
  boatCache ||= {
    rig: shapeCanvas(44, 30, (x, y) => {
      if (x >= 21 && x <= 22 && y >= 2 && y <= 21) return '#5a3e26';
      if (x >= 23 && x <= 27 && y >= 1 && y <= 3) return '#c0303f';
      if (x >= 23 && y >= 5 && y <= 19 && x <= 23 + (y - 5) * .85) return x > 23 + (y - 5) * .55 ? '#e6e0d2' : '#fbf8f0';
      return null;
    }, '#3a2a1c'),
    hull: shapeCanvas(44, 30, (x, y) => {
      if (y < 20 || y > 28) return null;
      const inset = Math.max(0, (y - 22) * 1.3);
      if (x < 2 + inset || x > 41 - inset * .7) return null;
      return y === 20 ? '#c8913a' : y > 25 ? '#6b4226' : '#8a5a34';
    }, '#3a2a1c'),
  };
  return boatCache[part];
}

/* ---------------- Hatchling errands: sent from the Machine Room incubator, back with coins hours later ---------------- */
export const ERRAND_HOURS = 8, ERRAND_PAY = [100, 250];
export const ERRANDS = {
  gryffindor: { job: 'Patrol the Agora market', back: 'The merchants felt so safe they tipped it' },
  console: { job: 'Hunt for loose change in the code', back: 'It found coins hiding in unused variables' },
  konami: { job: 'Trade with a passing UFO', back: 'It came back with space coins, which spend like regular ones' },
  vienna: { job: 'Sing for tips in the Agora', back: 'It sang "Vienna" eleven times and the crowd paid up' },
  cups: { job: 'Visit its hoard in the hills', back: 'It brought back a little of its hoard and kept the rest' },
  crash: { job: 'Gather honey to sell', back: 'It sold most of the honey' },
  stadion: { job: 'Run a message to Marathon', back: 'It arrived three days late, but the news was good, so they paid it anyway' },
  hat: { job: 'Search the ashes of old fires', back: 'It found coins in the ashes. Phoenixes are good at that' },
  mines: { job: 'Comb the beach', back: 'It dug up coins in the sand, and only one flag' },
};

/* ---------------- Hatchlings: what each easter egg hatches into (Machine Room incubator, 500 coins) ---------------- */
// Drawn facing left on a 12-wide grid, padded into 16x16 with the feet on row 14, then outlined.
export const CREATURES = {
  gryffindor: { name: 'Lion cub', line: 'A lion cub, hatched from the house-password egg. It roars. The roar is mostly a squeak.',
    pal: { M: '#b8642a', l: '#f2c46a', e: '#2a2f3d', n: '#7a3a1a', b: '#e0a83c', t: '#b8642a', f: '#c98a2c' },
    rows: ['..MMMM......', '.MMllMM.....', 'MMleleMM....', 'MMllnlMM....', '.MMllMM...t.', '..MMMM...tt.', '..bbbbbbbb..', '.bbbbbbbbbb.', '.bbbbbbbbbb.', '..b.b..b.b..', '..f.f..f.f..'] },
  console: { name: 'Bug', line: 'A bug, hatched from the developer-console egg. Small, everywhere, and impossible to find when it matters.',
    pal: { a: '#1f2433', h: '#1f2433', e: '#ffffff', s: '#d63b3b', K: '#1f2433', l: '#1f2433' },
    rows: ['..a....a....', '...a..a.....', '...hhhh.....', '..hehheh....', '.ssssssss...', 'ssKssssKss..', 'sssssKssss..', 'ssKssssKss..', '.ssssssss...', '..l.l.l.l...'] },
  konami: { name: '8-bit alien', line: 'An 8-bit alien from the cheat-code egg. It has thirty extra lives and spends them recklessly.',
    pal: { g: '#8a5cf6', w: '#ffffff' },
    rows: ['..g......g..', '...g....g...', '..gggggggg..', '.gg.gggg.gg.', 'gggggggggggg', 'g.gggggggg.g', 'g.g......g.g', '...gg..gg...'] },
  vienna: { name: 'Songbird', line: 'A songbird from the "Vienna" egg. It knows exactly one song. You can guess which.',
    pal: { y: '#f2c94c', e: '#2a2f3d', k: '#e07a1a', w: '#d9a92c', t: '#e07a1a', N: '#2a2f3d' },
    rows: ['.........N..', '.........NN.', '...yyyy..N..', '..yeyyyy.NN.', '.kyyyyyy....', '..yyyyyyyy..', '...yyywwyyy.', '....yyyyy...', '.....t.t....'] },
  cups: { name: 'Baby dragon', line: 'A baby dragon from the four-straight egg, in Islanders blue and orange. Sparky would be proud.',
    pal: { h: '#f47d30', B: '#00539b', e: '#ffffff', O: '#f47d30', w: '#4f9ad9', t: '#00539b' },
    rows: ['...hh.......', '..hBBh......', '.BBeBB......', 'BBBBBBw.....', '.BBBBBww....', '..BOOOBww...', '..BOOOBBB...', '.BBBBBBBBt..', '.B.B...B.tt.'] },
  crash: { name: 'Bear cub', line: 'A bear cub from the market-crash egg. Bearish on everything except naps.',
    pal: { b: '#8a5a34', o: '#5f3d22', e: '#2a2f3d', n: '#c48d5c', d: '#2a2f3d' },
    rows: ['.oo....oo...', '.obbbbbbo...', '.bbebbebb...', '.bbbnnbbb...', '..bbnddbb...', '.bbbbbbbbb..', 'bbbbbbbbbbb.', 'bbbbbbbbbbb.', '.bb.....bb..'] },
  stadion: { name: 'Tortoise', line: 'A tortoise from the stadion egg. According to Aesop, it has never lost a race.',
    pal: { S: '#6b8f3a', p: '#4a6a26', k: '#a8b86a', e: '#2a2f3d', r: '#c0303f', b: '#d8c98a' },
    rows: ['.....SSSS...', '....SpSSpS..', '.rr.SSppSSS.', 'kekkSpSSSpS.', 'kkkkSSSSSSSk', '.k..bbbbbbb.', '....k.k..k.k'] },
  hat: { name: 'Phoenix chick', line: 'A phoenix chick from the Sorting Hat\'s egg. Every so often it bursts into flames, then looks embarrassed about it.',
    pal: { F: '#f2c94c', r: '#d63b2e', e: '#2a2f3d', k: '#e0a030', w: '#f08a24', T: '#f2c94c', t: '#e0a030' },
    rows: ['...F.F......', '....FF......', '...rrrr.....', '..rerrrr....', '.krrrrrr....', '..rrrrrrrr..', '...rrwwrrrT.', '....rrrrrTT.', '.....t.tTT..'] },
  mines: { name: 'Flag crab', line: 'A crab from the minesweeper egg. It plants its little flag on anything suspicious.',
    pal: { c: '#d9603f', e: '#2a2f3d', P: '#2a2f3d', F: '#c0303f' },
    rows: ['........P...', '........PFF.', '........PF..', '.c..c...P...', '.cc.cc..P...', '..cccccc....', '.ceccccec...', 'cccccccccc..', '.cccccccc...', '.c.c..c.c...'] },
};
const creatureCache = new Map();
export function creatureCanvas(id, dir = 'left') {
  const key = `${id}:${dir}`;
  if (creatureCache.has(key)) return creatureCache.get(key);
  const cr = CREATURES[id];
  const top = 15 - cr.rows.length;
  const cv = shapeCanvas(16, 16, (x, y) => {
    const row = cr.rows[y - top], ch = row?.[(dir === 'right' ? 15 - x : x) - 2];
    return ch && ch !== '.' ? cr.pal[ch] : null;
  }, '#2a2f3d');
  creatureCache.set(key, cv);
  return cv;
}

// A painted figure for the School of Athens: any palette, head style, overlays, plus a custom painter for gestures.
// `marble` turns the finished sprite into a stone statue.
export function figureCanvas({ pal = {}, head = 'plain', dir = 'down', overlays = [], extra, marble = false } = {}) {
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 20;
  const c = cv.getContext('2d');
  const rows = head === 'bald' ? [...pad16(SOCRATES_HEAD), ...BODY_LOWER.down, ...LEGS.down[0]] : personFrames(dir, 0, head === 'beard');
  paintSprite(c, rows, { ...PALETTES.hannah, g: '#d7d2c8', ...pal }, 0, 4, dir === 'right');
  const put = (x, y, color) => { c.fillStyle = color; c.fillRect(dir === 'right' ? 15 - x : x, y + 4, 1, 1); };
  const side = dir === 'left' || dir === 'right';
  for (const o of overlays) OVERLAYS[o]?.(put, side ? 'left' : dir);
  extra?.(put);
  if (marble) {
    const img = c.getImageData(0, 0, 16, 20), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255, v = 100 + l * 150;
      d[i] = v; d[i + 1] = v - 3; d[i + 2] = v - 10;
    }
    c.putImageData(img, 0, 0);
  }
  return cv;
}

const avatarCache = new Map();
export function avatarCanvas(dir = 'down', step = 0, look = {}) {
  const key = [dir, step, look.outfit, look.head, look.face, look.held].join(':');
  if (avatarCache.has(key)) return avatarCache.get(key);
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 20;
  const c = cv.getContext('2d');
  const outfit = itemById(look.outfit);
  if (outfit?.split) {
    // Unmeasured: left half one jersey, right half the other.
    const [l, r] = outfit.split.map((id) => avatarCanvas(dir, step, { ...look, outfit: id }));
    c.drawImage(l, 0, 0, 8, 20, 0, 0, 8, 20); c.drawImage(r, 8, 0, 8, 20, 8, 0, 8, 20);
    avatarCache.set(key, cv);
    return cv;
  }
  const pal = { ...PALETTES.hannah, ...(outfit?.pal || {}) };
  paintSprite(c, personFrames(dir, step), pal, 0, 4, dir === 'right');
  if (outfit?.pattern) paintPattern(c, outfit.pattern, pal, dir);
  const side = dir === 'left' || dir === 'right';
  const put = (x, y, color) => { c.fillStyle = color; c.fillRect(dir === 'right' ? 15 - x : x, y + 4, 1, 1); };
  for (const slot of ['head', 'face', 'held']) {
    const paint = OVERLAYS[look[slot]];
    if (paint) paint(put, side ? 'left' : dir);
  }
  avatarCache.set(key, cv);
  return cv;
}
