import { useQuery } from '@tanstack/react-query'
import { facultyService } from '../services/facultyService'
import { facultyKeys } from './queryKeys'

/**
 * @param {import('../types/faculty.types').FacultyDropdownParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFacultyDropdown(params, options = {}) {
  return useQuery({
    queryKey: facultyKeys.dropdown(params),
    queryFn: () => facultyService.getFacultyDropdown(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export default useFacultyDropdown
