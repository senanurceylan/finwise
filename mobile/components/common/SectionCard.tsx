import { StyleSheet, View, type ViewProps } from 'react-native';

import { useUi } from './ui';

export function SectionCard({ style, ...rest }: ViewProps) {
  const ui = useUi();
  return <View {...rest} style={[styles.card, { backgroundColor: ui.cardBg, borderColor: ui.border }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
});
