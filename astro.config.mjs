import { defineConfig } from 'astro/config';

// base '/portofolio' agar muat di GitHub Pages: rizlmaulanaa.github.io/portofolio
export default defineConfig({
  site: 'https://rizlmaulanaa.github.io',
  base: '/portofolio',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets',
  },
});
