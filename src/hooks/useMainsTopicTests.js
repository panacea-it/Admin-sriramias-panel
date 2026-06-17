import { useCallback, useEffect, useState } from 'react'
import { fetchMainsTopicTests } from '../api/mainsManagementAPI'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'

const TEST_LIMIT = 100

export function useMainsTopicTests(topicId) {
  const [tests, setTests] = useState([])
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const refresh = useCallback(
    async (signal) => {
      if (!topicId) {
        setTests([])
        setTopic(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadError(null)

      try {
        const { tests: rows, topic: header } = await fetchMainsTopicTests(
          { topicId, limit: TEST_LIMIT },
          signal,
        )
        setTests(rows)
        setTopic(header)
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        const message = getApiErrorMessage(error, 'Failed to load topic tests')
        setLoadError(message)
        toast.error(message)
        setTests([])
        setTopic(null)
      } finally {
        setLoading(false)
      }
    },
    [topicId],
  )

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])

  return { tests, topic, loading, loadError, refresh }
}
