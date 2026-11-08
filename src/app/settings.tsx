import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { getRussianVoices, setPreferredVoice, speakRu } from '../lib/speech';
import { pickRussianVoice, type VoiceInfo } from '../lib/speechText';
import { resetProgress, useProgress } from '../lib/storage';
import { BUILD_NUMBER } from '../lib/update';
import { Button, Card, colors, Row, T } from '../components/ui';

const RATES = [0.7, 0.9, 1.0];
const NEW_PER_DAY = [5, 10, 20];

export default function Settings() {
  const [p, update] = useProgress();
  const [voices, setVoices] = useState<VoiceInfo[] | null>(null);
  useEffect(() => {
    getRussianVoices().then(setVoices);
  }, []);
  if (!p) return null;
  const s = p.settings;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card style={styles.card}>
        <T style={styles.h} en="Speech speed">Ско́рость ре́чи</T>
        <Row>
          {RATES.map((r) => (
            <Button
              key={r}
              label={r === 1 ? 'Обы́чная' : `${r}×`}
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
        <T style={styles.h} en="Russian voice">Ру́сский го́лос</T>
        {voices === null ? null : voices.length === 0 ? (
          <T style={styles.body} en='No Russian voice is installed, so your phone reads Cyrillic with the wrong voice. Open Android Settings → search "Text-to-speech" → Preferred engine (Speech Services by Google) → Install voice data → Русский. Then come back here.'>
            Ру́сский го́лос не устано́влен, поэ́тому телефо́н чита́ет кири́ллицу не тем го́лосом. Откро́йте настро́йки
            Android → найди́те «Text-to-speech» → Preferred engine (Speech Services by Google) → Install voice
            data → Ру́сский. Пото́м верни́тесь сюда́.
          </T>
        ) : (
          <>
            <T style={styles.body} en='Tap a voice to hear it. "on device" voices work offline and are most reliable.'>Нажми́те на го́лос, что́бы его́ послу́шать. Го́лоса «on device» рабо́тают без интерне́та и надёжнее всего́.</T>
            {voices.map((v) => {
              const active = pickRussianVoice(voices, s.voiceId)?.identifier === v.identifier;
              const label = /local/i.test(v.identifier) ? 'on device' : /network/i.test(v.identifier) ? 'needs internet' : '';
              return (
                <Button
                  key={v.identifier}
                  label={v.identifier}
                  sub={label || undefined}
                  variant={active ? 'solid' : 'outline'}
                  style={{ flex: 0 }}
                  onPress={() => {
                    update((prog) => ({ ...prog, settings: { ...prog.settings, voiceId: v.identifier } }));
                    setPreferredVoice(v.identifier);
                    setTimeout(() => speakRu('Здра́вствуйте! Как дела́?', s.speechRate), 50);
                  }}
                />
              );
            })}
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <T style={styles.h} en="Phrase cards show first">Что пока́зывать пе́рвым</T>
        <Row>
          {(['ru', 'en'] as const).map((f) => (
            <Button
              key={f}
              label={f === 'ru' ? 'Ру́сский' : 'English'}
              sub={f === 'ru' ? 'read, then recall meaning' : 'recall, then say it'}
              variant={s.front === f ? 'solid' : 'outline'}
              onPress={() => update((prog) => ({ ...prog, settings: { ...prog.settings, front: f } }))}
            />
          ))}
        </Row>
      </Card>

      <Card style={styles.card}>
        <T style={styles.h} en="Prompt questions">Вопро́сы</T>
        <Row>
          {[true, false].map((show) => (
            <Button
              key={String(show)}
              label={show ? 'Пока́зывать текст' : 'То́лько на слух'}
              en={show ? 'Show Cyrillic' : 'Listen only'}
              variant={s.showPromptText === show ? 'solid' : 'outline'}
              onPress={() => update((prog) => ({ ...prog, settings: { ...prog.settings, showPromptText: show } }))}
            />
          ))}
        </Row>
      </Card>

      <Card style={styles.card}>
        <T style={styles.h} en="New phrases per day (per deck)">Но́вых фраз в день (на коло́ду)</T>
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
        <T style={styles.h} en="Progress">Прогре́сс</T>
        <T style={styles.body} en={`Your progress is saved only on this phone. App build: ${BUILD_NUMBER || 'dev'}.`}>Прогре́сс храни́тся то́лько на э́том телефо́не. Сбо́рка: {BUILD_NUMBER || 'dev'}.</T>
        <Button
          label="Сбро́сить весь прогре́сс" en="Reset all progress"
          color={colors.again}
          variant="outline"
          style={{ flex: 0 }}
          onPress={() =>
            Alert.alert('Сбро́сить прогре́сс?', 'Вся исто́рия повторе́ний на э́том телефо́не бу́дет удалена́.', [
              { text: 'Отме́на', style: 'cancel' },
              { text: 'Сбро́сить', style: 'destructive', onPress: () => resetProgress() },
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
