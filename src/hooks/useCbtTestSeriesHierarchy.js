import { useCallback, useEffect, useState } from 'react'
import { fetchCbtDashboard, fetchCbtFacultySubjects } from '../api/cbtManagementAPI'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'

const PROGRESS_LIMIT = 3
const LIST_LIMIT = 100

export function useCbtTestSeriesHierarchy() {
  const [mappingRows, setMappingRows] = useState([])
  const [latestEvaluations, setLatestEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const refresh = useCallback(async (signal) => {
    setLoading(true)
    setLoadError(null)

    try {
      const [cards, rows] = await Promise.all([
        fetchCbtDashboard({ progressLimit: PROGRESS_LIMIT }, signal),
        fetchCbtFacultySubjects({ limit: LIST_LIMIT }, signal),
      ])
      setLatestEvaluations(cards)
      setMappingRows(rows)
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      const message = getApiErrorMessage(error, 'Failed to load CBT management data')
      setLoadError(message)
      toast.error(message)
      setLatestEvaluations([])
      setMappingRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)

    const onUpdate = () => refresh()
    window.addEventListener('faculty-subject-content-updated', onUpdate)
    window.addEventListener('academics-subjects-updated', onUpdate)
    return () => {
      controller.abort()
      window.removeEventListener('faculty-subject-content-updated', onUpdate)
      window.removeEventListener('academics-subjects-updated', onUpdate)
    }
  }, [refresh])

  return { mappingRows, latestEvaluations, loading, loadError, refresh }
}
