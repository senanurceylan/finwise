import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { SummaryCard } from '@/components/common/SummaryCard';
import { ui } from '@/components/common/ui';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/lib/api';
import { formatDateDisplay, isOverdueForNotification, isUpcomingForNotification, parseLocalDateOnly } from '@/utils/regularPaymentRules';

type Expense = { amount: number; category?: string; date: string };
type RegularPayment = {
  id: string;
  title: string;
  amount: number;
  payment_day: number;
  next_due_date?: string | null;
  status: string;
  is_active: boolean;
};

function formatTry(n: number) {
  return `${Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, width - 64);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [regularPayments, setRegularPayments] = useState<RegularPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [exp, rp] = await Promise.all([
        api.get<Expense[]>('/expenses'),
        api.get<RegularPayment[]>('/regular-payments'),
      ]);
      setExpenses(Array.isArray(exp) ? exp : []);
      setRegularPayments(Array.isArray(rp) ? rp : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veriler yüklenemedi.');
      setExpenses([]);
      setRegularPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const thisMonth = expenses
      .filter((e) => {
        const d = parseLocalDateOnly(e.date);
        return d && d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const monthlyRegularTotal = regularPayments
      .filter((p) => p.is_active)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const upcomingCount = regularPayments.filter(isUpcomingForNotification).length;
    return { totalExpense, thisMonth, monthlyRegularTotal, upcomingCount };
  }, [expenses, regularPayments]);

  const upcomingList = useMemo(
    () => regularPayments.filter(isUpcomingForNotification),
    [regularPayments]
  );
  const overdueList = useMemo(
    () => regularPayments.filter(isOverdueForNotification),
    [regularPayments]
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

  const monthlyTrend = useMemo(() => {
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const buckets = new Map<string, { label: string; value: number }>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      buckets.set(key, { label: `${monthNames[d.getMonth()]}`, value: 0 });
    }
    for (const e of expenses) {
      const d = parseLocalDateOnly(e.date);
      if (!d) continue;
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!buckets.has(key)) continue;
      const row = buckets.get(key);
      if (row) row.value += Number(e.amount || 0);
    }
    const values = [...buckets.values()];
    return {
      labels: values.map((v) => v.label),
      datasets: [{ data: values.map((v) => Number(v.value.toFixed(2))) }],
    };
  }, [expenses]);

  return (
    <ScreenContainer>
      {loading ? <LoadingState /> : null}
      {error ? (
        <SectionCard>
          <ThemedText style={styles.error}>{error}</ThemedText>
        </SectionCard>
      ) : null}
      <SectionCard>
        <ThemedText style={styles.kicker}>FinWise</ThemedText>
        <ThemedText style={styles.heroTitle}>Özetiniz</ThemedText>
        <ThemedText style={styles.heroText}>Harcama ve yaklaşan ödemelerinizi tek bakışta görün.</ThemedText>
        <Pressable onPress={load}>
          <ThemedText style={styles.refresh}>Yenile</ThemedText>
        </Pressable>
      </SectionCard>
      <View style={styles.statsGrid}>
        <SummaryCard label="Toplam harcama" value={formatTry(stats.totalExpense)} />
        <SummaryCard label="Bu ayki harcama" value={formatTry(stats.thisMonth)} />
        <SummaryCard label="Aylık düzenli ödeme toplamı" value={formatTry(stats.monthlyRegularTotal)} />
        <SummaryCard label="Yaklaşan ödeme sayısı" value={stats.upcomingCount} accent />
      </View>
      <SectionCard>
        <ThemedText type="subtitle">Kategoriye göre harcama</ThemedText>
        {categoryPie.length === 0 ? (
          <EmptyState text="Veri yok." />
        ) : (
          <PieChart
            data={categoryPie}
            width={chartWidth}
            height={220}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="6"
            chartConfig={{
              color: () => '#f0b90b',
              labelColor: () => '#848e9c',
            }}
            absolute
          />
        )}
      </SectionCard>
      <SectionCard>
        <ThemedText type="subtitle">Aylara göre harcama (son 6 ay)</ThemedText>
        <BarChart
          data={monthlyTrend}
          width={chartWidth}
          height={220}
          fromZero
          showValuesOnTopOfBars
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundGradientFrom: '#1e2329',
            backgroundGradientTo: '#1e2329',
            decimalPlaces: 0,
            color: () => '#f0b90b',
            labelColor: () => '#848e9c',
            barPercentage: 0.6,
          }}
          style={styles.chart}
        />
      </SectionCard>
      <SectionCard>
        <ThemedText type="subtitle">Bildirim paneli</ThemedText>
        <ThemedText style={styles.sectionLabel}>Yaklaşan ödemeler ({upcomingList.length})</ThemedText>
        {upcomingList.length === 0 ? (
          <EmptyState text="Yaklaşan ödeme yok." />
        ) : (
          upcomingList.map((item) => (
            <ThemedText key={item.id} style={styles.listItem}>
              • {item.title} - son tarih {formatDateDisplay(item.next_due_date)}
            </ThemedText>
          ))
        )}
        <ThemedText style={styles.sectionLabel}>Geciken ödemeler ({overdueList.length})</ThemedText>
        {overdueList.length === 0 ? (
          <EmptyState text="Geciken ödeme yok." />
        ) : (
          overdueList.map((item) => (
            <ThemedText key={item.id} style={styles.listItem}>
              • {item.title} - son tarih {formatDateDisplay(item.next_due_date)}
            </ThemedText>
          ))
        )}
      </SectionCard>
      <SectionCard>
        <ThemedText type="subtitle">Hakkında</ThemedText>
        <ThemedText style={styles.heroText}>FinWise ile harcamalarınızı ve düzenli ödemelerinizi tek yerden yönetin.</ThemedText>
      </SectionCard>
      <SectionCard>
        <ThemedText type="subtitle">İletişim</ThemedText>
        <ThemedText style={styles.heroText}>Uygulama ile ilgili sorularınız için buradayız.</ThemedText>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: ui.brand,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: ui.text,
    fontSize: 28,
    fontWeight: '700',
  },
  heroText: {
    color: ui.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  refresh: { color: ui.brand, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionLabel: { color: ui.brand, fontWeight: '600', marginTop: 6 },
  listItem: { color: ui.text, fontSize: 13 },
  error: { color: ui.danger },
  chart: { borderRadius: 8 },
});
