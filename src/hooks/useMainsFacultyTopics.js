import { useEffect } from 'react'
import { useMainsFacultySubject } from './useMainsManagement'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'

export function useMainsFacultyTopics(facultySubjectId) {
  const { data, isLoading, error, refetch } = useMainsFacultySubject(facultySubjectId)

  useEffect(() => {
    if (error) {
      console.error('[MainsManagement]', error)
      toast.error(getApiErrorMessage(error, 'Failed to load faculty subject'))
    }
  }, [error])

  return {
    faculty: data?.faculty ?? null,
    topics: data?.topics ?? [],
    loading: isLoading,
    loadError: error ? getApiErrorMessage(error, 'Failed to load faculty subject') : null,
    refresh: refetch,
  }
}
