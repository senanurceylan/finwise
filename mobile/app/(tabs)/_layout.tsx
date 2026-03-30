import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useI18n } from '@/constants/i18n';
import { usePreferences } from '@/context/PreferencesContext';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { theme } = usePreferences();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme === 'dark' ? 'dark' : 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: !isAuthenticated ? { display: 'none' } : undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isAuthenticated ? t('tabs_expenses') : 'FinWise',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs_home'),
          href: isAuthenticated ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="regular-payments"
        options={{
          title: t('tabs_regular'),
          href: isAuthenticated ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: t('tabs_investments'),
          href: isAuthenticated ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: t('tabs_cards'),
          href: isAuthenticated ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs_settings'),
          href: isAuthenticated ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
