import type { APIContext } from 'astro';
import cves from '../data/cves.json';
import { slugOf } from '../lib/cve';

export function GET({ site }: APIContext) {
  const base = String(site).replace(/\/$/, '');
  const urls = ['/', '/tr/hakkinda', '/en/about', ...cves.map((c) => `/cve/${slugOf(c.id)}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u === '/' ? '/' : u}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
