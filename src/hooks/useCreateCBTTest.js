import { useMutation, useQueryClient } from '@tanstack/react-query'
import cbtTestService from '../services/cbtTestService'
import { cbtTestKeys } from './cbtTestKeys'

export function useCreateCBTTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData) => cbtTestService.createTest(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.all })
    },
  })
}
