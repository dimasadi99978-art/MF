# Laporan Audit Lanjutan — Margaluyu Farm (22 Oktober 2026)

Sumber pemeriksaan: `balik_9_qris_manual.zip` (131 berkas, dibuat 21 Okt 2026). Ini satu-satunya ZIP yang tersedia dalam percakapan;
`Margaluyu_Farm_Checkout_Audit_*.zip`, `Margaluyu_Farm_Checkout_Revision_*.zip`, dan `AUDIT-LANJUTAN-CHECKOUT-2026-10-21.md`
**tidak tersedia**, sehingga perbandingan sebelum/sesudah revisi **tidak dilakukan**. Yang dilakukan: pemeriksaan menyeluruh isi ZIP ini.

## A. Ringkasan pekerjaan
- Membaca kode `api/*`, `lib/*`, `supabase/*.sql`, checkout (`order-sekarang.html`), `orders-store.js`, panel admin, `vercel.json`, dokumentasi.
- Memeriksa sintaks seluruh JS/MJS dan seluruh skrip inline HTML (semua valid), referensi berkas lokal (tidak ada yang hilang), kecocokan endpoint
  `/api/*` yang dipanggil frontend dengan berkas di `api/` (semua ada), dan pemindaian rahasia tertanam (tidak ditemukan).
- Menulis dan menjalankan 53 uji API otomatis + 18 uji browser (Chromium headless). Hasil: **71 lulus, 0 gagal** (lihat HASIL-PENGUJIAN.md).
- Memperbaiki 2 masalah kode, menambah 1 alat diagnosis migrasi, memperbarui dokumentasi usang.
- **Tidak** menyentuh Supabase, Vercel, repositori GitHub, domain, atau data produksi (tidak ada akses jaringan/dashboard dalam audit ini).

## B. Temuan audit
| ID | Risiko | Temuan | Status |
|----|--------|--------|--------|
| F1 | **Tinggi (potensial)** | Kode `PUT /api/orders` memanggil fungsi SQL `transition_order_status` dan `confirm_order_shipping`, yang hanya ada di `migration_order_status_atomic.sql` dan `migration_shipping_confirmation.sql`. Panduan (`PANDUAN-SUPABASE.md`, `README.md`) hanya menyuruh menjalankan `schema.sql`. Pada database yang hanya diberi `schema.sql`, **admin tidak dapat mengubah status pesanan** (error 500). Keadaan database produksi **belum diperiksa**. | Dokumentasi diperbaiki; `supabase/URUTAN-MIGRASI.md` dibuat; `/api/health?deep=1` (admin) mendeteksi migrasi yang kurang. Perlu dijalankan oleh pemilik. |
| F2 | Sedang | `/api/health` bersifat publik dan mengembalikan 200 karakter pesan error mentah dari database bila koneksi/skema bermasalah (bisa memuat host, nama tabel/fungsi, petunjuk). Terbukti gagal pada uji D08 sebelum perbaikan. | **Diperbaiki** (pesan umum; detail ke Vercel Logs). |
| F3 | Sedang | Tombol "Lunas" di admin langsung mengubah status tanpa pengaman. QRIS statis tidak bisa diverifikasi otomatis, sehingga satu klik keliru = pesanan dianggap lunas. | **Diperbaiki** (dialog konfirmasi yang mengingatkan cek mutasi). Server tetap tidak dapat memverifikasi transaksi — itu keterbatasan QRIS statis. |
| F4 | Sedang (keputusan Anda) | Setelah pelanggan menutup halaman konfirmasi, QRIS tidak tampil lagi (halaman Order Tracking tidak memuatnya). Pelanggan harus meminta QRIS ulang. | **Tidak diubah** (fitur baru; butuh persetujuan). Lihat Langkah berikutnya. |
| F5 | Rendah | `PROGRES-DAN-LANGKAH-LANJUT.md` bagian G masih menyatakan integrasi Midtrans "disiapkan" dan merujuk `PANDUAN-MIDTRANS.md` yang tidak ada. `migration_midtrans_atomic.sql` dan `test_midtrans_atomic.sql` masih di folder (tidak dipakai kode). | Bagian G ditandai USANG; berkas SQL dibiarkan, ditandai "jangan dijalankan". |
| F6 | Rendah | Fitur "konfirmasi ongkir wajib": trigger `set_order_shipping_confirmation` selalu menetapkan `shipping_confirmation_required=false` saat insert, jadi alur ini praktis tidak aktif. Admin masih dapat mengubah ongkir zona non-Surabaya lewat `confirm_order_shipping`, yang mengubah total setelah pelanggan (khususnya QRIS) mungkin sudah membayar nominal lama. | Tidak diubah. Hindari mengubah ongkir pesanan QRIS yang sudah dibayar. |
| F7 | Rendah | Tidak ada kunci idempotensi pada `POST /api/orders`. Pesanan ganda mungkin bila pelanggan memuat ulang lalu kirim lagi. Mitigasi yang sudah ada dan teruji: tombol nonaktif saat proses (U11: 3 klik = 1 permintaan) dan batas 3 pesanan/10 menit/IP (D03). Batas per-IP bisa mengenai beberapa pelanggan di jaringan yang sama. | Tidak diubah. |
| F8 | Rendah | Kode promo yang gagal divalidasi diam-diam dibuang saat submit (pesanan tetap dibuat tanpa kode; pelanggan sudah melihat pesan error di kolom promo). Pembacaan kode saja, tidak diuji di browser. | Tidak diubah. |
| F9 | Rendah | Fungsi `SECURITY DEFINER` di `schema.sql` (`rl_hit`, `rl_clear`, `quote_order`, `create_order`) tidak memakai `set search_path`. Akses fungsi hanya untuk `service_role` sehingga risikonya kecil. | Tidak diubah (tidak bisa diuji tanpa Postgres). Opsional untuk staging. |
| F10 | Info | Label area di dropdown ganda: "Surabaya Timur (gratis ongkir) - Gratis ongkir" (nama area sudah memuat kata itu). Kosmetik. | Tidak diubah. |
| F11 | Info | `rateLimit` jatuh ke penghitung memori bila database tak terjangkau (situs tetap jalan, tetapi batas tidak berlaku lintas instance). Wajar. | — |

