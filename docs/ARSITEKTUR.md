# Arsitektur

Gambaran struktur dan alur data portofolio.

## Alur data

```
content/*.json   ─┐
public/media/    ─┼─>  astro build  ─>  dist/  ─>  GitHub Actions  ─>  GitHub Pages
src/             ─┘
```

Tidak ada server dan tidak ada basis data. Situs berdiri sebagai berkas statis hasil build, sehingga seluruh isi sebenarnya berasal dari folder `content/` dan `public/media/`. Panel admin hanya menulis ke dua folder itu, lalu build yang menerjemahkannya menjadi HTML.

## Struktur folder

```
astro.config.mjs      konfigurasi Astro dan base path
package.json          skrip npm
.github/workflows/    alur deploy GitHub Actions
content/              sumber konten dua bahasa
  site.json           identitas, kontak, tautan, kalimat hero, data ringkas
  labels.json         label menu, judul bagian, tombol
  work.json           daftar proyek
  experience.json     riwayat pekerjaan
  skills.json         kelompok keahlian
  credentials.json    pendidikan dan sertifikasi
  awards.json         apresiasi
  writing.json        daftar tulisan
  albums.json         album foto
public/
  media/              seluruh gambar
  fonts/              berkas font
  app.js              perilaku situs di sisi klien
  favicon.svg
src/
  pages/index.astro   satu halaman utama
  components/         Nav, Footer
  styles/             layout.css, sections.css, work.css
admin/
  server.mjs          server lokal untuk API konten, media, cadangan, build
  ui/                 antarmuka panel
docs/                 dokumentasi ini
dist/                 hasil build, masuk .gitignore
.admin-backups/       cadangan otomatis panel, masuk .gitignore
```

## Satu halaman

Seluruh situs berada di `src/pages/index.astro` yang menghasilkan satu `index.html`. Setiap bagian (hero, kerja, tentang, karya, galeri, kredensial, tulisan, kontak) adalah bagian berurutan dalam berkas yang sama, sehingga tidak ada perpindahan halaman dan seluruh isi bisa dimuat sekaligus.

## Konfigurasi penting

```js
// astro.config.mjs
site: 'https://rizlmaulanaa.github.io',
base: '/portofolio',
trailingSlash: 'ignore',
build: { assets: 'assets' },
```

`base` harus selaras dengan nama repository. GitHub Pages menyajikan repository `portofolio` pada `rizlmaulanaa.github.io/portofolio/`, jadi mengganti nama repo berarti mengubah `base`, URL tautan di README, dan `BASE_PATH` di `admin/server.mjs` secara bersamaan.

Konstanta `BASE_PATH` di `admin/server.mjs` dipakai panel untuk menyajikan thumbnail gambar dan memeriksa kondisi pratinjau lokal.

## Dua bahasa

Setiap teks tampil dua versi dalam elemen berpasangan dengan kelas `loc-id` dan `loc-en`. Perpindahan bahasa dilakukan oleh `public/app.js` lewat penyimpanan `rm-lang` di localStorage, tanpa memuat ulang halaman. Struktur JSON mengikuti pola yang sama: setiap teks adalah objek `{ "id": "...", "en": "..." }`.

Karena tidak ada proses render ulang, kedua versi teks selalu ada di HTML. CSS menentukan mana yang terlihat, sehingga penelusuran mesin pencari tetap membaca keduanya.

## Perilaku sisi klien

`public/app.js` menangani seluruh interaksi tanpa pustaka luar:

- memunculkan elemen saat masuk viewport
- penyaringan berkas berdasarkan kategori
- panel gambar besar untuk galeri
- perpindahan bahasa
- menu layar penuh
- slider proyek dan kemampuan, termasuk seret dan jarak waktu

## Panel admin

Panel berjalan pada port terpisah dan hanya melayani `127.0.0.1`. Ia menyajikan antarmuka di `/admin` dan API berikut:

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/info` | ringkasan proyek untuk layar pembuka |
| `GET /api/content?file=` | membaca satu file konten |
| `POST /api/content` | menulis file konten, membuat cadangan, menjadwalkan build |
| `GET /api/media` | daftar berkas gambar |
| `POST /api/media?name=` | unggah gambar beserta kompresi |
| `DELETE /api/media?name=` | hapus gambar, lalu build ulang |
| `POST /api/build` | build manual |
| `GET /api/status` | kondisi sinkron, Git, pratinjau, cadangan |
| `GET /api/backups` | daftar cadangan |
| `POST /api/restore` | pulihkan satu cadangan |

Build ditunda 1,2 detik sejak simpan terakhir sehingga beberapa simpan beruntun hanya menghasilkan satu build.

## Ketergantungan

| Paket | Peran |
| --- | --- |
| `astro` | membangun situs statis |
| `sharp` | kompresi dan penskalaan gambar saat unggah |

Tidak ada pustaka front end lain. Panel admin ditulis dengan DOM API murni dan berkas JavaScript biasa tanpa tahap bundel.

## Yang tidak ikut ter-deploy

`dist/` dihasilkan ulang oleh CI, `node_modules/` dipasang saat CI, `admin/` dan `docs/` tidak masuk artifact halaman, `.admin-backups/` bersifat lokal. Artifact yang disajikan GitHub Pages hanyalah isi `dist/`.

Kembali ke [indeks dokumentasi](README.md).
