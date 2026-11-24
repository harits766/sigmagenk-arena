import { esc, chip, timer, intro, wait, bar, btn, answered, progress, whoAnswered, changed, sfx, splash, vibe, confetti } from './common.js';
import { BOOK_Q, BOOK_DADAKAN, BOOK_CROSSFIRE } from '../data.js';
import { pick } from '../ui.js';
import { toast } from '../fx.js';
import { askAI } from '../ai.js';

const MIN = 60000;
const PH = { pitch: { n: 'Babak 1 • 5-Minute Pitch', d: 5 * MIN }, hotseat: { n: 'Babak 2 • Hot Seat', d: 10 * MIN }, crossfire: { n: 'Babak 3 • Cross-Fire Forum', d: 10 * MIN }, takeaway: { n: 'Babak 4 • One-Sentence Takeaway', d: 3 * MIN } };

const g = {
  id: 'buku', name: 'Bedah Buku Dadakan', emoji: '📚', group: 'deep',
  blurb: 'Hot seat bedah buku 25 menit. Ga bawa buku? AI kasih bahan dadakan.',
  steps: ['Babak 1: Pembedah pitch 5 menit (judul, masalah utama, 1 ide paling nampol). Pake bahasa sendiri!', 'Babak 2: Hot Seat, pertanyaan kritis muncul satu-satu.', 'Babak 3: Cross-Fire, semua vote/ketik pertanyaan buat nantang pembedah.', 'Babak 4: Semua nulis 1 kalimat insight yang mau dipraktikkan pekan ini.'],
  say: 'Bedah Buku Dadakan! Santai aja, ini bukan sidang skripsi kok 📚',
  async start(C) { C.H.mem = {}; await C.H.setStage('buku', { phase: 'setup', cat: 'self', mode: 'own' }); },
  host(C) {
    const st = C.stage;
    if (st.phase === 'setup') {
      return intro(g) + `<div class="card"><label>Pembedah</label><div class="chips">${C.active.map((p) => `<button class="chip ${st.speaker === p.id ? 'tA' : ''}" data-act="speaker" data-arg="${p.id}" style="${st.speaker === p.id ? 'background:#134e3a' : ''}">${esc(p.av)} ${esc(p.name)}</button>`).join('')}</div>
        <button class="btn" data-act="randSpeaker">🎲 Acak pembedah</button>
        <label>Mode</label><div class="row">${btn('mode', '📖 Punya buku sendiri', st.mode === 'own' ? 'primary' : '', 'own')}${btn('mode', '🎲 Dadakan (AI kasih bahan)', st.mode === 'dadakan' ? 'primary' : '', 'dadakan')}</div>
        ${st.mode === 'own' ? `<label>Genre</label><div class="row">${Object.entries(BOOK_Q).map(([k, v]) => btn('cat', v.name, st.cat === k ? 'primary' : '', k)).join('')}</div>
          <label>Judul buku / bacaan</label><input id="btitle" placeholder="mis. Filosofi Teras - Henry Manampiring">` : `<div class="quote">${esc((st.dadakan || BOOK_DADAKAN[0]).t)}</div><button class="btn" data-act="rollDadakan">🔄 Ganti bahan</button>`}</div>` +
        bar(btn('begin', '▶️ Mulai Babak 1', 'primary xl'));
    }
    const sp = C.pl(st.speaker);
    const head = `<div class="card center"><div class="qmeta">${PH[st.phase]?.n || ''}</div><h2>${esc(sp.av)} ${esc(sp.name)} bedah: ${esc(st.title)}</h2>${st.endsAt && PH[st.phase] ? timer(st.endsAt, PH[st.phase].d) : ''}</div>`;
    if (st.phase === 'pitch') return head + (st.card ? `<div class="card"><p>${esc(st.card.sum)}</p><p class="muted">Pertanyaan pemantik: ${esc(st.card.q)}</p></div>` : `<div class="card"><ol class="steps"><li>Judul & penulisnya siapa?</li><li>Masalah utama apa yang dibahas?</li><li>1 ide paling "nampol" yang lu tangkep?</li></ol></div>`) + bar(btn('hotseat', '▶️ Babak 2: Hot Seat', 'primary xl'));
    if (st.phase === 'hotseat') return head + `<div class="card"><div class="qmeta">Pertanyaan ${st.qi + 1}/${st.qs.length}${st.ai ? ' • ✨ AI' : ''}</div><div class="quote">${esc(st.qs[st.qi])}</div></div>` +
      bar(st.qi + 1 < st.qs.length ? btn('nextQ', '▶️ Pertanyaan berikutnya', 'primary') : '', btn('aiQ', '✨ Pertanyaan AI buat buku ini'), btn('crossfire', '⏭️ Babak 3: Cross-Fire', st.qi + 1 >= st.qs.length ? 'primary xl' : ''));
    if (st.phase === 'crossfire') return head + crossHtml(C) + bar(btn('takeaway', '⏭️ Babak 4: Takeaway', 'primary xl'));
    if (st.phase === 'takeaway') return head + `${progress(C)}${wallHtml(C)}` + bar(btn('end', '🏁 Selesai', 'primary xl'));
    if (st.phase === 'end') return `<div class="card center"><h2>📚 Makasih ${esc(sp.name)}!</h2><p>Semoga ilmunya berkah 🤲</p></div>${wallHtml(C, st.wall)}` + bar(btn('toMenu', '🏠 Menu', 'primary'));
    return '';
  },
  hostActs: {
    speaker: (C, id) => C.H.patch({ speaker: id }),
    randSpeaker: (C) => C.H.patch({ speaker: pick(C.active).id }),
    mode: (C, m) => C.H.patch({ mode: m, dadakan: m === 'dadakan' ? pick(BOOK_DADAKAN) : null }),
    cat: (C, k) => C.H.patch({ cat: k }),
    rollDadakan: (C) => C.H.patch({ dadakan: pick(BOOK_DADAKAN) }),
    begin: async (C) => {
      const st = C.stage;
      if (!st.speaker) return toast('Pilih pembedah dulu', 'bad');
      const dad = st.mode === 'dadakan' ? st.dadakan || BOOK_DADAKAN[0] : null;
      const title = dad ? dad.t : (document.getElementById('btitle')?.value.trim() || 'Buku pilihan pembedah');
      const qs = dad ? [dad.q, ...BOOK_Q.islam.q.slice(0, 2), ...BOOK_Q.self.q.slice(3, 5)] : [...BOOK_Q[st.cat].q];
      await C.H.setStage('buku', { phase: 'pitch', speaker: st.speaker, title, card: dad, qs, qi: 0, cat: st.cat, endsAt: C.now() + PH.pitch.d });
    },
    hotseat: (C) => C.H.setStage('buku', { ...keep(C), phase: 'hotseat', qi: 0, endsAt: C.now() + PH.hotseat.d }),
    nextQ: (C) => C.H.patch({ qi: C.stage.qi + 1 }),
    aiQ: async (C) => {
      toast('✨ Minta pertanyaan ke AI...');
      const r = await askAI('book', { title: C.stage.title, genre: BOOK_Q[C.stage.cat || 'self']?.name });
      if (!r) return toast('AI lagi ga bisa dipake, pake bank soal aja ya', 'bad');
      await C.H.patch({ qs: r.items.slice(0, 5), qi: 0, ai: true });
    },
    crossfire: (C) => C.H.setStage('buku', { ...keep(C), phase: 'crossfire', cf: BOOK_CROSSFIRE, endsAt: C.now() + PH.crossfire.d }),
    takeaway: (C) => C.H.setStage('buku', { ...keep(C), phase: 'takeaway', endsAt: C.now() + PH.takeaway.d }),
    end: async (C) => {
      const wall = Object.entries(C.inputs).filter(([, v]) => v && v.t).map(([id, v]) => ({ id, t: v.t }));
      const gains = { [C.stage.speaker]: 5 };
      wall.forEach((w) => { gains[w.id] = (gains[w.id] || 0) + 1; });
      await C.H.addPts(gains);
      await C.H.patch({ phase: 'end', wall });
    },
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'setup') return intro(g) + wait('Host lagi nyiapin pembedah & bukunya...');
    const sp = C.pl(st.speaker);
    const isSp = C.me.id === st.speaker;
    const head = `<div class="card center"><div class="qmeta">${PH[st.phase]?.n || ''}</div><h2>${esc(sp.av)} ${esc(sp.name)}</h2><p>${esc(st.title)}</p>${st.endsAt && PH[st.phase] ? timer(st.endsAt, PH[st.phase].d, false) : ''}</div>`;
    if (st.phase === 'pitch') return head + (isSp ? `<div class="card"><h3>🎤 Lu pembedahnya!</h3>${st.card ? `<p>${esc(st.card.sum)}</p>` : ''}<ol class="steps"><li>Judul & penulisnya siapa?</li><li>Masalah utama apa yang dibahas?</li><li>1 ide paling "nampol" yang lu tangkep?</li></ol></div>` : `<div class="card center"><p>Dengerin pitch-nya. Siapin pertanyaan buat Babak 3 😏</p></div>`);
    if (st.phase === 'hotseat') return head + `<div class="card"><div class="qmeta">Hot Seat ${st.qi + 1}/${st.qs.length}</div><div class="quote">${esc(st.qs[st.qi])}</div></div>`;
    if (st.phase === 'crossfire') {
      if (isSp) return head + crossHtml(C);
      if (C.mine) return head + `<div class="card center"><p>Pertanyaan lu udah masuk ke forum ✅</p></div>` + crossHtml(C);
      return head + `<div class="card"><h3>Pilih pertanyaan buat nantang pembedah</h3><div class="choices">${st.cf.map((q, i) => `<button class="choice" data-act="cf" data-arg="${i}">${esc(q)}</button>`).join('')}</div>
        <label>Atau tulis sendiri</label><textarea id="cfown" maxlength="140"></textarea><button class="btn primary xl" data-act="cfown">Kirim pertanyaan</button></div>`;
    }
    if (st.phase === 'takeaway') {
      if (C.mine) return head + wallHtml(C);
      return head + `<div class="card"><h3>1 kalimat insight yang mau lu praktikin pekan ini</h3><textarea id="tk" maxlength="140"></textarea><button class="btn primary xl" data-act="tk">Tempel di dinding</button></div>`;
    }
    if (st.phase === 'end') return `<div class="card center"><h2>📚 Selesai!</h2></div>${wallHtml(C, st.wall)}`;
    return wait();
  },
  psig: (C) => JSON.stringify([C.stage, C.mine === undefined, C.mine !== undefined && ['crossfire', 'takeaway'].includes(C.stage.phase) ? C.inputs : 0]),
  playerActs: {
    cf: (C, i) => { vibe(20); C.send({ v: +i }); },
    cfown: (C) => { const v = document.getElementById('cfown').value.trim(); if (v) C.send({ own: v }); },
    tk: (C) => { const v = document.getElementById('tk').value.trim(); if (v) { vibe(20); C.send({ t: v }); } },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    if (['pitch', 'hotseat', 'crossfire', 'takeaway'].includes(C.stage.phase)) sfx.whoosh();
    if (C.stage.phase === 'end') { sfx.win(); confetti(60); }
  },
};

