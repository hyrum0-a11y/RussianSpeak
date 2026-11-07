import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PROMPTS, type Prompt } from '../data/prompts';
import { speakRu } from '../lib/speech';
import { buildQueue, newCard, schedule, type Grade } from '../lib/srs';
import { loadProgress, touchStreak, updateProgress, useProgress } from '../lib/storage';
import { SpeakControls } from '../components/SpeakControls';
import { Button, Card, colors, Row } from '../components/ui';

const byId = new Map(PROMPTS.map((p) => [p.id, p]));
const SESSION_NEW = 5;

export default function Respond() {
  const [p] = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [showText, setShowText] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    loadProgress().then((prog) => setShowText(prog.settings.showPromptText));
  }, []);

  useEffect(() => {
    loadProgress().then((prog) => setQueue(buildQueue(PROMPTS.map((x) => x.id), prog.prompts, Date.now(), SESSION_NEW)));
  }, []);

  const current: Prompt | undefined = useMemo(() => (queue?.length ? byId.get(queue[0]) : undefined), [queue]);
  const rate = p?.settings.speechRate ?? 0.9;

  // Ask the question out loud whenever a new prompt appears.
  useEffect(() => {
    if (current) speakRu(current.ru, rate);
  }, [current, rate]);

  if (!p || !queue) return null;

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>Молоде́ц! 💪</Text>
        <Text style={styles.doneBody}>That's all the prompts for now.</Text>
        <Button label="Back home" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  async function grade(g: Grade) {
    if (!current) return;
    const state = p?.prompts[current.id] ?? newCard(Date.now());
    const next = schedule(state, g, Date.now());
    await updateProgress((prog) => touchStreak({ ...prog, prompts: { ...prog.prompts, [current.id]: next } }));
    setShowText(p?.settings.showPromptText ?? true);
    setShowAnswers(false);
    setQueue((q) => (q ? q.slice(1) : q));
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.progress}>{queue.length} left</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Question</Text>
        {showText ? (
          <>
            <Text style={styles.ru}>{current.ru}</Text>
            <Text style={styles.en}>{current.en}</Text>
          </>
        ) : (
          <Pressable onPress={() => setShowText(true)}>
            <Text style={styles.hidden}>Listening mode. Tap to show the Cyrillic.</Text>
          </Pressable>
        )}
        <Row>
          <Button label="🔊 Ask again" variant="outline" onPress={() => speakRu(current.ru, rate)} />
          <Button label="🐢 Slow" variant="outline" onPress={() => speakRu(current.ru, Math.max(0.4, rate * 0.6))} />
        </Row>
        {current.hint ? <Text style={styles.hint}>💡 Grammar: {current.hint}</Text> : null}
      </Card>

      <Text style={styles.section}>Your answer: record it out loud</Text>
      <SpeakControls text={current.answers[0].ru} rate={rate} showListen={false} />

      {showAnswers ? (
        <>
          <Text style={styles.section}>Sample answers</Text>
          {current.answers.map((a) => (
            <Card key={a.ru} style={styles.answer}>
              <Text style={styles.answerRu}>{a.ru}</Text>
              <Text style={styles.en}>{a.en}</Text>
              <Button label="🔊 Listen" variant="outline" onPress={() => speakRu(a.ru, rate)} style={{ flex: 0 }} />
            </Card>
          ))}
          <Text style={styles.question}>How did your answer go?</Text>
          <Row>
            <Button label="Needs work" color={colors.again} onPress={() => grade('again')} />
            <Button label="Okay" color={colors.good} onPress={() => grade('good')} />
            <Button label="Nailed it" color={colors.easy} onPress={() => grade('easy')} />
          </Row>
        </>
      ) : (
        <Button label="Show sample answers" onPress={() => setShowAnswers(true)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 40 },
  progress: { color: colors.muted, textAlign: 'center' },
  card: { gap: 12 },
  label: { color: colors.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  ru: { fontSize: 24, fontWeight: '600', color: colors.primary },
  en: { color: colors.muted, fontSize: 15 },
  hidden: { fontSize: 16, color: colors.muted, fontStyle: 'italic', paddingVertical: 8 },
  hint: { color: colors.muted, fontSize: 14 },
  section: { fontWeight: '600', color: colors.text, marginTop: 6 },
  answer: { gap: 8, padding: 16 },
  answerRu: { fontSize: 18, fontWeight: '600', color: colors.text },
  question: { textAlign: 'center', color: colors.muted, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  doneTitle: { fontSize: 30, fontWeight: '700', color: colors.text },
  doneBody: { color: colors.muted, textAlign: 'center' },
});
