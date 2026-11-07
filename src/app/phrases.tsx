import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, PHRASES } from '../data/phrases';
import { speakRu } from '../lib/speech';
import { useProgress } from '../lib/storage';
import { colors } from '../components/ui';

const sections = CATEGORIES.map((cat) => ({ title: cat, data: PHRASES.filter((p) => p.cat === cat) }));

export default function Phrases() {
  const [p] = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  const rate = p?.settings.speechRate ?? 0.9;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.wrap}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => <Text style={styles.header}>{section.title}</Text>}
      renderItem={({ item }) => {
        const learned = (p?.cards[item.id]?.reps ?? 0) > 0;
        return (
          <Pressable
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
            onPress={() => {
              speakRu(item.ru, rate);
              setOpen(open === item.id ? null : item.id);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.ru}>{item.ru}</Text>
              <Text style={styles.en}>{item.en}</Text>
              {open === item.id && item.note ? <Text style={styles.note}>💡 {item.note}</Text> : null}
            </View>
            <Text style={styles.icon}>{learned ? '✓' : '🔊'}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
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
});
