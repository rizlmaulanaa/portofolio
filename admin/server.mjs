/* Panel admin, server lokal.
   Menyajikan UI di /admin dan API baca/tulis konten, kelola media, build.
   Hanya mendengarkan di localhost. */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir, stat, unlink, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, 'content');
const MEDIA_DIR = join(ROOT, 'public', 'media');
const BACKUP_DIR = join(ROOT, '.admin-backups');
const UI_DIR = join(ROOT, 'admin', 'ui');
const PORT = Number(process.env.ADMIN_PORT || 4322);
/** Harus selaras dengan `base` di astro.config.mjs. Saat ini tanpa base path,
    yaitu situs disajikan di root domain. Kosong bila konfigurasi berubah. */
const BASE_PATH = '';

const CONTENT_FILES = ['site', 'labels', 'work', 'experience', 'skills',
  'credentials', 'awards', 'writing', 'albums'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
};

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const MAX_UPLOAD = 25 * 1024 * 1024;

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function fail(res, code, message) { json(res, code, { error: message }); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_UPLOAD) { reject(new Error('File terlalu besar (maks 25 MB)')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Cadangan sekali per berkas per proses server. */
async function backup(file) {
  const src = join(CONTENT_DIR, `${file}.json`);
  if (!existsSync(src)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  try { await mkdir(BACKUP_DIR, { recursive: true }); } catch {}
  await cp(src, join(BACKUP_DIR, `${file}.${stamp}.json`));
}

async function listMedia() {
  let names = [];
  try { names = await readdir(MEDIA_DIR); } catch { return []; }
  const out = [];
  for (const n of names) {
    const p = join(MEDIA_DIR, n);
    try {
      const s = await stat(p);
      if (s.isFile()) out.push({ name: n, size: s.size, mtime: s.mtimeMs });
    } catch {}
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

/** Tulis file gambar: kompres bila JPEG/PNG, normalisasi nama. */
async function saveImage(name, buf) {
  const ext = extname(name).toLowerCase();
  if (!IMAGE_EXT.has(ext)) throw new Error(`Ekstensi tidak didukung: ${ext}`);
  const safe = basename(name).replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  const dest = join(MEDIA_DIR, safe);
  await mkdir(MEDIA_DIR, { recursive: true });

  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
    try {
      const sharp = (await import('sharp')).default;
      let img = sharp(buf, { failOn: 'none' }).rotate();
      const meta = await img.metadata();
      const long = Math.max(meta.width || 0, meta.height || 0);
      if (long > 1600) img = img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });
      const out = ext === '.png'
        ? await img.png({ compressionLevel: 9 }).toBuffer()
        : await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      const finalName = ext === '.png' ? safe : safe.replace(/\.(png|webp)$/i, '') + '.jpg';
      await writeFile(join(MEDIA_DIR, finalName), out);
      return finalName;
    } catch {
      /* sharp gagal → simpan apa adanya */
    }
  }
  await writeFile(dest, buf);
  return safe;
}

let building = false;
let lastBuild = { at: null, ok: null, reason: null };
let buildTimer = null;

function runBuild() {
  return new Promise((resolve) => {
    if (building) { resolve({ ok: false, log: 'Build sedang berjalan.' }); return; }
    building = true;
    const p = spawn('npm', ['run', 'build'], { cwd: ROOT, shell: process.platform === 'win32' });
    let log = '';
    p.stdout.on('data', (d) => { log += d.toString(); });
    p.stderr.on('data', (d) => { log += d.toString(); });
    p.on('close', (code) => {
      building = false;
      lastBuild = { at: new Date().toISOString(), ok: code === 0, reason: lastBuild.reason };
      resolve({ ok: code === 0, log: log.slice(-6000) });
    });
    p.on('error', (e) => { building = false; resolve({ ok: false, log: String(e) }); });
  });
}

/** Jadwalkan build otomatis setelah perubahan. Debounce supaya banyak
    simpan beruntun hanya memicu satu build. */
function scheduleBuild(reason) {
  lastBuild.reason = reason || 'manual';
  if (buildTimer) clearTimeout(buildTimer);
  buildTimer = setTimeout(() => {
    buildTimer = null;
    runBuild().catch(() => {});
  }, 1200);
  return { scheduled: true, delayMs: 1200 };
}

function run(cmd, args) {
  return new Promise((resolve) => {
    let out = '';
    try {
      const p = spawn(cmd, args, { cwd: ROOT });
      p.stdout.on('data', (d) => { out += d.toString(); });
      p.stderr.on('data', () => {});
      p.on('close', () => resolve(out));
      p.on('error', () => resolve(''));
    } catch { resolve(''); }
  });
}

async function gitInfo() {
  const inside = (await run('git', ['rev-parse', '--is-inside-work-tree'])).trim();
  if (inside !== 'true') return { repo: false };
  const branch = (await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).trim() || 'HEAD';
  const st = (await run('git', ['status', '--porcelain'])).split('\n').filter(Boolean);
  const ahead = (await run('git', ['rev-list', '--count', '@{u}..HEAD'])).trim();
  return {
    repo: true,
    branch,
    changed: st.length,
    pending: st.slice(0, 6),
    unpushed: /^\d+$/.test(ahead) ? Number(ahead) : 0,
  };
}

async function ping(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    const r = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    return r.ok;
  } catch { return false; }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    /* ---------- UI ---------- */
    if (path === '/admin' || path === '/admin/' || path === '/') {
      const html = await readFile(join(UI_DIR, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (path.startsWith('/admin/') && req.method === 'GET') {
      const name = basename(path);
      const file = join(UI_DIR, name);
      if (existsSync(file)) {
        const data = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        return res.end(data);
      }
      return fail(res, 404, 'Tidak ditemukan');
    }

    /* ---------- GAMBAR (dipakai UI admin; URL memuat base path situs) ---------- */
    if (path.startsWith(`${BASE_PATH}/media/`)) {
      const name = basename(path);
      if (!name || name !== basename(name)) return fail(res, 400, 'Nama tidak sah');
      const p = join(MEDIA_DIR, name);
      if (!existsSync(p)) return fail(res, 404, 'Gambar tidak ditemukan');
      const data = await readFile(p);
      res.writeHead(200, {
        'Content-Type': MIME[extname(name).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      return res.end(data);
    }

    /* ---------- API ---------- */
    if (path === '/api/info' && req.method === 'GET') {
      const items = await listMedia();
      return json(res, 200, {
        root: ROOT,
        contentFiles: CONTENT_FILES.filter((f) => existsSync(join(CONTENT_DIR, `${f}.json`))),
        mediaDir: MEDIA_DIR,
        mediaCount: items.length,
        hasDist: existsSync(join(ROOT, 'dist', 'index.html')),
        backups: existsSync(BACKUP_DIR) ? (await readdir(BACKUP_DIR)).length : 0,
      });
    }

    if (path === '/api/status' && req.method === 'GET') {
      const distIdx = join(ROOT, 'dist', 'index.html');
      const hasDist = existsSync(distIdx);
      let distAt = null;
      if (hasDist) { try { distAt = (await stat(distIdx)).mtime.toISOString(); } catch {} }
      return json(res, 200, {
        building,
        waiting: Boolean(buildTimer),
        lastBuild,
        dist: { ok: hasDist, at: distAt },
        git: await gitInfo(),
        preview: await ping(`http://127.0.0.1:4321${BASE_PATH}/`),
        mediaCount: (await listMedia()).length,
        backups: existsSync(BACKUP_DIR) ? (await readdir(BACKUP_DIR)).length : 0,
      });
    }

    if (path === '/api/content' && req.method === 'GET') {
      const name = url.searchParams.get('file') || '';
      if (!CONTENT_FILES.includes(name)) return fail(res, 400, 'Nama file tidak dikenal');
      const p = join(CONTENT_DIR, `${name}.json`);
      if (!existsSync(p)) return fail(res, 404, `${name}.json belum ada`);
      const raw = await readFile(p, 'utf8');
      res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
      return res.end(raw);
    }

    if (path === '/api/content' && req.method === 'POST') {
      const body = (await readBody(req)).toString('utf8');
      let payload;
      try { payload = JSON.parse(body); } catch { return fail(res, 400, 'Body bukan JSON'); }
      const name = payload.file;
      if (!CONTENT_FILES.includes(name)) return fail(res, 400, 'Nama file tidak dikenal');
      const text = (typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data, null, 2)).trimEnd() + '\n';
      try { JSON.parse(text); } catch (e) { return fail(res, 400, 'Isi tidak valid: ' + e.message); }
      await backup(name);
      await writeFile(join(CONTENT_DIR, `${name}.json`), text, 'utf8');
      const sync = scheduleBuild('konten: ' + name);
      return json(res, 200, { ok: true, file: name, sync });
    }

    if (path === '/api/media' && req.method === 'GET') {
      return json(res, 200, { items: await listMedia() });
    }

    if (path === '/api/media' && req.method === 'POST') {
      const body = await readBody(req);
      const name = url.searchParams.get('name') || 'upload.jpg';
      const saved = await saveImage(name, body);
      const sync = scheduleBuild('media');
      return json(res, 200, { ok: true, name: saved, sync, items: await listMedia() });
    }

    if (path === '/api/media' && req.method === 'DELETE') {
      const name = url.searchParams.get('name') || '';
      if (!name || name !== basename(name)) return fail(res, 400, 'Nama tidak sah');
      const p = join(MEDIA_DIR, name);
      if (existsSync(p)) await unlink(p);
      const sync = scheduleBuild('media');
      return json(res, 200, { ok: true, sync, items: await listMedia() });
    }

    if (path === '/api/build' && req.method === 'POST') {
      if (buildTimer) { clearTimeout(buildTimer); buildTimer = null; }
      lastBuild.reason = 'manual';
      const r = await runBuild();
      return json(res, r.ok ? 200 : 500, r);
    }

    if (path === '/api/backups' && req.method === 'GET') {
      if (!existsSync(BACKUP_DIR)) return json(res, 200, { items: [] });
      const names = await readdir(BACKUP_DIR);
      return json(res, 200, { items: names.sort().reverse() });
    }

    if (path === '/api/restore' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf8'));
      const name = basename(String(body.backup || ''));
      const src = join(BACKUP_DIR, name);
      if (!existsSync(src)) return fail(res, 404, 'Cadangan tidak ditemukan');
      const file = name.split('.')[0];
      if (!CONTENT_FILES.includes(file)) return fail(res, 400, 'Berkas tidak dikenal');
      await cp(src, join(CONTENT_DIR, `${file}.json`));
      return json(res, 200, { ok: true });
    }

    return fail(res, 404, 'Tidak ditemukan');
  } catch (e) {
    return fail(res, 500, String(e && e.message ? e.message : e));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Panel admin → http://localhost:${PORT}/admin`);
  console.log(`Root: ${ROOT}`);
});
