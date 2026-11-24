import { esc, chip, timer, intro, wait, bar, btn, answered, progress, changed, sfx, splash, vibe, confetti } from './common.js';
import { GSO, GSO_BEATS } from '../data.js';
import { teamName, pick } from '../ui.js';

const PDUR = 15000;

const g = {
  id: 'gso', name: 'Gajah-Orang-Semut', emoji: '🐘', group: 'heboh', field: true,
  blurb: 'Suit massal 2 kubu. Pilih jurus di HP, terus peragain serentak!',
  steps: ['Tiap kubu kumpul membelakangi lawan, pilih jurus di HP (15 detik). Suara terbanyak jadi jurus kubu.', '🐘 Gajah > 🧍 Orang > 🐜 Semut > 🐘 Gajah.', 'Pas hasil keluar, semua lompat madep lawan & peragain jurusnya!', 'Kubu yang kalah dikejar sampai garis belakang. Yang ketangkep pindah kubu (host atur di menu 👥).'],
  say: 'Gajah-Orang-Semut! Kompakan sama kubu lu, jangan ada yang beda sendiri 🐘🧍🐜',
  async start(C) { C.H.mem = { wins: { A: 0, B: 0 }, round: 0 }; await C.H.setStage('gso', { phase: 'intro' }); },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('pick', '▶️ Ronde 1', 'primary xl'));
    if (st.phase === 'pick') {
      const a = answered(C, C.byTeam('A').map((p) => p.id)), b = answered(C, C.byTeam('B').map((p) => p.id));
      return `<div class="card center"><div class="qmeta">Ronde ${st.round}</div><h2>Kubu lagi milih jurus...</h2>${timer(st.endsAt, PDUR)}
        <div class="versus"><div class="side tA"><h3>${teamName('A')}</h3><div class="bignum">${a.n}/${a.total}</div></div><div class="side tB"><h3>${teamName('B')}</h3><div class="bignum">${b.n}/${b.total}</div></div></div></div>` + bar(btn('reveal', '⏭️ Buka sekarang'));
    }
    if (st.phase === 'reveal') return revealHtml(C) + bar(btn('pick', '▶️ Ronde berikutnya', 'primary xl'), btn('toMenu', '🏁 Udahan'));
    return '';
  },
  hostActs: {
    pick: (C) => { C.H.mem.round = (C.H.mem.round || 0) + 1; return C.H.setStage('gso', { phase: 'pick', round: C.H.mem.round, endsAt: C.now() + PDUR }); },
    reveal: (C) => reveal(C),
  },
  tick(C) {
    const st = C.stage;
    if (st.phase === 'pick' && (C.now() > st.endsAt + 300 || answered(C).all)) C.once('rev', () => reveal(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'pick') {
      const mine = C.mine;
      const mates = C.byTeam(C.me.team).map((p) => C.inputs[p.id]).filter(Boolean);
      return `<div class="card center"><p class="teamtag t${C.me.team}">${teamName(C.me.team)} • Ronde ${st.round}</p><h2>Pilih jurus kubu!</h2>${timer(st.endsAt, PDUR, false)}
        <div class="choices">${Object.entries(GSO).map(([k, v]) => `<button class="choice ${mine === k ? 'sel' : ''}" data-act="pose" data-arg="${k}"><span style="font-size:2.4rem">${v.e}</span><span><b>${v.n}</b><br><small>${v.how}</small></span><b id="cnt${k}" style="margin-left:auto">${mates.filter((m) => m === k).length || ''}</b></button>`).join('')}</div>
        <p class="muted">Angka = suara temen sekubu. Boleh ganti sebelum waktu habis.</p></div>`;
    }
    if (st.phase === 'reveal') return revealHtml(C);
    return wait();
  },
  psig: (C) => JSON.stringify([C.stage.k, C.stage.phase, C.me && C.me.team, C.mine]),
  pupdate(el, C) {
    const mates = C.byTeam(C.me.team).map((p) => C.inputs[p.id]).filter(Boolean);
    Object.keys(GSO).forEach((k) => { const e = el.querySelector('#cnt' + k); if (e) e.textContent = mates.filter((m) => m === k).length || ''; });
  },
  playerActs: { pose: (C, k) => { vibe(20); C.send(k); } },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    const st = C.stage;
    if (st.phase === 'pick') sfx.go();
    if (st.phase === 'reveal') {
      sfx.boom();
      if (C.me && st.win === C.me.team) { confetti(); splash('MENANG! KEJAR!', 'good'); vibe([60, 40, 60]); }
      else if (C.me && st.win) { splash('KABUR!!', 'bad'); vibe(400); }
    }
  },
};

function teamPose(C, t) {
  const c = { G: 0, O: 0, S: 0 };
  C.byTeam(t).forEach((p) => { const v = C.inputs[p.id]; if (c[v] != null) c[v]++; });
  const max = Math.max(...Object.values(c));
  const tops = Object.keys(c).filter((k) => c[k] === max);
  return { pose: pick(tops), c };
}

async function reveal(C) {
  const A = teamPose(C, 'A'), B = teamPose(C, 'B');
  const win = A.pose === B.pose ? null : GSO_BEATS[A.pose] === B.pose ? 'A' : 'B';
  const gains = {};
  if (win) C.byTeam(win).forEach((p) => { gains[p.id] = 2; });
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'reveal', A, B, win });
}

function revealHtml(C) {
  const st = C.stage;
  const side = (t, d) => `<div class="side t${t}"><h3>${teamName(t)}</h3><div class="pose">${GSO[d.pose].e}</div><h2>${GSO[d.pose].n}</h2><small class="muted">🐘${d.c.G} 🧍${d.c.O} 🐜${d.c.S}</small></div>`;
  return `<div class="card center"><div class="versus">${side('A', st.A)}${side('B', st.B)}</div>
    <h2 style="margin-top:12px">${st.win ? `🏆 ${teamName(st.win)} menang! KEJAR!` : '🤝 Seri! Ulang!'}</h2></div>`;
}

export default g;
