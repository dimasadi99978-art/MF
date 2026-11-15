// Service worker minimal: (1) agar situs bisa dipasang di HP (PWA), (2) halaman cadangan saat perangkat offline.
// Sengaja TIDAK menyimpan cache halaman biasa, sehingga stok, harga, dan status pesanan selalu terbaru
// dan pembaruan situs langsung terlihat. Yang disimpan hanya offline.html.
const CACHE = 'mf-offline-v1';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.add('/offline.html'); }).catch(function () { /* abaikan */ }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const req = e.request;
  // Hanya perpindahan halaman (bukan API/gambar/skrip). Jaringan selalu dicoba lebih dulu.
  if (req.mode !== 'navigate') return;
  e.respondWith(fetch(req).catch(function () {
    return caches.match('/offline.html').then(function (r) { return r || Response.error(); });
  }));
});
