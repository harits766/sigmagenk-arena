import { db } from './db.js';
import { sfx, vibe, confetti, floatEmoji, toast, unlockAudio, toggleMute, isMuted, splash } from './fx.js';
import { esc, arr, rid, pick, renderKeep, startTimerLoop, chip, teamName, shuffle } from './ui.js';
import { GAMES } from './games/index.js';
import { AVATARS, GM_LINES } from './data.js';

const qs = new URLSearchParams(location.search);
const MOCK = qs.has('mock');
const $app = document.getElementById('app');
const NS = qs.get('as') || ''; // test helper: separate identities per tab in mock mode
const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k + NS)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k + NS, JSON.stringify(v)); } catch {} },
};

export const S = {
  code: null, isHost: false, hostToken: null, me: null,
  meta: {}, stage: null, players: {}, teams: {}, secret: null, inputs: {},
  unsubs: [], inUnsub: null, inKey: null, joinedAt: 0, connected: true,
  overlay: null, lastPhaseSig: '', lastPsig: '', drawer: false,
};
window.S = S; // handy for debugging
S.boardHtml = (...a) => boardHtml(...a);
setTimeout(() => { S.H = H; }, 0);

const room = (p = '') => `rooms/${S.code}${p ? '/' + p : ''}`;

// ---------------- context passed to game modules ----------------
function ctx() {
  const players = S.players || {};
  const plist = Object.entries(players).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const active = plist.filter((p) => p.on !== false);
  const stage = S.stage || { g: 'menu', k: 'menu' };
  const meId = S.me && S.me.id;
  return {
    S, stage, players, plist, active, meta: S.meta || {}, teams: S.teams || {},
    secret: S.secret || {}, inputs: S.inputs || {},
    me: meId ? { id: meId, ...(players[meId] || S.me) } : null,
    mine: meId ? (S.inputs || {})[meId] : undefined,
    isHost: S.isHost, H, send, now: db.now, room, once, sendTo, db, redraw: () => { S.lastPsig = ''; renderMain(); },
    byTeam: (t) => active.filter((p) => p.team === t),
    pl: (id) => (id ? { id, ...(players[id] || { name: '?', av: '❔' }) } : null),
  };
}

// ---------------- host helper ----------------
export const H = {
  async setStage(g, data = {}) {
    const k = g + '_' + rid(5);
    await db.set(room('stage'), { g, k, at: db.now(), ...data });
    return k;
  },
  patch: (obj) => db.update(room('stage'), obj),
  secrets: (map) => db.set(room('secret'), map || null),
  say: (text) => db.set(room('meta/say'), { text, ts: db.now() }),
  async addPts(map, teamToo = true) {
    const up = {};
    const team = { A: 0, B: 0 };
    for (const [pid, n] of Object.entries(map)) {
      if (!n || !S.players[pid]) continue;
      up[`players/${pid}/pts`] = (S.players[pid].pts || 0) + n;
      S.players[pid].pts = (S.players[pid].pts || 0) + n; // local echo so back-to-back calls add up
      const t = S.players[pid].team;
      if (t) team[t] += n;
    }
    if (teamToo) {
      if (team.A) up['teams/A'] = (S.teams.A || 0) + team.A;
      if (team.B) up['teams/B'] = (S.teams.B || 0) + team.B;
      S.teams = { ...S.teams, A: (S.teams.A || 0) + team.A, B: (S.teams.B || 0) + team.B };
    }
    if (Object.keys(up).length) await db.update(room(), up);
  },
  async teamPts(t, n) {
    const v = (S.teams[t] || 0) + n;
    S.teams = { ...S.teams, [t]: v };
    await db.set(room('teams/' + t), v);
  },
  async splitTeams() {
    const ids = shuffle(Object.keys(S.players).filter((id) => S.players[id].on !== false));
    const up = {};
    ids.forEach((id, i) => { up[`players/${id}/team`] = i % 2 ? 'B' : 'A'; });
    await db.update(room(), up);
  },
  menu: () => { H.say(pick(GM_LINES.menu)); return H.setStage('menu'); },
  mem: {}, // host-only memory for the current game (answers, roles)
};

function send(v) {
  if (!S.stage || !S.me) return;
  return db.set(room(`in/${S.stage.k}/${S.me.id}`), v);
}
export const sendTo = (path, v) => db.set(room(path), v);

