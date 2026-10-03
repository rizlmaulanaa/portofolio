import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://heyrm.my.id',
  base: '/',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets',
  },
});
