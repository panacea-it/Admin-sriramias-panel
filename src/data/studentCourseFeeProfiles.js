import { FINANCE_COURSES, MOCK_PAYMENT_REPORTS } from './financeMockData'
import { FINANCE_BATCHES } from '../constants/financeConstants'
import { VERIFICATION_STUDENT_OPTIONS } from './financeVerificationData'

const COURSE_DEFAULTS = {
  'CRS-101': { totalCourseFee: 120000, discount: 5000, scholarship: 0, duration: '12 months', gstPercent: 18 },
  'CRS-102': { totalCourseFee: 150000, discount: 10000, scholarship: 15000, duration: '18 months', gstPercent: 18 },
  'CRS-103': { totalCourseFee: 85000, discount: 0, scholarship: 5000, duration: '10 months', gstPercent: 18 },
  'CRS-104': { totalCourseFee: 95000, discount: 8000, scholarship: 0, duration: '6 months', gstPercent: 18 },
}

function applicationId(studentId) {
  return `APP-${String(studentId || '').replace(/\D/g, '').slice(-6).padStart(6, '0')}`
}

/**
 * Resolves student + course financial snapshot for offline payment / EMI setup.
 * API-ready: replace body with GET /finance/students/:id/courses/:courseId/fees
 */
export function getStudentCourseFinancials(studentId, courseId) {
  if (!studentId || !courseId) return null

  const student = VERIFICATION_STUDENT_OPTIONS.find((s) => s.studentId === studentId)
  const course = FINANCE_COURSES.find((c) => c.id === courseId)
  const report = MOCK_PAYMENT_REPORTS.find(
    (p) => p.studentId === studentId && p.courseId === courseId,
  )
  const defaults = COURSE_DEFAULTS[courseId] || {
    totalCourseFee: 100000,
    discount: 0,
    scholarship: 0,
    duration: '12 months',
    gstPercent: 18,
  }

  const totalCourseFee = report?.totalFees ?? defaults.totalCourseFee
  const discount = defaults.discount
  const scholarship = defaults.scholarship
  const gstPercent = defaults.gstPercent
  const subtotal = Math.max(0, totalCourseFee - discount - scholarship)
  const gst = Math.round((subtotal * gstPercent) / 100)
  const finalPayable = subtotal + gst
  const amountPaid = report?.amountPaid ?? 0
  const pendingAmount = Math.max(0, finalPayable - amountPaid)

  const batchIdx = studentId.charCodeAt(studentId.length - 1) % FINANCE_BATCHES.length

  return {
    studentId,
    studentName: student?.studentName || report?.studentName || 'Student',
    applicationId: applicationId(studentId),
    centerName: student?.centerName || report?.branch || '—',
    batchName: report?.batchName || FINANCE_BATCHES[batchIdx]?.name || 'Morning Batch 2026',
    courseId,
    courseName: course?.name || report?.courseName || '—',
    courseType: course?.type || report?.courseType || 'Offline',
    courseDuration: defaults.duration,
    totalCourseFee,
    discount,
    scholarship,
    gst,
    gstPercent,
    finalPayable,
    amountPaid,
    pendingAmount,
    mobile: report?.mobile || '',
    email: report?.email || '',
  }
}

export async function fetchStudentCourseFinancials(studentId, courseId) {
  return getStudentCourseFinancials(studentId, courseId)
}
