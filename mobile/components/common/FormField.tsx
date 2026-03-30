import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { useUi } from './ui';

type Props = {
  label: string;
  error?: string;
} & TextInputProps;

export function FormField({ label, error, style, ...rest }: Props) {
  const ui = useUi();
  return (
    <View style={styles.field}>
      <ThemedText style={[styles.label, { color: ui.muted }]}>{label}</ThemedText>
      <TextInput
        {...rest}
        placeholderTextColor={ui.muted}
        style={[styles.input, { backgroundColor: ui.pageBg, borderColor: ui.border, color: ui.text }, style]}
      />
      {error ? <ThemedText style={[styles.error, { color: ui.danger }]}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
  },
});
