import { defineConfig } from 'astro/config';

// Tanpa base path: situs disajikan di root domain heyrm.my.id (GitHub Pages
// dengan custom domain selalu menyajikan isi repo di root).
export default defineConfig({
  site: 'https://heyrm.my.id',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets',
  },
});
