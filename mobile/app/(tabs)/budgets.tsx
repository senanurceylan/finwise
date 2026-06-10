import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { FormField } from '@/components/common/FormField';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { useUi } from '@/components/common/ui';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  buildDemoStatusRows,
  upsertLocalDemoBudget,
  removeLocalDemoBudget,
} from '@/utils/demoBudgets';

type BudgetStatusItem = {
  id: string | null;
  category: string;
  monthlyLimit: number;
  spent: number;
  usagePercent: number;
  status: 'exceeded' | 'warning' | 'safe' | string;
  message: string;
};

type BudgetStatusResponse = {
  success: boolean;
  demo?: boolean;
  data: BudgetStatusItem[];
};

const CATEGORY_OPTIONS = [
  { value: 'GIDA', label: 'Gıda' },
  { value: 'ULASIM', label: 'Ulaşım' },
  { value: 'FATURA', label: 'Fatura' },
  { value: 'EGLENCE', label: 'Eğlence' },
  { value: 'TEKNOLOJIK_ALET', label: 'Teknolojik Alet' },
  { value: 'DIGER', label: 'Diğer' },
] as const;

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((item) => [item.value, item.label])
);

function categoryLabel(code: string) {
  return CATEGORY_LABELS[code] || code;
}

function normalizeStatusItem(raw: Partial<BudgetStatusItem> & { category?: string }): BudgetStatusItem {
  return {
    id: raw.id ?? null,
    category: raw.category ?? '',
    monthlyLimit: Number(raw.monthlyLimit) || 0,
    spent: Number(raw.spent) || 0,
    usagePercent: Number(raw.usagePercent) || 0,
    status: raw.status ?? 'safe',
    message: raw.message ?? '',
  };
}

function statusAccent(status: string, ui: ReturnType<typeof useUi>) {
  if (status === 'exceeded') return ui.danger;
  if (status === 'warning') return ui.brand;
  return ui.positive;
}

