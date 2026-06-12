import {
  ENROLLMENT_SOURCES,
  FINANCE_HEALTH_LEVELS,
  LOAN_PROVIDERS,
  LOAN_STATUSES,
  PAYMENT_BEHAVIOR_CATEGORIES,
} from '../constants/studentFinanceProfiles'
import { branchToCenterName, filterByFinanceCenters } from './financeCenterAggregation'

const SOURCE_CYCLE = ['website', 'counselor', 'referral', 'offline_center']
const PROVIDER_CYCLE = ['Institute EMI', 'Bajaj', 'Liquiloans', 'Propelld', 'Eduvanz']

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 9973
  return h
}

function pickFromCycle(id, cycle) {
  return cycle[hashSeed(id) % cycle.length]
}

export function getEnrollmentSourceMeta(sourceId) {
  return ENROLLMENT_SOURCES.find((s) => s.id === sourceId) || ENROLLMENT_SOURCES[0]
}

export function computeFinanceHealth(totalFees, totalPaid, totalPending) {
  if (totalFees <= 0) return FINANCE_HEALTH_LEVELS.partial
  const pctPaid = totalPaid / totalFees
  if (totalPending <= 0 || pctPaid >= 0.99) return FINANCE_HEALTH_LEVELS.paid
  if (pctPaid >= 0.5 && totalPending / totalFees < 0.35) return FINANCE_HEALTH_LEVELS.partial
  return FINANCE_HEALTH_LEVELS.high
}

export function computePaymentProgress(totalFees, totalPaid) {
  if (!totalFees) return 0
  return Math.min(100, Math.round((totalPaid / totalFees) * 100))
}

function deriveLoanFromEmi(emiPlan, payments) {
  if (!emiPlan) {
    const hasEmiPayment = payments.some((p) => p.paymentType === 'EMI')
    if (!hasEmiPayment) {
      return {
        loanProvider: '',
        loanStatus: 'Not Applied',
        loanAmount: 0,
        approvedAmount: 0,
        disbursedAmount: 0,
        outstandingAmount: 0,
        providerRefId: '',
        providerRemarks: '',
        approvalTimeline: [],
      }
    }
    return {
      loanProvider: 'Institute EMI',
      loanStatus: 'Applied',
      loanAmount: payments[0]?.pendingAmount || 0,
      approvedAmount: 0,
      disbursedAmount: 0,
      outstandingAmount: payments[0]?.pendingAmount || 0,
      providerRefId: '',
      providerRemarks: 'Application in progress',
      approvalTimeline: [],
    }
  }

  const provider = emiPlan.loanProvider || 'Institute EMI'
  const outstanding = emiPlan.pendingAmount || 0
  let loanStatus = emiPlan.providerStatus || emiPlan.planStatus || 'EMI Active'
  if (!LOAN_STATUSES.includes(loanStatus)) {
    if (emiPlan.completionPercent >= 100) loanStatus = 'Closed'
    else if (provider !== 'Institute EMI') loanStatus = 'EMI Active'
    else loanStatus = 'EMI Active'
  }

  return {
    loanProvider: provider,
    loanStatus,
    loanAmount: emiPlan.loanAmount || emiPlan.totalFees || 0,
    approvedAmount: emiPlan.loanAmount || emiPlan.totalFees || 0,
    disbursedAmount: emiPlan.totalPaid || 0,
    outstandingAmount: outstanding,
    providerRefId: emiPlan.providerRefId || '',
    providerRemarks: emiPlan.settlementRemarks || '',
    approvalTimeline: (emiPlan.planHistory || []).map((h) => ({
      step: h.action,
      detail: h.by ? `By ${h.by}` : '',
      timestamp: h.at,
      status: 'completed',
    })),
    agreementId: emiPlan.agreements?.[0]?.id,
  }
}

function buildDefaultFeeBreakdown(payments, extension = {}) {
  const p = payments[0] || {}
  const totalFees = payments.reduce((s, x) => s + (x.totalFees || 0), 0) || extension.totalFees || 0
  const gst = payments.reduce((s, x) => s + (x.gst || 0), 0) || Math.round(totalFees * 0.18 * 0.15)
  const scholarship = extension.scholarshipAmount ?? Math.round(totalFees * 0.05 * (hashSeed(p.studentId || '') % 3))
  const discount = extension.discountAmount ?? Math.round(totalFees * 0.03 * (hashSeed(p.studentId || 'x') % 2))
  const courseFee = Math.max(0, totalFees - gst - (extension.admissionFee || 5000) - (extension.materialFee || 3000))

  return {
    courseFee,
    admissionFee: extension.admissionFee ?? 5000,
    materialFee: extension.materialFee ?? 3000,
    gstTax: gst,
    scholarshipAmount: scholarship,
    discountAmount: discount,
    additionalCharges: extension.additionalCharges ?? 0,
    refundAdjustments: extension.refundAdjustments ?? (p.refundAmount || 0),
    totalFees,
    revisions: extension.feeRevisions || [
      {
        id: 'rev-1',
        label: 'Initial fee assignment',
        amount: totalFees,
        at: p.registrationDate || p.paymentDate || new Date().toISOString(),
        by: 'System',
      },
    ],
  }
}

