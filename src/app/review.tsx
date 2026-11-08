import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { allPhrases, DECKS, phrasesIn, type Deck, type Phrase } from '../data/phrases';
import { buildQueue, gradeOf, newCard, previewInterval, schedule, type CardState, type Grade } from '../lib/srs';
import { countNewIntroduced, loadProgress, newLeftToday, touchStreak, updateProgress, useProgress } from '../lib/storage';
import { Peek } from '../components/Peek';
import { SpeakControls } from '../components/SpeakControls';
import { SpeechCheck } from '../components/SpeechCheck';
import { AskAI } from '../components/AskAI';
import { Button, Card, colors, Row } from '../components/ui';


const GRADES: { grade: Grade; label: string; color: string }[] = [
  { grade: 'hard', label: 'Hard', color: colors.hard },
  { grade: 'good', label: 'Good', color: colors.good },
  { grade: 'easy', label: 'Easy', color: colors.easy },
];

export default function Review() {
  const params = useLocalSearchParams<{ deck?: string; mode?: string; id?: string; level?: string }>();
  // "level" = practice cards by your last grade (e.g. "hard" or "hard,good").
  const levels = params.level ? (params.level.split(',') as Grade[]) : null;
  // "id" = one card opened from a deck page. It counts as a real review if it's new or due.
  const single = params.id;
  const [notDue, setNotDue] = useState(false);
  // "practice" = go back over cards you've already learned, without changing their schedule.
  const practice = params.mode === 'practice' || notDue || !!levels;
  // "all" = today's review across every deck.
  const deck: Deck | 'all' =
    params.deck === 'all' ? 'all' : DECKS.some((d) => d.id === params.deck) ? (params.deck as Deck) : 'everyday';
  const deckTitle = levels
      ? `${levels.map((l) => GRADES.find((g) => g.grade === l)?.label).join(' + ')} cards`
      : deck === 'all'
        ? "Today's review"
        : DECKS.find((d) => d.id === deck)!.title;

  const [p] = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  // Cards finished this session, so you can step back to them.
  const [history, setHistory] = useState<{ id: string; before?: CardState; again: boolean }[]>([]);

  // Build the session queue once.
  useEffect(() => {
    loadProgress().then((prog) => {
      const decks = deck === 'all' ? DECKS.map((d) => d.id) : [deck];
      const now = Date.now();
      if (levels) {
        const ids = DECKS.flatMap((d) => phrasesIn(d.id, prog.custom).map((x) => x.id));
        setQueue(ids.filter((id) => prog.cards[id] && (levels as string[]).includes(gradeOf(prog.cards[id]))).sort(() => Math.random() - 0.5));
      } else if (single) {
        const c = prog.cards[single];
        setNotDue(!!c && c.due > now);
        setQueue([single]);
      } else if (practice) {
        const ids = decks.flatMap((d) => phrasesIn(d, prog.custom).map((x) => x.id));
        setQueue(ids.filter((id) => prog.cards[id]).sort(() => Math.random() - 0.5));
      } else {
        // Each deck keeps its own daily limit of new cards.
        setQueue(
          decks.flatMap((d) =>
            buildQueue(phrasesIn(d, prog.custom).map((x) => x.id), prog.cards, now, newLeftToday(prog, d)),
          ),
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, params.mode, single, params.level]);

  const custom = p?.custom;
  const byId = useMemo(() => new Map(allPhrases(custom).map((x) => [x.id, x])), [custom]);
  const current: Phrase | undefined = useMemo(() => (queue?.length ? byId.get(queue[0]) : undefined), [queue, byId]);

  if (!p || !queue) return null;
  const title = <Stack.Screen options={{ title: practice && !levels ? `Practice: ${deckTitle}` : deckTitle }} />;

  /** Step back to the previous card and undo its grade so you can redo it. */
  async function goBack() {
    const last = history[history.length - 1];
    if (!last) return;
    {
      await updateProgress((prog) => {
        const cards = { ...prog.cards };
        if (last.before) cards[last.id] = last.before;
        else delete cards[last.id];
        return { ...prog, cards };
      });
    }
    setHistory((h) => h.slice(0, -1));
    setDoneCount((n) => Math.max(0, n - 1));
    setQueue((q) => {
      if (!q) return q;
      // An "Again" card was also re-queued at the end; drop that copy.
      const rest = last.again ? q.slice(0, q.lastIndexOf(last.id)).concat(q.slice(q.lastIndexOf(last.id) + 1)) : q;
      return [last.id, ...rest];
    });
    setRevealed(true);
  }

  if (!current) {
    return (
      <View style={styles.center}>
        {title}
        <Text style={styles.doneTitle}>Отли́чно! 🎉</Text>
        <Text style={styles.doneBody}>
          {doneCount
            ? `You went through ${doneCount} cards.${practice ? '' : ' Come back later for more.'}`
            : 'Nothing here yet. Learn a few cards first.'}
        </Text>
        {history.length > 0 && (
          <Button label="↩ Back to last card" variant="outline" onPress={goBack} style={{ flex: 0, alignSelf: 'stretch' }} />
        )}
        {!practice && (
          <Button
            label="Practice learned cards"
            variant="outline"
            onPress={() => router.replace({ pathname: '/review', params: { deck, mode: 'practice' } })}
            style={{ flex: 0, alignSelf: 'stretch' }}
          />
        )}
        <Button label="Back home" onPress={() => router.back()} style={{ flex: 0, alignSelf: 'stretch' }} />
      </View>
    );
  }

  const state = p.cards[current.id] ?? newCard(Date.now());
  const isNew = !p.cards[current.id];
  const ruFirst = p.settings.front === 'ru';
  // Russian-first cards show everything at once. English-first keeps the Russian hidden until you've tried.
  const open = ruFirst || revealed;

  async function grade(g: Grade) {
    if (!current) return;
    if (practice) {
      // Practice leaves the schedule alone but remembers how well you knew it.
      await updateProgress((prog) => {
        const c = prog.cards[current.id];
        const next = c ? { ...c, last: g } : schedule(newCard(Date.now()), g, Date.now());
        return { ...prog, cards: { ...prog.cards, [current.id]: next } };
      });
    } else {
      const next = schedule(state, g, Date.now());
      await updateProgress((prog) => {
        const counted = isNew ? countNewIntroduced(prog, current.deck) : prog;
        return touchStreak({ ...counted, cards: { ...counted.cards, [current.id]: next } });
      });
    }
    setHistory((h) => [...h, { id: current.id, before: p?.cards[current.id], again: g === 'again' && !practice }]);
    setRevealed(false);
    setDoneCount((n) => n + 1);
    // A card opened from the deck page goes straight back there.
    if (single) {
      router.back();
      return;
    }
    // "Again" puts the card back at the end of this session.
    setQueue((q) => (q ? [...q.slice(1), ...(g === 'again' && !practice ? [current.id] : [])] : q));
  }

  const ru = <Text style={styles.ru}>{current.ru}</Text>;
  // For idioms the note is a literal translation, so it belongs with the English.
  const tip = !current.idiom && current.note ? <Text style={styles.note}>💡 {current.note}</Text> : null;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {title}
      <Text style={styles.progress}>
        {single ? '' : `${queue.length} left`}{isNew ? ' · NEW' : ''} · {current.cat}
        {practice ? ' · practice (schedule unchanged)' : ''}
      </Text>

      <Card style={styles.card}>
        {ruFirst ? ru : <Text style={styles.en}>{current.en}</Text>}
        {open ? (
          <>
            <View style={styles.divider} />
            {ruFirst ? (
              <Peek en={current.en} extra={current.idiom ? current.note : undefined} open={current.idiom} />
            ) : (
              ru
            )}
            {tip}
          </>
        ) : (
          <Text style={styles.hint}>Say it in Russian, out loud.</Text>
        )}
      </Card>

      {open ? (
        <>
          <SpeakControls text={current.ru} rate={p.settings.speechRate} autoPlay={!ruFirst} />
          <SpeechCheck text={current.ru} />
          <AskAI text={current.ru} />
          <Text style={styles.question}>How well did you know it?</Text>
          <Row>
            {GRADES.map(({ grade: g, label, color }) => (
              <Button
                key={g}
                label={label}
                sub={practice ? undefined : previewInterval(state, g, Date.now())}
                color={color}
                onPress={() => grade(g)}
              />
            ))}
          </Row>
        </>
      ) : (
        <Button label="Show Russian" onPress={() => setRevealed(true)} />
      )}
      {history.length > 0 && (
        <Pressable onPress={goBack} hitSlop={8} accessibilityRole="button">
          <Text style={styles.back}>↩ Previous card</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  progress: { color: colors.muted, textAlign: 'center' },
  card: { minHeight: 200, justifyContent: 'center', gap: 12 },
  en: { fontSize: 20, textAlign: 'center', color: colors.text },
  ru: { fontSize: 28, fontWeight: '600', textAlign: 'center', color: colors.primary },
  hint: { color: colors.muted, textAlign: 'center' },
  note: { color: colors.muted, textAlign: 'center', fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border },
  question: { textAlign: 'center', color: colors.muted, marginTop: 4 },
  back: { textAlign: 'center', color: colors.primary, fontSize: 15, paddingVertical: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  doneTitle: { fontSize: 30, fontWeight: '700', color: colors.text },
  doneBody: { color: colors.muted, textAlign: 'center' },
});
