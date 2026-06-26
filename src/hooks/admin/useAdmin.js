import { useQuery } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { mapApiAdminToRow, unwrapAdminRecord } from '../../utils/adminManagementHelpers'
import { adminKeys } from './adminKeys'

export function useAdmin(id, options = {}) {
  return useQuery({
    queryKey: adminKeys.detail(id),
    queryFn: async () => {
      const data = await adminManagementService.getAdminById(id)
      return mapApiAdminToRow(unwrapAdminRecord(data))
    },
    enabled: Boolean(id),
    ...options,
  })
}
