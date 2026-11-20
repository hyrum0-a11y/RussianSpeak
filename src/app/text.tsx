import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePassages } from '../lib/texts';
import { Chips, FollowText, SPEEDS, useFollow } from '../components/Follow';
import { AskAI } from '../components/AskAI';
import { colors, hint, T } from '../components/ui';

const GAPS = [0.3, 1, 2, 4];

/** Read a longer text line by line, with the word being spoken lit up. */
export default function Reader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list] = usePassages();
  const passage = list?.find((x) => x.id === id);
  const lines = passage?.lines ?? [];

  const f = useFollow();
  const [cur, setCur] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [speed, setSpeed] = useState(0.8);
  const [gap, setGap] = useState(0.3);
  const [follow, setFollow] = useState(true);
  const live = useRef({ playing, loop, speed, gap });
  live.current = { playing, loop, speed, gap };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scroll = useRef<ScrollViewInstance>(null);
  const ys = useRef<number[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => () => clearTimeout(timer.current), []);

  // Keep the line being read in view, unless you've scrolled away yourself.
  useEffect(() => {
    if (cur < 0 || !follow) return;
    const y = ys.current[cur];
    if (y != null) scroll.current?.scrollTo({ y: Math.max(0, y - 140), animated: true });
  }, [cur, follow]);

  const next = (i: number) => {
    let j = i + 1;
    while (j < lines.length && !lines[j]) j++;
    return j < lines.length ? j : -1;
  };

  function read(i: number) {
    setCur(i);
    f.say(lines[i], live.current.speed, () => {
      if (!live.current.playing) return;
      const j = live.current.loop ? i : next(i);
      if (j < 0) {
        setPlaying(false);
        live.current.playing = false;
        return;
      }
      // A little extra pause at the end of a stanza.
      const extra = !live.current.loop && j > i + 1 ? 0.6 : 0;
      timer.current = setTimeout(() => live.current.playing && read(j), (live.current.gap + extra) * 1000);
    });
  }

  function start(i: number) {
    clearTimeout(timer.current);
    setPlaying(true);
    live.current.playing = true;
    setFollow(true);
    read(i);
  }

  function stop() {
    clearTimeout(timer.current);
    f.stop();
    setPlaying(false);
    live.current.playing = false;
  }

  const first = useMemo(() => lines.findIndex((l) => !!l), [lines]);

  if (!list) return null;
  if (!passage) return <T style={styles.missing} en="Text not found.">Текст не на́йден.</T>;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <T style={styles.headerTitle} en={passage.titleEn} numberOfLines={1}>
              {passage.title}
            </T>
          ),
        }}
      />
      <ScrollView ref={scroll} contentContainerStyle={styles.wrap} onScrollBeginDrag={() => playing && setFollow(false)}>
        {passage.author ? <Text style={styles.author}>{passage.author}</Text> : null}
        <T style={styles.tip} en="Tap a line to start reading from there. Read along out loud at the same pace.">
          Нажми́те на строку́, что́бы начать с неё. Чита́йте вслух вме́сте с го́лосом.
        </T>
        {lines.map((line, i) =>
          line ? (
            <Pressable
              key={i}
              onLayout={(e) => (ys.current[i] = e.nativeEvent.layout.y)}
              onPress={() => start(i)}
              style={[styles.line, i === cur && styles.lineOn]}
            >
              {i === cur ? (
                <FollowText text={line} word={f.speaking ? f.word : -1} style={styles.lineText} />
              ) : (
                <Text style={[styles.lineText, cur >= 0 && i < cur && styles.past]}>{line}</Text>
              )}
            </Pressable>
          ) : (
            <View key={i} style={styles.stanza} onLayout={(e) => (ys.current[i] = e.nativeEvent.layout.y)} />
          ),
        )}
        {cur >= 0 ? (
          <View style={styles.ask}>
            <AskAI text={lines[cur]} />
          </View>
        ) : null}
      </ScrollView>

      {playing && !follow ? (
        <Pressable onPress={() => setFollow(true)} style={styles.followBtn}>
          <Text style={styles.followText}>↓ Следи́ть за те́кстом</Text>
        </Pressable>
      ) : null}

      <View style={[styles.bar, { paddingBottom: 10 + insets.bottom }]}>
        <View style={styles.barRow}>
          <Pressable
            onPress={() => (playing ? stop() : start(cur >= 0 ? cur : first))}
            onLongPress={() => hint(playing ? 'Stop' : 'Read')}
            style={({ pressed }) => [styles.play, playing && styles.playOn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.playText}>{playing ? '⏹ Стоп' : '▶ Чита́ть'}</Text>
          </Pressable>
          <Pressable
            onPress={() => setLoop((x) => !x)}
            onLongPress={() => hint('Repeat the current line over and over')}
            style={[styles.loop, loop && styles.loopOn]}
          >
            <Text style={[styles.loopText, loop && styles.loopTextOn]}>🔁 Строка́</Text>
          </Pressable>
        </View>
        <Chips label="Ско́рость" en="Speed" values={SPEEDS} value={speed} fmt={(v) => `${v}×`} onChange={setSpeed} />
        <Chips label="Па́уза" en="Pause after each line (longer = time to repeat it yourself)" values={GAPS} value={gap} fmt={(v) => `${v} с`} onChange={setGap} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40, gap: 2 },
  missing: { padding: 24, color: colors.muted, textAlign: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  author: { color: colors.muted, fontSize: 14, marginBottom: 4 },
  tip: { color: colors.muted, fontSize: 13, marginBottom: 10 },
  line: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  lineOn: { backgroundColor: '#EEF3FA' },
  lineText: { fontSize: 20, lineHeight: 29, color: colors.text },
  past: { color: colors.muted },
  stanza: { height: 14 },
  ask: { marginTop: 16 },
  followBtn: { position: 'absolute', alignSelf: 'center', bottom: 150, backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  followText: { color: colors.primaryText, fontWeight: '600' },
  bar: { borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  barRow: { flexDirection: 'row', gap: 8 },
  play: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  playOn: { backgroundColor: colors.again },
  playText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
  loop: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  loopOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  loopText: { color: colors.text, fontWeight: '600' },
  loopTextOn: { color: colors.primaryText },
});
