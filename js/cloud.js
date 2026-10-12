// Cloud saves: sign in with a 6-digit email code, and the game saves itself to Supabase every so often.
// Everything the site saves in the browser starts with "hf-", and that whole set is the save. The sign-in itself lives
// under "sb-" keys, so backup files never include it and restoring a backup never signs anyone out.
// The server keeps each player's save, and it decides what the leaderboard believes (see the part A SQL).
import { SUPABASE_URL, SUPABASE_KEY } from './leaderboard.js?v=20261012i';
import { checkSeal, sealTrusted } from './seal.js?v=20261012i';

const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
const api = (path) => `${SUPABASE_URL}${path}`;
const JSON_HEADERS = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
const SYNC_EVERY = 30e3;

/* ---------------- State the Save panel shows ---------------- */
// status: 'signed-out', 'syncing', 'saved', 'conflict' (this browser and the cloud both changed), 'offline'
export const cloud = { status: 'signed-out', savedAt: null, conflict: null, initials: null, error: '', board: lsGet('sb-board', null) }; // board: what the leaderboard believes
const listeners = new Set();
export const onCloudChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => { try { fn(cloud); } catch (e) { /* a listener's problem */ } });
const set = (patch) => { Object.assign(cloud, patch); emit(); };

/* ---------------- Signing in ---------------- */
export const session = () => lsGet('sb-session', null);
export const signedIn = () => !!session()?.refresh_token;
const keepSession = (r) => {
  const s = { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: r.expires_at || Math.floor(Date.now() / 1000) + (r.expires_in || 3600), user: { id: r.user?.id, email: r.user?.email } };
  lsSet('sb-session', s);
  return s;
};
let refreshing = null;
async function accessToken() {
  const s = session();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  refreshing ||= (async () => {
    try {
      const r = await fetch(api('/auth/v1/token?grant_type=refresh_token'), { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ refresh_token: s.refresh_token }) });
      if (r.ok) return keepSession({ ...(await r.json()) }).access_token;
      if (r.status === 400 || r.status === 401 || r.status === 403) { lsSet('sb-session', null); set({ status: 'signed-out', initials: null }); }
      return null;
    } catch (e) { return null; } // offline: try again later
    finally { refreshing = null; }
  })();
  return refreshing;
}
// Email a sign-in code. Returns '' when sent, or a reason it was not.
export async function sendCode(email) {
  try {
    const r = await fetch(api('/auth/v1/otp'), { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email: email.trim(), create_user: true }) });
    if (r.ok) return '';
    return r.status === 429 ? 'wait' : r.status >= 500 ? 'server' : 'failed';
  } catch (e) { return 'offline'; }
}
// Check the code. On success the player is signed in, an old leaderboard entry in this browser is linked to them, and syncing starts.
export async function verifyCode(email, code) {
  for (const type of ['email', 'signup', 'magiclink']) {
    try {
      const r = await fetch(api('/auth/v1/verify'), { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ type, email: email.trim(), token: code.trim() }) });
      if (!r.ok) continue;
      keepSession(await r.json());
      const old = lsGet('hf-player', null); // joined the leaderboard before sign-ins existed
      if (old?.id && old?.secret) await rpc('claim_player', { p_player: old.id, p_secret: old.secret }).catch(() => null);
      await refreshInitials();
      await startSync();
      return true;
    } catch (e) { return false; }
  }
  return false;
}
export async function signOut() {
  const t = session()?.access_token;
  lsSet('sb-session', null); lsSet('sb-sync', null); lsSet('sb-board', null);
  set({ status: 'signed-out', savedAt: null, conflict: null, initials: null });
  if (t) fetch(api('/auth/v1/logout'), { method: 'POST', headers: { ...JSON_HEADERS, Authorization: `Bearer ${t}` } }).catch(() => {});
}

