# Portofolio Rizal Maulana

Situs portofolio pribadi dengan panel admin lokal. Dibangun dengan Astro dan berjalan statis.

- Situs: https://rizlmaulanaa.github.io/portofolio/
- Basis path: `/portofolio` (diatur di `astro.config.mjs`)
- Sumber konten: `content/*.json` (teks, dua bahasa) dan `public/media/` (foto)
- Panel admin: `admin/` (server lokal, bukan bagian dari situs yang dideploy)

## Menjalankan

```bash
npm install        # sekali saja
npm run preview    # situs di http://localhost:4321/portofolio/
npm run admin      # panel admin di http://localhost:4322/admin
npm run dev        # mode pengembangan dengan pembaruan langsung
```

Selalu akses lewat sub-path `/portofolio/`. Membuka `/` akan berakhir di halaman 404 karena konfigurasi base path.

## Panel admin

Buka `http://localhost:4322/admin`. Semua bagian situs bisa diubah dari sana:

| Tab | Isi |
| --- | --- |
| Identitas | nama, kontak, tautan sosial, kalimat hero |
| Teks & label | seluruh label menu dan judul bagian, ID dan EN |
| Karya, Pengalaman, Kemampuan | daftar isi bagian kerja dan tentang |
| Kredensial, Apresiasi, Tulisan | sertifikasi, penghargaan, artikel |
| Galeri, Media | album foto dan unggah gambar |
| JSON mentah | penyuntingan langsung file konten |

Setiap simpan membuat cadangan di `.admin-backups/` dan memicu build ulang `dist/` secara otomatis dalam sekitar satu detik. Status sinkronisasi terlihat di bilah atas panel.

## Alur update

1. Ubah konten lewat panel admin, lalu klik **Simpan perubahan**.
2. Tunggu indikator di bilah atas berubah menjadi **Tersinkron**.
3. Periksa hasilnya lewat tombol **Pratinjau**.
4. Jalankan perintah berikut untuk menerbitkan:

```bash
git add -A
git commit -m "Perbarui konten"
git push
```

GitHub Actions membangun ulang dan men deploy otomatis ke GitHub Pages setiap push ke `main`. Perubahan biasanya tampil dalam satu sampai dua menit.

## Struktur

```
content/        data konten dua bahasa (site, labels, work, experience, skills,
                credentials, awards, writing, albums)
public/media/   foto dan gambar
src/            komponen, halaman, dan gaya Astro
admin/          panel admin lokal
.github/        alur deploy GitHub Actions
```

## Catatan

- Jangan mengubah `base` di `astro.config.mjs` kecuali nama repo juga diganti, karena keduanya harus cocok.
- `node_modules/`, `dist/`, `.astro/`, dan `.admin-backups/` tidak ikut di-commit.
- Panel admin hanya mendengarkan di `127.0.0.1` dan tidak ikut ter-deploy.
