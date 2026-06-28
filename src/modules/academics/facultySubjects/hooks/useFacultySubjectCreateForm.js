import { useQuery } from '@tanstack/react-query'
import { getFacultySubjectCreateForm } from '../services/facultySubjects.api'
import { normalizeFacultySubjectCreateFormResponse } from '../../../utils/facultySubjectHelpers'
import { facultySubjectKeys } from '../../../hooks/queryKeys'

/**
 * GET /api/faculty-subjects/create-form — step 1 (subjects) or step 2 (+ topics/teachers)
 * @param {string | undefined} subjectId
 * @param {string | undefined} centerId
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFacultySubjectCreateForm(subjectId, centerId, options = {}) {
  return useQuery({
    queryKey: facultySubjectKeys.createForm(subjectId, centerId),
    queryFn: ({ signal }) => {
      const params = {}
      if (subjectId) params.subjectId = subjectId
      if (centerId) params.centerId = centerId
      return getFacultySubjectCreateForm(params, { signal }).then((data) =>
        normalizeFacultySubjectCreateFormResponse(data),
      )
    },
    staleTime: 60_000,
    ...options,
  })
}
