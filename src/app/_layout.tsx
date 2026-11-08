import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { colors, LangToggle, useShowEn } from '../components/ui';
import { DECKS } from '../data/phrases';
import { LEVEL_NAMES } from '../lib/srs';
import { setPreferredVoice } from '../lib/speech';
import { useProgress } from '../lib/storage';

// English for screen titles, shown when the EN switch is on.
const TITLE_EN: Record<string, string> = {
  'Ка́рточки': 'Cards',
  'Отвеча́ть на вопро́сы': 'Answer questions',
  'Фра́зы': 'Phrase library',
  'Настро́йки': 'Settings',
  'Дикта́нт': 'Dictation',
  'Про́пуск': 'Fill in the blank',
  'Поём вме́сте': 'Sing along',
  'Слова́рь': 'Dictionary',
  'Мои́ сло́ва': 'My words',
  'Сло́ва в конте́ксте': 'Words in context',
  'Пе́сня': 'Song',
  'Коло́да': 'Deck',
  'На сего́дня': 'Today',
  ...Object.fromEntries(DECKS.map((d) => [d.title, d.en])),
  ...Object.fromEntries(Object.values(LEVEL_NAMES).map((l) => [l.ru, l.en.split(':')[0]])),
};
function titleEn(ru: string): string {
  if (TITLE_EN[ru]) return TITLE_EN[ru];
  if (ru.startsWith('Пра́ктика: ')) return 'Practice: ' + titleEn(ru.slice('Пра́ктика: '.length));
  if (ru.includes(' + ')) return ru.split(' + ').map(titleEn).join(' + ');
  return ru;
}
function HeaderTitle({ children }: { children: string }) {
  const en = useShowEn();
  return (
    <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }} numberOfLines={1}>
      {en ? titleEn(children) : children}
    </Text>
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
          headerTitle: (props) => <HeaderTitle>{props.children}</HeaderTitle>,
          headerRight: () => <LangToggle />,
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
