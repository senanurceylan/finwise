import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { formatDateDisplay, getDueState, isOverdueForNotification, isReminderTime, isUpcomingForNotification } from '@/utils/regularPaymentRules';

type RegularPayment = {
  id: string;
  title: string;
  category: string;
  amount: number;
  payment_day: number;
  reminder_days_before: number;
  status: string;
  last_paid_at?: string | null;
  next_due_date?: string | null;
  next_reminder_at?: string | null;
  is_active: boolean;
  payment_source?: string;
  card?: { bankName: string; last4Digits: string } | null;
};
type Card = { id: string; bankName: string; last4Digits: string };

const CATEGORY_OPTIONS = ['Abonelik', 'Kira', 'Fatura', 'Ulaşım', 'Teknolojik Alet', 'Diğer'];

export default function RegularPaymentsScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<RegularPayment[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState('1');
  const [paymentSource, setPaymentSource] = useState('automatic_payment');
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [data, cardData] = await Promise.all([
        api.get<RegularPayment[]>('/regular-payments'),
        api.get<Card[]>('/cards').catch(() => []),
      ]);
      setPayments(Array.isArray(data) ? data : []);
      setCards(Array.isArray(cardData) ? cardData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Düzenli ödemeler yüklenemedi.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const notifications = useMemo(() => ({
    dueSoon: payments.filter(isUpcomingForNotification),
    overdue: payments.filter(isOverdueForNotification),
    reminderDue: payments.filter(isReminderTime),
  }), [payments]);

  const handleSubmit = async () => {
    setError('');
    setFieldErrors({});
    const parsedAmount = Number(amount);
    const parsedPaymentDay = Number(paymentDay);
    const parsedReminder = Number(reminderDaysBefore);
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Ödeme adı zorunludur.';
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = 'Tutar 0\'dan büyük olmalı.';
    if (!Number.isInteger(parsedPaymentDay) || parsedPaymentDay < 1 || parsedPaymentDay > 31) nextErrors.paymentDay = 'Ödeme günü 1 ile 31 arasında olmalı.';
    if (!Number.isInteger(parsedReminder) || parsedReminder < 0 || parsedReminder > 31) nextErrors.reminderDaysBefore = 'Hatırlatma günü 0 ile 31 arasında olmalı.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    if (!user?.id) {
      setError('Kullanıcı bilgisi bulunamadı. Lütfen yeniden giriş yapın.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/regular-payments', {
        user_id: user.id,
        title: title.trim(),
        category,
        amount: Number(parsedAmount.toFixed(2)),
        payment_day: parsedPaymentDay,
        reminder_days_before: parsedReminder,
        paymentSource,
        ...(cardId ? { cardId } : {}),
      });
      setTitle('');
      setCategory(CATEGORY_OPTIONS[0]);
      setAmount('');
      setPaymentDay('');
      setReminderDaysBefore('1');
      setPaymentSource('automatic_payment');
      setCardId('');
      await fetchPayments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Düzenli ödeme eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (id: string) => {
    try {
      setError('');
      await api.patch(`/regular-payments/${id}/mark-paid`, {});
      await fetchPayments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ödeme durumu güncellenemedi.');
    }
  };

  const deletePayment = async (id: string) => {
    try {
      setError('');
      await api.delete(`/regular-payments/${id}`);
      await fetchPayments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Düzenli ödeme silinemedi.');
    }
  };

  return (
    <ScreenContainer>
      <SectionCard>
        <ThemedText type="subtitle">Düzenli Ödeme Ekle</ThemedText>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <FormField label="Ödeme Adı" value={title} onChangeText={setTitle} placeholder="Spotify, Kira..." error={fieldErrors.title} />
        <FormField label={`Kategori (${CATEGORY_OPTIONS.join(', ')})`} value={category} onChangeText={setCategory} />
        <FormField label="Tutar" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" error={fieldErrors.amount} />
        <FormField label="Ödeme Günü" value={paymentDay} onChangeText={setPaymentDay} keyboardType="number-pad" placeholder="1-31" error={fieldErrors.paymentDay} />
        <FormField label="Hatırlatma (Gün)" value={reminderDaysBefore} onChangeText={setReminderDaysBefore} keyboardType="number-pad" error={fieldErrors.reminderDaysBefore} />
        <ThemedText style={styles.label}>Ödeme kaynağı</ThemedText>
        <View style={styles.chips}>
          {PAYMENT_SOURCE_OPTIONS.map((src) => (
            <Pressable key={src.value} style={[styles.chip, paymentSource === src.value && styles.chipActive]} onPress={() => {
              setPaymentSource(src.value);
              if (!isCardPaymentSource(src.value)) setCardId('');
            }}>
              <ThemedText style={[styles.chipText, paymentSource === src.value && styles.chipTextActive]}>{src.label}</ThemedText>
            </Pressable>
          ))}
        </View>
        {isCardPaymentSource(paymentSource) ? (
          <View style={styles.chips}>
            {cards.map((card) => (
              <Pressable key={card.id} style={[styles.chip, cardId === card.id && styles.chipActive]} onPress={() => setCardId(card.id)}>
                <ThemedText style={[styles.chipText, cardId === card.id && styles.chipTextActive]}>
                  {card.bankName} ••••{card.last4Digits}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
          <ThemedText style={styles.primaryButtonText}>{submitting ? 'Kaydediliyor...' : 'Düzenli Ödeme Kaydet'}</ThemedText>
        </Pressable>
      </SectionCard>

      <SectionCard>
        <ThemedText type="subtitle">Bildirim Paneli</ThemedText>
        <ThemedText style={styles.groupTitle}>Yaklaşan Ödemeler ({notifications.dueSoon.length})</ThemedText>
        {notifications.dueSoon.length === 0 ? <EmptyState text="Yaklaşan ödeme yok." /> : notifications.dueSoon.map((item) => (
          <ThemedText key={item.id} style={styles.line}>• {item.title} - son tarih {formatDateDisplay(item.next_due_date)}</ThemedText>
        ))}
        <ThemedText style={styles.groupTitle}>Geciken Ödemeler ({notifications.overdue.length})</ThemedText>
        {notifications.overdue.length === 0 ? <EmptyState text="Geciken ödeme yok." /> : notifications.overdue.map((item) => (
          <ThemedText key={item.id} style={styles.line}>• {item.title} - son tarih {formatDateDisplay(item.next_due_date)}</ThemedText>
        ))}
        <ThemedText style={styles.groupTitle}>Hatırlatma zamanı ({notifications.reminderDue.length})</ThemedText>
        {notifications.reminderDue.length === 0 ? <EmptyState text="Hatırlatma bekleyen yok." /> : notifications.reminderDue.map((item) => (
          <ThemedText key={item.id} style={styles.line}>• {item.title} - hatırlatma {formatDateDisplay(item.next_reminder_at || null)}</ThemedText>
        ))}
      </SectionCard>

      <SectionCard>
        <ThemedText type="subtitle">Düzenli Ödemeler</ThemedText>
        {loading ? <LoadingState /> : null}
        {!loading && payments.length === 0 ? <EmptyState text="Henüz düzenli ödeme yok." /> : null}
        {!loading && payments.map((payment) => {
          const dueState = getDueState(payment);
          return (
            <View key={payment.id} style={styles.item}>
              <ThemedText style={styles.itemTitle}>{payment.title}</ThemedText>
              <ThemedText style={styles.meta}>{payment.category} • {payment.amount.toFixed(2)} TL</ThemedText>
              <ThemedText style={styles.meta}>Ödeme kaynağı: {paymentSourceLabel(payment.payment_source)}</ThemedText>
              <ThemedText style={styles.meta}>Ödeme günü: {payment.payment_day} • Hatırlatma: {payment.reminder_days_before} gün</ThemedText>
              <ThemedText style={styles.meta}>Son ödeme: {formatDateDisplay(payment.last_paid_at || null)} • Sonraki vade: {formatDateDisplay(payment.next_due_date || null)}</ThemedText>
              <ThemedText style={[styles.meta, dueState.tone === 'danger' ? styles.danger : dueState.tone === 'brand' ? styles.brand : undefined]}>
                {dueState.label}
              </ThemedText>
              <View style={styles.actions}>
                <Pressable style={styles.secondaryButton} onPress={() => markPaid(payment.id)} disabled={payment.status === 'paid'}>
                  <ThemedText style={styles.secondaryText}>{payment.status === 'paid' ? 'Ödendi' : 'Ödendi İşaretle'}</ThemedText>
                </Pressable>
                <Pressable onPress={() => deletePayment(payment.id)}>
                  <ThemedText style={styles.deleteText}>Sil</ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: { color: ui.danger },
  label: { color: ui.muted, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: ui.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: ui.pageBg },
  chipActive: { borderColor: ui.brand, backgroundColor: '#252b33' },
  chipText: { color: ui.muted, fontSize: 12 },
  chipTextActive: { color: ui.brandSoft },
  primaryButton: { backgroundColor: ui.brand, borderRadius: 4, alignItems: 'center', paddingVertical: 12 },
  primaryButtonText: { color: ui.pageBg, fontWeight: '700' },
  groupTitle: { color: ui.brand, fontWeight: '600', marginTop: 4 },
  line: { color: ui.text, fontSize: 13 },
  item: { borderTopWidth: 1, borderTopColor: ui.border, paddingTop: 10, gap: 2 },
  itemTitle: { color: ui.text, fontWeight: '700' },
  meta: { color: ui.muted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 6 },
  secondaryButton: { borderWidth: 1, borderColor: ui.border, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10 },
  secondaryText: { color: ui.text, fontSize: 12, fontWeight: '600' },
  deleteText: { color: ui.danger, fontWeight: '700' },
  danger: { color: ui.danger },
  brand: { color: ui.brand },
});