// ---------------- boot ----------------
async function boot() {
  try {
    await db.init(MOCK);
  } catch (e) {
    $app.innerHTML = `<div class="card center"><h2>⚠️ Belum nyambung ke database</h2><p>${esc(e.message)}</p><p class="muted">Buka pakai <b>?mock=1</b> buat coba lokal.</p></div>`;
    return;
  }
  startTimerLoop(() => true);
  db.onConn((c) => { S.connected = c; const b = document.getElementById('conn'); if (b) b.className = 'conn ' + (c ? 'on' : 'off'); });
  document.addEventListener('click', onClick);
  document.addEventListener('pointerdown', unlockAudio, { once: false });
  setInterval(hostTick, 250);

  const code = (qs.get('r') || '').toUpperCase();
  if (qs.has('host')) {
    const tok = code && LS.get('sg_host_' + code);
    if (code && tok) return enterHost(code, tok);
    return renderHostCreate();
  }
  const saved = code && LS.get('sg_me_' + code);
  if (saved) return enterPlayer(code, saved);
  renderJoin(code);
}

// ---------------- landing ----------------
function renderJoin(code = '', err = '') {
  const last = LS.get('sg_profile') || {};
  const av = last.av || pick(AVATARS);
  $app.innerHTML = `
  <div class="landing">
    <div class="logo"><span>SIGMAGENK</span><b>ARENA</b></div>
    <p class="tag">Party game sirkel semester 7 • realtime di HP</p>
    <div class="card">
      <label>Kode Room</label>
      <input id="jcode" maxlength="5" autocomplete="off" placeholder="mis. KURMA" value="${esc(code)}" class="big-input caps">
      <label>Nama Panggilan</label>
      <input id="jname" maxlength="14" autocomplete="off" placeholder="Nama lu" value="${esc(last.name || '')}" class="big-input">
      <label>Pilih Avatar</label>
      <div class="avgrid" id="avgrid">${AVATARS.map((a) => `<button class="avbtn ${a === av ? 'sel' : ''}" data-act="pickav" data-arg="${a}">${a}</button>`).join('')}</div>
      ${err ? `<p class="err">${esc(err)}</p>` : ''}
      <button class="btn primary xl" data-act="join">Gas Masuk 🚀</button>
    </div>
    <a class="hostlink" href="?host=1${MOCK ? '&mock=1' : ''}">💻 Jadi Host (laptop)</a>
  </div>`;
  S.pickAv = av;
}

function renderHostCreate() {
  $app.innerHTML = `
  <div class="landing">
    <div class="logo"><span>SIGMAGENK</span><b>ARENA</b></div>
    <p class="tag">Mode Host • buka ini di laptop</p>
    <div class="card">
      <p>Host pegang kendali game. Peserta join dari HP pakai kode room.</p>
      <button class="btn primary xl" data-act="createRoom">✨ Bikin Room Baru</button>
      <hr>
      <label>Atau lanjutkan room lama</label>
      <input id="oldcode" class="big-input caps" maxlength="5" placeholder="KODE">
      <button class="btn" data-act="reclaim">Lanjutkan</button>
    </div>
  </div>`;
}

const CODE_WORDS = ['KURMA', 'SAHUR', 'TAJIL', 'SIGMA', 'SURUH', 'BUKBER', 'IQRO', 'HIJRA', 'SABAR', 'ADZAN', 'ZIKIR', 'MABAR', 'KOPI', 'BASO', 'SEBLAK', 'NASGOR', 'CILOK', 'TAHU', 'SKRIP', 'WISUDA'];

async function createRoom() {
  let code;
  for (let i = 0; i < 10; i++) {
    code = (pick(CODE_WORDS) + Math.floor(Math.random() * 10)).slice(0, 5);
    if (code.length < 5) code = code + Math.floor(Math.random() * 10);
    if (!(await db.get(`rooms/${code}/meta`))) break;
  }
  const tok = rid(10);
  await db.set(`rooms/${code}`, {
    meta: { host: tok, createdAt: db.now(), venue: 'indoor', say: { text: pick(GM_LINES.welcome), ts: db.now() } },
    stage: { g: 'menu', k: 'menu_0', at: db.now() },
    teams: { A: 0, B: 0 },
  });
  LS.set('sg_host_' + code, tok);
  history.replaceState(null, '', `?r=${code}&host=1${MOCK ? '&mock=1' : ''}`);
  enterHost(code, tok);
}

async function enterHost(code, tok) {
  const meta = await db.get(`rooms/${code}/meta`);
  if (!meta || meta.host !== tok) { toast('Room ga ketemu / bukan punya lu', 'bad'); return renderHostCreate(); }
  S.code = code; S.isHost = true; S.hostToken = tok;
  H.mem = (await db.get(room('hostdata'))) || {};
  subscribe();
}

