import { useQuery } from '@tanstack/react-query'
import { facultyService } from '../services/facultyService'
import { normalizeTeachersListResponse } from '../pages/academics/categories/teachers/teacherHelpers'
import { facultyKeys } from './queryKeys'

/**
 * @param {import('../types/faculty.types').FacultyListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFaculty(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: facultyKeys.list(params),
    queryFn: async () => {
      const data = await facultyService.getFacultyList(params)
      return normalizeTeachersListResponse(data, { page, limit })
    },
    ...options,
  })
}

export default useFaculty
