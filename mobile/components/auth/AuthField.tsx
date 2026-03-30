import { TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { authColors, authStyles } from './auth-styles';

type AuthFieldProps = {
  label: string;
} & TextInputProps;

export function AuthField({ label, ...props }: AuthFieldProps) {
  return (
    <View style={authStyles.formField}>
      <ThemedText style={authStyles.fieldLabel}>{label}</ThemedText>
      <TextInput
        {...props}
        placeholderTextColor={authColors.textMuted}
        style={authStyles.input}
      />
    </View>
  );
}
