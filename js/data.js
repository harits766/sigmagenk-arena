// Content banks. Ground truth from the Sigmagenk doc, plus new games' content.
export const AVATARS = ['🦁', '🐯', '🐼', '🐨', '🦊', '🐸', '🐵', '🦉', '🐧', '🐢', '🐙', '🦄', '🐝', '🐳', '🦅', '🐪', '🌙', '⭐', '🔥', '⚡', '🍉', '🥑', '☕', '🎯'];

export const GM_LINES = {
  welcome: [
    'Assalamualaikum gengs! Scan/ketik kode room di laptop host, pilih avatar, terus kita gas!',
    'Ahlan wa sahlan! Yang udah masuk, ramein pake tombol reaksi di bawah ya 🔥',
  ],
  menu: [
    'Oke, lanjut apa nih? Host lagi milih game, kalian siap-siap aja 😎',
    'Napas dulu, minum dulu. Bentar lagi ronde berikutnya!',
    'Skor kubu masih panas nih. Yang kalah jangan baper, yang menang jangan sombong 😌',
  ],
  indoorHeboh: 'Wkwk jujur kalau di dalem rumah/teras buat heboh-hebohan 15–20 orang kayaknya bakal sempit banget. Mau main yang tetap seru di tempat (Battle 2 Kubu), atau pada siap geser ke lapangan deket masjid?',
};

