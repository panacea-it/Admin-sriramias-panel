import { useQuery } from '@tanstack/react-query'
import { getCurrentAffairs } from '../services/currentAffairsService'
import { normalizeCurrentAffairsListResponse } from '../utils/currentAffairsApiHelpers'
import { currentAffairsKeys } from './queryKeys'

/**
 * @param {import('../services/currentAffairsService').CurrentAffairListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useCurrentAffairs(params = {}, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: currentAffairsKeys.list(params),
    queryFn: async () => {
      const data = await getCurrentAffairs({ ...params, page, limit })
      return normalizeCurrentAffairsListResponse(data, { page, limit })
    },
    ...options,
  })
}
