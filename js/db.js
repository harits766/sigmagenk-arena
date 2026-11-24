// Thin realtime DB layer: Firebase RTDB in production, a localStorage mock for local testing (?mock=1).
// All game code talks to this module only, so listeners stay small and per-path.
import { FIREBASE_DB_URL } from './config.js';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
let impl = null;
let offset = 0;

export const db = {
  get ready() { return !!impl; },
  async init(mock) {
    impl = mock ? mockImpl() : await firebaseImpl();
    return impl;
  },
  now: () => Date.now() + offset,
  set: (p, v) => impl.set(p, clean(v)),
  update: (p, v) => impl.update(p, clean(v)),
  remove: (p) => impl.set(p, null),
  get: (p) => impl.get(p),
  push: (p, v) => impl.push(p, clean(v)),
  on: (p, cb) => impl.on(p, cb),
  onAdded: (p, cb, limit = 20) => impl.onAdded(p, cb, limit),
  tx: (p, fn) => impl.tx(p, fn),
  onDisc: (p, v) => impl.onDisc(p, v),
  onConn: (cb) => impl.onConn(cb),
};

// Firebase rejects undefined; strip it.
function clean(v) {
  if (v === undefined) return null;
  return JSON.parse(JSON.stringify(v, (k, x) => (x === undefined ? null : x)));
}

async function firebaseImpl() {
  if (!FIREBASE_DB_URL || FIREBASE_DB_URL.includes('ISI_URL')) {
    throw new Error('FIREBASE_DB_URL belum diisi di js/config.js');
  }
  const app = await import(FB + 'firebase-app.js');
  const d = await import(FB + 'firebase-database.js');
  const fapp = app.initializeApp({ databaseURL: FIREBASE_DB_URL });
  const database = d.getDatabase(fapp);
  const r = (p) => d.ref(database, p);
  d.onValue(r('.info/serverTimeOffset'), (s) => { offset = s.val() || 0; });
  return {
    set: (p, v) => d.set(r(p), v),
    update: (p, v) => d.update(r(p), v),
    get: async (p) => (await d.get(r(p))).val(),
    push: async (p, v) => { const k = d.push(r(p)); await d.set(k, v); return k.key; },
    on: (p, cb) => d.onValue(r(p), (s) => cb(s.val())),
    onAdded: (p, cb, limit) => d.onChildAdded(d.query(r(p), d.limitToLast(limit)), (s) => cb(s.key, s.val())),
    tx: (p, fn) => d.runTransaction(r(p), fn),
    onDisc: (p, v) => d.onDisconnect(r(p)).set(v),
    onConn: (cb) => d.onValue(r('.info/connected'), (s) => cb(!!s.val())),
  };
}

// ---------- Mock: shared localStorage tree, synced across tabs via the storage event ----------
function mockImpl() {
  const KEY = 'sg_mockdb';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let tree = load();
  const subs = new Set();
  const parts = (p) => p.split('/').filter(Boolean);
  const at = (t, p) => parts(p).reduce((o, k) => (o == null ? undefined : o[k]), t);
  function put(t, p, v) {
    const ks = parts(p);
    if (!ks.length) return v ?? {};
    let o = t;
    const chain = [];
    for (let i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {};
      chain.push([o, ks[i]]);
      o = o[ks[i]];
    }
    const last = ks[ks.length - 1];
    if (v == null) delete o[last]; else o[last] = v;
    for (let i = chain.length - 1; i >= 0; i--) {
      const [parent, k] = chain[i];
      if (parent[k] && typeof parent[k] === 'object' && !Object.keys(parent[k]).length) delete parent[k];
    }
    return t;
  }
  const save = () => { localStorage.setItem(KEY, JSON.stringify(tree)); notify(); };
  const notify = () => subs.forEach((s) => s.check());
  window.addEventListener('storage', (e) => { if (e.key === KEY) { tree = load(); notify(); } });
  const pid = () => Date.now().toString(36).padStart(9, '0') + Math.random().toString(36).slice(2, 7);
  const sub = (s) => { subs.add(s); setTimeout(() => s.check(), 0); return () => subs.delete(s); };
  return {
    set: async (p, v) => { tree = load(); tree = put(tree, p, v); save(); },
    update: async (p, obj) => {
      tree = load();
      for (const [k, v] of Object.entries(obj)) tree = put(tree, p + '/' + k, v);
      save();
    },
    get: async (p) => structuredClone(at(load(), p) ?? null),
    push: async (p, v) => { const k = pid(); tree = load(); tree = put(tree, p + '/' + k, v); save(); return k; },
    on: (p, cb) => {
      let last;
      return sub({ check() { const v = at(tree, p) ?? null; const j = JSON.stringify(v); if (j !== last) { last = j; cb(v == null ? null : JSON.parse(j)); } } });
    },
    onAdded: (p, cb, limit) => {
      let seen = null;
      return sub({ check() {
        const v = at(tree, p) || {};
        const keys = Object.keys(v).sort();
        if (seen === null) { seen = new Set(); keys.slice(-limit).forEach((k) => { seen.add(k); cb(k, v[k]); }); keys.forEach((k) => seen.add(k)); return; }
        keys.forEach((k) => { if (!seen.has(k)) { seen.add(k); cb(k, v[k]); } });
      } });
    },
    tx: async (p, fn) => {
      tree = load();
      const cur = structuredClone(at(tree, p) ?? null);
      const nv = fn(cur);
      if (nv === undefined) return { committed: false };
      tree = put(tree, p, nv); save();
      return { committed: true };
    },
    onDisc: async () => {},
    onConn: (cb) => { cb(true); return () => {}; },
  };
}
