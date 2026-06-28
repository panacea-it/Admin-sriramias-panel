import { useEffect } from 'react'
import { useMainsTopicTestsQuery } from './useMainsManagement'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_LIMIT = 100

export function useMainsTopicTests(topicId) {
  const { data, isLoading, isFetching, error, refetch } = useMainsTopicTestsQuery(topicId, {
    page: 1,
    limit: DEFAULT_LIMIT,
  })

  useEffect(() => {
    if (error) {
      console.error('[MainsManagement]', error)
      toast.error(getApiErrorMessage(error, 'Failed to load topic tests'))
    }
  }, [error])

  return {
    tests: data?.items ?? [],
    topic: data?.topic ?? null,
    loading: isLoading || (isFetching && !data),
    loadError: error ? getApiErrorMessage(error, 'Failed to load topic tests') : null,
    refresh: refetch,
  }
}