const keep = (C) => { const { speaker, title, card, qs, qi, cat, ai } = C.stage; return { speaker, title, card, qs, qi, cat, ai }; };

function crossHtml(C) {
  const st = C.stage;
  const cnt = st.cf.map(() => 0);
  const own = [];
  Object.entries(C.inputs).forEach(([id, v]) => { if (!v) return; if (v.v != null) cnt[v.v]++; if (v.own) own.push({ id, t: v.own }); });
  const max = Math.max(1, ...cnt);
  return `<div class="card"><h3>🔥 Pertanyaan terpilih forum</h3><div class="bars">${st.cf.map((q, i) => ({ q, n: cnt[i] })).filter((x) => x.n).sort((a, b) => b.n - a.n).map((x) => `<div class="vbar" style="--w:${(x.n / max) * 100}%"><span>${esc(x.q)}</span><b>${x.n}</b></div>`).join('') || '<p class="muted">Belum ada vote</p>'}</div>
    ${own.length ? `<h3>✍️ Pertanyaan langsung</h3>${own.map((o) => `<div class="quote" style="font-size:1rem">${esc(o.t)} <small class="muted">— ${esc(C.pl(o.id).name)}</small></div>`).join('')}` : ''}</div>`;
}

function wallHtml(C, wall) {
  const list = wall || Object.entries(C.inputs).filter(([, v]) => v && v.t).map(([id, v]) => ({ id, t: v.t }));
  return `<div class="card"><h3>📌 Dinding Insight</h3><div class="wall">${list.map((w, i) => `<div class="note" style="--rot:${((i * 37) % 7) - 3}deg">${esc(w.t)}<small>— ${esc(C.pl(w.id).name)}</small></div>`).join('') || '<p class="muted">Belum ada yang nempel</p>'}</div></div>`;
}

export default g;
