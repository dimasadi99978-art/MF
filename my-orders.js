// Mengingat pesanan pelanggan di perangkat ini (localStorage) agar nomor pesanan & nomor HP
// terisi otomatis di halaman Order Tracking dan Ulasan, walaupun situs sudah ditutup lalu dibuka lagi.
// Hanya disimpan: nomor pesanan, nomor HP, nama depan, dan penanda selesai. Tidak ada data pembayaran/alamat.
var MyOrders = (function () {
    'use strict';
    var KEY = 'mf_my_orders', MAX = 8;
    function read() {
        try { var l = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(l) ? l.filter(function (o) { return o && o.id; }) : []; }
        catch (e) { return []; }
    }
    function write(l) { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, MAX))); } catch (e) { /* penyimpanan dinonaktifkan */ } }
    function add(o) {
        if (!o || !o.id) return;
        var id = String(o.id).trim().toUpperCase();
        var list = read(), old = list.filter(function (x) { return x.id === id; })[0];
        list = list.filter(function (x) { return x.id !== id; });
        list.unshift({
            id: id,
            telepon: String(o.telepon || (old && old.telepon) || '').trim(),
            nama: String(o.nama || (old && old.nama) || '').trim().split(/\s+/)[0].slice(0, 30),
            selesai: Boolean(o.selesai || (old && old.selesai)),
            // Penanda: ulasan untuk pesanan ini sudah dikirim (dipakai memulihkan voucher dari server bila hilang di perangkat).
            ulasan: Boolean(o.ulasan || (old && old.ulasan)),
            at: Date.now()
        });
        write(list);
    }
    function find(id) { id = String(id || '').trim().toUpperCase(); return read().filter(function (x) { return x.id === id; })[0] || null; }
    function latest() { return read()[0] || null; }
    function latestDone() { return read().filter(function (x) { return x.selesai; })[0] || null; }
    // Pesanan terbaru yang belum diulas; pesanan Selesai didahulukan agar voucher langsung bisa terbit.
    function latestToReview() { var l = read().filter(function (x) { return !x.ulasan; }); return l.filter(function (x) { return x.selesai; })[0] || l[0] || null; }
    function markReviewed(id) { var o = find(id); if (o) add({ id: o.id, ulasan: true }); }
    function forget() { try { localStorage.removeItem(KEY); } catch (e) {} }
    return { add: add, markReviewed: markReviewed, find: find, latest: latest, latestDone: latestDone, latestToReview: latestToReview, all: read, forget: forget };
})();
