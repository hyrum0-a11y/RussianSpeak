import { Alert, Platform, Pressable, StyleSheet, Text, ToastAndroid, View, type TextStyle, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

export const colors = {
  bg: '#F6F4EF',
  card: '#FFFFFF',
  text: '#1C1B1A',
  muted: '#6B6760',
  border: '#E4E0D8',
  primary: '#1F4E8C',
  primaryText: '#FFFFFF',
  again: '#C0392B',
  hard: '#D68910',
  good: '#1E8449',
  easy: '#2471A3',
  record: '#B03A2E',
};

/** Show the English for a Russian label (press and hold anything to see it). */
export function hint(en?: string) {
  if (!en) return;
  if (Platform.OS === 'android') ToastAndroid.show(en, ToastAndroid.SHORT);
  else Alert.alert(en);
}

/** Russian text that shows its English when you press and hold it. */
export function T({ en, style, children, numberOfLines }: { en?: string; style?: TextStyle | TextStyle[]; children: ReactNode; numberOfLines?: number }) {
  return (
    <Text style={style} numberOfLines={numberOfLines} onLongPress={en ? () => hint(en) : undefined} suppressHighlighting>
      {children}
    </Text>
  );
}

export function Button({
  label,
  en,
  onPress,
  color = colors.primary,
  variant = 'solid',
  sub,
  disabled,
  style,
}: {
  label: string;
  /** English shown on press-and-hold. */
  en?: string;
  onPress: () => void;
  color?: string;
  variant?: 'solid' | 'outline';
  sub?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      onLongPress={en ? () => hint(en) : undefined}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        solid ? { backgroundColor: color } : { borderColor: color, borderWidth: 1.5 },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.75 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: solid ? colors.primaryText : color }]}>{label}</Text>
      {sub ? <Text style={[styles.btnSub, { color: solid ? colors.primaryText : color }]}>{sub}</Text> : null}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '600' },
  btnSub: { fontSize: 12, opacity: 0.85, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 10 },
});
