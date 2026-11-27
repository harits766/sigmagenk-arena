import { esc, chip, timer, arr } from '../ui.js';
import { sfx, splash, confetti, vibe } from '../fx.js';

export { esc, chip, timer, arr, sfx, splash, confetti, vibe };

// Rules card shown on every screen during a game's intro phase.
export function intro(g, extra = '') {
  return `<div class="card intro">
    <div class="gtitle"><span class="ge">${g.emoji}</span><h2>${esc(g.name)}</h2></div>
    <p class="blurb">${esc(g.blurb)}</p>
    <ol class="steps">${g.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${extra}
  </div>`;
}
export const wait = (text = 'Tunggu host ya...', sub = '') => `<div class="card center waitcard"><div class="spinner"></div><p>${esc(text)}</p>${sub ? `<small class="muted">${sub}</small>` : ''}</div>`;
export const bar = (...btns) => `<div class="hostbar">${btns.filter(Boolean).join('')}</div>`;
export const btn = (act, label, cls = '', arg = '') => `<button class="btn ${cls}" data-act="${act}" ${arg !== '' ? `data-arg="${esc(arg)}"` : ''}>${label}</button>`;
export const answered = (C, ids) => {
  const list = ids || C.active.map((p) => p.id);
  const n = list.filter((id) => C.inputs[id] !== undefined).length;
  return { n, total: list.length, all: list.length > 0 && n >= list.length };
};
export const progress = (C, ids) => { const a = answered(C, ids); return `<div class="answered"><b>${a.n}</b>/${a.total} udah jawab</div>`; };
export function whoAnswered(C, ids) {
  const list = ids || C.active.map((p) => p.id);
  return `<div class="whogrid">${list.map((id) => { const p = C.pl(id); return `<span class="who ${C.inputs[id] !== undefined ? 'done' : ''}">${esc(p.av)}<small>${esc(p.name)}</small></span>`; }).join('')}</div>`;
}
// Phase-change hook helper: runs fn when stage phase/key changed vs prev.
export const changed = (C, prev) => !prev || prev.k !== C.stage.k || prev.phase !== C.stage.phase;
export const sortBy = (a, f) => [...a].sort((x, y) => f(y) - f(x));
export function endCard(C, title = 'Game Selesai!', gains) {
  const list = gains ? Object.entries(gains).filter(([, v]) => v).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];
  return `<div class="card center"><h2>🏁 ${esc(title)}</h2>
    ${list.length ? `<ol class="board">${list.map(([id, v], i) => `<li style="--i:${i}"><span class="rank">${['🥇', '🥈', '🥉'][i] || i + 1}</span>${chip(C.pl(id))}<b>+${v}</b></li>`).join('')}</ol>` : ''}
  </div>`;
}

// Host-adjustable durations: each game lists `timers: [{ k, label, def }]` (seconds);
// the host edits them before the game starts and they live in meta/timers/<gameId>/<k>.
export function dur(C, gameId, k, def) {
  const v = C.meta && C.meta.timers && C.meta.timers[gameId] && C.meta.timers[gameId][k];
  return (v > 0 ? v : def) * 1000;
}
