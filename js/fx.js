// Sound (synthesized, no files), haptics, confetti, floating reactions, toasts.
let ctx = null;
let muted = (() => { try { return localStorage.getItem('sg_mute') === '1'; } catch { return false; } })();

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('sg_mute', muted ? '1' : '0'); } catch {}
  return muted;
}
export function unlockAudio() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; } }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.18, when = 0, slide = 0) {
  if (muted || !ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  tap: () => tone(660, 0.05, 'triangle', 0.08),
  tick: () => tone(880, 0.06, 'square', 0.05),
  tock: () => tone(440, 0.12, 'square', 0.08),
  go: () => { tone(523, 0.1, 'triangle'); tone(784, 0.18, 'triangle', 0.2, 0.1); },
  good: () => { tone(660, 0.08, 'triangle'); tone(990, 0.16, 'triangle', 0.18, 0.08); },
  bad: () => tone(200, 0.35, 'sawtooth', 0.12, 0, -120),
  buzz: () => { tone(140, 0.4, 'square', 0.16); tone(147, 0.4, 'square', 0.12); },
  whoosh: () => tone(300, 0.25, 'sine', 0.1, 0, 600),
  reveal: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.15, i * 0.08)),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.18, i * 0.11)),
  pop: () => tone(1200, 0.04, 'sine', 0.07, 0, -500),
  boom: () => { tone(90, 0.6, 'sawtooth', 0.25, 0, -50); tone(60, 0.7, 'square', 0.15); },
};

export function vibe(p = 30) { try { navigator.vibrate && navigator.vibrate(p); } catch {} }

// ---------- confetti ----------
let cv = null, parts = [], raf = 0;
export function confetti(n = 120) {
  if (!cv) {
    cv = document.createElement('canvas');
    cv.className = 'fx-canvas';
    document.body.appendChild(cv);
  }
  const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
  const cols = ['#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#f87171', '#a78bfa'];
  for (let i = 0; i < n; i++) {
    parts.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.4, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * 6 + 3, c: cols[i % cols.length], a: Math.random() * 6, life: 0 });
  }
  if (!raf) loop();
}
function loop() {
  const g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  parts.forEach((p) => {
    p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += 0.2; p.life++;
    g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore();
  });
  parts = parts.filter((p) => p.y < cv.height + 20 && p.life < 300);
  raf = parts.length ? requestAnimationFrame(loop) : (g.clearRect(0, 0, cv.width, cv.height), 0);
}

// ---------- floating emoji reactions ----------
export function floatEmoji(e, label = '') {
  const el = document.createElement('div');
  el.className = 'float-emoji';
  el.style.left = 8 + Math.random() * 80 + '%';
  el.innerHTML = `<span>${e}</span>${label ? `<small>${label}</small>` : ''}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- toast ----------
export function toast(msg, kind = '') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.classList.add('out'), 2200);
  setTimeout(() => el.remove(), 2700);
}

// Big centered splash ("BENAR!", "3", "GO!")
export function splash(text, kind = '') {
  const el = document.createElement('div');
  el.className = 'splash ' + kind;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}
