/** Client-side finance dashboard aggregation by center */

import {
  FINANCE_OPERATION_CENTER_NAMES,
  FINANCE_OPERATION_CENTERS,
} from '../constants/financeConstants'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const FINANCE_CENTER_KEYS = ['delhi', 'hyderabad', 'pune']

export function isFinanceOperationCenter(center) {
  if (!center) return false
  if (FINANCE_OPERATION_CENTER_NAMES.includes(center.centerName)) return true
  const name = String(center.centerName || '').toLowerCase()
  const city = String(center.city || '').toLowerCase()
  return FINANCE_CENTER_KEYS.some((key) => name.includes(key) || city.includes(key))
}

export function filterFinanceOperationCenters(centers = []) {
  const matched = centers.filter(isFinanceOperationCenter)
  return FINANCE_OPERATION_CENTERS.map((seed) => {
    const existing = matched.find(
      (c) =>
        c.centerName === seed.centerName ||
        String(c.city || '').toLowerCase() === seed.city.toLowerCase(),
    )
    return existing || { ...seed, centerId: `ctr-${seed.centerCode.toLowerCase()}`, status: 'active' }
  })
}

export function financeCenterCityLabel(center) {
  const raw = center?.city || center?.centerName?.replace(/\s+Center$/i, '').trim() || center?.centerName || 'Centre'
  if (String(raw).toLowerCase().includes('new delhi')) return 'Delhi'
  return raw
}

export function branchToCenterName(branch) {
  const map = {
    'Delhi HQ': 'Delhi Center',
    Lucknow: 'Delhi Center',
    Patna: 'Hyderabad Center',
  }
  return map[branch] || branch || 'Delhi Center'
}

/** Filter rows by finance header centre selection (single / multi / all). */
export function filterByFinanceCenters(rows = [], centerFilter, resolveCenterName = (row) => row.centerName) {
  if (!centerFilter || centerFilter.isOverallView) return rows
  const centerNames = new Set(
    (centerFilter.selectedCenters || []).map((c) => c.centerName).filter(Boolean),
  )
  if (!centerNames.size) return rows
  return rows.filter((row) => {
    const resolved = resolveCenterName(row)
    if (centerNames.has(resolved)) return true
    const fromBranch = branchToCenterName(row.branch)
    return fromBranch ? centerNames.has(fromBranch) : false
  })
}

export function filterPaymentsByCenters(payments, centerIds, centerNameById) {
  if (!centerIds?.length) return payments
  const names = new Set(
    centerIds.map((id) => centerNameById.get(id)).filter(Boolean),
  )
  return payments.filter((p) => {
    const cn = p.centerName || branchToCenterName(p.branch)
    return names.has(cn) || centerIds.includes(p.centerId)
  })
}

