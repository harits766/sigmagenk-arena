# Sigmagenk Arena

Party game realtime buat kumpul sirkel (10–20 orang). Host buka di laptop, peserta join dari HP pakai kode room / QR.

## Isi game

| Grup | Game |
|---|---|
| ⚔️ Battle 2 Kubu | ⚡ Kuis Kilat · 🚫 Tabu Kilat · 🧠 Satu Frekuensi · 🤥 Kibul · 😂 Adu Receh · 🕵️ Siapa Nih? |
| 🔥 Heboh Bareng | 🕵️ Undercover · 🎚️ Gelombang Pikiran · 👉 Si Paling · 📢 Kata Host · 🐘 Gajah-Orang-Semut · 🃏 Kartu Gerak |
| 🎮 Games HP 6 Ronde | Kumpul Kode, Lampu Merah-Hijau, 7 Detik Buta, Bom Estafet, Kubu Minoritas, Sandi 1–6 |
| 🌙 Literasi & Deep Talk | 📚 Bedah Buku Dadakan · 🌙 Life Update Next Level |

Semua skor masuk ke klasemen individu + skor kubu (🟢 Hijau vs 🟡 Emas). Ada tombol reaksi emoji yang melayang di semua layar.

## Kenapa lebih cepet dari versi lama

- Tiap HP cuma dengerin bagian data yang dia butuhin (`stage`, `players`, `secret/<id>`, `in/<ronde>`), bukan seluruh room.
- Timer dihitung di HP masing-masing dari jam server, jadi ga ada tulis ke database tiap detik.
- Konten game ada di HP (offline bank), ga nunggu AI. AI cuma dipake buat pertanyaan bedah buku & follow-up deep talk.
- Ga pake Tailwind CDN (yang compile CSS di HP), CSS-nya udah jadi.

## Setup (sekali aja)

1. **Firebase RTDB** (gratis, plan Spark):
   - Buka Firebase Console → project lu → Realtime Database.
   - Copy URL database-nya, tempel di `js/config.js`.
   - Tab **Rules** → tempel isi `database.rules.json` → Publish.
2. **Netlify** (gratis):
   - Netlify → Add new site → Import from GitHub → pilih repo ini. Build command kosongin, publish directory `.`.
   - Site configuration → Environment variables → tambah `GEMINI_API_KEY` (dari Google AI Studio). Opsional: `GEMINI_MODEL` (default `gemini-2.5-flash`).
   - Deploy. Tiap push ke GitHub otomatis deploy ulang.

> Drag-and-drop deploy di Netlify bisa juga, tapi fitur AI (Netlify Function) ga jalan. Game lain tetep jalan.

## Main

- Laptop host: buka `https://<site-lu>.netlify.app/?host=1` → **Bikin Room Baru** → klik **📱 QR Join**.
- HP peserta: scan QR / buka link → isi nama & avatar.
- Kalau laptop host ke-refresh, buka lagi `?host=1` → isi kode room di **Lanjutkan room lama**.

## Coba lokal tanpa Firebase

```
python3 -m http.server 8000
```
Buka `http://localhost:8000/?host=1&mock=1` di satu tab, terus `http://localhost:8000/?r=KODE&mock=1&as=1`, `...&as=2` di tab lain (mode mock nyimpen data di browser, cuma buat ngetes).

## Struktur

```
index.html          shell
css/style.css       semua styling
js/app.js           room, join, sinkronisasi, overlay, klasemen
js/db.js            Firebase RTDB + mock lokal
js/data.js          bank konten (ground truth + game baru)
js/games/*.js       1 file per game
netlify/functions/ai.mjs   proxy Gemini (API key aman di server)
database.rules.json        rules RTDB
```
