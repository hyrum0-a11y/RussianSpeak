import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { colors } from '../components/ui';
import { setPreferredVoice } from '../lib/speech';
import { useProgress } from '../lib/storage';

export default function RootLayout() {
  const [p] = useProgress();
  const voiceId = p?.settings.voiceId;
  useEffect(() => {
    setPreferredVoice(voiceId);
  }, [voiceId]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
        <Stack.Screen name="deck" options={{ title: 'Deck' }} />
        <Stack.Screen name="review" options={{ title: 'Phrase review' }} />
        <Stack.Screen name="respond" options={{ title: 'Respond to prompts' }} />
        <Stack.Screen name="phrases" options={{ title: 'Phrase library' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="dictation" options={{ title: 'Dictation' }} />
        <Stack.Screen name="cloze" options={{ title: 'Fill in the blank' }} />
        <Stack.Screen name="songs" options={{ title: 'Songs' }} />
        <Stack.Screen name="dictionary" options={{ title: 'Словарь' }} />
        <Stack.Screen name="difficult" options={{ title: 'Difficult' }} />
        <Stack.Screen name="song" options={{ title: 'Song' }} />
      </Stack>
    </>
  );
}
