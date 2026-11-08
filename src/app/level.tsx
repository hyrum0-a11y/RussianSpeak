import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { allPhrases, CATEGORIES, type Phrase } from '../data/phrases';
import { gradeOf, type Level } from '../lib/srs';
import { useProgress } from '../lib/storage';
import { Button, colors } from '../components/ui';

const INFO: Record<Level, { title: string; color: string; hint: string }> = {
  hard: { title: 'Hard', color: colors.hard, hint: 'Mark a phrase Good or Easy and it moves to that list.' },
  good: { title: 'Good', color: colors.good, hint: 'Phrases you last marked Good.' },
  easy: { title: 'Easy', color: colors.easy, hint: 'Phrases you last marked Easy.' },
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
            <Text style={styles.intro}>{info.hint} Tap a phrase to open its card.</Text>
            <Button
              label={`Practice all ${items.length}`}
              color={info.color}
              disabled={!items.length}
              onPress={() => router.push({ pathname: '/review', params: { level } })}
              style={{ flex: 0 }}
            />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No phrases here yet.</Text>}
        renderSectionHeader={({ section }) => (
          <Pressable onPress={() => toggle(section.title)} style={styles.fold} accessibilityRole="button">
            <Text style={styles.foldText}>
              {expanded.has(section.title) ? '▾' : '▸'} {section.title}
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
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  ru: { fontSize: 17, fontWeight: '600', color: colors.text },
});
