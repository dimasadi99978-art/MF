# Daftar perubahan — audit 22 Oktober 2026
Dibandingkan dengan `balik_9_qris_manual.zip` (diff terhadap ekstraksi asli). Tidak ada fitur lama yang dihapus.

| Berkas | Perubahan | Alasan |
|--------|-----------|--------|
| `api/health.js` | Pesan error database tidak lagi dikirim mentah ke publik (diganti keterangan umum; detail ke `console.error`). Ditambah `?deep=1` (khusus admin) yang memeriksa fungsi `quote_order`, `create_order`, `confirm_order_shipping`, `transition_order_status` dan kolom `shipping_*` tanpa mengubah data. | F2, F1 |
| `admin-pesanan.html` | Dialog konfirmasi sebelum menandai pembayaran "Lunas". | F3 |
| `scripts/smoke-test.mjs` | Satu pemeriksaan tambahan: `health?deep=1` (dijalankan bila kata sandi admin diberikan). | F1 |
| `package.json` | Ditambah skrip `test` dan `test:live`. Tidak ada dependensi baru. | Pengujian |
| `.vercelignore` | Ditambah `tests` agar berkas uji tidak ikut dideploy. | Kebersihan deploy |
| `README.md`, `PANDUAN-SUPABASE.md` | Menyebut migrasi WAJIB dan lokasi uji. | F1 |
| `PROGRES-DAN-LANGKAH-LANJUT.md` | Bagian G (Midtrans) ditandai USANG. | F5 |
| **Baru** `supabase/URUTAN-MIGRASI.md` | Urutan migrasi, berkas opsional, berkas yang tidak boleh dijalankan. | F1, F5 |
| **Baru** `tests/api.test.mjs`, `tests/fake-supabase.mjs`, `tests/ui_checkout_test.py`, `tests/hasil/*` | Uji otomatis dan log hasilnya. | Pengujian |
| **Baru** `LAPORAN-AUDIT-2026-10-22.md`, `HASIL-PENGUJIAN.md`, `PANDUAN-DEPLOY-DAN-ROLLBACK.md`, `PANDUAN-PENGUJIAN.md`, `DAFTAR-PERUBAHAN.md` | Dokumentasi. | Permintaan |

Tidak diubah: skema dan fungsi SQL, `api/orders.js`, `api/promo.js`, alur checkout, QRIS statis (`qris.jpg`), `vercel.json`.


# Perubahan 23 Oktober 2026
| Berkas | Perubahan |
|--------|-----------|
| `order-sekarang.html` | Pilihan "Wilayah pengiriman" diganti **deteksi area otomatis dari alamat** (daftar manual hanya muncul bila alamat tak dikenali/ambigu). Alamat menjadi kolom 2 baris; kolom Catatan menjadi "Patokan & Catatan". Ajakan "tambah N botol lagi" untuk gratis ongkir. Salinan harga/area tersimpan di browser + tautan WhatsApp bila server bermasalah. |
| `supabase/schema.sql`, **baru** `supabase/migration_alamat_otomatis_gratis_ongkir.sql` | Kolom `cakupan`, `gratis_min_belanja`, `subsidi_maks` pada `shipping_zones`; `quote_order` menghitung subsidi ongkir dan mengembalikan `ongkir_normal`. Uji SQL ditambah di `test_shipping_quotes.sql` (belum dijalankan di Postgres asli). |
| `api/config.js`, `api/promo.js`, `api/admin-settings.js`, `lib/db.js` | Mengirim kata kunci & syarat gratis ongkir; cadangan otomatis bila migrasi belum dijalankan; pesan galat area diperjelas. |
| `admin-pengaturan.html` | Isian kata kunci alamat, gratis ongkir mulai belanja, batas subsidi. |
| `rating.html`, `rating.js` | Kotak voucher dirancang ulang: judul "Voucher Apresiasi Pelanggan Rp5.000", ringkasan ketentuan, penjelasan penggunaan nomor WhatsApp. |
| `api/health.js` | `?ping=1` (200/503) untuk pemantau uptime; pemeriksaan kolom area pada `?deep=1`. |
| `sw.js`, **baru** `offline.html` | Halaman cadangan saat perangkat offline. |
| **Baru** `scripts/backup-supabase.mjs`, `.github/workflows/backup-harian.yml`, `PANDUAN-KEANDALAN.md` | Cadangan harian dan panduan keandalan. |
| `tests/*` | Uji API 59 (sebelumnya 53), uji UI 29 (sebelumnya 18). |
| `faq.html`, `index.html` | Teks ongkir disesuaikan. |

## Perubahan 23 Oktober 2026 (lanjutan): formulir alamat terstruktur

| File | Perubahan |
|---|---|
| `order-sekarang.html` | Alamat pengiriman kini berupa kotak lipat bergaya FAQ dengan 5 kolom: jalan & nomor, kelurahan, kecamatan, kota (bawaan Surabaya), patokan lokasi. Saat dilipat, ringkasan menampilkan lokasi, area, dan ongkir. Area dideteksi dari kelurahan, kecamatan, dan kota secara terpisah; bila saling bertentangan sistem tidak menebak dan pelanggan diminta memilih area. Saran ejaan (datalist) diambil dari kata kunci area. Alamat dikirim ke server sebagai satu teks: `jalan, Kel. ..., Kec. ..., kota`; patokan masuk ke catatan pesanan (`Patokan: ...`). |
| `tests/ui_checkout_test.py` | Disesuaikan dengan kolom baru; ditambah U30-U36 (29 -> 36 uji). |


## 4 November 2026 — Pemisahan struk dan perbaikan pelacakan
- Halaman checkout dirapikan dengan warna solid, kontras yang jelas, permukaan lebih sederhana, dan fokus input yang konsisten.
- Setelah pesanan berhasil disimpan di server, pelanggan diarahkan ke `struk-pesanan.html?id=...`; ringkasan tidak lagi menumpuk di bawah formulir order.
- Halaman struk web menampilkan informasi transaksi, rincian subtotal/ongkir/diskon/total, metode dan status pembayaran, serta panel QRIS bila dipilih. Struk unduhan JPG pada `receipt-image.js` tidak diubah.
- Endpoint pelacakan berdasarkan nomor pesanan kini mencocokkan nomor HP setelah normalisasi di server, sehingga kompatibel dengan data lama yang tersimpan dengan awalan `08` maupun `62`. Detail tetap hanya dikirim bila ID dan nomor HP cocok.
- Pengujian otomatis: `npm test` — 59/59 lulus. Belum dilakukan uji langsung terhadap environment Supabase/Vercel produksi.
