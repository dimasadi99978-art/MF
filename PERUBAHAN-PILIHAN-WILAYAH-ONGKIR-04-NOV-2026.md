# Alamat Pengiriman 2 Pilihan & Tarif per Kota — 4 November 2026

## Tampilan di `order-sekarang.html`
Dua radio: **Surabaya** dan **Luar Surabaya**. Kolom kelurahan/kecamatan dihapus.
- **Surabaya** → pilih *Bagian Surabaya* (Timur, Pusat, Barat, Utara, Selatan). Timur memakai area "Surabaya Timur" (gratis); bagian lain memakai "Surabaya lainnya".
- **Luar Surabaya** → tulis *Kota/Kabupaten* (ada saran ketik dari daftar area aktif).
- Lalu *Alamat lengkap* dan *Patokan* (opsional). Tidak ada teks hitungan ongkir di formulir; ongkir hanya tampil di ringkasan pesanan.

## Algoritma Luar Surabaya (per kota)
1. "Kab./Kabupaten/Kota" diabaikan (Kab. Sidoarjo = Kota Sidoarjo = Sidoarjo).
2. Cocok tepat dengan kata kunci kota pada area → tarif area itu.
3. Salah ketik kecil ditoleransi (1 huruf untuk nama 5–7 huruf, 2 huruf untuk ≥8 huruf, huruf tertukar dihitung 1) dan hanya diterima bila hasilnya tepat satu area.
4. Mengetik "Surabaya" → tombol *Pilih Surabaya*.
5. Kota tak dikenal: bila ada area "*" aktif dipakai sebagai tarif umum; bila tidak, pesan "pengiriman luar Surabaya menjangkau Jawa Timur" (tanpa arahan ke WhatsApp).
Gratis ongkir bersyarat dan hitung ulang di server (`quote_order`) tidak diubah.

## Tarif awal (`supabase/migration_tarif_luar_surabaya.sql`, aktif)
| Area | Kota | Ongkir | Keringanan |
|---|---|---|---|
| Ring 1 | Sidoarjo, Gresik | Rp10.000 | Gratis mulai belanja Rp150.000 |
| Ring 2 | Mojokerto, Pasuruan, Lamongan, Jombang, Bangkalan | Rp20.000 | Potongan maks Rp10.000 mulai Rp200.000 |
| Ring 3 | Jawa Timur lainnya (23 kota/kabupaten) | Rp35.000 | Potongan maks Rp15.000 mulai Rp300.000 |
| Tarif umum (`*`) | kota lain | Rp50.000 | **nonaktif** (susu segar butuh pengiriman cepat/dingin) |
Semua dapat diubah di Admin > Pengaturan > Area & Ongkir. Syarat belanja dihitung dari subtotal sebelum diskon.

## Pesan "Failed to fetch" & mode pratinjau
Pesan itu muncul bila halaman tidak bisa menghubungi `/api/config` (halaman dibuka langsung dari komputer lewat `file://`, atau server/API belum aktif). Bila dibuka dari `file://`, halaman kini memakai data contoh **tanpa pesan apa pun**. Di Vercel, isi `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY` (Settings > Environment Variables), lalu redeploy; data asli otomatis dipakai.

## Ukuran tampilan
- "Bagian Surabaya" kini berupa tombol pil (Timur, Pusat, Barat, Utara, Selatan), bukan daftar bawaan perangkat yang besar.
- HP (<=480px): skala huruf 15px, bidang isian lebih rendah (sekitar 42px), judul dan kotak pesan lebih kecil; <=360px: 14px; layar >=1600px: 17px. Diuji pada lebar 320, 360, 390, 768, 1024, 1440 tanpa geser samping.

## Batas pengujian
Diuji di Chromium (Playwright) dengan `/api/config` tiruan: pilihan Surabaya/Luar, tarif per kota, salah ketik, kota tak dikenal, gratis ongkir bersyarat, pindah mode, mode pratinjau `file://`, tampilan desktop dan HP. SQL belum dijalankan di Postgres asli. Pilihan "Surabaya Timur" kini berdasarkan pilihan pelanggan (tidak lagi divalidasi per kelurahan).
