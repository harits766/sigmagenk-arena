import { db } from './db.js';
import { sfx, vibe, confetti, floatEmoji, toast, unlockAudio, toggleMute, isMuted, splash } from './fx.js';
import { esc, arr, rid, pick, renderKeep, startTimerLoop, chip, teamName, shuffle, setTeamNames, setPausedAt } from './ui.js';
import { GAMES } from './games/index.js';
import { AVATARS, GM_LINES } from './data.js';
import { usePack, EVENT_CODE } from './pack.js';

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
    // Never null, so screens can't crash on a missing/left player; chip() hides the 'none' placeholder.
    pl: (id) => (id && players[id] ? { id, ...players[id] } : { id: id || null, name: id ? '?' : 'Host', av: id ? '❔' : '💻', none: !id }),
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
  // mode 'mix': shuffle, ikhwan & akhwat spread evenly over both kubu. mode 'split': ikhwan vs akhwat.
  async splitTeams(mode = 'mix') {
    const ids = shuffle(Object.keys(S.players).filter((id) => S.players[id].on !== false));
    const up = {};
    if (mode === 'split') {
      const cnt = { A: 0, B: 0 };
      ids.forEach((id) => { const g = S.players[id].g; if (g === 'L') cnt.A++; if (g === 'P') cnt.B++; });
      ids.forEach((id) => {
        const g = S.players[id].g;
        let t = g === 'L' ? 'A' : g === 'P' ? 'B' : null;
        if (!t) { t = cnt.A <= cnt.B ? 'A' : 'B'; cnt[t]++; }
        up[`players/${id}/team`] = t;
      });
      up['meta/teamMode'] = 'split';
      up['meta/teamNames'] = { A: 'Kubu Ikhwan', B: 'Kubu Akhwat' };
    } else {
      const order = [...ids.filter((id) => S.players[id].g === 'L'), ...ids.filter((id) => S.players[id].g === 'P'), ...ids.filter((id) => !S.players[id].g)];
      order.forEach((id, i) => { up[`players/${id}/team`] = i % 2 ? 'B' : 'A'; });
      up['meta/teamMode'] = 'mix';
      up['meta/teamNames'] = null;
    }
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
    <p class="tag">Party game rame-rame • realtime di HP</p>
    <div class="card">
      <label>Kode Room</label>
      <input id="jcode" maxlength="5" autocomplete="off" placeholder="mis. KURMA" value="${esc(code)}" class="big-input caps">
      <label>Nama Panggilan</label>
      <input id="jname" maxlength="14" autocomplete="off" placeholder="Nama lu" value="${esc(last.name || '')}" class="big-input">
      <label>Lu ikhwan atau akhwat?</label>
      <div class="gpick">${genderBtns(last.g, 'pickg')}</div>
      <label>Pilih Avatar</label>
      <div class="avgrid" id="avgrid">${AVATARS.map((a) => `<button class="avbtn ${a === av ? 'sel' : ''}" data-act="pickav" data-arg="${a}">${a}</button>`).join('')}</div>
      ${err ? `<p class="err">${esc(err)}</p>` : ''}
      <button class="btn primary xl" data-act="join">Gas Masuk 🚀</button>
    </div>
    <a class="hostlink" href="?host=1${MOCK ? '&mock=1' : ''}">💻 Jadi Host (laptop)</a>
  </div>`;
  S.pickAv = av;
  S.pickG = last.g || null;
}
const genderBtns = (cur, act) => `<button class="gbtn ${cur === 'L' ? 'sel' : ''}" data-act="${act}" data-arg="L">🧔 Ikhwan</button><button class="gbtn ${cur === 'P' ? 'sel' : ''}" data-act="${act}" data-arg="P">🧕 Akhwat</button>`;

// Which kubu a new player lands in: separate mode puts ikhwan in A and akhwat in B,
// otherwise the kubu with fewer people of the same gender (then fewer people overall).
function teamFor(meta, players, g) {
  if (meta.teamMode === 'split' && g) return g === 'L' ? 'A' : 'B';
  const list = Object.values(players).filter((p) => p.on !== false);
  const n = (t, same) => list.filter((p) => p.team === t && (!same || p.g === g)).length;
  if (g && n('A', true) !== n('B', true)) return n('A', true) < n('B', true) ? 'A' : 'B';
  return n('A') <= n('B') ? 'A' : 'B';
}

function renderHostCreate() {
  $app.innerHTML = `
  <div class="landing">
    <div class="logo"><span>SIGMAGENK</span><b>ARENA</b></div>
    <p class="tag">Mode Host • buka ini di laptop</p>
    <div class="card">
      <p>Host pegang kendali game. Peserta join dari HP pakai kode room.</p>
      <button class="btn gold xl" data-act="eventRoom">🌙 Room Acara (${EVENT_CODE})</button>
      <p class="muted">Room acara pakai paket soal khusus yang belum pernah keluar. Cuma bisa dibikin sekali, dari 1 laptop.</p>
      <button class="btn primary xl" data-act="createRoom">✨ Bikin Room Biasa</button>
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
    if (code !== EVENT_CODE && !(await db.get(`rooms/${code}/meta`))) break;
  }
  return makeRoom(code, '');
}

