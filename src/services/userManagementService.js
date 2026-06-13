import api from '../config/api'
import { throwApiError } from '../utils/apiError'

function normalizeStatus(raw) {
  const value = String(raw || 'ACTIVE').trim().toUpperCase()
  if (value === 'INACTIVE' || value === 'DISABLED') return 'In Active'
  return 'Active'
}

function normalizeRole(raw, item = {}) {
  const rawValue = String(raw || '').trim().toLowerCase()
  const labelValue = String(
    item?.role || item?.roleTitle || item?.userType || item?.roleType || item?.roleKey || rawValue || '',
  )
    .trim()
    .toLowerCase()
  const codeValue = String(item?.roleType || item?.userType || item?.roleKey || rawValue || '')
    .trim()
    .toUpperCase()

  if (labelValue.includes('student') || codeValue.includes('STUDENT')) return 'student'
  if (labelValue.includes('teacher') || labelValue.includes('faculty') || codeValue === 'TEA') return 'faculty'
  if (labelValue.includes('mentor') && labelValue.includes('admin')) return 'mentor_admin'
  if (labelValue.includes('counselor') || labelValue.includes('parent')) return 'counselor'
  if (labelValue.includes('employee') || codeValue.includes('EMPLOYEE')) return 'employee'
  if (labelValue.includes('support') || labelValue.includes('staff')) return 'support_staff'
  if (labelValue.includes('admin') || codeValue.includes('ADMIN')) return 'admin'

  return labelValue || rawValue || 'employee'
}

function isStudentRecord(item) {
  const roleValue = String(item?.roleKey || item?.roleType || item?.userType || item?.role || '')
    .trim()
    .toLowerCase()

  const recordType = String(item?.recordType || item?.userType || '').trim().toUpperCase()

  return roleValue === 'student' || recordType === 'STUDENT' || roleValue.includes('student')
}

function extractRecordId(item) {
  const candidates = [item?.id, item?._id, item?.userId, item?.user_id, item?.recordId]

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim()
    if (value) return value
  }

  return ''
}

function extractStudentId(item) {
  const candidates = [item?.studentId, item?.studentRecordId, item?.studentRecord?.id]

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim()
    if (value) return value
  }

  return ''
}

function mapApiUserToRow(item) {
  if (!item || typeof item !== 'object') return null

  const roleKey = String(item.roleKey || item.roleType || item.userType || item.role || '').trim()
  const role = normalizeRole(roleKey, item)
  const isStudent = isStudentRecord(item) || role === 'student'
  const studentId = extractStudentId(item)
  const recordId = extractRecordId(item)
  const status = normalizeStatus(item.status)
  const studentDetails = item.studentDetails && typeof item.studentDetails === 'object' ? item.studentDetails : {}

  return {
    id: recordId,
    studentRecordId: String(item.studentRecordId || '').trim() || null,
    fullName: String(item.fullName || item.name || '').trim() || '—',
    email: String(item.email || item.officialEmail || '').trim() || '—',
    phone: String(item.phoneNumber || item.contactNumber || '').trim() || '—',
    role,
    roleKey,
    roleType: String(item.roleType || item.userType || '').trim(),
    roleLabel: String(item.role || item.roleTitle || item.userType || '').trim() || 'User',
    userId: isStudent ? studentId || String(item.userId || '').trim() || '' : '',
    assignedCenter: String(item.centerName || item.center || item.assignedCenter || '-').trim() || '-',
    centerId: String(item.centerId || '').trim() || null,
    status,
    joinedAt: item.joinedAt || item.joinedDate || item.createdAt || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || item.updated || item.modifiedAt || null,
    profileImage: String(item.profileImage || item.avatar || '').trim() || null,
    parentName: String(studentDetails.parentName || item.parentName || '').trim() || null,
    parentPhone:
      String(studentDetails.parentMobile || studentDetails.parentPhone || item.parentPhone || '').trim() || null,
    permissions: item.permissions || null,
    studentDetails,
    recordType: item.recordType || null,
    userType: item.userType || null,
    raw: item,
  }
}

export function normalizeUnifiedUsersResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object'
      ? data.data
      : data

  const itemsRaw =
    payload?.users ||
    payload?.items ||
    payload?.results ||
    data?.users ||
    data?.items ||
    (Array.isArray(payload)
      ? payload
      : Array.isArray(data?.data)
        ? data.data
        : null)

  const singleRecordCandidate =
    (payload && typeof payload === 'object' && !Array.isArray(payload) && (payload.id || payload.studentRecordId || payload.studentId || payload.fullName || payload.email || payload.roleType || payload.userType))
      ? payload
      : null

  const items = (Array.isArray(itemsRaw)
    ? itemsRaw
    : singleRecordCandidate
      ? [singleRecordCandidate]
      : [])
    .map((row) => mapApiUserToRow(row))
    .filter(Boolean)

  const pagination = payload?.pagination || data?.pagination || payload?.meta || data?.meta || {}
  const total =
    pagination.total ??
    payload?.total ??
    data?.total ??
    payload?.count ??
    data?.count ??
    items.length
  const totalPages =
    pagination.totalPages ??
    payload?.totalPages ??
    data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = pagination.page ?? payload?.page ?? data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
    limit: Number(payload?.limit ?? data?.limit ?? limit) || limit,
  }
}

function mapStatusFilterToApi(statusFilter) {
  const normalized = String(statusFilter || '').trim().toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'INACTIVE' || normalized === 'DISABLED') {
    return normalized
  }
  if (normalized === 'IN ACTIVE') return 'INACTIVE'
  return ''
}

function mapRoleFilterToApi(roleFilter) {
  const normalized = String(roleFilter ?? 'ALL').trim()

  if (!normalized || normalized.toUpperCase() === 'ALL') return 'ALL'

  const roleCode = normalized.toUpperCase()

  if (
    ['STUDENT', 'FACULTY', 'EMPLOYEE', 'ADMIN', 'COUNSELOR', 'SUPPORT_STAFF'].includes(roleCode)
  ) {
    return roleCode
  }

  return normalized
}

export async function getUserById(userId) {
  try {
    const response = await api.get(`/api/admin/users/${encodeURIComponent(userId)}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createStudentUser(payload = {}) {
  try {
    const response = await api.post('/api/admin/users', payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateUser(userId, payload = {}, type = 'USER') {
  try {
    const response = await api.put(`/api/admin/users/${encodeURIComponent(userId)}`, payload, {
      params: { type },
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateUserStatus(userId, status = true) {
  try {
    const response = await api.patch(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      status,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteUser(userId) {
  try {
    const response = await api.delete(`/api/admin/users/${encodeURIComponent(userId)}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getUnifiedUsers(params = {}) {
  try {
    const rawStatus = mapStatusFilterToApi(params.status)
    const rawRole = mapRoleFilterToApi(params.role)
    const rawCenter = String(params.center || 'ALL').trim()

    const query = {
      page: Number(params.page ?? 1) || 1,
      limit: Number(params.limit ?? 10) || 10,
      search: String(params.search ?? '').trim(),
      role: rawRole || 'ALL',
      center: rawCenter || 'ALL',
      status: rawStatus || '',
      userType: String(params.userType || 'ALL').trim().toUpperCase() || 'ALL',
      sortBy: String(params.sortBy || 'createdAt').trim() || 'createdAt',
      sortOrder: String(params.sortOrder || 'desc').trim() || 'desc',
    }

    const response = await api.get('/api/admin/users', {
      params: query,
    })

    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
