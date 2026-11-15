# Panduan pemasangan: migrasi JSONBin ke Supabase

> Catatan: nama beberapa halaman berubah (mis. `order sekarang.html` menjadi `order-sekarang.html`) dan ada fitur lanjutan. Lihat PANDUAN-FITUR-LANJUTAN.md. Bila Supabase sudah dipasang dari versi sebelumnya, cukup jalankan ulang `supabase/schema.sql`.

Perkiraan waktu: 30-45 menit. Kerjakan berurutan.

## Yang sudah disiapkan di zip ini
| Kebutuhan | Di mana |
|---|---|
| Tabel: produk/stok, area/ongkir, kode promo, pesanan, testimoni, voucher ulasan, batas spam | `supabase/schema.sql` |
| Pengurangan stok atomik + kuota promo + nomor pesanan unik | fungsi `create_order` (satu transaksi, baris produk dikunci `FOR UPDATE`) |
| Hitung harga/ongkir/diskon di database | fungsi `quote_order` |
| Batas spam lintas server | fungsi `rl_hit` + tabel `rate_limits` |
| Keamanan akses | semua tabel RLS aktif tanpa policy; fungsi hanya boleh dipanggil `service_role` (server) |
| Kode server yang memakainya | `api/*.js`, `lib/db.js`, `lib/security.js` |
| Uji database | `supabase/test.sql` |
| Uji situs yang sudah online | `scripts/smoke-test.mjs` |
| Pindah data lama | `scripts/migrate-jsonbin-to-supabase.mjs` |

## Langkah 1. Isi domain untuk SEO (canonical & Open Graph)
Semua halaman memakai penanda `__SITE__`. Ganti dengan domain Anda (di komputer, butuh Node 18+):
```
node scripts/set-domain.mjs domain-anda.com
```
Jangan deploy sebelum langkah ini, supaya alamat canonical tidak berisi `__SITE__`.

## Langkah 2. Buat proyek Supabase
1. Daftar di supabase.com, **New project**. Pilih region terdekat (mis. Singapore). Simpan kata sandi database.
2. Buka **SQL Editor > New query**, tempel isi `supabase/schema.sql`, klik **Run**. Harus muncul "Success".
2b. **WAJIB — jalankan juga, berurutan:** `supabase/migration_shipping_confirmation.sql`, lalu `supabase/migration_order_status_atomic.sql`.
   Tanpa keduanya, admin tidak dapat mengubah status pesanan. Daftar lengkap dan berkas yang TIDAK boleh dijalankan: `supabase/URUTAN-MIGRASI.md`.
3. Uji logika: query baru, tempel `supabase/test.sql`, **Run**. Harapan: pesan **SEMUA PENGUJIAN LULUS**. Data asli tidak berubah karena diakhiri ROLLBACK. Jika ada pesan GAGAL, kirim pesannya ke saya.

## Langkah 3. Ambil kunci
**Project Settings > API**:
- **Project URL** menjadi `SUPABASE_URL`.
- Kunci **service_role** (rahasia) menjadi `SUPABASE_SERVICE_KEY`. Jangan pakai kunci `anon`, jangan taruh di file kode, jangan dibagikan.

## Langkah 4. Isi Environment Variables di Vercel
**Settings > Environment Variables** (Production):
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `ORDERS_ADMIN_KEY`: kata sandi admin baru, panjang (minimal 16 karakter), bukan angka saja
- `RESEND_API_KEY`, `NOTIFY_EMAIL` (tetap seperti sebelumnya)
- Opsional: `FONNTE_TOKEN` untuk WhatsApp otomatis ke pelanggan

Variabel lama (`ORDERS_MASTER_KEY`, `ORDERS_BIN_ID`, `TESTIMONI_*`) boleh dibiarkan sementara untuk proses migrasi, lalu dihapus.

## Langkah 5. Deploy
Unggah isi folder ini ke proyek Vercel Anda (atau push ke Git), lalu **Redeploy**. Buka `https://domain-anda.com/api/health`: bagian `database.status` harus `ok`, dan `saran` kosong atau hanya berisi hal yang memang belum Anda isi.

## Langkah 6. Pindahkan data lama (sekali saja)
Di komputer (Node 18+), dari folder proyek:
```
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... ORDERS_MASTER_KEY=... ORDERS_BIN_ID=... TESTIMONI_MASTER_KEY=... TESTIMONI_BIN_ID=... node scripts/migrate-jsonbin-to-supabase.mjs
```
Pesanan lama dipindah dengan statusnya. Testimoni lama langsung berstatus tampil. Pesanan aman dijalankan ulang (duplikat dilewati), **testimoni jangan dijalankan dua kali** (akan dobel). Setelah data terlihat lengkap di situs dan Admin, **revoke kunci JSONBin lama** di jsonbin.io dan hapus variabel lamanya dari Vercel.

## Langkah 7. Atur toko di Admin > Pengaturan
Buka `/admin-pengaturan.html`, login dengan `ORDERS_ADMIN_KEY`.
- **Produk & Stok**: cek harga dan isi stok. Nilai awal dari skema adalah stok 50 dan harga Rp 20.000 (sesuaikan).
- **Area & Ongkir**: nilai awal hanya "Surabaya Timur (gratis ongkir)" sesuai teks di situs Anda. Tambahkan area lain dan biaya sebenarnya, atau pelanggan di luar area itu tidak bisa memesan.
- **Kode Promo**: buat bila diperlukan.

