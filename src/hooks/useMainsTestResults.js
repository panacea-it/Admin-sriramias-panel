import { useCallback, useEffect, useState } from 'react'
import { fetchMainsTestResults } from '../api/mainsManagementAPI'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'

const RESULTS_LIMIT = 100

const EMPTY = { test: null, summary: null, rows: [] }

export function useMainsTestResults(testId) {
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

      try {
        const result = await fetchMainsTestResults({ testId, limit: RESULTS_LIMIT }, signal)
        setData(result)
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        const message = getApiErrorMessage(error, 'Failed to load evaluation results')
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
