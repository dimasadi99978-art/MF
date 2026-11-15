# Progres Website Margaluyu Farm (diperbarui 20 Okt 2026)

Domain: https://susukambingsaanensegar354.vercel.app
File yang dipakai: **500-supabase.zip** terbaru (bukan 500.zip lama). Panduan lengkap di dalam zip:
PANDUAN-SUPABASE.md dan PANDUAN-FITUR-LANJUTAN.md.

## A. Sudah selesai
- [x] Semua kode fitur selesai: keamanan, stok, ongkir, promo, moderasi testimoni, status pembayaran, FAQ, SEO (domain sudah terisi),
      Supabase, tanggal & jam kirim, jam tiap status, daftar pelanggan, 2FA admin (opsional), CAPTCHA (opsional),
      analitik (opsional), PWA, nama file dirapikan + redirect, CSS tak terpakai dihapus.
- [x] Supabase dibuat (saanen-store), schema.sql + test.sql versi LAMA sudah sukses.
- [x] URL dan kunci rahasia Supabase sudah didapat.
- [x] Kode diuji dengan database tiruan (lulus). Belum diuji di browser/Supabase asli untuk fitur baru.

## B. Langkah Anda (berurutan)
1. [ ] **Supabase > SQL Editor: jalankan ULANG `supabase/schema.sql` versi terbaru** (aman, data tidak hilang),
       lalu jalankan ulang `supabase/test.sql` (tidak boleh ada error merah).
2. [ ] **Vercel > Settings > Environment Variables**, isi 3 variabel lalu Save:
       `SUPABASE_URL` = https://fdjfoiikwdmqmutjsuag.supabase.co (tanpa garis miring akhir)
       `SUPABASE_SERVICE_KEY` = kunci sb_secret_... (JANGAN ditulis di sini / dikirim ke siapa pun)
       `ORDERS_ADMIN_KEY` = kata sandi admin baru, minimal 16 karakter, bukan 354005
3. [ ] Ekstrak zip terbaru. Upload ke GitHub (Add file > Upload files) per kelompok agar tidak melewati batas ~100 file:
       a) semua file di halaman utama + folder `api`, `lib`, `scripts`, `supabase`, `icons`
       b) folder `css` dan `img` (WAJIB; tanpa ini tampilan rusak)
       c) folder `vendor` dan `_arsip-asli`
       Pastikan semua folder berada di halaman utama repository, sejajar dengan index.html.
4. [ ] **Hapus file lama di GitHub** (buka file > ikon tong sampah > Commit):
       setup-testimoni.html, cek-koneksi.html, cek-pesanan-server.html, api/notify-testimoni.js, lib/bin.js,
       css/order.css,
       "order sekarang.html", "kandungan & manfaat.html", "media library.html",
       "Pengenalan Kambing Saanen.html", "Pengenalan susu saanen.html",
       dan enam gambar lama di halaman utama: Banner Home.png, FLYER NEW.jpg, FOTO PRODUK SUSU.jpg,
       Logo MF.jpg, flyer.jpg, proses pengemasan susu.jpeg  (salinannya sudah ada di folder _arsip-asli)
5. [ ] Tunggu Vercel Ready. Buka `/api/health` : `database.status` harus `ok`.
6. [ ] Uji alamat lama: buka `/order%20sekarang.html` harus pindah ke `/order-sekarang.html`.
7. [ ] Buka `/admin-pengaturan.html`: atur produk & stok, area & ongkir (awal hanya Surabaya Timur), kode promo.
8. [ ] Coba 1 pesanan lengkap dengan data wajar (nama asli, HP 08xxxxxxxxxx, alamat lengkap, pilih area), metode COD.
       Cek email, Admin Pesanan, ubah status, lalu Order Tracking (jam tiap tahap tampil).
