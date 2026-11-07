import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { CardState } from './srs';

// Everything is stored on the device only.
const KEY = 'russianspeak:v1';

export type Settings = {
  newPerDay: number;
  speechRate: number; // 1.0 = normal
};

export type Progress = {
  cards: Record<string, CardState>;
  prompts: Record<string, CardState>;
  newIntroduced: { date: string; count: number };
  streak: { lastDay: string; days: number };
  settings: Settings;
};

export const DEFAULT_PROGRESS: Progress = {
  cards: {},
  prompts: {},
  newIntroduced: { date: '', count: 0 },
  streak: { lastDay: '', days: 0 },
  settings: { newPerDay: 10, speechRate: 0.9 },
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
    cache = {
      ...DEFAULT_PROGRESS,
      ...parsed,
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
