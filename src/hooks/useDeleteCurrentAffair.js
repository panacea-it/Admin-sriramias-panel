import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deleteCurrentAffair,
  deleteDailyPractice,
} from '../services/currentAffairsService'
import { isDailyPracticeCategory } from '../constants/currentAffairsForm'
import { currentAffairsKeys } from './queryKeys'

export function useDeleteCurrentAffair() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, category }) => {
      if (isDailyPracticeCategory(category)) {
        return deleteDailyPractice(id)
      }
      return deleteCurrentAffair(id)
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.all })
      queryClient.removeQueries({ queryKey: currentAffairsKeys.detail(id) })
    },
  })
}
