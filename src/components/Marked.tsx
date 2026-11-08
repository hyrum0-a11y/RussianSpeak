import { StyleSheet, Text, type TextStyle } from 'react-native';
import { markWord } from '../lib/wiktionary';
import { colors } from './ui';

/** A sentence with every form of `word` highlighted. */
export function Marked({ sentence, word, style }: { sentence: string; word: string; style?: TextStyle }) {
  return (
    <Text style={style}>
      {markWord(sentence, word).map((p, i) => (
        <Text key={i} style={p.hit ? styles.hit : undefined}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  hit: { color: colors.primary, fontWeight: '800', backgroundColor: '#FFF4D6' },
});