Yang diperiksa dan **sesuai**: harga/ongkir/diskon dihitung ulang di SQL (browser tidak mengirim total; U05, A12); RLS aktif di semua tabel tanpa policy dan
fungsi hanya `service_role`; kunci rahasia hanya dibaca dari `process.env` di server; sesi admin bertanda tangan HMAC dan kedaluwarsa 8 jam; pelacakan wajib
nomor pesanan + nomor HP; bukti pembayaran tidak keluar di API publik; CORS membatasi origin; honeypot, CAPTCHA opsional, dan rate limit berfungsi;
QRIS tidak pernah otomatis Lunas dan tidak bisa diproses sebelum Lunas.

## C. Perbaikan
Lihat DAFTAR-PERUBAHAN.md. Ringkas: `api/health.js` (F2 + pemeriksaan migrasi), `admin-pesanan.html` (F3), `scripts/smoke-test.mjs`, `package.json`, `.vercelignore`,
dokumentasi (F1, F5), serta berkas baru di `tests/` dan `supabase/URUTAN-MIGRASI.md`.

## D. Hasil pengujian
Lihat HASIL-PENGUJIAN.md (tabel lengkap, termasuk yang BELUM DIUJI).

## E. Status integrasi
| Lingkungan | Status |
|------------|--------|
| Lokal (Node 22 + Supabase tiruan di memori + Chromium dengan API dimock) | **Diuji**: 71/71 lulus. |
| Postgres/Supabase nyata (menjalankan `schema.sql`, migrasi, `test*.sql`) | **BELUM DIUJI**. |
| Staging / Preview Vercel | **BELUM ADA / BELUM DIUJI**. |
| Produksi (`susukambingsaanensegar354.vercel.app`) | **BELUM DIPERIKSA**. Tidak ada akses jaringan dalam audit ini. |
| Transaksi QRIS nyata melalui penyedia resmi | **BELUM DIUJI**. |

Penting: uji "perhitungan" memakai tiruan JavaScript dari fungsi SQL, jadi membuktikan perilaku lapisan API, **bukan** kebenaran SQL di Postgres.
Kebenaran SQL baru terbukti setelah `supabase/test.sql` dan `test_shipping_quotes.sql` dijalankan di Supabase.

## F. Hal yang masih membutuhkan akses Anda
1. Supabase: jalankan migrasi sesuai `supabase/URUTAN-MIGRASI.md` (idealnya di proyek staging dulu) dan jalankan `test*.sql`.
2. Vercel: pastikan environment variable (nama di PANDUAN-DEPLOY-DAN-ROLLBACK.md) terisi untuk **Preview** dan **Production**; buat deployment Preview.
3. Setelah Preview aktif, jalankan `node scripts/smoke-test.mjs https://URL-PREVIEW KATA_SANDI_ADMIN` di komputer Anda (jangan kirim kata sandi ke chat).
4. Pastikan `qris.jpg` adalah QRIS aktif milik Margaluyu Farm dan bisa dipindai (saya hanya bisa memastikan gambarnya termuat di halaman, U09, bukan keabsahannya).
5. Uji pembayaran QRIS nominal kecil hanya jika Anda mau, lalu cocokkan di riwayat transaksi aplikasi penyedia QRIS.
6. Cek Vercel > Logs untuk error setelah uji.

## G. Paket akhir
`Margaluyu_Farm_Siap_Preview_2026-10-22.zip` (lihat tautan di jawaban).

## H. Langkah berikutnya
Lihat PANDUAN-DEPLOY-DAN-ROLLBACK.md. Urutannya: cadangan → migrasi di staging → Preview → smoke test (termasuk health?deep=1) → uji COD → uji QRIS kecil → baru Production.
Keputusan yang menunggu Anda: apakah QRIS perlu ditampilkan ulang di halaman Order Tracking (F4), dan apakah mau menambahkan `set search_path` pada fungsi SQL (F9).

**Status kesiapan: belum boleh dinyatakan siap produksi.** Pengujian kritis di Supabase nyata, Preview, dan QRIS nyata belum dilakukan.
