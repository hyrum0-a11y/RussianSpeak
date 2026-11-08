import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { DECKS, phrasesIn, type Deck, type Phrase } from '../data/phrases';
import { buildQueue } from '../lib/srs';
import { STATUS_LABEL, statusOf, type Status } from '../lib/status';
import { newLeftToday, toggleStar, useProgress } from '../lib/storage';
import { Button, colors, Row } from '../components/ui';
import { ProgressBar } from '../components/ProgressBar';

const STATUS_ORDER: Status[] = ['due', 'learning', 'new', 'learned'];
const STATUS_COLOR: Record<Status, string> = {
  due: colors.hard,
  learning: colors.easy,
  learned: colors.good,
  new: colors.muted,
};

export default function DeckScreen() {
  const params = useLocalSearchParams<{ deck?: string }>();
  const info = DECKS.find((d) => d.id === params.deck) ?? DECKS[0];
  const deck: Deck = info.id;
  const [p] = useProgress();
  const [groupBy, setGroupBy] = useState<'type' | 'status'>('type');
  // Decade sections (movie lines) start collapsed.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const now = Date.now();
  const custom = p?.custom;
  const phrases = useMemo(() => phrasesIn(deck, custom), [deck, custom]);
  const categories = useMemo(() => [...new Set(phrases.map((x) => x.cat))], [phrases]);
  // Movie lines group by decade; a one-category deck otherwise groups by progress.
  const byDecade = deck === 'movies';
  const canType = categories.length > 1 || byDecade;
  const mode = canType ? groupBy : 'status';

  if (!p) return null;
  const cards = p.cards;

  const sections =
    mode === 'type' && byDecade
      ? decades(phrases).map(([title, data]) => ({
          title,
          count: data.length,
          data: expanded.has(title) ? data : [],
          collapsible: true,
        }))
      : mode === 'type'
      ? categories.map((cat) => ({ title: cat, data: phrases.filter((x) => x.cat === cat) }))
      : STATUS_ORDER.map((st) => ({
          title: STATUS_LABEL[st],
          data: phrases.filter((x) => statusOf(cards[x.id], now) === st),
        })).filter((s) => s.data.length);

  const queue = buildQueue(phrases.map((x) => x.id), cards, now, newLeftToday(p, deck));
  const learned = phrases.filter((x) => statusOf(cards[x.id], now) === 'learned').length;
  const seen = phrases.filter((x) => cards[x.id]).length;

  const header = (
    <View style={styles.header}>
      <Text style={styles.icon}>{info.icon}</Text>
      <Text style={styles.blurb}>{info.blurb}</Text>
      <ProgressBar value={phrases.length ? learned / phrases.length : 0} />
      <Text style={styles.meta}>
        {learned} learned · {seen - learned} in progress · {phrases.length - seen} new
      </Text>
      <Row>
        <Button
          label={queue.length ? `Review (${queue.length})` : 'Done for now ✓'}
          disabled={!queue.length}
          onPress={() => router.push({ pathname: '/review', params: { deck } })}
        />
        <Button
          label="↩ Practice seen"
          variant="outline"
          disabled={!seen}
          onPress={() => router.push({ pathname: '/review', params: { deck, mode: 'practice' } })}
        />
      </Row>
      {canType && (
        <View style={styles.toggle}>
          {(['type', 'status'] as const).map((g) => (
            <Pressable key={g} onPress={() => setGroupBy(g)} style={[styles.chip, groupBy === g && styles.chipOn]}>
              <Text style={[styles.chipText, groupBy === g && styles.chipTextOn]}>
                {g === 'type' ? (byDecade ? 'By decade' : 'By type') : 'By progress'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: info.title }} />
      <SectionList
        sections={sections}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.wrap}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.meta}>No phrases yet. Add some in the Phrase library.</Text>}
        renderSectionHeader={({ section }) => {
          const sec = section as { title: string; data: Phrase[]; count?: number; collapsible?: boolean };
          if (!sec.collapsible) {
            return (
              <Text style={styles.section}>
                {sec.title} <Text style={styles.count}>{sec.data.length}</Text>
              </Text>
            );
          }
          const isOpen = expanded.has(sec.title);
          return (
            <Pressable
              onPress={() =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(sec.title)) next.delete(sec.title);
                  else next.add(sec.title);
                  return next;
                })
              }
              style={styles.fold}
              accessibilityRole="button"
            >
              <Text style={styles.foldText}>
                {isOpen ? '▾' : '▸'} {sec.title}
              </Text>
              <Text style={styles.count}>{sec.count}</Text>
            </Pressable>
          );
        }}
        renderItem={({ item }) => (
          <Item
            item={item}
            status={statusOf(cards[item.id], now)}
            starred={p.starred.includes(item.id)}
            onPress={() => router.push({ pathname: '/review', params: { deck, id: item.id } })}
          />
        )}
      />
    </>
  );
}

/** Tapping a phrase opens it as a full card (hear, record, speech check, peek, grade). */
function Item({ item, status, starred, onPress }: { item: Phrase; status: Status; starred: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.ru}>{item.ru}</Text>
        {item.idiom ? <Text style={styles.en}>{item.en}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Pressable onPress={() => toggleStar(item.id)} hitSlop={10} accessibilityLabel="Working on">
          <Text style={[styles.star, starred && { color: '#E0A800' }]}>{starred ? '★' : '☆'}</Text>
        </Pressable>
        <Text style={[styles.status, { color: STATUS_COLOR[status] }]}>{STATUS_LABEL[status]}</Text>
      </View>
    </Pressable>
  );
}

/** Group movie lines by the decade of the film's year, found in the note, e.g. "(1973)". */
function decades(phrases: Phrase[]): [string, Phrase[]][] {
  const map = new Map<string, Phrase[]>();
  for (const x of phrases) {
    const y = /\((\d{4})/.exec(x.note ?? '')?.[1];
    const key = y ? `${y.slice(0, 3)}0s` : 'Other';
    map.set(key, [...(map.get(key) ?? []), x]);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

const styles = StyleSheet.create({
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
  star: { fontSize: 20, color: colors.muted },
  wrap: { padding: 16, paddingBottom: 40 },
  header: { gap: 12, marginBottom: 8 },
  icon: { fontSize: 40, textAlign: 'center' },
  blurb: { color: colors.text, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  meta: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  toggle: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: colors.primaryText, fontWeight: '600' },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
  count: { color: colors.muted, fontWeight: '400', fontSize: 14 },
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
  dot: { width: 8, height: 8, borderRadius: 4 },
  ru: { fontSize: 17, fontWeight: '600', color: colors.text },
  en: { color: colors.muted, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '600' },
});
