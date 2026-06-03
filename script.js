// Nama :  Rizal Maulana
// NIM : 250401010197
// Kelas : IF201-PJJ Informatika
// Mata Kuliah : Pemrograman Web I

// DETEKSI EDIT MODE DENGAN PARAMETER ATAU #zalhere
// Fitur edit hanya muncul ketika diakses via localhost/127.0.0.1, atau hash spesifik #zalhere / #edit
function isEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasEditParam = urlParams.get('edit') === 'true' || 
                         window.location.hash === '#edit' || 
                         window.location.hash === '#zalhere';
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return isLocalhost || hasEditParam;
}

document.addEventListener('DOMContentLoaded', () => {
    
    // PEMELIHARA DATA LOKAL MEDIA
    let localPhotos = JSON.parse(localStorage.getItem('rm-gallery-photos')) || [];

    // Mengontrol visibilitas tombol tambah foto berdasarkan mode edit atau hash #zalhere
    const placeholderTrigger = document.getElementById('add-photo-placeholder');
    if (placeholderTrigger) {
        if (isEditMode()) {
            placeholderTrigger.style.display = 'flex';
        } else {
            placeholderTrigger.style.setProperty('display', 'none', 'important');
        }
    }

    // Toggle kelas bodi jika edit mode aktif untuk trigger CSS
    if (isEditMode()) {
        document.body.classList.add('edit-active-mode');
    }

    // Menginisialisasi komponen utama portofolio berkelanjutan
    initLanguageSwitcher();
    initTypewriter();
    initCounters();
    initScrollFade();
    initNavbar();
    initMobileNav();

    // Membuka database kustom lokal Rizal (tambahan data & data terhapus)
    loadPersistedCustomExperiences();
    loadPersistedCustomAcademics();
    loadPersistedCustomBootcamps();
    loadPersistedCustomCerts();
    loadPersistedStaticDeletedItems();

    initGalleryFilters();
    initLightbox();
    initDragAndDropUpload(localPhotos);
    initContactForm();
    initAdminItemsModal();
    loadPersistedGallery(localPhotos);

    // Suntik tombol-tombol kontrol hapus data
    setupEditModeControls();

    // Pantau perubahan hash URL secara dinamis tanpa muat ulang halaman
    window.addEventListener('hashchange', () => {
        const activeEdit = isEditMode();
        const trigger = document.getElementById('add-photo-placeholder');
        if (trigger) {
            if (activeEdit) {
                trigger.style.display = 'flex';
                document.body.classList.add('edit-active-mode');
            } else {
                trigger.style.setProperty('display', 'none', 'important');
                document.body.classList.remove('edit-active-mode');
            }
        }
        setupEditModeControls();
    });

});

// 1. PENGELOLA MULTI-BAHASA (ID & EN TOGGLE)
function initLanguageSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    // Baca preferensi bahasa pengguna dari Local Storage, aslinya Bahasa Indonesia ('lang-id')
    let currentLang = localStorage.getItem('rm-preference-lang') || 'lang-id';
    document.body.className = currentLang;

    switcher.addEventListener('click', () => {
        if (document.body.classList.contains('lang-id')) {
            document.body.classList.replace('lang-id', 'lang-en');
            localStorage.setItem('rm-preference-lang', 'lang-en');
        } else {
            document.body.classList.replace('lang-en', 'lang-id');
            localStorage.setItem('rm-preference-lang', 'lang-id');
        }
    });
}

// 2. EFEK MESIN TYPEWRITER (HERO ROLE TEXT)
function initTypewriter() {
    const typewriterElement = document.getElementById('typewriter');
    if (!typewriterElement) return;

    // Kumpulan peran karir dalam Bahasa Indonesia & Inggris (Bilingual)
    const idRoles = ['IT Support Tech', 'IT Cybersecurity', 'E-Commerce Admin'];
    const enRoles = ['IT Support Specialist', 'Cybersecurity Auditor', 'E-Commerce Operations'];

    let wordIndex = 0;
    let characterIndex = 0;
    let isDeleting = false;
    let isPaused = false;

    // Memilih daftar kata yang sesuai berdasarkan preferensi bahasa tubuh
    function getRoleList() {
        return document.body.classList.contains('lang-en') ? enRoles : idRoles;
    }

    function typeEffect() {
        if (isPaused) return;

        const rolesList = getRoleList();
        const currentRole = rolesList[wordIndex];

        if (!isDeleting) {
            // Proses mengetik maju ke depan
            typewriterElement.textContent = currentRole.slice(0, ++characterIndex);
            
            if (characterIndex === currentRole.length) {
                isPaused = true;
                // Memberikan jeda baca setelah kata selesai terbentuk sempurna
                setTimeout(() => {
                    isDeleting = true;
                    isPaused = false;
                    typeEffect();
                }, 2000);
                return;
            }
        } else {
            // Efek menghapus karakter mundur
            typewriterElement.textContent = currentRole.slice(0, --characterIndex);
            
            if (characterIndex === 0) {
                isDeleting = false;
                // Lanjut ke indeks kata berikutnya dalam perulangan tak terbatas
                wordIndex = (wordIndex + 1) % rolesList.length;
            }
        }

        // Kecepatan menghapus sengaja dibuat lebih cepat daripada kecepatan mengetik
        setTimeout(typeEffect, isDeleting ? 40 : 80);
    }

    typeEffect();

    // Memantau apabila bahasa diganti di tengah jalan, langsung hapus pengetikan untuk sinkronisasi
    const switcher = document.getElementById('lang-switcher');
    if (switcher) {
        switcher.addEventListener('click', () => {
            characterIndex = 0;
            isDeleting = false;
            typewriterElement.textContent = '';
        });
    }
}

