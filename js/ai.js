// Calls the Netlify Function (Gemini key stays server-side). Returns null on any failure so games fall back to the offline banks.
export async function askAI(task, input) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch('/.netlify/functions/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, input }), signal: ctl.signal,
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j && Array.isArray(j.items) && j.items.length ? j : null;
  } catch { return null; } finally { clearTimeout(t); }
}
