import { esc, chip, intro, wait, bar, btn, changed, sfx, splash, vibe, confetti } from './common.js';
import { HB_CMDS } from '../data.js';
import { pick } from '../ui.js';

const LEN = 22;
let loop = 0;

const g = {
  id: 'katahost', name: 'Kata Host', emoji: '📢', group: 'heboh',
  blurb: 'Tap perintah di HP, TAPI cuma kalau diawali "Kata Host". Makin lama makin cepet!',
  steps: ['Perintah muncul di semua HP: PAGI ☀️, SIANG 🌤️, MALAM 🌙, HIJRAH ➡️.', 'Kalau diawali "KATA HOST:", tap tombol yang sesuai sebelum perintah berikutnya.', 'Kalau TANPA "Kata Host", jangan tap apa-apa!', 'Salah tap / telat = OUT. Yang bertahan sampai akhir menang.'],
  say: 'Kata Host... fokus! Jempol jangan gatel 📢',
  async start(C) { await C.H.setStage('katahost', { phase: 'intro' }); },
  host(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g) + bar(btn('play', '▶️ Mulai', 'primary xl'));
    if (st.phase === 'play') {
      const outN = Object.keys(C.inputs).length;
      return `<div class="card center"><div id="hbnow" class="bigtext" style="font-size:2.6rem;min-height:120px"></div><p><b>${C.active.length - outN}</b> masih bertahan • ${outN} out</p>
        <div class="chips" style="justify-content:center">${Object.entries(C.inputs).map(([id, v]) => chip(C.pl(id), ` ❌ ${v.i + 1}`)).join('')}</div></div>`;
    }
    if (st.phase === 'result') return resultHtml(C) + bar(btn('play', '🔁 Main lagi', 'primary xl'), btn('toMenu', '🏠 Menu'));
    return '';
  },
  hostMount(el, C) { mountLoop(el, C, true); },
  hostActs: { play: (C) => play(C) },
  tick(C) {
    const st = C.stage;
    if (st.phase !== 'play') return;
    const end = st.times[st.times.length - 1] + 1200;
    const alive = C.active.filter((p) => !C.inputs[p.id]).length;
    if (C.now() > end || (alive <= 1 && C.active.length > 1 && C.now() > st.times[0] + 3000)) C.once('res', () => result(C));
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'intro') return intro(g);
    if (st.phase === 'play') {
      if (C.mine) return `<div class="card center result bad"><div class="bigemoji">💀</div><h2>OUT!</h2><p>${esc(C.mine.why)}</p><p class="muted">Bertahan sampai perintah ke-${C.mine.i + 1}</p></div>`;
      return `<div class="card center"><div id="hbnow" class="bigtext" style="font-size:2rem;min-height:100px"></div></div>
        <div class="choices two">${HB_CMDS.map((c) => `<button class="btn bigbtn" data-act="tap" data-arg="${c.id}">${c.e}<br>${c.label}</button>`).join('')}</div>`;
    }
    if (st.phase === 'result') return resultHtml(C);
    return wait();
  },
  playerMount(el, C) { mountLoop(el, C, false); },
  psig: (C) => JSON.stringify([C.stage.k, C.stage.phase, C.mine ? 1 : 0, C.stage.phase === 'result' ? C.stage : 0]),
  playerActs: {
    tap: (C, id) => {
      const st = C.stage;
      if (C.mine || st.phase !== 'play') return;
      const i = idxAt(st, C.now());
      if (i < 0) return;
      const cmd = st.seq[i];
      const done = (tapped[st.k] = tapped[st.k] || {});
      if (!cmd.s) return out(C, i, 'Host ga bilang "Kata Host"! 😆');
      if (cmd.c !== id) return out(C, i, 'Salah tombol!');
      if (done[i]) return;
      done[i] = true;
      vibe(15); sfx.good();
    },
  },
  fx(C, prev) {
    if (!changed(C, prev)) return;
    if (C.stage.phase === 'result') { sfx.win(); if (C.me && (C.stage.win || []).includes(C.me.id)) confetti(); }
  },
};

const tapped = {};
const idxAt = (st, now) => { let i = -1; for (let k = 0; k < st.times.length; k++) if (now >= st.times[k]) i = k; return i; };

function out(C, i, why) {
  vibe(300); sfx.bad();
  C.send({ i, why });
}

function mountLoop(el, C, isHost) {
  cancelAnimationFrame(loop);
  const box = el.querySelector('#hbnow');
  if (!box) return;
  let lastI = -2;
  const st = C.stage;
  const step = () => {
    const now = C.now();
    const i = idxAt(st, now);
    if (i !== lastI) {
      // Missed check: previous command needed a tap and we didn't give one.
      if (!isHost && lastI >= 0 && !C.S.inputs[C.me.id]) {
        const prevCmd = st.seq[lastI];
        if (prevCmd.s && !(tapped[st.k] || {})[lastI]) { out(C, lastI, 'Telat tap!'); return; }
      }
      lastI = i;
      if (i < 0) { const s = Math.ceil((st.times[0] - now) / 1000); box.innerHTML = `Siap... ${s}`; }
      else if (i < st.seq.length) {
        const cmd = st.seq[i];
        const c = HB_CMDS.find((x) => x.id === cmd.c);
        box.innerHTML = `${cmd.s ? '<small style="color:var(--gold)">KATA HOST:</small><br>' : ''}${c.e} ${c.label}!`;
        if (isHost) sfx.tick();
      }
    }
    if (i < 0) { const s = Math.ceil((st.times[0] - now) / 1000); box.innerHTML = `Siap... ${Math.max(0, s)}`; }
    if (i >= st.seq.length - 1 && now > st.times[st.times.length - 1]) { box.innerHTML = '🏁 Selesai!'; return; }
    loop = requestAnimationFrame(step);
  };
  step();
}

async function play(C) {
  const seq = [];
  const times = [];
  let t = C.now() + 3500;
  for (let i = 0; i < LEN; i++) {
    seq.push({ c: pick(HB_CMDS).id, s: i < 2 ? true : Math.random() < 0.68 });
    times.push(t);
    t += Math.max(900, 2300 - i * 70);
  }
  times.push(t); // end marker
  await C.H.setStage('katahost', { phase: 'play', seq, times });
}

async function result(C) {
  const win = C.active.filter((p) => !C.inputs[p.id]).map((p) => p.id);
  const gains = {};
  win.forEach((id) => { gains[id] = 6; });
  await C.H.addPts(gains);
  await C.H.patch({ phase: 'result', win, outs: C.inputs });
}

function resultHtml(C) {
  const st = C.stage;
  return `<div class="card center"><h2>${(st.win || []).length ? '🏆 Yang bertahan' : '💀 Semua out!'}</h2><div class="chips" style="justify-content:center">${(st.win || []).map((id) => chip(C.pl(id), ' +6')).join('')}</div>
    <p class="muted">${Object.entries(st.outs || {}).sort((a, b) => b[1].i - a[1].i).slice(0, 8).map(([id, v]) => `${esc(C.pl(id).name)} (${v.i + 1})`).join(' • ')}</p></div>`;
}

export default g;
