import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { SectionCard } from './SectionCard';
import { useUi } from './ui';

type Props = {
  label: string;
  value: string | number;
  accent?: boolean;
};

export function SummaryCard({ label, value, accent = false }: Props) {
  const ui = useUi();
  return (
    <SectionCard style={styles.card}>
      <ThemedText style={[styles.label, { color: ui.muted }]}>{label}</ThemedText>
      <ThemedText style={[styles.value, { color: ui.text }, accent && { color: ui.brand }]}>{value}</ThemedText>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
});
