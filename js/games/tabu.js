import { esc, chip, timer, intro, wait, bar, btn, changed, sfx, splash, vibe, confetti } from './common.js';
import { TABU } from '../data.js';
import { shuffle } from '../ui.js';
import { teamName } from '../ui.js';

const DUR = 60000;
const card = (st) => TABU[st.deck[st.ci % st.deck.length]];

const g = {
  id: 'tabu', name: 'Tabu Kilat', emoji: '🚫', group: 'battle',
  blurb: 'Jelasin kata tanpa nyebut kata terlarang. Kubu lawan pegang tombol BUZZ!',
  steps: ['1 orang dari kubu yang main jadi penjelas, kata rahasia muncul di HP-nya.', 'Kubunya teriak nebak. Bener = tap ✅, susah = ⏭️ skip.', 'Kubu lawan liat kata terlarangnya. Kalau penjelas keceplosan, langsung pencet 🚨 BUZZ!', '60 detik per giliran, gantian kubu.'],
  say: 'Tabu Kilat! Yang jelasin hati-hati mulutnya, kubu lawan udah siap mencet BUZZ 🚨',
  min: 4,
  async start(C) {
    C.H.mem = { rot: { A: 0, B: 0 }, turn: 0, total: { A: 0, B: 0 } };
    await C.H.setStage('tabu', { phase: 'intro' });
  },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('nextTurn', '▶️ Giliran pertama: Kubu Hijau', 'primary xl'));
    const ex = C.pl(st.explainer);
    const head = `<div class="card center"><p class="teamtag t${st.team}">Giliran ${teamName(st.team)}</p><h2>${ex.av} ${esc(ex.name)} jelasin</h2>`;
    if (st.phase === 'ready') return head + `<p class="muted">Nunggu ${esc(ex.name)} pencet MULAI di HP-nya...</p></div>` + bar(btn('forceGo', '▶️ Mulai dari sini'), btn('reroll', '🔄 Ganti penjelas'));
    if (st.phase === 'turn') {
      const c = card(st);
      return head + timer(st.endsAt, DUR) + `<div class="secret peek"><small>Kata (hover buat intip)</small><div class="word blur">${esc(c.w)}</div></div>
        <div class="bignum">✅ ${st.got || 0} <small style="font-size:1.2rem">🚨 ${st.buzz || 0} ⏭️ ${st.skip || 0}</small></div></div>`;
    }
    if (st.phase === 'turnEnd') {
      return head + `<div class="bignum">+${st.pts}</div><p>buat ${teamName(st.team)}</p>${logHtml(st)}</div>` +
        bar(btn('nextTurn', `▶️ Giliran ${teamName(st.team === 'A' ? 'B' : 'A')}`, 'primary xl'), btn('toMenu', '🏁 Udahan'));
    }
    return '';
  },
  hostActs: {
    nextTurn: (C) => nextTurn(C),
    reroll: (C) => nextTurn(C, C.stage.team),
    forceGo: (C) => go(C),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'turn' && C.now() > st.endsAt + 200) C.once('end', () => endTurn(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    const ex = C.pl(st.explainer);
    const mine = C.me.id === st.explainer;
    const myTeam = C.me.team === st.team;
    if (st.phase === 'ready') {
      if (mine) return `<div class="card center"><h2>Lu yang jelasin! 🎤</h2><p>Jangan sebut kata terlarang. Kubu lawan ngawasin.</p><button class="btn primary bigbtn" data-act="go">MULAI 60 DETIK</button></div>`;
      return `<div class="card center"><p class="teamtag t${st.team}">${teamName(st.team)}</p><h2>${ex.av} ${esc(ex.name)} siap-siap jelasin</h2><p class="muted">${myTeam ? 'Lu bagian nebak, teriak yang kenceng!' : 'Lu bagian ngawasin. Siap pencet BUZZ!'}</p></div>`;
    }
    if (st.phase === 'turn') {
      const c = card(st);
      const score = `<div class="center"><b style="font-size:1.6rem">✅ ${st.got || 0}</b> &nbsp; 🚨 ${st.buzz || 0}</div>`;
      if (mine) return timer(st.endsAt, DUR) + `<div class="secret"><small>Jelasin kata ini:</small><div class="word">${esc(c.w)}</div><small>JANGAN sebut:</small><div class="ban">${c.ban.map((b) => `<span>${esc(b)}</span>`).join('')}</div></div>
        ${score}<div class="choices two"><button class="btn primary bigbtn" data-act="ok" data-arg="${st.ci}">✅ BENER</button><button class="btn bigbtn" data-act="skip" data-arg="${st.ci}">⏭️ SKIP</button></div>`;
      if (myTeam) return timer(st.endsAt, DUR) + `<div class="card center"><div class="bigemoji">🗣️</div><h2>TEBAK!</h2><p>${ex.av} ${esc(ex.name)} lagi jelasin. Teriak jawabannya!</p></div>${score}`;
      return timer(st.endsAt, DUR) + `<div class="secret"><small>${esc(ex.name)} lagi jelasin:</small><div class="word">${esc(c.w)}</div><small>Kalau dia nyebut salah satu ini, BUZZ!</small><div class="ban">${c.ban.map((b) => `<span>${esc(b)}</span>`).join('')}</div></div>
        ${score}<button class="btn danger bigbtn" data-act="buzz" data-arg="${st.ci}">🚨 BUZZ!</button>`;
    }
    if (st.phase === 'turnEnd') return `<div class="card center"><p class="teamtag t${st.team}">${teamName(st.team)}</p><div class="bignum">+${st.pts}</div>${logHtml(st)}</div>`;
    return wait();
  },
  playerActs: {
    go: (C) => go(C),
    ok: (C, n) => act(C, +n, 'ok'),
    skip: (C, n) => act(C, +n, 'skip'),
    buzz: (C, n) => act(C, +n, 'buzz'),
  },
  fx(C, prev) {
    const st = C.stage;
    if (changed(C, prev)) {
      if (st.phase === 'turn') sfx.go();
      if (st.phase === 'turnEnd') { sfx.win(); if (C.me && C.me.team === st.team) confetti(60); }
      return;
    }
    if (st.phase === 'turn' && prev && prev.ci !== st.ci) {
      const last = (st.log || [])[(st.log || []).length - 1];
      if (!last) return;
      if (last.r === 'ok') { sfx.good(); if (C.me && C.me.team === st.team) splash('✅', 'good'); }
      if (last.r === 'buzz') { sfx.buzz(); splash('🚨 BUZZ', 'bad'); vibe([80, 40, 80]); }
      if (last.r === 'skip') sfx.whoosh();
    }
  },
};

