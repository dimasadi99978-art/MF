/* Dropdown pilihan untuk halaman order.
   Membungkus radio group yang sudah ada (area pengiriman, bagian Surabaya, metode pembayaran).
   Radio asli tetap menjadi sumber nilai: memilih opsi akan men-check radio lalu memicu event "change",
   sehingga seluruh logika harga, ongkir, dan validasi di order-sekarang.html berjalan tanpa perubahan.
   Pola aksesibilitas: select-only combobox (WAI-ARIA APG) dengan navigasi keyboard penuh. */
(function () {
    'use strict';
    var uid = 0, instances = [], openOne = null;

    var CHEV = '<svg class="dd-chev" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var CHECK = '<svg class="dd-check" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 10.5l3.6 3.6 7.4-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var SVG = {
        pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        route: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
        cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
        qr: '<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'
    };
    function iconFor(cls) {
        var k = /map-marker/.test(cls) ? 'pin' : /route/.test(cls) ? 'route' : /hand-holding|money|coins/.test(cls) ? 'cash' : /qrcode/.test(cls) ? 'qr' : /wallet/.test(cls) ? 'wallet' : '';
        return k ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + SVG[k] + '</svg>' : '';
    }

    function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    // Membaca label, keterangan, dan ikon dari markup kartu/chip yang sudah ada.
    function readOption(radio) {
        var card = radio.closest('.opt-card'), chip = radio.closest('.seg-chip');
        var o = { radio: radio, value: radio.value, title: '', sub: '', icon: '' };
        if (card) {
            o.title = txt(card.querySelector('.oc-txt b'));
            o.sub = txt(card.querySelector('.oc-txt small'));
            var i = card.querySelector('.oc-ico i');
            o.icon = i ? i.className : '';
        } else if (chip) {
            o.title = txt(chip.querySelector('span'));
            if (typeof CONTOH_BAGIAN !== 'undefined' && CONTOH_BAGIAN[radio.value]) {
                o.sub = CONTOH_BAGIAN[radio.value].split(', ').slice(0, 3).join(', ');
            }
        }
        return o;
    }

    function build(cfg) {
        var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="' + cfg.name + '"]'));
        var source = document.querySelector(cfg.source);
        if (!radios.length || !source) return;

        var id = 'dd' + (++uid);
        var opts = radios.map(readOption);
        var root = document.createElement('div');
        root.className = 'dd';
        root.setAttribute('data-dd', cfg.name);

        var useIcons = opts.some(function (o) { return o.icon; });
        root.innerHTML =
            '<button type="button" class="dd-trigger" id="' + id + '-btn" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-list">' +
                (useIcons ? '<span class="dd-ico" aria-hidden="true"></span>' : '') +
                '<span class="dd-text"><span class="dd-value"></span><span class="dd-sub"></span></span>' + CHEV +
            '</button>' +
            '<ul class="dd-list" id="' + id + '-list" role="listbox" tabindex="-1">' +
                opts.map(function (o, k) {
                    return '<li class="dd-opt" role="option" id="' + id + '-o' + k + '" data-i="' + k + '" aria-selected="false">' +
                        (useIcons ? '<span class="dd-ico" aria-hidden="true">' + iconFor(o.icon) + '</span>' : '') +
                        '<span class="dd-text"><span class="dd-value">' + esc(o.title) + '</span>' +
                        (o.sub ? '<span class="dd-sub">' + esc(o.sub) + '</span>' : '') + '</span>' + CHECK + '</li>';
                }).join('') +
            '</ul>';

        source.classList.add('dd-source');
        source.parentNode.insertBefore(root, source.nextSibling);

        var btn = root.querySelector('.dd-trigger'), list = root.querySelector('.dd-list');
        var items = Array.prototype.slice.call(list.querySelectorAll('.dd-opt'));
        var label = document.querySelector(cfg.labelledBy);
        if (label) { if (!label.id) label.id = id + '-lbl'; btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id); list.setAttribute('aria-labelledby', label.id); }
        var active = -1, typed = '', typedTimer = null;

        function checkedIndex() {
            for (var k = 0; k < radios.length; k++) if (radios[k].checked) return k;
            return -1;
        }
        function setActive(k) {
            if (k < 0 || k >= items.length) return;
            items.forEach(function (li) { li.classList.remove('is-active'); });
            active = k;
            items[k].classList.add('is-active');
            btn.setAttribute('aria-activedescendant', items[k].id);
            var top = items[k].offsetTop, bot = top + items[k].offsetHeight;
            if (top < list.scrollTop) list.scrollTop = top - 6;
            else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight + 6;
        }
        function enabled(k) { return !radios[k].disabled; }
        function step(from, dir) {
            var k = from;
            do { k += dir; } while (k >= 0 && k < items.length && !enabled(k));
            return (k >= 0 && k < items.length) ? k : from;
        }

        function sync() {
            var k = checkedIndex(), o = k > -1 ? opts[k] : null;
            root.classList.toggle('has-value', !!o);
            btn.querySelector('.dd-value').textContent = o ? o.title : cfg.placeholder;
            btn.querySelector('.dd-sub').textContent = o ? o.sub : '';
            var ico = btn.querySelector('.dd-ico');
            if (ico) ico.innerHTML = iconFor(o ? o.icon : cfg.emptyIcon || '');
            items.forEach(function (li, j) {
                li.setAttribute('aria-selected', j === k ? 'true' : 'false');
                li.setAttribute('aria-disabled', radios[j].disabled ? 'true' : 'false');
            });
            // Bila semua pilihan nonaktif (mis. data area belum dimuat), picu dibuat tidak aktif.
            btn.disabled = radios.every(function (r) { return r.disabled; });
        }

        function open() {
            if (btn.disabled || root.classList.contains('is-open')) return;
            if (openOne && openOne !== api) openOne.close();
            sync();
            // Buka ke atas bila ruang di bawah tidak cukup (tab bar HP ikut diperhitungkan).
            var r = btn.getBoundingClientRect();
            var reserve = window.innerWidth <= 767 ? 84 : 12;
            var below = window.innerHeight - r.bottom - reserve;
            root.classList.toggle('is-up', below < 230 && r.top > below);
            root.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
            var k = checkedIndex();
            setActive(k > -1 ? k : (function () { for (var j = 0; j < items.length; j++) if (enabled(j)) return j; return 0; })());
            openOne = api;
        }
        function close(refocus) {
            if (!root.classList.contains('is-open')) return;
            root.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
            btn.removeAttribute('aria-activedescendant');
            if (openOne === api) openOne = null;
            if (refocus) btn.focus();
        }
        function choose(k) {
            if (k < 0 || !enabled(k)) return;
            var r = radios[k], changed = !r.checked;
            if (changed) {
                r.checked = true;
                r.dispatchEvent(new Event('change', { bubbles: true }));
            }
            sync();
            close(true);
        }

        btn.addEventListener('click', function () { root.classList.contains('is-open') ? close() : open(); });
        list.addEventListener('mousemove', function (e) {
            var li = e.target.closest('.dd-opt'); if (!li) return;
            var k = +li.getAttribute('data-i'); if (enabled(k) && k !== active) setActive(k);
        });
        var picking = false;
        list.addEventListener('click', function (e) {
            var li = e.target.closest('.dd-opt'); if (!li || picking) return;
            var k = +li.getAttribute('data-i'); if (!enabled(k)) return;
            picking = true; li.classList.add('is-picked');   // animasi tekan terlihat sebelum daftar menutup
            setTimeout(function () { picking = false; li.classList.remove('is-picked'); choose(k); }, 170);
        });
        // Cegah tombol kehilangan fokus saat memilih lewat pointer.
        list.addEventListener('mousedown', function (e) { e.preventDefault(); });

        btn.addEventListener('keydown', function (e) {
            var isOpen = root.classList.contains('is-open'), k = e.key;
            if (!isOpen) {
                if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); open(); }
                return;
            }
            if (k === 'ArrowDown') { e.preventDefault(); setActive(step(active, 1)); }
            else if (k === 'ArrowUp') { e.preventDefault(); setActive(step(active, -1)); }
            else if (k === 'Home') { e.preventDefault(); setActive(step(-1, 1)); }
            else if (k === 'End') { e.preventDefault(); setActive(step(items.length, -1)); }
            else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
            else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
            else if (k === 'Tab') { close(); }
            else if (k.length === 1 && /\S/.test(k)) {
                typed += k.toLowerCase(); clearTimeout(typedTimer); typedTimer = setTimeout(function () { typed = ''; }, 600);
                for (var j = 0; j < opts.length; j++) { if (enabled(j) && opts[j].title.toLowerCase().indexOf(typed) === 0) { setActive(j); break; } }
            }
        });
        btn.addEventListener('blur', function () {
            // Tutup bila fokus pindah keluar komponen (klik di daftar dicegah oleh mousedown di atas).
            setTimeout(function () { if (!root.contains(document.activeElement)) close(); }, 0);
        });

        radios.forEach(function (r) { r.addEventListener('change', sync); });

        var api = { sync: sync, close: close, button: btn, name: cfg.name };
        instances.push(api);
        sync();
    }

    document.addEventListener('click', function (e) { if (openOne && !e.target.closest('.dd')) openOne.close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openOne) openOne.close(true); });
    window.addEventListener('resize', function () { if (openOne) openOne.close(); });


    /* ---------- Tanggal pengiriman: kalender dropdown ----------
       Input type=date asli tetap menjadi sumber nilai (disembunyikan). Memilih tanggal mengisi input lalu memicu
       "input"/"change"; batas min/max dibaca dari input sehingga logika jadwal di halaman tidak berubah. */
    var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function isoOf(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
    function parseIso(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
    function longLabel(dt) { return HARI[dt.getDay()] + ', ' + dt.getDate() + ' ' + BULAN[dt.getMonth()] + ' ' + dt.getFullYear(); }
    function shortLabel(dt) { return dt.getDate() + ' ' + BLN[dt.getMonth()] + (dt.getFullYear() !== new Date().getFullYear() ? ' ' + dt.getFullYear() : ''); }
    function iconSvg(k) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + SVG[k] + '</svg>'; }
    var ARROW_L = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M12.5 5l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var ARROW_R = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M7.5 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function buildDate() {
        var input = document.getElementById('tanggalKirim');
        if (!input) return;
        var id = 'dd' + (++uid);
        var root = document.createElement('div');
        root.className = 'dd dd-date';
        root.setAttribute('data-dd', 'tanggalKirim');
        var dow = HARI_PENDEK.map(function (h) { return '<span>' + h + '</span>'; }).join('');
        root.innerHTML =
            '<button type="button" class="dd-trigger" id="' + id + '-btn" role="combobox" aria-haspopup="dialog" aria-expanded="false" aria-controls="' + id + '-pop">' +
                '<span class="dd-ico" aria-hidden="true">' + iconSvg('calendar') + '</span>' +
                '<span class="dd-text"><span class="dd-value"></span><span class="dd-sub"></span></span>' + CHEV +
            '</button>' +
            '<div class="dd-list dd-cal" id="' + id + '-pop" role="dialog" aria-label="Pilih tanggal pengiriman">' +
                '<div class="dd-cal-head">' +
                    '<button type="button" class="dd-cal-nav" data-nav="-1" aria-label="Bulan sebelumnya">' + ARROW_L + '</button>' +
                    '<div class="dd-cal-title" aria-live="polite"></div>' +
                    '<button type="button" class="dd-cal-nav" data-nav="1" aria-label="Bulan berikutnya">' + ARROW_R + '</button>' +
                '</div>' +
                '<div class="dd-cal-dow" aria-hidden="true">' + dow + '</div>' +
                '<div class="dd-cal-grid" role="grid"></div>' +
                '<div class="dd-cal-foot">' +
                    '<button type="button" class="dd-cal-act" data-act="today">Hari ini</button>' +
                    '<button type="button" class="dd-cal-act is-clear" data-act="clear">Hapus tanggal</button>' +
                '</div>' +
            '</div>';
        input.classList.add('dd-source');
        input.parentNode.insertBefore(root, input.nextSibling);

        var btn = root.querySelector('.dd-trigger'), pop = root.querySelector('.dd-cal');
        var grid = root.querySelector('.dd-cal-grid'), title = root.querySelector('.dd-cal-title');
        var navPrev = root.querySelector('[data-nav="-1"]'), navNext = root.querySelector('[data-nav="1"]');
        var btnToday = root.querySelector('[data-act="today"]'), btnClear = root.querySelector('[data-act="clear"]');
        var viewY = 0, viewM = 0, active = '';

        function lo() { return input.min || ''; }
        function hi() { return input.max || ''; }
        function clamp(v) { if (lo() && v < lo()) return lo(); if (hi() && v > hi()) return hi(); return v; }
        function inRange(v) { return (!lo() || v >= lo()) && (!hi() || v <= hi()); }
        function todayIso() { return isoOf(new Date()); }

        function sync() {
            var dt = parseIso(input.value);
            root.classList.toggle('has-value', !!dt);
            btn.querySelector('.dd-value').textContent = dt ? longLabel(dt) : 'Pilih tanggal pengiriman';
            var a = parseIso(lo()), b = parseIso(hi());
            btn.querySelector('.dd-sub').textContent = a && b ? 'Tersedia ' + shortLabel(a) + ' sampai ' + shortLabel(b) : (dt ? '' : 'Opsional');
        }

        function render(dir) {
            title.textContent = BULAN[viewM] + ' ' + viewY;
            var first = new Date(viewY, viewM, 1), lead = (first.getDay() + 6) % 7, count = new Date(viewY, viewM + 1, 0).getDate();
            var sel = input.value, now = todayIso(), html = '';
            for (var k = 0; k < lead; k++) html += '<span class="dd-blank"></span>';
            for (var d = 1; d <= count; d++) {
                var v = viewY + '-' + pad(viewM + 1) + '-' + pad(d), ok = inRange(v);
                html += '<button type="button" tabindex="-1" role="gridcell" class="dd-day' + (v === now ? ' is-today' : '') + (v === sel ? ' is-sel' : '') + (v === active ? ' is-active' : '') + '"' +
                    ' id="' + id + '-d' + v + '" data-d="' + v + '" aria-selected="' + (v === sel) + '"' + (ok ? '' : ' disabled aria-disabled="true"') + '>' + d + '</button>';
            }
            grid.innerHTML = html;
            var prevEnd = isoOf(new Date(viewY, viewM, 0)), nextStart = isoOf(new Date(viewY, viewM + 1, 1));
            navPrev.disabled = !!lo() && prevEnd < lo();
            navNext.disabled = !!hi() && nextStart > hi();
            btnToday.disabled = !inRange(now);
            btnClear.disabled = !input.value;
            if (active) btn.setAttribute('aria-activedescendant', id + '-d' + active);
            if (dir) { grid.classList.remove('is-from-l', 'is-from-r'); void grid.offsetWidth; grid.classList.add(dir > 0 ? 'is-from-r' : 'is-from-l'); }
        }
        function gotoMonth(y, m, dir) { var dt = new Date(y, m, 1); viewY = dt.getFullYear(); viewM = dt.getMonth(); render(dir); }
        function setActive(v) {
            v = clamp(v); var dt = parseIso(v); if (!dt) return;
            var dir = (dt.getFullYear() * 12 + dt.getMonth()) - (viewY * 12 + viewM);
            active = v; viewY = dt.getFullYear(); viewM = dt.getMonth(); render(dir === 0 ? 0 : (dir > 0 ? 1 : -1));
        }
        function addDays(v, n) { var dt = parseIso(v); dt.setDate(dt.getDate() + n); return isoOf(dt); }
        function addMonths(v, n) {
            var dt = parseIso(v), d = dt.getDate(), t = new Date(dt.getFullYear(), dt.getMonth() + n, 1);
            t.setDate(Math.min(d, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate())); return isoOf(t);
        }

        function open() {
            if (root.classList.contains('is-open')) return;
            if (openOne && openOne !== api) openOne.close();
            var r = btn.getBoundingClientRect();
            var below = window.innerHeight - r.bottom - (window.innerWidth <= 767 ? 84 : 12);
            root.classList.toggle('is-up', below < 400 && (r.top - 72) > below);
            active = clamp(input.value || todayIso());
            var dt = parseIso(active); viewY = dt.getFullYear(); viewM = dt.getMonth(); render(0);
            root.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); openOne = api;
            // Geser halaman bila kalender terpotong bar atas / tab bar bawah.
            requestAnimationFrame(function () {
                var pr = pop.getBoundingClientRect(), topLimit = 72, bottomLimit = window.innerHeight - (window.innerWidth <= 767 ? 84 : 12);
                var dy = pr.bottom > bottomLimit ? pr.bottom - bottomLimit : (pr.top < topLimit ? pr.top - topLimit : 0);
                if (dy) window.scrollBy({ top: dy, behavior: 'smooth' });
            });
        }
        function close(refocus) {
            if (!root.classList.contains('is-open')) return;
            root.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant');
            if (openOne === api) openOne = null;
            if (refocus) btn.focus();
        }
        function commit(v) {
            input.value = v;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            sync(); render(0);
            setTimeout(function () { close(true); }, 170);   // jeda singkat agar animasi pilih terlihat
        }

        btn.addEventListener('click', function () { root.classList.contains('is-open') ? close() : open(); });
        pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
        pop.addEventListener('click', function (e) {
            var day = e.target.closest('.dd-day'), nav = e.target.closest('.dd-cal-nav'), act = e.target.closest('.dd-cal-act');
            if (day && !day.disabled) commit(day.getAttribute('data-d'));
            else if (nav && !nav.disabled) { var n = +nav.getAttribute('data-nav'); gotoMonth(viewY, viewM + n, n); }
            else if (act && !act.disabled) {
                if (act.getAttribute('data-act') === 'today') commit(clamp(todayIso()));
                else { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); sync(); render(0); setTimeout(function () { close(true); }, 170); }
            }
        });
        btn.addEventListener('keydown', function (e) {
            var isOpen = root.classList.contains('is-open'), k = e.key;
            if (!isOpen) { if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); open(); } return; }
            if (k === 'ArrowLeft') { e.preventDefault(); setActive(addDays(active, -1)); }
            else if (k === 'ArrowRight') { e.preventDefault(); setActive(addDays(active, 1)); }
            else if (k === 'ArrowUp') { e.preventDefault(); setActive(addDays(active, -7)); }
            else if (k === 'ArrowDown') { e.preventDefault(); setActive(addDays(active, 7)); }
            else if (k === 'PageUp') { e.preventDefault(); setActive(addMonths(active, -1)); }
            else if (k === 'PageDown') { e.preventDefault(); setActive(addMonths(active, 1)); }
            else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (inRange(active)) commit(active); }
            else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
            else if (k === 'Tab') { close(); }
        });
        btn.addEventListener('blur', function () { setTimeout(function () { if (!root.contains(document.activeElement)) close(); }, 0); });

        var lbl = document.querySelector('label[for="tanggalKirim"]');
        if (lbl) lbl.addEventListener('click', function (e) { e.preventDefault(); btn.focus(); open(); });
        // Batas tanggal / nilai bisa diubah oleh skrip halaman (jadwal dari server, reset formulir).
        if ('MutationObserver' in window) new MutationObserver(function () { sync(); if (root.classList.contains('is-open')) render(0); })
            .observe(input, { attributes: true, attributeFilter: ['min', 'max', 'value'] });
        if (input.form) input.form.addEventListener('reset', function () { setTimeout(function () { sync(); }, 0); });

        var api = { sync: sync, close: close, button: btn, name: 'tanggalKirim' };
        instances.push(api);
        sync();
    }

    function init() {
        build({ name: 'wilayah', source: '#wilayah .opt-grid', labelledBy: '#wilayah > legend', placeholder: 'Pilih area pengiriman', emptyIcon: 'fas fa-map-marker-alt' });
        build({ name: 'bagianR', source: '#bagianRow .seg-grid', labelledBy: '#bagianLbl', placeholder: 'Pilih bagian Surabaya' });
        build({ name: 'pembayaran', source: '#metodeBayar .opt-grid', labelledBy: '#lblBayar', placeholder: 'Pilih metode pembayaran', emptyIcon: 'fas fa-wallet' });
        buildDate();
    }

    // Dipanggil dari order-sekarang.html setelah radio diubah lewat skrip (bukan klik).
    window.mfDDSync = function () { instances.forEach(function (i) { i.sync(); }); };
    // Fokus ke pemicu dropdown (menggantikan fokus ke radio yang kini tersembunyi).
    window.mfDDFocus = function (name) {
        for (var k = 0; k < instances.length; k++) if (instances[k].name === name) return instances[k].button;
        return null;
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
