import axiosInstance from './axiosInstance'

async function withRetry(apiCall, retries = 3, delay = 1500) {
  try {
    return await apiCall()
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      console.warn(`[Rate Limited] Retrying API call in ${delay}ms... (${retries} retries left)`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return withRetry(apiCall, retries - 1, delay * 1.5)
    }
    throw error
  }
}

function formatEnquiryDateDisplay(isoOrDate) {
  if (!isoOrDate) return '—'
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function extractCounselorId(assignedCounselorId) {
  if (!assignedCounselorId) return ''
  if (typeof assignedCounselorId === 'object') {
    return assignedCounselorId._id || ''
  }
  return String(assignedCounselorId)
}

export function mapEnquiryRow(row) {
  if (!row) return null

  const counselorIdStr = extractCounselorId(row.assignedCounselorId)
  const createdAt = row.createdAt || new Date().toISOString()

  return {
    id: row._id,
    student: row.name || row.fullName || 'Unknown Student',
    email: row.email || '—',
    phone: row.phone || row.mobileNumber || '—',
    center: row.center?.centerName || row.centerName || '—',
    centerId: row.center?._id || row.centerId || '',
    enquiryType: row.enquiryType || '—',
    sourcePage: row.sourcePage || row.sourcePageName || 'Other',
    enquiryDate: formatEnquiryDateDisplay(createdAt),
    enquiryDateRaw: createdAt,
    assignedCounselor: counselorIdStr,
    assignedCounselorName: row.assignedCounselorName || '',
    leadStatus: row.leadStatus || 'NEW',
    recordStatus: row.status || 'ACTIVE',
    courseName:
      row.courseName ||
      row.course?.courseName ||
      row.course?.title ||
      '—',
    targetAttemptYear: row.targetAttemptYear || row.targetYear || '',
    expectation: row.expectation || '',
    source: row.source || '',
  }
}

function formatDateParam(date) {
  if (!date) return ''
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function resolveSourceFilter(type) {
  if (type === 'Admission') return 'main'
  if (type === 'Demo') return 'demo'
  if (type === 'Book Session') return 'book_session'
  return ''
}

/**
 * Filter dropdown options (centers, lead statuses, sources)
 * POST /api/admin/enquiries/filter-options
 */
export async function fetchEnquiryFilterOptions(signal) {
  const response = await withRetry(() =>
    axiosInstance.post('/admin/enquiries/filter-options', {}, { signal }),
  )
  return (
    response?.data?.data || {
      centers: [],
      leadStatuses: [],
      recordStatuses: [],
      sources: [],
    }
  )
}

/**
 * Centers dropdown (fallback)
 * GET /api/admin/centers/dropdown
 */
export async function fetchCentersDropdown(signal) {
  const response = await withRetry(() =>
    axiosInstance.get('/admin/centers/dropdown', { signal }),
  )
  return response?.data?.data || []
}

/**
 * Paginated enquiries list
 * POST /api/admin/enquiries/list
 */
export async function fetchEnquiries(
  {
    page = 1,
    limit = 10,
    search = '',
    centerId = '',
    type = 'all',
    date = null,
  } = {},
  signal,
) {
  const formattedDate = formatDateParam(date)
  const backendSource = resolveSourceFilter(type)

  const payload = {
    page,
    limit,
    search: search.trim(),
    centerId: centerId && centerId !== 'all' ? centerId : '',
    source: backendSource,
  }

  if (formattedDate) {
    payload.fromDate = formattedDate
    payload.toDate = formattedDate
  }

  const response = await withRetry(() =>
    axiosInstance.post('/admin/enquiries/list', payload, { signal }),
  )

  const rows = response?.data?.data?.enquiries || []
  const pagination = response?.data?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  return {
    data: rows.map(mapEnquiryRow).filter(Boolean),
    pagination,
  }
}

/**
 * Dashboard / summary stats
 * GET /api/admin/enquiries/stats
 */
export async function fetchEnquiryStats(centerId = '', signal) {
  const response = await withRetry(() =>
    axiosInstance.get('/admin/enquiries/stats', {
      params: { center: centerId && centerId !== 'all' ? centerId : undefined },
      signal,
    }),
  )

  const stats = response?.data?.data?.stats || {}

  return {
    total: stats.totalEnquiries ?? stats.total ?? 0,
    newThisWeek: stats.newThisWeek ?? 0,
    conversionRate:
      typeof stats.conversionRate === 'number'
        ? `${stats.conversionRate}%`
        : stats.conversionRate || '0%',
    actionPending: stats.actionPending ?? stats.pending ?? 0,
  }
}

/**
 * Single enquiry details
 * POST /api/admin/enquiries/details
 */
export async function fetchEnquiryDetails(enquiryId, signal) {
  const response = await withRetry(() =>
    axiosInstance.post('/admin/enquiries/details', { enquiryId }, { signal }),
  )
  const enquiry = response?.data?.data?.enquiry
  return mapEnquiryRow(enquiry)
}

/**
 * Update lead status
 * PUT /api/admin/enquiries/status
 */
export async function updateEnquiryLeadStatus(enquiryId, leadStatus) {
  const response = await axiosInstance.put('/admin/enquiries/status', {
    enquiryId,
    leadStatus,
  })
  return mapEnquiryRow(response?.data?.data?.enquiry)
}

/**
 * Counselors for a center
 * POST /api/crm/enquiries/counselors-by-center
 */
export async function fetchCounselorsByCenter(centerId, signal) {
  if (!centerId) return []
  const response = await withRetry(() =>
    axiosInstance.post(
      '/crm/enquiries/counselors-by-center',
      { centerId },
      { signal },
    ),
  )
  return response?.data?.data?.counselors || []
}

/**
 * Assign counselor to enquiry
 * POST /api/admin/enquiries/assign-counselor
 */
export async function assignEnquiryCounselor(enquiryId, counselorId) {
  const response = await axiosInstance.post('/admin/enquiries/assign-counselor', {
    enquiryId,
    counselorId,
  })
  return mapEnquiryRow(response?.data?.data?.enquiry)
}
