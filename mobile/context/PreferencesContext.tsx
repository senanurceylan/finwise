import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'tr' | 'en';

type PreferencesContextValue = {
  theme: AppTheme;
  language: AppLanguage;
  setTheme: (value: AppTheme) => Promise<void>;
  setLanguage: (value: AppLanguage) => Promise<void>;
  loading: boolean;
};

const THEME_KEY = 'finwise_theme';
const LANGUAGE_KEY = 'finwise_lang';

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [language, setLanguageState] = useState<AppLanguage>('tr');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      try {
        const [storedTheme, storedLanguage] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY),
        ]);
        if (storedTheme === 'dark' || storedTheme === 'light') setThemeState(storedTheme);
        if (storedLanguage === 'tr' || storedLanguage === 'en') setLanguageState(storedLanguage);
      } finally {
        setLoading(false);
      }
    }
    hydrate();
  }, []);

  const setTheme = useCallback(async (value: AppTheme) => {
    setThemeState(value);
    await AsyncStorage.setItem(THEME_KEY, value);
  }, []);

  const setLanguage = useCallback(async (value: AppLanguage) => {
    setLanguageState(value);
    await AsyncStorage.setItem(LANGUAGE_KEY, value);
  }, []);

  const value = useMemo(
    () => ({ theme, language, setTheme, setLanguage, loading }),
    [theme, language, setTheme, setLanguage, loading]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
