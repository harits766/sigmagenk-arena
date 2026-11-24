import { esc, chip, timer, intro, wait, bar, btn, answered, progress, whoAnswered, changed, sfx, splash, vibe, confetti } from './common.js';
import { DILEMMAS, LIFE } from '../data.js';
import { pick, shuffle, sample } from '../ui.js';

const R = [
  { t: 'Kumpul Kode Teman', e: '🔢', d: 'Tiap orang punya kode 3 digit. Samperin & minta kode 2 temen, ketik secepat mungkin!', dur: 60000 },
  { t: 'Lampu Merah, Lampu Hijau', e: '🚦', d: 'Tahan saat MERAH. Begitu HIJAU, tap secepat kilat! Kecepetan = penalti.', dur: 12000 },
  { t: 'Insting 7 Detik Buta', e: '⏱️', d: 'Timer jalan tapi angkanya ilang di detik 3. Tap STOP pas di 7.00 detik!', dur: 14000 },
  { t: 'Bom Waktu Estafet', e: '💣', d: 'Kalau bom di HP lu, lempar ke temen secepatnya! Pemegang pas meledak kalah telak.', dur: 0 },
  { t: 'Kubu Minoritas', e: '⚖️', d: 'Pilih salah satu opsi. Kubu dengan suara PALING SEDIKIT kena!', dur: 15000 },
  { t: 'Sandi 1–6', e: '🔐', d: 'Tombol angka diacak. Tap 1 sampai 6 berurutan secepat kilat! Salah tap +1 detik.', dur: 20000 },
];
const NONE = 9e6;
let local = {}; // per-device minigame state, keyed by stage.k

