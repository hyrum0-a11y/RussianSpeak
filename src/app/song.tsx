import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { lineAt, loadSongs, saveSong, type Song } from '../lib/songs';
import { LyricsFinder } from '../components/LyricsFinder';
import { Button, colors, hint, Row, T } from '../components/ui';

/** What the lyrics view needs from either player. */
type Transport = {
  t: number;
  duration: number;
  playing: boolean;
  toggle: () => void;
  seek: (s: number) => void;
  speed: number;
  setSpeed: (s: number) => void;
  speeds: number[];
};

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [song, setSong] = useState<Song | null>(null);
  useEffect(() => {
    loadSongs().then((all) => setSong(all.find((s) => s.id === id) ?? null));
  }, [id]);
  if (!song) return null;
  const onChange = (s: Song) => {
    setSong(s);
    saveSong(s);
  };
  return song.source.kind === 'youtube' ? (
    <YouTubeSong song={song} videoId={song.source.videoId} onChange={onChange} />
  ) : (
    <FileSong song={song} uri={song.source.uri} onChange={onChange} />
  );
}

function FileSong({ song, uri, onChange }: { song: Song; uri: string; onChange: (s: Song) => void }) {
  const player = useAudioPlayer({ uri }, { updateInterval: 150 });
  const status = useAudioPlayerStatus(player);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  }, []);
  useEffect(() => {
    // Pitch stays the same at every speed.
    if (status.isLoaded) player.setPlaybackRate(speed, 'high');
  }, [player, speed, status.isLoaded]);

  const transport: Transport = {
    t: status.currentTime,
    duration: status.duration,
    playing: status.playing,
    toggle: () => {
      if (status.playing) return player.pause();
      if (status.duration && status.currentTime >= status.duration - 0.2) player.seekTo(0);
      player.play();
    },
    seek: (s) => player.seekTo(Math.max(0, s)),
    speed,
    setSpeed,
    speeds: [0.5, 0.75, 0.9, 1, 1.25],
  };
  return <SingAlong song={song} transport={transport} onChange={onChange} />;
}

