// Netlify Function: proxies the AI question generator so API keys never reach the browser.
// Env vars (Netlify > Site configuration > Environment variables):
//   OPENAI_API_KEY (used first if set), OPENAI_MODEL (optional, default gpt-4o-mini)
//   GEMINI_API_KEY (fallback), GEMINI_MODEL (optional, default gemini-2.5-flash)
const SYSTEM = `Kamu AI Game Master & fasilitator acara kumpul anak muda bernuansa Islami ("Sigmagenk Arena").
Bahasa Indonesia santai, akrab, hangat (lu-gue), cerdas, tidak menggurui, tetap beradab Islami.
Balas HANYA JSON sesuai skema: {"message": "1 kalimat pengantar santai", "items": ["..."]}.`;

const TASKS = {
  book: (i) => `Pembedah mau bedah buku/bacaan "${i.title}" (genre: ${i.genre || 'bebas'}).
Buat 5 pertanyaan kritis Hot Seat yang menguji pemahaman dan mengaitkan isi buku dengan kehidupan anak muda sekarang dan nilai Islam. Tiap pertanyaan maksimal 30 kata. Kalau kamu tidak yakin isi bukunya, buat pertanyaan yang tetap relevan tanpa mengarang fakta spesifik tentang buku itu.`,
};

const clip = (s, n) => String(s ?? '').slice(0, n);

async function openai(key, prompt) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.9,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw new Error('openai ' + r.status);
  const j = await r.json();
  return JSON.parse(j.choices[0].message.content);
}

async function gemini(key, prompt) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties: { message: { type: 'STRING' }, items: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['items'] },
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!r.ok) throw new Error('gemini ' + r.status);
  const j = await r.json();
  return JSON.parse(j.candidates[0].content.parts[0].text);
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const providers = [['openai', process.env.OPENAI_API_KEY, openai], ['gemini', process.env.GEMINI_API_KEY, gemini]].filter(([, k]) => k);
  if (!providers.length) return Response.json({ error: 'OPENAI_API_KEY / GEMINI_API_KEY belum di-set' }, { status: 500 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'bad json' }, { status: 400 }); }
  const make = TASKS[body.task];
  if (!make) return Response.json({ error: 'unknown task' }, { status: 400 });
  const input = Object.fromEntries(Object.entries(body.input || {}).map(([k, v]) => [k, clip(v, 400)]));
  const prompt = make(input);
  const errs = [];
  for (const [name, key, call] of providers) {
    try {
      const out = await call(key, prompt);
      const items = (Array.isArray(out.items) ? out.items : []).filter((x) => typeof x === 'string' && x.trim()).slice(0, 5).map((x) => clip(x, 300));
      if (!items.length) throw new Error(name + ' empty');
      return Response.json({ message: clip(out.message, 300), items, via: name });
    } catch (e) { errs.push(e.message); }
  }
  return Response.json({ error: errs.join('; ') }, { status: 502 });
};
