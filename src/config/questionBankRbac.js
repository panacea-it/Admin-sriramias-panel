import { ROLES } from '../constants/roles'

export const QUESTION_BANK_ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.CENTER_ADMIN]

export function canAccessQuestionBankRoute(role) {
  return QUESTION_BANK_ADMIN_ROLES.includes(role)
}
