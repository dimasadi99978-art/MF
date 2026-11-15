# Panduan deploy dan rollback — Margaluyu Farm

Prinsip: **Preview dulu, Production belakangan.** Jangan mengganti proyek Vercel, proyek Supabase, repositori, atau domain produksi tanpa keputusan Anda sendiri.
Jangan menempelkan kata sandi, `SUPABASE_SERVICE_KEY`, atau token ke chat/dokumen/repositori.

## 0. Environment variable (nama saja; nilai diisi Anda di Vercel > Settings > Environment Variables)
| Variabel | Wajib? | Fungsi |
|----------|--------|--------|
| `SUPABASE_URL` | Wajib | Alamat proyek Supabase |
| `SUPABASE_SERVICE_KEY` | Wajib | Kunci server (service_role / secret). **Hanya di Vercel.** |
| `ORDERS_ADMIN_KEY` | Wajib | Kata sandi admin (panjang) + dasar penandatanganan sesi |
| `RESEND_API_KEY`, `NOTIFY_EMAIL`, `RESEND_FROM` | Opsional | Email notifikasi pesanan |
| `FONNTE_TOKEN` | Opsional | WhatsApp otomatis |
| `TURNSTILE_SECRET_KEY` | Opsional | CAPTCHA (site key diisi di `turnstile-config.js`) |
| `ADMIN_TOTP_SECRET` | Opsional | 2FA login admin |
| `ALLOWED_ORIGINS` | Opsional | Domain tambahan untuk CORS |
| `CRON_SECRET` | Opsional | Pelindung `/api/test-email` |
| `SITE_URL`, `OWNER_WHATSAPP` | Opsional | Dipakai email/sitemap |
Tidak ada variabel Midtrans yang dibutuhkan; jangan menambahkannya.
Pastikan variabel terisi untuk lingkungan **Preview** dan **Production** (keduanya terpisah di Vercel).

## 1. Sebelum deploy
1. **Cadangan data**: Supabase > Table Editor > `orders`, `products`, `shipping_zones`, `promo_codes`, `customer_vouchers`, `testimoni` > Export CSV. Simpan di tempat aman.
2. **Catat versi sekarang**: di Vercel > Deployments, catat deployment Production yang aktif (untuk rollback). Di GitHub catat commit terakhir.
3. Pastikan `qris.jpg` adalah QRIS aktif milik Margaluyu Farm.

## 2. Migrasi database (idealnya di proyek Supabase staging dulu)
Ikuti `supabase/URUTAN-MIGRASI.md`: `schema.sql` → `migration_shipping_confirmation.sql` → `migration_order_status_atomic.sql`, lalu `test.sql`, `test_shipping_quotes.sql`, `test_order_status_atomic.sql`.
Semua idempotent dan tidak berisi `drop table`/`truncate`/`delete` data. Tetap lakukan cadangan (langkah 1).
Jangan jalankan `migration_midtrans_atomic.sql`.

## 3. Deploy ke Preview
1. Unggah isi paket ini ke cabang baru di repositori (mis. `siap-preview`), bukan langsung ke `main`. Vercel otomatis membuat Preview.
2. Buka `https://URL-PREVIEW/api/health` → `database.status` harus `ok`.
3. Di komputer Anda: `node scripts/smoke-test.mjs https://URL-PREVIEW KATA_SANDI_ADMIN` → semua LULUS, termasuk "Migrasi database lengkap".
4. Uji manual di Preview: pesanan **COD** (cek muncul di admin dan Order Tracking, status maju berurutan); pesanan **QRIS** (QRIS dan total tampil, status "Menunggu verifikasi", tidak bisa Dikemas sebelum Lunas, klik Lunas memunculkan peringatan).
5. Periksa Vercel > Logs untuk error. Hapus pesanan uji lewat admin (status Selesai) dan koreksi stok di Admin > Pengaturan.
6. Uji QRIS nominal kecil hanya bila Anda memang ingin; cocokkan di riwayat transaksi aplikasi penyedia QRIS sebelum menekan Lunas.

## 4. Promosikan ke Production
Hanya jika langkah 3 lulus semua: merge cabang ke `main` (atau di Vercel > Deployments > Preview yang lulus > Promote to Production). Ulangi `/api/health` dan smoke test (tanpa `--order`) di domain produksi.

## 5. Rollback
| Situasi | Tindakan |
|---------|----------|
| Kode bermasalah setelah promote | Vercel > Deployments > deployment Production sebelumnya (yang Anda catat) > **Promote to Production** / "Instant Rollback". Tidak mengubah database. |
| Perubahan di GitHub | `git revert <commit>` lalu push; atau kembalikan commit yang Anda catat. |
| Migrasi database bermasalah | Migrasi hanya menambah/mengganti fungsi dan kolom (tidak menghapus data). Kode lama tetap berjalan dengan skema yang lebih baru. Bila perlu pulihkan data dari CSV cadangan lewat Table Editor > Insert > Import. Jangan menghapus tabel. |
| Pesanan uji terlanjur masuk produksi | Admin: majukan ke Selesai → "Pilih untuk dihapus"; kembalikan stok di Admin > Pengaturan; hapus kode promo/voucher uji bila ada. |

## 6. Setelah rilis
- Cek `/api/health` berkala; pantau Vercel > Logs terutama pesan `API pesanan gagal`.
- Rutin cocokkan pesanan QRIS dengan mutasi sebelum menekan Lunas.
