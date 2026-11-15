import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { GROUPS, type PassageGroup } from '../data/passages';
import { wordCount } from '../lib/follow';
import { addMyText, removeMyText, usePassages } from '../lib/texts';
import { Button, colors, hint, Row, T } from '../components/ui';

export default function Texts() {
  const [list, reload] = usePassages();
  const [open, setOpen] = useState<Set<PassageGroup>>(new Set());
  const [adding, setAdding] = useState(false);
  useFocusEffect(useCallback(() => reload(), [reload]));

  function toggle(g: PassageGroup) {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <T style={styles.intro} en="Longer pieces to read along with. Each word lights up as it's spoken. Slow it down, loop a line, and say it together with the voice.">
        Длинные те́ксты для чте́ния вслух. Ка́ждое сло́во подсве́чивается, когда́ звучи́т. Замедля́йте, повторя́йте
        строку́ и чита́йте вме́сте с го́лосом.
      </T>
      {GROUPS.map((g) => {
        const items = (list ?? []).filter((x) => x.group === g.id);
        const isOpen = open.has(g.id);
        return (
          <View key={g.id}>
            <Pressable onPress={() => toggle(g.id)} onLongPress={() => hint(g.en)} style={styles.header}>
              <Text style={styles.headerText}>
                {isOpen ? '▾' : '▸'} {g.ru}
              </Text>
              <Text style={styles.count}>{items.length}</Text>
            </Pressable>
            {isOpen ? (
              <View style={styles.items}>
                {items.map((x) => (
                  <Pressable
                    key={x.id}
                    onPress={() => router.push({ pathname: '/text', params: { id: x.id } })}
                    onLongPress={() =>
                      x.group === 'mine'
                        ? Alert.alert('Удали́ть текст?', x.title, [
                            { text: 'Отме́на', style: 'cancel' },
                            { text: 'Удали́ть', style: 'destructive', onPress: () => removeMyText(x.id).then(reload) },
                          ])
                        : hint(x.titleEn)
                    }
                    style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{x.title}</Text>
                      <Text style={styles.meta}>
                        {x.author ? `${x.author} · ` : ''}
                        {wordCount(x.lines.join(' '))} сл.
                      </Text>
                    </View>
                    <Text style={styles.chev}>›</Text>
                  </Pressable>
                ))}
                {g.id === 'mine' ? (
                  adding ? (
                    <AddText
                      onDone={(id) => {
                        setAdding(false);
                        reload();
                        if (id) router.push({ pathname: '/text', params: { id } });
                      }}
                    />
                  ) : (
                    <>
                      <Button label="＋ Свой текст" en="Add your own text (paste a poem, a book page, a film scene…)" onPress={() => setAdding(true)} style={{ flex: 0 }} />
                      {items.length ? <T style={styles.meta} en="Long-press one of your texts to delete it.">Уде́рживайте свой текст, что́бы удали́ть его́.</T> : null}
                    </>
                  )
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

function AddText({ onDone }: { onDone: (id?: string) => void }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  return (
    <View style={styles.add}>
      <T style={styles.meta} en="Paste any Russian text: a poem, a page of a book, a scene from a film. Each line is read separately.">
        Вста́вьте любо́й ру́сский текст: стихи́, страни́цу кни́ги, сце́ну из фи́льма. Ка́ждая строка́ чита́ется отде́льно.
      </T>
      <TextInput style={styles.input} placeholder="Назва́ние" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, styles.big]} placeholder="Текст" value={text} onChangeText={setText} multiline textAlignVertical="top" />
      <Row>
        <Button label="Отме́на" en="Cancel" variant="outline" onPress={() => onDone()} />
        <Button
          label="Сохрани́ть"
          en="Save"
          disabled={!text.trim()}
          onPress={() =>
            addMyText(title, text)
              .then((x) => onDone(x.id))
              .catch((e) => Alert.alert('Не получи́лось сохрани́ть', String(e)))
          }
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10, paddingBottom: 40 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  headerText: { fontSize: 17, fontWeight: '700', color: colors.text },
  count: { color: colors.muted },
  items: { gap: 8, paddingLeft: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { color: colors.muted, fontSize: 12 },
  chev: { fontSize: 22, color: colors.muted },
  add: { gap: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: colors.card, fontSize: 16 },
  big: { minHeight: 160 },
});
