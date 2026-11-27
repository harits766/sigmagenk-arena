import { esc, chip, confetti, sfx } from './common.js';
import { GM_LINES } from '../data.js';
import { pick, teamName } from '../ui.js';

export const GROUPS = [
  { id: 'battle', e: '⚔️', name: 'Battle 2 Kubu', sub: 'Semua main lewat HP • cocok di dalam rumah', games: ['kuis', 'tabu', 'frekuensi', 'kibul', 'receh', 'siapa'] },
  { id: 'heboh', e: '🔥', name: 'Heboh Bareng', sub: 'Deduksi, voting, gerak • paling pas di lapangan', games: ['undercover', 'gelombang', 'sipaling', 'katahost', 'gso', 'kartu'] },
  { id: 'hp6', e: '🎮', name: 'Games HP 6 Ronde', sub: 'Eliminasi minigame, yang kalah kena pertanyaan deep talk', games: ['hp6'] },
  { id: 'deep', e: '🌙', name: 'Literasi & Deep Talk', sub: 'Bedah buku dadakan + life update next level', games: ['buku', 'life'] },
];

export function makeMenu(GAMES) {
  let warn = null;
  return {
    id: 'menu', name: 'Menu', emoji: '🏠',
    host(C) {
      const v = C.meta.venue || 'indoor';
      const n = C.active.length;
      return `
      <div class="menuhead">
        <div class="venue">
          <button class="vbtn ${v === 'indoor' ? 'sel' : ''}" data-act="venue" data-arg="indoor">🏠 Dalem Rumah / Teras</button>
          <button class="vbtn ${v === 'field' ? 'sel' : ''}" data-act="venue" data-arg="field">🕌 Lapangan Deket Masjid</button>
        </div>
        <div class="row"><button class="btn" data-act="showJoin">📱 QR Join</button><button class="btn" data-act="split">🔀 Acak Kubu</button><button class="btn" data-act="showBoard">📣 Klasemen ke semua HP</button></div>
      </div>
      ${n < 3 ? `<div class="card warn">Baru ${n} orang yang masuk. Klik <b>📱 QR Join</b> biar yang lain scan.</div>` : ''}
      ${warn ? `<div class="card warn"><p>🤖 ${esc(GM_LINES.indoorHeboh)}</p><div class="row">
          <button class="btn primary" data-act="goField">Otw lapangan! (ganti venue)</button>
          <button class="btn" data-act="forceStart" data-arg="${warn}">Tetep gas di sini</button>
          <button class="btn" data-act="cancelWarn">Pilih yang lain</button></div></div>` : ''}
      ${GROUPS.map((gr) => `
        <section class="group">
          <h3>${gr.e} ${esc(gr.name)} <small>${esc(gr.sub)}</small></h3>
          <div class="tiles">${gr.games.map((id) => { const g = GAMES[id]; if (!g) return ''; return `
            <button class="tile" data-act="pick" data-arg="${id}">
              <span class="te">${g.emoji}</span><b>${esc(g.name)}</b><small>${esc(g.blurb)}</small>
              ${g.field ? '<em class="tag">🕌 lapangan</em>' : ''}${g.min ? `<em class="tag">min ${g.min} org</em>` : ''}
            </button>`; }).join('')}</div>
        </section>`).join('')}`;
    },
    hostActs: {
      venue: (C, v) => C.db.set(C.room('meta/venue'), v),
      pick: (C, id) => {
        const g = GAMES[id];
        if (g.field && (C.meta.venue || 'indoor') === 'indoor') { warn = id; C.H.say(GM_LINES.indoorHeboh); return redraw(C); }
        if (g.min && C.active.length < g.min) { if (!confirm(`${g.name} idealnya minimal ${g.min} orang (sekarang ${C.active.length}). Tetep mulai?`)) return; }
        warn = null;
        start(C, g);
      },
      forceStart: (C, id) => { warn = null; start(C, GAMES[id]); },
      goField: (C) => { const id = warn; warn = null; C.db.set(C.room('meta/venue'), 'field'); start(C, GAMES[id]); },
      cancelWarn: (C) => { warn = null; redraw(C); },
      showBoard: (C) => C.H.setStage('board'),
    },
    player(C) {
      const ranked = [...C.plist].sort((a, b) => (b.pts || 0) - (a.pts || 0)).slice(0, 5);
      return `<div class="card center lobby">
        <div class="bigav">${esc(C.me.av)}</div>
        <h2>Halo, ${esc(C.me.name)}!</h2>
        <p class="teamtag t${C.me.team}">Lu di ${C.me.team === 'A' ? '🟢' : '🟡'} ${esc(teamName(C.me.team))}</p>
        <p class="muted">Host lagi milih game. Ramein dulu pake tombol reaksi di bawah 👇</p>
      </div>
      <div class="card"><h3>Yang udah masuk (${C.active.length})</h3><div class="chips">${C.active.map((p) => chip(p)).join('')}</div></div>
      ${ranked.some((p) => p.pts) ? `<div class="card"><h3>🏆 Top 5</h3><ol class="board">${ranked.map((p, i) => `<li><span class="rank">${i + 1}</span>${chip(p)}<b>${p.pts || 0}</b></li>`).join('')}</ol></div>` : ''}`;
    },
    psig: (C) => JSON.stringify([C.stage.k, C.me, C.active.map((p) => [p.name, p.av, p.team, p.pts])]),
  };
}

const redraw = (C) => C.redraw();

async function start(C, g) {
  await C.H.secrets(null);
  C.H.mem = {};
  if (g.start) await g.start(C);
  else await C.H.setStage(g.id, { phase: 'intro' });
  if (g.say) C.H.say(typeof g.say === 'function' ? g.say(C) : g.say);
}

export const board = {
  id: 'board', name: 'Klasemen', emoji: '🏆',
  host: (C) => `<div class="card">${C.S.boardHtml(C)}</div><div class="hostbar"><button class="btn primary" data-act="toMenu">🏠 Balik ke menu</button></div>`,
  hostActs: { toMenu: (C) => C.H.menu() },
  player: (C) => {
    const rank = [...C.plist].sort((a, b) => (b.pts || 0) - (a.pts || 0)).findIndex((p) => p.id === C.me.id) + 1;
    return `<div class="card center"><p>Peringkat lu</p><div class="bignum">#${rank}</div><p class="muted">${C.me.pts || 0} poin</p></div><div class="card">${C.S.boardHtml(C, 10)}</div>`;
  },
  fx: (C, prev) => { if (!prev || prev.k !== C.stage.k) { sfx.win(); confetti(160); } },
};

export const menuSay = () => pick(GM_LINES.menu);