async function joinRoom() {
  const code = document.getElementById('jcode').value.trim().toUpperCase();
  const name = document.getElementById('jname').value.trim();
  if (!code) return renderJoin(code, 'Isi kode room dulu');
  if (!name) return renderJoin(code, 'Isi nama dulu');
  const meta = await db.get(`rooms/${code}/meta`);
  if (!meta) return renderJoin(code, `Room ${code} ga ada. Cek lagi kodenya.`);
  const players = (await db.get(`rooms/${code}/players`)) || {};
  const same = Object.entries(players).find(([, p]) => p.name.toLowerCase() === name.toLowerCase());
  const id = same ? same[0] : 'p' + rid(7);
  const a = Object.values(players).filter((p) => p.team === 'A').length;
  const b = Object.values(players).filter((p) => p.team === 'B').length;
  const me = { id, name, av: S.pickAv };
  const rec = same ? { ...same[1], av: S.pickAv, on: true } : { name, av: S.pickAv, pts: 0, team: a <= b ? 'A' : 'B', joinedAt: db.now(), on: true };
  await db.set(`rooms/${code}/players/${id}`, rec);
  LS.set('sg_me_' + code, me);
  LS.set('sg_profile', { name, av: S.pickAv });
  history.replaceState(null, '', `?r=${code}${MOCK ? '&mock=1' : ''}${NS ? '&as=' + NS : ''}`);
  enterPlayer(code, me);
}

async function enterPlayer(code, me) {
  S.code = code; S.me = me; S.isHost = false;
  const p = await db.get(room('players/' + me.id));
  if (!p) { localStorage.removeItem('sg_me_' + code + NS); return renderJoin(code, 'Lu udah dikeluarin dari room, join lagi ya'); }
  await db.update(room('players/' + me.id), { on: true });
  db.onDisc(room('players/' + me.id + '/on'), false);
  subscribe();
}

// ---------------- subscriptions (per path, small payloads) ----------------
function subscribe() {
  S.joinedAt = db.now();
  renderShell();
  const u = S.unsubs;
  u.push(db.on(room('meta'), (v) => { const prev = S.meta?.say?.ts; S.meta = v || {}; if (S.meta.say && S.meta.say.ts !== prev) showSay(); renderTop(); }));
  u.push(db.on(room('players'), (v) => {
    S.players = v || {};
    if (!S.isHost && S.me && !S.players[S.me.id] && S.stage) { localStorage.removeItem('sg_me_' + S.code + NS); location.href = `?r=${S.code}${MOCK ? '&mock=1' : ''}`; return; }
    renderTop(); renderMain();
  }));
  u.push(db.on(room('teams'), (v) => { S.teams = v || {}; renderTop(); renderMain(); }));
  u.push(db.on(room('stage'), (v) => { onStage(v || { g: 'menu', k: 'menu_0' }); }));
  if (!S.isHost) u.push(db.on(room('secret/' + S.me.id), (v) => { S.secret = v; renderMain(); }));
  u.push(db.onAdded(room('fx'), (k, v) => {
    if (!v || v.ts < S.joinedAt - 1500) return;
    floatEmoji(v.e, v.n); if (S.isHost) sfx.pop();
    if (S.isHost) setTimeout(() => db.remove(room('fx/' + k)), 4000);
  }, 8));
}

function onStage(st) {
  const prev = S.stage;
  S.stage = st;
  if (!prev || prev.k !== st.k) {
    if (S.inUnsub) S.inUnsub();
    S.inputs = {};
    S.inKey = st.k;
    S.inUnsub = db.on(room('in/' + st.k), (v) => { if (S.inKey !== st.k) return; S.inputs = v || {}; renderMain(); });
    if (S.isHost && prev && prev.k) db.remove(room('in/' + prev.k));
  }
  const g = GAMES[st.g];
  if (g && g.fx) { try { g.fx(ctx(), prev); } catch (e) { console.error(e); } }
  renderMain();
}

// ---------------- shell & rendering ----------------
function renderShell() {
  $app.innerHTML = `
  <header class="top" id="top"></header>
  <div class="say" id="say"></div>
  <main class="${S.isHost ? 'hostmain' : 'pmain'}" id="main"></main>
  ${S.isHost ? '' : `<nav class="reacts">${['😂', '🔥', '👏', '🤲', '😱', '💀'].map((e) => `<button data-act="react" data-arg="${e}">${e}</button>`).join('')}</nav>`}
  <div id="overlay"></div>`;
  renderTop();
}