function buildPaymentAnalytics(payments, emiPlan, profile) {
  const failedCount = payments.reduce((s, p) => s + (p.attempts || []).filter((a) => a.status === 'Failed').length, 0)
  const refundCount = payments.filter((p) => p.refundStatus && p.refundStatus !== 'Not Refunded').length
  const overdueEmi = (emiPlan?.installments || []).filter((i) => i.status === 'Due' || i.status === 'Overdue').length
  const pendingRatio = profile.totalFees ? profile.totalPending / profile.totalFees : 1

  let riskScore = 20
  if (pendingRatio > 0.5) riskScore += 35
  else if (pendingRatio > 0.2) riskScore += 15
  if (failedCount > 2) riskScore += 20
  if (overdueEmi > 0) riskScore += 15
  if (refundCount > 0) riskScore += 10
  riskScore = Math.min(100, riskScore)

  let reliabilityScore = 100 - riskScore
  let behaviorId = 'excellent'
  if (riskScore >= 70) behaviorId = 'high'
  else if (riskScore >= 45) behaviorId = 'moderate'
  else if (riskScore >= 25) behaviorId = 'good'

  const insights = []
  if (profile.totalPending <= 0) insights.push('Fully settled — no outstanding dues')
  if (overdueEmi === 0 && emiPlan) insights.push('Usually pays before due date')
  if (overdueEmi > 1) insights.push('Frequent overdue pattern detected')
  if (refundCount > 0) insights.push('High refund requests observed')
  if (failedCount > 3) insights.push('Multiple failed payment attempts recorded')

  const modes = payments.map((p) => p.paymentMode).filter(Boolean)
  const preferredMode = modes.length ? modes.sort((a, b) => modes.filter((m) => m === b).length - modes.filter((m) => m === a).length)[0] : 'UPI'

  const monthlyTrend = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleString('en-IN', { month: 'short' })
    const monthPayments = payments.filter((p) => {
      if (!p.paymentDate) return false
      const pd = new Date(p.paymentDate)
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
    })
    monthlyTrend.push({ month: label, amount: monthPayments.reduce((s, p) => s + (p.amountPaid || 0), 0) })
  }

  const emiCompletion = emiPlan
    ? (emiPlan.installments || []).map((inst, idx) => ({
        label: `EMI ${inst.emiNo || idx + 1}`,
        value: inst.status === 'Paid' ? 100 : inst.status === 'Due' ? 40 : 0,
      }))
    : []

  const overdueFrequency = emiPlan
    ? (emiPlan.installments || []).slice(0, 6).map((inst) => ({
        label: `EMI ${inst.emiNo}`,
        count: inst.status === 'Overdue' ? 2 : inst.status === 'Due' ? 1 : 0,
      }))
    : []

  const heatmap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    intensity: (hashSeed(`${profile.id}-${day}`) % 5) + (payments.length > 0 && i < 5 ? 1 : 0),
  }))

  return {
    riskScore,
    reliabilityScore,
    defaultProbability: Math.round(riskScore * 0.85),
    behaviorId,
    behaviorLabel: PAYMENT_BEHAVIOR_CATEGORIES.find((b) => b.id === behaviorId)?.label || 'Good',
    preferredPaymentMode: preferredMode,
    punctualityScore: Math.max(0, 100 - overdueEmi * 15),
    delayedPayments: overdueEmi,
    emiConsistency: emiPlan ? Math.round((emiPlan.completionPercent || 0)) : null,
    refundFrequency: refundCount,
    failedPayments: failedCount,
    insights,
    monthlyTrend,
    emiCompletion,
    overdueFrequency,
    heatmap,
  }
}

