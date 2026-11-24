import { esc, chip, timer, intro, wait, bar, btn, answered, progress, changed, sfx, splash, vibe, confetti, endCard } from './common.js';
import { QUIZ } from '../data.js';
import { fresh } from '../ui.js';

const N = 8, DUR = 15000, LEAD = 1200;
const SHAPES = ['▲', '◆', '●', '■'];

const g = {
  id: 'kuis', name: 'Kuis Kilat', emoji: '⚡', group: 'battle',
  blurb: 'Kuis Islami & kampus. Makin cepet jawab, makin gede poinnya.',
  steps: ['Soal muncul di HP semua orang.', 'Pilih jawaban secepat mungkin, poin turun tiap detik.', 'Bener beruntun = bonus streak 🔥. Poin lu masuk ke kubu lu.'],
  say: 'Kuis Kilat! Jempol siap? Yang paling cepet & bener, poinnya paling gede ⚡',
  async start(C) {
    C.H.mem = { qs: fresh('quiz', QUIZ, N), streak: {}, gains: {} };
    await C.H.setStage('kuis', { phase: 'intro', n: N });
  },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('next', '▶️ Mulai Soal 1', 'primary xl'));
    if (st.phase === 'q') {
      return `<div class="card qcard"><div class="qmeta">Soal ${st.i + 1}/${st.n}</div><h2 class="qtext">${esc(st.q.q)}</h2>${timer(st.endsAt, DUR)}
        <div class="opts">${st.q.o.map((o, i) => `<div class="opt o${i}"><span>${SHAPES[i]}</span>${esc(o)}</div>`).join('')}</div>${progress(C)}</div>
        ${bar(btn('reveal', '⏭️ Buka jawaban sekarang'))}`;
    }
    if (st.phase === 'reveal') {
      const tot = Math.max(1, st.dist.reduce((a, b) => a + b, 0));
      const top = Object.entries(st.gains || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return `<div class="card qcard"><div class="qmeta">Soal ${st.i + 1}/${st.n}</div><h2 class="qtext">${esc(st.q.q)}</h2>
        <div class="opts">${st.q.o.map((o, i) => `<div class="opt o${i} ${i === st.a ? 'right' : 'dim'}"><span>${SHAPES[i]}</span>${esc(o)}<em class="cnt" style="--w:${(st.dist[i] / tot) * 100}%">${st.dist[i]}</em></div>`).join('')}</div>
        ${top.length ? `<h3>⚡ Tercepat</h3><ol class="board">${top.map(([id, v], k) => `<li style="--i:${k}"><span class="rank">${k + 1}</span>${chip(C.pl(id))}<b>+${v}</b></li>`).join('')}</ol>` : '<p class="muted center">Ga ada yang bener 😅</p>'}</div>
        ${bar(st.i + 1 < st.n ? btn('next', `▶️ Soal ${st.i + 2}`, 'primary xl') : btn('finish', '🏁 Lihat Juara', 'primary xl'))}`;
    }
    if (st.phase === 'end') return endCard(C, 'Juara Kuis Kilat', st.gains) + bar(btn('toMenu', '🏠 Menu', 'primary'));
    return '';
  },
  hostActs: {
    next: async (C) => {
      const i = C.stage.phase === 'intro' ? 0 : C.stage.i + 1;
      const q = C.H.mem.qs[i];
      const at = C.now() + LEAD;
      await C.H.setStage('kuis', { phase: 'q', i, n: N, q: { q: q.q, o: q.o }, startAt: at, endsAt: at + DUR });
    },
    reveal: (C) => reveal(C),
    finish: (C) => C.H.patch({ phase: 'end', gains: C.H.mem.gains }),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase !== 'q') return;
    if (C.now() > st.endsAt + 300 || answered(C).all) C.once('reveal', () => reveal(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'q') {
      if (C.mine) return `<div class="card center locked"><div class="bigshape o${C.mine.a}">${SHAPES[C.mine.a]}</div><p>Jawaban terkunci!</p><small class="muted">Nunggu yang lain...</small></div>`;
      return `<div class="qmeta">Soal ${st.i + 1}/${st.n}</div><p class="qsmall">${esc(st.q.q)}</p>${timer(st.endsAt, DUR, false)}
        <div class="bigopts">${st.q.o.map((o, i) => `<button class="opt o${i}" data-act="ans" data-arg="${i}"><span>${SHAPES[i]}</span>${esc(o)}</button>`).join('')}</div>`;
    }
    if (st.phase === 'reveal') {
      const gain = (st.gains || {})[C.me.id];
      const my = st.picks ? st.picks[C.me.id] : undefined;
      return `<div class="card center result ${gain ? 'good' : 'bad'}">
        <div class="bigemoji">${gain ? '✅' : my === undefined ? '⌛' : '❌'}</div>
        <h2>${gain ? `+${gain} poin` : my === undefined ? 'Kelamaan!' : 'Salah'}</h2>
        ${gain && (st.streaks || {})[C.me.id] > 1 ? `<p class="streak">🔥 Streak ${(st.streaks || {})[C.me.id]}</p>` : ''}
        <p class="muted">Jawaban: <b>${esc(st.q.o[st.a])}</b></p></div>`;
    }
    if (st.phase === 'end') return endCard(C, 'Juara Kuis Kilat', st.gains);
    return wait();
  },
  playerActs: {
    ans: (C, i) => { if (C.mine || C.now() > C.stage.endsAt) return; vibe(20); C.send({ a: +i, t: C.now() }); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'q') sfx.go();
    if (st.phase === 'reveal') {
      if (C.isHost) return sfx.reveal();
      const gain = (st.gains || {})[C.me.id];
      if (gain) { sfx.good(); splash('+' + gain, 'good'); vibe([30, 40, 30]); } else { sfx.bad(); vibe(200); }
    }
    if (st.phase === 'end') { sfx.win(); confetti(); }
  },
};

async function reveal(C) {
  const st = C.stage;
  if (st.phase !== 'q') return;
  const q = C.H.mem.qs[st.i];
  const dist = [0, 0, 0, 0];
  const gains = {}, picks = {}, streaks = {};
  const mem = C.H.mem;
  for (const p of C.active) {
    const inp = C.inputs[p.id];
    if (!inp) { mem.streak[p.id] = 0; continue; }
    dist[inp.a]++;
    picks[p.id] = inp.a;
    if (inp.a === q.a) {
      const frac = Math.max(0, Math.min(1, (st.endsAt - inp.t) / DUR));
      mem.streak[p.id] = (mem.streak[p.id] || 0) + 1;
      streaks[p.id] = mem.streak[p.id];
      gains[p.id] = 10 + Math.round(10 * frac) + Math.min(mem.streak[p.id] - 1, 3) * 2;
      mem.gains[p.id] = (mem.gains[p.id] || 0) + gains[p.id];
    } else mem.streak[p.id] = 0;
  }
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'reveal', a: q.a, dist, gains, picks, streaks });
}

export default g;
