# Perbaikan Pelacakan & Struk — 4 November 2026 (v3)

## Perubahan
- API pencarian pesanan menormalkan nomor ID ke huruf kapital.
- Lookup ID menggunakan pencarian exact (`eq`) terlebih dahulu, lalu fallback case-insensitive (`ilike`) untuk kompatibilitas data lama.
- Pencocokan nomor HP tetap dilakukan di server setelah normalisasi; detail pesanan tidak dikirim bila ID dan HP tidak cocok.
- Halaman Order Tracking membedakan gangguan koneksi/API, endpoint belum tersedia, batas pencarian, dan pesanan yang memang tidak ditemukan.
- Halaman konfirmasi menampilkan status berhasil dan preview nota berukuran ringkas seperti struk kasir.
- Preview nota memakai logo Margaluyu Farm, hierarki nomor pesanan, rincian produk, total, dan status pembayaran/pesanan.
- Unduhan tetap JPG; logo yang sama ikut dirender pada gambar unduhan.
- Halaman order tetap mengalihkan pelanggan ke `struk-pesanan.html` setelah server mengonfirmasi penyimpanan.

## Pengujian
- `node --check api/orders.js` — lulus.
- `node --check lacak-pesanan.js` — lulus.
- `node --check receipt-image.js` — lulus.
- `node --test tests/api.test.mjs` — 61/61 lulus.
- Pengujian API memakai Supabase tiruan di memori. Ini belum membuktikan koneksi ke proyek Supabase/Vercel produksi.

## Catatan produksi
Screenshot pelanggan memperlihatkan ID format lama `MF-YYMMDD-1234`. Kode saat ini tetap mendukung format ID lama dan baru. Jika pencarian masih gagal setelah deploy, periksa status HTTP endpoint `/api/orders` dan Vercel Runtime Logs. Jangan menganggap pesanan tersimpan hanya karena preview struk tampil; validasi bahwa pesanan benar-benar muncul di tabel `orders` Supabase.

## Deploy
Unggah isi folder proyek ini ke repository GitHub yang terhubung ke Vercel, lalu Redeploy. Pertahankan Environment Variables yang sudah ada (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, `ORDERS_ADMIN_KEY`). Jangan memasukkan secret ke file frontend.
