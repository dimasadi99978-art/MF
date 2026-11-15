# Panduan pengujian

## Lokal (aman, tanpa produksi)
```
npm test                              # 53 uji API; Supabase tiruan di memori
pip install playwright && playwright install chromium
python3 tests/ui_checkout_test.py     # 18 uji browser; API dimock
```
Butuh Node 18+ (diuji di Node 22). `tests/` tidak ikut dideploy (`.vercelignore`).

## Di database (Supabase SQL Editor; diakhiri ROLLBACK)
`supabase/test.sql`, `supabase/test_shipping_quotes.sql`, `supabase/test_order_status_atomic.sql` — setelah migrasi (lihat `supabase/URUTAN-MIGRASI.md`).

## Pada situs yang sudah dideploy (Preview dulu)
```
node scripts/smoke-test.mjs https://URL-PREVIEW KATA_SANDI_ADMIN        # tanpa pesanan
node scripts/smoke-test.mjs https://URL-PREVIEW KATA_SANDI_ADMIN --order  # membuat 1 pesanan uji (stok -1)
```
Ketik kata sandi hanya di terminal Anda. Jangan jalankan `--order` ke produksi kecuali Anda siap menghapus pesanan ujinya (status Selesai → hapus lewat admin) dan mengembalikan stok di Admin > Pengaturan.
