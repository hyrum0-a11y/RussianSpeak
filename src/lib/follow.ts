// Word-by-word following for "speak along" and the reader. Pure (no Expo imports) so it can be unit-tested.

const STRESS = '́';
const WORD = /[A-Za-zА-Яа-яЁё́]+(?:-[A-Za-zА-Яа-яЁё́]+)*/g;
const VOWELS = /[аеёиоуыэюяaeiouy]/gi;

export type Token = { text: string; word: boolean; index: number };

/** Split text into words and the bits between them; words get 0,1,2… indexes. */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(WORD)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), word: false, index: -1 });
    out.push({ text: m[0], word: true, index: n++ });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), word: false, index: -1 });
  return out;
}

export function wordCount(text: string): number {
  return [...text.matchAll(WORD)].length;
}

/** Which word (0-based) the speech engine is at, given a character index into the text it was given. */
export function wordAtChar(spoken: string, charIndex: number): number {
  let i = -1;
  for (const m of spoken.matchAll(WORD)) {
    if ((m.index ?? 0) <= charIndex) i++;
    else break;
  }
  return Math.max(0, i);
}

/**
 * Rough timing for each word: syllables (vowels) plus a pause after punctuation.
 * Returns each word's start as a fraction of the whole (0…1) and the total weight.
 */
export function wordTiming(text: string): { starts: number[]; weight: number } {
  const toks = tokenize(text.replaceAll(STRESS, ''));
  const weights: number[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (!t.word) {
      if (weights.length && /[.,;:!?…—–]/.test(t.text)) weights[weights.length - 1] += /[.!?…]/.test(t.text) ? 1.6 : 0.8;
      continue;
    }
    weights.push(Math.max(1, (t.text.match(VOWELS) ?? []).length));
  }
  const weight = weights.reduce((a, b) => a + b, 0) || 1;
  const starts: number[] = [];
  let acc = 0;
  for (const w of weights) {
    starts.push(acc / weight);
    acc += w;
  }
  return { starts, weight };
}

/** Word index at a fraction (0…1) of the way through. */
export function wordAtFraction(starts: number[], f: number): number {
  let i = 0;
  while (i + 1 < starts.length && starts[i + 1] <= f) i++;
  return i;
}

/**
 * Pieces for "build up" practice: split at punctuation, and break long stretches into 2–4 word groups.
 * Returns the growing prefixes to repeat: first piece, first two pieces, … whole text.
 */
export function buildUp(text: string): string[] {
  const parts = text
    .split(/(?<=[,;:.!?…—])\s+|\s+\/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pieces: string[] = [];
  for (const p of parts) {
    const words = p.split(/\s+/);
    if (words.length <= 4) pieces.push(p);
    else for (let i = 0; i < words.length; i += 3) pieces.push(words.slice(i, i + 3).join(' '));
  }
  const steps: string[] = [];
  for (let i = 1; i <= pieces.length; i++) steps.push(pieces.slice(0, i).join(' '));
  return steps.length > 1 ? steps : [text];
}

/** Split pasted text into lines: keep the author's line breaks, and break long paragraphs into sentences. */
export function splitLines(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      continue;
    }
    if (line.length <= 90) out.push(line);
    else out.push(...(line.match(/[^.!?…]+[.!?…]+["»”]?\s*|[^.!?…]+$/g) ?? [line]).map((s) => s.trim()).filter(Boolean));
  }
  while (out[out.length - 1] === '') out.pop();
  return out;
}
