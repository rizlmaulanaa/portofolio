/**
 * BASE_URL dari Astro bisa berakhir dengan atau tanpa garis miring,
 * tergantung konfigurasi. Helper ini memastikan hasilnya selalu benar
 * sehingga tidak pernah muncul "mediafoo.jpg" atau sejenisnya.
 */
const env = (import.meta as any).env ?? {};
const RAW: string = env.BASE_URL || '/';

export function asset(path: string): string {
  const p = String(path).replace(/^\/+/, '');
  const base = RAW.endsWith('/') ? RAW : RAW + '/';
  return base + p;
}

export function link(path: string): string {
  return asset(path);
}
