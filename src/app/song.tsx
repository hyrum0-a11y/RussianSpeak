import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { lineAt, loadSongs, updateSong, withLyrics, type Song } from '../lib/songs';
import { Button, Card, colors, Row } from '../components/ui';

const SPEEDS = [0.5, 0.75, 0.9, 1, 1.25];

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [song, setSong] = useState<Song | null>(null);
  useEffect(() => {
    loadSongs().then((all) => setSong(all.find((s) => s.id === id) ?? null));
  }, [id]);
  if (!song) return null;
  return <Player song={song} onChange={setSong} />;
}

function Player({ song, onChange }: { song: Song; onChange: (s: Song) => void }) {
  const player = useAudioPlayer({ uri: song.uri }, { updateInterval: 150 });
  const status = useAudioPlayerStatus(player);
  const [speed, setSpeed] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [syncNext, setSyncNext] = useState(0);
  const [editing, setEditing] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const ys = useRef<number[]>([]);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  }, []);

  useEffect(() => {
    // Pitch stays the same at every speed.
    if (status.isLoaded) player.setPlaybackRate(speed, 'high');
  }, [player, speed, status.isLoaded]);

  const t = status.currentTime;
  const cur = syncing ? syncNext - 1 : lineAt(song.times, t);
  const synced = useMemo(() => song.times.filter((x) => x != null).length, [song.times]);

  // Keep the current line near the top third of the screen.
  useEffect(() => {
    const y = ys.current[cur];
    if (cur >= 0 && y != null) scroll.current?.scrollTo({ y: Math.max(0, y - 160), animated: true });
  }, [cur]);

  async function save(next: Song) {
    onChange(next);
    await updateSong(next.id, () => next);
  }

  function togglePlay() {
    if (status.playing) player.pause();
    else {
      if (status.duration && t >= status.duration - 0.2) player.seekTo(0);
      player.play();
    }
  }

  function startSync() {
    setSyncing(true);
    setSyncNext(0);
    save({ ...song, times: song.lines.map(() => null) });
    player.seekTo(0);
    player.play();
  }

  /** Mark the next line as starting now. */
  function stamp() {
    if (syncNext >= song.lines.length) return;
    const times = [...song.times];
    times[syncNext] = Math.max(0, player.currentTime - 0.2); // small allowance for reaction time
    save({ ...song, times });
    if (syncNext + 1 >= song.lines.length) setSyncing(false);
    setSyncNext(syncNext + 1);
  }

  function tapLine(i: number) {
    const ti = song.times[i];
    if (syncing || ti == null) return;
    player.seekTo(ti);
    if (!status.playing) player.play();
  }

  if (editing) {
    return (
      <EditLyrics
        song={song}
        onDone={(text) => {
          setEditing(false);
          if (text != null) save(withLyrics(song, text));
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: song.title }} />
      <ScrollView ref={scroll} contentContainerStyle={styles.lyricsWrap}>
        {synced === 0 && !syncing ? (
          <Card style={{ gap: 8, marginBottom: 12 }}>
            <Text style={styles.tipTitle}>Make the lyrics follow along</Text>
            <Text style={styles.tip}>
              Tap “Sync lyrics”, then tap “Next line” each time a new line starts. Do it once at any speed; after that
              the lyrics follow the song at every speed.
            </Text>
          </Card>
        ) : null}
        {song.lines.map((line, i) => (
          <Pressable
            key={i}
            onLayout={(e) => {
              ys.current[i] = e.nativeEvent.layout.y;
            }}
            onPress={() => tapLine(i)}
            style={[styles.line, i === cur && styles.lineOn]}
          >
            <Text style={[styles.lineText, i === cur && styles.lineTextOn, i < cur && styles.linePast]}>{line}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setEditing(true)} hitSlop={8}>
          <Text style={styles.edit}>✎ Edit lyrics</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.controls}>
        <Text style={styles.time}>
          {fmt(t)} / {fmt(status.duration)}
        </Text>
        {syncing ? (
          <>
            <Text style={styles.syncHint}>
              Next: {song.lines[syncNext] ?? '—'}
            </Text>
            <Row>
              <Button label="Stop syncing" variant="outline" onPress={() => setSyncing(false)} />
              <Button label="Next line ▶" color={colors.good} onPress={stamp} />
            </Row>
          </>
        ) : (
          <>
            <Row>
              <Button label="⏪ 5s" variant="outline" onPress={() => player.seekTo(Math.max(0, t - 5))} />
              <Button label={status.playing ? '⏸ Pause' : '▶ Play'} onPress={togglePlay} />
              <Button label="5s ⏩" variant="outline" onPress={() => player.seekTo(t + 5)} />
            </Row>
            <View style={styles.speeds}>
              {SPEEDS.map((s) => (
                <Pressable key={s} onPress={() => setSpeed(s)} style={[styles.chip, speed === s && styles.chipOn]}>
                  <Text style={[styles.chipText, speed === s && styles.chipTextOn]}>{s}×</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() =>
                synced
                  ? Alert.alert('Sync again?', 'This replaces the current timings.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Sync again', onPress: startSync },
                    ])
                  : startSync()
              }
              hitSlop={8}
            >
              <Text style={styles.syncLink}>
                {synced ? `⟲ Sync lyrics again (${synced}/${song.lines.length} synced)` : '⏱ Sync lyrics'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function EditLyrics({ song, onDone }: { song: Song; onDone: (text: string | null) => void }) {
  const [text, setText] = useState(song.lines.join('\n'));
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.tip}>Lines you don't change keep their timing.</Text>
      <TextInput style={styles.input} value={text} onChangeText={setText} multiline textAlignVertical="top" />
      <Row>
        <Button label="Cancel" variant="outline" onPress={() => onDone(null)} />
        <Button label="Save" onPress={() => onDone(text)} />
      </Row>
    </ScrollView>
  );
}

function fmt(s: number) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  lyricsWrap: { padding: 16, paddingBottom: 240 },
  line: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  lineOn: { backgroundColor: '#FFF4D6' },
  lineText: { fontSize: 20, lineHeight: 28, color: colors.text },
  lineTextOn: { fontWeight: '700', color: colors.primary },
  linePast: { color: colors.muted },
  edit: { color: colors.primary, textAlign: 'center', marginTop: 20, fontWeight: '600' },
  tipTitle: { fontWeight: '700', color: colors.text },
  tip: { color: colors.muted, lineHeight: 20 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 14,
    paddingBottom: 24,
    gap: 10,
  },
  time: { textAlign: 'center', color: colors.muted, fontVariant: ['tabular-nums'] },
  syncHint: { textAlign: 'center', color: colors.text, fontSize: 15 },
  speeds: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextOn: { color: colors.primaryText, fontWeight: '600' },
  syncLink: { textAlign: 'center', color: colors.primary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 300,
    color: colors.text,
    backgroundColor: colors.card,
  },
});