const g = {
  id: 'hp6', name: 'Games HP 6 Ronde', emoji: '🎮', group: 'hp6',
  blurb: '6 minigame eliminasi di HP. Yang kalah tiap ronde kena pertanyaan deep talk.',
  steps: R.map((r, i) => `Ronde ${i + 1}: ${r.e} ${r.t}`),
  say: 'Games HP 6 Ronde! Yang kalah bukan dihukum, tapi dapet giliran cerita 🌙',
  min: 3,
  async start(C) {
    C.H.mem = { out: {}, qs: shuffle(LIFE[2].q) };
    await C.H.setStage('hp6', { phase: 'intro', out: {} });
  },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g, '<p class="muted">Tiap ronde ada yang tereliminasi dan dapet pertanyaan deep talk buat dijawab di depan sirkel.</p>') + bar(btn('round', '▶️ Ronde 1', 'primary xl'));
    const r = R[st.r];
    if (st.phase === 'play') {
      const alive = aliveIds(C);
      let extra = '';
      if (st.r === 3) extra = `<div class="bigemoji bomb">💣</div><h2>${esc(C.pl(st.holder).name)} pegang bom!</h2>`;
      if (st.r === 4) extra = `<div class="versus"><div class="side"><b>A</b><p>${esc(st.dil[0])}</p></div><div class="side"><b>B</b><p>${esc(st.dil[1])}</p></div></div>`;
      return `<div class="card center"><div class="qmeta">Ronde ${st.r + 1}/6</div><h2>${r.e} ${esc(r.t)}</h2><p>${esc(r.d)}</p>${st.endsAt ? timer(st.endsAt, r.dur) : ''}${extra}${progress(C, alive)}${whoAnswered(C, alive)}</div>` + bar(btn('finish', '⏭️ Akhiri ronde'));
    }
    if (st.phase === 'result') return resultHtml(C) + bar(st.r < 5 ? btn('round', `▶️ Ronde ${st.r + 2}`, 'primary xl') : btn('end', '🏁 Penutup', 'primary xl'));
    if (st.phase === 'end') return endHtml(C) + bar(btn('toMenu', '🏠 Menu', 'primary'));
    return '';
  },
  hostActs: {
    round: (C) => round(C),
    finish: (C) => finish(C),
    end: (C) => C.H.patch({ phase: 'end' }),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase !== 'play') return;
    if (st.r === 3) { if (C.now() > C.H.mem.boomAt) C.once('boom', () => finish(C)); return; }
    if (C.now() > st.endsAt + 500 || answered(C, aliveIds(C)).all) C.once('fin', () => finish(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    const out = (st.out || {})[C.me.id];
    if (st.phase === 'play') {
      const r = R[st.r];
      if (out) return `<div class="card center"><div class="bigemoji">🌙</div><h2>Lu udah out</h2><p>Pertanyaan lu:</p><div class="quote">${esc(out.q)}</div><p class="muted">Nonton & semangatin yang masih main!</p></div>`;
      if (C.mine !== undefined && st.r !== 3) return `<div class="card center"><div class="bigemoji">✅</div><h2>Selesai!</h2><p>${fmt(st.r, C.mine)}</p><small class="muted">Nunggu yang lain...</small></div>`;
      return `<div class="qmeta">Ronde ${st.r + 1}/6 • ${r.e} ${esc(r.t)}</div><p class="muted">${esc(r.d)}</p>${st.endsAt && st.r !== 1 && st.r !== 2 ? timer(st.endsAt, r.dur, false) : ''}<div id="mg">${mgHtml(C)}</div>`;
    }
    if (st.phase === 'result') {
      const meOut = (st.losers || []).includes(C.me.id);
      return (meOut ? `<div class="card center result bad"><div class="bigemoji">🎤</div><h2>Lu kena giliran cerita!</h2><div class="quote">${esc(out.q)}</div></div>` : out ? '' : `<div class="card center result good"><div class="bigemoji">💪</div><h2>Lolos ronde ${st.r + 1}!</h2></div>`) + resultHtml(C);
    }
    if (st.phase === 'end') return endHtml(C);
    return wait();
  },
  psig: (C) => JSON.stringify([C.stage.k, C.stage.phase, C.secret, C.stage.r === 3 ? C.stage.holder : 0, C.mine === undefined, (C.stage.out || {})[C.me.id] ? 1 : 0]),
  playerMount(el, C) { mountMinigame(el, C); },
  playerActs: {
    code: (C) => {
      const inp = document.getElementById('codein');
      const v = inp.value.trim();
      const L = local[C.stage.k];
      if (!/^\d{3}$/.test(v)) return;
      inp.value = '';
      if (v === (C.secret || {}).code || !C.stage.codes.includes(v) || L.got.includes(v)) { sfx.bad(); vibe(200); inp.placeholder = 'Kode salah/udah dipake!'; return; }
      L.got.push(v); sfx.good(); vibe(30);
      document.getElementById('gotn').textContent = L.got.length;
      if (L.got.length >= 2) C.send(C.now() - C.stage.startAt);
    },
    pass: (C, id) => {
      const st = C.stage;
      if (st.holder !== C.me.id) return;
      const L = local[st.k] || (local[st.k] = {});
      L.held = (L.held || 0) + (C.now() - st.since);
      sfx.whoosh(); vibe(30);
      C.send(L.held);
      C.db.tx(C.room('stage'), (s) => { if (!s || s.holder !== C.me.id || s.phase !== 'play') return s; s.holder = id; s.since = C.now(); return s; });
    },
    dil: (C, k) => { vibe(20); C.send({ c: k, t: C.now() - C.stage.startAt }); },
    num: (C, n, el) => {
      const L = local[C.stage.k];
      if (!L || L.done) return;
      if (+n === L.next) { el.classList.add('done'); L.next++; sfx.tap(); if (L.next > 6) { L.done = true; C.send(C.now() - L.t0 + L.pen); } }
      else { L.pen += 1000; sfx.bad(); vibe(150); }
    },
  },
  fx(C, prev) {
    const st = C.stage;
    if (st.r === 3 && st.phase === 'play' && prev && prev.holder !== st.holder && C.me && st.holder === C.me.id) { vibe([100, 50, 100]); sfx.buzz(); splash('💣 LEMPAR!', 'bad'); }
    if (!changed(C, prev)) return;
    if (st.phase === 'play') sfx.go();
    if (st.phase === 'result') { if (st.r === 3) sfx.boom(); else sfx.reveal(); }
    if (st.phase === 'end') { sfx.win(); confetti(); }
  },
};

const aliveIds = (C) => C.active.filter((p) => !(C.stage.out || {})[p.id]).map((p) => p.id);
const fmt = (r, v) => (typeof v === 'number' ? (r === 2 ? `Meleset ${(v / 1000).toFixed(2)} detik` : r === 3 ? `Pegang bom ${(v / 1000).toFixed(1)} detik` : `${(v / 1000).toFixed(2)} detik`) : v && v.c ? `Pilih ${v.c}` : '');

