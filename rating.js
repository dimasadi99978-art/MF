// Formulir Rating & Kritik/Saran.
// Mekanisme penyimpanan tidak berubah: data dikirim lewat TestimoniStore.add()
// (penyimpanan bersama jika sudah dikonfigurasi, dengan cadangan lokal).
(function () {
    'use strict';

    var HINTS = { 1: 'Kurang', 2: 'Cukup', 3: 'Baik', 4: 'Sangat baik', 5: 'Istimewa' };

    var form = document.getElementById('ratingForm');
    if (!form) return;

    var namaEl = document.getElementById('nama');
    var namaError = document.getElementById('namaError');
    var anonEl = document.getElementById('anonim');
    var orderIdRewardEl = document.getElementById('orderIdReward');
    var orderErrorEl = document.getElementById('orderError');
    var orderHelpEl = document.getElementById('orderHelp');
    var orderChangeBtn = document.getElementById('orderChange');
    var orderManualEl = document.getElementById('orderIdManual');
    var recoverBtn = document.getElementById('recoverBtn');
    var walletEl = document.getElementById('voucherWallet');
    var voucherSlot = document.getElementById('voucherSlot');
    var ORDER_RE = /^MF-[A-Z0-9-]{6,24}$/;
    var voucherRewardText = document.getElementById('voucherRewardText');

    // Opsi samarkan nama: nama tetap diisi, tetapi hanya sebagian yang ditampilkan (mis. "Budi S.").
    // Pembuatan nama samaran dilakukan di server, sehingga nama lengkap tidak pernah disimpan.
    function maskName(raw) {
        var parts = String(raw || '').trim().split(/\s+/).filter(Boolean).slice(0, 3);
        if (!parts.length) return '';
        return parts.map(function (w) {
            var c = Array.from(w);
            return c.length === 1 ? c[0] : c.length === 2 ? c[0] + '*' : c[0] + '***' + c[c.length - 1];
        }).join(' ');
    }
    var anonPreviewEl = document.getElementById('anonPreview');
    var anonDefault = anonPreviewEl ? anonPreviewEl.textContent : '';
    function syncAnon() {
        if (!anonPreviewEl) return;
        var m = anonEl && anonEl.checked ? maskName(namaEl.value) : '';
        anonPreviewEl.textContent = m ? 'Akan tampil sebagai: ' + m : anonDefault;
    }
    if (anonEl) anonEl.addEventListener('change', syncAnon);
    var komentarEl = document.getElementById('komentar');
    var kritikSaranEl = document.getElementById('kritiksaran');
    var fotoEl = document.getElementById('foto');
    var fotoError = document.getElementById('fotoError');
    var photoRemove = document.getElementById('photoRemove');
    var fotoPick = document.getElementById('fotoPick');
    var fotoHint = document.getElementById('fotoHint');
    var successCard = document.getElementById('ratingSuccessCard');
    var submitBtn = document.getElementById('submitBtn');
    var msg = document.getElementById('formMsg');
    var hint = document.getElementById('starHint');
    var busy = false;
    var fotoData = '';
    var mediaOn = typeof TestimoniMedia !== 'undefined' && TestimoniMedia.isConfigured();
    // Foto yang diunggah ke Cloudinary boleh lebih besar. Tanpa Cloudinary, foto disimpan langsung di
    // data testimoni (JSONBin gratis hanya ±100KB per bin), jadi harus sangat kecil.
    var MAX_PHOTO_BYTES = mediaOn ? 150 * 1024 : 20 * 1024;

    // Kirim ulang masukan yang sebelumnya gagal terkirim (jika ada).
    if (typeof TestimoniStore !== 'undefined' && TestimoniStore.isConfigured()) {
        TestimoniStore.syncPending().catch(function () {});
    }

    function showMsg(kind, text) {
        msg.className = 'form-msg notice notice--' + kind;
        msg.textContent = text;
        msg.hidden = false;
    }
    function clearMsg() { msg.hidden = true; msg.textContent = ''; if (orderErrorEl) orderErrorEl.textContent = ''; }

    function setBusy(state) {
        busy = state;
        submitBtn.disabled = state;
        submitBtn.textContent = '';
        if (state) {
            var sp = document.createElement('span');
            sp.className = 'spinner';
            sp.setAttribute('aria-hidden', 'true');
            submitBtn.appendChild(sp);
            submitBtn.appendChild(document.createTextNode(' Mengirim...'));
        } else {
            submitBtn.textContent = 'Kirim';
        }
    }

    function selectedRating() {
        var checked = form.querySelector('input[name="rating"]:checked');
        return checked ? Number(checked.value) : 0;
    }

    function clearPhoto() {
        fotoData = '';
        fotoEl.value = '';
        fotoError.textContent = '';
        showPhotoName('');
    }

    // Tampilkan hanya nama file; tombol Hapus muncul saat ada file.
    function showPhotoName(name) {
        fotoHint.textContent = name || 'Belum ada file';
        fotoHint.title = name || '';
        fotoHint.classList.toggle('has-file', !!name);
        fotoPick.textContent = name ? 'Ganti file' : 'Pilih file';
        photoRemove.hidden = !name;
    }

    function compressPhoto(file) {
        return new Promise(function (resolve, reject) {
            if (!file || !file.type || file.type.indexOf('image/') !== 0) {
                reject(new Error('Pilih file gambar.'));
                return;
            }
            var reader = new FileReader();
            reader.onerror = function () { reject(new Error('Foto tidak dapat dibaca.')); };
            reader.onload = function () {
                var img = new Image();
                img.onerror = function () { reject(new Error('Foto tidak dapat diproses.')); };
                img.onload = function () {
                    var sides = mediaOn ? [1000, 800] : [640, 520, 440, 360, 300];
                    var result = '';
                    for (var si = 0; si < sides.length; si++) {
                        var maxSide = sides[si];
                        var scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
                        var canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
                        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
                        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                        var quality = 0.78;
                        var dataUrl = canvas.toDataURL('image/jpeg', quality);
                        // Turunkan kualitas bertahap agar data tetap ringan.
                        while (dataUrl.length * 0.75 > MAX_PHOTO_BYTES && quality > 0.45) {
                            quality -= 0.08;
                            dataUrl = canvas.toDataURL('image/jpeg', quality);
                        }
                        if (dataUrl.length * 0.75 <= MAX_PHOTO_BYTES) { result = dataUrl; break; }
                    }
                    if (!result) {
                        reject(new Error('Ukuran foto masih terlalu besar. Pilih foto yang lebih kecil.'));
                        return;
                    }
                    resolve(result);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    fotoEl.addEventListener('change', async function () {
        fotoError.textContent = '';
        var file = fotoEl.files && fotoEl.files[0];
        if (!file) { clearPhoto(); return; }
        if (file.size > 8 * 1024 * 1024) {
            clearPhoto();
            fotoError.textContent = 'Ukuran foto maksimal 8 MB.';
            return;
        }
        try {
            fotoData = await compressPhoto(file);
            showPhotoName(file.name);
        } catch (e) {
            clearPhoto();
            fotoError.textContent = e && e.message ? e.message : 'Foto belum dapat diproses.';
        }
    });

    photoRemove.addEventListener('click', clearPhoto);

    form.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'rating') {
            var v = selectedRating();
            hint.textContent = v ? (v + ' dari 5 — ' + HINTS[v]) : 'Ketuk bintang untuk memberi nilai';
        }
    });

    function setOrderLocked(lock) {
        orderManualEl.readOnly = lock;
        orderManualEl.classList.toggle('is-locked', lock);
        if (orderChangeBtn) orderChangeBtn.hidden = !lock;
    }
    if (orderChangeBtn) orderChangeBtn.addEventListener('click', function () {
        setOrderLocked(false);
        orderManualEl.value = '';
        orderHelpEl.textContent = 'Ketik nomor pesanan dari struk.';
        orderManualEl.focus();
    });
    if (orderManualEl) orderManualEl.addEventListener('input', function () {
        orderManualEl.value = orderManualEl.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        orderErrorEl.textContent = '';
    });

    // Datang dari ajakan di halaman Order Tracking (?bintang=5&nama=Ani): isi bintang & nama otomatis.
    (function prefillFromLink() {
        try {
            var q = new URLSearchParams(window.location.search);
            var n = parseInt(q.get('bintang'), 10);
            if (n >= 1 && n <= 5) {
                var radio = document.getElementById('star' + n);
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            var ord = (q.get('order') || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30);
            var fromLink = ORDER_RE.test(ord);
            // Nomor pesanan tidak pernah diketik pelanggan: dari tautan, atau pesanan terbaru di perangkat ini yang belum diulas.
            var mine = typeof MyOrders !== 'undefined' ? ((fromLink && MyOrders.find(ord)) || MyOrders.latestToReview() || null) : null;
            if (!fromLink && mine) ord = mine.id;
            if (ORDER_RE.test(ord) && mine) {
                // Pesanan dikenali di perangkat ini: nomor terisi otomatis dan terkunci.
                var sudah = mine.ulasan;
                orderManualEl.value = ord;
                orderIdRewardEl.dataset.order = ord;
                if (sudah) {
                    orderHelpEl.textContent = 'Pesanan ini sudah diulas. Voucher Anda ada di bagian atas halaman.';
                    if (recoverBtn) recoverBtn.hidden = false;
                } else {
                    orderHelpEl.textContent = 'Terisi otomatis dari pesanan Anda di perangkat ini.';
                    setOrderLocked(true);
                }
            } else {
                // Perangkat lain / pesanan tidak terdeteksi: pelanggan mengetik sendiri (atau terisi dari tautan).
                if (ORDER_RE.test(ord)) orderManualEl.value = ord;
                orderHelpEl.textContent = 'Pesanan tidak terdeteksi di perangkat ini. Ketik nomor pesanan dari struk agar voucher terbit.';
            }
            if (mine && !q.get('nama') && mine.nama && !namaEl.value) namaEl.value = mine.nama;
            var nm = (q.get('nama') || '').trim().slice(0, 60);
            if (nm && !namaEl.value) namaEl.value = nm;
        } catch (e) { /* abaikan: form tetap bisa diisi manual */ }
    })();

    namaEl.addEventListener('input', function () {
        syncAnon();
        namaEl.classList.remove('is-invalid');
        namaError.textContent = '';
    });

    function rp(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); }
    function tglIndo(iso) {
        var d = new Date(String(iso) + 'T00:00:00');
        return isNaN(d) ? String(iso) : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    function tglPendek(iso) {
        var d = new Date(String(iso) + 'T00:00:00');
        return isNaN(d) ? String(iso) : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
    function sisaHari(iso) { var d = Math.round((new Date(String(iso) + 'T23:59:59') - new Date()) / 864e5); return d; }
    // Barcode Code 128 (set B) sungguhan yang memuat kode voucher, sehingga bisa dipindai.
    var C128 = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232'];
    function code128(text) {
        var codes = [104], sum = 104, n = 0;
        String(text || '').split('').forEach(function (ch) {
            var v = ch.charCodeAt(0) - 32;
            if (v < 0 || v > 94) return;
            n++; codes.push(v); sum += v * n;
        });
        codes.push(sum % 103);
        var bars = [], x = 10; // 10 modul ruang kosong di kiri
        codes.map(function (c) { return C128[c]; }).concat(['2331112']).forEach(function (p) {
            for (var i = 0; i < p.length; i++) {
                var w = +p.charAt(i);
                if (i % 2 === 0) bars.push([x, w]);
                x += w;
            }
        });
        return { bars: bars, width: x + 10 };
    }
    function barSvg(kode) {
        var c = code128(kode);
        var r = c.bars.map(function (b) { return '<rect x="' + b[0] + '" y="0" width="' + b[1] + '" height="40"/>'; }).join('');
        return '<svg class="vr-bars" viewBox="0 0 ' + c.width + ' 40" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="Barcode kode voucher" fill="currentColor">' + r + '</svg>';
    }
    // Gambar voucher untuk disimpan (PNG, tampilan sama dengan di layar).
    function voucherImage(v, orderId, done) {
        var W = 360, M = 16, L = 40, R = W - 40, S = 3, T = 6;
        var INK = '#1f2d28', MUTED = '#5b6962', LINE = '#b9b29d', BRAND = '#0a3d38', BG = '#efe9da';
        var MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace';
        var sisa = sisaHari(v.berlaku_sampai);
        var logo = new Image();
        function draw(g, H, paint) {
            var y = M + T + 28;
            if (paint) {
                g.fillStyle = BG; g.fillRect(0, 0, W, H);
                g.fillStyle = '#fff'; g.beginPath(); g.moveTo(M, M + T);
                var n = Math.round((W - 2 * M) / 12), st = (W - 2 * M) / n, i;
                for (i = 0; i < n; i++) { g.lineTo(M + i * st + st / 2, M); g.lineTo(M + (i + 1) * st, M + T); }
                g.lineTo(W - M, H - M - T);
                for (i = n; i > 0; i--) { g.lineTo(M + i * st - st / 2, H - M); g.lineTo(M + (i - 1) * st, H - M - T); }
                g.closePath(); g.fill();
            }
            function txt(t, size, weight, color, x, al, sp) {
                g.font = weight + ' ' + size + 'px ' + MONO; g.fillStyle = color; g.textAlign = al || 'center';
                if ('letterSpacing' in g) g.letterSpacing = (sp || 0) + 'px';
                g.fillText(t, x == null ? W / 2 : x, y);
                if ('letterSpacing' in g) g.letterSpacing = '0px';
            }
            function dash() { g.strokeStyle = LINE; g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(L, y + .5); g.lineTo(R, y + .5); g.stroke(); g.setLineDash([]); }
            function row(l, r, bold) { txt(l, 12, 400, MUTED, L, 'left'); txt(r, 12, bold === false ? 400 : 700, INK, R, 'right'); y += 21; }
            if (logo.naturalWidth) { try { g.drawImage(logo, W / 2 - 22, y - 4, 44, 44); } catch (e) {} }
            y += 44 + 18; txt('MARGALUYU FARM', 18, 700, BRAND, null, 'center', .4); y += 17;
            txt('Surabaya, Jawa Timur', 11, 400, MUTED); y += 24;
            txt('STRUK VOUCHER APRESIASI', 11, 700, INK, null, 'center', .9); y += 14;
            dash(); y += 22;
            if (orderId) row('Pesanan', orderId);
            row('Jenis', 'Voucher ulasan');
            y -= 8; dash(); y += 26;
            txt('POTONGAN', 11, 400, MUTED, null, 'center', 1.2); y += 38;
            txt(rp(v.nilai), 38, 700, BRAND); y += 24;
            if (paint) {
                g.fillStyle = '#eef6f0'; g.fillRect(L, y, R - L, 46);
                g.strokeStyle = '#8fbf9e'; g.lineWidth = 1; g.setLineDash([5, 4]); g.strokeRect(L + .5, y + .5, R - L - 1, 45); g.setLineDash([]);
            }
            y += 29; txt(v.kode, 19, 700, BRAND, null, 'center', .6); y += 36;
            row('Minimal belanja', v.min_belanja > 0 ? rp(v.min_belanja) : 'Tanpa minimal');
            row('Berlaku sampai', tglPendek(v.berlaku_sampai));
            if (sisa >= 0) row('Sisa waktu', sisa === 0 ? 'Hari ini' : sisa + ' hari lagi');
            row('Pemakaian', 'Sekali pakai');
            y -= 8; dash(); y += 24;
            txt('CARA PAKAI', 11, 700, INK, null, 'center', .9); y += 20;
            ['Buka Order Sekarang, kode terisi', 'otomatis dan potongan langsung', 'terhitung di total.'].forEach(function (t) { txt(t, 12, 400, MUTED); y += 17; });
            y -= 4; dash(); y += 26;
            var c = code128(v.kode), mw = Math.min(1.7, (R - L) / c.width), bx = (W - c.width * mw) / 2;
            if (paint) { g.fillStyle = INK; c.bars.forEach(function (b) { g.fillRect(bx + b[0] * mw, y, b[1] * mw, 44); }); }
            y += 44 + 22; txt('Terima kasih sudah mengulas!', 12.5, 700, INK); y += 14;
            return y + M + T + 14;
        }
        function finish() {
            var H = Math.ceil(draw(document.createElement('canvas').getContext('2d'), 0, false));
            var c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
            var g = c.getContext('2d'); g.scale(S, S);
            draw(g, H, true);
            done(c.toDataURL('image/png'));
        }
        logo.onload = finish; logo.onerror = finish; logo.src = 'img/logo-mark.png';
    }
    // Voucher bergaya struk: nilai, kode, syarat, dan cara menyimpannya.
    function buildTicket(v, headline, orderId) {
        var rec = (typeof MFVoucher !== 'undefined' && MFVoucher.find(v.kode)) || {};
        var telepon = String(v.telepon || rec.telepon || '').replace(/[^0-9]/g, '');
        var order = String(orderId || v.order || rec.order || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
        var left = sisaHari(v.berlaku_sampai);
        var wrap = el('div', 'vr-wrap');
        var t = el('div', 'vr');
        t.appendChild(el('div', 'vr-head', '<img src="img/logo-mark.png" alt="" width="44" height="44"><strong>MARGALUYU FARM</strong><span>Surabaya, Jawa Timur</span><b>STRUK VOUCHER APRESIASI</b>'));
        var info = el('dl', 'vr-rows');
        if (order) info.appendChild(el('div', '', '<dt>Pesanan</dt><dd>' + order + '</dd>'));
        info.appendChild(el('div', '', '<dt>Jenis</dt><dd>Voucher ulasan</dd>'));
        t.appendChild(info);
        t.appendChild(el('div', 'vr-amount', '<small>POTONGAN</small><strong>' + rp(v.nilai) + '</strong>'));
        var code = el('code', 'vr-code'); code.textContent = v.kode; t.appendChild(code);
        var rows = el('dl', 'vr-rows');
        rows.appendChild(el('div', '', '<dt>Minimal belanja</dt><dd>' + (v.min_belanja > 0 ? rp(v.min_belanja) : 'Tanpa minimal') + '</dd>'));
        rows.appendChild(el('div', '', '<dt>Berlaku sampai</dt><dd>' + tglPendek(v.berlaku_sampai) + '</dd>'));
        if (left >= 0) rows.appendChild(el('div', left <= 7 ? 'is-soon' : '', '<dt>Sisa waktu</dt><dd>' + (left === 0 ? 'Hari ini' : left + ' hari lagi') + '</dd>'));
        rows.appendChild(el('div', '', '<dt>Pemakaian</dt><dd>Sekali pakai</dd>'));
        t.appendChild(rows);
        t.appendChild(el('div', 'vr-how', '<b>CARA PAKAI</b><p>Buka Order Sekarang, kode terisi otomatis dan potongan langsung terhitung di total.</p>'));
        t.appendChild(el('div', 'vr-foot', barSvg(v.kode) + '<p>Terima kasih sudah mengulas!</p>'));
        wrap.appendChild(t);

        var act = el('div', 'vt-actions');
        var use = el('a', 'vt-btn vt-btn--main', 'Pakai voucher sekarang');
        use.href = 'order-sekarang.html?voucher=' + encodeURIComponent(v.kode);
        act.appendChild(use);
        var copy = el('button', 'vt-btn', 'Salin kode'); copy.type = 'button';
        copy.onclick = function () {
            var done = function () { copy.textContent = 'Tersalin'; setTimeout(function () { copy.textContent = 'Salin kode'; }, 2000); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v.kode).then(done, function () {});
            else { var r = document.createRange(); r.selectNodeContents(code); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); try { document.execCommand('copy'); done(); } catch (e) {} }
        };
        act.appendChild(copy);
        var img = el('button', 'vt-btn', 'Simpan gambar'); img.type = 'button';
        img.onclick = function () { voucherImage(v, order, function (url) { var a = document.createElement('a'); a.href = url; a.download = 'voucher-' + v.kode + '.png'; document.body.appendChild(a); a.click(); a.remove(); }); };
        act.appendChild(img);
        var wa = el('a', 'vt-btn', 'Kirim ke WhatsApp');
        var pesan = 'Voucher Margaluyu Farm: ' + v.kode + '\nPotongan ' + rp(v.nilai) + (v.min_belanja > 0 ? ', min. belanja ' + rp(v.min_belanja) : ', tanpa minimal belanja') + ', berlaku sampai ' + tglIndo(v.berlaku_sampai) + '.\nPakai di: ' + location.origin + '/order-sekarang.html?voucher=' + encodeURIComponent(v.kode);
        wa.href = 'https://wa.me/' + (telepon ? telepon.replace(/^0/, '62') : '') + '?text=' + encodeURIComponent(pesan);
        wa.target = '_blank'; wa.rel = 'noopener';
        act.appendChild(wa);
        var box = el('div');
        box.appendChild(wrap);
        box.appendChild(act);
        box.appendChild(el('p', 'vt-save-note', 'Voucher tersimpan di perangkat ini dan terisi sendiri di formulir order. Kalau hilang, isi nomor pesanan yang sama di halaman ini lalu tekan <b>Tampilkan voucher saya</b>.'));
        return box;
    }
    // Simpan ke perangkat (daftar voucher) lalu kembalikan catatannya. Nomor WhatsApp pelanggan diambil dari pesanan yang diingat perangkat.
    function keepVoucher(v, orderId) {
        var mine = (typeof MyOrders !== 'undefined' && orderId) ? MyOrders.find(orderId) : null;
        var rec = typeof MFVoucher !== 'undefined' ? MFVoucher.save(v, { order: orderId, telepon: mine && mine.telepon }) : null;
        return rec || v;
    }
    function renderWallet() {
        if (!walletEl || typeof MFVoucher === 'undefined') return;
        var v = MFVoucher.best();
        walletEl.textContent = '';
        if (!v) { walletEl.hidden = true; return; }
        walletEl.appendChild(el('div', 'vw-head', '<i class="fas fa-ticket-alt" aria-hidden="true"></i> Voucher Anda'));
        walletEl.appendChild(buildTicket(v, 'Voucher apresiasi pelanggan'));
        walletEl.hidden = false;
    }
    function showVoucherInCard(v) {
        if (!voucherSlot) return;
        voucherSlot.textContent = '';
        voucherSlot.appendChild(buildTicket(v, 'Voucher apresiasi Anda', v.order));
        if (walletEl) walletEl.hidden = true;
    }
    function showSuccessCard() {
        if (!successCard) return;
        successCard.hidden = false;
        successCard.classList.remove('is-visible');
        void successCard.offsetWidth;
        successCard.classList.add('is-visible');
        successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Tampilkan voucher yang sudah ada di perangkat; bila ada pesanan yang diulas tetapi vouchernya belum tersimpan, ambil dari server.
    if (typeof MFVoucher !== 'undefined') {
        renderWallet();
        MFVoucher.persist();
        MFVoucher.syncForOrders().then(function (n) { if (n) renderWallet(); }).catch(function () {});
    }

    if (recoverBtn) recoverBtn.addEventListener('click', async function () {
        var id = (orderManualEl.value || orderIdRewardEl.dataset.order || '').trim().toUpperCase();
        orderErrorEl.textContent = '';
        if (!ORDER_RE.test(id)) { orderErrorEl.textContent = 'Nomor pesanan belum benar.'; return; }
        var label = recoverBtn.textContent; recoverBtn.disabled = true; recoverBtn.textContent = 'Mencari voucher...';
        var r = await MFVoucher.recover(id);
        recoverBtn.disabled = false; recoverBtn.textContent = label;
        if (!r.ok) { orderErrorEl.textContent = r.error; return; }
        var mine = typeof MyOrders !== 'undefined' ? MyOrders.find(id) : null;
        if (mine && mine.telepon && !r.voucher.telepon) MFVoucher.save(r.voucher, { telepon: mine.telepon });
        if (typeof MyOrders !== 'undefined') MyOrders.markReviewed(id);
        if (successCard) successCard.hidden = true;
        renderWallet();
        if (walletEl && !walletEl.hidden) walletEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (r.voucher.used) orderErrorEl.textContent = 'Voucher untuk pesanan ini sudah pernah dipakai.';
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (busy) return;
        clearMsg();
        if (successCard) successCard.hidden = true;

        var anon = !!(anonEl && anonEl.checked);
        var nama = namaEl.value.trim();
        var rating = selectedRating();
        var komentar = komentarEl.value.trim();
        var kritikSaran = kritikSaranEl.value.trim();
        if (fotoEl.files && fotoEl.files.length && !fotoData) {
            showMsg('error', 'Foto belum siap. Silakan pilih foto kembali atau hapus foto tersebut.');
            return;
        }

        if (!nama) {
            namaEl.classList.add('is-invalid');
            namaError.textContent = 'Mohon isi nama Anda.';
            namaEl.focus();
            return;
        }
        if (!rating && !komentar && !kritikSaran) {
            showMsg('error', 'Mohon isi minimal salah satu: rating, ulasan, atau kritik & saran.');
            return;
        }
        var orderId = orderManualEl.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (orderId && !ORDER_RE.test(orderId)) {
            orderErrorEl.textContent = 'Nomor pesanan belum benar. Contoh: MF-261105-AB12CD. Kosongkan bila hanya ingin mengirim ulasan tanpa voucher.';
            orderManualEl.focus();
            return;
        }

        setBusy(true);

        // Gabungkan semua masukan menjadi satu komentar (format sama seperti sebelumnya)
        var bagian = [];
        if (komentar) bagian.push(komentar);
        if (kritikSaran) bagian.push('Kritik & Saran: ' + kritikSaran);

        var dataBaru = {
            nama: anon ? maskName(nama) : nama,
            rating: rating,
            komentar: bagian.length ? bagian.join(' | ') : '(Tidak ada catatan tambahan)',
            tanggal: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            foto: fotoData || '',
            anonim: anon,
            orderId: orderId
        };

        // Jika Cloudinary dikonfigurasi, foto diunggah ke sana dan hanya alamatnya yang disimpan.
        // Jika gagal, form TIDAK dikosongkan sehingga isian tidak hilang.
        try {
            if (mediaOn && fotoData) {
                var f = await TestimoniMedia.upload(fotoData, 'image');
                dataBaru.foto = f.url;
            }
        } catch (e) {
            setBusy(false);
            showMsg('error', (e && e.message ? e.message : 'Unggahan foto gagal.') + ' Isian Anda masih tersimpan di formulir; silakan coba lagi atau hapus foto lalu kirim.');
            return;
        }

        var result;
        try {
            result = await TestimoniStore.add(dataBaru);
        } catch (e) {
            // Pesanan ini sudah pernah diulas: jangan buntu, tampilkan voucher yang sudah menjadi haknya.
            if (e && e.status === 409 && e.data && e.data.sudahUlasan) {
                setBusy(false);
                var got = e.data.voucher || null;
                if (!got && typeof MFVoucher !== 'undefined' && orderId) { var rr = await MFVoucher.recover(orderId); got = rr.ok ? rr.voucher : null; }
                if (got && !got.used && !got.digunakan) {
                    keepVoucher(got, orderId);
                    if (typeof MyOrders !== 'undefined') MyOrders.markReviewed(orderId);
                    showMsg('warn', 'Pesanan ini sudah pernah diulas, jadi ulasan baru tidak dikirim. Voucher Anda tetap aman dan ditampilkan di atas.');
                    renderWallet();
                    if (walletEl && !walletEl.hidden) walletEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (got) {
                    showMsg('warn', 'Pesanan ini sudah pernah diulas dan voucher-nya sudah dipakai.');
                } else {
                    showMsg('warn', e.message);
                }
                return;
            }
            console.error('Gagal menyimpan masukan:', e);
            setBusy(false);
            showMsg('error', e && e.status && e.status < 500 && e.message ? e.message : 'Masukan belum berhasil dikirim. Silakan coba lagi.');
            return;
        }

        // Berhasil tersimpan di server bersama (terlihat oleh semua pengunjung) -> kartu sukses.
        // Jika tidak: jujur ke pengguna bahwa baru tersimpan di perangkat ini, dan akan dikirim ulang otomatis.
        form.reset();
        syncAnon();
        clearPhoto();
        hint.textContent = 'Ketuk bintang untuk memberi nilai';
        setBusy(false);
        setOrderLocked(false);
        orderManualEl.value = '';
        orderHelpEl.textContent = 'Isi nomor pesanan dari struk agar voucher terbit.';
        if (orderId && typeof MyOrders !== 'undefined') MyOrders.markReviewed(orderId);
        if (voucherSlot) voucherSlot.textContent = '';

        if (voucherRewardText) {
            if (result && result.voucher && result.voucher.kode) {
                voucherRewardText.textContent = 'Voucher Anda sudah terbit dan tersimpan otomatis.';
                showVoucherInCard(keepVoucher(result.voucher, orderId));
            } else if (orderId) voucherRewardText.textContent = (result && result.voucherInfo) || 'Ulasan diterima. Voucher akan terbit otomatis untuk pesanan yang sudah selesai.';
            else voucherRewardText.textContent = '';
        }
        if (result && !result.online && TestimoniStore.isConfigured() && result.error) {
            // Tersimpan di perangkat dan dikirim ulang otomatis; detail hanya untuk log.
            console.warn('Detail kegagalan sinkronisasi testimoni:', result.error);
        }


        if (result && result.moderasi) {
            showMsg('warn', 'Terima kasih! Ulasan Anda sudah kami terima dan akan tampil di halaman Testimoni setelah kami periksa.');
        }
        if (result && result.fotoDibuang) {
            showMsg('warn', 'Ulasan Anda sudah terkirim dan tampil di beranda, tetapi fotonya tidak muat di penyimpanan gratis sehingga tidak ikut tampil.');
        }
        if (successCard) {
            showSuccessCard();
        } else {
            showMsg('success', 'Terima kasih! Rating dan masukan Anda berhasil diberikan.');
            msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
})();
