import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { CustomPhrase, Deck } from '../data/phrases';
import type { CardState, Level } from './srs';

// Everything is stored on the device only.
const KEY = 'russianspeak:v1';

export type Settings = {
  newPerDay: number;
  speechRate: number; // 1.0 = normal
  voiceId?: string; // chosen Russian TTS voice; undefined = pick automatically
  front: 'ru' | 'en'; // what the phrase card shows first
  showPromptText: boolean; // show the Cyrillic question text in prompt drills
  holdHintDone?: boolean; // dismissed the "press and hold for English" tip
};

/** A word saved from the dictionary, with example sentences to learn it in context. */
export type SavedWord = {
  word: string; // dictionary form, e.g. "дом"
  meanings: string[]; // Russian definitions
  examples: string[]; // sentences that use it
  phrases?: string[]; // set phrases with the word, e.g. "иди ко мне"
  added: number;
  level?: Level; // your last Hard / Good / Easy
  seen: number; // practice count, used to rotate examples
};

type DayCount = { date: string; count: number };

export type Progress = {
  cards: Record<string, CardState>;
  prompts: Record<string, CardState>;
  custom: CustomPhrase[];
  /** Words you're learning in context (Мои слова). */
  words: SavedWord[];
  /** Unused since the Difficult page replaced the starred list; kept so old saves load. */
  starred: string[];
  newIntroduced: Partial<Record<Deck, DayCount>>;
  streak: { lastDay: string; days: number };
  settings: Settings;
};

export const DEFAULT_PROGRESS: Progress = {
  cards: {},
  prompts: {},
  custom: [],
  starred: [],
  words: [],
  newIntroduced: {},
  streak: { lastDay: '', days: 0 },
  settings: { newPerDay: 10, speechRate: 0.9, front: 'ru', showPromptText: true },
};

export function today(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return today(d);
}

let cache: Progress | null = null;
const listeners = new Set<(p: Progress) => void>();

export async function loadProgress(): Promise<Progress> {
  if (cache) return cache;
  try {
    const json = await AsyncStorage.getItem(KEY);
    const raw = json ? (JSON.parse(json) as Partial<Progress>) : {};
    // Ignore null fields so a damaged save falls back to defaults instead of crashing later.
    const parsed = Object.fromEntries(Object.entries(raw ?? {}).filter(([, v]) => v != null)) as Partial<Progress>;
    // Older saves stored one { date, count } for everything; treat it as the everyday deck.
    const intro = parsed.newIntroduced as unknown;
    const newIntroduced =
      intro && typeof intro === 'object' && 'date' in intro ? { everyday: intro as DayCount } : parsed.newIntroduced ?? {};
    cache = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      newIntroduced,
      settings: { ...DEFAULT_PROGRESS.settings, ...parsed.settings },
    };
  } catch {
    cache = { ...DEFAULT_PROGRESS };
  }
  return cache;
}

export async function updateProgress(fn: (p: Progress) => Progress): Promise<Progress> {
  const next = fn(await loadProgress());
  cache = next;
  listeners.forEach((l) => l(next));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/** How many new cards from this deck can still be introduced today. */
export function newLeftToday(p: Progress, deck: Deck): number {
  const d = p.newIntroduced?.[deck];
  const used = d && d.date === today() ? d.count : 0;
  return Math.max(0, p.settings.newPerDay - used);
}

export function countNewIntroduced(p: Progress, deck: Deck): Progress {
  const t = today();
  const d = p.newIntroduced?.[deck];
  const count = (d && d.date === t ? d.count : 0) + 1;
  return { ...p, newIntroduced: { ...(p.newIntroduced ?? {}), [deck]: { date: t, count } } };
}

/** Mark today as a practice day for the streak counter. */
export function touchStreak(p: Progress): Progress {
  const t = today();
  const last = p.streak?.lastDay;
  if (last === t) return p;
  const days = last === yesterday() ? (p.streak?.days ?? 0) + 1 : 1;
  return { ...p, streak: { lastDay: t, days } };
}

export async function addCustomPhrase(c: CustomPhrase) {
  await updateProgress((p) => ({ ...p, custom: [...p.custom.filter((x) => x.ru !== c.ru), c] }));
}

export async function removeCustomPhrase(ru: string) {
  await updateProgress((p) => {
    const cards = { ...p.cards };
    delete cards[`mine:${ru}`];
    return { ...p, cards, custom: p.custom.filter((x) => x.ru !== ru) };
  });
}

export async function saveWord(w: Omit<SavedWord, 'added' | 'seen'>) {
  await updateProgress((p) => ({
    ...p,
    words: [...p.words.filter((x) => x.word !== w.word), { ...w, added: Date.now(), seen: 0 }],
  }));
}

export async function removeWord(word: string) {
  await updateProgress((p) => ({ ...p, words: p.words.filter((x) => x.word !== word) }));
}

export async function gradeWord(word: string, level: Level) {
  await updateProgress((p) => ({
    ...p,
    words: p.words.map((x) => (x.word === word ? { ...x, level, seen: x.seen + 1 } : x)),
  }));
}

export async function resetProgress(): Promise<void> {
  await updateProgress((p) => ({ ...DEFAULT_PROGRESS, settings: p.settings, custom: p.custom, starred: p.starred, words: p.words }));
}

export function useProgress(): [Progress | null, typeof updateProgress] {
  const [p, setP] = useState<Progress | null>(cache);
  useEffect(() => {
    listeners.add(setP);
    loadProgress().then(setP);
    return () => {
      listeners.delete(setP);
    };
  }, []);
  const update = useCallback(updateProgress, []);
  return [p, update];
}
