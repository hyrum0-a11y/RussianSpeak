import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { buildUp, tokenize, wordAtFraction, wordCount, wordTiming } from '../lib/follow';
import { speakFollow, stopSpeaking } from '../lib/speech';
import { colors, hint, T } from './ui';

// Seconds per syllable at rate 1, learned from how long the voice actually takes.
let secPerWeight = 0.16;

/** Speak text and track which word is being said (engine word events, or a timing estimate). */
export function useFollow() {
  const [word, setWord] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const gen = useRef(0);

  function say(text: string, rate: number, onDone?: () => void) {
    const g = ++gen.current;
    const { starts, weight } = wordTiming(text);
    let t0 = 0;
    let fromEngine = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    setWord(0);
    setSpeaking(true);
    speakFollow(text, rate, {
      start: () => {
        if (g !== gen.current) return;
        t0 = Date.now();
        timer = setInterval(() => {
          if (g !== gen.current || fromEngine) return clearInterval(timer);
          const est = ((secPerWeight * weight) / rate) * 1000;
          setWord(wordAtFraction(starts, (Date.now() - t0) / est));
        }, 80);
      },
      word: (i) => {
        if (g !== gen.current) return;
        fromEngine = true;
        setWord(i);
      },
      done: () => {
        clearInterval(timer);
        if (g !== gen.current) return;
        if (t0 && weight > 2) {
          const measured = (((Date.now() - t0) / 1000) * rate) / weight;
          if (measured > 0.05 && measured < 0.6) secPerWeight = secPerWeight * 0.4 + measured * 0.6;
        }
        setWord(-1);
        setSpeaking(false);
        onDone?.();
      },
    });
  }

  function stop() {
    gen.current++;
    stopSpeaking();
    setWord(-1);
    setSpeaking(false);
  }

  useEffect(() => () => {
    gen.current++;
    stopSpeaking();
  }, []);

  return { word, speaking, say, stop };
}

/** Text with the word being spoken highlighted. Words from `limit` on are faded (not being practised yet). */
export function FollowText({ text, word, limit, style }: { text: string; word: number; limit?: number; style?: TextStyle }) {
  const toks = useMemo(() => tokenize(text), [text]);
  return (
    <Text style={style}>
      {toks.map((t, i) =>
        t.word ? (
          <Text
            key={i}
            style={[
              t.index === word && styles.on,
              word >= 0 && t.index < word && styles.past,
              limit != null && t.index >= limit && styles.faded,
            ]}
          >
            {t.text}
          </Text>
        ) : (
          <Text key={i} style={limit != null && toks.slice(i + 1).every((x) => !x.word || x.index >= limit) ? styles.faded : null}>
            {t.text}
          </Text>
        ),
      )}
    </Text>
  );
}

export const SPEEDS = [0.6, 0.8, 1, 1.2];
const GAPS = [0.5, 1, 2, 3];
const REPEATS_PER_STEP = 2;

/** "Говори́ть вме́сте": loop the phrase, highlight each word, and speak along at the same pace. */
export function SpeakAlong({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(0.8);
  const [gap, setGap] = useState(1);
  const [stepwise, setStepwise] = useState(false);
  const [step, setStep] = useState(0);
  const steps = useMemo(() => buildUp(text), [text]);
  const f = useFollow();
  const live = useRef({ running, speed, gap, stepwise, steps });
  live.current = { running, speed, gap, stepwise, steps };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function halt() {
    clearTimeout(timer.current);
    f.stop();
    setRunning(false);
    live.current.running = false;
  }

  // New card: stop and start over.
  useEffect(() => {
    halt();
    setStep(0);
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function round(s: number, count: number) {
    const L = live.current;
    const say = L.stepwise ? L.steps[Math.min(s, L.steps.length - 1)] : text;
    setStep(s);
    f.say(say, L.speed, () => {
      if (!live.current.running) return;
      timer.current = setTimeout(() => {
        const M = live.current;
        if (!M.running) return;
        if (!M.stepwise) return round(0, 0);
        const last = M.steps.length - 1;
        if (count + 1 < REPEATS_PER_STEP || s >= last) round(s, count + 1);
        else round(s + 1, 0);
      }, live.current.gap * 1000);
    });
  }

  function start() {
    setRunning(true);
    live.current.running = true;
    round(0, 0);
  }

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} onLongPress={() => hint('Speak along: the phrase repeats in a loop so you can say it with the voice')} hitSlop={8}>
        <Text style={styles.openLink}>🔁 Говори́ть вме́сте ▸</Text>
      </Pressable>
    );
  }

  const limit = stepwise && running ? wordCount(steps[step]) : undefined;
  return (
    <View style={styles.box}>
      <View style={styles.headRow}>
        <T style={styles.title} en="Speak along">🔁 Говори́ть вме́сте</T>
        <Pressable
          onPress={() => {
            halt();
            setOpen(false);
          }}
          onLongPress={() => hint('Close')}
          hitSlop={10}
        >
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <FollowText text={text} word={f.word} limit={limit} style={styles.text} />
      <T style={styles.tip} en="Say it together with the voice, at the same pace. It repeats until you stop it.">
        Говори́те вме́сте с го́лосом, в том же те́мпе. Повторя́ется, пока́ не остано́вите.
      </T>
      <Pressable
        onPress={running ? halt : start}
        onLongPress={() => hint(running ? 'Stop' : 'Start repeating')}
        style={({ pressed }) => [styles.play, running && styles.playOn, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.playText}>{running ? '⏹ Стоп' : '▶ Повторя́ть'}</Text>
      </Pressable>
      <Chips label="Ско́рость" en="Speed" values={SPEEDS} value={speed} fmt={(v) => `${v}×`} onChange={setSpeed} />
      <Chips label="Па́уза" en="Pause between repeats" values={GAPS} value={gap} fmt={(v) => `${v} с`} onChange={setGap} />
      {steps.length > 1 ? (
        <Pressable
          onPress={() => {
            halt();
            setStepwise((x) => !x);
            setStep(0);
          }}
          onLongPress={() => hint('Build up: start with the first piece, add one piece after every two repeats')}
          style={[styles.chip, styles.wide, stepwise && styles.chipOn]}
        >
          <Text style={[styles.chipText, stepwise && styles.chipTextOn]}>{stepwise ? '✓ ' : ''}По частя́м</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chips({
  label,
  en,
  values,
  value,
  fmt,
  onChange,
}: {
  label: string;
  en: string;
  values: number[];
  value: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.chipRow}>
      <T style={styles.chipLabel} en={en}>
        {label}
      </T>
      {values.map((v) => (
        <Pressable key={v} onPress={() => onChange(v)} style={[styles.chip, value === v && styles.chipOn]} hitSlop={4}>
          <Text style={[styles.chipText, value === v && styles.chipTextOn]}>{fmt(v)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  on: { color: colors.primary, backgroundColor: '#FFF4D6', fontWeight: '700' },
  past: { color: colors.muted },
  faded: { color: '#C9C4BA' },
  openLink: { color: colors.primary, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
  box: { gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.card },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  close: { fontSize: 18, color: colors.muted },
  text: { fontSize: 24, lineHeight: 34, color: colors.text, textAlign: 'center' },
  tip: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  play: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  playOn: { backgroundColor: colors.again },
  playText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  chipLabel: { color: colors.muted, fontSize: 13, minWidth: 70 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  wide: { alignSelf: 'center', paddingHorizontal: 16 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: colors.primaryText, fontWeight: '600' },
});