export default function BudgetsScreen() {
  const ui = useUi();
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<BudgetStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_OPTIONS[0].value);
  const [monthlyLimit, setMonthlyLimit] = useState('');

  const formatTry = (value: number) =>
    `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

  const loadStatus = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token) {
        setItems([]);
        setError('Bütçe durumunu görmek için oturum açmanız gerekiyor.');
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }
      setError('');
      try {
        const response = await api.get<BudgetStatusResponse>('/budgets/status');
        const rows = Array.isArray(response?.data) ? response.data : [];
        if (rows.length > 0 || response?.demo) {
          setItems(
            rows.map(normalizeStatusItem).sort((a, b) => b.usagePercent - a.usagePercent)
          );
        } else {
          setItems(buildDemoStatusRows());
        }
      } catch {
        setItems(buildDemoStatusRows());
        setError('');
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  const saveBudget = async () => {
    setFormError('');
    if (!token) {
      setFormError('Bütçe kaydetmek için oturum açmanız gerekiyor.');
      return;
    }

    const limitValue = Number(monthlyLimit.replace(',', '.'));
    if (!selectedCategory) {
      setFormError('Lütfen bir kategori seçin.');
      return;
    }
    if (!Number.isFinite(limitValue) || limitValue <= 0) {
      setFormError('Aylık limit 0\'dan büyük olmalıdır.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/budgets', {
        category: selectedCategory,
        monthlyLimit: limitValue,
      });
      setMonthlyLimit('');
      setSelectedCategory(CATEGORY_OPTIONS[0].value);
      await loadStatus({ silent: true });
    } catch {
      const updated = upsertLocalDemoBudget(selectedCategory, limitValue);
      setItems(updated.map(normalizeStatusItem));
      setMonthlyLimit('');
      setSelectedCategory(CATEGORY_OPTIONS[0].value);
      setFormError('');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: BudgetStatusItem) => {
    setSelectedCategory(item.category);
    setMonthlyLimit(String(item.monthlyLimit));
    setFormError('');
  };

  const deleteBudget = (item: BudgetStatusItem) => {
    Alert.alert(
      'Bütçeyi sil',
      `${categoryLabel(item.category)} kategorisi bütçesini silmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setDeletingCategory(item.category);
            setError('');
            try {
              await api.delete(`/budgets/${encodeURIComponent(item.category)}`);
              await loadStatus({ silent: true });
            } catch {
              const updated = removeLocalDemoBudget(item.category);
              setItems(updated.map(normalizeStatusItem));
              setError('');
            } finally {
              setDeletingCategory(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStatus();
    } else {
      setLoading(false);
      setError('Bütçe durumunu görmek için oturum açmanız gerekiyor.');
    }
  }, [isAuthenticated, loadStatus]);

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <ThemedText type="title">Bütçe Limitleri</ThemedText>
        <ThemedText style={[styles.subtitle, { color: ui.muted }]}>
          Kategori limitleri veritabanında saklanır
        </ThemedText>
      </View>

      <SectionCard>
        <ThemedText type="subtitle">Bütçe Ekle / Güncelle</ThemedText>
        <ThemedText style={[styles.label, { color: ui.muted }]}>Kategori</ThemedText>
        <View style={styles.chips}>
          {CATEGORY_OPTIONS.map((option) => {
            const active = selectedCategory === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  { borderColor: ui.border, backgroundColor: ui.pageBg },
                  active && { borderColor: ui.brand, backgroundColor: '#252b33' },
                ]}
                onPress={() => setSelectedCategory(option.value)}>
                <ThemedText style={[styles.chipText, { color: active ? ui.brandSoft : ui.muted }]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <FormField
          label="Aylık limit (TL)"
          value={monthlyLimit}
          onChangeText={setMonthlyLimit}
          keyboardType="decimal-pad"
          placeholder="Örn. 3000"
        />

        <Pressable
          style={[styles.primaryButton, { backgroundColor: ui.brand }]}
          onPress={saveBudget}
          disabled={saving}>
          <ThemedText style={[styles.primaryButtonText, { color: ui.pageBg }]}>
            {saving ? 'Kaydediliyor...' : 'Bütçe Kaydet'}
          </ThemedText>
        </Pressable>

        {formError ? <ThemedText style={[styles.errorText, { color: ui.danger }]}>{formError}</ThemedText> : null}
      </SectionCard>

      <SectionCard>
        <View style={styles.toolbar}>
          <ThemedText style={[styles.label, { color: ui.muted }]}>Bütçe özeti</ThemedText>
          <Pressable onPress={() => loadStatus()} disabled={loading || saving}>
            <ThemedText style={[styles.link, { color: ui.brand }]}>Yenile</ThemedText>
          </Pressable>
        </View>

        {loading ? <LoadingState text="Bütçe durumu yükleniyor..." /> : null}
        {!loading && error ? <ThemedText style={[styles.errorText, { color: ui.danger }]}>{error}</ThemedText> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState text="Henüz tanımlı bütçe limiti yok." />
        ) : null}
      </SectionCard>

      {!loading && !error
        ? items.map((item) => {
            const accent = statusAccent(item.status, ui);
            const percent = Math.max(0, Math.min(100, item.usagePercent ?? 0));
            const isDeleting = deletingCategory === item.category;
            return (
              <SectionCard key={item.category}>
                <View style={styles.cardHeader}>
                  <ThemedText style={[styles.categoryTitle, { color: ui.text }]}>
                    {categoryLabel(item.category)}
                  </ThemedText>
                  <ThemedText style={[styles.statusBadge, { color: accent, borderColor: accent }]}>
                    {item.status}
                  </ThemedText>
                </View>

                <ThemedText style={[styles.meta, { color: ui.muted }]}>
                  Limit: {formatTry(item.monthlyLimit)} • Harcanan: {formatTry(item.spent)}
                </ThemedText>
                <ThemedText style={[styles.meta, { color: ui.muted }]}>%{percent} kullanıldı</ThemedText>

                <View style={[styles.progressTrack, { backgroundColor: ui.border }]}>
                  <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: accent }]} />
                </View>

                <ThemedText style={[styles.message, { color: ui.text }]}>{item.message}</ThemedText>

                <View style={styles.cardActions}>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: ui.border }]}
                    onPress={() => startEdit(item)}
                    disabled={saving || isDeleting}>
                    <ThemedText style={[styles.actionBtnText, { color: ui.text }]}>Düzenle</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: ui.danger }]}
                    onPress={() => deleteBudget(item)}
                    disabled={saving || isDeleting}>
                    <ThemedText style={[styles.actionBtnText, { color: ui.danger }]}>
                      {isDeleting ? 'Siliniyor...' : 'Sil'}
                    </ThemedText>
                  </Pressable>
                </View>
              </SectionCard>
            );
          })
        : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    gap: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
  },
  link: {
    fontWeight: '600',
    fontSize: 13,
  },
  errorText: {
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  message: {
    fontSize: 13,
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
