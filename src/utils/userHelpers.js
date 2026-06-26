/** Student row → student APIs */
export function isStudentRow(row) {
  if (!row) return false
  const recordType = String(row.recordType || '').trim().toUpperCase()
  if (recordType === 'ADMIN') return false
  if (row.roleType) {
    return String(row.roleType).trim().toUpperCase() === 'STUDENT'
  }
  return String(row.role ?? '').trim().toLowerCase() === 'student'
}

export function isAdminRow(row) {
  return String(row?.recordType || '').trim().toUpperCase() === 'ADMIN'
}

export function getRecordTypeQuery(row) {
  const recordType = String(row?.recordType || 'USER').trim().toUpperCase()
  if (recordType === 'STUDENT' || recordType === 'USER') return recordType
  if (recordType === 'ADMIN') return 'ADMIN'
  return recordType
}

export function mapApiStatusToUi(status) {
  if (typeof status === 'boolean') return status ? 'Active' : 'In Active'
  const normalized = String(status ?? '').trim().toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'ENABLED') return 'Active'
  if (normalized === 'INACTIVE' || normalized === 'DISABLED') return 'In Active'
  return 'In Active'
}

export function mapUiStatusToApi(statusFilter) {
  const normalized = String(statusFilter || '').trim().toLowerCase()
  if (!normalized || normalized === 'all') return ''
  if (normalized === 'in active' || normalized === 'inactive' || normalized === 'deactivated') {
    return 'INACTIVE'
  }
  if (normalized === 'active') return 'ACTIVE'
  return ''
}

export function mapApiUserListRow(data) {
  if (!data || typeof data !== 'object') return null

  const id = data.id || data._id
  if (!id) return null

  const permissions = data.permissions || {}
  const studentDetails =
    data.studentDetails && typeof data.studentDetails === 'object' ? data.studentDetails : {}

  return {
    id: String(id),
    studentRecordId: data.studentRecordId ? String(data.studentRecordId) : '',
    studentId: data.studentId ? String(data.studentId) : '',
    fullName: String(data.fullName || data.name || '').trim() || '—',
    email: String(data.email || data.officialEmail || '').trim(),
    phoneNumber: String(
      data.phoneNumber || data.mobile || data.phone || data.contactNumber || '',
    ).trim(),
    phone: String(
      data.phoneNumber || data.mobile || data.phone || data.contactNumber || '',
    ).trim(),
    role: String(data.role || data.roleTitle || '').trim() || '—',
    roleType: String(data.roleType || data.userType || '').trim(),
    roleKey: String(data.roleKey || '').trim(),
    roleId: data.roleId ? String(data.roleId) : '',
    center: String(data.center || data.centerName || data.assignedCenter || '').trim() || '—',
    assignedCenter: String(data.center || data.centerName || data.assignedCenter || '').trim() || '—',
    centerId: String(data.centerId || '').trim(),
    status: mapApiStatusToUi(data.status ?? data.isActive ?? data.accountStatus),
    userType: String(data.userType || '').trim(),
    recordType: String(data.recordType || '').trim().toUpperCase(),
    joinedDate: data.joinedDate || null,
    joinedAt: data.joinedDate || data.joinedAt || data.createdAt || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    parentName: String(studentDetails.parentName || data.parentName || '').trim(),
    parentEmail: String(studentDetails.parentEmail || data.parentEmail || '').trim(),
    parentMobile: String(studentDetails.parentMobile || data.parentMobile || '').trim(),
    parentPhone: String(studentDetails.parentMobile || data.parentMobile || '').trim(),
    studentDetails,
    userId: String(data.studentId || data.userId || '').trim(),
    profileImage: data.profileImage || data.avatar || '',
    permissions: {
      canView: permissions.canView !== false,
      canEdit: Boolean(permissions.canEdit),
      canDelete: Boolean(permissions.canDelete),
      editDisabledReason: permissions.editDisabledReason || data.editDisabledReason || null,
      deleteDisabledReason: permissions.deleteDisabledReason || data.deleteDisabledReason || null,
    },
    editDisabledReason: permissions.editDisabledReason || data.editDisabledReason || '',
    deleteDisabledReason: permissions.deleteDisabledReason || data.deleteDisabledReason || '',
    _raw: data,
  }
}

export function normalizeUserListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object'
      ? data.data
      : data

  const nested = payload?.data && typeof payload.data === 'object' ? payload.data : payload

  const itemsRaw = Array.isArray(nested?.data)
    ? nested.data
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.users)
          ? payload.users
          : []

  const items = itemsRaw.map((row) => mapApiUserListRow(row)).filter(Boolean)
  const total = nested?.total ?? payload?.total ?? items.length
  const totalPages =
    nested?.totalPages ?? payload?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)

  return {
    items,
    total,
    totalPages,
    page: nested?.page ?? payload?.page ?? page,
    limit: nested?.limit ?? payload?.limit ?? limit,
    count: nested?.count ?? payload?.count ?? items.length,
    module: nested?.module ?? payload?.module ?? null,
  }
}

