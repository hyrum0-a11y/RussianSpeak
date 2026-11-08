import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { removeWord, useProgress, type SavedWord } from '../lib/storage';
import { speakRu } from '../lib/speech';
import { Marked } from '../components/Marked';
import { contexts } from '../lib/wiktionary';
import { LEVEL_NAMES } from '../lib/srs';
import { Button, colors, T } from '../components/ui';

const LEVEL = {
  hard: { label: LEVEL_NAMES.hard.ru, color: colors.hard },
  good: { label: LEVEL_NAMES.good.ru, color: colors.good },
  easy: { label: LEVEL_NAMES.easy.ru, color: colors.easy },
} as const;

/** Мои́ сло́ва: words you saved from the dictionary, each with sentences that use it. */
export default function Words() {
  const [p] = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  if (!p) return null;
  const words = [...p.words].sort((a, b) => a.word.localeCompare(b.word, 'ru'));

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.intro}>
        Учи́те ка́ждое сло́во в живы́х фра́зах. Сохраня́йте сло́ва из 📖 Словаря́ кно́пкой «＋ В мои́ сло́ва».
      </Text>
      <Button
        label={words.length ? `Пра́ктика · ${words.length}` : 'Откры́ть Слова́рь'}
        onPress={() => (words.length ? router.push('/wordpractice') : router.push('/dictionary'))}
        style={{ flex: 0 }}
      />
      {words.map((w) => (
        <WordItem key={w.word} w={w} open={open === w.word} onPress={() => setOpen(open === w.word ? null : w.word)} />
      ))}
      {words.length ? <T style={styles.hint} en="Long-press a word to remove it.">Уде́рживайте сло́во, что́бы удали́ть его́.</T> : null}
    </ScrollView>
  );
}

function WordItem({ w, open, onPress }: { w: SavedWord; open: boolean; onPress: () => void }) {
  const lvl = w.level ? LEVEL[w.level] : null;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={() =>
        Alert.alert('Удали́ть сло́во?', w.word, [
          { text: 'Отме́на', style: 'cancel' },
          { text: 'Удали́ть', style: 'destructive', onPress: () => removeWord(w.word) },
        ])
      }
      style={[styles.item, open && { gap: 8 }]}
    >
      <View style={styles.head}>
        <Text style={styles.word}>{w.word}</Text>
        <Text style={[styles.level, { color: lvl?.color ?? colors.muted }]}>{lvl?.label ?? 'Но́вое'}</Text>
      </View>
      {open ? (
        <>
          {w.meanings.slice(0, 3).map((m, i) => (
            <Text key={i} style={styles.meaning}>
              {i + 1}. {m}
            </Text>
          ))}
          {contexts(w.word, w.examples, w.phrases).map((c, i) => (
            <Pressable key={i} onPress={() => speakRu(c.short)} onLongPress={() => c.full && speakRu(c.full)}>
              <Marked sentence={`🔊 ${c.short}`} word={w.word} style={styles.example} />
            </Pressable>
          ))}
          {!w.examples.length && !w.phrases?.length ? <T style={styles.hint} en="No example sentences found for this word.">Приме́ров для э́того слова́ не нашло́сь.</T> : null}
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
