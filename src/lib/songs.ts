import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export { lineAt, parseLrc, searchFromFileName, splitLyrics, youtubeId } from './lyrics';

export type SongSource = { kind: 'file'; uri: string } | { kind: 'youtube'; videoId: string };

/** A song you added: an audio file on your phone or a YouTube video, plus its lyrics. */
export type Song = {
  id: string;
  title: string;
  source: SongSource;
  lines: string[];
  /** Seconds into the song where each line starts; null = lyrics aren't timed. */
  times: (number | null)[];
  /** Shift the lyrics earlier (−) or later (+) to match this recording. */
  offset: number;
};

export type Lyrics = { lines: string[]; times: (number | null)[]; label: string };

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

/** Copy a picked file into app storage so it survives the picker's cache being cleared. */
export async function keepFile(pickedUri: string, fileName: string): Promise<string> {
  if (!FileSystem.documentDirectory) return pickedUri;
  const dir = `${FileSystem.documentDirectory}songs/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const ext = /\.[a-z0-9]{2,5}$/i.exec(fileName)?.[0] ?? '.mp3';
  const uri = `${dir}${Date.now()}${ext}`;
  await FileSystem.copyAsync({ from: pickedUri, to: uri });
  return uri;
}

export async function addSong(title: string, source: SongSource, lyrics: Lyrics): Promise<Song> {
  const song: Song = { id: `${Date.now()}`, title, source, lines: lyrics.lines, times: lyrics.times, offset: 0 };
  await saveSongs([...(await loadSongs()), song]);
  return song;
}

export async function saveSong(song: Song) {
  const songs = await loadSongs();
  await saveSongs(songs.map((s) => (s.id === song.id ? song : s)));
}

export async function removeSong(id: string) {
  const songs = await loadSongs();
  const s = songs.find((x) => x.id === id);
  if (s?.source.kind === 'file' && FileSystem.documentDirectory && s.source.uri.startsWith(FileSystem.documentDirectory)) {
    await FileSystem.deleteAsync(s.source.uri, { idempotent: true }).catch(() => {});
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

// ---- Lyrics search (LRCLIB: a free, community-made library of timed lyrics) ----

// LRCLIB asks apps to name themselves; Android's default User-Agent is just "okhttp".
const LRCLIB_HEADERS = {
  'User-Agent': 'RussianSpeak/1.0 (https://github.com/hyrum0-a11y/RussianSpeak)',
  'Lrclib-Client': 'RussianSpeak (https://github.com/hyrum0-a11y/RussianSpeak)',
};

export type LyricsMatch = {
  id: number;
  trackName: string;
  artistName: string;
  duration: number;
  syncedLyrics: string | null;
  plainLyrics: string | null;
};

/** Look up one song by artist and title; timed lyrics first. */
export async function findSong(artist: string, track: string): Promise<LyricsMatch[]> {
  const res = await fetch(
    `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(track)}`,
    { headers: LRCLIB_HEADERS },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const all = ((await res.json()) as LyricsMatch[]).filter((m) => m.syncedLyrics || m.plainLyrics);
  return all.sort((a, b) => Number(!!b.syncedLyrics) - Number(!!a.syncedLyrics));
}

export async function searchLyrics(q: string, limit = 20): Promise<LyricsMatch[]> {
  const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, { headers: LRCLIB_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const all = ((await res.json()) as LyricsMatch[]).filter((m) => m.syncedLyrics || m.plainLyrics);
  // Timed lyrics first.
  return all.sort((a, b) => Number(!!b.syncedLyrics) - Number(!!a.syncedLyrics)).slice(0, limit);
}
