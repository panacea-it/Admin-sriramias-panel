/** Link course/batch enrollments to payment type and EMI plans without duplicating data. */

const PAYMENT_TYPE_LABELS = {
  Full: 'Full Payment',
  EMI: 'EMI',
  Scholarship: 'Scholarship',
  Offline: 'Offline Payment',
  Loan: 'Loan',
  Partial: 'Partial Payment',
}

function normEmail(v) {
  return String(v || '').trim().toLowerCase()
}

function normPhone(v) {
  return String(v || '').replace(/\D/g, '').slice(-10)
}

function normName(v) {
  return String(v || '').trim().toLowerCase()
}

export function normalizeCourseKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function coursesMatch(courseA, courseB) {
  const a = normalizeCourseKey(courseA)
  const b = normalizeCourseKey(courseB)
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

function batchesMatch(batchA, batchB) {
  if (!batchA || !batchB) return false
  return String(batchA).trim().toLowerCase() === String(batchB).trim().toLowerCase()
}

export function formatModeOfPayment(payment, { order } = {}) {
  if (payment?.paymentType) {
    const type = payment.paymentType
    const discount = Number(payment.discount ?? payment.discountAmount ?? 0)
    if (type === 'Full' && discount > 0) return 'Discounted Payment'
    return PAYMENT_TYPE_LABELS[type] || type
  }
  if (order) {
    if (Number(order.discount) > 0) return 'Discounted Payment'
    return 'Full Payment'
  }
  return null
}

export function isEmiPaymentMode(modeLabel, paymentType) {
  if (paymentType === 'EMI') return true
  return String(modeLabel || '').trim().toLowerCase() === 'emi'
}

function findPaymentsForEnrollment(enrollment, payments = []) {
  return payments.filter((p) => {
    if (!coursesMatch(p.courseName, enrollment.courseName)) return false
    if (enrollment.batchId && p.batchId && !batchesMatch(p.batchId, enrollment.batchId)) return false
    if (enrollment.enrollmentId && p.enrollmentNumber) {
      return String(p.enrollmentNumber).toLowerCase() === String(enrollment.enrollmentId).toLowerCase()
    }
    return true
  })
}

function selectPrimaryPayment(matches = []) {
  if (!matches.length) return null
  const emi = matches.find((p) => p.paymentType === 'EMI')
  if (emi) return emi
  return [...matches].sort(
    (a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0),
  )[0]
}

function findOrderForEnrollment(enrollment, orders = []) {
  return orders.find(
    (o) =>
      (o.orderType === 'Course' || o.orderType === 'course') &&
      coursesMatch(o.courseName, enrollment.courseName),
  )
}

export function profileMatchesFinanceRecord(profile, record) {
  if (!profile || !record) return false
  const pe = normEmail(profile.email)
  const re = normEmail(record.email)
  if (pe && re && pe === re) return true
  const pp = normPhone(profile.phone)
  const rp = normPhone(record.mobile || record.phone)
  if (pp && rp && pp === rp) return true
  const pn = normName(profile.fullName)
  const rn = normName(record.studentName || record.name)
  if (pn && rn && pn === rn) return true
  return false
}

export function findEmiPlanForEnrollment(enrollment, emiPlans = [], profile) {
  return (
    emiPlans.find((plan) => {
      if (!profileMatchesFinanceRecord(profile, plan)) return false
      return coursesMatch(plan.courseName, enrollment.courseName)
    }) || null
  )
}

export function resolveEnrollmentPaymentInfo(enrollment, { payments = [], orders = [], emiPlans = [], profile } = {}) {
  const paymentMatches = findPaymentsForEnrollment(enrollment, payments)
  const primaryPayment = selectPrimaryPayment(paymentMatches)
  const order = findOrderForEnrollment(enrollment, orders)
  const emiPlan = findEmiPlanForEnrollment(enrollment, emiPlans, profile)

  let modeOfPayment = formatModeOfPayment(primaryPayment, { order })
  if (!modeOfPayment && emiPlan) modeOfPayment = 'EMI'
  if (!modeOfPayment) modeOfPayment = 'Not Available'

  const paymentType = primaryPayment?.paymentType || (emiPlan ? 'EMI' : null)

  return {
    modeOfPayment,
    paymentType,
    paymentId: primaryPayment?.id || null,
    emiPlanId: emiPlan?.id || null,
    emiPlan: emiPlan || null,
    isEmi: isEmiPaymentMode(modeOfPayment, paymentType),
  }
}

export function enrichEnrollmentsWithPaymentInfo(enrollments, context = {}) {
  return (enrollments || []).map((enrollment) => ({
    ...enrollment,
    ...resolveEnrollmentPaymentInfo(enrollment, context),
  }))
}
