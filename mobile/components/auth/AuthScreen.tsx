import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { authStyles } from './auth-styles';

export function AuthScreen() {
  const [showRegister, setShowRegister] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[authStyles.page, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={authStyles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[authStyles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={authStyles.authPanel}>
            <View style={authStyles.appHeader}>
              <ThemedText style={authStyles.appTitle}>FinWise</ThemedText>
              <ThemedText style={authStyles.appSubtitle}>Harcamalarınızı yönetin</ThemedText>
            </View>
            {showRegister ? (
              <RegisterForm onSwitchLogin={() => setShowRegister(false)} />
            ) : (
              <LoginForm onSwitchRegister={() => setShowRegister(true)} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
