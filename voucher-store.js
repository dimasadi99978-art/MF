// Penyimpanan voucher apresiasi di perangkat pelanggan, dengan pemulihan dari server.
//
// Prinsip "voucher tidak boleh hilang" (berlapis, dari yang paling kuat):
//  1. SERVER adalah sumber kebenaran: voucher tersimpan di database, terikat ke NOMOR PESANAN, dan satu pesanan
//     hanya punya satu voucher. Menekan "Tampilkan voucher saya" dengan nomor pesanan yang sama selalu
//     mengembalikan voucher yang sama (idempotent), bahkan bila penerbitan sempat gagal.
//  2. PERANGKAT: voucher disalin ke localStorage (daftar, bukan satu slot), dan perangkat diminta menandai
//     penyimpanan sebagai "persisten" agar tidak ikut terhapus saat memori penuh.
//  3. PEMULIHAN OTOMATIS: bila voucher belum ada di perangkat tetapi perangkat tahu pesanan yang sudah diulas,
//     voucher diambil ulang dari server saat halaman Rating atau Order dibuka.
//  4. SALINAN LUAR: kode dapat disalin, disimpan sebagai gambar, atau dikirim ke WhatsApp pelanggan sendiri.
//
// Hanya menyimpan data voucher (kode, nilai, syarat, masa berlaku) dan nomor pesanan/WhatsApp milik pelanggan
// itu sendiri di perangkatnya. Tidak menyimpan alamat atau data pembayaran.
var MFVoucher = (function () {
    'use strict';
    var KEY = 'mf_vouchers', LEGACY = 'mf_voucher', API = '/api/testimoni';

    function today() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); }
    function read() {
        try { var l = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(l) ? l.filter(function (v) { return v && v.kode; }) : []; }
        catch (e) { return []; }
    }
    function write(l) { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 20))); return true; } catch (e) { return false; } }

    // Pindahkan format lama (satu voucher di 'mf_voucher') ke daftar baru tanpa kehilangan datanya.
    (function migrate() {
        try {
            var old = JSON.parse(localStorage.getItem(LEGACY) || 'null');
            if (old && old.kode && !read().some(function (v) { return v.kode === old.kode; })) {
                var l = read(); l.unshift({ kode: old.kode, nilai: old.nilai, min_belanja: old.min_belanja, berlaku_sampai: old.berlaku_sampai, order: '', telepon: '', used: false, at: Date.now() });
                write(l);
            }
        } catch (e) { /* abaikan */ }
    })();

    // Minta browser menjaga penyimpanan agar tidak dibersihkan otomatis. Tidak menampilkan dialog di semua browser besar.
    function persist() {
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) { /* abaikan */ }
    }

    // Nomor selalu disimpan berformat 62xxxxxxxxxx agar seragam dengan server.
    function phone62(n) { var d = String(n || '').replace(/[^0-9]/g, ''); if (d.indexOf('0') === 0) d = '62' + d.slice(1); else if (d.indexOf('8') === 0) d = '62' + d; return d; }
    function normalize(v, ctx) {
        ctx = ctx || {};
        return {
            kode: String(v.kode).toUpperCase(), nilai: Number(v.nilai) || 0, min_belanja: Number(v.min_belanja) || 0,
            berlaku_sampai: String(v.berlaku_sampai || '').slice(0, 10),
            order: String(ctx.order || v.order || '').toUpperCase(), telepon: phone62(ctx.telepon || v.telepon || ''),
            teleponHint: String(ctx.teleponHint || v.teleponHint || ''), used: Boolean(v.digunakan || v.used), at: Date.now()
        };
    }

    // Simpan/perbarui satu voucher (kunci: kode). Mengembalikan catatan yang tersimpan.
    function save(v, ctx) {
        if (!v || !v.kode) return null;
        ctx = ctx || {};
        if (!ctx.telepon && ctx.order && typeof MyOrders !== 'undefined') { var mo = MyOrders.find(ctx.order); if (mo && mo.telepon) ctx = Object.assign({}, ctx, { telepon: mo.telepon }); }
        var rec = normalize(v, ctx), list = read();
        var old = list.filter(function (x) { return x.kode === rec.kode; })[0];
        if (old) { rec.order = rec.order || old.order; rec.telepon = rec.telepon || old.telepon; rec.teleponHint = rec.teleponHint || old.teleponHint; rec.used = rec.used || old.used; }
        list = list.filter(function (x) { return x.kode !== rec.kode; });
        list.unshift(rec); write(list); persist();
        return rec;
    }
    function find(kode) { kode = String(kode || '').toUpperCase(); return read().filter(function (x) { return x.kode === kode; })[0] || null; }
    function findByOrder(order) { order = String(order || '').toUpperCase(); return order ? (read().filter(function (x) { return x.order === order; })[0] || null) : null; }
    function usable(v) { return v && !v.used && (!v.berlaku_sampai || v.berlaku_sampai >= today()); }
    // Voucher yang masih bisa dipakai; nilai terbesar lebih dulu, lalu yang paling cepat kedaluwarsa.
    function list() {
        return read().filter(usable).sort(function (a, b) { return (b.nilai - a.nilai) || String(a.berlaku_sampai).localeCompare(String(b.berlaku_sampai)); });
    }
    function best() { return list()[0] || null; }
    // Tandai terpakai (disimpan sebagai catatan agar pemulihan otomatis tidak memunculkannya lagi).
    function markUsed(kode) {
        kode = String(kode || '').toUpperCase();
        var l = read().map(function (x) { if (x.kode === kode) x.used = true; return x; });
        write(l);
    }

    // Ambil dari server berdasarkan nomor pesanan. Aman dipanggil berulang.
    function recover(orderId) {
        orderId = String(orderId || '').trim().toUpperCase();
        return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ action: 'voucher', orderId: orderId }) })
            .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok && j.success, status: res.status, j: j }; }); })
            .then(function (r) {
                if (!r.ok || !r.j.voucher) return { ok: false, error: r.j.error || 'Voucher belum dapat diambil. Coba lagi nanti.', belumUlasan: Boolean(r.j.belumUlasan), status: r.status };
                var rec = save(r.j.voucher, { order: orderId, teleponHint: r.j.teleponHint });
                return { ok: true, voucher: rec };
            })
            .catch(function () { return { ok: false, error: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.', network: true }; });
    }

    // Untuk setiap pesanan yang diketahui sudah diulas tetapi vouchernya belum ada di perangkat: ambil dari server.
    function syncForOrders() {
        if (typeof MyOrders === 'undefined') return Promise.resolve(0);
        var todo = MyOrders.all().filter(function (o) { return o.ulasan && !findByOrder(o.id); }).slice(0, 3);
        return todo.reduce(function (p, o) {
            return p.then(function (n) {
                return recover(o.id).then(function (r) { if (r.ok && r.voucher && !r.voucher.telepon && o.telepon) save(r.voucher, { telepon: o.telepon }); return n + (r.ok ? 1 : 0); });
            });
        }, Promise.resolve(0));
    }

    return { save: save, find: find, findByOrder: findByOrder, list: list, best: best, markUsed: markUsed, recover: recover, syncForOrders: syncForOrders, persist: persist, usable: usable };
})();
