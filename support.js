// support.js — stub agar .dc.html bisa dibuka langsung di browser.
//
// Bug yang diperbaiki: connectedCallback pada x-dc terpanggil saat opening tag,
// sebelum anak-anak elemen selesai di-parse. Akibatnya konten hilang.
// Solusi dua lapis:
//   1. Injeksi CSS → x-dc {display:contents} agar konten langsung terlihat
//      meski JS belum selesai; helmet {display:none} sembunyikan wrapper.
//   2. setTimeout(0) agar DOM parsing selesai sebelum kita pindahkan node.

(function () {
  // Sinkronisasi tema sejak dini (default: Terang Bersih Maritim; opsional: Gelap)
  function applyTheme(t) {
    const mode = t === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = mode;
  }
  try {
    applyTheme(localStorage.getItem('apima-theme') || 'light');
  } catch (e) {
    applyTheme('light');
  }
  window.addEventListener('storage', function (e) {
    if (e.key === 'apima-theme') applyTheme(e.newValue);
  });
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'apima-theme') applyTheme(e.data.theme);
  });

  // Lapis 1: CSS fallback agar konten terlihat sebelum JS berjalan
  const s = document.createElement('style');
  s.textContent = 'x-dc{display:contents}helmet{display:none}sc-for{display:none}';
  document.head.appendChild(s);

  class XDC extends HTMLElement {
    connectedCallback() {
      // Lapis 2: defer ke macrotask berikutnya agar parser selesai
      setTimeout(() => {
        if (!this.isConnected) return;
        const helmet = this.querySelector('helmet');
        if (helmet) {
          Array.from(helmet.childNodes).forEach(n => {
            // Script tags must be re-created — cloneNode does not execute scripts
            if (n.nodeName === 'SCRIPT') {
              const s = document.createElement('script');
              Array.from(n.attributes).forEach(a => s.setAttribute(a.name, a.value));
              if (n.textContent) s.textContent = n.textContent;
              document.head.appendChild(s);
            } else {
              document.head.appendChild(n.cloneNode(true));
            }
          });
          helmet.remove();
        }
        const parent = this.parentNode;
        if (!parent) return;
        while (this.firstChild) parent.insertBefore(this.firstChild, this);
        parent.removeChild(this);
        expandLoops();
        window.__apimaDomReady = true;
        window.dispatchEvent(new CustomEvent('apima:ready'));
      }, 0);
    }
  }

  // Ambil data contoh dari skrip layar (<script type="text/x-dc">).
  // Tanpa ini daftar anggota di layar satgas selalu kosong, padahal itu
  // layar inti alur satgas dan harus bisa diperiksa di browser biasa.
  function readVals() {
    const el = document.querySelector('script[type="text/x-dc"]');
    if (!el) return {};
    try {
      const src = el.textContent.replace(/extends\s+DCLogic/, '');
      return new Function(src + '; return new Component().renderVals();')() || {};
    } catch (e) {
      console.warn('support.js: renderVals() tidak terbaca —', e.message);
      return {};
    }
  }

  function dig(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  // Bentangkan <sc-for list="{{rows}}" as="row"> menjadi baris sungguhan.
  function expandLoops() {
    const vals = readVals();
    document.querySelectorAll('sc-for').forEach(node => {
      const m = (node.getAttribute('list') || '').match(/\{\{\s*([\w.]+)\s*\}\}/);
      const items = m ? dig(vals, m[1]) : null;
      if (!Array.isArray(items) || !items.length) return;  // biarkan tersembunyi
      const alias = node.getAttribute('as') || 'item';
      const tpl = node.innerHTML;
      const html = items.map(item =>
        tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, path) => {
          const parts = path.split('.');
          if (parts[0] !== alias) return whole;
          const v = dig(item, parts.slice(1).join('.'));
          return v == null ? '' : String(v);
        })
      ).join('');
      // <template> supaya <li> dan <tr> tetap sah saat diurai
      const t = document.createElement('template');
      t.innerHTML = html;
      node.parentNode.insertBefore(t.content, node);
      node.remove();
    });
  }

  if (!customElements.get('x-dc')) customElements.define('x-dc', XDC);
  if (!customElements.get('sc-for')) {
    customElements.define('sc-for', class extends HTMLElement {});
  }
})();
