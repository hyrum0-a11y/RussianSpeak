import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { speakRu, stopSpeaking } from '../lib/speech';
import { Button, colors, Row, T } from './ui';

/**
 * Listen (normal / slow), record yourself, and play your recording back
 * so you can compare it with the native-speaker voice.
 */
export function SpeakControls({
  text,
  rate,
  autoPlay = false,
  showListen = true,
}: {
  text: string;
  rate: number;
  autoPlay?: boolean;
  showListen?: boolean;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 200);
  const player = useAudioPlayer(null);
  const [myUri, setMyUri] = useState<string | null>(null);
  const textRef = useRef(text);

  // New phrase: forget the previous recording and optionally speak it.
  useEffect(() => {
    textRef.current = text;
    setMyUri(null);
    if (autoPlay) speakRu(text, rate);
    return () => stopSpeaking();
  }, [text, autoPlay, rate]);

  async function startRecording() {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нужен микрофон', 'Разрешите доступ к микрофону, чтобы записать своё произношение.');
      return;
    }
    stopSpeaking();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stopRecording() {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (recorder.uri) {
      setMyUri(recorder.uri);
      player.replace({ uri: recorder.uri });
    }
  }

  async function playMine() {
    if (!myUri) return;
    stopSpeaking();
    await player.seekTo(0);
    player.play();
  }

  /** Native voice, then your recording right after. */
  function compare() {
    if (!myUri) return;
    speakRu(textRef.current, rate, () => {
      playMine();
    });
  }

  const recording = recState.isRecording;

  return (
    <View style={styles.wrap}>
      {showListen && (
        <Row>
          <Button label="🔊 Слушать" en="Listen" onPress={() => speakRu(text, rate)} />
          <Button label="🐢 Медленно" en="Slow" variant="outline" onPress={() => speakRu(text, Math.max(0.4, rate * 0.6))} />
        </Row>
      )}
      <Row>
        <Button
          label={recording ? `⏹ Стоп  ${(recState.durationMillis / 1000).toFixed(1)} с` : '🎙 Записать себя'}
          en={recording ? 'Stop recording' : 'Record yourself'}
          color={colors.record}
          onPress={recording ? stopRecording : startRecording}
        />
        <Button label="▶ Мой голос" en="Play my recording" variant="outline" color={colors.record} disabled={!myUri || recording} onPress={playMine} />
      </Row>
      {myUri && !recording ? (
        <Button label="🔁 Сравнить" en="Compare: native voice, then mine" variant="outline" onPress={compare} />
      ) : (
        <T style={styles.tip} en="Say it out loud, record, then compare with the native voice.">Скажите вслух, запишите себя и сравните с носителем.</T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  tip: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
