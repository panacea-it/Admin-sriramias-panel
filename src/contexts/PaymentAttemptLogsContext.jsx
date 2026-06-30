import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchPaymentAttemptFilterOptions,
  assignPaymentAttemptCounselor,
  addPaymentAttemptRemark,
  deletePaymentAttemptRemark,
} from '../api/paymentAttemptLogsAPI'
import { toast } from '../utils/toast'
import { usePermissions } from '../hooks/usePermissions'
import { ROLES } from '../constants/roles'

const PaymentAttemptLogsContext = createContext(null)

export function PaymentAttemptLogsProvider({ children }) {
  const { isSuperAdmin, hasRole } = usePermissions()
  const [filterOptions, setFilterOptions] = useState(null)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [refreshToken, setRefreshToken] = useState(0)

  const isFinanceAdmin = isSuperAdmin || hasRole(ROLES.OPERATION_ADMIN)
  const isCounselor = hasRole(ROLES.COUNSELING_ADMIN)
  const canAssignCounselor = isFinanceAdmin
  const canAddRemark = isFinanceAdmin || isCounselor
  const canDeleteRemark = isSuperAdmin

  const loadFilterOptions = useCallback(async () => {
    setOptionsLoading(true)
    try {
      const data = await fetchPaymentAttemptFilterOptions()
      setFilterOptions(data)
    } catch (error) {
      toast.error(error.message || 'Failed to load filter options')
      setFilterOptions(null)
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions, refreshToken])

  const bumpRefresh = useCallback(() => {
    setRefreshToken((t) => t + 1)
  }, [])

  const assignCounselor = useCallback(
    async ({ attemptId, counselorId }) => {
      try {
        await assignPaymentAttemptCounselor({ attemptId, counselorId })
        toast.success('Counselor assigned successfully')
        bumpRefresh()
        return true
      } catch (error) {
        if (error.status === 403) {
          toast.error('You do not have permission to assign counselors')
        } else {
          toast.error(error.message || 'Failed to assign counselor')
        }
        return false
      }
    },
    [bumpRefresh],
  )

  const saveRemark = useCallback(
    async (attemptRow, { subject, failureAnalysis, remark }) => {
      const attemptId = attemptRow?.attemptId || attemptRow?.id
      if (!attemptId) return false
      try {
        await addPaymentAttemptRemark({
          attemptId,
          remarkSubject: subject,
          failureAnalysis,
          counselorRemark: remark,
        })
        toast.success('Remark saved successfully')
        bumpRefresh()
        return true
      } catch (error) {
        if (error.status === 403) {
          toast.error('You do not have permission to add remarks')
        } else {
          toast.error(error.message || 'Failed to save remark')
        }
        return false
      }
    },
    [bumpRefresh],
  )

  const deleteRemark = useCallback(
    async (remarkId) => {
      if (!canDeleteRemark) {
        toast.error('You do not have permission to delete remarks')
        return false
      }
      try {
        await deletePaymentAttemptRemark(remarkId)
        toast.success('Remark deleted successfully')
        bumpRefresh()
        return true
      } catch (error) {
        toast.error(error.message || 'Failed to delete remark')
        return false
      }
    },
    [bumpRefresh, canDeleteRemark],
  )

  const value = useMemo(
    () => ({
      filterOptions,
      optionsLoading,
      refreshToken,
      bumpRefresh,
      assignCounselor,
      saveRemark,
      deleteRemark,
      canAssignCounselor,
      canAddRemark,
      canDeleteRemark,
      isFinanceAdmin,
      isCounselor,
    }),
    [
      filterOptions,
      optionsLoading,
      refreshToken,
      bumpRefresh,
      assignCounselor,
      saveRemark,
      deleteRemark,
      canAssignCounselor,
      canAddRemark,
      canDeleteRemark,
      isFinanceAdmin,
      isCounselor,
    ],
  )

  return (
    <PaymentAttemptLogsContext.Provider value={value}>
      {children}
    </PaymentAttemptLogsContext.Provider>
  )
}

export function usePaymentAttemptLogs() {
  const ctx = useContext(PaymentAttemptLogsContext)
  if (!ctx) {
    throw new Error('usePaymentAttemptLogs must be used within PaymentAttemptLogsProvider')
  }
  return ctx
}
