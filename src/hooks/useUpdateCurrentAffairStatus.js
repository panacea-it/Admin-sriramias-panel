import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCurrentAffairStatus } from '../services/currentAffairsService'
import { currentAffairsKeys } from './queryKeys'

export function useUpdateCurrentAffairStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateCurrentAffairStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.all })
    },
  })
}
