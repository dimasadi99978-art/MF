/* Penyempurnaan 14 Nov 2026:
   - buka/tutup <details> (FAQ, perbandingan) beranimasi halus
   - riak sentuhan pada kartu kontak dan tombol Tulis pesan
   - tombol "Pilih foto" ringkas di halaman ulasan (input asli tetap dipakai) */
(function () {
    'use strict';
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EASE = 'cubic-bezier(.22,.8,.24,1)';

    /* ---------- Akordeon halus ---------- */
    document.addEventListener('click', function (e) {
        var sum = e.target.closest && e.target.closest('.lp-faq summary');
        if (!sum || reduce || !sum.animate) return;
        var d = sum.parentNode;
        if (!d || d.tagName !== 'DETAILS' || d._rfBusy) return;
        e.preventDefault();
        d._rfBusy = true;
        var start = d.offsetHeight, end;
        if (d.open) {
            end = sum.offsetHeight + (parseFloat(getComputedStyle(d).borderTopWidth) || 0) + (parseFloat(getComputedStyle(d).borderBottomWidth) || 0);
            d.classList.add('is-closing');
        } else {
            d.style.height = start + 'px';
            d.open = true;
            end = d.scrollHeight + (d.offsetHeight - d.clientHeight);
        }
        d.style.overflow = 'hidden';
        var a = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 420, easing: EASE });
        var done = function (open) {
            return function () {
                d.open = open; d.style.height = d.style.overflow = ''; d.classList.remove('is-closing'); d._rfBusy = false;
            };
        };
        var willOpen = !d.classList.contains('is-closing');
        a.onfinish = done(willOpen);
        a.oncancel = done(willOpen);
    });

    /* ---------- Riak sentuhan ---------- */
    var SEL = '.ct-card, .ct-wa, .wa-form button, .lp-faq summary';
    document.addEventListener('pointerdown', function (e) {
        if (reduce) return;
        var b = e.target.closest && e.target.closest(SEL);
        if (!b) return;
        b.classList.add('mo-btn');
        var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
        var s = document.createElement('span');
        s.className = 'mo-ripple';
        s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
        b.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
    }, { passive: true });
})();
