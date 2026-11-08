import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { aiPrompt } from '../lib/askAi';
import { Button, colors, Row } from './ui';

/**
 * "Спросить ИИ": writes a question about the phrase and hands it to whatever
 * AI app you like through Android's share menu (or copies it).
 */
export function AskAI({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} hitSlop={8} accessibilityRole="button">
        <Text style={styles.link}>🤖 Спросить ИИ</Text>
      </Pressable>
    );
  }

  const message = aiPrompt(text, q);
  return (
    <View style={styles.box}>
      <TextInput
        style={styles.input}
        placeholder="Ваш вопрос (можно оставить пустым)"
        value={q}
        onChangeText={(t) => {
          setQ(t);
          setCopied(false);
        }}
        multiline
      />
      <Row>
        <Button label="Отправить…" onPress={() => Share.share({ message }).catch(() => {})} />
        <Button
          label={copied ? 'Скопировано ✓' : 'Копировать'}
          variant="outline"
          onPress={() => Clipboard.setStringAsync(message).then(() => setCopied(true))}
        />
      </Row>
      <Pressable onPress={() => setOpen(false)} hitSlop={8}>
        <Text style={styles.close}>Закрыть</Text>
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
