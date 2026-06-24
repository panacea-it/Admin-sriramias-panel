import { DEFAULT_PERMISSION_MATRIX, PERMISSION_MODULES } from './adminManagementConfig'

export const DEFAULT_ROLE_ACTIONS = Object.freeze({
  view: true,
  edit: true,
  delete: false,
  disable: true,
})

export function createEmptyLegacyModuleMatrix() {
  return Object.fromEntries(PERMISSION_MODULES.map((m) => [m.id, false]))
}

function nowIso() {
  return new Date().toISOString()
}

function roleFromLegacy({
  id,
  label,
  description,
  modules,
  permissionCount,
  securityLevel,
  iconKey,
  fullAccess = false,
  systemProtected = false,
  enabled = true,
  requiresCenter = true,
  roleActions = DEFAULT_ROLE_ACTIONS,
}) {
  const legacyRow = DEFAULT_PERMISSION_MATRIX[id] || createEmptyLegacyModuleMatrix()
  const legacyModuleMatrix = {}
  for (const m of PERMISSION_MODULES) {
    legacyModuleMatrix[m.id] = !!legacyRow[m.id]
  }
  const t = nowIso()
  return {
    id,
    label,
    description,
    enabled,
    systemProtected,
    fullAccess,
    iconKey,
    securityLevel,
    modules,
    permissionCount,
    requiresCenter,
    roleActions: { ...DEFAULT_ROLE_ACTIONS, ...roleActions },
    legacyModuleMatrix,
    createdAt: t,
    updatedAt: t,
  }
}

/** Initial catalog when no local storage exists — replaces hard-coded admin titles. */
export const SEED_ADMIN_ROLES = [
  roleFromLegacy({
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Full platform control with unrestricted access to every module and security setting.',
    modules: ['All Modules', 'Security', 'Audit Logs', 'System Config'],
    permissionCount: 48,
    securityLevel: 'critical',
    iconKey: 'shield',
    fullAccess: true,
    systemProtected: true,
    requiresCenter: false,
    roleActions: { view: true, edit: true, delete: true, disable: true },
  }),
  roleFromLegacy({
    id: 'center_admin',
    label: 'Center Admin',
    description: 'Manages a single center including students, payments, reports, and operational workflows.',
    modules: ['Payments', 'Reports', 'Students', 'EMIs', 'Coupons'],
    permissionCount: 32,
    securityLevel: 'high',
    iconKey: 'building2',
    roleActions: { view: true, edit: true, delete: false, disable: true },
  }),
  roleFromLegacy({
    id: 'operation_admin',
    label: 'Operation Admin',
    description: 'Handles day-to-day academic and user operations without marketing or system tools.',
    modules: ['Academics', 'Users', 'Enrollments', 'Schedules'],
    permissionCount: 24,
    securityLevel: 'high',
    iconKey: 'wrench',
    roleActions: { view: true, edit: true, delete: false, disable: true },
  }),
  roleFromLegacy({
    id: 'content_admin',
    label: 'Content Admin',
    description: 'Creates and publishes learning content, blogs, and marketing assets.',
    modules: ['Content Library', 'Blogs', 'Resources', 'Media'],
    permissionCount: 18,
    securityLevel: 'medium',
    iconKey: 'fileText',
    roleActions: { view: true, edit: true, delete: false, disable: false },
  }),
  roleFromLegacy({
    id: 'mentor_admin',
    label: 'Mentor Admin',
    description: 'Supports mentors with student reports, feedback, and evaluation workflows.',
    modules: ['Student Reports', 'Feedback', 'Copy Evaluation'],
    permissionCount: 16,
    securityLevel: 'medium',
    iconKey: 'graduationCap',
    roleActions: { view: true, edit: true, delete: false, disable: true },
  }),
  roleFromLegacy({
    id: 'teacher_admin',
    label: 'Faculty Admin',
    description: 'Manages class materials, PDFs, and teaching documents for assigned batches.',
    modules: ['Class PDFs', 'Documents', 'Assignments'],
    permissionCount: 14,
    securityLevel: 'medium',
    iconKey: 'bookOpen',
    roleActions: { view: true, edit: true, delete: false, disable: true },
  }),
  roleFromLegacy({
    id: 'counseling_admin',
    label: 'Counseling Admin',
    description: 'Owns sales pipeline, counseling sessions, and failed payment recovery.',
    modules: ['Sales', 'Failed Payment List', 'Follow-ups'],
    permissionCount: 12,
    securityLevel: 'medium',
    iconKey: 'heartHandshake',
    roleActions: { view: true, edit: true, delete: false, disable: true },
  }),
]
