import { useQuery } from '@tanstack/react-query'
import { getCenterById, normalizeCenterDetailsResponse } from '../../services/centerService'
import { centerKeys } from './centerKeys'

export function useCenter(id, enabled = true) {
  return useQuery({
    queryKey: centerKeys.detail(id),
    queryFn: async () => {
      const data = await getCenterById(id)
      return normalizeCenterDetailsResponse(data)
    },
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
  })
}
