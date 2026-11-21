/* =====================================================================
   APIMA Bottom Nav v5
   Pakai: <nav class="v5-nav" data-v5-nav="anggota" data-active="beranda"></nav>
          <nav class="v5-nav" data-v5-nav="satgas"  data-active="daftar"></nav>
   Anggota: Beranda, Bayar, [QR tengah -> sheet pilihan], Riwayat, Akun
   Satgas : Daftar, Catat, [Scan QR tengah], Temuan, Akun
   ===================================================================== */
(function () {
  'use strict';

  var ICONS = {
    home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4.5v-6h3v6H18a1 1 0 0 0 1-1V9.5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><line x1="2.5" y1="10" x2="21.5" y2="10"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14h1"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    list: '<path d="M3 6l1.5 1.5L7 5"/><path d="M3 12l1.5 1.5L7 11"/><path d="M3 18l1.5 1.5L7 17"/><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>',
    clipPlus: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3h6v1"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/>',
    clipList: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3h6v1"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="13" y2="18"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    arrow: '<polyline points="9 6 15 12 9 18"/>'
  };

  function svg(name, size) {
    var s = size || 24;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function item(key, href, icon, label, active) {
    var on = key === active;
    return '<a href="' + href + '" class="v5-nav-item' + (on ? ' active' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + svg(icon) + '<span>' + label + '</span></a>';
  }

  function renderAnggota(nav, active) {
    nav.setAttribute('aria-label', 'Navigasi anggota');
    nav.innerHTML =
      item('beranda', 'Main.dc.html', 'home', 'Beranda', active) +
      item('bayar', 'AnggotaPilihHari.dc.html', 'card', 'Bayar', active) +
      '<div class="v5-nav-fab-wrap' + (active === 'qr' ? ' active' : '') + '">' +
        '<button type="button" class="v5-nav-fab" data-v5-qr-open aria-haspopup="dialog" aria-label="Bayar QRIS atau tunjukkan QR ke satgas">' + svg('qr', 28) + '</button>' +
        '<span class="v5-nav-fab-label" aria-hidden="true">QR</span>' +
      '</div>' +
      item('riwayat', 'AnggotaRiwayat.dc.html', 'doc', 'Riwayat', active) +
      item('akun', 'AnggotaAkun.dc.html', 'user', 'Akun', active);

    if (document.getElementById('v5-sheet-qr')) return;
    var sheet = document.createElement('div');
    sheet.id = 'v5-sheet-qr';
    sheet.className = 'sheet-backdrop';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'v5-sheet-qr-title');
    sheet.innerHTML =
      '<div class="sheet">' +
        '<div class="row between items-center">' +
          '<h2 id="v5-sheet-qr-title" class="m-0">Mau pakai QR untuk apa?</h2>' +
          '<button type="button" class="v5-icon-btn" data-v5-qr-close aria-label="Tutup pilihan QR">' + svg('close') + '</button>' +
        '</div>' +
        '<a href="AnggotaPilihHari.dc.html" class="v5-action-option">' +
          '<span class="v5-action-icon">' + svg('card') + '</span>' +
          '<span class="stack" style="gap:2px;flex:1"><span class="v5-action-title">Bayar QRIS</span><span class="v5-action-sub">Pilih jumlah malam, lalu bayar lewat dompet digital atau m-banking.</span></span>' +
          svg('arrow', 20) +
        '</a>' +
        '<a href="AnggotaQrIdentitas.dc.html" class="v5-action-option">' +
          '<span class="v5-action-icon">' + svg('qr') + '</span>' +
          '<span class="stack" style="gap:2px;flex:1"><span class="v5-action-title">Tunjukkan QR ke Satgas</span><span class="v5-action-sub">QR identitas lapak, berganti otomatis setiap 45 detik.</span></span>' +
          svg('arrow', 20) +
        '</a>' +
      '</div>';
    (nav.closest('.screen') || document.body).appendChild(sheet);

    var opener = nav.querySelector('[data-v5-qr-open]');
    function open() { sheet.hidden = false; var c = sheet.querySelector('[data-v5-qr-close]'); if (c) c.focus(); }
    function close() { sheet.hidden = true; if (opener) opener.focus(); }
    opener.addEventListener('click', open);
    sheet.querySelector('[data-v5-qr-close]').addEventListener('click', close);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
  }

  function renderSatgas(nav, active) {
    nav.setAttribute('aria-label', 'Navigasi satgas');
    nav.innerHTML =
      item('daftar', 'SatgasDaftar.dc.html', 'list', 'Daftar', active) +
      item('catat', 'SatgasCatat.dc.html', 'clipPlus', 'Catat', active) +
      '<div class="v5-nav-fab-wrap' + (active === 'scan' ? ' active' : '') + '">' +
        '<a href="SatgasScan.dc.html?scan=1" class="v5-nav-fab" aria-label="Scan QR anggota">' + svg('scan', 28) + '</a>' +
        '<span class="v5-nav-fab-label" aria-hidden="true">Scan QR</span>' +
      '</div>' +
      item('temuan', 'SatgasTemuan.dc.html', 'clipList', 'Temuan', active) +
      item('akun', 'SatgasAkun.dc.html', 'user', 'Akun', active);
  }

  function boot() {
    document.querySelectorAll('[data-v5-nav]').forEach(function (nav) {
      if (nav.dataset.v5Rendered) return;
      nav.dataset.v5Rendered = '1';
      var role = nav.dataset.v5Nav;
      var active = nav.dataset.active || '';
      if (role === 'anggota') renderAnggota(nav, active);
      else if (role === 'satgas') renderSatgas(nav, active);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
