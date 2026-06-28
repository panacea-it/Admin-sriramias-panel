import { useQuery } from '@tanstack/react-query'
import { getFacultySubjectCategories } from '../services/facultySubjects.api'
import { facultySubjectKeys } from '../../../../hooks/queryKeys'

/**
 * GET /api/faculty-subjects/categories — delivery category options (cache aggressively).
 */
export function useFacultySubjectCategories(options = {}) {
  return useQuery({
    queryKey: facultySubjectKeys.categories(),
    queryFn: ({ signal }) => getFacultySubjectCategories({ signal }),
    staleTime: Infinity,
    ...options,
  })
}
