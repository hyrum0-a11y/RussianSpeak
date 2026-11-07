import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { DECKS, phrasesIn, PHRASES, type Deck } from '../data/phrases';
import { PROMPTS } from '../data/prompts';
import { hasRussianVoice } from '../lib/speech';
import { buildQueue } from '../lib/srs';
import { newLeftToday, today, useProgress, type Progress } from '../lib/storage';
import { Button, Card, colors } from '../components/ui';

export default function Home() {
  const [p] = useProgress();
  const [voiceOk, setVoiceOk] = useState(true);

  useEffect(() => {
    hasRussianVoice().then(setVoiceOk);
  }, []);

  if (!p) return null;

  const now = Date.now();
  const learned = Object.values(p.cards).filter((c) => c.reps > 0).length;
  const promptsDue = buildQueue(PROMPTS.map((x) => x.id), p.prompts, now, 5).length;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {!voiceOk && (
        <Card style={styles.warn}>
          <Text style={styles.warnTitle}>No Russian voice found</Text>
          <Text style={styles.warnBody}>
            On Android, open Settings → System → Languages → Text-to-speech output, tap the gear next to
            your engine (e.g. Speech Services by Google) → Install voice data → Russian.
          </Text>
        </Card>
      )}

      <View style={styles.stats}>
        <Stat label="Day streak" value={streakAlive(p.streak.lastDay) ? p.streak.days : 0} />
        <Stat label="Phrases learned" value={`${learned}/${PHRASES.length}`} />
      </View>

      {DECKS.map((d) => (
        <DeckCard key={d.id} deck={d.id} title={d.title} blurb={d.blurb} p={p} now={now} />
      ))}

      <Card style={styles.section}>
        <Text style={styles.h}>Respond to prompts</Text>
        <Text style={styles.body}>
          Hear a question in Russian and answer out loud. Then compare with sample answers.
        </Text>
        <Text style={styles.meta}>{promptsDue} ready</Text>
        <Button label="Start speaking" disabled={!promptsDue} onPress={() => router.push('/respond')} />
      </Card>

      <View style={styles.links}>
        <Button label="📚 Phrase library" variant="outline" onPress={() => router.push('/phrases')} />
        <Button label="⚙️ Settings" variant="outline" onPress={() => router.push('/settings')} />
      </View>
    </ScrollView>
  );
}

function DeckCard({ deck, title, blurb, p, now }: { deck: Deck; title: string; blurb: string; p: Progress; now: number }) {
  const queue = buildQueue(phrasesIn(deck).map((x) => x.id), p.cards, now, newLeftToday(p, deck));
  const dueCount = queue.filter((id) => p.cards[id]).length;
  const newCount = queue.length - dueCount;
  return (
    <Card style={styles.section}>
      <Text style={styles.h}>{title}</Text>
      <Text style={styles.body}>{blurb}</Text>
      <Text style={styles.meta}>
        {dueCount} due · {newCount} new today
      </Text>
      <Button
        label={queue.length ? 'Start review' : 'All done for now ✓'}
        disabled={!queue.length}
        onPress={() => router.push({ pathname: '/review', params: { deck } })}
      />
    </Card>
  );
}

function streakAlive(lastDay: string) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return lastDay === today() || lastDay === today(y);
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.primary },
  statLabel: { color: colors.muted, marginTop: 2 },
  section: { gap: 10 },
  h: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  meta: { color: colors.muted },
  links: { flexDirection: 'row', gap: 10 },
  warn: { backgroundColor: '#FFF4E0', borderColor: '#F0C27A', gap: 6 },
  warnTitle: { fontWeight: '700', color: '#7A4B00' },
  warnBody: { color: '#7A4B00', lineHeight: 20 },
});
