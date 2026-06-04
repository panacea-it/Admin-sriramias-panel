import { INITIAL_BATCHES } from '../data/batchManagementData'
import {
  MOCK_PAYMENT_REPORTS,
  MOCK_STUDENT_PROFILES,
} from '../data/financeMockData'
import {
  STUDENT_ACTIVITY_EVENTS,
  STUDENT_ATTENDANCE_SESSIONS,
  STUDENT_BATCH_EXTRAS,
  STUDENT_ORDERS,
  STUDENT_PAYMENT_EXTRAS,
  STUDENT_TEST_ATTEMPTS,
  STUDENT_WALLET,
} from '../data/studentDetailMock'
import { findManageUserById, loadManageUsers } from './manageUsersStorage'
import { loadBatchesStore } from './batchesApiStorage'

function normEmail(v) {
  return String(v || '').trim().toLowerCase()
}

function normPhone(v) {
  return String(v || '').replace(/\D/g, '').slice(-10)
}

function normName(v) {
  return String(v || '').trim().toLowerCase()
}

function studentMatchesProfile(student, profile) {
  if (!student || !profile) return false
  const pe = normEmail(profile.email)
  const se = normEmail(student.email)
  if (pe && se && pe === se) return true
  const pp = normPhone(profile.phone)
  const sp = normPhone(student.phone)
  if (pp && sp && pp === sp) return true
  const pn = normName(profile.fullName)
  const sn = normName(student.name)
  if (pn && sn && pn === sn) return true
  return false
}

function paymentMatchesProfile(payment, profile) {
  const pe = normEmail(profile.email)
  const pp = normPhone(profile.phone)
  const pn = normName(profile.fullName)
  if (pe && normEmail(payment.email) === pe) return true
  if (pp && normPhone(payment.mobile) === pp) return true
  if (pn && normName(payment.studentName) === pn) return true
  return false
}

export function getStudentProfile(manageUserId) {
  return findManageUserById(manageUserId)
}

function collectBatchesFromStore() {
  const apiRows = loadBatchesStore()
  const fromInitial = INITIAL_BATCHES.map((b) => ({
    id: b.id,
    batchId: b.batchId,
    courseName: b.courseName,
    batchName: b.batchLabel,
    batchLabel: b.batchLabel,
    trainerName: b.trainerName,
    startDate: b.startDate,
    endDate: b.endDate,
    batchStatus: b.status,
    students: b.students || [],
  }))
  const merged = [...fromInitial]
  const seenIds = new Set(fromInitial.map((b) => String(b.id)))
  for (const row of apiRows) {
    const rowId = String(row.id || '')
    if (rowId && seenIds.has(rowId)) continue
    if (rowId) seenIds.add(rowId)
    const fd = row.formData || {}
    merged.push({
      id: row.id,
      batchId: row.batchId || fd.batchId,
      courseName: row.courseName || row.linkedCourseName || fd.courseName,
      batchName: row.batchName || row.name || fd.batchName,
      batchLabel: row.batchName || row.name || fd.batchName,
      trainerName: fd.trainerName || row.trainerName || '—',
      startDate: row.batchStartFrom || fd.batchStartFrom || '',
      endDate: row.batchEndTo || fd.batchEndTo || '',
      batchStatus: row.status || fd.status || 'Active',
      students: row.students || fd.students || [],
    })
  }
  return merged
}

