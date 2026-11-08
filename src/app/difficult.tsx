import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { allPhrases, type Phrase } from '../data/phrases';
import { gradeOf } from '../lib/srs';
import { useProgress } from '../lib/storage';
import { Button, colors } from '../components/ui';

/** Every card you last marked Again or Hard. Mark it Good or Easy and it drops off. */
export default function Difficult() {
  const [p] = useProgress();
  if (!p) return null;
  const all = allPhrases(p.custom).filter((x) => p.cards[x.id]);
  const again = all.filter((x) => gradeOf(p.cards[x.id]) === 'again');
  const hard = all.filter((x) => gradeOf(p.cards[x.id]) === 'hard');
  const sections = [
    { title: 'Again', color: colors.again, data: again },
    { title: 'Hard', color: colors.hard, data: hard },
  ].filter((s) => s.data.length);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(x) => x.id}
      contentContainerStyle={styles.wrap}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 6 }}>
          <Text style={styles.intro}>
            Tap a phrase to open its card. When you mark it Good or Easy, it leaves this list.
          </Text>
          <Button
            label={`Practice all ${again.length + hard.length}`}
            disabled={!again.length && !hard.length}
            onPress={() => router.push({ pathname: '/review', params: { level: 'again,hard' } })}
            style={{ flex: 0 }}
          />
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nothing difficult right now. Отлично! 🎉</Text>}
      renderSectionHeader={({ section }) => (
        <Text style={[styles.section, { color: section.color }]}>
          {section.title} <Text style={styles.count}>{section.data.length}</Text>
        </Text>
      )}
      renderItem={({ item }: { item: Phrase }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/review', params: { deck: item.deck, id: item.id } })}
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.ru}>{item.ru}</Text>
          <Text style={styles.cat}>{item.cat}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40 },
  intro: { color: colors.text, fontSize: 15, lineHeight: 21 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  section: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  count: { color: colors.muted, fontWeight: '400', fontSize: 14 },
  item: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 4,
  },
  ru: { fontSize: 17, fontWeight: '600', color: colors.text },
  cat: { color: colors.muted, fontSize: 12 },
});
