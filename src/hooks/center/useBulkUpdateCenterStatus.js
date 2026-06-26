import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bulkUpdateCenterStatus,
  clearCentersDropdownCache,
} from '../../services/centerService'
import { clearCentersDropdownOptionsCache } from '../useCentersDropdownOptions'
import { centerKeys } from './centerKeys'

export function useBulkUpdateCenterStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => bulkUpdateCenterStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: centerKeys.details() })
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() })
      clearCentersDropdownCache()
      clearCentersDropdownOptionsCache()
    },
  })
}
