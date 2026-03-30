import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

import { EmptyState } from '@/components/common/EmptyState';
import { FormField } from '@/components/common/FormField';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { SummaryCard } from '@/components/common/SummaryCard';
import { ui } from '@/components/common/ui';
import { ThemedText } from '@/components/themed-text';
import { isCardPaymentSource, PAYMENT_SOURCE_OPTIONS, paymentSourceLabel } from '@/constants/paymentSources';
import { api } from '@/lib/api';
import { getDemoInvestments, isDemoInvestment } from '@/utils/demoInvestments';

type Investment = {
  id: string;
  symbol: string;
  assetType: string;
  quantity: number;
  buyPriceTry: number;
  note?: string;
  paymentSource?: string;
  cardId?: string | null;
  sourceLabel?: string;
  card?: { bankName: string; last4Digits: string } | null;
};
type Card = { id: string; bankName: string; last4Digits: string };

const PRICE_CARDS = [
  { symbol: 'USDTRY', label: 'USD/TRY' },
  { symbol: 'EURTRY', label: 'EUR/TRY' },
  { symbol: 'XAUTRY', label: 'Altın (XAU/TRY)' },
  { symbol: 'XAGTRY', label: 'Gümüş (XAG/TRY)' },
  { symbol: 'BTCTRY', label: 'Bitcoin (TRY)' },
  { symbol: 'ETHTRY', label: 'Ethereum (TRY)' },
  { symbol: 'SOLTRY', label: 'Solana (TRY)' },
  { symbol: 'XRPTRY', label: 'Ripple / XRP (TRY)' },
  { symbol: 'ADATRY', label: 'Cardano / ADA (TRY)' },
] as const;
const SYMBOL_LABELS = Object.fromEntries(PRICE_CARDS.map((c) => [c.symbol, c.label]));
const ASSET_TYPE_OPTIONS = [
  { value: 'FOREX', label: 'Döviz' },
  { value: 'CRYPTO', label: 'Kripto' },
  { value: 'METAL', label: 'Metal' },
] as const;

