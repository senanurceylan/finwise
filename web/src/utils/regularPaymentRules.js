export function formatDateDisplay(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

export function startOfTodayLocal() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function parseLocalDateOnly(value) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function diffCalendarDays(dueDate, todayStart) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((dueDate.getTime() - todayStart.getTime()) / ms);
}

export function computeDueDate(paymentDay, baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(Number(paymentDay) || 1, 1), maxDay);
  const currentMonthDue = new Date(year, month, safeDay);
  if (currentMonthDue >= new Date(year, month, baseDate.getDate())) {
    return currentMonthDue;
  }
  const nextMonthMaxDay = new Date(year, month + 2, 0).getDate();
  const nextSafeDay = Math.min(Math.max(Number(paymentDay) || 1, 1), nextMonthMaxDay);
  return new Date(year, month + 1, nextSafeDay);
}

export function effectiveDueDate(payment) {
  if (payment.next_due_date) {
    const parsed = parseLocalDateOnly(payment.next_due_date);
    if (parsed) return parsed;
  }
  return computeDueDate(payment.payment_day);
}

export function isUpcomingForNotification(payment) {
  if (!payment.is_active || payment.status === "paid") return false;
  const due = effectiveDueDate(payment);
  const today = startOfTodayLocal();
  const diff = diffCalendarDays(due, today);
  return diff >= 0 && diff <= 7;
}

export function isOverdueForNotification(payment) {
  if (!payment.is_active || payment.status === "paid") return false;
  const due = effectiveDueDate(payment);
  const today = startOfTodayLocal();
  return diffCalendarDays(due, today) < 0;
}

export function isReminderTime(payment) {
  if (!payment.is_active || payment.status === "paid" || !payment.next_reminder_at) return false;
  const raw = new Date(payment.next_reminder_at);
  if (Number.isNaN(raw.getTime())) return false;
  const reminderDay = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  const today = startOfTodayLocal();
  return reminderDay.getTime() <= today.getTime();
}

export function getDueState(payment) {
  if (!payment.is_active) return { label: "Pasif", className: "status-inactive" };
  if (payment.status === "paid") {
    return { label: "Planlandı", className: "status-planned" };
  }
  const due = effectiveDueDate(payment);
  const today = startOfTodayLocal();
  const diffDays = diffCalendarDays(due, today);
  if (diffDays < 0) return { label: `${Math.abs(diffDays)} gün gecikti`, className: "status-overdue" };
  if (diffDays <= 7) return { label: `${diffDays} gün kaldı`, className: "status-upcoming" };
  return { label: "Planlandı", className: "status-planned" };
}
