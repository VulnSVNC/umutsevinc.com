import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import fs from 'node:fs';
import nodePath from 'node:path';
import { slugOf } from './cve';

// Write-up markdown files are mostly authored locally, but some are fetched
// automatically and unattended (scripts/sync-cves.mjs pulls README.md from
// github.com/VulnSVNC/<CVE-ID> on a daily cron, with no human review before
// the next deploy). Markdown allows raw HTML to pass straight through, so
// without sanitizing the rendered output here, a compromised/renamed source
// repo could inject a live <script>, an event handler, or a javascript: URL
// into every visitor's page. Allow only the tags/attributes these reports
// actually use (headings, tables, code blocks, links, images, lists, etc.)
// and strip everything else, including inline event handlers and
// non-http(s) URL schemes.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'strong', 'em', 'del', 'b', 'i', 'u', 'sup', 'sub',
    'a', 'img',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'id'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['class'], // marked/highlighters use class="language-xxx"
    span: ['class'],
    th: ['align'],
    td: ['align'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  disallowedTagsMode: 'discard',
  allowProtocolRelative: false,
};

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
  const html = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
