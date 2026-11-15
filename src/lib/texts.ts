import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { PASSAGES, type Passage } from '../data/passages';
import { splitLines } from './follow';

const KEY = 'russianspeak:texts:v1';

export async function loadMyTexts(): Promise<Passage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Passage[]) : [];
    return Array.isArray(list) ? list.filter((x) => x && Array.isArray(x.lines)) : [];
  } catch {
    return [];
  }
}

export async function addMyText(title: string, text: string): Promise<Passage> {
  const list = await loadMyTexts();
  const item: Passage = { id: `my-${Date.now()}`, group: 'mine', title: title.trim() || 'Мой текст', titleEn: 'My text', lines: splitLines(text) };
  await AsyncStorage.setItem(KEY, JSON.stringify([...list, item]));
  return item;
}

export async function removeMyText(id: string) {
  const list = await loadMyTexts();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((x) => x.id !== id)));
}

export function usePassages(): [Passage[] | null, () => void] {
  const [list, setList] = useState<Passage[] | null>(null);
  const reload = useCallback(() => {
    loadMyTexts().then((mine) => setList([...PASSAGES, ...mine]));
  }, []);
  useEffect(reload, [reload]);
  return [list, reload];
}
