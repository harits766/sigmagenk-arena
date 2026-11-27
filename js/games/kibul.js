import { esc, chip, timer, intro, wait, bar, btn, answered, progress, whoAnswered, changed, sfx, splash, vibe, confetti, endCard, dur } from './common.js';
import { KIBUL } from '../data.js';
import { fresh, norm, shuffle } from '../ui.js';

const N = 4;
const WDUR = (C) => dur(C, 'kibul', 'write', 45);
const PDUR = (C) => dur(C, 'kibul', 'pick', 30);
const isTruth = (f, t) => { const n = norm(t); return [f.a, ...(f.alt || [])].some((x) => norm(x) === n); };

const g = {
  id: 'kibul', name: 'Kibul', emoji: '🤥', group: 'battle',
  timers: [{ k: 'write', label: 'Waktu ngarang', def: 45 }, { k: 'pick', label: 'Waktu milih', def: 30 }],
  blurb: 'Karang jawaban palsu buat fakta aneh. Tipu temen, tebak yang asli!',
  steps: ['Muncul fakta aneh yang ada bagian kosongnya.', 'Semua ngarang jawaban PALSU yang meyakinkan.', 'Semua jawaban (palsu + asli) diacak. Pilih yang menurut lu ASLI.', 'Nebak bener +3. Tiap temen yang ketipu jawaban lu +2.'],
  say: 'Kibul time! Ngarang yang meyakinkan ya, jangan kebanyakan ketawa pas ngetik 🤥',
  async start(C) {
    C.H.mem = { facts: fresh('kibul', KIBUL, N), gains: {} };
    await C.H.setStage('kibul', { phase: 'intro' });
  },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('next', '▶️ Fakta 1', 'primary xl'));
    if (st.phase === 'write') return `<div class="card center"><div class="qmeta">Fakta ${st.i + 1}/${N} • Tulis jawaban palsu</div><h2 class="qtext">${esc(st.q)}</h2>${timer(st.endsAt, WDUR(C))}${progress(C)}${whoAnswered(C)}</div>` + bar(btn('toPick', '⏭️ Lanjut milih'));
    if (st.phase === 'pick') return `<div class="card center"><div class="qmeta">Fakta ${st.i + 1}/${N} • Mana yang asli?</div><h2 class="qtext">${esc(st.q)}</h2>${timer(st.endsAt, PDUR(C))}
      <div class="choices two">${st.opts.map((o) => `<div class="choice">${esc(o)}</div>`).join('')}</div>${progress(C)}</div>` + bar(btn('reveal', '⏭️ Buka jawaban'));
    if (st.phase === 'reveal') return revealHtml(C) + bar(st.i + 1 < N ? btn('next', `▶️ Fakta ${st.i + 2}`, 'primary xl') : btn('finish', '🏁 Raja Kibul', 'primary xl'));
    if (st.phase === 'end') return endCard(C, 'Raja Kibul', st.gains) + bar(btn('toMenu', '🏠 Menu', 'primary'));
    return '';
  },
  hostActs: {
    next: (C) => { const i = C.stage.phase === 'intro' ? 0 : C.stage.i + 1; C.H.mem.i = i; const f = C.H.mem.facts[i]; return C.H.setStage('kibul', { phase: 'write', i, q: f.q, truthHint: [f.a, ...(f.alt || [])].map(norm), endsAt: C.now() + WDUR(C) }); },
    toPick: (C) => toPick(C),
    reveal: (C) => reveal(C),
    finish: (C) => C.H.patch({ phase: 'end', gains: C.H.mem.gains }),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'write' && (C.now() > st.endsAt + 300 || answered(C).all)) C.once('pick', () => toPick(C));
    if (st.phase === 'pick' && (C.now() > st.endsAt + 300 || answered(C).all)) C.once('reveal', () => reveal(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'write') {
      if (C.mine) return `<div class="card center"><div class="bigemoji">😏</div><p>Kibulan lu: <b>${esc(C.mine.t)}</b></p><small class="muted">Nunggu yang lain...</small></div>`;
      return `<div class="card"><div class="qmeta">Fakta ${st.i + 1}/${N}</div><h2>${esc(st.q)}</h2>${timer(st.endsAt, WDUR(C), false)}
        <input id="kfake" maxlength="40" placeholder="Jawaban palsu yang meyakinkan..." autocomplete="off" class="big-input"><button class="btn primary xl" data-act="write">Kirim Kibulan</button></div>`;
    }
    if (st.phase === 'pick') {
      const own = (C.secret || {}).own;
      if (C.mine !== undefined) return `<div class="card center"><div class="bigemoji">🤔</div><p>Lu pilih: <b>${esc(st.opts[C.mine.p])}</b></p></div>`;
      return `<div class="card"><h2>${esc(st.q)}</h2>${timer(st.endsAt, PDUR(C), false)}<p class="muted">Mana yang ASLI?</p>
        <div class="choices">${st.opts.map((o, i) => `<button class="choice" data-act="pick" data-arg="${i}" ${(own || []).includes(i) ? 'disabled style="opacity:.35"' : ''}>${esc(o)}${(own || []).includes(i) ? ' <small>(punya lu)</small>' : ''}</button>`).join('')}</div></div>`;
    }
    if (st.phase === 'reveal') {
      const gain = (st.gains || {})[C.me.id];
      return `<div class="card center result ${gain ? 'good' : 'bad'}"><h2>${gain ? `+${gain} poin` : 'Zonk 😵'}</h2></div>` + revealHtml(C);
    }
    if (st.phase === 'end') return endCard(C, 'Raja Kibul', st.gains);
    return wait();
  },
  playerActs: {
    write: (C) => {
      const el = document.getElementById('kfake');
      const v = el.value.trim();
      if (!v) return;
      if (C.stage.truthHint && C.stage.truthHint.includes(norm(v))) { el.value = ''; el.placeholder = 'Itu jawaban ASLI 😏 karang yang lain!'; return vibe(200); }
      vibe(20); C.send({ t: v });
    },
    pick: (C, i) => { vibe(20); C.send({ p: +i }); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'write' || st.phase === 'pick') sfx.go();
    if (st.phase === 'reveal') { sfx.reveal(); if (C.me && (st.gains || {})[C.me.id]) sfx.good(); }
    if (st.phase === 'end') { sfx.win(); confetti(); }
  },
};

