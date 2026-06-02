import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { useUi } from '@/components/common/ui';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';

type PickedFile = {
  name: string;
  uri: string;
  mimeType: string;
};

type TopExpense = {
  id?: string;
  date?: string | null;
  description?: string;
  amount?: number | null;
  category?: string;
};

type CategorySummaryItem = {
  category?: string;
  count?: number;
  total?: number | null;
};

type AnalysisData = {
  periodDebt?: number | null;
  minimumPayment?: number | null;
  dueDate?: string | null;
  totalSpending?: number | null;
  top3Expenses?: TopExpense[];
  categorySummary?: CategorySummaryItem[];
  extractedTextPreview?: string;
};

export default function StatementAnalysisScreen() {
  const ui = useUi();
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const formatTry = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '—';
    return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
  };

  const categoryRows = [...(analysis?.categorySummary || [])]
    .map((item) => ({
      category: item.category || 'Diğer',
      count: item.count || 0,
      total: typeof item.total === 'number' ? item.total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const categoryBaseTotal =
    typeof analysis?.totalSpending === 'number' && analysis.totalSpending > 0
      ? analysis.totalSpending
      : categoryRows.reduce((sum, row) => sum + row.total, 0);

  const pickPdf = async () => {
    setError('');
    setRawText('');
    setAnalysis(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets?.[0];
      if (!file) {
        setError('PDF dosyası seçilemedi. Lütfen tekrar deneyin.');
        return;
      }

      setSelectedFile({
        name: file.name || 'statement.pdf',
        uri: file.uri,
        mimeType: file.mimeType || 'application/pdf',
      });
    } catch {
      setError('Dosya seçimi sırasında bir hata oluştu.');
    }
  };

  const readPdf = async () => {
    setError('');
    setRawText('');
    setAnalysis(null);
    if (!selectedFile) {
      setError('Lütfen önce bir PDF dosyası seçin.');
      return;
    }
    if (!token) {
      setError('Analiz için oturum açmanız gerekiyor.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blobResponse = await fetch(selectedFile.uri);
        const blob = await blobResponse.blob();
        const webFile = new File([blob], selectedFile.name || 'statement.pdf', {
          type: selectedFile.mimeType || 'application/pdf',
        });
        formData.append('pdf', webFile);
      } else {
        const fileObject = {
          uri: selectedFile.uri,
          name: selectedFile.name || 'statement.pdf',
          type: selectedFile.mimeType || 'application/pdf',
        };
        formData.append('pdf', fileObject as any);
      }

      const response = await fetch(`${API_BASE_URL}/statement/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof json?.error === 'string' && json.error.trim()
            ? json.error
            : 'PDF analizi başarısız oldu. Lütfen dosyayı kontrol edip tekrar deneyin.';
        throw new Error(message);
      }

      const data = json?.data as AnalysisData | undefined;
      if (!data) {
        throw new Error('Analiz sonucu alınamadı.');
      }
      setAnalysis(data);
      if (typeof data.extractedTextPreview === 'string' && data.extractedTextPreview.trim()) {
        setRawText(data.extractedTextPreview);
      } else {
        setError('Backend yanıtında ham metin bulunamadı.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analiz sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <ThemedText type="title">Ekstre Analizi</ThemedText>
        <ThemedText style={[styles.subtitle, { color: ui.muted }]}>PDF seçimi (ilk aşama)</ThemedText>
      </View>

      <SectionCard>
        <ThemedText style={[styles.label, { color: ui.muted }]}>PDF dosyası yükle</ThemedText>
        <Pressable style={[styles.primaryButton, { backgroundColor: ui.brand }]} onPress={pickPdf}>
          <ThemedText style={[styles.primaryButtonText, { color: ui.pageBg }]}>PDF Seç</ThemedText>
        </Pressable>

        <View style={[styles.fileInfo, { borderTopColor: ui.border }]}>
          <ThemedText style={[styles.fileLabel, { color: ui.muted }]}>Seçilen dosya:</ThemedText>
          <ThemedText style={[styles.fileName, { color: ui.text }]}>
            {selectedFile?.name || 'Henüz dosya seçilmedi.'}
          </ThemedText>
          {selectedFile ? (
            <View style={styles.debugBox}>
              <ThemedText style={[styles.debugText, { color: ui.muted }]}>uri: {selectedFile.uri}</ThemedText>
              <ThemedText style={[styles.debugText, { color: ui.muted }]}>name: {selectedFile.name}</ThemedText>
              <ThemedText style={[styles.debugText, { color: ui.muted }]}>
                mimeType: {selectedFile.mimeType}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[styles.primaryButton, styles.analyzeButton, { backgroundColor: ui.brand }]}
          onPress={readPdf}
          disabled={loading}>
          <ThemedText style={[styles.primaryButtonText, { color: ui.pageBg }]}>
            {loading ? "PDF okunuyor..." : "PDF'i Oku"}
          </ThemedText>
        </Pressable>

        {error ? <ThemedText style={[styles.errorText, { color: ui.danger }]}>{error}</ThemedText> : null}
      </SectionCard>

      {analysis ? (
        <SectionCard>
          <ThemedText type="subtitle">Analiz Özeti</ThemedText>
          <View style={styles.summaryBlock}>
            <ThemedText style={[styles.summaryItem, { color: ui.text }]}>
              Dönem Borcu: {formatTry(analysis.periodDebt)}
            </ThemedText>
            <ThemedText style={[styles.summaryItem, { color: ui.text }]}>
              Asgari Ödeme: {formatTry(analysis.minimumPayment)}
            </ThemedText>
            <ThemedText style={[styles.summaryItem, { color: ui.text }]}>
              Son Ödeme Tarihi: {analysis.dueDate || '—'}
            </ThemedText>
            <ThemedText style={[styles.summaryItem, { color: ui.text }]}>
              Harcamalar Toplamı: {formatTry(analysis.totalSpending)}
            </ThemedText>
          </View>

          <View style={[styles.subCard, { borderColor: ui.border, backgroundColor: ui.pageBg }]}>
            <ThemedText style={[styles.subCardTitle, { color: ui.text }]}>En Yüksek 3 Harcama</ThemedText>
            {!analysis.top3Expenses || analysis.top3Expenses.length === 0 ? (
              <ThemedText style={[styles.infoText, { color: ui.muted }]}>Kayıt bulunamadı.</ThemedText>
            ) : (
              analysis.top3Expenses.map((item, idx) => (
                <View key={item.id || `top-${idx}`} style={styles.listItem}>
                  <ThemedText style={[styles.listMain, { color: ui.text }]}>
                    {idx + 1}. {item.description || 'Açıklama yok'}
                  </ThemedText>
                  <ThemedText style={[styles.listMeta, { color: ui.muted }]}>
                    {item.date || '—'} • {item.category || 'Diğer'} • {formatTry(item.amount)}
                  </ThemedText>
                </View>
              ))
            )}
          </View>

          <View style={[styles.subCard, { borderColor: ui.border, backgroundColor: ui.pageBg }]}>
            <ThemedText style={[styles.subCardTitle, { color: ui.text }]}>Kategori Özeti</ThemedText>
            {categoryRows.length === 0 ? (
              <ThemedText style={[styles.infoText, { color: ui.muted }]}>Kayıt bulunamadı.</ThemedText>
            ) : (
              categoryRows.map((item, idx) => {
                const ratio = categoryBaseTotal > 0 ? item.total / categoryBaseTotal : 0;
                const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
                return (
                  <View key={`${item.category}-${idx}`} style={styles.categoryRow}>
                    <View style={styles.categoryTopLine}>
                      <ThemedText style={[styles.categoryName, { color: ui.text }]}>{item.category}</ThemedText>
                      <ThemedText style={[styles.categoryMeta, { color: ui.muted }]}>
                        {item.count} işlem • {formatTry(item.total)} • %{percent}
                      </ThemedText>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: ui.border }]}>
                      <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: ui.brand }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </SectionCard>
      ) : null}

      {rawText ? (
        <SectionCard>
          <ThemedText type="subtitle">Ham PDF Metni</ThemedText>
          <View style={[styles.rawTextBox, { borderColor: ui.border, backgroundColor: ui.pageBg }]}>
            <ScrollView nestedScrollEnabled>
              <ThemedText style={[styles.rawText, { color: ui.text }]}>{rawText}</ThemedText>
            </ScrollView>
          </View>
        </SectionCard>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    gap: 4,
  },
  subtitle: {
    
  },
  label: {
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  fileInfo: {
    gap: 4,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  fileLabel: {
    fontSize: 13,
  },
  fileName: {
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
  },
  infoText: {
    fontSize: 13,
  },
  analyzeButton: {
    marginTop: 4,
  },
  debugBox: {
    marginTop: 6,
    gap: 2,
  },
  debugText: {
    fontSize: 11,
    lineHeight: 15,
  },
  rawTextBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 220,
    maxHeight: 320,
  },
  rawText: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryBlock: {
    gap: 4,
  },
  summaryItem: {
    fontSize: 13,
  },
  subCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 6,
  },
  subCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  listItem: {
    gap: 2,
  },
  listMain: {
    fontSize: 13,
    fontWeight: '600',
  },
  listMeta: {
    fontSize: 12,
  },
  categoryRow: {
    gap: 6,
    marginBottom: 8,
  },
  categoryTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  categoryMeta: {
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
