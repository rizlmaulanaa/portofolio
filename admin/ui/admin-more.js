/* Panel admin, kredensial, apresiasi, tulisan, galeri, media, JSON mentah, boot */
(function () {
  'use strict';
  var A = window.APP;
  var el = A.el, H = window.__helpers;
  var fileHead = H.headBlock;

  /** URL gambar di panel. Ikuti BASE_PATH pada astro.config.mjs: kosong saat
      situs disajikan di root domain, atau '/portofolio' bila beralih ke sub-path. */
  var BASE_PATH = '';
  function mediaUrl(name) { return BASE_PATH + '/media/' + String(name).replace(/^\/+/, ''); }

  function removeTool(list, file) {
    return function (i) {
      return el('button', {
        class: 'icon-btn', type: 'button', text: '✕', title: 'Hapus',
        onclick: function () {
          if (!confirm('Hapus entri ini?')) return;
          list.splice(i, 1);
          A.dirty[file] = true; A.refreshStatus(); A.render();
        },
      });
    };
  }

  /* =============== PEMILIH GAMBAR SAMPUL =============== */
  A.imagePicker = function (obj, key, dirtyKey) {
    var field = el('div', { class: 'field' }, el('label', { text: 'Gambar sampul' }));
    var sel = el('select', {
      onchange: function (e) { obj[key] = e.target.value; A.dirty[dirtyKey] = true; A.refreshStatus(); },
    });
    sel.appendChild(el('option', { value: '', text: 'otomatis (gambar seni)' }));
    (A.media || []).forEach(function (m) {
      var o = el('option', { value: m.name, text: m.name });
      if (obj[key] === m.name) o.selected = true;
      sel.appendChild(o);
    });
    field.appendChild(sel);
    field.appendChild(el('p', { class: 'hint', text: 'Kosong = situs memakai gradien gradien abstrak bawaan.' }));
    return field;
  };

  /* =============== KREDENSIAL =============== */
  A.pages.credentials = function () {
    var d = A.data.credentials || {};
    var box = el('div', null, fileHead('Kredensial',
      'Pendidikan, sertifikasi yang sudah terbit, dan yang masih menunggu tanggal.', 'credentials'));

    /* pendidikan */
    var edu = d.education || [];
    var eduBox = el('div', { class: 'stack' });
    edu.forEach(function (e, i) {
      eduBox.appendChild(el('div', { class: 'row-2' },
        A.bilingual('credentials.education.' + i + '.degree', 'Jenjang / gelar'),
        A.input('credentials.education.' + i + '.institution', 'Institusi', { file: 'credentials' })
      ));
      eduBox.appendChild(el('div', { class: 'row-2' },
        A.bilingual('credentials.education.' + i + '.period', 'Periode'),
        A.input('credentials.education.' + i + '.status', 'Status', { file: 'credentials', hint: 'Contoh: Berjalan / Selesai' })
      ));
    });
    eduBox.appendChild(el('button', {
      class: 'btn btn-sm btn-ghost', type: 'button', text: '+ Tambah pendidikan',
      onclick: function () {
        edu.push({ degree: { id: '', en: '' }, institution: '', period: { id: '', en: '' }, status: '' });
        A.dirty.credentials = true; A.refreshStatus(); A.render();
      },
    }));
    box.appendChild(H.card('Pendidikan', eduBox));

    /* sertifikasi */
    var cert = d.credentials || [];
    var certBox = el('div', { class: 'stack' });
    cert.forEach(function (c, i) {
      certBox.appendChild(el('div', { class: 'grid-2' },
        A.input('credentials.credentials.' + i + '.name', 'Nama sertifikasi', { file: 'credentials' }),
        A.input('credentials.credentials.' + i + '.issuer', 'Penerbit', { file: 'credentials' })
      ));
      certBox.appendChild(el('div', { class: 'row-2' },
        A.bilingual('credentials.credentials.' + i + '.date', 'Tanggal'),
        A.input('credentials.credentials.' + i + '.group', 'Kelompok', { file: 'credentials' })
      ));
      certBox.appendChild(el('button', {
        class: 'btn btn-danger btn-sm', type: 'button', text: 'Hapus sertifikasi ini',
        onclick: function () { if (!confirm('Hapus?')) return; cert.splice(i, 1); A.dirty.credentials = true; A.refreshStatus(); A.render(); },
      }));
    });
    certBox.appendChild(el('button', {
      class: 'btn btn-sm btn-ghost', type: 'button', text: '+ Tambah sertifikasi',
      onclick: function () {
        cert.push({ name: '', issuer: '', date: { id: '', en: '' }, group: 'certification' });
        A.dirty.credentials = true; A.refreshStatus(); A.render();
      },
    }));
    box.appendChild(H.card('Sertifikasi profesional', certBox));

    /* menunggu */
    var pend = d.pending || [];
    var pBox = el('div', { class: 'stack' });
    pend.forEach(function (p, i) {
      pBox.appendChild(el('div', { class: 'grid-2' },
        A.input('credentials.pending.' + i + '.name', 'Nama', { file: 'credentials' }),
        A.input('credentials.pending.' + i + '.issuer', 'Penerbit', { file: 'credentials' })
      ));
      pBox.appendChild(el('button', {
        class: 'btn btn-danger btn-sm', type: 'button', text: 'Hapus dari daftar',
        onclick: function () { if (!confirm('Hapus?')) return; pend.splice(i, 1); A.dirty.credentials = true; A.refreshStatus(); A.render(); },
      }));
    });
    pBox.appendChild(el('button', {
      class: 'btn btn-sm btn-ghost', type: 'button', text: '+ Tambah (belum ada tanggal)',
      onclick: function () {
        pend.push({ name: '', issuer: '', group: 'certification' });
        A.dirty.credentials = true; A.refreshStatus(); A.render();
      },
    }));
    box.appendChild(H.card('Menunggu tanggal', pBox,
      el('p', { class: 'hint', text: 'Pindahkan ke Sertifikasi begitu tanggalnya pasti.' })));

    return box;
  };

  /* =============== APRESIASI =============== */
  A.pages.awards = function () {
    var d = A.data.awards || [];
    var box = el('div', null, fileHead('Apresiasi', 'Pengakuan resmi dari instansi atas laporan kerentanan.', 'awards'));
    d.forEach(function (a, i) {
      box.appendChild(H.card(a.org || ('Apresiasi #' + (i + 1)), el('div', { class: 'stack' },
        A.input('awards.' + i + '.org', 'Instansi'),
        el('div', { class: 'row-2' },
          A.bilingual('awards.' + i + '.title', 'Judul'),
          A.bilingual('awards.' + i + '.date', 'Tanggal')
        ),
        A.bilingual('awards.' + i + '.summary', 'Ringkasan temuan', { multiline: true, rows: 3 })
      ), [removeTool(d, 'awards')(i)]));
    });
    box.appendChild(el('button', {
      class: 'btn btn-ghost', type: 'button', text: '+ Tambah apresiasi',
      onclick: function () {
        d.push({ org: '', date: { id: '', en: '' }, title: { id: '', en: '' }, summary: { id: '', en: '' }, accent: 'cyan' });
        A.dirty.awards = true; A.refreshStatus(); A.render();
      },
    }));
    return box;
  };

  /* =============== TULISAN =============== */
  A.pages.writing = function () {
    var d = A.data.writing || [];
    var box = el('div', null, fileHead('Tulisan', 'Artikel Medium yang tampil sebagai kartu 3 kolom.', 'writing'));
    d.forEach(function (w, i) {
      box.appendChild(H.card((w.title && w.title.id) || ('Tulisan #' + (i + 1)), el('div', { class: 'stack' },
        A.bilingual('writing.' + i + '.title', 'Judul'),
        el('div', { class: 'row-2' },
          A.input('writing.' + i + '.url', 'Tautan artikel', { file: 'writing' }),
          A.bilingual('writing.' + i + '.date', 'Tanggal')
        ),
        el('div', { class: 'row-2' },
          A.bilingual('writing.' + i + '.category', 'Kategori'),
          A.input('writing.' + i + '.sort', 'Urutan (YYYY-MM)', { file: 'writing' })
        ),
        A.bilingual('writing.' + i + '.blurb', 'Ringkasan', { multiline: true, rows: 2 }),
        A.imagePicker(w, 'image', 'writing')
      ), [removeTool(d, 'writing')(i)]));
    });
    box.appendChild(el('button', {
      class: 'btn btn-ghost', type: 'button', text: '+ Tambah tulisan',
      onclick: function () {
        d.push({
          title: { id: '', en: '' }, url: '', date: { id: '', en: '' }, sort: '',
          category: { id: '', en: '' }, blurb: { id: '', en: '' },
        });
        A.dirty.writing = true; A.refreshStatus(); A.render();
      },
    }));
    return box;
  };

  /* =============== GALERI / ALBUM =============== */
  A.pages.albums = function () {
    var d = A.data.albums || [];
    var KINDS = ['certification', 'recognition', 'event', 'training', 'work', 'profile'];
    var box = el('div', null, fileHead('Galeri / album',
      'Foto dikelompokkan per kegiatan. Foto pertama menjadi sampul kartu. Seret thumbnail untuk mengubah urutan.', 'albums'));

    box.appendChild(H.card('Tambah foto', el('div', { class: 'stack' },
      el('p', { class: 'ph-sub', text: 'Unggah foto baru (otomatis dikompres: sisi terpanjang maksimal 1600 px, kualitas 82), atau tambahkan berkas yang sudah ada ke sebuah album.' }),
      el('div', { class: 'upload-zone', id: 'upZone' },
        el('b', { text: 'Seret foto ke sini' }),
        el('span', { text: 'atau klik untuk memilih berkas' })
      ),
      el('input', { type: 'file', id: 'upInput', accept: 'image/*', multiple: true, style: 'display:none' })
    )));

    d.forEach(function (al, i) {
      var body = el('div', { class: 'stack' });
      body.appendChild(A.bilingual('albums.' + i + '.title', 'Judul album'));
      body.appendChild(el('div', { class: 'row-2' },
        (function () {
          var f = el('div', { class: 'field' }, el('label', { text: 'Jenis (filter)' }));
          var sel = el('select', { onchange: function (e) { al.kind = e.target.value; A.dirty.albums = true; A.refreshStatus(); } });
          KINDS.forEach(function (k) {
            var o = el('option', { value: k, text: k });
            if (al.kind === k) o.selected = true;
            sel.appendChild(o);
          });
          f.appendChild(sel);
          return f;
        })(),
        A.bilingual('albums.' + i + '.date', 'Tanggal')
      ));
      body.appendChild(A.bilingual('albums.' + i + '.desc', 'Keterangan', { multiline: true, rows: 2 }));

      /* foto */
      var strip = el('div', { class: 'thumb-strip' });
      function paintStrip() {
        A.clear(strip);
        (al.photos || []).forEach(function (p, j) {
          var t = el('div', { class: 'thumb', draggable: 'true' },
            el('img', { src: mediaUrl(p.src), alt: '', loading: 'lazy' }),
            el('button', {
              class: 'rm', type: 'button', text: '×', title: 'Keluarkan dari album',
              onclick: function () { al.photos.splice(j, 1); A.dirty.albums = true; A.refreshStatus(); paintStrip(); },
            })
          );
          t.addEventListener('dragstart', function (e) { t.classList.add('dragging'); e.dataTransfer.setData('text/plain', String(j)); });
          t.addEventListener('dragend', function () { t.classList.remove('dragging'); });
          t.addEventListener('dragover', function (e) { e.preventDefault(); });
          t.addEventListener('drop', function (e) {
            e.preventDefault();
            var from = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (isNaN(from) || from === j) return;
            var arr = al.photos;
            var moved = arr.splice(from, 1)[0];
            arr.splice(j, 0, moved);
            A.dirty.albums = true; A.refreshStatus(); paintStrip();
          });
          strip.appendChild(t);
        });
        if (!(al.photos || []).length) strip.appendChild(el('p', { class: 'hint', text: 'Belum ada foto.' }));
      }
      paintStrip();

      /* pemilih berkas yang sudah ada */
      var picker = el('select', {});
      picker.appendChild(el('option', { value: '', text: 'pilih berkas gambar' }));
      (A.media || []).forEach(function (m) { picker.appendChild(el('option', { value: m.name, text: m.name })); });
      body.appendChild(strip);
      body.appendChild(el('div', { class: 'grid-2' },
        picker,
        el('button', {
          class: 'btn btn-sm btn-ghost', type: 'button', text: '+ Tambahkan ke album',
          onclick: function () {
            if (!picker.value) { A.toast('Pilih berkas dulu', 'err'); return; }
            al.photos = al.photos || [];
            al.photos.push({ src: picker.value, alt: { id: '', en: '' }, caption: { id: '', en: '' } });
            picker.value = '';
            A.dirty.albums = true; A.refreshStatus(); paintStrip();
          },
        })
      ));

      box.appendChild(H.card((al.title && al.title.id) || ('Album #' + (i + 1)), body, [
        el('button', {
          class: 'icon-btn', type: 'button', text: '↑', title: 'Naikkan',
          onclick: function () { if (i === 0) return; var t = d[i - 1]; d[i - 1] = d[i]; d[i] = t; A.dirty.albums = true; A.refreshStatus(); A.render(); },
        }),
        el('button', {
          class: 'icon-btn', type: 'button', text: '↓', title: 'Turunkan',
          onclick: function () { if (i === d.length - 1) return; var t = d[i + 1]; d[i + 1] = d[i]; d[i] = t; A.dirty.albums = true; A.refreshStatus(); A.render(); },
        }),
        removeTool(d, 'albums')(i),
      ]));
    });

    box.appendChild(el('button', {
      class: 'btn btn-ghost', type: 'button', text: '+ Tambah album',
      onclick: function () {
        d.push({
          id: 'album-' + Date.now(), kind: 'event',
          title: { id: '', en: '' }, date: { id: '', en: '' }, desc: { id: '', en: '' },
          photos: [],
        });
        A.dirty.albums = true; A.refreshStatus(); A.render();
      },
    }));

    wireUpload(box, function () { A.dirty.albums = true; A.render(); });
    return box;
  };

  /* =============== BERKAS GAMBAR =============== */
  function ukuranBerkas(byte) {
    if (byte < 1024) return byte + ' B';
    if (byte < 1024 * 1024) return (byte / 1024).toFixed(1) + ' KB';
    return (byte / (1024 * 1024)).toFixed(1) + ' MB';
  }

  A.pages.media = function () {
    var box = el('div', null, fileHead('Berkas gambar',
      'Semua gambar di public/media/. Nama berkas dipakai oleh album dan kartu karya.', null));

    box.appendChild(H.card('Unggah', el('div', { class: 'stack' },
      el('div', { class: 'upload-zone', id: 'upZone' },
        el('b', { text: 'Seret foto ke sini' }),
        el('span', { text: 'atau klik untuk memilih (JPG, PNG, WebP, maks 25 MB)' })
      ),
      el('input', { type: 'file', id: 'upInput', accept: 'image/*', multiple: true, style: 'display:none' })
    )));

    var grid = el('div', { class: 'media-grid' });
    (A.media || []).forEach(function (m) {
      grid.appendChild(el('div', { class: 'media-item' },
        el('div', { class: 'media-thumb' }, el('img', { src: mediaUrl(m.name), alt: '', loading: 'lazy' })),
        el('div', { class: 'media-meta' },
          el('span', { class: 'media-name', text: m.name }),
          el('span', { class: 'media-size', text: ukuranBerkas(m.size) }),
          el('div', { class: 'media-acts' },
            el('button', {
              class: 'btn btn-sm btn-ghost', type: 'button', text: 'Salin',
              onclick: function () {
                var done = function () { A.toast('Nama disalin: ' + m.name, 'ok'); };
                if (navigator.clipboard) navigator.clipboard.writeText(m.name).then(done, done); else done();
              },
            }),
            el('button', {
              class: 'btn btn-sm btn-danger', type: 'button', text: 'Hapus',
              onclick: function () {
                if (!confirm('Hapus ' + m.name + ' dari disk?')) return;
                A.api('/api/media?name=' + encodeURIComponent(m.name), { method: 'DELETE' })
                  .then(function (r) { A.media = r.items; A.toast('Dihapus', 'ok'); A.render(); })
                  .catch(function (e) { A.toast('Gagal: ' + e.message, 'err'); });
              },
            })
          )
        )
      ));
    });
    box.appendChild(grid);
    wireUpload(box, function () { A.render(); });
    return box;
  };

  function wireUpload(box, onDone) {
    var zone = box.querySelector('#upZone');
    var input = box.querySelector('#upInput');
    if (!zone || !input) return;
    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('drag'); });
    zone.addEventListener('drop', function (e) { e.preventDefault(); zone.classList.remove('drag'); send(e.dataTransfer.files); });
    input.addEventListener('change', function () { send(input.files); });

    function send(files) {
      if (!files || !files.length) return;
      var queue = Array.prototype.slice.call(files);
      zone.textContent = 'Mengunggah ' + queue.length + ' berkas…';
      (function next() {
        var f = queue.shift();
        if (!f) {
          A.toast('Unggahan selesai', 'ok');
          zone.innerHTML = '<b>Seret foto ke sini</b><span>atau klik untuk memilih berkas</span>';
          A.loadMedia().then(onDone);
          return;
        }
        var fr = new FileReader();
        fr.onload = function () {
          A.api('/api/media?name=' + encodeURIComponent(f.name), { method: 'POST', body: fr.result })
            .then(function () { next(); })
            .catch(function (e) { A.toast('Gagal ' + f.name + ': ' + e.message, 'err'); next(); });
        };
        fr.onerror = function () { A.toast('Gagal membaca ' + f.name, 'err'); next(); };
        fr.readAsArrayBuffer(f);
      })();
    }
  }

  /* =============== JSON MENTAH =============== */
  A.pages.raw = function () {
    var box = el('div', null, fileHead('JSON mentah',
      'Pengeditan langsung. Berguna untuk field yang belum punya formulir. Simpan untuk menulis ulang file.', null));

    var tabs = el('div', { class: 'chips', style: 'margin-bottom:14px' });
    var area = el('textarea', { rows: 24, style: 'font-family:ui-monospace,Menlo,monospace;font-size:.82rem' });
    var current = 'site';

    function show(name) {
      current = name;
      area.value = JSON.stringify(A.data[name], null, 2);
      A.clear(tabs);
      ['site', 'labels', 'work', 'experience', 'skills', 'credentials', 'awards', 'writing', 'albums'].forEach(function (f) {
        tabs.appendChild(el('span', {
          class: 'chip', text: f,
          style: f === name ? 'background:#080605;color:#fff;border-color:#080605' : '',
          onclick: function () { show(f); },
        }));
      });
    }

    box.appendChild(tabs);
    box.appendChild(area);
    box.appendChild(el('div', { style: 'display:flex;gap:10px;margin-top:14px;flex-wrap:wrap' },
      el('button', {
        class: 'btn', type: 'button', text: 'Terapkan ke panel',
        onclick: function () {
          try {
            A.data[current] = JSON.parse(area.value);
            A.dirty[current] = true;
            A.refreshStatus();
            A.toast('Diterapkan ke ' + current + '. Jangan lupa simpan perubahan', 'ok');
          } catch (e) { A.toast('JSON tidak valid: ' + e.message, 'err'); }
        },
      }),
      el('button', {
        class: 'btn btn-ghost', type: 'button', text: 'Simpan file ini',
        onclick: function () {
          try { JSON.parse(area.value); } catch (e) { A.toast('JSON tidak valid: ' + e.message, 'err'); return; }
          A.api('/api/content', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: current, data: area.value }),
          }).then(function () {
            A.dirty[current] = false; A.refreshStatus();
            A.toast(current + '.json tersimpan', 'ok');
            A.load(current);
          }).catch(function (e) { A.toast('Gagal: ' + e.message, 'err'); });
        },
      })
    ));
    show('site');
    return box;
  };
})();
