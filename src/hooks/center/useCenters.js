import { useQuery } from '@tanstack/react-query'
import { getCenters, normalizeCentersListResponse } from '../../services/centerService'
import { centerKeys } from './centerKeys'

export function useCenters(params = {}, options = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: centerKeys.list(params),
    queryFn: async () => {
      const data = await getCenters(params)
      return normalizeCentersListResponse(data, { page, limit })
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    ...options,
  })
}
