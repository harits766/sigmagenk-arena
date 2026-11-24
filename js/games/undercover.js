import { esc, chip, timer, intro, wait, bar, btn, answered, progress, changed, sfx, splash, vibe, confetti } from './common.js';
import { UNDERCOVER } from '../data.js';
import { fresh, shuffle, norm } from '../ui.js';

const VDUR = 60000;
const ROLE = { w: { n: 'Warga', e: '🧑‍🌾' }, u: { n: 'Undercover', e: '🕵️' }, x: { n: 'Mr. White', e: '👻' } };

const g = {
  id: 'undercover', name: 'Undercover', emoji: '🕵️', group: 'heboh',
  blurb: 'Semua dapet kata rahasia. Ada penyusup yang katanya beda. Cari dia!',
  steps: ['Mayoritas dapet kata Warga, 1-3 orang dapet kata mirip (Undercover), 1 orang layarnya kosong (Mr. White).', 'Gantian sebut 1 kata petunjuk soal kata lu. Jangan terlalu jelas!', 'Diskusi heboh, terus vote di HP siapa yang dicurigai.', 'Mr. White yang ketangkep boleh nebak kata Warga buat menang.'],
  say: 'Undercover! Di antara kita ada penyusup... siapa ya? 👀',
  min: 4,
  async start(C) { await C.H.setStage('undercover', { phase: 'intro' }); },
  host(C) {
    const st = C.stage;
    const n = C.active.length;
    if (st.phase === 'intro') {
      const u = n <= 7 ? 1 : n <= 13 ? 2 : 3;
      return intro(g, `<div class="row"><label style="flex:1">Undercover<input id="ucn" type="number" min="1" max="4" value="${u}"></label><label style="flex:1">Mr. White<input id="ucx" type="number" min="0" max="2" value="${n >= 6 ? 1 : 0}"></label></div>`) + bar(btn('deal', '🃏 Bagi kartu', 'primary xl'));
    }
    const alive = st.alive || [];
    const roles = C.H.mem.roles || {};
    const roster = `<div class="chips">${alive.map((id) => chip(C.pl(id), ` <small>${ROLE[roles[id]]?.e || ''}</small>`)).join('')}</div>`;
    if (st.phase === 'clue') return `<div class="card"><div class="qmeta">Ronde ${st.round} • Sebut petunjuk</div><h2>Urutan ngomong:</h2><ol class="steps">${st.order.map((id) => `<li>${esc(C.pl(id).av)} ${esc(C.pl(id).name)}</li>`).join('')}</ol>
      <p class="muted peek">Kata (hover buat intip): Warga <b class="blur">${esc(C.H.mem.words?.w)}</b> • Undercover <b class="blur">${esc(C.H.mem.words?.u)}</b></p></div>` + bar(btn('vote', '🗳️ Mulai voting', 'primary xl'));
    if (st.phase === 'vote') return `<div class="card center"><div class="qmeta">Ronde ${st.round} • Voting</div>${timer(st.endsAt, VDUR)}${progress(C, alive)}${tally(C)}</div>` + bar(btn('count', '⏭️ Hitung suara'));
    if (st.phase === 'out') return outHtml(C) + bar(st.winner ? btn('finish', '🏁 Lihat hasil akhir', 'primary xl') : btn('nextRound', '▶️ Ronde berikutnya', 'primary xl'));
    if (st.phase === 'white') return `<div class="card center"><h2>👻 Mr. White ketangkep!</h2><p>${esc(C.pl(st.white).name)} boleh nebak kata Warga.</p>
      ${C.inputs[st.white] ? `<div class="quote">Tebakan: "${esc(C.inputs[st.white])}"</div><p>Kata Warga: <b>${esc(C.H.mem.words.w)}</b></p>` : '<p class="muted">Nunggu tebakan...</p>'}</div>` +
      bar(btn('whiteRight', '✅ Bener! Mr. White menang', 'gold'), btn('whiteWrong', '❌ Salah, lanjut'));
    if (st.phase === 'end') return endHtml(C) + bar(btn('again', '🔁 Main lagi', 'primary'), btn('toMenu', '🏠 Menu'));
    return '';
  },
  hostActs: {
    deal: (C) => deal(C),
    again: (C) => deal(C),
    vote: (C) => C.H.setStage('undercover', { ...base(C), phase: 'vote', endsAt: C.now() + VDUR }),
    count: (C) => count(C),
    nextRound: (C) => C.H.setStage('undercover', { ...base(C), phase: 'clue', round: C.stage.round + 1, order: shuffle(C.stage.alive) }),
    whiteRight: (C) => finish(C, 'x'),
    whiteWrong: (C) => afterOut(C, C.stage.white, true),
    finish: (C) => finish(C, C.stage.winner),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'vote' && (C.now() > st.endsAt + 300 || answered(C, st.alive).all)) C.once('count', () => count(C));
    if (st.phase === 'white' && C.inputs[st.white]) {
      const w = C.H.mem.words?.w;
      if (w && norm(C.inputs[st.white]) === norm(w)) C.once('autoWhite', () => finish(C, 'x'));
    }
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    const sec = C.secret || {};
    const alive = (st.alive || []).includes(C.me.id);
    const wordCard = sec.white
      ? `<div class="secret"><small>Kata lu</small><div class="word">👻 ???</div><small>Lu Mr. White! Ga tau katanya. Dengerin yang lain & pura-pura tau 😏</small></div>`
      : sec.word ? `<details class="secret"><summary><small>Tap buat liat/tutup kata rahasia lu</small></summary><div class="word">${esc(sec.word)}</div></details>` : '';
    if (st.phase === 'clue') {
      const pos = st.order.indexOf(C.me.id);
      return wordCard + `<div class="card center">${alive ? `<p>Lu ngomong urutan ke-</p><div class="bignum">${pos + 1}</div><p class="muted">Sebut 1 kata petunjuk. Jangan terlalu jelas!</p>` : '<h2>💀 Lu udah keluar</h2><p class="muted">Nonton aja, jangan bocorin ya!</p>'}</div>`;
    }
    if (st.phase === 'vote') {
      if (!alive) return wait('Yang masih hidup lagi voting...');
      if (C.mine) return wordCard + `<div class="card center"><p>Lu vote: ${chip(C.pl(C.mine))}</p><small class="muted">Nunggu yang lain...</small></div>`;
      return wordCard + `<div class="card"><h2>Siapa penyusupnya?</h2>${timer(st.endsAt, VDUR, false)}<div class="choices two">${st.alive.filter((id) => id !== C.me.id).map((id) => { const p = C.pl(id); return `<button class="choice" data-act="vote" data-arg="${id}"><span class="av">${esc(p.av)}</span>${esc(p.name)}</button>`; }).join('')}</div></div>`;
    }
    if (st.phase === 'out') return outHtml(C);
    if (st.phase === 'white') {
      if (C.me.id === st.white) return C.mine ? `<div class="card center"><p>Tebakan lu: <b>${esc(C.mine)}</b></p><p class="muted">Deg-degan...</p></div>` : `<div class="card"><h2>👻 Ketauan! Tebak kata Warga</h2><input id="wguess" class="big-input" maxlength="30" autocomplete="off"><button class="btn gold xl" data-act="wguess">Tebak!</button></div>`;
      return `<div class="card center"><div class="bigemoji">👻</div><h2>${esc(C.pl(st.white).name)} itu Mr. White!</h2><p>Dia lagi nebak kata Warga... kalau bener, dia menang!</p></div>`;
    }
    if (st.phase === 'end') return endHtml(C);
    return wait();
  },
  playerActs: {
    vote: (C, id) => { vibe(20); C.send(id); },
    wguess: (C) => { const v = document.getElementById('wguess').value.trim(); if (v) C.send(v); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'clue' && st.round === 1) { sfx.whoosh(); vibe(50); }
    if (st.phase === 'vote') sfx.go();
    if (st.phase === 'out') { st.outId ? sfx.boom() : sfx.whoosh(); }
    if (st.phase === 'end') { sfx.win(); confetti(); }
  },
};

