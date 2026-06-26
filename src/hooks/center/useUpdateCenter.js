import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  clearCentersDropdownCache,
  normalizeCenterDetailsResponse,
  updateCenter,
} from '../../services/centerService'
import { clearCentersDropdownOptionsCache } from '../useCentersDropdownOptions'
import { centerKeys } from './centerKeys'

export function useUpdateCenter(id) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => updateCenter(id, payload),
    onSuccess: (response) => {
      const normalized = normalizeCenterDetailsResponse(response)
      if (normalized) {
        queryClient.setQueryData(centerKeys.detail(id), normalized)
      }
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: centerKeys.dropdown() })
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(id) })
      clearCentersDropdownCache()
      clearCentersDropdownOptionsCache()
    },
  })
}