## Langkah 8. Pengujian
**Otomatis** (dari komputer mana pun):
```
node scripts/smoke-test.mjs https://domain-anda.com KATA_SANDI_ADMIN
```
Menguji koneksi database, akses tanpa login ditolak, login salah ditolak, pesanan tidak valid ditolak, honeypot, CORS, header CSP, dan file lama tidak membocorkan kunci. Tambahkan `--order` untuk membuat satu pesanan uji (lalu ubah statusnya ke Selesai dan hapus lewat Admin).

**Manual:**
1. Buat pesanan dari halaman Order: pilih area, coba kode promo, pastikan rincian total benar dan email masuk.
2. Admin Pesanan: pesanan muncul; ubah status pengiriman dan status pembayaran QRIS; tombol WhatsApp memakai pesan yang sesuai.
3. Admin Pengaturan: set stok jadi 1, pesan 2 botol dan harus ditolak ("stok tidak mencukupi"); pesan 1 botol, lalu halaman Order dan Produk harus menampilkan stok habis dan tombol pesan terkunci. Kembalikan stoknya.
4. Order Tracking: nomor pesanan + nomor HP menampilkan ongkir, diskon, dan status pembayaran.
5. Tandai pesanan uji menjadi Selesai, lalu kirim ulasan dari halaman Rating dengan nomor pesanan dan WhatsApp yang sama untuk menguji voucher. Ulasan menunggu persetujuan admin sebelum tampil di situs; voucher tetap harus diuji sekali pakai.
6. Cek pratinjau tautan (WhatsApp/Facebook Sharing Debugger) dan `/sitemap.xml`.

## Soal pesanan bersamaan dan spam
- **Pesanan bersamaan**: tiap pesanan adalah baris sendiri, bukan file yang ditulis ulang. Stok dikurangi di dalam transaksi yang mengunci baris produk, sehingga dua pembeli untuk botol terakhir tidak mungkin sama-sama berhasil. `supabase/test.sql` memeriksa perilaku ini (stok habis ditolak, stok tidak berkurang saat pesanan gagal, nomor ganda ditolak). Uji beban paralel dari satu IP tidak bisa dilakukan lewat situs karena dibatasi 3 pesanan per 10 menit.
- **Spam**: batas dihitung di database (lintas instance Vercel): 3 pesanan/10 menit dan 10/jam per IP, 3 testimoni/10 menit, 8 percobaan login/15 menit, plus kolom jebakan bot. IP yang dipakai bersama (jaringan kantor/seluler) bisa ikut terbatas. Untuk perlindungan lebih kuat nanti, tambahkan CAPTCHA (Cloudflare Turnstile).

## Pemecahan masalah
- `/api/health` menunjukkan `gagal`: cek `SUPABASE_URL` (tanpa garis miring di akhir), `SUPABASE_SERVICE_KEY` (service_role), dan pastikan Redeploy setelah mengubah variabel.
- "Pilih area pengiriman" selalu muncul / area kosong: belum ada area aktif di Admin Pengaturan.
- Pesan "permission denied" atau fungsi tidak ditemukan: `schema.sql` belum dijalankan penuh; jalankan ulang (aman).
- Admin terkunci: tunggu 15 menit, atau hapus baris `login:...` di tabel `rate_limits`.

## Hal yang perlu Anda ketahui
- Foto bukti pembayaran disimpan di database sebagai teks (otomatis dihapus saat status Selesai). Untuk volume besar, pindahkan ke Supabase Storage nanti.
- Cadangan: cek kebijakan terbaru paket gratis Supabase (cadangan dan penjedaan proyek yang tidak aktif bisa berbeda dari paket berbayar). Ekspor CSV pesanan secara rutin dari Admin Pesanan.
- WhatsApp otomatis memerlukan layanan berbayar pihak ketiga (Fonnte) dan belum diuji dengan akun sungguhan. Tanpa itu, tombol WhatsApp siap kirim di Admin tetap berfungsi.
- Teks kebijakan pengembalian di `faq.html` adalah draf; sesuaikan dengan kebijakan toko Anda.

## Promo otomatis tanpa kode pelanggan

Promo kuantitas otomatis: 3–5 botol mendapat diskon 5% (maksimal Rp10.000), sedangkan 6 botol atau lebih mendapat diskon 10% (maksimal Rp20.000). Diskon dihitung dari subtotal produk dan tidak digabung dengan voucher lain. Setelah pesanan berstatus Selesai, pelanggan yang mengirim ulasan dengan nomor pesanan dan WhatsApp yang cocok mendapat voucher unik Rp5.000 (minimal belanja Rp50.000, berlaku 45 hari, sekali pakai). Untuk promo otomatis khusus pada pesanan di bawah 3 botol, admin dapat membuat promo berkode `OTOMATIS` di **Admin > Pengaturan > Kode Promo**. Kode voucher lainnya dapat dibagikan melalui WhatsApp/Instagram. Setelah memperbarui fitur, jalankan ulang seluruh `supabase/schema.sql` di Supabase SQL Editor agar aturan harga terbaru diterapkan.


## Pembayaran QRIS statis manual

Paket rilis ini memakai QRIS statis dari `qris.jpg`, bukan Midtrans QRIS dinamis. Setelah pelanggan membuat pesanan, website menampilkan QRIS dan total akhir. Pelanggan harus memasukkan nominal sendiri. Admin memeriksa transaksi masuk melalui aplikasi merchant/penyedia QRIS, lalu mengubah status menjadi `Lunas` hanya jika transaksi dan nominal cocok. Jangan tandai lunas berdasarkan screenshot saja. Lihat `PANDUAN-RILIS-QRIS-MANUAL.md`.
