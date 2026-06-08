import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  FINANCE_PERMS,
  getFinancePermissionsForRole,
  roleHasFinancePerm,
} from '../constants/financePermissions'
import { roleHasFullAccess } from '../config/rbacAccess'

export function useFinancePermissions() {
  const { user } = useAuth()
  const role = user?.role

  return useMemo(() => {
    const perms = getFinancePermissionsForRole(role)
    const can = (p) => roleHasFullAccess(role) || roleHasFinancePerm(role, p)
    return {
      role,
      canView: can(FINANCE_PERMS.VIEW) || roleHasFullAccess(role),
      canEdit: can(FINANCE_PERMS.EDIT_PAYMENTS),
      canApprove: can(FINANCE_PERMS.APPROVE),
      canVerify: can(FINANCE_PERMS.VERIFY) || can(FINANCE_PERMS.APPROVE),
      canFinanceHeadApprove: can(FINANCE_PERMS.HEAD_APPROVE) || roleHasFullAccess(role),
      canExport: can(FINANCE_PERMS.EXPORT),
      canManageEmi: can(FINANCE_PERMS.MANAGE_EMI),
      canManageGst: can(FINANCE_PERMS.MANAGE_GST),
      canReceipts: can(FINANCE_PERMS.RECEIPTS),
      permissions: perms,
    }
  }, [role])
}
