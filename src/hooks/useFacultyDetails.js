import { useQuery } from '@tanstack/react-query'
import { facultyService } from '../services/facultyService'
import { facultyKeys } from './queryKeys'

/**
 * @param {string | undefined} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFacultyDetails(id, options = {}) {
  return useQuery({
    queryKey: facultyKeys.detail(id ?? ''),
    queryFn: () => facultyService.getFacultyById(id),
    enabled: Boolean(id),
    ...options,
  })
}

export default useFacultyDetails
