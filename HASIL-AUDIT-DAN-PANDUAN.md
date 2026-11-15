# Hasil audit, perbaikan, pengujian, dan panduan deploy

## 1. Penyebab masalah pelacakan
Bukti dari tangkapan layar: setelah order, halaman struk menampilkan "tersimpan di perangkat ini" dengan nomor sementara berakhiran `-T76BV` (5 karakter, berawalan T). Nomor resmi dari server selalu 6 karakter acak (`MF-YYMMDD-XXXXXX`). Artinya `POST /api/orders` TIDAK berhasil: pesanan hanya ada di antrean perangkat, tidak ada di tabel `orders`, sehingga Order Tracking memang tidak menemukannya.

Kegagalan POST dianggap "bisa diulang" (antrean perangkat) untuk status 5xx, 404, 405, 408, dan 429. Penyebab pasti di produksi **belum dapat saya pastikan** karena saya tidak punya akses ke Vercel/Supabase Anda. Kandidat terkuat dari pembacaan kode:
1. **429 (batas laju)**: server hanya menerima 3 pesanan per 10 menit per IP. Pengujian berulang dari jaringan yang sama langsung memicu ini.
2. **5xx**: `create_order` / tabel / kolom di Supabase belum sesuai (migrasi belum lengkap) atau `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` salah.
3. **404/405**: fungsi API tidak ikut ter-deploy.

Cara memastikan (tanpa membagikan kunci apa pun): buka `https://DOMAIN-ANDA/api/health` lalu, sebagai admin, `/api/health?deep=1`. Sekarang halaman struk juga menampilkan kode alasan kegagalan (mis. "kode 503") pada kotak kuning.

### Cacat kode nyata yang saya temukan dan perbaiki
| # | Cacat | Dampak | Perbaikan |
|---|-------|--------|-----------|
| 1 | Kirim ulang dari antrean memakai token CAPTCHA yang kosong (widget tidak ada di halaman struk) | Jika Turnstile aktif, pesanan tertunda **tidak pernah** bisa masuk | Kirim ulang membawa `retry:true`; server melewati CAPTCHA hanya untuk retry, dengan batas laju lebih ketat (6/jam/IP) |
| 2 | Tidak ada perlindungan duplikat | Respons hilang di tengah jalan lalu kirim ulang = pesanan ganda | Server mengembalikan pesanan yang sudah ada bila isi identik dalam 24 jam (`duplicate:true`) |
| 3 | Penyebab kegagalan tidak terlihat | Pelanggan/admin tidak tahu kenapa pesanan tertahan | Kode & alasan disimpan di antrean dan ditampilkan di struk; tombol "Kirim ulang sekarang" |
| 4 | Status awal "Belum terkirim" tampil sebagai judul dan membuat timeline kosong | Membingungkan | Ditampilkan sebagai "Pesanan diterima" / "Belum masuk sistem" |
| 5 | Halaman kurir error bila Leaflet gagal dimuat | GPS tidak bisa dibagikan | Berbagi lokasi tetap berfungsi tanpa peta |
| 6 | Koordinat contoh farm bisa tampil sebagai lokasi sebenarnya | Penanda farm salah | `originConfirmed:false` menyembunyikan penanda/garis farm sampai Anda mengisi koordinat benar |

Yang diperiksa dan **tidak** ditemukan salah: normalisasi HP (`08`/`62`/`+62` konsisten di `api/orders.js`, `api/tracking.js`, `orders-store.js`), pencocokan nomor pesanan (huruf besar, karakter dibersihkan), struktur JSON (`json.order.orderId`), pencocokan nomor HP sebelum detail dibuka.

## 2. Daftar file yang diubah / ditambah
Diubah: `api/orders.js`, `api/health.js`, `orders-store.js`, `order-sekarang.html`, `struk-pesanan.html`, `receipt-image.js`, `lacak-pesanan.html`, `lacak-pesanan.js`, `admin-pesanan.html`, `product.html`, `css/redesign.css`, `vercel.json`, `tests/api.test.mjs`, `tests/fake-supabase.mjs`, `supabase/URUTAN-MIGRASI.md`.
Baru: `api/tracking.js`, `kurir.html`, `kurir.js`, `lacak-peta.js`, `tracking-config.js`, `css/lacak-peta.css`, `css/lacak-final.css`, `supabase/migration_pelacakan_peta.sql`, `tests/tracking.test.mjs`, `poster-promo-susu-kambing.jpg`, `PANDUAN-PETA-PELACAKAN.md`, dokumen ini.

