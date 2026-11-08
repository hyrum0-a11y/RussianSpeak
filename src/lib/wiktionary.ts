// Pure helpers for reading Russian Wiktionary (Викисловарь) wikitext. Unit-tested.

/** Same as compare.ts normalizeWord (copied so this file has no imports and runs in plain Node tests). */
function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/\u0301/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/^-+|-+$/g, '');
}

export { normalizeWord as dictKey };

/** Unique Russian words from phrases, alphabetical. Keeps the stressed spelling for display. */
export function wordList(texts: string[]): { word: string; key: string }[] {
  const seen = new Map<string, string>();
  for (const t of texts) {
    for (const raw of t.split(/[\s/]+/)) {
      const word = raw.replace(/^[^\p{L}]+|[^\p{L}́]+$/gu, '').toLowerCase();
      if (!/[а-яё]/i.test(word) || /[a-z]/i.test(word)) continue;
      const key = normalizeWord(word);
      if (key.length < 2) continue;
      if (!seen.has(key) || (!seen.get(key)!.includes('́') && word.includes('́'))) seen.set(key, word);
    }
  }
  return [...seen.entries()].map(([key, word]) => ({ word, key })).sort((a, b) => a.key.localeCompare(b.key, 'ru'));
}

/** Remove a template and everything inside it, handling nesting. */
function dropTemplates(s: string, names: RegExp): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('{{', i)) {
      const name = /^\{\{\s*([^|}]+)/.exec(s.slice(i))?.[1]?.trim() ?? '';
      let depth = 0;
      let j = i;
      for (; j < s.length; j++) {
        if (s.startsWith('{{', j)) {
          depth++;
          j++;
        } else if (s.startsWith('}}', j)) {
          depth--;
          j++;
          if (depth === 0) break;
        }
      }
      const inner = s.slice(i + 2, j - 1);
      if (names.test(name)) {
        // drop
      } else {
        // Label templates like {{разг.}} or {{устар.|ru}}: keep the label.
        const label = inner.split('|')[0].trim();
        out += label.endsWith('.') || label.length <= 12 ? `${label} ` : '';
      }
      i = j + 1;
    } else {
      out += s[i++];
    }
  }
  return out;
}

/** Turn one wikitext definition line into plain text. */
export function cleanDefinition(line: string): string {
  let s = line.replace(/^#+\s*/, '');
  s = dropTemplates(s, /^(пример|помета|итд|-|выдел|источник|morph|lang|t|ref)/i);
  s = s
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/\s+([,;.:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return s.replace(/^[;,:\s]+|[;,\s]+$/g, '');
}

/**
 * Russian meanings from a Wiktionary page: every "Значение" section inside the
 * Russian-language part, as plain text. Homonyms come out in order.
 */
export function russianMeanings(wikitext: string): string[] {
  const lines = wikitext.split('\n');
  const out: string[] = [];
  let inRu = false;
  let inMeaning = false;
  for (const line of lines) {
    const lang = /^=\s*\{\{-([\w-]+)-\}\}/.exec(line);
    if (lang) {
      inRu = lang[1] === 'ru';
      inMeaning = false;
      continue;
    }
    if (!inRu) continue;
    if (/^=+\s*Значение\s*=+/.test(line)) {
      inMeaning = true;
      continue;
    }
    if (/^=+/.test(line)) {
      inMeaning = false;
      continue;
    }
    if (inMeaning && /^#(?![:*])/.test(line)) {
      const d = cleanDefinition(line);
      if (d && d !== '?' && d.length > 1) out.push(d);
    }
  }
  return out;
}

/** Guess shorter stems to search when an inflected form has no page of its own. */
export function stems(key: string): string[] {
  const out: string[] = [];
  for (let cut = 1; cut <= 3 && key.length - cut >= 3; cut++) out.push(key.slice(0, key.length - cut));
  return out;
}
