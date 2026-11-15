# Revisi versi 19 — Margaluyu Farm

## Perubahan pada versi ini

1. **Testimoni lebih mudah ditelusuri**
   - Tampilan awal dibatasi 8 ulasan agar halaman tidak terlalu panjang.
   - Ditambahkan pencarian berdasarkan nama atau isi ulasan.
   - Ditambahkan pengurutan: terbaru, rating tertinggi, rating terendah, dan ulasan dengan komentar.
   - Tombol “Muat lebih banyak” tetap tersedia untuk melihat ulasan berikutnya.
   - Ringkasan rating tetap dihitung dari seluruh ulasan yang berhasil dimuat, bukan hanya hasil filter.

2. **Alamat dan ongkir**
   - Formulir menggunakan satu kolom alamat lengkap.
   - Area dan ongkir dideteksi otomatis berdasarkan kata kunci wilayah yang dikonfigurasi.
   - Pilihan area hanya menjadi fallback ketika alamat ambigu atau tidak dikenali; sistem tidak boleh menebak ongkir.
   - Aturan yang dirancang: Surabaya Timur gratis; Surabaya lainnya Rp3.000 untuk 1–3 botol dan gratis mulai 4 botol; area luar Surabaya mengikuti tarif yang diatur admin.

3. **Dokumentasi**
   - Petunjuk ongkir diperjelas agar konsisten dengan deteksi otomatis dan fallback.

## Penting sebelum produksi

Kode website tidak dapat mengaktifkan migrasi Supabase dengan sendirinya. Periksa `supabase/URUTAN-MIGRASI.md` dan pastikan migrasi wajib serta `migration_alamat_otomatis_gratis_ongkir.sql` sudah dijalankan pada proyek Supabase yang benar. Cadangkan data pesanan sebelum mengubah database. Atur tarif nyata wilayah luar Surabaya di Admin > Pengaturan > Area & Ongkir.

## Pengujian yang dilakukan pada paket

- Pemeriksaan sintaks JavaScript `testimoni.js` dengan `node --check`.
- Perubahan UI perlu diuji lagi di browser pada desktop dan ponsel.
- Belum ada klaim bahwa database produksi atau integrasi checkout sudah diuji langsung; lakukan uji checkout 1, 3, dan 4 botol serta alamat dikenali/tidak dikenali sebelum menerima pesanan.