const base = (C) => ({ round: C.stage.round, alive: C.stage.alive, order: C.stage.order });

function tally(C) {
  const t = {};
  Object.values(C.inputs).forEach((id) => { t[id] = (t[id] || 0) + 1; });
  const max = Math.max(1, ...Object.values(t));
  return `<div class="bars">${Object.entries(t).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<div class="vbar" style="--w:${(n / max) * 100}%">${chip(C.pl(id))}<b>${n}</b></div>`).join('')}</div>`;
}

async function deal(C) {
  const ids = shuffle(C.active.map((p) => p.id));
  const nu = Math.max(1, +(document.getElementById('ucn')?.value || 1));
  const nx = Math.max(0, +(document.getElementById('ucx')?.value || 0));
  const [pair] = fresh('uc', UNDERCOVER, 1);
  const flip = Math.random() < 0.5;
  const words = { w: flip ? pair[1] : pair[0], u: flip ? pair[0] : pair[1] };
  const roles = {}, secrets = {};
  ids.forEach((id, i) => {
    roles[id] = i < nu ? 'u' : i < nu + nx ? 'x' : 'w';
    secrets[id] = roles[id] === 'x' ? { white: true } : { word: roles[id] === 'u' ? words.u : words.w };
  });
  C.H.mem = { roles, words, gains: {} };
  await C.H.secrets(secrets);
  let order = shuffle(ids);
  if (roles[order[0]] === 'x' && order.length > 1) order = [...order.slice(1), order[0]]; // Mr. White never goes first
  await C.H.setStage('undercover', { phase: 'clue', round: 1, alive: ids, order });
}

async function count(C) {
  const t = {};
  Object.values(C.inputs).forEach((id) => { t[id] = (t[id] || 0) + 1; });
  const sorted = Object.entries(t).sort((a, b) => b[1] - a[1]);
  if (!sorted.length || (sorted[1] && sorted[1][1] === sorted[0][1])) {
    return C.H.patch({ phase: 'out', outId: null, tally: t });
  }
  const outId = sorted[0][0];
  if (C.H.mem.roles[outId] === 'x') {
    const alive = C.stage.alive.filter((id) => id !== outId);
    return C.H.setStage('undercover', { ...base(C), alive, phase: 'white', white: outId, tally: t });
  }
  return afterOut(C, outId, false, t);
}

async function afterOut(C, outId, alreadyRemoved, tallyMap) {
  const roles = C.H.mem.roles;
  const alive = alreadyRemoved ? C.stage.alive : C.stage.alive.filter((id) => id !== outId);
  const bad = alive.filter((id) => roles[id] !== 'w').length;
  const good = alive.length - bad;
  const winner = bad === 0 ? 'w' : bad >= good ? 'u' : null;
  await C.H.setStage('undercover', { ...base(C), alive, phase: 'out', outId, outRole: roles[outId], winner, tally: tallyMap || C.stage.tally || {} });
}

function outHtml(C) {
  const st = C.stage;
  if (!st.outId) return `<div class="card center"><div class="bigemoji">🤝</div><h2>Suara seri!</h2><p>Ga ada yang keluar ronde ini.</p></div>`;
  const r = ROLE[st.outRole] || ROLE.w;
  return `<div class="card center"><div class="bigav">${esc(C.pl(st.outId).av)}</div><h2>${esc(C.pl(st.outId).name)} keluar!</h2>
    <p class="teamtag ${st.outRole === 'w' ? '' : 'tB'}">${r.e} Ternyata ${r.n}</p>
    ${st.winner ? `<h2 style="margin-top:12px">${st.winner === 'w' ? '🎉 Warga menang!' : '😈 Penyusup menang!'}</h2>` : `<p class="muted">Masih ada penyusup... lanjut!</p>`}</div>`;
}

async function finish(C, winner) {
  const roles = C.H.mem.roles;
  const gains = {};
  for (const [id, r] of Object.entries(roles)) {
    if (winner === 'w' && r === 'w') gains[id] = 5 + (C.stage.alive.includes(id) ? 2 : 0);
    if (winner === 'u' && r !== 'w') gains[id] = 8;
    if (winner === 'x' && r === 'x') gains[id] = 12;
  }
  await C.H.addPts(gains);
  await C.H.secrets(null);
  await C.H.setStage('undercover', { phase: 'end', winner, roles, words: C.H.mem.words, gains });
}

function endHtml(C) {
  const st = C.stage;
  const title = st.winner === 'w' ? '🎉 Warga Menang!' : st.winner === 'x' ? '👻 Mr. White Menang!' : '😈 Penyusup Menang!';
  return `<div class="card center"><h2>${title}</h2><p>Warga: <b>${esc(st.words.w)}</b> • Undercover: <b>${esc(st.words.u)}</b></p>
    <div class="chips" style="justify-content:center">${Object.entries(st.roles).map(([id, r]) => chip(C.pl(id), ` ${ROLE[r].e}${(st.gains || {})[id] ? ` +${st.gains[id]}` : ''}`)).join('')}</div></div>`;
}

export default g;
