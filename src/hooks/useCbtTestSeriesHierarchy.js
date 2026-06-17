import { useCallback, useEffect, useState } from 'react'
import {
  buildCbtMappingRows,
  buildLatestCbtEvaluationCards,
} from '../utils/cbtTestSeriesHierarchy'
import { fetchCbtDashboard, fetchCbtFacultySubjects } from '../api/cbtManagementAPI'
import { isFrontendOnly } from '../config/appMode'
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

    if (isFrontendOnly) {
      setMappingRows(buildCbtMappingRows())
      setLatestEvaluations(buildLatestCbtEvaluationCards(PROGRESS_LIMIT))
      setLoading(false)
      return
    }

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
      setLatestEvaluations(buildLatestCbtEvaluationCards(PROGRESS_LIMIT))
      setMappingRows(buildCbtMappingRows())
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