9. [ ] Kirim 1 ulasan di halaman Rating (tidak langsung tampil; setujui di Admin > Pengaturan > Moderasi).
10. [ ] Pindahkan data lama JSONBin ke Supabase (scripts/migrate-jsonbin-to-supabase.mjs; testimoni cukup SEKALI).
11. [ ] **Revoke kunci JSONBin lama** di jsonbin.io, hapus variabel lama di Vercel
        (ORDERS_MASTER_KEY, ORDERS_BIN_ID, TESTIMONI_MASTER_KEY, TESTIMONI_BIN_ID).
12. [ ] (Opsional) uji otomatis: node scripts/smoke-test.mjs https://susukambingsaanensegar354.vercel.app KATA_SANDI_ADMIN

Bila rusak setelah deploy: Vercel > Deployments > pilih deploy lama > Promote/Rollback.

## C. Fitur opsional (aktif bila Anda mengisi akun/kunci; cara di PANDUAN-FITUR-LANJUTAN.md)
- [ ] 2FA admin: node scripts/buat-2fa.mjs, isi ADMIN_TOTP_SECRET
- [ ] CAPTCHA: akun Cloudflare Turnstile (site key di turnstile-config.js + TURNSTILE_SECRET_KEY di Vercel)
- [ ] Analitik: isi analytics-config.js (Plausible atau Google Analytics)
- [ ] WhatsApp otomatis: akun Fonnte, FONNTE_TOKEN
- [ ] Sesuaikan jam kirim di lib/jadwal.js (contoh: pagi/siang/sore) dan teks kebijakan pengembalian di faq.html

## D. Belum dikerjakan (sengaja)
- Aktivasi pembayaran otomatis Midtrans (kode disiapkan; butuh akun merchant + uji transaksi nyata)
- Akun admin per orang dengan email (butuh keputusan Supabase Auth)
- Menyatukan CSS yang tumpang tindih (perlu uji visual per halaman)

## E. Belum teruji sungguhan
Tampilan di browser untuk fitur baru, pengalihan nama file lama di Vercel, WhatsApp Fonnte, CAPTCHA, dan 2FA dengan aplikasi asli.
(Logika 2FA sudah dicocokkan dengan vektor uji standar RFC 6238.)

## F. Melanjutkan di percakapan baru
Tempel ke Claude (lampirkan file ini dan 500-supabase.zip):
> Saya melanjutkan perbaikan website Margaluyu Farm (susukambingsaanensegar354.vercel.app). Saya sedang di langkah B nomor __ pada catatan terlampir. Mohon bimbing saya sebagai orang awam langkah demi langkah. Jangan minta saya mengirim kunci rahasia.

> **CATATAN 22 Okt 2026 — BAGIAN G DI BAWAH SUDAH TIDAK BERLAKU.** Sistem pembayaran saat ini adalah COD + QRIS statis manual.
> Endpoint `/api/midtrans-*` tidak ada di paket ini, `PANDUAN-MIDTRANS.md` tidak ada, dan Midtrans tidak boleh diaktifkan kembali
> tanpa persetujuan pemilik. Abaikan langkah aktivasi Midtrans di bagian ini. Lihat PANDUAN-PEMBAYARAN-QRIS-STATIS.md.

## G. (USANG) Integrasi QRIS dinamis Midtrans — revisi 20 Okt 2026
- [x] Endpoint server `/api/midtrans-qris.js` disiapkan untuk membuat QRIS dari total pesanan tersimpan di Supabase.
- [x] Webhook `/api/midtrans-notification.js` disiapkan untuk memeriksa signature dan nominal sebelum mengubah status pembayaran.
- [x] Halaman pemesanan diperbarui agar tidak memakai QRIS statis dan tidak meminta unggah bukti pembayaran manual.
- [x] QRIS dinamis ditampilkan setelah pesanan dibuat; halaman memantau status pembayaran secara berkala.
- [x] Panduan aktivasi ada di `PANDUAN-MIDTRANS.md`.

