import { Pressable, View } from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';

import { AuthField } from './AuthField';
import { authStyles } from './auth-styles';

type LoginFormProps = {
  onSwitchRegister: () => void;
};

export function LoginForm({ onSwitchRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={authStyles.authCard}>
      <ThemedText style={authStyles.authTitle}>Giriş Yap</ThemedText>
      <View style={authStyles.authForm}>
        {error ? <ThemedText style={authStyles.authError}>{error}</ThemedText> : null}
        <AuthField
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <AuthField
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
        />
        <Pressable
          style={[authStyles.btnPrimary, submitting && authStyles.btnPrimaryDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <ThemedText style={authStyles.btnPrimaryText}>
            {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </ThemedText>
        </Pressable>
        <View style={authStyles.authSwitch}>
          <ThemedText style={authStyles.authSwitchText}>Hesabınız yok mu?</ThemedText>
          <Pressable onPress={onSwitchRegister}>
            <ThemedText style={authStyles.authLink}>Kayıt olun</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
