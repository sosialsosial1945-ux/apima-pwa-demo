/* ======================================
   APIMA Interactions v4.0
   Nav, filter, pencarian live, sheet/dialog (Escape), simpan QR,
   pilih malam dinamis, OTP resend, persetujuan, foto satgas, admin dashboard
   ====================================== */
(function () {
  'use strict';

  function showToast(msg) {
    var toast = document.getElementById('apima-toast');
    if (!toast) {
      var host = document.querySelector('.screen') || document.body;
      toast = document.createElement('div');
      toast.id = 'apima-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      host.appendChild(toast);
    }
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.hidden = true;
    }, 3000);
  }

  function init() {
    /* Pengatur tema Terang / Gelap (default: light) */
    function getTheme() {
      return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    }
    function syncThemeControls(mode) {
      document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
        var isDark = mode === 'dark';
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        btn.setAttribute('aria-label', isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
        btn.setAttribute('title', isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
        var lbl = btn.querySelector('[data-theme-label]');
        if (lbl) lbl.textContent = isDark ? 'Mode terang' : 'Mode gelap';
      });
      document.querySelectorAll('[data-theme-set]').forEach(function (btn) {
        var active = btn.dataset.themeSet === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    function setTheme(mode) {
      var next = mode === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('apima-theme', next); } catch (e) {}
      syncThemeControls(next);
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTheme(getTheme() === 'dark' ? 'light' : 'dark');
      });
    });
    document.querySelectorAll('[data-theme-set]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTheme(btn.dataset.themeSet);
      });
    });
    window.addEventListener('storage', function (e) {
      if (e.key === 'apima-theme') syncThemeControls(getTheme());
    });
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'apima-theme') syncThemeControls(e.data.theme);
    });
    syncThemeControls(getTheme());

    /* Bottom nav: tandai item aktif berdasarkan halaman saat ini */
    var page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      if (el.dataset.nav === page) {
        el.classList.add('active');
        el.setAttribute('aria-current', 'page');
      }
    });

    /* Segmented control / filter tab */
    document.querySelectorAll('[data-seg-group]').forEach(function (group) {
      var name = group.dataset.segGroup;
      var btns = group.querySelectorAll('[data-seg]');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          var target = btn.dataset.seg;
          document.querySelectorAll('[data-seg-panel="' + name + '"]').forEach(function (panel) {
            panel.hidden = panel.dataset.segTarget !== target;
          });
          if (name === 'satgas-filter') {
            applySatgasFilter();
          }
        });
      });
    });

    /* Filter + pencarian live daftar satgas */
    var searchInput = document.getElementById('cari');
    var satgasList = document.getElementById('satgas-list');
    var satgasEmpty = document.getElementById('satgas-empty');
    var satgasReset = document.getElementById('satgas-reset');
    var satgasCount = document.getElementById('satgas-visible-count');

    function applySatgasFilter() {
      if (!satgasList) return;
      var activeBtn = document.querySelector('[data-seg-group="satgas-filter"] [data-seg].active');
      var filterVal = activeBtn ? activeBtn.dataset.seg : 'semua';
      var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var items = satgasList.querySelectorAll('li[data-status]');
      var visible = 0;

      items.forEach(function (li) {
        var st = li.dataset.status || '';
        var hay = (li.dataset.search || li.textContent || '').toLowerCase();
        var matchFilter = (filterVal === 'semua') || (st === filterVal);
        var matchQuery = !q || hay.indexOf(q) !== -1;
        var show = matchFilter && matchQuery;
        li.hidden = !show;
        if (show) visible++;
      });

      if (satgasEmpty) satgasEmpty.hidden = visible > 0;
      if (satgasCount) satgasCount.textContent = visible + ' anggota ditampilkan';
    }

    if (searchInput && satgasList) {
      searchInput.addEventListener('input', applySatgasFilter);
      applySatgasFilter();
    }
    if (satgasReset) {
      satgasReset.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        var allBtn = document.querySelector('[data-seg-group="satgas-filter"] [data-seg="semua"]');
        if (allBtn) allBtn.click();
        else applySatgasFilter();
        if (searchInput) searchInput.focus();
      });
    }

    /* Radio card */
    document.querySelectorAll('.radio-card').forEach(function (card) {
      var radio = card.querySelector('input[type=radio]');
      if (!radio) return;
      function sync() {
        var grp = document.querySelectorAll('input[name="' + radio.name + '"]');
        grp.forEach(function (r) {
          var c = r.closest('.radio-card');
          if (!c) return;
          var isDanger = c.dataset.danger !== undefined;
          c.classList.remove('selected', 'selected-danger');
          if (r.checked) {
            c.classList.add(isDanger ? 'selected-danger' : 'selected');
          }
        });
      }
      radio.addEventListener('change', sync);
      sync();
      card.addEventListener('click', function (e) {
        if (e.target !== radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    /* Selectable card (pilih malam + update harga, sisa retribusi baru, dan CTA) */
    document.querySelectorAll('[data-selectable-group]').forEach(function (group) {
      var cards = group.querySelectorAll('.selectable-card');
      var baseQuota = parseInt(group.dataset.baseQuota || '7', 10);
      function applySelection(card) {
        cards.forEach(function (c) {
          c.classList.remove('selected');
          c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        var val = parseInt(card.dataset.value || '7', 10);
        var price = 'Rp' + (val * 3000).toLocaleString('id-ID');
        var output = document.querySelector('[data-selectable-output]');
        if (output) output.textContent = price;
        var quotaOut = document.querySelector('[data-selectable-quota]');
        if (quotaOut) quotaOut.textContent = (baseQuota + val) + ' malam';
        var ctaOut = document.querySelector('[data-selectable-cta]');
        if (ctaOut) ctaOut.textContent = 'Lanjut Bayar ' + price;
      }
      cards.forEach(function (card) {
        card.addEventListener('click', function () { applySelection(card); });
      });
    });

    /* Tombol Simpan QR (AnggotaQris): ekspor PNG nyata + umpan balik */
    document.querySelectorAll('[data-save-qr]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var svg = document.getElementById('qris-svg');
        if (!svg) {
          showToast('QR tidak ditemukan di layar.');
          return;
        }
        try {
          var xml = new XMLSerializer().serializeToString(svg);
          var blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          var img = new Image();
          img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = 480;
            canvas.height = 480;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 480, 480);
            ctx.drawImage(img, 40, 40, 400, 400);
            URL.revokeObjectURL(url);
            var a = document.createElement('a');
            a.download = 'qris-apima.png';
            a.href = canvas.toDataURL('image/png');
            document.body.appendChild(a);
            a.click();
            a.remove();
            showToast('Gambar QR disimpan. Buka dompet digital atau m-banking Anda, lalu pilih Scan dari Galeri.');
          };
          img.onerror = function () {
            URL.revokeObjectURL(url);
            showToast('Silakan screenshot layar ini untuk menyimpan QR Anda.');
          };
          img.src = url;
        } catch (err) {
          showToast('Silakan screenshot layar ini untuk menyimpan QR Anda.');
        }
      });
    });

    /* Bottom sheet / dialog aksesibel (Escape untuk tutup + kembalikan fokus) */
    var activeTrigger = null;
    function closeSheet(sheet) {
      if (!sheet) return;
      sheet.hidden = true;
      if (activeTrigger) {
        activeTrigger.focus();
        activeTrigger = null;
      }
    }

    document.querySelectorAll('[data-sheet-open]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var id = trigger.dataset.sheetOpen;
        var sheet = document.getElementById(id);
        if (!sheet) return;
        activeTrigger = trigger;
        sheet.hidden = false;
        var closeBtn = sheet.querySelector('[data-sheet-close]');
        if (closeBtn) closeBtn.focus();
      });
    });

    document.querySelectorAll('[data-sheet-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeSheet(btn.closest('.sheet-backdrop'));
      });
    });

    document.querySelectorAll('.sheet-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeSheet(backdrop);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.sheet-backdrop:not([hidden])').forEach(closeSheet);
      }
    });

    /* Countdown timer (data-countdown="detik", format MM:SS sesuai UX Playbook v2) */
    document.querySelectorAll('[data-countdown]').forEach(function (el) {
      var secs = parseInt(el.dataset.countdown, 10) || 60;
      var loop = el.dataset.countdownLoop !== undefined;
      var initial = secs;
      function tick() {
        if (secs <= 0) {
          if (loop) {
            secs = initial;
          } else {
            el.textContent = '00:00';
            return;
          }
        }
        var m = Math.floor(secs / 60);
        var s = secs % 60;
        el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        secs--;
        setTimeout(tick, 1000);
      }
      tick();
    });

    /* Tombol kirim ulang OTP */
    var resendBtn = document.querySelector('[data-resend-btn]');
    var resendAfter = document.querySelector('[data-resend-after]');
    if (resendBtn && resendAfter) {
      var initialResend = parseInt(resendAfter.dataset.resendAfter || '45', 10);
      var rsecs = initialResend;
      var resendTimer = null;
      function startResendTimer() {
        clearTimeout(resendTimer);
        resendBtn.disabled = true;
        function tickResend() {
          if (rsecs <= 0) {
            resendBtn.disabled = false;
            resendAfter.textContent = 'siap dikirim';
            return;
          }
          var m = Math.floor(rsecs / 60);
          var s = rsecs % 60;
          resendAfter.textContent = (m > 0 ? m + ' menit ' : '') + s + ' detik';
          rsecs--;
          resendTimer = setTimeout(tickResend, 1000);
        }
        tickResend();
      }
      startResendTimer();
      resendBtn.addEventListener('click', function () {
        if (resendBtn.disabled) return;
        rsecs = initialResend;
        startResendTimer();
        showToast('Kode baru sudah dikirim lewat WhatsApp Anda.');
      });
    }

    /* Checkbox persetujuan (mendukung button dan link) */
    var consentCheck = document.querySelector('[data-consent]');
    var consentBtn = document.querySelector('[data-consent-btn]');
    if (consentCheck && consentBtn) {
      function syncConsent() {
        var allowed = consentCheck.checked;
        if (consentBtn.tagName === 'BUTTON') {
          consentBtn.disabled = !allowed;
        } else {
          consentBtn.setAttribute('aria-disabled', allowed ? 'false' : 'true');
        }
      }
      consentCheck.addEventListener('change', syncConsent);
      consentBtn.addEventListener('click', function (e) {
        if (!consentCheck.checked) {
          e.preventDefault();
          showToast('Centang persetujuan pemakaian data terlebih dulu.');
          consentCheck.focus();
        }
      });
      syncConsent();
    }

    /* Foto ulang (AktivasiFoto) */
    var retakeBtn = document.querySelector('[data-retake-photo]');
    if (retakeBtn) {
      var retakeCount = 0;
      retakeBtn.addEventListener('click', function () {
        retakeCount++;
        var statusEl = document.getElementById('foto-status');
        if (statusEl) {
          statusEl.textContent = 'Preview foto diperbarui (' + retakeCount + 'x)';
        }
        showToast('Foto diri Anda berhasil diperbarui.');
      });
    }

    /* Bagikan QR dan nonaktifkan akses penjaga (AnggotaQrIdentitas) */
    document.querySelectorAll('[data-share-wa]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showToast('QR penjaga siap dibagikan lewat WhatsApp.');
      });
    });

    var revokeConfirm = document.querySelector('[data-revoke-confirm]');
    if (revokeConfirm) {
      revokeConfirm.addEventListener('click', function () {
        var sheet = revokeConfirm.closest('.sheet-backdrop');
        closeSheet(sheet);
        var trigger = document.querySelector('[data-sheet-open="sheet-cabut"]');
        if (trigger) {
          trigger.textContent = 'Akses Penjaga Dinonaktifkan';
          trigger.disabled = true;
        }
        showToast('Akses QR penjaga lapak sudah dinonaktifkan.');
      });
    }

    /* Toggle bukan anggota + foto lapak + kirim (SatgasTemuan) */
    var nonMemberBtn = document.querySelector('[data-non-member-toggle]');
    var memberInput = document.getElementById('anggota');
    if (nonMemberBtn && memberInput) {
      var prevVal = memberInput.value;
      nonMemberBtn.addEventListener('click', function () {
        var pressed = nonMemberBtn.getAttribute('aria-pressed') === 'true';
        if (!pressed) {
          prevVal = memberInput.value;
          memberInput.value = 'Pedagang bukan anggota APIMA';
          memberInput.readOnly = true;
          nonMemberBtn.setAttribute('aria-pressed', 'true');
        } else {
          memberInput.value = prevVal;
          memberInput.readOnly = false;
          nonMemberBtn.setAttribute('aria-pressed', 'false');
        }
      });
    }

    var photoBtn = document.querySelector('[data-photo-btn]');
    var photoSend = document.querySelector('[data-photo-send]');
    var photoHint = document.querySelector('[data-photo-hint]');
    if (photoBtn && photoSend) {
      photoBtn.addEventListener('click', function () {
        photoBtn.classList.add('captured');
        var sp = photoBtn.querySelector('span');
        if (sp) sp.textContent = 'Foto Lapak Tersimpan';
        photoSend.disabled = false;
        if (photoHint) photoHint.textContent = 'Siap disimpan di HP Anda.';
      });
      photoSend.addEventListener('click', function () {
        if (photoSend.disabled) return;
        photoSend.disabled = true;
        photoSend.textContent = 'Tersimpan di HP';
        showToast('Temuan disimpan di HP dan otomatis terkirim saat sinyal kembali.');
      });
    }

    /* Coba Bayar Lagi (AnggotaGangguan) */
    var retryBtn = document.querySelector('[data-retry-btn]');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        retryBtn.disabled = true;
        retryBtn.textContent = 'Menghubungkan\u2026';
        setTimeout(function () {
          retryBtn.disabled = false;
          retryBtn.textContent = 'Coba Bayar Lagi';
          showToast('Sistem pembayaran masih gangguan. Laporan jualan Anda tetap aman sampai 03:00 WIB.');
        }, 1200);
      });
    }

    /* Admin Dashboard: sidebar collapse, CSV export, tinjau bukti temuan */
    var sidebarToggle = document.querySelector('[data-sidebar-toggle]');
    var adminNav = document.querySelector('.admin-nav');
    if (sidebarToggle && adminNav) {
      sidebarToggle.addEventListener('click', function () {
        var collapsed = adminNav.classList.toggle('collapsed');
        sidebarToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        sidebarToggle.setAttribute('aria-label', collapsed ? 'Perluas menu samping' : 'Ciutkan menu samping');
      });
    }

    /* Admin nav active state saat klik anchor */
    document.querySelectorAll('.admin-nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) === '#') {
          document.querySelectorAll('.admin-nav-link').forEach(function (l) {
            l.classList.remove('active');
            l.removeAttribute('aria-current');
          });
          document.querySelectorAll('.admin-nav-link[href="' + href + '"]').forEach(function (l) {
            l.classList.add('active');
            l.setAttribute('aria-current', 'page');
          });
          var mobileSheet = link.closest('.sheet-backdrop');
          if (mobileSheet) closeSheet(mobileSheet);
        }
      });
    });

    /* Unduh laporan CSV nyata */
    document.querySelectorAll('[data-export-csv]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var csv = [
          'Jam,Anggota,Temuan,Satgas,Status',
          '23:41,"Siti Aminah (0456)","Jualan tanpa bayar","Satgas A","Perlu Tinjau"',
          '23:18,"Rahmat Hidayat (0078)","QR ganda","Satgas B","Perlu Tinjau"',
          '22:55,"Tidak terdaftar","Pedagang bukan anggota","Satgas A","Perlu Tinjau"'
        ].join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'laporan-apima.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Laporan CSV berhasil diunduh.');
      });
    });

    /* Tinjau bukti temuan Admin */
    var currentEvidenceRow = null;
    document.querySelectorAll('[data-evidence-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentEvidenceRow = btn.closest('tr');
        var sheet = document.getElementById('sheet-bukti');
        if (!sheet) return;
        activeTrigger = btn;
        var titleEl = document.getElementById('bukti-judul');
        var metaEl = document.getElementById('bukti-meta');
        var locEl = document.getElementById('bukti-lokasi');
        if (titleEl) titleEl.textContent = btn.dataset.temuan || 'Temuan lapangan';
        if (metaEl) metaEl.textContent = (btn.dataset.anggota || '') + ' \u00b7 ' + (btn.dataset.satgas || '') + ' \u00b7 ' + (btn.dataset.jam || '');
        if (locEl) locEl.textContent = btn.dataset.lokasi || 'Blok pasar Muara Angke';
        sheet.hidden = false;
        var closeBtn = sheet.querySelector('[data-sheet-close]');
        if (closeBtn) closeBtn.focus();
      });
    });

    var markReviewedBtn = document.querySelector('[data-mark-reviewed]');
    if (markReviewedBtn) {
      markReviewedBtn.addEventListener('click', function () {
        if (currentEvidenceRow && currentEvidenceRow.dataset.reviewed !== 'true') {
          currentEvidenceRow.dataset.reviewed = 'true';
          var statusCell = currentEvidenceRow.querySelector('[data-row-status]');
          if (statusCell) {
            statusCell.className = 'badge badge-success';
            statusCell.textContent = 'Sudah Ditinjau';
          }
          var pendingEl = document.getElementById('pending-count');
          if (pendingEl) {
            var remaining = document.querySelectorAll('#temuan-tbody tr:not([data-reviewed="true"])').length;
            pendingEl.textContent = String(remaining);
          }
          showToast('Temuan ditandai sudah ditinjau.');
        }
        closeSheet(markReviewedBtn.closest('.sheet-backdrop'));
      });
    }

    /* Toggle lihat / sembunyikan password */
    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.dataset.togglePassword);
        if (!input) return;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', show ? 'true' : 'false');
        btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
      });
    });

    /* Login standar ID + Password (sistem otomatis arahkan sesuai peran) */
    function normalizeLoginId(raw) {
      return (raw || '').trim().toUpperCase().replace(/\s+/g, '');
    }
    function resolveDirectDestinationById(rawId) {
      var id = normalizeLoginId(rawId);
      if (/^A[-0-9]/.test(id) || id === 'ADMIN' || id === 'KETUA') return 'AdminRingkasan.dc.html';
      if (/^S[-0-9]/.test(id) || id === 'SATGAS') return 'SatgasDaftar.dc.html';
      return 'Main.dc.html';
    }
    function resolveOtpDestinationById(rawId) {
      var id = normalizeLoginId(rawId);
      if (/^A[-0-9]/.test(id) || id === 'ADMIN' || id === 'KETUA') return 'MasukPin.dc.html';
      if (/^S[-0-9]/.test(id) || id === 'SATGAS') return 'SatgasDaftar.dc.html';
      return 'Main.dc.html';
    }

    var loginForm = document.querySelector('[data-login-form]');
    var loginIdInput = document.querySelector('[data-login-id]');
    var loginPwInput = document.querySelector('[data-login-password]');
    if (loginForm && loginIdInput) {
      [loginIdInput, loginPwInput].forEach(function (inp) {
        if (!inp) return;
        inp.addEventListener('input', function () { inp.classList.remove('error'); });
      });
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var idVal = normalizeLoginId(loginIdInput.value);
        var pwVal = loginPwInput ? loginPwInput.value.trim() : '';
        if (!idVal) {
          loginIdInput.classList.add('error');
          loginIdInput.focus();
          showToast('Masukkan ID Anda terlebih dulu.');
          return;
        }
        if (loginPwInput && !pwVal) {
          loginPwInput.classList.add('error');
          loginPwInput.focus();
          showToast('Masukkan password Anda terlebih dulu.');
          return;
        }
        try { sessionStorage.setItem('apima-login-id', idVal); } catch (err) {}
        location.href = resolveDirectDestinationById(idVal);
      });
    }

    var otpIdLabel = document.querySelector('[data-otp-id-label]');
    var otpSubmitLinks = document.querySelectorAll('[data-otp-submit]');
    if (otpIdLabel || otpSubmitLinks.length) {
      var params = new URLSearchParams(location.search);
      var activeId = params.get('id');
      if (!activeId) {
        try { activeId = sessionStorage.getItem('apima-login-id'); } catch (err) {}
      }
      activeId = normalizeLoginId(activeId) || '0123';
      if (otpIdLabel) otpIdLabel.textContent = 'ID ' + activeId;
      var dest = resolveOtpDestinationById(activeId);
      otpSubmitLinks.forEach(function (link) {
        link.setAttribute('href', dest);
      });
    }

    /* Unduh PDF */
    document.querySelectorAll('[data-export-pdf]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var label = btn.dataset.exportPdf || 'Laporan PDF';
        showToast(label + ' siap dicetak atau diunduh.');
      });
    });

    window.apimaToast = showToast;
    window.__apimaInteractionsReady = true;
  }

  /* Jalankan tepat sekali setelah support.js selesai membentangkan x-dc & sc-for */
  var booted = false;
  function bootOnce() {
    if (booted) return;
    booted = true;
    init();
  }
  function scheduleBoot() {
    if (window.__apimaDomReady || !document.querySelector('x-dc')) {
      bootOnce();
    } else {
      window.addEventListener('apima:ready', bootOnce, { once: true });
      setTimeout(bootOnce, 80);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBoot, { once: true });
  } else {
    scheduleBoot();
  }
})();
