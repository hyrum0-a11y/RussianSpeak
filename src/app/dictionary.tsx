import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { allPhrases } from '../data/phrases';
import { lookUp, titleFor, wiktionaryUrl, type Entry } from '../lib/dictionary';
import { speakRu } from '../lib/speech';
import { saveWord, useProgress } from '../lib/storage';
import { dictKey, markWord, wordList } from '../lib/wiktionary';
import { colors } from '../components/ui';
import { AskAI } from '../components/AskAI';

type Row = { word: string; key: string; lookup?: boolean };

export default function Dictionary() {
  const [p] = useProgress();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const custom = p?.custom;

  const words = useMemo(() => wordList(allPhrases(custom).map((x) => x.ru)), [custom]);

  const rows: Row[] = useMemo(() => {
    const k = dictKey(q);
    if (!k) return words;
    const starts = words.filter((w) => w.key.startsWith(k));
    const contains = words.filter((w) => !w.key.startsWith(k) && w.key.includes(k));
    const exact = words.some((w) => w.key === k);
    const typed = q.trim().toLowerCase();
    return [...(exact || !/[а-яё]/i.test(typed) ? [] : [{ word: typed, key: `lookup:${k}`, lookup: true }]), ...starts, ...contains];
  }, [q, words]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Поиск слова…"
          value={q}
          onChangeText={(t) => {
            setQ(t);
            setOpen(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <Text style={styles.count}>
          {q ? `${rows.filter((r) => !r.lookup).length} из ${words.length}` : `${words.length} слов из ваших карточек · или найдите любое слово`}
        </Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={30}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <WordRow
            row={item}
            open={open === item.key}
            onPress={() => setOpen(open === item.key ? null : item.key)}
            onPick={(w) => {
              const k = dictKey(w);
              setQ(w);
              setOpen(words.some((x) => x.key === k) ? k : `lookup:${k}`);
            }}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Ничего не найдено.</Text>}
      />
    </View>
  );
}

function WordRow({ row, open, onPress, onPick }: { row: Row; open: boolean; onPress: () => void; onPick: (w: string) => void }) {
  return (
    <View style={[styles.row, open && styles.rowOpen]}>
      <Pressable onPress={onPress} style={styles.rowHead}>
        <Text style={styles.word}>{row.lookup ? `🔎 «${row.word}»` : row.word}</Text>
        <Pressable onPress={() => speakRu(row.word)} hitSlop={10}>
          <Text style={styles.speak}>🔊</Text>
        </Pressable>
      </Pressable>
      {open ? <Definition word={row.word} onPick={onPick} /> : null}
    </View>
  );
}

function Definition({ word, onPick }: { word: string; onPick: (w: string) => void }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    lookUp(word)
      .then((e) => live && setEntry(e))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [word]);

  if (error) return <Text style={styles.muted}>Нет связи со словарём. Проверьте интернет.</Text>;
  if (!entry) return <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />;

  if (!entry.found) {
    return (
      <View style={{ gap: 8 }}>
        <Text style={styles.muted}>
          {entry.suggestions.length ? 'Это, наверное, форма слова. Может быть:' : 'Статьи нет.'}
        </Text>
        <View style={styles.chips}>
          {entry.suggestions.map((s) => (
            <Pressable key={s} onPress={() => onPick(s)} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {entry.title !== titleFor(word) ? <Text style={styles.muted}>{entry.title}</Text> : null}
      {entry.meanings.map((m, i) => (
        <Text key={i} style={styles.meaning}>
          {i + 1}. {m}
        </Text>
      ))}
      <SaveWord title={entry.title} meanings={entry.meanings} examples={entry.examples} />
      <AskAI text={word} />
      <Pressable onPress={() => Linking.openURL(wiktionaryUrl(entry.title))} hitSlop={6}>
        <Text style={styles.source}>Викисловарь ↗</Text>
      </Pressable>
    </View>
  );
}

/** "＋ В мои слова": keep the word with example sentences from Викисловарь and from your cards. */
function SaveWord({ title, meanings, examples }: { title: string; meanings: string[]; examples: string[] }) {
  const [p] = useProgress();
  if (!p) return null;
  const saved = p.words.some((w) => w.word === title);
  if (saved) return <Text style={styles.saved}>✓ В моих словах</Text>;
  const fromCards = allPhrases(p.custom)
    .map((x) => x.ru.replace(/ \/ /g, ' '))
    .filter((ru) => markWord(ru, title).some((part) => part.hit));
  return (
    <Pressable
      onPress={() => saveWord({ word: title, meanings, examples: [...new Set([...examples, ...fromCards])].slice(0, 15) })}
      style={styles.saveBtn}
      accessibilityRole="button"
    >
      <Text style={styles.saveText}>＋ В мои слова</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  saved: { color: colors.good, fontWeight: '600', marginTop: 4 },
  saveBtn: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primary },
  saveText: { color: colors.primaryText, fontWeight: '700' },
  searchWrap: { padding: 16, paddingBottom: 8, gap: 6, backgroundColor: colors.bg },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.card,
  },
  count: { color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  row: { borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 4 },
  rowOpen: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingBottom: 12, marginVertical: 4 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  word: { fontSize: 19, color: colors.text, fontWeight: '500' },
  speak: { fontSize: 18 },
  meaning: { fontSize: 16, lineHeight: 23, color: colors.text },
  muted: { color: colors.muted },
  source: { color: colors.primary, fontSize: 13, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 15 },
});
