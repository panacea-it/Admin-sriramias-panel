import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchPaymentAttemptLogs } from '../api/financeAPI'
import { buildPaymentAttemptDummyLogs } from '../data/paymentAttemptDummyData'
import {
  buildCounselorRemarkRecord,
  getRemarkForAttempt,
  isCounselorAssigned,
  removeCounselorRemark,
  sortRemarksByDateDesc,
  upsertCounselorRemark,
} from '../utils/paymentAttemptRemarks'
import { toast } from '../utils/toast'

const PaymentAttemptLogsContext = createContext(null)

export function PaymentAttemptLogsProvider({ children }) {
  const [logs, setLogs] = useState([])
  const [counselorRemarks, setCounselorRemarks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPaymentAttemptLogs()
      const rows = Array.isArray(data) ? data : data?.logs ?? buildPaymentAttemptDummyLogs()
      setLogs(
        rows.map((log) => ({
          ...log,
          center: log.center || log.centerName?.replace(' Center', '') || 'Delhi',
          centerName: log.centerName || `${log.center || 'Delhi'} Center`,
          counselorId: log.counselorId ?? null,
          counselorName: log.counselorName ?? null,
        })),
      )
    } catch {
      setLogs(buildPaymentAttemptDummyLogs())
      toast.error('Failed to load payment attempt logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const assignCounselor = useCallback(({ attemptId, counselorId, counselorName }) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === attemptId ? { ...log, counselorId, counselorName } : log,
      ),
    )
    toast.success('Counselor assigned')
  }, [])

  const saveRemark = useCallback((attemptRow, { subject, failureAnalysis, remark }) => {
    const record = buildCounselorRemarkRecord({
      attemptRow,
      subject,
      failureAnalysis,
      remark,
    })
    setCounselorRemarks((prev) => upsertCounselorRemark(prev, record))
    toast.success('Remark saved')
  }, [])

  const deleteRemark = useCallback((remarkId) => {
    setCounselorRemarks((prev) => removeCounselorRemark(prev, remarkId))
    toast.success('Remark deleted')
  }, [])

  const pendingAssignedLogs = useMemo(
    () =>
      logs.filter(
        (log) => isCounselorAssigned(log) && !getRemarkForAttempt(counselorRemarks, log.id),
      ),
    [logs, counselorRemarks],
  )

  const sortedRemarks = useMemo(
    () => sortRemarksByDateDesc(counselorRemarks),
    [counselorRemarks],
  )

  const value = useMemo(
    () => ({
      logs,
      counselorRemarks,
      sortedRemarks,
      pendingAssignedLogs,
      loading,
      reload: load,
      assignCounselor,
      saveRemark,
      deleteRemark,
      getRemarkForAttempt: (attemptRowId) => getRemarkForAttempt(counselorRemarks, attemptRowId),
    }),
    [
      logs,
      counselorRemarks,
      sortedRemarks,
      pendingAssignedLogs,
      loading,
      load,
      assignCounselor,
      saveRemark,
      deleteRemark,
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
