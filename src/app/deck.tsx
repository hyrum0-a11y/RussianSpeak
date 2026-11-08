import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { catEn, catRu, DECKS, phrasesIn, type Deck, type Phrase } from '../data/phrases';
import { buildQueue } from '../lib/srs';
import { STATUS_EN, STATUS_LABEL, statusOf, type Status } from '../lib/status';
import { newLeftToday, useProgress } from '../lib/storage';
import { Button, colors, hint, Row, T, useLang } from '../components/ui';
import { ProgressBar } from '../components/ProgressBar';

const STATUS_ORDER: Status[] = ['due', 'learning', 'new', 'learned'];
const STATUS_COLOR: Record<Status, string> = {
  due: colors.hard,
  learning: colors.easy,
  learned: colors.good,
  new: colors.muted,
};

export default function DeckScreen() {
  const tr = useLang();
  const params = useLocalSearchParams<{ deck?: string }>();
  const info = DECKS.find((d) => d.id === params.deck) ?? DECKS[0];
  const deck: Deck = info.id;
  const [p] = useProgress();
  const [groupBy, setGroupBy] = useState<'type' | 'status'>('type');
  // Groups start collapsed.
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

  // Every group is collapsible and starts collapsed.
  const groups: [string, Phrase[]][] =
    mode === 'type' && byDecade
      ? decades(phrases)
      : mode === 'type'
        ? categories.map((cat) => [cat, phrases.filter((x) => x.cat === cat)])
        : STATUS_ORDER.map((st): [string, Phrase[]] => [
            STATUS_LABEL[st],
            phrases.filter((x) => statusOf(cards[x.id], now) === st),
          ]).filter(([, d]) => d.length);
  const sections = groups.map(([title, data]) => ({
    title,
    count: data.length,
    data: expanded.has(title) ? data : [],
    collapsible: true,
  }));

  const queue = buildQueue(phrases.map((x) => x.id), cards, now, newLeftToday(p, deck));
  const learned = phrases.filter((x) => statusOf(cards[x.id], now) === 'learned').length;
  const seen = phrases.filter((x) => cards[x.id]).length;

  const header = (
    <View style={styles.header}>
      <Text style={styles.icon}>{info.icon}</Text>
      <T style={styles.blurb} en={info.en}>{info.blurb}</T>
      <ProgressBar value={phrases.length ? learned / phrases.length : 0} />
      <T style={styles.meta} en={`${learned} learned · ${seen - learned} in progress · ${phrases.length - seen} new`}>
        вы́учено {learned} · в проце́ссе {seen - learned} · но́вых {phrases.length - seen}
      </T>
      <Row>
        <Button
          label={queue.length ? `Учи́ть (${queue.length})` : 'На сего́дня всё ✓'}
          en={queue.length ? `Review (${queue.length} cards)` : 'Done for now'}
          disabled={!queue.length}
          onPress={() => router.push({ pathname: '/review', params: { deck } })}
        />
        <Button
          label="↩ Повтори́ть изу́ченное" en="↩ Practice seen"
          variant="outline"
          disabled={!seen}
          onPress={() => router.push({ pathname: '/review', params: { deck, mode: 'practice' } })}
        />
      </Row>
      {canType && (
        <View style={styles.toggle}>
          {(['type', 'status'] as const).map((g) => (
            <Pressable key={g} onPress={() => setGroupBy(g)} onLongPress={() => hint(g === 'type' ? (byDecade ? 'By decade' : 'By topic') : 'By progress')} style={[styles.chip, groupBy === g && styles.chipOn]}>
              <Text style={[styles.chipText, groupBy === g && styles.chipTextOn]}>
                {g === 'type' ? (byDecade ? tr('По десятиле́тиям', 'By decade') : tr('По те́мам', 'By topic')) : tr('По прогре́ссу', 'By progress')}
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
        ListEmptyComponent={<T style={styles.meta} en="No phrases yet. Add some in the Phrase library.">Фраз пока́ нет. Доба́вьте их в разде́ле «Фра́зы».</T>}
        renderSectionHeader={({ section }) => {
          const sec = section as { title: string; data: Phrase[]; count?: number; collapsible?: boolean };
          if (!sec.collapsible) {
            return (
              <Text style={styles.section} onLongPress={() => hint(catEn(sec.title))}>
                {tr(catRu(sec.title), catEn(sec.title))} <Text style={styles.count}>{sec.data.length}</Text>
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
              onLongPress={() => hint(catEn(sec.title))}
              style={styles.fold}
              accessibilityRole="button"
            >
              <Text style={styles.foldText}>
                {isOpen ? '▾' : '▸'} {tr(catRu(sec.title), catEn(sec.title))}
              </Text>
              <Text style={styles.count}>{sec.count}</Text>
            </Pressable>
          );
        }}
        renderItem={({ item }) => (
          <Item
            item={item}
            status={statusOf(cards[item.id], now)}
            onPress={() => router.push({ pathname: '/review', params: { deck, id: item.id } })}
          />
        )}
      />
    </>
  );
}

/** Tapping a phrase opens it as a full card (hear, record, speech check, peek, grade). */
function Item({ item, status, onPress }: { item: Phrase; status: Status; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.ru}>{item.ru}</Text>
        {item.idiom ? <Text style={styles.en}>{item.en}</Text> : null}
      </View>
      <Text style={[styles.status, { color: STATUS_COLOR[status] }]}>{useLang()(STATUS_LABEL[status], STATUS_EN[status])}</Text>
    </Pressable>
  );
}

/** Group movie lines by the decade of the film's year, found in the note, e.g. "(1973)". */
function decades(phrases: Phrase[]): [string, Phrase[]][] {
  const map = new Map<string, Phrase[]>();
  for (const x of phrases) {
    const y = /\((\d{4})/.exec(x.note ?? '')?.[1];
    const key = y ? `${y.slice(0, 3)}0-е` : 'Друго́е';
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
    marginLeft: 18, // indented under its group heading
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
