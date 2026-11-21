/* APIMA PWA Demo Runtime: Early Install Prompt Capture, Service Worker, dan Masuk Cepat Presentasi */
(function () {
  'use strict';

  var deferredPrompt = window.__apimaDeferredPrompt || null;

  /* Tangkap event beforeinstallprompt seawal mungkin sebelum DOM selesai */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    window.__apimaDeferredPrompt = e;
    syncInstallBtn();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    window.__apimaDeferredPrompt = null;
    var btn = document.getElementById('pwa-install-btn');
    if (btn) btn.hidden = true;
    var sheet = document.getElementById('sheet-install-pwa');
    if (sheet) sheet.hidden = true;
    if (window.apimaToast) window.apimaToast('Aplikasi APIMA berhasil dipasang di perangkat.');
  });

  if ('serviceWorker' in navigator) {
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function (reg) {
        reg.update().catch(function () {});
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') {
            reg.update().catch(function () {});
          }
        });
      }).catch(function () {});
    });
  }

  function detectPlatform() {
    var ua = navigator.userAgent || '';
    var isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isCriOS = /CriOS/i.test(ua);
    var isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    var isInApp = /FBAN|FBAV|Instagram|Line|WhatsApp/i.test(ua);
    if (isInApp) return 'inapp';
    if (isIos && isCriOS) return 'ios-chrome';
    if (isIos) return 'ios';
    if (isSafari) return 'mac-safari';
    return 'chromium';
  }

  function openInstallGuide() {
    var sheet = document.getElementById('sheet-install-pwa');
    var stepsEl = document.getElementById('install-guide-steps');
    var subEl = document.getElementById('install-guide-sub');
    if (!sheet || !stepsEl) {
      if (window.apimaToast) window.apimaToast('Ketuk ikon Bagikan lalu pilih Tambah ke Layar Utama (Add to Home Screen).');
      return;
    }
    var platform = detectPlatform();
    if (platform === 'ios-chrome') {
      subEl.textContent = 'Di Chrome iPhone, pemasangan ada di ikon Bagikan (pojok kanan atas kolom alamat):';
      stepsEl.innerHTML =
        '<li class="open-row"><span class="text-sm"><strong>1.</strong> Ketuk ikon <strong>Bagikan (kotak panah ke atas)</strong> di kanan atas kolom alamat (sebelah URL).</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>2.</strong> Geser ke bawah lalu pilih <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>3.</strong> Ketuk <strong>Add</strong> di pojok kanan atas. Ikon APIMA langsung terpasang.</span></li>';
    } else if (platform === 'ios') {
      subEl.textContent = 'Safari di iPhone/iPad mewajibkan pemasangan lewat menu Bagikan:';
      stepsEl.innerHTML =
        '<li class="open-row"><span class="text-sm"><strong>1.</strong> Ketuk ikon <strong>Bagikan (kotak panah atas)</strong> di bagian bawah Safari.</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>2.</strong> Geser ke bawah lalu pilih <strong>Tambah ke Layar Utama</strong>.</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>3.</strong> Ketuk <strong>Tambah</strong> di pojok kanan atas. Ikon APIMA langsung terpasang.</span></li>';
    } else if (platform === 'inapp') {
      subEl.textContent = 'Anda membuka tautan dari dalam browser WhatsApp/aplikasi lain:';
      stepsEl.innerHTML =
        '<li class="open-row"><span class="text-sm"><strong>1.</strong> Ketuk menu <strong>titik tiga</strong> di pojok kanan atas.</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>2.</strong> Pilih <strong>Buka di Chrome</strong> (Android) atau <strong>Buka di Safari</strong> (iPhone).</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>3.</strong> Ketuk lagi tombol <strong>Download APIMA</strong> untuk langsung memasang aplikasi.</span></li>';
    } else if (platform === 'mac-safari') {
      subEl.textContent = 'Safari di Mac memasang aplikasi lewat menu Bagikan atau File:';
      stepsEl.innerHTML =
        '<li class="open-row"><span class="text-sm"><strong>1.</strong> Klik menu <strong>File</strong> di bilah atas Mac (atau ikon Bagikan).</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>2.</strong> Pilih <strong>Add to Dock</strong> (Tambahkan ke Dock).</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>3.</strong> Klik <strong>Add</strong> agar APIMA muncul seperti aplikasi native di Mac.</span></li>';
    } else {
      subEl.textContent = 'Jika jendela pemasangan otomatis belum muncul di Chrome/Edge:';
      stepsEl.innerHTML =
        '<li class="open-row"><span class="text-sm"><strong>1.</strong> Klik ikon <strong>Instal (layar dengan panah bawah)</strong> di sisi kanan kolom alamat browser, atau menu titik tiga.</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>2.</strong> Pilih <strong>Instal APIMA</strong> / <strong>Tambahkan ke layar utama</strong>.</span></li>' +
        '<li class="open-row"><span class="text-sm"><strong>3.</strong> Aplikasi APIMA langsung terpasang dan bisa dibuka tanpa browser.</span></li>';
    }
    sheet.hidden = false;
  }

  function syncInstallBtn() {
    var btn = document.getElementById('pwa-install-btn');
    if (!btn) return;
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
  }

  function bindPwaControls() {
    syncInstallBtn();

    var installBtn = document.getElementById('pwa-install-btn');
    if (installBtn && !installBtn.dataset.pwaBound) {
      installBtn.dataset.pwaBound = '1';
      installBtn.addEventListener('click', function () {
        var promptEvt = deferredPrompt || window.__apimaDeferredPrompt;
        if (promptEvt) {
          promptEvt.prompt();
          promptEvt.userChoice.then(function (choice) {
            if (choice && choice.outcome === 'accepted' && window.apimaToast) {
              window.apimaToast('Mengunduh dan memasang aplikasi APIMA.');
            }
            deferredPrompt = null;
            window.__apimaDeferredPrompt = null;
          }).catch(function () {
            openInstallGuide();
          });
        } else {
          openInstallGuide();
        }
      });
    }

    // HAPUS SEBELUM PRODUKSI (akses cepat demo presentasi)
    document.querySelectorAll('[data-demo-role]').forEach(function (btn) {
      if (btn.dataset.pwaRoleBound) return;
      btn.dataset.pwaRoleBound = '1';
      btn.addEventListener('click', function () {
        var role = btn.dataset.demoRole;
        var target = btn.dataset.demoTarget;
        try {
          localStorage.setItem('apima-demo-role', role);
        } catch (e) {}
        if (target) window.location.href = target;
      });
    });

    /* Tombol mengambang "Beri Masukan" dimatikan sementara agar tidak menutupi tombol Masuk */
    var SHOW_FEEDBACK = false;
    var isFeedbackPage = /feedback\.html$/i.test(window.location.pathname || '');
    if (SHOW_FEEDBACK && !isFeedbackPage && !document.getElementById('pwa-feedback-fab')) {
      var fab = document.createElement('a');
      fab.id = 'pwa-feedback-fab';
      fab.href = 'feedback.html';
      fab.className = 'pwa-feedback-fab';
      fab.setAttribute('aria-label', 'Beri masukan UI/UX aplikasi APIMA');
      fab.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
        '<span>Beri Masukan</span>';
      document.body.appendChild(fab);
    }
  }

  window.addEventListener('apima:ready', bindPwaControls);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(bindPwaControls, 40); });
  } else {
    setTimeout(bindPwaControls, 40);
  }
})();
