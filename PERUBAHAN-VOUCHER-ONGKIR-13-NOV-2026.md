# Perubahan 13 Nov 2026: voucher, anonim, ongkir bertingkat, tampilan area & pembayaran

1. Voucher ulasan: Rp5.000, tanpa minimal belanja. Nomor pesanan terisi otomatis di halaman rating (dari tautan Order Tracking atau pesanan terbaru yang belum diulas di perangkat), tidak bisa diketik.
2. Ulasan yang dikirim sebelum pesanan Selesai tetap tersimpan; voucher terbit otomatis saat admin menandai Selesai (dan muncul di halaman Rating/Order, WhatsApp bila aktif).
3. Anonim: nama menjadi "B***i S***o" (huruf pertama dan terakhir saja), disamarkan di browser dan di server; nama lengkap tidak disimpan.
4. Ongkir luar Surabaya bertingkat: belanja 40/60/80/100% dari "Belanja untuk potongan ongkir penuh" memotong 25/50/75/100% ongkir, maksimal "Potongan ongkir maksimal", dan diskon + potongan ongkir <= 20% subtotal.
5. Tampilan Area pengiriman dan Pembayaran: daftar radio polos tanpa ikon.
6. FAQ beranda diperbarui; syarat voucher dihapus dari halaman rating.

Jalankan di Supabase (paling akhir): supabase/migration_voucher_tanpa_minimum_subsidi_bertingkat.sql

## Tambahan (13 Nov 2026, siang)
- Perbaikan: ulasan yang sempat gagal terkirim (tersimpan di perangkat) kini dikirim ulang juga saat membuka Order Sekarang, dan voucher langsung terisi otomatis di kolom kode promo.
- Pesan gagal kirim menampilkan "Kode gangguan" (mis. KOLOM_DB_TIDAK_ADA = migrasi database belum dijalankan).
- Ringkasan pesanan, pilihan area, dan pilihan pembayaran didesain ulang (css/order-pro.css, bagian paling bawah).

## Revisi (13 Nov 2026, pagi)
- Tampilan ringkasan pembayaran, opsi pembayaran, dan opsi area pengiriman dikembalikan ke desain semula.
- Ringkasan kini menampilkan ongkos kirim normal dan baris terpisah "Potongan ongkir" yang mengurangi total.

## Revisi (13 Nov 2026, pagi 2)
- Voucher terbit LANGSUNG setelah ulasan terkirim, tanpa menunggu pesanan berstatus Selesai (SQL `issue_review_voucher` diubah; jalankan ulang migrasi nomor 6).
- Kotak "Pesanan MF-..." dihapus dari halaman rating. Nomor pesanan dikirim diam-diam oleh sistem. Kolom isian manual hanya muncul bila pesanan tidak terdeteksi di perangkat.
- Ringkasan menampilkan "Total sebelum potongan" dicoret.

## Revisi (13 Nov 2026, sore): kolom nomor pesanan di halaman rating
- Kolom "Nomor pesanan" kini SELALU tampil.
- Di perangkat yang dipakai memesan: terisi otomatis dan terkunci (ada tautan "Bukan pesanan ini? Ganti nomor").
- Di perangkat lain: kosong, pelanggan mengetik nomor dari struk (huruf otomatis kapital, divalidasi di browser dan server).
- Tidak perlu migrasi database; hanya rating.html, rating.js, css/voucher.css.

## Revisi (13 Nov 2026, sore 2): voucher bergaya struk
- Voucher setelah ulasan terkirim (dan di bagian "Voucher Anda") tampil seperti struk: kop logo + MARGALUYU FARM, nomor pesanan, nilai potongan, kode, syarat, cara pakai, barcode.
- Barcode kini Code 128 sungguhan yang memuat kode voucher (bisa dipindai), bukan garis hiasan.
- Seluruh teks struk memakai satu keluarga huruf monospace; garis putus tipis 1px; jarak antarbaris seragam; "Cara pakai" diratakan tengah.
- "Simpan gambar" menghasilkan PNG dengan tampilan yang sama (360px x3).
- File: rating.js, css/voucher.css. Tanpa migrasi database.
