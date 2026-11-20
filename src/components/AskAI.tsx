import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { aiPrompt } from '../lib/askAi';
import { Button, colors, Row, T, hint } from './ui';

/**
 * "Спроси́ть ИИ": writes a question about the phrase and hands it to whatever
 * AI app you like through Android's share menu (or copies it).
 */
export function AskAI({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) {
    return (
      <Pressable onLongPress={() => hint("🤖 Ask AI")} onPress={() => setOpen(true)} hitSlop={8} accessibilityRole="button">
        <Text style={styles.link}>🤖 Спроси́ть ИИ</Text>
      </Pressable>
    );
  }

  const message = aiPrompt(text, q);
  return (
    <View style={styles.box}>
      <T style={styles.close} en="Type a question about this phrase (or leave it empty), then send it to an AI app or copy it.">
        Напиши́те вопро́с о фра́зе (и́ли оста́вьте пусты́м), пото́м отпра́вьте его́ в ИИ-приложе́ние и́ли скопи́руйте.
      </T>
      <TextInput
        style={styles.input}
        placeholder="Ваш вопро́с (мо́жно оста́вить пусты́м)"
        value={q}
        onChangeText={(t) => {
          setQ(t);
          setCopied(false);
        }}
        multiline
      />
      <Row>
        <Button
          label="Отпра́вить…"
          en="Send to an AI app (ChatGPT, Gemini, Claude…)"
          onPress={() =>
            Share.share({ message }).catch((e) =>
              Alert.alert('Не получи́лось откры́ть меню́ «Отпра́вить»', `Скопи́руйте вопро́с и вста́вьте его́ в ИИ-приложе́ние.\n\n${String(e)}`),
            )
          }
        />
        <Button
          label={copied ? 'Скопи́ровано ✓' : 'Копи́ровать'}
          en="Copy, then paste into any AI app"
          variant="outline"
          onPress={() => Clipboard.setStringAsync(message).then(() => setCopied(true))}
        />
      </Row>
      <Pressable onLongPress={() => hint("Close")} onPress={() => setOpen(false)} hitSlop={8}>
        <Text style={styles.close}>Закры́ть</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primary, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
  box: { gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.card },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  close: { color: colors.muted, textAlign: 'center' },
});