function logHtml(st) {
  const ic = { ok: '✅', skip: '⏭️', buzz: '🚨' };
  return `<div class="chips" style="justify-content:center;margin-top:8px">${(st.log || []).map((l) => `<span class="chip">${ic[l.r]} ${esc(l.w)}</span>`).join('')}</div>`;
}

async function nextTurn(C, sameTeam) {
  const mem = C.H.mem;
  if (!mem.rot) Object.assign(mem, { rot: { A: 0, B: 0 }, turn: 0 });
  const prevTeam = C.stage.team;
  const team = sameTeam || (prevTeam === 'A' ? 'B' : 'A');
  const members = C.byTeam(team);
  if (!members.length) return alert('Kubu itu kosong. Acak kubu dulu.');
  const explainer = members[mem.rot[team]++ % members.length].id;
  const deck = shuffle(TABU.map((_, i) => i));
  await C.H.setStage('tabu', { phase: 'ready', team, explainer, deck, ci: 0, got: 0, buzz: 0, skip: 0, log: [] });
}

function go(C) {
  return C.db.tx(C.room('stage'), (st) => {
    if (!st || st.phase !== 'ready') return st;
    st.phase = 'turn';
    st.endsAt = C.now() + DUR;
    return st;
  });
}

function act(C, n, r) {
  vibe(r === 'buzz' ? 60 : 20);
  return C.db.tx(C.room('stage'), (st) => {
    if (!st || st.phase !== 'turn' || st.ci !== n) return st;
    const w = TABU[st.deck[st.ci % st.deck.length]].w;
    st.log = [...(st.log || []), { w, r, by: C.me.id }];
    st.ci++;
    if (r === 'ok') st.got = (st.got || 0) + 1;
    if (r === 'buzz') st.buzz = (st.buzz || 0) + 1;
    if (r === 'skip') st.skip = (st.skip || 0) + 1;
    return st;
  });
}

async function endTurn(C) {
  const st = C.stage;
  const pts = Math.max(0, (st.got || 0) * 3 - (st.buzz || 0) * 2);
  const gains = {};
  if (pts) gains[st.explainer] = pts;
  (st.log || []).filter((l) => l.r === 'buzz').forEach((l) => { gains[l.by] = (gains[l.by] || 0) + 2; });
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'turnEnd', pts });
}

export default g;
