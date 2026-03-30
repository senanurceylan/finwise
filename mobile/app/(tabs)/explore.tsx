import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { useUi } from '@/components/common/ui';
import { useI18n } from '@/constants/i18n';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { API_BASE_URL } from '@/lib/api';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { language, setLanguage, theme, setTheme } = usePreferences();
  const { t } = useI18n();
  const ui = useUi();

  return (
    <ScreenContainer>
      <ThemedText type="title">{t('settings_title')}</ThemedText>
      <SectionCard>
        <ThemedText type="defaultSemiBold">{t('settings_account')}</ThemedText>
        <ThemedText style={styles.text}>Ad: {user?.name || '-'}</ThemedText>
        <ThemedText style={styles.text}>E-posta: {user?.email || '-'}</ThemedText>
        <Pressable onPress={logout}>
          <ThemedText style={[styles.logout, { color: ui.danger }]}>{t('logout')}</ThemedText>
        </Pressable>
      </SectionCard>
      <SectionCard>
        <ThemedText type="defaultSemiBold">{t('settings_prefs')}</ThemedText>
        <View style={styles.row}>
          <ThemedText style={styles.text}>{t('settings_language')}</ThemedText>
          <View style={styles.chips}>
            <Pressable style={[styles.chip, { borderColor: ui.border, backgroundColor: ui.pageBg }, language === 'tr' && { borderColor: ui.brand, backgroundColor: '#252b33' }]} onPress={() => setLanguage('tr')}>
              <ThemedText style={[styles.chipText, { color: ui.muted }, language === 'tr' && { color: ui.brandSoft }]}>TR</ThemedText>
            </Pressable>
            <Pressable style={[styles.chip, { borderColor: ui.border, backgroundColor: ui.pageBg }, language === 'en' && { borderColor: ui.brand, backgroundColor: '#252b33' }]} onPress={() => setLanguage('en')}>
              <ThemedText style={[styles.chipText, { color: ui.muted }, language === 'en' && { color: ui.brandSoft }]}>EN</ThemedText>
            </Pressable>
          </View>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.text}>{t('settings_theme')}</ThemedText>
          <View style={styles.chips}>
            <Pressable style={[styles.chip, { borderColor: ui.border, backgroundColor: ui.pageBg }, theme === 'dark' && { borderColor: ui.brand, backgroundColor: '#252b33' }]} onPress={() => setTheme('dark')}>
              <ThemedText style={[styles.chipText, { color: ui.muted }, theme === 'dark' && { color: ui.brandSoft }]}>{t('settings_dark')}</ThemedText>
            </Pressable>
            <Pressable style={[styles.chip, { borderColor: ui.border, backgroundColor: ui.pageBg }, theme === 'light' && { borderColor: ui.brand, backgroundColor: '#252b33' }]} onPress={() => setTheme('light')}>
              <ThemedText style={[styles.chipText, { color: ui.muted }, theme === 'light' && { color: ui.brandSoft }]}>{t('settings_light')}</ThemedText>
            </Pressable>
          </View>
        </View>
      </SectionCard>
      <SectionCard>
        <ThemedText type="defaultSemiBold">Bağlantı</ThemedText>
        <ThemedText style={styles.text}>API Adresi: {API_BASE_URL}</ThemedText>
        <ThemedText style={styles.note}>
          Gerçek cihazda çalışırken `EXPO_PUBLIC_API_BASE_URL` tanımlayıp backend LAN adresini verin.
        </ThemedText>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14 },
  logout: { fontWeight: '700' },
  row: { gap: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  chipText: { fontSize: 12 },
  note: {
    fontSize: 13,
  },
});
