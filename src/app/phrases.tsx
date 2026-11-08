import { useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { allPhrases, catRu, CATEGORIES } from '../data/phrases';
import { apostropheToStress } from '../lib/compare';
import { speakRu } from '../lib/speech';
import { addCustomPhrase, removeCustomPhrase, useProgress } from '../lib/storage';
import { Button, Card, colors, T } from '../components/ui';

export default function Phrases() {
  const [p] = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Every category starts collapsed; tap a header to open it.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (title: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  const rate = p?.settings.speechRate ?? 0.9;
  const custom = p?.custom;

  const sections = useMemo(() => {
    const all = allPhrases(custom);
    // Your own phrases first.
    const order = ['My phrases', ...CATEGORIES.filter((c) => c !== 'My phrases')];
    return order
      .map((cat) => {
        const items = all.filter((x) => x.cat === cat);
        return { title: cat, count: items.length, data: expanded.has(cat) ? items : [] };
      })
      .filter((s) => s.count > 0 || s.title === 'My phrases');
  }, [custom, expanded]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.wrap}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={adding ? <AddForm
          onDone={() => {
            setAdding(false);
            setExpanded((prev) => new Set(prev).add('My phrases'));
          }}
        /> : (
        <Button label="＋ Добавить свою фразу" en="＋ Add my own phrase" onPress={() => setAdding(true)} style={{ flex: 0 }} />
      )}
      renderSectionHeader={({ section }) => {
        const isOpen = expanded.has(section.title);
        return (
          <Pressable onPress={() => toggle(section.title)} style={styles.headerRow} accessibilityRole="button">
            <Text style={styles.header}>
              {isOpen ? '▾' : '▸'} {catRu(section.title)}
            </Text>
            <Text style={styles.count}>{section.count}</Text>
          </Pressable>
        );
      }}
      renderSectionFooter={({ section }) =>
        section.title === 'My phrases' && section.count === 0 && expanded.has('My phrases') ? (
          <T style={styles.empty} en="Nothing yet. Add phrases you hear in real life.">Пока пусто. Добавляйте фразы, которые слышите в жизни.</T>
        ) : null
      }
      renderItem={({ item }) => {
        const learned = (p?.cards[item.id]?.reps ?? 0) > 0;
        const isOpen = open === item.id;
        return (
          <Pressable
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
            onPress={() => {
              speakRu(item.ru, rate);
              setOpen(isOpen ? null : item.id);
            }}
            onLongPress={
              item.deck === 'mine'
                ? () =>
                    Alert.alert('Удалить фразу?', item.ru, [
                      { text: 'Отмена', style: 'cancel' },
                      { text: 'Удалить', style: 'destructive', onPress: () => removeCustomPhrase(item.ru) },
                    ])
                : undefined
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.ru}>{item.ru}</Text>
              {isOpen || item.idiom ? <Text style={styles.en}>{item.en}</Text> : null}
              {isOpen && item.note ? <Text style={styles.note}>💡 {item.note}</Text> : null}
              {isOpen && item.deck === 'mine' ? <T style={styles.note} en="Long-press to delete.">Удерживайте, чтобы удалить.</T> : null}
            </View>
            <Text style={styles.icon}>{learned ? '✓' : '🔊'}</Text>
          </Pressable>
        );
      }}
    />
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [ru, setRu] = useState('');
  const [en, setEn] = useState('');
  const [note, setNote] = useState('');
  const ok = ru.trim().length > 0 && en.trim().length > 0;

  async function save() {
    if (!ok) return;
    await addCustomPhrase({ ru: apostropheToStress(ru.trim()), en: en.trim(), note: note.trim() || undefined });
    onDone();
  }

  return (
    <Card style={styles.form}>
      <T style={styles.formTitle} en="New phrase">Новая фраза</T>
      <TextInput style={styles.input} placeholder="По-ру́сски" value={ru} onChangeText={setRu} autoFocus />
      <T style={styles.help} en="Tip: type ' after a vowel to mark stress, e.g. приве't → приве́т.">Совет: поставьте ' после гласной, чтобы отметить ударение: приве't → приве́т.</T>
      <TextInput style={styles.input} placeholder="Значение по-английски" value={en} onChangeText={setEn} />
      <TextInput style={styles.input} placeholder="Заметка (необязательно)" value={note} onChangeText={setNote} />
      <View style={styles.formRow}>
        <Button label="Отмена" en="Cancel" variant="outline" onPress={onDone} />
        <Button label="🔊 Проверить" en="🔊 Test" variant="outline" disabled={!ru.trim()} onPress={() => speakRu(apostropheToStress(ru))} />
        <Button label="Сохранить" en="Save" disabled={!ok} onPress={save} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  header: { fontSize: 17, fontWeight: '700', color: colors.text },
  count: { color: colors.muted, fontSize: 14 },
  empty: { color: colors.muted, marginBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  ru: { fontSize: 17, fontWeight: '600', color: colors.text },
  en: { color: colors.muted, marginTop: 2 },
  note: { color: colors.muted, marginTop: 6, fontSize: 13 },
  icon: { fontSize: 18, color: colors.good },
  form: { gap: 10 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  help: { color: colors.muted, fontSize: 13 },
  formRow: { flexDirection: 'row', gap: 8 },
});