export function aggregateFinanceDashboard(payments, emiPlans = [], offlinePending = 14) {
  const paid = payments.filter((p) => p.paymentStatus === 'Paid' || p.amountPaid > 0)
  const totalRevenue = payments.reduce((s, p) => s + (p.amountPaid || 0), 0)
  const pending = payments.filter((p) => p.paymentStatus === 'Pending' || p.paymentStatus === 'Partial').length
  const failed = payments.filter((p) => p.paymentStatus === 'Failed').length

  const statusCounts = { Paid: 0, Partial: 0, Pending: 0, Failed: 0 }
  payments.forEach((p) => {
    const k = p.paymentStatus || 'Pending'
    if (statusCounts[k] != null) statusCounts[k] += 1
    else statusCounts.Pending += 1
  })
  const total = payments.length || 1
  const paymentStatusBreakdown = [
    { label: 'Paid', value: Math.round((statusCounts.Paid / total) * 100), color: '#69df66' },
    { label: 'Partial', value: Math.round((statusCounts.Partial / total) * 100), color: '#efb36d' },
    { label: 'Pending', value: Math.round((statusCounts.Pending / total) * 100), color: '#55ace7' },
    { label: 'Failed', value: Math.round((statusCounts.Failed / total) * 100), color: '#df8284' },
  ].filter((x) => x.value > 0)

  const courseMap = {}
  payments.forEach((p) => {
    const key = p.courseName || 'Other'
    courseMap[key] = (courseMap[key] || 0) + (p.amountPaid || 0)
  })

  return {
    stats: {
      totalPayments: payments.length,
      totalRevenue,
      pendingPayments: pending,
      pendingRevenue: payments.reduce((s, p) => s + (p.pendingAmount || 0), 0),
      totalDue: payments.reduce((s, p) => s + (p.pendingAmount || 0), 0),
      overdueAmount: payments.filter((p) => p.paymentStatus === 'Overdue' || p.paymentStatus === 'Failed').reduce((s, p) => s + (p.pendingAmount || 0), 0),
      verificationPending: payments.filter((p) => ['Pending', 'Partial', 'Partially Paid'].includes(p.paymentStatus)).length,
      failedPayments: failed,
      emiActiveStudents: emiPlans.length,
      offlineApprovalsPending: offlinePending,
      todayCollections: paid.slice(0, 3).reduce((s, p) => s + (p.amountPaid || 0), 0) || Math.round(totalRevenue * 0.02),
      monthlyCollections: Math.round(totalRevenue * 0.2) || totalRevenue,
    },
    monthlyRevenue: MONTHS.slice(0, 5).map((month, i) => ({
      month,
      amount: Math.round(totalRevenue * (0.14 + i * 0.02)),
    })),
    paymentStatusBreakdown: paymentStatusBreakdown.length ? paymentStatusBreakdown : [
      { label: 'Paid', value: 72, color: '#69df66' },
      { label: 'Partial', value: 14, color: '#efb36d' },
      { label: 'Pending', value: 9, color: '#55ace7' },
      { label: 'Failed', value: 5, color: '#df8284' },
    ],
    courseWiseRevenue: Object.entries(courseMap).map(([course, amount]) => ({ course, amount })),
    emiTrend: MONTHS.slice(0, 5).map((month, i) => ({
      month,
      collected: Math.round(totalRevenue * 0.05 * (i + 1)),
    })),
    recentPayments: paid.slice(0, 8),
    recentFailed: payments.filter((p) => ['Pending', 'Failed', 'Partial'].includes(p.paymentStatus)).slice(0, 6),
    pendingEmiDues: emiPlans.flatMap((p) => (p.installments || []).filter((e) => e.status === 'Due' || e.status === 'Overdue')).slice(0, 10),
  }
}

export function buildCenterSummaries(centers, payments) {
  return centers.map((center, i) => {
    const centerPayments = payments.filter(
      (p) => (p.centerName || branchToCenterName(p.branch)) === center.centerName,
    )
    const revenue = centerPayments.reduce((s, p) => s + (p.amountPaid || 0), 0)
    const students = new Set(centerPayments.map((p) => p.studentId)).size
    const converted = centerPayments.filter((p) => p.paymentStatus === 'Paid').length
    const conversionPct = centerPayments.length
      ? Math.round((converted / centerPayments.length) * 100)
      : 0
    const colors = ['#246392', '#3dad4a', '#8b5cf6', '#f59e0b', '#ec4899']
    return {
      centerId: center.centerId,
      centerName: center.centerName,
      centerCode: center.centerCode,
      totalRevenue: revenue,
      activeStudents: students || center.linkedStudentCount || 120 + i * 40,
      conversionPct,
      color: colors[i % colors.length],
      pendingPayments: centerPayments.filter((p) => p.paymentStatus === 'Pending').length,
      failedPayments: centerPayments.filter((p) => p.paymentStatus === 'Failed').length,
    }
  })
}

export function buildCenterRanking(summaries) {
  return [...summaries]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((s, i) => ({ ...s, rank: i + 1 }))
}

export function buildPerformanceHighlights(summaries) {
  if (!summaries.length) return {}
  const byRevenue = [...summaries].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const byPending = [...summaries].sort((a, b) => a.pendingPayments - b.pendingPayments)
  const byFailed = [...summaries].sort((a, b) => b.failedPayments - a.failedPayments)
  const byGrowth = [...summaries].sort((a, b) => b.conversionPct - a.conversionPct)
  return {
    topRevenue: byRevenue[0],
    bestPerforming: byGrowth[0],
    lowestPending: byPending[0],
    highestFailed: byFailed[0],
    fastestGrowing: byGrowth[0],
  }
}

export function buildCompareSeries(summaries, metric = 'totalRevenue') {
  return summaries.map((s) => ({
    center: s.centerName,
    value: s[metric] ?? 0,
    conversionPct: s.conversionPct,
    pending: s.pendingPayments,
    failed: s.failedPayments,
  }))
}

