import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  clearCentersDropdownCache,
  updateCenterStatus,
} from '../../services/centerService'
import { clearCentersDropdownOptionsCache } from '../useCentersDropdownOptions'
import { centerKeys } from './centerKeys'

export function useUpdateCenterStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateCenterStatus(id, status),
    onSuccess: (_response, { id }) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() })
      clearCentersDropdownCache()
      clearCentersDropdownOptionsCache()
    },
  })
}
