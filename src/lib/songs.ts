import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { splitLyrics } from './lyrics';

export { lineAt, splitLyrics } from './lyrics';

/** A song you imported: your own audio file plus lyrics you pasted. */
export type Song = {
  id: string;
  title: string;
  uri: string; // audio file copied into the app's storage
  lines: string[];
  /** Seconds into the song where each line starts; null = not synced yet. */
  times: (number | null)[];
};

const KEY = 'russianspeak:songs:v1';

export async function loadSongs(): Promise<Song[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Song[]) : [];
  } catch {
    return [];
  }
}

async function saveSongs(songs: Song[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(songs));
}

/** Copy the picked file into app storage so it survives the picker's cache being cleared. */
export async function addSong(title: string, pickedUri: string, fileName: string, lyrics: string): Promise<Song> {
  const id = `${Date.now()}`;
  let uri = pickedUri;
  if (FileSystem.documentDirectory) {
    const dir = `${FileSystem.documentDirectory}songs/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const ext = /\.[a-z0-9]{2,5}$/i.exec(fileName)?.[0] ?? '.mp3';
    uri = `${dir}${id}${ext}`;
    await FileSystem.copyAsync({ from: pickedUri, to: uri });
  }
  const lines = splitLyrics(lyrics);
  const song: Song = { id, title: title.trim() || fileName, uri, lines, times: lines.map(() => null) };
  await saveSongs([...(await loadSongs()), song]);
  return song;
}

export async function updateSong(id: string, change: (s: Song) => Song) {
  const songs = await loadSongs();
  await saveSongs(songs.map((s) => (s.id === id ? change(s) : s)));
}

/** New lyrics keep the timings of lines that didn't move. */
export function withLyrics(s: Song, text: string): Song {
  const lines = splitLyrics(text);
  return { ...s, lines, times: lines.map((l, i) => (s.lines[i] === l ? s.times[i] : null)) };
}

export async function removeSong(id: string) {
  const songs = await loadSongs();
  const s = songs.find((x) => x.id === id);
  if (s && FileSystem.documentDirectory && s.uri.startsWith(FileSystem.documentDirectory)) {
    await FileSystem.deleteAsync(s.uri, { idempotent: true }).catch(() => {});
  }
  await saveSongs(songs.filter((x) => x.id !== id));
}

export function useSongs(): [Song[] | null, () => void] {
  const [songs, setSongs] = useState<Song[] | null>(null);
  const reload = useCallback(() => {
    loadSongs().then(setSongs);
  }, []);
  useFocusEffect(reload);
  return [songs, reload];
}
