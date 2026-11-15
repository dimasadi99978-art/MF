# Status Paket Rilis Margaluyu Farm — QRIS Statis Manual

Tanggal: 21 Oktober 2026

## Sudah diperiksa pada paket lokal
- Arsip ZIP dapat dibuka dan lulus pemeriksaan integritas.
- Sintaks berkas JavaScript/MJS di `api`, `lib`, dan `scripts` lulus `node --check`.
- Checkout menampilkan panel QRIS statis dan total akhir; kode checkout menyatakan tidak memanggil Midtrans QRIS dinamis.
- Endpoint `api/midtrans-qris.js` dan `api/midtrans-notification.js` tidak disertakan dalam paket rilis ini.
- Panduan pembayaran diperbarui agar sesuai dengan QRIS statis dan verifikasi manual.

## Wajib diperiksa sebelum dipakai menerima pesanan sungguhan
- Pastikan `qris.jpg` adalah QRIS resmi milik Margaluyu Farm, masih aktif, dan dapat dipindai.
- Pastikan environment variables Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ORDERS_ADMIN_KEY`) sesuai dengan proyek yang benar. Atur `RESEND_API_KEY` dan `NOTIFY_EMAIL` hanya jika email notifikasi akan digunakan.
- Buka `/api/health` setelah deploy; pastikan koneksi database sehat.
- Uji pesanan COD dan QRIS di Preview, termasuk total, ongkir, promo/voucher, tampilan admin, dan pelacakan.
- Untuk QRIS, lakukan pembayaran nyata hanya jika pemilik memang ingin menguji transaksi dan bisa memeriksa transaksi masuk dari aplikasi penyedia QRIS.
- Verifikasi transaksi dari riwayat transaksi penyedia QRIS, bukan hanya screenshot pelanggan, sebelum mengubah status menjadi `Lunas`.

## Batas verifikasi
Pemeriksaan lokal tidak membuktikan bahwa database Supabase aktif, environment variables Vercel, email, dan transaksi pembayaran nyata telah berhasil. Karena itu paket ini siap diunggah untuk deployment Preview dan pengujian akhir, tetapi belum dapat dinyatakan teruji penuh di produksi sebelum langkah di atas lulus.
