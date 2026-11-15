// Halaman kurir: membagikan lokasi GPS ke pelanggan selama pesanan berstatus Dikirim.
// Token ada di #t=... (tidak ikut terkirim ke server sebagai bagian URL, tidak tercatat di log akses).
(function () {
    'use strict';
    var C = window.MF_TRACK, API = '/api/tracking';
    var oid = (new URLSearchParams(location.search).get('o') || '').toUpperCase();
    var token = (location.hash.match(/t=([a-f0-9]+)/) || [])[1] || '';
    var $ = function (id) { return document.getElementById(id); };
    var hasMap = typeof L !== 'undefined';
    var map, meMarker, destMarker, dest = null, watchId = null, lastSent = 0, wake = null, busy = false;

    function say(text, kind) { var s = $('state'); s.textContent = text; s.className = 'state' + (kind ? ' ' + kind : ''); }
    function post(action, extra) {
        return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ action: action, orderId: oid, token: token }, extra || {})) })
            .then(function (r) { return r.json().catch(function () { return { success: false, error: 'Respons tidak valid.' }; }); });
    }
    function icon(cls, size) { return L.divIcon({ className: '', html: '<div class="' + cls + '"></div>', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }); }

    function setDest(p, save) {
        dest = p;
        if (hasMap) { if (destMarker) destMarker.setLatLng(p); else destMarker = L.marker(p, { icon: icon('pin', 22) }).addTo(map); }
        if (save) post('dest', { lat: p.lat, lng: p.lng }).then(function (r) { say(r.success ? 'Titik tujuan disimpan.' : (r.error || 'Gagal menyimpan titik tujuan.'), r.success ? 'ok' : 'err'); });
    }

    function onPos(pos) {
        var c = pos.coords, ll = [c.latitude, c.longitude];
        if (hasMap) { if (!meMarker) { meMarker = L.marker(ll, { icon: icon('me', 16) }).addTo(map); map.setView(ll, 15); } else meMarker.setLatLng(ll); }
        var now = Date.now();
        if (now - lastSent < 6000) return;      // maksimal satu kiriman per 6 detik (hemat baterai & kuota)
        lastSent = now;
        post('ping', { lat: c.latitude, lng: c.longitude, accuracy: c.accuracy, heading: c.heading, speed: c.speed }).then(function (r) {
            if (!r.success) return say(r.error || 'Gagal mengirim lokasi.', 'err');
            say(r.hasDest ? 'Lokasi dibagikan ke pelanggan. Biarkan halaman ini tetap terbuka.' : 'Lokasi dibagikan. Ketuk peta untuk menandai titik tujuan pelanggan.', r.hasDest ? 'ok' : '');
        }).catch(function () { say('Sinyal terputus, mencoba lagi...', 'err'); });
    }

    function start() {
        if (!navigator.geolocation) return say('Perangkat ini tidak mendukung GPS.', 'err');
        $('go').disabled = true;
        watchId = navigator.geolocation.watchPosition(onPos, function (e) {
            $('go').disabled = false;
            say(e.code === 1 ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.' : 'Lokasi belum terbaca. Pastikan GPS aktif.', 'err');
        }, { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 });
        $('go').textContent = 'Lokasi sedang dibagikan';
        $('arrive').hidden = false;
        if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {});
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && watchId !== null && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {});
    });

    $('go').addEventListener('click', start);
    $('arrive').addEventListener('click', function () {
        if (busy || !confirm('Tandai pesanan sudah sampai di tujuan?')) return;
        busy = true;
        post('arrive').then(function (r) {
            busy = false;
            if (!r.success) return say(r.error || 'Gagal menandai.', 'err');
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            watchId = null; $('arrive').hidden = true; $('go').hidden = true;
            say('Selesai. Pelanggan sudah diberi tahu. Admin akan menandai pesanan Selesai.', 'ok');
        });
    });

    if (hasMap) {
        map = L.map('map', { zoomControl: false, attributionControl: true }).setView([C.origin.lat, C.origin.lng], 12);
        MFBasemap.add(map, function (kind) { if (kind === 'fail') say('Gambar peta tidak termuat, tetapi lokasi tetap dibagikan.', ''); });
        map.on('click', function (e) { setDest(e.latlng, true); });
    } else {
        $('map').textContent = 'Peta tidak termuat (periksa koneksi). Berbagi lokasi tetap berfungsi.';
        $('map').style.cssText += ';display:grid;place-items:center;padding:16px;text-align:center;color:#5b6962;font-size:14px';
    }

    $('oid').textContent = oid || 'Pesanan';
    if (!oid || !token) { $('who').textContent = 'Tautan tidak lengkap'; return say('Buka tautan lengkap dari admin.', 'err'); }
    post('info').then(function (r) {
        if (!r.success) { $('who').textContent = 'Tidak dapat dibuka'; return say(r.error || 'Tautan tidak valid.', 'err'); }
        $('who').textContent = 'Halo, ' + r.courier;
        $('addr').textContent = r.alamat + (r.zona ? ' (' + r.zona + ')' : '');
        if (r.dest) { setDest(r.dest, false); if (hasMap) map.setView(r.dest, 14); }
        $('go').disabled = false;
        say(r.dest ? 'Tekan tombol di bawah, lalu izinkan akses lokasi.' : 'Titik tujuan belum otomatis ditemukan. Setelah lokasi dibagikan, ketuk peta untuk menandainya.');
    }).catch(function () { say('Tidak bisa terhubung ke server.', 'err'); });
})();
