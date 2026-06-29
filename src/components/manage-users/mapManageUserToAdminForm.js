const INITIAL = {
  password: '',
  confirmPassword: '',
  active: true,
  twoFactor: false,
  sessionTimeout: '60',
  loginAlert: true,
}

function findCenterOption(centerOptions, assignedCenter) {
  if (!assignedCenter) return null
  const normalized = String(assignedCenter).trim().toLowerCase()
  return (
    centerOptions.find((c) => String(c.label ?? '').trim().toLowerCase() === normalized) ||
    centerOptions.find((c) => String(c.value ?? '').trim().toLowerCase() === normalized) ||
    null
  )
}

function findRoleOption(roleOptions, row) {
  const roleId = row?.roleId
  if (roleId) {
    const byId = roleOptions.find((r) => String(r.value) === String(roleId))
    if (byId) return byId
  }

  const roleKey = row?.roleKey || row?.roleType
  if (roleKey) {
    const normalizedKey = String(roleKey).trim().toUpperCase()
    const byCode = roleOptions.find((r) => String(r.roleCode || '').trim().toUpperCase() === normalizedKey)
    if (byCode) return byCode
  }

  const role = row?.role
  if (!role) return null
  const normalized = String(role).trim().toLowerCase()
  return (
    roleOptions.find((r) => String(r.label ?? '').trim().toLowerCase() === normalized) ||
    roleOptions.find((r) => String(r.value ?? '').trim().toLowerCase() === normalized) ||
    (normalized === 'admin'
      ? roleOptions.find((r) => String(r.label ?? '').toLowerCase().includes('admin'))
      : null) ||
    null
  )
}

/** Map a User List row into CreateAdminModal form shape (frontend-only prefill). */
export function mapManageUserRowToAdminForm(row, { roleOptions = [], centerOptions = [] } = {}) {
  const centerMatch = findCenterOption(centerOptions, row?.centerId || row?.assignedCenter)
  const roleMatch = findRoleOption(roleOptions, row)

  return {
    fullName: row?.fullName ?? '',
    email: row?.email ?? row?.officialEmail ?? '',
    mobile: row?.phone ?? row?.phoneNumber ?? '',
    employeeId: row?.employeeId ?? row?.userId ?? '',
    roleId: row?.roleId || roleMatch?.value || roleOptions[0]?.value || '',
    centerId: row?.centerId || centerMatch?.value || centerOptions[0]?.value || '',
    password: '',
    confirmPassword: '',
    active: row?.status ? row.status === 'Active' : INITIAL.active,
    twoFactor: INITIAL.twoFactor,
    sessionTimeout: INITIAL.sessionTimeout,
    loginAlert: INITIAL.loginAlert,
  }
}
