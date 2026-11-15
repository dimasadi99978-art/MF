/* Micro interaction Margaluyu Farm (semua halaman):
   - fade antarhalaman saat tautan internal diklik
   - riak sentuhan pada tombol utama */
(function () {
    'use strict';
    var root = document.documentElement;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var LEAVE_MS = 280;

    /* ---------- Fade antarhalaman ---------- */
    document.addEventListener('click', function (e) {
        if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
        var u;
        try { u = new URL(a.href, location.href); } catch (x) { return; }
        if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return;
        if (u.pathname === location.pathname && u.search === location.search) return; // #bagian di halaman yang sama
        if (root.classList.contains('np-leaving')) return;
        e.preventDefault();
        root.classList.add('np-leaving');
        setTimeout(function () { location.href = a.href; }, LEAVE_MS);
    });
    window.addEventListener('pageshow', function (e) {
        root.classList.remove('np-leaving');
        if (e.persisted) root.classList.add('mo-restored');
    });

    /* ---------- Riak pada tombol ---------- */
    var SEL = '.btn, .btn-primary, .btn-submit, .pdx-btn, .lp-btn, .lp-btn-ghost, .btn-promo, .ok-btn, .menu-cta, .filter-btn, .refresh-btn, header.site-top .menu-panel a.menu-link, .dd-trigger, .dd-opt, .dd-day, .dd-cal-nav, .dd-cal-act';
    document.addEventListener('pointerdown', function (e) {
        if (reduce) return;
        var b = e.target.closest && e.target.closest(SEL);
        if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
        b.classList.add('mo-btn');
        var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
        var s = document.createElement('span');
        s.className = 'mo-ripple';
        s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
        b.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
    }, { passive: true });

    /* ---------- Navbar pill: jadwal urutan mengecil/melebar ----------
       Kecepatan tetap (px/detik) => pill menyusut dari ujung, lalu label hilang berurutan dari kanan ke kiri. */
    var SPEED = 700; // px per detik; makin kecil makin pelan (520 terlalu lambat, 1000 terlalu cepat)
    function scheduleNav() {
        var header = document.querySelector('header.site-top');
        if (!header || window.innerWidth < 900) return;
        var box = header.querySelector('.container');
        var iconW = parseFloat(header.style.getPropertyValue('--np-w')) || 0;
        if (!box || !iconW) return;
        var items = []; // kiri -> kanan
        var bn = header.querySelector('.brand-name');
        if (bn) items.push({ els: [bn], extra: 0, margin: 10 });
        header.querySelectorAll('.menu-panel a.menu-link').forEach(function (a) {
            var t = a.querySelector('.ml-t'); if (t) items.push({ els: [t, a], extra: 6, margin: 8 });
        });
        var cta = header.querySelector('.menu-panel a.menu-cta');
        var lab = cta && cta.querySelector('.np-label');
        if (lab) { var f = header.querySelector('.menu-foot'); items.push({ els: f ? [lab, cta, f] : [lab, cta], extra: 16, margin: 8 }); }
        var total = 0;
        items.forEach(function (it) { it.w = it.els[0].scrollWidth + it.margin + it.extra; total += it.w; });
        var full = Math.min(window.innerWidth - 48, 1080);
        var span = Math.max(full - iconW, total);
        var free = Math.max(0, span - total);       // ruang kosong di dalam pill (menyusut lebih dulu)
        box.style.setProperty('--np-full', full + 'px');
        box.style.setProperty('--np-T', (span / SPEED).toFixed(3) + 's');
        var acc = free;                             // menciut: kanan -> kiri
        for (var i = items.length - 1; i >= 0; i--) {
            items[i].dc = acc / SPEED; acc += items[i].w;
        }
        acc = 0;                                    // melebar: juga kanan -> kiri
        for (var k = items.length - 1; k >= 0; k--) { items[k].de = acc / SPEED; acc += items[k].w; }
        items.forEach(function (it) {
            it.els[0].style.setProperty('--mw', it.els[0].scrollWidth + 'px'); // titik awal max-width = lebar teks nyata (tanpa waktu mati)
            it.els.forEach(function (el) {
                el.style.setProperty('--du', (it.w / SPEED).toFixed(3) + 's');
                el.style.setProperty('--dc', it.dc.toFixed(3) + 's');
                el.style.setProperty('--de', it.de.toFixed(3) + 's');
            });
        });
    }
    function startNav() {
        // navpill.js (defer) mengukur --np-w lebih dulu; jalankan setelahnya & saat ukuran berubah
        setTimeout(scheduleNav, 0);
        window.addEventListener('load', function () { setTimeout(scheduleNav, 60); });
        window.addEventListener('resize', function () { setTimeout(scheduleNav, 60); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(scheduleNav, 60); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startNav); else startNav();
})();
