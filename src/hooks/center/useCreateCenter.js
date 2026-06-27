import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  clearCentersDropdownCache,
  createCenter,
} from '../../services/centerService'
import { clearCentersDropdownOptionsCache } from '../useCentersDropdownOptions'
import { centerKeys } from './centerKeys'

export function useCreateCenter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createCenter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() })
      clearCentersDropdownCache()
      clearCentersDropdownOptionsCache()
    },
  })
}