function mgHtml(C) {
  const st = C.stage;
  switch (st.r) {
    case 0: return `<div class="card center"><p>Kode lu:</p><div class="bignum">${esc((C.secret || {}).code || '...')}</div><p>Kumpulin <b><span id="gotn">0</span>/2</b> kode temen</p>
      <input id="codein" inputmode="numeric" maxlength="3" class="big-input" placeholder="Ketik kode temen" style="text-align:center"><button class="btn primary xl" data-act="code">Masukin</button></div>`;
    case 1: return `<div id="pad" class="pad wait">Siap...</div>`;
    case 2: return `<div class="card center"><div id="t7" class="bignum">0.00</div><button id="stop7" class="btn primary bigbtn">STOP di 7.00!</button></div>`;
    case 3: {
      if (st.holder !== C.me.id) return `<div class="card center"><div class="bigemoji">😮‍💨</div><h2>Aman... untuk sekarang</h2><p>Bom lagi di ${chip(C.pl(st.holder))}</p></div>`;
      return `<div class="card center result bad"><div class="bomb">💣</div><h2>BOM DI LU! LEMPAR!</h2><div class="choices two">${aliveIds(C).filter((id) => id !== C.me.id).map((id) => { const p = C.pl(id); return `<button class="choice" data-act="pass" data-arg="${id}"><span class="av">${esc(p.av)}</span>${esc(p.name)}</button>`; }).join('')}</div></div>`;
    }
    case 4: return `<div class="card"><h2>Pilih yang jujur:</h2><div class="choices"><button class="choice" data-act="dil" data-arg="A"><b>A</b> ${esc(st.dil[0])}</button><button class="choice" data-act="dil" data-arg="B"><b>B</b> ${esc(st.dil[1])}</button></div></div>`;
    case 5: return `<div class="numpad">${(st.pad || []).map((n) => `<button data-act="num" data-arg="${n}">${n}</button>`).join('')}</div>`;
  }
  return '';
}

function mountMinigame(el, C) {
  const st = C.stage;
  if (st.phase !== 'play') return;
  const L = local[st.k] || (local[st.k] = { got: [], next: 1, pen: 0 });
  if (st.r === 1) {
    const pad = el.querySelector('#pad');
    if (!pad) return;
    if (!L.greenAt) L.greenAt = C.now() + 1500 + Math.random() * 3500;
    let state = 'red';
    pad.className = 'pad red'; pad.textContent = 'TAHAN... 🔴';
    const tm = setInterval(() => {
      if (!document.body.contains(pad)) return clearInterval(tm);
      if (state === 'red' && C.now() >= L.greenAt) { state = 'green'; pad.className = 'pad green'; pad.textContent = 'TAP!!! 🟢'; vibe(30); }
    }, 10);
    pad.addEventListener('pointerdown', () => {
      if (L.done) return;
      L.done = true; clearInterval(tm);
      if (state === 'red') { sfx.bad(); vibe(300); pad.textContent = 'KECEPETAN! 😱'; C.send(3000); }
      else { const ms = C.now() - L.greenAt; sfx.good(); pad.textContent = `${ms} ms`; C.send(ms); }
    });
  }
  if (st.r === 2) {
    const t = el.querySelector('#t7'), b = el.querySelector('#stop7');
    if (!t) return;
    if (!L.t0) L.t0 = performance.now();
    const tm = setInterval(() => {
      if (!document.body.contains(t)) return clearInterval(tm);
      const s = (performance.now() - L.t0) / 1000;
      t.textContent = s < 3 ? s.toFixed(2) : '?.??';
      if (s > 12 && !L.done) { L.done = true; C.send(5000); }
    }, 30);
    b.addEventListener('pointerdown', () => { if (L.done) return; L.done = true; clearInterval(tm); const ms = performance.now() - L.t0; t.textContent = (ms / 1000).toFixed(2); vibe(30); C.send(Math.round(Math.abs(ms - 7000))); });
  }
  if (st.r === 5) { if (!L.t0) L.t0 = C.now(); }
}

