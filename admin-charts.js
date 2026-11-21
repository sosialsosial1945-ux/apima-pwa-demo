/* ======================================
   APIMA Vision Charts v1.0
   Grafik SVG eksekutif (Area + Kolom + Kurva Tren + Garis Rata-rata + Donut)
   Zero dependency, responsif, mendukung mode Terang & Gelap FunDS
   ====================================== */
(function () {
  'use strict';

  var uidCounter = 0;

  function formatIdNum(num, decimals) {
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatTick(val, unit) {
    if (val === 0) return 'Rp0';
    if (unit === 'rb') return 'Rp' + Math.round(val) + ' rb';
    var dec = val < 10 ? 1 : 0;
    return 'Rp' + formatIdNum(val, dec) + ' jt';
  }

  function formatValue(val, unit) {
    if (unit === 'rb') return 'Rp' + Math.round(val) + ' rb';
    var dec = val < 10 ? 2 : 1;
    return 'Rp' + formatIdNum(val, dec) + ' jt';
  }

  /* Kurva halus Catmull-Rom -> Cubic Bezier */
  function smoothPath(pts) {
    if (!pts.length) return '';
    if (pts.length === 1) return 'M ' + pts[0].x + ' ' + pts[0].y;
    var d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + cp1x.toFixed(1) + ' ' + cp1y.toFixed(1) + ', ' +
        cp2x.toFixed(1) + ' ' + cp2y.toFixed(1) + ', ' +
        p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }

  function renderComboChart(hostEl, cfg) {
    if (!hostEl || !cfg || !cfg.bars || !cfg.bars.length) return;
    uidCounter++;
    var uid = 'vc' + uidCounter;
    var bars = cfg.bars;
    var unit = cfg.unit || 'jt';

    var W = 640;
    var H = 256;
    var padL = 62;
    var padR = 20;
    var padT = 34;
    var padB = 34;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;

    var vals = bars.map(function (b) { return b.val; });
    var rawMax = Math.max.apply(null, vals);
    var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;

    /* Skala Y yang rapi dengan ruang lega di atas puncak */
    var yMax = rawMax * 1.18;
    if (unit === 'rb') {
      yMax = Math.ceil(yMax / 100) * 100;
    } else if (yMax <= 2.5) {
      yMax = Math.ceil(yMax * 5) / 5;
    } else if (yMax <= 15) {
      yMax = Math.ceil(yMax / 3) * 3;
    } else {
      yMax = Math.ceil(yMax / 15) * 15;
    }

    var n = bars.length;
    var step = plotW / n;
    var barW = Math.min(34, Math.max(14, step * 0.44));

    var pts = bars.map(function (b, idx) {
      var cx = padL + step * idx + step / 2;
      var cy = padT + plotH - (b.val / yMax) * plotH;
      return { x: cx, y: cy, data: b, idx: idx };
    });

    var peakPt = pts[0];
    pts.forEach(function (p) {
      if (p.data.peak || p.data.val > peakPt.data.val) peakPt = p;
    });

    var avgY = padT + plotH - (avg / yMax) * plotH;
    var lineD = smoothPath(pts);
    var areaD = lineD +
      ' L ' + pts[pts.length - 1].x.toFixed(1) + ' ' + (padT + plotH) +
      ' L ' + pts[0].x.toFixed(1) + ' ' + (padT + plotH) + ' Z';

    /* Gridlines Y (4 tingkat) */
    var gridHtml = '';
    for (var g = 0; g <= 3; g++) {
      var frac = g / 3;
      var gy = padT + plotH - frac * plotH;
      var tickVal = yMax * frac;
      gridHtml += '<line class="vc-grid" x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '"/>';
      gridHtml += '<text class="vc-axis-y" x="' + (padL - 10) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end">' + formatTick(tickVal, unit) + '</text>';
    }

    /* Kolom latar lembut + target hover */
    var colsHtml = '';
    var dotsHtml = '';
    var labelsHtml = '';
    var hitsHtml = '';

    pts.forEach(function (p) {
      var bx = p.x - barW / 2;
      var bh = Math.max(4, (padT + plotH) - p.y);
      var isPeak = p === peakPt;
      colsHtml += '<rect class="vc-bar' + (isPeak ? ' is-peak' : '') + '" data-vc-bar="' + p.idx + '" x="' + bx.toFixed(1) + '" y="' + p.y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="6" fill="url(#' + uid + (isPeak ? '-bar-peak' : '-bar') + ')"/>';

      if (isPeak) {
        dotsHtml += '<circle class="vc-halo" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="10"/>';
      }
      dotsHtml += '<circle class="vc-dot' + (isPeak ? ' is-peak' : '') + '" data-vc-dot="' + p.idx + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (isPeak ? '5' : '3.8') + '"/>';

      labelsHtml += '<text class="vc-axis-x' + (isPeak ? ' is-peak' : '') + '" data-vc-lbl="' + p.idx + '" x="' + p.x.toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle">' + p.data.label + '</text>';

      var hitX = padL + step * p.idx;
      hitsHtml += '<rect class="vc-hit" data-vc-hit="' + p.idx + '" x="' + hitX.toFixed(1) + '" y="' + padT + '" width="' + step.toFixed(1) + '" height="' + plotH + '" fill="transparent"/>';
    });

    /* Callout badge di atas titik puncak */
    var badgeText = formatValue(peakPt.data.val, unit);
    var badgeW = Math.max(76, badgeText.length * 7.2 + 18);
    var badgeX = Math.min(W - padR - badgeW, Math.max(padL, peakPt.x - badgeW / 2));
    var badgeY = Math.max(4, peakPt.y - 30);

    var peakBadgeHtml =
      '<g class="vc-peak-badge">' +
        '<rect x="' + badgeX.toFixed(1) + '" y="' + badgeY.toFixed(1) + '" width="' + badgeW.toFixed(1) + '" height="22" rx="11"/>' +
        '<text x="' + (badgeX + badgeW / 2).toFixed(1) + '" y="' + (badgeY + 14.5).toFixed(1) + '" text-anchor="middle">' + badgeText + '</text>' +
      '</g>';

    /* Garis referensi Rata-rata */
    var avgLineHtml =
      '<g class="vc-avg">' +
        '<line x1="' + padL + '" y1="' + avgY.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + avgY.toFixed(1) + '"/>' +
        '<rect x="' + (W - padR - 92) + '" y="' + (avgY - 19).toFixed(1) + '" width="92" height="17" rx="8.5"/>' +
        '<text x="' + (W - padR - 46) + '" y="' + (avgY - 7.5).toFixed(1) + '" text-anchor="middle">Rata-rata</text>' +
      '</g>';

    var svg =
      '<div class="vc-wrap">' +
        '<div class="vc-legend-row">' +
          '<div class="vc-legend-items">' +
            '<span class="vc-legend-item"><span class="vc-swatch vc-swatch-line"></span>Tren setoran</span>' +
            '<span class="vc-legend-item"><span class="vc-swatch vc-swatch-peak"></span>Puncak capaian</span>' +
            '<span class="vc-legend-item"><span class="vc-swatch vc-swatch-avg"></span>Rata-rata (' + formatValue(avg, unit) + ')</span>' +
          '</div>' +
          '<span class="vc-live-pill tnum" data-vc-live>' + peakPt.data.label + ' \u00b7 ' + formatValue(peakPt.data.val, unit) + '</span>' +
        '</div>' +
        '<svg class="vc-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (cfg.ariaLabel || 'Grafik tren setoran retribusi APIMA') + '">' +
          '<defs>' +
            '<linearGradient id="' + uid + '-area" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="var(--vc-line)" stop-opacity="0.22"/>' +
              '<stop offset="100%" stop-color="var(--vc-line)" stop-opacity="0.01"/>' +
            '</linearGradient>' +
            '<linearGradient id="' + uid + '-bar" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="var(--vc-bar-top)" stop-opacity="0.55"/>' +
              '<stop offset="100%" stop-color="var(--vc-bar-bot)" stop-opacity="0.12"/>' +
            '</linearGradient>' +
            '<linearGradient id="' + uid + '-bar-peak" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="var(--vc-peak)" stop-opacity="0.88"/>' +
              '<stop offset="100%" stop-color="var(--vc-peak)" stop-opacity="0.24"/>' +
            '</linearGradient>' +
          '</defs>' +
          gridHtml +
          '<path class="vc-area" d="' + areaD + '" fill="url(#' + uid + '-area)"/>' +
          colsHtml +
          avgLineHtml +
          '<line class="vc-crosshair" data-vc-crosshair x1="' + peakPt.x.toFixed(1) + '" y1="' + padT + '" x2="' + peakPt.x.toFixed(1) + '" y2="' + (padT + plotH) + '" opacity="0"/>' +
          '<path class="vc-line" d="' + lineD + '"/>' +
          dotsHtml +
          peakBadgeHtml +
          labelsHtml +
          hitsHtml +
        '</svg>' +
        '<div class="vc-footer-strip">' +
          '<div class="vc-foot-item"><span class="vc-foot-lbl">Rata-rata periode</span><span class="vc-foot-val tnum">' + formatValue(avg, unit) + '</span></div>' +
          '<div class="vc-foot-item"><span class="vc-foot-lbl">Puncak tertinggi</span><span class="vc-foot-val tnum text-primary-color">' + peakPt.data.label + ' \u00b7 ' + formatValue(peakPt.data.val, unit) + '</span></div>' +
          '<div class="vc-foot-item"><span class="vc-foot-lbl">Selisih dari rata-rata</span><span class="vc-foot-val tnum text-success">+' + formatIdNum(((peakPt.data.val - avg) / avg) * 100, 1) + '%</span></div>' +
        '</div>' +
      '</div>';

    hostEl.innerHTML = svg;

    /* Interaksi hover / klik untuk inspeksi nilai per titik */
    var livePill = hostEl.querySelector('[data-vc-live]');
    var crosshair = hostEl.querySelector('[data-vc-crosshair]');
    var barNodes = hostEl.querySelectorAll('[data-vc-bar]');
    var dotNodes = hostEl.querySelectorAll('[data-vc-dot]');
    var lblNodes = hostEl.querySelectorAll('[data-vc-lbl]');

    function highlight(idx) {
      var p = pts[idx];
      if (!p) return;
      barNodes.forEach(function (n, i) { n.classList.toggle('is-active', i === idx); });
      dotNodes.forEach(function (n, i) { n.classList.toggle('is-active', i === idx); });
      lblNodes.forEach(function (n, i) { n.classList.toggle('is-active', i === idx); });
      if (crosshair) {
        crosshair.setAttribute('x1', p.x.toFixed(1));
        crosshair.setAttribute('x2', p.x.toFixed(1));
        crosshair.setAttribute('opacity', '1');
      }
      if (livePill) {
        var pct = ((p.data.val - avg) / avg) * 100;
        var sign = pct >= 0 ? '+' : '';
        livePill.textContent = p.data.label + ' \u00b7 ' + formatValue(p.data.val, unit) + ' (' + sign + formatIdNum(pct, 1) + '%)';
      }
    }

    function clearHighlight() {
      barNodes.forEach(function (n) { n.classList.remove('is-active'); });
      dotNodes.forEach(function (n) { n.classList.remove('is-active'); });
      lblNodes.forEach(function (n) { n.classList.remove('is-active'); });
      if (crosshair) crosshair.setAttribute('opacity', '0');
      if (livePill) livePill.textContent = peakPt.data.label + ' \u00b7 ' + formatValue(peakPt.data.val, unit);
    }

    hostEl.querySelectorAll('[data-vc-hit]').forEach(function (hit) {
      var idx = parseInt(hit.dataset.vcHit, 10);
      hit.addEventListener('mouseenter', function () { highlight(idx); });
      hit.addEventListener('click', function () { highlight(idx); });
    });
    var svgEl = hostEl.querySelector('.vc-svg');
    if (svgEl) svgEl.addEventListener('mouseleave', clearHighlight);
  }

  function renderDonutChart(hostEl, cfg) {
    if (!hostEl || !cfg || !cfg.segments || !cfg.segments.length) return;
    var r = 64;
    var cx = 84;
    var cy = 84;
    var circ = 2 * Math.PI * r;
    var total = cfg.segments.reduce(function (acc, s) { return acc + s.pct; }, 0) || 100;
    var offset = 0;

    var arcs = cfg.segments.map(function (s) {
      var len = (s.pct / total) * circ;
      var dash = Math.max(0, len - 3);
      var seg = '<circle class="vd-arc" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" stroke-dashoffset="' + (-offset).toFixed(1) + '"/>';
      offset += len;
      return seg;
    }).join('');

    var legend = cfg.segments.map(function (s) {
      return '<div class="vd-leg-row">' +
        '<div class="row gap-2 items-center"><span class="vd-dot" style="background:' + s.color + '"></span><span class="text-sm fw-700 text-main">' + s.label + '</span></div>' +
        '<div class="row gap-2 items-center"><span class="text-xs text-secondary tnum">' + s.sub + '</span><span class="text-sm fw-700 tnum text-main">' + s.pct + '%</span></div>' +
      '</div>';
    }).join('');

    hostEl.innerHTML =
      '<div class="vd-wrap">' +
        '<div class="vd-ring-box">' +
          '<svg class="vd-svg" viewBox="0 0 168 168" role="img" aria-label="' + (cfg.ariaLabel || 'Diagram komposisi paket retribusi') + '">' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--apima-meter-track)" stroke-width="18"/>' +
            '<g transform="rotate(-90 ' + cx + ' ' + cy + ')">' + arcs + '</g>' +
          '</svg>' +
          '<div class="vd-center">' +
            '<span class="vd-center-val tnum">' + cfg.centerVal + '</span>' +
            '<span class="vd-center-lbl">' + cfg.centerLbl + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="vd-legend">' + legend + '</div>' +
      '</div>';
  }

  function renderMiniSparkbars(hostEl, bars) {
    if (!hostEl || !bars || !bars.length) return;
    var vals = bars.map(function (b) { return b.val; });
    var maxVal = Math.max.apply(null, vals) || 1;
    var W = 92;
    var H = 40;
    var gap = 4;
    var n = bars.length;
    var bw = Math.max(4, (W - gap * (n - 1)) / n);
    var rects = bars.map(function (b, i) {
      var h = Math.max(6, Math.round((b.val / maxVal) * (H - 4)));
      var x = i * (bw + gap);
      var y = H - h;
      var cls = b.peak ? 'ms-bar is-peak' : 'ms-bar';
      return '<rect class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h + '" rx="3"/>';
    }).join('');
    hostEl.innerHTML = '<svg class="ms-svg" viewBox="0 0 ' + W + ' ' + H + '" width="92" height="40" aria-hidden="true">' + rects + '</svg>';
  }

  function renderMiniDonut(hostEl, cfg) {
    if (!hostEl || !cfg || !cfg.segments || !cfg.segments.length) return;
    var r = 34;
    var cx = 44;
    var cy = 44;
    var circ = 2 * Math.PI * r;
    var total = cfg.segments.reduce(function (acc, s) { return acc + s.val; }, 0) || 1;
    var offset = 0;
    var arcs = cfg.segments.map(function (s) {
      var len = (s.val / total) * circ;
      var dash = Math.max(0, len - 2.2);
      var seg = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" stroke-dashoffset="' + (-offset).toFixed(1) + '"/>';
      offset += len;
      return seg;
    }).join('');
    hostEl.innerHTML =
      '<div class="md-ring-box">' +
        '<svg class="md-svg" viewBox="0 0 88 88" width="88" height="88" role="img" aria-label="' + (cfg.ariaLabel || 'Tingkat kepatuhan bayar') + '">' +
          '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--apima-meter-track)" stroke-width="10"/>' +
          '<g transform="rotate(-90 ' + cx + ' ' + cy + ')">' + arcs + '</g>' +
        '</svg>' +
        '<div class="md-center">' +
          '<span class="md-val tnum" id="exec-rate">' + cfg.centerVal + '</span>' +
          '<span class="md-lbl">' + (cfg.centerLbl || 'patuh') + '</span>' +
        '</div>' +
      '</div>';
  }

  window.APIMA_CHARTS = {
    renderComboChart: renderComboChart,
    renderDonutChart: renderDonutChart,
    renderMiniSparkbars: renderMiniSparkbars,
    renderMiniDonut: renderMiniDonut
  };
})();
