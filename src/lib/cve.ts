export const slugOf = (id: string) => id.toLowerCase();

export function topScore(c: any): number | null {
  const s = Math.max(c?.cvss?.v4 ?? 0, c?.cvss?.v31 ?? 0);
  return s > 0 ? s : null;
}

export function severity(score: number | null): { label: string; cls: string } {
  if (score == null) return { label: 'N/A', cls: 'text-zinc-500 border-zinc-700' };
  if (score >= 9) return { label: 'Critical', cls: 'text-red-400 border-red-500/40' };
  if (score >= 7) return { label: 'High', cls: 'text-orange-400 border-orange-500/40' };
  if (score >= 4) return { label: 'Medium', cls: 'text-yellow-400 border-yellow-500/40' };
  return { label: 'Low', cls: 'text-sky-400 border-sky-500/40' };
}

export const STATUS: Record<string, { tr: string; en: string; cls: string }> = {
  patched: { tr: 'Yamalandı', en: 'Patched', cls: 'text-emerald-400 border-emerald-500/40' },
  unpatched: { tr: 'Yaması bulunmuyor', en: 'No patch available', cls: 'text-red-400 border-red-500/40' },
  unknown: { tr: 'Belirtilmedi', en: 'Not stated', cls: 'text-zinc-400 border-zinc-700' },
};

export const codeLang = (l: string) =>
  ({ Shell: 'bash', Bash: 'bash', C: 'c', Python: 'python', JavaScript: 'javascript', Electron: 'javascript' } as Record<string, string>)[l] ?? 'text';
