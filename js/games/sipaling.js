import { esc, chip, timer, intro, wait, bar, btn, answered, progress, whoAnswered, changed, sfx, splash, vibe, confetti, dur } from './common.js';
import { SIPALING } from '../data.js';
import { fresh } from '../ui.js';

const VDUR = (C) => dur(C, 'sipaling', 'vote', 12);
const DDUR = (C) => dur(C, 'sipaling', 'defend', 15);

const g = {
  id: 'sipaling', name: 'Si Paling...', emoji: '👉', group: 'heboh',
  timers: [{ k: 'vote', label: 'Waktu vote', def: 12 }, { k: 'defend', label: 'Waktu klarifikasi', def: 15 }],
  blurb: 'Vote rahasia di HP: siapa "si paling..."? Yang kepilih wajib klarifikasi!',
  steps: ['Muncul pertanyaan "Si paling...".', 'Semua vote 1 orang di HP (anonim, ga boleh diri sendiri).', 'Yang paling banyak dipilih maju dan klarifikasi 15 detik!', 'Yang vote sama kayak mayoritas +1 poin.'],
  say: 'Si Paling! Jujur-jujuran ya, tapi tetep sayang temen 🫶',
  min: 3,
  async start(C) { C.H.mem = { titles: [] }; await C.H.setStage('sipaling', { phase: 'intro' }); },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('next', '▶️ Pertanyaan pertama', 'primary xl'));
    if (st.phase === 'vote') return `<div class="card center"><h2 class="qtext">${esc(st.q)}</h2>${timer(st.endsAt, VDUR(C))}${progress(C)}${whoAnswered(C)}</div>` + bar(btn('reveal', '⏭️ Buka hasil'));
    if (st.phase === 'reveal') return revealHtml(C) + bar(btn('next', '▶️ Pertanyaan berikutnya', 'primary xl'), btn('custom', '✍️ Pertanyaan sendiri'), btn('toMenu', '🏁 Udahan'));
    return '';
  },
  hostActs: {
    next: (C) => C.H.setStage('sipaling', { phase: 'vote', q: fresh('sipaling', SIPALING, 1)[0], endsAt: C.now() + VDUR(C) }),
    custom: (C) => { const q = prompt('Si paling...?', 'Si paling '); if (q) C.H.setStage('sipaling', { phase: 'vote', q, endsAt: C.now() + VDUR(C) }); },
    reveal: (C) => reveal(C),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'vote' && (C.now() > st.endsAt + 300 || answered(C).all)) C.once('rev', () => reveal(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'vote') {
      if (C.mine) return `<div class="card center"><h2>${esc(st.q)}</h2><p>Lu pilih: ${chip(C.pl(C.mine))}</p><small class="muted">Rahasia kok 🤫</small></div>`;
      return `<div class="card"><h2>${esc(st.q)}</h2>${timer(st.endsAt, VDUR(C), false)}<div class="choices two">${C.active.filter((p) => p.id !== C.me.id).map((p) => `<button class="choice" data-act="vote" data-arg="${p.id}"><span class="av">${esc(p.av)}</span>${esc(p.name)}</button>`).join('')}</div></div>`;
    }
    if (st.phase === 'reveal') {
      const me = st.top && st.top.includes(C.me.id);
      return (me ? `<div class="card center result bad"><div class="bigemoji">🎤</div><h2>ITU LU! Maju, klarifikasi!</h2></div>` : '') + revealHtml(C);
    }
    return wait();
  },
  playerActs: { vote: (C, id) => { vibe(20); C.send(id); } },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'vote') sfx.go();
    if (st.phase === 'reveal') { sfx.reveal(); if (C.me && st.top && st.top.includes(C.me.id)) { vibe([100, 50, 100]); splash('👉 LU!'); } else confetti(40); }
  },
};

function revealHtml(C) {
  const st = C.stage;
  const t = st.tally || {};
  const max = Math.max(1, ...Object.values(t));
  return `<div class="card center"><h2>${esc(st.q)}</h2>
    ${st.top && st.top.length ? `<div class="bigav">${st.top.map((id) => esc(C.pl(id).av)).join('')}</div><h2>${st.top.map((id) => esc(C.pl(id).name)).join(' & ')}</h2><p>Klarifikasi dimulai!</p>${timer(st.at + DDUR(C), DDUR(C))}` : '<p>Ga ada yang vote 😅</p>'}
    <div class="bars">${Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => `<div class="vbar" style="--w:${(n / max) * 100}%">${chip(C.pl(id))}<b>${n}</b></div>`).join('')}</div></div>`;
}

async function reveal(C) {
  const t = {};
  Object.values(C.inputs).forEach((id) => { t[id] = (t[id] || 0) + 1; });
  const max = Math.max(0, ...Object.values(t));
  const top = max ? Object.keys(t).filter((id) => t[id] === max) : [];
  const gains = {};
  Object.entries(C.inputs).forEach(([pid, id]) => { if (top.includes(id)) gains[pid] = 1; });
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'reveal', tally: t, top, at: C.now() });
}

export default g;