function buildFinanceTimeline(payments, emiPlan, walletTxns, refunds, extension) {
  const events = []

  payments.forEach((p) => {
    if (p.registrationDate) {
      events.push({
        id: `${p.id}-fee`,
        actionType: 'fee_assigned',
        label: 'Fee assigned',
        detail: `${p.courseName} · ${p.totalFees}`,
        at: p.registrationDate,
        by: 'System',
        remarks: p.enrollmentNumber || '',
      })
    }
    ;(p.timeline || []).forEach((t, i) => {
      events.push({
        id: `${p.id}-tl-${i}`,
        actionType: t.event?.toLowerCase().includes('receipt') ? 'receipt' : 'payment',
        label: t.event,
        detail: p.courseName,
        at: t.timestamp,
        by: 'System',
      })
    })
    ;(p.adminLogs || []).forEach((l, i) => {
      events.push({
        id: `${p.id}-log-${i}`,
        actionType: 'admin_action',
        label: l.action,
        detail: l.comment,
        at: l.timestamp,
        by: l.adminName,
      })
    })
  })

  if (emiPlan) {
    events.push({
      id: `${emiPlan.id}-emi`,
      actionType: 'emi_generated',
      label: 'EMI plan generated',
      detail: emiPlan.courseName,
      at: emiPlan.emiStartDate || emiPlan.planHistory?.[0]?.at,
      by: 'Finance Admin',
    })
    ;(emiPlan.reminderLogs || []).forEach((r, i) => {
      events.push({
        id: `${emiPlan.id}-rem-${i}`,
        actionType: 'reminder_sent',
        label: 'Reminder sent',
        detail: `${r.channel} · ${r.status}`,
        at: r.timestamp,
        by: 'Automation',
      })
    })
  }

  walletTxns.forEach((t) => {
    events.push({
      id: t.id,
      actionType: 'wallet_updated',
      label: `Wallet ${t.type}`,
      detail: t.remarks,
      at: t.at,
      by: t.by || 'Finance Admin',
    })
  })

  refunds.forEach((r) => {
    events.push({
      id: r.id,
      actionType: 'refund_processed',
      label: `Refund ${r.status}`,
      detail: r.reason,
      at: r.processedDate || r.requestedAt,
      by: r.approvedBy || 'Finance Admin',
    })
  })

  ;(extension.timelineExtras || []).forEach((e) => events.push(e))

  return events.sort((a, b) => new Date(b.at) - new Date(a.at))
}

function buildSourceAnalytics(profiles) {
  const bySource = {}
  profiles.forEach((p) => {
    const key = p.enrollmentSource || 'website'
    if (!bySource[key]) {
      bySource[key] = { sourceId: key, revenue: 0, students: 0, collected: 0, pending: 0 }
    }
    bySource[key].students += 1
    bySource[key].revenue += p.totalFees || 0
    bySource[key].collected += p.totalPaid || 0
    bySource[key].pending += p.totalPending || 0
  })
  return Object.values(bySource).map((row) => {
    const meta = getEnrollmentSourceMeta(row.sourceId)
    const conversion = row.students ? Math.round((row.collected / Math.max(row.revenue, 1)) * 100) : 0
    const collectionEfficiency = row.revenue ? Math.round((row.collected / row.revenue) * 100) : 0
    return { ...row, label: meta.label, color: meta.color, conversion, collectionEfficiency }
  })
}

/**
 * Enrich a base profile row with payments, EMI, and computed finance fields.
 */
