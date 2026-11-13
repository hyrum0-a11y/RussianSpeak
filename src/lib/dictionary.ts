import AsyncStorage from '@react-native-async-storage/async-storage';
import { englishMeanings, russianExamples, russianMeanings, russianSetPhrases, stems, type EnglishSense } from './wiktionary';

export type Entry =
  | { found: true; title: string; meanings: string[]; examples: string[]; phrases: string[] }
  | { found: false; suggestions: string[] };

const API = 'https://ru.wiktionary.org/w/api.php';
// Wikimedia refuses requests that carry a generic app User-Agent (Android's default is "okhttp/…"),
// so the app names itself. Api-User-Agent is the header browsers are allowed to send instead.
const UA = 'RussianSpeak/1.0 (https://github.com/hyrum0-a11y/RussianSpeak; Android app)';
const HEADERS = { 'User-Agent': UA, 'Api-User-Agent': UA, Accept: 'application/json' };
const CACHE = 'russianspeak:dict4:';

/** Page title for a word: lowercase, no stress marks (ё kept). */
export function titleFor(word: string): string {
  return word.replace(/́/g, '').toLowerCase().trim();
}

export function wiktionaryUrl(title: string): string {
  return `https://ru.wiktionary.org/wiki/${encodeURIComponent(title)}`;
}

async function getJson(params: Record<string, string>) {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params }).toString();
  const res = await fetch(`${API}?${qs}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`not JSON: ${body.slice(0, 60)}`);
  }
}

async function page(title: string): Promise<{ meanings: string[]; examples: string[]; phrases: string[] } | null> {
  const data = await getJson({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    redirects: '1',
    titles: title,
  });
  const p = data?.query?.pages?.[0];
  const text: string | undefined = p?.revisions?.[0]?.slots?.main?.content;
  if (!text) return null;
  const meanings = russianMeanings(text);
  return meanings.length ? { meanings, examples: russianExamples(text), phrases: russianSetPhrases(text) } : null;
}

async function suggest(q: string): Promise<string[]> {
  const data = await getJson({ action: 'opensearch', search: q, limit: '12', namespace: '0' });
  const titles: string[] = Array.isArray(data?.[1]) ? data[1] : [];
  return titles.filter((t) => /^[а-яё-]+$/.test(t));
}

/**
 * Look a word up in Викисловарь (Russian Wiktionary, Russian-only definitions).
 * Inflected forms often have no page, so we fall back to dictionary forms that
 * start with the same stem. Results are cached on the phone.
 */
export async function lookUp(word: string): Promise<Entry> {
  const title = titleFor(word);
  const cached = await AsyncStorage.getItem(CACHE + title).catch(() => null);
  if (cached) return JSON.parse(cached) as Entry;

  let entry: Entry;
  const found = await page(title);
  if (found) {
    entry = { found: true, title, ...found };
  } else {
    let suggestions: string[] = [];
    for (const s of [title, ...stems(title.replace(/ё/g, 'е'))]) {
      suggestions = (await suggest(s)).filter((t) => t !== title);
      if (suggestions.length) break;
    }
    entry = { found: false, suggestions: suggestions.slice(0, 8) };
  }
  AsyncStorage.setItem(CACHE + title, JSON.stringify(entry)).catch(() => {});
  return entry;
}

const EN_CACHE = 'russianspeak:dict-en1:';

/**
 * English meanings from the English Wiktionary (its Russian-language entries).
 * Returns [] when there's no English entry. Cached on the phone.
 */
export async function lookUpEnglish(title: string): Promise<EnglishSense[]> {
  const key = EN_CACHE + title;
  const cached = await AsyncStorage.getItem(key).catch(() => null);
  if (cached) return JSON.parse(cached) as EnglishSense[];
  const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(title)}`, { headers: HEADERS });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const senses = englishMeanings(await res.json());
  AsyncStorage.setItem(key, JSON.stringify(senses)).catch(() => {});
  return senses;
}
