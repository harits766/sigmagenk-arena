import { esc, chip, timer, intro, wait, bar, btn, answered, progress, whoAnswered, changed, sfx, splash, vibe, confetti, endCard, dur } from './common.js';
import { HERD } from '../data.js';
import { fresh, norm } from '../ui.js';

const N = 5;
const DUR = (C) => dur(C, 'frekuensi', 'q', 25);

const g = {
  id: 'frekuensi', name: 'Satu Frekuensi', emoji: '🧠', group: 'battle',
  timers: [{ k: 'q', label: 'Waktu jawab', def: 25 }],
  blurb: 'Jawab sama kayak kebanyakan orang. Beda sendiri = zonk!',
  steps: ['Pertanyaan muncul, semua ngetik 1 jawaban singkat.', 'Jawaban yang paling banyak sama = MAYORITAS, semua anggotanya dapet poin.', 'Jangan sok unik. Di game ini yang menang yang paling "umum" 😆'],
  say: 'Satu Frekuensi! Coba tebak isi kepala temen-temen lu. Jangan nyeleneh sendiri ya 🧠',
  async start(C) {
    C.H.mem = { qs: fresh('herd', HERD, N), gains: {} };
    await C.H.setStage('frekuensi', { phase: 'intro' });
  },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('next', '▶️ Pertanyaan 1', 'primary xl'));
    if (st.phase === 'q') return `<div class="card center"><div class="qmeta">Ronde ${st.i + 1}/${N}</div><h2 class="qtext">${esc(st.q)}</h2>${timer(st.endsAt, DUR(C))}${progress(C)}${whoAnswered(C)}</div>` + bar(btn('toGroup', '⏭️ Tutup jawaban'));
    if (st.phase === 'group') {
      const gs = C.H.mem.groups || [];
      return `<div class="card"><div class="qmeta">Ronde ${st.i + 1}/${N}</div><h2>${esc(st.q)}</h2>
        <p class="muted">Centang jawaban yang maksudnya sama (misal "nasgor" & "nasi goreng"), terus gabungin.</p>
        <div class="choices">${gs.map((gr, i) => `<label class="choice"><input type="checkbox" id="mg${i}" style="width:auto"> <b>${esc(gr.label)}</b> <small>(${gr.ids.length})</small> <span class="muted">${gr.ids.map((id) => C.pl(id).av).join('')}</span></label>`).join('')}</div></div>` +
        bar(btn('merge', '🔗 Gabungin yang dicentang'), btn('reveal', '🎉 Umumin hasil', 'primary xl'));
    }
    if (st.phase === 'reveal') return revealHtml(C) + bar(st.i + 1 < N ? btn('next', `▶️ Pertanyaan ${st.i + 2}`, 'primary xl') : btn('finish', '🏁 Juara', 'primary xl'));
    if (st.phase === 'end') return endCard(C, 'Paling Sefrekuensi', st.gains) + bar(btn('toMenu', '🏠 Menu', 'primary'));
    return '';
  },
  hostActs: {
    next: (C) => { const i = C.stage.phase === 'intro' ? 0 : C.stage.i + 1; return C.H.setStage('frekuensi', { phase: 'q', i, q: C.H.mem.qs[i], endsAt: C.now() + DUR(C) }); },
    toGroup: (C) => toGroup(C),
    merge: (C) => {
      const gs = C.H.mem.groups;
      const sel = gs.map((_, i) => document.getElementById('mg' + i)?.checked).map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
      if (sel.length < 2) return;
      const keep = gs[sel[0]];
      sel.slice(1).forEach((i) => keep.ids.push(...gs[i].ids));
      C.H.mem.groups = gs.filter((_, i) => !sel.slice(1).includes(i)).sort((a, b) => b.ids.length - a.ids.length);
      document.querySelectorAll('[id^=mg]').forEach((x) => { x.checked = false; });
      C.redraw();
    },
    reveal: (C) => reveal(C),
    finish: (C) => C.H.patch({ phase: 'end', gains: C.H.mem.gains }),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'q' && (C.now() > st.endsAt + 300 || answered(C).all)) C.once('group', () => toGroup(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'q') {
      if (C.mine) return `<div class="card center locked"><div class="bigemoji">🔒</div><p>Jawaban lu: <b>${esc(C.mine.t)}</b></p><small class="muted">Nunggu yang lain...</small></div>`;
      return `<div class="card"><div class="qmeta">Ronde ${st.i + 1}/${N}</div><h2>${esc(st.q)}</h2>${timer(st.endsAt, DUR(C), false)}
        <input id="hans" maxlength="30" placeholder="Jawaban lu..." autocomplete="off" class="big-input"><button class="btn primary xl" data-act="send">Kirim</button></div>`;
    }
    if (st.phase === 'group') return wait('Host lagi ngelompokin jawaban...', 'Siap-siap ketauan siapa yang beda sendiri 😆');
    if (st.phase === 'reveal') {
      const gain = (st.gains || {})[C.me.id];
      return `<div class="card center result ${gain ? 'good' : 'bad'}"><div class="bigemoji">${gain ? '🧠' : '🤡'}</div><h2>${gain ? `Sefrekuensi! +${gain}` : 'Beda frekuensi...'}</h2></div>` + revealHtml(C);
    }
    if (st.phase === 'end') return endCard(C, 'Paling Sefrekuensi', st.gains);
    return wait();
  },
  playerActs: {
    send: (C) => { const v = document.getElementById('hans').value.trim(); if (!v) return; vibe(20); C.send({ t: v }); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'q') sfx.go();
    if (st.phase === 'reveal') { sfx.reveal(); if (C.me && (st.gains || {})[C.me.id]) { sfx.good(); confetti(50); } }
    if (st.phase === 'end') { sfx.win(); confetti(); }
  },
};

