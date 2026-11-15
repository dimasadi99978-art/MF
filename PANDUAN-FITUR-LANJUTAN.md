# Panduan fitur lanjutan

Semua fitur di bawah sudah ada di kode. Yang bertanda **(opsional)** baru aktif setelah Anda mengisi kunci/akun tertentu; sebelum itu situs berjalan normal tanpanya.

## WAJIB sebelum deploy versi ini
**Jalankan ulang `supabase/schema.sql` di Supabase SQL Editor** (aman diulang, data tidak hilang). File ini menambah kolom jadwal kirim dan riwayat status. Tanpa ini, pesanan dan perubahan status akan error.
Lalu jalankan ulang `supabase/test.sql` (harus tanpa error merah).

## Sudah aktif otomatis
- **Tanggal pengiriman dan catatan**: pelanggan dapat memilih tanggal (opsional) sampai 7 hari ke depan. Tidak ada pilihan jam; pelanggan dapat menulis permintaan waktu pada kolom catatan, dan permintaan tersebut bukan jaminan jadwal.
- **Jam tiap tahap status**: tiap kali admin mengubah status pengiriman/pembayaran, jamnya dicatat dan tampil di bawah tahap di Order Tracking. Pesanan lama (sebelum fitur ini) tidak punya jam.
- **Daftar pelanggan**: Admin > Pengaturan > tab Pelanggan (jumlah pesanan, total belanja, tombol WhatsApp).
- **Nama file dirapikan**: `order-sekarang.html`, `kandungan-manfaat.html`, `media-library.html`, `pengenalan-kambing-saanen.html`, `pengenalan-susu-saanen.html`. Alamat lama dialihkan otomatis (301) lewat `vercel.json`. **Setelah deploy, uji sendiri**: buka `https://domain-anda/order%20sekarang.html`, harus pindah ke `/order-sekarang.html`. Bila malah 404, kabari saya.
- **PWA**: situs bisa dipasang di HP (menu browser > "Tambahkan ke layar utama"). Sengaja tanpa cache offline agar stok/harga selalu terbaru.
- CSS `css/order.css` (tidak dipakai di halaman mana pun) dihapus. File CSS lain tetap karena dipakai; menyatukannya perlu uji tampilan satu per satu.
- Gambar asli beresolusi besar yang tidak dipakai kode dipindah ke folder `_arsip-asli/` (tidak ikut di-deploy lewat `.vercelignore`).

## (opsional) 2FA login admin
Menambah kode 6 digit dari aplikasi di samping kata sandi.
1. Di komputer (Node 18+): `node scripts/buat-2fa.mjs` → muncul kunci.
2. Isi kunci itu di Vercel sebagai `ADMIN_TOTP_SECRET`, Redeploy.
3. Di HP, buka Google Authenticator/Authy → tambah akun → "Masukkan kunci setelan" → isi kunci (berbasis waktu).
4. Mulai sekarang, login admin wajib mengisi kolom "Kode 2FA". **Simpan kuncinya di tempat aman**; bila hilang, hapus variabel `ADMIN_TOTP_SECRET` di Vercel untuk menonaktifkan.
Catatan: ini 2FA untuk satu kata sandi admin bersama, bukan akun email per orang.

## (opsional) CAPTCHA Cloudflare Turnstile
1. Daftar gratis di dash.cloudflare.com → Turnstile → Add site (isi domain Anda, mode Managed).
2. Anda mendapat **Site key** (publik) dan **Secret key** (rahasia).
3. Site key: tempel di `turnstile-config.js` (`window.MF_TURNSTILE_SITEKEY = '...'`), upload ke GitHub.
4. Secret key: isi di Vercel sebagai `TURNSTILE_SECRET_KEY`, Redeploy.
5. Kotak verifikasi muncul di form pesanan dan form ulasan. **Kedua langkah (3 dan 4) harus dilakukan**; bila hanya salah satu, form akan menolak kiriman.

## (opsional) Pelacak pengunjung
Edit `analytics-config.js`, isi SATU saja:
- Plausible: `plausibleDomain: 'domain-anda'` (daftar dulu di plausible.io).
- Google Analytics: `gaId: 'G-XXXXXXXXXX'`.
Tidak dimuat di halaman admin. Pengunjung mungkin perlu diberi tahu di Kebijakan Privasi bila Anda mengaktifkannya.

## (opsional) WhatsApp otomatis ke pelanggan
Daftar di fonnte.com, sambungkan nomor WA toko, isi `FONNTE_TOKEN` di Vercel. Pesan terkirim otomatis saat pesanan masuk dan saat admin mengubah status. Belum diuji dengan akun sungguhan. Tanpa ini, tombol WhatsApp siap kirim di Admin Pesanan tetap berfungsi.

## Belum dikerjakan (sengaja)
- **Pembayaran otomatis Midtrans/Xendit**: butuh akun merchant, kunci server, dan alamat webhook yang diuji dengan transaksi sungguhan. Salah pasang bisa membuat pesanan tercatat lunas padahal belum bayar, jadi sebaiknya dikerjakan bersama saat akunnya sudah ada. Sementara itu verifikasi QRIS manual lewat status "Menunggu verifikasi / Lunas / Ditolak".
- **Akun admin per orang dengan email**: butuh keputusan memakai Supabase Auth. Saat ini ada satu kata sandi admin + 2FA opsional.
- **Menyatukan file CSS** yang tumpang tindih: harus diuji visual per halaman.


## Promo pembelian berulang (aturan terbaru)
- Pembelian 3–5 botol: diskon 5%, maksimal Rp10.000.
- Pembelian 6 botol atau lebih: diskon 10%, maksimal Rp20.000.
- Diskon berlaku pada subtotal produk, tidak termasuk ongkir, dan tidak dapat digabung dengan kode voucher lain. Kode voucher yang dimasukkan pelanggan menggantikan diskon kuantitas.
- Untuk menjaga margin, evaluasi biaya produksi, kemasan, dan pengiriman sebelum mengubah persentase.
- Voucher apresiasi rating belum otomatis diterbitkan oleh kode saat ini. Jangan menjanjikan voucher otomatis dari rating sebelum fitur verifikasi pesanan dan penerbitan voucher unik selesai diuji.