export function enrichStudentFinanceProfile(base, { payments = [], emiPlans = [], extension = {} } = {}) {
  const studentPayments = payments.filter((p) => p.studentId === base.id)
  const emiPlan = emiPlans.find((e) => e.studentId === base.id)

  const totalPaid = studentPayments.reduce((s, p) => s + (p.amountPaid || 0), 0) || base.totalPaid || 0
  const totalPending = studentPayments.reduce((s, p) => s + (p.pendingAmount || 0), 0) || base.totalPending || 0
  const totalFees =
    studentPayments.reduce((s, p) => s + (p.totalFees || 0), 0) || extension.totalFees || totalPaid + totalPending

  const sourceId = extension.enrollmentSource || pickFromCycle(base.id, SOURCE_CYCLE)
  const sourceMeta = getEnrollmentSourceMeta(sourceId)
  const feeBreakdown = extension.feeBreakdown || buildDefaultFeeBreakdown(studentPayments, extension)
  const scholarshipAmount = feeBreakdown.scholarshipAmount ?? 0
  const discountAmount = feeBreakdown.discountAmount ?? 0
  const activeEmiAmount = emiPlan?.pendingAmount || (studentPayments.some((p) => p.paymentType === 'EMI') ? totalPending : 0)
  const refundAmount = studentPayments.reduce((s, p) => s + (p.refundAmount || 0), 0) || extension.refundAmount || 0
  const walletBalance = extension.walletBalance ?? (hashSeed(base.id) % 5) * 500
  const loan = { ...deriveLoanFromEmi(emiPlan, studentPayments), ...extension.loan }

  const primaryCourse =
    base.primaryCourse ||
    studentPayments[0]?.courseName ||
    base.courses?.[0]?.courseName ||
    '—'

  const profile = {
    ...base,
    studentId: base.id,
    primaryCourse,
    totalFees,
    scholarshipAmount,
    discountAmount,
    totalPaid,
    totalPending,
    activeEmiAmount,
    refundAmount,
    walletBalance,
    enrollmentSource: sourceId,
    enrollmentSourceLabel: sourceMeta.label,
    enrollmentSourceColor: sourceMeta.color,
    referredBy: extension.referredBy || (sourceId === 'referral' ? 'Alumni Network' : ''),
    counselorName: extension.counselorName || emiPlan?.counselorName || (sourceId === 'counselor' ? 'Priya Sharma' : ''),
    branchMapped: base.branch || extension.branchMapped || '—',
    campaignNotes: extension.campaignNotes || '',
    enrollmentDate: extension.enrollmentDate || studentPayments[0]?.registrationDate || base.courses?.[0]?.date,
    feeBreakdown,
    loan,
    emiStatus: emiPlan?.planStatus || emiPlan?.status || studentPayments.find((p) => p.emiStatus)?.emiStatus || (activeEmiAmount > 0 ? 'EMI Running' : '—'),
    loanStatus: loan.loanStatus,
    walletTransactions: extension.walletTransactions || buildDefaultWalletTxns(base.id, walletBalance),
    documents: extension.documents || buildDefaultDocuments(base.id, emiPlan),
    refunds: extension.refunds || buildDefaultRefunds(studentPayments, refundAmount),
    notifications: extension.notifications || buildDefaultNotifications(base.id, totalPending, emiPlan),
    updatedAt: extension.updatedAt || studentPayments.map((p) => p.paymentDate).filter(Boolean).sort().reverse()[0] || new Date().toISOString(),
  }

  profile.health = computeFinanceHealth(totalFees, totalPaid, totalPending)
  profile.paymentProgress = computePaymentProgress(totalFees, totalPaid)
  profile.analytics = buildPaymentAnalytics(studentPayments, emiPlan, profile)
  profile.riskScore = profile.analytics.riskScore
  profile.timeline = buildFinanceTimeline(
    studentPayments,
    emiPlan,
    profile.walletTransactions,
    profile.refunds,
    extension,
  )

  return profile
}

function buildDefaultWalletTxns(studentId, balance) {
  const now = new Date().toISOString()
  return [
    { id: `WLT-${studentId}-1`, type: 'Credit', amount: balance, remarks: 'Opening wallet credit', at: now, by: 'Finance Admin', balanceAfter: balance },
  ]
}

function buildDefaultDocuments(studentId, emiPlan) {
  const docs = [
    { id: `DOC-${studentId}-aadhaar`, type: 'aadhaar', label: 'Aadhaar', fileName: 'aadhaar.pdf', uploadedAt: new Date().toISOString(), status: 'uploaded' },
    { id: `DOC-${studentId}-fee`, type: 'fee_agreement', label: 'Fee Agreement', fileName: 'fee-agreement.pdf', uploadedAt: new Date().toISOString(), status: 'uploaded' },
  ]
  if (emiPlan?.agreements?.length) {
    const ag = emiPlan.agreements[0]
    docs.push({
      id: ag.id,
      type: 'loan_agreement',
      label: ag.label || 'Loan Agreement',
      fileName: ag.fileName,
      uploadedAt: ag.uploadedAt,
      status: 'uploaded',
    })
  }
  return docs
}

function buildDefaultRefunds(payments, refundAmount) {
  if (!refundAmount) return []
  const p = payments.find((x) => x.refundAmount) || payments[0]
  return [
    {
      id: `REF-${p?.id || '1'}`,
      amount: refundAmount,
      reason: 'Course adjustment',
      mode: 'Wallet',
      status: p?.refundStatus === 'Partially Refunded' ? 'Processed' : 'Processed',
      requestedAt: p?.paymentDate,
      processedDate: p?.paymentDate,
      approvedBy: 'Finance Admin',
    },
  ]
}

