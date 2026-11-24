import { esc, chip, timer, intro, wait, bar, btn, answered, progress, changed, sfx, splash, vibe, confetti } from './common.js';
import { LIFE, LIFE_TOPICS, LIFE_ANGLES, LIFE_FOLLOW } from '../data.js';
import { pick, shuffle } from '../ui.js';
import { toast, floatEmoji } from '../fx.js';
import { askAI } from '../ai.js';

const TALK = 4 * 60000, VDUR = 20000, SPIN = 3200;

const g = {
  id: 'life', name: 'Life Update Next Level', emoji: '🌙', group: 'deep',
  blurb: 'Deep talk bergilir. Roda pilih siapa yang cerita, sirkel pilih arah pertanyaan lanjutan.',
  steps: ['Roda acak milih siapa yang cerita + pertanyaannya.', 'Aturan anti-klise: wajib ada 1 cerita spesifik sebulan terakhir. Ga boleh cuma "alhamdulillah aman".', 'Abis cerita (maks 4 menit), semua vote arah pertanyaan lanjutan: Gali Akar Masalah, Iman & Tawakal, atau Action Plan.', 'Penutup: temen di sebelah kanannya mimpin doa khusus buat dia. Semua tap 🤲 Aamiin.'],
  say: 'Life Update Next Level. HP boleh tetap nyala, tapi hati yang full nyimak ya 🌙',
  async start(C) { C.H.mem = { done: [] }; await C.H.setStage('life', { phase: 'intro', level: 2 }); },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g, `<label>Level pertanyaan</label><div class="row">${[1, 2].map((l) => btn('level', LIFE[l].name, st.level === l ? 'primary' : '', l)).join('')}</div>`) + bar(btn('spin', '🎡 Putar roda', 'primary xl'));
    const sp = C.pl(st.speaker);
    if (st.phase === 'spin') return `<div class="card center"><div class="roulette" id="roul"></div><div id="spinq" class="quote" style="opacity:0;transition:.5s">${esc(st.q)}</div></div>` + bar(btn('talk', '🎤 Mulai cerita (4 menit)', 'primary xl'), btn('spin', '🔄 Putar ulang'));
    if (st.phase === 'talk') return `<div class="card center"><h2>${esc(sp.av)} ${esc(sp.name)} cerita</h2><div class="quote">${esc(st.q)}</div>${timer(st.endsAt, TALK)}<p class="muted">Ingat: wajib 1 cerita spesifik sebulan terakhir 🙏</p></div>` + bar(btn('follow', '⏭️ Udah, vote pertanyaan lanjutan', 'primary xl'));
    if (st.phase === 'follow') return `<div class="card center"><h2>Arah pertanyaan buat ${esc(sp.name)}</h2>${timer(st.endsAt, VDUR)}${tallyHtml(C)}${progress(C, st.voters)}</div>` + bar(btn('deep', '🎯 Tampilkan pertanyaan', 'primary xl'));
    if (st.phase === 'deep') return `<div class="card center"><p class="muted">${esc(LIFE_TOPICS[st.topic])} • ${esc(LIFE_ANGLES[st.angle])}${st.ai ? ' • ✨ AI' : ''}</p><h2>${esc(sp.av)} ${esc(sp.name)}</h2><div class="quote">${esc(st.fq)}</div>
      <label>Ringkasan cerita (opsional, buat AI)</label><input id="lsum" placeholder="mis. lagi bingung pilih kerja atau S2"></div>` + bar(btn('aiFollow', '✨ Pertanyaan AI'), btn('doa', '🤲 Lanjut doa', 'primary xl'));
    if (st.phase === 'doa') return doaHtml(C) + bar(btn('spin', '🎡 Orang berikutnya', 'primary xl'), btn('toMenu', '🏁 Udahan'));
    return '';
  },
  hostMount(el, C) { mountSpin(el, C); },
  hostActs: {
    level: (C, l) => C.H.patch({ level: +l }),
    spin: (C) => spin(C),
    talk: (C) => C.H.setStage('life', { ...keep(C), phase: 'talk', endsAt: C.now() + TALK }),
    follow: (C) => C.H.setStage('life', { ...keep(C), phase: 'follow', voters: C.active.filter((p) => p.id !== C.stage.speaker).map((p) => p.id), endsAt: C.now() + VDUR }),
    deep: (C) => deep(C),
    aiFollow: async (C) => {
      const sum = document.getElementById('lsum')?.value.trim();
      toast('✨ Minta pertanyaan ke AI...');
      const r = await askAI('followup', { question: C.stage.q, summary: sum || '(tidak ada ringkasan)', topic: LIFE_TOPICS[C.stage.topic], angle: LIFE_ANGLES[C.stage.angle] });
      if (!r) return toast('AI lagi ga bisa dipake, pake bank pertanyaan aja ya', 'bad');
      await C.H.patch({ fq: r.items[0], ai: true });
    },
    doa: (C) => C.H.setStage('life', { ...keep(C), phase: 'doa', leader: rightOf(C, C.stage.speaker) }),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'follow' && (C.now() > st.endsAt + 300 || st.voters.every((id) => C.inputs[id] && C.inputs[id].t && C.inputs[id].a))) C.once('deep', () => deep(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    const sp = C.pl(st.speaker);
    const isSp = C.me.id === st.speaker;
    if (st.phase === 'spin') return `<div class="card center"><div class="roulette" id="roul"></div><div id="spinq" class="quote" style="opacity:0;transition:.5s">${esc(st.q)}</div></div>`;
    if (st.phase === 'talk') return `<div class="card center">${isSp ? '<h2>🎤 Giliran lu cerita</h2>' : `<h2>${esc(sp.av)} ${esc(sp.name)} lagi cerita</h2>`}<div class="quote">${esc(st.q)}</div>${timer(st.endsAt, TALK, false)}<p class="muted">${isSp ? 'Cerita 1 kejadian spesifik sebulan terakhir ya 🙏' : 'Simak baik-baik. Abis ini lu yang milih pertanyaan lanjutannya.'}</p></div>`;
    if (st.phase === 'follow') {
      if (isSp) return wait('Temen-temen lagi milih pertanyaan lanjutan buat lu...', 'Tarik napas dulu 😌');
      const m = C.mine || {};
      return `<div class="card"><h3>Ceritanya soal apa?</h3><div class="choices">${Object.entries(LIFE_TOPICS).map(([k, v]) => `<button class="choice ${m.t === k ? 'sel' : ''}" data-act="vt" data-arg="${k}">${esc(v)}</button>`).join('')}</div>
        <h3 style="margin-top:14px">Mau digali ke arah mana?</h3><div class="choices">${Object.entries(LIFE_ANGLES).map(([k, v]) => `<button class="choice ${m.a === k ? 'sel' : ''}" data-act="va" data-arg="${k}">${esc(v)}</button>`).join('')}</div>${timer(st.endsAt, VDUR, false)}</div>`;
    }
    if (st.phase === 'deep') return `<div class="card center"><p class="muted">${esc(LIFE_ANGLES[st.angle])}</p><h2>${isSp ? 'Pertanyaan buat lu:' : `Buat ${esc(sp.name)}:`}</h2><div class="quote">${esc(st.fq)}</div></div>`;
    if (st.phase === 'doa') return doaHtml(C) + `<button class="btn gold bigbtn" data-act="aamiin">🤲 Aamiin</button>`;
    return wait();
  },
  psig: (C) => JSON.stringify([C.stage, C.mine]),
  playerMount(el, C) { mountSpin(el, C); },
  playerActs: {
    vt: (C, k) => { vibe(15); C.send({ ...(C.mine || {}), t: k }); },
    va: (C, k) => { vibe(15); C.send({ ...(C.mine || {}), a: k }); },
    aamiin: (C) => { vibe(30); C.db.push(C.room('fx'), { e: '🤲', n: C.me.name, ts: C.now() }); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'deep') sfx.reveal();
    if (st.phase === 'doa') sfx.whoosh();
  },
};

