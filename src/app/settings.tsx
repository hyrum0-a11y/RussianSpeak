import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { speakRu } from '../lib/speech';
import { resetProgress, useProgress } from '../lib/storage';
import { Button, Card, colors, Row } from '../components/ui';

const RATES = [0.7, 0.9, 1.0];
const NEW_PER_DAY = [5, 10, 20];

export default function Settings() {
  const [p, update] = useProgress();
  if (!p) return null;
  const s = p.settings;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card style={styles.card}>
        <Text style={styles.h}>Speech speed</Text>
        <Row>
          {RATES.map((r) => (
            <Button
              key={r}
              label={r === 1 ? 'Normal' : `${r}×`}
              variant={s.speechRate === r ? 'solid' : 'outline'}
              onPress={() => {
                update((prog) => ({ ...prog, settings: { ...prog.settings, speechRate: r } }));
                speakRu('Приве́т! Как дела́?', r);
              }}
            />
          ))}
        </Row>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h}>Phrase cards show first</Text>
        <Row>
          {(['ru', 'en'] as const).map((f) => (
            <Button
              key={f}
              label={f === 'ru' ? 'Русский' : 'English'}
              sub={f === 'ru' ? 'read, then recall meaning' : 'recall, then say it'}
              variant={s.front === f ? 'solid' : 'outline'}
              onPress={() => update((prog) => ({ ...prog, settings: { ...prog.settings, front: f } }))}
            />
          ))}
        </Row>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h}>Prompt questions</Text>
        <Row>
          {[true, false].map((show) => (
            <Button
              key={String(show)}
              label={show ? 'Show Cyrillic' : 'Listen only'}
              variant={s.showPromptText === show ? 'solid' : 'outline'}
              onPress={() => update((prog) => ({ ...prog, settings: { ...prog.settings, showPromptText: show } }))}
            />
          ))}
        </Row>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h}>New phrases per day (per deck)</Text>
        <Row>
          {NEW_PER_DAY.map((n) => (
            <Button
              key={n}
              label={String(n)}
              variant={s.newPerDay === n ? 'solid' : 'outline'}
              onPress={() => update((prog) => ({ ...prog, settings: { ...prog.settings, newPerDay: n } }))}
            />
          ))}
        </Row>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h}>Progress</Text>
        <Text style={styles.body}>Your progress is saved only on this phone.</Text>
        <Button
          label="Reset all progress"
          color={colors.again}
          variant="outline"
          style={{ flex: 0 }}
          onPress={() =>
            Alert.alert('Reset progress?', 'This erases all review history on this phone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => resetProgress() },
            ])
          }
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  card: { gap: 12 },
  h: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { color: colors.muted },
});
