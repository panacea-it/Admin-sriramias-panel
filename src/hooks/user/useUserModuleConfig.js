import { useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { normalizeModuleConfig } from '../../utils/userHelpers'
import { userKeys } from './userKeys'

export function useUserModuleConfig(options = {}) {
  return useQuery({
    queryKey: userKeys.moduleConfig(),
    queryFn: async () => {
      const data = await userService.getModuleConfig()
      return normalizeModuleConfig(data)
    },
    staleTime: 10 * 60_000,
    ...options,
  })
}