function revealHtml(C) {
  const st = C.stage;
  const gs = st.groups || [];
  const max = gs.length ? gs[0].ids.length : 1;
  return `<div class="card"><h2>${esc(st.q)}</h2><div class="bars">${gs.map((gr, i) => `
    <div class="vbar ${st.win && st.win.includes(i) ? 'win' : ''}" style="--w:${(gr.ids.length / max) * 100}%"><span>${st.win && st.win.includes(i) ? '👑 ' : ''}${esc(gr.label)}</span>
    <span>${gr.ids.map((id) => C.pl(id).av).join('')}</span><b>${gr.ids.length}</b></div>`).join('')}</div>
    ${gs.some((x) => x.ids.length === 1) && gs.length > 1 ? `<p class="muted center">🦄 Si paling beda: ${gs.filter((x) => x.ids.length === 1).map((x) => esc(C.pl(x.ids[0]).name)).join(', ')}</p>` : ''}</div>`;
}

function toGroup(C) {
  const map = {};
  for (const [pid, v] of Object.entries(C.inputs)) {
    if (!v || !v.t) continue;
    const k = norm(v.t) || v.t.toLowerCase();
    (map[k] = map[k] || { label: v.t, ids: [] }).ids.push(pid);
  }
  C.H.mem.groups = Object.values(map).sort((a, b) => b.ids.length - a.ids.length);
  return C.H.patch({ phase: 'group' });
}

async function reveal(C) {
  const gs = C.H.mem.groups || [];
  const top = gs.length ? gs[0].ids.length : 0;
  const win = top > 1 ? gs.map((x, i) => (x.ids.length === top ? i : -1)).filter((i) => i >= 0) : [];
  const pts = win.length === 1 ? 5 : 3;
  const gains = {};
  win.forEach((i) => gs[i].ids.forEach((id) => { gains[id] = pts; C.H.mem.gains[id] = (C.H.mem.gains[id] || 0) + pts; }));
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'reveal', groups: gs, win, gains });
}

export default g;
