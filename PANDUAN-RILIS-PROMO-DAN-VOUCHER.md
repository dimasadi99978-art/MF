# Panduan rilis Margaluyu Farm: promo, voucher, dan deployment

## Aturan pelanggan
- 3–5 botol: diskon 5%, maksimal Rp10.000.
- 6 botol atau lebih: diskon 10%, maksimal Rp20.000.
- Diskon hanya dari subtotal produk, tidak termasuk ongkir. Promo kuantitas tidak ditumpuk dengan voucher.
- Setelah pesanan berstatus **Selesai**, pelanggan dapat mengirim ulasan jujur dengan rating berapa pun. Jika memasukkan nomor pesanan dan nomor WhatsApp yang cocok, sistem menerbitkan voucher unik Rp5.000 untuk pembelian berikutnya minimal Rp50.000, berlaku 45 hari, sekali pakai.
- Voucher ulasan tidak berlaku jika pesanan belum selesai, nomor tidak cocok, voucher kedaluwarsa, atau voucher sudah digunakan. Admin dapat melihat status voucher di **Pengaturan > Voucher Rating**.

## Sebelum deploy
1. Cadangkan database/data lama terlebih dahulu.
2. Di Supabase > SQL Editor, jalankan seluruh `supabase/schema.sql` versi paket ini. Ini menambahkan tabel voucher dan memperbarui fungsi harga/pesanan.
3. Jalankan `supabase/test.sql`. Pastikan tab Messages menampilkan `SEMUA PENGUJIAN LULUS` tanpa error. Skrip diakhiri ROLLBACK sehingga data uji dibatalkan.
4. Upload **isi folder `site`** ke root repositori GitHub (file `index.html` harus langsung berada di root, jangan upload ZIP sebagai file website).
5. Tunggu deployment Vercel selesai.

## Environment Variables di Vercel
Atur pada Project > Settings > Environment Variables untuk Production, lalu Redeploy.

Wajib:
- `SUPABASE_URL` = URL proyek Supabase tanpa garis miring di akhir.
- `SUPABASE_SERVICE_KEY` = secret/service-role key Supabase; hanya server-side, jangan commit ke GitHub atau kirim di chat.
- `ORDERS_ADMIN_KEY` = kata sandi admin panjang dan unik (minimal 16 karakter).

Untuk notifikasi email:
- `RESEND_API_KEY` = API key dari Resend.
- `NOTIFY_EMAIL` = email admin penerima notifikasi.
- `RESEND_FROM` = opsional; gunakan hanya alamat/domain yang sudah diverifikasi Resend.
- `SITE_URL` = opsional, misalnya `https://susukambingsaanensegar354.vercel.app`.

Opsional:
- `FONNTE_TOKEN` untuk WhatsApp otomatis. Tanpa token, tombol WhatsApp di admin tetap dapat membuka chat secara manual.
- `TURNSTILE_SECRET_KEY` hanya jika CAPTCHA Turnstile diaktifkan.
- `ADMIN_TOTP_SECRET` hanya jika 2FA admin sudah disiapkan.

Jangan membuat variabel dengan nilai contoh. Jangan membagikan secret key.

## Setelah deploy: uji penerimaan
1. Buka `/api/health`; status database harus `ok`.
2. Buka `/admin-pengaturan.html`, login, cek harga/stok/area, dan buka tab Voucher Rating.
3. Buat pesanan uji COD, pastikan pesanan masuk ke Admin Pesanan dan email diterima jika Resend sudah diatur. Periksa tombol WhatsApp.
4. Uji diskon untuk 1, 3, 5, dan 6 botol. Pastikan diskon dan total sesuai serta stok berkurang benar.
5. Tandai pesanan uji menjadi **Selesai**. Buka halaman Rating, isi nomor pesanan dan nomor WhatsApp yang sama, lalu kirim ulasan. Catat kode voucher yang muncul.
6. Buat pesanan kedua minimal Rp50.000 menggunakan voucher dengan nomor WhatsApp yang sama. Pastikan diskon Rp5.000 berlaku. Coba gunakan lagi voucher tersebut; sistem harus menolak.
7. Uji juga nomor WhatsApp salah dan pesanan yang belum selesai; jangan sampai voucher terbit.
8. Setelah tes, hapus pesanan uji melalui admin hanya jika statusnya Selesai. Jangan hapus atau mengubah pesanan pelanggan asli.

## Status verifikasi
Pemeriksaan sintaks JavaScript dan format JSON dilakukan lokal. Saya tidak dapat mengakses dashboard Supabase/Vercel milik Anda untuk menjalankan SQL atau mengirim email/WhatsApp nyata. Karena itu, status produksi baru boleh dinyatakan siap setelah langkah SQL dan uji penerimaan di atas lulus.
