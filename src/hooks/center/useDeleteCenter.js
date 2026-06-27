import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  clearCentersDropdownCache,
  deleteCenter,
} from '../../services/centerService'
import { clearCentersDropdownOptionsCache } from '../useCentersDropdownOptions'
import { centerKeys } from './centerKeys'

export function useDeleteCenter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteCenter(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: centerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() })
      clearCentersDropdownCache()
      clearCentersDropdownOptionsCache()
    },
  })
}