## 3. Hasil pengujian
Pengujian memakai **Supabase tiruan di memori** dan API yang ditiru di browser. Tidak ada yang diuji ke Supabase/Vercel sungguhan.

**LULUS** (otomatis, `node --test tests/api.test.mjs tests/tracking.test.mjs`: 74 tes)
- Order COD/QRIS diterima server dan nomor resmi dibuat server; validasi, stok, promo, ongkir (tes lama + baru).
- Retry: isi sama = pesanan yang sama (tidak ganda); isi beda = pesanan baru; CAPTCHA aktif tidak menghalangi retry; retry dibatasi 6/jam.
- Pelacakan: HP benar / salah / format `08`, `62`, `+62`, `0812-3456-7890`; nomor tidak ada = 404; status bukan Dikirim = posisi tidak dibuka.
- Peta kurir: tautan hanya bisa dibuat admin; token salah ditolak; posisi + rute + ETA tersimpan dan terbaca pelanggan; konfirmasi tiba; tautan kedaluwarsa = 410; koordinat tidak valid ditolak; token tidak tersimpan polos.
- Browser (Chromium, dengan CSP yang sama dengan `vercel.json`): antrean pesanan tertunda gagal (503) lalu pulih, nomor sementara diganti nomor resmi (alias), tidak ada sisa antrean; pelacakan memakai nomor sementara menemukan nomor resmi; pembaruan status otomatis (Dikemas lalu Dikirim tanpa muat ulang); unduh struk JPG di desktop dan di emulasi HP (jendela "Struk siap"); tidak ada JavaScript error dan tidak ada berkas 404 pada 8 halaman, di lebar HP dan desktop; tidak ada gulir horizontal.

**GAGAL / temuan** (sudah diperbaiki, lalu diuji ulang): halaman kurir error tanpa Leaflet; tes health lama gagal setelah ada pemeriksaan tabel baru (fake DB diperbarui).

**BELUM DIUJI**
- Tampilan peta Leaflet (tile, penanda, garis rute): sandbox tanpa internet, Leaflet tidak termuat. Hanya tata letak yang diperiksa.
- Izin GPS di HP sungguhan, akurasi, dan penggunaan baterai.
- Unduh/Bagikan struk di iOS Safari, Android Chrome, dan browser dalam aplikasi sungguhan (hanya emulasi).
- Layar tablet secara khusus (diuji 390 px dan 1280 px).

**MEMBUTUHKAN AKSES PRODUKSI**
- Penyimpanan nyata ke Supabase, fungsi SQL `create_order`, RLS, variabel lingkungan Vercel.
- Nominatim (pencarian koordinat alamat) dan OSRM (rute/ETA): butuh internet; ada cadangan estimasi garis lurus bila OSRM gagal.
- Deploy ke Vercel dan batas fungsi (proyek kini 11 fungsi API; batas paket Hobby 12).

## 4. Migrasi Supabase
Pastikan urutan di `supabase/URUTAN-MIGRASI.md` sudah dijalankan. **Baru:** `supabase/migration_pelacakan_peta.sql` (tabel `order_tracking`; tidak menghapus apa pun; aman diulang). Tidak ada migrasi lain yang ditambahkan.

## 5. Deploy ke GitHub dan Vercel
1. Backup database lebih dulu (fitur backup yang ada).
2. Salin isi ZIP ke repo (timpa berkas). `git add -A && git commit -m "Perbaikan order, struk, lacak, peta kurir" && git push`.
3. Vercel otomatis deploy. Tidak ada Environment Variable baru yang wajib. Opsional: `OSRM_URL` (server rute sendiri).
4. Jalankan `migration_pelacakan_peta.sql` di Supabase SQL Editor.
5. Isi koordinat farm di `tracking-config.js`, set `originConfirmed: true`, deploy ulang.

## 6. Pengujian setelah deploy (urut)
1. Buka `/api/health`, lalu `/api/health?deep=1` (login admin): semua `ok`, termasuk `tabel order_tracking`.
2. Buat pesanan COD dari HP. Struk harus berjudul "Pesanan tersimpan" dan nomornya berakhiran 6 karakter acak. Jika muncul kotak kuning, baca kode alasannya (429 = tunggu 10 menit / ganti jaringan; 5xx = cek health).
3. Cek di Supabase tabel `orders`: baris pesanan ada.
4. Order Tracking dengan nomor + HP: ada hasil. Coba HP salah: ditolak.
5. Admin: ubah status ke Dikirim, klik "Buat tautan kurir (peta)", buka tautan di HP kurir, izinkan GPS.
6. Di HP lain buka Order Tracking: marker kurir bergerak, rute + perkiraan tiba muncul. Tekan "Pesanan sudah sampai" di HP kurir.
7. Tunggu 18 jam atau ubah `expires_at` untuk menguji tautan kedaluwarsa.

