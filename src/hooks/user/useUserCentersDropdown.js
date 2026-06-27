import { useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { normalizeCenterFilterOptions } from '../../utils/userHelpers'
import { userKeys } from './userKeys'

export function useUserCentersDropdown(options = {}) {
  return useQuery({
    queryKey: userKeys.centers(),
    queryFn: async () => {
      const data = await userService.getCenterDropdown()
      return normalizeCenterFilterOptions(data)
    },
    staleTime: 5 * 60_000,
    ...options,
  })
}
