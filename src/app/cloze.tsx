import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { Phrase } from '../data/phrases';
import { pickCloze, sameWord } from '../lib/compare';
import { practicePool } from '../lib/pool';
import { speakRu } from '../lib/speech';
import { loadProgress, touchStreak, updateProgress, useProgress } from '../lib/storage';
import { Peek } from '../components/Peek';
import { Button, Card, colors, Row } from '../components/ui';

const SESSION = 10;

type Item = { phrase: Phrase; before: string; answer: string; after: string };

function makeItems(phrases: Phrase[]): Item[] {
  return phrases.flatMap((phrase) => {
    const c = pickCloze(phrase.ru, Math.floor(Math.random() * 100));
    return c ? [{ phrase, ...c }] : [];
  });
}

export default function Cloze() {
  const [p] = useProgress();
  const [items, setItems] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const [right, setRight] = useState(0);

  useEffect(() => {
    loadProgress().then((prog) => setItems(makeItems(practicePool(prog, SESSION * 2)).slice(0, SESSION)));
  }, []);

  const rate = p?.settings.speechRate ?? 0.9;
  if (!items) return null;
  const current = items[i];

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>Молоде́ц! ✏️</Text>
        <Text style={styles.doneBody}>
          {right} of {items.length} right.
        </Text>
        <Button label="Назад" en="Back home" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  function check() {
    if (!current) return;
    const ok = sameWord(typed.trim(), current.answer);
    setChecked(ok);
    if (ok) setRight((n) => n + 1);
    speakRu(current.phrase.ru, rate);
    updateProgress(touchStreak);
  }

  function next() {
    setTyped('');
    setChecked(null);
    setI((n) => n + 1);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.progress}>
        {i + 1} / {items.length} · {current.phrase.cat}
      </Text>
      <Card style={styles.card}>
        <Text style={styles.sentence}>
          {current.before}
          <Text style={checked === null ? styles.blank : checked ? styles.ok : styles.bad}>
            {checked === null ? ' ____ ' : current.answer}
          </Text>
          {current.after}
        </Text>
        <Peek en={current.phrase.en} open={current.phrase.idiom} />
      </Card>

      {checked === null ? (
        <>
          <TextInput
            style={styles.input}
            value={typed}
            onChangeText={setTyped}
            placeholder="Пропущенное слово"
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
            onSubmitEditing={check}
          />
          <Row>
            <Button label="Пропустить" en="Skip" variant="outline" onPress={() => { setChecked(false); speakRu(current.phrase.ru, rate); }} />
            <Button label="Проверить" en="Check" disabled={!typed.trim()} onPress={check} />
          </Row>
        </>
      ) : (
        <>
          <Text style={[styles.verdict, { color: checked ? colors.good : colors.again }]}>
            {checked ? 'Пра́вильно! ✓' : `Вы написали: ${typed || '—'}`}
          </Text>
          <Row>
            <Button label="🔊 Ещё раз" en="🔊 Replay" variant="outline" onPress={() => speakRu(current.phrase.ru, rate)} />
            <Button label="Дальше →" en="Next →" onPress={next} />
          </Row>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, paddingBottom: 40 },
  progress: { color: colors.muted, textAlign: 'center' },
  card: { gap: 12, minHeight: 160, justifyContent: 'center' },
  sentence: { fontSize: 24, textAlign: 'center', color: colors.text, lineHeight: 34 },
  blank: { color: colors.primary, fontWeight: '700' },
  ok: { color: colors.good, fontWeight: '700' },
  bad: { color: colors.again, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    color: colors.text,
    backgroundColor: colors.card,
    textAlign: 'center',
  },
  verdict: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  doneTitle: { fontSize: 30, fontWeight: '700', color: colors.text },
  doneBody: { color: colors.muted, textAlign: 'center' },
});