export function normalizeUserDetailResponse(data) {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data
  const summary = payload?.summary ?? payload
  const row = mapApiUserListRow(summary)

  return {
    ...payload,
    summary: row,
    permissions: payload?.permissions || row?.permissions || {},
    recordType: payload?.recordType || row?.recordType,
    userType: payload?.userType || row?.userType,
    roleType: payload?.roleType || row?.roleType,
    data: payload?.data ?? null,
  }
}

export function buildUserListParams({
  page = 1,
  limit = 10,
  search = '',
  roleFilter = 'all',
  centerFilter = 'all',
  statusFilter = 'all',
  recordTypeFilter = 'all',
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  const params = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: String(sortBy || 'createdAt').trim() || 'createdAt',
    sortOrder: String(sortOrder || 'desc').trim() || 'desc',
  }

  const trimmedSearch = String(search || '').trim()
  if (trimmedSearch) params.search = trimmedSearch

  params.role =
    !roleFilter || roleFilter === 'all' ? 'ALL' : String(roleFilter).trim()

  params.center =
    !centerFilter || centerFilter === 'all' ? 'ALL' : String(centerFilter).trim()

  const status = mapUiStatusToApi(statusFilter)
  if (status) params.status = status

  const recordType = String(recordTypeFilter || 'all').trim().toUpperCase()
  if (recordType && recordType !== 'ALL') {
    params.recordType = recordType
  }

  return params
}

export function normalizeRoleDropdownOptions(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.data)
      ? data.data.data
      : Array.isArray(data?.data)
        ? data.data
        : []

  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      label: String(item.label || item.roleTitle || '').trim(),
      value: String(item.value || item._id || item.id || '').trim(),
      roleCode: String(item.roleCode || '').trim(),
      status: item.status ? String(item.status).trim().toUpperCase() : undefined,
    }))
    .filter((opt) => opt.label && opt.value)
}

export function normalizeCenterFilterOptions(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.data)
      ? data.data.data
      : Array.isArray(data?.data)
        ? data.data
        : []

  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      label: String(item.label || item.centerName || '').trim(),
      value: String(item.value || item._id || item.id || '').trim(),
      centerCode: item.centerCode ? String(item.centerCode) : undefined,
      city: item.city ? String(item.city) : undefined,
      state: item.state ? String(item.state) : undefined,
    }))
    .filter((opt) => opt.label && opt.value)
    .filter((opt) => opt.value.toUpperCase() !== 'ALL')
}

export function normalizeCenterFormDropdown(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : []

  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      value: String(item._id || item.id || '').trim(),
      label: String(item.centerName || item.name || item.label || '').trim(),
      centerCode: item.centerCode ? String(item.centerCode) : undefined,
      city: item.city ? String(item.city) : undefined,
      state: item.state ? String(item.state) : undefined,
    }))
    .filter((opt) => opt.value && opt.label)
}

export function normalizeCreateRoleOptions(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.data)
      ? data.data.data
      : Array.isArray(data?.data)
        ? data.data
        : []

  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      value: String(item.value || item.roleCode || '').trim(),
      label: String(item.label || item.roleTitle || '').trim(),
      roleCode: String(item.roleCode || item.value || '').trim(),
      kind: String(item.kind || '').trim(),
      locked: Boolean(item.locked),
    }))
    .filter((opt) => opt.label || opt.value)
}

export function normalizeModuleConfig(data) {
  const payload =
    data?.data?.data && typeof data.data.data === 'object'
      ? data.data.data
      : data?.data && typeof data.data === 'object'
        ? data.data
        : data

  return payload || {}
}

export function roleBadgeClassName(roleType) {
  const palette = [
    'bg-[#EEF5FF] text-[#1D72B8] ring-[#4CA6E8]/30',
    'bg-violet-50 text-violet-700 ring-violet-200/60',
    'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
    'bg-orange-50 text-orange-700 ring-orange-200/60',
    'bg-[#F5F7FB] text-[#667085] ring-[#E7ECF5]',
    'bg-amber-50 text-amber-700 ring-amber-200/60',
  ]
  const key = String(roleType || 'default')
  const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

export function mapApiErrorsToForm(errors) {
  if (!Array.isArray(errors)) return {}
  return errors.reduce((acc, item) => {
    const field = item?.field
    const message = item?.message
    if (field && message) acc[field] = message
    return acc
  }, {})
}

export function formatManageUserJoinDate(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toISOString().slice(0, 10)
}