// 3. ANIMASI NOMINAL STATISTIK (COUNTER STATS)
function initCounters() {
    const elementsToCount = document.querySelectorAll('[data-count]');
    
    // IntersectionObserver akan mendeteksi ketika counter memasuki wilayah mata
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const element = entry.target;
            const targetNumber = parseInt(element.dataset.count, 10);
            const prefixSuffix = element.dataset.suffix || '';
            let currentProgress = 0;
            const progressStep = Math.ceil(targetNumber / 40); // 40 step animasi

            const interval = setInterval(() => {
                currentProgress = Math.min(currentProgress + progressStep, targetNumber);
                element.textContent = currentProgress + prefixSuffix;
                
                if (currentProgress >= targetNumber) {
                    clearInterval(interval);
                }
            }, 30);

            // Batalkan pengamatan agar perhitungan animasi hanya berlari satu kali saja
            observer.unobserve(element);
        });
    }, { threshold: 0.5 }); // Memulai ketika setengah tinggi kotak nampak

    elementsToCount.forEach(el => observer.observe(el));
}

// 4. DETEKSI SCROLL & TRANSISI MEMUDAR (SCROLL FADE-IN)
function initScrollFade() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Hanya transisi memudar sekali saja
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => observer.observe(el));
}

// 5. MODERASI BILAH NAVBAR (SCROLL & ANCHOR TRACKING)
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        // Tambahkan efek bayangan halus & blur jika telah digeser melewati kedalaman 40 piksel
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    // Menandai tautan navbar yang aktif sesuai dengan section yang sedang terbaca
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const sectionId = entry.target.id;
            
            navLinks.forEach(link => {
                const targetHref = link.getAttribute('href');
                link.classList.toggle('active', targetHref === '#' + sectionId);
            });
        });
    }, { rootMargin: '-30% 0px -60% 0px' }); // Margin observasi horizontal atas-bawah

    document.querySelectorAll('section[id]').forEach(section => sectionObserver.observe(section));
}

// 6. MENU NAVIGASI PONSEL (MOBILE NAV DESIGN)
function initMobileNav() {
    const navToggleBtn = document.getElementById('nav-toggle');
    const navLinksContainer = document.getElementById('nav-links');
    if (!navToggleBtn || !navLinksContainer) return;

    navToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinksContainer.classList.toggle('open');
    });

    // Otomatis menutup tirai menu mobile setelah tautan ditekan
    navLinksContainer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('open');
        });
    });

    // Menutup tirai jika mengklik di luar area menu link
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#navbar')) {
            navLinksContainer.classList.remove('open');
        }
    });
}



// 8. FILTER PENYARING GALERI (CATEGORY SELECTOR)
function initGalleryFilters() {
    const buttons = document.querySelectorAll('.f-btn');
    const mPlaceholders = document.querySelectorAll('.m-placeholder');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Hapus status lencana penanda aktif sebelumnya
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            const targetCategory = button.getAttribute('data-filter');
            const items = document.querySelectorAll('.m-item[data-cat]');

            // Tampilkan atau sembunyikan sesuai nama lencana terpilih
            items.forEach(item => {
                const itemCat = item.getAttribute('data-cat');
                if (targetCategory === 'all' || itemCat === targetCategory) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            // Lakukan regulasi tampilan untuk kotak upload baru
            mPlaceholders.forEach(ph => {
                if (isEditMode()) {
                    ph.style.display = (targetCategory === 'all' || targetCategory === 'kegiatan') ? 'flex' : 'none';
                } else {
                    ph.style.setProperty('display', 'none', 'important');
                }
            });
        });
    });
}

