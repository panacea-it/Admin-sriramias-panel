import { ROLES } from './roles'

/** Finance module permission keys */
export const FINANCE_PERMS = {
  VIEW: 'finance.view',
  EDIT_PAYMENTS: 'finance.edit_payments',
  APPROVE: 'finance.approve',
  VERIFY: 'finance.verify',
  HEAD_APPROVE: 'finance.head_approve',
  EXPORT: 'finance.export',
  MANAGE_EMI: 'finance.manage_emi',
  MANAGE_GST: 'finance.manage_gst',
  RECEIPTS: 'finance.receipts',
}

const ROLE_FINANCE_PERMS = {
  [ROLES.SUPER_ADMIN]: Object.values(FINANCE_PERMS),
  [ROLES.OPERATION_ADMIN]: [
    FINANCE_PERMS.VIEW,
    FINANCE_PERMS.EDIT_PAYMENTS,
    FINANCE_PERMS.APPROVE,
    FINANCE_PERMS.VERIFY,
    FINANCE_PERMS.HEAD_APPROVE,
    FINANCE_PERMS.EXPORT,
    FINANCE_PERMS.MANAGE_EMI,
    FINANCE_PERMS.RECEIPTS,
  ],
  [ROLES.CENTER_ADMIN]: [
    FINANCE_PERMS.VIEW,
    FINANCE_PERMS.APPROVE,
    FINANCE_PERMS.VERIFY,
    FINANCE_PERMS.EXPORT,
    FINANCE_PERMS.RECEIPTS,
  ],
  [ROLES.COUNSELING_ADMIN]: [
    FINANCE_PERMS.VIEW,
    FINANCE_PERMS.EXPORT,
    FINANCE_PERMS.RECEIPTS,
  ],
}

export function getFinancePermissionsForRole(role) {
  return ROLE_FINANCE_PERMS[role] || []
}

export function roleHasFinancePerm(role, perm) {
  const perms = getFinancePermissionsForRole(role)
  return perms.includes(perm)
}

export const PAYMENT_STATUS_REASONS = [
  'Cash Payment',
  'Payment Received in Another Account',
  'Bank Transfer Verified',
  'UPI Payment Verified',
  'Technical Payment Failure',
  'Payment Received Offline',
  'Management Approval',
  'Technical Issue',
  'Manual Approval',
  'Other',
]

export const EDIT_STATUS_REASONS = [
  'Cash Payment',
  'Payment Received in Another Account',
  'Technical Issue',
  'Bank Transfer Verified',
  'Manual Approval',
  'Other',
]
