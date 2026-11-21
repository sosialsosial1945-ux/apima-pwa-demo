/* ======================================
   APIMA Shared Prototype Store (v1.0)
   Menyatukan state Anggota, Satgas, dan Pengurus di localStorage
   dengan cadangan memori jika localStorage tidak tersedia.
   ====================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'apima-proto-state-v1';
  var TARIFF = 3000;
  var DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  var memoryFallback = null;

  function formatRupiah(num) {
    var n = Math.max(0, Math.round(Number(num) || 0));
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function formatDateInfo(dayOffset) {
    var offset = parseInt(dayOffset, 10) || 0;
    var d = new Date(2026, 10, 14 + offset); // 14 Nov 2026 = Sabtu
    var dayName = DAY_NAMES[d.getDay()];
    var dayNum = d.getDate();
    var monthName = MONTH_NAMES[d.getMonth()];
    var year = d.getFullYear();
    return {
      short: dayName + ', ' + dayNum + ' ' + monthName,
      full: dayName + ', ' + dayNum + ' ' + monthName + ' ' + year,
      dateOnly: dayNum + ' ' + monthName + ' ' + year,
      refStamp: String(dayNum).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0')
    };
  }

  function nowTimeWib() {
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    return hh + ':' + mm + ' WIB';
  }

  function buildBudiHistoryLama() {
    return [
      { id: 'h-13', date: 'Jum, 13 Nov', type: 'lapor', title: 'Lapor jualan', sub: 'memakai 1 malam', amount: null, nights: 0 },
      { id: 'h-12', date: 'Kam, 12 Nov', type: 'lapor', title: 'Lapor jualan', sub: 'memakai 1 malam', amount: null, nights: 0 },
      { id: 'h-11', date: 'Rab, 11 Nov', type: 'tidak_lapor', title: 'Tidak lapor', sub: '', amount: null, nights: 0 },
      { id: 'h-10', date: 'Sel, 10 Nov', type: 'bayar', title: 'Bayar 7 malam', sub: 'terpakai 1 malam ini', amount: 21000, nights: 7, ref: 'QRIS-1011-0412', time: '20:45 WIB' },
      { id: 'h-09', date: 'Sen, 9 Nov', type: 'tidak_lapor', title: 'Tidak lapor', sub: '', amount: null, nights: 0 },
      { id: 'h-08', date: 'Min, 8 Nov', type: 'bayar', title: 'Bayar 1 malam', sub: '', amount: 3000, nights: 1, ref: 'QRIS-0811-0318', time: '21:10 WIB' },
      { id: 'h-07', date: 'Sab, 7 Nov', type: 'bayar', title: 'Bayar 1 malam', sub: '', amount: 3000, nights: 1, ref: 'QRIS-0711-0294', time: '20:52 WIB' },
      { id: 'h-06', date: 'Jum, 6 Nov', type: 'bayar', title: 'Bayar 1 malam', sub: '', amount: 3000, nights: 1, ref: 'QRIS-0611-0211', time: '21:05 WIB' }
    ];
  }

  function createInitialState(preset) {
    var mode = preset === 'baru' ? 'baru' : 'lama';
    var isLama = mode === 'lama';

    var members = [
      {
        id: '0123',
        name: 'Budi Santoso',
        initials: 'BS',
        blok: 'Blok C-14',
        penjaga: 'Rahmat',
        penjagaPhone: '6281298765432',
        penjagaActive: true,
        paidNights: isLama ? 4 : 0,
        tonightStatus: isLama ? 'belum_lapor' : 'belum_bayar',
        note: isLama ? 'Malam terbayar 4 malam' : 'Belum ada malam terbayar',
        history: isLama ? buildBudiHistoryLama() : []
      },
      {
        id: '0456',
        name: 'Siti Aminah',
        initials: 'SA',
        blok: 'Blok B-09',
        penjaga: 'Jaga sendiri',
        penjagaPhone: '',
        penjagaActive: false,
        paidNights: 0,
        tonightStatus: 'belum_bayar',
        note: 'Terakhir 2 hari lalu',
        history: []
      },
      {
        id: '0311',
        name: 'Dewi Lestari',
        initials: 'DL',
        blok: 'Blok B-08',
        penjaga: 'Tono (adik)',
        penjagaPhone: '6281311223344',
        penjagaActive: true,
        paidNights: 3,
        tonightStatus: 'sudah_bayar',
        note: 'Bayar 22:15 WIB',
        history: []
      },
      {
        id: '0078',
        name: 'Rahmat Hidayat',
        initials: 'RH',
        blok: 'Blok B-03',
        penjaga: 'Jaga sendiri',
        penjagaPhone: '',
        penjagaActive: false,
        paidNights: 0,
        tonightStatus: 'belum_bayar',
        note: 'Aktif kemarin',
        history: []
      },
      {
        id: '0592',
        name: 'Agus Salim',
        initials: 'AS',
        blok: 'Blok D-02',
        penjaga: 'Hendri',
        penjagaPhone: '6281544556677',
        penjagaActive: true,
        paidNights: 2,
        tonightStatus: 'belum_lapor',
        note: 'Malam terbayar 2 malam',
        history: []
      },
      {
        id: '0014',
        name: 'H. Slamet Raharjo',
        initials: 'SR',
        blok: 'Blok A-02',
        penjaga: 'Darto',
        penjagaPhone: '6281233445566',
        penjagaActive: true,
        paidNights: 29,
        tonightStatus: 'sudah_bayar',
        note: 'Bayar 22:54 WIB',
        history: []
      },
      {
        id: '0640',
        name: 'Nurmala Sari',
        initials: 'NS',
        blok: 'Blok A-11',
        penjaga: 'Sari (istri)',
        penjagaPhone: '6281766554433',
        penjagaActive: true,
        paidNights: 5,
        tonightStatus: 'sudah_bayar',
        note: 'Dicek 22:40 WIB',
        history: []
      }
    ];

    var findings = [
      {
        id: 'f-1',
        temuan: 'Jualan tanpa bayar',
        anggota: 'Siti Aminah (0456)',
        memberId: '0456',
        satgas: 'Satgas A',
        satgasCode: 'S-01',
        jam: '23:41 WIB',
        lokasi: 'Blok B-09, Pasar Ikan Muara Angke',
        tone: 'danger',
        reviewed: false
      },
      {
        id: 'f-2',
        temuan: 'QR ganda',
        anggota: 'Rahmat Hidayat (0078)',
        memberId: '0078',
        satgas: 'Satgas B',
        satgasCode: 'S-02',
        jam: '23:18 WIB',
        lokasi: 'Blok B-03, Pasar Ikan Muara Angke',
        tone: 'warning',
        reviewed: false
      },
      {
        id: 'f-3',
        temuan: 'Pedagang bukan anggota',
        anggota: 'Tidak terdaftar',
        memberId: '',
        satgas: 'Satgas A',
        satgasCode: 'S-01',
        jam: '22:55 WIB',
        lokasi: 'Lorong Utara Blok D',
        tone: 'neutral',
        reviewed: false
      }
    ];

    return {
      version: 1,
      preset: mode,
      dayOffset: 0,
      activeMemberId: '0123',
      members: members,
      pendingOrder: { nights: 1, fromBeranda: false },
      lastPayment: null,
      findings: findings,
      adminLivePayments: [],
      satgasLogs: [],
      checkedMemberIds: ['0640'],
      lastSatgasCheck: null,
      budiPaidTonightDelta: 0,
      budiReportedTonight: false
    };
  }

  function safeRead() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.members)) {
          memoryFallback = parsed;
          return parsed;
        }
      }
    } catch (e) {
      /* fallback ke memori */
    }
    if (!memoryFallback) {
      memoryFallback = createInitialState('lama');
      safeWrite(memoryFallback);
    }
    return memoryFallback;
  }

  function safeWrite(state) {
    memoryFallback = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* abaikan error storage, tetap jalan dari memori */
    }
    window.dispatchEvent(new CustomEvent('apima:state-change', { detail: state }));
  }

  function cloneState(s) {
    return JSON.parse(JSON.stringify(s));
  }

  function getState() {
    return safeRead();
  }

  function reload() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.members)) {
          memoryFallback = parsed;
        }
      }
    } catch (e) {}
    return safeRead();
  }

  function getMember(id) {
    var st = safeRead();
    var targetId = String(id || st.activeMemberId || '0123');
    for (var i = 0; i < st.members.length; i++) {
      if (st.members[i].id === targetId) return st.members[i];
    }
    return st.members[0];
  }

  function getActiveMember() {
    var st = safeRead();
    return getMember(st.activeMemberId || '0123');
  }

  function getStatusMeta(status) {
    if (status === 'sudah_bayar') {
      return {
        key: 'sudah_bayar',
        label: 'Sudah Bayar',
        fullLabel: 'Jualan · Sudah Bayar',
        pillClass: 'pill-success',
        dotClass: 'dot-success',
        badgeClass: 'badge-success',
        toneClass: 'tone-success'
      };
    }
    if (status === 'belum_lapor') {
      return {
        key: 'belum_lapor',
        label: 'Belum Lapor',
        fullLabel: 'Belum Lapor',
        pillClass: 'pill-warning',
        dotClass: 'dot-warning',
        badgeClass: 'badge-warning',
        toneClass: 'tone-warning'
      };
    }
    return {
      key: 'belum_bayar',
      label: 'Belum Bayar',
      fullLabel: 'Belum Bayar',
      pillClass: 'pill-danger',
      dotClass: 'dot-danger',
      badgeClass: 'badge-danger',
      toneClass: 'tone-danger'
    };
  }

  function getHistoryTotal(member) {
    var m = member || getActiveMember();
    var sum = 0;
    (m.history || []).forEach(function (h) {
      if (h.type === 'bayar' && typeof h.amount === 'number' && h.amount > 0) {
        sum += h.amount;
      }
    });
    return sum;
  }

  function setPendingOrder(nights, fromBeranda) {
    var st = cloneState(safeRead());
    var n = Math.max(1, Math.min(30, parseInt(nights, 10) || 1));
    st.pendingOrder = {
      nights: n,
      amount: n * TARIFF,
      fromBeranda: !!fromBeranda
    };
    safeWrite(st);
    return st.pendingOrder;
  }

  function getPendingOrder() {
    var st = safeRead();
    var p = st.pendingOrder || { nights: 1, fromBeranda: false };
    var n = Math.max(1, Math.min(30, parseInt(p.nights, 10) || 1));
    return {
      nights: n,
      amount: n * TARIFF,
      fromBeranda: !!p.fromBeranda
    };
  }

  function reportSellingTonight(memberId) {
    var st = cloneState(safeRead());
    var id = String(memberId || st.activeMemberId || '0123');
    var m = st.members.find(function (x) { return x.id === id; });
    if (!m) return { ok: false, reason: 'not_found' };
    if (m.tonightStatus === 'sudah_bayar') return { ok: true, already: true, member: m };
    if (m.paidNights <= 0) return { ok: false, reason: 'no_paid_nights', member: m };

    var dateInfo = formatDateInfo(st.dayOffset);
    var timeWib = nowTimeWib();
    m.paidNights = Math.max(0, m.paidNights - 1);
    m.tonightStatus = 'sudah_bayar';
    m.note = 'Lapor ' + timeWib;
    m.history = m.history || [];
    m.history.unshift({
      id: 'h-' + Date.now(),
      date: dateInfo.short,
      type: 'lapor',
      title: 'Lapor jualan',
      sub: 'memakai 1 malam',
      amount: null,
      nights: 0,
      time: timeWib
    });
    if (m.id === '0123') {
      st.budiReportedTonight = true;
    }
    safeWrite(st);
    return { ok: true, member: m, dateInfo: dateInfo };
  }

  function confirmPayment(nights, memberId) {
    var st = cloneState(safeRead());
    var id = String(memberId || st.activeMemberId || '0123');
    var m = st.members.find(function (x) { return x.id === id; });
    if (!m) return null;

    var y = Math.max(1, Math.min(30, parseInt(nights, 10) || getPendingOrder().nights || 1));
    var x = Math.max(0, parseInt(m.paidNights, 10) || 0);
    var amount = y * TARIFF;
    var autoReport = (x === 0 && m.tonightStatus !== 'sudah_bayar');
    var usedTonight = autoReport ? 1 : 0;
    var z = x + y - usedTonight;
    var dateInfo = formatDateInfo(st.dayOffset);
    var timeWib = nowTimeWib();
    var ref = 'QRIS-' + dateInfo.refStamp + '-' + String(Math.floor(1000 + Math.random() * 9000));

    m.paidNights = z;
    if (autoReport) {
      m.tonightStatus = 'sudah_bayar';
      m.note = 'Bayar ' + timeWib;
      if (m.id === '0123') st.budiReportedTonight = true;
    } else if (m.tonightStatus !== 'sudah_bayar') {
      m.tonightStatus = 'belum_lapor';
      m.note = 'Malam terbayar ' + z + ' malam';
    }

    var historySub = autoReport ? 'terpakai 1 malam ini' : '';
    m.history = m.history || [];
    m.history.unshift({
      id: 'h-' + Date.now(),
      date: dateInfo.short,
      type: 'bayar',
      title: 'Bayar ' + y + ' malam',
      sub: historySub,
      amount: amount,
      nights: y,
      ref: ref,
      time: timeWib
    });

    var txEntry = {
      id: m.id,
      initials: m.initials,
      init: m.initials,
      name: m.name,
      blok: m.blok,
      nights: y + ' malam',
      nightsNum: y,
      time: timeWib,
      date: dateInfo.dateOnly,
      dateShort: dateInfo.short,
      amount: formatRupiah(amount),
      amountNum: amount,
      status: 'Lunas',
      statusKey: 'lunas',
      label: 'Lunas',
      badge: 'badge-success',
      tone: 'tone-success',
      ref: ref
    };
    st.adminLivePayments = st.adminLivePayments || [];
    st.adminLivePayments.unshift(txEntry);

    if (m.id === '0123') {
      st.budiPaidTonightDelta = (st.budiPaidTonightDelta || 0) + amount;
    }

    st.lastPayment = {
      memberId: m.id,
      nights: y,
      amount: amount,
      prevPaidNights: x,
      usedTonight: usedTonight,
      afterPaidNights: z,
      autoReported: autoReport,
      dateShort: dateInfo.short,
      dateFull: dateInfo.full,
      time: timeWib,
      ref: ref,
      tonightStatus: m.tonightStatus
    };
    st.pendingOrder = { nights: y, amount: amount, fromBeranda: false };

    safeWrite(st);
    return st.lastPayment;
  }

  function addFinding(opts) {
    var st = cloneState(safeRead());
    var timeWib = nowTimeWib();
    var m = opts.memberId ? st.members.find(function (x) { return x.id === String(opts.memberId); }) : null;
    var finding = {
      id: 'f-' + Date.now(),
      temuan: opts.temuan || 'Catatan lapangan',
      anggota: opts.anggota || (m ? (m.name + ' (' + m.id + ')') : 'Tidak terdaftar'),
      memberId: m ? m.id : (opts.memberId || ''),
      satgas: opts.satgas || 'Satgas A',
      satgasCode: opts.satgasCode || 'S-01',
      jam: timeWib,
      lokasi: opts.lokasi || (m ? (m.blok + ', Pasar Ikan Muara Angke') : 'Pasar Ikan Muara Angke'),
      tone: opts.tone || 'warning',
      reviewed: false
    };
    st.findings = st.findings || [];
    st.findings.unshift(finding);

    st.satgasLogs = st.satgasLogs || [];
    st.satgasLogs.unshift({
      jam: timeWib.replace(' WIB', ''),
      satgas: finding.satgasCode === 'S-02' ? 'Dedi Kurniawan (S-02)' : 'Ahmad Fauzi (S-01)',
      satgasCode: finding.satgasCode,
      anggota: finding.anggota,
      metode: opts.metode || 'Scan QR dinamis',
      zona: (m ? m.blok : 'Pasar') + ' · 6.1071 S, 106.7742 E',
      hasil: finding.temuan,
      badge: finding.tone === 'danger' ? 'badge-danger' : (finding.tone === 'success' ? 'badge-success' : 'badge-warning')
    });

    /* PENTING: Catatan satgas TIDAK PERNAH mengubah status pembayaran menjadi lunas. */
    safeWrite(st);
    return finding;
  }

  function addSatgasCheckLog(opts) {
    var st = cloneState(safeRead());
    var timeWib = nowTimeWib();
    st.satgasLogs = st.satgasLogs || [];
    st.satgasLogs.unshift({
      jam: timeWib.replace(' WIB', ''),
      satgas: 'Ahmad Fauzi (S-01)',
      satgasCode: 'S-01',
      anggota: opts.anggota || 'Anggota',
      metode: opts.metode || 'Scan QR dinamis',
      zona: (opts.blok || 'Blok C-14') + ' · 6.1071 S, 106.7742 E',
      hasil: opts.hasil || 'Sesuai',
      badge: opts.badge || 'badge-success'
    });
    safeWrite(st);
  }

  function markFindingReviewed(findingId) {
    var st = cloneState(safeRead());
    var f = (st.findings || []).find(function (x) { return x.id === findingId; });
    if (f) {
      f.reviewed = true;
      safeWrite(st);
    }
    return f;
  }

  function setPenjagaActive(active, memberId) {
    var st = cloneState(safeRead());
    var id = String(memberId || st.activeMemberId || '0123');
    var m = st.members.find(function (x) { return x.id === id; });
    if (m) {
      m.penjagaActive = !!active;
      safeWrite(st);
    }
    return m;
  }

  function resetState(preset) {
    var targetPreset = preset || safeRead().preset || 'lama';
    var next = createInitialState(targetPreset);
    safeWrite(next);
    return next;
  }

  function switchPreset(preset) {
    var next = createInitialState(preset === 'baru' ? 'baru' : 'lama');
    safeWrite(next);
    return next;
  }

  function nextNight() {
    var st = cloneState(safeRead());
    var prevDate = formatDateInfo(st.dayOffset);
    var budi = st.members.find(function (x) { return x.id === '0123'; });

    /* Jika malam sebelumnya Budi tidak melapor, catat "Tidak lapor" dan malam terbayar tidak berubah */
    if (budi && budi.tonightStatus !== 'sudah_bayar') {
      budi.history = budi.history || [];
      budi.history.unshift({
        id: 'h-skip-' + Date.now(),
        date: prevDate.short,
        type: 'tidak_lapor',
        title: 'Tidak lapor',
        sub: '',
        amount: null,
        nights: 0
      });
    }

    st.dayOffset = (parseInt(st.dayOffset, 10) || 0) + 1;

    /* Reset status malam ini untuk malam baru; malam terbayar TIDAK berubah sampai anggota lapor */
    st.members.forEach(function (m) {
      if (m.id === '0123') {
        m.tonightStatus = m.paidNights > 0 ? 'belum_lapor' : 'belum_bayar';
        m.note = m.paidNights > 0 ? ('Malam terbayar ' + m.paidNights + ' malam') : 'Belum ada malam terbayar';
      } else if (m.paidNights > 0) {
        m.tonightStatus = 'belum_lapor';
      } else {
        m.tonightStatus = 'belum_bayar';
      }
    });
    st.budiReportedTonight = false;
    st.checkedMemberIds = [];
    st.lastSatgasCheck = null;
    safeWrite(st);
    return st;
  }

  function getQrPeriod(nowMs) {
    return Math.floor((nowMs || Date.now()) / 45000);
  }

  function getQrSecondsRemaining(nowMs) {
    var sec = Math.floor((nowMs || Date.now()) / 1000) % 45;
    return 45 - sec;
  }

  /* DEMO SAJA, HAPUS SEBELUM PRODUKSI:
     status malam ini ikut dibawa di isi QR (PAID / UNPAID / NOREPORT) supaya HP satgas
     yang datanya terpisah tetap tahu status pedagang. Di produksi status dibaca dari server. */
  var QR_STATUS_CODE = { sudah_bayar: 'PAID', belum_bayar: 'UNPAID', belum_lapor: 'NOREPORT' };
  var QR_STATUS_KEY = { PAID: 'sudah_bayar', UNPAID: 'belum_bayar', NOREPORT: 'belum_lapor' };

  function buildIdentityQrPayload(memberId, nowMs) {
    var cleanId = String(memberId || '0123').trim();
    var base = 'APIMA:' + cleanId + ':' + getQrPeriod(nowMs);
    var member = getMember(cleanId);
    var code = member ? QR_STATUS_CODE[member.tonightStatus] : null;
    return code ? (base + ':' + code) : base;
  }

  function parseIdentityQrPayload(rawText, nowMs) {
    var text = String(rawText || '').trim();
    /* Format lama tanpa status tetap diterima */
    var m = text.match(/^APIMA:([0-9]{4}):([0-9]+)(?::(PAID|UNPAID|NOREPORT))?$/i);
    if (!m) {
      return { status: 'unknown', raw: text };
    }
    var memberId = m[1];
    var period = parseInt(m[2], 10);
    var qrStatus = m[3] ? m[3].toUpperCase() : null;
    var st = reload();
    var member = st.members.find(function (x) { return x.id === memberId; });
    if (!member) {
      return { status: 'unknown', memberId: memberId, raw: text };
    }
    var currentPeriod = getQrPeriod(nowMs);
    /* Kedaluwarsa jika lebih dari 90 detik (> 2 periode 45 detik) */
    if (isNaN(period) || (currentPeriod - period) > 2 || (period - currentPeriod) > 1) {
      return { status: 'expired', memberId: memberId, member: member, period: period };
    }
    /* DEMO SAJA, HAPUS SEBELUM PRODUKSI: status dari QR disimpan ke data uji HP satgas */
    if (qrStatus && QR_STATUS_KEY[qrStatus] && member.tonightStatus !== QR_STATUS_KEY[qrStatus]) {
      var next = cloneState(st);
      var target = next.members.find(function (x) { return x.id === memberId; });
      if (target) {
        target.tonightStatus = QR_STATUS_KEY[qrStatus];
        target.note = qrStatus === 'PAID' ? 'Bayar (dibaca dari QR)' : (qrStatus === 'NOREPORT' ? 'Belum lapor malam ini' : 'Belum ada pembayaran aktif');
        safeWrite(next);
        member = target;
      }
    }
    return { status: 'valid', memberId: memberId, member: member, period: period, qrStatus: qrStatus };
  }

  /* Gambar QR ke canvas: dipakai AnggotaQrIdentitas dan AnggotaBerhasil (butuh lib/qrcode.js) */
  function drawQrToCanvas(canvas, text, targetPx) {
    if (!canvas || typeof window.qrcode !== 'function') return false;
    var qr = window.qrcode(0, 'M');
    qr.addData(String(text || ''));
    qr.make();
    var count = qr.getModuleCount();
    var quiet = 4;
    var totalModules = count + quiet * 2;
    var scale = Math.max(4, Math.floor((targetPx || 240) / totalModules));
    var size = totalModules * scale;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#0F172A';
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
    }
    return true;
  }

  /* Hasil pemeriksaan otomatis dari status malam ini (tanpa pilihan satgas) */
  function resultFromStatus(tonightStatus) {
    if (tonightStatus === 'sudah_bayar') return { key: 'sesuai', label: 'Sesuai' };
    if (tonightStatus === 'belum_lapor') return { key: 'belum_lapor', label: 'Belum lapor jualan' };
    return { key: 'jualan_tanpa_bayar', label: 'Jualan tanpa bayar' };
  }

  function badgeForResult(resultKey) {
    if (resultKey === 'jualan_tanpa_bayar') return 'badge-danger';
    if (resultKey === 'sesuai') return 'badge-success';
    return 'badge-warning';
  }

  function saveSatgasInspection(opts) {
    var st = cloneState(safeRead());
    var timeWib = nowTimeWib();
    var m = st.members.find(function (x) { return x.id === String(opts.memberId || ''); });
    var memberName = m ? m.name : (opts.name || 'Anggota');
    var memberBlok = m ? m.blok : (opts.blok || 'Pasar Muara Angke');
    var memberId = m ? m.id : String(opts.memberId || '');
    var resultKey = opts.resultKey || 'sesuai';
    var resultLabel = opts.resultLabel || 'Sesuai';
    var isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

    st.checkedMemberIds = Array.isArray(st.checkedMemberIds) ? st.checkedMemberIds : [];
    if (memberId && st.checkedMemberIds.indexOf(memberId) === -1) {
      st.checkedMemberIds.push(memberId);
    }

    var anggotaLabel = memberId ? (memberName + ' (' + memberId + ')') : memberName;
    var stamp = Date.now();
    var findingId = null;
    /* "Belum lapor" dan "Sesuai" hanya masuk log; temuan untuk pengurus dibuat saat jualan tanpa bayar atau laporan manual */
    if (resultKey === 'jualan_tanpa_bayar' || resultKey === 'penjaga_tidak_dikenal' || resultKey === 'bayar_di_tempat') {
      var tone = resultKey === 'jualan_tanpa_bayar' ? 'danger' : 'warning';
      findingId = 'f-' + stamp;
      var finding = {
        id: findingId,
        temuan: resultLabel,
        anggota: anggotaLabel,
        memberId: memberId,
        satgas: 'Satgas A',
        satgasCode: 'S-01',
        jam: timeWib,
        lokasi: memberBlok + ', Pasar Ikan Muara Angke',
        tone: tone,
        reviewed: false
      };
      st.findings = st.findings || [];
      st.findings.unshift(finding);
    }

    var logId = 'log-' + stamp;
    st.satgasLogs = st.satgasLogs || [];
    st.satgasLogs.unshift({
      id: logId,
      jam: timeWib.replace(' WIB', ''),
      satgas: 'Ahmad Fauzi (S-01)',
      satgasCode: 'S-01',
      anggota: anggotaLabel,
      metode: opts.metode || 'Scan QR dinamis',
      zona: memberBlok + ' · 6.1071 S, 106.7742 E',
      hasil: resultLabel,
      badge: badgeForResult(resultKey)
    });

    st.lastSatgasCheck = {
      memberId: memberId,
      name: memberName,
      blok: memberBlok,
      resultKey: resultKey,
      resultLabel: resultLabel,
      jam: timeWib,
      offline: isOffline,
      findingId: findingId,
      logId: logId
    };

    /* PENTING: pemeriksaan satgas TIDAK PERNAH mengubah status pembayaran menjadi lunas */
    safeWrite(st);
    return st.lastSatgasCheck;
  }

  /* Cek ulang: hasil pemeriksaan terakhir diperbarui mengikuti status terbaru (mis. UNPAID menjadi PAID) */
  function updateLastInspection(memberId, resultKey, resultLabel) {
    var st = cloneState(safeRead());
    var last = st.lastSatgasCheck;
    if (!last || last.memberId !== String(memberId || '')) return null;
    if (last.findingId) {
      st.findings = (st.findings || []).filter(function (f) { return f.id !== last.findingId; });
      last.findingId = null;
    }
    var log = (st.satgasLogs || []).find(function (l) { return l.id === last.logId; });
    if (log) {
      log.hasil = resultLabel;
      log.badge = badgeForResult(resultKey);
    }
    last.resultKey = resultKey;
    last.resultLabel = resultLabel;
    last.jam = nowTimeWib();
    safeWrite(st);
    return last;
  }

  /* =====================================================================
     // HAPUS SEBELUM PRODUKSI
     Panel kecil "Mode uji" yang bisa disembunyikan untuk penguji prototype
     ===================================================================== */
  function mountTestPanel() {
    var path = (window.location.pathname || '').split('/').pop() || '';
    var params = new URLSearchParams(window.location.search || '');
    var isPenjagaView = params.get('mode') === 'penjaga';
    if (
      !path ||
      path === 'index.html' ||
      path === 'feedback.html' ||
      path === 'MasukId.dc.html' ||
      isPenjagaView ||
      document.getElementById('apima-test-fab')
    ) {
      return;
    }

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'apima-test-fab';
    fab.className = 'test-mode-fab';
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'apima-test-panel');
    fab.setAttribute('aria-label', 'Buka panel Mode uji');
    fab.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
      '<span>Mode uji</span>';

    var panel = document.createElement('div');
    panel.id = 'apima-test-panel';
    panel.className = 'test-mode-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Panel Mode uji prototype');

    function renderPanelBody() {
      var st = safeRead();
      var budi = getActiveMember();
      var dInfo = formatDateInfo(st.dayOffset);
      var statusLabel = getStatusMeta(budi.tonightStatus).label;
      panel.innerHTML =
        '<div class="row between items-center gap-2">' +
          '<div class="stack">' +
            '<span class="text-sm fw-700 text-main">Mode uji prototype</span>' +
            '<span class="text-xs text-secondary tnum">' + dInfo.short + ' · ' + statusLabel + ' · ' + budi.paidNights + ' malam</span>' +
          '</div>' +
          '<button type="button" class="btn-icon" data-test-close aria-label="Sembunyikan panel Mode uji">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="stack gap-1">' +
          '<span class="text-xs fw-700 text-secondary">Keadaan awal</span>' +
          '<div class="grid-2">' +
            '<button type="button" class="btn-chip' + (st.preset === 'lama' ? ' test-chip-active' : '') + '" data-test-preset="lama" aria-pressed="' + (st.preset === 'lama' ? 'true' : 'false') + '">Akun lama</button>' +
            '<button type="button" class="btn-chip' + (st.preset === 'baru' ? ' test-chip-active' : '') + '" data-test-preset="baru" aria-pressed="' + (st.preset === 'baru' ? 'true' : 'false') + '">Akun baru</button>' +
          '</div>' +
        '</div>' +
        '<div class="stack gap-2">' +
          '<button type="button" class="btn btn-secondary" style="height:44px" data-test-next-night>Ganti ke Malam Berikutnya</button>' +
          '<button type="button" class="btn btn-secondary" style="height:44px" data-test-reset>Reset Data Uji</button>' +
        '</div>';

      panel.querySelector('[data-test-close]').addEventListener('click', function () {
        panel.hidden = true;
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
      });

      panel.querySelectorAll('[data-test-preset]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = btn.dataset.testPreset;
          switchPreset(p);
          renderPanelBody();
          if (window.apimaToast) {
            window.apimaToast(p === 'baru' ? 'Beralih ke keadaan awal Akun baru.' : 'Beralih ke keadaan awal Akun lama.');
          }
          window.location.reload();
        });
      });

      panel.querySelector('[data-test-next-night]').addEventListener('click', function () {
        nextNight();
        renderPanelBody();
        if (window.apimaToast) {
          window.apimaToast('Berpindah ke malam berikutnya. Status kembali Belum Lapor.');
        }
        window.location.reload();
      });

      panel.querySelector('[data-test-reset]').addEventListener('click', function () {
        resetState('lama');
        renderPanelBody();
        if (window.apimaToast) {
          window.apimaToast('Data uji dikembalikan ke awal.');
        }
        window.location.reload();
      });
    }

    function positionFab() {
      if (window.innerWidth >= 900 && document.querySelector('.admin-shell')) {
        fab.style.bottom = '16px';
        fab.style.right = '16px';
        panel.style.bottom = '68px';
        panel.style.right = '16px';
        return;
      }
      var footer = document.querySelector('.screen-footer');
      var nav = document.querySelector('.bottom-nav');
      var offset = 16;
      if (footer && !footer.hidden) {
        offset = Math.max(offset, Math.round(footer.getBoundingClientRect().height) + 12);
      } else if (nav && !nav.hidden) {
        offset = Math.max(offset, Math.round(nav.getBoundingClientRect().height) + 12);
      }
      fab.style.bottom = offset + 'px';
      fab.style.right = '12px';
      panel.style.bottom = (offset + 52) + 'px';
      panel.style.right = '12px';
    }

    fab.addEventListener('click', function () {
      var willOpen = panel.hidden;
      if (willOpen) renderPanelBody();
      panel.hidden = !willOpen;
      fab.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) {
        panel.hidden = true;
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
      }
    });

    window.addEventListener('resize', positionFab);
    window.addEventListener('apima:state-change', function () {
      if (!panel.hidden) renderPanelBody();
    });

    document.body.appendChild(panel);
    document.body.appendChild(fab);
    setTimeout(positionFab, 60);
  }

  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      reload();
      window.dispatchEvent(new CustomEvent('apima:state-change', { detail: safeRead() }));
    }
  });

  window.APIMA_STORE = {
    TARIFF: TARIFF,
    STORAGE_KEY: STORAGE_KEY,
    formatRupiah: formatRupiah,
    formatDateInfo: formatDateInfo,
    nowTimeWib: nowTimeWib,
    getState: getState,
    reload: reload,
    getMember: getMember,
    getActiveMember: getActiveMember,
    getStatusMeta: getStatusMeta,
    getHistoryTotal: getHistoryTotal,
    setPendingOrder: setPendingOrder,
    getPendingOrder: getPendingOrder,
    reportSellingTonight: reportSellingTonight,
    confirmPayment: confirmPayment,
    addFinding: addFinding,
    addSatgasCheckLog: addSatgasCheckLog,
    markFindingReviewed: markFindingReviewed,
    setPenjagaActive: setPenjagaActive,
    resetState: resetState,
    switchPreset: switchPreset,
    nextNight: nextNight,
    getQrPeriod: getQrPeriod,
    getQrSecondsRemaining: getQrSecondsRemaining,
    buildIdentityQrPayload: buildIdentityQrPayload,
    parseIdentityQrPayload: parseIdentityQrPayload,
    drawQrToCanvas: drawQrToCanvas,
    resultFromStatus: resultFromStatus,
    saveSatgasInspection: saveSatgasInspection,
    updateLastInspection: updateLastInspection
  };

  /* =====================================================================
     Temuan milik satgas yang sedang masuk (S-01), untuk halaman "Temuan saya".
     Ditambahkan 22 Nov 2026. Fungsi lama di atas tidak diubah.
     Tiap catatan: { id, dayOffset, memberId, name, blok, temuan, tone,
                    jam, sent, findingId, nonMember }
     sent = false berarti masih "Tersimpan di HP" (belum sampai ke pengurus).
     Catatan non-"Sesuai" yang belum terkirim baru masuk daftar tinjauan
     pengurus (st.findings) saat dikirim.
     PENTING: tidak satu pun fungsi ini mengubah status bayar anggota.
     ===================================================================== */
  function seedSatgasOwnFindings() {
    /* Data uji awal malam pertama: dua sudah terkirim (sama dengan f-1 dan f-3
       di daftar pengurus), satu masih tersimpan di HP. */
    return [
      { id: 'own-seed-1', dayOffset: 0, memberId: '0456', name: 'Siti Aminah', blok: 'Blok B-09', temuan: 'Jualan tanpa bayar', tone: 'danger', jam: '23:41 WIB', sent: true, findingId: 'f-1', nonMember: false },
      { id: 'own-seed-2', dayOffset: 0, memberId: '0078', name: 'Rahmat Hidayat', blok: 'Blok B-03', temuan: 'Penjaga tidak dikenal', tone: 'warning', jam: '23:05 WIB', sent: false, findingId: null, nonMember: false },
      { id: 'own-seed-3', dayOffset: 0, memberId: '', name: 'Pedagang bukan anggota', blok: 'Lorong Utara Blok D', temuan: 'Pedagang bukan anggota', tone: 'neutral', jam: '22:55 WIB', sent: true, findingId: 'f-3', nonMember: true }
    ];
  }

  function ensureSatgasOwn(st) {
    if (!Array.isArray(st.satgasOwnFindings)) st.satgasOwnFindings = seedSatgasOwnFindings();
    return st.satgasOwnFindings;
  }

  /* Daftar temuan saya untuk malam yang sedang aktif (terbaru di atas) */
  function getSatgasOwnFindings() {
    var st = safeRead();
    if (!Array.isArray(st.satgasOwnFindings)) {
      var next = cloneState(st);
      ensureSatgasOwn(next);
      safeWrite(next);
      st = next;
    }
    var day = parseInt(st.dayOffset, 10) || 0;
    return st.satgasOwnFindings.filter(function (f) { return (parseInt(f.dayOffset, 10) || 0) === day; });
  }

  function countPendingSatgasFindings() {
    return getSatgasOwnFindings().filter(function (f) { return !f.sent; }).length;
  }

  function toneForTemuan(label) {
    var t = String(label || '').toLowerCase();
    if (t === 'sesuai') return 'success';
    if (t.indexOf('tanpa bayar') !== -1) return 'danger';
    return 'warning';
  }

  /* Tambahkan catatan ke "Temuan saya" saja (temuan pengurus sudah dibuat di tempat lain) */
  function addSatgasOwnFinding(opts) {
    opts = opts || {};
    var st = cloneState(safeRead());
    var list = ensureSatgasOwn(st);
    var m = opts.memberId ? st.members.find(function (x) { return x.id === String(opts.memberId); }) : null;
    var entry = {
      id: 'own-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      dayOffset: parseInt(st.dayOffset, 10) || 0,
      memberId: m ? m.id : '',
      name: opts.name || (m ? m.name : 'Pedagang'),
      blok: opts.blok || (m ? m.blok : 'Pasar Ikan Muara Angke'),
      temuan: opts.temuan || 'Catatan lapangan',
      tone: opts.tone || toneForTemuan(opts.temuan),
      jam: opts.jam || nowTimeWib(),
      sent: opts.sent !== false,
      findingId: opts.findingId || null,
      nonMember: !!opts.nonMember
    };
    list.unshift(entry);
    safeWrite(st);
    return entry;
  }

  /* Hapus catatan saya yang terkait temuan pengurus (mis. setelah Cek Ulang menjadi lunas) */
  function removeSatgasOwnFinding(findingId) {
    if (!findingId) return false;
    var st = cloneState(safeRead());
    var list = ensureSatgasOwn(st);
    var before = list.length;
    st.satgasOwnFindings = list.filter(function (f) { return f.findingId !== findingId && f.id !== findingId; });
    safeWrite(st);
    return st.satgasOwnFindings.length !== before;
  }

  function pushOwnToReview(st, entry) {
    if (entry.findingId || entry.tone === 'success') return;
    var findingId = 'f-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    st.findings = st.findings || [];
    st.findings.unshift({
      id: findingId,
      temuan: entry.temuan,
      anggota: entry.nonMember ? 'Tidak terdaftar' : (entry.memberId ? (entry.name + ' (' + entry.memberId + ')') : entry.name),
      memberId: entry.memberId || '',
      satgas: 'Satgas A',
      satgasCode: 'S-01',
      jam: entry.jam,
      lokasi: entry.blok + ', Pasar Ikan Muara Angke',
      tone: entry.tone === 'danger' ? 'danger' : (entry.nonMember ? 'neutral' : 'warning'),
      reviewed: false
    });
    entry.findingId = findingId;
  }

  /* Catat Temuan manual. opts: { memberId, name, blok, temuan, nonMember, offline, metode }
     Online: catatan non-"Sesuai" langsung masuk daftar tinjauan pengurus.
     Offline: disimpan di HP dulu (sent = false) sampai dikirim. */
  function recordSatgasFinding(opts) {
    opts = opts || {};
    var st = cloneState(safeRead());
    var list = ensureSatgasOwn(st);
    var m = (!opts.nonMember && opts.memberId) ? st.members.find(function (x) { return x.id === String(opts.memberId); }) : null;
    var offline = opts.offline != null ? !!opts.offline : (typeof navigator !== 'undefined' && navigator.onLine === false);
    var timeWib = nowTimeWib();
    var entry = {
      id: 'own-' + Date.now(),
      dayOffset: parseInt(st.dayOffset, 10) || 0,
      memberId: m ? m.id : '',
      name: opts.name || (m ? m.name : (opts.nonMember ? 'Pedagang bukan anggota' : 'Pedagang')),
      blok: opts.blok || (m ? m.blok : 'Pasar Ikan Muara Angke'),
      temuan: opts.temuan || 'Catatan lapangan',
      tone: toneForTemuan(opts.temuan),
      jam: timeWib,
      sent: !offline,
      findingId: null,
      nonMember: !!opts.nonMember
    };
    if (!offline) pushOwnToReview(st, entry);

    st.satgasLogs = st.satgasLogs || [];
    st.satgasLogs.unshift({
      id: 'log-' + Date.now(),
      jam: timeWib.replace(' WIB', ''),
      satgas: 'Ahmad Fauzi (S-01)',
      satgasCode: 'S-01',
      anggota: entry.nonMember ? ('Bukan anggota: ' + entry.name) : (entry.memberId ? (entry.name + ' (' + entry.memberId + ')') : entry.name),
      metode: opts.metode || 'Catat manual + foto',
      zona: entry.blok + ' · 6.1071 S, 106.7742 E',
      hasil: entry.temuan,
      badge: entry.tone === 'danger' ? 'badge-danger' : (entry.tone === 'success' ? 'badge-success' : 'badge-warning')
    });

    list.unshift(entry);
    /* PENTING: catatan satgas TIDAK PERNAH mengubah status pembayaran menjadi lunas */
    safeWrite(st);
    return entry;
  }

  /* Kirim semua catatan yang masih tersimpan di HP. Mengembalikan jumlah yang terkirim. */
  function sendPendingSatgasFindings() {
    var st = cloneState(safeRead());
    var list = ensureSatgasOwn(st);
    var day = parseInt(st.dayOffset, 10) || 0;
    var count = 0;
    list.forEach(function (entry) {
      if ((parseInt(entry.dayOffset, 10) || 0) !== day || entry.sent) return;
      pushOwnToReview(st, entry);
      entry.sent = true;
      count++;
    });
    safeWrite(st);
    return count;
  }

  window.APIMA_STORE.getSatgasOwnFindings = getSatgasOwnFindings;
  window.APIMA_STORE.countPendingSatgasFindings = countPendingSatgasFindings;
  window.APIMA_STORE.addSatgasOwnFinding = addSatgasOwnFinding;
  window.APIMA_STORE.removeSatgasOwnFinding = removeSatgasOwnFinding;
  window.APIMA_STORE.recordSatgasFinding = recordSatgasFinding;
  window.APIMA_STORE.sendPendingSatgasFindings = sendPendingSatgasFindings;

  function bootTestUi() {
    safeRead();
    mountTestPanel();
  }
  window.addEventListener('apima:ready', bootTestUi);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(bootTestUi, 80); });
  } else {
    setTimeout(bootTestUi, 80);
  }
})();
