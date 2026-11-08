import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { compareWords, score, type WordResult } from '../lib/compare';
import { stopSpeaking } from '../lib/speech';
import { Button, colors } from './ui';
import { WordDiff } from './WordDiff';

/**
 * Say the phrase; Android's speech recognizer writes down what it heard and we
 * show which words matched. Recognizers are forgiving, so treat green as
 * "understandable", not "perfect accent".
 */
export function SpeechCheck({ text }: { text: string }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHeard('');
    setResults(null);
    setError(null);
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, [text]);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (e) => {
    const said = e.results[0]?.transcript ?? '';
    setHeard(said);
    if (e.isFinal) setResults(compareWords(text, said));
  });
  useSpeechRecognitionEvent('error', (e) => {
    setListening(false);
    if (e.error === 'no-speech' || e.error === 'speech-timeout') setError("Didn't catch anything. Try again a bit louder.");
    else if (e.error === 'language-not-supported')
      setError('Распознавание русской речи не установлено. В приложении Google: Настройки → Голос → Распознавание речи офлайн → добавьте русский.');
    else if (e.error !== 'aborted') setError(`Speech recognition error: ${e.message || e.error}`);
  });

  async function start() {
    setError(null);
    setResults(null);
    setHeard('');
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setError('Разрешите доступ к микрофону, чтобы проверить произношение.');
      return;
    }
    stopSpeaking();
    ExpoSpeechRecognitionModule.start({ lang: 'ru-RU', interimResults: true, continuous: false, maxAlternatives: 1 });
  }

  const pct = results ? Math.round(score(results) * 100) : null;

  return (
    <View style={styles.wrap}>
      <Button
        label={listening ? '⏹ Слушаю… нажмите, чтобы остановить' : '🗣 Проверить произношение'}
        en={listening ? 'Listening… tap to stop' : 'Check my pronunciation'}
        color={colors.good}
        variant={listening ? 'solid' : 'outline'}
        onPress={() => (listening ? ExpoSpeechRecognitionModule.stop() : start())}
        style={{ flex: 0 }}
      />
      {listening && heard ? <Text style={styles.heard}>“{heard}”</Text> : null}
      {results && (
        <View style={styles.result}>
          <WordDiff results={results} />
          <Text style={styles.score}>
            {pct === 100 ? 'Отли́чно! Понятно каждое слово.' : `Понятно ${pct}% слов.`} Услышано: «{heard}»
          </Text>
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  heard: { color: colors.muted, textAlign: 'center', fontStyle: 'italic' },
  result: { gap: 6, paddingVertical: 4 },
  score: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  error: { color: colors.again, textAlign: 'center', fontSize: 13 },
});
