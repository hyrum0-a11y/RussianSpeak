import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PHRASES, type Phrase } from '../data/phrases';
import { buildQueue, newCard, previewInterval, schedule, type Grade } from '../lib/srs';
import { loadProgress, today, touchStreak, updateProgress, useProgress } from '../lib/storage';
import { SpeakControls } from '../components/SpeakControls';
import { Button, Card, colors, Row } from '../components/ui';

const byId = new Map(PHRASES.map((p) => [p.id, p]));

const GRADES: { grade: Grade; label: string; color: string }[] = [
  { grade: 'again', label: 'Again', color: colors.again },
  { grade: 'hard', label: 'Hard', color: colors.hard },
  { grade: 'good', label: 'Good', color: colors.good },
  { grade: 'easy', label: 'Easy', color: colors.easy },
];

export default function Review() {
  const [p] = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  // Build the session queue once.
  useEffect(() => {
    loadProgress().then((prog) => {
      const used = prog.newIntroduced.date === today() ? prog.newIntroduced.count : 0;
      const newLeft = Math.max(0, prog.settings.newPerDay - used);
      setQueue(buildQueue(PHRASES.map((x) => x.id), prog.cards, Date.now(), newLeft));
    });
  }, []);

  const current: Phrase | undefined = useMemo(() => (queue?.length ? byId.get(queue[0]) : undefined), [queue]);

  if (!p || !queue) return null;

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>Отли́чно! 🎉</Text>
        <Text style={styles.doneBody}>You reviewed {doneCount} cards. Come back later for more.</Text>
        <Button label="Back home" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  const state = p.cards[current.id] ?? newCard(Date.now());
  const isNew = !p.cards[current.id];

  async function grade(g: Grade) {
    if (!current) return;
    const now = Date.now();
    const next = schedule(state, g, now);
    await updateProgress((prog) => {
      const t = today();
      const intro = isNew
        ? { date: t, count: (prog.newIntroduced.date === t ? prog.newIntroduced.count : 0) + 1 }
        : prog.newIntroduced;
      return touchStreak({ ...prog, cards: { ...prog.cards, [current.id]: next }, newIntroduced: intro });
    });
    setRevealed(false);
    setDoneCount((n) => n + 1);
    // "Again" puts the card back at the end of this session.
    setQueue((q) => (q ? [...q.slice(1), ...(g === 'again' ? [current.id] : [])] : q));
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.progress}>
        {queue.length} left{isNew ? ' · NEW' : ''} · {current.cat}
      </Text>

      <Card style={styles.card}>
        <Text style={styles.en}>{current.en}</Text>
        {revealed ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.ru}>{current.ru}</Text>
            {current.note ? <Text style={styles.note}>💡 {current.note}</Text> : null}
          </>
        ) : (
          <Text style={styles.hint}>Say it in Russian, out loud.</Text>
        )}
      </Card>

      {revealed ? (
        <>
          <SpeakControls text={current.ru} rate={p.settings.speechRate} autoPlay />
          <Text style={styles.question}>How well did you know it?</Text>
          <Row>
            {GRADES.map(({ grade: g, label, color }) => (
              <Button key={g} label={label} sub={previewInterval(state, g, Date.now())} color={color} onPress={() => grade(g)} />
            ))}
          </Row>
        </>
      ) : (
        <Button label="Show Russian" onPress={() => setRevealed(true)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  progress: { color: colors.muted, textAlign: 'center' },
  card: { minHeight: 200, justifyContent: 'center', gap: 12 },
  en: { fontSize: 22, textAlign: 'center', color: colors.text },
  ru: { fontSize: 28, fontWeight: '600', textAlign: 'center', color: colors.primary },
  hint: { color: colors.muted, textAlign: 'center' },
  note: { color: colors.muted, textAlign: 'center', fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border },
  question: { textAlign: 'center', color: colors.muted, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  doneTitle: { fontSize: 30, fontWeight: '700', color: colors.text },
  doneBody: { color: colors.muted, textAlign: 'center' },
});
