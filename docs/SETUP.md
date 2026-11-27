# Setup & Deploy

Mau bikin Sigmagenk Arena versi lu sendiri? Semuanya gratis: Firebase (plan Spark) + Netlify + Gemini API.

## 1. Firebase Realtime Database

1. Firebase Console → bikin project → **Realtime Database** → Create database.
2. Copy URL database-nya, tempel di [`js/config.js`](../js/config.js).
3. Tab **Rules** → tempel isi [`database.rules.json`](../database.rules.json) → Publish.

## 2. Netlify

1. Fork repo ini.
2. Netlify → **Add new site → Import from GitHub** → pilih fork lu. Build command kosongin, publish directory `.`.
3. **Site configuration → Environment variables** → tambah `OPENAI_API_KEY` (dari platform.openai.com) dan/atau `GEMINI_API_KEY` (dari Google AI Studio). Kalau dua-duanya ada, OpenAI dipakai duluan dan Gemini jadi cadangan. Opsional: `OPENAI_MODEL` (default `gpt-4o-mini`), `GEMINI_MODEL` (default `gemini-2.5-flash`).
4. Deploy. Tiap push ke GitHub otomatis deploy ulang.

> Deploy drag-and-drop juga bisa, tapi fitur AI (Netlify Function) ga ikut jalan. Game lainnya tetep normal.

## 3. Main

- **Laptop host:** buka `https://<site-lu>.netlify.app/?host=1` → **Bikin Room Baru** → **📱 QR Join**.
- **HP peserta:** scan QR / buka link → isi nama & pilih avatar.
- Laptop ke-refresh? Buka `?host=1` lagi → isi kode room di **Lanjutkan room lama** (dari laptop & browser yang sama).

## Coba lokal tanpa Firebase

```bash
python3 -m http.server 8000
```

Buka `http://localhost:8000/?host=1&mock=1` di satu tab, terus `http://localhost:8000/?r=KODE&mock=1&as=1`, `&as=2`, dst. di tab lain. Mode mock nyimpen data di browser, cuma buat ngetes.

## Struktur kode

```
index.html                 shell
css/style.css              semua styling
js/app.js                  room, join, sinkronisasi, overlay, klasemen
js/db.js                   Firebase RTDB + mock lokal
js/data.js                 bank konten (soal, kata, pertanyaan)
js/games/*.js              1 file per game
netlify/functions/ai.mjs   proxy Gemini (API key aman di server)
database.rules.json        rules RTDB
```

Mau nambah game? Bikin file baru di `js/games/`, daftarin di `js/games/index.js` dan `GROUPS` di `js/games/menu.js`.
