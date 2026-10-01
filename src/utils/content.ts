/**
 * Pemuat konten dari folder /content (JSON).
 * Semua teks website berasal dari sini, sehingga panel admin cukup menulis
 * ulang file JSON-nya tanpa menyentuh komponen.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'content');

function read(name: string) {
  return JSON.parse(readFileSync(join(DIR, `${name}.json`), 'utf8'));
}

export interface Loc { id: string; en: string }

export const site = read('site') as any;
export const labels = read('labels') as any;
export const work = read('work') as any[];
export const experience = read('experience') as any[];
export const skills = read('skills') as any[];
export const credentialsFile = read('credentials') as any;
export const awards = read('awards') as any[];
export const writing = read('writing') as any[];
export const albums = read('albums') as any[];

export const education = credentialsFile.education;
export const credentials = credentialsFile.credentials;
export const pending = credentialsFile.pending;

export const allPhotos = albums.flatMap((a: any) =>
  a.photos.map((p: any) => ({ ...p, album: a.id, title: a.title, kind: a.kind }))
);

export const counts = {
  photos: allPhotos.length,
  albums: albums.length,
  work: work.length,
  credentials: credentials.length,
  writing: writing.length,
};

/** Daftar file konten yang dipakai panel admin. */
export const CONTENT_FILES = [
  'site', 'labels', 'work', 'experience', 'skills',
  'credentials', 'awards', 'writing', 'albums',
] as const;

export function rawContent(name: string): any {
  return read(name);
}

export function listContentFiles(): string[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}
