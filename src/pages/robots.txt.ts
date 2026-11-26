import type { APIContext } from 'astro';

export function GET({ site }: APIContext) {
  const base = String(site).replace(/\/$/, '');
  const bots = ['*', 'Googlebot', 'Bingbot', 'GPTBot', 'PerplexityBot', 'ClaudeBot'];
  const body = bots.map((b) => `User-agent: ${b}\nAllow: /\n`).join('\n') + `\nSitemap: ${base}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
