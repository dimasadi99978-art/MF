# Strategi promo Margaluyu Farm

## Tujuan
Mendorong pembelian lebih banyak dan pembelian ulang tanpa diskon berlebihan, tanpa mewajibkan ulasan positif, serta tanpa membuat admin mengelola voucher satu per satu.

## 1. Promo kuantitas otomatis
- 3–5 botol: diskon 5% dari subtotal produk, maksimal Rp10.000.
- 6 botol atau lebih: diskon 10% dari subtotal produk, maksimal Rp20.000.
- Ongkir tidak didiskon.
- Promo kuantitas tidak dapat ditumpuk dengan voucher kode.
- Jika hanya satu area pengiriman aktif, area dipilih otomatis. Jika beberapa tarif aktif, pelanggan memilih wilayah agar ongkir tepat.

## 1b. Gratis ongkir bersyarat (pendorong beli lebih banyak, biaya terukur)
- Dikonfigurasi per area di Admin > Pengaturan > Area & Ongkir: *Gratis ongkir mulai belanja* dan *Batas subsidi ongkir*.
- Syarat dihitung dari subtotal produk sebelum diskon, jelas bagi pelanggan ("5 botol = Rp100.000"). Subsidi dibatasi, jadi biaya maksimal per pesanan selalu diketahui.
- Formulir menampilkan ajakan otomatis ("Tambah 2 botol lagi untuk potongan ongkir hingga Rp10.000") dan rincian "hemat".
- Berlaku sama untuk semua pelanggan di area itu; tidak butuh kode sehingga tidak ada yang merasa tidak kebagian.
- Rumus aman: subsidi + diskon kuantitas per pesanan harus tetap lebih kecil dari laba kotor pesanan itu. Contoh pembanding: 5 botol = diskon Rp5.000 + subsidi maks Rp10.000 = Rp15.000 dari omzet Rp100.000. Pastikan margin per botol Anda mencukupi sebelum mengaktifkan.
- Aturan lama tetap: Surabaya Timur gratis, Surabaya lainnya gratis mulai 4 botol.

## 2. Voucher apresiasi ulasan
- Pelanggan yang memiliki pesanan berstatus Selesai dapat mengisi nomor pesanan dan nomor WhatsApp yang digunakan saat membeli.
- Setelah ulasan terkirim, server memverifikasi pesanan dan nomor WhatsApp. Ulasan boleh memiliki rating berapa pun; jangan mensyaratkan bintang lima.
- Jika valid, sistem membuat kode voucher unik: potongan Rp5.000, minimal belanja Rp50.000, berlaku 45 hari, satu kali pakai, satu voucher per pesanan.
- Voucher diikat ke nomor WhatsApp pelanggan. Kode tidak bisa dipakai tanpa nomor yang cocok, setelah kedaluwarsa, atau setelah digunakan.
- Voucher tidak digabung dengan promo kuantitas karena pelanggan memilih satu jenis promo per pesanan.
- Admin dapat melihat daftar voucher dan status pemakaiannya di Pengaturan > Voucher Rating.

## Mengapa dipilih
- Diskon kuantitas meningkatkan nilai keranjang dan membuat pelanggan merasa mendapat manfaat nyata.
- Voucher rating mendorong pelanggan kembali karena manfaatnya hanya bisa digunakan pada transaksi berikutnya.
- Minimal belanja Rp50.000 membatasi risiko margin; nominal ini tetap perlu dibandingkan dengan harga pokok dan ongkir nyata.
- Voucher diberi untuk ulasan jujur, bukan untuk ulasan positif, agar reputasi tetap kredibel.

## Wajib dilakukan sebelum produksi
1. Jalankan `supabase/schema.sql` versi terbaru di Supabase SQL Editor.
2. Jalankan `supabase/test.sql` dan pastikan hasilnya menampilkan `SEMUA PENGUJIAN LULUS`.
3. Setelah deployment, uji pesanan 1, 3, 5, dan 6 botol; cek total, ongkir, dan stok.
4. Uji voucher dengan pesanan selesai dan nomor WhatsApp yang benar; pastikan nomor salah, pesanan belum selesai, kode kedaluwarsa, dan pemakaian kedua ditolak.
5. Uji email, tombol WhatsApp admin, dan penyimpanan pesanan sebelum menerima pelanggan sungguhan.