function paymentMonthLabel(isoDate) {
  if (!isoDate) return null
  const d = new Date(isoDate)
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

function daysSince(isoDate) {
  if (!isoDate) return 999
  const d = new Date(isoDate)
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export function buildTopPerformingCourses(payments = []) {
  const courseMap = {}

  payments.forEach((p) => {
    const courseName = p.courseName || 'Other'
    if (!courseMap[courseName]) {
      courseMap[courseName] = {
        course: courseName,
        collection: 0,
        revenueByStudent: {},
        studentIds: new Set(),
      }
    }

    const entry = courseMap[courseName]
    entry.collection += p.amountPaid || 0

    const studentKey = p.studentId || p.studentName || `${courseName}-${p.id || p.paymentId || ''}`
    if (studentKey) entry.studentIds.add(studentKey)

    const billedAmount = Number(p.totalFees ?? p.totalFee ?? p.courseFee ?? 0) || Number(p.amountPaid || 0)
    if (studentKey) {
      entry.revenueByStudent[studentKey] = Math.max(entry.revenueByStudent[studentKey] || 0, billedAmount)
    }
  })

  const topCourses = Object.values(courseMap)
    .map((entry) => {
      const revenue = Object.values(entry.revenueByStudent).reduce((sum, value) => sum + value, 0)
      return {
        course: entry.course,
        courseName: entry.course,
        revenue,
        collection: entry.collection,
        studentCount: entry.studentIds.size,
        enrolledStudents: entry.studentIds.size,
      }
    })
    .sort((a, b) => b.collection - a.collection || b.revenue - a.revenue)

  return {
    topCourses,
    topPerformingCourse: topCourses[0] || null,
  }
}

/**
 * Extended analytics for Payment Dashboard widgets (mock-safe, client-side).
 */
export function buildExtendedDashboardAnalytics(payments, emiPlans = [], centers = [], counselors = []) {
  const collected = payments.reduce((s, p) => s + (p.amountPaid || 0), 0)
  const outstanding = payments.reduce((s, p) => s + (p.pendingAmount || 0), 0)
  const total = payments.length || 1

  const successfulCount = payments.filter((p) => p.paymentStatus === 'Paid').length
  const failedCount = payments.filter((p) => p.paymentStatus === 'Failed').length
  const pendingCount = payments.filter((p) =>
    ['Pending', 'Partial', 'Partially Paid', 'Verification Pending'].includes(p.paymentStatus),
  ).length

  const paymentSuccessRatio = {
    successful: Math.round((successfulCount / total) * 100),
    failed: Math.round((failedCount / total) * 100),
    pending: Math.round((pendingCount / total) * 100),
  }

  const failedPayments = payments.filter((p) => p.paymentStatus === 'Failed')
  const recoveredFromAttempts = payments.filter((p) => {
    const hadFail = (p.attempts || []).some((a) => a.status === 'Failed')
    const hasSuccess = (p.attempts || []).some((a) => a.status === 'Success')
    return hadFail && hasSuccess && p.amountPaid > 0
  })
  const failedTotal = failedPayments.length + recoveredFromAttempts.length || 1
  const recoveryPct = Math.round((recoveredFromAttempts.length / failedTotal) * 100) || 0

  const recoveryTrend = MONTHS.slice(0, 5).map((month, i) => ({
    month,
    failed: Math.max(1, Math.round(failedCount * (0.15 + i * 0.05))),
    recovered: Math.max(0, Math.round(recoveredFromAttempts.length * (0.1 + i * 0.08))),
  }))

  const { topCourses, topPerformingCourse } = buildTopPerformingCourses(payments)

  const todayMs = 24 * 60 * 60 * 1000
  const todayPayments = payments.filter((p) => {
    if (!p.paymentDate) return false
    return Date.now() - new Date(p.paymentDate).getTime() < todayMs
  })
  const yesterdayPayments = payments.filter((p) => {
    if (!p.paymentDate) return false
    const age = Date.now() - new Date(p.paymentDate).getTime()
    return age >= todayMs && age < 2 * todayMs
  })
  const todayAmount = todayPayments.reduce((s, p) => s + (p.amountPaid || 0), 0)
  const yesterdayAmount = yesterdayPayments.reduce((s, p) => s + (p.amountPaid || 0), 0)
  const trendPct =
    yesterdayAmount > 0
      ? Math.round(((todayAmount - yesterdayAmount) / yesterdayAmount) * 100)
      : todayAmount > 0
        ? 100
        : 0

  const counselorMap = {}
  payments.forEach((p) => {
    const cid = p.counselorId || 'c1'
    if (!counselorMap[cid]) {
      const meta = counselors.find((c) => c.id === cid)
      counselorMap[cid] = {
        counselorId: cid,
        counselorName: meta?.name || `Counselor ${cid}`,
        revenue: 0,
        studentIds: new Set(),
        converted: 0,
        total: 0,
      }
    }
    counselorMap[cid].revenue += p.amountPaid || 0
    counselorMap[cid].studentIds.add(p.studentId)
    counselorMap[cid].total += 1
    if (p.paymentStatus === 'Paid') counselorMap[cid].converted += 1
  })
  const counselorRevenue = Object.values(counselorMap)
    .map((c) => ({
      counselorId: c.counselorId,
      counselorName: c.counselorName,
      revenue: c.revenue,
      studentCount: c.studentIds.size,
      conversionPct: c.total ? Math.round((c.converted / c.total) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const emiAging = { bucket0_7: 0, bucket8_30: 0, bucket30_plus: 0, amounts: { bucket0_7: 0, bucket8_30: 0, bucket30_plus: 0 } }
  emiPlans.forEach((plan) => {
    ;(plan.installments || []).forEach((inst) => {
      if (inst.status !== 'Due' && inst.status !== 'Overdue') return
      const age = daysSince(inst.dueDate || inst.emiDate)
      const amt = inst.emiAmount - (inst.paidAmount || 0)
      if (age <= 7) {
        emiAging.bucket0_7 += 1
        emiAging.amounts.bucket0_7 += amt
      } else if (age <= 30) {
        emiAging.bucket8_30 += 1
        emiAging.amounts.bucket8_30 += amt
      } else {
        emiAging.bucket30_plus += 1
        emiAging.amounts.bucket30_plus += amt
      }
    })
  })

  const centerMonthlyComparison = (centers.length ? centers : [{ centerName: 'All' }]).map((center) => {
    const centerPayments =
      center.centerName === 'All'
        ? payments
        : payments.filter((p) => (p.centerName || branchToCenterName(p.branch)) === center.centerName)
    const monthMap = {}
    centerPayments.forEach((p) => {
      const label = paymentMonthLabel(p.paymentDate)
      if (!label) return
      monthMap[label] = (monthMap[label] || 0) + (p.amountPaid || 0)
    })
    const months = MONTHS.slice(0, 6).map((m, mi) => {
      const key = Object.keys(monthMap).find((k) => k.startsWith(m)) || m
      const fallback = Math.round(centerPayments.length * 12000 * (0.75 + mi * 0.06))
      return { month: m, amount: monthMap[key] ?? fallback }
    })
    return { centerName: center.centerName, centerId: center.centerId, months }
  })

  return {
    collectionVsOutstanding: [
      { label: 'Collected', amount: collected, color: '#246392' },
      { label: 'Outstanding', amount: outstanding, color: '#efb36d' },
    ],
    centerMonthlyComparison,
    paymentSuccessRatio,
    failedRecovery: {
      failed: failedCount,
      recovered: recoveredFromAttempts.length,
      recoveryPct,
      trend: recoveryTrend,
    },
    topPerformingCourse,
    topCoursesLeaderboard: topCourses.slice(0, 5),
    dailyCollection: {
      today: todayAmount || Math.round(collected * 0.02),
      yesterday: yesterdayAmount || Math.round(collected * 0.018),
      trendPct,
      count: todayPayments.length || Math.max(1, Math.round(payments.length * 0.05)),
    },
    counselorRevenue,
    emiAging: [
      { label: '0–7 days', count: emiAging.bucket0_7, amount: emiAging.amounts.bucket0_7, color: '#55ace7', key: '0_7' },
      { label: '8–30 days', count: emiAging.bucket8_30, amount: emiAging.amounts.bucket8_30, color: '#efb36d', key: '8_30' },
      { label: '30+ days', count: emiAging.bucket30_plus, amount: emiAging.amounts.bucket30_plus, color: '#df8284', key: '30_plus' },
    ],
    counselorCollections: counselorRevenue.map((c) => ({
      counselor: c.counselorName,
      collected: c.revenue,
    })),
  }
}