// 9. PEMBESAR GAMBAR FULLSCREEN (LIGHTBOX SLIDER)
function initLightbox() {
    const lightboxModal = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lb-img');
    const lightboxCaption = document.getElementById('lb-caption');
    const closeBtn = document.getElementById('lb-close');
    const prevBtn = document.getElementById('lb-prev');
    const nextBtn = document.getElementById('lb-next');

    if (!lightboxModal || !lightboxImg) return;

    let activeItemsList = [];
    let activeImageIndex = 0;

    // Memuat daftar seluruh gambar galeri yang sedang aktif terlihat di layar saat ini
    function reloadActiveItemsList() {
        const queryItems = document.querySelectorAll('.m-item[data-src]');
        activeItemsList = Array.from(queryItems).filter(item => item.style.display !== 'none');
    }

    function launchLightbox(indexToOpen) {
        reloadActiveItemsList();
        if (indexToOpen < 0 || indexToOpen >= activeItemsList.length) return;
        
        activeImageIndex = indexToOpen;
        const currentTargetItem = activeItemsList[activeImageIndex];

        lightboxImg.src = currentTargetItem.getAttribute('data-src');
        lightboxCaption.textContent = currentTargetItem.getAttribute('data-caption') || '';
        
        lightboxModal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Kancing baris gulung latar belakang
    }

    function switchPhoto(directionStep) {
        reloadActiveItemsList();
        if (!activeItemsList.length) return;

        activeImageIndex = (activeImageIndex + directionStep + activeItemsList.length) % activeItemsList.length;
        const nextItem = activeItemsList[activeImageIndex];

        lightboxImg.src = nextItem.getAttribute('data-src');
        lightboxCaption.textContent = nextItem.getAttribute('data-caption') || '';
    }

    // Menggantung aksi memicu lightbox ketika mendeteksi instruksi klik pada item galeri
    document.addEventListener('click', (event) => {
        const itemClicked = event.target.closest('.m-item[data-src]');
        if (!itemClicked) return;

        reloadActiveItemsList();
        const detectedIndex = activeItemsList.indexOf(itemClicked);
        if (detectedIndex !== -1) {
            launchLightbox(detectedIndex);
        }
    });

    // Menghubungkan fungsi klik penutup lightbox modal
    closeBtn.addEventListener('click', () => {
        lightboxModal.classList.remove('open');
        document.body.style.overflow = ''; // Luncurkan kembali gulir tubuh
    });

    // Interaktivitas penutup jika wilayah kosong luar gambar ditekan
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            closeBtn.click();
        }
    });

    // Navigasi kiri kustom
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchPhoto(-1);
    });

    // Navigasi kanan kustom
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchPhoto(1);
    });

    // Pengelolaan via input keyboard laptop
    document.addEventListener('keydown', (e) => {
        if (!lightboxModal.classList.contains('open')) return;
        
        if (e.key === 'Escape') {
            closeBtn.click();
        } else if (e.key === 'ArrowLeft') {
            switchPhoto(-1);
        } else if (e.key === 'ArrowRight') {
            switchPhoto(1);
        }
    });
}

// 10. MODEL UNGGAH BERKAS DRAG & DROP (PERSISTENT GALLERY UPLOADS)
function initDragAndDropUpload(localPhotos) {
    const placeholderTrigger = document.getElementById('add-photo-placeholder');
    const uploadDialogModal = document.getElementById('upload-dialog');
    const closeDialogBtn = document.getElementById('upload-dialog-close');
    const dragZone = document.getElementById('upload-drag-zone');
    const fileInputField = document.getElementById('upload-file-input');
    
    const previewZoneArea = document.getElementById('upload-preview-area');
    const previewImageHolder = document.getElementById('upload-preview-img');
    const discardPreviewBtn = document.getElementById('remove-preview-btn');
    
    const uploadForm = document.getElementById('gallery-upload-form');

    if (!placeholderTrigger || !uploadDialogModal) return;

    let base64ResultImage = '';

    // Menampilkan kotak modal form
    placeholderTrigger.addEventListener('click', () => {
        uploadDialogModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    });

    // Menyembunyikan modal form
    closeDialogBtn.addEventListener('click', () => {
        uploadDialogModal.classList.remove('open');
        document.body.style.overflow = '';
        resetUploadFormState();
    });

    // Menutup tirai modal jika pengirim menekan area hitam luar formulir
    uploadDialogModal.addEventListener('click', (event) => {
        if (event.target === uploadDialogModal) {
            closeDialogBtn.click();
        }
    });

    function resetUploadFormState() {
        uploadForm.reset();
        base64ResultImage = '';
        previewImageHolder.src = '';
        previewZoneArea.classList.add('hidden');
        dragZone.classList.remove('hidden');
        dragZone.classList.remove('dragover');
    }

    // Memicu jendela penjelajah Windows saat kotak seret diklik
    dragZone.addEventListener('click', () => {
        fileInputField.click();
    });

    // Membaca berkas gambar yang didapatkan dari interaksi drag-drop
    function readDroppedFile(fileObject) {
        if (!fileObject || !fileObject.type.startsWith('image/')) return;

        const imageReader = new FileReader();
        imageReader.onload = (loadedEvent) => {
            base64ResultImage = loadedEvent.target.result;
            
            // Perbaharui pratinjau thumbnail
            previewImageHolder.src = base64ResultImage;
            dragZone.classList.add('hidden');
            previewZoneArea.classList.remove('hidden');
        };
        imageReader.readAsDataURL(fileObject);
    }

    // Mengkoordinasi masukan file input penjelajah standar
    fileInputField.addEventListener('change', (e) => {
        const chosenFile = e.target.files[0];
        if (chosenFile) {
            readDroppedFile(chosenFile);
        }
    });

    // Efek visual pergantian warna ketika proses seret melayang di atas wilayah dropbox
    dragZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragZone.classList.add('dragover');
    });

    dragZone.addEventListener('dragleave', () => {
        dragZone.classList.remove('dragover');
    });

    dragZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragZone.classList.remove('dragover');
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            readDroppedFile(droppedFile);
        }
    });

    // Batal memilih gambar pratinjau
    discardPreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUploadFormState();
    });

    // Memproses pengiriman formulir gambar baru untuk segera digabungkan
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const inputCaption = document.getElementById('form-photo-caption').value.trim();
        const inputCategory = document.getElementById('form-photo-category').value;

        if (!base64ResultImage) {
            alert('Silakan seret atau pilih gambar terlebih dahulu sebelum menyimpan!');
            return;
        }

        // Susun objek data meta gambar baru
        const photoObjectPayload = {
            id: 'local_' + Date.now(),
            src: base64ResultImage,
            caption: inputCaption,
            category: inputCategory
        };

        // Rekatkan objek baru ke dalam susunan data local storage saat ini
        localPhotos.push(photoObjectPayload);
        localStorage.setItem('rm-gallery-photos', JSON.stringify(localPhotos));

        // Inject / Masukkan item baru secara dinamis ke halaman web
        appendPhotoElementToMasonry(photoObjectPayload);

        // Berikan sinyal penutupan dialog aman
        closeDialogBtn.click();
    });
}

