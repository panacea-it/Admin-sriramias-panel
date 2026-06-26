import { useQuery } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { normalizeAdminListResponse } from '../../utils/adminManagementHelpers'
import { adminKeys } from './adminKeys'

export function useAdmins(params = {}, options = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: adminKeys.list(params),
    queryFn: async () => {
      const data = await adminManagementService.getAdmins(params)
      return normalizeAdminListResponse(data, { page, limit })
    },
    placeholderData: (prev) => prev,
    ...options,
  })
}
