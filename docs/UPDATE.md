# Update dan deploy

Alur lengkap dari perubahan konten sampai tayang di https://heyrm.my.id/.

## Ringkasan

Ubah konten → simpan di panel → build lokal otomatis → commit dan push → GitHub Actions men deploy → tayang dalam satu sampai dua menit.

## Langkah rinci

### 1. Siapkan lingkungan lokal

```bash
npm run preview     # terminal pertama
npm run admin       # terminal kedua
```

### 2. Ubah konten

Buka http://localhost:4322/admin, sunting pada tab yang sesuai, lalu klik **Simpan perubahan**. Tunggu indikator berubah menjadi `Tersinkron`.

### 3. Periksa hasil

Klik **Pratinjau** dan telusuri halaman yang berubah. Pastikan kolom bahasa Indonesia dan Inggris sama sama terisi.

### 4. Terbitkan

```bash
cd ~/portofolio
git add -A
git commit -m "Perbarui konten"
git push
```

### 5. Pantau deploy

Buka https://github.com/rizlmaulanaa/portofolio/actions atau lihat badge di README. Run yang selesai dengan centang hijau berarti deploy berhasil. Perubahan biasanya sudah tayang dalam satu sampai dua menit.

## Apa yang terjadi setelah push

Workflow `.github/workflows/deploy.yml` berjalan pada setiap push ke `main`:

1. Menjalankan `npm install` di Ubuntu dengan Node.js 22.
2. Menjalankan `npm run build` untuk menghasilkan `dist/`.
3. Mengunggah `dist/` sebagai artifact halaman.
4. Men deploy artifact ke GitHub Pages lewat `actions/deploy-pages`.

Seluruh proses memakan waktu sekitar 45 sampai 60 detik. Konfigurasi `build_type` pada repository sudah disetel ke `workflow`, jadi GitHub tidak menjalankan build mandiri dari isi branch.

Workflow juga dapat dijalankan manual tanpa push:

```bash
gh workflow run deploy.yml --repo rizlmaulanaa/portofolio
```

## Yang tidak perlu dilakukan

- Tidak perlu menjalankan `npm run build` sebelum push. CI yang akan membangun.
- Tidak perlu mengunggah isi `dist/`. Folder itu sengaja masuk `.gitignore`.
- Tidak perlu mengaktifkan GitHub Pages secara manual. Sudah aktif dalam mode GitHub Actions.
- Tidak perlu menekan **Bangun & terapkan** sebelum commit. Simpan di panel sudah cukup.

## Melacak kegagalan

1. Buka tab Actions pada repository.
2. Pilih run yang gagal, lalu buka langkah yang merah.
3. Umumnya kegagalan berasal dari `npm run build`, yaitu ketika file konten JSON rusak atau berkas referensi tidak ada.
4. Perbaiki lewat panel, lalu push kembali. Struktur JSON yang tidak valid biasanya sudah ditolak panel sebelum file tertulis.

Perintah cepat memeriksa riwayat dari terminal:

```bash
gh run list --repo rizlmaulanaa/portofolio --limit 5
gh run view <id> --repo rizlmaulanaa/portofolio --log-failed
```

## Git di mesin ini

gh CLI sudah terpasang di `~/.local/bin/gh` dan terautentikasi sebagai `rizlmaulanaa`, sehingga push dapat dijalankan langsung dari sesi agen. Konfigurasi yang sudah dibuat:

- Credential helper HTTPS aktif lewat `gh auth setup-git`.
- Identitas commit repo ini: `heyrm <109032002+rizlmaulanaa@users.noreply.github.com>`.
- Remote `origin` menunjuk ke `https://github.com/rizlmaulanaa/portofolio.git`.
- Tag `arsip-portofolio-lama` menyimpan riwayat portofolio versi sebelumnya.

Untuk mengganti identitas commit:

```bash
git config user.name "Nama Anda"
git config user.email "alamat@email.com"
```

## Mengembalikan ke versi lama

Riwayat portofolio sebelumnya tidak dihapus, hanya dipisahkan lewat tag:

```bash
git log arsip-portofolio-lama --oneline   # melihat riwayat lama
git show arsip-portofolio-lama:index.html # melihat berkas lama
```

Untuk mengembalikan seluruh isi branch ke riwayat lama, putuskan dulu bahwa itu memang diinginkan karena seluruh isi `main` akan ditimpa.

Kembali ke konteks lebih luas: [Arsitektur](ARSITEKTUR.md).
