export function formatDateDisplay(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('tr-TR');
}

export function startOfTodayLocal() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function parseLocalDateOnly(value?: string | null) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function diffCalendarDays(dueDate: Date, todayStart: Date) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((dueDate.getTime() - todayStart.getTime()) / ms);
}

function computeDueDate(paymentDay: number, baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(Number(paymentDay) || 1, 1), maxDay);
  const currentMonthDue = new Date(year, month, safeDay);
  if (currentMonthDue >= new Date(year, month, baseDate.getDate())) return currentMonthDue;
  const nextMonthMaxDay = new Date(year, month + 2, 0).getDate();
  const nextSafeDay = Math.min(Math.max(Number(paymentDay) || 1, 1), nextMonthMaxDay);
  return new Date(year, month + 1, nextSafeDay);
}

function effectiveDueDate(payment: { next_due_date?: string | null; payment_day: number }) {
  if (payment.next_due_date) {
    const parsed = parseLocalDateOnly(payment.next_due_date);
    if (parsed) return parsed;
  }
  return computeDueDate(payment.payment_day);
}

export function isUpcomingForNotification(payment: {
  is_active: boolean;
  status: string;
  next_due_date?: string | null;
  payment_day: number;
}) {
  if (!payment.is_active || payment.status === 'paid') return false;
  const due = effectiveDueDate(payment);
  const today = startOfTodayLocal();
  const diff = diffCalendarDays(due, today);
  return diff >= 0 && diff <= 7;
}

export function isOverdueForNotification(payment: {
  is_active: boolean;
  status: string;
  next_due_date?: string | null;
  payment_day: number;
}) {
  if (!payment.is_active || payment.status === 'paid') return false;
  const due = effectiveDueDate(payment);
  const today = startOfTodayLocal();
  return diffCalendarDays(due, today) < 0;
}

export function isReminderTime(payment: {
  is_active: boolean;
  status: string;
  next_reminder_at?: string | null;
}) {
  if (!payment.is_active || payment.status === 'paid' || !payment.next_reminder_at) return false;
  const raw = new Date(payment.next_reminder_at);
  if (Number.isNaN(raw.getTime())) return false;
  const reminderDay = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  const today = startOfTodayLocal();
  return reminderDay.getTime() <= today.getTime();
}

export function getDueState(payment: {
  is_active: boolean;
  status: string;
  next_due_date?: string | null;
  payment_day: number;
}) {
  if (!payment.is_active) return { label: 'Pasif', tone: 'muted' as const };
  if (payment.status === 'paid') return { label: 'Planlandı', tone: 'muted' as const };
  const due = effectiveDueDate(payment);
  const today = startOfTodayLocal();
  const diffDays = diffCalendarDays(due, today);
  if (diffDays < 0) return { label: `${Math.abs(diffDays)} gün gecikti`, tone: 'danger' as const };
  if (diffDays <= 7) return { label: `${diffDays} gün kaldı`, tone: 'brand' as const };
  return { label: 'Planlandı', tone: 'muted' as const };
}