/* ---------------- Talking to the database as the signed-in player ---------------- */
export async function rpc(name, body = {}, { keepalive = false } = {}) {
  const t = await accessToken();
  if (!t) throw new Error('signed-out');
  const r = await fetch(api(`/rest/v1/rpc/${name}`), { method: 'POST', headers: { ...JSON_HEADERS, Authorization: `Bearer ${t}` }, body: JSON.stringify(body), keepalive });
  const text = await r.text();
  const out = text ? JSON.parse(text) : null;
  if (!r.ok) { const err = new Error(out?.message || `${name} ${r.status}`); err.status = r.status; err.code = out?.code; throw err; }
  return out;
}
async function fetchCloud() {
  const t = await accessToken();
  if (!t) throw new Error('signed-out');
  const r = await fetch(api('/rest/v1/saves?select=data,version,saved_at'), { headers: { ...JSON_HEADERS, Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error(`saves ${r.status}`);
  return (await r.json())[0] || null;
}
export async function refreshInitials() {
  try { set({ initials: (await rpc('board_me')) || null }); } catch (e) { /* keep what we had */ }
  return cloud.initials;
}

/* ---------------- The save itself ---------------- */
const SKIP_FOR_CHANGES = new Set(['hf-play-pos']); // saved, but walking around alone is not worth a sync
export function localSave() {
  const data = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('hf-')) data[k] = localStorage.getItem(k); } } catch (e) { /* private mode */ }
  return data;
}
const fingerprint = (data) => {
  let h = 2166136261;
  for (const k of Object.keys(data).filter((x) => !SKIP_FOR_CHANGES.has(x)).sort()) for (const ch of `${k}=${data[k]};`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
};
// A short description for the "which save do you want to keep?" question.
export function describe(data) {
  const read = (k, d) => { try { return JSON.parse(data[k]) ?? d; } catch (e) { return d; } };
  return { coins: Math.max(0, Math.floor(Number(read('hf-coins', 0)) || 0)), eggs: (read('hf-eggs', []) || []).length, plots: (read('hf-farm', {})?.owned || []).length };
}
const hasProgress = (data) => { const d = describe(data); return d.coins > 0 || d.eggs > 0 || d.plots > 0 || ['hf-bank', 'hf-bonds', 'hf-stocks', 'hf-hatched', 'hf-wardrobe', 'hf-voyages'].some((k) => k in data); };
function useSave(data) { // replace everything this browser has saved with this save, then reload so every page picks it up
  try {
    Object.keys(localSave()).forEach((k) => localStorage.removeItem(k));
    Object.entries(data || {}).forEach(([k, v]) => { if (k.startsWith('hf-') && typeof v === 'string') localStorage.setItem(k, v); });
    sealTrusted();
  } catch (e) { return; }
  location.reload();
}

/* ---------------- Syncing ---------------- */
// sb-sync remembers which cloud version this browser last matched, and what the save looked like then.
const before = new Set(); // things to do just before each upload (the game writes its net worth)
export const beforeSave = (fn) => before.add(fn);
let busy = false;
async function upload({ force = false, keepalive = false } = {}) {
  checkSeal(); // any change made outside the game since the last save gets counted, and the server hears about it
  before.forEach((fn) => { try { fn(); } catch (e) { /* keep going */ } });
  const s = session(), sync = lsGet('sb-sync', {}), data = localSave(), print = fingerprint(data);
  if (!s) return;
  const base = sync.user === s.user.id ? sync.version ?? null : null;
  try {
    const res = await rpc('save_game', { p_data: data, p_base: force ? cloud.conflict?.cloud?.version ?? base : base, p_force: force }, { keepalive });
    lsSet('sb-sync', { user: s.user.id, version: res.version, print });
    const board = { net: res.net, bj: res.bj, review: !!res.review }; lsSet('sb-board', board);
    set({ status: 'saved', savedAt: Date.now(), conflict: null, error: '', board });
  } catch (e) {
    if (e.message === 'conflict') return checkCloud();
    set({ status: e.message === 'signed-out' ? 'signed-out' : 'offline' });
  }
}
// Compare this browser with the cloud, and decide: upload, take the cloud's save, or ask the player.
async function checkCloud() {
  const s = session();
  if (!s) return set({ status: 'signed-out' });
  set({ status: 'syncing' });
  let remote;
  try { remote = await fetchCloud(); } catch (e) { return set({ status: e.message === 'signed-out' ? 'signed-out' : 'offline' }); }
  const sync = lsGet('sb-sync', {}), mine = sync.user === s.user.id, data = localSave(), print = fingerprint(data);
  if (!remote) return upload();                                                    // first save for this player
  const reset = remote.data?.['hf-reset'];                                         // the site manager reset this game: start fresh, no question
  if (reset && reset !== localStorage.getItem('hf-reset')) {
    lsSet('sb-sync', { user: s.user.id, version: remote.version, print: fingerprint(remote.data) });
    return useSave(remote.data);
  }
  if (mine && sync.version === remote.version) return print === sync.print ? set({ status: 'saved', savedAt: Date.parse(remote.saved_at) }) : upload();
  if (!hasProgress(data) || (mine && print === sync.print)) {                       // a fresh browser, or this one sat idle: take the cloud's
    lsSet('sb-sync', { user: s.user.id, version: remote.version, print: fingerprint(remote.data) });
    return useSave(remote.data);
  }
  set({ status: 'conflict', conflict: { cloud: { version: remote.version, savedAt: remote.saved_at, ...describe(remote.data), data: remote.data }, local: describe(data) } });
}
export async function keepCloud() { // the player picked the cloud's save: keep this browser's as an earlier version, then switch
  const c = cloud.conflict;
  if (!c) return;
  await rpc('stash_save', { p_data: localSave() }).catch(() => null);
  lsSet('sb-sync', { user: session().user.id, version: c.cloud.version, print: fingerprint(c.cloud.data) });
  useSave(c.cloud.data);
}
export const keepLocal = () => upload({ force: true });
export async function syncNow() {
  if (busy || !signedIn() || cloud.status === 'conflict') return;
  busy = true;
  try {
    const sync = lsGet('sb-sync', {});
    if (sync.user !== session()?.user?.id || cloud.status === 'offline' || cloud.status === 'signed-out') await checkCloud();
    else if (fingerprint(localSave()) !== sync.print) await upload();
  } finally { busy = false; }
}
let timer = null;
export async function startSync() {
  if (!signedIn()) return set({ status: 'signed-out' });
  clearInterval(timer);
  timer = setInterval(syncNow, SYNC_EVERY);
  busy = true;
  try { await checkCloud(); } finally { busy = false; }
}
// Leaving the page: send any last changes (keepalive lets the request finish after the page closes).
addEventListener('pagehide', () => {
  const sync = lsGet('sb-sync', {});
  if (signedIn() && cloud.status === 'saved' && fingerprint(localSave()) !== sync.print) upload({ keepalive: true });
});

if (signedIn()) { startSync(); refreshInitials(); }
