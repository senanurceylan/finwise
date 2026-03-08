import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  useColorScheme,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

// Mock data for demo
const MOCK_BALANCE = 12450.75;
const MOCK_TRANSACTIONS = [
  { id: '1', title: 'Grocery Store', amount: -85.32, date: 'Today', type: 'expense' },
  { id: '2', title: 'Salary Deposit', amount: 3200.0, date: 'Yesterday', type: 'income' },
  { id: '3', title: 'Netflix', amount: -15.99, date: 'Mar 4', type: 'expense' },
  { id: '4', title: 'Coffee Shop', amount: -6.50, date: 'Mar 3', type: 'expense' },
  { id: '5', title: 'Freelance Payment', amount: 450.0, date: 'Mar 2', type: 'income' },
];
const MOCK_INVESTMENTS = [
  { name: 'Stocks', value: 8420, change: 2.4 },
  { name: 'Savings', value: 3200, change: 0.5 },
  { name: 'Crypto', value: 1830.75, change: -1.2 },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const tint = colors.tint;

  const cardBg = colorScheme === 'dark' ? '#1E2328' : '#F5F6F8';
  const cardBorder = colorScheme === 'dark' ? '#2A2F36' : '#E8EAED';

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - App title */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.appTitle}>
            FinWise
          </ThemedText>
          <ThemedText style={styles.subtitle}>Your financial overview</ThemedText>
        </View>

        {/* Total balance card */}
        <View style={[styles.card, styles.balanceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={styles.balanceLabel}>Total Balance</ThemedText>
          <ThemedText style={styles.balanceAmount}>
            ${MOCK_BALANCE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </ThemedText>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {}}
          >
            <IconSymbol name="plus.circle.fill" size={22} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Add expense</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionButtonSecondary,
              { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {}}
          >
            <IconSymbol name="square.and.arrow.up" size={22} color={tint} />
            <ThemedText style={[styles.actionButtonText, { color: tint }]}>Upload statement</ThemedText>
          </Pressable>
        </View>

        {/* Recent transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Recent transactions</ThemedText>
          </View>
          <View style={[styles.card, styles.listCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {MOCK_TRANSACTIONS.map((tx) => (
              <View key={tx.id} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: tx.amount < 0 ? '#FEE2E2' : '#D1FAE5' }]}>
                    <IconSymbol
                      name={tx.amount < 0 ? 'arrow.down.right' : 'arrow.up.right'}
                      size={18}
                      color={tx.amount < 0 ? '#DC2626' : '#059669'}
                    />
                  </View>
                  <View>
                    <ThemedText style={styles.transactionTitle}>{tx.title}</ThemedText>
                    <ThemedText style={styles.transactionDate}>{tx.date}</ThemedText>
                  </View>
                </View>
                <ThemedText
                  style={[
                    styles.transactionAmount,
                    { color: tx.amount >= 0 ? '#059669' : '#DC2626' },
                  ]}
                >
                  {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Investment summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Investment summary</ThemedText>
          </View>
          <View style={[styles.card, styles.investmentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {MOCK_INVESTMENTS.map((inv, index) => (
              <View
                key={inv.name}
                style={[
                  styles.investmentRow,
                  index < MOCK_INVESTMENTS.length - 1 && styles.investmentRowBorder,
                  { borderColor: cardBorder },
                ]}
              >
                <View style={styles.investmentLeft}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={tint} />
                  <ThemedText style={styles.investmentName}>{inv.name}</ThemedText>
                </View>
                <View style={styles.investmentRight}>
                  <ThemedText style={styles.investmentValue}>
                    ${inv.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.investmentChange,
                      { color: inv.change >= 0 ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {inv.change >= 0 ? '+' : ''}{inv.change}%
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
  },
  header: {
    marginBottom: 4,
  },
  appTitle: {
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  balanceCard: {
    paddingVertical: 24,
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    paddingLeft: 4,
  },
  listCard: {
    paddingVertical: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  investmentCard: {
    paddingVertical: 8,
  },
  investmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  investmentRowBorder: {
    borderBottomWidth: 1,
  },
  investmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  investmentRight: {
    alignItems: 'flex-end',
  },
  investmentValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  investmentChange: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
});