// ---------------- ⚡ Kuis Kilat ----------------
export const QUIZ = [
  { q: 'Surat pertama dalam susunan mushaf Al-Qur\'an?', o: ['Al-Baqarah', 'Al-Fatihah', 'An-Nas', 'Al-Alaq'], a: 1 },
  { q: 'Ayat Kursi ada di surat apa?', o: ['Ali Imran', 'Yasin', 'Al-Baqarah', 'Al-Kahfi'], a: 2 },
  { q: 'Surat yang TIDAK diawali basmalah?', o: ['At-Taubah', 'Al-Ikhlas', 'Al-Anfal', 'Al-Mulk'], a: 0 },
  { q: 'Masjid pertama yang dibangun Rasulullah ﷺ?', o: ['Masjid Nabawi', 'Masjid Quba', 'Masjidil Haram', 'Masjid Qiblatain'], a: 1 },
  { q: 'Perang besar pertama umat Islam?', o: ['Uhud', 'Khandaq', 'Badar', 'Tabuk'], a: 2 },
  { q: 'Sahabat yang dijuluki "Al-Faruq"?', o: ['Abu Bakar', 'Utsman bin Affan', 'Ali bin Abi Thalib', 'Umar bin Khattab'], a: 3 },
  { q: 'Nabi yang ditelan ikan besar?', o: ['Nabi Yunus', 'Nabi Nuh', 'Nabi Musa', 'Nabi Ayyub'], a: 0 },
  { q: 'Nabi yang bisa memahami bahasa semut?', o: ['Nabi Daud', 'Nabi Sulaiman', 'Nabi Isa', 'Nabi Ibrahim'], a: 1 },
  { q: 'Istri pertama Rasulullah ﷺ?', o: ['Aisyah', 'Hafshah', 'Khadijah', 'Saudah'], a: 2 },
  { q: 'Kiblat pertama umat Islam?', o: ['Ka\'bah', 'Masjidil Aqsa', 'Masjid Nabawi', 'Jabal Rahmah'], a: 1 },
  { q: 'Rukun Islam yang ke-4?', o: ['Zakat', 'Haji', 'Salat', 'Puasa Ramadan'], a: 3 },
  { q: 'Salat wajib yang jumlah rakaatnya 3?', o: ['Isya', 'Subuh', 'Maghrib', 'Ashar'], a: 2 },
  { q: 'Al-Qur\'an terdiri dari berapa juz?', o: ['30', '114', '40', '60'], a: 0 },
  { q: 'Tahun Hijriah dihitung mulai dari peristiwa apa?', o: ['Kelahiran Nabi', 'Hijrah ke Madinah', 'Fathu Makkah', 'Turunnya wahyu'], a: 1 },
  { q: 'Universitas tertua yang masih beroperasi (didirikan Fatimah al-Fihri) ada di negara?', o: ['Mesir', 'Turki', 'Maroko', 'Irak'], a: 2 },
  { q: 'Ilmuwan muslim yang dijuluki "Bapak Aljabar"?', o: ['Ibnu Sina', 'Al-Khawarizmi', 'Al-Biruni', 'Ibnu Khaldun'], a: 1 },
  { q: 'Di Barat, Ibnu Sina dikenal dengan nama?', o: ['Averroes', 'Avicenna', 'Alhazen', 'Rhazes'], a: 1 },
  { q: 'Negara dengan penduduk muslim terbanyak di dunia?', o: ['Pakistan', 'Arab Saudi', 'Indonesia', 'Mesir'], a: 2 },
  { q: 'Hewan yang punya 3 jantung?', o: ['Gurita', 'Paus biru', 'Unta', 'Bunglon'], a: 0 },
  { q: 'Ibu kota Australia?', o: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], a: 2 },
  { q: 'Planet terbesar di tata surya?', o: ['Saturnus', 'Jupiter', 'Neptunus', 'Bumi'], a: 1 },
  { q: 'Simbol kimia Fe itu unsur apa?', o: ['Fosfor', 'Fluor', 'Besi', 'Timah'], a: 2 },
  { q: 'IPK itu singkatan dari?', o: ['Indeks Prestasi Kumulatif', 'Indeks Penilaian Kuliah', 'Ijazah Prestasi Kampus', 'Indeks Poin Kelulusan'], a: 0 },
  { q: 'Penulis novel "Laskar Pelangi"?', o: ['Tere Liye', 'Habiburrahman El Shirazy', 'Andrea Hirata', 'Pramoedya A. Toer'], a: 2 },
  { q: 'Proklamasi 17 Agustus 1945 dibacakan di jalan?', o: ['Pegangsaan Timur 56', 'Merdeka Utara 1', 'Menteng Raya 31', 'Imam Bonjol 1'], a: 0 },
  { q: 'Gunung tertinggi di Indonesia?', o: ['Semeru', 'Kerinci', 'Rinjani', 'Puncak Jaya'], a: 3 },
  { q: 'Malam yang lebih baik dari seribu bulan dibahas di surat?', o: ['Al-Qadr', 'Al-Lail', 'Al-Fajr', 'Ad-Duha'], a: 0 },
  { q: 'Satu-satunya perempuan yang namanya disebut langsung di Al-Qur\'an?', o: ['Hawa', 'Asiyah', 'Maryam', 'Khadijah'], a: 2 },
  { q: 'Ayat terpanjang di Al-Qur\'an ada di Al-Baqarah ayat?', o: ['255', '282', '286', '183'], a: 1 },
  { q: 'Penemu World Wide Web (WWW)?', o: ['Bill Gates', 'Tim Berners-Lee', 'Steve Jobs', 'Alan Turing'], a: 1 },
  { q: 'Nama asli Abu Bakar Ash-Shiddiq?', o: ['Abdullah bin Utsman', 'Abdurrahman bin Auf', 'Abdul Muthalib', 'Abdullah bin Mas\'ud'], a: 0 },
  { q: 'Nabi yang namanya paling sering disebut di Al-Qur\'an?', o: ['Nabi Ibrahim', 'Nabi Muhammad', 'Nabi Isa', 'Nabi Musa'], a: 3 },
];

