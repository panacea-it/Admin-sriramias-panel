import { useCallback, useEffect, useState } from 'react'
import { fetchCbtTopics } from '../api/cbtManagementAPI'
import {
  getCbtFacultyBySubjectId,
  getCbtTopics,
} from '../utils/cbtTestSeriesHierarchy'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'

const TOPIC_LIMIT = 100

const localTopics = (subjectId) =>
  getCbtTopics(getCbtFacultyBySubjectId(subjectId))

export function useCbtFacultyTopics(subjectId) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const refresh = useCallback(
    async (signal) => {
      if (!subjectId) {
        setTopics([])
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadError(null)

      if (isFrontendOnly) {
        setTopics(localTopics(subjectId))
        setLoading(false)
        return
      }

      try {
        const rows = await fetchCbtTopics(
          { facultySubjectId: subjectId, limit: TOPIC_LIMIT },
          signal,
        )
        setTopics(rows)
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        const message = getApiErrorMessage(error, 'Failed to load CBT topics')
        setLoadError(message)
        toast.error(message)
        setTopics(localTopics(subjectId))
      } finally {
        setLoading(false)
      }
    },
    [subjectId],
  )

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])

  return { topics, loading, loadError, refresh }
}