async function round(C) {
  const r = C.stage.phase === 'intro' ? 0 : C.stage.r + 1;
  const alive = aliveIds(C);
  const now = C.now();
  const base = { phase: 'play', r, out: C.stage.out || {}, startAt: now, endsAt: R[r].dur ? now + R[r].dur : null };
  if (r === 0) {
    const codes = {}, secrets = {};
    const used = new Set();
    alive.forEach((id) => { let c; do { c = String(100 + Math.floor(Math.random() * 900)); } while (used.has(c)); used.add(c); codes[id] = c; secrets[id] = { code: c }; });
    await C.H.secrets(secrets);
    return C.H.setStage('hp6', { ...base, codes: Object.values(codes) });
  }
  await C.H.secrets(null);
  if (r === 3) {
    C.H.mem.boomAt = now + 20000 + Math.random() * 15000;
    return C.H.setStage('hp6', { ...base, holder: pick(alive), since: now });
  }
  if (r === 4) return C.H.setStage('hp6', { ...base, dil: pick(DILEMMAS) });
  if (r === 5) return C.H.setStage('hp6', { ...base, pad: shuffle([1, 2, 3, 4, 5, 6, '', '', ''].map(String)).map((x) => x || '·') });
  return C.H.setStage('hp6', base);
}

async function finish(C) {
  const st = C.stage;
  if (st.phase !== 'play') return;
  const alive = aliveIds(C);
  const left = 6 - st.r;
  const quota = Math.max(1, Math.ceil(alive.length / left));
  let minority = null;
  if (st.r === 4) {
    const c = { A: 0, B: 0 };
    alive.forEach((id) => { const v = C.inputs[id]; if (v && c[v.c] != null) c[v.c]++; });
    minority = c.A === c.B ? null : c.A < c.B ? 'A' : 'B';
  }
  const scored = alive.map((id) => {
    const v = C.inputs[id];
    let s = NONE;
    if (st.r === 3) { s = typeof v === 'number' ? v : 0; if (id === st.holder) s += 1e6 + (C.now() - st.since); }
    else if (st.r === 4) s = v ? v.t + (v.c === minority ? 1e6 : 0) : NONE;
    else if (typeof v === 'number') s = v;
    return { id, s };
  }).sort((a, b) => b.s - a.s);
  const losers = scored.slice(0, quota).map((x) => x.id);
  const out = { ...(st.out || {}) };
  const qs = C.H.mem.qs || shuffle(LIFE[2].q);
  losers.forEach((id) => { out[id] = { r: st.r, q: qs.length ? qs.shift() : pick(LIFE[2].q) }; });
  C.H.mem.qs = qs;
  const gains = {};
  alive.filter((id) => !losers.includes(id)).forEach((id) => { gains[id] = 2; });
  if (st.r === 5) losers.forEach((id) => { gains[id] = 10; }); // last survivors standing = champions
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'result', out, losers, minority, scores: scored.slice(0, 12) });
}

function resultHtml(C) {
  const st = C.stage;
  const r = R[st.r];
  return `<div class="card"><div class="qmeta">Hasil Ronde ${st.r + 1} • ${r.e} ${esc(r.t)}</div>
    ${st.r === 3 ? `<p>💥 Bom meledak di tangan ${esc(C.pl(st.holder).name)}!</p>` : ''}
    ${st.r === 4 ? `<p>${st.minority ? `Minoritas: <b>${st.minority}</b> (${esc(st.dil[st.minority === 'A' ? 0 : 1])})` : 'Suara seri! Yang paling lama mikir yang kena.'}</p>` : ''}
    ${st.r === 5 ? '<h2>👑 Juara terakhir yang bertahan!</h2>' : '<h2>🎤 Giliran cerita:</h2>'}
    ${(st.losers || []).map((id) => `<div class="card" style="margin:8px 0">${chip(C.pl(id))}<div class="quote">${esc(st.out[id].q)}</div></div>`).join('')}</div>`;
}

function endHtml(C) {
  const st = C.stage;
  const champs = Object.entries(st.out || {}).filter(([, v]) => v.r === 5).map(([id]) => id);
  return `<div class="card center"><h2>🏆 Juara Games HP 6 Ronde</h2><div class="bigav">${champs.map((id) => esc(C.pl(id).av)).join('')}</div><h2>${champs.map((id) => esc(C.pl(id).name)).join(' & ')}</h2>
    <p class="muted">Makasih udah pada cerita. Semoga yang didoain dikabulin, aamiin 🤲</p></div>`;
}

export default g;
