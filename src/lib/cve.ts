export const slugOf = (id: string) => id.toLowerCase();

// Defense-in-depth: external reference URLs (e.g. from upstream CVE records)
// must never be rendered as an <a href> unless they are plain http(s) links.
// This blocks javascript:/data:/vbscript: and other script-executing schemes
// from ever reaching a clickable link on the page.
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== 'string' || !href) return false;
  try {
    const u = new URL(href);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function topScore(c: any): number | null {
  const s = Math.max(c?.cvss?.v4 ?? 0, c?.cvss?.v31 ?? 0);
  return s > 0 ? s : null;
}

export function severity(score: number | null): { label: string; trLabel: string; dot: string; text: string; border: string; emphasize: boolean } {
  if (score == null) return { label: 'N/A', trLabel: 'Belirsiz', dot: 'bg-faint', text: 'text-faint', border: 'border-l-line', emphasize: false };
  if (score >= 9) return { label: 'Critical', trLabel: 'Kritik', dot: 'bg-critical', text: 'text-critical', border: 'border-l-critical', emphasize: true };
  if (score >= 7) return { label: 'High', trLabel: 'Yüksek', dot: 'bg-high', text: 'text-high', border: 'border-l-high', emphasize: true };
  if (score >= 4) return { label: 'Medium', trLabel: 'Orta', dot: 'bg-medium', text: 'text-medium', border: 'border-l-line', emphasize: false };
  return { label: 'Low', trLabel: 'Düşük', dot: 'bg-low', text: 'text-low', border: 'border-l-line', emphasize: false };
}

export const STATUS: Record<string, { tr: string; en: string; text: string }> = {
  patched: { tr: 'Yamalandı', en: 'Patched', text: 'text-patched' },
  unpatched: { tr: 'Yaması bulunmuyor', en: 'No patch available', text: 'text-critical' },
  unknown: { tr: 'Belirtilmedi', en: 'Not stated', text: 'text-faint' },
};

export const codeLang = (l: string) =>
  ({ Shell: 'bash', Bash: 'bash', C: 'c', Python: 'python', JavaScript: 'javascript', Electron: 'javascript' } as Record<string, string>)[l] ?? 'text';
