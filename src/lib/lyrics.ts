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

/**
 * Parse timed lyrics in LRC format ("[01:23.45] text"). Lines can carry several
 * timestamps. Returns lines sorted by time; empty-text lines are dropped.
 * If the text has no timestamps, returns the plain lines with null times.
 */
export function parseLrc(text: string): { lines: string[]; times: (number | null)[] } {
  const stamped: { t: number; line: string }[] = [];
  const tag = /\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g;
  for (const raw of text.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(tag)];
    if (!stamps.length) continue;
    const line = raw.replace(tag, '').trim();
    if (!line) continue;
    for (const m of stamps) stamped.push({ t: Number(m[1]) * 60 + Number(m[2].replace(':', '.')), line });
  }
  if (!stamped.length) {
    const lines = splitLyrics(text.replace(/^\[[a-z]+:.*\]$/gim, ''));
    return { lines, times: lines.map(() => null) };
  }
  stamped.sort((a, b) => a.t - b.t);
  return { lines: stamped.map((s) => s.line), times: stamped.map((s) => s.t) };
}

/** "Пикник - Иероглиф (Live).mp3" → "Пикник Иероглиф": a good lyrics search. */
export function searchFromFileName(name: string): string {
  return name
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[\(\[].*?[\)\]]/g, ' ')
    .replace(/^\d+[\s.\-_]+/, '')
    .replace(/[_\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pull the 11-character video id out of any YouTube link (or a bare id). */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i.exec(s);
  return m ? m[1] : null;
}
