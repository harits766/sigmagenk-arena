import { esc, chip, timer, intro, wait, bar, btn, answered, progress, whoAnswered, changed, sfx, splash, vibe, confetti, endCard } from './common.js';
import { RECEH } from '../data.js';
import { fresh, shuffle } from '../ui.js';

const WDUR = 60000, VDUR = 15000, PAIRS = 4;

const g = {
  id: 'receh', name: 'Adu Receh', emoji: '😂', group: 'battle',
  blurb: '2 orang jawab prompt yang sama, semua vote jawaban paling receh.',
  steps: ['Beberapa orang dapet prompt rahasia, dipasangin 1 lawan 1.', 'Tulis jawaban selucu mungkin (60 detik).', 'Jawaban ditampilin tanpa nama, yang lain vote yang paling lucu.', 'Tiap vote +2. Menang mutlak = bonus +5!'],
  say: 'Adu Receh! Keluarin jokes terbaik lu, tapi tetep sopan ya gengs 😂',
  min: 3,
  async start(C) {
    C.H.mem = { played: {}, round: 0, gains: {} };
    await C.H.setStage('receh', { phase: 'intro' });
  },
  host(C) {
    const st = C.stage;
    const mem = C.H.mem;
    if (st.phase === 'intro') return intro(g) + bar(btn('round', '▶️ Mulai ronde', 'primary xl'));
    if (st.phase === 'write') return `<div class="card center"><div class="qmeta">Ronde ${st.round} • Lagi pada nulis</div>${timer(st.endsAt, WDUR)}${progress(C, st.writers)}${whoAnswered(C, st.writers)}</div>` + bar(btn('startVote', '⏭️ Mulai voting'));
    if (st.phase === 'vote' || st.phase === 'result') {
      const res = st.phase === 'result';
      const voters = C.active.filter((p) => !st.authors.includes(p.id)).map((p) => p.id);
      return `<div class="card center"><div class="qmeta">Duel ${st.m + 1}/${st.of}</div><h2 class="qtext">${esc(st.prompt)}</h2>
        ${res ? '' : timer(st.endsAt, VDUR)}
        <div class="versus">${[0, 1].map((i) => `<div class="side ${res && st.win === i ? 'tA' : ''}"><div class="bigtext">${esc(st.ans[i])}</div>
          ${res ? `<p>${chip(C.pl(st.authors[i]))}</p><div class="bignum">${st.votes[i]}</div>${st.sweep === i ? '<p class="streak">💯 RECEH SEMPURNA +5</p>' : ''}` : ''}</div>`).join('')}</div>
        ${res ? '' : progress(C, voters)}</div>` +
        bar(res ? (st.m + 1 < st.of ? btn('nextVote', '▶️ Duel berikutnya', 'primary xl') : btn('round', '🔁 Ronde baru', 'primary xl')) : btn('result', '⏭️ Buka hasil'), res && st.m + 1 >= st.of ? btn('finish', '🏁 Juara') : '');
    }
    if (st.phase === 'end') return endCard(C, 'Raja Receh', st.gains) + bar(btn('toMenu', '🏠 Menu', 'primary'));
    return '';
  },
  hostActs: {
    round: (C) => round(C),
    startVote: (C) => startVote(C, 0),
    nextVote: (C) => startVote(C, C.stage.m + 1),
    result: (C) => result(C),
    finish: (C) => C.H.patch({ phase: 'end', gains: C.H.mem.gains }),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'write' && (C.now() > st.endsAt + 300 || answered(C, st.writers).all)) C.once('vote', () => startVote(C, 0));
    if (st.phase === 'vote') {
      const voters = C.active.filter((p) => !st.authors.includes(p.id)).map((p) => p.id);
      if (C.now() > st.endsAt + 300 || answered(C, voters).all) C.once('res', () => result(C));
    }
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'write') {
      const sec = C.secret || {};
      if (!sec.prompt) return wait('Yang lain lagi nulis jawaban receh...', 'Siapin jempol buat vote 👍');
      if (C.mine) return `<div class="card center"><div class="bigemoji">😏</div><p>Jawaban lu: <b>${esc(C.mine.t)}</b></p></div>`;
      return `<div class="card"><div class="qmeta">Prompt lu (rahasia)</div><h2>${esc(sec.prompt)}</h2>${timer(st.endsAt, WDUR, false)}
        <textarea id="rans" maxlength="80" placeholder="Jawaban paling receh..."></textarea><button class="btn primary xl" data-act="write">Kirim</button></div>`;
    }
    if (st.phase === 'vote') {
      if (st.authors.includes(C.me.id)) return `<div class="card center"><div class="bigemoji">🙈</div><h2>Ini duel lu!</h2><p class="muted">Pasang muka datar biar ga ketauan...</p></div>`;
      if (C.mine !== undefined) return `<div class="card center"><div class="bigemoji">🗳️</div><p>Vote masuk!</p></div>`;
      return `<div class="card"><h2>${esc(st.prompt)}</h2>${timer(st.endsAt, VDUR, false)}<p class="muted">Mana yang paling receh?</p>
        <div class="choices">${[0, 1].map((i) => `<button class="choice" data-act="vote" data-arg="${i}"><span class="bigtext" style="font-size:1.2rem">${esc(st.ans[i])}</span></button>`).join('')}</div></div>`;
    }
    if (st.phase === 'result') {
      return `<div class="card center"><h2>${esc(st.prompt)}</h2><div class="versus">${[0, 1].map((i) => `<div class="side ${st.win === i ? 'tA' : ''}"><p>${esc(st.ans[i])}</p>${chip(C.pl(st.authors[i]))}<div class="bignum">${st.votes[i]}</div></div>`).join('')}</div></div>`;
    }
    if (st.phase === 'end') return endCard(C, 'Raja Receh', st.gains);
    return wait();
  },
  playerActs: {
    write: (C) => { const v = document.getElementById('rans').value.trim(); if (!v) return; vibe(20); C.send({ t: v }); },
    vote: (C, i) => { vibe(20); C.send(+i); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'write' || st.phase === 'vote') sfx.go();
    if (st.phase === 'result') { sfx.reveal(); if (st.sweep != null) confetti(80); }
    if (st.phase === 'end') { sfx.win(); confetti(); }
  },
};

