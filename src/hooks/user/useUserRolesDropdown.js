import { useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { normalizeRoleDropdownOptions } from '../../utils/userHelpers'
import { userKeys } from './userKeys'

export function useUserRolesDropdown(options = {}) {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: async () => {
      const data = await userService.getRoleDropdown()
      return normalizeRoleDropdownOptions(data)
    },
    staleTime: 5 * 60_000,
    ...options,
  })
}
