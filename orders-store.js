// ============================================================
// ORDERS STORE
// Penyimpanan pesanan bersama melalui /api/orders.
// Master Key JSONBin hanya berada di server/Vercel.
// ============================================================

const OrdersStore = (function () {
    const LOCAL_KEY = 'pesananMargaluyu';
    const API_URL = (typeof ORDERS_API_URL === 'string' && ORDERS_API_URL.trim())
        ? ORDERS_API_URL
        : '/api/orders';
    const IS_LOCAL_FILE = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
    const STATUS_STEPS = ['Dikonfirmasi', 'Dikemas', 'Dikirim', 'Selesai'];
    const PAYMENT_STEPS = ['Menunggu verifikasi', 'Lunas', 'Ditolak'];
    const ADMIN_KEY_STORAGE = 'mfAdminToken';

    // Token sesi admin (kedaluwarsa 8 jam, ditandatangani server) disimpan di sessionStorage.
    // Kata sandi mentah TIDAK pernah disimpan di browser.
    function getAdminKey() {
        try {
            const raw = sessionStorage.getItem(ADMIN_KEY_STORAGE);
            if (!raw) return '';
            const t = JSON.parse(raw);
            if (t && t.token && t.expiresAt > Date.now()) return t.token;
            sessionStorage.removeItem(ADMIN_KEY_STORAGE);
            return '';
        } catch (e) { return ''; }
    }

    function setAdminKey(token, expiresAt) {
        try {
            if (token) sessionStorage.setItem(ADMIN_KEY_STORAGE, JSON.stringify({ token, expiresAt: expiresAt || (Date.now() + 8 * 3600 * 1000) }));
            else sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        } catch (e) { /* sessionStorage tidak tersedia */ }
    }

    function adminHeaders(extra) {
        const headers = Object.assign({ 'Accept': 'application/json' }, extra || {});
        const token = getAdminKey();
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    }

    function isConfigured() {
        return true; // Konfigurasi sekarang dilakukan di Environment Variables Vercel.
    }

    function getLocal() {
        try {
            const raw = localStorage.getItem(LOCAL_KEY);
            const data = raw ? JSON.parse(raw) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.warn('Data lokal pesanan tidak dapat dibaca:', e);
            return [];
        }
    }

    function setLocal(list) {
        try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
            console.warn('Tidak bisa menyimpan cadangan lokal:', e);
        }
    }

    function normalizeOrderId(value) {
        return String(value || '').trim().toLowerCase();
    }

    function normalizePhone(value) {
        let s = String(value || '').replace(/[\s\-().]/g, '');
        if (s.startsWith('+')) s = s.slice(1);
        if (s.startsWith('0')) s = '62' + s.slice(1);
        return s;
    }

    function mergeOrders(...lists) {
        const map = new Map();
        for (const list of lists) {
            if (!Array.isArray(list)) continue;
            for (const order of list) {
                if (!order || !order.orderId) continue;
                map.set(normalizeOrderId(order.orderId), order);
            }
        }
        return Array.from(map.values());
    }

    // params: {} = seluruh daftar (admin); {orderId, telepon} = pelacakan publik.
    async function fetchRemote(params) {
        if (IS_LOCAL_FILE) {
            return { data: [], online: false, error: 'Halaman ini dibuka langsung dari file di komputer, sehingga belum bisa terhubung ke server. Setelah situs dipublikasikan (misalnya di Vercel), ini akan berjalan normal' };
        }
        try {
            const qs = params ? Object.keys(params)
                .filter(k => params[k])
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                .join('&') : '';
            const res = await fetch(API_URL + (qs ? '?' + qs : ''), {
                method: 'GET',
                headers: params && (params.orderId || params.telepon) ? { 'Accept': 'application/json' } : adminHeaders(),
                cache: 'no-store'
            });
            const text = await res.text();
            let json = {};
            try { json = text ? JSON.parse(text) : {}; } catch (_) {}
            if (res.status === 401) setAdminKey('');
            if (!res.ok) {
                const lama = res.headers.get('X-MF-Api') ? '' : ' [API-LAMA]';
                throw new Error((json.error || json.message || `Server mengembalikan ${res.status}`) + ` (HTTP ${res.status})` + lama);
            }

            const data = Array.isArray(json.data) ? json.data : [];
            return { data, online: true, error: null, protectedByServer: json.protected === true };
        } catch (e) {
            console.warn('Gagal membaca data pesanan dari server:', e);
            return {
                data: [],
                online: false,
                error: e && e.message ? e.message : String(e)
            };
        }
    }

    // Hasil: { success, order, email, error, retryable }.
    // retryable = true bila penyebabnya di sisi koneksi/server (jaringan putus, API belum terpasang, galat 5xx),
    // sehingga pesanan boleh disimpan sementara di perangkat dan dikirim ulang otomatis.
    // retryable = false bila server MENOLAK isian (stok habis, nomor HP salah, dll.) dan pelanggan harus memperbaikinya.
    async function postRemote(order, opts) {
        const retry = Boolean(opts && opts.retry);
        if (IS_LOCAL_FILE) {
            return { success: false, order: null, retryable: true, error: 'Halaman ini dibuka langsung dari file di komputer, sehingga belum terhubung ke server pesanan.' };
        }
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ order, website: honeypotValue(), captcha: retry ? '' : captchaToken(), retry: retry })
            });
            const text = await res.text();
            let json = {};
            try { json = text ? JSON.parse(text) : {}; } catch (_) {}
            if (!res.ok) {
                const msg = json.error || json.message || `Server mengembalikan ${res.status}`;
                const captcha = /captcha/i.test(String(json.error || ''));
                const retryable = res.status >= 500 || res.status === 404 || res.status === 405 || res.status === 408 || res.status === 429;
                return { success: false, order: null, retryable: retryable, captcha: captcha, status: res.status, code: String(json.code || ''), error: msg + ' (HTTP ' + res.status + ')' };
            }
            // Hosting statis kadang menjawab 200 dengan halaman HTML. Itu BUKAN pesanan yang tersimpan.
            if (!json || json.success !== true || !json.order || !json.order.orderId) {
                return { success: false, order: null, retryable: true, error: 'Server pesanan tidak memberi jawaban yang valid (API belum terpasang di hosting ini).' };
            }
            return {
                success: true,
                order: json.order,
                email: json.email || { sent: false, reason: 'unknown' },
                error: null
            };
        } catch (e) {
            console.warn('Gagal menyimpan pesanan ke server:', e);
            return { success: false, order: null, retryable: true, error: e && e.message ? e.message : String(e) };
        }
    }

    async function putRemote(order) {
        if (IS_LOCAL_FILE) {
            return { success: false, order: null, error: 'Halaman ini dibuka langsung dari file di komputer, sehingga data belum bisa dikirim ke server. Setelah situs dipublikasikan (misalnya di Vercel), ini akan berjalan normal' };
        }
        try {
            const res = await fetch(API_URL, {
                method: 'PUT',
                headers: adminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ order })
            });
            const text = await res.text();
            let json = {};
            try { json = text ? JSON.parse(text) : {}; } catch (_) {}
            if (!res.ok) throw new Error(json.error || json.message || `Server mengembalikan ${res.status}`);
            return { success: true, order: json.order || order, error: null };
        } catch (e) {
            console.warn('Gagal memperbarui pesanan di server:', e);
            return { success: false, order: null, error: e && e.message ? e.message : String(e) };
        }
    }

    // Token CAPTCHA (hanya ada bila Turnstile diaktifkan). Token sekali pakai, jadi di-reset setelah dikirim.
    function captchaToken() {
        try { return typeof window.MF_captchaToken === 'function' ? window.MF_captchaToken() : ''; } catch (e) { return ''; }
    }
    function captchaReset() {
        try { if (typeof window.MF_captchaReset === 'function') window.MF_captchaReset(); } catch (e) { /* abaikan */ }
    }

    // Kolom jebakan (tersembunyi) untuk bot. Orang asli tidak pernah mengisinya.
    function honeypotValue() {
        try {
            const el = document.querySelector('input[name="website"]');
            return el ? String(el.value || '') : '';
        } catch (e) { return ''; }
    }

    // HANYA untuk label sementara bila server tidak terjangkau. Nomor pesanan resmi dibuat server.
    function generateOrderId() {
        const now = new Date();
        const y = String(now.getFullYear()).slice(2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `MF-${y}${m}${d}-${rand}`;
    }

    async function load() {
        const remote = await fetchRemote();

        if (remote.online) {
            setLocal(remote.data);
            return { data: remote.data, online: true, error: null };
        }

        // Saat server sedang gagal, tampilkan cache lokal sebagai cadangan.
        return { data: getLocal(), online: false, error: remote.error };
    }

    // ---------- Antrean pesanan yang belum terkirim ----------
    // Bila server tidak terjangkau, pesanan disimpan di perangkat (bukan hilang), struk tetap tampil,
    // lalu dikirim ulang otomatis. Nomor resmi baru diberikan server setelah pesanan benar-benar masuk.
    const PENDING_KEY = 'mf_pending_orders';
    const ALIAS_KEY = 'mf_order_alias';

    function readJson(key, fallback) {
        try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? fallback : v; } catch (e) { return fallback; }
    }
    function writeJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* penyimpanan browser dinonaktifkan */ }
    }
    function getPending() { const l = readJson(PENDING_KEY, []); return Array.isArray(l) ? l.filter(p => p && p.tempId && p.draft) : []; }
    function setPending(l) { writeJson(PENDING_KEY, l.slice(-10)); }
    function getAliases() { const a = readJson(ALIAS_KEY, {}); return a && typeof a === 'object' ? a : {}; }
    function addAlias(tempId, officialId) { const a = getAliases(); a[String(tempId).toUpperCase()] = officialId; writeJson(ALIAS_KEY, a); }
    function resolveAlias(id) { return getAliases()[String(id || '').trim().toUpperCase()] || null; }

    function tempOrderId() {
        const CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let r = ''; for (let i = 0; i < 4; i++) r += CH[Math.floor(Math.random() * CH.length)];
        return generateOrderId().replace(/-\d{4}$/, '-T' + r);
    }

    function pendingReceipt(p) {
        const d = p.draft || {}, h = p.hint || {};
        const qty = Number(d.jumlah) || 1;
        const subtotal = Number(h.subtotal) || 0, ongkir = Number(h.ongkir) || 0, diskon = Number(h.diskon) || 0;
        return {
            orderId: p.tempId, pending: true, serverSaved: false,
            nama: d.nama, telepon: d.telepon, alamat: d.alamat, produk: d.produk, jumlah: String(qty), pesan: d.pesan || '',
            metodePembayaran: d.metodePembayaran, subtotal: subtotal, ongkir: ongkir, diskon: diskon, kodePromo: d.kodePromo || '',
            totalHarga: Number(h.totalHarga) || Math.max(0, subtotal + ongkir - diskon),
            status: 'Belum terkirim',
            statusPembayaran: d.metodePembayaran === 'QRIS' ? 'Menunggu verifikasi' : 'Bayar saat terima',
            tanggal: new Date(p.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            tanggalKirim: d.tanggalKirim || '', jamKirim: d.jamKirim || '',
            createdAt: new Date(p.createdAt).toISOString()
        };
    }

    function findPending(id, phone) {
        const want = normalizeOrderId(id), ph = phone ? normalizePhone(phone) : null;
        const p = getPending().find(x => normalizeOrderId(x.tempId) === want);
        if (!p) return null;
        if (ph !== null && normalizePhone(p.draft.telepon) !== ph) return null;
        return p;
    }

    let syncing = null;
    // Kirim ulang semua pesanan tertunda. Aman dipanggil berulang; satu sinkronisasi berjalan pada satu waktu,
    // dan kunci per-pesanan mencegah dua tab mengirim pesanan yang sama.
    function syncPending() {
        if (IS_LOCAL_FILE) return Promise.resolve([]);
        if (syncing) return syncing;
        syncing = (async function () {
            const results = [];
            const ids = getPending().map(p => p.tempId);
            for (const tempId of ids) {
                const list = getPending();
                const rec = list.find(p => p.tempId === tempId);
                if (!rec || rec.rejected) continue;
                if (rec.lockUntil && rec.lockUntil > Date.now()) continue;
                rec.lockUntil = Date.now() + 30000;
                rec.tries = (rec.tries || 0) + 1;
                rec.lastTryAt = Date.now();
                setPending(list);

                const res = await postRemote(rec.draft, { retry: true });
                const now = getPending();
                const cur = now.find(p => p.tempId === tempId);
                if (res.success) {
                    const official = res.order;
                    setPending(now.filter(p => p.tempId !== tempId));
                    addAlias(tempId, official.orderId);
                    setLocal(mergeOrders(getLocal(), [official]));
                    results.push({ tempId, ok: true, order: official });
                } else if (cur) {
                    cur.lockUntil = 0;
                    cur.lastError = res.error || '';
                    cur.lastStatus = res.status || 0;
                    cur.lastCode = res.code || '';
                    if (!res.retryable && !res.captcha) cur.rejected = res.error || 'Ditolak server';
                    setPending(now);
                    results.push({ tempId, ok: false, retryable: res.retryable !== false, error: res.error });
                }
            }
            return results;
        })().finally(function () { syncing = null; });
        return syncing;
    }

    // hint = { subtotal, ongkir, diskon, totalHarga } perkiraan dari formulir, hanya dipakai untuk struk sementara.
    async function add(orderData, hint) {
        // Nomor pesanan resmi, harga, dan status dibuat/dihitung di SERVER. Browser hanya mengirim isian form.
        const draft = Object.assign({}, orderData);
        delete draft.orderId; delete draft.status; delete draft.totalHarga;

        const saved = await postRemote(draft);
        captchaReset();

        if (!saved.success) {
            // Ditolak server (mis. stok habis, data tidak valid): beri tahu pelanggan, jangan disimpan.
            if (!saved.retryable && !saved.captcha) {
                return { success: false, rejected: true, online: false, orderId: null, error: saved.error };
            }
            if (saved.captcha) {
                return { success: false, rejected: true, online: false, orderId: null, error: saved.error };
            }
            // Server tidak terjangkau: simpan di perangkat dan kirim ulang otomatis.
            const rec = { tempId: tempOrderId(), draft: draft, hint: hint || {}, createdAt: Date.now(), tries: 1, lastError: saved.error || '', lastStatus: saved.status || 0, lastCode: saved.code || '', lastTryAt: Date.now() };
            setPending(getPending().concat([rec]));
            return { success: true, online: false, pending: true, orderId: rec.tempId, order: pendingReceipt(rec), error: saved.error };
        }

        const synced = Object.assign({}, saved.order);
        delete synced.syncStatus;
        if (synced.orderId) setLocal(mergeOrders(getLocal(), [synced]));
        return {
            success: true,
            online: true,
            orderId: synced.orderId,
            order: synced,
            email: saved.email || { sent: false, reason: 'unknown' },
            error: null
        };
    }

    // Bila pesanan tertunda sudah terkirim, kembalikan nomor resminya.
    function officialIdFor(id) { return resolveAlias(id); }
    // Keadaan antrean untuk pesanan tertunda (dipakai halaman struk untuk menjelaskan penyebab secara jujur).
    function pendingInfo(id) {
        const p = getPending().find(x => normalizeOrderId(x.tempId) === normalizeOrderId(id));
        return p ? { tries: p.tries || 0, lastError: p.lastError || '', lastStatus: p.lastStatus || 0, lastCode: p.lastCode || '', lastTryAt: p.lastTryAt || 0, rejected: p.rejected || '' } : null;
    }

    async function findById(orderId, phone) {
        let cleanId = normalizeOrderId(orderId);
        const cleanPhone = normalizePhone(phone);
        if (!cleanId || !cleanPhone) return { order: null, online: false, error: null };

        // Pesanan yang masih tertunda di perangkat ini (nomor sementara): coba kirim dulu, lalu pakai nomor resmi.
        const pend = findPending(cleanId, cleanPhone);
        if (pend) {
            await syncPending();
            const official = resolveAlias(cleanId);
            if (official) cleanId = normalizeOrderId(official);
            else {
                const still = findPending(cleanId, cleanPhone);
                if (still) return { order: pendingReceipt(still), online: false, pending: true, error: null };
            }
        } else {
            const official = resolveAlias(cleanId);
            if (official) cleanId = normalizeOrderId(official);
        }

        // Saat file HTML dibuka langsung di komputer, server memang tidak dapat
        // diakses. Tetap izinkan pelacakan dengan cache lokal, tetapi WAJIB cocok
        // nomor pesanan + nomor HP agar tidak membuka pesanan milik orang lain.
        if (IS_LOCAL_FILE) {
            const foundLocal = getLocal().find(o =>
                o && normalizeOrderId(o.orderId) === cleanId
                && normalizePhone(o.telepon) === cleanPhone
            ) || null;
            return {
                order: foundLocal,
                online: false,
                local: Boolean(foundLocal),
                error: foundLocal ? null : 'Pesanan tidak ditemukan di data lokal.'
            };
        }

        const remote = await fetchRemote({ orderId: cleanId.toUpperCase(), telepon: cleanPhone });
        if (remote.online) {
            // Server sudah mencocokkan nomor pesanan DAN nomor HP.
            const found = remote.data.find(o =>
                o && normalizeOrderId(o.orderId) === cleanId
                && normalizePhone(o.telepon) === cleanPhone
            ) || null;
            if (found) setLocal(mergeOrders(getLocal(), [found]));
            return { order: found, online: true, error: null };
        }

        // Jangan gunakan cache lokal untuk pelacakan publik berdasarkan ID saja.
        // Ini mencegah data pesanan teman yang tersimpan di perangkat ikut tampil.
        return { order: null, online: false, error: remote.error };
    }

    async function findByIdAndName(orderId, phone, name) {
        let cleanId = normalizeOrderId(orderId);
        const cleanPhone = normalizePhone(phone);
        const pendN = findPending(cleanId, cleanPhone);
        if (pendN && String(pendN.draft.nama || '').trim().toLowerCase().replace(/\s+/g, ' ') === String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')) {
            await syncPending();
            const offN = resolveAlias(cleanId);
            if (!offN) return { order: pendingReceipt(findPending(cleanId, cleanPhone) || pendN), online: false, pending: true, error: null };
        }
        { const offN2 = resolveAlias(cleanId); if (offN2) cleanId = normalizeOrderId(offN2); }
        const cleanName = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!cleanId || !cleanPhone || !cleanName) return { order: null, online: false, error: null };

        if (IS_LOCAL_FILE) {
            const foundLocal = getLocal().find(o =>
                o && normalizeOrderId(o.orderId) === cleanId
                && normalizePhone(o.telepon) === cleanPhone
                && String(o.nama || '').trim().toLowerCase().replace(/\s+/g, ' ') === cleanName
            ) || null;
            return {
                order: foundLocal,
                online: false,
                local: Boolean(foundLocal),
                error: foundLocal ? null : 'Pesanan tidak ditemukan di data lokal.'
            };
        }

        const remote = await fetchRemote({ orderId: cleanId.toUpperCase(), telepon: cleanPhone, nama: cleanName });
        if (remote.online) {
            const found = remote.data.find(o =>
                o && normalizeOrderId(o.orderId) === cleanId
                && normalizePhone(o.telepon) === cleanPhone
                && String(o.nama || '').trim().toLowerCase().replace(/\s+/g, ' ') === cleanName
            ) || null;
            if (found) setLocal(mergeOrders(getLocal(), [found]));
            return { order: found, online: true, error: null };
        }

        // Jangan gunakan cache lokal untuk verifikasi publik.
        return { order: null, online: false, error: remote.error };
    }

    async function findByPhone(phone) {
        const target = normalizePhone(phone);
        if (!target) return { orders: [], online: false, error: null };

        // Saat file HTML dibuka langsung di komputer, gunakan cache lokal.
        // Hanya data dengan nomor HP yang sama yang ditampilkan dan tetap dibatasi
        // ke informasi minimum, sama seperti aturan pelacakan online.
        if (IS_LOCAL_FILE) {
            const tertundaLokal = getPending().filter(p => normalizePhone(p.draft.telepon) === target).map(p => {
                const r = pendingReceipt(p);
                return { orderId: r.orderId, tanggal: r.tanggal, status: r.status, produk: r.produk, jumlah: r.jumlah, pending: true };
            });
            const orders = getLocal()
                .filter(o => o && normalizePhone(o.telepon) === target)
                .map(o => ({
                    orderId: o.orderId || '',
                    tanggal: o.tanggal || '',
                    status: o.status || 'Dikonfirmasi',
                    produk: o.produk || 'Pesanan',
                    jumlah: o.jumlah || ''
                }))
                .reverse().concat(tertundaLokal);
            return { orders, online: false, local: true, error: null };
        }

        // Pencarian publik berdasarkan nomor HP hanya boleh mengembalikan
        // data terbatas dari server. Jangan memakai cache lokal bila server online.
        await syncPending();
        const tertunda = getPending().filter(p => normalizePhone(p.draft.telepon) === target).map(p => {
            const r = pendingReceipt(p);
            return { orderId: r.orderId, tanggal: r.tanggal, status: r.status, produk: r.produk, jumlah: r.jumlah, pending: true };
        });
        const remote = await fetchRemote({ telepon: target });
        if (!remote.online) {
            return { orders: tertunda, online: tertunda.length ? true : false, error: remote.error };
        }

        return {
            orders: remote.data.slice().reverse().concat(tertunda),
            online: true,
            error: null
        };
    }

    // Login admin: kata sandi dikirim sekali ke server, balasannya token sesi 8 jam.
    // Hasil: { ok, protectedByServer, error }
    async function verifyAdmin(password, code) {
        if (IS_LOCAL_FILE) return { ok: false, protectedByServer: false, error: 'Buka lewat alamat online (Vercel), bukan file di komputer.' };
        try {
            const res = await fetch('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ password, code: code || '' })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.token) return { ok: false, needCode: json.needCode === true, protectedByServer: true, error: json.error || ('Server mengembalikan ' + res.status) };
            setAdminKey(json.token, json.expiresAt);
            const r = await fetchRemote(null);
            if (r.online) return { ok: true, protectedByServer: true, error: null };
            return { ok: false, protectedByServer: true, error: r.error };
        } catch (e) {
            return { ok: false, protectedByServer: false, error: e && e.message ? e.message : String(e) };
        }
    }

    function logoutAdmin() { setAdminKey(''); }

    // Ubah status pembayaran (Menunggu verifikasi / Lunas / Ditolak). Khusus admin.
    async function updatePayment(orderId, statusPembayaran) {
        if (IS_LOCAL_FILE) return { success: false, error: 'Buka lewat alamat online (Vercel).' };
        const r = await putRemote({ orderId, statusPembayaran });
        if (r.success) setLocal(mergeOrders(getLocal(), [r.order]));
        return r;
    }

    async function updateStatus(orderId, newStatus, orderHint) {
        const cleanId = normalizeOrderId(orderId);
        const validStatus = STATUS_STEPS.includes(newStatus) ? newStatus : null;
        if (!cleanId || !validStatus) {
            return { success: false, online: false, error: 'Nomor pesanan atau status tidak valid.' };
        }

        // KHUSUS ADMIN: jangan memakai findById() karena fungsi tersebut memang
        // mewajibkan nomor HP untuk pelacakan publik. Admin sudah memiliki data
        // pesanan dari load(), jadi ambil pesanan berdasarkan orderId dari cache admin.
        const local = getLocal();
        const current = (orderHint && normalizeOrderId(orderHint.orderId) === cleanId)
            ? orderHint
            : (local.find(o => o && normalizeOrderId(o.orderId) === cleanId) || null);

        if (!current) {
            return { success: false, online: false, error: 'Pesanan tidak ditemukan.' };
        }

        const updated = Object.assign({}, current, {
            status: validStatus,
            updatedAt: new Date().toISOString()
        });

        // Saat masih membuka file HTML secara lokal, status tetap dapat diubah
        // dan disimpan di localStorage seperti perilaku website sebelumnya.
        if (IS_LOCAL_FILE) {
            setLocal(mergeOrders(local, [updated]));
            return { success: true, online: false, local: true, order: updated, error: null };
        }

        // Saat online, perubahan harus disimpan ke server. Header admin dikirim
        // agar endpoint dapat membedakan perubahan admin dari pelacakan publik.
        const result = await putRemote({ orderId: updated.orderId, status: validStatus });
        if (result.success) {
            setLocal(mergeOrders(getLocal(), [result.order || updated]));
            return { success: true, online: true, local: false, order: result.order || updated, error: null };
        }

        return { success: false, online: false, local: false, error: result.error };
    }

    // Hapus banyak pesanan sekaligus (hanya yang berstatus Selesai; server yang memastikan).
    async function removeMany(orderIds) {
        const ids = (Array.isArray(orderIds) ? orderIds : []).filter(Boolean);
        if (!ids.length) return { success: false, removed: [], error: 'Pilih minimal satu pesanan.' };
        if (IS_LOCAL_FILE) return { success: false, removed: [], error: 'Halaman dibuka dari file di komputer. Buka lewat alamat online (Vercel).' };
        try {
            const res = await fetch(API_URL, {
                method: 'DELETE',
                headers: adminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ orderIds: ids })
            });
            const text = await res.text();
            let json = {};
            try { json = text ? JSON.parse(text) : {}; } catch (_) {}
            if (!res.ok) throw new Error(json.error || json.message || `Server mengembalikan ${res.status}`);
            const removed = Array.isArray(json.removed) ? json.removed : [];
            const gone = new Set(removed.map(normalizeOrderId));
            setLocal(getLocal().filter(o => !gone.has(normalizeOrderId(o && o.orderId))));
            return { success: true, removed, skipped: json.skipped || [], error: null };
        } catch (e) {
            return { success: false, removed: [], error: e && e.message ? e.message : String(e) };
        }
    }

    return {
        load,
        add,
        findById,
        findByIdAndName,
        findByPhone,
        syncPending,
        getPending,
        officialIdFor,
        updateStatus,
        removeMany,
        isConfigured,
        normalizePhone,
        setAdminKey,
        verifyAdmin,
        logoutAdmin,
        adminHeaders,
        updatePayment,
        pendingInfo,
        STATUS_STEPS,
        PAYMENT_STEPS
    };
})();

// Kirim ulang pesanan tertunda secara otomatis saat halaman dibuka, saat koneksi kembali, dan berkala.
(function () {
    if (typeof window === 'undefined' || window.location.protocol === 'file:') return;
    var tries = 0;
    function jalan() {
        if (!OrdersStore.getPending().some(function (p) { return !p.rejected; })) return;
        if (tries++ > 40) return;
        OrdersStore.syncPending().then(function (r) {
            if (r && r.some(function (x) { return x.ok; })) {
                try { window.dispatchEvent(new CustomEvent('mf-orders-synced', { detail: r })); } catch (e) { /* abaikan */ }
            }
        }).catch(function () { /* abaikan */ });
    }
    window.addEventListener('online', jalan);
    window.addEventListener('load', function () { setTimeout(jalan, 1500); });
    setInterval(jalan, 30000);
})();