const keep = (C) => { const { speaker, q, level, topic, angle, fq } = C.stage; return { speaker, q, level, topic, angle, fq }; };
function rightOf(C, id) { const ids = C.active.map((p) => p.id); const i = ids.indexOf(id); return ids[(i + 1) % ids.length]; }

async function spin(C) {
  const mem = C.H.mem;
  mem.done = mem.done || [];
  let pool = C.active.filter((p) => !mem.done.includes(p.id));
  if (!pool.length) { mem.done = []; pool = C.active; }
  const speaker = pick(pool).id;
  mem.done.push(speaker);
  const level = C.stage.level || 2;
  mem.used = mem.used || [];
  const qs = LIFE[level].q.filter((q) => !mem.used.includes(q));
  const q = pick(qs.length ? qs : LIFE[level].q);
  mem.used.push(q);
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

function tallyHtml(C) {
  const t = {}, a = {};
  Object.values(C.inputs).forEach((v) => { if (!v) return; if (v.t) t[v.t] = (t[v.t] || 0) + 1; if (v.a) a[v.a] = (a[v.a] || 0) + 1; });
  const row = (obj, labels) => { const max = Math.max(1, ...Object.values(obj)); return Object.entries(labels).map(([k, l]) => `<div class="vbar" style="--w:${((obj[k] || 0) / max) * 100}%"><span>${esc(l)}</span><b>${obj[k] || 0}</b></div>`).join(''); };
  return `<div class="bars">${row(t, LIFE_TOPICS)}</div><div class="bars">${row(a, LIFE_ANGLES)}</div>`;
}

async function deep(C) {
  const t = {}, a = {};
  Object.values(C.inputs).forEach((v) => { if (!v) return; if (v.t) t[v.t] = (t[v.t] || 0) + 1; if (v.a) a[v.a] = (a[v.a] || 0) + 1; });
  const top = (o, keys) => { const s = Object.entries(o).sort((x, y) => y[1] - x[1]); return s.length ? s[0][0] : pick(keys); };
  const topic = top(t, Object.keys(LIFE_TOPICS));
  const angle = top(a, Object.keys(LIFE_ANGLES));
  await C.H.setStage('life', { ...keep(C), phase: 'deep', topic, angle, fq: LIFE_FOLLOW[topic][angle] });
}

function doaHtml(C) {
  const st = C.stage;
  const sp = C.pl(st.speaker), ld = C.pl(st.leader);
  return `<div class="card center"><div class="bigemoji">🤲</div><h2>Doa buat ${esc(sp.name)}</h2><p>${chip(ld)} mimpin doa singkat, sebut nama & hajat ${esc(sp.name)}.</p><p class="muted">Yang lain tap Aamiin 🤲</p></div>`;
}

export default g;
