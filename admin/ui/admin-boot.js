/* Panel admin, boot, perpindahan tab, build */
(function () {
  'use strict';
  var A = window.APP;
  var el = A.el, $ = A.$, $$ = A.$$;

  var TITLES = {
    home: 'Beranda', site: 'Identitas', labels: 'Teks & label',
    work: 'Karya', experience: 'Pengalaman', skills: 'Kemampuan',
    credentials: 'Kredensial', awards: 'Apresiasi', writing: 'Tulisan',
    albums: 'Galeri', media: 'Media', raw: 'JSON mentah',
  };

  var FILE_OF = {
    site: 'site', labels: 'labels', work: 'work', experience: 'experience',
    skills: 'skills', credentials: 'credentials', awards: 'awards',
    writing: 'writing', albums: 'albums',
  };

  A.render = function () {
    var host = $('#content');
    if (!host) return;
    var page = A.pages[A.tab];
    if (!page) { host.innerHTML = '<div class="empty">Halaman belum tersedia.</div>'; return; }
    A.tabFile = FILE_OF[A.tab] || null;
    A.clear(host);
    try {
      host.appendChild(page());
    } catch (e) {
      host.innerHTML = '';
      host.appendChild(el('div', { class: 'card' },
        el('p', { class: 'ph-sub', text: 'Gagal merender halaman: ' + e.message })));
      console.error(e);
    }
    var crumb = $('#crumb');
    if (crumb) crumb.textContent = TITLES[A.tab] || A.tab;
    if (A.tab === 'home' && A.status && typeof A.paintStatus === 'function') A.paintStatus(A.status);
    A.refreshStatus();
    host.scrollIntoView && window.scrollTo({ top: 0, behavior: 'auto' });
  };

  function wireTabs() {
    $$('.side-link').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = b.getAttribute('data-tab');
        if (next === A.tab) return;
        var f = FILE_OF[A.tab];
        if (f && A.dirty[f] && !confirm('Ada perubahan di ' + f + '.json yang belum disimpan. Pindah tanpa menyimpan?')) return;
        A.tab = next;
        $$('.side-link').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        A.render();
      });
    });
  }

  function wireBuild() {
    var btn = $('#btnBuild');
    var modal = $('#buildModal');
    var log = $('#buildLog');
    var title = $('#buildTitle');
    var close = $('#buildClose');

    if (close) close.addEventListener('click', function () { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); });
    if (!btn) return;

    btn.addEventListener('click', function () {
      var dirty = Object.keys(A.dirty).filter(function (k) { return A.dirty[k]; });
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      title.textContent = 'Membangun situs…';
      log.textContent = dirty.length
        ? 'Perubahan belum disimpan: ' + dirty.join(', ') + '\nBuild memakai isi file yang sudah tersimpan di disk.\n\n'
        : '';

      A.api('/api/build', { method: 'POST' })
        .then(function (r) {
          title.textContent = r.ok ? 'Build selesai ✓' : 'Build gagal ✗';
          log.textContent += r.log || '(tanpa keluaran)';
          if (r.ok) A.toast('Situs diperbarui di dist/', 'ok');
          else A.toast('Build gagal, lihat log', 'err');
          A.refreshSync();
        })
        .catch(function (e) {
          title.textContent = 'Build gagal ✗';
          log.textContent += String(e.message || e);
          A.toast('Gagal memulai build', 'err');
        });
    });
  }

  window.boot = async function () {
    try {
      var info = await A.api('/api/info');
      A.info = info;
      var health = $('#health');
      if (health) health.className = 'dot ok';
      var rp = $('#rootPath');
      if (rp) { rp.textContent = info.root; rp.title = info.root; }
      var ct = $('#connText');
      if (ct) ct.textContent = info.mediaCount + ' media · ' + info.contentFiles.length + ' file konten';

      await Promise.all(info.contentFiles.map(function (f) { return A.load(f); }));
      await A.loadMedia();
      A.toast('Terhubung. ' + info.mediaCount + ' media, ' + info.contentFiles.length + ' file konten.', 'ok');
    } catch (e) {
      var health = $('#health');
      if (health) health.className = 'dot err';
      var ct = $('#connText');
      if (ct) ct.textContent = 'Tidak terhubung';
      A.toast('Tidak bisa memuat data: ' + e.message, 'err');
      console.error(e);
    }
    wireTabs();
    wireBuild();
    A.render();
    A.startSyncWatch(3000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.boot);
  else window.boot();
})();