async function round(C) {
  const mem = C.H.mem;
  mem.round = (mem.round || 0) + 1;
  const ids = C.active.map((p) => p.id).sort((a, b) => (mem.played[a] || 0) - (mem.played[b] || 0) || Math.random() - 0.5);
  const n = Math.min(PAIRS, Math.floor(ids.length / 2));
  const chosen = ids.slice(0, n * 2);
  // Pair across teams when possible.
  const A = shuffle(chosen.filter((id) => C.players[id].team === 'A'));
  const B = shuffle(chosen.filter((id) => C.players[id].team !== 'A'));
  const order = [];
  while (A.length || B.length) { if (A.length) order.push(A.pop()); if (B.length) order.push(B.pop()); }
  const prompts = fresh('receh', RECEH, n);
  mem.matches = [];
  const secrets = {};
  for (let i = 0; i < n; i++) {
    const a = order[i * 2], b = order[i * 2 + 1];
    mem.matches.push({ prompt: prompts[i], a, b });
    secrets[a] = { prompt: prompts[i] };
    secrets[b] = { prompt: prompts[i] };
    mem.played[a] = (mem.played[a] || 0) + 1;
    mem.played[b] = (mem.played[b] || 0) + 1;
  }
  await C.H.secrets(secrets);
  await C.H.setStage('receh', { phase: 'write', round: mem.round, writers: chosen, endsAt: C.now() + WDUR });
}

async function startVote(C, m) {
  const mem = C.H.mem;
  if (C.stage.phase === 'write') mem.answers = { ...C.inputs };
  const mt = mem.matches[m];
  const t = (id) => (mem.answers[id] && mem.answers[id].t) || '(ga jawab 💤)';
  const flip = Math.random() < 0.5;
  const authors = flip ? [mt.b, mt.a] : [mt.a, mt.b];
  await C.H.secrets(null);
  await C.H.setStage('receh', { phase: 'vote', m, of: mem.matches.length, prompt: mt.prompt, authors, ans: authors.map(t), endsAt: C.now() + VDUR });
}

async function result(C) {
  const st = C.stage;
  const votes = [0, 0];
  Object.values(C.inputs).forEach((v) => { if (v === 0 || v === 1) votes[v]++; });
  const total = votes[0] + votes[1];
  const win = votes[0] === votes[1] ? -1 : votes[0] > votes[1] ? 0 : 1;
  const sweep = total >= 2 && (votes[0] === 0 || votes[1] === 0) ? win : null;
  const gains = {};
  [0, 1].forEach((i) => { const n = votes[i] * 2 + (sweep === i ? 5 : 0); if (n) gains[st.authors[i]] = n; });
  Object.entries(gains).forEach(([id, n]) => { C.H.mem.gains[id] = (C.H.mem.gains[id] || 0) + n; });
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'result', votes, win, sweep });
}

export default g;
