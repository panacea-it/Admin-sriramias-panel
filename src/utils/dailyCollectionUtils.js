const DAY_MS = 24 * 60 * 60 * 1000

export const COLLECTION_PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function toDateInputValue(date) {
  const d = startOfDay(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateInputValue(value) {
  if (!value) return startOfDay(new Date())
  const [y, m, d] = value.split('-').map(Number)
  return startOfDay(new Date(y, m - 1, d))
}

export function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getWeekRange(date) {
  const anchor = startOfDay(date)
  const weekday = anchor.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const start = new Date(anchor)
  start.setDate(anchor.getDate() + mondayOffset)
  const end = endOfDay(new Date(start.getTime() + 6 * DAY_MS))
  return { start, end }
}

export function getMonthRange(date) {
  const anchor = startOfDay(date)
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const end = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0))
  return { start, end }
}

export function defaultCompareDate(selectedDate, period) {
  const d = startOfDay(selectedDate)
  if (period === 'weekly') {
    d.setDate(d.getDate() - 7)
  } else if (period === 'monthly') {
    d.setMonth(d.getMonth() - 1)
  } else {
    d.setDate(d.getDate() - 1)
  }
  return d
}

function isPaidPayment(payment) {
  return payment?.paymentStatus === 'Paid' || (payment?.amountPaid || 0) > 0
}

function paymentTimestamp(payment) {
  if (!payment?.paymentDate) return null
  const ts = new Date(payment.paymentDate).getTime()
  return Number.isFinite(ts) ? ts : null
}

function sumInRange(payments, start, end) {
  const rows = payments.filter((p) => {
    const ts = paymentTimestamp(p)
    if (ts == null || !isPaidPayment(p)) return false
    return ts >= start.getTime() && ts <= end.getTime()
  })
  return {
    amount: rows.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
    count: rows.length,
  }
}

export function getPeriodRange(date, period) {
  if (period === 'weekly') return getWeekRange(date)
  if (period === 'monthly') return getMonthRange(date)
  const start = startOfDay(date)
  return { start, end: endOfDay(date) }
}

export function formatPeriodLabel(date, period) {
  const { start, end } = getPeriodRange(date, period)
  const fmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (period === 'monthly') {
    return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(start)
  }
  if (period === 'weekly') {
    return `${fmt.format(start)} – ${fmt.format(end)}`
  }
  return fmt.format(start)
}

export function computeCollectionComparison(payments = [], { period = 'daily', selectedDate, compareDate } = {}) {
  const selected = startOfDay(selectedDate || new Date())
  const compare = startOfDay(compareDate || defaultCompareDate(selected, period))
  const primaryRange = getPeriodRange(selected, period)
  const compareRange = getPeriodRange(compare, period)
  const primary = sumInRange(payments, primaryRange.start, primaryRange.end)
  const comparison = sumInRange(payments, compareRange.start, compareRange.end)
  const trendPct =
    comparison.amount > 0
      ? Math.round(((primary.amount - comparison.amount) / comparison.amount) * 100)
      : primary.amount > 0
        ? 100
        : 0

  return {
    period,
    selectedDate: selected,
    compareDate: compare,
    primaryLabel: formatPeriodLabel(selected, period),
    compareLabel: formatPeriodLabel(compare, period),
    primaryAmount: primary.amount,
    primaryCount: primary.count,
    compareAmount: comparison.amount,
    compareCount: comparison.count,
    trendPct,
  }
}

function paymentInRange(payment, start, end) {
  const ts = paymentTimestamp(payment)
  if (ts == null) return false
  return ts >= start.getTime() && ts <= end.getTime()
}

function centerLabel(name = '') {
  return String(name).replace(/\s+Center$/i, '').trim() || name
}

function billedAmount(payment) {
  const fees = Number(payment?.totalFees ?? payment?.totalFee ?? payment?.courseFee ?? 0)
  if (fees > 0) return fees
  return Number(payment?.amountPaid || 0) + Number(payment?.pendingAmount || 0)
}

function paymentCenterName(payment) {
  return payment?.centerName || payment?.branch || ''
}

/** Centre-wise revenue vs collection for a single calendar day. */
export function buildCentreWiseCollection(payments = [], centers = [], date = new Date()) {
  const { start, end } = getPeriodRange(startOfDay(date), 'daily')
  const centerNames = centers.length
    ? centers.map((c) => (typeof c === 'string' ? c : c.centerName)).filter(Boolean)
    : [...new Set(payments.map((p) => paymentCenterName(p)).filter(Boolean))]

  return centerNames.map((centerName) => {
    const centerPayments = payments.filter(
      (p) => paymentCenterName(p) === centerName && paymentInRange(p, start, end),
    )
    const collectionAmount = centerPayments
      .filter(isPaidPayment)
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0)
    const revenueAmount = centerPayments.reduce((sum, p) => sum + billedAmount(p), 0)
    const collectedPct =
      revenueAmount > 0 ? Math.round((collectionAmount / revenueAmount) * 100) : collectionAmount > 0 ? 100 : 0

    return {
      centerName,
      label: centerLabel(centerName),
      revenueAmount,
      collectionAmount,
      collectedPct,
    }
  })
}

export function filterPaymentsByPeriod(payments = [], { period = 'daily', selectedDate } = {}) {
  const { start, end } = getPeriodRange(startOfDay(selectedDate || new Date()), period)
  return payments.filter((p) => paymentInRange(p, start, end))
}

export function buildMiniCalendarDays(viewMonth) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days = []

  for (let i = 0; i < startOffset; i += 1) {
    const d = new Date(year, month, -startOffset + i + 1)
    days.push({ date: d, inMonth: false })
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push({ date: new Date(year, month, day), inMonth: true })
  }

  while (days.length % 7 !== 0) {
    const next = days.length - (startOffset + lastDay.getDate()) + 1
    days.push({ date: new Date(year, month + 1, next), inMonth: false })
  }

  return days
}
