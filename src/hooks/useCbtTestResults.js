import { useCallback, useEffect, useState } from 'react'
import { fetchCbtResults, fetchCbtAnalytics } from '../api/cbtManagementAPI'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'

const RESULTS_LIMIT = 100

const EMPTY = {
  rows: [],
  test: null,
  totalStudents: 0,
  attempted: 0,
  analytics: null,
}

export function useCbtTestResults(testId) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const refresh = useCallback(
    async (signal) => {
      if (!testId) {
        setData(EMPTY)
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadError(null)

      if (isFrontendOnly) {
        setData(EMPTY)
        setLoading(false)
        return
      }

      try {
        const [results, analytics] = await Promise.all([
          fetchCbtResults({ testId, limit: RESULTS_LIMIT }, signal),
          fetchCbtAnalytics({ testId }, signal),
        ])
        setData({ ...results, analytics })
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        const message = getApiErrorMessage(error, 'Failed to load test results')
        setLoadError(message)
        toast.error(message)
        setData(EMPTY)
      } finally {
        setLoading(false)
      }
    },
    [testId],
  )

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])

  return { ...data, loading, loadError, refresh }
}
