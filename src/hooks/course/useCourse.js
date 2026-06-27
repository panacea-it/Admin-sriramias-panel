import { useQuery } from '@tanstack/react-query'
import { getCourse } from '../../services/courseService'
import { mapApiCourseToLocal } from '../../utils/courseApiHelpers'
import { courseKeys } from './courseKeys'

export function useCourse(id, options = {}) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      const data = await getCourse(id)
      return mapApiCourseToLocal(data)
    },
    enabled: Boolean(id) && (options.enabled ?? true),
    staleTime: 60_000,
    ...options,
  })
}
