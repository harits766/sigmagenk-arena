// Netlify Function: proxies the AI question generator to Gemini so the API key never reaches the browser.
// Env vars (Netlify > Site configuration > Environment variables): GEMINI_API_KEY (required), GEMINI_MODEL (optional).
const SYSTEM = `Kamu AI Game Master & fasilitator acara kumpul anak muda bernuansa Islami ("Sigmagenk Arena").
Bahasa Indonesia santai, akrab, hangat (lu-gue), cerdas, tidak menggurui, tetap beradab Islami.
Balas HANYA JSON sesuai skema: {"message": "1 kalimat pengantar santai", "items": ["..."]}.`;

const TASKS = {
  book: (i) => `Pembedah mau bedah buku/bacaan "${i.title}" (genre: ${i.genre || 'bebas'}).
Buat 5 pertanyaan kritis Hot Seat yang menguji pemahaman dan mengaitkan isi buku dengan kehidupan anak muda sekarang dan nilai Islam. Tiap pertanyaan maksimal 30 kata. Kalau kamu tidak yakin isi bukunya, buat pertanyaan yang tetap relevan tanpa mengarang fakta spesifik tentang buku itu.`,
};

const clip = (s, n) => String(s ?? '').slice(0, n);

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'GEMINI_API_KEY belum di-set' }, { status: 500 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'bad json' }, { status: 400 }); }
  const make = TASKS[body.task];
  if (!make) return Response.json({ error: 'unknown task' }, { status: 400 });
  const input = Object.fromEntries(Object.entries(body.input || {}).map(([k, v]) => [k, clip(v, 400)]));
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: make(input) }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties: { message: { type: 'STRING' }, items: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['items'] },
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!r.ok) return Response.json({ error: 'gemini ' + r.status }, { status: 502 });
  const j = await r.json();
  try {
    const out = JSON.parse(j.candidates[0].content.parts[0].text);
    return Response.json({ message: clip(out.message, 300), items: (out.items || []).slice(0, 5).map((x) => clip(x, 300)) });
  } catch {
    return Response.json({ error: 'parse' }, { status: 502 });
  }
};
