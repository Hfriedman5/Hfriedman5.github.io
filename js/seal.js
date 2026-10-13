// A seal over the game's money: coins, bank, bonds, shares, farm, ships, voyages, records, timers, scholars, errands.
// The game updates the seal each time it changes one of these. A change made any other way (typing a new coin count
// into the browser console, say) breaks the seal; the game counts it in hf-edited, and the next cloud save tells the
// server, which marks the player for review. It is a speed bump, not a lock: anyone who studies this file can get past it.
// The October 2026 update added courses, harbor orders, and the war tax. A save sealed the old way is resealed the new way
// the first time the new game sees it, so nobody is counted as an outside edit just for updating.
const KEYS_BEFORE = ['hf-coins', 'hf-bank', 'hf-bonds', 'hf-stocks', 'hf-farm', 'hf-ships', 'hf-voyages', 'hf-records', 'hf-net', 'hf-cooldowns', 'hf-scholars', 'hf-errands', 'hf-edited'];
const KEYS = [...KEYS_BEFORE, 'hf-courses', 'hf-orders', 'hf-war'];
const SALT_BEFORE = 'little-athens/olive-press/1', SALT = 'little-athens/olive-press/2';

function sealOf(keys = KEYS, salt = SALT) {
  let a = 0x811c9dc5, b = 0x01000193;
  const text = salt + keys.map((k) => `${k}\u0001${localStorage.getItem(k) ?? ''}`).join('\u0002');
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b + c + (a >>> 7), 2246822507) ^ (b >>> 13);
  }
  return `${(a >>> 0).toString(36)}.${(b >>> 0).toString(36)}`;
}
const intact = () => {
  const s = localStorage.getItem('hf-seal');
  if (s === null || s === sealOf()) return true; // no seal yet (a save from before seals), or sealed and untouched
  if (s === sealOf(KEYS_BEFORE, SALT_BEFORE)) { localStorage.setItem('hf-seal', sealOf()); return true; } // sealed before the update
  return false;
};
const sealNow = () => localStorage.setItem('hf-seal', sealOf());
const noteEdit = () => localStorage.setItem('hf-edited', String((Number(localStorage.getItem('hf-edited')) || 0) + 1));

// Look for changes made behind the game's back, count them, and seal what is there now (on load, and before cloud saves).
export function checkSeal() {
  try { if (!intact()) noteEdit(); sealNow(); } catch (e) { /* private mode */ }
}
// Write one saved key the way the game does. For the money keys, first make sure nothing changed behind the game's back,
// so an outside edit can never be sealed in by the next coin the game pays out.
export function guardedSet(key, raw) {
  const watched = KEYS.includes(key), ok = !watched || intact();
  raw == null ? localStorage.removeItem(key) : localStorage.setItem(key, raw);
  if (watched) { if (!ok) noteEdit(); sealNow(); }
}
// A save that came from the cloud is trusted as it is: just seal it.
export function sealTrusted() { try { sealNow(); } catch (e) { /* private mode */ } }
