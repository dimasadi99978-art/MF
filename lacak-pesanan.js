// Halaman Order Tracking.
// Fungsi lama dipertahankan: cari via nomor pesanan (MF-...) atau nomor HP, pilih dari daftar bila
// ada beberapa pesanan, stepper status, struk & cetak, dan pelacakan otomatis dari ?id=...
// Status yang dipakai sama dengan sistem saat ini (OrdersStore.STATUS_STEPS).
(function () {
    'use strict';

    var WA_URL = 'https://wa.me/62895635067289?text=Halo%20Margaluyu%20Farm%2C%20saya%20ingin%20menanyakan%20pesanan%20saya';

    var STATUS_LABELS = {
        'Dikonfirmasi': 'Pesanan Anda telah dikonfirmasi dan akan segera diproses.',
        'Dikemas': 'Pesanan Anda sedang dikemas.',
        'Dikirim': 'Pesanan Anda sedang dalam perjalanan menuju alamat pengiriman.',
        'Selesai': 'Pesanan Anda telah diterima. Terima kasih telah berbelanja di Margaluyu Farm!'
    };

    var form = document.getElementById('trackForm');
    if (!form) return;
    var input = document.getElementById('orderIdInput');
    var phoneInput = document.getElementById('phoneInput');
    var trackBtn = document.getElementById('trackBtn');
    var stateBox = document.getElementById('trackState');
    var listBox = document.getElementById('orderList');
    var resultBox = document.getElementById('resultBox');
    var orderIdField = document.getElementById('orderIdField');
    var forgotOrderBtn = document.getElementById('forgotOrderBtn');
    var trackHint = document.getElementById('trackHint');
    var busy = false;
    var phoneOnlyMode = false;

    function el(tag, className, text) {
        var n = document.createElement(tag);
        if (className) n.className = className;
        if (text != null) n.textContent = text;
        return n;
    }

    function rupiah(v) {
        var n = Number(v);
        return 'Rp ' + (isFinite(n) ? n : 0).toLocaleString('id-ID');
    }

    // ---------- Pesan status ----------
    function showState(kind, text, extraNode) {
        stateBox.className = 'track-state notice notice--' + kind;
        stateBox.textContent = text;
        if (extraNode) { stateBox.appendChild(document.createTextNode(' ')); stateBox.appendChild(extraNode); }
        stateBox.hidden = false;
    }
    function clearAll() {
        stateBox.hidden = true;
        stateBox.textContent = '';
        listBox.textContent = '';
        resultBox.hidden = true;
        if (window.MFTrack) MFTrack.stop();
        if (typeof stopLive === 'function') stopLive();
        setLive(null, '');
    }
    function waLink(label) {
        var a = el('a', null, label || 'WhatsApp');
        a.href = WA_URL; a.target = '_blank'; a.rel = 'noopener';
        return a;
    }

    function setBusy(state) {
        busy = state;
        trackBtn.disabled = state;
        trackBtn.textContent = '';
        if (state) {
            var sp = el('span', 'spinner'); sp.setAttribute('aria-hidden', 'true');
            trackBtn.appendChild(sp);
            trackBtn.appendChild(document.createTextNode(' Mencari...'));
        } else {
            var ic = el('i', 'fas fa-search'); ic.setAttribute('aria-hidden', 'true');
            trackBtn.appendChild(ic);
            trackBtn.appendChild(document.createTextNode(' Lacak'));
        }
        stateBox.setAttribute('aria-busy', state ? 'true' : 'false');
    }

    // ---------- Hasil ----------
    function row(label, value, cls) {
        var r = el('div', 'invoice-row' + (cls ? ' ' + cls : ''));
        r.appendChild(el('span', null, label));
        r.appendChild(el('span', null, value));
        return r;
    }

    function jadwalPendek(tgl) {
        if (!tgl) return '';
        var d = new Date(tgl + 'T00:00:00');
        return isNaN(d) ? '' : d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    function renderInfo(order) {
        var box = document.getElementById('lkInfo'), wrap = document.getElementById('lkInfoWrap');
        box.textContent = '';
        var rows = [];
        var d = order.tanggalKirim ? new Date(order.tanggalKirim + 'T00:00:00') : null;
        var jadwal = [d && !isNaN(d) ? d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : '', order.jamKirim].filter(Boolean).join(' · ');
        if (jadwal) rows.push(['Jadwal kirim', jadwal]);
        if (order.alamat) rows.push(['Tujuan', order.alamat]);
        var bayar = [order.metodePembayaran, order.statusPembayaran].filter(Boolean).join(' · ');
        if (bayar) rows.push(['Pembayaran', bayar]);
        rows.forEach(function (r) { var g = el('div'); g.appendChild(el('dt', null, r[0])); g.appendChild(el('dd', null, r[1])); box.appendChild(g); });
        wrap.hidden = rows.length === 0;
    }
    var currentOrder = null, strukSeq = 0, lastBuilt = null;
    function renderResult(order, fromLocal, opts) {
        currentOrder = order;
        var steps = OrdersStore.STATUS_STEPS;
        var idx = steps.indexOf(order.status);
        document.querySelectorAll('#stepper .step').forEach(function (node, i) {
            node.classList.remove('done', 'current');
            node.removeAttribute('aria-current');
            if (idx >= 0 && (i < idx || (order.status === 'Selesai' && i === idx))) node.classList.add('done');
            else if (i === idx) { node.classList.add('current'); node.setAttribute('aria-current', 'step'); }
        });
        // Jam tiap tahap (dari riwayat di server). Pesanan lama tanpa riwayat tidak menampilkan jam.
        var waktu = {};
        (Array.isArray(order.riwayat) ? order.riwayat : []).forEach(function (h) {
            if (h && h.tipe === 'status' && h.at) waktu[h.nilai] = h.at;
        });
        document.querySelectorAll('#stepper .step').forEach(function (node, i) {
            var lama = node.querySelector('.step-time');
            if (lama) lama.remove();
            var at = waktu[steps[i]], d = at ? new Date(at) : null, label = '';
            if (d && !isNaN(d)) label = d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(',', '').replace(/:/g, '.');
            else if (steps[i] === 'Dikirim' && idx < 2 && (order.jamKirim || order.tanggalKirim)) label = 'Jadwal ' + (order.jamKirim || jadwalPendek(order.tanggalKirim));
            if (!label) return;
            node.appendChild(el('div', 'step-time', label));
        });
        var pct = idx <= 0 ? 0 : (idx / (steps.length - 1)) * 75;
        document.getElementById('progressLine').style.width = pct + '%';

        // Struk: gambar yang sama persis dengan berkas unduhan (logo resmi di atas).
        var sum = document.getElementById('orderSummary');
        var mySeq = ++strukSeq;
        sum.textContent = '';
        sum.classList.add('is-loading');
        MFReceipt.build(MFReceipt.fromOrder(order)).then(function (b) {
            if (mySeq !== strukSeq) return;
            lastBuilt = b; sum.textContent = ''; b.canvas.setAttribute('role', 'img'); b.canvas.setAttribute('aria-label', 'Struk pesanan ' + (order.orderId || ''));
            sum.appendChild(b.canvas); sum.classList.remove('is-loading');
        }).catch(function (e) {
            console.error(e); if (mySeq !== strukSeq) return;
            sum.textContent = ''; sum.appendChild(el('p', 'struk-err', 'Struk belum bisa ditampilkan. Coba muat ulang halaman.')); sum.classList.remove('is-loading');
        });

        renderInfo(order);
        document.getElementById('statusNote').textContent = STATUS_LABELS[order.status] || order.status || '';
        if (typeof MyOrders !== 'undefined' && order.orderId) MyOrders.add({ id: order.orderId, telepon: phoneInput.value.trim(), nama: order.nama, selesai: order.status === 'Selesai' });
        var lamaCta = document.getElementById('reviewCta'); if (lamaCta) lamaCta.remove();
        if (order.status === 'Selesai' && order.orderId) {
            var cta = el('a', 'btn', 'Beri ulasan');
            cta.id = 'reviewCta';
            cta.href = 'rating.html?order=' + encodeURIComponent(order.orderId) + '&nama=' + encodeURIComponent(String(order.nama || '').split(' ')[0]);
            cta.style.cssText = 'display:block;margin-top:14px;text-align:center;';
            document.getElementById('statusNote').insertAdjacentElement('afterend', cta);
        }
        resultBox.hidden = false;
        if (window.MFTrack) MFTrack.show(order, phoneInput.value.trim(), opts);
        startLive(order);
    }

    function renderPicker(orders, fromLocal) {
        listBox.textContent = '';
        if (!orders.length) return;

        listBox.appendChild(el('div', 'order-picks-title', 'Pesanan ditemukan. Pilih pesanan yang ingin dilihat:'));
        orders.forEach(function (o) {
            var b = el('button', 'order-pick');
            b.type = 'button';
            var id = el('span', 'pick-id', o.orderId || '-');
            b.appendChild(id);
            b.appendChild(document.createTextNode(' — ' + (o.status || '-')));
            b.appendChild(el('span', 'pick-meta', (o.produk || 'Pesanan') + (o.jumlah ? ' x' + o.jumlah : '') + ' · ' + (o.tanggal || '-')));
            b.addEventListener('click', function () {
                if (phoneOnlyMode) {
                    showNameConfirmation(o);
                } else {
                    renderResult(o, fromLocal);
                    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            listBox.appendChild(b);
        });
    }

    function showNameConfirmation(order) {
        listBox.textContent = '';
        var box = el('div', 'privacy-confirm');
        box.appendChild(el('strong', null, 'Konfirmasi pesanan'));
        box.appendChild(el('p', null, 'Untuk menjaga privasi, masukkan nama penerima sesuai pesanan.'));

        var label = el('label', null, 'Nama penerima');
        label.setAttribute('for', 'confirmNameInput');
        box.appendChild(label);
        var nameInput = el('input', 'input');
        nameInput.type = 'text';
        nameInput.id = 'confirmNameInput';
        nameInput.autocomplete = 'name';
        nameInput.placeholder = 'Nama sesuai pesanan';
        box.appendChild(nameInput);

        var btn = el('button', 'btn', 'Lihat Pesanan');
        btn.type = 'button';
        btn.addEventListener('click', async function () {
            var name = nameInput.value.trim();
            if (!name) {
                showState('error', 'Masukkan nama penerima sesuai pesanan.');
                nameInput.focus();
                return;
            }
            setBusy(true);
            try {
                var verified = await OrdersStore.findByIdAndName(order.orderId, phoneInput.value.trim(), name);
                if (!verified.order) {
                    showState('error', 'Nama penerima tidak sesuai. Periksa kembali nama yang digunakan saat memesan.');
                    nameInput.focus();
                    return;
                }
                listBox.textContent = '';
                renderResult(verified.order, false);
                resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                console.error('Gagal memverifikasi pesanan:', e);
                showState('error', 'Terjadi kendala saat memverifikasi pesanan. Silakan coba lagi.');
            } finally {
                setBusy(false);
            }
        });
        box.appendChild(btn);
        listBox.appendChild(box);
        nameInput.focus();
    }

    // Cek singkat apakah server dan database pesanan hidup, supaya pesan galat menyebut penyebab yang benar.
    async function pingServer() {
        try {
            var r = await fetch('/api/health?ping=1', { cache: 'no-store' });
            return r.status;
        } catch (e) { return 0; }
    }

    async function showNotFound(online, detail) {
        if (online === false) {
            var reason = String(detail || '').trim();
            var tail = ' Jika masih gagal, hubungi kami lewat';
            var msg;
            if (/429|terlalu banyak/i.test(reason)) {
                msg = 'Terlalu banyak percobaan pencarian. Tunggu beberapa menit lalu coba lagi, atau hubungi kami lewat';
            } else if (/API-LAMA/.test(reason)) {
                msg = 'Server pesanan belum diperbarui ke versi terbaru sehingga pelacakan belum bisa dipakai. Pesanan Anda tetap aman. Silakan hubungi Margaluyu Farm lewat';
            } else if (/404|not found/i.test(reason)) {
                msg = 'Layanan pelacakan belum tersedia pada versi situs yang sedang dibuka. Silakan hubungi Margaluyu Farm lewat';
            } else {
                var st = await pingServer();
                if (st === 0) msg = 'Perangkat Anda tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.' + tail;
                else if (st === 503 || /503|SUPABASE_URL|SERVICE_KEY|konfigurasi/i.test(reason)) msg = 'Database pesanan sedang tidak dapat diakses. Ini gangguan di sisi kami, bukan di perangkat Anda. Coba lagi beberapa saat lagi atau hubungi kami lewat';
                else msg = 'Server aktif, tetapi pencarian belum bisa diproses sekarang.' + tail;
            }
            showState('error', msg, waLink('WhatsApp'));
        } else {
            showState('error', 'Pesanan tidak ditemukan. Pastikan nomor pesanan sesuai struk dan nomor HP sama dengan yang dipakai saat memesan. Butuh bantuan? Hubungi kami lewat', waLink('WhatsApp'));
        }
    }

    // ---------- Pencarian ----------
    async function trackOrder() {
        if (busy) return;
        var keyword = input.value.trim();
        var phone = phoneInput.value.trim();
        clearAll();

        if (!phone) {
            showState('error', 'Masukkan nomor HP yang digunakan saat memesan.');
            phoneInput.focus();
            return;
        }

        setBusy(true);
        try {
            if (phoneOnlyMode) {
                var rPhone = await OrdersStore.findByPhone(phone);
                if (!rPhone.orders.length) return await showNotFound(rPhone.online, rPhone.error);
                renderPicker(rPhone.orders, false);
                showState('success', 'Pesanan ditemukan. Pilih pesanan yang ingin dilihat.');
                return;
            }

            if (!keyword) {
                showState('error', 'Masukkan nomor pesanan. Jika lupa, pilih “Lupa nomor pesanan?” di bawah.');
                input.focus();
                return;
            }

            var r1 = await OrdersStore.findById(keyword, phone);
            if (!r1.order) return await showNotFound(r1.online, r1.error);
            renderResult(r1.order, !r1.online);
        } catch (e) {
            console.error('Gagal melacak pesanan:', e);
            showState('error', 'Terjadi kendala saat mencari pesanan. Silakan coba lagi.');
        } finally {
            setBusy(false);
        }
    }

    function setPhoneOnlyMode(enabled) {
        phoneOnlyMode = Boolean(enabled);
        orderIdField.hidden = phoneOnlyMode;
        input.required = !phoneOnlyMode;
        forgotOrderBtn.textContent = phoneOnlyMode ? 'Kembali ke nomor pesanan' : 'Lupa nomor pesanan?';
        trackHint.textContent = phoneOnlyMode
            ? 'Masukkan nomor HP. Kami akan menampilkan pesanan secara terbatas untuk menjaga privasi.'
            : 'Masukkan nomor pesanan dan nomor HP untuk melihat detail pesanan.';
        trackBtn.innerHTML = '<i class="fas fa-search" aria-hidden="true"></i> ' + (phoneOnlyMode ? 'Cari Pesanan' : 'Lacak');
        clearAll();
        if (phoneOnlyMode) phoneInput.focus(); else input.focus();
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); trackOrder(); });
    // Unduh struk sebagai gambar JPG (rancangan struk ada di receipt-image.js).
    document.getElementById('saveImgBtn').addEventListener('click', async function () {
        var o = currentOrder, btn = this;
        if (!o || btn.disabled) return;
        var label = btn.innerHTML;
        btn.disabled = true; btn.textContent = 'Menyiapkan gambar...';
        try {
            if (!lastBuilt) lastBuilt = await MFReceipt.build(MFReceipt.fromOrder(o));
            await MFReceipt.save(lastBuilt);
        } catch (e) {
            console.error('Gagal membuat struk JPG:', e);
            showState('error', 'Gambar struk belum berhasil dibuat. Coba lagi, atau ambil tangkapan layar.');
        } finally { btn.disabled = false; btn.innerHTML = label; }
    });
    // ---- Pembaruan otomatis (live): status pesanan dicek ulang tiap 15 detik selama halaman terbuka ----
    var liveTimer = null, liveTicking = false;
    function clock(d) { return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/:/g, '.'); }
    function setLive(kind, text) {
        var box = document.getElementById('lkLive');
        if (!box) return;
        box.hidden = !kind; box.setAttribute('data-k', kind || ''); box.title = 'Status diperbarui otomatis tiap 15 detik selama halaman terbuka';
        document.getElementById('lkLiveTxt').textContent = text || '';
    }
    function stopLive() { if (liveTimer) { clearInterval(liveTimer); liveTimer = null; } }
    async function liveTick() {
        if (liveTicking || document.hidden || !currentOrder || busy) return;
        liveTicking = true;
        try {
            if (currentOrder.pending) { try { await OrdersStore.syncPending(); } catch (e) { /* lanjut cek */ } }
            var r = await OrdersStore.findById(currentOrder.orderId, phoneInput.value.trim());
            if (!r.order) { setLive('off', 'Menyambung ulang'); return; }
            if (!r.online && !currentOrder.pending) { setLive('off', 'Tanpa koneksi'); return; }
            var o = r.order;
            var changed = o.orderId !== currentOrder.orderId || o.status !== currentOrder.status || o.statusPembayaran !== currentOrder.statusPembayaran
                || JSON.stringify(o.riwayat || []) !== JSON.stringify(currentOrder.riwayat || []);
            if (changed) renderResult(o, !r.online, { silent: true });
            if (o.status === 'Selesai') { stopLive(); setLive('done', 'Selesai'); return; }
            setLive('on', 'Live · ' + clock(new Date()));
        } catch (e) { setLive('off', 'Menyambung ulang'); }
        finally { liveTicking = false; }
    }
    function startLive(order) {
        stopLive();
        if (order.status === 'Selesai') { setLive('done', 'Selesai'); return; }
        setLive('on', 'Live · ' + clock(new Date()));
        liveTimer = setInterval(liveTick, 15000);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && liveTimer) liveTick(); });
    window.addEventListener('online', function () { if (liveTimer) liveTick(); });

    // Struk: terbuka di layar lebar, terlipat di HP agar halaman ringkas.
    (function () {
        var d = document.getElementById('lkStruk'); if (!d) return;
        var mq = window.matchMedia('(min-width: 980px)');
        function sync() { d.open = mq.matches; }
        sync(); if (mq.addEventListener) mq.addEventListener('change', sync);
    })();

    forgotOrderBtn.addEventListener('click', function () { setPhoneOnlyMode(!phoneOnlyMode); });

    // Dibuka dari link konfirmasi pesanan (?id=...): isi nomor pesanan saja.
    // Tetap meminta nomor HP sebelum data ditampilkan.
    var idFromUrl = new URLSearchParams(window.location.search).get('id');
    // Isi otomatis dari perangkat ini: nomor pesanan & nomor HP terakhir (atau yang cocok dengan ?id=).
    if (typeof MyOrders !== 'undefined') {
        var dl = document.getElementById('myOrderList');
        MyOrders.all().forEach(function (o) { var op = document.createElement('option'); op.value = o.id; op.label = o.id + (o.nama ? ' (' + o.nama + ')' : ''); if (dl) dl.appendChild(op); });
        var saved = idFromUrl ? MyOrders.find(idFromUrl) : MyOrders.latest();
        if (saved) { input.value = saved.id; if (saved.telepon) phoneInput.value = saved.telepon; }
        input.addEventListener('change', function () {
            var m = MyOrders.find(input.value);
            if (m && m.telepon) phoneInput.value = m.telepon;
        });
    }
    if (idFromUrl && !input.value) input.value = idFromUrl;
    if (idFromUrl && !phoneInput.value) phoneInput.focus();
})();
