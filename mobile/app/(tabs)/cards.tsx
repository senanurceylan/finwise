import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { FormField } from '@/components/common/FormField';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { ui } from '@/components/common/ui';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/lib/api';

type Card = {
  id: string;
  cardName: string;
  bankName: string;
  cardType: string;
  last4Digits: string;
};

const CARD_TYPES = [
  { value: 'credit', label: 'Kredi kartı' },
  { value: 'debit', label: 'Banka kartı' },
  { value: 'commercial', label: 'Ticari kart' },
];

export default function CardsScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    cardName: '',
    bankName: '',
    cardType: 'debit',
    last4Digits: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Card[]>('/cards');
      setCards(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kartlar yüklenemedi.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({ cardName: '', bankName: '', cardType: 'debit', last4Digits: '' });
    setEditingId('');
  };

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        cardName: form.cardName.trim(),
        bankName: form.bankName.trim(),
        cardType: form.cardType,
        last4Digits: form.last4Digits.trim(),
      };
      if (editingId) await api.put(`/cards/${editingId}`, payload);
      else await api.post('/cards', payload);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız.');
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (c: Card) => {
    setEditingId(c.id);
    setForm({
      cardName: c.cardName,
      bankName: c.bankName,
      cardType: c.cardType,
      last4Digits: c.last4Digits,
    });
  };

  const onDelete = async (id: string) => {
    try {
      await api.delete(`/cards/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi.');
    }
  };

  return (
    <ScreenContainer>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <SectionCard>
        <ThemedText type="subtitle">{editingId ? 'Kartı güncelle' : 'Kart ekle (isteğe bağlı)'}</ThemedText>
        <ThemedText style={styles.hint}>Kartlar yalnızca harcama / ödeme formlarında isteğe bağlı seçim için kullanılır.</ThemedText>
        <FormField label="Banka" value={form.bankName} onChangeText={(v) => setForm((f) => ({ ...f, bankName: v }))} />
        <FormField label="Kart adı" value={form.cardName} onChangeText={(v) => setForm((f) => ({ ...f, cardName: v }))} placeholder="Örn. Ziraat Bonus" />
        <FormField label={`Kart tipi (${CARD_TYPES.map((t) => t.value).join(', ')})`} value={form.cardType} onChangeText={(v) => setForm((f) => ({ ...f, cardType: v }))} />
        <FormField
          label="Son 4 hane"
          value={form.last4Digits}
          onChangeText={(v) => setForm((f) => ({ ...f, last4Digits: v.replace(/\D/g, '').slice(0, 4) }))}
          keyboardType="number-pad"
        />
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={submitting}>
            <ThemedText style={styles.primaryText}>{submitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kart kaydet'}</ThemedText>
          </Pressable>
          {editingId ? (
            <Pressable style={styles.secondaryButton} onPress={resetForm}>
              <ThemedText style={styles.secondaryText}>İptal</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard>
        <ThemedText type="subtitle">Kayıtlı kartlar</ThemedText>
        {loading ? <LoadingState /> : null}
        {!loading && cards.length === 0 ? <EmptyState text="Henüz kart eklenmemiş." /> : null}
        {!loading && cards.map((c) => (
          <View key={c.id} style={styles.item}>
            <ThemedText style={styles.itemTitle}>{c.bankName} • {c.cardName}</ThemedText>
            <ThemedText style={styles.meta}>{CARD_TYPES.find((t) => t.value === c.cardType)?.label || c.cardType} ••••{c.last4Digits}</ThemedText>
            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={() => onEdit(c)}>
                <ThemedText style={styles.secondaryText}>Düzenle</ThemedText>
              </Pressable>
              <Pressable onPress={() => onDelete(c.id)}>
                <ThemedText style={styles.deleteText}>Sil</ThemedText>
              </Pressable>
            </View>
          </View>
        ))}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: { color: ui.danger },
  hint: { color: ui.muted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primaryButton: { backgroundColor: ui.brand, borderRadius: 4, paddingVertical: 11, paddingHorizontal: 12 },
  primaryText: { color: ui.pageBg, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: ui.border, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10 },
  secondaryText: { color: ui.text, fontSize: 12, fontWeight: '600' },
  item: { borderTopWidth: 1, borderTopColor: ui.border, paddingTop: 10, gap: 6 },
  itemTitle: { color: ui.text, fontWeight: '700' },
  meta: { color: ui.muted, fontSize: 13 },
  deleteText: { color: ui.danger, fontWeight: '700' },
});
