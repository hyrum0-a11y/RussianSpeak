import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Deck } from '../data/phrases';
import type { CardState } from './srs';

// Everything is stored on the device only.
const KEY = 'russianspeak:v1';

export type Settings = {
  newPerDay: number;
  speechRate: number; // 1.0 = normal
  front: 'ru' | 'en'; // what the phrase card shows first
  showPromptText: boolean; // show the Cyrillic question text in prompt drills
};

type DayCount = { date: string; count: number };

export type Progress = {
  cards: Record<string, CardState>;
  prompts: Record<string, CardState>;
  newIntroduced: Partial<Record<Deck, DayCount>>;
  streak: { lastDay: string; days: number };
  settings: Settings;
};

export const DEFAULT_PROGRESS: Progress = {
  cards: {},
  prompts: {},
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
    const parsed = json ? (JSON.parse(json) as Partial<Progress>) : {};
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
  const d = p.newIntroduced[deck];
  const used = d && d.date === today() ? d.count : 0;
  return Math.max(0, p.settings.newPerDay - used);
}

export function countNewIntroduced(p: Progress, deck: Deck): Progress {
  const t = today();
  const d = p.newIntroduced[deck];
  const count = (d && d.date === t ? d.count : 0) + 1;
  return { ...p, newIntroduced: { ...p.newIntroduced, [deck]: { date: t, count } } };
}

/** Mark today as a practice day for the streak counter. */
export function touchStreak(p: Progress): Progress {
  const t = today();
  if (p.streak.lastDay === t) return p;
  const days = p.streak.lastDay === yesterday() ? p.streak.days + 1 : 1;
  return { ...p, streak: { lastDay: t, days } };
}

export async function resetProgress(): Promise<void> {
  await updateProgress((p) => ({ ...DEFAULT_PROGRESS, settings: p.settings }));
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
