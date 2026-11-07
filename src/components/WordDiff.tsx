import { StyleSheet, Text, View } from 'react-native';
import type { WordResult } from '../lib/compare';
import { colors } from './ui';

/** Target phrase with each word green (got it) or red (missed). */
export function WordDiff({ results }: { results: WordResult[] }) {
  return (
    <View style={styles.wrap}>
      {results.map((r, i) => (
        <Text key={i} style={[styles.word, { color: r.ok ? colors.good : colors.again }, !r.ok && styles.miss]}>
          {r.word}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  word: { fontSize: 20, fontWeight: '600' },
  miss: { textDecorationLine: 'underline' },
});
