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
        <Stack.Screen name="index" options={{ title: 'Главная', headerShown: false }} />
        <Stack.Screen name="deck" options={{ title: 'Колода' }} />
        <Stack.Screen name="review" options={{ title: 'Карточки' }} />
        <Stack.Screen name="respond" options={{ title: 'Отвечать на вопросы' }} />
        <Stack.Screen name="phrases" options={{ title: 'Фразы' }} />
        <Stack.Screen name="settings" options={{ title: 'Настройки' }} />
        <Stack.Screen name="dictation" options={{ title: 'Диктант' }} />
        <Stack.Screen name="cloze" options={{ title: 'Пропуск' }} />
        <Stack.Screen name="songs" options={{ title: 'Поём вместе' }} />
        <Stack.Screen name="dictionary" options={{ title: 'Словарь' }} />
        <Stack.Screen name="level" options={{ title: 'Карточки' }} />
        <Stack.Screen name="words" options={{ title: 'Мои слова' }} />
        <Stack.Screen name="wordpractice" options={{ title: 'Слова в контексте' }} />
        <Stack.Screen name="song" options={{ title: 'Песня' }} />
      </Stack>
    </>
  );
}
