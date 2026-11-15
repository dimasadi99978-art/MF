# Panduan pembayaran QRIS statis Margaluyu Farm

## Perilaku checkout
- Pelanggan memilih QRIS, membuat pesanan, lalu halaman konfirmasi menampilkan `qris.jpg` dan total akhir dari pesanan.
- QRIS bersifat statis sehingga pelanggan wajib memasukkan nominal sendiri. Website tidak dapat memastikan nominal yang dimasukkan benar.
- Pesanan QRIS berstatus menunggu verifikasi. Admin harus mencocokkan transaksi masuk dengan nominal dan nomor pesanan sebelum menandai pembayaran sebagai `Lunas`.
- Jangan menandai pesanan lunas hanya berdasarkan tangkapan layar bukti bayar. Periksa mutasi/riwayat transaksi pada aplikasi penyedia QRIS.
- Pesanan QRIS tidak boleh diproses ke tahap `Dikemas` sebelum status pembayaran `Lunas`.

## Yang harus dipastikan sebelum digunakan
1. Pastikan `qris.jpg` adalah QRIS aktif milik Margaluyu Farm.
2. Deploy file `qris.jpg` bersama `order-sekarang.html`.
3. Setelah deploy, buat pesanan uji dengan COD terlebih dahulu untuk memastikan penyimpanan pesanan berfungsi.
4. Untuk QRIS, lakukan pengujian hanya jika pemilik dapat memeriksa transaksi yang masuk. Jika membuat transaksi sungguhan, gunakan nominal kecil dan pastikan transaksi itu memang diinginkan.
5. Di halaman admin pesanan, verifikasi QRIS secara manual setelah dana benar-benar masuk.

## Catatan
- Checkout tidak memanggil endpoint Midtrans QRIS dinamis; endpoint tersebut tidak disertakan dalam paket rilis manual ini.
- QRIS statis tidak memberi konfirmasi otomatis. Jangan menyatakan pembayaran berhasil sebelum pemeriksaan manual selesai.
