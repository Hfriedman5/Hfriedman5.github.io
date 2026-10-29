// The town leaderboard, stored in Supabase. Anyone can read the board (initials and scores only).
// Joining needs a signed-in player (see cloud.js): scores come from their checked cloud save, and emails stay private.
// Entries made before sign-ins existed belong to a browser (an id and a secret, kept under hf-player) until claimed.
// The key below is Supabase's public key: it is meant to be in the page, and only allows those things.
export const SUPABASE_URL = 'https://fgkauzfgmzslmjsqmfrb.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_wunmv_DaSNBD4rQhZjZ3UQ_7sEW0cUN';
export const leaderboardReady = () => !!(SUPABASE_URL && SUPABASE_KEY);

const headers = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' });
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
// The board's months keep New York time, like the game's server.
export const thisMonth = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
const randomHex = (bytes) => [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
const rpc = (name, body) => fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });

// A few three-letter combinations nobody needs to see on the board.
const BLOCKED = new Set(['ASS', 'FUK', 'FUC', 'FCK', 'SEX', 'KKK', 'NAZ', 'CUM', 'TIT', 'DIK', 'DIC', 'FAG', 'PIS', 'XXX', 'SHT', 'WTF', 'NIG', 'HOE']);
// Numbers are allowed, so read them as the letters they imitate before checking (A55 reads as ASS).
const LOOKALIKE = { 0: 'O', 1: 'I', 3: 'E', 4: 'A', 5: 'S', 6: 'G', 7: 'T', 8: 'B', 9: 'G' };
export const initialsProblem = (s) => (!/^[A-Za-z0-9]{3}$/.test(s) ? 'Use exactly three letters or numbers, like HMF or R2D.'
  : BLOCKED.has(s.toUpperCase().replace(/[0-9]/g, (d) => LOOKALIKE[d] || d)) ? 'Please pick different initials.' : '');
export const emailProblem = (s) => (s.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim()) ? 'That email does not look right.' : '');

// This browser's player: a random id, a secret only this browser knows, and the initials they chose.
export const player = () => lsGet('hf-player', null);
export async function join(initials, email) {
  const me = player() || { id: crypto.randomUUID(), secret: randomHex(24) };
  const r = await rpc('join_board', { p_player: me.id, p_secret: me.secret, p_initials: initials.toUpperCase(), p_email: email.trim() });
  if (r.status === 409) throw new Error('taken'); // initials are first come, first served
  if (!r.ok) throw new Error(`join ${r.status}`);
  me.initials = initials.toUpperCase(); me.email = email.trim().toLowerCase();
  lsSet('hf-player', me);
  return me;
}
export async function leave() {
  const me = player();
  if (me) { const r = await rpc('leave_board', { p_player: me.id, p_secret: me.secret }); if (!r.ok) throw new Error(`leave ${r.status}`); }
  try { localStorage.removeItem('hf-player'); } catch (e) { /* fine */ }
}

// Send this player's month row and all-time row. `net` is everything they own now; `bjTotal` is lifetime blackjack profit.
// The monthly blackjack number is the change since this month began, remembered in this browser.
let lastSent = 0;
export async function submit({ net, bjTotal }, force = false) {
  const me = player();
  if (!leaderboardReady() || !me?.initials || (!force && Date.now() - lastSent < 60e3)) return false;
  lastSent = Date.now();
  const month = thisMonth(), track = lsGet('hf-lb', {});
  if (track.month !== month) { track.month = month; track.bjStart = bjTotal; }
  track.peak = Math.max(track.peak || 0, net); lsSet('hf-lb', track);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
  const send = (m, n, b) => rpc('submit_score', { p_player: me.id, p_secret: me.secret, p_month: m, p_net: clamp(n, 0, 2e6), p_bj: clamp(b, -1e6, 1e6) });
  try {
    const res = await Promise.all([send(month, net, bjTotal - track.bjStart), send('all', track.peak, bjTotal)]);
    return res.every((r) => r.ok);
  } catch (e) { return false; }
}

// The trophy case under the board: everyone on it who owns the Coin flex award, in the order they earned it (part I of
// the cloud SQL). null if the server does not have it yet, so the case stays hidden.
export async function trophyCase(mine = null) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/trophy_case`, { method: 'POST', headers: headers(), body: '{}' });
  if (!r.ok) return null;
  return (await r.json()).map((row) => ({ initials: row.initials, earned: row.earned_at, me: mine ? row.initials === mine : false }));
}

// The top ten for one board: 'net' (richest), 'bj' (blackjack profit), or the fastest 'ms' (Minesweeper) and 'lap' (stadion)
// times, lowest first, for this month or all time. `mine` is the signed-in player's initials, so their row can be marked.
export async function top(board, period, mine = null) {
  const col = { net: 'net_worth', bj: 'bj_profit', ms: 'ms_best', lap: 'lap_best' }[board], fastest = board === 'ms' || board === 'lap';
  const month = period === 'all' ? 'all' : thisMonth();
  const r = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?select=player_id,initials,${col}&month=eq.${month}${fastest ? `&${col}=not.is.null&order=${col}.asc` : `&order=${col}.desc`}&limit=10`, { headers: headers() });
  if (!r.ok) throw new Error(`leaderboard ${r.status}`);
  return (await r.json()).map((row) => ({ me: mine ? row.initials === mine : row.player_id === player()?.id, initials: row.initials, value: row[col] }));
}
