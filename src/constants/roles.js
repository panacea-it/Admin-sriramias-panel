/** Canonical role ids — align with adminRolesSeed / IAM catalog */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CENTER_ADMIN: 'center_admin',
  OPERATION_ADMIN: 'operation_admin',
  CONTENT_ADMIN: 'content_admin',
  MENTOR_ADMIN: 'mentor_admin',
  TEACHER_ADMIN: 'teacher_admin',
  COUNSELING_ADMIN: 'counseling_admin',
}

export const ALL_ROLES = Object.values(ROLES)

/** Roles allowed to move students between batches (Admin + Branch/Center Manager) */
export const STUDENT_MOVE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.OPERATION_ADMIN,
  ROLES.CENTER_ADMIN,
]

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.CENTER_ADMIN]: 'Center Admin',
  [ROLES.OPERATION_ADMIN]: 'Operation Admin',
  [ROLES.CONTENT_ADMIN]: 'Content Admin',
  [ROLES.MENTOR_ADMIN]: 'Mentor Admin',
  [ROLES.TEACHER_ADMIN]: 'Faculty Admin',
  [ROLES.COUNSELING_ADMIN]: 'Counseling Admin',
}

/** Login page role picker (display order) */
export const LOGIN_ROLE_OPTIONS = [
  { id: ROLES.SUPER_ADMIN, label: 'Super Admin', short: 'Full platform access' },
  { id: ROLES.CENTER_ADMIN, label: 'Center Admin', short: 'Center operations & reports' },
  { id: ROLES.OPERATION_ADMIN, label: 'Operation Admin', short: 'Courses & batch ops' },
  { id: ROLES.CONTENT_ADMIN, label: 'Content Admin', short: 'Blogs & learning content' },
  { id: ROLES.MENTOR_ADMIN, label: 'Mentor Admin', short: 'Mentor review & analytics' },
  { id: ROLES.TEACHER_ADMIN, label: 'Faculty Admin', short: 'Classes & materials' },
  { id: ROLES.COUNSELING_ADMIN, label: 'Counseling Admin', short: 'Leads & admissions' },
]
