import { useQuery } from '@tanstack/react-query'
import roleAccessService from '../../services/roleAccessService'
import { mapRolesDropdownResponse } from '../../utils/roleAccessHelpers'
import { roleAccessKeys } from './roleAccessKeys'

export function useRoleAccessDropdown(options = {}) {
  return useQuery({
    queryKey: roleAccessKeys.dropdown(),
    queryFn: async () => {
      const data = await roleAccessService.getRoleDropdown()
      return mapRolesDropdownResponse(data)
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
