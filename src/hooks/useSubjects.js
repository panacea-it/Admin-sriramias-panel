import { useQuery } from '@tanstack/react-query'
import { subjectService } from '../services/subjectService'
import { normalizeSubjectsListResponse } from '../pages/academics/categories/subject/subjectHelpers'
import { subjectKeys } from './queryKeys'

/**
 * @param {import('../types/subject.types').SubjectListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useSubjects(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: subjectKeys.list(params),
    queryFn: async () => {
      const data = await subjectService.getSubjects(params)
      return normalizeSubjectsListResponse(data, { page, limit })
    },
    ...options,
  })
}
