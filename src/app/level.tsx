import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { allPhrases, catEn, catRu, CATEGORIES, type Phrase } from '../data/phrases';
import { gradeOf, LEVEL_NAMES, type Level } from '../lib/srs';
import { useProgress } from '../lib/storage';
import { Button, colors, hint, T } from '../components/ui';

const INFO: Record<Level, { title: string; color: string; hint: string }> = {
  hard: { title: LEVEL_NAMES.hard.ru, color: colors.hard, hint: 'Отме́тьте фра́зу «Почти́» и́ли «Зна́ю», и она́ перейдёт в тот спи́сок.' },
  good: { title: LEVEL_NAMES.good.ru, color: colors.good, hint: 'Фра́зы, кото́рые вы в после́дний раз отме́тили «Почти́».' },
  easy: { title: LEVEL_NAMES.easy.ru, color: colors.easy, hint: 'Фра́зы, кото́рые вы в после́дний раз отме́тили «Зна́ю».' },
};

/** Every phrase whose last grade is this level, by category, collapsed at first. */
export default function LevelList() {
  const { grade } = useLocalSearchParams<{ grade?: string }>();
  const level: Level = grade === 'good' || grade === 'easy' ? grade : 'hard';
  const info = INFO[level];
  const [p] = useProgress();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  if (!p) return null;

  const items = allPhrases(p.custom).filter((x) => p.cards[x.id] && gradeOf(p.cards[x.id]) === level);
  const sections = CATEGORIES.map((cat) => {
    const data = items.filter((x) => x.cat === cat);
    return { title: cat, count: data.length, data: expanded.has(cat) ? data : [] };
  }).filter((s) => s.count);

  const toggle = (t: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <>
      <Stack.Screen options={{ title: `${info.title} · ${items.length}` }} />
      <SectionList
        sections={sections}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.wrap}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 4 }}>
            <Text style={styles.intro}>{info.hint} Нажми́те на фра́зу, что́бы откры́ть ка́рточку.</Text>
            <Button
              label={`Пра́ктика · ${items.length}`}
              en={`Practice all ${items.length}`}
              color={info.color}
              disabled={!items.length}
              onPress={() => router.push({ pathname: '/review', params: { level } })}
              style={{ flex: 0 }}
            />
          </View>
        }
        ListEmptyComponent={<T style={styles.empty} en="No phrases here yet.">Здесь пока́ нет фраз.</T>}
        renderSectionHeader={({ section }) => (
          <Pressable onPress={() => toggle(section.title)} onLongPress={() => hint(catEn(section.title))} style={styles.fold} accessibilityRole="button">
            <Text style={styles.foldText}>
              {expanded.has(section.title) ? '▾' : '▸'} {catRu(section.title)}
            </Text>
            <Text style={styles.count}>{section.count}</Text>
          </Pressable>
        )}
        renderItem={({ item }: { item: Phrase }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/review', params: { deck: item.deck, id: item.id } })}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.ru}>{item.ru}</Text>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40 },
  intro: { color: colors.text, fontSize: 15, lineHeight: 21 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  fold: {
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
  foldText: { fontSize: 17, fontWeight: '700', color: colors.text },
  count: { color: colors.muted, fontSize: 14 },
  item: {
    marginLeft: 18, // indented under its group heading
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  ru: { fontSize: 17, fontWeight: '600', color: colors.text },
});
