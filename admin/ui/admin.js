/* Panel admin, inti: API, state, pembantu DOM, tab utama */
(function () {
  'use strict';

  /* =============== pembantu DOM =============== */
  function el(tag, props) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) add(node, arguments[i]);
    return node;
  }
  function add(parent, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { add(parent, c); }); return; }
    parent.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* =============== API =============== */
  async function api(path, opts) {
    var res = await fetch(path, opts);
    var data = null;
    try { data = await res.json(); } catch (e) { data = { error: 'Respons tidak valid' }; }
    if (!res.ok) throw new Error(data && data.error ? data.error : 'Gagal (' + res.status + ')');
    return data;
  }

  function toast(msg, kind) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (kind === 'err' ? ' err' : '');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.className = 'toast'; }, 3400);
  }

  /* =============== STATE =============== */
  var APP = window.APP = {
    data: {},
    dirty: {},
    media: [],
    info: null,
    el: el,
    $: $,
    $$: $$,
    api: api,
    toast: toast,
    clear: clear,
    tab: 'home',
    pages: {},
  };

  function refreshStatus() {
    var dirty = Object.keys(APP.dirty).filter(function (k) { return APP.dirty[k]; });
    var line = $('#statusLine');
    if (!line) return;
    line.textContent = dirty.length ? 'Belum disimpan: ' + dirty.join(', ') : 'Semua tersimpan';
    line.className = 'save-state' + (dirty.length ? ' dirty' : '');
    $$('.side-link').forEach(function (b) {
      var f = b.getAttribute('data-file');
      var dot = b.querySelector('.unsaved');
      if (!f) return;
      if (APP.dirty[f] && !dot) b.appendChild(el('span', { class: 'unsaved', text: ' •' }));
      if (!APP.dirty[f] && dot) dot.remove();
    });
  }
  APP.refreshStatus = refreshStatus;

  async function load(file) {
    APP.data[file] = await api('/api/content?file=' + encodeURIComponent(file));
    return APP.data[file];
  }
  APP.load = load;

  async function save(file) {
    var r = await api('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: file, data: APP.data[file] }),
    });
    APP.dirty[file] = false;
    toast(file + '.json tersimpan' + (r.sync ? ', menyinkronkan…' : ''), 'ok');
    refreshStatus();
    if (r.sync) APP.refreshSync();
  }
  APP.save = save;

  /* =============== SINKRONISASI OTOMATIS =============== */
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function jam(iso) {
    try {
      var d = new Date(iso);
      return pad(d.getHours()) + '.' + pad(d.getMinutes());
    } catch (e) { return ''; }
  }

  function setSync(text, state, full) {
    var box = $('#syncLine'), t = $('#syncText');
    if (!box) return;
    if (t) t.textContent = text;
    box.setAttribute('data-state', state || 'idle');
    box.title = full || text;
  }
  APP.setSync = setSync;

  var syncTimer = null;
  async function refreshSync() {
    var s;
    try { s = await api('/api/status'); } catch (e) { setSync('Status tak terjangkau', 'err'); return; }
    APP.status = s;

    if (s.building || s.waiting) setSync('Menyinkronkan situs…', 'busy');
    else if (s.lastBuild && s.lastBuild.ok === false) setSync('Build terakhir gagal', 'err');
    else if (s.lastBuild && s.lastBuild.at) {
      var lengkap;
      try {
        lengkap = new Date(s.lastBuild.at).toLocaleString('id-ID',
          { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) { lengkap = s.lastBuild.at; }
      setSync('Tersinkron ' + jam(s.lastBuild.at), 'ok', 'Sinkron terakhir: ' + lengkap +
        ' · ' + (s.lastBuild.reason || 'build'));
    }
    else setSync(s.dist && s.dist.ok ? 'Siap, tersinkron' : 'Belum pernah dibangun', s.dist && s.dist.ok ? 'ok' : 'idle');

    if (typeof APP.paintStatus === 'function') APP.paintStatus(s);
  }
  APP.refreshSync = refreshSync;

  APP.startSyncWatch = function (intervalMs) {
    if (syncTimer) clearInterval(syncTimer);
    refreshSync();
    syncTimer = setInterval(refreshSync, intervalMs || 3000);
  };

  async function loadMedia() {
    var out = await api('/api/media');
    APP.media = out.items || [];
    return APP.media;
  }
  APP.loadMedia = loadMedia;

  /* =============== JALUR DATA =============== */
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o === undefined || o === null) ? o : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) { return o[k]; }, obj);
    target[last] = val;
  }

  /* Halaman menulis path lengkap berawalan nama file, mis. "site.name",
     padahal APP.data[file] sudah berisi isi file itu. Pangkas satu kali
     awalan itu supaya membaca dan menulis ke tempat yang benar. */
  function relPath(file, path) {
    var pre = file + '.';
    return path.indexOf(pre) === 0 ? path.slice(pre.length) : path;
  }
  function readVal(file, path) { return getPath(APP.data[file], relPath(file, path)); }
  function writeVal(file, path, val) { setPath(APP.data[file], relPath(file, path), val); }

  /* =============== PEMBANTU FORMULIR =============== */
  function textInput(path, label, opts) {
    opts = opts || {};
    var file = opts.file || APP.tabFile;
    var raw = readVal(file, path);
    var val = raw === undefined || raw === null ? '' : raw;

    var field = el('div', { class: 'field' }, el('label', { text: label }));
    var handler = function (e) {
      writeVal(file, path, e.target.value);
      APP.dirty[file] = true;
      refreshStatus();
    };

    field.appendChild(el(opts.multiline ? 'textarea' : 'input', opts.multiline
      ? { rows: opts.rows || 3, text: val, placeholder: opts.placeholder || '', oninput: handler }
      : { type: opts.type || 'text', value: val, placeholder: opts.placeholder || '', oninput: handler }
    ));

    if (opts.hint) field.appendChild(el('p', { class: 'hint', text: opts.hint }));
    return field;
  }
  APP.input = textInput;

  function bilingual(basePath, label, opts) {
    opts = opts || {};
    var file = opts.file || APP.tabFile;
    var wrap = el('div', { class: 'field' }, el('label', { text: label }));
    var locs = el('div', { class: 'loc' });

    ['id', 'en'].forEach(function (lang) {
      var raw = readVal(file, basePath + '.' + lang);
      var val = raw === undefined || raw === null ? '' : raw;
      var handler = function (e) {
        writeVal(file, basePath + '.' + lang, e.target.value);
        APP.dirty[file] = true;
        refreshStatus();
      };
      var ctl = el(opts.multiline ? 'textarea' : 'input', opts.multiline
        ? { rows: opts.rows || 2, text: val, oninput: handler }
        : { type: 'text', value: val, oninput: handler }
      );
      locs.appendChild(el('div', { class: 'loc-box', 'data-lang': lang.toUpperCase() }, ctl));
    });

    wrap.appendChild(locs);
    return wrap;
  }
  APP.bilingual = bilingual;

  function bilingualList(basePath, label, opts) {
    opts = opts || {};
    var file = opts.file || APP.tabFile;
    var wrap = el('div', { class: 'field' }, el('label', { text: label }));
    ['id', 'en'].forEach(function (lang) {
      var arr = readVal(file, basePath + '.' + lang) || [];
      var box = el('div', { class: 'loc-box', 'data-lang': lang.toUpperCase() });
      var ta = el('textarea', { rows: Math.max(3, arr.length) });
      ta.value = arr.join('\n');
      ta.addEventListener('input', function () {
        writeVal(file, basePath + '.' + lang, ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean));
        APP.dirty[file] = true;
        refreshStatus();
      });
      box.appendChild(ta);
      wrap.appendChild(box);
    });
    return wrap;
  }
  APP.bilingualList = bilingualList;

  function stringList(basePath, label, opts) {
    opts = opts || {};
    var file = opts.file || APP.tabFile;
    var wrap = el('div', { class: 'field' }, el('label', { text: label }));
    var chips = el('div', { class: 'chips' });
    var input = el('input', { type: 'text', placeholder: 'Tambah item, lalu Enter' });

    function paint() {
      APP.clear(chips);
      (readVal(file, basePath) || []).forEach(function (item, i) {
        chips.appendChild(el('span', { class: 'chip' }, item,
          el('button', {
            type: 'button', 'aria-label': 'Hapus', text: '×',
            onclick: function () {
              var arr = readVal(file, basePath);
              arr.splice(i, 1);
              APP.dirty[file] = true; refreshStatus(); paint();
            },
          })
        ));
      });
    }
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      var arr = readVal(file, basePath);
      if (!Array.isArray(arr)) { writeVal(file, basePath, []); arr = readVal(file, basePath); }
      arr.push(v);
      input.value = '';
      APP.dirty[file] = true; refreshStatus(); paint();
    });
    paint();
    wrap.appendChild(chips);
    wrap.appendChild(input);
    return wrap;
  }
  APP.stringList = stringList;

  function card(title, body, tools) {
    var head = el('div', { class: 'card-head' }, el('div', { class: 'card-title', text: title }));
    if (tools) head.appendChild(el('div', { class: 'card-tools' }, tools));
    var c = el('div', { class: 'card' }, head);
    add(c, body);
    return c;
  }
  APP.card = card;

  function headBlock(title, sub, file) {
    return el('div', { class: 'head-row' },
      el('div', null, el('h1', { class: 'ph', text: title }), el('p', { class: 'ph-sub', text: sub })),
      file ? el('button', {
        class: 'btn', type: 'button', text: 'Simpan perubahan',
        onclick: function (e) {
          var b = e.currentTarget;
          b.disabled = true; b.textContent = 'Menyimpan…';
          save(file).then(function () { b.disabled = false; b.textContent = 'Simpan perubahan'; },
            function (err) { b.disabled = false; b.textContent = 'Simpan perubahan'; toast('Gagal: ' + err.message, 'err'); });
        },
      }) : null
    );
  }
  APP.head = headBlock;

  function orderTools(list, file) {
    return [
      el('button', {
        class: 'icon-btn', type: 'button', text: '↑', title: 'Naikkan',
        onclick: function (i) { return function () { var t = list[i - 1]; list[i - 1] = list[i]; list[i] = t; APP.dirty[file] = true; refreshStatus(); APP.render(); }; }(),
      }),
    ];
  }

  window.__helpers = { el: el, add: add, clear: clear, getPath: getPath, setPath: setPath, card: card, headBlock: headBlock, orderTools: orderTools };
})();
