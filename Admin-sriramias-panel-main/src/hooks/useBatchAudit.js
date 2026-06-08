import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { appendBatchAuditEntry } from '../utils/batchAuditStorage'

export function useBatchAudit() {
  const { user } = useAuth()

  const adminName = user?.name || user?.email || 'Admin User'

  const logBatchActivity = useCallback(
    (batchId, { type, message, meta }) => {
      if (!batchId) return
      appendBatchAuditEntry(batchId, {
        type,
        message,
        meta,
        adminName,
      })
    },
    [adminName],
  )

  return { logBatchActivity, adminName }
}
