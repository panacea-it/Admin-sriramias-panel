/** Payment Attempt Logs — API ↔ UI mapping (PAYMENT_ATTEMPT_LOGS_API_GUIDE.md) */

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_REMARKS_PAGE_SIZE = 10

/**
 * @param {object} params UI filter + pagination state
 */
export function buildPaymentAttemptDashboardBody(params = {}) {
  const {
    centerId = null,
    search = '',
    gateway = 'ALL',
    failureReason = 'ALL',
    assignmentStatus = 'ALL',
    startDate = null,
    endDate = null,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    remarksPage = 1,
    remarksLimit = DEFAULT_REMARKS_PAGE_SIZE,
  } = params

  return {
    centerId: centerId || null,
    search: String(search || '').trim(),
    gateway: gateway || 'ALL',
    failureReason: failureReason || 'ALL',
    assignmentStatus: assignmentStatus || 'ALL',
    startDate: startDate || null,
    endDate: endDate || null,
    page: Number(page) || 1,
    limit: Number(limit) || DEFAULT_PAGE_SIZE,
    remarksPage: Number(remarksPage) || 1,
    remarksLimit: Number(remarksLimit) || DEFAULT_REMARKS_PAGE_SIZE,
  }
}

export function mapPaymentAttemptRow(row) {
  if (!row) return null
  return {
    ...row,
    id: row.attemptId,
    attemptId: row.attemptId,
    student: row.studentName,
    mobile: row.mobile,
    email: row.email,
    course: row.courseName,
    center: row.centerName,
    centerName: row.centerName,
    failureCategory: row.failureReasonLabel,
    failureReason: row.failureReason,
    failureMessage: row.failureMessage,
    lastAttemptDate: row.lastAttemptAt,
    counselorName: row.assignedCounselorName || '',
    counselorId: row.assignedCounselorId,
    isAssigned: Boolean(row.isAssigned),
    remarksCount: row.remarksCount ?? 0,
  }
}

export function mapCounselorRemarkRow(row) {
  if (!row) return null
  return {
    ...row,
    id: row.remarkId,
    remarkId: row.remarkId,
    center: row.center,
    student: row.student,
    counselor: row.assignedCounselor,
    subject: row.remarkSubject,
    remark: row.remarkPreview,
    createdAt: row.createdDate,
    createdBy: row.createdBy,
    createdByRole: row.createdByRole,
  }
}

export function mapAttemptDetailsToView(data) {
  if (!data) return null
  return {
    ...mapPaymentAttemptRow({
      ...data,
      mobile: data.mobileNumber,
      studentName: data.studentName,
    }),
    mobile: data.mobileNumber,
    mobileNumber: data.mobileNumber,
    studentType: data.studentType,
    gatewayPaymentId: data.gatewayPaymentId,
    gatewayOrderId: data.gatewayOrderId,
    assignedAt: data.assignedAt,
    attemptHistory: data.attemptHistory || [],
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export function mapRemarkDetailsToView(data) {
  if (!data) return null
  return {
    id: data.remarkId,
    remarkId: data.remarkId,
    attemptId: data.attemptId,
    center: data.center,
    centerId: data.centerId,
    student: data.studentName,
    studentId: data.studentId,
    counselor: data.assignedCounselor,
    assignedCounselorId: data.assignedCounselorId,
    subject: data.remarkSubject,
    failureAnalysis: data.failureAnalysis,
    remark: data.counselorRemark,
    createdAt: data.createdDate,
    createdBy: data.createdBy,
    createdByRole: data.createdByRole,
  }
}

export function normalizePaymentAttemptDashboardResponse(data) {
  const paymentAttempts = data?.paymentAttempts || {}
  const remarks = data?.remarks || {}

  return {
    assignedCounselorCount: data?.assignedCounselorCount ?? 0,
    paymentAttempts: {
      page: paymentAttempts.page ?? 1,
      limit: paymentAttempts.limit ?? DEFAULT_PAGE_SIZE,
      total: paymentAttempts.total ?? 0,
      totalPages: paymentAttempts.totalPages ?? 1,
      items: (paymentAttempts.items || []).map(mapPaymentAttemptRow).filter(Boolean),
    },
    remarks: {
      page: remarks.page ?? 1,
      limit: remarks.limit ?? DEFAULT_REMARKS_PAGE_SIZE,
      total: remarks.total ?? 0,
      totalPages: remarks.totalPages ?? 1,
      items: (remarks.items || []).map(mapCounselorRemarkRow).filter(Boolean),
    },
  }
}

export function buildControlledPagination({ page, pageSize, totalCount, totalPages, setPage, setPageSize }) {
  const safePage = Math.min(Math.max(1, page), totalPages || 1)
  const startIndex = totalCount === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)
  return {
    page: safePage,
    pageSize,
    totalItems: totalCount,
    totalPages: totalPages || 1,
    startIndex,
    endIndex,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  }
}
