// Pure helpers for song lyrics (kept separate so they can be unit-tested).

export function splitLyrics(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Index of the line being sung at time t, or -1 before the first synced line. */
export function lineAt(times: (number | null)[], t: number): number {
  let cur = -1;
  for (let i = 0; i < times.length; i++) {
    const ti = times[i];
    if (ti != null && ti <= t + 0.05) cur = i;
  }
  return cur;
}
