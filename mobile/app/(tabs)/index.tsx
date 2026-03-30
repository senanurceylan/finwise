import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { FormField } from '@/components/common/FormField';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { ui } from '@/components/common/ui';
import { ThemedText } from '@/components/themed-text';
import { isCardPaymentSource, PAYMENT_SOURCE_OPTIONS, paymentSourceLabel } from '@/constants/paymentSources';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  paymentSource?: string;
  card?: { label?: string } | null;
};
type Card = { id: string; bankName: string; cardName: string; last4Digits: string };

const CATEGORIES = ['Gıda', 'Ulaşım', 'Fatura', 'Eğlence', 'Teknolojik Alet', 'Diğer'];

function ExpenseDashboard() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, width - 64);
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [paymentSource, setPaymentSource] = useState<string>('cash');
  const [cardId, setCardId] = useState('');

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );
  const categoryPie = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const cat = e.category || 'Diğer';
      map.set(cat, (map.get(cat) || 0) + Number(e.amount || 0));
    }
    const colors = ['#f0b90b', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899'];
    return [...map.entries()].map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
      legendFontColor: '#848e9c',
      legendFontSize: 11,
    }));
  }, [expenses]);
  const trendData = useMemo(() => {
    const sorted = [...expenses]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(-7);
    return {
      labels: sorted.map((e) => (e.date || '').slice(5)),
      datasets: [{ data: sorted.map((e) => Number(e.amount || 0)) }],
    };
  }, [expenses]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, cardData] = await Promise.all([
        api.get<Expense[]>('/expenses'),
        api.get<Card[]>('/cards').catch(() => []),
      ]);
      setExpenses(Array.isArray(data) ? data : []);
      setCards(Array.isArray(cardData) ? cardData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Harcamalar alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        amount: Number(amount),
        category: category || undefined,
        date,
        description: description.trim(),
        paymentSource,
        ...(cardId ? { cardId } : {}),
      });
      setAmount('');
      setDescription('');
      setCategory('');
      setPaymentSource('cash');
      setCardId('');
      await fetchExpenses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Harcama eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeExpense = async (id: string) => {
    setError('');
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Harcama silinemedi.');
    }
  };

  return (
    <>
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="title">FinWise</ThemedText>
          <ThemedText style={styles.subtitle}>Harcama Ekle</ThemedText>
          <ThemedText style={styles.userText}>{user?.name || user?.email}</ThemedText>
        </View>
        <Pressable onPress={logout}>
          <ThemedText style={styles.linkText}>Çıkış</ThemedText>
        </Pressable>
      </View>

      <SectionCard>
        <FormField
          label="Harcama Tutarı"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <FormField
          label={`Kategori (${CATEGORIES.join(', ')})`}
          value={category}
          onChangeText={setCategory}
          placeholder="Seçiniz"
        />
        <FormField
          label="Tarih"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-AA-GG"
        />
        <FormField
          label="Açıklama"
          value={description}
          onChangeText={setDescription}
          placeholder="İsteğe bağlı açıklama"
        />
        <ThemedText style={styles.label}>Ödeme kaynağı</ThemedText>
        <View style={styles.chips}>
          {PAYMENT_SOURCE_OPTIONS.map((src) => (
            <Pressable
              key={src.value}
              style={[styles.chip, paymentSource === src.value && styles.chipActive]}
              onPress={() => {
                setPaymentSource(src.value);
                if (!isCardPaymentSource(src.value)) setCardId('');
              }}
            >
              <ThemedText style={[styles.chipText, paymentSource === src.value && styles.chipTextActive]}>
                {src.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        {isCardPaymentSource(paymentSource) ? (
          <>
            <ThemedText style={styles.label}>Kart (isteğe bağlı)</ThemedText>
            <View style={styles.chips}>
              <Pressable style={[styles.chip, !cardId && styles.chipActive]} onPress={() => setCardId('')}>
                <ThemedText style={[styles.chipText, !cardId && styles.chipTextActive]}>Kart seçilmedi</ThemedText>
              </Pressable>
              {cards.map((card) => (
                <Pressable
                  key={card.id}
                  style={[styles.chip, cardId === card.id && styles.chipActive]}
                  onPress={() => setCardId(card.id)}
                >
                  <ThemedText style={[styles.chipText, cardId === card.id && styles.chipTextActive]}>
                    {card.bankName} ••••{card.last4Digits}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        <Pressable style={styles.primaryButton} onPress={addExpense} disabled={submitting}>
          <ThemedText style={styles.primaryButtonText}>{submitting ? 'Kaydediliyor...' : 'Kaydet'}</ThemedText>
        </Pressable>
      </SectionCard>

      <SectionCard>
        <ThemedText type="subtitle">Harcamalar ({expenses.length})</ThemedText>
        <ThemedText style={styles.total}>Toplam: {total.toFixed(2)} TL</ThemedText>
        <Pressable onPress={fetchExpenses}>
          <ThemedText style={styles.linkText}>Yenile</ThemedText>
        </Pressable>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {loading ? (
          <LoadingState />
        ) : expenses.length === 0 ? (
          <EmptyState text="Henüz harcama bulunmuyor" />
        ) : (
          expenses.map((item) => (
            <View key={item.id} style={styles.expenseRow}>
              <View style={styles.expenseTextBlock}>
                <ThemedText style={styles.expenseTitle}>
                  {item.category} - {Number(item.amount).toFixed(2)} TL
                </ThemedText>
                <ThemedText style={styles.expenseMeta}>{item.date}</ThemedText>
                <ThemedText style={styles.expenseMeta}>
                  {paymentSourceLabel(item.paymentSource)}
                  {item.card?.label ? ` • ${item.card.label}` : ''}
                </ThemedText>
                {item.description ? <ThemedText style={styles.expenseMeta}>{item.description}</ThemedText> : null}
              </View>
              <Pressable onPress={() => removeExpense(item.id)}>
                <ThemedText style={styles.deleteText}>Sil</ThemedText>
              </Pressable>
            </View>
          ))
        )}
      </SectionCard>
      <SectionCard>
        <ThemedText type="subtitle">Kategori dağılımı</ThemedText>
        {categoryPie.length === 0 ? (
          <EmptyState text="Grafik için veri yok." />
        ) : (
          <PieChart
            data={categoryPie}
            width={chartWidth}
            height={220}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="6"
            chartConfig={{ color: () => '#f0b90b', labelColor: () => '#848e9c' }}
            absolute
          />
        )}
      </SectionCard>
      <SectionCard>
        <ThemedText type="subtitle">Harcama trendi (son 7 kayıt)</ThemedText>
        {trendData.datasets[0].data.length === 0 ? (
          <EmptyState text="Grafik için veri yok." />
        ) : (
          <LineChart
            data={trendData}
            width={chartWidth}
            height={220}
            yAxisSuffix=""
            chartConfig={{
              backgroundGradientFrom: '#1e2329',
              backgroundGradientTo: '#1e2329',
              decimalPlaces: 0,
              color: () => '#f0b90b',
              labelColor: () => '#848e9c',
            }}
            bezier
            style={styles.chart}
          />
        )}
      </SectionCard>
    </>
  );
}

export default function DashboardScreen() {
  const { loading, isAuthenticated } = useAuth();

  if (!loading && !isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <ScreenContainer>
        {loading ? (
          <LoadingState />
        ) : (
          <ExpenseDashboard />
        )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitle: { color: ui.muted, marginTop: 4 },
  userText: { color: ui.text, fontSize: 13 },
  label: { color: ui.muted, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: 999,
    backgroundColor: ui.pageBg,
  },
  chipActive: { borderColor: ui.brand, backgroundColor: '#252b33' },
  chipText: { color: ui.muted, fontSize: 12 },
  chipTextActive: { color: ui.brandSoft },
  primaryButton: {
    backgroundColor: ui.brand,
    borderRadius: 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: { color: ui.pageBg, fontWeight: '700' },
  total: { color: ui.brand, fontWeight: '700' },
  error: { color: ui.danger },
  linkText: { color: ui.brand, fontWeight: '600' },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: ui.border,
    paddingTop: 10,
  },
  expenseTextBlock: { flex: 1, gap: 2 },
  expenseTitle: { fontWeight: '600', color: ui.text },
  expenseMeta: { color: ui.muted, fontSize: 13 },
  deleteText: { color: ui.danger, fontWeight: '700' },
  chart: { borderRadius: 8 },
});
