const CACHE_NAME = 'apima-pwa-demo-v13';
const CORE_ASSETS = [
  './',
  './index.html',
  './MasukId.dc.html',
  './Main.dc.html',
  './AnggotaRiwayat.dc.html',
  './AnggotaPilihHari.dc.html',
  './AnggotaQris.dc.html',
  './AnggotaBerhasil.dc.html',
  './AnggotaQrIdentitas.dc.html',
  './SatgasDaftar.dc.html',
  './SatgasScan.dc.html',
  './SatgasBerhasil.dc.html',
  './SatgasTemuan.dc.html',
  './AdminRingkasan.dc.html',
  './AdminLaporan.dc.html',
  './AdminRiwayat.dc.html',
  './AdminPedagang.dc.html',
  './AdminSatgas.dc.html',
  './styles.css',
  './admin.css',
  './support.js',
  './apima-store.js',
  './admin-charts.js',
  './interactions.js',
  './lib/qrcode.js',
  './lib/jsQR.js',
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
  const reqUrl = new URL(event.request.url);
  const isSameOrigin = reqUrl.origin === self.location.origin;
  const isAppShell = isSameOrigin && (event.request.mode === 'navigate' || /\.(html|js|css|webmanifest)$/i.test(reqUrl.pathname));

  event.respondWith(
    fetch(isAppShell ? new Request(event.request, { cache: 'no-cache' }) : event.request)
      .then((res) => {
        if (res && res.status === 200 && isSameOrigin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
