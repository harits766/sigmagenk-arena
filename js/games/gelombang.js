import { esc, chip, timer, intro, wait, bar, btn, answered, progress, changed, sfx, splash, vibe, confetti } from './common.js';
import { SPECTRUM } from '../data.js';
import { fresh, teamName } from '../ui.js';

const GDUR = 45000, SDUR = 15000, CDUR = 60000;
const score = (d) => (d <= 4 ? 4 : d <= 10 ? 3 : d <= 17 ? 2 : 0);

const g = {
  id: 'gelombang', name: 'Gelombang Pikiran', emoji: '🎚️', group: 'heboh',
  blurb: 'Satu orang kasih clue, kubunya geser slider nebak posisi rahasia di spektrum.',
  steps: ['Muncul 2 kutub, misal "Hal Sepele ↔ Bikin Overthinking".', 'Si Cenayang liat posisi target rahasia (0-100) dan kasih 1 clue.', 'Kubunya diskusi & geser slider di HP, rata-ratanya jadi tebakan.', 'Kubu lawan nebak: target lebih kiri atau kanan? Bener = bonus.'],
  say: 'Gelombang Pikiran! Satu frekuensi gak sama kubu lu? 🎚️',
  min: 4,
  async start(C) {
    C.H.mem = { rot: { A: 0, B: 0 }, gains: {} };
    await C.H.setStage('gelombang', { phase: 'intro' });
  },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('turn', '▶️ Mulai: Kubu Hijau', 'primary xl'));
    const head = `<div class="poles"><span>⬅️ ${esc(st.sp[0])}</span><span>${esc(st.sp[1])} ➡️</span></div>`;
    const psy = C.pl(st.psychic);
    if (st.phase === 'clue') return `<div class="card center"><p class="teamtag t${st.team}">${teamName(st.team)}</p><h2>🔮 ${esc(psy.av)} ${esc(psy.name)} lagi mikir clue</h2>${head}${timer(st.endsAt, CDUR)}</div>`;
    if (st.phase === 'guess') return `<div class="card center"><p class="teamtag t${st.team}">${teamName(st.team)} nebak</p><div class="quote">🔮 "${esc(st.clue)}"</div>${head}
      <div class="dial">${needle(avg(C, st), 'team')}</div><p>Rata-rata kubu: <b id="avgv">${avg(C, st) ?? '-'}</b></p>${timer(st.endsAt, GDUR)}${progress(C, st.guessers)}</div>` + bar(btn('lock', '🔒 Kunci tebakan', 'primary xl'));
    if (st.phase === 'steal') return `<div class="card center"><div class="quote">🔮 "${esc(st.clue)}"</div>${head}<div class="dial">${needle(st.guess, 'team')}</div>
      <p>${teamName(st.team === 'A' ? 'B' : 'A')} nebak: target lebih kiri atau kanan?</p>${timer(st.endsAt, SDUR)}${progress(C, st.stealers)}</div>` + bar(btn('reveal', '🎉 Buka target', 'primary xl'));
    if (st.phase === 'reveal') return revealHtml(C) + bar(btn('turn', `▶️ Giliran ${teamName(st.team === 'A' ? 'B' : 'A')}`, 'primary xl'), btn('toMenu', '🏁 Udahan'));
    return '';
  },
  hostActs: {
    turn: (C) => turn(C),
    lock: (C) => lock(C),
    reveal: (C) => reveal(C),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'guess' && C.now() > st.endsAt + 300) C.once('lock', () => lock(C));
    if (st.phase === 'steal' && (C.now() > st.endsAt + 300 || answered(C, st.stealers).all)) C.once('rev', () => reveal(C));
    if (st.phase === 'clue' && C.inputs[st.psychic]) C.once('clue', () => C.H.setStage('gelombang', { ...st, phase: 'guess', clue: C.inputs[st.psychic], endsAt: C.now() + GDUR }));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    const head = `<div class="poles"><span>⬅️ ${esc(st.sp[0])}</span><span>${esc(st.sp[1])} ➡️</span></div>`;
    const myTeam = C.me.team === st.team;
    if (st.phase === 'clue') {
      if (C.me.id === st.psychic) {
        const t = (C.secret || {}).target;
        return `<div class="card"><h2>🔮 Lu Si Cenayang!</h2>${head}<div class="dial"><div class="zone" style="left:${t - 4}%;width:8%" data-l="🎯"></div></div>
          <p>Target: <b>${t}</b>. Kasih 1 clue yang posisinya kira-kira di situ.</p>${timer(st.endsAt, CDUR, false)}<input id="wclue" class="big-input" maxlength="60" placeholder="Clue lu..."><button class="btn primary xl" data-act="clue">Kirim Clue</button></div>`;
      }
      return wait(`${C.pl(st.psychic).name} lagi mikirin clue...`, myTeam ? 'Lu bagian nebak, siap-siap!' : 'Kubu lawan yang nebak, lu bisa curi poin nanti.');
    }
    if (st.phase === 'guess') {
      if (myTeam && st.guessers.includes(C.me.id)) {
        return `<div class="card"><div class="quote">🔮 "${esc(st.clue)}"</div>${head}<input type="range" id="wslide" min="0" max="100" value="${C.mine ? C.mine.v : 50}" data-act-input="slide">
          <p class="center">Posisi lu: <b id="myv">${C.mine ? C.mine.v : 50}</b> • Rata-rata kubu: <b id="avgv">${avg(C, st) ?? '-'}</b></p>${timer(st.endsAt, GDUR, false)}<p class="muted center">Diskusi bareng kubu! Yang dipake rata-rata semua slider.</p></div>`;
      }
      return `<div class="card center"><div class="quote">🔮 "${esc(st.clue)}"</div>${head}<p class="muted">${myTeam ? 'Lu Si Cenayang, diem aja ya 🤐' : 'Kubu lawan lagi nebak... dengerin diskusinya buat curi poin!'}</p></div>`;
    }
    if (st.phase === 'steal') {
      const dial = `<div class="dial">${needle(st.guess, 'team')}</div>`;
      if (!st.stealers.includes(C.me.id)) return `<div class="card center"><div class="quote">🔮 "${esc(st.clue)}"</div>${head}${dial}<p class="muted">Kubu lawan lagi nebak arah...</p></div>`;
      if (C.mine) return `<div class="card center">${head}${dial}<p>Tebakan lu: <b>${C.mine === 'L' ? '⬅️ Lebih kiri' : 'Lebih kanan ➡️'}</b></p></div>`;
      return `<div class="card center"><div class="quote">🔮 "${esc(st.clue)}"</div>${head}${dial}${timer(st.endsAt, SDUR, false)}<p>Target aslinya lebih kiri atau kanan dari jarum?</p>
        <div class="choices two"><button class="btn bigbtn" data-act="steal" data-arg="L">⬅️ Kiri</button><button class="btn bigbtn" data-act="steal" data-arg="R">Kanan ➡️</button></div></div>`;
    }
    if (st.phase === 'reveal') return revealHtml(C);
    return wait();
  },
  psig: (C) => JSON.stringify([C.stage.k, C.stage.phase, C.secret, C.me && C.me.team, C.mine === undefined || C.stage.phase === 'guess' ? C.mine === undefined : C.mine]),
  pupdate(el, C) {
    const a = el.querySelector('#avgv');
    if (a) a.textContent = avg(C, C.stage) ?? '-';
  },
  playerMount(el, C) {
    const s = el.querySelector('#wslide');
    if (!s) return;
    let tmr = 0;
    s.addEventListener('input', () => {
      el.querySelector('#myv').textContent = s.value;
      clearTimeout(tmr);
      tmr = setTimeout(() => C.send({ v: +s.value }), 120);
    });
    if (!C.mine) C.send({ v: 50 });
  },
  playerActs: {
    clue: (C) => { const v = document.getElementById('wclue').value.trim(); if (v) C.send(v); },
    steal: (C, d) => { vibe(20); C.send(d); },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'guess') sfx.go();
    if (st.phase === 'reveal') { sfx.reveal(); if (st.pts >= 3) confetti(90); }
  },
};

