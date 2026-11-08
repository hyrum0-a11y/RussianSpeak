import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { removeWord, useProgress, type SavedWord } from '../lib/storage';
import { speakRu } from '../lib/speech';
import { Marked } from '../components/Marked';
import { Button, colors } from '../components/ui';

const LEVEL = {
  hard: { label: 'Hard', color: colors.hard },
  good: { label: 'Good', color: colors.good },
  easy: { label: 'Easy', color: colors.easy },
} as const;

/** Мои слова: words you saved from the dictionary, each with sentences that use it. */
export default function Words() {
  const [p] = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  if (!p) return null;
  const words = [...p.words].sort((a, b) => a.word.localeCompare(b.word, 'ru'));

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.intro}>
        Learn each word inside real sentences. Save words from the 📖 Словарь with “＋ В мои слова”.
      </Text>
      <Button
        label={words.length ? `Практика · ${words.length}` : 'Open the Словарь'}
        onPress={() => (words.length ? router.push('/wordpractice') : router.push('/dictionary'))}
        style={{ flex: 0 }}
      />
      {words.map((w) => (
        <WordItem key={w.word} w={w} open={open === w.word} onPress={() => setOpen(open === w.word ? null : w.word)} />
      ))}
      {words.length ? <Text style={styles.hint}>Long-press a word to remove it.</Text> : null}
    </ScrollView>
  );
}

function WordItem({ w, open, onPress }: { w: SavedWord; open: boolean; onPress: () => void }) {
  const lvl = w.level ? LEVEL[w.level] : null;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={() =>
        Alert.alert('Remove word?', w.word, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeWord(w.word) },
        ])
      }
      style={[styles.item, open && { gap: 8 }]}
    >
      <View style={styles.head}>
        <Text style={styles.word}>{w.word}</Text>
        <Text style={[styles.level, { color: lvl?.color ?? colors.muted }]}>{lvl?.label ?? 'New'}</Text>
      </View>
      {open ? (
        <>
          {w.meanings.slice(0, 3).map((m, i) => (
            <Text key={i} style={styles.meaning}>
              {i + 1}. {m}
            </Text>
          ))}
          {w.examples.map((ex, i) => (
            <Pressable key={i} onPress={() => speakRu(ex)}>
              <Marked sentence={`🔊 ${ex}`} word={w.word} style={styles.example} />
            </Pressable>
          ))}
          {!w.examples.length ? <Text style={styles.hint}>No example sentences found for this word.</Text> : null}
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10, paddingBottom: 40 },
  intro: { color: colors.text, fontSize: 15, lineHeight: 21 },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  item: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  word: { fontSize: 19, fontWeight: '700', color: colors.text },
  level: { fontSize: 13, fontWeight: '700' },
  meaning: { fontSize: 15, lineHeight: 21, color: colors.text },
  example: { fontSize: 16, lineHeight: 23, color: colors.text },
});
