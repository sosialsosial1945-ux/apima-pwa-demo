/* ======================================
   APIMA Shared Prototype Store (v1.0)
   Menyatukan state Anggota, Satgas, dan Pengurus di localStorage
   dengan cadangan memori jika localStorage tidak tersedia.
   ====================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'apima-proto-state-v3'; /* v3: alur awal belum bayar -> buka lapak -> bayar -> sedang jualan */
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

  var DAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  function dateForOffset(offset) {
    return new Date(2026, 10, 14 + (parseInt(offset, 10) || 0));
  }

  /* "Senin, 16 Nov" */
  function formatDayLong(offset) {
    var d = dateForOffset(offset);
    return DAY_LONG[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()];
  }

  /* "10–16 Nov", "8 Nov", atau "28 Nov–4 Des" */
  function formatRange(startOffset, endOffset) {
    var a = dateForOffset(startOffset), b = dateForOffset(endOffset);
    if (startOffset === endOffset) return a.getDate() + ' ' + MONTH_NAMES[a.getMonth()];
    if (a.getMonth() === b.getMonth()) return a.getDate() + '\u2013' + b.getDate() + ' ' + MONTH_NAMES[b.getMonth()];
    return a.getDate() + ' ' + MONTH_NAMES[a.getMonth()] + '\u2013' + b.getDate() + ' ' + MONTH_NAMES[b.getMonth()];
  }

  /* Model v2: satu tanggal "lunas sampai" (paidUntil, offset hari dari 14 Nov 2026).
     Malam ini lunas jika dayOffset <= paidUntil. Lapor hanya mencatat absensi. */
  function isLunasAt(m, dayOffset) {
    return !!m && m.paidUntil !== null && m.paidUntil !== undefined && (parseInt(dayOffset, 10) || 0) <= m.paidUntil;
  }

  function deriveMember(m, dayOffset) {
    var lunas = isLunasAt(m, dayOffset);
    m.lunas = lunas;
    m.paidUntilLabel = (m.paidUntil !== null && m.paidUntil !== undefined) ? formatDayLong(m.paidUntil) : '';
    m.tonightStatus = !lunas ? 'belum_bayar' : (m.reportedTonight ? 'sudah_bayar' : 'belum_lapor');
    if (!m.noteFixed) {
      m.note = lunas ? ('Lunas sampai ' + m.paidUntilLabel) : 'Malam ini belum bayar';
    }
    delete m.paidNights;
    return m;
  }

  function applyDerived(st) {
    if (st && Array.isArray(st.members)) {
      st.members.forEach(function (m) { deriveMember(m, st.dayOffset); });
    }
    return st;
  }

  function buildBudiHistoryLama() {
    return [
      { id: 'h-13', date: 'Jum, 13 Nov', type: 'lapor', title: 'Lapor jualan', sub: '', amount: null, nights: 0 },
      { id: 'h-12', date: 'Kam, 12 Nov', type: 'lapor', title: 'Lapor jualan', sub: '', amount: null, nights: 0 },
      { id: 'h-11', date: 'Rab, 11 Nov', type: 'tidak_lapor', title: 'Tidak lapor', sub: '', amount: null, nights: 0 },
      { id: 'h-10', date: 'Sel, 10 Nov', type: 'bayar', title: 'Bayar 7 malam', sub: 'lunas 10\u201316 Nov', amount: 21000, nights: 7, ref: 'QRIS-1011-0412', time: '20:45 WIB' },
      { id: 'h-09', date: 'Sen, 9 Nov', type: 'tidak_lapor', title: 'Tidak lapor', sub: '', amount: null, nights: 0 },
      { id: 'h-08', date: 'Min, 8 Nov', type: 'bayar', title: 'Bayar 1 malam', sub: 'lunas 8 Nov', amount: 3000, nights: 1, ref: 'QRIS-0811-0318', time: '21:10 WIB' },
      { id: 'h-07', date: 'Sab, 7 Nov', type: 'bayar', title: 'Bayar 1 malam', sub: 'lunas 7 Nov', amount: 3000, nights: 1, ref: 'QRIS-0711-0294', time: '20:52 WIB' },
      { id: 'h-06', date: 'Jum, 6 Nov', type: 'bayar', title: 'Bayar 1 malam', sub: 'lunas 6 Nov', amount: 3000, nights: 1, ref: 'QRIS-0611-0211', time: '21:05 WIB' }
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
        paidUntil: isLama ? 2 : null,   /* lama: bayar 7 malam 10 Nov, lunas 10–16 Nov */
        reportedTonight: false,
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
        paidUntil: null,
        reportedTonight: false,
        note: 'Terakhir 2 hari lalu',
        noteFixed: true,
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
        paidUntil: 2,
        reportedTonight: true,
        note: 'Bayar 22:15 WIB',
        noteFixed: true,
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
        paidUntil: null,
        reportedTonight: false,
        note: 'Aktif kemarin',
        noteFixed: true,
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
        paidUntil: 1,
        reportedTonight: false,
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
        paidUntil: 28,
        reportedTonight: true,
        note: 'Bayar 22:54 WIB',
        noteFixed: true,
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
        paidUntil: 4,
        reportedTonight: true,
        note: 'Dicek 22:40 WIB',
        noteFixed: true,
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
      version: 3,
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
        if (parsed && parsed.version === 3 && Array.isArray(parsed.members)) {
          memoryFallback = applyDerived(parsed);
          return memoryFallback;
        }
      }
    } catch (e) {
      /* fallback ke memori */
    }
    if (!memoryFallback) {
      memoryFallback = applyDerived(createInitialState('baru'));
      safeWrite(memoryFallback);
    }
    return memoryFallback;
  }

  function safeWrite(state) {
    applyDerived(state);
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
        if (parsed && parsed.version === 3 && Array.isArray(parsed.members)) {
          memoryFallback = applyDerived(parsed);
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

  /* Pencarian ketat untuk input dari luar (URL, QR): ID tak dikenal mengembalikan null,
     tidak jatuh ke anggota pertama seperti getMember */
  function findMember(id) {
    var targetId = String(id || '').trim();
    if (!targetId) return null;
    var st = safeRead();
    for (var i = 0; i < st.members.length; i++) {
      if (st.members[i].id === targetId) return st.members[i];
    }
    return null;
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

  /* Lapor jualan = absensi saja. Tidak mengubah tanggal lunas. */
  function reportSellingTonight(memberId) {
    var st = cloneState(safeRead());
    var id = String(memberId || st.activeMemberId || '0123');
    var m = st.members.find(function (x) { return x.id === id; });
    if (!m) return { ok: false, reason: 'not_found' };
    if (!isLunasAt(m, st.dayOffset)) return { ok: false, reason: 'not_lunas', member: m };
    if (m.reportedTonight) return { ok: true, already: true, member: m };

    var dateInfo = formatDateInfo(st.dayOffset);
    var timeWib = nowTimeWib();
    m.reportedTonight = true;
    m.history = m.history || [];
    m.history.unshift({
      id: 'h-' + Date.now(),
      date: dateInfo.short,
      type: 'lapor',
      title: 'Lapor jualan',
      sub: '',
      amount: null,
      nights: 0,
      time: timeWib
    });
    if (m.id === '0123') st.budiReportedTonight = true;
    safeWrite(st);
    return { ok: true, member: m, dateInfo: dateInfo };
  }

  /* Pratinjau: bayar N malam -> mulai dari malam pertama yang belum lunas (paling cepat malam ini) */
  function previewPaidUntil(nights, memberId) {
    var st = safeRead();
    var m = getMember(memberId || st.activeMemberId || '0123');
    var n = Math.max(1, Math.min(30, parseInt(nights, 10) || 1));
    var day = parseInt(st.dayOffset, 10) || 0;
    var start = (m && m.paidUntil !== null && m.paidUntil !== undefined && m.paidUntil >= day) ? m.paidUntil + 1 : day;
    var until = start + n - 1;
    return {
      nights: n,
      amount: n * TARIFF,
      startOffset: start,
      untilOffset: until,
      untilLabel: formatDayLong(until),
      rangeLabel: formatRange(start, until),
      lunasNow: isLunasAt(m, day),
      currentUntilLabel: m && m.paidUntil !== null && m.paidUntil !== undefined ? formatDayLong(m.paidUntil) : ''
    };
  }

  function confirmPayment(nights, memberId) {
    var st = cloneState(safeRead());
    var id = String(memberId || st.activeMemberId || '0123');
    var m = st.members.find(function (x) { return x.id === id; });
    if (!m) return null;

    var y = Math.max(1, Math.min(30, parseInt(nights, 10) || getPendingOrder().nights || 1));
    var day = parseInt(st.dayOffset, 10) || 0;
    var wasLunasTonight = isLunasAt(m, day);
    var start = (m.paidUntil !== null && m.paidUntil !== undefined && m.paidUntil >= day) ? m.paidUntil + 1 : day;
    var until = start + y - 1;
    var amount = y * TARIFF;
    var dateInfo = formatDateInfo(st.dayOffset);
    var timeWib = nowTimeWib();
    var ref = 'QRIS-' + dateInfo.refStamp + '-' + String(Math.floor(1000 + Math.random() * 9000));

    m.paidUntil = until;
    var autoOpenedTonight = !wasLunasTonight;
    if (autoOpenedTonight) {
      m.reportedTonight = true;
      if (m.id === '0123') st.budiReportedTonight = true;
    }
    m.noteFixed = false;
    m.history = m.history || [];
    m.history.unshift({
      id: 'h-' + Date.now(),
      date: dateInfo.short,
      type: 'bayar',
      title: 'Bayar ' + y + ' malam',
      sub: 'lunas ' + formatRange(start, until),
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
    if (m.id === '0123') st.budiPaidTonightDelta = (st.budiPaidTonightDelta || 0) + amount;

    deriveMember(m, day);
    st.lastPayment = {
      memberId: m.id,
      nights: y,
      amount: amount,
      startOffset: start,
      untilOffset: until,
      paidUntilLabel: formatDayLong(until),
      rangeLabel: formatRange(start, until),
      dateShort: dateInfo.short,
      dateFull: dateInfo.full,
      time: timeWib,
      ref: ref,
      tonightStatus: m.tonightStatus,
      autoOpenedTonight: autoOpenedTonight
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

  /* Token acak per tautan penjaga. Setiap kali dibagikan, token baru menggantikan yang lama.
     Tanpa server, token hanya bisa diperiksa di HP yang membuatnya; HP penjaga tidak bisa
     memeriksanya. Di produksi token disimpan dan dicabut di server. */
  function issuePenjagaToken(memberId) {
    var st = cloneState(safeRead());
    var id = String(memberId || st.activeMemberId || '0123');
    var m = st.members.find(function (x) { return x.id === id; });
    if (!m) return null;
    var token = '';
    try {
      var bytes = new Uint8Array(12);
      window.crypto.getRandomValues(bytes);
      for (var i = 0; i < bytes.length; i++) token += ('0' + bytes[i].toString(16)).slice(-2);
    } catch (e) {
      token = Date.now().toString(16) + Math.random().toString(16).slice(2, 10);
    }
    m.penjagaToken = token;
    safeWrite(st);
    return token;
  }

  /* 'ok' = boleh tampil, 'revoked' = HP ini tahu tautan sudah tidak berlaku,
     'unknown' = ID tidak dikenal. Tanpa token tercatat di HP ini, tautan dianggap berlaku. */
  function checkPenjagaLink(memberId, token) {
    var m = findMember(memberId);
    if (!m) return 'unknown';
    if (m.penjagaToken && (!m.penjagaActive || String(token || '') !== m.penjagaToken)) return 'revoked';
    return 'ok';
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

    /* Jika malam sebelumnya Budi tidak melapor, catat "Tidak lapor" */
    if (budi && !budi.reportedTonight) {
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

    /* Malam baru: absensi kembali kosong; tanggal lunas tidak berubah */
    st.members.forEach(function (m) {
      m.reportedTonight = false;
      m.noteFixed = false;
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
  /* v2: PAID = malam ini lunas (sudah atau belum lapor), UNPAID = belum lunas.
     NOREPORT dari QR lama tetap diterima dan dianggap lunas. */
  var QR_STATUS_KEY = { PAID: 'sudah_bayar', UNPAID: 'belum_bayar', NOREPORT: 'belum_lapor' };

  function buildIdentityQrPayload(memberId, nowMs) {
    var cleanId = String(memberId || '0123').trim();
    var base = 'APIMA:' + cleanId + ':' + getQrPeriod(nowMs);
    var member = findMember(cleanId);
    if (!member) return base;
    return base + ':' + (isLunasAt(member, safeRead().dayOffset) ? 'PAID' : 'UNPAID');
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
    /* Isi QR tidak ditandatangani, jadi siapa pun bisa membuatnya. Statusnya hanya dikembalikan
       untuk ditampilkan dan TIDAK PERNAH disimpan ke data pembayaran HP ini (paidUntil tetap). */
    var qrLunas = qrStatus === 'PAID' || qrStatus === 'NOREPORT';
    return { status: 'valid', memberId: memberId, member: member, period: period, qrStatus: qrStatus, qrLunas: qrStatus ? qrLunas : null };
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
  /* v2: hasil scan dihitung dari tanggal lunas. Lunas (sudah/belum lapor) = Sudah bayar. */
  function resultFromStatus(tonightStatus) {
    if (tonightStatus === 'sudah_bayar' || tonightStatus === 'belum_lapor') return { key: 'sesuai', label: 'Sesuai' };
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
  var testPanelMounted = false;
  function mountTestPanel() {
    var path = (window.location.pathname || '').split('/').pop() || '';
    var params = new URLSearchParams(window.location.search || '');
    var isPenjagaView = params.get('mode') === 'penjaga';
    if (
      testPanelMounted ||
      !path ||
      path === 'index.html' ||
      path === 'feedback.html' ||
      path === 'MasukId.dc.html' ||
      isPenjagaView ||
      document.getElementById('apima-test-fab') ||
      document.getElementById('apima-test-panel')
    ) {
      return;
    }
    testPanelMounted = true;

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'apima-test-fab';
    fab.className = 'test-mode-fab';
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'apima-test-panel');
    fab.setAttribute('aria-label', 'Buka panel Mode uji');
    fab.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
      '';
    fab.title = 'Mode uji';

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
      var statusLabel = budi.lunas ? ('Lunas sampai ' + budi.paidUntilLabel) : 'Malam ini belum bayar';
      var berandaViewHtml = '';
      if (typeof window.__apimaSetBerandaView === 'function') {
        var curView = typeof window.__apimaGetBerandaView === 'function' ? window.__apimaGetBerandaView() : 'normal';
        var viewOpts = [
          { id: 'normal', label: 'Normal' },
          { id: 'tutup', label: 'Tutup' },
          { id: 'kuota0', label: 'Belum Bayar' },
          { id: 'memuat', label: 'Memuat' },
          { id: 'nonaktif', label: 'Nonaktif' }
        ];
        berandaViewHtml =
          '<div class="stack gap-1">' +
            '<span class="text-xs fw-700 text-secondary">Simulasi tampilan Beranda</span>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
              viewOpts.map(function (o) {
                var active = curView === o.id;
                return '<button type="button" class="btn-chip' + (active ? ' test-chip-active' : '') + '" data-test-view="' + o.id + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + o.label + '</button>';
              }).join('') +
            '</div>' +
          '</div>';
      }
      panel.innerHTML =
        '<div class="row between items-center gap-2">' +
          '<div class="stack">' +
            '<span class="text-sm fw-700 text-main">Mode uji prototype</span>' +
            '<span class="text-xs text-secondary tnum">' + dInfo.short + ' · ' + statusLabel + (budi.reportedTonight ? ' · Sudah lapor' : '') + '</span>' +
          '</div>' +
          '<button type="button" class="btn-icon" data-test-close aria-label="Sembunyikan panel Mode uji">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        berandaViewHtml +
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

      panel.querySelectorAll('[data-test-view]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (typeof window.__apimaSetBerandaView === 'function') {
            window.__apimaSetBerandaView(btn.dataset.testView);
          }
          panel.hidden = true;
          fab.setAttribute('aria-expanded', 'false');
        });
      });

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
        resetState('baru');
        renderPanelBody();
        if (window.apimaToast) {
          window.apimaToast('Data uji dikembalikan ke awal (Lapak belum buka).');
        }
        window.location.reload();
      });
    }

    /* Ikon kecil di deretan ikon header (sebelum tombol tema) supaya tidak menutupi teks atau tombol */
    var placed = false;
    function placeFab(tries) {
      if (placed) return;
      var anchor = document.querySelector('[data-theme-toggle]');
      var header = document.querySelector('.screen header, .adm-topbar, header');
      fab.style.cssText = 'position:static;width:32px;height:32px;min-height:0;padding:0;margin:0;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0.6;background:transparent;border:1px dashed currentColor;color:var(--apima-text-secondary);box-shadow:none;gap:0;';
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(fab, anchor);
        placed = true;
      } else if (header) {
        header.appendChild(fab);
        placed = true;
      } else if (tries < 10) {
        setTimeout(function () { placeFab(tries + 1); }, 120);
        return;
      } else {
        fab.style.cssText += 'position:fixed;top:4px;right:4px;z-index:60;';
        document.body.appendChild(fab);
        placed = true;
      }
    }
    function positionFab() {
      var r = fab.getBoundingClientRect();
      panel.style.position = 'fixed';
      panel.style.top = Math.round(r.bottom + 8) + 'px';
      panel.style.right = '8px';
      panel.style.left = 'auto';
      panel.style.bottom = 'auto';
    }

    fab.addEventListener('click', function () {
      var willOpen = panel.hidden;
      if (willOpen) { renderPanelBody(); positionFab(); }
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
    placeFab(0);
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
    findMember: findMember,
    issuePenjagaToken: issuePenjagaToken,
    checkPenjagaLink: checkPenjagaLink,
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
    updateLastInspection: updateLastInspection,
    previewPaidUntil: previewPaidUntil,
    formatDayLong: formatDayLong,
    formatRange: formatRange,
    isLunas: function (m) { return isLunasAt(m || getActiveMember(), safeRead().dayOffset); }
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