// ---------------- 🚫 Tabu Kilat ----------------
export const TABU = [
  { w: 'Skripsi', ban: ['Tugas akhir', 'Dosen', 'Revisi', 'Lulus'] },
  { w: 'Sahur', ban: ['Makan', 'Puasa', 'Subuh', 'Pagi'] },
  { w: 'Kosan', ban: ['Kamar', 'Sewa', 'Ibu kos', 'Tinggal'] },
  { w: 'Wisuda', ban: ['Toga', 'Lulus', 'Foto', 'Sarjana'] },
  { w: 'Kurma', ban: ['Buah', 'Manis', 'Buka puasa', 'Arab'] },
  { w: 'Adzan', ban: ['Salat', 'Masjid', 'Muadzin', 'Panggilan'] },
  { w: 'Dosen Pembimbing', ban: ['Skripsi', 'Bimbingan', 'Revisi', 'Guru'] },
  { w: 'Takjil', ban: ['Buka', 'Puasa', 'Gratis', 'Masjid'] },
  { w: 'Mabar', ban: ['Game', 'Main', 'Bareng', 'HP'] },
  { w: 'Kajian', ban: ['Ustadz', 'Ilmu', 'Masjid', 'Ngaji'] },
  { w: 'Sidang', ban: ['Penguji', 'Skripsi', 'Tegang', 'Presentasi'] },
  { w: 'Itikaf', ban: ['Masjid', 'Ramadan', 'Malam', 'Diam'] },
  { w: 'Overthinking', ban: ['Mikir', 'Galau', 'Tidur', 'Cemas'] },
  { w: 'Magang', ban: ['Kerja', 'Kantor', 'Praktik', 'Perusahaan'] },
  { w: 'Unta', ban: ['Hewan', 'Gurun', 'Arab', 'Punuk'] },
  { w: 'Tasbih', ban: ['Zikir', 'Butir', 'Hitung', 'Subhanallah'] },
  { w: 'Seblak', ban: ['Pedas', 'Kerupuk', 'Kencur', 'Makanan'] },
  { w: 'Absen', ban: ['Hadir', 'Tanda tangan', 'Kelas', 'Bolos'] },
  { w: 'Deadline', ban: ['Waktu', 'Tugas', 'Kumpul', 'Batas'] },
  { w: 'Wudhu', ban: ['Air', 'Salat', 'Cuci', 'Bersih'] },
  { w: 'Proposal', ban: ['Skripsi', 'Penelitian', 'Ajukan', 'Bab'] },
  { w: 'Ghibah', ban: ['Gosip', 'Ngomongin', 'Orang', 'Dosa'] },
  { w: 'Burnout', ban: ['Capek', 'Lelah', 'Stres', 'Kerja'] },
  { w: 'Sajadah', ban: ['Salat', 'Karpet', 'Alas', 'Sujud'] },
  { w: 'Ojol', ban: ['Ojek', 'Online', 'Motor', 'Aplikasi'] },
  { w: 'Kopi Susu', ban: ['Kafe', 'Gula aren', 'Minum', 'Es'] },
  { w: 'Zakat', ban: ['Fitrah', 'Harta', 'Bayar', 'Ramadan'] },
  { w: 'Revisi', ban: ['Ubah', 'Perbaiki', 'Dosen', 'Coret'] },
  { w: 'Lebaran', ban: ['Idul Fitri', 'Mudik', 'Ketupat', 'Maaf'] },
  { w: 'Kurban', ban: ['Sapi', 'Kambing', 'Idul Adha', 'Sembelih'] },
  { w: 'Ghosting', ban: ['Hilang', 'Chat', 'Balas', 'Menghilang'] },
  { w: 'Begadang', ban: ['Malam', 'Tidur', 'Melek', 'Kopi'] },
  { w: 'Grup WhatsApp', ban: ['Chat', 'Pesan', 'Admin', 'Hijau'] },
  { w: 'Hafalan', ban: ['Juz', 'Ingat', 'Murojaah', 'Quran'] },
  { w: 'Fresh Graduate', ban: ['Lulus', 'Kerja', 'Baru', 'Lamaran'] },
  { w: 'Nasi Padang', ban: ['Rendang', 'Minang', 'Bungkus', 'Rumah makan'] },
  { w: 'Tarawih', ban: ['Salat', 'Ramadan', 'Malam', 'Rakaat'] },
  { w: 'Presentasi', ban: ['PPT', 'Slide', 'Depan', 'Kelas'] },
  { w: 'Muhasabah', ban: ['Introspeksi', 'Diri', 'Renung', 'Evaluasi'] },
  { w: 'Kuota', ban: ['Internet', 'Data', 'Pulsa', 'Habis'] },
];

