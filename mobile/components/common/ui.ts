import { usePreferences } from '@/context/PreferencesContext';

const dark = {
  pageBg: '#0b0e11',
  cardBg: '#1e2329',
  border: '#2b3139',
  text: '#eaecef',
  muted: '#848e9c',
  danger: '#f6465d',
  brand: '#f0b90b',
  brandSoft: '#f5d066',
  positive: '#0ecb81',
} as const;

const light = {
  pageBg: '#f8fafc',
  cardBg: '#ffffff',
  border: '#d1d9e6',
  text: '#0f172a',
  muted: '#475569',
  danger: '#e11d48',
  brand: '#b8860b',
  brandSoft: '#d4a514',
  positive: '#059669',
} as const;

export type UiTokens = typeof dark;
export const ui = dark;

export function useUi(): UiTokens {
  const { theme } = usePreferences();
  return theme === 'light' ? light : dark;
}
