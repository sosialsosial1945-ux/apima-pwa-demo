const CACHE_NAME = 'apima-pwa-demo-v38';
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
  './AnggotaAkun.dc.html',
  './AnggotaPenjaga.dc.html',
  './AnggotaGagal.dc.html',
  './AnggotaGangguan.dc.html',
  './SatgasDaftar.dc.html',
  './SatgasScan.dc.html',
  './SatgasBerhasil.dc.html',
  './SatgasTemuan.dc.html',
  './SatgasCatat.dc.html',
  './SatgasAkun.dc.html',
  './AdminRingkasan.dc.html',
  './AdminLaporan.dc.html',
  './AdminRiwayat.dc.html',
  './AdminPedagang.dc.html',
  './AdminSatgas.dc.html',
  './AdminProfil.dc.html',
  './styles.css',
  './admin.css',
  './theme-v5.css',
  './ui-anggota.css',
  './ui-satgas.css',
  './ui-admin.css',
  './nav-v5.js',
  './fonts/dm-sans-latin-400-normal.woff2',
  './fonts/dm-sans-latin-500-normal.woff2',
  './fonts/dm-sans-latin-700-normal.woff2',
  './fonts/plus-jakarta-sans-latin-700-normal.woff2',
  './fonts/plus-jakarta-sans-latin-800-normal.woff2',
  './fonts/jetbrains-mono-latin-500-normal.woff2',
  './fonts/jetbrains-mono-latin-700-normal.woff2',
  './support.js',
  './apima-store.js',
  './admin-charts.js',
  './interactions.js',
  './lib/qrcode.js',
  './lib/jsQR.js',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './illustrations/memuat-data.webp',
  './illustrations/kartu-anggota-digital.webp',
  './illustrations/konfirmasi-kehadiran.webp',
  './illustrations/hubungi-pengurus.webp',
  './illustrations/selamat-datang-kembali.webp',
  './illustrations/laporan-belum-dikirim.webp',
  './illustrations/lapor-kendala-lapak.webp',
  './illustrations/error-gagal.webp',
  './illustrations/otp-wa.webp',
  './illustrations/syarat-ketentuan.webp',
  './illustrations/konfirmasi-pin.webp',
  './illustrations/cadangkan-data.webp'
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
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => { });
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
