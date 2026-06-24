import { useMutation, useQueryClient } from '@tanstack/react-query'
import cbtTestService from '../services/cbtTestService'
import { cbtTestKeys } from './cbtTestKeys'

export function useUpdateCBTTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => cbtTestService.updateTest(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() })
    },
  })
}
