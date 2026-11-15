# Perbaikan Order, Struk, Lacak, dan Voucher (5 November 2026, v2)

## Penyebab "Pesanan belum tersimpan"
Nomor `MF-YYMMDD-1234` (4 angka) dibuat oleh browser, bukan server. Itu muncul bila permintaan `POST /api/orders` gagal
(situs dibuka dari file/preview statis, folder `api/` `lib/` belum ter-deploy, env Supabase belum diisi, atau server error).
Pesanan semacam itu memang tidak pernah masuk database, sehingga Order Tracking tidak menemukannya.

## Yang diubah
**Struk & animasi** (`struk-pesanan.html`): centang beranimasi + struk naik halus setelah pesanan dibuat.
**Antrean kirim ulang** (`orders-store.js`): bila server tidak terjangkau, pesanan TIDAK hilang. Pesanan disimpan di perangkat,
struk tetap tampil dengan keterangan jujur "belum terkirim ke sistem", lalu dikirim ulang otomatis (saat halaman dibuka,
saat koneksi kembali, tiap 30 detik, atau tombol "Kirim ulang sekarang"). Setelah masuk, struk berganti ke nomor resmi
(`MF-YYMMDD-XXXXXX`). Tombol WhatsApp tetap tersedia sebagai jalur cadangan.
**Order Tracking**: mengenali pesanan tertunda (nomor sementara + nomor HP yang cocok) dan nomor sementara lama otomatis
diarahkan ke nomor resmi.
**Penolakan server** (stok habis, data tidak valid) tidak lagi diperlakukan seperti gangguan koneksi: pelanggan melihat alasannya di form.
**Respons palsu**: jawaban 200 berisi HTML dari hosting statis tidak lagi dianggap pesanan tersimpan.
**Voucher**: deskripsi/ketentuan voucher dihapus dari `rating.html` dan `order-sekarang.html`; cara mendapatkan, memakai, dan
ketentuannya ada di FAQ beranda (`index.html#faq-voucher`) dan `faq.html`.

## Uji di komputer sendiri sebelum deploy
```
node scripts/dev-server.mjs 3111          # situs + /api dengan database tiruan di memori
python3 tests/e2e_order_flow.py 3111      # 17 skenario: berhasil, server mati, pulih, ditolak, lacak
```
Simulasi server mati: buka `/__dev/down`, hidupkan lagi lewat `/__dev/up`.

## Yang TIDAK bisa diperbaiki dari kode
Agar pesanan benar-benar masuk ke admin, server produksi harus hidup: deploy SELURUH folder (termasuk `api/`, `lib/`, `package.json`),
isi `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY` di Vercel, jalankan `supabase/schema.sql` + migrasi, lalu Redeploy.
Cek `https://DOMAIN-ANDA/api/health`. Antrean di browser hanyalah jaring pengaman, bukan pengganti database.