// ---------------- 🧠 Satu Frekuensi ----------------
export const HERD = [
  'Sebut 1 menu sahur paling aman',
  'Sebut 1 nama sahabat Nabi',
  'Aplikasi yang paling sering lu buka',
  'Alasan telat paling klasik',
  'Lauk warteg terbaik',
  'Surat pendek paling sering dibaca pas salat',
  'Minuman buat begadang',
  'Tempat nugas paling enak',
  'Kata yang paling sering diucapin dosen pembimbing',
  'Hewan yang paling lucu',
  'Hal pertama yang dicek pas bangun tidur',
  'Jajanan depan kampus terenak',
  'Kota impian buat kerja setelah lulus',
  'Takjil favorit',
  'Warna paling netral buat baju',
  'Emoji paling sering dipake',
  'Bumbu dapur yang wajib ada',
  'Nama nabi yang kisahnya paling lu inget',
  'Gaji pertama mau dipake buat apa (1 kata)',
  'Olahraga paling gampang dimulai',
  'Kalimat paling sering di grup WA kelas',
  'Buah paling enak',
  'Merek mi instan favorit',
  'Mata kuliah paling bikin pusing (umum)',
  'Kegiatan Ahad pagi paling ideal',
  'Satu kata buat ngegambarin tahun ini',
  'Benda yang selalu ada di tas',
  'Hal yang paling dikangenin dari rumah',
];

// ---------------- 🤥 Kibul (fakta asli vs karangan) ----------------
export const KIBUL = [
  { q: 'Jantung udang letaknya di bagian ___ .', a: 'kepala' },
  { q: 'Hewan nasional Skotlandia adalah ___ .', a: 'unicorn' },
  { q: 'Gurita punya ___ jantung.', a: '3', alt: ['tiga'] },
  { q: 'Negara dengan jumlah pulau terbanyak di dunia adalah ___ .', a: 'swedia', alt: ['sweden'] },
  { q: 'Hewan yang sidik jarinya mirip banget sama manusia adalah ___ .', a: 'koala' },
  { q: 'Secara botani, pisang termasuk kategori buah ___ .', a: 'beri', alt: ['berry', 'buah beri'] },
  { q: 'Universitas tertua di dunia yang masih jalan, Al-Qarawiyyin, didirikan oleh perempuan bernama ___ .', a: 'fatimah al fihri', alt: ['fatimah', 'fatima al fihri'] },
  { q: 'Satu-satunya sahabat Nabi yang namanya disebut langsung di Al-Qur\'an adalah ___ .', a: 'zaid bin haritsah', alt: ['zaid', 'zaid bin harithah'] },
  { q: 'Kopi awalnya populer di Yaman karena diminum para ___ biar kuat ibadah malam.', a: 'sufi', alt: ['kaum sufi', 'sufi sufi'] },
  { q: 'Madu yang disimpan dengan benar bisa tahan sampai ___ tanpa basi.', a: 'ribuan tahun', alt: ['ribuan', '3000 tahun'] },
  { q: 'Surat Al-Kautsar, surat terpendek di Al-Qur\'an, cuma terdiri dari ___ ayat.', a: '3', alt: ['tiga'] },
  { q: 'Bayi baru lahir punya sekitar ___ tulang (lebih banyak dari orang dewasa).', a: '300', alt: ['tiga ratus'] },
  { q: 'Menara Eiffel bisa bertambah tinggi sekitar ___ cm pas musim panas.', a: '15', alt: ['lima belas', '15 cm'] },
  { q: 'Ibnu Sina menulis ensiklopedia kedokteran legendaris berjudul ___ .', a: 'al qanun fi ath thibb', alt: ['al qanun', 'qanun', 'the canon of medicine'] },
  { q: 'Bahasa yang paling banyak penutur aslinya di dunia adalah bahasa ___ .', a: 'mandarin', alt: ['cina', 'china', 'tionghoa'] },
  { q: 'Lumba-lumba tidur dengan cara ___ .', a: 'setengah otak', alt: ['setengah otaknya', 'separuh otak', 'satu sisi otak'] },
  { q: 'Satu-satunya makanan yang hampir nggak pernah basi adalah ___ .', a: 'madu' },
  { q: 'Hewan darat tercepat di dunia adalah ___ .', a: 'cheetah' },
  { q: 'Warna asli wortel zaman dulu itu ___ (sebelum dibudidaya jadi oranye).', a: 'ungu', alt: ['ungu putih', 'ungu dan kuning'] },
  { q: 'Dalam setahun, kepiting merah di Pulau Christmas bermigrasi jumlahnya sekitar ___ ekor.', a: 'puluhan juta', alt: ['50 juta', 'jutaan'] },
];

