import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { gradeWord, loadProgress, useProgress } from '../lib/storage';
import { speakRu } from '../lib/speech';
import { Marked } from '../components/Marked';
import { Button, Card, colors, Row } from '../components/ui';

const ORDER = { undefined: 0, hard: 1, good: 2, easy: 3 } as Record<string, number>;

/** One word at a time, shown inside a sentence. Work out the meaning, then check. */
export default function WordPractice() {
  const [p] = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [shown, setShown] = useState(false);

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
        <Text style={styles.done}>Отли́чно! 🎉</Text>
        <Button label="Back" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  // A different sentence each time you see the word.
  const sentence = w.examples.length ? w.examples[w.seen % w.examples.length] : w.word;
  const others = w.examples.filter((x) => x !== sentence).slice(0, 2);

  async function grade(level: 'hard' | 'good' | 'easy') {
    await gradeWord(w!.word, level);
    setShown(false);
    setQueue((q) => (q ? q.slice(1) : q));
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.progress}>{queue.length} left</Text>
      <Card style={styles.card}>
        <Marked sentence={sentence} word={w.word} style={styles.sentence} />
        <Button label="🔊 Слушать" variant="outline" onPress={() => speakRu(sentence)} style={{ flex: 0 }} />
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
              <Marked key={i} sentence={`• ${ex}`} word={w.word} style={styles.other} />
            ))}
          </>
        ) : (
          <Text style={styles.hint}>Что значит выделенное слово?</Text>
        )}
      </Card>
      {shown ? (
        <Row>
          <Button label="Hard" color={colors.hard} onPress={() => grade('hard')} />
          <Button label="Good" color={colors.good} onPress={() => grade('good')} />
          <Button label="Easy" color={colors.easy} onPress={() => grade('easy')} />
        </Row>
      ) : (
        <Button label="Показать значение" onPress={() => setShown(true)} />
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
  hint: { color: colors.muted, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border },
  word: { fontSize: 24, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  meaning: { fontSize: 16, lineHeight: 23, color: colors.text },
  other: { fontSize: 15, lineHeight: 22, color: colors.muted },
});