function revealHtml(C) {
  const st = C.stage;
  return `<div class="card"><h2>${esc(st.q)}</h2><div class="bars">${st.res.map((r) => `
    <div class="vbar ${r.truth ? 'win' : ''}" style="--w:${r.truth ? 100 : 0}%"><span>${r.truth ? '✅ ASLI: ' : '🤥 '}<b>${esc(r.t)}</b>${r.by && r.by.length ? ` <small>oleh ${r.by.map((id) => esc(C.pl(id).name)).join(', ')}</small>` : ''}</span>
    <span>${(r.pickers || []).map((id) => C.pl(id).av).join('')}</span></div>`).join('')}</div></div>`;
}

async function toPick(C) {
  const f = C.H.mem.facts[C.stage.i];
  const groups = {};
  for (const [pid, v] of Object.entries(C.inputs)) {
    if (!v || !v.t || isTruth(f, v.t)) continue;
    const k = norm(v.t);
    (groups[k] = groups[k] || { t: v.t, by: [] }).by.push(pid);
  }
  const opts = shuffle([{ t: f.a.charAt(0).toUpperCase() + f.a.slice(1), truth: true, by: [] }, ...Object.values(groups)]);
  C.H.mem.opts = opts;
  const secrets = {};
  opts.forEach((o, i) => (o.by || []).forEach((pid) => { (secrets[pid] = secrets[pid] || { own: [] }).own.push(i); }));
  await C.H.secrets(secrets);
  const cap = (t) => t.trim().charAt(0).toUpperCase() + t.trim().slice(1);
  await C.H.setStage('kibul', { phase: 'pick', i: C.stage.i, q: f.q, opts: opts.map((o) => cap(o.t)), endsAt: C.now() + PDUR(C) });
}

async function reveal(C) {
  const opts = C.H.mem.opts || [];
  const gains = {};
  const res = opts.map((o) => ({ t: o.t, truth: !!o.truth, by: o.by || [], pickers: [] }));
  for (const [pid, v] of Object.entries(C.inputs)) {
    if (!v || v.p == null || !res[v.p]) continue;
    res[v.p].pickers.push(pid);
    if (res[v.p].truth) gains[pid] = (gains[pid] || 0) + 3;
    else res[v.p].by.forEach((a) => { if (a !== pid) gains[a] = (gains[a] || 0) + 2; });
  }
  Object.entries(gains).forEach(([id, n]) => { C.H.mem.gains[id] = (C.H.mem.gains[id] || 0) + n; });
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'reveal', res, gains });
}

export default g;
