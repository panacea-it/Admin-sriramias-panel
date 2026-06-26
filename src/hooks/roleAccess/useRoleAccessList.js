import { useQuery } from '@tanstack/react-query'
import roleAccessService from '../../services/roleAccessService'
import { normalizeRoleListResponse } from '../../utils/roleAccessHelpers'
import { roleAccessKeys } from './roleAccessKeys'

export function useRoleAccessList(params = {}, options = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: roleAccessKeys.list(params),
    queryFn: async () => {
      const data = await roleAccessService.getRoleAccessList(params)
      return normalizeRoleListResponse(data, { page, limit })
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    ...options,
  })
}
