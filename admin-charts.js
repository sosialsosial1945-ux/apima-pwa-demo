/* ======================================
   APIMA Admin v5 (22 Nov 2026)
   Kerangka halaman pengurus (sidebar, topbar, footer, laci mobile),
   bantuan bersama (modal, CSV, salin, data transaksi) dan grafik SVG
   tanpa pustaka luar. Dipakai oleh semua halaman Admin*.dc.html.
   ====================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Util ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function store() { return window.APIMA_STORE || null; }
  function state() { var s = store(); return s ? s.reload() : null; }
  function rp(n) {
    var s = store();
    if (s) return s.formatRupiah(n);
    return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
  }
  function num(n, dec) {
    return Number(n).toLocaleString('id-ID', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }
  function dateFull() {
    var s = store(); var st = state();
    return s && st ? s.formatDateInfo(st.dayOffset).full : 'Sab, 14 Nov 2026';
  }
  function dateOnly() {
    var s = store(); var st = state();
    return s && st ? s.formatDateInfo(st.dayOffset).dateOnly : '14 Nov 2026';
  }
  function toast(msg) {
    if (window.apimaToast) { window.apimaToast(msg); return; }
    var t = document.getElementById('apima-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'apima-toast'; t.className = 'toast';
      t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = msg; t.hidden = false;
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.hidden = true; }, 3000);
  }
  function copyText(txt, okMsg) {
    var done = function () { if (okMsg) toast(okMsg); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
    } else { fallbackCopy(txt); done(); }
  }
  function fallbackCopy(txt) {
    try {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    } catch (e) {}
  }
  function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
  function downloadCsv(filename, rows, okMsg) {
    var lines = rows.map(function (r) { return r.map(csvCell).join(','); });
    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    toast(okMsg || 'Berkas CSV berhasil diunduh.');
  }

  /* ---------- Ikon (garis 24px) ---------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    bars: '<line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="6"/><line x1="18" y1="20" x2="18" y2="10"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v9h14v-9"/><path d="M10 21v-5h4v5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-2"/><path d="M21 9h-6a3 3 0 0 0 0 6h6z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9.5" x2="9.01" y2="9.5"/><line x1="15" y1="9.5" x2="15.01" y2="9.5"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    pulse: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>'
  };
  function icon(name, size, extra) {
    var s = size || 18;
    return '<svg class="adm-ico' + (extra ? ' ' + extra : '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[name] || '') + '</svg>';
  }

  /* ---------- Data bersama (transaksi & satgas) ---------- */
  var SATGAS_NAMES = { 'S-01': 'Ahmad Fauzi', 'S-02': 'Dedi Kurniawan' };

  /* Transaksi contoh malam ini. Identitas mengikuti data uji bersama (apima-store.js). */
  var BASE_TX_TODAY = [
    { ref: 'QRIS-1411-0839', time: '22:54 WIB', date: '14 Nov 2026', id: '0014', init: 'SR', name: 'H. Slamet Raharjo', blok: 'Blok A-02', nights: '30 malam', amountNum: 90000, status: 'lunas' },
    { ref: 'QRIS-1411-0831', time: '22:15 WIB', date: '14 Nov 2026', id: '0311', init: 'DL', name: 'Dewi Lestari', blok: 'Blok B-08', nights: '1 malam', amountNum: 3000, status: 'lunas' },
    { ref: 'QRIS-1411-0827', time: '21:48 WIB', date: '14 Nov 2026', id: '0310', init: 'YM', name: 'Yusuf Maulana', blok: 'Blok A-18', nights: '7 malam', amountNum: 21000, status: 'menunggu' },
    { ref: 'QRIS-1411-0820', time: '21:32 WIB', date: '14 Nov 2026', id: '0089', init: 'HR', name: 'Hj. Rohimah', blok: 'Blok B-05', nights: '14 malam', amountNum: 42000, status: 'lunas' },
    { ref: 'QRIS-1411-0814', time: '21:19 WIB', date: '14 Nov 2026', id: '0241', init: 'DP', name: 'Darmawan Putra', blok: 'Blok C-09', nights: '7 malam', amountNum: 21000, status: 'lunas' },
    { ref: 'QRIS-1411-0809', time: '21:05 WIB', date: '14 Nov 2026', id: '0518', init: 'WY', name: 'Wahyudi', blok: 'Blok D-07', nights: '1 malam', amountNum: 3000, status: 'gagal', label: 'Kedaluwarsa' },
    { ref: 'QRIS-1411-0802', time: '20:51 WIB', date: '14 Nov 2026', id: '0412', init: 'KT', name: 'Kartini', blok: 'Blok F-02', nights: '1 malam', amountNum: 3000, status: 'lunas' },
    { ref: 'QRIS-1411-0796', time: '20:36 WIB', date: '14 Nov 2026', id: '0445', init: 'EP', name: 'Eko Prasetyo', blok: 'Blok F-12', nights: '1 malam', amountNum: 3000, status: 'menunggu' },
    { ref: 'QRIS-1411-0788', time: '20:14 WIB', date: '14 Nov 2026', id: '0187', init: 'NL', name: 'Ningsih Lestari', blok: 'Blok B-12', nights: '14 malam', amountNum: 42000, status: 'lunas' }
  ];
  /* Riwayat bayar Budi Santoso (preset "Akun lama"): Rp21.000 Sel 10 Nov, Rp3.000 tanggal 6, 7, 8 Nov */
  var BUDI_HISTORY_TX = [
    { ref: 'QRIS-1011-0412', time: '20:45 WIB', date: '10 Nov 2026', id: '0123', init: 'BS', name: 'Budi Santoso', blok: 'Blok C-14', nights: '7 malam', amountNum: 21000, status: 'lunas' },
    { ref: 'QRIS-0811-0318', time: '21:10 WIB', date: '8 Nov 2026', id: '0123', init: 'BS', name: 'Budi Santoso', blok: 'Blok C-14', nights: '1 malam', amountNum: 3000, status: 'lunas' },
    { ref: 'QRIS-0711-0294', time: '20:52 WIB', date: '7 Nov 2026', id: '0123', init: 'BS', name: 'Budi Santoso', blok: 'Blok C-14', nights: '1 malam', amountNum: 3000, status: 'lunas' },
    { ref: 'QRIS-0611-0211', time: '21:05 WIB', date: '6 Nov 2026', id: '0123', init: 'BS', name: 'Budi Santoso', blok: 'Blok C-14', nights: '1 malam', amountNum: 3000, status: 'lunas' }
  ];
  var STATUS_LABEL = { lunas: 'Lunas', menunggu: 'Menunggu', gagal: 'Gagal' };

  function normTx(t, live) {
    var amt = typeof t.amountNum === 'number' ? t.amountNum : parseInt(String(t.amount || '0').replace(/\D/g, ''), 10) || 0;
    var status = t.statusKey || t.status || 'lunas';
    if (STATUS_LABEL[status] == null) status = 'lunas';
    return {
      ref: t.ref, time: t.time, date: t.date || dateOnly(), id: t.id,
      init: t.init || t.initials || '', name: t.name, blok: t.blok, nights: t.nights,
      amountNum: amt, amount: rp(amt), status: status,
      label: t.label && live ? (STATUS_LABEL[status]) : (t.label || STATUS_LABEL[status]),
      live: !!live
    };
  }
  /* Urutan: pembayaran langsung dari aplikasi anggota (terbaru) di atas, lalu transaksi contoh malam ini, lalu riwayat lama Budi */
  function getAllTx(opts) {
    var st = state();
    var live = (st && Array.isArray(st.adminLivePayments)) ? st.adminLivePayments : [];
    var rows = live.map(function (t) { return normTx(t, true); });
    rows = rows.concat(BASE_TX_TODAY.map(function (t) { return normTx(t, false); }));
    if (!(opts && opts.todayOnly) && (!st || st.preset === 'lama')) {
      rows = rows.concat(BUDI_HISTORY_TX.map(function (t) { return normTx(t, false); }));
    }
    return rows;
  }
  function liveDelta() { var st = state(); return st ? (Number(st.budiPaidTonightDelta) || 0) : 0; }
  function liveCount() { var st = state(); return st && Array.isArray(st.adminLivePayments) ? st.adminLivePayments.length : 0; }

  function openFindings() {
    var st = state();
    return (st && Array.isArray(st.findings) ? st.findings : []).filter(function (f) { return !f.reviewed; });
  }
  function parseAnggota(str) {
    var m = String(str || '').match(/^(.*?)\s*\((\d{4})\)\s*$/);
    return m ? { name: m[1], id: m[2] } : { name: String(str || 'Anggota'), id: '' };
  }
  var FINDING_DESC = {
    'Jualan tanpa bayar': 'Lapak buka, belum ada pembayaran QRIS untuk malam ini.',
    'QR ganda': 'QR yang sama terbaca di dua lapak berbeda pada malam yang sama.',
    'Pedagang bukan anggota': 'Pedagang berjualan tanpa terdaftar sebagai anggota APIMA.',
    'Bayar di tempat, menunggu konfirmasi': 'Pedagang menyatakan sudah bayar di tempat. Menunggu konfirmasi pengurus.',
    'Penjaga tidak dikenal': 'Penjaga lapak belum terdaftar sebagai penjaga resmi anggota.'
  };
  function findingDesc(f) { return FINDING_DESC[f.temuan] || (f.temuan + '. Perlu ditinjau pengurus.'); }
  function satgasName(code) { return SATGAS_NAMES[code] || 'Satgas'; }

  /* ---------- Modal aksesibel (Esc, klik latar, kunci fokus, fokus kembali) ---------- */
  var modalStack = [];
  function focusables(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
  }
  function openModal(modal, trigger) {
    if (typeof modal === 'string') modal = document.getElementById(modal);
    if (!modal) return;
    modal._trigger = trigger || document.activeElement;
    modal.hidden = false;
    if (modalStack.indexOf(modal) === -1) modalStack.push(modal);
    document.body.classList.add('adm-lock');
    var first = modal.querySelector('[data-modal-close]') || focusables(modal)[0];
    setTimeout(function () { if (first) first.focus(); }, 20);
  }
  function closeModal(modal) {
    if (typeof modal === 'string') modal = document.getElementById(modal);
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modalStack = modalStack.filter(function (m) { return m !== modal; });
    if (!modalStack.length && !document.querySelector('.adm-side.is-open')) document.body.classList.remove('adm-lock');
    var t = modal._trigger;
    if (t && typeof t.focus === 'function' && document.contains(t)) t.focus();
  }
  document.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-modal-close]');
    if (closer) { closeModal(closer.closest('.adm-modal')); return; }
    if (e.target.classList && e.target.classList.contains('adm-modal')) closeModal(e.target);
  });
  document.addEventListener('keydown', function (e) {
    var top = modalStack[modalStack.length - 1];
    if (e.key === 'Escape') {
      if (top) { e.preventDefault(); closeModal(top); return; }
      closePopovers(true);
      closeDrawer();
      return;
    }
    if (e.key === 'Tab') {
      var trapRoot = top || document.querySelector('.adm-side.is-open');
      if (!trapRoot) return;
      var f = focusables(trapRoot);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!trapRoot.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  /* Cetak isi modal saja (bukti PDF) */
  function printModal(modal) {
    document.body.classList.add('adm-print-modal');
    if (modal) modal.classList.add('is-printing');
    var cleanup = function () {
      document.body.classList.remove('adm-print-modal');
      if (modal) modal.classList.remove('is-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    toast('Pilih "Simpan sebagai PDF" di jendela cetak.');
    setTimeout(function () { window.print(); setTimeout(cleanup, 800); }, 60);
  }
  function printPage() {
    toast('Pilih "Simpan sebagai PDF" di jendela cetak.');
    setTimeout(function () { window.print(); }, 60);
  }

  /* ---------- CSV per halaman (tombol topbar data-export-csv) ---------- */
  var csvProvider = null;
  window.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-export-csv]');
    if (!btn || !csvProvider) return;
    /* Halaman admin punya isi CSV sendiri; hentikan handler bawaan interactions.js agar tidak unduh dua kali */
    e.stopPropagation();
    e.preventDefault();
    csvProvider();
  }, true);

  /* ---------- Kerangka halaman ---------- */
  var NAV = [
    { group: 'Utama', items: [
      { key: 'ringkasan', href: 'AdminRingkasan.dc.html', label: 'Ringkasan', icon: 'home' },
      { key: 'laporan', href: 'AdminLaporan.dc.html', label: 'Laporan', icon: 'bars' },
      { key: 'riwayat', href: 'AdminRiwayat.dc.html', label: 'Riwayat Setoran', icon: 'card' }
    ] },
    { group: 'Anggota & Lapangan', items: [
      { key: 'pedagang', href: 'AdminPedagang.dc.html', label: 'Keaktifan Pedagang', icon: 'users' },
      { key: 'satgas', href: 'AdminSatgas.dc.html', label: 'Kinerja Satgas', icon: 'shield' },
      { key: 'profil', href: 'AdminProfil.dc.html', label: 'Profil Pengurus', icon: 'user' }
    ] }
  ];

  function sideHtml(page) {
    var groups = NAV.map(function (g, gi) {
      return '<div class="adm-nav-group" role="group" aria-labelledby="adm-ng-' + gi + '">' +
        '<span class="adm-nav-label" id="adm-ng-' + gi + '">' + esc(g.group) + '</span>' +
        g.items.map(function (it) {
          var active = it.key === page;
          return '<a href="' + it.href + '" class="adm-nav-link' + (active ? ' is-active' : '') + '"' + (active ? ' aria-current="page"' : '') + '>' +
            '<span class="adm-nav-tile">' + icon(it.icon, 18) + '</span><span>' + esc(it.label) + '</span></a>';
        }).join('') +
      '</div>';
    }).join('');
    return '' +
      '<div class="adm-side-head">' +
        '<a href="AdminRingkasan.dc.html" class="adm-logo" aria-label="APIMA, ke Ringkasan Pasar">' +
          '<span class="brand-wordmark">' +
            '<img src="brand/apima-wordmark-light.webp" width="92" height="33" alt="APIMA" class="wm-light">' +
            '<img src="brand/apima-wordmark-dark.webp" width="92" height="33" alt="" aria-hidden="true" class="wm-dark">' +
          '</span>' +
        '</a>' +
        '<button type="button" class="adm-icon-btn adm-side-close" data-drawer-close aria-label="Tutup menu">' + icon('x', 20) + '</button>' +
      '</div>' +
      '<nav class="adm-nav" aria-label="Navigasi pengurus">' + groups + '</nav>' +
      '<div class="adm-portal">' +
        '<span class="adm-portal-title">' + icon('qr', 16) + 'Portal bayar QRIS</span>' +
        '<span class="adm-portal-url mono">apima.id/bayar-qris</span>' +
        '<button type="button" class="adm-portal-copy" data-copy-portal>' + icon('copy', 15) + '<span>Salin Tautan</span></button>' +
      '</div>' +
      '<div class="adm-nav-group adm-role-group" role="group" aria-labelledby="adm-ng-role">' +
        '<span class="adm-nav-label" id="adm-ng-role">Portal Peran</span>' +
        '<a href="Main.dc.html" class="adm-role-link">' + icon('store', 18) + '<span>Portal Penjual</span></a>' +
        '<a href="SatgasDaftar.dc.html" class="adm-role-link">' + icon('shield', 18) + '<span>Portal Satgas</span></a>' +
        '<a href="MasukId.dc.html" class="adm-role-link is-plain">' + icon('logout', 18) + '<span>Logout</span></a>' +
      '</div>' +
      '<!-- HAPUS SEBELUM PRODUKSI: kartu bantuan membuka ringkasan audit UI demo -->' +
      '<div class="adm-help">' +
        '<span class="adm-help-art"><img src="illustrations/pusat-bantuan.webp" width="44" height="44" alt=""></span>' +
        '<span class="adm-help-title">Panduan & Audit UI</span>' +
        '<span class="adm-help-text">Lihat ringkasan perbaikan tampilan dashboard ini.</span>' +
        '<button type="button" class="adm-help-btn" data-open-pilar>Lihat Ringkasan</button>' +
      '</div>';
  }

  function topHtml(cfg) {
    return '' +
      '<button type="button" class="adm-icon-btn adm-menu-btn" id="adm-menu-btn" aria-label="Buka menu navigasi" aria-controls="adm-side" aria-expanded="false">' + icon('menu', 22) + '</button>' +
      '<div class="adm-top-title">' +
        '<nav aria-label="Jejak halaman" class="adm-crumb"><span>Pengurus APIMA</span> <span aria-hidden="true">/</span> <span class="adm-crumb-cur" aria-current="page">' + esc(cfg.title) + '</span></nav>' +
        '<div class="adm-title-row"><h1 class="adm-h1">' + esc(cfg.title) + '</h1>' + (cfg.sample === false ? '' : '<span class="adm-sample">Data contoh</span>') + '</div>' +
      '</div>' +
      '<div class="adm-top-tools">' +
        '<div class="adm-search" role="search">' +
          icon('search', 18, 'adm-search-ico') +
          '<input type="search" id="adm-search" class="adm-search-input" placeholder="Cari pedagang atau blok..." aria-label="Cari pedagang atau blok" autocomplete="off" aria-controls="adm-search-res" aria-expanded="false">' +
          '<div class="adm-pop adm-search-res" id="adm-search-res" hidden role="listbox" aria-label="Hasil pencarian"></div>' +
        '</div>' +
        '<a href="AdminProfil.dc.html" class="adm-user" aria-label="Profil H. Darmawan">' + icon('user', 18) + '<span class="adm-user-name">H. Darmawan</span></a>' +
        '<button type="button" class="adm-icon-btn theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Ganti tema">' +
          '<svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P.moon + '</svg>' +
          '<svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P.sun + '</svg>' +
        '</button>' +
        '<div class="adm-bell-wrap">' +
          '<button type="button" class="adm-icon-btn adm-bell" id="adm-bell" aria-label="Notifikasi temuan" aria-expanded="false" aria-controls="adm-notif">' + icon('bell', 20) + '<span class="adm-bell-dot" id="adm-bell-dot" hidden></span></button>' +
          '<div class="adm-pop adm-notif" id="adm-notif" hidden role="region" aria-label="Notifikasi temuan lapangan"></div>' +
        '</div>' +
        '<button type="button" class="adm-btn adm-btn-primary adm-csv-btn" data-export-csv aria-label="Unduh CSV halaman ini">' + icon('download', 18) + '<span>Unduh CSV</span></button>' +
      '</div>';
  }

  function footHtml() {
    return '<span>APIMA · Asosiasi Pedagang Ikan Muara Angke</span>' +
      '<nav class="adm-foot-links" aria-label="Tautan kaki halaman">' +
        '<a href="Main.dc.html">Portal Penjual</a>' +
        '<a href="SatgasDaftar.dc.html">Portal Satgas</a>' +
        '<button type="button" class="adm-foot-btn" data-open-pilar>4 Pilar Perbaikan</button>' +
      '</nav>';
  }

  /* HAPUS SEBELUM PRODUKSI: modal ringkasan audit 4 pilar perbaikan UI (khusus demo) */
  var PILAR = [
    { no: '01', name: 'Tata Letak', title: 'Menyelaraskan tampilan mobile-first untuk Penjual/Satgas dan desktop untuk Admin',
      before: 'Beberapa alur penting (Aktivasi, OTP/PIN, State Khusus Beranda, Hasil QRIS, Scan Kamera, 5 Menu Admin, dan Masukan UI/UX) belum terhubung dalam satu sistem.',
      after: 'Seluruh layar dan state operasional demo APIMA tersedia lengkap dengan ritme tata letak yang rapi di mobile maupun desktop.' },
    { no: '02', name: 'Penataan Elemen', title: 'Hierarki aksi yang jernih tanpa tumpukan badge dan kartu bertingkat',
      before: 'Status dan metadata memakai banyak kapsul yang memecah fokus, sementara aksi sekunder bersaing dengan aksi utama.',
      after: 'Satu aksi utama per layar, metadata memakai teks bersih dengan pemisah titik tengah (·), dan tombol sentuh minimal 44px.' },
    { no: '03', name: 'Spasi Antar Elemen', title: 'Padding dan ritme spasi kelipatan 8px yang lega di semua peran',
      before: 'Padding kartu 12px dengan jarak antar bagian rapat sehingga daftar transaksi dan formulir terasa sempit.',
      after: 'Padding kontainer 20px–28px, jarak antar bagian 20px–24px, tinggi baris daftar minimal 56px, dan area sentuh jempol nyaman.' },
    { no: '04', name: 'Konsistensi Warna & Font', title: 'Satu sistem warna dan huruf untuk ketiga peran dalam dua tema',
      before: 'Dashboard admin memakai tema navy lama, sementara layar penjual dan satgas memakai huruf dan warna status yang berbeda untuk arti yang sama.',
      after: 'Token warna terang dan gelap yang sama, DM Sans untuk isi, Plus Jakarta Sans untuk judul, JetBrains Mono untuk angka, serta hijau, kuning, merah yang sama untuk status.' }
  ];
  function pilarModalHtml() {
    return '<!-- HAPUS SEBELUM PRODUKSI -->' +
      '<div class="adm-modal-card adm-modal-wide">' +
        '<div class="adm-modal-head">' +
          '<div><span class="adm-eyebrow-muted">Audit Perbaikan · apima-pwa-demo</span>' +
          '<h2 class="adm-modal-title" id="adm-pilar-title">Ringkasan 4 Pilar Perbaikan UI APIMA</h2></div>' +
          '<button type="button" class="adm-icon-btn adm-modal-x" data-modal-close aria-label="Tutup ringkasan">' + icon('x', 20) + '</button>' +
        '</div>' +
        '<div class="adm-pilar-list">' +
          PILAR.map(function (p) {
            return '<section class="adm-pilar" aria-labelledby="pilar-' + p.no + '">' +
              '<span class="adm-pilar-no">' + p.no + '. ' + esc(p.name) + '</span>' +
              '<h3 class="adm-pilar-title" id="pilar-' + p.no + '">' + esc(p.title) + '</h3>' +
              '<div class="adm-pilar-grid">' +
                '<div><span class="adm-pilar-tag is-before">Sebelum</span><p>' + esc(p.before) + '</p></div>' +
                '<div><span class="adm-pilar-tag is-after">Sesudah</span><p class="is-after-text">' + esc(p.after) + '</p></div>' +
              '</div>' +
            '</section>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  /* Direktori pencarian: anggota data uji + pedagang contoh */
  var EXTRA_PEOPLE = [
    { id: '0310', name: 'Yusuf Maulana', blok: 'Blok A-18' }, { id: '0089', name: 'Hj. Rohimah', blok: 'Blok B-05' },
    { id: '0241', name: 'Darmawan Putra', blok: 'Blok C-09' }, { id: '0156', name: 'Suherman', blok: 'Blok A-07' },
    { id: '0187', name: 'Ningsih Lestari', blok: 'Blok B-12' }, { id: '0412', name: 'Kartini', blok: 'Blok F-02' },
    { id: '0518', name: 'Wahyudi', blok: 'Blok D-07' }, { id: '0445', name: 'Eko Prasetyo', blok: 'Blok F-12' },
    { id: '0609', name: 'Hendra Wijaya', blok: 'Blok D-11' }, { id: '0491', name: 'Mulyadi', blok: 'Blok E-09' }
  ];
  function directory() {
    var st = state();
    var list = (st && st.members ? st.members : []).map(function (m) { return { id: m.id, name: m.name, blok: m.blok }; });
    EXTRA_PEOPLE.forEach(function (p) { if (!list.some(function (x) { return x.id === p.id; })) list.push(p); });
    return list;
  }

  function bindSearch() {
    var input = document.getElementById('adm-search');
    var res = document.getElementById('adm-search-res');
    if (!input || !res) return;
    function hide() { res.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    function go(q) { window.location.href = 'AdminRiwayat.dc.html?q=' + encodeURIComponent(q); }
    function update() {
      var q = input.value.trim().toLowerCase();
      if (!q) { hide(); return; }
      var hits = directory().filter(function (p) { return (p.name + ' ' + p.id + ' ' + p.blok).toLowerCase().indexOf(q) !== -1; }).slice(0, 6);
      res.innerHTML = hits.length
        ? hits.map(function (p) {
            return '<a role="option" class="adm-pop-item" href="AdminRiwayat.dc.html?q=' + encodeURIComponent(p.name) + '">' +
              '<span class="adm-pop-main">' + esc(p.name) + '</span><span class="adm-pop-sub mono">ID ' + esc(p.id) + ' · ' + esc(p.blok) + '</span></a>';
          }).join('') + '<a class="adm-pop-more" href="AdminPedagang.dc.html?q=' + encodeURIComponent(input.value.trim()) + '">Cari di Keaktifan Pedagang</a>'
        : '<p class="adm-pop-empty">Tidak ada pedagang atau blok yang cocok.</p>';
      res.hidden = false; input.setAttribute('aria-expanded', 'true');
    }
    input.addEventListener('input', update);
    input.addEventListener('focus', update);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && input.value.trim()) { e.preventDefault(); go(input.value.trim()); }
      if (e.key === 'ArrowDown') { var f = res.querySelector('a'); if (f && !res.hidden) { e.preventDefault(); f.focus(); } }
    });
    res.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(res.querySelectorAll('a'));
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) items[i - 1].focus(); else input.focus(); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.adm-search')) hide(); });
  }

  function renderNotif() {
    var pop = document.getElementById('adm-notif');
    var dot = document.getElementById('adm-bell-dot');
    var bell = document.getElementById('adm-bell');
    if (!pop) return;
    var list = openFindings();
    if (dot) dot.hidden = list.length === 0;
    if (bell) bell.setAttribute('aria-label', list.length ? ('Notifikasi: ' + list.length + ' temuan perlu ditinjau') : 'Notifikasi: tidak ada temuan baru');
    pop.innerHTML = '<div class="adm-pop-head"><span>Temuan lapangan</span><span class="mono">' + list.length + ' baru</span></div>' +
      (list.length ? list.slice(0, 4).map(function (f) {
        var a = parseAnggota(f.anggota);
        return '<a class="adm-pop-item" href="AdminRiwayat.dc.html#temuan">' +
          '<span class="adm-pop-main">' + esc(f.temuan) + '</span>' +
          '<span class="adm-pop-sub">' + esc(a.name) + ' · ' + esc(f.satgasCode || '') + ' · ' + esc(f.jam) + '</span></a>';
      }).join('') : '<p class="adm-pop-empty">Semua temuan sudah ditinjau.</p>') +
      '<a class="adm-pop-more" href="AdminRiwayat.dc.html#temuan">Buka Temuan Lapangan</a>';
  }
  function closePopovers(returnFocus) {
    var pop = document.getElementById('adm-notif');
    var bell = document.getElementById('adm-bell');
    if (pop && !pop.hidden) {
      pop.hidden = true;
      if (bell) { bell.setAttribute('aria-expanded', 'false'); if (returnFocus) bell.focus(); }
    }
    var res = document.getElementById('adm-search-res');
    if (res && !res.hidden) res.hidden = true;
  }
  function bindBell() {
    var bell = document.getElementById('adm-bell');
    var pop = document.getElementById('adm-notif');
    if (!bell || !pop) return;
    bell.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = pop.hidden;
      renderNotif();
      pop.hidden = !open;
      bell.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!pop.hidden && !e.target.closest('.adm-bell-wrap')) { pop.hidden = true; bell.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* Laci navigasi (layar < 1024px) */
  function isDrawerMode() { return window.matchMedia('(max-width: 1023.98px)').matches; }
  function openDrawer() {
    var side = document.getElementById('adm-side');
    var btn = document.getElementById('adm-menu-btn');
    var scrim = document.getElementById('adm-scrim');
    if (!side || !isDrawerMode()) return;
    side.classList.add('is-open');
    side.setAttribute('role', 'dialog');
    side.setAttribute('aria-modal', 'true');
    side.setAttribute('aria-label', 'Menu navigasi pengurus');
    if (scrim) scrim.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('adm-lock');
    var c = side.querySelector('.adm-side-close');
    setTimeout(function () { if (c) c.focus(); }, 30);
  }
  function closeDrawer() {
    var side = document.getElementById('adm-side');
    var btn = document.getElementById('adm-menu-btn');
    var scrim = document.getElementById('adm-scrim');
    if (!side || !side.classList.contains('is-open')) return;
    side.classList.remove('is-open');
    side.removeAttribute('role'); side.removeAttribute('aria-modal'); side.removeAttribute('aria-label');
    if (scrim) scrim.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (!modalStack.length) document.body.classList.remove('adm-lock');
    if (btn && isDrawerMode()) btn.focus();
  }

  /* Ikon statis di HTML halaman: <span data-icon="wallet" data-icon-size="20"></span> */
  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (n) {
      if (n.getAttribute('data-icon-done')) return;
      n.insertAdjacentHTML('afterbegin', icon(n.getAttribute('data-icon'), parseInt(n.getAttribute('data-icon-size'), 10) || 18));
      n.setAttribute('data-icon-done', '1');
    });
  }

  /* Modal bersama: Detail bukti setoran (Ringkasan & Riwayat) */
  function ensureTxModal() {
    var m = document.getElementById('adm-tx');
    if (m) return m;
    m = document.createElement('div');
    m.className = 'adm-modal'; m.id = 'adm-tx'; m.hidden = true;
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'adm-tx-title');
    m.innerHTML = '<div class="adm-modal-card">' +
      '<div class="adm-modal-head"><div><span class="adm-modal-ref" id="adm-tx-ref">REF</span>' +
      '<h2 class="adm-modal-title" id="adm-tx-title">Detail bukti setoran</h2></div>' +
      '<button type="button" class="adm-icon-btn adm-modal-x" data-modal-close aria-label="Tutup detail bukti setoran">' + icon('x', 20) + '</button></div>' +
      '<div class="adm-kv">' +
        '<div class="adm-kv-row"><span>Pedagang</span><span id="adm-tx-name"></span></div>' +
        '<div class="adm-kv-row"><span>Lapak</span><span id="adm-tx-blok"></span></div>' +
        '<div class="adm-kv-row"><span>Waktu bayar</span><span class="mono" id="adm-tx-time"></span></div>' +
        '<div class="adm-kv-row"><span>Jumlah retribusi</span><span id="adm-tx-nights"></span></div>' +
        '<div class="adm-kv-row"><span>Total nominal</span><span class="mono" id="adm-tx-amount"></span></div>' +
        '<div class="adm-kv-row"><span>Status pembayaran</span><span id="adm-tx-status"></span></div>' +
      '</div>' +
      '<div class="adm-modal-actions">' +
        '<button type="button" class="adm-btn adm-btn-primary" data-tx-print>' + icon('file', 18) + '<span>Unduh Bukti PDF</span></button>' +
        '<button type="button" class="adm-btn adm-btn-ghost" data-modal-close>Tutup</button>' +
      '</div></div>';
    document.body.appendChild(m);
    m.querySelector('[data-tx-print]').addEventListener('click', function () { printModal(m); });
    return m;
  }
  function openTx(t, trigger) {
    var m = ensureTxModal();
    m.querySelector('#adm-tx-ref').textContent = 'REF ' + t.ref;
    m.querySelector('#adm-tx-name').textContent = t.name + ' (' + t.id + ')';
    m.querySelector('#adm-tx-blok').textContent = t.blok;
    m.querySelector('#adm-tx-time').textContent = t.date + ' · ' + t.time;
    m.querySelector('#adm-tx-nights').textContent = t.nights + ' (Rp3.000/malam)';
    m.querySelector('#adm-tx-amount').textContent = t.amount;
    var s = m.querySelector('#adm-tx-status');
    s.textContent = t.label; s.className = 'st-' + t.status;
    openModal(m, trigger);
  }

  function mountShell(cfg) {
    var side = document.getElementById('adm-side');
    var top = document.getElementById('adm-top');
    var foot = document.getElementById('adm-foot');
    if (side) side.innerHTML = sideHtml(cfg.page);
    if (top) top.innerHTML = topHtml(cfg);
    if (foot) foot.innerHTML = footHtml();

    var scrim = document.createElement('div');
    scrim.className = 'adm-scrim'; scrim.id = 'adm-scrim'; scrim.hidden = true;
    scrim.addEventListener('click', closeDrawer);
    document.body.appendChild(scrim);

    var pilar = document.createElement('div');
    pilar.className = 'adm-modal'; pilar.id = 'adm-pilar'; pilar.hidden = true;
    pilar.setAttribute('role', 'dialog'); pilar.setAttribute('aria-modal', 'true'); pilar.setAttribute('aria-labelledby', 'adm-pilar-title');
    pilar.innerHTML = pilarModalHtml();
    document.body.appendChild(pilar);

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open-pilar]');
      if (t) { closeDrawer(); openModal(pilar, t); return; }
      if (e.target.closest('[data-drawer-close]')) { closeDrawer(); return; }
      if (e.target.closest('#adm-menu-btn')) { openDrawer(); return; }
      var cp = e.target.closest('[data-copy-portal]');
      if (cp) {
        copyText('https://apima.id/bayar-qris', 'Tautan portal bayar QRIS disalin.');
        var lbl = cp.querySelector('span');
        if (lbl) { lbl.textContent = 'Tersalin'; setTimeout(function () { lbl.textContent = 'Salin Tautan'; }, 1800); }
      }
    });
    window.addEventListener('resize', function () { if (!isDrawerMode()) closeDrawer(); });

    hydrateIcons(document);
    bindSearch();
    bindBell();
    renderNotif();
    window.addEventListener('apima:state-change', renderNotif);
    window.addEventListener('storage', renderNotif);
  }

  /* Tombol pil (filter / periode / tab): aria-pressed + kelas aktif */
  function bindPills(selector, attr, onChange) {
    var btns = document.querySelectorAll(selector);
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setPill(selector, btn.getAttribute(attr), attr);
        onChange(btn.getAttribute(attr), btn);
      });
    });
  }
  function setPill(selector, value, attr) {
    document.querySelectorAll(selector).forEach(function (b) {
      var on = b.getAttribute(attr) === value;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function onReady(fn) {
    var run = function () { setTimeout(fn, 30); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }
  function onStore(fn) {
    window.addEventListener('apima:state-change', fn);
    window.addEventListener('storage', fn);
  }
  function queryParam(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ''; } catch (e) { return ''; }
  }

  /* ======================================================================
     Grafik SVG
     ====================================================================== */
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function smoothPath(pts) {
    if (!pts.length) return '';
    var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + ' ' + (p1.y + (p2.y - p0.y) / 6).toFixed(1) + ' ' +
        (p2.x - (p3.x - p1.x) / 6).toFixed(1) + ' ' + (p2.y - (p3.y - p1.y) / 6).toFixed(1) + ' ' +
        p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    var exp = Math.pow(10, Math.floor(Math.log10(v)));
    var f = v / exp;
    var nf = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 3 ? 3 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 6 ? 6 : f <= 8 ? 8 : 10;
    return nf * exp;
  }
  var uid = 0;
  var resizeHooks = [];
  var rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { resizeHooks.forEach(function (h) { if (document.contains(h.host)) h.fn(); }); }, 120);
  });
  function onResize(host, fn) {
    var found = resizeHooks.filter(function (h) { return h.host === host; })[0];
    if (found) found.fn = fn; else resizeHooks.push({ host: host, fn: fn });
  }

  /* Grafik area: seri[0] periode ini (area), seri[1] pembanding (garis) */
  function areaChart(host, cfg) {
    if (!host) return;
    var draw = function () {
      uid++;
      var W = Math.max(260, host.clientWidth || 600);
      var H = cfg.height || (W < 480 ? 220 : 280);
      var padL = 40, padR = 12, padT = 14, padB = 30;
      var pw = W - padL - padR, ph = H - padT - padB;
      var all = [];
      cfg.series.forEach(function (s) { all = all.concat(s.vals); });
      var yMax = cfg.yMax || niceMax(Math.max.apply(null, all) * 1.12);
      var n = cfg.labels.length;
      var xAt = function (i) { return padL + (n === 1 ? pw / 2 : (pw * i) / (n - 1)); };
      var yAt = function (v) { return padT + ph - (v / yMax) * ph; };
      host.innerHTML = '';
      host.classList.add('adm-chart');
      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.ariaLabel || 'Grafik' }, host);
      var defs = el('defs', {}, svg);
      var g = el('linearGradient', { id: 'ag' + uid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: '0%', 'class': 'ac-stop-top' }, g);
      el('stop', { offset: '100%', 'class': 'ac-stop-bot' }, g);
      var ticks = 4;
      for (var t = 0; t <= ticks; t++) {
        var v = (yMax / ticks) * t;
        var y = yAt(v);
        el('line', { x1: padL, x2: W - padR, y1: y, y2: y, 'class': t === 0 ? 'ac-base' : 'ac-grid' }, svg);
        var tx = el('text', { x: padL - 8, y: y + 3.5, 'class': 'ac-tick', 'text-anchor': 'end' }, svg);
        tx.textContent = cfg.tickFmt ? cfg.tickFmt(v) : num(v, v % 1 ? 1 : 0);
      }
      var step = n > 8 && W < 520 ? 2 : 1;
      cfg.labels.forEach(function (lb, i) {
        if (i % step && i !== n - 1) return;
        var anchor = i === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle');
        var tx = el('text', { x: xAt(i), y: H - 8, 'class': 'ac-xlbl', 'text-anchor': anchor }, svg);
        tx.textContent = lb;
      });
      var main = cfg.series[0].vals.map(function (v, i) { return { x: xAt(i), y: yAt(v) }; });
      var dMain = smoothPath(main);
      el('path', { d: dMain + ' L' + xAt(n - 1) + ' ' + yAt(0) + ' L' + xAt(0) + ' ' + yAt(0) + ' Z', fill: 'url(#ag' + uid + ')', 'class': 'ac-area' }, svg);
      if (cfg.series[1]) {
        var cmp = cfg.series[1].vals.map(function (v, i) { return { x: xAt(i), y: yAt(v) }; });
        el('path', { d: smoothPath(cmp), 'class': 'ac-line-2' }, svg);
      }
      el('path', { d: dMain, 'class': 'ac-line-1' }, svg);
      /* Garis bantu & titik saat disorot */
      var guide = el('line', { x1: 0, x2: 0, y1: padT, y2: padT + ph, 'class': 'ac-guide', visibility: 'hidden' }, svg);
      var dot = el('circle', { r: 5, cx: 0, cy: 0, 'class': 'ac-dot', visibility: 'hidden' }, svg);
      var tip = document.createElement('div');
      tip.className = 'adm-chart-tip'; tip.hidden = true;
      host.appendChild(tip);
      var hits = el('g', {}, svg);
      cfg.labels.forEach(function (lb, i) {
        var x0 = i === 0 ? padL : (xAt(i - 1) + xAt(i)) / 2;
        var x1 = i === n - 1 ? W - padR : (xAt(i) + xAt(i + 1)) / 2;
        var r = el('rect', { x: x0, y: padT, width: Math.max(1, x1 - x0), height: ph, fill: 'transparent', 'data-i': i }, hits);
        var title = el('title', {}, r);
        title.textContent = lb + ': ' + (cfg.valueFmt ? cfg.valueFmt(cfg.series[0].vals[i]) : cfg.series[0].vals[i]);
      });
      function show(i) {
        var x = xAt(i), y = yAt(cfg.series[0].vals[i]);
        guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('visibility', 'visible');
        var line2 = cfg.series[1] ? '<span class="adm-tip-sub">' + esc(cfg.series[1].name) + ': ' + esc(cfg.valueFmt ? cfg.valueFmt(cfg.series[1].vals[i]) : cfg.series[1].vals[i]) + '</span>' : '';
        tip.innerHTML = '<span class="adm-tip-lbl">' + esc(cfg.labels[i]) + '</span><span class="adm-tip-val mono">' + esc(cfg.valueFmt ? cfg.valueFmt(cfg.series[0].vals[i]) : cfg.series[0].vals[i]) + '</span>' + line2;
        tip.hidden = false;
        var left = Math.min(Math.max(x - 70, 4), W - 144);
        tip.style.left = left + 'px';
        tip.style.top = Math.max(0, y - 64) + 'px';
      }
      function hide() { guide.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.hidden = true; }
      hits.addEventListener('mousemove', function (e) { var i = e.target.getAttribute('data-i'); if (i != null) show(+i); });
      svg.addEventListener('mouseleave', hide);
    };
    draw();
    onResize(host, draw);
  }

  /* Gauge setengah lingkaran (Kepatuhan Bayar) */
  function gauge(host, pct) {
    if (!host) return;
    uid++;
    var W = 170, H = 96, cx = 85, cy = 86, r = 72;
    var p = Math.max(0, Math.min(100, pct)) / 100;
    var a = Math.PI * (1 - p);
    var ex = cx + r * Math.cos(a), ey = cy - r * Math.sin(a);
    var arcAll = 'M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy;
    var arcVal = 'M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + ex.toFixed(2) + ' ' + ey.toFixed(2);
    host.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><linearGradient id="gg' + uid + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" class="gg-a"/><stop offset="100%" class="gg-b"/></linearGradient></defs>' +
      '<path d="' + arcAll + '" class="gauge-track"/>' +
      '<path d="' + arcVal + '" class="gauge-val" stroke="url(#gg' + uid + ')"/>' +
      '</svg><span class="gauge-face">' + icon('smile', 22) + '</span>';
  }

  /* Cincin cakupan (Kinerja Satgas, Profil) */
  function ring(host, pct, center, label, size) {
    if (!host) return;
    uid++;
    var S = size || 140, sw = Math.round(S / 12), r = (S - sw) / 2 - 2, c = 2 * Math.PI * r;
    var p = Math.max(0, Math.min(100, pct)) / 100;
    host.innerHTML = '<svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" aria-hidden="true">' +
      '<defs><linearGradient id="rg' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" class="rg-a"/><stop offset="100%" class="rg-b"/></linearGradient></defs>' +
      '<circle cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + r + '" class="ring-track" stroke-width="' + sw + '"/>' +
      '<circle cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + r + '" class="ring-val" stroke="url(#rg' + uid + ')" stroke-width="' + sw + '" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + S / 2 + ' ' + S / 2 + ')"/>' +
      '</svg><span class="ring-center">' + (center || '') + '</span>';
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', label || (Math.round(pct) + '%'));
  }

  /* Batang pil vertikal (Pedagang Aktif, 0-100%) */
  function pillBars(host, cfg) {
    if (!host) return;
    var draw = function () {
      var W = Math.max(220, host.clientWidth || 400);
      var H = cfg.height || 200;
      var padL = 40, padR = 16, padT = 14, padB = cfg.labels ? 26 : 12;
      var pw = W - padL - padR, ph = H - padT - padB;
      var n = cfg.vals.length;
      var bw = Math.max(8, Math.min(14, pw / n * 0.3));
      var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cfg.ariaLabel || 'Grafik batang') + '">';
      [0, 25, 50, 75, 100].forEach(function (t) {
        var y = padT + ph - (t / 100) * ph;
        svg += '<text x="' + (padL - 10) + '" y="' + (y + 3.5) + '" class="pb-tick" text-anchor="end">' + t + '%</text>';
      });
      cfg.vals.forEach(function (v, i) {
        var cx = padL + (pw / n) * (i + 0.5);
        var h = Math.max(bw, (v / 100) * ph);
        svg += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (padT + ph - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + (bw / 2).toFixed(1) + '" class="pb-bar"><title>' + esc((cfg.labels ? cfg.labels[i] + ': ' : '') + num(v, 0) + '% pedagang aktif') + '</title></rect>';
        if (cfg.labels) svg += '<text x="' + cx.toFixed(1) + '" y="' + (H - 6) + '" class="pb-lbl" text-anchor="middle">' + esc(cfg.labels[i]) + '</text>';
      });
      host.innerHTML = svg + '</svg>';
    };
    draw();
    onResize(host, draw);
  }

  /* Batang per jam (Kinerja Satgas) */
  function hourBars(host, cfg) {
    if (!host) return;
    var max = Math.max.apply(null, cfg.vals.concat([1]));
    host.innerHTML = '<ol class="hb-list" aria-label="' + esc(cfg.ariaLabel || 'Sebaran cek per jam') + '">' + cfg.vals.map(function (v, i) {
      var h = v ? Math.max(18, Math.round((v / max) * 72)) : 4;
      return '<li class="hb-col"><span class="hb-val mono">' + v + '</span><span class="hb-track"><span class="hb-bar' + (v ? '' : ' is-zero') + '" style="height:' + h + 'px"></span></span><span class="hb-lbl mono">' + esc(cfg.labels[i]) + '</span><span class="sr-only"> pukul ' + esc(cfg.labels[i]) + ':00, ' + v + ' lapak</span></li>';
    }).join('') + '</ol>';
  }

  window.APIMA_ADMIN = {
    esc: esc, rp: rp, num: num, icon: icon, toast: toast, copyText: copyText, downloadCsv: downloadCsv,
    setCsv: function (fn) { csvProvider = fn; },
    openModal: openModal, closeModal: closeModal, printModal: printModal, printPage: printPage,
    mountShell: mountShell, hydrateIcons: hydrateIcons, openTx: openTx, bindPills: bindPills, setPill: setPill, onReady: onReady, onStore: onStore, queryParam: queryParam,
    state: state, dateFull: dateFull, dateOnly: dateOnly,
    getAllTx: getAllTx, liveDelta: liveDelta, liveCount: liveCount,
    openFindings: openFindings, parseAnggota: parseAnggota, findingDesc: findingDesc, satgasName: satgasName,
    charts: { area: areaChart, gauge: gauge, ring: ring, pillBars: pillBars, hourBars: hourBars }
  };
})();
