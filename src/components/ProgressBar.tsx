import { StyleSheet, View } from 'react-native';
import { colors } from './ui';

export function ProgressBar({ value, color = colors.good, height = 6 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.border, overflow: 'hidden', alignSelf: 'stretch' },
});
