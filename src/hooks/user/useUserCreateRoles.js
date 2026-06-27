import { useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { normalizeCreateRoleOptions } from '../../utils/userHelpers'
import { userKeys } from './userKeys'

export function useUserCreateRoles(options = {}) {
  return useQuery({
    queryKey: userKeys.createRoles(),
    queryFn: async () => {
      const data = await userService.getCreateRoleDropdown()
      return normalizeCreateRoleOptions(data)
    },
    staleTime: 5 * 60_000,
    enabled: options.enabled !== false,
    ...options,
  })
}
