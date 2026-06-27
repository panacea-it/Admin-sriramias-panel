import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectService } from '../services/subjectService'
import { subjectKeys } from './queryKeys'

export function useCreateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => subjectService.createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}
