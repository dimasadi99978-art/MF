# Perbaikan Order Tracking, Order, dan Struk (5 November 2026)

## Temuan utama: pesanan "tidak terdeteksi" karena belum tersimpan di server
Nomor pesanan asli dibuat server berformat `MF-YYMMDD-XXXXXX` (6 huruf/angka acak, contoh `MF-261105-AB7K3Q`).
Nomor berformat `MF-YYMMDD-1234` (4 angka) adalah nomor cadangan yang dibuat browser saat server gagal menyimpan.
Jika struk menampilkan nomor 4 angka, pesanan tersebut tidak pernah masuk database, jadi pasti tidak bisa dilacak.

## Yang diperbaiki di kode
- order-sekarang.html: struk hanya dibuka bila server benar-benar menyimpan; selain itu tampil pesan galat dengan penyebab.
- struk-pesanan.html: pesanan yang tidak tersimpan di server tidak lagi tampil "berhasil"; pelanggan diarahkan kirim lewat WhatsApp.
- lacak-pesanan.js: pesan galat sekarang membedakan (a) perangkat tidak terhubung, (b) database mati, (c) server aktif tapi gagal memproses, (d) pesanan memang tidak ada.
- Tampilan order kembali ke gaya awal, dirapikan, dengan lebih sedikit kotak (css/order-tidy.css).

## Yang harus Anda cek di Vercel (penyebab server gagal menyimpan)
1. Pastikan SELURUH isi folder ini di-deploy ulang (bukan sebagian file), lalu Redeploy.
2. Buka `https://DOMAIN-ANDA/api/health` dan lihat `database.status`, `env`, dan `saran`.
3. Isi/benahi Environment Variables: SUPABASE_URL, SUPABASE_SERVICE_KEY (Production), lalu Redeploy.
4. Jalankan supabase/schema.sql dan migrasi sesuai supabase/URUTAN-MIGRASI.md di SQL Editor Supabase.
5. Jika Turnstile/CAPTCHA aktif, pastikan kunci site dan secret benar.
6. Buat satu pesanan uji: nomor di struk harus berformat 6 karakter, lalu cek tabel `orders` di Supabase dan coba Order Tracking.

## Tambahan (sesi lanjutan)
- Nomor pesanan 4 angka (`MF-YYMMDD-1234`) menandakan API di Vercel masih VERSI LAMA (API terbaru membuat nomor 6 karakter). Pastikan folder `api/`, `lib/`, dan `package.json` ikut di-upload dan di-deploy, bukan hanya file HTML/JS.
- Respons API terbaru membawa header `X-MF-Api: orders-v3`. Bila Order Tracking gagal dan header ini tidak ada, halaman menampilkan pesan "server belum diperbarui".
- Struk hanya menampilkan "Pesanan belum tersimpan" bila halaman order menandainya secara eksplisit (`serverSaved:false`).
- Halaman Ulasan/Rating/Kritik & Saran didesain ulang dengan bahasa visual yang sama dengan halaman order (css/rating-tidy.css).
