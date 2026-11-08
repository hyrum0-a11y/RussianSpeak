import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { findSong, parseLrc, searchLyrics, type Lyrics, type LyricsMatch } from '../lib/songs';
import { SONG_CATALOG } from '../data/songCatalog';
import { Button, colors, Row } from './ui';

/**
 * Find lyrics online (timed ones highlight as the song plays), or paste them.
 * Search runs once on open with the starting query.
 */
export function LyricsFinder({
  initialQuery,
  onPick,
  browse = false,
}: {
  initialQuery: string;
  onPick: (l: Lyrics) => void;
  /** Show popular artists to browse. */
  browse?: boolean;
}) {
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<LyricsMatch[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');

  const [artist, setArtist] = useState<string | null>(null);

  async function run(query: string) {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    setArtist(null);
    try {
      setResults(await searchLyrics(query.trim()));
    } catch {
      setError("Couldn't reach the lyrics library. Check your internet, or paste the lyrics.");
    } finally {
      setBusy(false);
    }
  }

  /** Picked from the catalog: use the best match straight away. */
  async function pickTitle(a: string, track: string) {
    setBusy(true);
    setError(null);
    try {
      const found = await findSong(a, track);
      const best = found[0];
      if (best) {
        onPick({ ...parseLrc(best.syncedLyrics ?? best.plainLyrics ?? ''), label: `${best.artistName} – ${best.trackName}` });
      } else {
        setArtist(null);
        setQ(`${a} ${track}`);
        setResults(await searchLyrics(`${a} ${track}`));
      }
    } catch {
      setError("Couldn't reach the lyrics library. Check your internet, or paste the lyrics.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialQuery.trim()) run(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pasting) {
    return (
      <View style={styles.wrap}>
        <TextInput
          style={[styles.input, { minHeight: 180 }]}
          placeholder="Paste lyrics, one line per line"
          value={pasted}
          onChangeText={setPasted}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.help}>Pasted lyrics show without highlighting, unless they have [00:12.34] times.</Text>
        <Row>
          <Button label="Back to search" variant="outline" onPress={() => setPasting(false)} />
          <Button
            label="Use these"
            disabled={!pasted.trim()}
            onPress={() => onPick({ ...parseLrc(pasted), label: 'Pasted lyrics' })}
          />
        </Row>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{browse ? 'Search for a song, or pick an artist' : 'Find the lyrics (artist and song name)'}</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Пикник Иероглиф"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => run(q)}
          returnKeyType="search"
        />
        <Button label="🔎" onPress={() => run(q)} style={{ flex: 0, paddingHorizontal: 16 }} />
      </View>
      {browse ? (
        <View style={styles.chips}>
          {SONG_CATALOG.map(({ artist: a }) => (
            <Pressable
              key={a}
              onPress={() => {
                setArtist(artist === a ? null : a);
                setResults(null);
              }}
              style={[styles.chip, artist === a && styles.chipOn]}
            >
              <Text style={[styles.chipText, artist === a && styles.chipTextOn]}>{a}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {artist
        ? SONG_CATALOG.find((c) => c.artist === artist)?.songs.map((track) => (
            <Pressable
              key={track}
              disabled={busy}
              onPress={() => pickTitle(artist, track)}
              style={({ pressed }) => [styles.result, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.track, { flex: 1 }]}>{track}</Text>
              <Text style={styles.tag}>＋</Text>
            </Pressable>
          ))
        : null}
      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {results && !busy && results.length === 0 ? (
        <Text style={styles.help}>Nothing found. Try just the song name, or the artist in Latin letters.</Text>
      ) : null}
      {results?.map((m) => (
        <Pressable
          key={m.id}
          onPress={() =>
            onPick({ ...parseLrc(m.syncedLyrics ?? m.plainLyrics ?? ''), label: `${m.artistName} – ${m.trackName}` })
          }
          style={({ pressed }) => [styles.result, pressed && { opacity: 0.7 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.track}>{m.trackName}</Text>
            <Text style={styles.help}>
              {m.artistName} · {fmt(m.duration)}
            </Text>
          </View>
          <Text style={[styles.tag, m.syncedLyrics ? { color: colors.good } : null]}>
            {m.syncedLyrics ? '⏱ highlights' : 'text only'}
          </Text>
        </Pressable>
      ))}
      <Pressable onPress={() => setPasting(true)} hitSlop={8}>
        <Text style={styles.link}>Paste lyrics instead</Text>
      </Pressable>
    </View>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  label: { fontWeight: '600', color: colors.text },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.card,
  },
  track: { fontSize: 16, fontWeight: '600', color: colors.text },
  tag: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  help: { color: colors.muted, fontSize: 13 },
  error: { color: colors.again },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: colors.primaryText, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
});
