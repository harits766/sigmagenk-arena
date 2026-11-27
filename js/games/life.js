import { esc, chip, timer, intro, wait, bar, btn, changed, sfx, splash, vibe, confetti, dur } from './common.js';
import { LIFE } from '../data.js';
import { pick, shuffle } from '../ui.js';

const SPIN = 3200;
const TALK = (C) => dur(C, 'life', 'talk', 240);

const g = {
  id: 'life', name: 'Life Update Next Level', emoji: '🌙', group: 'deep',
  blurb: 'Deep talk bergilir. Roda pilih siapa yang cerita, yang lain boleh nanya langsung.',
  steps: ['Roda acak milih siapa yang cerita + pertanyaannya. Pertanyaannya bisa diganti atau ditulis sendiri.', 'Aturan anti-klise: wajib ada 1 cerita spesifik sebulan terakhir. Ga boleh cuma "alhamdulillah aman".', 'Abis cerita, siapa aja boleh ngirim pertanyaan sendiri lewat HP. Host pilih mau ditampilin atau skip.', 'Penutup: temen di sebelah kanannya mimpin doa khusus buat dia. Semua tap 🤲 Aamiin.'],
  timers: [{ k: 'talk', label: 'Waktu cerita', def: 240 }],
  say: 'Life Update Next Level. HP boleh tetap nyala, tapi hati yang full nyimak ya 🌙',
  async start(C) { C.H.mem = { done: [] }; await C.H.setStage('life', { phase: 'intro', level: 2 }); },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g, `<label>Level pertanyaan</label><div class="row">${[1, 2].map((l) => btn('level', LIFE[l].name, st.level === l ? 'primary' : '', l)).join('')}</div>`) + bar(btn('spin', '🎡 Putar roda', 'primary xl'));
    const sp = C.pl(st.speaker);
    const editQ = `<div class="row"><input id="lcq" placeholder="Tulis pertanyaan sendiri..." style="flex:3">${btn('customQ', '✍️ Pakai')}${btn('rerollQ', '🔄 Ganti pertanyaan')}</div>`;
    if (st.phase === 'spin') return `<div class="card center"><div class="roulette" id="roul"></div><div id="spinq" class="quote" style="opacity:0;transition:.5s">${esc(st.q)}</div>${editQ}</div>` + bar(btn('talk', '🎤 Mulai cerita', 'primary xl'), btn('spin', '🎡 Putar ulang orangnya'));
    if (st.phase === 'talk') return `<div class="card center"><h2>${esc(sp.av)} ${esc(sp.name)} cerita</h2><div class="quote">${esc(st.q)}</div>${timer(st.endsAt, TALK(C))}<p class="muted">Ingat: wajib 1 cerita spesifik sebulan terakhir 🙏</p>${editQ}</div>` + bar(btn('ask', '⏭️ Udah, buka sesi tanya', 'primary xl'), btn('doa', '⏩ Skip ke doa'));
    if (st.phase === 'ask') {
      const qs = Object.entries(C.inputs).filter(([, v]) => v && v.q);
      return `<div class="card center"><h2>Pertanyaan buat ${esc(sp.av)} ${esc(sp.name)}</h2>${st.shown ? `<div class="quote">${esc(st.shown.q)}<br><small class="muted">dari ${esc(C.pl(st.shown.by).name)}</small></div>` : '<p class="muted">Yang lain lagi ngetik pertanyaan di HP...</p>'}</div>
        <div class="card"><h3>📥 Masuk (${qs.length})</h3>${qs.map(([id, v]) => `<div class="prow"><span style="flex:1">${esc(v.q)} <small class="muted">— ${esc(C.pl(id).name)}</small></span>${btn('showQ', '📣 Tampilkan', 'sm', id)}</div>`).join('') || '<p class="muted">Belum ada.</p>'}
        <div class="row"><input id="lhq" placeholder="Atau host nanya sendiri..." style="flex:3">${btn('hostQ', '📣 Tampilkan')}</div></div>` + bar(btn('doa', '🤲 Lanjut doa', 'primary xl'));
    }
    if (st.phase === 'doa') return doaHtml(C) + bar(btn('spin', '🎡 Orang berikutnya', 'primary xl'), btn('toMenu', '🏁 Udahan'));
    return '';
  },
  hostMount(el, C) { mountSpin(el, C); },
  hostActs: {
    level: (C, l) => C.H.patch({ level: +l }),
    spin: (C) => spin(C),
    customQ: (C) => { const v = document.getElementById('lcq')?.value.trim(); if (v) { document.getElementById('lcq').value = ''; return C.H.patch({ q: v }); } },
    rerollQ: (C) => C.H.patch({ q: nextQ(C, C.stage.level || 2) }),
    talk: (C) => C.H.setStage('life', { ...keep(C), phase: 'talk', endsAt: C.now() + TALK(C) }),
    ask: (C) => C.H.setStage('life', { ...keep(C), phase: 'ask' }),
    showQ: (C, id) => C.H.patch({ shown: { q: C.inputs[id].q, by: id } }),
    hostQ: (C) => { const v = document.getElementById('lhq')?.value.trim(); if (v) { document.getElementById('lhq').value = ''; return C.H.patch({ shown: { q: v, by: '' } }); } },
    doa: (C) => C.H.setStage('life', { ...keep(C), phase: 'doa', leader: rightOf(C, C.stage.speaker) }),
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    const sp = C.pl(st.speaker);
    const isSp = C.me.id === st.speaker;
    if (st.phase === 'spin') return `<div class="card center"><div class="roulette" id="roul"></div><div id="spinq" class="quote" style="opacity:0;transition:.5s">${esc(st.q)}</div></div>`;
    if (st.phase === 'talk') return `<div class="card center">${isSp ? '<h2>🎤 Giliran lu cerita</h2>' : `<h2>${esc(sp.av)} ${esc(sp.name)} lagi cerita</h2>`}<div class="quote">${esc(st.q)}</div>${timer(st.endsAt, TALK(C), false)}<p class="muted">${isSp ? 'Cerita 1 kejadian spesifik sebulan terakhir ya 🙏' : 'Simak baik-baik. Abis ini lu boleh nanya langsung.'}</p></div>`;
    if (st.phase === 'ask') {
      const shown = st.shown ? `<div class="card center"><h3>${isSp ? 'Pertanyaan buat lu:' : `Buat ${esc(sp.name)}:`}</h3><div class="quote">${esc(st.shown.q)}</div></div>` : '';
      if (isSp) return shown || wait('Temen-temen lagi nulis pertanyaan buat lu...', 'Tarik napas dulu 😌');
      if (C.mine) return shown + `<div class="card center"><p>Pertanyaan lu udah masuk ✅</p><p class="muted">"${esc(C.mine.q)}"</p></div>`;
      return shown + `<div class="card"><h3>Mau nanya apa ke ${esc(sp.name)}? (opsional)</h3><textarea id="lq" maxlength="160" placeholder="Tulis pertanyaan lu..."></textarea><button class="btn primary xl" data-act="sendQ">Kirim ke host</button></div>`;
    }
    if (st.phase === 'doa') return doaHtml(C) + `<button class="btn gold bigbtn" data-act="aamiin">🤲 Aamiin</button>`;
    return wait();
  },
  psig: (C) => JSON.stringify([C.stage, C.mine, C.meta.timers]),
  playerMount(el, C) { mountSpin(el, C); },
  playerActs: {
    sendQ: (C) => { const v = document.getElementById('lq').value.trim(); if (v) { vibe(20); C.send({ q: v }); } },
    aamiin: (C) => { vibe(30); C.db.push(C.room('fx'), { e: '🤲', n: C.me.name, ts: C.now() }); },
  },
  fx(C, prev) {
    const st = C.stage;
    if (prev && prev.k === st.k && st.shown && JSON.stringify(st.shown) !== JSON.stringify(prev.shown)) sfx.reveal();
    if (!changed(C, prev)) return;
    if (st.phase === 'doa') sfx.whoosh();
  },
};

