import { useMutation, useQueryClient } from '@tanstack/react-query'
import cbtTestService from '../services/cbtTestService'
import { cbtTestKeys } from './cbtTestKeys'

export function usePublishCBTTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, publishStatus }) => cbtTestService.publishTest(id, publishStatus),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() })
    },
  })
}

export function useDuplicateCBTTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, testName }) => cbtTestService.duplicateTest(id, testName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() })
    },
  })
}
