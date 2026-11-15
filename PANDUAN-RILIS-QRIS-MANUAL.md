# Rilis QRIS Manual — Margaluyu Farm

Paket ini menggunakan QRIS statis dan verifikasi pembayaran manual; bukan QRIS dinamis Midtrans.

## Sebelum deploy
1. Pastikan `qris.jpg` adalah QRIS resmi milik merchant yang aktif.
2. Uji checkout dengan pesanan percobaan dan pastikan total tagihan tampil benar.
3. Setelah pelanggan membayar, admin harus mencocokkan transaksi dengan mutasi/riwayat pembayaran sebelum mengubah status menjadi lunas.
4. Jangan menandai pembayaran lunas hanya berdasarkan gambar bukti yang diunggah.
5. Jangan menambahkan Server Key Midtrans ke frontend. Paket ini tidak memerlukan integrasi QRIS dinamis Midtrans.

## Deploy
Unggah isi folder website ini ke repositori yang terhubung dengan Vercel, lalu periksa deployment Preview sebelum mempromosikannya ke Production.
