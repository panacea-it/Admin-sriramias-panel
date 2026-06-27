import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateCurrentAffair,
  updateDailyPracticePaper,
} from '../services/currentAffairsService'
import { currentAffairsKeys } from './queryKeys'

export function useUpdateCurrentAffair() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }) => updateCurrentAffair(id, formData),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.all })
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.detail(id) })
    },
  })
}

export function useUpdateDailyPractice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateDailyPracticePaper(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.all })
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.questions(id) })
    },
  })
}
