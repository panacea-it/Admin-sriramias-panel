import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCurrentAffair,
  createDailyPractice,
  createDailyPracticeBulk,
} from '../services/currentAffairsService'
import { currentAffairsKeys } from './queryKeys'

export function useCreateCurrentAffair() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCurrentAffair,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.all })
    },
  })
}

export function useCreateDailyPractice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => {
      if (payload instanceof FormData) {
        return createDailyPracticeBulk(payload)
      }
      return createDailyPractice(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentAffairsKeys.all })
    },
  })
}
