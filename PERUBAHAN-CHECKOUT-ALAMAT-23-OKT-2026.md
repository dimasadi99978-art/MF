# Perubahan Checkout Alamat — 23 Oktober 2026

## Perubahan pada `order-sekarang.html`
- Panel **Alamat Pengiriman** sekarang tertutup saat halaman pertama kali dibuka dan dapat dibuka melalui judulnya.
- Ringkasan panel menjelaskan bahwa pelanggan dapat membuka panel untuk mengisi alamat dan menghitung ongkir.
- Petunjuk alamat menjelaskan pencocokan area dan perhitungan ongkir dari konfigurasi tarif yang tersedia.
- Kota tetap terisi `Surabaya` sebagai nilai awal, tetapi tidak lagi diwajibkan. Pelanggan di luar Surabaya perlu mengganti kota bila relevan.
- Validasi checkout tetap mewajibkan alamat jalan/nomor serta kelurahan atau kecamatan. Jika belum lengkap, panel dibuka otomatis dan fokus diarahkan ke kolom yang perlu diisi.
- Mekanisme konfigurasi harga/area, deteksi zona, kalkulasi total, dan validasi server yang sudah ada dipertahankan.

## Batas pengujian
- Pemeriksaan sintaks JavaScript untuk skrip inline checkout berhasil dengan `node --check`.
- Pengujian browser end-to-end dan pengujian terhadap Supabase/Vercel produksi belum dijalankan.
- Sistem saat ini mencocokkan alamat terhadap kata kunci area yang dikonfigurasi; perubahan ini tidak menambahkan geocoding/peta dan tidak menjamin alamat bebas yang tidak ada dalam kata kunci dapat dikenali.
