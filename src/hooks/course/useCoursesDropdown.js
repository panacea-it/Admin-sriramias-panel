import { useQuery } from '@tanstack/react-query'
import { getCoursesDropdown } from '../../services/courseService'
import { normalizeCoursesDropdownResponse } from '../../utils/courseApiHelpers'
import { courseKeys } from './courseKeys'

export function useCoursesDropdown(params = {}, options = {}) {
  const queryParams = { status: 'ACTIVE', limit: 100, ...params }

  return useQuery({
    queryKey: courseKeys.dropdown(queryParams),
    queryFn: async () => {
      const data = await getCoursesDropdown(queryParams)
      return normalizeCoursesDropdownResponse(data)
    },
    staleTime: 30_000,
    ...options,
  })
}
