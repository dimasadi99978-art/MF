# Panduan keandalan — agar situs tetap bisa dipakai banyak orang dalam jangka panjang

Jujur di awal: **tidak ada situs yang bebas error atau menyala "selamanya"**. Yang bisa dilakukan adalah (1) memilih paket layanan yang memang boleh dan cocok untuk toko, (2) membuat situs tetap berguna saat sebagian sistem bermasalah, (3) selalu punya cadangan data, dan (4) tahu cepat bila ada yang rusak. Berikut yang sudah ada di kode dan yang perlu Anda lakukan.

## A. Keputusan yang harus Anda ambil (ini penyebab paling umum situs mati mendadak)

| Hal | Fakta (dicek Oktober 2026) | Yang disarankan |
|-----|----------------------------|-----------------|
| **Vercel Hobby (gratis)** | Hanya untuk penggunaan pribadi non-komersial; semua penggunaan komersial butuh Pro atau Enterprise (Vercel Fair Use Guidelines). Toko yang menerima pesanan tergolong komersial. | Pindah ke **Vercel Pro** (sekitar US$20 per pengguna per bulan; cek harga terbaru di vercel.com/pricing). Penegakan aturan tidak selalu konsisten, tetapi akun bisa dijeda kapan saja. |
| **Supabase Free** | Proyek dijeda otomatis setelah 1 minggu tanpa aktivitas dan harus dipulihkan manual; tidak ada cadangan harian. | Untuk toko aktif pilih **Supabase Pro** (sekitar US$25 per bulan; cadangan harian disimpan 7 hari, tidak ada penjedaan otomatis). Bila tetap di paket gratis, wajib pakai cadangan GitHub di bagian C. |
| **Domain** | Jika domain kedaluwarsa, situs tidak bisa dibuka walau server sehat. | Aktifkan perpanjangan otomatis, pasang email kontak yang aktif, catat tanggal jatuh tempo. |
| **Akun & kata sandi** | Hilangnya akses ke Vercel/Supabase/GitHub/domain = kehilangan situs. | Simpan di pengelola kata sandi, aktifkan 2FA, dan berikan akses pemulihan ke satu orang tepercaya. |

## B. Yang sudah dibuat di kode agar situs tahan gangguan

1. **Halaman order tidak mati total.** Harga dan area terakhir yang berhasil dimuat disimpan di browser (maks. 7 hari). Jika server sedang sulit dihubungi, pelanggan tetap melihat harga, area, dan ongkir, plus tombol **Pesan lewat WhatsApp**. Pesanan tetap divalidasi server saat dikirim; jika gagal, pelanggan diarahkan ke WhatsApp dengan data terisi.
2. **Halaman offline.** Bila HP pelanggan tanpa internet, muncul `offline.html` (tombol Coba lagi + WhatsApp), bukan layar error browser.
3. **Kode baru tidak merusak database lama.** `api/config.js` dan `api/admin-settings.js` otomatis memakai cara lama bila migrasi kolom baru belum dijalankan.
4. **Pemantauan.** `https://DOMAIN-ANDA/api/health?ping=1` menjawab `200` bila database sehat dan `503` bila tidak, tanpa detail apa pun. Pasang di UptimeRobot atau Better Stack (ada paket gratis), minta notifikasi ke email/WhatsApp Anda. Ini yang memberi tahu Anda lebih dulu daripada pelanggan.
5. **Pencadangan otomatis.** `.github/workflows/backup-harian.yml` mengekspor 6 tabel setiap hari (lihat C).
6. **Batas spam dan validasi di server** sudah ada (`rateLimit`, Turnstile opsional), sehingga lonjakan pengunjung atau bot tidak langsung menjatuhkan database.

## C. Cadangan data harian (GitHub Actions) — 10 menit

1. Pastikan repositori GitHub **privat** (hasil cadangan berisi nama, nomor HP, dan alamat pelanggan).
2. GitHub > repositori > Settings > Secrets and variables > Actions > New repository secret: `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY` (nilai yang sama dengan di Vercel).
3. Tab Actions > **Cadangan harian** > Run workflow untuk mencoba. Berhasil bila ada artefak `cadangan-margaluyu-…` berisi `orders.json`, `products.json`, dst.
4. Unduh satu cadangan setiap bulan dan simpan di Google Drive/hard disk pribadi. Artefak GitHub hanya disimpan 30 hari.
5. Skrip ini hanya **membaca** data. Pemulihan: Supabase > Table Editor > Insert > Import data, atau minta bantuan teknis dengan berkas JSON tersebut.
6. Efek samping yang berguna: permintaan harian ke database menjaga proyek tetap "aktif". Jangan jadikan ini satu-satunya pengaman di paket gratis; Pro tetap lebih aman.

## D. Kapasitas untuk banyak pengguna

- Halaman statis disajikan CDN Vercel dan tidak masalah untuk ribuan pengunjung. Bagian yang terbatas adalah database (Supabase). `/api/config` sudah di-cache CDN beberapa detik, dan cek promo dibatasi 30 kali per 10 menit per IP.
- Stok dan kode promo dikurangi **di dalam satu transaksi database**, sehingga dua pelanggan yang memesan bersamaan tidak bisa membuat stok minus.
- Tanda-tanda perlu naik paket: error 429/500 di Vercel > Logs saat ramai, penggunaan database mendekati batas, atau pesanan terlambat muncul di admin. Uji beban ringan sebelum promo besar (mis. siaran WhatsApp ke banyak pelanggan).

## E. Rutinitas bulanan (15 menit)

- [ ] Buka `/api/health` dan `/api/health?deep=1` (login admin): semua `ok`.
- [ ] Cek email pemantauan: ada downtime? Penyebabnya?
- [ ] Unduh satu cadangan terbaru dan pastikan berkas tidak kosong.
- [ ] Vercel > Deployments: catat deployment sehat terakhir (untuk Instant Rollback). Vercel > Logs: cari `API pesanan gagal`.
- [ ] Cek tanggal jatuh tempo domain, tagihan Vercel/Supabase, dan kuota email/WhatsApp.
- [ ] Perbarui kata sandi admin bila ada orang yang tidak lagi boleh mengakses.

## F. Rencana darurat (cetak dan simpan)

| Gejala | Tindakan |
|--------|----------|
| Situs tidak terbuka | Cek status.vercel.com dan domain. Bila baru deploy: Vercel > Deployments > deployment sehat sebelumnya > Instant Rollback. |
| Halaman terbuka, tetapi "Data harga belum dapat dimuat" | Buka `/api/health`. Bila Supabase dijeda: Supabase dashboard > Restore project. Bila kunci ditolak: periksa `SUPABASE_SERVICE_KEY` di Vercel, lalu Redeploy. |
| Pesanan gagal terus | Sementara terima pesanan lewat WhatsApp (tombol sudah muncul di halaman), catat manual, lalu masukkan ke admin setelah pulih. |
| Data hilang/salah | Pulihkan dari cadangan terbaru (bagian C). Jangan menghapus tabel. |

## G. Jalan keluar jangka panjang

Basis data Anda adalah Postgres biasa dan kode ada di GitHub, sehingga bisa dipindah ke penyedia lain tanpa terkunci. Syaratnya: domain atas nama Anda sendiri, repositori milik Anda, dan cadangan rutin. Itulah arti "bisa dipakai selamanya" yang realistis.
