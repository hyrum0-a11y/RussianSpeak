import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { Phrase } from '../data/phrases';
import { compareWords, score, type WordResult } from '../lib/compare';
import { practicePool } from '../lib/pool';
import { speakRu } from '../lib/speech';
import { loadProgress, touchStreak, updateProgress, useProgress } from '../lib/storage';
import { Peek } from '../components/Peek';
import { WordDiff } from '../components/WordDiff';
import { Button, Card, colors, Row, T } from '../components/ui';

const SESSION = 10;
// Long poetry lines are tiring to type; keep dictation to short/medium phrases.
const fits = (x: Phrase) => x.ru.length <= 60;

export default function Dictation() {
  const [p] = useProgress();
  const [items, setItems] = useState<Phrase[] | null>(null);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadProgress().then((prog) => setItems(practicePool(prog, SESSION, fits)));
  }, []);

  const rate = p?.settings.speechRate ?? 0.9;
  const current = items?.[i];

  useEffect(() => {
    if (current) speakRu(current.ru, rate);
  }, [current, rate]);

  if (!items) return null;

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>Гото́во! ✍️</Text>
        <Text style={styles.doneBody}>В сре́днем {Math.round((total / Math.max(1, items.length)) * 100)}% слов ве́рно.</Text>
        <Button label="Наза́д" en="Back home" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  function check() {
    if (!current) return;
    const r = compareWords(current.ru, typed);
    setResults(r);
    setTotal((t) => t + score(r));
    updateProgress(touchStreak);
  }

  function next() {
    setTyped('');
    setResults(null);
    setI((n) => n + 1);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.progress}>
        {i + 1} / {items.length}
      </Text>
      <Card style={styles.card}>
        <T style={styles.label} en="Listen and type what you hear">Слу́шайте и пиши́те, что слы́шите</T>
        <Row>
          <Button label="🔊 Слу́шать" en="🔊 Play" onPress={() => speakRu(current.ru, rate)} />
          <Button label="🐢 Ме́дленно" en="🐢 Slow" variant="outline" onPress={() => speakRu(current.ru, Math.max(0.4, rate * 0.6))} />
        </Row>
        <TextInput
          style={styles.input}
          value={typed}
          onChangeText={setTyped}
          placeholder="Пиши́те здесь…"
          autoCorrect={false}
          autoCapitalize="sentences"
          editable={!results}
          multiline
          onSubmitEditing={check}
        />
        <T style={styles.help} en="Switch your keyboard to Russian (🌐 key). Stress marks and ё are optional.">Включи́те ру́сскую клавиату́ру (🌐). Ударе́ния и ё мо́жно не ста́вить.</T>
      </Card>

      {results ? (
        <Card style={styles.card}>
          <WordDiff results={results} />
          <Text style={styles.score}>{Math.round(score(results) * 100)}% слов ве́рно</Text>
          <Peek en={current.en} open={current.idiom} />
          <Button label="Да́льше →" en="Next →" onPress={next} style={{ flex: 0 }} />
        </Card>
      ) : (
        <Row>
          <Button label="Пропусти́ть" en="Skip" variant="outline" onPress={() => setResults(compareWords(current.ru, ''))} />
          <Button label="Прове́рить" en="Check" disabled={!typed.trim()} onPress={check} />
        </Row>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, paddingBottom: 40 },
  progress: { color: colors.muted, textAlign: 'center' },
  card: { gap: 12 },
  label: { color: colors.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    minHeight: 64,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  help: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  score: { color: colors.muted, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  doneTitle: { fontSize: 30, fontWeight: '700', color: colors.text },
  doneBody: { color: colors.muted, textAlign: 'center' },
});
