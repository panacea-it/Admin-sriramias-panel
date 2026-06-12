import { addMonthsToDate, getEmiMonthLabel } from './emiSchedule'
import { EMI_OVERDUE_SEVERITY, EMI_SCHEDULE_FREQUENCIES } from '../constants/emiManagement'

const MS_PER_DAY = 86400000

export function daysBetween(a, b = new Date()) {
  const start = new Date(a)
  const end = new Date(b)
  if (Number.isNaN(start.getTime())) return 0
  return Math.max(0, Math.floor((end - start) / MS_PER_DAY))
}

export function getOverdueSeverity(overdueDays) {
  const d = Number(overdueDays) || 0
  if (d <= 0) return null
  if (d <= EMI_OVERDUE_SEVERITY.mild.maxDays) return EMI_OVERDUE_SEVERITY.mild
  if (d <= EMI_OVERDUE_SEVERITY.moderate.maxDays) return EMI_OVERDUE_SEVERITY.moderate
  return EMI_OVERDUE_SEVERITY.critical
}

export function getNextDueInstallment(plan) {
  const open = (plan?.installments || [])
    .filter((i) => !['Paid', 'Closed', 'Cancelled'].includes(i.status))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
  return open[0] || null
}

export function computeInstallmentOverdueDays(installment, today = new Date().toISOString().slice(0, 10)) {
  if (!installment?.dueDate) return 0
  if (['Paid', 'Closed'].includes(installment.status)) return 0
  if (installment.dueDate >= today) return 0
  return daysBetween(installment.dueDate, today)
}

/** Enrich raw plan with derived fields for tables and filters */
export function enrichEmiPlan(plan, today = new Date().toISOString().slice(0, 10)) {
  const installments = (plan.installments || []).map((inst) => {
    const overdueDays = computeInstallmentOverdueDays(inst, today)
    let status = inst.status
    if (status !== 'Paid' && status !== 'Closed' && inst.dueDate && inst.dueDate < today) {
      status = 'Overdue'
    }
    return { ...inst, status, overdueDays }
  })

  const nextInst = getNextDueInstallment({ installments })
  const maxOverdue = installments.reduce((m, i) => Math.max(m, i.overdueDays || 0), 0)
  const severity = getOverdueSeverity(maxOverdue)
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekEndIso = weekEnd.toISOString().slice(0, 10)
  const dueThisWeek =
    nextInst?.dueDate && nextInst.dueDate >= today && nextInst.dueDate <= weekEndIso

  const paidCount = installments.filter((i) => i.status === 'Paid').length
  const collectionRate = installments.length
    ? Math.round((paidCount / installments.length) * 100)
    : 0

  return {
    ...plan,
    status: plan.planStatus || plan.status || 'EMI Running',
    installments,
    nextDueDate: nextInst?.dueDate || plan.nextDueDate || '',
    nextEmiAmount: nextInst?.emiAmount || 0,
    overdueDays: maxOverdue,
    overdueSeverity: severity?.id || null,
    dueThisWeek: Boolean(dueThisWeek),
    collectionRate,
    emiAmount: nextInst?.emiAmount || installments[0]?.emiAmount || 0,
    counselorName: plan.counselorName || plan.counselor?.name || '—',
    loanProvider: plan.loanProvider || 'Institute EMI',
    suspensionStatus: plan.suspensionStatus || 'Active',
    emiStatus: plan.settlementStatus || plan.planStatus || plan.status || 'EMI Running',
  }
}

export function enrichEmiPlans(plans = []) {
  return plans.map((p) => enrichEmiPlan(p))
}

