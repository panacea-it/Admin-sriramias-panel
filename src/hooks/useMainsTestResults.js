import { useEffect } from 'react'
import { useMainsTestResultsQuery } from './useMainsManagement'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_LIMIT = 100

const EMPTY = { test: null, summary: null, rows: [] }

export function useMainsTestResults(testId) {
  const { data, isLoading, isFetching, error, refetch } = useMainsTestResultsQuery(testId, {
    page: 1,
    limit: DEFAULT_LIMIT,
    status: 'all',
  })

  useEffect(() => {
    if (error) {
      console.error('[MainsManagement]', error)
      toast.error(getApiErrorMessage(error, 'Failed to load evaluation results'))
    }
  }, [error])

  const result = data ?? EMPTY

  return {
    test: result.test,
    summary: result.summary,
    rows: result.rows,
    loading: isLoading || (isFetching && !data),
    loadError: error ? getApiErrorMessage(error, 'Failed to load evaluation results') : null,
    refresh: refetch,
  }
}