## 7. Pembaruan lanjutan
- **Popup transaksi** (`order-sekarang.html`): setelah pesanan dibuat, popup bergaya aplikasi mobile banking muncul di halaman order (centang beranimasi, total, detail, Lacak/Bayar QRIS, Unduh struk, Selesai). Halaman `struk-pesanan.html` tetap ada untuk pembayaran QRIS dan membuka struk kapan saja.
- **Pembuatan struk** (`receipt-image.js`): pratinjau kini digambar langsung dari kanvas (tanpa gambar blob), dicoba ulang dalam mode ringan bila gagal, dan pesan galatnya ditampilkan. Pada tangkapan layar Anda, pratinjau struk tampil sebagai gambar rusak; penyebab pastinya belum bisa saya reproduksi di sandbox (semua variasi data lolos), jadi jika masih muncul, pesan galat di kotak kuning pratinjau akan menunjukkan penyebabnya. **Status: perlu dikonfirmasi di perangkat Anda.**
- **Opsi pengiriman**: tab bergaris bawah tanpa kartu. **Ringkasan pembayaran**: baris tidak lagi menyempit akibat aturan CSS lama.
- **Status pesanan** (`lacak-pesanan.html`): horizontal dengan ikon; peta hanya muncul saat status Dikirim, sebelum itu ada keterangan bahwa peta akan muncul.

## 8. Peta di halaman lacak
- Sebelum dikirim (Belum terkirim / Dikonfirmasi / Dikemas): peta menampilkan **titik perkiraan alamat tujuan** (dicari server dari alamat lewat Nominatim, disimpan di `order_tracking`, tidak dicari berulang). Posisi kurir TIDAK dikirim ke pelanggan sebelum status Dikirim. Jika alamat tidak bisa ditandai, peta disembunyikan dan ada keterangan.
- Saat Dikirim: posisi kurir live (kurir mengirim tiap 6 detik, pelanggan memperbarui tiap 8 detik), sisa rute, perkiraan tiba. Saat Selesai peta ditutup.
- Syarat agar live berfungsi: (1) migrasi `migration_pelacakan_peta.sql` sudah dijalankan; (2) admin menekan "Buat tautan kurir (peta)" setelah status Dikirim dan mengirim tautannya ke kurir; (3) kurir membuka tautan di HP, menekan "Mulai bagikan lokasi", mengizinkan GPS, dan membiarkan halaman terbuka.
- Pengujian tambahan: logika peta dengan Leaflet tiruan (pratinjau, tanpa tujuan, menunggu kurir, live + rute + ETA, bergerak, sinyal terputus, tiba) dan halaman kurir (izin GPS diberikan/ditolak, pengiriman posisi ditahan 6 detik, konfirmasi tiba, tautan tanpa token). Tampilan peta asli (tile) tetap BELUM DIUJI karena tidak ada internet di sandbox.

### Pembaruan peta (lanjutan)
- Peta selalu tampil selama pesanan belum Selesai dan selalu menjelaskan keadaannya lewat label di peta: titik alamat tepat, perkiraan area (bila alamat tidak bisa dicari, memakai pusat perkiraan sisi Surabaya, tidak dipakai untuk rute), "alamat belum bisa ditandai", atau "peta belum aktif di server (migrasi belum dijalankan)".
- `/api/tracking` tidak lagi error 500 bila tabel `order_tracking` belum ada; mengembalikan penanda `unavailable` agar halaman tetap jalan.
- Halaman lacak dirapikan: struk dilipat di HP, jadwal tidak ditampilkan ganda, indikator "Live" sejajar nomor pesanan.
- Tes: 79 lulus (`node --test tests/api.test.mjs tests/tracking.test.mjs`).

## 9. Pesanan masih tertahan dan gambar peta tidak muncul
**Pesanan tertahan:** nomor yang berawalan `T` + 4 karakter (mis. `TEJ3B`) adalah nomor sementara dari perangkat; nomor resmi server selalu 6 karakter acak. Selama nomornya berawalan T, `POST /api/orders` belum diterima server. Sekarang respons gagal membawa **kode penyebab** yang tampil di popup ("Kode gangguan: ..."):