// 11. PENAMPIL DINAMIS GALERI INTEGRAL (DYNAMIC FEED)
function loadPersistedGallery(localPhotos) {
    if (!localPhotos.length) return;
    localPhotos.forEach(photo => {
        appendPhotoElementToMasonry(photo);
    });
}

// Menghasilkan struktur fisik HTML item gambar ke dalam galeri bento
function appendPhotoElementToMasonry(photoObject) {
    const masonryWrapper = document.getElementById('gallery-masonry-wrapper');
    const placeholderItem = document.getElementById('add-photo-placeholder');
    if (!masonryWrapper || !placeholderItem) return;

    // Membangun elemen pembungkus bento item baru
    const photoFrame = document.createElement('div');
    photoFrame.className = 'm-item';
    photoFrame.setAttribute('data-src', photoObject.src);
    photoFrame.setAttribute('data-caption', photoObject.caption);
    photoFrame.setAttribute('data-cat', photoObject.category);

    // Menyisipkan gambar
    const imgElement = document.createElement('img');
    imgElement.src = photoObject.src;
    imgElement.alt = photoObject.caption;
    imgElement.setAttribute('referrerpolicy', 'no-referrer');

    // Menyulam overlay judul teks saat disorot kursor
    const overlayElement = document.createElement('div');
    overlayElement.className = 'm-overlay';

    const captionSpan = document.createElement('span');
    captionSpan.className = 'm-cap font-mono';
    captionSpan.textContent = photoObject.caption;

    overlayElement.appendChild(captionSpan);
    photoFrame.appendChild(imgElement);
    photoFrame.appendChild(overlayElement);

    // Memasukkan item baru tepat sebelum blok tombol "+ Tambah Foto" (placeholder)
    masonryWrapper.insertBefore(photoFrame, placeholderItem);
}

// 12. FORMULIR KONTAK DENGAN NOTIFIKASI SUKSES (CONTACT HANDLER)
function initContactForm() {
    const contactFormElement = document.getElementById('contact-form');
    const successAlertBox = document.getElementById('contact-success-alert');
    if (!contactFormElement) return;

    contactFormElement.addEventListener('submit', (e) => {
        e.preventDefault();

        // Ambil elemen isian
        const clientName = document.getElementById('f-name').value.trim();
        const clientEmail = document.getElementById('f-email').value.trim();
        const missionSubject = document.getElementById('f-subject').value.trim();
        const missionPayload = document.getElementById('f-message').value.trim();

        // Validasi isian formulir dasar secara aman
        if (!clientName || !clientEmail || !missionPayload) {
            alert('Mohon lengkapi bagian dengan tanda bintang (*) sebelum meluncurkan pengiriman!');
            return;
        }

        // Bentuk susunan badan email operasional yang sangat rapi
        const defaultRecipient = 'rizal144maulana@gmail.com';
        const formattedSubject = missionSubject || `Hubungan Aliansi Kerja dari ${clientName}`;
        
        const structuredEmailBody = `======================================================
RIZAL MAULANA ENGAGEMENT DISPATCH: DIRECT TASK BRIEF
======================================================

SENDER COORDINATES:
-------------------
* Operator / Name   : ${clientName}
* Response Address  : ${clientEmail}

MISSION CONTROL SUBJECT:
------------------------
* Subject / Theme   : ${formattedSubject}

MISSION SCHEMATICS TARGET DETAILS:
----------------------------------
${missionPayload}

------------------------------------------------------
[DISPATCHED VIA RM-CYBERSEC PROFESSIONAL WEB CONTROLS]`;

        const encodedSubject = encodeURIComponent(formattedSubject);
        const encodedBody = encodeURIComponent(structuredEmailBody);

        // Hubungkan ke link transmisi mailto lokal browser
        const mailtoLink = `mailto:${defaultRecipient}?subject=${encodedSubject}&body=${encodedBody}`;

        // Kosongkan seluruh isian isian formulir setelah validasi selesai
        contactFormElement.reset();

        // Tampilkan popup notifikasi sukses secara visual beranimasi ke pengguna
        if (successAlertBox) {
            successAlertBox.classList.remove('hidden');
            
            // Geser scroll agar alert pop-up terlihat jelas oleh mata pengirim
            successAlertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Otomatis hilangkan pop-up sukses secara bersih setelah berdurasi 8 detik
            setTimeout(() => {
                successAlertBox.classList.add('hidden');
            }, 8000);
        }

        // Luncurkan alihan tautan pemicu surat kerja setelah jeda singkat
        setTimeout(() => {
            window.location.href = mailtoLink;
        }, 1200);
    });
}

