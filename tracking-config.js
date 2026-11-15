// Konfigurasi peta pelacakan. Dimuat di halaman lacak dan halaman kurir.
// ISI koordinat titik awal (lokasi farm/gudang) sesuai tempat pesanan berangkat.
window.MF_TRACK = {
    // KOORDINAT FARM BELUM DIKONFIRMASI. Nilai di bawah hanya titik tengah Surabaya agar peta punya pandangan awal.
    // Selama originConfirmed=false, peta TIDAK menampilkan penanda farm maupun garis dari farm.
    // Isi lat/lng yang benar (klik kanan lokasi farm di Google Maps untuk menyalin koordinat), lalu ubah originConfirmed menjadi true.
    origin: { lat: -7.2575, lng: 112.7521, name: 'Margaluyu Farm' },
    originConfirmed: false,
    // Peta dasar: lihat peta-dasar.js (CARTO lalu OpenStreetMap sebagai cadangan otomatis, tanpa API key).
    // Untuk trafik besar, isi `tiles: [{ name, url, sub, attr }]` dengan penyedia berlangganan (MapTiler/Stadia/Mapbox).
    pollMs: 8000        // interval ambil posisi kurir di sisi pelanggan
};
