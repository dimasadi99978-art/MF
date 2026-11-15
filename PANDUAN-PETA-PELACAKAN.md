# Peta pelacakan kurir (status Dikirim)

## Cara kerja
1. Admin ubah status pesanan ke **Dikirim**, lalu klik **Buat tautan kurir (peta)** di kartu pesanan.
2. Tautan disalin otomatis. Kirim ke kurir lewat WhatsApp. Berlaku 18 jam; membuat tautan baru mematikan yang lama.
3. Kurir buka tautan di HP, tekan **Mulai bagikan lokasi**, izinkan GPS, biarkan halaman terbuka.
4. Pelanggan membuka Order Tracking: peta menampilkan posisi kurir, sisa rute, dan perkiraan tiba. Peta diperbarui tiap 12 detik.
5. Kurir menekan **Pesanan sudah sampai**. Admin tetap yang menandai status Selesai.

## Langkah pasang (urut)
1. Supabase SQL Editor: jalankan `supabase/migration_pelacakan_peta.sql`.
2. Edit `tracking-config.js`: isi `origin.lat/lng` dengan koordinat farm yang benar, lalu ubah `originConfirmed` menjadi `true`. Selama `false`, peta tidak menampilkan penanda/garis farm.
3. Deploy ulang (`vercel.json` sudah diubah: izin geolokasi untuk situs sendiri dan peta CARTO).
4. Tes: buat pesanan uji, ubah ke Dikirim, buat tautan kurir, buka di HP.

## Catatan penting
- Titik tujuan dicari otomatis dari alamat (OpenStreetMap Nominatim). Jika gagal, kurir mengetuk peta untuk menandai titiknya.
- Rute dan ETA memakai server OSRM publik. Cukup untuk skala kecil; untuk trafik besar isi env `OSRM_URL` (server sendiri) atau ganti penyedia.
- Peta dasar CARTO tanpa API key. Untuk trafik besar, pakai penyedia berlangganan lewat `tileUrl`.
- Posisi kurir hanya bisa dibaca bila nomor pesanan + nomor HP cocok dan status = Dikirim. Token kurir disimpan sebagai hash.
- Tes API: `node --test tests/tracking.test.mjs`.
