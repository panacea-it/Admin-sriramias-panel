import { useQuery } from '@tanstack/react-query'
import cbtTestService from '../services/cbtTestService'
import { normalizeCbtTestsListResponse } from '../utils/cbtTestFormHelpers'
import { cbtTestKeys } from './cbtTestKeys'

export function useCBTTests(filters = {}, options = {}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10

  return useQuery({
    queryKey: cbtTestKeys.list(filters),
    queryFn: async () => {
      const data = await cbtTestService.getTests(filters)
      return normalizeCbtTestsListResponse(data, { page, limit })
    },
    placeholderData: (prev) => prev,
    ...options,
  })
}
