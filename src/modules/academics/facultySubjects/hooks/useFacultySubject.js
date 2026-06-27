import { useQuery } from '@tanstack/react-query'
import { getFacultySubjectById } from '../services/facultySubjects.api'
import { mapApiFacultySubjectToFormRow } from '../../../../utils/facultySubjectHelpers'
import { facultySubjectKeys } from '../../../../hooks/queryKeys'

/**
 * @param {string | undefined} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFacultySubject(id, options = {}) {
  const enabled = Boolean(id) && (options.enabled ?? true)

  return useQuery({
    queryKey: facultySubjectKeys.detail(id),
    queryFn: ({ signal }) =>
      getFacultySubjectById(id, { signal }).then((data) => {
        const row = mapApiFacultySubjectToFormRow(data)
        if (!row) {
          throw Object.assign(new Error('Faculty subject not found'), { status: 404 })
        }
        return row
      }),
    enabled,
    staleTime: 30_000,
    ...options,
  })
}
