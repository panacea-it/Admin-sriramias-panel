import { FINANCE_COURSE_COMBOS } from '../data/financeComboData'

function normalizeName(value = '') {
  return String(value).trim().toLowerCase()
}

function paymentMatchesCourse(payment, courseName) {
  const target = normalizeName(courseName)
  const paymentCourse = normalizeName(payment?.courseName || '')
  return paymentCourse === target || paymentCourse.includes(target) || target.includes(paymentCourse)
}

function billedAmount(payment) {
  const fees = Number(payment?.totalFees ?? payment?.totalFee ?? payment?.courseFee ?? 0)
  if (fees > 0) return fees
  return Number(payment?.amountPaid || 0) + Number(payment?.pendingAmount || 0)
}

export function buildTopPerformingCombos(payments = []) {
  return FINANCE_COURSE_COMBOS.map((combo) => {
    const comboPayments = payments.filter((payment) =>
      combo.courses.some((courseName) => paymentMatchesCourse(payment, courseName)),
    )

    const revenueByStudent = {}
    const studentIds = new Set()
    let collection = 0

    comboPayments.forEach((payment) => {
      collection += payment.amountPaid || 0
      const studentKey = payment.studentId || payment.studentName || payment.id
      if (studentKey) {
        studentIds.add(studentKey)
        revenueByStudent[studentKey] = Math.max(revenueByStudent[studentKey] || 0, billedAmount(payment))
      }
    })

    const revenue = Object.values(revenueByStudent).reduce((sum, value) => sum + value, 0)

    return {
      comboName: combo.comboName,
      revenue,
      comboRevenue: revenue,
      collection,
      comboCollection: collection,
      enrolledStudents: studentIds.size,
    }
  }).sort((a, b) => b.collection - a.collection || b.revenue - a.revenue)
}
