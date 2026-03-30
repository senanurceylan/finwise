import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { useUi } from './ui';

type Props = {
  text: string;
};

export function EmptyState({ text }: Props) {
  const ui = useUi();
  return (
    <View style={styles.wrap}>
      <ThemedText style={[styles.text, { color: ui.muted }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
