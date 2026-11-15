# Perubahan: navbar floating pill, tab bar HP, dropdown order

## File baru
- css/navpill.css, navpill.js : navbar pill (>= 900px) dan tab bar bawah (< 900px). Dimuat di 10 halaman ber-header.
- css/dropdown.css, dropdown.js : dropdown untuk Area pengiriman, Bagian Surabaya, Metode pembayaran (order-sekarang.html).

## Perubahan di order-sekarang.html (hanya 4 titik kecil)
- Tambah link css/dropdown.css dan script dropdown.js.
- setWilayah() dan labelPilihanWilayah() memanggil window.mfDDSync() agar dropdown mengikuti perubahan lewat skrip.
- fokusBagian() memfokuskan dropdown (radio asli kini tersembunyi).
Radio asli tetap menjadi sumber nilai, jadi logika harga, ongkir, validasi, dan kirim pesanan tidak berubah.

## Perilaku navbar
- Desktop: pill melayang + blur. Di puncak halaman tampil penuh; setelah scroll > 72px mengecil jadi ikon; hover/fokus melebar.
- Layar sentuh besar (hover: none): pill tidak diciutkan agar menu selalu terbaca.
- HP/tablet portrait: baris merek + tombol WhatsApp di atas, tab bar bawah (Beranda, Produk, Pesan, Lacak, Kontak).
  Tab bar disembunyikan saat keyboard layar terbuka. Bar "Pesan" mengambang di beranda (.lp-sticky) dinonaktifkan di HP.

## Rollback
Hapus baris <link ... navpill.css> dan <script ... navpill.js> dari halaman, serta dropdown.css/dropdown.js dari order-sekarang.html.

## Revisi 2
- Tab bar HP mengikuti referensi: ikon Produk = tas, Pesan = keranjang di kapsul hijau tua, tab aktif berkapsul lembut.
- Menu Kualitas...FAQ di beranda (lp-subnav) dihapus dari index.html.
- Transisi antarhalaman: View Transitions lintas dokumen (navbar dan tab bar tetap di tempat, isi halaman fade + geser);
  browser lama memakai fade sederhana (navpill.js).
- Markup ikon dan tab bar kini statis di HTML (tidak lagi disisipkan JS) agar tidak berkedip saat pindah halaman.
- Pill hanya mengecil pada halaman yang bisa di-scroll > 400px. Halaman pendek selalu tampil penuh.

## Revisi 3
- HP: bar atas kini pill melayang (merek + tombol WhatsApp) dan sticky, ikut menempel saat di-scroll.
- Transisi antarhalaman: View Transitions diganti fade seragam di semua browser (navpill.js + akhir css/navpill.css).
  Keluar 180 ms (memudar), masuk 320 ms (memudar-naik). Latar html disamakan agar tidak ada kilatan putih.

## Revisi 4
- Ikon pesan diganti logo WhatsApp (tombol bulat di bar atas HP, tab Kontak, menu Hubungi Kami) di semua halaman.
- Poster di product.html diperkecil di HP (190 px; 170 px di layar sangat kecil) via css/redesign.css.
- Dropdown area pengiriman & metode pembayaran: ikon diganti set ikon garis yang konsisten (pin, truk, uang, QR, dompet), chip ikon hijau lembut, animasi buka/tutup lebih halus (dropdown.js, css/dropdown.css).
- File baru css/motion.css + motion.js dimuat di SEMUA halaman:
  - hover pill navbar lebih lambat dan mulus (.85 s, teks muncul menyusul);
  - fade antarhalaman: hanya isi halaman yang memudar, navbar & tab bar tetap (menggantikan fade lama di navpill.js);
  - tombol: terangkat saat hover, menyusut saat ditekan, riak sentuhan, panah bergeser.
- Semua animasi mati otomatis jika perangkat memakai "kurangi gerakan".
Rollback: hapus baris motion.css/motion.js dari halaman.

## Revisi 5
- Poster produk di HP diperbesar: 250 px (220 px di layar sangat kecil).
- Pill navbar mengecil/melebar BERURUTAN (motion.js + css/motion.css): pill menyusut dari ujung, lalu label hilang satu per satu
  dari kanan (Pesan sekarang, Hubungi Kami, Lacak, Produk, Beranda, nama merek). Melebar = urutan terbalik.
  Kecepatan diatur konstanta SPEED di motion.js (px/detik; makin kecil makin pelan, saat ini 520).

## Revisi 6
- Pill navbar: mengecil DAN melebar sama-sama berurutan dari kanan ke kiri (Pesan sekarang, Hubungi Kami, Lacak, Produk, Beranda, nama merek).
- Gerak dibuat kontinu: titik awal max-width tiap label = lebar teks nyata (sebelumnya ada waktu mati yang terasa tersendat),
  jeda 0,12 s dihapus, tinggi/padding pill ikut linear. Kecepatan: konstanta SPEED di motion.js.

## Revisi 7
- Pill navbar DIAM (tanpa animasi melebar/menciut) di semua halaman, termasuk beranda saat belum di-scroll. Animasi ukuran hanya
  menyala (kelas `np-anim` pada header, dipasang navpill.js) setelah scroll sungguhan mengubah keadaan pill pada halaman yang bisa di-scroll.
  Pemulihan posisi scroll saat muat ulang tidak dianimasikan.
- Micro interaction tetap ada: hover terangkat, klik menyusut lalu memantul kembali + riak sentuhan pada tautan menu (motion.js, css/motion.css).
- Animasi saat di-scroll dan hover-saat-menciut dipertahankan, kini ~2x lebih cepat (SPEED 520 -> 1000 di motion.js),
  fade label lebih lembut, dan background/bayangan transisi lebih singkat.
Rollback: kembalikan css/motion.css, motion.js, navpill.js dari revisi 6.

## Revisi 8 (formulir order)
- Judul "Pengiriman", "Pesanan", "Pembayaran" dihapus dari order-sekarang.html.
- Metode pembayaran kembali menjadi dropdown (ikon garis: uang tunai, QR) dengan sub judul "Metode pembayaran". Sumber dropdown kini #metodeBayar (dropdown.js).
- Tanggal pengiriman kini kalender dropdown (dropdown.js + css/dropdown.css): ikon kalender, rentang tersedia dari atribut min/max input,
  tombol "Hari ini" dan "Hapus tanggal", navigasi keyboard (panah, PageUp/PageDown, Enter, Esc). Input type=date asli tetap menjadi sumber nilai.
- Animasi klik: pemicu, opsi, hari kalender, dan tombol kalender menyusut saat ditekan + riak sentuhan (motion.js); opsi memantul sebelum daftar menutup.
- Pill navbar: SPEED 700 (lebih pelan dari 1000). Poster HP: 320 px (280 px di layar sangat kecil).
Rollback: kembalikan dropdown.js, css/dropdown.css, order-sekarang.html dari revisi sebelumnya.
