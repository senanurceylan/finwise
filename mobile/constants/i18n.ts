import { usePreferences } from '@/context/PreferencesContext';

const dict = {
  tr: {
    tabs_expenses: 'Harcamalar',
    tabs_home: 'Ana Sayfa',
    tabs_regular: 'Düzenli',
    tabs_investments: 'Yatırımlar',
    tabs_cards: 'Kartlar',
    tabs_settings: 'Ayarlar',
    settings_title: 'Ayarlar',
    settings_account: 'Hesap',
    settings_prefs: 'Tercihler',
    settings_language: 'Dil',
    settings_theme: 'Tema',
    settings_dark: 'Gece',
    settings_light: 'Gündüz',
    logout: 'Çıkış Yap',
  },
  en: {
    tabs_expenses: 'Expenses',
    tabs_home: 'Home',
    tabs_regular: 'Regular',
    tabs_investments: 'Investments',
    tabs_cards: 'Cards',
    tabs_settings: 'Settings',
    settings_title: 'Settings',
    settings_account: 'Account',
    settings_prefs: 'Preferences',
    settings_language: 'Language',
    settings_theme: 'Theme',
    settings_dark: 'Dark',
    settings_light: 'Light',
    logout: 'Log out',
  },
} as const;

export function useI18n() {
  const { language } = usePreferences();
  const t = (key: keyof (typeof dict)['tr']) => dict[language][key];
  return { t, language };
}
