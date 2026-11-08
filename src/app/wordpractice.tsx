import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { contexts } from '../lib/wiktionary';
import { router } from 'expo-router';
import { gradeWord, loadProgress, useProgress } from '../lib/storage';
import { speakRu } from '../lib/speech';
import { Marked } from '../components/Marked';
import { Button, Card, colors, Row, T, useLang } from '../components/ui';

const ORDER = { undefined: 0, hard: 1, good: 2, easy: 3 } as Record<string, number>;

/** One word at a time, shown inside a sentence. Work out the meaning, then check. */
export default function WordPractice() {
  const tr = useLang();
  const [p] = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [shown, setShown] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    // New and Hard words first, shuffled within each group.
    loadProgress().then((prog) =>
      setQueue(
        [...prog.words]
          .sort(() => Math.random() - 0.5)
          .sort((a, b) => ORDER[String(a.level)] - ORDER[String(b.level)])
          .map((w) => w.word),
      ),
    );
  }, []);

  if (!p || !queue) return null;
  const w = p.words.find((x) => x.word === queue[0]);
  if (!w) {
    return (
      <View style={styles.center}>
        <T style={styles.done} en="Great! 🎉">Отли́чно! 🎉</T>
        <Button label="Наза́д" en="Back" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  // A short phrase with the word, a different one each time; the full sentence is a tap away.
  const items = contexts(w.word, w.examples, w.phrases);
  const item = items.length ? items[w.seen % items.length] : { short: w.word };
  const sentence = full && item.full ? item.full : item.short;
  const others = items.filter((x) => x !== item).slice(0, 3);

  async function grade(level: 'hard' | 'good' | 'easy') {
    await gradeWord(w!.word, level);
    setShown(false);
    setFull(false);
    setQueue((q) => (q ? q.slice(1) : q));
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.progress}>{queue.length} left</Text>
      <Card style={styles.card}>
        <Marked sentence={sentence} word={w.word} style={styles.sentence} />
        {item.full ? (
          <Pressable onPress={() => setFull(!full)} hitSlop={8}>
            <Text style={styles.link}>{full ? tr('◂ Ко́ротко', '◂ Short') : tr('Це́лое предложе́ние ▸', 'Whole sentence ▸')}</Text>
          </Pressable>
        ) : null}
        <Button label="🔊 Слу́шать" variant="outline" onPress={() => speakRu(sentence)} style={{ flex: 0 }} />
        {shown ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.word}>{w.word}</Text>
            {w.meanings.slice(0, 3).map((m, i) => (
              <Text key={i} style={styles.meaning}>
                {i + 1}. {m}
              </Text>
            ))}
            {others.map((ex, i) => (
              <Marked key={i} sentence={`• ${ex.short}`} word={w.word} style={styles.other} />
            ))}
          </>
        ) : (
          <T style={styles.hint} en="What does the highlighted word mean?">Что зна́чит вы́деленное сло́во?</T>
        )}
      </Card>
      {shown ? (
        <Row>
          <Button label="Учу́" en="Still learning: I want to practice it" color={colors.hard} onPress={() => grade('hard')} />
          <Button label="Почти́" en="Almost: I got it, but not confident yet" color={colors.good} onPress={() => grade('good')} />
          <Button label="Зна́ю" en="I know it: it's memorized" color={colors.easy} onPress={() => grade('easy')} />
        </Row>
      ) : (
        <Button label="Показа́ть значе́ние" onPress={() => setShown(true)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  center: { flex: 1, padding: 24, gap: 16, justifyContent: 'center', alignItems: 'center' },
  done: { fontSize: 28, fontWeight: '700', color: colors.text },
  progress: { color: colors.muted, textAlign: 'center' },
  card: { gap: 12 },
  sentence: { fontSize: 22, lineHeight: 32, color: colors.text, textAlign: 'center' },
  link: { color: colors.primary, textAlign: 'center', fontWeight: '600' },
  hint: { color: colors.muted, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border },
  word: { fontSize: 24, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  meaning: { fontSize: 16, lineHeight: 23, color: colors.text },
  other: { fontSize: 15, lineHeight: 22, color: colors.muted },
});
