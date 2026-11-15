# Hasil pengujian — 22 Oktober 2026

Semua hasil di bawah berasal dari eksekusi nyata di lingkungan audit (log mentah: `tests/hasil/`). **Tidak ada** pengujian yang menyentuh Supabase, Vercel, atau produksi.

Cara menjalankan ulang: `npm test` (API) dan `python3 tests/ui_checkout_test.py` (browser; butuh `pip install playwright` + `playwright install chromium`).

**Ringkasan: 71 LULUS, 0 GAGAL dari 71 uji otomatis.**
Sebelum perbaikan, satu uji gagal (D08: `/api/health` membocorkan pesan error database); setelah perbaikan seluruhnya lulus.

**Batas yang harus dipahami:** seri A (perhitungan) dan sebagian B–D memakai tiruan JavaScript dari fungsi SQL (`tests/fake-supabase.mjs`). Hasilnya membuktikan perilaku lapisan API (validasi, otorisasi, pemetaan error, pengamanan status), BUKAN kebenaran SQL di Postgres.

## 1. Uji API

| ID | Skenario | Hasil | Lingkungan |
|----|----------|-------|------------|
| A01 | satu produk, area Surabaya Timur: total = harga, ongkir 0 | LULUS | API (Supabase tiruan) |
| A02 | beberapa produk (qty 3) mendapat promo kuantitas 5% otomatis | LULUS | API (Supabase tiruan) |
| A03 | qty 6 mendapat 10% (dibatasi maks Rp20.000) ; qty 12 terkena batas | LULUS | API (Supabase tiruan) |
| A04 | ongkir per zona: Surabaya lainnya 3000 (<4), gratis (>=4); Sidoarjo 12000 | LULUS | API (Supabase tiruan) |
| A05 | kode promo valid (HEMAT10) menghitung diskon 10% | LULUS | API (Supabase tiruan) |
| A06 | kode promo tidak valid (TIDAKADA) ditolak 400 & stok tidak berkurang | LULUS | API (Supabase tiruan) |
| A07 | kode promo tidak valid (LAMA) ditolak 400 & stok tidak berkurang | LULUS | API (Supabase tiruan) |
| A08 | kode promo tidak valid (KUOTA1) ditolak 400 & stok tidak berkurang | LULUS | API (Supabase tiruan) |
| A09 | kode promo tidak valid (MIN100) ditolak 400 & stok tidak berkurang | LULUS | API (Supabase tiruan) |
| A10 | voucher ulasan: nomor salah / terpakai / kedaluwarsa / valid | LULUS | API (Supabase tiruan) |
| A11 | /api/promo menghitung rincian tanpa membuat pesanan | LULUS | API (Supabase tiruan) |
| A12 | manipulasi harga/ongkir/diskon/status dari browser diabaikan server | LULUS | API (Supabase tiruan) |
| A13 | zona tidak ada / nonaktif / non-numerik ditolak | LULUS | API (Supabase tiruan) |
| B01 | COD: tersimpan, nomor MF-YYMMDD-XXXXXX, stok berkurang, status awal benar | LULUS | API (Supabase tiruan) |
| B02 | respons POST tidak memuat bukti pembayaran | LULUS | API (Supabase tiruan) |
| B03 | pelacakan: nomor pesanan + HP cocok -> detail; HP salah -> kosong | LULUS | API (Supabase tiruan) |
| B04 | pelacakan hanya dengan HP: daftar terbatas tanpa nama/alamat/total | LULUS | API (Supabase tiruan) |
| B05 | pelacakan tanpa HP / hanya nama / wildcard di nomor pesanan tidak membocorkan data | LULUS | API (Supabase tiruan) |
| B06 | pelacakan dibatasi laju (31 permintaan -> 429) | LULUS | API (Supabase tiruan) |
| B07 | admin melihat daftar pesanan lengkap; tanpa token ditolak | LULUS | API (Supabase tiruan) |
| B08 | admin memajukan status berurutan COD: Dikonfirmasi -> Dikemas -> Dikirim -> Selesai | LULUS | API (Supabase tiruan) |
| B09 | lompat status (Dikonfirmasi -> Dikirim) dan mundur ditolak 409 | LULUS | API (Supabase tiruan) |
| B10 | race admin: status berubah antara baca dan tulis -> 409 STATUS_BERUBAH | LULUS | API (Supabase tiruan) |
| B11 | COD tidak boleh diberi status pembayaran Lunas/Ditolak | LULUS | API (Supabase tiruan) |
| B12 | status tidak valid / orderId kosong / pesanan tidak ada | LULUS | API (Supabase tiruan) |
| B13 | hapus pesanan hanya yang berstatus Selesai | LULUS | API (Supabase tiruan) |
| C01 | QRIS: status awal Menunggu verifikasi (BUKAN Lunas) | LULUS | API (Supabase tiruan) |
| C02 | klien tidak bisa membuat pesanan QRIS langsung Lunas | LULUS | API (Supabase tiruan) |
| C03 | QRIS belum Lunas tidak bisa diproses ke Dikemas (409) | LULUS | API (Supabase tiruan) |
| C04 | admin menandai Lunas -> baru boleh Dikemas; Ditolak memblokir proses | LULUS | API (Supabase tiruan) |
| C05 | status pembayaran QRIS di luar daftar ditolak (mis. "Bayar saat terima") | LULUS | API (Supabase tiruan) |
| C06 | perubahan pembayaran tanpa token admin ditolak 401 dan tidak mengubah data | LULUS | API (Supabase tiruan) |
| C07 | bukti pembayaran: hanya data-URL gambar kecil yang disimpan; tidak muncul di pelacakan publik | LULUS | API (Supabase tiruan) |
| D01 | input tidak lengkap/tidak valid -> 400 dan tidak ada pesanan tersimpan | LULUS | API (Supabase tiruan) |
| D02 | produk tidak ada -> 400; stok kurang -> 409; melebihi batas per pesanan -> 400 | LULUS | API (Supabase tiruan) |
| D03 | permintaan berulang: pesanan ke-4 dari IP yang sama dalam 10 menit -> 429 | LULUS | API (Supabase tiruan) |
| D04 | honeypot terisi: pura-pura sukses tetapi tidak menyimpan apa pun | LULUS | API (Supabase tiruan) |
| D05 | CAPTCHA diaktifkan tapi token kosong -> 400 | LULUS | API (Supabase tiruan) |
| D06 | database mati saat POST pesanan -> 500 pesan umum, tanpa kebocoran URL/kunci | LULUS | API (Supabase tiruan) |
| D07 | database mati saat /api/config & /api/promo & tracking -> 500 pesan umum | LULUS | API (Supabase tiruan) |
| D08 | /api/health tidak membocorkan detail error database saat database mati | LULUS | API (Supabase tiruan) |
| D09 | /api/health tidak menampilkan nilai env, hanya true/false | LULUS | API (Supabase tiruan) |
| D10 | akses admin tanpa otorisasi: GET/PUT/DELETE orders & admin-settings -> 401 | LULUS | API (Supabase tiruan) |
| D11 | token admin palsu, dirusak, atau kedaluwarsa ditolak | LULUS | API (Supabase tiruan) |
| D12 | tanpa ORDERS_ADMIN_KEY: admin tidak bisa masuk (gagal tertutup) | LULUS | API (Supabase tiruan) |
| D13 | login admin: sandi salah 401, benar 200 + token; 9 percobaan salah -> 429 | LULUS | API (Supabase tiruan) |
| D14 | CORS: origin asing tidak mendapat header izin; origin sama diizinkan | LULUS | API (Supabase tiruan) |
| D15 | admin-settings: validasi input (harga negatif, kode BELI-BANYAK/ULASAN- dicadangkan) | LULUS | API (Supabase tiruan) |
| D16 | /api/config publik hanya memuat nama/harga/ketersediaan/area (tanpa data pelanggan) | LULUS | API (Supabase tiruan) |
| D17 | metode HTTP tidak didukung -> 405 | LULUS | API (Supabase tiruan) |
| E01 | health?deep=1 tanpa admin: tidak menjalankan pemeriksaan migrasi | LULUS | API (Supabase tiruan) |
| E02 | health?deep=1 admin: semua fungsi & kolom ada -> ok, tanpa mengubah data | LULUS | API (Supabase tiruan) |
| E03 | health?deep=1 admin: migrasi status atomik belum dipasang -> KURANG + petunjuk berkas | LULUS | API (Supabase tiruan) |

