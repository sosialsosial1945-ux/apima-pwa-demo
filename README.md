# Prototype APIMA (compare/after)

Prototype aplikasi retribusi Pasar Ikan Muara Angke (Anggota, Satgas, dan Pengurus).

## Cara Menjalankan di Lokal (Wajib untuk Kamera Scan QR)

Kamera belakang (`getUserMedia`) hanya dapat diakses browser melalui alamat `https://` atau `http://localhost` (tidak bisa dibuka langsung lewat `file://`).

Jalankan server lokal dari folder ini:

```bash
npx serve .
```

Lalu buka alamat yang ditampilkan di terminal (misalnya `http://localhost:3000`).

Alternatif menggunakan Python 3:

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Uji Scan QR Antar Dua Perangkat

1. Buka `AnggotaQrIdentitas.dc.html` di satu perangkat (atau satu tab) untuk menampilkan QR identitas asli yang berganti setiap 45 detik (`APIMA:<id>:<periode>`).
2. Buka `SatgasDaftar.dc.html` lalu ketuk **Scan QR** (atau langsung `SatgasScan.dc.html?scan=1`) di perangkat lain (melalui `https://` atau `localhost`).
3. Izinkan kamera belakang, lalu arahkan ke QR identitas anggota.
4. Jika izin kamera ditolak atau tidak ada kamera, masukkan nomor anggota secara manual (contoh: `0123`, `0456`, `0311`, `0592`).

## Pustaka Lokal (Tanpa CDN)

Pustaka generator dan pembaca QR disimpan lokal di folder `lib/` agar tetap berjalan saat sinyal di pasar lemah:
- `lib/qrcode.js`: membuat QR identitas asli 45 detik dan QRIS pembayaran.
- `lib/jsQR.js`: cadangan pembaca QR jika browser belum mendukung `BarcodeDetector`.

## Catatan Sebelum Produksi

- Hapus panel **Mode uji** di `apima-store.js` dan `styles.css` (ditandai `// HAPUS SEBELUM PRODUKSI`).
- Ganti tautan bagikan penjaga di `interactions.js` (ditandai `// GANTI DENGAN TAUTAN ASLI SEBELUM PRODUKSI`).
