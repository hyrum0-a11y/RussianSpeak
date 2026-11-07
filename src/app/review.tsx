import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { DECKS, phrasesIn, PHRASES, type Deck, type Phrase } from '../data/phrases';
import { buildQueue, newCard, previewInterval, schedule, type Grade } from '../lib/srs';
import { countNewIntroduced, loadProgress, newLeftToday, touchStreak, updateProgress, useProgress } from '../lib/storage';
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
  const params = useLocalSearchParams<{ deck?: string }>();
  const deck: Deck = DECKS.some((d) => d.id === params.deck) ? (params.deck as Deck) : 'everyday';
  const deckInfo = DECKS.find((d) => d.id === deck)!;

  const [p] = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  // Build the session queue once.
  useEffect(() => {
    loadProgress().then((prog) => {
      const ids = phrasesIn(deck).map((x) => x.id);
      setQueue(buildQueue(ids, prog.cards, Date.now(), newLeftToday(prog, deck)));
    });
  }, [deck]);

  const current: Phrase | undefined = useMemo(() => (queue?.length ? byId.get(queue[0]) : undefined), [queue]);

  if (!p || !queue) return null;
  const title = <Stack.Screen options={{ title: deckInfo.title }} />;

  if (!current) {
    return (
      <View style={styles.center}>
        {title}
        <Text style={styles.doneTitle}>Отли́чно! 🎉</Text>
        <Text style={styles.doneBody}>You reviewed {doneCount} cards. Come back later for more.</Text>
        <Button label="Back home" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  const state = p.cards[current.id] ?? newCard(Date.now());
  const isNew = !p.cards[current.id];
  const ruFirst = p.settings.front === 'ru';

  async function grade(g: Grade) {
    if (!current) return;
    const next = schedule(state, g, Date.now());
    await updateProgress((prog) => {
      const counted = isNew ? countNewIntroduced(prog, deck) : prog;
      return touchStreak({ ...counted, cards: { ...counted.cards, [current.id]: next } });
    });
    setRevealed(false);
    setDoneCount((n) => n + 1);
    // "Again" puts the card back at the end of this session.
    setQueue((q) => (q ? [...q.slice(1), ...(g === 'again' ? [current.id] : [])] : q));
  }

  const ru = <Text style={styles.ru}>{current.ru}</Text>;
  const en = <Text style={styles.en}>{current.en}</Text>;
  const note = current.note ? <Text style={styles.note}>💡 {current.note}</Text> : null;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {title}
      <Text style={styles.progress}>
        {queue.length} left{isNew ? ' · NEW' : ''} · {current.cat}
      </Text>

      <Card style={styles.card}>
        {ruFirst ? ru : en}
        {revealed ? (
          <>
            <View style={styles.divider} />
            {ruFirst ? en : ru}
            {note}
          </>
        ) : (
          <Text style={styles.hint}>
            {ruFirst ? 'Read it out loud. What does it mean?' : 'Say it in Russian, out loud.'}
          </Text>
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
        <Button label={ruFirst ? 'Check meaning & hear it' : 'Show Russian'} onPress={() => setRevealed(true)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  progress: { color: colors.muted, textAlign: 'center' },
  card: { minHeight: 200, justifyContent: 'center', gap: 12 },
  en: { fontSize: 20, textAlign: 'center', color: colors.text },
  ru: { fontSize: 28, fontWeight: '600', textAlign: 'center', color: colors.primary },
  hint: { color: colors.muted, textAlign: 'center' },
  note: { color: colors.muted, textAlign: 'center', fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border },
  question: { textAlign: 'center', color: colors.muted, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  doneTitle: { fontSize: 30, fontWeight: '700', color: colors.text },
  doneBody: { color: colors.muted, textAlign: 'center' },
});
