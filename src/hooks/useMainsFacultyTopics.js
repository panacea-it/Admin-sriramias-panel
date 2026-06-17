import { useCallback, useEffect, useState } from 'react'
import { fetchMainsFacultyDetails } from '../api/mainsManagementAPI'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'

export function useMainsFacultyTopics(subjectId) {
  const [faculty, setFaculty] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const refresh = useCallback(
    async (signal) => {
      if (!subjectId) {
        setFaculty(null)
        setTopics([])
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadError(null)

      try {
        const { faculty: header, topics: rows } = await fetchMainsFacultyDetails(subjectId, signal)
        setFaculty(header)
        setTopics(rows)
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        const message = getApiErrorMessage(error, 'Failed to load faculty subject')
        setLoadError(message)
        toast.error(message)
        setFaculty(null)
        setTopics([])
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

  return { faculty, topics, loading, loadError, refresh }
}