function renderTop() {
  const el = document.getElementById('top');
  if (!el) return;
  const t = S.teams || {};
  const scores = `<div class="tscore"><span class="tA">🟢 ${t.A || 0}</span><span class="tB">🟡 ${t.B || 0}</span></div>`;
  if (S.isHost) {
    const n = Object.values(S.players).filter((p) => p.on !== false).length;
    el.innerHTML = `
      <div class="roomcode" data-act="showJoin">ROOM <b>${S.code}</b></div>
      ${scores}
      <div class="tbtns">
        <button class="btn sm" data-act="drawer">👥 ${n}</button>
        <button class="btn sm" data-act="board">🏆</button>
        <button class="btn sm" data-act="menu">🏠</button>
        <button class="btn sm" data-act="mute">${isMuted() ? '🔇' : '🔊'}</button>
        <span id="conn" class="conn ${S.connected ? 'on' : 'off'}"></span>
      </div>`;
  } else {
    const me = S.players[S.me.id] || S.me;
    el.innerHTML = `
      <div class="meinfo t${me.team || ''}"><span class="av">${esc(me.av)}</span><div><b>${esc(me.name)}</b><small>${teamName(me.team)} • ${me.pts || 0} poin</small></div></div>
      ${scores}
      <div class="tbtns"><button class="btn sm" data-act="mute">${isMuted() ? '🔇' : '🔊'}</button><span id="conn" class="conn ${S.connected ? 'on' : 'off'}"></span></div>`;
  }
}

let sayTimer = 0;
function showSay() {
  const el = document.getElementById('say');
  if (!el || !S.meta.say) return;
  el.innerHTML = `<div class="bubble"><span class="gm">🤖</span><p>${esc(S.meta.say.text)}</p></div>`;
  el.classList.add('show');
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => el.classList.remove('show'), 9000);
}

let rq = 0;
function renderMain() {
  if (rq) return;
  rq = requestAnimationFrame(() => { rq = 0; doRender(); });
}
function doRender() {
  const el = document.getElementById('main');
  if (!el || !S.stage) return;
  const C = ctx();
  const g = GAMES[C.stage.g] || GAMES.menu;
  try {
    if (S.isHost) {
      renderKeep(el, `<div class="game g-${g.id}">${g.host(C)}</div>`);
      g.hostMount && g.hostMount(el, C);
    } else {
      // Player screens re-render only when what they show actually changes (keeps sliders/typing smooth).
      const sig = g.psig ? g.psig(C) : JSON.stringify([C.stage, C.secret, C.me && C.me.team, C.mine === undefined, C.plist.length]);
      if (sig !== S.lastPsig || el.dataset.g !== C.stage.k) {
        S.lastPsig = sig;
        el.dataset.g = C.stage.k;
        renderKeep(el, `<div class="game g-${g.id}">${g.player(C)}</div>`);
        g.playerMount && g.playerMount(el, C);
      } else if (g.pupdate) g.pupdate(el, C);
    }
  } catch (e) {
    console.error(e);
    el.innerHTML = `<div class="card"><p class="err">Error: ${esc(e.message)}</p></div>`;
  }
  renderOverlay();
}

// ---------------- host loop (auto-advance when timers end / everyone answered) ----------------
let memSig = '';
function saveMem() {
  if (!S.isHost) return;
  const j = JSON.stringify(H.mem || {});
  if (j !== memSig) { memSig = j; db.set(room('hostdata'), JSON.parse(j)); }
}
function hostTick() {
  if (!S.isHost || !S.stage) return;
  saveMem();
  const g = GAMES[S.stage.g];
  if (g && g.tick) { try { g.tick(ctx()); } catch (e) { console.error(e); } }
}
// Run a host action once per (stage key + tag) even though tick fires every 250ms.
const onceSet = new Set();
export function once(tag, fn) {
  const key = (S.stage && S.stage.k) + '|' + tag;
  if (onceSet.has(key)) return;
  onceSet.add(key);
  fn();
}