function avg(C, st) {
  const vals = (st.guessers || []).map((id) => C.inputs[id]).filter((v) => v && typeof v.v === 'number').map((v) => v.v);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}
const needle = (v, cls) => (v == null ? '' : `<div class="needle ${cls}" style="left:${v}%"></div>`);

async function turn(C) {
  const mem = C.H.mem;
  const team = C.stage.phase === 'intro' ? 'A' : C.stage.team === 'A' ? 'B' : 'A';
  const members = C.byTeam(team);
  if (members.length < 2) return alert('Kubu itu kurang orang. Acak kubu dulu.');
  const psychic = members[mem.rot[team]++ % members.length].id;
  const target = 5 + Math.floor(Math.random() * 91);
  const [sp] = fresh('spectrum', SPECTRUM, 1);
  mem.target = target;
  await C.H.secrets({ [psychic]: { target } });
  await C.H.setStage('gelombang', { phase: 'clue', team, psychic, sp, guessers: members.filter((p) => p.id !== psychic).map((p) => p.id), endsAt: C.now() + CDUR });
}

async function lock(C) {
  const st = C.stage;
  const guess = avg(C, st) ?? 50;
  const stealers = C.byTeam(st.team === 'A' ? 'B' : 'A').map((p) => p.id);
  await C.H.setStage('gelombang', { ...st, phase: 'steal', guess, stealers, endsAt: C.now() + SDUR });
}

async function reveal(C) {
  const st = C.stage;
  const target = C.H.mem.target;
  const pts = score(Math.abs(target - st.guess));
  const dir = target < st.guess ? 'L' : 'R';
  const gains = {};
  if (pts) [...st.guessers, st.psychic].forEach((id) => { gains[id] = pts; });
  const stealRight = st.stealers.filter((id) => C.inputs[id] === dir && Math.abs(target - st.guess) > 4);
  stealRight.forEach((id) => { gains[id] = (gains[id] || 0) + 1; });
  await C.H.addPts(gains);
  await C.H.secrets(null);
  await C.H.patch({ phase: 'reveal', target, pts, stealRight });
}

function revealHtml(C) {
  const st = C.stage;
  const t = st.target;
  return `<div class="card center"><div class="quote">🔮 "${esc(st.clue)}"</div><div class="poles"><span>⬅️ ${esc(st.sp[0])}</span><span>${esc(st.sp[1])} ➡️</span></div>
    <div class="dial"><div class="zone" style="left:${t - 17}%;width:34%" data-l="2"></div><div class="zone" style="left:${t - 10}%;width:20%" data-l="3"></div><div class="zone" style="left:${t - 4}%;width:8%" data-l="4"></div>${needle(st.guess, 'team')}</div>
    <p>Target: <b>${t}</b> • Tebakan: <b>${st.guess}</b></p><div class="bignum">+${st.pts}</div><p>buat ${teamName(st.team)}</p>
    ${st.stealRight && st.stealRight.length ? `<p class="muted">Curi poin: ${st.stealRight.map((id) => esc(C.pl(id).name)).join(', ')} (+1)</p>` : ''}</div>`;
}

export default g;
