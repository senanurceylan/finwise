import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { useUi } from './ui';

type Props = {
  text?: string;
};

export function LoadingState({ text = 'Yükleniyor...' }: Props) {
  const ui = useUi();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={ui.brand} />
      <ThemedText style={[styles.text, { color: ui.muted }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  text: {
  },
});
