import { useQuery } from '@tanstack/react-query'
import { subjectService } from '../services/subjectService'
import { subjectKeys } from './queryKeys'

/**
 * @param {string | undefined} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useSubject(id, options = {}) {
  return useQuery({
    queryKey: subjectKeys.detail(id ?? ''),
    queryFn: () => subjectService.getSubjectById(id),
    enabled: Boolean(id),
    ...options,
  })
}