// ---------------- overlays: join QR, leaderboard, players drawer ----------------
function renderOverlay() {
  const el = document.getElementById('overlay');
  if (!el) return;
  if (!S.overlay) { el.innerHTML = ''; return; }
  const C = ctx();
  let body = '';
  if (S.overlay === 'join') {
    const url = location.origin + location.pathname + `?r=${S.code}${MOCK ? '&mock=1' : ''}`;
    body = `<h2>Join di HP</h2><div id="qr" class="qr"></div><div class="bigcode">${S.code}</div><p class="muted">${esc(url)}</p>`;
    setTimeout(() => { const q = document.getElementById('qr'); if (q && window.QRCode && !q.firstChild) new window.QRCode(q, { text: url, width: 220, height: 220 }); }, 0);
  } else if (S.overlay === 'board') {
    body = `<h2>🏆 Klasemen</h2>${boardHtml(C)}`;
  } else if (S.overlay === 'drawer') {
    body = `<h2>👥 Pemain (${C.active.length} online)</h2>
      <div class="row"><button class="btn" data-act="split">🔀 Acak Kubu</button></div>
      <div class="plist">${C.plist.map((p) => `
        <div class="prow ${p.on === false ? 'off' : ''}">${chip(p)}<small>${p.pts || 0} poin</small>
          <button class="btn sm" data-act="swapTeam" data-arg="${p.id}">⇄ Kubu</button>
          <button class="btn sm danger" data-act="kick" data-arg="${p.id}">✕</button></div>`).join('')}</div>`;
  }
  el.innerHTML = `<div class="ov" data-act="closeOv"><div class="ovbox" data-stop>${body}<button class="btn" data-act="closeOv">Tutup</button></div></div>`;
}

export function boardHtml(C, limit = 50) {
  const ranked = [...C.plist].sort((a, b) => (b.pts || 0) - (a.pts || 0)).slice(0, limit);
  const t = C.teams;
  const lead = (t.A || 0) === (t.B || 0) ? 'Seri!' : (t.A || 0) > (t.B || 0) ? '🟢 Kubu Hijau unggul' : '🟡 Kubu Emas unggul';
  return `<div class="teamboard"><div class="tA"><small>Kubu Hijau</small><b>${t.A || 0}</b></div><div class="vs">${lead}</div><div class="tB"><small>Kubu Emas</small><b>${t.B || 0}</b></div></div>
  <ol class="board">${ranked.map((p, i) => `<li class="${i < 3 ? 'top' + (i + 1) : ''}" style="--i:${i}"><span class="rank">${['🥇', '🥈', '🥉'][i] || i + 1}</span>${chip(p)}<b>${p.pts || 0}</b></li>`).join('')}</ol>`;
}

// ---------------- click handling ----------------
let lastReact = 0;
async function onClick(e) {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  if (t.dataset.act === 'closeOv' && e.target.closest('[data-stop]') && !e.target.closest('button')) return;
  const act = t.dataset.act;
  const arg = t.dataset.arg;
  if (t.disabled) return;
  sfx.tap();
  const global = {
    pickav: () => { S.pickAv = arg; document.querySelectorAll('.avbtn').forEach((b) => b.classList.toggle('sel', b.dataset.arg === arg)); },
    join: joinRoom,
    createRoom,
    reclaim: () => { const c = document.getElementById('oldcode').value.trim().toUpperCase(); const tok = LS.get('sg_host_' + c); if (!tok) return toast('Room itu bukan dibikin dari laptop ini', 'bad'); enterHost(c, tok); },
    mute: () => { toggleMute(); renderTop(); },
    react: () => {
      if (Date.now() - lastReact < 600) return;
      lastReact = Date.now();
      vibe(15);
      db.push(room('fx'), { e: arg, n: (S.players[S.me.id] || S.me).name, ts: db.now() });
    },
    showJoin: () => { S.overlay = 'join'; renderOverlay(); },
    board: () => { S.overlay = 'board'; renderOverlay(); },
    drawer: () => { S.overlay = 'drawer'; renderOverlay(); },
    closeOv: () => { S.overlay = null; renderOverlay(); },
    toMenu: () => { H.secrets(null); H.menu(); },
    menu: () => { if (confirm('Balik ke menu utama? Game yang lagi jalan berhenti.')) { H.secrets(null); H.menu(); } },
    split: async () => { await H.splitTeams(); toast('Kubu diacak!'); renderOverlay(); },
    swapTeam: () => { const p = S.players[arg]; db.set(room(`players/${arg}/team`), p.team === 'A' ? 'B' : 'A'); },
    kick: () => { if (confirm(`Keluarin ${S.players[arg]?.name}?`)) db.remove(room('players/' + arg)); },
  };
  if (global[act]) return global[act]();
  const C = ctx();
  const g = GAMES[C.stage.g] || GAMES.menu;
  const fn = (S.isHost ? g.hostActs : g.playerActs) || {};
  if (fn[act]) {
    try { await fn[act](C, arg, t, e); } catch (err) { console.error(err); toast('Error: ' + err.message, 'bad'); }
    saveMem();
  }
}

export { ctx, room, sfx, vibe, confetti, toast, splash };
boot();
