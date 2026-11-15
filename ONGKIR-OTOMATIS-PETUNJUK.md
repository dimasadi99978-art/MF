# Ongkir otomatis Margaluyu Farm

## Cara kerja terbaru (alamat otomatis)
Pelanggan tidak lagi memilih "Wilayah pengiriman". Cukup mengetik alamat lengkap (jalan, nomor, kelurahan/kecamatan, kota). Sistem mencari **kata kunci** kecamatan/kelurahan di alamat itu, memilih area yang cocok, lalu menghitung ongkir. Patokan lokasi (depan minimarket, pagar hijau, dsb.) ditulis di kolom **Patokan & Catatan**.
- Kata kunci diatur per area di Admin > Pengaturan > Area & Ongkir (kolom "Kata kunci alamat", dipisah koma).
- Bila alamat **tidak cocok** dengan kata kunci mana pun, atau cocok dengan **lebih dari satu area**, sistem TIDAK menebak: daftar area muncul agar pelanggan memilih sendiri.
- Kata kunci terpanjang diproses lebih dulu, sehingga "Medokan Semampir" (Surabaya Timur) tidak salah dianggap kecamatan "Semampir".
- Migrasi: `supabase/migration_alamat_otomatis_gratis_ongkir.sql`. Isi awal kata kunci: 7 kecamatan Surabaya Timur versi Pemkot (Gubeng, Gunung Anyar, Mulyorejo, Rungkut, Sukolilo, Tambaksari, Tenggilis Mejoyo) beserta kelurahannya, dan 24 kecamatan Surabaya lainnya. **Periksa dan sesuaikan** dengan batas "Surabaya Timur" versi Anda sebelum dipakai.
- Admin tetap melihat nama area yang dipilih pada tiap pesanan; cocokkan dengan alamat sebelum mengirim.

## Gratis ongkir bersyarat (area bertarif tetap)
Per area ada dua isian opsional: **Gratis ongkir mulai belanja** (subtotal produk sebelum diskon) dan **Batas subsidi ongkir**. Contoh Gresik, tarif Rp15.000, syarat Rp100.000, batas Rp10.000: belanja 5 botol → ongkir menjadi Rp5.000. Kosongkan keduanya untuk mematikan. Aturan Surabaya Timur/lainnya tidak berubah.

## Aturan otomatis
- Surabaya Timur: Rp0.
- Surabaya lainnya: Rp3.000 untuk 1–3 botol; Rp0 mulai 4 botol.
- Wilayah/kecamatan lain: menggunakan tarif tetap pada Pengaturan Admin.

## Menyiapkan wilayah luar Surabaya
1. Buka Admin > Pengaturan > Area & Ongkir.
2. Tambahkan satu baris untuk setiap wilayah/kecamatan dan masukkan tarif yang benar.
3. Untuk fallback lokasi yang belum tercantum, pemilik dapat menambahkan area bernama `Wilayah lain (tarif standar)` dan mengisi tarif standar yang sudah diputuskan.
4. Aktifkan hanya area yang tarifnya sudah dipastikan. Jangan memakai Rp0 sebagai placeholder karena akan berarti gratis.
5. Uji checkout dengan 1, 3, dan 4 botol untuk kedua zona Surabaya; lalu uji satu zona luar Surabaya.

## Migrasi
- Jalankan `supabase/schema.sql` bila ingin menerapkan perubahan perhitungan `quote_order`.
- Jalankan `supabase/migration_shipping_confirmation.sql` setelah schema untuk memperbarui fungsi trigger dan fungsi konfirmasi ongkir.
- Jangan jalankan pada produksi sebelum backup dan memeriksa perubahan terhadap data aktif.

## Data yang masih perlu diisi pemilik
Nominal tarif luar Surabaya belum ditentukan dalam kode. Isi tarif nyata per wilayah/kecamatan di Pengaturan Admin. Sistem tidak menebak tarif.

## Pengujian aturan ongkir
Jalankan `supabase/test_shipping_quotes.sql` setelah `schema.sql`. Skrip membuat produk dan area uji sementara, memeriksa tarif Surabaya dan tarif luar sesuai nilai area, lalu melakukan `ROLLBACK`. Tarif Rp7.777 di dalam skrip hanya data simulasi dan tidak menjadi tarif pelanggan.

Pelanggan cukup mengetik alamat lengkap. Jika sistem menemukan tepat satu area dari kata kunci yang dikonfigurasi, area dan ongkir terisi otomatis. Daftar pilihan area hanya ditampilkan bila alamat ambigu atau belum dikenali; pelanggan dapat memilih area yang sesuai atau menghubungi admin. Sistem tidak menebak ongkir untuk alamat yang belum dikenali.

## Kolom alamat terstruktur (23 Oktober 2026)

Pelanggan mengisi jalan & nomor, kelurahan, kecamatan, kota, dan patokan di kotak "Alamat Pengiriman". Area dideteksi dari kelurahan/kecamatan/kota (bukan dari nama jalan, kecuali ketiganya kosong). Kata kunci area tetap diatur di Admin > Pengaturan > Kata kunci alamat; semakin lengkap daftarnya, semakin jarang pelanggan diminta memilih area manual. Daftar yang sama dipakai sebagai saran ejaan di kolom kelurahan dan kecamatan.