**Belum aktif/teruji transaksi nyata:**
1. Di Vercel, tambahkan `MIDTRANS_SERVER_KEY` (hanya Server Key; jangan pernah dimasukkan ke file publik).
2. Tambahkan `MIDTRANS_IS_PRODUCTION=false` untuk uji Sandbox.
3. Tambahkan `PUBLIC_SITE_URL=https://susukambingsaanensegar354.vercel.app`.
4. Atur Payment Notification URL Midtrans ke `https://susukambingsaanensegar354.vercel.app/api/midtrans-notification`.
5. Redeploy dan uji transaksi Sandbox sampai status menjadi **Lunas**.
6. Setelah merchant disetujui dan Sandbox lulus, baru gunakan Server Key Production dan ubah `MIDTRANS_IS_PRODUCTION=true`.

Integrasi kode telah disiapkan, tetapi belum boleh dianggap aktif sampai Environment Variables diatur dan pengujian Sandbox berhasil. Biaya transaksi mengikuti tarif merchant Midtrans yang berlaku.

## Catatan revisi lanjutan (21 Oktober 2026)
- Memperbaiki jalur pembaruan status pembayaran Midtrans agar menggunakan RPC database atomik `apply_midtrans_payment_status` dari webhook dan pemeriksaan status QRIS.
- Tambah `supabase/migration_midtrans_atomic.sql`; migrasi ini WAJIB diterapkan sebelum kode baru dijalankan pada lingkungan Supabase.
- Pemeriksaan sintaks JavaScript seluruh berkas non-vendor lulus setelah revisi.
- Belum ada klaim bahwa migrasi aktif, transaksi Sandbox, atau deployment sudah dilakukan.

## Pemeriksaan lanjutan (belum diterapkan ke produksi)
- Ditambahkan migrasi `supabase/migration_shipping_confirmation.sql` untuk konfirmasi ongkir luar Surabaya secara atomik.
- API QRIS sekarang memeriksa `shipping_confirmation_required` sebelum membuat transaksi.
- API admin menerima aksi `konfirmasiOngkir` dan `biayaOngkir`; status lanjutan diblokir jika ongkir belum dikonfirmasi.
- Migrasi wajib dijalankan di Supabase sebelum kode ini dipublikasikan. Setelah itu, uji pesanan Surabaya, pesanan luar Surabaya, perubahan total, serta QRIS Sandbox.


## Pembaruan voucher ulasan otomatis (21 Oktober 2026)
- Voucher Rp5.000 diterbitkan segera setelah ulasan tersimpan, hanya jika pesanan berstatus `Selesai` dan nomor WhatsApp cocok. Tidak menunggu moderasi admin.
- Moderasi admin tetap menentukan apakah ulasan tampil publik; tidak memengaruhi voucher.
- Database mengunci pesanan saat penerbitan dan `customer_vouchers.order_id` unik, sehingga permintaan berulang mengembalikan voucher yang sama, bukan membuat voucher baru.
- Jika integrasi Fonnte aktif, sistem mencoba mengirim voucher lewat WhatsApp; kegagalan pesan tidak membatalkan voucher.
- Untuk database aktif yang sudah terpasang, jalankan `supabase/migration_review_voucher_approval.sql`. Jalankan `supabase/test.sql` setelahnya untuk memverifikasi di lingkungan database.
- Migrasi dan tes belum dijalankan pada proyek Supabase aktif dari sesi ini.


## Pembaruan keputusan pembayaran — QRIS statis
- Checkout `order-sekarang.html` telah diubah agar menampilkan `qris.jpg` milik Margaluyu Farm dan total akhir pesanan; alur pembuatan QRIS Midtrans tidak lagi dipanggil.
- Endpoint admin `api/orders.js` mengizinkan admin terautentikasi menandai QRIS statis sebagai `Lunas`, `Ditolak`, atau `Menunggu verifikasi`. Status `Lunas` hanya boleh dipilih setelah transaksi masuk benar-benar diperiksa.
- Panduan baru: `PANDUAN-PEMBAYARAN-QRIS-STATIS.md`.
- Pengujian sintaks lokal: 44 file JS/MJS lulus `node --check`.
- Belum diuji pada Supabase/Vercel aktif dan belum deploy. Perlu memeriksa bahwa halaman admin menyediakan pilihan status pembayaran QRIS yang sesuai; jika UI admin masih mengunci status, perlu penyesuaian tambahan.
