import { useQuery } from '@tanstack/react-query'
import { getCourses } from '../../services/courseService'
import {
  buildCourseListParams,
  normalizeCoursesListResponse,
} from '../../utils/courseApiHelpers'
import { courseKeys } from './courseKeys'

export function useCoursesQuery(filters = {}, options = {}) {
  const params = buildCourseListParams(filters)

  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const data = await getCourses(params)
      return normalizeCoursesListResponse(data, {
        page: params.page,
        limit: params.limit,
      })
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  })
}

/** @alias useCoursesQuery */
export const useCourses = useCoursesQuery
