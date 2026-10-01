# Panel admin

Panel untuk mengubah seluruh isi portofolio tanpa menyentuh file secara langsung.

## Menjalankan

```bash
npm run admin
```

Buka http://localhost:4322/admin. Panel hanya mendengarkan di `127.0.0.1`, tidak dapat diakses dari luar mesin dan tidak ikut ter-deploy ke GitHub.

## Alur dasar

1. Pilih tab di sisi kiri.
2. Ubah teks, angka, atau foto yang diinginkan.
3. Klik **Simpan perubahan** di bilah atas.
4. Tunggu indikator sinkronisasi berubah dari `Menyinkronkan situs…` menjadi `Tersinkron HH.MM`.
5. Periksa hasilnya lewat tombol **Pratinjau**.

Setiap simpan otomatis membuat cadangan file lama di `.admin-backups/` dan memicu build ulang `dist/` dalam sekitar satu detik. Banyak simpan beruntun hanya memicu satu build karena permintaannya digabung.

Jika ada perubahan yang belum disimpan lalu Anda berpindah tab, panel menampilkan peringatan untuk mencegah perubahan hilang tanpa sengaja.

## Isi setiap tab

| Tab | Berkas | Yang bisa diubah |
| --- | --- | --- |
| Beranda | gabungan | status situs, data ringkas, daftar cadangan |
| Identitas | `site.json` | nama, email, inisial, lokasi, tautan sosial, kalimat hero, ringkasan profil |
| Teks & label | `labels.json` | seluruh label menu, judul bagian, dan tombol dalam dua bahasa |
| Karya | `work.json` | daftar proyek: judul, tahun, tautan, kategori, deskripsi, gambar, teknologi |
| Pengalaman | `experience.json` | riwayat pekerjaan: perusahaan, jabatan, periode, catatan |
| Kemampuan | `skills.json` | kelompok keahlian beserta daftar butirnya |
| Kredensial | `credentials.json` | pendidikan, sertifikasi, dan keahlian teknis |
| Apresiasi | `awards.json` | daftar penghargaan dan pengakuan |
| Tulisan | `writing.json` | artikel: judul, platform, tanggal, tautan, gambar tulisan |
| Galeri | `albums.json` | album foto: nama, jenis, urutan foto di dalam album |
| Media | folder `public/media/` | unggah, hapus, dan menyalin nama berkas gambar |
| JSON mentah | bebas pilihan | penyuntingan langsung isi file konten |

## Kolom dua bahasa

Field bertanda `ID` dan `EN` berdampingan adalah pasangan terjemahan. Keduanya harus diisi agar tidak ada kolom kosong di situs. Untuk daftar berupa banyak baris, satu baris di kolom ID harus berpasangan dengan satu baris di kolom EN pada urutan yang sama.

## Tombol dan alat

- **Simpan perubahan** di bilah atas, tersedia pada tab yang memiliki file konten.
- **Bangun & terapkan** memaksa build ulang dari file yang sudah tersimpan di disk. Tombol ini bersifat opsional karena build sudah berjalan otomatis.
- **Pratinjau** membuka situs hasil build di tab baru.
- Tombol panah dan silang pada tiap kartu untuk mengubah urutan atau menghapus item.
- Chip pada field daftar: ketik lalu tekan Enter untuk menambah, klik tanda silang di chip untuk menghapus.

## Indikator sinkronisasi

| Tampilan | Arti |
| --- | --- |
| `Tersinkron HH.MM`, hijau | build terakhir berhasil, `dist/` siap |
| `Menyinkronkan situs…`, oranye berdenyut | build sedang berjalan atau menunggu giliran |
| `Build terakhir gagal`, merah | build gagal, buka log lewat tombol Bangun & terapkan |
| `Siap, tersinkron`, hijau | tidak ada build yang tercatat pada sesi ini tetapi `dist/` ada |

Panel memeriksa status setiap tiga detik. Kartu **Status situs** di Beranda menampilkan ringkasan yang sama: waktu sinkron terakhir, kondisi pratinjau lokal, umur `dist/`, status Git, jumlah cadangan, dan jumlah gambar.

## Cadangan

Setiap simpan menyalin file lama ke `.admin-backups/` dengan stempel waktu. Untuk memulihkan:

1. Buka **Beranda**.
2. Gulir ke bagian Cadangan dan klik **Muat daftar cadangan**.
3. Klik **Pulihkan** pada cadangan yang diinginkan.
4. Panel memuat ulang seluruh data setelah pemulihan.

Folder ini tidak masuk Git sehingga tidak ikut ter-deploy dan tidak mengotori riwayat.

## Media

- Unggah lewat zona berkas di tab Media, bisa dengan menyeret file atau memilih lewat dialog.
- Gambar JPEG, PNG, dan WebP dikompresi ulang: sisi terpanjang dibatasi 1600 piksel dan JPEG dikonversi ke kualitas 82. File hasil selalu berformat `.jpg` kecuali PNG asli.
- Maksimal 25 MB per unggah.
- Tombol **Salin** menyalin nama berkas persis seperti yang ditulis file konten, misalnya untuk diisi ke field gambar pada tab Karya atau Galeri.
- Setelah unggah atau penghapusan, build ulang juga berjalan otomatis karena gambar ikut masuk ke `dist/`.

## Batasan

- Panel hanya melayani berkas dari `content/*.json` yang memang dikenal. Berkas lain tidak dapat ditulis lewat panel.
- Penyuntingan bebas struktur data dilakukan lewat tab JSON mentah. Gunakan dengan hati hati, kesalahan struktur akan ditolak sebelum file tertulis.

Selanjutnya: [Update dan deploy](UPDATE.md).
