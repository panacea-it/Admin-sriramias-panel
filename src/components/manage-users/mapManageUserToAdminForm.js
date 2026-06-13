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

function findRoleOption(roleOptions, role) {
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
  const centerMatch = findCenterOption(centerOptions, row?.assignedCenter)
  const roleMatch = findRoleOption(roleOptions, row?.role)

  return {
    fullName: row?.fullName ?? '',
    email: row?.email ?? '',
    mobile: row?.phone ?? '',
    employeeId: row?.userId ?? row?.employeeId ?? '',
    roleId: roleMatch?.value ?? roleOptions[0]?.value ?? '',
    centerId: centerMatch?.value ?? centerOptions[0]?.value ?? '',
    password: '',
    confirmPassword: '',
    active: row?.status ? row.status === 'Active' : INITIAL.active,
    twoFactor: INITIAL.twoFactor,
    sessionTimeout: INITIAL.sessionTimeout,
    loginAlert: INITIAL.loginAlert,
  }
}
