# Perubahan kolom pilih file (14 Nov 2026)

Berlaku untuk **Bukti pembayaran** (`order-sekarang.html`) dan **Foto ulasan** (`rating.html`).

- Tampilan: tombol "Pilih file" + teks "Belum ada file". Setelah memilih: tombol menjadi "Ganti file", nama file tampil, dan muncul tombol "Hapus".
- Thumbnail dan pratinjau foto dihapus; hanya nama file yang ditampilkan.
- Satu komponen dipakai di kedua halaman: `css/file-picker.css` (kelas `.fpick`, `.fpick-btn`, `.fpick-name`, `.fpick-clear`, `.fpick-note`).
- Kolom bukti pembayaran tetap terkunci sampai alamat/ongkir terisi (tombol dinonaktifkan), sama seperti sebelumnya.
- Kode lama yang tidak terpakai dibersihkan: aturan unggah di `css/polish.css`, `css/refine.css`, CSS inline `order-sekarang.html`, fungsi `photoPicker` di `refine.js`, serta lightbox dan skrip inline foto di `rating.html` / `rating.js`.
- ID yang dipakai logika tetap sama: `foto`, `photoRemove`, `buktiFile`, `buktiBtn`, `buktiDel`.

## Pembaruan: alas kolom + nama menu

- Kolom pilih file kini berada di dalam kotak isian (alas krem, garis tipis, sudut 12px) agar tidak polos. Saat ada file, kotak memakai warna "terpilih" yang sama dengan opsi pembayaran (hijau tua + latar hijau muda). Fokus keyboard ditandai pada kotaknya.
- Semua penyebutan "Lacak Pesanan" diganti menjadi "Order Tracking" (menu di index, produk, order; dokumen `.md`; komentar CSS; label uji). Nama berkas `lacak-pesanan.html` dan tautannya tidak diubah agar alamat halaman tetap sama.

## Pembaruan: kartu lebih kecil, pesan dihapus, filter testimoni

- Kartu pilih file diperkecil (tinggi 42px, tombol 32px, teks 13px, tanpa garis ganda saat terpilih).
- Pesan "Masukan Anda sudah kami simpan di perangkat ini, tetapi BELUM terkirim..." (`rating.js`) dihapus. Data tetap tersimpan dan dikirim ulang otomatis; detail galat hanya masuk log konsol. Setelah kirim, halaman menampilkan kartu terima kasih yang biasa.
- Pesan "Testimoni terbaru belum dapat dimuat dari server..." beserta tautan "Coba lagi" (`testimoni.js`) dihapus.
- Halaman Testimoni: kolom "Cari ulasan" dihapus (HTML dan JS). "Urutkan" kini satu baris ringkas rata kanan tanpa kartu pembungkus: tinggi 36px, panah kustom, fokus keyboard jelas.

## Pembaruan: urutan testimoni dan kirim struk ke WhatsApp

- Halaman Testimoni: daftar "Urutkan" kini kustom dan ringkas (baris 32px, teks 13px) menggantikan daftar bawaan browser yang besar. Bisa dipakai dengan keyboard (panah, Home/End, Enter, Esc). `<select>` asli tetap menjadi sumber nilai.
- Popup pesanan (`order-sekarang.html`): tombol "Kirim struk lewat WhatsApp" kini menyertakan gambar struk (JPG), bukan hanya teks.
  - HP / browser yang mendukung berbagi berkas: lembar Bagikan terbuka berisi gambar struk + teks pesanan; pilih WhatsApp lalu kontak Margaluyu Farm (tanpa teks petunjuk tambahan).
  - Komputer: gambar struk disalin ke clipboard (atau diunduh bila tidak bisa), chat WhatsApp dibuka dengan teks pesanan, lalu tempel gambarnya.
  - Tautan `wa.me` sendiri hanya bisa membawa teks; WhatsApp tidak mengizinkan lampiran gambar lewat tautan.