// The event room: fixed code, event content pack, owned by the first laptop that creates it.
async function eventRoom() {
  const code = EVENT_CODE;
  const tok = LS.get('sg_host_' + code);
  const meta = await db.get(`rooms/${code}/meta`);
  if (meta && tok && meta.host === tok) { history.replaceState(null, '', `?r=${code}&host=1${MOCK ? '&mock=1' : ''}`); return enterHost(code, tok); }
  if (meta) return toast(`Room ${code} udah dibikin dari laptop lain`, 'bad');
  return makeRoom(code, 'event');
}

async function makeRoom(code, pack) {
  const tok = rid(10);
  await db.set(`rooms/${code}`, {
    meta: { host: tok, createdAt: db.now(), venue: 'indoor', pack: pack || null, say: { text: pick(GM_LINES.welcome), ts: db.now() } },
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
  usePack(meta.pack);
  H.mem = (await db.get(room('hostdata'))) || {};
  subscribe();
}

async function joinRoom() {
  const code = document.getElementById('jcode').value.trim().toUpperCase();
  const name = document.getElementById('jname').value.trim();
  if (!code) return renderJoin(code, 'Isi kode room dulu');
  if (!name) return renderJoin(code, 'Isi nama dulu');
  if (!S.pickG) return renderJoin(code, 'Pilih ikhwan atau akhwat dulu');
  const meta = await db.get(`rooms/${code}/meta`);
  if (!meta) return renderJoin(code, `Room ${code} ga ada. Cek lagi kodenya.`);
  const players = (await db.get(`rooms/${code}/players`)) || {};
  const same = Object.entries(players).find(([, p]) => p.name.toLowerCase() === name.toLowerCase());
  const id = same ? same[0] : 'p' + rid(7);
  const g = S.pickG;
  const me = { id, name, av: S.pickAv };
  const rec = same ? { ...same[1], av: S.pickAv, g, on: true } : { name, av: S.pickAv, g, pts: 0, team: teamFor(meta, players, g), joinedAt: db.now(), on: true };
  await db.set(`rooms/${code}/players/${id}`, rec);
  LS.set('sg_me_' + code, me);
  LS.set('sg_profile', { name, av: S.pickAv, g });
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
  u.push(db.on(room('meta'), (v) => {
    const prev = S.meta?.say?.ts;
    const was = JSON.stringify([S.meta.pause, S.meta.teamNames, S.meta.timers]);
    S.meta = v || {};
    usePack(S.meta.pack);
    setTeamNames(S.meta.teamNames);
    setPausedAt(S.meta.pause && S.meta.pause.at);
    if (S.meta.say && S.meta.say.ts !== prev) showSay();
    renderTop();
    if (was !== JSON.stringify([S.meta.pause, S.meta.teamNames, S.meta.timers])) { S.lastPsig = ''; renderMain(); }
  }));
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
  if (S.isHost) renderTop();
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
        ${S.meta.pause ? '<button class="btn sm primary" data-act="resume">▶️ Lanjut</button>' : '<button class="btn sm" data-act="pause">⏸️</button>'}
        ${S.stage && S.stage.endsAt && !S.meta.pause ? '<button class="btn sm" data-act="plus15">+15s</button>' : ''}
        <button class="btn sm" data-act="timers">⏱️</button>
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
      const tbtn = g.timers && ['intro', 'pick', 'setup'].includes(C.stage.phase) && !(g.id === 'gso' && C.stage.phase === 'pick')
        ? `<div class="row center"><button class="btn sm" data-act="timers">⏱️ Atur timer ${esc(g.name)} sebelum mulai</button></div>` : '';
      renderKeep(el, `<div class="game g-${g.id}">${g.host(C)}${tbtn}</div>`);
      g.hostMount && g.hostMount(el, C);
    } else {
      // Player screens re-render only when what they show actually changes (keeps sliders/typing smooth).
      const needG = C.me && !C.me.g;
      const sig = (needG ? 'G|' : '') + JSON.stringify([C.stage.endsAt, C.stage.times, C.stage.at]) + (g.psig ? g.psig(C) : JSON.stringify([C.stage, C.secret, C.me && C.me.team, C.mine === undefined, C.plist.length]));
      if (sig !== S.lastPsig || el.dataset.g !== C.stage.k) {
        S.lastPsig = sig;
        el.dataset.g = C.stage.k;
        const ask = needG ? `<div class="card center warn"><p>Lu ikhwan atau akhwat? (buat bagi kubu)</p><div class="gpick">${genderBtns(null, 'setg')}</div></div>` : '';
        renderKeep(el, `${ask}<div class="game g-${g.id}">${g.player(C)}</div>`);
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
  if (S.meta.pause) return;
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
  const C = ctx();
  if (S.meta.pause) {
    el.innerHTML = `<div class="ov pauseov"><div class="ovbox center"><div class="bigemoji">⏸️</div><h2>Jeda dulu</h2>
      <p class="muted">${S.isHost ? 'Timer semua game berhenti. Klik lanjut kalau udah siap.' : 'Host lagi nge-pause. Tunggu bentar ya.'}</p>
      ${S.isHost ? '<button class="btn primary xl" data-act="resume">▶️ Lanjut</button>' : ''}</div></div>`;
    return;
  }
  if (!S.overlay) { el.innerHTML = ''; return; }
  let body = '';
  if (S.overlay === 'join') {
    const url = location.origin + location.pathname + `?r=${S.code}${MOCK ? '&mock=1' : ''}`;
    body = `<h2>Join di HP</h2><div id="qr" class="qr"></div><div class="bigcode">${S.code}</div><p class="muted">${esc(url)}</p>`;
    setTimeout(() => { const q = document.getElementById('qr'); if (q && window.QRCode && !q.firstChild) new window.QRCode(q, { text: url, width: 220, height: 220 }); }, 0);
  } else if (S.overlay === 'board') {
    body = `<h2>🏆 Klasemen</h2>${boardHtml(C)}`;
  } else if (S.overlay === 'drawer') {
    const gc = (t, g) => C.active.filter((p) => p.team === t && p.g === g).length;
    const mode = S.meta.teamMode === 'split' ? 'Pisah ikhwan vs akhwat' : 'Campur';
    body = `<h2>👥 Pemain (${C.active.length} online)</h2>
      <p class="muted">Mode kubu: <b>${mode}</b> • 🟢 ${esc(teamName('A'))}: 🧔${gc('A', 'L')} 🧕${gc('A', 'P')} • 🟡 ${esc(teamName('B'))}: 🧔${gc('B', 'L')} 🧕${gc('B', 'P')}</p>
      <div class="row"><button class="btn" data-act="split" data-arg="mix">🔀 Acak campur (ikhwan & akhwat rata)</button><button class="btn" data-act="split" data-arg="split">🧔 vs 🧕 Pisah ikhwan & akhwat</button></div>
      <div class="plist">${C.plist.map((p) => `
        <div class="prow ${p.on === false ? 'off' : ''}">${chip(p)}<small>${p.g === 'L' ? '🧔' : p.g === 'P' ? '🧕' : '❔'} ${p.pts || 0} poin</small>
          <button class="btn sm" data-act="swapTeam" data-arg="${p.id}">⇄ Kubu</button>
          <button class="btn sm danger" data-act="kick" data-arg="${p.id}">✕</button></div>`).join('')}</div>`;
  } else if (S.overlay === 'timers' || S.overlay === 'timers_all') {
    const cur = S.overlay === 'timers' ? GAMES[C.stage.g] : null;
    const list = cur && cur.timers ? [cur] : Object.values(GAMES).filter((g) => g.timers);
    const tm = S.meta.timers || {};
    body = `<h2>⏱️ Atur Timer</h2><p class="muted">Dalam detik. Berlaku buat ronde/pertanyaan berikutnya. Kosongin = default.</p>
      ${list.map((g) => `<div class="tset"><h3>${g.emoji} ${esc(g.name)}</h3>${g.timers.map((t) => `
        <label class="trow"><span>${esc(t.label)}</span><input type="number" min="3" max="1800" step="5" id="tm_${g.id}_${t.k}" data-timer="${g.id}/${t.k}" placeholder="${t.def}" value="${(tm[g.id] || {})[t.k] || ''}"><small>dtk</small></label>`).join('')}</div>`).join('')}
      ${cur && cur.timers ? '<button class="btn sm" data-act="allTimers">Lihat timer semua game</button>' : ''}`;
  }
  renderKeep(el, `<div class="ov" data-act="closeOv"><div class="ovbox" data-stop>${body}<button class="btn" data-act="closeOv">Tutup</button></div></div>`);
}

export function boardHtml(C, limit = 50) {
  const ranked = [...C.plist].sort((a, b) => (b.pts || 0) - (a.pts || 0)).slice(0, limit);
  const t = C.teams;
  const lead = (t.A || 0) === (t.B || 0) ? 'Seri!' : (t.A || 0) > (t.B || 0) ? `🟢 ${esc(teamName('A'))} unggul` : `🟡 ${esc(teamName('B'))} unggul`;
  return `<div class="teamboard"><div class="tA"><small>${esc(teamName('A'))}</small><b>${t.A || 0}</b></div><div class="vs">${lead}</div><div class="tB"><small>${esc(teamName('B'))}</small><b>${t.B || 0}</b></div></div>
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
    eventRoom,
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
    split: async () => { await H.splitTeams(arg); toast(arg === 'split' ? 'Ikhwan & akhwat dipisah!' : 'Kubu diacak campur!'); renderOverlay(); },
    pickg: () => { S.pickG = arg; document.querySelectorAll('.gbtn').forEach((b) => b.classList.toggle('sel', b.dataset.arg === arg)); },
    setg: async () => {
      const p = S.players[S.me.id] || {};
      const up = { g: arg };
      if (S.meta.teamMode === 'split') up.team = arg === 'L' ? 'A' : 'B';
      await db.update(room('players/' + S.me.id), up);
      LS.set('sg_profile', { ...(LS.get('sg_profile') || {}), name: p.name || S.me.name, av: p.av || S.me.av, g: arg });
    },
    pause: () => db.set(room('meta/pause'), { at: db.now() }),
    resume: resume,
    plus15: () => { if (S.stage && S.stage.endsAt) H.patch({ endsAt: S.stage.endsAt + 15000 }); },
    timers: () => { S.overlay = 'timers'; renderOverlay(); },
    allTimers: () => { S.overlay = 'timers_all'; renderOverlay(); },
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

// Resume after a pause: push every running deadline forward by the paused duration.
async function resume() {
  const p = S.meta.pause;
  if (!p) return;
  const d = Math.max(0, db.now() - p.at);
  const st = S.stage || {};
  const up = {};
  ['endsAt', 'startAt', 'since', 'at'].forEach((k) => { if (typeof st[k] === 'number') up[k] = st[k] + d; });
  if (Array.isArray(st.times)) up.times = st.times.map((x) => x + d);
  if (H.mem && typeof H.mem.boomAt === 'number') H.mem.boomAt += d;
  if (Object.keys(up).length) await H.patch(up);
  await db.set(room('meta/pause'), null);
}

// Timer settings inputs save on change.
document.addEventListener('change', (e) => {
  const i = e.target.closest && e.target.closest('[data-timer]');
  if (!i || !S.isHost) return;
  const v = Math.round(+i.value);
  db.set(room('meta/timers/' + i.dataset.timer), v >= 3 ? Math.min(v, 1800) : null);
  toast('Timer disimpan ⏱️');
});

export { ctx, room, sfx, vibe, confetti, toast, splash };
boot();
