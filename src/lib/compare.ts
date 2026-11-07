// Compare what you typed or said with the target phrase. Pure, unit-tested.

/** Lowercase, drop stress marks and punctuation, treat ё as е. */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/́/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/^-+|-+$/g, '');
}

export function words(text: string): string[] {
  return text
    .replace(/[—–]/g, ' ')
    .split(/\s+/)
    .filter((w) => normalizeWord(w).length > 0);
}

export type WordResult = { word: string; ok: boolean };

/**
 * Mark each target word as matched or not, using a longest-common-subsequence
 * alignment so one missed word doesn't make every later word "wrong".
 */
export function compareWords(target: string, attempt: string): WordResult[] {
  const t = words(target);
  const a = words(attempt).map(normalizeWord);
  const tn = t.map(normalizeWord);
  const dp: number[][] = Array.from({ length: t.length + 1 }, () => new Array(a.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--)
    for (let j = a.length - 1; j >= 0; j--)
      dp[i][j] = tn[i] === a[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: WordResult[] = [];
  let i = 0;
  let j = 0;
  while (i < t.length) {
    if (j < a.length && tn[i] === a[j]) {
      out.push({ word: t[i], ok: true });
      i++;
      j++;
    } else if (j < a.length && dp[i][j + 1] >= dp[i + 1][j]) {
      j++;
    } else {
      out.push({ word: t[i], ok: false });
      i++;
    }
  }
  return out;
}

export function score(results: WordResult[]): number {
  return results.length ? results.filter((r) => r.ok).length / results.length : 0;
}

/** Same word, ignoring case, stress, ё/е and punctuation. */
export function sameWord(a: string, b: string): boolean {
  return normalizeWord(a) === normalizeWord(b);
}

/**
 * Pick a word to blank out for a fill-in-the-blank card: the longest real word
 * (4+ letters), ties broken by `seed` so the same phrase can vary between sessions.
 */
export function pickCloze(text: string, seed = 0): { before: string; answer: string; after: string } | null {
  const tokens = text.split(/(\s+)/);
  const candidates = tokens
    .map((tok, idx) => ({ tok, idx, len: normalizeWord(tok).length }))
    .filter((c) => c.len >= 4);
  if (!candidates.length) return null;
  const maxLen = Math.max(...candidates.map((c) => c.len));
  const top = candidates.filter((c) => c.len >= Math.min(maxLen, 5));
  const chosen = top[Math.abs(seed) % top.length];
  // Keep punctuation outside the blank.
  const m = chosen.tok.match(/^([^\p{L}]*)([\p{L}́-]+)([^\p{L}]*)$/u);
  if (!m) return null;
  return {
    before: tokens.slice(0, chosen.idx).join('') + m[1],
    answer: m[2],
    after: m[3] + tokens.slice(chosen.idx + 1).join(''),
  };
}

/** Let people type stress with an apostrophe after the vowel: приве'т → приве́т. */
export function apostropheToStress(text: string): string {
  return text.replace(/([аеёиоуыэюяАЕЁИОУЫЭЮЯ])['’`]/g, '$1́');
}
