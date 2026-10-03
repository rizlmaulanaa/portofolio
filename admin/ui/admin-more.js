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
        el('div', { class: 'media-thumb' }, el('img', { src: '/media/' + m.name, alt: '', loading: 'lazy' })),
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