// 13. SISTEM ADMINISTRATOR PORTAL #zalhere (DYNAMIC DATA ENGINES)

// Menyembunyikan elemen statis bawaan HTML yang pernah dihapus Rizal
function loadPersistedStaticDeletedItems() {
    const deletedIds = JSON.parse(localStorage.getItem('rm-deleted-static-ids')) || [];
    deletedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    });
}

// Memuat data tambahan kustom dari memori local storage
function loadPersistedCustomExperiences() {
    const list = JSON.parse(localStorage.getItem('rm-custom-experiences')) || [];
    list.forEach(exp => appendCustomExperience(exp));
}

function loadPersistedCustomAcademics() {
    const list = JSON.parse(localStorage.getItem('rm-custom-academics')) || [];
    list.forEach(acad => appendCustomAcademic(acad));
}

function loadPersistedCustomBootcamps() {
    const list = JSON.parse(localStorage.getItem('rm-custom-bootcamps')) || [];
    list.forEach(boot => appendCustomBootcamp(boot));
}

function loadPersistedCustomCerts() {
    const list = JSON.parse(localStorage.getItem('rm-custom-certs')) || [];
    list.forEach(cert => appendCustomCert(cert));
}

// Menempelkan elemen riwayat kerja baru ke timeline
function appendCustomExperience(exp) {
    const timeline = document.getElementById('experience-timeline');
    if (!timeline) return;

    const div = document.createElement('div');
    div.className = 'tl-item fade-in';
    div.id = exp.id;

    const highlightsIdHtml = exp.highlightsId.map(h => `<li>${h}</li>`).join('');
    const highlightsEnHtml = exp.highlightsEn.map(h => `<li>${h}</li>`).join('');

    div.innerHTML = `
        <div class="tl-dot"></div>
        <div class="tl-card">
            <p class="tl-period font-mono"><i class="bi bi-calendar3"></i> ${exp.period.toUpperCase()}</p>
            <h3 class="tl-role lang-id">${exp.roleId}</h3>
            <h3 class="tl-role lang-en">${exp.roleEn}</h3>
            <p class="tl-company">${exp.company}</p>
            <p class="tl-sub font-mono">[CUSTOM_EXP.LOG] SPECIAL SCHEMATICS</p>
            <ul>
                <div class="lang-id">${highlightsIdHtml}</div>
                <div class="lang-en">${highlightsEnHtml}</div>
            </ul>
        </div>
    `;
    timeline.appendChild(div);
}

