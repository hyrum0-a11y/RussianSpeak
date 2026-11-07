import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { allPhrases, DECKS, phrasesIn, type Deck } from '../data/phrases';
import { PROMPTS } from '../data/prompts';
import { hasRussianVoice } from '../lib/speech';
import { checkForUpdate, installUpdate, type Update } from '../lib/update';
import { buildQueue } from '../lib/srs';
import { newLeftToday, useProgress, type Progress } from '../lib/storage';
import { Button, Card, colors, Row } from '../components/ui';

export default function Home() {
  const [p] = useProgress();
  const [voiceOk, setVoiceOk] = useState(true);
  const [update, setUpdate] = useState<Update | null>(null);

  useEffect(() => {
    hasRussianVoice().then(setVoiceOk);
    checkForUpdate().then(setUpdate);
  }, []);

  if (!p) return null;

  const now = Date.now();
  const learned = Object.values(p.cards).filter((c) => c.reps > 0).length;
  const total = allPhrases(p.custom).length;
  const promptsDue = buildQueue(PROMPTS.map((x) => x.id), p.prompts, now, 5).length;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {update && (
        <Card style={styles.update}>
          <Text style={styles.updateTitle}>Update available (build {update.build})</Text>
          <Text style={styles.updateBody}>Tap to download, then open the file to install. Your progress is kept.</Text>
          <Button label="⬇ Download update" color={colors.good} onPress={() => installUpdate(update)} />
        </Card>
      )}

      {!voiceOk && (
        <Card style={styles.warn}>
          <Text style={styles.warnTitle}>No Russian voice found</Text>
          <Text style={styles.warnBody}>
            Open Settings → Russian voice in this app for the steps to install one.
          </Text>
        </Card>
      )}

      <Text style={styles.summary}>
        {learned} of {total} phrases learned
      </Text>

      <Text style={styles.sectionTitle}>Review decks</Text>
      {DECKS.map((d) => (
        <DeckCard key={d.id} deck={d.id} title={d.title} p={p} now={now} />
      ))}

      <Text style={styles.sectionTitle}>Practice</Text>
      <Mode
        title="🗣 Respond to prompts"
        body="Hear a question and answer out loud."
        meta={`${promptsDue} ready`}
        disabled={!promptsDue}
        onPress={() => router.push('/respond')}
      />
      <Mode
        title="🎧 Dictation"
        body="Hear a phrase with no text and type what you heard."
        onPress={() => router.push('/dictation')}
      />
      <Mode
        title="✏️ Fill in the blank"
        body="Type the missing word. Good for cases and verb endings."
        onPress={() => router.push('/cloze')}
      />

      <Row>
        <Button label="📚 Phrase library" variant="outline" onPress={() => router.push('/phrases')} />
        <Button label="⚙️ Settings" variant="outline" onPress={() => router.push('/settings')} />
      </Row>
    </ScrollView>
  );
}

function DeckCard({ deck, title, p, now }: { deck: Deck; title: string; p: Progress; now: number }) {
  const phrases = phrasesIn(deck, p.custom);
  if (deck === 'mine' && phrases.length === 0) {
    return (
      <Card style={styles.deck}>
        <Text style={styles.h}>{title}</Text>
        <Text style={styles.meta}>Add your own phrases in the Phrase library.</Text>
        <Button label="＋ Add a phrase" variant="outline" onPress={() => router.push('/phrases')} />
      </Card>
    );
  }
  const queue = buildQueue(phrases.map((x) => x.id), p.cards, now, newLeftToday(p, deck));
  const dueCount = queue.filter((id) => p.cards[id]).length;
  const newCount = queue.length - dueCount;
  const learnedCount = phrases.filter((x) => p.cards[x.id]).length;
  return (
    <Card style={styles.deck}>
      <View style={styles.deckHead}>
        <Text style={styles.h}>{title}</Text>
        <Text style={styles.meta}>
          {dueCount} due · {newCount} new
        </Text>
      </View>
      <Row>
        <Button
          label={queue.length ? 'Review' : 'Done ✓'}
          disabled={!queue.length}
          onPress={() => router.push({ pathname: '/review', params: { deck } })}
        />
        <Button
          label={`↩ Learned (${learnedCount})`}
          variant="outline"
          disabled={!learnedCount}
          onPress={() => router.push({ pathname: '/review', params: { deck, mode: 'practice' } })}
        />
      </Row>
    </Card>
  );
}

function Mode(props: { title: string; body: string; meta?: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Card style={styles.deck}>
      <Text style={styles.h}>{props.title}</Text>
      <Text style={styles.body}>
        {props.body}
        {props.meta ? <Text style={styles.meta}> {props.meta}</Text> : null}
      </Text>
      <Button label="Start" disabled={props.disabled} onPress={props.onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 32 },
  summary: { color: colors.muted, textAlign: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 6 },
  deck: { gap: 10, padding: 16 },
  deckHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  h: { fontSize: 18, fontWeight: '700', color: colors.text, flexShrink: 1 },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  meta: { color: colors.muted },
  update: { backgroundColor: '#E8F6EC', borderColor: '#9FD5B0', gap: 8 },
  updateTitle: { fontWeight: '700', color: '#1B5E31' },
  updateBody: { color: '#1B5E31', lineHeight: 20 },
  warn: { backgroundColor: '#FFF4E0', borderColor: '#F0C27A', gap: 6 },
  warnTitle: { fontWeight: '700', color: '#7A4B00' },
  warnBody: { color: '#7A4B00', lineHeight: 20 },
});