// ---------------- 😂 Adu Receh ----------------
export const RECEH = [
  'Alasan paling ga masuk akal buat ga dateng kajian:',
  'Judul skripsi yang dijamin langsung ACC:',
  'Chat ke dosen pembimbing yang pasti langsung dibales:',
  'Hal yang JANGAN diucapin pas sidang skripsi:',
  'Nama grup WA kita 10 tahun lagi:',
  'Bio Instagram ustadz kekinian:',
  'Fitur baru yang harusnya ada di aplikasi ojol:',
  'Isi doa deadliner jam 2 pagi:',
  'Kalau kosan bisa ngomong, kalimat pertamanya:',
  'Menu takjil paling aneh yang pernah ada:',
  'Pesan ibu kos di grup yang bikin semua panik:',
  'Kata-kata motivasi paling ga memotivasi:',
  'Alasan telat yang bikin dosen malah kasihan:',
  'Hal yang diem-diem dilakuin pas kuliah online:',
  'Ide startup paling ga berguna:',
  'Nama warung kopi yang pasti rame mahasiswa:',
  'Jawaban paling aman kalau ditanya "kapan lulus?":',
  'Jawaban paling aman kalau ditanya "kapan nikah?":',
  'Slogan kampanye ketua BEM paling jujur:',
  'Hal yang bakal lu lakuin kalau jadi dosen sehari:',
  'Isi notifikasi yang paling bikin deg-degan:',
  'Barang paling ga guna yang dibeli pas diskon 11.11:',
  'Peraturan baru di masjid kampus yang bikin rame:',
  'Caption foto wisuda paling jujur:',
  'Tanda-tanda lu udah terlalu lama di kampus:',
];

// ---------------- 🕵️ Siapa Nih? (contoh pertanyaan) ----------------
export const SIAPA_PROMPTS = [
  'Tulis 1 fakta tentang lu yang belum pernah diceritain ke kita',
  'Pengalaman paling memalukan pas maba',
  'Cita-cita paling random waktu kecil',
  'Hal paling nekat yang pernah lu lakuin',
  'Kebiasaan aneh yang cuma lu yang tau',
];

// ---------------- 🕵️ Undercover ----------------
export const UNDERCOVER = [
  ['Masjid', 'Musala'], ['Sahur', 'Sarapan'], ['Skripsi', 'Tesis'], ['Umrah', 'Haji'], ['Dosen Pembimbing', 'Dosen Penguji'],
  ['Kosan', 'Asrama'], ['Sedekah', 'Zakat'], ['Kurma', 'Kismis'], ['Tarawih', 'Tahajud'], ['Sarung', 'Celana'],
  ['Kopi', 'Teh'], ['Seblak', 'Bakso'], ['Wisuda', 'Yudisium'], ['Ojol', 'Angkot'], ['Instagram', 'TikTok'],
  ['Hafalan', 'Murojaah'], ['Lebaran', 'Halal Bihalal'], ['Proposal', 'Laporan'], ['Kajian', 'Seminar'], ['Peci', 'Topi'],
  ['Magang', 'Kerja Part-time'], ['Takjil', 'Gorengan'], ['Mudik', 'Liburan'], ['Siwak', 'Sikat Gigi'], ['Nasi Uduk', 'Nasi Kuning'],
];

// ---------------- 🎚️ Gelombang Pikiran (spektrum) ----------------
export const SPECTRUM = [
  ['Hal Sepele', 'Bikin Overthinking Seminggu'], ['Dosa Kecil', 'Pahala Jariyah'], ['Makanan Sahur Buruk', 'Makanan Sahur Ideal'],
  ['Gampang Banget', 'Susah Banget'], ['Bukan Skill Penting', 'Skill Wajib Fresh Grad'], ['Overrated', 'Underrated'],
  ['Alasan Telat Lemah', 'Alasan Telat Kuat'], ['Nggak Islami', 'Islami Banget'], ['Membosankan', 'Seru Banget'],
  ['Murah', 'Mahal'], ['Bikin Ngantuk', 'Bikin Melek'], ['Gak Berguna', 'Berguna Banget'], ['Red Flag', 'Green Flag'],
  ['Kebiasaan Buruk', 'Kebiasaan Baik'], ['Cocok Buat Introvert', 'Cocok Buat Ekstrovert'], ['Santai', 'Bikin Panik'],
  ['Hidup Kosan Pemula', 'Hidup Kosan Sepuh'], ['Gak Pantes Dipamerin', 'Pantes Dipamerin'], ['Makanan Jelek', 'Makanan Enak'],
  ['Kurang Penting Buat Nikah', 'Penting Banget Buat Nikah'],
];

