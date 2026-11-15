# Perbaikan Struk dan Pelacakan — 4 November 2026

## Perubahan
- Halaman `struk-pesanan.html` sekarang menampilkan nota digital ringkas bergaya kertas kasir 72 mm, terpisah dari halaman order.
- Struk web memuat nomor pesanan, tanggal, nama pelanggan, produk, jumlah, subtotal, ongkir, diskon (jika ada), total, metode/status pembayaran, status pesanan, dan jadwal kirim (jika ada).
- Nomor HP dan alamat lengkap tidak dicetak pada struk ringkas.
- Tombol unduh menghasilkan gambar JPG, bukan PDF/DOC.
- `receipt-image.js` menggambar JPG dengan format thermal receipt ringkas dan digunakan juga oleh halaman Order Tracking.
- Ringkasan di halaman Order Tracking tidak lagi menampilkan nomor HP/alamat lengkap; rincian subtotal ditampilkan agar total lebih jelas.
- Koneksi database menerima nama environment variable `SUPABASE_SERVICE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, atau `SUPABASE_SECRET_KEY`.

## Pengujian
- `npm test`: 60/60 lulus.
- Pemeriksaan sintaks JavaScript untuk file API, store, pelacakan, renderer JPG, dan script inline struk: lulus.
- Belum dilakukan transaksi langsung pada Supabase/Vercel produksi. Setelah deploy, lakukan satu pesanan COD percobaan dan pastikan pesanan muncul di Admin serta Order Tracking.

## Environment Variables
Di Vercel, pastikan `SUPABASE_URL` dan salah satu dari `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` terisi dengan kredensial yang benar. Setelah mengubah Environment Variables, lakukan Redeploy.
