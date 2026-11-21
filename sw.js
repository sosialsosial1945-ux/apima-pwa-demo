const CACHE_NAME = 'apima-pwa-demo-v8';
const CORE_ASSETS = [
  './',
  './index.html',
  './feedback.html',
  './MasukId.dc.html',
  './Main.dc.html',
  './AnggotaRiwayat.dc.html',
  './AnggotaPilihHari.dc.html',
  './AnggotaQris.dc.html',
  './AnggotaBerhasil.dc.html',
  './AnggotaQrIdentitas.dc.html',
  './SatgasDaftar.dc.html',
  './SatgasScan.dc.html',
  './SatgasTemuan.dc.html',
  './AdminRingkasan.dc.html',
  './AdminLaporan.dc.html',
  './AdminRiwayat.dc.html',
  './AdminPedagang.dc.html',
  './AdminSatgas.dc.html',
  './styles.css',
  './admin.css',
  './support.js',
  './admin-charts.js',
  './interactions.js',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
