import { useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { normalizeUserDetailResponse } from '../../utils/userHelpers'
import { userKeys } from './userKeys'

export function useUser(id, type, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(id, type),
    queryFn: async () => {
      const data = await userService.getUserById(id, type)
      return normalizeUserDetailResponse(data)
    },
    enabled: Boolean(id) && enabled,
    staleTime: 0,
  })
}
