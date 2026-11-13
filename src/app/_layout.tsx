import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { colors, hint } from '../components/ui';
import { setPreferredVoice } from '../lib/speech';
import { useProgress } from '../lib/storage';

/** Top-right button on every screen: straight back to the home screen, however deep you are. */
function HomeButton() {
  return (
    <Pressable
      onPress={() => (router.canDismiss() ? router.dismissAll() : router.replace('/'))}
      onLongPress={() => hint('Home')}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Гла́вная"
    >
      <Text style={{ fontSize: 22 }}>🏠</Text>
    </Pressable>
  );
}

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
          headerRight: () => <HomeButton />,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Гла́вная', headerShown: false }} />
        <Stack.Screen name="deck" options={{ title: 'Коло́да' }} />
        <Stack.Screen name="review" options={{ title: 'Ка́рточки' }} />
        <Stack.Screen name="respond" options={{ title: 'Отвеча́ть на вопро́сы' }} />
        <Stack.Screen name="phrases" options={{ title: 'Фра́зы' }} />
        <Stack.Screen name="settings" options={{ title: 'Настро́йки' }} />
        <Stack.Screen name="dictation" options={{ title: 'Дикта́нт' }} />
        <Stack.Screen name="cloze" options={{ title: 'Про́пуск' }} />
        <Stack.Screen name="songs" options={{ title: 'Поём вме́сте' }} />
        <Stack.Screen name="dictionary" options={{ title: 'Слова́рь' }} />
        <Stack.Screen name="level" options={{ title: 'Ка́рточки' }} />
        <Stack.Screen name="words" options={{ title: 'Мои́ сло́ва' }} />
        <Stack.Screen name="wordpractice" options={{ title: 'Сло́ва в конте́ксте' }} />
        <Stack.Screen name="song" options={{ title: 'Пе́сня' }} />
      </Stack>
    </>
  );
}