| Kode | Artinya | Tindakan |
|------|---------|----------|
| `ENV_BELUM_DIISI` | `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` belum ada di Vercel | Isi di Settings > Environment Variables, lalu Redeploy |
| `KUNCI_DB_DITOLAK` | Kunci Supabase salah / bukan service_role | Salin ulang kunci yang benar |
| `FUNGSI_DB_TIDAK_ADA` | Fungsi `create_order` belum ada di database | Jalankan `supabase/schema.sql` lalu migrasi sesuai `URUTAN-MIGRASI.md` |
| `KOLOM_DB_TIDAK_ADA` / `TABEL_DB_TIDAK_ADA` | Struktur tabel belum mutakhir | Jalankan migrasi yang belum dijalankan |
| `DB_TIDAK_TERJANGKAU` | Server tidak bisa menghubungi Supabase | Periksa `SUPABASE_URL`, status proyek Supabase (tidak dijeda) |
| `DB_ERROR` | Kesalahan lain | Lihat log fungsi di Vercel |
| (HTTP 429) | Batas 3 pesanan/10 menit per jaringan | Tunggu atau ganti jaringan |

Selama pesanan belum diterima server, popup menyediakan tautan **Kirim pesanan ini lewat WhatsApp** (pesan sudah terisi) agar pesanan tidak hilang.

**Gambar peta:** `peta-dasar.js` mencoba CARTO lalu OpenStreetMap secara otomatis; bila keduanya gagal tampil catatan di peta. CSP `vercel.json` kini mengizinkan kedua penyedia.

## 10. Struk asli di popup, logo resmi, dan diagnosis "Belum masuk sistem"
- Popup: fase 1 (centang + nominal + status, sekitar 3 detik, bisa dilewati) lalu mengecil menjadi bilah ringkas dan menampilkan **struk asli** (gambar yang sama persis dengan berkas unduhan). Halaman Lacak dan Struk memakai gambar yang sama.
- **Logo resmi** `img/logo-mf.png` kini di paling atas semua struk (popup, halaman struk, halaman lacak, dan JPG unduhan).
- Perbaikan bug tampilan: status "Tersimpan di sistem" memakai kelas `ok` yang bentrok dengan kelas pembungkus popup sehingga menggelapkan dan menimpa teks.
- "Belum masuk sistem" adalah status yang jujur: server belum menerima pesanan. Popup menjalankan pemeriksaan `/api/health` otomatis dan menuliskan penyebabnya (variabel belum terisi, database gagal, fungsi `create_order` belum ada, atau batas 429), dengan tombol **Kirim ulang sekarang** dan jalur **WhatsApp**.
- Audit statis: kunci payload API cocok dengan fungsi SQL `create_order` dan kolom tabel `orders` (tidak ada ketidakcocokan kode). Karena itu penyebabnya ada pada keadaan server/database di Vercel-Supabase Anda, yang hanya bisa dipastikan dari kode gangguan/diagnosis di popup. Jumlah fungsi API: 11 (batas paket Hobby: 12).

## 11. Pembayaran QRIS di halaman order (wajib bayar sebelum memesan)
- Memilih QRIS menampilkan **kode QRIS dan nominal pasti di formulir order**. Sebelum alamat/ongkir terisi, kode dikaburkan dan tombol terkunci.
- **Bukti pembayaran wajib** diunggah (JPG/PNG/WebP). Gambar otomatis diperkecil di browser ke maksimal ~90 ribu karakter (batas server 100 ribu). Tombol **Buat Pesanan** tetap nonaktif sampai bukti terlampir.
- **Server ikut menegakkan aturan ini**: `POST /api/orders` untuk QRIS tanpa bukti valid dibalas 400 dan tidak menyimpan pesanan.
- QRIS statis tidak bisa diverifikasi otomatis: bukti yang diunggah dipakai admin untuk memeriksa pembayaran (status pembayaran awal tetap "Menunggu verifikasi"; admin mengubah ke Lunas). Bukti tampil di halaman admin pesanan.
- Halaman struk untuk pesanan QRIS kini menampilkan keterangan "Pembayaran QRIS sedang diperiksa", bukan instruksi bayar lagi.
- Tes: 84 lulus (`node --test tests/api.test.mjs tests/tracking.test.mjs tests/diagnosa.test.mjs`).