// ---------------- 👉 Si Paling ----------------
export const SIPALING = [
  'Si paling sering bilang "otw" padahal baru bangun?',
  'Si paling kelihatan tenang padahal skripsinya belum disentuh?',
  'Si paling cocok jadi menantu idaman ibu-ibu komplek?',
  'Si paling sering ngilang dari grup tapi muncul pas ada makanan?',
  'Si paling rajin ngingetin kebaikan tapi susah curhat soal dirinya?',
  'Si paling duluan nikah?',
  'Si paling bisa diandelin pas panik?',
  'Si paling jago ngeles kalau ditanya progres skripsi?',
  'Si paling sering ketiduran pas kajian?',
  'Si paling sukses 10 tahun lagi?',
  'Si paling bisa jadi ustadz/ustadzah viral?',
  'Si paling sering minjem charger?',
  'Si paling lama kalau bales chat?',
  'Si paling cocok jadi ketua RT?',
  'Si paling banyak foto di galeri HP?',
  'Si paling receh ketawanya?',
  'Si paling dewasa di sini?',
  'Si paling sering ngajak makan tapi ga pernah jadi?',
  'Si paling tahan begadang?',
  'Si paling bakal kangen kumpul-kumpul gini?',
];

// ---------------- 🐘 Gajah-Orang-Semut ----------------
export const GSO = {
  G: { e: '🐘', n: 'GAJAH', how: 'Kedua tangan jadi belalai ke depan' },
  O: { e: '🧍', n: 'ORANG', how: 'Berdiri tegak berkacak pinggang' },
  S: { e: '🐜', n: 'SEMUT', how: 'Jongkok dikit, acungin kelingking' },
};
export const GSO_BEATS = { G: 'O', O: 'S', S: 'G' }; // Gajah > Orang > Semut > Gajah

// ---------------- 📢 Kata Host (Host Berkata versi HP) ----------------
export const HB_CMDS = [
  { id: 'pagi', label: 'PAGI', e: '☀️', how: 'tap 1x' },
  { id: 'siang', label: 'SIANG', e: '🌤️', how: 'tap 2x' },
  { id: 'malam', label: 'MALAM', e: '🌙', how: 'tahan / jangan tap' },
  { id: 'hijrah', label: 'HIJRAH', e: '➡️', how: 'geser ke kanan' },
];

// ---------------- 🃏 Kartu Gerak (game fisik pendek) ----------------
export const CARDS = [
  { id: 'ular', e: '🐍', t: 'Ular Naga Rebutan Ekor', secs: 120, steps: ['2 tim baris, pegang bahu temen di depan (rantai ga boleh putus).', 'Kepala ular kejar ekor tim lawan, sambil jaga ekor sendiri.', 'Rantai putus = kalah ronde.'], field: true },
  { id: 'tawa', e: '😐', t: 'Duel Tahan Tawa', secs: 60, steps: ['1 wakil tiap kubu duduk berhadapan.', 'Kubu lawan bebas ngelucu dari pinggir (tanpa sentuhan).', 'Yang senyum keliatan gigi / ketawa duluan kalah.'] },
  { id: 'dor', e: '💥', t: 'Kelipatan DOR!', secs: 90, steps: ['Berdiri melingkar, hitung 1, 2, 3... gantian cepat.', 'Kelipatan 3 atau angka yang ada 3-nya: teriak "DOR!" + tepuk.', 'Salah = keluar. Level 2: sambil pegang hidung & telinga silang.'] },
  { id: 'charades', e: '🎭', t: 'Charades Kilat', secs: 60, steps: ['1 orang peragain frasa di HP-nya tanpa suara.', 'Kubunya nebak dalam 60 detik.', 'Ga boleh gerak bibir atau nunjuk benda.'], secret: ['Kisah Nabi Yunus di perut ikan', 'Mahasiswa revisi skripsi jam 2 pagi', 'Nabi Sulaiman ngobrol sama semut', 'Nunggu balesan dospem centang biru', 'Salat jamaah tapi saf depan kosong', 'Salah belajar bab pas UAS', 'Rebutan takjil di masjid', 'Nyari sinyal buat kuliah online', 'Ketiduran pas kajian subuh', 'Foto wisuda tapi kepanasan'] },
  { id: 'sambung', e: '🔗', t: 'Sambung Kata 3 Detik', secs: 90, steps: ['Wakil kubu gantian sebut kata yang nyambung.', 'Mikir lebih dari 3 detik atau ga nyambung = kalah.', 'Mulai dari kata di layar.'], prompt: ['Skripsi', 'Ramadan', 'Kosan', 'Masjid', 'Wisuda', 'Kopi', 'Dosen', 'Mudik'] },
];

