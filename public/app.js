/* Portofolio, interaksi (tanpa framework) */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- BAHASA (ID / EN) ---------------- */
  var langBtn = $('#langBtn');
  var KEY = 'rm-lang';

  function currentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'id';
  }

  function paintLang() {
    if (langBtn) langBtn.textContent = currentLang().toUpperCase();
  }

  function setLang(next) {
    document.documentElement.lang = next;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    paintLang();
    document.dispatchEvent(new CustomEvent('rm:lang', { detail: next }));
  }

  paintLang();
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      setLang(currentLang() === 'id' ? 'en' : 'id');
    });
  }

  /* ---------------- MENU ---------------- */
  var burger = $('#menuOpen');
  var overlay = $('#menuOverlay');

  function setMenu(open) {
    if (!overlay || !burger) return;
    overlay.classList.toggle('is-open', open);
    document.body.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = $('.overlay-link', overlay);
      if (first) setTimeout(function () { first.focus(); }, 260);
    } else {
      burger.focus();
    }
  }

  if (burger) burger.addEventListener('click', function () {
    setMenu(!overlay.classList.contains('is-open'));
  });
  if (overlay) {
    $$('.overlay-link', overlay).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  /* ---------------- NAV MELEKAT ---------------- */
  var nav = $('#nav');
  function onScroll() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- MUNCUL SAAT DI-SCROLL ---------------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });

    // jaring pengaman: bila sesuatu tersangkut, paksa tampil
    setTimeout(function () {
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 2200);
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- FILTER GALERI ---------------- */
  var filters = $$('.filter');
  var albums = $$('.album');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-filter');
      filters.forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      albums.forEach(function (a) {
        var show = key === 'all' || a.getAttribute('data-kind') === key;
        a.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------------- PANEL DETAL ALBUM ---------------- */
  var data = {};
  try {
    var raw = $('#albumData');
    if (raw) JSON.parse(raw.textContent).forEach(function (a) { data[a.id] = a; });
  } catch (e) {}

  var panel = $('#albumPanel');
  var pTitle = $('#panelTitle'), pDate = $('#panelDate'), pDesc = $('#panelDesc');
  var pKind = $('#panelKind'), pPhotos = $('#panelPhotos');
  var activePhotos = [];
  var activeAlbumId = null;

  var KIND = {
    certification: { id: 'Sertifikasi', en: 'Certification' },
    recognition:   { id: 'Apresiasi',   en: 'Recognition' },
    event:         { id: 'Acara',       en: 'Event' },
    training:      { id: 'Pelatihan',   en: 'Training' },
    work:          { id: 'Kegiatan',    en: 'Work' },
    profile:       { id: 'Profil',      en: 'Profile' },
  };

  function loc(obj, key) {
    if (!obj) return '';
    var lang = currentLang();
    if (obj[lang]) return obj[lang];
    return obj.id || obj[key] || '';
  }

  function fillPanel(a) {
    var k = KIND[a.kind] || { id: a.kind, en: a.kind };
    if (pKind) pKind.textContent = currentLang() === 'en' ? k.en : k.id;
    if (pTitle) pTitle.textContent = loc(a.title);
    if (pDate) pDate.textContent = loc(a.date);
    if (pDesc) pDesc.textContent = loc(a.desc);

    activePhotos = a.photos || [];
    if (!pPhotos) return;
    pPhotos.innerHTML = '';
    activePhotos.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', loc(p.caption) || 'Foto ' + (i + 1));
      var img = document.createElement('img');
      img.src = p.src;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      b.appendChild(img);
      b.addEventListener('click', function () { openLightbox(i); });
      pPhotos.appendChild(b);
    });
  }

  function openPanel(id) {
    var a = data[id];
    if (!a || !panel) return;
    activeAlbumId = id;
    fillPanel(a);
    panel.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var c = $('#panelClose');
    if (c) setTimeout(function () { c.focus(); }, 260);
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('is-open');
    if (!$('#lightbox') || !$('#lightbox').classList.contains('is-open')) {
      document.body.style.overflow = '';
    }
  }

  albums.forEach(function (el) {
    el.addEventListener('click', function () { openPanel(el.getAttribute('data-album')); });
  });
  var pClose = $('#panelClose');
  if (pClose) pClose.addEventListener('click', closePanel);

  /* ---------------- LIGHTBOX ---------------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  var lbIndex = 0;

  function renderLightbox() {
    var p = activePhotos[lbIndex];
    if (!p || !lbImg) return;
    lbImg.src = p.src;
    lbImg.alt = loc(p.caption) || '';
    if (lbCap) lbCap.textContent = loc(p.caption) || '';
  }

  function openLightbox(i) {
    if (!lb || !activePhotos.length) return;
    lbIndex = i;
    renderLightbox();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    if (!panel || !panel.classList.contains('is-open')) document.body.style.overflow = '';
  }

  function stepLightbox(d) {
    if (!activePhotos.length) return;
    lbIndex = (lbIndex + d + activePhotos.length) % activePhotos.length;
    renderLightbox();
  }

  var lbClose = $('#lbClose'), lbPrev = $('#lbPrev'), lbNext = $('#lbNext');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function () { stepLightbox(-1); });
  if (lbNext) lbNext.addEventListener('click', function () { stepLightbox(1); });
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lb && lb.classList.contains('is-open')) closeLightbox();
      else if (panel && panel.classList.contains('is-open')) closePanel();
      else if (overlay && overlay.classList.contains('is-open')) setMenu(false);
      return;
    }
    if (lb && lb.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    }
  });

  /* ganti bahasa saat panel terbuka */
  document.addEventListener('rm:lang', function () {
    if (panel && panel.classList.contains('is-open') && activeAlbumId && data[activeAlbumId]) {
      fillPanel(data[activeAlbumId]);
    }
    if (lb && lb.classList.contains('is-open')) renderLightbox();
  });

  /* ---------------- SLIDER (proyek & kemampuan) ---------------- */
  function makeSlider(o) {
    var track = $(o.track);
    if (!track) return null;
    var cards = $$(o.card, track);
    var dots = $(o.dots);
    var count = $(o.count);
    var prev = $(o.prev), next = $(o.next);
    var idx = 0;

    function paint() {
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      /* tinggi kotak mengikuti kartu aktif supaya tidak ada ruang kosong */
      var vp = track.parentElement;
      if (vp && cards[idx]) vp.style.height = cards[idx].offsetHeight + 'px';
      if (dots) {
        $$('.proj-dot', dots).forEach(function (d, i) {
          d.classList.toggle('is-active', i === idx);
        });
      }
      if (count) {
        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
        count.textContent = pad(idx + 1) + ' / ' + pad(cards.length);
      }
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === cards.length - 1;
    }
    function go(d) {
      idx = Math.min(Math.max(idx + d, 0), cards.length - 1);
      paint();
    }

    if (dots) {
      cards.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'proj-dot';
        b.setAttribute('aria-label', (o.label || 'Slide') + ' ' + (i + 1));
        b.addEventListener('click', function () { idx = i; paint(); });
        dots.appendChild(b);
      });
    }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });

    /* gambar dimuat nanti, jadi ukur ulang tingginya */
    cards.forEach(function (c) {
      var im = c.querySelector('img');
      if (im && !im.complete) im.addEventListener('load', paint);
    });
    window.addEventListener('resize', paint);

    /* geser dengan sentuhan di layar kecil */
    var sx = 0, dx = 0, on = false;
    track.addEventListener('touchstart', function (e) {
      on = true; sx = e.touches[0].clientX; dx = 0;
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      if (on) dx = e.touches[0].clientX - sx;
    }, { passive: true });
    track.addEventListener('touchend', function () {
      if (!on) return;
      on = false;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    });

    paint();
    return { go: go, paint: paint };
  }

  makeSlider({
    track: '#projTrack', card: '.proj-card', prev: '#projPrev', next: '#projNext',
    dots: '#projDots', count: '#projCount', label: 'Proyek',
  });
  makeSlider({
    track: '#skillTrack', card: '.skill-card', prev: '#skillPrev', next: '#skillNext',
    dots: '#skillDots', count: '#skillCount', label: 'Kemampuan',
  });

  /* ---------------- SALIN EMAIL ---------------- */
  var copy = $('#copyMail');
  if (copy) {
    copy.addEventListener('click', function () {
      var mail = copy.getAttribute('data-mail');
      var done = function () {
        var id = copy.querySelector('.loc-id'), en = copy.querySelector('.loc-en');
        if (id) id.textContent = 'Tersalin!';
        if (en) en.textContent = 'Copied!';
        setTimeout(function () {
          if (id) id.textContent = 'Salin alamat';
          if (en) en.textContent = 'Copy address';
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(done, done);
      } else { done(); }
    });
  }
})();
