import { esc, chip, timer, intro, wait, bar, btn, answered, progress, whoAnswered, changed, sfx, splash, vibe, confetti, endCard, dur } from './common.js';
import { SIAPA_PROMPTS } from '../data.js';
import { pick, shuffle } from '../ui.js';

const MAXF = 8;
const CDUR = (C) => dur(C, 'siapa', 'collect', 90);
const GDUR = (C) => dur(C, 'siapa', 'guess', 20);

const g = {
  id: 'siapa', name: 'Siapa Nih?', emoji: '🕵️', group: 'battle',
  timers: [{ k: 'collect', label: 'Waktu nulis fakta', def: 90 }, { k: 'guess', label: 'Waktu nebak', def: 20 }],
  blurb: 'Semua nulis fakta rahasia soal dirinya, yang lain nebak punya siapa.',
  steps: ['Semua nulis 1 fakta/cerita rahasia tentang diri sendiri (anonim).', 'Fakta muncul satu-satu, semua nebak itu punya siapa.', 'Nebak bener +3. Pemilik fakta +1 tiap orang yang ketipu.'],
  say: 'Siapa Nih? Seberapa kenal sih lu sama temen-temen di sini? Kita buktiin 🕵️',
  min: 3,
  async start(C) {
    C.H.mem = { gains: {} };
    await C.H.setStage('siapa', { phase: 'intro', prompt: pick(SIAPA_PROMPTS) });
  },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g, `<label>Pertanyaan buat semua</label><input id="sprompt" value="${esc(st.prompt)}">`) + bar(btn('collect', '▶️ Mulai nulis', 'primary xl'));
    if (st.phase === 'collect') return `<div class="card center"><h2 class="qtext">${esc(st.prompt)}</h2>${timer(st.endsAt, CDUR(C))}${progress(C)}${whoAnswered(C)}</div>` + bar(btn('startGuess', '⏭️ Mulai nebak'));
    if (st.phase === 'guess') return `<div class="card center"><div class="qmeta">Fakta ${st.i + 1}/${st.of}</div><div class="quote">"${esc(st.fact)}"</div>${timer(st.endsAt, GDUR(C))}${progress(C, st.voters)}</div>` + bar(btn('reveal', '⏭️ Buka'));
    if (st.phase === 'reveal') return revealHtml(C) + bar(st.i + 1 < st.of ? btn('nextGuess', '▶️ Fakta berikutnya', 'primary xl') : btn('finish', '🏁 Juara', 'primary xl'));
    if (st.phase === 'end') return endCard(C, 'Paling Kenal Temen', st.gains) + bar(btn('toMenu', '🏠 Menu', 'primary'));
    return '';
  },
  hostActs: {
    collect: (C) => C.H.setStage('siapa', { phase: 'collect', prompt: (document.getElementById('sprompt')?.value || C.stage.prompt).trim(), endsAt: C.now() + CDUR(C) }),
    startGuess: (C) => startGuess(C),
    nextGuess: (C) => guess(C, C.stage.i + 1),
    reveal: (C) => reveal(C),
    finish: (C) => C.H.patch({ phase: 'end', gains: C.H.mem.gains }),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'collect' && (C.now() > st.endsAt + 300 || answered(C).all)) C.once('g', () => startGuess(C));
    if (st.phase === 'guess' && (C.now() > st.endsAt + 300 || answered(C, st.voters).all)) C.once('r', () => reveal(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'collect') {
      if (C.mine) return `<div class="card center"><div class="bigemoji">🤫</div><p>Rahasia lu aman (sementara 😆)</p></div>`;
      return `<div class="card"><h2>${esc(st.prompt)}</h2>${timer(st.endsAt, CDUR(C), false)}<textarea id="sfact" maxlength="120" placeholder="Tulis yang jujur tapi jangan terlalu gampang ketebak..."></textarea><button class="btn primary xl" data-act="write">Kirim (anonim)</button></div>`;
    }
    if (st.phase === 'guess') {
      const head = `<div class="quote">"${esc(st.fact)}"</div>`;
      if (!st.voters.includes(C.me.id)) return `<div class="card center">${head}<div class="bigemoji">🙊</div><h2>Ini punya lu!</h2><p class="muted">Muka datar, jangan ketauan...</p></div>`;
      if (C.mine) return `<div class="card center">${head}<p>Tebakan lu: ${chip(C.pl(C.mine))}</p></div>`;
      return `<div class="card">${head}${timer(st.endsAt, GDUR(C), false)}<p class="muted">Ini punya siapa?</p><div class="choices two">${C.active.filter((p) => p.id !== C.me.id).map((p) => `<button class="choice" data-act="guess" data-arg="${p.id}"><span class="av">${esc(p.av)}</span>${esc(p.name)}</button>`).join('')}</div></div>`;
    }
    if (st.phase === 'reveal') {
      const gain = (st.gains || {})[C.me.id];
      return revealHtml(C) + (gain ? `<div class="card center result good"><h2>+${gain} poin</h2></div>` : '');
    }
    if (st.phase === 'end') return endCard(C, 'Paling Kenal Temen', st.gains);
    return wait();
  },
  playerActs: {
    write: (C) => { const v = document.getElementById('sfact').value.trim(); if (!v) return; vibe(20); C.send({ t: v }); },
    guess: (C, id) => { vibe(20); C.send(id); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'guess') sfx.whoosh();
    if (st.phase === 'reveal') { sfx.reveal(); splash(C.pl(st.author).av); }
    if (st.phase === 'end') { sfx.win(); confetti(); }
  },
};

function revealHtml(C) {
  const st = C.stage;
  const right = st.right || [];
  return `<div class="card center"><div class="quote">"${esc(st.fact)}"</div><p>Ternyata punya...</p><div class="bigav">${esc(C.pl(st.author).av)}</div><h2>${esc(C.pl(st.author).name)}</h2>
    <p class="muted">${right.length ? `Yang bener: ${right.map((id) => esc(C.pl(id).name)).join(', ')}` : 'Ga ada yang nebak bener 😱'}</p></div>`;
}

async function startGuess(C) {
  const facts = shuffle(Object.entries(C.inputs).filter(([, v]) => v && v.t).map(([pid, v]) => ({ pid, t: v.t }))).slice(0, MAXF);
  if (!facts.length) return alert('Belum ada yang nulis.');
  C.H.mem.facts = facts;
  return guess(C, 0);
}
function guess(C, i) {
  const f = C.H.mem.facts[i];
  const voters = C.active.filter((p) => p.id !== f.pid).map((p) => p.id);
  return C.H.setStage('siapa', { phase: 'guess', i, of: C.H.mem.facts.length, fact: f.t, voters, endsAt: C.now() + GDUR(C) });
}
async function reveal(C) {
  const f = C.H.mem.facts[C.stage.i];
  const gains = {};
  const right = [];
  let fooled = 0;
  for (const [pid, v] of Object.entries(C.inputs)) {
    if (v === f.pid) { gains[pid] = 3; right.push(pid); } else fooled++;
  }
  if (fooled) gains[f.pid] = Math.min(5, fooled);
  Object.entries(gains).forEach(([id, n]) => { C.H.mem.gains[id] = (C.H.mem.gains[id] || 0) + n; });
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'reveal', author: f.pid, right, gains });
}

export default g;
