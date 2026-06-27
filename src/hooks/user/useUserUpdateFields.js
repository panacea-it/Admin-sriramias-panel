import { useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { userKeys } from './userKeys'

export function useUserUpdateFields(type = 'USER', enabled = true) {
  return useQuery({
    queryKey: userKeys.updateFields(type),
    queryFn: () => userService.getUpdateFields(type),
    enabled: Boolean(type) && enabled,
    staleTime: 5 * 60_000,
  })
}