// ---------------- 🎮 HP 6 Ronde ----------------
export const DILEMMAS = [
  ['Sidang besok tapi belum siap', 'Wisuda telat 1 semester tapi tenang'],
  ['Kerja gaji gede jauh dari ortu', 'Gaji biasa deket rumah'],
  ['Bisa baca pikiran orang', 'Bisa ngilang kapan aja'],
  ['Ga pake HP seminggu', 'Ga makan nasi seminggu'],
  ['Satu kelompok sama temen males', 'Ngerjain tugas kelompok sendirian'],
  ['Dibales dospem jam 2 pagi', 'Ga dibales seminggu'],
  ['Mudik naik motor 12 jam', 'Lebaran di kosan sendirian'],
  ['Kajian subuh tiap hari sebulan', 'Puasa Senin-Kamis sebulan full'],
  ['Selalu telat 10 menit', 'Selalu kecepetan 1 jam'],
  ['Kerja remote dari rumah', 'Kerja di kantor bareng temen'],
];

// ---------------- 📚 Bedah Buku ----------------
export const BOOK_Q = {
  self: { name: '🚀 Self-Development & Produktivitas', q: [
    'Dari semua teori di buku ini, konsep mana yang paling tabrakan sama kebiasaan kita sehari-hari?',
    'Kalau prinsip buku ini diterapkan tanpa nilai Islam, apa potensi jebakan atau toxic-nya?',
    'Bagian mana yang menurut lu klise atau susah banget dipraktikkan di realitas Indonesia?',
    'Satu kebiasaan kecil dari buku ini yang udah beneran lu coba, gimana hasilnya?',
    'Kalau cuma boleh kasih 1 gagasan dari buku ini ke temen yang burnout ngerjain skripsi, lu bakal ngomong apa?',
  ] },
  islam: { name: '🕌 Pemikiran Islam & Tazkiyatun Nafs', q: [
    'Perspektif baru tentang iman atau ibadah apa yang kebuka setelah baca buku ini?',
    'Gimana jelasin pesan utama buku ini ke temen seangkatan tanpa kedengeran menghakimi?',
    'Kalau penulis/tokohnya hidup sekarang sebagai mahasiswa tingkat akhir, masalah umat/kampus apa yang bakal dia kritik duluan?',
    'Ayat atau kisah sejarah apa di buku ini yang paling ngena sama fase hidup lu sekarang?',
    'Setelah baca buku ini, standar kesuksesan apa di kepala lu yang mulai berubah?',
  ] },
  fiksi: { name: '📚 Novel / Biografi Tokoh', q: [
    'Keputusan paling nekat atau paling manusiawi apa yang diambil tokoh utama, dan lu bakal ambil langkah yang sama?',
    'Konflik batin tokohnya yang ternyata mirip banget sama dilema anak muda sekarang?',
    'Kalau ending-nya lu tulis ulang dari sudut pandang tawakal dan ikhtiar, jadinya gimana?',
    'Karakter siapa yang paling mirip sama salah satu temen di sini, dan kenapa?',
    'Adegan mana yang paling pengen lu ubah, dan kenapa?',
  ] },
};
export const BOOK_GENERAL = [
  'Kalau buku/bacaan ini dirangkum jadi 1 kalimat, isinya apa?',
  'Ide mana di buku ini yang paling tabrakan sama kebiasaan kita sehari-hari?',
  'Bagian mana yang menurut lu klise, lebay, atau susah dipraktikkan di kehidupan nyata?',
  'Kalau dilihat dari kacamata nilai Islam, bagian mana yang sejalan dan mana yang perlu dikritisi?',
  'Satu hal dari buku ini yang mau lu praktikin minggu ini, dan gimana caranya?',
];
export const BOOK_DADAKAN = [
  { t: 'Atomic Habits (James Clear) × Istiqamah', sum: 'Perubahan kecil 1% tiap hari selaras sama amal yang paling dicintai Allah: kontinu meski sedikit (adwamuha wa in qalla).', q: 'Kenapa mahasiswa sering gagal jaga rutinitas ibadah atau skripsi pas ngandelin motivasi besar, bukan benerin sistem lingkungannya?' },
  { t: 'The Psychology of Money (Morgan Housel) × Qana\'ah & Berkah', sum: 'Beda "kaya" (keliatan) sama "makmur" (cukup dan tenang), dan konsep merasa cukup.', q: 'Pas temen seangkatan mulai pamer magang, gaji, pencapaian, gimana nentuin titik "cukup" versi diri sendiri?' },
  { t: 'Sirah Nabawiyah (Fase Makkah)', sum: 'Ketangguhan mental generasi awal Islam ngadepin ketidakpastian dan tekanan sosial sebelum fase Madinah.', q: 'Pelajaran manajemen stres dan solidaritas pertemanan apa dari fase Makkah yang paling relevan buat kita sekarang?' },
];
export const BOOK_CROSSFIRE = [
  'Apa kelemahan terbesar dari argumen penulis buku ini?',
  'Siapa yang menurut lu PALING butuh baca buku ini, dan kenapa?',
  'Kalau buku ini dijadiin 1 kebiasaan harian, bentuknya apa?',
  'Ada bagian yang lu ga setuju? Kenapa?',
  'Buku ini relevan ga buat yang udah kerja, bukan cuma mahasiswa?',
  'Kalau dibikin film, adegan pembukanya apa?',
];