export function computeEmiDashboardSummary(plans = []) {
  const enriched = enrichEmiPlans(plans)
  const today = new Date().toISOString().slice(0, 10)
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)

  let activeEmis = 0
  let overdueEmis = 0
  let pendingAmount = 0
  let upcomingDueWeek = 0
  let settledAccounts = 0
  let foreclosureRequests = 0
  let suspendedStudents = 0
  let totalInstallments = 0
  let paidInstallments = 0
  let overdueAmount = 0

  const providerMap = {}

  for (const plan of enriched) {
    if ((plan.pendingAmount || 0) > 0 && plan.status !== 'EMI Completed') activeEmis += 1
    if ((plan.pendingAmount || 0) <= 0 || plan.status === 'EMI Completed') settledAccounts += 1
    if (plan.settlementStatus === 'Settlement Requested' || plan.foreclosureRequested) {
      foreclosureRequests += 1
    }
    if (plan.suspensionStatus === 'Suspended') suspendedStudents += 1
    pendingAmount += plan.pendingAmount || 0

    if (plan.dueThisWeek) upcomingDueWeek += 1
    if (plan.overdueDays > 0) overdueEmis += 1
    overdueAmount += plan.overdueAmount || 0

    const provider = plan.loanProvider || 'Other'
    if (!providerMap[provider]) {
      providerMap[provider] = { provider, active: 0, overdue: 0, pending: 0 }
    }
    providerMap[provider].active += 1
    providerMap[provider].pending += plan.pendingAmount || 0
    if (plan.overdueDays > 0) providerMap[provider].overdue += 1

    for (const inst of plan.installments || []) {
      totalInstallments += 1
      if (inst.status === 'Paid') paidInstallments += 1
      if (inst.status === 'Overdue') overdueAmount += inst.emiAmount || 0
    }
  }

  const duePercentage =
    totalInstallments > 0
      ? Math.round(
          ((enriched.flatMap((p) => p.installments).filter((i) => i.status === 'Due' || i.status === 'Overdue').length) /
            totalInstallments) *
            100,
        )
      : 0

  const collectionRate =
    totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0

  const overdueTrend = enriched
    .filter((p) => p.overdueDays > 0)
    .slice(0, 5)
    .map((p) => ({ label: p.studentName?.split(' ')[0] || p.studentId, days: p.overdueDays }))

  const counselorWorkload = {}
  for (const plan of enriched) {
    const id = plan.counselorId || 'unassigned'
    if (!counselorWorkload[id]) {
      counselorWorkload[id] = {
        counselorId: id,
        counselorName: plan.counselorName || 'Unassigned',
        assigned: 0,
        pendingEmis: 0,
        overdue: 0,
        lastContact: plan.callLogs?.[0]?.scheduledAt || '',
      }
    }
    counselorWorkload[id].assigned += 1
    counselorWorkload[id].pendingEmis += (plan.installments || []).filter(
      (i) => !['Paid', 'Closed'].includes(i.status),
    ).length
    if (plan.overdueDays > 0) counselorWorkload[id].overdue += 1
  }

  return {
    totalStudents: enriched.length,
    activeEmis,
    overdueEmis,
    pendingAmount,
    upcomingDueWeek,
    settledAccounts,
    foreclosureRequests,
    suspendedStudents,
    duePercentage,
    collectionRate,
    overdueTrend,
    providerAnalytics: Object.values(providerMap),
    counselorWorkload: Object.values(counselorWorkload),
    overdueAmount,
  }
}

/**
 * Generate amortized EMI schedule with principal / interest split.
 */
export function generateLoanEmiSchedule({
  totalCourseFee = 0,
  downPayment = 0,
  loanAmount,
  interestRateAnnual = 0,
  emiDuration = 6,
  startDate,
  frequency = 'monthly',
  customMonthsStep = 1,
}) {
  const principal =
    loanAmount != null ? Number(loanAmount) : Math.max(0, Number(totalCourseFee) - Number(downPayment))
  const count = Math.max(1, Math.min(60, Number(emiDuration) || 1))
  const freq =
    EMI_SCHEDULE_FREQUENCIES.find((f) => f.id === frequency) ||
    EMI_SCHEDULE_FREQUENCIES[0]
  const monthsStep = frequency === 'custom' ? Math.max(1, Number(customMonthsStep) || 1) : freq.monthsStep
  const start = startDate || new Date().toISOString().slice(0, 10)
  const monthlyRate = (Number(interestRateAnnual) || 0) / 12 / 100

  let emiAmount
  if (monthlyRate > 0) {
    const factor = (1 + monthlyRate) ** count
    emiAmount = Math.round((principal * monthlyRate * factor) / (factor - 1))
  } else {
    emiAmount = Math.ceil(principal / count)
  }

  const installments = []
  let balance = principal
  const today = new Date().toISOString().slice(0, 10)

  for (let i = 0; i < count; i += 1) {
    const dueDate = addMonthsToDate(start, i * monthsStep)
    const interestAmount = monthlyRate > 0 ? Math.round(balance * monthlyRate) : 0
    let principalAmount = emiAmount - interestAmount
    if (i === count - 1) principalAmount = balance
    const totalPayable = principalAmount + interestAmount
    balance = Math.max(0, balance - principalAmount)

    let status = 'Scheduled'
    if (dueDate < today) status = 'Overdue'
    else if (dueDate === today) status = 'Due'

    installments.push({
      installmentNo: i + 1,
      emiNo: i + 1,
      emiMonth: getEmiMonthLabel(dueDate),
      dueDate,
      emiDate: dueDate,
      principalAmount,
      interestAmount,
      emiAmount: totalPayable,
      totalPayable,
      remainingBalance: balance,
      status,
      paidAmount: 0,
      paymentHistory: [],
    })
  }

  return {
    installments,
    totalEmiAmount: principal,
    totalInterest: installments.reduce((s, r) => s + r.interestAmount, 0),
    downPayment: Number(downPayment) || 0,
    loanAmount: principal,
    startDate: start,
    endDate: installments[installments.length - 1]?.dueDate || start,
    frequency,
  }
}