function formatTry(value: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function hasFinitePrice(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}

export default function InvestmentsScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, width - 64);
  const [marketData, setMarketData] = useState<Record<string, number | null>>({});
  const [marketWarnings, setMarketWarnings] = useState<string[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    symbol: 'USDTRY',
    assetType: 'FOREX',
    quantity: '',
    buyPriceTry: '',
    note: '',
    paymentSource: 'investment_platform',
    cardId: '',
    sourceLabel: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [pricesRes, investmentsRes, cardsRes] = await Promise.all([
        api.get<{ prices?: Record<string, number | null>; warnings?: string[] }>('/market/prices'),
        api.get<Investment[]>('/investments'),
        api.get<Card[]>('/cards').catch(() => []),
      ]);
      setMarketData(pricesRes?.prices || {});
      setMarketWarnings(Array.isArray(pricesRes?.warnings) ? pricesRes.warnings : []);
      setInvestments(Array.isArray(investmentsRes) ? investmentsRes : []);
      setCards(Array.isArray(cardsRes) ? cardsRes : []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Yatırım verileri yüklenemedi.');
      setMarketData({});
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayInvestments = useMemo(() => {
    if (investments.length > 0) return investments;
    if (loading || fetchError) return [];
    return getDemoInvestments() as Investment[];
  }, [investments, loading, fetchError]);

  const showDemoBanner = !loading && investments.length === 0 && !fetchError;

  const rows = useMemo(() => {
    return displayInvestments.map((item) => {
      const livePrice = hasFinitePrice(marketData[item.symbol]) ? Number(marketData[item.symbol]) : null;
      const quantity = Number(item.quantity || 0);
      const buyPrice = Number(item.buyPriceTry || 0);
      const cost = quantity * buyPrice;
      const currentValue = livePrice != null ? quantity * livePrice : null;
      const pnl = livePrice != null ? currentValue - cost : null;
      return { ...item, livePrice, cost, currentValue, pnl };
    });
  }, [displayInvestments, marketData]);
  const allocationData = useMemo(() => {
    const grouped = new Map<string, number>();
    rows.forEach((row) => {
      if (row.currentValue == null || row.currentValue <= 0) return;
      const label = SYMBOL_LABELS[row.symbol] || row.symbol;
      grouped.set(label, (grouped.get(label) || 0) + row.currentValue);
    });
    const colors = ['#f0b90b', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899'];
    return Array.from(grouped.entries()).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
      legendFontColor: '#848e9c',
      legendFontSize: 11,
    }));
  }, [rows]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.cost += row.cost;
          if (row.currentValue != null) {
            acc.current += row.currentValue;
            acc.pnl += row.pnl || 0;
            acc.hasAnyLive = true;
          }
          return acc;
        },
        { cost: 0, current: 0, pnl: 0, hasAnyLive: false }
      ),
    [rows]
  );

  const resetForm = () => {
    setEditingId('');
    setForm({
      symbol: 'USDTRY',
      assetType: 'FOREX',
      quantity: '',
      buyPriceTry: '',
      note: '',
      paymentSource: 'investment_platform',
      cardId: '',
      sourceLabel: '',
    });
  };

  const onSubmit = async () => {
    setError('');
    if (editingId && isDemoInvestment({ id: editingId })) {
      setError('Demo kayıtlar düzenlenemez. Yeni bir yatırım ekleyin.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        symbol: form.symbol,
        assetType: form.assetType,
        quantity: Number(form.quantity),
        buyPriceTry: Number(form.buyPriceTry),
        note: form.note.trim(),
        paymentSource: form.paymentSource,
        ...(form.cardId ? { cardId: form.cardId } : {}),
        ...(form.sourceLabel.trim() ? { sourceLabel: form.sourceLabel.trim() } : {}),
      };
      if (editingId) await api.put(`/investments/${editingId}`, payload);
      else await api.post('/investments', payload);
      resetForm();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yatırım kaydı kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (item: Investment) => {
    if (isDemoInvestment(item)) return;
    setEditingId(item.id);
    setForm({
      symbol: item.symbol,
      assetType: item.assetType,
      quantity: String(item.quantity),
      buyPriceTry: String(item.buyPriceTry),
      note: item.note || '',
      paymentSource: item.paymentSource || 'investment_platform',
      cardId: item.cardId || '',
      sourceLabel: item.sourceLabel || '',
    });
  };

  const onDelete = async (id: string) => {
    if (isDemoInvestment({ id })) return;
    try {
      await api.delete(`/investments/${id}`);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yatırım kaydı silinemedi.');
    }
  };

  return (
    <ScreenContainer>
      {fetchError ? <ThemedText style={styles.error}>{fetchError}</ThemedText> : null}
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {showDemoBanner ? (
        <SectionCard>
          <ThemedText style={styles.demoBanner}>
            Demo portföy verisi gösteriliyor. Kendi yatırımınızı eklediğinizde bu örnekler gizlenir.
          </ThemedText>
        </SectionCard>
      ) : null}
      {marketWarnings.length ? (
        <SectionCard>
          <ThemedText style={styles.error}>{marketWarnings.join(' ')}</ThemedText>
        </SectionCard>
      ) : null}

      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Toplam Portföy Değeri"
          value={totals.hasAnyLive ? formatTry(totals.current) : rows.length ? '—' : formatTry(0)}
          accent
        />
        <SummaryCard label="Toplam Maliyet" value={formatTry(totals.cost)} />
        <SummaryCard label="Toplam Kâr / Zarar" value={totals.hasAnyLive ? formatTry(totals.pnl) : rows.length ? '—' : formatTry(0)} />
      </View>

      <SectionCard>
        <ThemedText type="subtitle">Canlı Fiyatlar</ThemedText>
        {PRICE_CARDS.map((card) => (
          <View key={card.symbol} style={styles.priceRow}>
            <ThemedText style={styles.meta}>{card.label}</ThemedText>
            <ThemedText style={styles.value}>{hasFinitePrice(marketData[card.symbol]) ? formatTry(Number(marketData[card.symbol])) : '-'}</ThemedText>
          </View>
        ))}
      </SectionCard>

      <SectionCard>
        <ThemedText type="subtitle">Yatırım Ekle / Güncelle</ThemedText>
        <FormField label="Varlık (sembol)" value={form.symbol} onChangeText={(v) => setForm((p) => ({ ...p, symbol: v }))} />
        <FormField label={`Varlık tipi (${ASSET_TYPE_OPTIONS.map((a) => a.value).join(', ')})`} value={form.assetType} onChangeText={(v) => setForm((p) => ({ ...p, assetType: v }))} />
        <ThemedText style={styles.label}>Ödeme kaynağı</ThemedText>
        <View style={styles.chips}>
          {PAYMENT_SOURCE_OPTIONS.map((src) => (
            <Pressable key={src.value} style={[styles.chip, form.paymentSource === src.value && styles.chipActive]} onPress={() => setForm((p) => ({
              ...p,
              paymentSource: src.value,
              cardId: isCardPaymentSource(src.value) ? p.cardId : '',
            }))}>
              <ThemedText style={[styles.chipText, form.paymentSource === src.value && styles.chipTextActive]}>{src.label}</ThemedText>
            </Pressable>
          ))}
        </View>
        {isCardPaymentSource(form.paymentSource) ? (
          <View style={styles.chips}>
            {cards.map((card) => (
              <Pressable key={card.id} style={[styles.chip, form.cardId === card.id && styles.chipActive]} onPress={() => setForm((p) => ({ ...p, cardId: card.id }))}>
                <ThemedText style={[styles.chipText, form.cardId === card.id && styles.chipTextActive]}>{card.bankName} ••••{card.last4Digits}</ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}
        <FormField label="Kaynak / platform (isteğe bağlı)" value={form.sourceLabel} onChangeText={(v) => setForm((p) => ({ ...p, sourceLabel: v }))} placeholder="Örn. Binance, Paribu" />
        <FormField label="Miktar" value={form.quantity} onChangeText={(v) => setForm((p) => ({ ...p, quantity: v }))} keyboardType="decimal-pad" />
        <FormField label="Alış Fiyatı (TRY)" value={form.buyPriceTry} onChangeText={(v) => setForm((p) => ({ ...p, buyPriceTry: v }))} keyboardType="decimal-pad" />
        <FormField label="Not" value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} placeholder="Opsiyonel not" />
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={submitting}>
            <ThemedText style={styles.primaryButtonText}>{submitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Yatırım Ekle'}</ThemedText>
          </Pressable>
          {editingId ? (
            <Pressable style={styles.secondaryButton} onPress={resetForm}>
              <ThemedText style={styles.secondaryText}>Düzenlemeyi İptal Et</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard>
        <ThemedText type="subtitle">Portföy Tablosu</ThemedText>
        {loading ? <LoadingState /> : null}
        {!loading && rows.length === 0 ? <EmptyState text="Henüz yatırım kaydı bulunmuyor." /> : null}
        {!loading && rows.map((row) => (
          <View key={row.id} style={styles.item}>
            <ThemedText style={styles.itemTitle}>{SYMBOL_LABELS[row.symbol] || row.symbol}</ThemedText>
            <ThemedText style={styles.meta}>Tip: {row.assetType}</ThemedText>
            <ThemedText style={styles.meta}>Kaynak: {paymentSourceLabel(row.paymentSource)}{row.sourceLabel ? ` • ${row.sourceLabel}` : ''}</ThemedText>
            <ThemedText style={styles.meta}>Miktar: {row.quantity} • Alış: {formatTry(row.buyPriceTry)}</ThemedText>
            <ThemedText style={styles.meta}>Anlık: {row.livePrice != null ? formatTry(row.livePrice) : '-'} • Değer: {row.currentValue != null ? formatTry(row.currentValue) : '-'}</ThemedText>
            <ThemedText style={[styles.meta, row.pnl == null ? undefined : row.pnl >= 0 ? styles.pos : styles.neg]}>
              Kâr/Zarar: {row.pnl != null ? formatTry(row.pnl) : '-'}
            </ThemedText>
            {isDemoInvestment(row) ? (
              <ThemedText style={styles.meta}>Örnek kayıt</ThemedText>
            ) : (
              <View style={styles.actions}>
                <Pressable style={styles.secondaryButton} onPress={() => onEdit(row)}>
                  <ThemedText style={styles.secondaryText}>Düzenle</ThemedText>
                </Pressable>
                <Pressable onPress={() => onDelete(row.id)}>
                  <ThemedText style={styles.deleteText}>Sil</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </SectionCard>
      <SectionCard>
        <ThemedText type="subtitle">Portföy Dağılımı</ThemedText>
        {allocationData.length === 0 ? (
          <EmptyState text="Grafik için yatırım verisi yok." />
        ) : (
          <PieChart
            data={allocationData}
            width={chartWidth}
            height={240}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="8"
            chartConfig={{ color: () => '#f0b90b', labelColor: () => '#848e9c' }}
            absolute
          />
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: { color: ui.danger },
  demoBanner: { color: '#a7f3d0', fontSize: 13 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: ui.border, paddingTop: 8 },
  value: { color: ui.text, fontWeight: '700' },
  label: { color: ui.muted, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: ui.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: ui.pageBg },
  chipActive: { borderColor: ui.brand, backgroundColor: '#252b33' },
  chipText: { color: ui.muted, fontSize: 12 },
  chipTextActive: { color: ui.brandSoft },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryButton: { backgroundColor: ui.brand, borderRadius: 4, paddingVertical: 11, paddingHorizontal: 12 },
  primaryButtonText: { color: ui.pageBg, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: ui.border, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10 },
  secondaryText: { color: ui.text, fontSize: 12, fontWeight: '600' },
  item: { borderTopWidth: 1, borderTopColor: ui.border, paddingTop: 10, gap: 2 },
  itemTitle: { color: ui.text, fontWeight: '700' },
  meta: { color: ui.muted, fontSize: 13 },
  pos: { color: ui.positive },
  neg: { color: ui.danger },
  deleteText: { color: ui.danger, fontWeight: '700' },
});
