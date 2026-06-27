import { useMutation, useQueryClient } from '@tanstack/react-query'
import cbtTestService from '../services/cbtTestService'
import { cbtTestKeys } from './cbtTestKeys'

export function useDeleteCBTTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => cbtTestService.deleteTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() })
    },
  })
}
