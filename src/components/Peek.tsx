import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './ui';

/**
 * English stays hidden so you work out the meaning yourself.
 * Tap to peek. Pass `open` for idioms where the literal words won't get you there.
 */
export function Peek({ en, extra, open = false }: { en: string; extra?: string; open?: boolean }) {
  const [shown, setShown] = useState(open);
  useEffect(() => setShown(open), [en, open]);

  if (!shown) {
    return (
      <Pressable onPress={() => setShown(true)} hitSlop={8} accessibilityRole="button">
        <Text style={styles.peek}>👀 Peek at English</Text>
      </Pressable>
    );
  }
  // Tap the English again to hide it.
  return (
    <Pressable onPress={() => setShown(false)} hitSlop={8} accessibilityRole="button" accessibilityHint="Hides the English">
      <Text style={styles.en}>{en}</Text>
      {extra ? <Text style={styles.extra}>{extra}</Text> : null}
      <Text style={styles.hide}>🙈 Hide English</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  peek: { color: colors.primary, textAlign: 'center', fontSize: 15, paddingVertical: 4 },
  en: { fontSize: 18, textAlign: 'center', color: colors.text },
  extra: { color: colors.muted, textAlign: 'center', fontSize: 14, marginTop: 4 },
  hide: { color: colors.primary, textAlign: 'center', fontSize: 13, marginTop: 6 },
});