## 2. Uji UI browser

| ID | Skenario | Hasil | Lingkungan |
|----|----------|-------|------------|
| U01 | halaman order memuat area dari /api/config | LULUS | Browser Chromium (API dimock) |
| U02 | ringkasan: 3 botol + Sidoarjo = subtotal 60.000, ongkir 12.000, diskon 3.000, total 69.000 | LULUS | Browser Chromium (API dimock) |
| U03 | tidak ada error JavaScript saat memuat halaman order | LULUS | Browser Chromium (API dimock) |
| U04 | COD: konfirmasi tampil dengan nomor pesanan dari server | LULUS | Browser Chromium (API dimock) |
| U05 | COD: browser tidak mengirim harga/total/status ke server | LULUS | Browser Chromium (API dimock) |
| U06 | COD: panel QRIS tidak tampil | LULUS | Browser Chromium (API dimock) |
| U07 | COD: tombol Order Tracking menuju lacak-pesanan.html?id=... | LULUS | Browser Chromium (API dimock) |
| U08 | QRIS: panel tampil dengan total dari server (Rp 69.000) | LULUS | Browser Chromium (API dimock) |
| U09 | QRIS: gambar qris.jpg termuat (bukan rusak) | LULUS | Browser Chromium (API dimock) |
| U10 | QRIS: teks menyebut verifikasi manual, tidak menyebut "lunas/berhasil dibayar" | LULUS | Browser Chromium (API dimock) |
| U11 | klik ganda "Buat Pesanan": hanya 1 permintaan terkirim | LULUS | Browser Chromium (API dimock) |
| U12 | server gagal: struk sukses TIDAK ditampilkan, ada pesan + tautan WhatsApp cadangan | LULUS | Browser Chromium (API dimock) |
| U13 | server gagal: formulir tetap terisi dan tombol aktif kembali | LULUS | Browser Chromium (API dimock) |
| U14 | admin: sandi salah menampilkan pesan error dan panel pesanan tetap tertutup | LULUS | Browser Chromium (API dimock) |
| U15 | admin: klik Lunas memunculkan dialog peringatan verifikasi mutasi QRIS | LULUS | Browser Chromium (API dimock) |
| U16 | admin: membatalkan dialog -> TIDAK ada permintaan PUT (belum Lunas) | LULUS | Browser Chromium (API dimock) |
| U17 | admin: menyetujui dialog -> PUT statusPembayaran=Lunas terkirim | LULUS | Browser Chromium (API dimock) |
| U18 | admin: tombol Ditolak tidak memunculkan dialog Lunas | LULUS | Browser Chromium (API dimock) |

