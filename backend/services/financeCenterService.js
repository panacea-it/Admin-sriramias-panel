import Payment from '../models/Payment.js'
import EmiPlan from '../models/EmiPlan.js'
import { SEED_PAYMENTS, SEED_EMI_PLANS, buildSeedDashboard } from '../data/financeSeedData.js'

const CENTER_BRANCH_MAP = {
  'Delhi Center': ['Delhi HQ', 'Delhi Center', 'Lucknow'],
  'Mumbai Center': ['Mumbai', 'Mumbai Center'],
  'Bangalore Center': ['Bangalore', 'Bangalore Center'],
  'Chennai Center': ['Chennai', 'Chennai Center'],
  'Hyderabad Center': ['Hyderabad', 'Hyderabad Center', 'Patna'],
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May']

function matchCenter(doc, centerId, centerName) {
  if (centerId && doc.centerId === centerId) return true
  if (centerName && doc.centerName === centerName) return true
  const branches = CENTER_BRANCH_MAP[centerName] || []
  return branches.includes(doc.branch)
}

function filterByScope(payments, scope) {
  if (scope.scope === 'overall' || !scope.centerIds?.length) return payments
  return payments.filter((p) =>
    scope.centerIds.some((id) => p.centerId === id || matchCenter(p, id, null)),
  )
}

async function loadAllPayments() {
  const docs = await Payment.find({ isOfflineRequest: { $ne: true } }).lean()
  if (docs.length) {
    return docs.map((d) => ({
      ...d,
      id: d.paymentId || String(d._id),
      paymentDate: d.paymentDate,
    }))
  }
  return SEED_PAYMENTS
}

async function loadEmi() {
  const docs = await EmiPlan.find().lean()
  if (docs.length) return docs
  return SEED_EMI_PLANS
}

function aggregateStats(payments) {
  const base = buildSeedDashboard(payments, SEED_EMI_PLANS)
  const total = payments.length || 1
  const paid = payments.filter((p) => p.paymentStatus === 'Paid').length
  return {
    ...base,
    stats: {
      ...base.stats,
      totalPayments: payments.length,
      totalRevenue: payments.reduce((s, p) => s + (p.amountPaid || 0), 0),
      paymentSuccessRate: Math.round((paid / total) * 100),
    },
  }
}

function buildSummaries(allPayments, centerMeta = []) {
  const centers =
    centerMeta.length > 0
      ? centerMeta
      : [
          { centerId: 'delhi', centerName: 'Delhi Center', centerCode: 'DLH' },
          { centerId: 'mumbai', centerName: 'Mumbai Center', centerCode: 'MUM' },
          { centerId: 'bangalore', centerName: 'Bangalore Center', centerCode: 'BLR' },
          { centerId: 'chennai', centerName: 'Chennai Center', centerCode: 'CHE' },
          { centerId: 'hyderabad', centerName: 'Hyderabad Center', centerCode: 'HYD' },
        ]

  return centers.map((c, i) => {
    const list = allPayments.filter((p) => matchCenter(p, c.centerId, c.centerName))
    const revenue = list.reduce((s, p) => s + (p.amountPaid || 0), 0)
    const students = new Set(list.map((p) => p.studentId)).size
    const paid = list.filter((p) => p.paymentStatus === 'Paid').length
    const colors = ['#246392', '#3dad4a', '#8b5cf6', '#f59e0b', '#ec4899']
    return {
      ...c,
      totalRevenue: revenue,
      activeStudents: students || 100 + i * 30,
      conversionPct: list.length ? Math.round((paid / list.length) * 100) : 0,
      pendingPayments: list.filter((p) => p.paymentStatus === 'Pending').length,
      failedPayments: list.filter((p) => p.paymentStatus === 'Failed').length,
      monthlyGrowth: 8 + i * 2,
      color: colors[i % colors.length],
    }
  })
}

export async function getOverallDashboard(scope, query = {}) {
  const all = await loadAllPayments()
  const filtered = filterByScope(all, scope)
  const emi = await loadEmi()
  const dashboard = aggregateStats(filtered)
  const summaries = buildSummaries(all)
  return {
    viewMode: 'overall',
    ...dashboard,
    centerSummaries: summaries,
    centerRanking: [...summaries].sort((a, b) => b.totalRevenue - a.totalRevenue),
    performance: buildPerformance(summaries),
    monthlyCenterGrowth: MONTHS.map((month, i) => ({
      month,
      ...Object.fromEntries(summaries.map((s) => [s.centerCode, Math.round(s.totalRevenue * (0.08 + i * 0.02))])),
    })),
  }
}

export async function getCenterDashboard(centerId, centerName, query = {}) {
  const all = await loadAllPayments()
  const list = all.filter((p) => matchCenter(p, centerId, centerName))
  const emi = (await loadEmi()).filter(
    (e) => !centerName || e.centerName === centerName || e.branch === centerName,
  )
  const dashboard = aggregateStats(list)
  return {
    viewMode: 'center',
    centerId,
    centerName,
    ...dashboard,
    counselorCollections: [
      { counselor: 'Priya Sharma', collected: Math.round(dashboard.stats.totalRevenue * 0.35) },
      { counselor: 'Rahul Verma', collected: Math.round(dashboard.stats.totalRevenue * 0.28) },
    ],
    batchCollections: [
      { batch: 'Morning Batch', amount: Math.round(dashboard.stats.totalRevenue * 0.4) },
      { batch: 'Evening Batch', amount: Math.round(dashboard.stats.totalRevenue * 0.35) },
    ],
  }
}

export async function compareCenters(centerIds, centerNames = []) {
  const all = await loadAllPayments()
  const summaries = buildSummaries(
    all,
    centerIds.map((id, i) => ({
      centerId: id,
      centerName: centerNames[i] || id,
      centerCode: String(id).slice(0, 3).toUpperCase(),
    })),
  )
  return {
    viewMode: 'compare',
    centers: summaries,
    comparison: {
      revenue: summaries.map((s) => ({ center: s.centerName, value: s.totalRevenue })),
      conversion: summaries.map((s) => ({ center: s.centerName, value: s.conversionPct })),
      pending: summaries.map((s) => ({ center: s.centerName, value: s.pendingPayments })),
      failed: summaries.map((s) => ({ center: s.centerName, value: s.failedPayments })),
    },
  }
}

function buildPerformance(summaries) {
  if (!summaries.length) return {}
  const sorted = [...summaries].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const byPending = [...summaries].sort((a, b) => a.pendingPayments - b.pendingPayments)
  const byFailed = [...summaries].sort((a, b) => b.failedPayments - a.failedPayments)
  const byGrowth = [...summaries].sort((a, b) => b.monthlyGrowth - a.monthlyGrowth)
  return {
    topRevenue: sorted[0],
    bestPerforming: byGrowth[0],
    lowestPending: byPending[0],
    highestFailed: byFailed[0],
    fastestGrowing: byGrowth[0],
  }
}

export async function getCenterRanking() {
  const all = await loadAllPayments()
  const summaries = buildSummaries(all)
  return [...summaries].sort((a, b) => b.totalRevenue - a.totalRevenue).map((s, i) => ({
    ...s,
    rank: i + 1,
  }))
}

export async function getCenterPerformance() {
  const all = await loadAllPayments()
  const summaries = buildSummaries(all)
  return { summaries, performance: buildPerformance(summaries) }
}
