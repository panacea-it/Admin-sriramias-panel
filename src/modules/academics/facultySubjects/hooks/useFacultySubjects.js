import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getFacultySubjects } from '../services/facultySubjects.api'
import { normalizeFacultySubjectsListResponse } from '../../../../utils/facultySubjectHelpers'
import { facultySubjectKeys } from '../../../../hooks/queryKeys'

/**
 * @param {import('../../../../utils/facultySubjectHelpers').FacultySubjectListParams} params
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFacultySubjects(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: facultySubjectKeys.list(params),
    queryFn: ({ signal }) =>
      getFacultySubjects(params, { signal }).then((data) =>
        normalizeFacultySubjectsListResponse(data, { page, limit }),
      ),
    placeholderData: keepPreviousData,
    ...options,
  })
}
