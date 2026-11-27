import { marked } from 'marked';
import fs from 'node:fs';
import nodePath from 'node:path';
import { slugOf } from './cve';

// Resolved against the project root (the cwd `astro build`/`astro dev` runs from),
// not against import.meta.url — once bundled, this module's own file moves into
// dist/chunks/ and a path relative to it would no longer point at src/data/writeups.
const writeupsDir = nodePath.join(process.cwd(), 'src/data/writeups');
const writeupsEnDir = nodePath.join(process.cwd(), 'src/data/writeups-en');

export function readWriteup(id: string, lang: 'tr' | 'en' = 'tr'): string | null {
  const dir = lang === 'en' ? writeupsEnDir : writeupsDir;
  const file = nodePath.join(dir, `${slugOf(id)}.md`);
  if (!fs.existsSync(file)) return null;
  const md = fs.readFileSync(file, 'utf-8');
  return marked.parse(md, { async: false }) as string;
}