export function buildEmiActivityTimeline(plan) {
  const events = []
  const push = (step, timestamp, detail, status = 'completed') => {
    events.push({ step, timestamp, detail, status })
  }

  if (plan.createdAt) push('EMI Created', plan.createdAt, `Plan ${plan.id} activated`)
  for (const entry of plan.planHistory || []) {
    push(entry.action || 'Activity', entry.at, entry.by ? `By ${entry.by}` : '')
  }
  for (const log of plan.reminderLogs || []) {
    push(
      'Reminder Sent',
      log.timestamp,
      `${log.channel} — ${log.status}${log.trigger ? ` (${log.trigger})` : ''}`,
      log.status === 'Failed' ? 'failed' : 'completed',
    )
  }
  for (const inst of plan.installments || []) {
    if (inst.status === 'Paid' && inst.paidDate) {
      push('Payment Received', inst.paidDate, `EMI #${inst.emiNo} — ₹${inst.emiAmount}`)
    }
    if (inst.status === 'Overdue') {
      push('Overdue Triggered', inst.dueDate, `EMI #${inst.emiNo} overdue`)
    }
  }
  if (plan.counselorAssignedAt) {
    push('Counselor Assigned', plan.counselorAssignedAt, plan.counselorName)
  }
  if (plan.suspensionStatus === 'Suspended' && plan.suspendedAt) {
    push('Suspension Applied', plan.suspendedAt, plan.suspensionReason || 'Auto suspension')
  }
  if (plan.settlementStatus === 'Settlement Approved' || plan.settlementStatus === 'Foreclosed') {
    push('Settlement Completed', plan.settlementDate || plan.updatedAt, plan.settlementStatus)
  }
  for (const call of plan.callLogs || []) {
    push('Call Scheduled', call.scheduledAt || call.createdAt, `${call.status} — ${call.remarks || ''}`)
  }
  for (const bounce of plan.bounceLogs || []) {
    push('Bounce Recorded', bounce.bounceDate, `${bounce.provider}: ${bounce.reason}`)
  }
  for (const doc of plan.agreements || []) {
    if (doc.uploadedAt) push('Document Uploaded', doc.uploadedAt, doc.label || doc.type)
  }

  return events.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
}

export function filterEmiPlans(plans, filters = {}) {
  const {
    search = '',
    statusFilter = 'all',
    providerFilter = 'all',
    counselorFilter = 'all',
    overdueDaysMin = 0,
    overdueDaysMax = 9999,
    suspensionFilter = 'all',
    dateFrom = '',
    dateTo = '',
  } = filters

  const q = search.trim().toLowerCase()

  return plans.filter((plan) => {
    if (statusFilter !== 'all' && plan.status !== statusFilter && plan.emiStatus !== statusFilter) {
      return false
    }
    if (providerFilter !== 'all' && plan.loanProvider !== providerFilter) return false
    if (counselorFilter !== 'all' && plan.counselorId !== counselorFilter) return false
    if (suspensionFilter !== 'all' && plan.suspensionStatus !== suspensionFilter) return false
    if (plan.overdueDays < overdueDaysMin || plan.overdueDays > overdueDaysMax) return false
    if (dateFrom && plan.nextDueDate && plan.nextDueDate < dateFrom) return false
    if (dateTo && plan.nextDueDate && plan.nextDueDate > dateTo) return false
    if (!q) return true
    return (
      plan.studentName?.toLowerCase().includes(q) ||
      plan.studentId?.toLowerCase().includes(q) ||
      plan.courseName?.toLowerCase().includes(q) ||
      plan.loanProvider?.toLowerCase().includes(q)
    )
  })
}

export function applyTemplate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

export function resolveEmiPlanCenter(plan) {
  return plan?.centerName || plan?.branch || '—'
}

export function normalizeEmiCenterKey(centerName = '') {
  const value = String(centerName).toLowerCase()
  if (value.includes('delhi')) return 'delhi'
  if (value.includes('hyderabad') || value.includes('hyd')) return 'hyderabad'
  if (value.includes('pune')) return 'pune'
  return ''
}

export function planMatchesEmiCenter(plan, centerFilter = 'all') {
  if (!centerFilter || centerFilter === 'all') return true
  return normalizeEmiCenterKey(resolveEmiPlanCenter(plan)) === centerFilter
}

export function formatEmiCityLabel(centerName = '') {
  if (!centerName || centerName === '—') return '—'
  const key = normalizeEmiCenterKey(centerName)
  if (key === 'delhi') return 'Delhi'
  if (key === 'hyderabad') return 'Hyderabad'
  if (key === 'pune') return 'Pune'
  return String(centerName).replace(/\s+Center$/i, '').trim() || centerName
}

export function filterPlansByFinanceCenters(
  plans = [],
  { isOverallView, selectedCenters } = {},
) {
  if (isOverallView || !selectedCenters?.length) return plans
  const keys = new Set(
    selectedCenters.map((center) => normalizeEmiCenterKey(center.centerName)).filter(Boolean),
  )
  if (!keys.size) return plans
  return plans.filter((plan) => keys.has(normalizeEmiCenterKey(resolveEmiPlanCenter(plan))))
}
