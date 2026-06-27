import { useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { normalizeCenterFormDropdown } from '../../utils/userHelpers'
import { userKeys } from './userKeys'

export function useUserCenterFormDropdown(options = {}) {
  return useQuery({
    queryKey: userKeys.centerForm(),
    queryFn: async () => {
      const data = await userService.getCenterFormDropdown()
      return normalizeCenterFormDropdown(data)
    },
    staleTime: 5 * 60_000,
    enabled: options.enabled !== false,
    ...options,
  })
}