// Menempelkan baris akademis baru ke tabel
function appendCustomAcademic(acad) {
    const tbody = document.getElementById('academics-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.id = acad.id;
    tr.innerHTML = `
        <td><strong class="text-white">${acad.degreeId}</strong></td>
        <td>${acad.degreeEn}</td>
        <td class="lang-id">${acad.institutionId}</td>
        <td class="lang-en">${acad.institutionEn}</td>
        <td><span class="badge-y font-mono">${acad.period}</span></td>
        <td class="text-green font-mono font-bold">${acad.status.toUpperCase()}</td>
    `;
    tbody.appendChild(tr);
}

// Menempelkan baris bootcamp baru ke tabel
function appendCustomBootcamp(boot) {
    const tbody = document.getElementById('bootcamps-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.id = boot.id;
    tr.innerHTML = `
        <td><strong class="text-white">${boot.titleId}</strong></td>
        <td>${boot.titleEn}</td>
        <td class="lang-id">${boot.providerId}</td>
        <td class="lang-en">${boot.providerEn}</td>
        <td><span class="badge-y font-mono">${boot.period}</span></td>
        <td class="text-indigo font-mono font-semibold">${boot.status.toUpperCase()}</td>
    `;
    tbody.appendChild(tr);
}

// Menempelkan baris sertifikat baru ke tabel
function appendCustomCert(cert) {
    const tbody = document.getElementById('certs-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.id = cert.id;
    tr.innerHTML = `
        <td class="font-mono text-dim">${cert.indexNum}</td>
        <td><strong class="text-white">${cert.titleId}</strong></td>
        <td>${cert.titleEn}</td>
        <td><span class="badge-i font-mono">${cert.issuer}</span></td>
        <td><span class="badge-y font-mono">${cert.date}</span></td>
    `;
    tbody.appendChild(tr);
}

// Memicu inisialisasi Modal Form Administrasi data baru
function initAdminItemsModal() {
    const modal = document.getElementById('admin-item-dialog');
    const closeBtn = document.getElementById('admin-dialog-close');
    const form = document.getElementById('admin-item-form');

    // Tombol-tombol trigger
    const triggers = [
        { id: 'btn-add-experience', type: 'experience' },
        { id: 'btn-add-academic', type: 'academic' },
        { id: 'btn-add-bootcamp', type: 'bootcamp' },
        { id: 'btn-add-cert', type: 'cert' }
    ];

    if (!modal || !form) return;

    triggers.forEach(triggerData => {
        const btn = document.getElementById(triggerData.id);
        if (btn) {
            btn.addEventListener('click', () => {
                setupAdminModalFields(triggerData.type);
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        form.reset();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBtn.click();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAdminModalData();
    });
}

// Menyesuaikan label kolom modal form input sesuai tipe data yang akan dimasukkan
function setupAdminModalFields(type) {
    document.getElementById('admin-item-type').value = type;

    const titleEl = document.getElementById('admin-modal-title');
    const lbl1 = document.getElementById('admin-lbl-field1');
    const lbl1en = document.getElementById('admin-lbl-field1-en');
    const lbl2 = document.getElementById('admin-lbl-field2');
    const lbl3 = document.getElementById('admin-lbl-field3');
    const lbl4 = document.getElementById('admin-lbl-field4');
    const lbl4en = document.getElementById('admin-lbl-field4-en');

    const g4 = document.getElementById('admin-group-field4');
    const g4en = document.getElementById('admin-group-field4-en');

    // Reset default display
    g4.style.display = 'block';
    g4en.style.display = 'block';
    document.getElementById('admin-val-field4').required = true;
    if (document.getElementById('admin-val-field4-en')) {
        document.getElementById('admin-val-field4-en').required = true;
    }

    if (type === 'experience') {
        titleEl.innerHTML = `<i class="bi bi-briefcase-fill"></i> Tambah Riwayat Kerja`;
        lbl1.textContent = "NAMA JABATAN / ROLE TITLE (INDONESIA)*";
        lbl1en.textContent = "ROLE TITLE / JABATAN (ENGLISH)*";
        lbl2.textContent = "NAMA PERUSAHAAN & LOKASI (e.g. PT Visidata Inti, Balikpapan)*";
        lbl3.textContent = "PERIODE KERJA (e.g. AGUSTUS 2021 — SEKARANG)*";
        lbl4.textContent = "RESPONSIBILITIES / HIGHLIGHTS (ID, pisahkan dengan baris baru)*";
        lbl4en.textContent = "RESPONSIBILITIES / HIGHLIGHTS (EN, pisahkan dengan baris baru)*";
    } 
    else if (type === 'academic') {
        titleEl.innerHTML = `<i class="bi bi-mortarboard-fill"></i> Tambah Riwayat Akademis`;
        lbl1.textContent = "JENJANG / GELAR AKADEMIS (INDONESIA)*";
        lbl1en.textContent = "ACADEMIC DEGREE TITLE (ENGLISH)*";
        lbl2.textContent = "NAMA INSTITUSI PENDIDIKAN (e.g. UNSIA)*";
        lbl3.textContent = "PERIODE STUDI (e.g. 2023 — Present)*";
        lbl4.textContent = "JURUSAN / KORIDIR (e.g. S1 Informatika)*";
        lbl4en.textContent = "MAJOR DESCRIPTION / DETAILS (e.g. Informatics)*";
    } 
    else if (type === 'bootcamp') {
        titleEl.innerHTML = `<i class="bi bi-rocket-takeoff-fill"></i> Tambah Riwayat Bootcamp`;
        lbl1.textContent = "NAMA PROGRAM / MATERI BOOTCAMP (INDONESIA)*";
        lbl1en.textContent = "BOOTCAMP PROGRAM TITLE (ENGLISH)*";
        lbl2.textContent = "SABUK PENYELENGGARA / INSTITUSI (e.g. CyberWarFare Labs)*";
        lbl3.textContent = "PERIODE AKTIF (e.g. 2024 - 2025)*";
        lbl4.textContent = "FOKUS KOMPETENSI / MATERI INTI (INDONESIA)*";
        lbl4en.textContent = "CORE COMPETENCY HIGHLIGHTS (ENGLISH)*";
    } 
    else if (type === 'cert') {
        titleEl.innerHTML = `<i class="bi bi-patch-check-fill"></i> Tambah Sertifikat`;
        lbl1.textContent = "NAMA LISENSI / SERTIFIKASI (INDONESIA)*";
        lbl1en.textContent = "CERTIFICATION TITLE (ENGLISH)*";
        lbl2.textContent = "PIHAK KOMPETEN PENERBIT (ISSUER)*";
        lbl3.textContent = "TANGGAL PENERBITAN (e.g. Januari 2026)*";
        lbl4.textContent = "NOMOR / ID INDIKATOR URUT (e.g. #10)*";
        
        g4en.style.display = 'none'; // English field 4 tidak dibutuhkan
        lbl4.textContent = "NOMOR INDIKATOR URUT (e.g. #10)*";
    }
}

// Menjadwalkan penyimpanan berkas data inputan form
function saveAdminModalData() {
    const type = document.getElementById('admin-item-type').value;
    const f1 = document.getElementById('admin-val-field1').value.trim();
    const f1en = document.getElementById('admin-val-field1-en').value.trim();
    const f2 = document.getElementById('admin-val-field2').value.trim();
    const f3 = document.getElementById('admin-val-field3').value.trim();
    const f4 = document.getElementById('admin-val-field4').value.trim();
    const f4en = document.getElementById('admin-val-field4-en').value.trim();

    const timestampId = `custom_${type}_${Date.now()}`;

    if (type === 'experience') {
        const payload = {
            id: timestampId,
            period: f3,
            roleId: f1,
            roleEn: f1en,
            company: f2,
            highlightsId: f4.split('\n').filter(x => x.trim()),
            highlightsEn: f4en.split('\n').filter(x => x.trim())
        };
        const list = JSON.parse(localStorage.getItem('rm-custom-experiences')) || [];
        list.push(payload);
        localStorage.setItem('rm-custom-experiences', JSON.stringify(list));
        appendCustomExperience(payload);
    } 
    else if (type === 'academic') {
        const payload = {
            id: timestampId,
            degreeId: f1,
            degreeEn: f1en,
            institutionId: f2,
            institutionEn: f2,
            period: f3,
            status: f4
        };
        const list = JSON.parse(localStorage.getItem('rm-custom-academics')) || [];
        list.push(payload);
        localStorage.setItem('rm-custom-academics', JSON.stringify(list));
        appendCustomAcademic(payload);
    } 
    else if (type === 'bootcamp') {
        const payload = {
            id: timestampId,
            titleId: f1,
            titleEn: f1en,
            providerId: f2,
            providerEn: f2,
            period: f3,
            status: f4
        };
        const list = JSON.parse(localStorage.getItem('rm-custom-bootcamps')) || [];
        list.push(payload);
        localStorage.setItem('rm-custom-bootcamps', JSON.stringify(list));
        appendCustomBootcamp(payload);
    } 
    else if (type === 'cert') {
        const payload = {
            id: timestampId,
            indexNum: f4 || '#10',
            titleId: f1,
            titleEn: f1en,
            issuer: f2,
            date: f3
        };
        const list = JSON.parse(localStorage.getItem('rm-custom-certs')) || [];
        list.push(payload);
        localStorage.setItem('rm-custom-certs', JSON.stringify(list));
        appendCustomCert(payload);
    }

    // Suntik tombol-tombol hapus ke konten yang baru dibuat
    setupEditModeControls();

    // Tutup Modal
    document.getElementById('admin-dialog-close').click();
}

// Membangun & Memantau tombol hapus data pada elemen-eleman bodi saat edit mode #zalhere aktif
function setupEditModeControls() {
    if (!isEditMode()) return;

    // 1. TAMBAH TOMBOL HAPUS UNTUK GALERI FOTO
    const photoCards = document.querySelectorAll('.m-item');
    photoCards.forEach(card => {
        if (!card.querySelector('.btn-delete-photo')) {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-delete-photo edit-only-control';
            delBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';
            delBtn.title = "Hapus Foto";
            
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Mencegah memicu modal lightbox
                if (confirm("Apakah Anda yakin ingin menghapus foto kegiatan ini?")) {
                    const cardId = card.id;
                    if (cardId && cardId.startsWith('static-photo-')) {
                        // Kasus foto statis bawaan HTML
                        const deletedStatic = JSON.parse(localStorage.getItem('rm-deleted-static-ids')) || [];
                        deletedStatic.push(cardId);
                        localStorage.setItem('rm-deleted-static-ids', JSON.stringify(deletedStatic));
                    } else {
                        // Kasus foto dinamis lokal yang baru diupload
                        let localPhotos = JSON.parse(localStorage.getItem('rm-gallery-photos')) || [];
                        const cardSrc = card.getAttribute('data-src');
                        localPhotos = localPhotos.filter(p => p.src !== cardSrc);
                        localStorage.setItem('rm-gallery-photos', JSON.stringify(localPhotos));
                    }
                    card.remove();
                }
            });
            card.appendChild(delBtn);
        }
    });

    // 2. TAMBAH TOMBOL HAPUS UNTUK CARDS TIMELINE KERJA
    const timelineCards = document.querySelectorAll('.timeline .tl-item');
    timelineCards.forEach(item => {
        const cardBody = item.querySelector('.tl-card');
        if (cardBody && !cardBody.querySelector('.timeline-delete-container')) {
            const delContainer = document.createElement('div');
            delContainer.className = 'timeline-delete-container edit-only-control';
            
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-delete-item';
            delBtn.innerHTML = '<i class="bi bi-trash"></i> Hapus';
            
            delBtn.addEventListener('click', () => {
                if (confirm("Apakah Anda yakin ingin menghapus riwayat kerja satu ini?")) {
                    const itemId = item.id;
                    if (itemId && itemId.startsWith('static-exp-')) {
                        const deletedStatic = JSON.parse(localStorage.getItem('rm-deleted-static-ids')) || [];
                        deletedStatic.push(itemId);
                        localStorage.setItem('rm-deleted-static-ids', JSON.stringify(deletedStatic));
                    } else {
                        let customList = JSON.parse(localStorage.getItem('rm-custom-experiences')) || [];
                        customList = customList.filter(exp => exp.id !== itemId);
                        localStorage.setItem('rm-custom-experiences', JSON.stringify(customList));
                    }
                    item.remove();
                }
            });
            
            delContainer.appendChild(delBtn);
            cardBody.insertBefore(delContainer, cardBody.firstChild);
        }
    });

    // 3. TAMBAH JALUR HAPUS DI BARIS AKADEMIS, BOOTCAMPS, & SERTIFIKASI
    const tableBodies = [
        { id: 'academics-tbody', storageKey: 'rm-custom-academics' },
        { id: 'bootcamps-tbody', storageKey: 'rm-custom-bootcamps' },
        { id: 'certs-tbody', storageKey: 'rm-custom-certs' }
    ];

    tableBodies.forEach(group => {
        const tbody = document.getElementById(group.id);
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                // Sisi baris pertama adalah target meletakkan tombol hapus
                const firstCell = row.cells[0];
                if (firstCell && !firstCell.querySelector('.btn-delete-item')) {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn-delete-item edit-only-control';
                    delBtn.innerHTML = '<i class="bi bi-trash"></i>';
                    delBtn.title = "Hapus Baris Ini";
                    
                    delBtn.addEventListener('click', () => {
                        if (confirm("Apakah Anda yakin ingin menghapus arsip baris data ini?")) {
                            const rowId = row.id;
                            if (rowId && rowId.startsWith('static-')) {
                                const deletedStatic = JSON.parse(localStorage.getItem('rm-deleted-static-ids')) || [];
                                deletedStatic.push(rowId);
                                localStorage.setItem('rm-deleted-static-ids', JSON.stringify(deletedStatic));
                            } else {
                                let customList = JSON.parse(localStorage.getItem(group.storageKey)) || [];
                                customList = customList.filter(item => item.id !== rowId);
                                localStorage.setItem(group.storageKey, JSON.stringify(customList));
                            }
                            row.remove();
                        }
                    });
                    
                    firstCell.appendChild(delBtn);
                }
            });
        }
    });
}

/* ============================================================
   #ZALHERE EASTER EGG
   fitur tersembunyi yang aktif saat URL hash = #zalhere.
   cara akses: buka index.html#zalhere di browser.
   ini 100% client-side, tidak butuh server, jadi bisa di GitHub Pages.
   ============================================================ */

function initZalhere() {
    const overlay = document.getElementById('zalhere-overlay');
    const closeBtn = document.getElementById('zalhere-close');
    const typingEl = document.getElementById('zl-typing');
    if (!overlay || !closeBtn) return;

    // teks yang akan diketik otomatis di baris terakhir terminal
    const secretCmd = 'rm -rf /boring_life && sudo stay_curious';
    let typed = false;

    function typeSecretCmd() {
        if (typed) return;
        typed = true;
        let i = 0;
        const iv = setInterval(() => {
            if (i <= secretCmd.length) {
                typingEl.textContent = secretCmd.slice(0, i++);
            } else {
                clearInterval(iv);
            }
        }, 55);
    }

    function openEasterEgg() {
        // hapus inline style dan class hidden agar overlay tampil
        overlay.style.display = '';
        overlay.classList.remove('zalhere-hidden');
        document.body.style.overflow = 'hidden';
        // mulai typewriter command setelah jeda kecil
        setTimeout(typeSecretCmd, 800);
    }

    function closeEasterEgg() {
        overlay.classList.add('zalhere-hidden');
        document.body.style.overflow = '';
        typed = false;
        if (typingEl) typingEl.textContent = '';
        // hapus hash dari URL tanpa reload halaman
        history.pushState('', document.title, window.location.pathname + window.location.search);
    }

    // cek saat pertama kali halaman dibuka
    if (window.location.hash === '#zalhere') {
        openEasterEgg();
    }

    // cek saat hash berubah (user mengetik #zalhere di URL bar)
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#zalhere') {
            openEasterEgg();
        }
    });

    // tutup lewat tombol close
    closeBtn.addEventListener('click', closeEasterEgg);

    // tutup lewat klik di luar terminal
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeEasterEgg();
    });

    // tutup lewat keyboard ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('zalhere-hidden')) {
            closeEasterEgg();
        }
    });
}

// jalankan inisiasi easter egg
initZalhere();