function buildDefaultNotifications(studentId, pending, emiPlan) {
  const items = []
  if (pending > 0) {
    items.push({
      id: `NTF-${studentId}-pending`,
      type: 'pending_payment',
      title: 'Pending payment due',
      message: `Outstanding balance of ₹${pending.toLocaleString('en-IN')}`,
      channel: 'In-app',
      read: false,
      at: new Date().toISOString(),
    })
  }
  if (emiPlan?.installments?.some((i) => i.status === 'Due')) {
    items.push({
      id: `NTF-${studentId}-emi`,
      type: 'emi_due',
      title: 'EMI installment due',
      message: 'Next EMI due soon',
      channel: 'WhatsApp',
      read: false,
      at: new Date().toISOString(),
    })
  }
  return items
}

export function dedupeProfileBases(bases) {
  const map = new Map()
  bases.forEach((b) => {
    const existing = map.get(b.id)
    if (existing) {
      existing.totalPaid += b.totalPaid || 0
      existing.totalPending += b.totalPending || 0
      existing.courses.push(...(b.courses || []))
    } else {
      map.set(b.id, { ...b, courses: [...(b.courses || [])] })
    }
  })
  return [...map.values()]
}

export function buildProfileBasesFromPayments(payments) {
  return dedupeProfileBases(
    payments.map((p) => ({
      id: p.studentId,
      studentName: p.studentName,
      mobile: p.mobile,
      email: p.email,
      branch: p.branch,
      totalPaid: p.amountPaid || 0,
      totalPending: p.pendingAmount || 0,
      courses: [
        {
          courseId: p.courseId,
          courseName: p.courseName,
          courseType: p.courseType,
          paymentStatus: p.paymentStatus,
          date: p.paymentDate,
          paymentType: p.paymentType,
          paidAmount: p.amountPaid,
          pendingAmount: p.pendingAmount,
        },
      ],
    })),
  )
}

export function enrichAllStudentProfiles(bases, payments, emiPlans) {
  const merged = dedupeProfileBases(bases.length ? bases : buildProfileBasesFromPayments(payments))
  return merged.map((b) => enrichStudentFinanceProfile(b, { payments, emiPlans }))
}

export function filterProfilesByFinanceCenters(profiles = [], centerFilter) {
  return filterByFinanceCenters(
    profiles,
    centerFilter,
    (row) => branchToCenterName(row.branch) || row.branchMapped || row.branch,
  )
}

export function filterStudentProfiles(profiles, filters = {}) {
  const {
    search = '',
    branch = 'all',
    course = 'all',
    status = 'all',
    source = 'all',
    loanStatus = 'all',
    riskMin = 0,
    riskMax = 100,
    dateFrom = '',
    dateTo = '',
  } = filters
  const q = search.trim().toLowerCase()

  return profiles.filter((p) => {
    if (branch !== 'all' && p.branch !== branch) return false
    if (source !== 'all' && p.enrollmentSource !== source) return false
    if (loanStatus !== 'all' && p.loanStatus !== loanStatus) return false
    if (p.riskScore < riskMin || p.riskScore > riskMax) return false
    if (course !== 'all' && !String(p.primaryCourse).toLowerCase().includes(course.toLowerCase())) {
      const matchCourse = (p.courses || []).some((c) => c.courseId === course || c.courseName?.includes(course))
      if (!matchCourse && p.primaryCourse !== course) return false
    }
    if (status !== 'all') {
      const matchStatus =
        p.emiStatus === status ||
        (p.courses || []).some((c) => c.paymentStatus === status) ||
        (status === 'Paid' && p.totalPending <= 0)
      if (!matchStatus) return false
    }
    if (dateFrom && p.updatedAt && new Date(p.updatedAt) < new Date(dateFrom)) return false
    if (dateTo && p.updatedAt && new Date(p.updatedAt) > new Date(dateTo)) return false
    if (!q) return true
    return (
      p.studentName?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.mobile?.includes(q) ||
      p.primaryCourse?.toLowerCase().includes(q)
    )
  })
}

export function computeSourceAnalytics(profiles) {
  return buildSourceAnalytics(profiles)
}

export function downloadProfileSummary(profile) {
  const lines = [
    `Student Finance Summary — ${profile.studentName} (${profile.id})`,
    `Course: ${profile.primaryCourse}`,
    `Total Fees: ₹${profile.totalFees}`,
    `Paid: ₹${profile.totalPaid} | Pending: ₹${profile.totalPending}`,
    `Wallet: ₹${profile.walletBalance} | Risk Score: ${profile.riskScore}`,
    `Enrollment: ${profile.enrollmentSourceLabel} | Loan: ${profile.loanStatus}`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance-summary-${profile.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export { LOAN_PROVIDERS, LOAN_STATUSES, PROVIDER_CYCLE }
