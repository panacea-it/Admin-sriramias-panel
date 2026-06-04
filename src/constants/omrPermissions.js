import { ROLES } from './roles'

/** OMR module permission keys */
export const OMR_PERMS = {
  VIEW: 'omr.view',
  CREATE: 'omr.create',
  EDIT: 'omr.edit',
  DELETE: 'omr.delete',
  UPLOAD_RESULT: 'omr.upload_result',
  DOWNLOAD_RESULT: 'omr.download_result',
  DELETE_RESULT: 'omr.delete_result',
}

export const OMR_PERMISSION_LABELS = {
  [OMR_PERMS.VIEW]: 'View OMR Module',
  [OMR_PERMS.CREATE]: 'Create OMR Exam',
  [OMR_PERMS.EDIT]: 'Edit OMR Exam',
  [OMR_PERMS.DELETE]: 'Delete OMR Exam',
  [OMR_PERMS.UPLOAD_RESULT]: 'Upload Result Sheet',
  [OMR_PERMS.DOWNLOAD_RESULT]: 'Download Result Sheet',
  [OMR_PERMS.DELETE_RESULT]: 'Delete Result Sheet',
}

const ALL_OMR_PERMS = Object.values(OMR_PERMS)

const ROLE_OMR_PERMS = {
  [ROLES.SUPER_ADMIN]: ALL_OMR_PERMS,
  [ROLES.OPERATION_ADMIN]: ALL_OMR_PERMS,
  [ROLES.TEACHER_ADMIN]: [
    OMR_PERMS.VIEW,
    OMR_PERMS.CREATE,
    OMR_PERMS.EDIT,
    OMR_PERMS.UPLOAD_RESULT,
    OMR_PERMS.DOWNLOAD_RESULT,
  ],
  [ROLES.CENTER_ADMIN]: [
    OMR_PERMS.VIEW,
    OMR_PERMS.UPLOAD_RESULT,
    OMR_PERMS.DOWNLOAD_RESULT,
  ],
}

export function getOmrPermissionsForRole(role) {
  return ROLE_OMR_PERMS[role] || []
}

export function roleHasOmrPerm(role, perm) {
  return getOmrPermissionsForRole(role).includes(perm)
}