// ---------------- 🌙 Life Update Next Level ----------------
export const LIFE = {
  1: { name: 'Level 1 • Warm-Up', q: [
    'Kalau kondisi mental, skripsi, dan iman lu minggu ini dirangkum jadi satu judul film atau satu cuaca, apa dan kenapa?',
    'Siapa orang di sini yang kesan pertamanya paling beda jauh sama sifat aslinya sekarang?',
    'Dua kebenaran satu kebohongan tentang bulan ini. Yang lain tebak mana yang bohong!',
    'Satu hal random yang bikin lu senyum minggu ini?',
  ] },
  2: { name: 'Level 2 • Inti (Canva)', q: [
    'Apa satu hal tentang diri lu yang sering disalahpahami orang pas baru kenal?',
    'Apa satu "zona nyaman" yang pengen banget lu dobrak tahun ini?',
    'Apa satu nasehat orang tua yang dulu lu anggap remeh tapi sekarang terbukti bener?',
    'Akhir-akhir ini, hal apa yang paling sering bikin lu overthinking pas mau tidur?',
    'Kalau bisa ngulang satu keputusan selama kuliah, apa yang mau lu ubah dan kenapa?',
    'Apa pencapaian kecil tahun ini yang jarang orang tau tapi lu syukuri banget?',
    'Kebiasaan buruk apa yang lagi lu usahain buat ditinggalin sebelum wisuda?',
    'Pernah ngerasa "kok gue jalan di tempat dibanding temen seangkatan"? Gimana berdamainya?',
    'Satu prinsip hidup atau ayat/hadis yang paling sering jadi pegangan pas lu lagi jatuh?',
    'Hal sederhana apa dari temen-temen di sini yang diem-diem sering ngebantu lu?',
    'Ekspektasi orang lain tentang lu yang diem-diem agak berat buat dipikul?',
    'Satu doa spesifik yang paling sering lu langitkan akhir-akhir ini?',
  ] },
};