## 3. BELUM DIUJI (butuh akses/lingkungan yang tidak tersedia)

| Skenario | Status | Yang dibutuhkan |
|----------|--------|-----------------|
| Kebenaran fungsi SQL (`quote_order`, `create_order`, voucher, kuota promo, stok atomik) di Postgres | BELUM DIUJI | Jalankan `supabase/test.sql` dan `test_shipping_quotes.sql` di Supabase |
| `transition_order_status` dan `confirm_order_shipping` di Postgres | BELUM DIUJI | `supabase/test_order_status_atomic.sql` setelah migrasi |
| Koneksi ke proyek Supabase asli, RLS/grants di dashboard | BELUM DIUJI | Akses dashboard Anda; `/api/health` setelah deploy |
| Penyimpanan pesanan COD di Supabase nyata | BELUM DIUJI | Deployment Preview + `smoke-test.mjs --order` |
| Deployment Vercel (build, env var, log) | BELUM DIVERIFIKASI | Akses Vercel Anda |
| Situs produksi saat ini | BELUM DIPERIKSA | — |
| Email notifikasi (Resend) dan WhatsApp (Fonnte) | BELUM DIUJI | Kunci layanan di Vercel |
| Transaksi QRIS nyata dan pencocokan mutasi | BELUM DIUJI | Transaksi nominal kecil + aplikasi penyedia QRIS |
| Keabsahan/keaktifan `qris.jpg` (dapat dipindai, milik merchant) | BELUM DIUJI | Pindai dengan aplikasi bank/e-wallet. Hanya terbukti: gambar termuat di halaman (U09). |
| Uji beban / banyak pesanan serentak pada Postgres | BELUM DIUJI | Staging |
| Halaman Order Tracking di browser, halaman testimoni, analitik | BELUM DIUJI | Hanya API-nya yang diuji |
| Perilaku pada Safari/Firefox/HP | BELUM DIUJI | Hanya Chromium |
