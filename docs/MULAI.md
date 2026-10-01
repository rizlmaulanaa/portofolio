# Mulai

Panduan menjalankan proyek di mesin lokal. Prasyarat: Node.js 20 atau lebih baru dan npm.

## Instalasi

```bash
cd ~/portofolio
npm install
```

Dependensi hanya Astro dan sharp (pemroses gambar), jadi instalasi ringan.

## Menjalankan

| Perintah | Fungsi | Alamat |
| --- | --- | --- |
| `npm run preview` | menyajikan hasil build statis | http://localhost:4321/ |
| `npm run admin` | panel admin untuk mengubah konten | http://localhost:4322/admin |
| `npm run dev` | mode pengembangan, pembaruan langsung | http://localhost:4321/ |
| `npm run build` | membangun `dist/` sekali jalan | tanpa server |

Untuk pekerjaan harian, jalankan dua proses berikut di dua terminal:

```bash
npm run preview
npm run admin
```

## Aturan alamat

`astro.config.mjs` tidak memakai base path karena situs disajikan di root domain `heyrm.my.id`, baik saat tayang maupun saat pratinjau lokal. `trailingSlash` disetel `ignore`, jadi alamat dengan atau tanpa garis miring di akhir sama sama sah.

Konsekuensinya:

- Pratinjau lokal terbuka di `http://localhost:4321/`.
- Semua aset disajikan dari root, tidak ada sub-folder khusus.
- Panel admin hanya mendengarkan di `127.0.0.1` dan tidak pernah ikut ter-deploy.

Jika kelak berpindah ke sub-path seperti `heyrm.my.id/portofolio`, isi `base` kembali di `astro.config.mjs` dan samakan `BASE_PATH` di `admin/server.mjs` serta `admin/ui/admin-more.js`.

## Port

| Port | Pengguna |
| --- | --- |
| 4321 | server pratinjau Astro |
| 4322 | panel admin |

Bila port terpakai, matikan proses lama terlebih dahulu lalu jalankan ulang perintahnya.

## Folder kerja

```
content/        konten dua bahasa (lihat [Arsitektur](ARSITEKTUR.md))
public/media/   seluruh foto dan gambar
src/            halaman, komponen, dan gaya
admin/          panel admin, terpisah dari situs
docs/           dokumen ini
dist/           hasil build, tidak masuk Git
```

## Masalah yang sering muncul

**Halaman 404 setelah build ulang.** Server pratinjau menyimpan referensi lama ke `dist/`. Matikan lalu jalankan ulang `npm run preview`.

**Panel admin menolak dijalankan, port 4322 terpakai.** Panel mungkin sudah berjalan dari sesi sebelumnya. Cek dengan `ss -ltnp | grep 4322`, lalu lanjutkan membuka alamatnya tanpa menjalankan proses kedua.

**Perubahan di panel tidak muncul di situs.** Pastikan indikator di bilah atas panel sudah berubah menjadi `Tersinkron`. Jika tersangkut, klik **Bangun & terapkan**.

Selanjutnya: [Panel admin](PANEL-ADMIN.md).
