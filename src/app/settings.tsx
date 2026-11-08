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
        <T style={styles.h} en="Speech speed">Скорость речи</T>
        <Row>
          {RATES.map((r) => (
            <Button
              key={r}
              label={r === 1 ? 'Обычная' : `${r}×`}
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
        <T style={styles.h} en="Russian voice">Русский голос</T>
        {voices === null ? null : voices.length === 0 ? (
          <Text style={styles.body}>
            Русский голос не установлен, поэтому телефон читает кириллицу не тем голосом. Откройте настройки
            Android → найдите «Text-to-speech» → Preferred engine (Speech Services by Google) → Install voice
            data → Русский. Потом вернитесь сюда.
          </Text>
        ) : (
          <>
            <Text style={styles.body}>Нажмите на голос, чтобы его послушать. Голоса «on device» работают без интернета и надёжнее всего.</Text>
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
        <T style={styles.h} en="Phrase cards show first">Что показывать первым</T>
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
        <T style={styles.h} en="Prompt questions">Вопросы</T>
        <Row>
          {[true, false].map((show) => (
            <Button
              key={String(show)}
              label={show ? 'Показывать текст' : 'Только на слух'}
              en={show ? 'Show Cyrillic' : 'Listen only'}
              variant={s.showPromptText === show ? 'solid' : 'outline'}
              onPress={() => update((prog) => ({ ...prog, settings: { ...prog.settings, showPromptText: show } }))}
            />
          ))}
        </Row>
      </Card>

      <Card style={styles.card}>
        <T style={styles.h} en="New phrases per day (per deck)">Новых фраз в день (на колоду)</T>
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
        <T style={styles.h} en="Progress">Прогресс</T>
        <Text style={styles.body}>Прогресс хранится только на этом телефоне. Сборка: {BUILD_NUMBER || 'dev'}.</Text>
        <Button
          label="Сбросить весь прогресс" en="Reset all progress"
          color={colors.again}
          variant="outline"
          style={{ flex: 0 }}
          onPress={() =>
            Alert.alert('Сбросить прогресс?', 'Вся история повторений на этом телефоне будет удалена.', [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Сбросить', style: 'destructive', onPress: () => resetProgress() },
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
