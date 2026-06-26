import { useQuery } from '@tanstack/react-query'
import roleAccessService from '../../services/roleAccessService'
import { mapRoleRecordToRow, unwrapRoleDetail } from '../../utils/roleAccessHelpers'
import { roleAccessKeys } from './roleAccessKeys'

export function useRoleAccess(id, options = {}) {
  return useQuery({
    queryKey: roleAccessKeys.detail(id),
    queryFn: async () => {
      const data = await roleAccessService.getRoleAccessById(id)
      return mapRoleRecordToRow(unwrapRoleDetail(data))
    },
    enabled: Boolean(id),
    ...options,
  })
}
