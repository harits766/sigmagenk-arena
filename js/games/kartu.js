import { esc, chip, timer, intro, wait, bar, btn, changed, sfx, splash, vibe, confetti } from './common.js';
import { CARDS } from '../data.js';
import { pick, teamName } from '../ui.js';

const g = {
  id: 'kartu', name: 'Kartu Gerak', emoji: '🃏', group: 'heboh',
  blurb: 'Game fisik singkat: ular naga, tahan tawa, DOR!, charades. HP jadi timer & wasit.',
  steps: ['Host pilih kartu permainan.', 'HP nunjukin aturan, wakil kubu, dan timer.', 'Host kasih poin ke kubu yang menang.'],
  say: 'Waktunya gerak dikit biar ga ngantuk! 🏃',
  async start(C) { await C.H.setStage('kartu', { phase: 'pick' }); },
  host(C) {
    const st = C.stage;
    if (st.phase === 'pick') return `<div class="tiles">${CARDS.map((c) => `<button class="tile" data-act="card" data-arg="${c.id}"><span class="te">${c.e}</span><b>${esc(c.t)}</b><small>${c.secs} detik</small>${c.field ? '<em class="tag">🕌 lapangan</em>' : ''}</button>`).join('')}</div>` + bar(btn('toMenu', '🏠 Menu'));
    const c = CARDS.find((x) => x.id === st.card);
    return cardHtml(C, c, true) + bar(
      st.endsAt ? '' : btn('go', `⏱️ Mulai ${c.secs} detik`, 'primary xl'),
      btn('reps', '🎲 Acak wakil'), c.secret ? btn('phrase', '🔄 Frasa baru') : '', c.prompt ? btn('prompt', '🔄 Kata baru') : '',
      btn('win', '🟢 Hijau menang (+3)', '', 'A'), btn('win', '🟡 Emas menang (+3)', '', 'B'), btn('back', '🃏 Kartu lain'));
  },
  hostActs: {
    card: async (C, id) => { const c = CARDS.find((x) => x.id === id); const r = reps(C); await phrase(C, id, r); await C.H.setStage('kartu', { phase: 'card', card: id, ...r, prompt: c.prompt ? pick(c.prompt) : null }); },
    go: (C) => { const c = CARDS.find((x) => x.id === C.stage.card); return C.H.patch({ endsAt: C.now() + c.secs * 1000, total: c.secs * 1000 }); },
    reps: async (C) => { const r = reps(C); await phrase(C, C.stage.card, r); await C.H.patch({ ...r, endsAt: null }); },
    phrase: (C) => phrase(C, C.stage.card, C.stage),
    prompt: (C) => C.H.patch({ prompt: pick(CARDS.find((x) => x.id === C.stage.card).prompt) }),
    win: async (C, t) => { await C.H.teamPts(t, 3); await C.H.patch({ lastWin: t, winAt: C.now() }); },
    back: (C) => C.H.setStage('kartu', { phase: 'pick' }),
  },
  player(C) {
    const st = C.stage;
    if (st.phase === 'pick') return wait('Host lagi milih kartu permainan...');
    const c = CARDS.find((x) => x.id === st.card);
    return cardHtml(C, c, false);
  },
  fx(C, prev) {
    const st = C.stage;
    if (prev && prev.k === st.k && st.winAt && st.winAt !== prev.winAt) { sfx.win(); if (C.me && C.me.team === st.lastWin) confetti(70); splash(st.lastWin === 'A' ? '🟢 +3' : '🟡 +3'); }
    if (prev && prev.k === st.k && st.endsAt && st.endsAt !== prev.endsAt) sfx.go();
  },
};

function reps(C) {
  const a = C.byTeam('A'), b = C.byTeam('B');
  return { repA: a.length ? pick(a).id : null, repB: b.length ? pick(b).id : null };
}
async function phrase(C, id, r) {
  const c = CARDS.find((x) => x.id === id);
  if (!c.secret) return C.H.secrets(null);
  const s = {};
  [r.repA, r.repB].filter(Boolean).forEach((pid) => { s[pid] = { phrase: pick(c.secret) }; });
  return C.H.secrets(s);
}

function cardHtml(C, c, host) {
  const st = C.stage;
  const sec = (C.secret || {}).phrase;
  return `<div class="card"><div class="gtitle intro"><span class="ge">${c.e}</span><h2>${esc(c.t)}</h2></div>
    <ol class="steps">${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="versus" style="margin-top:12px"><div class="side tA"><small>Wakil ${teamName('A')}</small><br>${chip(C.pl(st.repA))}</div><div class="side tB"><small>Wakil ${teamName('B')}</small><br>${chip(C.pl(st.repB))}</div></div>
    ${st.prompt ? `<div class="secret" style="margin-top:10px"><small>Kata awal</small><div class="word">${esc(st.prompt)}</div></div>` : ''}
    ${!host && sec ? `<div class="secret" style="margin-top:10px"><small>Peragain ini (rahasia!)</small><div class="word">${esc(sec)}</div></div>` : ''}
    ${st.endsAt ? timer(st.endsAt, st.total) : ''}</div>`;
}

export default g;