export function getStudentBatchEnrollments(profile) {
  if (!profile) return []
  const enrollments = []
  const batches = collectBatchesFromStore()

  for (const batch of batches) {
    for (const student of batch.students || []) {
      if (!studentMatchesProfile(student, profile)) continue
      enrollments.push({
        id: `${batch.id}-${student.id}`,
        batchId: batch.batchId,
        courseName: batch.courseName,
        batchName: batch.batchName || batch.batchLabel,
        trainerName: batch.trainerName,
        startDate: batch.startDate,
        endDate: batch.endDate,
        batchStatus: batch.batchStatus,
        enrollmentId: student.enrollmentId,
        paymentStatus: student.paymentStatus,
        attendance: student.attendance,
        progress: student.progress,
        studentStatus: student.status,
      })
    }
  }

  const emailKey = normEmail(profile.email)
  const extras = (STUDENT_BATCH_EXTRAS[emailKey] || []).map((row, index) => ({
    ...row,
    id: row.id || `extra-${emailKey}-${row.batchId || index}`,
  }))
  const seen = new Set()
  return [...enrollments, ...extras].filter((row) => {
    const key = row.id || `${row.batchId}-${row.enrollmentId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getStudentPayments(profile) {
  if (!profile) return []
  const fromReports = MOCK_PAYMENT_REPORTS.filter((p) => paymentMatchesProfile(p, profile))
  const extras = STUDENT_PAYMENT_EXTRAS[normEmail(profile.email)] || []
  const seen = new Set()
  return [...fromReports, ...extras].filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

export function getStudentFinanceProfile(profile) {
  if (!profile) return null
  return (
    MOCK_STUDENT_PROFILES.find((p) => paymentMatchesProfile(
      { studentName: p.studentName, email: p.email, mobile: p.mobile },
      profile,
    )) || null
  )
}

export function getStudentAttendanceSummary(enrollments, profile) {
  const sessions = profile
    ? STUDENT_ATTENDANCE_SESSIONS[normEmail(profile.email)] || []
    : []
  const withAttendance = enrollments.filter((e) => e.attendance != null)
  const avg =
    withAttendance.length > 0
      ? Math.round(
          withAttendance.reduce((s, e) => s + Number(e.attendance || 0), 0) /
            withAttendance.length,
        )
      : 0
  const avgProgress =
    withAttendance.length > 0
      ? Math.round(
          withAttendance.reduce((s, e) => s + Number(e.progress || 0), 0) /
            withAttendance.length,
        )
      : 0
  return { avgAttendance: avg, avgProgress, sessions, perBatch: enrollments }
}

export function getStudentTestAttempts(profile) {
  if (!profile) return []
  return STUDENT_TEST_ATTEMPTS[normEmail(profile.email)] || []
}

export function getStudentActivity(profile) {
  if (!profile) return []
  return STUDENT_ACTIVITY_EVENTS[normEmail(profile.email)] || []
}

const EMPTY_WALLET = {
  balance: 0,
  lifetimeCredited: 0,
  lifetimeDebited: 0,
  transactions: [],
}

export function getStudentWallet(profile) {
  if (!profile) return { ...EMPTY_WALLET }
  const data = STUDENT_WALLET[normEmail(profile.email)]
  if (!data) return { ...EMPTY_WALLET }
  const transactions = [...(data.transactions || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  )
  return {
    balance: Number(data.balance) || 0,
    lifetimeCredited: Number(data.lifetimeCredited) || 0,
    lifetimeDebited: Number(data.lifetimeDebited) || 0,
    transactions,
  }
}

export function getStudentOrders(profile) {
  if (!profile) return []
  const orders = STUDENT_ORDERS[normEmail(profile.email)] || []
  return [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
}

export function buildStudent360(manageUserId) {
  const profile = getStudentProfile(manageUserId)
  if (!profile || profile.role !== 'student') {
    return { profile: null, isStudent: false }
  }

  const enrollments = getStudentBatchEnrollments(profile)
  const payments = getStudentPayments(profile)
  const financeProfile = getStudentFinanceProfile(profile)
  const tests = getStudentTestAttempts(profile)
  const activity = getStudentActivity(profile)
  const attendance = getStudentAttendanceSummary(enrollments, profile)
  const wallet = getStudentWallet(profile)
  const orders = getStudentOrders(profile)

  const totalPaid = payments.reduce((s, p) => s + Number(p.amountPaid || 0), 0)
  const totalPending = payments.reduce((s, p) => s + Number(p.pendingAmount || 0), 0)
  const lastPayment = payments
    .map((p) => p.paymentDate)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  const testsAttempted = tests.filter((t) => t.status === 'Completed').length
  const ordersCompleted = orders.filter((o) => o.status === 'Completed').length
  const orderTotal = orders.reduce((s, o) => s + Number(o.amountPaid || 0), 0)

  return {
    profile,
    isStudent: true,
    enrollments,
    payments,
    financeProfile,
    tests,
    activity,
    attendance,
    wallet,
    orders,
    stats: {
      totalPaid,
      totalPending,
      lastPaymentDate: lastPayment || null,
      avgAttendance: attendance.avgAttendance,
      avgProgress: attendance.avgProgress,
      testsAttempted,
      batchCount: enrollments.length,
      walletBalance: wallet.balance,
      orderCount: orders.length,
      ordersCompleted,
      orderTotal,
    },
  }
}

export function listStudentUsers() {
  return loadManageUsers().filter((u) => u.role === 'student')
}
