import { Pressable, View } from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';

import { AuthField } from './AuthField';
import { authStyles } from './auth-styles';

type RegisterFormProps = {
  onSwitchLogin: () => void;
};

export function RegisterForm({ onSwitchLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={authStyles.authCard}>
      <ThemedText style={authStyles.authTitle}>Kayıt Ol</ThemedText>
      <View style={authStyles.authForm}>
        {error ? <ThemedText style={authStyles.authError}>{error}</ThemedText> : null}
        <AuthField
          label="Ad Soyad"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
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
          label="Şifre (en az 6 karakter)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
        />
        <Pressable
          style={[authStyles.btnPrimary, submitting && authStyles.btnPrimaryDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <ThemedText style={authStyles.btnPrimaryText}>
            {submitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </ThemedText>
        </Pressable>
        <View style={authStyles.authSwitch}>
          <ThemedText style={authStyles.authSwitchText}>Zaten hesabınız var mı?</ThemedText>
          <Pressable onPress={onSwitchLogin}>
            <ThemedText style={authStyles.authLink}>Giriş yapın</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