const keep = (C) => { const { speaker, q, level } = C.stage; return { speaker, q, level }; };
function nextQ(C, level) {
  const mem = C.H.mem;
  mem.used = mem.used || [];
  const qs = LIFE[level].q.filter((q) => !mem.used.includes(q));
  const q = pick(qs.length ? qs : LIFE[level].q);
  mem.used.push(q);
  return q;
}
function rightOf(C, id) { const ids = C.active.map((p) => p.id); const i = ids.indexOf(id); return ids[(i + 1) % ids.length]; }

async function spin(C) {
  const mem = C.H.mem;
  mem.done = mem.done || [];
  let pool = C.active.filter((p) => !mem.done.includes(p.id));
  if (!pool.length) { mem.done = []; pool = C.active; }
  const speaker = pick(pool).id;
  mem.done.push(speaker);
  const level = C.stage.level || 2;
  const q = nextQ(C, level);
  await C.H.setStage('life', { phase: 'spin', speaker, q, level, names: shuffle(C.active.map((p) => p.id)), at: C.now() });
}

function mountSpin(el, C) {
  const st = C.stage;
  const box = el.querySelector('#roul');
  if (!box || st.phase !== 'spin') return;
  const names = st.names || [st.speaker];
  const endAt = st.at + SPIN;
  let last = -1;
  const tick = () => {
    if (!document.body.contains(box)) return;
    const now = C.now();
    if (now >= endAt) {
      const p = C.pl(st.speaker);
      box.innerHTML = `<div><div style="font-size:4rem">${esc(p.av)}</div><div class="nm">${esc(p.name)}</div></div>`;
      const q = el.querySelector('#spinq'); if (q) q.style.opacity = 1;
      if (now - endAt > 600) return;
      sfx.win();
      if (C.me && C.me.id === st.speaker) { vibe([100, 50, 100]); splash('🎤 LU!'); } else confetti(40);
      return;
    }
    // Slows down as it approaches the end.
    const prog = Math.max(0, (now - st.at) / SPIN);
    const idx = Math.floor(Math.pow(prog, 0.5) * 30) % names.length;
    if (idx !== last) { last = idx; const p = C.pl(names[idx]); box.innerHTML = `<div><div style="font-size:3rem">${esc(p.av)}</div><div class="nm">${esc(p.name)}</div></div>`; sfx.tick(); }
    requestAnimationFrame(tick);
  };
  tick();
}

function doaHtml(C) {
  const st = C.stage;
  const sp = C.pl(st.speaker), ld = C.pl(st.leader);
  return `<div class="card center"><div class="bigemoji">🤲</div><h2>Doa buat ${esc(sp.name)}</h2><p>${chip(ld)} mimpin doa singkat, sebut nama & hajat ${esc(sp.name)}.</p><p class="muted">Yang lain tap Aamiin 🤲</p></div>`;
}

export default g;
