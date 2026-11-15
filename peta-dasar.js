// Peta dasar dengan cadangan otomatis. Dipakai halaman lacak (pelanggan) dan halaman kurir.
// Urutan: CARTO Voyager -> OpenStreetMap standar. Bila sebuah penyedia gagal memuat gambar peta
// (diblokir jaringan/CSP, atau tidak menjawab), otomatis pindah ke berikutnya; bila semua gagal, memberi tahu pemanggil.
(function () {
    'use strict';
    var C = window.MF_TRACK || {};
    var SOURCES = C.tiles || [
        { name: 'CARTO', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', sub: 'abcd', attr: '&copy; OpenStreetMap, &copy; CARTO' },
        { name: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', sub: 'abc', attr: '&copy; OpenStreetMap' }
    ];
    window.MFBasemap = {
        // notify('ok', nama) saat gambar peta berhasil muncul; notify('switch', nama) saat pindah penyedia; notify('fail') bila semua gagal.
        add: function (map, notify) {
            var idx = 0, layer = null, loaded = 0, errors = 0, timer = null, dead = false;
            function say(kind, name) { try { if (notify) notify(kind, name); } catch (e) { /* abaikan */ } }
            function use(k) {
                if (layer) { try { map.removeLayer(layer); } catch (e) { /* abaikan */ } }
                var s = SOURCES[k]; loaded = 0; errors = 0;
                layer = L.tileLayer(s.url, { attribution: s.attr, maxZoom: 19, subdomains: s.sub || 'abc' });
                layer.on('tileload', function () { loaded++; if (loaded === 1) say('ok', s.name); });
                layer.on('tileerror', function () { errors++; if (loaded === 0 && errors >= 4) next(); });
                layer.addTo(map);
                clearTimeout(timer);
                timer = setTimeout(function () { if (loaded === 0) next(); }, 7000);
            }
            function next() {
                if (dead) return;
                clearTimeout(timer);
                if (idx + 1 < SOURCES.length) { idx++; say('switch', SOURCES[idx].name); use(idx); }
                else { dead = true; if (layer) { try { map.removeLayer(layer); } catch (e) { /* abaikan */ } } say('fail'); }
            }
            use(0);
        }
    };
})();
