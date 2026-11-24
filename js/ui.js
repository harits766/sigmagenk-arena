import { db } from './db.js';
import { sfx } from './fx.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const arr = (x) => (Array.isArray(x) ? x.filter((v) => v != null) : x && typeof x === 'object' ? Object.values(x) : []);
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const sample = (a, n) => shuffle(a).slice(0, n);
export const rid = (n = 6) => Math.random().toString(36).slice(2, 2 + n);
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\b(yang|si|sang|the)\b/g, ' ').replace(/\s+/g, ' ').trim();

// Pick n items from a bank, avoiding ones used before in this room (kept in localStorage on the host).
export function fresh(bankId, bank, n = 1) {
  const key = 'sg_used_' + bankId;
  let used = [];
  try { used = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  let idx = bank.map((_, i) => i).filter((i) => !used.includes(i));
  if (idx.length < n) { used = []; idx = bank.map((_, i) => i); }
  const chosen = sample(idx, n);
  try { localStorage.setItem(key, JSON.stringify([...used, ...chosen])); } catch {}
  return chosen.map((i) => bank[i]);
}

// Countdown elements: <span data-ends="ts" data-total="ms"> and <div class="bar" data-ends data-total>
let lastBeep = -1;
export function startTimerLoop(isLoud) {
  setInterval(() => {
    const now = db.now();
    document.querySelectorAll('[data-ends]').forEach((el) => {
      const ends = +el.dataset.ends;
      const total = +el.dataset.total || 1;
      const left = Math.max(0, ends - now);
      if (el.classList.contains('bar')) {
        el.style.setProperty('--p', (left / total).toFixed(3));
        el.classList.toggle('low', left < 5000);
      } else {
        const s = Math.ceil(left / 1000);
        el.textContent = s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : s;
        el.classList.toggle('low', left < 5000 && left > 0);
      }
      if (el.dataset.beep != null && isLoud()) {
        const s = Math.ceil(left / 1000);
        if (s <= 3 && s >= 0 && left > 0 && s !== lastBeep) { lastBeep = s; sfx.tick(); }
        if (left === 0 && lastBeep !== 0) { lastBeep = 0; sfx.tock(); }
      }
    });
  }, 100);
}
export const timer = (ends, total, beep = true) =>
  `<div class="timer"><div class="bar" data-ends="${ends}" data-total="${total}"></div><span class="secs" data-ends="${ends}" data-total="${total}" ${beep ? 'data-beep' : ''}></span></div>`;

// Re-render an element while keeping typed text, focus and caret.
export function renderKeep(el, html) {
  const saved = {};
  el.querySelectorAll('input[id],textarea[id],select[id]').forEach((i) => {
    if (i.type === 'range') return;
    saved[i.id] = i.type === 'checkbox' ? i.checked : i.value;
  });
  const act = document.activeElement;
  const focusId = act && el.contains(act) ? act.id : null;
  const sel = focusId && act.selectionStart != null ? [act.selectionStart, act.selectionEnd] : null;
  el.innerHTML = html;
  for (const [id, v] of Object.entries(saved)) {
    const i = el.querySelector('#' + CSS.escape(id));
    if (!i || i.dataset.fresh != null) continue;
    if (i.type === 'checkbox') i.checked = v; else i.value = v;
  }
  if (focusId) {
    const f = el.querySelector('#' + CSS.escape(focusId));
    if (f) { f.focus(); if (sel && f.setSelectionRange) try { f.setSelectionRange(...sel); } catch {} }
  }
}

export const avatarOf = (p) => (p ? `<span class="av">${esc(p.av || '🙂')}</span>` : '');
export const nameOf = (p) => (p ? esc(p.name) : '?');
export const chip = (p, extra = '') => (p ? `<span class="chip t${p.team || ''}">${avatarOf(p)}${nameOf(p)}${extra}</span>` : '');
export const teamName = (t) => (t === 'A' ? 'Kubu Hijau' : t === 'B' ? 'Kubu Emas' : '-');
