// Peta pelacakan pelanggan. Aktif hanya saat status = Dikirim.
// Mengambil posisi kurir dari /api/tracking secara berkala, menggeser penanda dengan halus,
// menggambar sisa rute, dan menghitung perkiraan tiba dari hasil rute server.
(function () {
    'use strict';
    var C = window.MF_TRACK || { origin: { lat: -7.2575, lng: 112.7521, name: 'Margaluyu Farm' }, pollMs: 12000 };
    var $ = function (id) { return document.getElementById(id); };

    var HEAD = {
        'Belum terkirim': ['Pesanan diterima', 'Pesanan sudah tercatat. Kami segera memeriksa pembayaran dan alamat Anda.'],
        'Dikonfirmasi': ['Pesanan dikonfirmasi', 'Kami memeriksa pembayaran dan alamat Anda.'],
        'Dikemas': ['Sedang dikemas', 'Susu disiapkan dan dikemas dengan hati-hati.'],
        'Dikirim': ['Dalam perjalanan', ''],
        'Selesai': ['Pesanan diterima', 'Terima kasih sudah memesan di Margaluyu Farm.']
    };

    var st = { order: null, phone: '', timer: null, map: null, layers: {}, anim: null, fitted: false, last: null, inflight: false, fails: 0 };

    function fmtClock(d) { return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(':', '.'); }
    function fmtKm(km) { return km < 1 ? Math.max(50, Math.round(km * 10) * 100) + ' m' : km.toFixed(1).replace('.', ',') + ' km'; }
    function ago(iso) {
        var s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
        if (s < 15) return 'baru saja';
        if (s < 60) return s + ' dtk lalu';
        return Math.round(s / 60) + ' mnt lalu';
    }
    function icon(html, w, h) { return L.divIcon({ className: 'mfm', html: html, iconSize: [w, h], iconAnchor: [w / 2, h / 2] }); }

    var ICON_FARM = function () { return icon('<div class="mfm-farm" title="' + C.origin.name + '"></div>', 18, 18); };
    var ICON_HOME = function (lbl) { return icon('<div class="mfm-home"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="#fff"/></svg></div><span class="mfm-lbl">' + (lbl || 'Alamat Anda') + '</span>', 34, 34); };
    var ICON_COURIER = function () { return icon('<div class="mfm-ring"></div><div class="mfm-rider" id="mfmRider"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l7 17-7-4-7 4z" fill="#fff"/></svg></div>', 40, 40); };

    function ensureMap() {
        if (st.map) return true;
        if (typeof L === 'undefined') return false;
        st.map = L.map('trackMap', { zoomControl: false, attributionControl: true, scrollWheelZoom: false, tap: true }).setView([C.origin.lat, C.origin.lng], 13);
        MFBasemap.add(st.map, function (kind, name) {
            var n = $('mapNote'); if (!n) return;
            if (kind === 'fail') { n.textContent = 'Gambar peta tidak dapat dimuat dari jaringan ini. Posisi tetap diperbarui.'; n.hidden = false; }
            else { n.hidden = true; }
        });
        L.control.zoom({ position: 'bottomright' }).addTo(st.map);
        if (C.originConfirmed) st.layers.farm = L.marker([C.origin.lat, C.origin.lng], { icon: ICON_FARM(), keyboard: false }).addTo(st.map);
        st.map.on('dragstart zoomstart', function () { st.userMoved = true; });
        // Gulir satu jari tetap menggulir halaman di ponsel; zoom roda mouse butuh klik pada peta lebih dulu.
        st.map.on('click', function () { st.map.scrollWheelZoom.enable(); });
        st.map.on('blur mouseout', function () { st.map.scrollWheelZoom.disable(); });
        return true;
    }

    function setChip(text, kind) { var c = $('mapChip'); c.textContent = text; c.className = 'lk-map-chip' + (kind ? ' is-' + kind : ''); }

    function moveCourier(ll) {
        if (!st.layers.courier) { st.layers.courier = L.marker(ll, { icon: ICON_COURIER(), zIndexOffset: 1000, keyboard: false }).addTo(st.map); return; }
        var m = st.layers.courier, from = m.getLatLng(), t0 = performance.now(), dur = 1500;
        cancelAnimationFrame(st.anim);
        (function step(t) {
            var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            m.setLatLng([from.lat + (ll[0] - from.lat) * e, from.lng + (ll[1] - from.lng) * e]);
            if (k < 1) st.anim = requestAnimationFrame(step);
        })(t0);
    }

    function render(d) {
        var map = st.map, pts = C.originConfirmed ? [[C.origin.lat, C.origin.lng]] : [];
        var eta = $('lkEta'), head = $('lkHeadline'), eb = $('lkEyebrow');
        eb.textContent = 'Pesanan ' + (st.order.orderId || '');

        if (d.unavailable) { setChip('Peta live belum aktif di server', 'warn'); }
        if (d.dest) {
            var dl = [d.dest.lat, d.dest.lng];
            if (!st.layers.home) st.layers.home = L.marker(dl, { icon: ICON_HOME(d.approx ? 'Perkiraan area' : 'Alamat Anda'), keyboard: false }).addTo(map); else st.layers.home.setLatLng(dl);
            pts.push(dl);
        }

        // Garis rute: sisa perjalanan kurir; bila belum ada kurir, garis putus-putus farm -> alamat.
        var line = d.route && d.route.line && d.live !== false ? d.route.line : null;
        if (st.layers.route) { map.removeLayer(st.layers.route); st.layers.route = null; }
        if (st.layers.casing) { map.removeLayer(st.layers.casing); st.layers.casing = null; }
        if (line && line.length > 1) {
            st.layers.casing = L.polyline(line, { color: '#fff', weight: 9, opacity: .95, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(map);
            st.layers.route = L.polyline(line, { color: '#0a3d38', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(map);
            line.forEach(function (p) { pts.push(p); });
        } else if (d.dest && C.originConfirmed) {
            st.layers.route = L.polyline([[C.origin.lat, C.origin.lng], [d.dest.lat, d.dest.lng]], { color: '#8a948e', weight: 3, dashArray: '2 9', lineCap: 'round', interactive: false }).addTo(map);
        }

        if (d.courier) {
            var cl = [d.courier.lat, d.courier.lng];
            moveCourier(cl);
            pts.push(cl);
            var r = document.getElementById('mfmRider');
            if (r && d.courier.heading != null && (d.courier.speed || 0) > 1) r.firstElementChild.style.transform = 'rotate(' + d.courier.heading + 'deg)';
            if (st.layers.courier) st.layers.courier.getElement && (st.layers.courier.getElement().style.opacity = d.live ? 1 : .55);
        }

        // Teks status + perkiraan tiba
        var who = d.courier && d.courier.name ? d.courier.name : 'Kurir';
        if (d.arrivedAt) {
            head.textContent = 'Kurir sudah tiba';
            eta.textContent = 'Mohon siapkan diri untuk menerima pesanan.'; eta.hidden = false; eta.classList.remove('has-time');
            setChip(who + ' sudah di alamat tujuan', 'ok');
        } else if (d.live && d.route && d.route.min != null) {
            var elapsed = d.route.at ? (Date.now() - new Date(d.route.at).getTime()) / 60000 : 0;
            var rem = Math.max(1, d.route.min - elapsed), now = Date.now();
            var lo = new Date(now + rem * 0.9 * 60000), hi = new Date(now + (rem * 1.2 + 3) * 60000);
            head.textContent = rem <= 3 ? 'Kurir hampir tiba' : 'Dalam perjalanan';
            eta.innerHTML = '';
            var lab = document.createElement('span'); lab.textContent = 'Perkiraan tiba '; eta.appendChild(lab);
            var tm = document.createElement('b'); tm.textContent = fmtClock(lo) + '–' + fmtClock(hi); eta.appendChild(tm);
            var km = Math.max(0, d.route.km * Math.max(0, 1 - elapsed / Math.max(d.route.min, 1)));
            var sp = document.createElement('span'); sp.className = 'lk-eta-km'; sp.textContent = ' · sekitar ' + fmtKm(km) + ' lagi'; eta.appendChild(sp);
            eta.hidden = false; eta.classList.add('has-time');
            setChip(who + ' · diperbarui ' + ago(d.courier.at), 'live');
        } else if (d.courier) {
            head.textContent = 'Dalam perjalanan';
            eta.textContent = 'Lokasi kurir terakhir terlihat ' + ago(d.courier.at) + '. Peta akan diperbarui saat sinyal kembali.'; eta.hidden = false; eta.classList.remove('has-time');
            setChip('Sinyal kurir terputus sementara', 'warn');
        } else {
            head.textContent = 'Pesanan sudah dikirim';
            var jd = d.jadwal && (d.jadwal.jam || '');
            eta.textContent = 'Posisi kurir akan tampil di peta begitu perjalanan dimulai.' + (jd ? ' Jadwal kirim: ' + jd + '.' : ''); eta.hidden = false; eta.classList.remove('has-time');
            setChip('Menunggu kurir berangkat', 'wait');
        }

        if (!st.fitted || (!st.userMoved && d.live)) {
            map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16, animate: st.fitted });
            st.fitted = true;
        }
        st.last = pts;
    }

    // Sebelum dikirim: peta SELALU tampil. Isinya titik tujuan (tepat / perkiraan area) atau keterangan jelas bila belum ada.
    function renderPreview(d) {
        var card = $('mapCard');
        card.hidden = false;
        if (!ensureMap()) return;
        setTimeout(function () { st.map.invalidateSize(); }, 60);
        if (st.layers.home) { st.map.removeLayer(st.layers.home); st.layers.home = null; }
        if (d.unavailable) { setChip('Peta belum aktif di server (migrasi database belum dijalankan)', 'warn'); return; }
        if (!d.dest) { setChip('Alamat belum bisa ditandai · kurir tampil saat dikirim', 'wait'); return; }
        var dl = [d.dest.lat, d.dest.lng];
        st.layers.home = L.marker(dl, { icon: ICON_HOME(d.approx ? 'Perkiraan area' : 'Alamat Anda'), keyboard: false }).addTo(st.map);
        setTimeout(function () { st.map.setView(dl, d.approx ? 13 : 15); }, 80);
        st.last = [dl];
        setChip((d.approx ? 'Perkiraan area tujuan' : 'Titik alamat Anda') + ' · kurir tampil saat dikirim', 'wait');
    }

    function poll() {
        if (st.inflight || !st.order) return;
        st.inflight = true;
        var url = '/api/tracking?orderId=' + encodeURIComponent(st.order.orderId) + '&telepon=' + encodeURIComponent(st.phone);
        fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (j) {
                st.fails = 0;
                if (!j.success) { setChip('Peta belum bisa dimuat dari server. Coba muat ulang halaman.', 'warn'); return; }
                if (!j.data.active) { if (st.preview) renderPreview(j.data); return; }
                render(j.data);
                if (j.data.arrivedAt) stopTimer();
            })
            .catch(function () { st.fails++; setChip(st.preview ? 'Peta belum bisa dimuat. Periksa koneksi Anda.' : 'Menyambungkan ulang...', 'warn'); })
            .then(function () { st.inflight = false; });
    }
    function schedule() { stopTimer(); st.timer = setInterval(function () { if (!document.hidden) poll(); }, Math.max(6000, C.pollMs || 12000) * (st.fails > 3 ? 3 : 1)); }
    function stopTimer() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }

    document.addEventListener('visibilitychange', function () { if (!document.hidden && st.timer) poll(); });

    window.MFTrack = {
        stop: function () { stopTimer(); st.order = null; var c = $('mapCard'); if (c) c.hidden = true; },
        show: function (order, phone, opts) {
            var silent = Boolean(opts && opts.silent);
            // Penyegaran senyap: bila status tidak berubah, jangan mengganggu peta yang sedang berjalan.
            if (silent && st.order && st.order.orderId === order.orderId && st.order.status === order.status) { st.order = order; return; }
            stopTimer();
            st.order = order; st.phone = phone; st.fitted = false; st.userMoved = false;
            var h = HEAD[order.status] || [order.status || '', ''];
            $('lkEyebrow').textContent = 'Pesanan ' + (order.orderId || '');
            $('lkHeadline').textContent = h[0];
            var rb = $('resultBox'), calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (rb && !silent) setTimeout(function () { rb.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }); }, 50);
            var eta = $('lkEta'); eta.classList.remove('has-time');
            var jad = ''; if (order.tanggalKirim || order.jamKirim) { var dd = order.tanggalKirim ? new Date(order.tanggalKirim + 'T00:00:00') : null; jad = [dd && !isNaN(dd) ? dd.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : '', order.jamKirim].filter(Boolean).join(', '); }
            eta.textContent = h[1]; eta.hidden = !eta.textContent;
            var card = $('mapCard'), hint = $('lkHint');
            var early = order.status === 'Belum terkirim' || order.status === 'Dikonfirmasi' || order.status === 'Dikemas';
            st.preview = early;
            if (hint) hint.hidden = true;
            if (!early && order.status !== 'Dikirim') { card.hidden = true; return; }   // Selesai: peta tidak perlu lagi
            card.hidden = false;
            if (!ensureMap()) {
                card.hidden = true;
                if (early && hint) { hint.textContent = 'Peta tidak dapat dimuat saat ini. Posisi kurir akan tampil saat pesanan dikirim.'; hint.hidden = false; }
                else { eta.textContent = 'Peta tidak dapat dimuat. Pesanan Anda sedang dalam perjalanan.'; eta.hidden = false; }
                return;
            }
            setTimeout(function () { st.map.invalidateSize(); }, 60);
            setChip(early ? 'Memuat peta...' : 'Memuat posisi kurir...', 'wait');
            poll();
            if (!early) schedule();
        }
    };
    var rc = $('recenterBtn');
    if (rc) rc.addEventListener('click', function () { if (st.map && st.last) { st.userMoved = false; st.map.fitBounds(L.latLngBounds(st.last), { padding: [48, 48], maxZoom: 16 }); } });
})();
