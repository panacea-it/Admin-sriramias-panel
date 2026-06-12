import { filterPaymentsByPeriod, getPeriodRange, startOfDay } from './dailyCollectionUtils'

function installmentDueInRange(inst, start, end) {
  const raw = inst?.dueDate || inst?.emiDate
  if (!raw) return false
  const ts = new Date(raw).getTime()
  if (!Number.isFinite(ts)) return false
  return ts >= start.getTime() && ts <= end.getTime()
}

function installmentRemaining(inst) {
  return Math.max(0, (inst?.emiAmount || 0) - (inst?.paidAmount || 0))
}

/** Pending EMI metrics for a selected daily / weekly / monthly period. */
export function computePendingEmiStats(
  payments = [],
  emiPlans = [],
  { period = 'daily', selectedDate } = {},
  fallback = {},
) {
  const anchor = startOfDay(selectedDate || new Date())
  const { start, end } = getPeriodRange(anchor, period)
  const filteredPayments = filterPaymentsByPeriod(payments, { period, selectedDate: anchor })

  const pendingRevenue = filteredPayments
    .filter((p) => ['Pending', 'Partial', 'Partially Paid', 'Verification Pending'].includes(p.paymentStatus))
    .reduce((sum, p) => sum + (p.pendingAmount || 0), 0)

  let emiAmount = 0
  let overdueAmount = 0

  emiPlans.forEach((plan) => {
    ;(plan.installments || []).forEach((inst) => {
      if (!installmentDueInRange(inst, start, end)) return
      if (!['Due', 'Overdue'].includes(inst.status)) return
      const remaining = installmentRemaining(inst)
      emiAmount += remaining
      if (inst.status === 'Overdue') overdueAmount += remaining
    })
  })

  if (emiAmount === 0) {
    emiAmount = filteredPayments
      .filter((p) => String(p.paymentType || '').toLowerCase().includes('emi'))
      .reduce((sum, p) => sum + (p.pendingAmount || 0), 0)
  }

  if (overdueAmount === 0) {
    overdueAmount = filteredPayments
      .filter((p) => p.paymentStatus === 'Overdue' || p.paymentStatus === 'Failed')
      .reduce((sum, p) => sum + (p.pendingAmount || 0), 0)
  }

  const failedPayments = filteredPayments.filter((p) => p.paymentStatus === 'Failed').length

  const hasActivity =
    filteredPayments.length > 0 ||
    emiPlans.some((plan) => (plan.installments || []).some((inst) => installmentDueInRange(inst, start, end)))

  if (!hasActivity && Object.keys(fallback).length) {
    return {
      pendingRevenue: fallback.pendingRevenue ?? 0,
      emiAmount: fallback.emiAmount ?? fallback.totalDue ?? 0,
      overdueAmount: fallback.overdueAmount ?? 0,
      failedPayments: fallback.failedPayments ?? 0,
    }
  }

  return { pendingRevenue, emiAmount, overdueAmount, failedPayments }
}
