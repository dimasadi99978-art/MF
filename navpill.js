/* Navigasi Margaluyu Farm: pill melayang (desktop) dan tab bar bawah (HP).
   Markup ikon dan tab bar sudah statis di HTML (agar tidak berkedip saat pindah halaman).
   Skrip ini mengurus perilaku:
   - pill mengecil jadi ikon HANYA bila halaman memang bisa di-scroll (halaman pendek tetap rapi, penuh);
   - mengukur lebar mode ikon;
   - menyembunyikan tab bar saat keyboard layar terbuka;
   (fade antarhalaman dan riak tombol ada di motion.js). */
(function () {
    'use strict';
    var root = document.documentElement;

    function init() {
        var header = document.querySelector('header.site-top');
        if (!header) return;
        var box = header.querySelector('.container');

        /* ---------- Judul tooltip untuk mode ikon ---------- */
        header.querySelectorAll('.menu-panel a.menu-link').forEach(function (a) {
            var t = a.querySelector('.ml-t');
            if (t && !a.title) a.title = t.textContent.trim();
        });
        var cta = header.querySelector('.menu-panel a.menu-cta');
        if (cta && !cta.title) cta.title = cta.textContent.trim();

        /* ---------- Lebar mode ikon (diukur agar transisi halus & presisi) ---------- */
        function measure() {
            if (!box || window.innerWidth < 900) return;
            header.classList.add('np-measure');
            var w = Math.ceil(box.getBoundingClientRect().width);
            header.classList.remove('np-measure');
            if (w > 120) header.style.setProperty('--np-w', w + 'px');
        }
        measure();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
        window.addEventListener('load', measure);
        window.addEventListener('resize', measure);

        /* ---------- Mengecil saat scroll, hanya pada halaman yang bisa di-scroll ----------
           Histeresis agar tidak berkedip di ambang. Halaman dengan rentang scroll < 400px
           (kebanyakan halaman selain beranda) dibiarkan penuh. */
        var compact = false, ticking = false, ready = false;
        function update() {
            ticking = false;
            var y = window.pageYOffset || root.scrollTop || 0;
            var range = root.scrollHeight - window.innerHeight;
            var next = compact;
            if (range < 400) next = false;
            else if (!compact && y > 72) next = true;
            else if (compact && y < 24) next = false;
            // Animasi ukuran baru dinyalakan ketika scroll sungguhan mengubah keadaan pill.
            // Sebelum itu (puncak halaman, halaman pendek, pemuatan awal) pill diam tanpa gerak ukuran.
            if (next !== compact && ready) header.classList.add('np-anim');
            compact = next;
            header.classList.toggle('is-compact', compact);
        }
        function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', queue);
        window.addEventListener('load', queue);
        // Isi halaman bisa bertambah panjang setelah data dimuat (daftar, ulasan, dll.).
        if ('ResizeObserver' in window) new ResizeObserver(queue).observe(document.body);
        update();
        // Pemulihan posisi scroll saat muat ulang tidak dianimasikan: animasi aktif setelah halaman tenang.
        function arm() { setTimeout(function () { ready = true; }, 250); }
        if (document.readyState === 'complete') arm(); else window.addEventListener('load', arm);
        // Pill sudah menciut (mis. hasil pemulihan scroll) lalu di-hover/difokus: pastikan pelebarannya mulus.
        function armHover() { if (compact) header.classList.add('np-anim'); }
        if (box) { box.addEventListener('mouseenter', armHover); box.addEventListener('focusin', armHover); }

        /* ---------- Sembunyikan tab bar saat mengetik (keyboard layar) ---------- */
        function isField(el) { return el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(checkbox|radio|button|submit|file)$/.test(el.type || ''); }
        document.addEventListener('focusin', function (e) { if (isField(e.target) && window.innerWidth < 900) root.classList.add('np-kb'); });
        document.addEventListener('focusout', function () { setTimeout(function () { if (!isField(document.activeElement)) root.classList.remove('np-kb'); }, 60); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
