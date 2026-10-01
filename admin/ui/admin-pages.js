/* Panel admin, renderer tiap tab */
(function () {
  'use strict';
  var A = window.APP;
  var el = A.el, H = window.__helpers;

  function fileHead(title, sub, file) { return H.headBlock(title, sub, file); }

  /* =============== KARTU STATUS (diisi terus oleh paintStatus) =============== */
  function statusCard() {
    return H.card('Status situs', el('div', { class: 'status-rows', id: 'statusRows' },
      el('p', { class: 'empty', text: 'Memeriksa status…' })));
  }

  function baris(label, isi, state) {
    return el('div', { class: 's-row' },
      el('span', { class: 's-key', text: label }),
      el('span', { class: 's-val ' + (state || ''), text: isi }));
  }

  function waktuLengkap(iso) {
    try {
      return new Date(iso).toLocaleString('id-ID',
        { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  }

  A.paintStatus = function (s) {
    var host = document.getElementById('statusRows');
    if (!host || !s) return;
    var rows = [];

    if (s.building || s.waiting) rows.push(baris('Sinkron', 'Menyinkronkan situs…', 'busy'));
    else if (s.lastBuild && s.lastBuild.at) rows.push(baris('Sinkron terakhir',
      (s.lastBuild.ok === false ? 'Gagal ' : 'Berhasil ') + waktuLengkap(s.lastBuild.at) +
      ' (' + (s.lastBuild.reason || 'build') + ')',
      s.lastBuild.ok === false ? 'bad' : 'good'));
    else if (s.dist.ok) rows.push(baris('Sinkron', 'Siap, belum dicatat di sesi ini', 'good'));
    else rows.push(baris('Sinkron', 'Belum pernah dibangun', 'bad'));

    rows.push(baris('Pratinjau lokal', s.preview ? 'Berjalan di port 4321' : 'Tidak berjalan (npm run preview)',
      s.preview ? 'good' : 'off'));
    rows.push(baris('Berkas siap', s.dist.ok ? 'dist/ diperbarui ' + waktuLengkap(s.dist.at) : 'dist/ belum ada',
      s.dist.ok ? 'good' : 'bad'));

    if (s.git && s.git.repo) {
      rows.push(baris('Git', 'cabang ' + s.git.branch + ', ' + s.git.changed + ' berkas berubah' +
        (s.git.unpushed ? ', ' + s.git.unpushed + ' commit belum dipush' : ''), s.git.changed ? 'busy' : 'good'));
    } else {
      rows.push(baris('Git', 'Belum jadi repositori Git', 'busy'));
    }
    rows.push(baris('Cadangan & media', s.backups + ' cadangan · ' + s.mediaCount + ' gambar', ''));

    A.clear(host);
    rows.forEach(function (r) { host.appendChild(r); });
    if (!(s.git && s.git.repo)) host.appendChild(gitHelp());
  };

  var PERINTAH_GIT = [
    'git init',
    'git add .',
    'git commit -m "Rilis awal"',
    'git branch -M main',
    'git remote add origin https://github.com/rizlmaulanaa/portofolio.git',
    'git push -u origin main',
  ].join('\n');

  function gitHelp() {
    return el('div', { class: 'git-help' },
      el('p', { text: 'Sekali saja: jalankan perintah di bawah sekali, lalu setiap push berikutnya akan men deploy sendiri ke GitHub Pages.' }),
      el('pre', { class: 'git-cmd', text: PERINTAH_GIT }),
      el('button', {
        class: 'btn btn-sm', type: 'button', text: 'Salin perintah',
        onclick: function (e) {
          var b = e.currentTarget;
          (navigator.clipboard ? navigator.clipboard.writeText(PERINTAH_GIT) : Promise.reject())
            .then(function () { b.textContent = 'Tersalin ✓'; setTimeout(function () { b.textContent = 'Salin perintah'; }, 1800); })
            .catch(function () { A.toast('Salin manual dari kotak di atas', 'err'); });
        },
      }));
  }

  /* =============== BERANDA =============== */
  A.pages.home = function () {
    var c = A.data.site || {};
    var counts = [
      ['Karya', (A.data.work || []).length],
      ['Album', (A.data.albums || []).length],
      ['Foto', (A.data.albums || []).reduce(function (n, a) { return n + (a.photos || []).length; }, 0)],
      ['Tulisan', (A.data.writing || []).length],
      ['Sertifikasi', ((A.data.credentials || {}).credentials || []).length],
      ['Berkas media', A.media.length],
    ];

    var box = el('div', null,
      el('div', { class: 'head-row' },
        el('div', null,
          el('h1', { class: 'ph', text: 'Beranda' }),
          el('p', { class: 'ph-sub', text: 'Semua teks dan foto di situs ini berasal dari folder content/ dan public/media/. Ubah di sini, simpan, lalu sinkronisasi berjalan otomatis.' })
        )
      ),
      statusCard(),
      el('div', { class: 'stat-grid' }, counts.map(function (kv) {
        return el('div', { class: 'stat' },
          el('b', { text: String(kv[1]) }), el('span', { text: kv[0] }));
      })),
      H.card('Alur kerja', el('div', { class: 'checklist' },
        el('div', { class: 'check', text: 'Buka tab di kiri, ubah teks atau foto yang diinginkan.' }),
        el('div', { class: 'check', text: 'Klik Simpan perubahan. Cadangan otomatis dibuat di .admin-backups/.' }),
        el('div', { class: 'check auto', text: 'Sinkronisasi berjalan sendiri: dist/ dibangun ulang otomatis dalam ±1 detik setelah simpan.' }),
        el('div', { class: 'check', text: 'Push ke GitHub. GitHub Actions akan mendeploy otomatis ke rizlmaulanaa.github.io/portofolio/.' })
      )),
      H.card('Situs aktif', el('div', { class: 'grid-2' },
        A.input('site.name', 'Nama lengkap', { file: 'site' }),
        A.input('site.email', 'Email', { file: 'site', type: 'email' }),
        A.bilingual('site.status', 'Status', { file: 'site' }),
        A.bilingual('site.location', 'Lokasi', { file: 'site' })
      ), null),
      el('div', { class: 'head-row' },
        el('div', null, el('h2', { class: 'ph', text: 'Cadangan', style: 'font-size:1.3rem' }),
          el('p', { class: 'ph-sub', text: 'Sebelum file ditimpa, salinannya disimpan. Pilih cadangan untuk memulihkan isinya.' })),
        el('button', {
          class: 'btn btn-ghost', type: 'button', text: 'Muat daftar cadangan',
          onclick: function (e) { e.currentTarget.disabled = true; showBackups(); },
        })
      ),
      el('div', { id: 'backupList' })
    );
    return box;
  };

  function showBackups() {
    A.api('/api/backups').then(function (r) {
      var host = document.getElementById('backupList');
      if (!host) return;
      A.clear(host);
      if (!r.items || !r.items.length) { host.appendChild(el('p', { class: 'empty', text: 'Belum ada cadangan.' })); return; }
      r.items.slice(0, 40).forEach(function (name) {
        host.appendChild(H.card(name, null, [
          el('button', {
            class: 'btn btn-sm btn-ghost', type: 'button', text: 'Pulihkan',
            onclick: function (e) {
              e.currentTarget.disabled = true;
              A.api('/api/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ backup: name }) })
                .then(function () { A.toast('Dipulihkan: ' + name, 'ok'); return boot(); })
                .catch(function (err) { A.toast('Gagal: ' + err.message, 'err'); e.currentTarget.disabled = false; });
            },
          }),
        ]));
      });
    }).catch(function (e) { A.toast(e.message, 'err'); });
  }

  /* =============== IDENTITAS SITUS =============== */
  A.pages.site = function () {
    var d = A.data.site;
    return el('div', null,
      fileHead('Identitas situs', 'Nama, kontak, tautan sosial, dan kalimat yang tampil di halaman depan.', 'site'),
      H.card('Data dasar', el('div', { class: 'stack' },
        el('div', { class: 'grid-2' },
          A.input('site.name', 'Nama lengkap'),
          A.input('site.initials', 'Inisial (logo)')
        ),
        el('div', { class: 'grid-2' },
          A.input('site.email', 'Email', { type: 'email' }),
          A.input('site.handle', 'Akun GitHub')
        ),
        el('div', { class: 'grid-2' },
          A.bilingual('site.location', 'Lokasi'),
          A.bilingual('site.locationShort', 'Lokasi singkat')
        ),
        A.bilingual('site.status', 'Status (pil hijau di hero)')
      )),
      H.card('Kalimat pembuka', el('div', { class: 'stack' },
        A.bilingual('site.intro', 'Sapaan: "Halo, saya" / "Hey, I\'m"'),
        A.bilingual('site.tagline', 'Paragraf pendukung di hero', { multiline: true, rows: 3 }),
        A.bilingual('site.headline', 'Kalimat penjelas (opsional)', { hint: 'Dipakai bila ingin mengganti baris "Lima tahun membangun…".' })
      )),
      H.card('Tautan sosial', el('div', { class: 'grid-3' },
        A.input('site.links.linkedin', 'LinkedIn'),
        A.input('site.links.github', 'GitHub'),
        A.input('site.links.medium', 'Medium')
      )),
      H.card('Ringkasan profil', el('div', { class: 'stack' },
        A.bilingualList('site.summary', 'Paragraf (satu baris = satu paragraf, ID dan EN harus sama jumlahnya)', { rows: 5 })
      )),
      H.card('Data ringkas',
        el('div', { class: 'stack', id: 'factsHost' },
          (d.facts || []).map(function (f, i) {
            return el('div', { class: 'row-2' },
              A.bilingual('site.facts.' + i + '.label', 'Label'),
              A.bilingual('site.facts.' + i + '.value', 'Nilai')
            );
          })
        )
      )
    );
  };

  /* =============== TEKS ANTARMUKA =============== */
  A.pages.labels = function () {
    var box = el('div', null, fileHead('Teks antarmuka',
      'Seluruh label menu, judul bagian, dan tombol, kolom ID dan EN berdampingan.', 'labels'));
    var d = A.data.labels || {};
    Object.keys(d).forEach(function (group) {
      var fields = el('div', { class: 'stack' });
      var g = d[group];
      if (g && typeof g === 'object') {
        Object.keys(g).forEach(function (key) {
          if (g[key] && typeof g[key] === 'object' && ('id' in g[key] || 'en' in g[key])) {
            fields.appendChild(A.bilingual('labels.' + group + '.' + key, key));
          } else if (typeof g[key] === 'string') {
            fields.appendChild(A.input('labels.' + group + '.' + key, key));
          }
        });
      }
      if (fields.childNodes.length) box.appendChild(H.card(group, fields));
    });
    return box;
  };

  /* =============== KARYA =============== */
  A.pages.work = function () {
    var d = A.data.work || [];
    var box = el('div', null, fileHead('Karya & proyek',
      'Kartu unggulan di bagian Karya. Karya pertama dan kedua tampil sebagai kartu besar.', 'work'));

    d.forEach(function (w, i) {
      var tools = [];
      if (i > 0) tools.push(el('button', {
        class: 'icon-btn', type: 'button', text: '↑', title: 'Naikkan',
        onclick: function () { var t = d[i - 1]; d[i - 1] = d[i]; d[i] = t; A.dirty.work = true; A.refreshStatus(); A.render(); },
      }));
      if (i < d.length - 1) tools.push(el('button', {
        class: 'icon-btn', type: 'button', text: '↓', title: 'Turunkan',
        onclick: function () { var t = d[i + 1]; d[i + 1] = d[i]; d[i] = t; A.dirty.work = true; A.refreshStatus(); A.render(); },
      }));
      tools.push(el('button', {
        class: 'icon-btn', type: 'button', text: '✕', title: 'Hapus',
        onclick: function () { if (!confirm('Hapus karya ini?')) return; d.splice(i, 1); A.dirty.work = true; A.refreshStatus(); A.render(); },
      }));

      box.appendChild(H.card((i + 1) + '. ' + (w.title || '(tanpa judul)'), el('div', { class: 'stack' },
        el('div', { class: 'grid-2' },
          A.input('work.' + i + '.title', 'Judul'),
          el('div', { class: 'row-2' },
            A.input('work.' + i + '.year', 'Tahun'),
            A.input('work.' + i + '.url', 'Tautan')
          )
        ),
        A.bilingual('work.' + i + '.category', 'Kategori (label di atas gambar)'),
        A.bilingual('work.' + i + '.desc', 'Deskripsi', { multiline: true, rows: 3 }),
        A.imagePicker(w, 'image', 'work'),
        A.stringList('work.' + i + '.stack', 'Teknologi (chip)')
      ), tools));
    });

    box.appendChild(el('button', {
      class: 'btn btn-ghost', type: 'button', text: '+ Tambah karya',
      onclick: function () {
        d.push({
          id: 'baru-' + Date.now(), title: '', year: '', url: '',
          category: { id: '', en: '' }, desc: { id: '', en: '' }, stack: [],
        });
        A.dirty.work = true; A.refreshStatus(); A.render();
      },
    }));
    return box;
  };

  /* =============== PENGALAMAN =============== */
  A.pages.experience = function () {
    var d = A.data.experience || [];
    var box = el('div', null, fileHead('Pengalaman kerja', 'Riwayat kerja yang tampil di bagian Tentang.', 'experience'));
    d.forEach(function (x, i) {
      box.appendChild(H.card(x.company || ('Pengalaman #' + (i + 1)), el('div', { class: 'stack' },
        A.input('experience.' + i + '.company', 'Perusahaan'),
        el('div', { class: 'row-2' },
          A.bilingual('experience.' + i + '.role', 'Jabatan'),
          A.bilingual('experience.' + i + '.period', 'Periode')
        ),
        el('div', { class: 'row-2' },
          A.bilingual('experience.' + i + '.note', 'Catatan'),
          A.bilingual('experience.' + i + '.location', 'Lokasi')
        )
      ), [
        el('button', {
          class: 'icon-btn', type: 'button', text: '✕', title: 'Hapus',
          onclick: function () { if (!confirm('Hapus pengalaman ini?')) return; d.splice(i, 1); A.dirty.experience = true; A.refreshStatus(); A.render(); },
        }),
      ]));
    });
    box.appendChild(el('button', {
      class: 'btn btn-ghost', type: 'button', text: '+ Tambah pengalaman',
      onclick: function () {
        d.push({ id: 'baru-' + Date.now(), company: '', role: { id: '', en: '' }, period: { id: '', en: '' }, note: { id: '', en: '' }, location: { id: '', en: '' } });
        A.dirty.experience = true; A.refreshStatus(); A.render();
      },
    }));
    return box;
  };

  /* =============== KEMAMPUAN =============== */
  A.pages.skills = function () {
    var d = A.data.skills || [];
    var box = el('div', null, fileHead('Kemampuan', 'Kelompok keahlian yang tampil sebagai kartu di bagian Tentang.', 'skills'));
    d.forEach(function (s, i) {
      box.appendChild(H.card(s.title?.id || ('Kelompok #' + (i + 1)), el('div', { class: 'stack' },
        A.bilingual('skills.' + i + '.title', 'Judul kelompok'),
        A.bilingual('skills.' + i + '.blurb', 'Penjelasan singkat', { multiline: true, rows: 2 }),
        A.bilingualList('skills.' + i + '.items', 'Butir (satu baris satu butir, ID & EN sama jumlahnya)')
      ), [
        el('button', {
          class: 'icon-btn', type: 'button', text: '✕', title: 'Hapus',
          onclick: function () { if (!confirm('Hapus kelompok ini?')) return; d.splice(i, 1); A.dirty.skills = true; A.refreshStatus(); A.render(); },
        }),
      ]));
    });
    box.appendChild(el('button', {
      class: 'btn btn-ghost', type: 'button', text: '+ Tambah kelompok',
      onclick: function () {
        d.push({ id: 'baru-' + Date.now(), title: { id: '', en: '' }, blurb: { id: '', en: '' }, items: { id: [], en: [] } });
        A.dirty.skills = true; A.refreshStatus(); A.render();
      },
    }));
    return box;
  };
})();
