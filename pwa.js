/* APIMA PWA Demo Runtime: Service Worker, Install Prompt, dan Masuk Cepat Presentasi */
(function () {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }

  var deferredPrompt = null;

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

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    syncInstallBtn();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    var btn = document.getElementById('pwa-install-btn');
    if (btn) btn.hidden = true;
    if (window.apimaToast) window.apimaToast('Aplikasi APIMA berhasil dipasang di perangkat.');
  });

  function bindPwaControls() {
    syncInstallBtn();

    var installBtn = document.getElementById('pwa-install-btn');
    if (installBtn && !installBtn.dataset.pwaBound) {
      installBtn.dataset.pwaBound = '1';
      installBtn.addEventListener('click', function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
        } else if (window.apimaToast) {
          window.apimaToast('Buka menu browser lalu pilih Tambah ke Layar Utama (Add to Home Screen).');
        }
      });
    }

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
  }

  window.addEventListener('apima:ready', bindPwaControls);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(bindPwaControls, 40); });
  } else {
    setTimeout(bindPwaControls, 40);
  }
})();