function YouTubeSong({ song, videoId, onChange }: { song: Song; videoId: string; onChange: (s: Song) => void }) {
  const ref = useRef<YoutubeIframeRef>(null);
  const { width } = useWindowDimensions();
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // The YouTube player doesn't push its position, so ask for it a few times a second.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      ref.current?.getCurrentTime().then(setT).catch(() => {});
    }, 200);
    return () => clearInterval(timer);
  }, [playing]);

  const transport: Transport = {
    t,
    duration,
    playing,
    toggle: () => setPlaying((p) => !p),
    seek: (s) => {
      const to = Math.max(0, s);
      ref.current?.seekTo(to, true);
      setT(to);
    },
    speed,
    setSpeed,
    speeds: [0.5, 0.75, 1, 1.25],
  };

  const video = (
    <View>
      <YoutubePlayer
        ref={ref}
        height={Math.round((width * 9) / 16)}
        width={width}
        videoId={videoId}
        play={playing}
        playbackRate={speed}
        onReady={() => ref.current?.getDuration().then(setDuration).catch(() => {})}
        onChangeState={(s: string) => {
          if (s === 'playing') setPlaying(true);
          if (s === 'paused' || s === 'ended') setPlaying(false);
        }}
        onError={(e: string) =>
          setError(
            e === 'embed_not_allowed' || e === '101' || e === '150'
              ? 'Э́то ви́део нельзя́ смотре́ть в други́х приложе́ниях. Попро́буйте другу́ю загру́зку пе́сни.'
              : `Оши́бка YouTube: ${e}`,
          )
        }
        initialPlayerParams={{ rel: false, iv_load_policy: 3 }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
  return <SingAlong song={song} transport={transport} onChange={onChange} header={video} />;
}

function SingAlong({
  song,
  transport: tr,
  onChange,
  header,
}: {
  song: Song;
  transport: Transport;
  onChange: (s: Song) => void;
  header?: ReactNode;
}) {
  const scroll = useRef<ScrollViewInstance>(null);
  const ys = useRef<number[]>([]);
  const [finding, setFinding] = useState(false);
  const timed = song.times.some((x) => x != null);
  const cur = timed ? lineAt(song.times, tr.t - song.offset) : -1;

  // Follow the song: keep the current line in the upper part of the lyrics area.
  // Scrolling by hand pauses this until you tap "follow" again.
  const [follow, setFollow] = useState(true);
  const toCurrent = () => {
    const y = ys.current[cur];
    if (cur >= 0 && y != null) scroll.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
  };
  useEffect(() => {
    if (follow) toCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, follow]);

  const nudge = (d: number) => onChange({ ...song, offset: Math.round((song.offset + d) * 10) / 10 });

  /** Hold the line you hear right now: the lyrics line up with the recording from there. */
  const syncTo = (i: number) => {
    const ti = song.times[i];
    if (ti == null) return;
    onChange({ ...song, offset: Math.round((tr.t - ti) * 10) / 10 });
    setFollow(true);
    hint('Текст подстро́ен под пе́сню ✓');
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: song.title }} />
      {header}
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.lyricsWrap}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setFollow(false)}
      >
        {finding ? (
          <View style={{ gap: 10 }}>
            <LyricsFinder
              initialQuery={song.title}
              onPick={(l) => {
                setFinding(false);
                ys.current = [];
                onChange({ ...song, lines: l.lines, times: l.times, offset: 0 });
              }}
            />
            <Button label="Отме́на" en="Cancel" variant="outline" onPress={() => setFinding(false)} style={{ flex: 0 }} />
          </View>
        ) : (
          <>
            {!timed ? (
              <T style={styles.tip} en="These lyrics aren't timed, so they won't highlight. Tap “Change lyrics” to look for timed ones.">У э́того те́кста нет разме́тки вре́мени, поэ́тому подсве́тки не бу́дет. Нажми́те «Смени́ть текст», что́бы найти́ разме́ченный.</T>
            ) : null}
            {song.lines.map((line, i) => (
              <Pressable
                key={i}
                onLayout={(e) => {
                  ys.current[i] = e.nativeEvent.layout.y;
                }}
                onPress={() => {
                  const ti = song.times[i];
                  if (ti != null) tr.seek(ti + song.offset);
                  setFollow(true);
                }}
                onLongPress={() => syncTo(i)}
                delayLongPress={350}
                style={[styles.line, i === cur && styles.lineOn]}
              >
                <Text style={[styles.lineText, i === cur && styles.lineTextOn, i < cur && styles.linePast]}>{line}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setFinding(true)} hitSlop={8}>
              <T style={styles.link} en="🔎 Change lyrics">🔎 Смени́ть текст</T>
            </Pressable>
          </>
        )}
      </ScrollView>

      {timed && !follow && !finding ? (
        <Pressable onPress={() => setFollow(true)} onLongPress={() => hint('Follow the song')} style={styles.followBtn}>
          <Text style={styles.followText}>↓ Следи́ть за пе́сней</Text>
        </Pressable>
      ) : null}

      <View style={styles.controls}>
        <Text style={styles.time}>
          {fmt(tr.t)} / {fmt(tr.duration)}
        </Text>
        <Row>
          <Button label="⏪ 5 с" variant="outline" onPress={() => tr.seek(tr.t - 5)} />
          <Button label={tr.playing ? '⏸ Па́уза' : '▶ Игра́ть'} onPress={tr.toggle} />
          <Button label="5 с ⏩" variant="outline" onPress={() => tr.seek(tr.t + 5)} />
        </Row>
        <View style={styles.speeds}>
          {tr.speeds.map((s) => (
            <Pressable key={s} onPress={() => tr.setSpeed(s)} style={[styles.chip, tr.speed === s && styles.chipOn]}>
              <Text style={[styles.chipText, tr.speed === s && styles.chipTextOn]}>{s}×</Text>
            </Pressable>
          ))}
        </View>
        {timed ? (
          <View style={styles.offsetRow}>
            <T style={styles.offsetLabel} en="Lyrics timing">Сдвиг те́кста</T>
            <Pressable onPress={() => nudge(-0.5)} style={styles.smallBtn} hitSlop={6}>
              <T style={styles.smallBtnText} en="Earlier">Ра́ньше</T>
            </Pressable>
            <Text style={styles.offsetValue}>
              {song.offset > 0 ? '+' : ''}
              {song.offset.toFixed(1)}s
            </Text>
            <Pressable onPress={() => nudge(0.5)} style={styles.smallBtn} hitSlop={6}>
              <T style={styles.smallBtnText} en="Later">По́зже</T>
            </Pressable>
          </View>
        ) : null}
        {timed ? (
          <T style={styles.syncTip} en="Lyrics ahead or behind? Press and hold the line you hear right now.">
            Текст спеши́т и́ли отстаёт? Уде́рживайте строку́, кото́рая звучи́т сейча́с.
          </T>
        ) : null}
      </View>
    </View>
  );
}

function fmt(s: number) {
  if (!s || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  lyricsWrap: { padding: 16, paddingBottom: 300 },
  line: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  lineOn: { backgroundColor: '#FFF4D6' },
  lineText: { fontSize: 20, lineHeight: 28, color: colors.text },
  lineTextOn: { fontWeight: '700', color: colors.primary },
  linePast: { color: colors.muted },
  link: { color: colors.primary, textAlign: 'center', marginTop: 20, fontWeight: '600' },
  tip: { color: colors.muted, lineHeight: 20, marginBottom: 8 },
  error: { color: colors.again, padding: 12 },
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
  speeds: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextOn: { color: colors.primaryText, fontWeight: '600' },
  offsetRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  offsetLabel: { color: colors.muted, fontSize: 13 },
  offsetValue: { color: colors.text, fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'center' },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  smallBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  syncTip: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  followBtn: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 270,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
  },
  followText: { color: colors.primaryText, fontWeight: '700' },
});
