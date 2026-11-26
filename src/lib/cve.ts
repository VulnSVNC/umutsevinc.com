export const slugOf = (id: string) => id.toLowerCase();

export function topScore(c: any): number | null {
  const s = Math.max(c?.cvss?.v4 ?? 0, c?.cvss?.v31 ?? 0);
  return s > 0 ? s : null;
}

export function severity(score: number | null): { label: string; dot: string; text: string } {
  if (score == null) return { label: 'N/A', dot: 'bg-faint', text: 'text-faint' };
  if (score >= 9) return { label: 'Critical', dot: 'bg-critical', text: 'text-critical' };
  if (score >= 7) return { label: 'High', dot: 'bg-high', text: 'text-high' };
  if (score >= 4) return { label: 'Medium', dot: 'bg-medium', text: 'text-medium' };
  return { label: 'Low', dot: 'bg-low', text: 'text-low' };
}

export const STATUS: Record<string, { tr: string; en: string; text: string }> = {
  patched: { tr: 'Yamalandı', en: 'Patched', text: 'text-patched' },
  unpatched: { tr: 'Yaması bulunmuyor', en: 'No patch available', text: 'text-critical' },
  unknown: { tr: 'Belirtilmedi', en: 'Not stated', text: 'text-faint' },
};

export const codeLang = (l: string) =>
  ({ Shell: 'bash', Bash: 'bash', C: 'c', Python: 'python', JavaScript: 'javascript', Electron: 'javascript' } as Record<string, string>)[l] ?? 'text';
